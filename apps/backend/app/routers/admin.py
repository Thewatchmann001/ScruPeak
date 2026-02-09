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
from app.models import User, UserRole, Agent, Land, Escrow, EscrowStatus, PaymentTransaction, KycSubmission, KycStatus
from app.models.title_verification import TitleVerification, VerificationStatus
from app.routers.payments import generate_payment_url, PaymentMethod
from app.schemas import UserResponse
from app.utils.auth import get_current_admin

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
    "/kyc/submissions/{submission_id}/reject",
    status_code=status.HTTP_200_OK,
    summary="Reject KYC Submission"
)
async def reject_kyc_submission(
    submission_id: UUID,
    reason: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject KYC submission"""
    result = await db.execute(
        select(KycSubmission).where(KycSubmission.id == submission_id)
    )
    submission = result.scalars().first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    submission.status = KycStatus.REJECTED
    submission.rejection_reason = reason
    submission.reviewed_at = datetime.utcnow()
    submission.reviewed_by = current_user.id
    
    await db.commit()
    
    logger.info(f"KYC submission {submission_id} rejected by {current_user.id}")
    
    return {
        "submission_id": str(submission_id),
        "status": "rejected"
    }
