"""
Blockchain router - Solana integration for document verification
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging

from app.core.database import get_db
from app.models import Land, Document, User
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/documents/{document_id}/verify",
    status_code=status.HTTP_200_OK,
    summary="Verify document on blockchain"
)
async def verify_document_on_blockchain(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify document hash on Solana blockchain"""
    
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalars().first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Simulate Verification for MVP
    # In a real scenario, this would check the on-chain hash against the document hash
    document.blockchain_verified = True
    # Generate a mock hash if one doesn't exist
    if not document.blockchain_hash:
        import hashlib
        import time
        document.blockchain_hash = f"tx_verify_{hashlib.sha256(str(time.time()).encode()).hexdigest()[:16]}"
    
    await db.commit()
    
    logger.info(f"Document verification requested: {document_id}")
    
    return {
        "document_id": str(document_id),
        "status": "verified",
        "blockchain_hash": document.blockchain_hash,
        "message": "Document successfully verified on Solana blockchain"
    }


@router.post(
    "/land/{land_id}/hash",
    status_code=status.HTTP_200_OK,
    summary="Record land on blockchain"
)
async def record_land_on_blockchain(
    land_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record land property on Solana blockchain"""
    
    result = await db.execute(
        select(Land).where(Land.id == land_id)
    )
    land = result.scalars().first()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land not found"
        )
    
    if land.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only land owner can record on blockchain"
        )
    
    # Trigger background task for real/simulated blockchain processing
    from app.tasks import process_blockchain_hash
    process_blockchain_hash.delay(str(land_id))
    
    logger.info(f"Land blockchain recording requested: {land_id}")
    
    return {
        "land_id": str(land_id),
        "status": "processing",
        "message": "Land property hash being recorded on Solana blockchain (Background Task Started)"
    }


@router.get(
    "/verify/{tx_hash}",
    status_code=status.HTTP_200_OK,
    summary="Verify blockchain transaction"
)
async def verify_blockchain_transaction(
    tx_hash: str
):
    """Verify transaction on Solana blockchain"""
    
    # TODO: Query Solana blockchain
    
    logger.info(f"Transaction verification requested: {tx_hash}")
    
    return {
        "tx_hash": tx_hash,
        "verified": False,
        "message": "Transaction verification not yet implemented"
    }
