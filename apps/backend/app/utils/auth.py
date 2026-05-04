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


async def get_current_privy_user(
    credentials: Any = Depends(security)
) -> Dict[str, Any]:
    """Verify the Privy token and return raw Privy claims."""
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

    if not payload.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Privy token missing required email claim"
        )

    return payload


async def get_current_user(
    credentials: Any = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from Privy JWT token.
    Requires the user to have previously registered in the backend.
    """
    payload = await get_current_privy_user(credentials)

    email = payload.get("email")
    user_id = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Privy token missing required email claim"
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if user is None:
        logger.warning(f"Login attempt for Privy user without backend record: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not registered. Please sign up before logging in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Existing user is found - maintain admin auto-upgrade if needed
    if email == "josephemsamah@gmail.com" and user.role != UserRole.ADMIN:
        user.role = UserRole.ADMIN
        user.kyc_verified = True
        logger.info(f"Upgraded existing user {email} to ADMIN")

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
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
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
