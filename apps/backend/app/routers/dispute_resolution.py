"""
Dispute Resolution Router
Endpoints for filing, managing, and resolving land disputes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from datetime import datetime, timedelta
import uuid
from typing import List, Optional

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models import User, Escrow
from app.models.dispute_resolution import (
    Dispute, DisputeEvidenceSubmission, MediationSession, ArbitrationHearing,
    DisputeResolution, DisputeAuditTrail, DisputeStatistics,
    DisputeType, DisputeStatus, ResolutionMethod, DecisionOutcome
)
from pydantic import BaseModel, Field


# ============= Schemas =============

class DisputeCreate(BaseModel):
    land_id: str
    transaction_id: Optional[str] = None
    defendant_id: str
    dispute_type: str
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10, max_length=2000)
    amount_in_dispute: Optional[float] = None
    urgency: str = "normal"


class DisputeResponse(BaseModel):
    id: str
    land_id: str
    dispute_type: str
    title: str
    status: str
    urgency: str
    amount_in_dispute: Optional[float]
    outcome: Optional[str]
    filed_date: datetime
    resolution_date: Optional[datetime]
    assigned_mediator_id: Optional[str]
    
    class Config:
        from_attributes = True


class DisputeDetailResponse(DisputeResponse):
    description: str
    plaintiff_id: str
    defendant_id: str
    evidence_submitted: Optional[List[dict]]
    resolution_method: Optional[str]
    outcome_details: Optional[str]


class EvidenceSubmissionCreate(BaseModel):
    evidence_type: str = Field(..., pattern="^(document|photo|survey|witness|expert_report)$")
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None


class MediationSessionCreate(BaseModel):
    dispute_id: str
    session_date: Optional[datetime] = None
    location: str = "virtual"


class MediationSessionUpdate(BaseModel):
    session_date: Optional[datetime] = None
    items_discussed: Optional[List[str]] = None
    session_outcome: Optional[str] = None
    settlement_draft: Optional[str] = None
    mediator_notes: Optional[str] = None
    next_session_date: Optional[datetime] = None


class ArbitrationHearingCreate(BaseModel):
    dispute_id: str
    hearing_date: datetime
    hearing_location: str
    arbitrator_id: str


class ResolutionCreate(BaseModel):
    dispute_id: str
    resolution_type: str = Field(..., pattern="^(mediated|arbitrated|litigated|settled)$")
    outcome: str
    outcome_description: str
    settlement_terms: Optional[dict] = None
    compensation_awarded: Optional[float] = None
    is_binding: bool = False


# ============= Router =============
router = APIRouter(prefix="/api/v1/disputes", tags=["disputes"])


@router.post("/file", response_model=DisputeResponse)
async def file_dispute(
    request: DisputeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    File a new dispute
    Only involved parties (plaintiff or defendant) can initiate
    """
    try:
        # Verify user is plaintiff
        if current_user.role == "agent":
            raise HTTPException(
                status_code=403, 
                detail="Agents cannot file disputes directly"
            )
        
        # Create case number
        count_result = await db.execute(func.count(Dispute.id))
        case_num = f"DISP-{datetime.utcnow().year}-{count_result.scalar() + 1:06d}"
        
        # Create dispute
        dispute = Dispute(
            land_id=uuid.UUID(request.land_id),
            transaction_id=uuid.UUID(request.transaction_id) if request.transaction_id else None,
            plaintiff_id=current_user.id,
            defendant_id=uuid.UUID(request.defendant_id),
            dispute_type=request.dispute_type,
            title=request.title,
            description=request.description,
            amount_in_dispute=request.amount_in_dispute,
            urgency=request.urgency,
            case_number=case_num
        )
        
        db.add(dispute)
        await db.flush()
        
        # Create audit trail
        audit = DisputeAuditTrail(
            dispute_id=dispute.id,
            action="filed",
            description=f"Dispute filed by {current_user.email}",
            actor_id=current_user.id,
            actor_role=current_user.role
        )
        db.add(audit)
        
        await db.commit()
        await db.refresh(dispute)
        
        return dispute
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dispute_id}", response_model=DisputeDetailResponse)
async def get_dispute(
    dispute_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dispute details"""
    result = await db.execute(
        select(Dispute).where(Dispute.id == uuid.UUID(dispute_id))
    )
    dispute = result.scalar_one_or_none()
    
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    # Check permission
    if (current_user.id not in [dispute.plaintiff_id, dispute.defendant_id] and 
        current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view this dispute")
    
    return dispute


@router.get("", response_model=List[DisputeResponse])
async def list_disputes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = None,
    limit: int = Query(50, le=100),
    skip: int = Query(0, ge=0)
):
    """
    List disputes for current user
    Users see disputes they're involved in
    Admins see all disputes
    """
    query = select(Dispute)
    
    if current_user.role != "admin":
        # Users only see their disputes
        query = query.where(
            (Dispute.plaintiff_id == current_user.id) | 
            (Dispute.defendant_id == current_user.id)
        )
    
    if status_filter:
        query = query.where(Dispute.status == status_filter)
    
    query = query.order_by(desc(Dispute.filed_date)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{dispute_id}/evidence", response_model=dict)
async def submit_evidence(
    dispute_id: str,
    request: EvidenceSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit evidence for a dispute"""
    # Get dispute
    disp_result = await db.execute(
        select(Dispute).where(Dispute.id == uuid.UUID(dispute_id))
    )
    dispute = disp_result.scalar_one_or_none()
    
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    # Check permission
    if current_user.id not in [dispute.plaintiff_id, dispute.defendant_id]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create evidence record
    evidence = DisputeEvidenceSubmission(
        dispute_id=uuid.UUID(dispute_id),
        submitted_by=current_user.id,
        evidence_type=request.evidence_type,
        title=request.title,
        description=request.description,
        file_url=request.file_url
    )
    
    db.add(evidence)
    await db.commit()
    await db.refresh(evidence)
    
    return {
        "id": str(evidence.id),
        "evidence_type": evidence.evidence_type,
        "submitted_at": evidence.submitted_at
    }


@router.post("/{dispute_id}/mediation/session", response_model=dict)
async def create_mediation_session(
    dispute_id: str,
    request: MediationSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create mediation session"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can schedule mediation")
    
    # Get dispute
    disp_result = await db.execute(
        select(Dispute).where(Dispute.id == uuid.UUID(dispute_id))
    )
    dispute = disp_result.scalar_one_or_none()
    
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    # Create session
    session = MediationSession(
        dispute_id=uuid.UUID(dispute_id),
        mediator_id=current_user.id,
        session_date=request.session_date or datetime.utcnow() + timedelta(days=7),
        location=request.location
    )
    
    # Update dispute
    dispute.status = DisputeStatus.MEDIATION
    dispute.resolution_method = ResolutionMethod.MEDIATION
    dispute.assigned_mediator_id = current_user.id
    dispute.assigned_date = datetime.utcnow()
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return {
        "id": str(session.id),
        "session_date": session.session_date,
        "location": session.location
    }


@router.put("/{dispute_id}/mediation/session/{session_id}", response_model=dict)
async def update_mediation_session(
    dispute_id: str,
    session_id: str,
    request: MediationSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update mediation session"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update mediation")
    
    # Get session
    sess_result = await db.execute(
        select(MediationSession)
        .where(and_(
            MediationSession.id == uuid.UUID(session_id),
            MediationSession.dispute_id == uuid.UUID(dispute_id)
        ))
    )
    session = sess_result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Mediation session not found")
    
    # Update
    if request.session_date:
        session.session_date = request.session_date
    if request.items_discussed:
        session.items_discussed = request.items_discussed
    if request.session_outcome:
        session.session_outcome = request.session_outcome
    if request.settlement_draft:
        session.settlement_draft = request.settlement_draft
    if request.mediator_notes:
        session.mediator_notes = request.mediator_notes
    if request.next_session_date:
        session.next_session_date = request.next_session_date
    
    await db.commit()
    
    return {"message": "Mediation session updated", "session_id": str(session.id)}


@router.post("/{dispute_id}/arbitration/hearing", response_model=dict)
async def schedule_arbitration(
    dispute_id: str,
    request: ArbitrationHearingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Schedule arbitration hearing"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can schedule arbitration")
    
    # Get dispute
    disp_result = await db.execute(
        select(Dispute).where(Dispute.id == uuid.UUID(dispute_id))
    )
    dispute = disp_result.scalar_one_or_none()
    
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    # Create hearing
    hearing = ArbitrationHearing(
        dispute_id=uuid.UUID(dispute_id),
        arbitrator_id=uuid.UUID(request.arbitrator_id),
        hearing_date=request.hearing_date,
        hearing_location=request.hearing_location
    )
    
    # Update dispute
    dispute.status = DisputeStatus.ARBITRATION
    dispute.resolution_method = ResolutionMethod.ARBITRATION
    dispute.assigned_arbitrator_id = uuid.UUID(request.arbitrator_id)
    
    db.add(hearing)
    await db.commit()
    await db.refresh(hearing)
    
    return {
        "id": str(hearing.id),
        "hearing_date": hearing.hearing_date,
        "hearing_location": hearing.hearing_location
    }


@router.post("/{dispute_id}/resolve", response_model=DisputeResponse)
async def resolve_dispute(
    dispute_id: str,
    request: ResolutionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Resolve dispute with final decision"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can resolve disputes")
    
    try:
        # Get dispute
        disp_result = await db.execute(
            select(Dispute).where(Dispute.id == uuid.UUID(dispute_id))
        )
        dispute = disp_result.scalar_one_or_none()
        
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        # Update dispute
        dispute.status = DisputeStatus.RESOLVED
        dispute.outcome = request.outcome
        dispute.outcome_details = request.outcome_description
        dispute.resolution_date = datetime.utcnow()
        
        # Create resolution record
        resolution = DisputeResolution(
            dispute_id=uuid.UUID(dispute_id),
            resolution_type=request.resolution_type,
            resolution_date=datetime.utcnow(),
            resolved_by_id=current_user.id,
            outcome=request.outcome,
            outcome_description=request.outcome_description,
            settlement_terms=request.settlement_terms,
            compensation_awarded=request.compensation_awarded,
            is_binding=request.is_binding
        )
        
        db.add(resolution)
        await db.commit()
        await db.refresh(dispute)
        
        return dispute
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics/summary", response_model=dict)
async def get_dispute_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=365)
):
    """Get dispute statistics"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view statistics")
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get stats
    total_result = await db.execute(
        select(func.count(Dispute.id))
        .where(Dispute.filed_date >= cutoff_date)
    )
    total = total_result.scalar()
    
    resolved_result = await db.execute(
        select(func.count(Dispute.id))
        .where(and_(
            Dispute.filed_date >= cutoff_date,
            Dispute.status == DisputeStatus.RESOLVED
        ))
    )
    resolved = resolved_result.scalar()
    
    pending_result = await db.execute(
        select(func.count(Dispute.id))
        .where(and_(
            Dispute.filed_date >= cutoff_date,
            Dispute.status.in_([
                DisputeStatus.FILED,
                DisputeStatus.UNDER_REVIEW,
                DisputeStatus.MEDIATION,
                DisputeStatus.ARBITRATION
            ])
        ))
    )
    pending = pending_result.scalar()
    
    return {
        "period_days": days,
        "total_disputes_filed": total or 0,
        "disputes_resolved": resolved or 0,
        "disputes_pending": pending or 0,
        "resolution_rate": (resolved / total * 100) if total else 0
    }


@router.get("/{dispute_id}/history", response_model=List[dict])
async def get_dispute_history(
    dispute_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit trail for dispute"""
    # Get dispute
    disp_result = await db.execute(
        select(Dispute).where(Dispute.id == uuid.UUID(dispute_id))
    )
    dispute = disp_result.scalar_one_or_none()
    
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    # Check permission
    if (current_user.id not in [dispute.plaintiff_id, dispute.defendant_id] and 
        current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get audit trail
    result = await db.execute(
        select(DisputeAuditTrail)
        .where(DisputeAuditTrail.dispute_id == uuid.UUID(dispute_id))
        .order_by(desc(DisputeAuditTrail.action_date))
    )
    
    audit_trail = result.scalars().all()
    
    return [
        {
            "action": at.action,
            "description": at.description,
            "actor_role": at.actor_role,
            "action_date": at.action_date,
            "changes": at.changes
        }
        for at in audit_trail
    ]
