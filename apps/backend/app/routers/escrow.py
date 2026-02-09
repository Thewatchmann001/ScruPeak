"""
Escrow router - payment escrow management, transaction tracking
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging

from app.core.database import get_db
from app.models import Escrow, Land, User
from app.schemas import EscrowCreate, EscrowUpdate, EscrowResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    response_model=EscrowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create escrow"
)
async def create_escrow(
    escrow_data: EscrowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new escrow for land transaction"""
    
    # Verify land exists
    result = await db.execute(
        select(Land).where(Land.id == escrow_data.land_id)
    )
    land = result.scalars().first()
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )
    
    new_escrow = Escrow(
        land_id=escrow_data.land_id,
        buyer_id=current_user.id,
        seller_id=escrow_data.seller_id,
        amount=escrow_data.amount
    )
    
    db.add(new_escrow)
    await db.commit()
    await db.refresh(new_escrow)
    
    logger.info(f"Escrow created: {new_escrow.id}")
    
    return new_escrow


@router.get(
    "/{escrow_id}",
    response_model=EscrowResponse,
    summary="Get escrow details"
)
async def get_escrow(
    escrow_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get escrow details"""
    result = await db.execute(
        select(Escrow).where(Escrow.id == escrow_id)
    )
    escrow = result.scalars().first()
    
    if not escrow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow not found"
        )
    
    return escrow


@router.put(
    "/{escrow_id}",
    response_model=EscrowResponse,
    summary="Update escrow status"
)
async def update_escrow(
    escrow_id: UUID,
    escrow_update: EscrowUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update escrow status"""
    result = await db.execute(
        select(Escrow).where(Escrow.id == escrow_id)
    )
    escrow = result.scalars().first()
    
    if not escrow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow not found"
        )
    
    # Simple check - in real app would have stricter permission checks
    if escrow.seller_id != current_user.id and escrow.buyer_id != current_user.id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this escrow"
        )

    if escrow_update.status:
        escrow.status = escrow_update.status
    
    await db.commit()
    await db.refresh(escrow)
    
    logger.info(f"Escrow updated: {escrow_id}")
    
    return escrow


@router.get(
    "/my-escrows",
    response_model=list[EscrowResponse],
    summary="Get user's escrows"
)
async def get_my_escrows(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all escrows where user is buyer or seller"""
    result = await db.execute(
        select(Escrow).where(
            (Escrow.buyer_id == current_user.id) | 
            (Escrow.seller_id == current_user.id)
        )
    )
    return result.scalars().all()
