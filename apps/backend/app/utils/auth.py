"""
Authentication utilities - JWT token generation, verification, and password hashing
Updated to support Privy authentication
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
# PASSWORD HASHING
# ============================================================================

# Initialize password hashing context with secure defaults
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """Hash password using argon2 (preferred) or bcrypt"""
    return pwd_context.hash(password)



def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# JWT TOKEN GENERATION & VERIFICATION
# ============================================================================

class JWTHandler:
    """JWT token generation and verification"""
    
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
    
    def create_access_token(
        self, 
        data: Dict[str, Any], 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        # Use provided type or default to access
        token_type = data.get("type", "access")
        to_encode.update({"exp": expire, "type": token_type})
        
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM
        )
        return encoded_jwt
    
    def create_refresh_token(
        self, 
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT refresh token (longer expiry)"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        
        to_encode.update({"exp": expire, "type": "refresh"})
        
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM
        )
        return encoded_jwt
    
    def decode_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """Decode and verify JWT token (Supports better-auth JWTs)"""
        try:
            # First try decoding as a standard ScruPeak JWT
            payload = jwt.decode(
                token,
                self.settings.SECRET_KEY,
                algorithms=[self.settings.ALGORITHM]
            )
            
            # Verify token type only if it exists (Better-auth JWTs might not have 'type')
            if payload.get("type") and payload.get("type") != token_type:
                return None
            
            return payload
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            # Fallback for better-auth JWTs or alternate formats
            try:
                # Better-auth JWTs might use standard 'sub' for user ID
                # We relax audience check as it varies between frontend and backend
                payload = jwt.decode(
                    token,
                    self.settings.SECRET_KEY,
                    options={"verify_aud": False},
                    algorithms=[self.settings.ALGORITHM]
                )
                return payload
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
                logger.warning(f"Failed to decode token with fallback: {e}")
                return None
            except Exception as e:
                logger.error(f"Unexpected error during token decoding: {e}")
                return None
    
    def create_token_pair(self, user_id: str, email: str) -> Dict[str, str]:
        """Create both access and refresh tokens"""
        token_data = {
            "sub": str(user_id),
            "email": email,
            "iat": datetime.utcnow()
        }
        
        access_token = self.create_access_token(token_data)
        refresh_token = self.create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

logger = logging.getLogger(__name__)

# Security scheme for Swagger documentation
security = HTTPBearer()
jwt_handler = JWTHandler()


async def get_current_user(
    credentials: Any = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    Supports both legacy better-auth/internal tokens and new Privy tokens
    """
    token = credentials.credentials
    
    # Try decoding as Privy token first if it looks like one (usually longer/different header)
    # Actually, verify_privy_token will handle it.
    payload = None
    try:
        payload = await verify_privy_token(credentials)
    except HTTPException:
        # If Privy verification fails, try standard token
        payload = jwt_handler.decode_token(token, token_type="access")
    
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
    
    # User ID from Privy is usually 'did:privy:...'
    # We might need to map it or handle it as a string if it's not a UUID
    is_privy_id = str(user_id).startswith("did:privy:")

    # Get user from database
    if not is_privy_id:
        try:
            user_uuid = UUID(user_id)
            result = await db.execute(select(User).where(User.id == user_uuid))
        except ValueError:
            # Maybe it's not a UUID but a legacy ID or something else
            result = await db.execute(select(User).where(User.email == payload.get("email")))
    else:
        # Look up by email for Privy users for now, or add a privy_id column later
        email = payload.get("email")
        result = await db.execute(select(User).where(User.email == email))
    
    user = result.scalars().first()
    
    if user is None:
        # Just-In-Time Provisioning
        try:
            email = payload.get("email")
            name = payload.get("name") or email.split('@')[0] if email else "New User"

            user = User(
                id=uuid_pkg.uuid4() if is_privy_id else UUID(user_id),
                email=email or f"{user_id}@placeholder.com",
                name=name,
                role=UserRole.BUYER,
                is_active=True,
                email_verified=True # Trusted from auth provider
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"User not found and provisioning failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_user_from_privy(payload: dict = Security(verify_privy_token), db: AsyncSession = Depends(get_db)):
    """Helper for explicit Privy auth if needed"""
    # This can be used if we want to bypass the legacy check
    email = payload.get("email")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        # Provisioning logic
        user = User(
            id=uuid_pkg.uuid4(),
            email=email,
            name=payload.get("name") or email.split('@')[0],
            role=UserRole.BUYER,
            is_active=True,
            email_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user

async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to ensure user is admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_agent(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to ensure user is verified agent"""
    if current_user.role != UserRole.AGENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent access required"
        )
    
    # Check if agent is verified
    if not current_user.kyc_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent account not verified"
        )
    
    return current_user


async def get_optional_user(
    credentials: Optional[Any] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Optional authentication - returns user if token provided, None otherwise"""
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


# ============================================================================
# TOKEN GENERATION UTILITIES
# ============================================================================

async def create_tokens_for_user(user: User) -> Dict[str, Any]:
    """Create token pair for user"""
    tokens = jwt_handler.create_token_pair(str(user.id), user.email)
    
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "expires_in": get_settings().ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "kyc_verified": user.kyc_verified,
            "kyc_verified_at": user.kyc_verified_at,
            "is_active": user.is_active,
            "last_login": user.last_login,
            "created_at": user.created_at
        }
    }


# ============================================================================
# ROLE-BASED ACCESS CONTROL
# ============================================================================

def require_role(*roles: UserRole):
    """Decorator to require specific roles"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(r.value for r in roles)}"
            )
        return current_user
    return role_checker
