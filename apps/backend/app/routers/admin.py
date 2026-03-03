"""
Admin router - system management, KYC verification, compliance
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID
import logging
from datetime import datetime, timedelta
from typing import Optional, List

from app.core.database import get_db
from app.models import (
    User, UserRole, Agent, Land, Escrow, EscrowStatus, 
    PaymentTransaction, KycSubmission, KycStatus, LandStatus
)
from app.models.title_verification import TitleVerification, VerificationStatus
from app.routers.payments import generate_payment_url, PaymentMethod
from app.schemas import UserResponse
from app.utils.auth import get_current_admin
from app.utils.spatial import generate_parcel_id
from app.tasks import generate_title_document, process_blockchain_hash

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all users"
)
async def list_users(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users


@router.get(
    "/users/{user_id}/kyc",
    summary="Get user KYC status"
)
async def get_user_kyc_status(
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get user KYC verification status"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "user_id": str(user_id),
        "email": user.email,
        "kyc_verified": user.kyc_verified,
        "verified_at": user.kyc_verified_at
    }


@router.get(
    "/agents/pending",
    summary="List pending agent applications"
)
async def list_pending_agents(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List agents waiting for verification"""
    result = await db.execute(
        select(Agent, User)
        .join(User, Agent.user_id == User.id)
        .where(Agent.platform_verified == False)
    )
    
    data = []
    for agent, user in result.all():
        data.append({
            "id": agent.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "ministry_registration_number": agent.ministry_registration_number,
            "wallet_address": agent.wallet_address,
            "created_at": agent.created_at,
            "kyc_verified": user.kyc_verified
        })
    return data



@router.post(
    "/users/{user_id}/kyc/approve",
    status_code=status.HTTP_200_OK,
    summary="Approve KYC (Legacy)"
)
async def approve_kyc(
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve KYC for user"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.kyc_verified = True
    user.kyc_verified_at = datetime.utcnow()
    # Note: Role upgrade is now handled separately via role application flow
    # user.role = UserRole.AGENT
    
    await db.commit()
    
    logger.info(f"KYC approved for user: {user_id}")
    
    return {
        "user_id": str(user_id),
        "kyc_verified": True,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "message": "KYC approved"
    }


@router.post(
    "/agents/{agent_id}/verify",
    status_code=status.HTTP_200_OK,
    summary="Verify agent"
)
async def verify_agent(
    agent_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Verify real estate agent"""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    agent.platform_verified = True  # type: ignore
    agent.verified_at = datetime.utcnow()  # type: ignore
    
    # Update user role to AGENT if verified
    result_user = await db.execute(select(User).where(User.id == agent.user_id))
    user = result_user.scalars().first()
    if user:
        user.role = UserRole.AGENT
    
    await db.commit()
    
    logger.info(f"Agent verified: {agent_id}")
    
    return {
        "agent_id": str(agent_id),
        "platform_verified": True,
        "message": "Agent verified"
    }


@router.get(
    "/audit-logs",
    summary="Get audit logs"
)
async def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get system audit logs"""
    # TODO: Implement audit log retrieval
    
    return {
        "message": "Audit log endpoint",
        "limit": limit
    }


@router.get(
    "/system/stats",
    summary="Get system statistics"
)
async def get_system_stats(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive system statistics"""
    
    # Count users
    users_result = await db.execute(select(User))
    all_users = users_result.scalars().all()
    total_users = len(all_users)
    
    # Count verified users
    verified_users = len([u for u in all_users if u.kyc_verified])
    banned_users = len([u for u in all_users if hasattr(u, 'is_banned') and u.is_banned])
    
    # Count lands
    lands_result = await db.execute(select(Land))
    all_lands = lands_result.scalars().all()
    total_lands = len(all_lands)
    
    # Count properties by status
    available = len([l for l in all_lands if l.status == "available"])
    sold = len([l for l in all_lands if l.status == "sold"])
    pending = len([l for l in all_lands if l.status == "pending"])
    
    # Count transactions/escrows
    escrows_result = await db.execute(select(Escrow))
    total_escrows = len(escrows_result.scalars().all())
    
    return {
        "users": {
            "total": total_users,
            "verified": verified_users,
            "banned": banned_users
        },
        "lands": {
            "total": total_lands,
            "available": available,
            "sold": sold,
            "pending": pending
        },
        "transactions": {
            "total_escrows": total_escrows
        }
    }


@router.post(
    "/land/{land_id}/approve",
    status_code=status.HTTP_200_OK,
    summary="Approve Land Listing"
)
async def approve_land(
    land_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve land listing and generate Parcel ID"""
    result = await db.execute(
        select(Land).where(Land.id == land_id)
    )
    land = result.scalars().first()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )
    
    if land.status != LandStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Land status is {land.status}, expected pending_approval"
        )
    
    # Generate Smart Parcel ID
    # Format: SL-{ULID_SUFFIX}-{GRID}-{SEQ}
    # We use the utility function
    try:
        new_parcel_id = generate_parcel_id(land.grid_id)
        
        # Ensure uniqueness (though ULID makes it highly unique)
        # In a real scenario, we might retry if collision, but here it's fine.
        land.parcel_id = new_parcel_id
        
        land.status = LandStatus.AVAILABLE
        land.approved_by = current_user.id
        land.approval_date = datetime.utcnow()

        # Recalculate Trust Score upon Admin Approval
        from app.services.trust_score import calculate_trust_score

        # Check provided mandatory docs (Max 4: Survey, Deed, Consent, Photo)
        provided_count = 0
        if land.has_survey_plan: provided_count += 1
        if land.has_agreement: provided_count += 1 # Deed
        if land.has_chief_letter: provided_count += 1 # Consent proxy
        if getattr(land, 'has_photo', False): provided_count += 1

        ts_result = calculate_trust_score(
            mandatory_docs_provided=provided_count,
            admin_verified=True,
            kyc_completeness=1.0 if land.owner and land.owner.kyc_verified else 0.0,
            land_type="formal" if land.region and land.region.lower() in ["freetown", "western area"] else "traditional"
        )

        land.trust_score = ts_result["score"]
        land.trust_rating = ts_result["rating"]
        land.trust_factors = ts_result["factors"]
        
        await db.commit()
        await db.refresh(land)
        
        logger.info(f"Land {land_id} approved by {current_user.id}. Parcel ID: {new_parcel_id}")
        
        # Trigger post-approval tasks
        generate_title_document.delay(str(land.id), land.owner.name if land.owner else "Unknown")
        process_blockchain_hash.delay(str(land.id))
        
        return {
            "land_id": str(land.id),
            "status": "available",
            "parcel_id": new_parcel_id,
            "message": "Land approved and listed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error approving land {land_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Parcel ID or approve land"
        )


@router.post(
    "/land/{land_id}/reject",
    status_code=status.HTTP_200_OK,
    summary="Reject Land Listing"
)
async def reject_land(
    land_id: UUID,
    reason: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject land listing"""
    result = await db.execute(
        select(Land).where(Land.id == land_id)
    )
    land = result.scalars().first()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )
        
    land.status = LandStatus.REJECTED
    land.rejection_reason = reason
    land.approved_by = current_user.id # Reviewed by
    land.approval_date = datetime.utcnow() # Decision date
    
    await db.commit()
    
    logger.info(f"Land {land_id} rejected by {current_user.id}. Reason: {reason}")
    
    return {
        "land_id": str(land.id),
        "status": "rejected",
        "message": "Land listing rejected"
    }


# ============================================================================
# NEW KYC ENDPOINTS
# ============================================================================

@router.get(
    "/kyc/submissions",
    summary="List KYC submissions"
)
async def list_kyc_submissions(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List KYC submissions, optionally filtered by status"""
    query = select(KycSubmission)
    
    if status:
        query = query.where(KycSubmission.status == status)
    
    result = await db.execute(query)
    submissions = result.scalars().all()
    
    # Enrich with user info
    enriched = []
    for sub in submissions:
        user_result = await db.execute(select(User).where(User.id == sub.user_id))
        user = user_result.scalars().first()
        enriched.append({
            "id": str(sub.id),
            "user_id": str(sub.user_id),
            "user_email": user.email if user else "Unknown",
            "user_name": user.name if user else "Unknown",
            "status": sub.status,
            "documents": sub.documents,
            "created_at": sub.created_at,
            "updated_at": sub.updated_at
        })
        
    return enriched


@router.post(
    "/kyc/submissions/{submission_id}/approve",
    status_code=status.HTTP_200_OK,
    summary="Approve KYC Submission"
)
async def approve_kyc_submission(
    submission_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve KYC submission and upgrade user role"""
    result = await db.execute(
        select(KycSubmission).where(KycSubmission.id == submission_id)
    )
    submission = result.scalars().first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Update submission
    submission.status = KycStatus.APPROVED
    submission.reviewed_at = datetime.utcnow()
    submission.reviewed_by = current_user.id
    
    # Update user
    user_result = await db.execute(select(User).where(User.id == submission.user_id))
    user = user_result.scalars().first()
    
    if user:
        user.kyc_verified = True
        user.kyc_verified_at = datetime.utcnow()
        if user.role == UserRole.BUYER:
             user.role = UserRole.OWNER
    
    await db.commit()
    
    logger.info(f"KYC submission {submission_id} approved by {current_user.id}")
    
    return {
        "submission_id": str(submission_id),
        "status": "approved",
        "user_role": user.role if user else None
    }


@router.post(
    "/escrow/{escrow_id}/freeze",
    status_code=status.HTTP_200_OK,
    summary="Freeze Escrow Transaction"
)
async def freeze_escrow(
    escrow_id: UUID,
    reason: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Freeze an escrow transaction due to dispute or fraud investigation.
    Funds cannot be released while frozen.
    """
    result = await db.execute(select(Escrow).where(Escrow.id == escrow_id))
    escrow = result.scalars().first()
    
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
        
    # We utilize 'CANCELLED' status as a proxy for frozen/halted in this version
    # In a future update, we will add a dedicated 'FROZEN' status enum.
    if escrow.status == EscrowStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot freeze a completed transaction")

    escrow.status = EscrowStatus.CANCELLED
    # We should ideally log the reason in an audit log or a notes field
    
    await db.commit()
    logger.info(f"Escrow {escrow_id} frozen/cancelled by Admin {current_user.id}. Reason: {reason}")
    
    return {"message": "Escrow transaction frozen/cancelled", "status": "cancelled"}
 

@router.post(
    "/escrow/{escrow_id}/release",
    status_code=status.HTTP_200_OK,
    summary="Force Release Escrow Funds"
)
async def release_escrow_funds(
    escrow_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Force release of funds to the Seller (Override).
    Used when manual verification is complete but automated trigger failed.
    """
    result = await db.execute(select(Escrow).where(Escrow.id == escrow_id))
    escrow = result.scalars().first()
    
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
        
    if escrow.status != EscrowStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Escrow is not active, cannot release funds")
        
    escrow.status = EscrowStatus.COMPLETED
    escrow.completed_at = datetime.utcnow()
    
    # Trigger Payout Logic (Mock)
    # In real world: PayoutService.transfer(escrow.seller_id, escrow.amount)
    
    await db.commit()
    logger.info(f"Escrow {escrow_id} force-released by Admin {current_user.id}")
    
    return {"message": "Funds released to seller", "status": "completed"}

