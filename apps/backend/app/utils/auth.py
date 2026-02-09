"""
Authentication utilities - JWT token generation, verification, and password hashing
Optimized for 20M+ users with secure defaults
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Any

from app.core.config import get_settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, UserRole


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
        """Decode and verify JWT token"""
        try:
            payload = jwt.decode(
                token,
                self.settings.SECRET_KEY,
                algorithms=[self.settings.ALGORITHM]
            )
            
            # Verify token type
            if payload.get("type") != token_type:
                return None
            
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
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

# Security scheme for Swagger documentation
security = HTTPBearer()
jwt_handler = JWTHandler()


async def get_current_user(
    credentials: Any = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    
    Usage in route:
        @router.get("/protected")
        async def protected_route(user: User = Depends(get_current_user)):
            return {"user_id": user.id}
    """
    token = credentials.credentials
    
    # Decode token
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
    
    # Get user from database
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalars().first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
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
