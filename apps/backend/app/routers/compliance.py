"""
Legal Compliance Router
Endpoints for compliance checks, audit trails, and regulatory reporting
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from datetime import datetime, timedelta
import uuid
from typing import List, Optional

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models import User
from app.models.compliance import (
    ComplianceCheck, CompliancePolicy, ComplianceTraining,
    ComplianceReport, ComplianceAuditTrail,
    ComplianceRequirement, ComplianceStatus, RegulatoryJurisdiction
)
from pydantic import BaseModel, Field


# ============= Schemas =============

class ComplianceCheckResponse(BaseModel):
    id: str
    requirement_type: str
    requirement_name: str
    jurisdiction_name: str
    status: str
    risk_level: Optional[str]
    check_date: datetime
    
    class Config:
        from_attributes = True


class CompliancePolicyResponse(BaseModel):
    id: str
    policy_name: str
    policy_code: str
    requirement_type: str
    jurisdiction_name: str
    regulatory_authority: str
    is_active: bool
    version: str
    
    class Config:
        from_attributes = True


class ComplianceCheckCreate(BaseModel):
    transaction_id: str
    land_id: str
    requirement_type: str
    jurisdiction: str
    jurisdiction_name: str
    check_description: Optional[str] = None


class ComplianceReportCreate(BaseModel):
    report_type: str = Field(..., pattern="^(monthly|quarterly|annual|audit)$")
    period_start: datetime
    period_end: datetime
    scope_description: str


# ============= Router =============
router = APIRouter(prefix="/api/v1/compliance", tags=["compliance"])


@router.post("/check", response_model=ComplianceCheckResponse)
async def create_compliance_check(
    request: ComplianceCheckCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new compliance check"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create compliance checks")
    
    try:
        # Create check
        check = ComplianceCheck(
            transaction_id=uuid.UUID(request.transaction_id),
            land_id=uuid.UUID(request.land_id),
            requirement_type=request.requirement_type,
            requirement_name=request.requirement_type.replace("_", " ").title(),
            jurisdiction=request.jurisdiction,
            jurisdiction_name=request.jurisdiction_name,
            check_description=request.check_description,
            status=ComplianceStatus.PENDING_REVIEW
        )
        
        db.add(check)
        await db.flush()
        
        # Log action
        audit = ComplianceAuditTrail(
            compliance_check_id=check.id,
            action="created",
            description=f"Compliance check created for {request.requirement_type}",
            actor_id=current_user.id,
            actor_role=current_user.role
        )
        db.add(audit)
        
        await db.commit()
        await db.refresh(check)
        
        return check
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transaction/{transaction_id}/checks", response_model=List[ComplianceCheckResponse])
async def get_transaction_compliance_checks(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all compliance checks for a transaction"""
    result = await db.execute(
        select(ComplianceCheck)
        .where(ComplianceCheck.transaction_id == uuid.UUID(transaction_id))
        .order_by(desc(ComplianceCheck.check_date))
    )
    
    return result.scalars().all()


@router.get("/check/{check_id}", response_model=ComplianceCheckResponse)
async def get_compliance_check(
    check_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get compliance check details"""
    result = await db.execute(
        select(ComplianceCheck)
        .where(ComplianceCheck.id == uuid.UUID(check_id))
    )
    check = result.scalar_one_or_none()
    
    if not check:
        raise HTTPException(status_code=404, detail="Compliance check not found")
    
    return check


@router.put("/check/{check_id}/status")
async def update_compliance_check_status(
    check_id: str,
    status: str = Query(..., regex="^(not_checked|compliant|non_compliant|pending_review|exception_approved|waived)$"),
    findings: Optional[str] = None,
    risk_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update compliance check status and findings"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update compliance checks")
    
    try:
        result = await db.execute(
            select(ComplianceCheck)
            .where(ComplianceCheck.id == uuid.UUID(check_id))
        )
        check = result.scalar_one_or_none()
        
        if not check:
            raise HTTPException(status_code=404, detail="Compliance check not found")
        
        # Update
        old_status = check.status
        check.status = status
        check.check_result = findings
        check.risk_level = risk_level
        check.reviewed_by_id = current_user.id
        check.reviewed_date = datetime.utcnow()
        
        # Log audit
        audit = ComplianceAuditTrail(
            compliance_check_id=check.id,
            action="reviewed",
            description=f"Status changed from {old_status} to {status}",
            actor_id=current_user.id,
            actor_role=current_user.role,
            changes={"status": {old_status: status}, "findings": findings}
        )
        db.add(audit)
        
        await db.commit()
        
        return {"message": "Compliance check updated", "status": status}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/policy", response_model=CompliancePolicyResponse)
async def create_compliance_policy(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new compliance policy"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create policies")
    
    try:
        policy = CompliancePolicy(
            policy_name=request["policy_name"],
            policy_code=request["policy_code"],
            policy_description=request["policy_description"],
            requirement_type=request["requirement_type"],
            jurisdiction=request["jurisdiction"],
            jurisdiction_name=request["jurisdiction_name"],
            regulatory_authority=request["regulatory_authority"],
            requirements=request.get("requirements", {}),
            procedures=request.get("procedures", {}),
            check_points=request.get("check_points", {}),
            applicable_to_roles=request.get("applicable_to_roles", []),
            applicable_transaction_types=request.get("applicable_transaction_types", []),
            enforcement_date=datetime.utcnow()
        )
        
        db.add(policy)
        await db.commit()
        await db.refresh(policy)
        
        return policy
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/policies", response_model=List[CompliancePolicyResponse])
async def list_compliance_policies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(True)
):
    """List compliance policies"""
    query = select(CompliancePolicy)
    
    if active_only:
        query = query.where(CompliancePolicy.is_active == True)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/training/assign")
async def assign_compliance_training(
    user_id: str,
    requirement_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign compliance training to user"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign training")
    
    try:
        # Get policy to find training URL
        policy_result = await db.execute(
            select(CompliancePolicy)
            .where(and_(
                CompliancePolicy.requirement_type == requirement_type,
                CompliancePolicy.is_active == True
            ))
            .limit(1)
        )
        policy = policy_result.scalar_one_or_none()
        
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Create training record
        training = ComplianceTraining(
            user_id=uuid.UUID(user_id),
            requirement_type=requirement_type,
            training_name=policy.policy_name,
            training_url=policy.training_url
        )
        
        db.add(training)
        await db.commit()
        await db.refresh(training)
        
        return {"id": str(training.id), "status": "assigned"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/training/{user_id}", response_model=List[dict])
async def get_user_training_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get training completion status for user"""
    result = await db.execute(
        select(ComplianceTraining)
        .where(ComplianceTraining.user_id == uuid.UUID(user_id))
        .order_by(desc(ComplianceTraining.assigned_date))
    )
    
    trainings = result.scalars().all()
    
    return [
        {
            "id": str(t.id),
            "requirement_type": t.requirement_type,
            "training_name": t.training_name,
            "is_completed": t.is_completed,
            "completion_date": t.completion_date,
            "passed": t.passed,
            "score": t.score,
            "renewal_required": t.renewal_required,
            "renewal_due_date": t.renewal_due_date
        }
        for t in trainings
    ]


@router.post("/training/{training_id}/complete")
async def mark_training_complete(
    training_id: str,
    score: float = Query(..., ge=0, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark training as completed"""
    try:
        result = await db.execute(
            select(ComplianceTraining)
            .where(ComplianceTraining.id == uuid.UUID(training_id))
        )
        training = result.scalar_one_or_none()
        
        if not training:
            raise HTTPException(status_code=404, detail="Training not found")
        
        # Verify user
        if training.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update training
        training.is_completed = True
        training.completion_date = datetime.utcnow()
        training.passed = score >= 70  # 70% passing score
        training.score = score
        
        if training.passed:
            # Set renewal in 1 year
            training.renewal_required = True
            training.renewal_due_date = datetime.utcnow() + timedelta(days=365)
        
        await db.commit()
        
        return {
            "message": "Training completed",
            "passed": training.passed,
            "score": score
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/report", response_model=dict)
async def generate_compliance_report(
    request: ComplianceReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate compliance audit report"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can generate reports")
    
    try:
        # Get compliance checks for period
        checks_result = await db.execute(
            select(ComplianceCheck)
            .where(and_(
                ComplianceCheck.check_date >= request.period_start,
                ComplianceCheck.check_date <= request.period_end
            ))
        )
        checks = checks_result.scalars().all()
        
        # Calculate metrics
        total = len(checks)
        passed = len([c for c in checks if c.status == ComplianceStatus.COMPLIANT])
        failed = len([c for c in checks if c.status == ComplianceStatus.NON_COMPLIANT])
        exceptions = len([c for c in checks if c.status == ComplianceStatus.EXCEPTION_APPROVED])
        
        compliance_pct = (passed / total * 100) if total > 0 else 0
        
        # Create report
        report = ComplianceReport(
            report_name=f"Compliance Report - {request.report_type} ({request.period_start.strftime('%Y-%m')})",
            report_type=request.report_type,
            period_start=request.period_start,
            period_end=request.period_end,
            scope_description=request.scope_description,
            included_requirements=[c.requirement_type for c in set(checks)],
            total_checks_performed=total,
            checks_passed=passed,
            checks_failed=failed,
            exceptions_approved=exceptions,
            compliance_percentage=compliance_pct,
            overall_assessment="compliant" if compliance_pct >= 95 else "partially_compliant" if compliance_pct >= 80 else "non_compliant",
            findings_summary=f"Report period: {request.period_start.date()} to {request.period_end.date()}. Total checks: {total}. Passed: {passed}. Failed: {failed}.",
            report_prepared_by=current_user.id
        )
        
        db.add(report)
        await db.commit()
        await db.refresh(report)
        
        return {
            "id": str(report.id),
            "report_name": report.report_name,
            "compliance_percentage": compliance_pct,
            "overall_assessment": report.overall_assessment
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{report_id}", response_model=dict)
async def get_compliance_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get compliance report"""
    result = await db.execute(
        select(ComplianceReport)
        .where(ComplianceReport.id == uuid.UUID(report_id))
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {
        "id": str(report.id),
        "report_name": report.report_name,
        "report_type": report.report_type,
        "period_start": report.period_start,
        "period_end": report.period_end,
        "compliance_percentage": report.compliance_percentage,
        "overall_assessment": report.overall_assessment,
        "total_checks": report.total_checks_performed,
        "checks_passed": report.checks_passed,
        "checks_failed": report.checks_failed,
        "findings_summary": report.findings_summary,
        "report_date": report.report_date
    }


@router.get("/dashboard", response_model=dict)
async def get_compliance_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get compliance dashboard for admins"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view dashboard")
    
    # Get recent checks
    checks_result = await db.execute(
        select(func.count(ComplianceCheck.id))
        .where(ComplianceCheck.check_date >= datetime.utcnow() - timedelta(days=30))
    )
    recent_checks = checks_result.scalar()
    
    # Get compliant vs non-compliant
    compliant_result = await db.execute(
        select(func.count(ComplianceCheck.id))
        .where(ComplianceCheck.status == ComplianceStatus.COMPLIANT)
    )
    compliant = compliant_result.scalar()
    
    non_compliant_result = await db.execute(
        select(func.count(ComplianceCheck.id))
        .where(ComplianceCheck.status == ComplianceStatus.NON_COMPLIANT)
    )
    non_compliant = non_compliant_result.scalar()
    
    return {
        "recent_checks_30days": recent_checks or 0,
        "compliant_checks": compliant or 0,
        "non_compliant_checks": non_compliant or 0,
        "compliance_rate": (compliant / (compliant + non_compliant) * 100) if (compliant + non_compliant) > 0 else 0
    }
