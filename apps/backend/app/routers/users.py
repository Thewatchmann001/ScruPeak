"""
Users router - user profile, KYC verification, preferences
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging
from typing import Optional

from app.core.database import get_db
from app.models import User, Agent
from app.schemas import UserResponse, UserUpdate, PaginatedResponse
from app.utils.auth import get_current_user, hash_password, verify_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile"
)
async def get_current_profile(
    current_user: User = Depends(get_current_user)
):
    """Get authenticated user's profile"""
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile"
)
async def update_current_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update authenticated user's profile"""
    
    # Update fields if provided
    if user_update.name:
        current_user.name = user_update.name
    if user_update.phone:
        current_user.phone = user_update.phone
    if user_update.avatar_url:
        current_user.avatar_url = user_update.avatar_url
    if user_update.email:
        # Check if email is unique
        result = await db.execute(
            select(User).where(
                User.email == user_update.email,
                User.id != current_user.id
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use"
            )
        current_user.email = user_update.email
    
    await db.commit()
    await db.refresh(current_user)
    
    logger.info(f"User profile updated: {current_user.id}")
    
    return current_user


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID"
)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get user profile by ID (public data only)"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.post(
    "/upgrade/seller",
    response_model=UserResponse,
    summary="Upgrade to seller role"
)
async def upgrade_to_seller(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upgrade current user to SELLER (Owner) role.
    Requires KYC verification.
    """
    if not current_user.kyc_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="KYC verification required to become a seller"
        )
    
    from app.models import UserRole
    if current_user.role == UserRole.BUYER:
        current_user.role = UserRole.OWNER
        await db.commit()
        await db.refresh(current_user)
        logger.info(f"User upgraded to seller: {current_user.id}")
    
    return current_user


@router.get(
    "",
    response_model=PaginatedResponse,
    summary="List users (paginated)"
)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all users with pagination and filtering (admin only)"""
    
    # Check admin privilege
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list users"
        )
    
    query = select(User)
    
    # Filter by role if provided
    if role:
        query = query.where(User.role == role)
    
    # Search by name or email
    if search:
        query = query.where(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    
    # Get total count
    count_result = await db.execute(query)
    total = len(count_result.scalars().all())
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    
    logger.info(f"Admin {current_user.id} listed users (page {page}, search={search})")
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "items": users,
        "has_next": page < (total + page_size - 1) // page_size,
        "has_prev": page > 1
    }


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password"""
    
    # Verify old password
    if not verify_password(old_password, current_user.password_hash):
        logger.warning(f"Failed password change attempt for user: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )
    
    # Update password
    current_user.password_hash = hash_password(new_password)
    db.add(current_user)
    await db.commit()
    
    logger.info(f"User {current_user.id} changed password")
    return {"message": "Password changed successfully"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_account(
    password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user account (GDPR compliance)"""
    
    # Verify password
    if not verify_password(password, current_user.password_hash):
        logger.warning(f"Failed account deletion attempt for user: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect"
        )
    
    # Soft delete
    if hasattr(current_user, 'is_deleted'):
        current_user.is_deleted = True
    else:
        # If no soft delete column, remove sensitive data
        current_user.email = f"deleted_{current_user.id}"
        current_user.password_hash = ""
    
    db.add(current_user)
    await db.commit()
    
    logger.info(f"User account deleted: {current_user.id}")
    return None


@router.put("/{user_id}/verify", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def verify_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify user account (admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can verify users"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified = True
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"Admin {current_user.id} verified user {user_id}")
    return user


@router.put("/{user_id}/ban", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def ban_user(
    user_id: UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ban user account (admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can ban users"
        )
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot ban yourself"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_banned = True
    if hasattr(user, 'ban_reason'):
        user.ban_reason = reason
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"Admin {current_user.id} banned user {user_id}")
    return user


@router.put("/{user_id}/unban", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def unban_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unban user account (admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can unban users"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_banned = False
    if hasattr(user, 'ban_reason'):
        user.ban_reason = None
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"Admin {current_user.id} unbanned user {user_id}")
    return user
