"""
Authentication utilities - Updated to be exclusively Privy-based
Optimized for ScruPeak Digital Property
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID
import jwt
import logging
import uuid as uuid_pkg
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer
from typing import Any

from app.core.config import get_settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, UserRole
from app.utils.privy_auth import verify_privy_token


# ============================================================================
# PASSWORD HASHING (Kept for internal use if needed, but primary auth is Privy)
# ============================================================================

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# JWT TOKEN GENERATION (Mostly for internal service-to-service if required)
# ============================================================================

class JWTHandler:
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
    
    def decode_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(
                token,
                self.settings.SECRET_KEY,
                algorithms=[self.settings.ALGORITHM]
            )
            return payload
        except Exception:
            return None


# ============================================================================
# DEPENDENCY INJECTION (Privy-Centric)
# ============================================================================

logger = logging.getLogger(__name__)
security = HTTPBearer()
jwt_handler = JWTHandler()


async def get_current_user(
    credentials: Any = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from Privy JWT token
    """
    # Verify via Privy
    try:
        payload = await verify_privy_token(credentials)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Privy verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ScruPeak uses email as the primary stable identifier for Privy users
    email = payload.get("email")
    if not email:
        # Fallback to lookup by privy_id if we add that column,
        # or use sub as a string if it's a UUID (unlikely for did:privy)
        pass

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if user is None:
        # Just-In-Time Provisioning for ScruPeak users
        try:
            name = payload.get("name") or email.split('@')[0] if email else "New ScruPeak User"
            
            from app.models import UserStatus
            from app.core.config import get_settings
            settings = get_settings()
            # Check if this is the admin email (Case-insensitive)
            is_admin = email and email.lower() == settings.SUPER_ADMIN_EMAIL.lower()
            admin_role = UserRole.ADMIN if is_admin else UserRole.BUYER
            admin_status = UserStatus.VERIFIED if is_admin else UserStatus.UNVERIFIED

            user = User(
                id=uuid_pkg.uuid4(),
                email=email or f"{user_id}@scrupeak-user.com",
                name=name,
                role=admin_role,
                status=admin_status,
                is_active=True,
                email_verified=True,
                kyc_verified=True if is_admin else False  # Auto-verify admin
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"Provisioned new user: {email} (role: {admin_role})")
        except Exception as e:
            await db.rollback()
            logger.error(f"User provisioning failed for {email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found and provisioning failed",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # User exists - check for forced admin upgrade (Case-insensitive)
        from app.models import UserStatus
        from app.core.config import get_settings
        settings = get_settings()
        if email and email.lower() == settings.SUPER_ADMIN_EMAIL.lower():
            if user.role != UserRole.ADMIN or user.status != UserStatus.VERIFIED:
                user.role = UserRole.ADMIN
                user.status = UserStatus.VERIFIED
                user.kyc_verified = True
                db.add(user) # Explicitly add to session for update
                await db.commit()
                logger.info(f"Upgraded/Corrected existing user {email} to ADMIN (VERIFIED)")
    
    # Update last login on authentication
    try:
        user.last_login = datetime.utcnow()
        db.add(user)
        await db.commit()
        await db.refresh(user)
    except Exception as e:
        logger.warning(f"Failed to update last_login for {email}: {e}")
        await db.rollback()

    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Strictly enforce: LANDOWNER and AGENT roles must be VERIFIED
    from app.models import UserStatus
    if user.role in [UserRole.OWNER, UserRole.AGENT] and user.status != UserStatus.VERIFIED:
        # Silently downgrade or block? Block is safer per instructions.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your {user.role.value} status is {user.status.value}. Please wait for verification."
        )

    return user


async def get_optional_user(
    credentials: Optional[Any] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except Exception:
        return None


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    from app.core.config import get_settings
    settings = get_settings()
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    if current_user.email.lower() != settings.SUPER_ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only AUTO_ADMIN can access this resource."
        )
    return current_user

async def require_verified_landowner(
    current_user: User = Depends(get_current_user),
) -> User:
    from app.models import UserStatus
    if current_user.role != UserRole.OWNER or current_user.status != UserStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verified Landowner access required"
        )
    return current_user

async def require_verified_agent(
    current_user: User = Depends(get_current_user),
) -> User:
    from app.models import UserStatus
    if current_user.role != UserRole.AGENT or current_user.status != UserStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verified Agent access required"
        )
    return current_user


async def get_current_agent(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.AGENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent access required"
        )
    if not current_user.kyc_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent account not verified"
        )
    return current_user


def require_role(*roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(r.value for r in roles)}"
            )
        return current_user
    return role_checker

async def create_tokens_for_user(user: User):
    """Stub for legacy token generation, now handled by Privy"""
    return {
        "access_token": "privy_managed",
        "refresh_token": "privy_managed",
        "token_type": "bearer",
        "expires_in": 3600,
        "user": user
    }
