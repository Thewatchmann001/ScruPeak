"""
Authentication router - user login, registration, token refresh
"""
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
from datetime import timedelta

from app.core.database import get_db
from app.schemas import (
    UserCreate, UserResponse, TokenRequest, TokenResponse,
    RefreshTokenRequest, ErrorResponse, ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.models import User
from app.utils.auth import (
    hash_password, verify_password, jwt_handler,
    create_tokens_for_user
)
from app.services.email import send_verification_email, send_reset_password_email

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        409: {"model": ErrorResponse, "description": "Email already exists"}
    }
)
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Register new user
    
    - **email**: Unique email address
    - **name**: Full name
    - **password**: Min 8 chars with uppercase and digit
    - **role**: buyer (default), owner, agent
    """
    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalars().first():
        logger.warning(f"Registration attempt with existing email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    logger.info(f"New user registered: {user_data.email} (role: {user_data.role})")
    
    # Generate tokens
    tokens = await create_tokens_for_user(new_user)
    
    # Send verification email
    background_tasks.add_task(send_verification_email, new_user.email, tokens["access_token"])
    
    return tokens


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        404: {"model": ErrorResponse, "description": "User not found"}
    }
)
async def login(
    credentials: TokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login user and receive JWT tokens
    
    - **email**: User email
    - **password**: User password
    
    Returns access_token and refresh_token
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalars().first()
    
    if not user:
        logger.warning(f"Login attempt with non-existent email: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        logger.warning(f"Failed login attempt for user: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Check if user is active
    if not user.is_active:
        logger.warning(f"Login attempt on inactive account: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = user.updated_at  # Use current time via DB
    await db.commit()
    
    logger.info(f"User logged in: {credentials.email}")
    
    # Generate tokens
    tokens = await create_tokens_for_user(user)
    
    return tokens


@router.post(
    "/refresh",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid refresh token"}
    }
)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token
    
    Returns new access_token
    """
    # Decode refresh token
    payload = jwt_handler.decode_token(request.refresh_token, token_type="refresh")
    
    if payload is None:
        logger.warning("Invalid refresh token attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = payload.get("sub")
    
    # Get user from database
    from uuid import UUID
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalars().first()
    
    if not user or not user.is_active:
        logger.warning(f"Refresh attempt for non-existent/inactive user: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    logger.info(f"Token refreshed for user: {user.email}")
    
    # Generate new tokens
    tokens = await create_tokens_for_user(user)
    
    return tokens


@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid token"}
    }
)
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify email (placeholder for email verification flow)"""
    payload = jwt_handler.decode_token(token, token_type="access")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    from uuid import UUID
    user_id = payload.get("sub")
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Mark email as verified
    user.email_verified = True
    await db.commit()
    
    return {"message": "Email verified successfully"}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK
)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset email
    """
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalars().first()
    
    # Always return success even if user not found (security)
    if user:
        # Generate short-lived token (e.g., 1 hour)
        # We use a helper from jwt_handler or just reuse create_access_token
        # For simplicity, using create_access_token but ideally should have "scope": "reset_password"
        token_data = {"sub": str(user.id), "type": "reset_password"}
        token = jwt_handler.create_access_token(token_data, expires_delta=timedelta(minutes=60))
        
        background_tasks.add_task(send_reset_password_email, user.email, token)
        logger.info(f"Password reset requested for {user.email}")
    
    return {"message": "If account exists, password reset email has been sent"}


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK
)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using token
    """
    # Verify token
    try:
        # Pass token_type="reset_password" to validate against correct type
        payload = jwt_handler.decode_token(request.token, token_type="reset_password")
        if not payload:
            raise ValueError("Invalid token type")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user_id = payload.get("sub")
    
    # Cast to UUID for consistency
    from uuid import UUID
    try:
        uuid_obj = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    result = await db.execute(
        select(User).where(User.id == uuid_obj)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = hash_password(request.new_password)
    await db.commit()
    
    logger.info(f"Password reset successfully for user {user.id}")
    
    return {"message": "Password has been reset successfully"}
