"""
Title Verification Router
Endpoints for verifying land titles, checking government registries, and managing verification workflows
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta
import uuid
import httpx
import hashlib
import json
from typing import List, Optional

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models import User, Land
from app.models.title_verification import (
    TitleVerification, TitleIssue, VerificationHistory, GovernmentRegistry, 
    RegistrySyncLog, VerificationStatus, TitleIssueType
)
from pydantic import BaseModel, Field


# ============= Schemas =============

class TitleIssueResponse(BaseModel):
    id: str
    issue_type: str
    severity: str
    description: str
    is_resolved: bool
    resolution_date: Optional[datetime]
    
    class Config:
        from_attributes = True


class TitleVerificationCreate(BaseModel):
    land_id: str
    registry_source: str = Field(..., description="Source registry: NATIONAL_REGISTRY, COUNTY_OFFICE, etc.")
    title_document_url: Optional[str] = None
    title_holder_name: Optional[str] = None
    title_holder_id_number: Optional[str] = None


class TitleVerificationUpdate(BaseModel):
    is_authentic: Optional[bool] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    verification_notes: Optional[str] = None
    issue_severity: Optional[str] = None


class TitleVerificationResponse(BaseModel):
    id: str
    land_id: str
    status: str
    registry_id: Optional[str]
    registry_source: str
    is_authentic: bool
    confidence_score: float
    issue_severity: Optional[str]
    issues_detected: Optional[List[str]]
    has_liens: bool
    lien_count: int
    tax_delinquent: bool
    tax_arrears_amount: Optional[float]
    verified_at: Optional[datetime]
    expires_at: Optional[datetime]
    title_issues: List[TitleIssueResponse]
    
    class Config:
        from_attributes = True


class GovernmentRegistryCreate(BaseModel):
    registry_name: str
    country: str
    region: str
    api_endpoint: str
    api_key: str
    authentication_method: str = "api_key"
    supports_search: bool = False
    supports_verification: bool = False
    supports_transfer: bool = False
    supports_document_retrieval: bool = False


class RegistrySyncRequest(BaseModel):
    registry_id: str
    sync_type: str = Field("full", description="full or incremental")
    region_filter: Optional[str] = None


# ============= Router =============
router = APIRouter(prefix="/api/v1/title-verification", tags=["title-verification"])


@router.post("/verify", response_model=TitleVerificationResponse)
async def verify_title(
    request: TitleVerificationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate title verification for a property
    Checks government registries and performs authenticity checks
    """
    try:
        # Verify land exists and user has permission
        land_result = await db.execute(
            select(Land).where(Land.id == uuid.UUID(request.land_id))
        )
        land = land_result.scalar_one_or_none()
        
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        
        if land.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to verify this property")
        
        # Check for existing verification
        existing = await db.execute(
            select(TitleVerification).where(
                and_(
                    TitleVerification.land_id == uuid.UUID(request.land_id),
                    TitleVerification.status.in_([
                        VerificationStatus.PENDING,
                        VerificationStatus.IN_REVIEW
                    ])
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400, 
                detail="Verification already in progress for this property"
            )
        
        # Create verification record
        verification = TitleVerification(
            land_id=uuid.UUID(request.land_id),
            registry_source=request.registry_source,
            title_holder_name=request.title_holder_name,
            title_holder_id_number=request.title_holder_id_number,
            title_document_url=request.title_document_url,
            status=VerificationStatus.IN_REVIEW
        )
        
        db.add(verification)
        await db.flush()
        
        # Log history
        history = VerificationHistory(
            verification_id=verification.id,
            action="created",
            status_before=None,
            status_after=VerificationStatus.IN_REVIEW,
            reason="Verification initiated by property owner",
            performed_by=current_user.id,
            performed_by_name=current_user.email
        )
        db.add(history)
        
        await db.commit()
        await db.refresh(verification)
        
        # Queue background job to check registries
        # TODO: Implement async task queue (Celery/RQ)
        
        return verification
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verify/{verification_id}", response_model=TitleVerificationResponse)
async def get_verification(
    verification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get title verification details"""
    result = await db.execute(
        select(TitleVerification)
        .where(TitleVerification.id == uuid.UUID(verification_id))
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    # Check permission
    land_result = await db.execute(
        select(Land).where(Land.id == verification.land_id)
    )
    land = land_result.scalar_one_or_none()
    
    if land.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this verification")
    
    return verification


@router.get("/property/{land_id}/verification", response_model=Optional[TitleVerificationResponse])
async def get_property_verification(
    land_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get latest verification for a property"""
    # Check permission
    land_result = await db.execute(
        select(Land).where(Land.id == uuid.UUID(land_id))
    )
    land = land_result.scalar_one_or_none()
    
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    if land.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get latest verification
    result = await db.execute(
        select(TitleVerification)
        .where(TitleVerification.land_id == uuid.UUID(land_id))
        .order_by(TitleVerification.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.post("/check-registry", response_model=dict)
async def check_government_registry(
    land_id: str,
    registry_source: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a property exists in government registry
    Returns registry data if found
    """
    try:
        # Get registry connection
        reg_result = await db.execute(
            select(GovernmentRegistry).where(
                GovernmentRegistry.registry_name == registry_source
            )
        )
        registry = reg_result.scalar_one_or_none()
        
        if not registry:
            raise HTTPException(status_code=404, detail="Registry not configured")
        
        if not registry.is_active:
            raise HTTPException(status_code=503, detail="Registry currently unavailable")
        
        # Get land
        land_result = await db.execute(
            select(Land).where(Land.id == uuid.UUID(land_id))
        )
        land = land_result.scalar_one_or_none()
        
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        
        # Query registry API
        async with httpx.AsyncClient(timeout=30.0) as client:
            registry_data = await query_registry(
                client,
                registry,
                land,
                current_user
            )
        
        return {
            "found": registry_data is not None,
            "registry": registry_source,
            "data": registry_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registry check failed: {str(e)}")


async def query_registry(client: httpx.AsyncClient, registry: GovernmentRegistry, land: Land, user: User):
    """Query government registry for land information"""
    # This is a mock implementation - real implementation would call actual government APIs
    
    headers = {"Authorization": f"Bearer {registry.api_key}"}
    
    query_params = {
        "location": land.location,
        "area": land.area,
    }
    
    try:
        response = await client.get(
            registry.api_endpoint,
            params=query_params,
            headers=headers,
            timeout=20.0
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
            
    except Exception:
        return None


@router.post("/detect-issues/{verification_id}", response_model=TitleVerificationResponse)
async def detect_title_issues(
    verification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze title documents and registry data for issues
    Creates TitleIssue records for any detected problems
    """
    try:
        result = await db.execute(
            select(TitleVerification)
            .where(TitleVerification.id == uuid.UUID(verification_id))
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            raise HTTPException(status_code=404, detail="Verification not found")
        
        # Check permission through land
        land_result = await db.execute(
            select(Land).where(Land.id == verification.land_id)
        )
        land = land_result.scalar_one_or_none()
        
        if land.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Run issue detection logic
        issues = await run_title_analysis(verification, db)
        
        # Create issue records
        issue_records = []
        max_severity = "none"
        severity_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        max_severity_val = 0
        
        for issue_data in issues:
            issue = TitleIssue(
                verification_id=verification.id,
                issue_type=issue_data["type"],
                severity=issue_data["severity"],
                description=issue_data["description"],
                evidence_url=issue_data.get("evidence_url"),
                evidence_type=issue_data.get("evidence_type")
            )
            db.add(issue)
            issue_records.append(issue)
            
            # Track max severity
            sev_val = severity_levels.get(issue_data["severity"], 0)
            if sev_val > max_severity_val:
                max_severity_val = sev_val
                max_severity = issue_data["severity"]
        
        # Update verification
        verification.issues_detected = [i.issue_type.value for i in issue_records]
        verification.issue_severity = max_severity
        verification.confidence_score = calculate_confidence(issues)
        
        await db.commit()
        await db.refresh(verification)
        
        return verification
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


async def run_title_analysis(verification: TitleVerification, db: AsyncSession) -> List[dict]:
    """
    Analyze title documents for issues
    In production, this would use ML models for document analysis
    """
    issues = []
    
    # Check for common issues
    # 1. Duplicate title detection
    dup_result = await db.execute(
        select(TitleVerification).where(
            and_(
                TitleVerification.land_id == verification.land_id,
                TitleVerification.id != verification.id,
                TitleVerification.status.in_([VerificationStatus.VERIFIED])
            )
        )
    )
    if dup_result.scalar_one_or_none():
        issues.append({
            "type": TitleIssueType.DUPLICATE.value,
            "severity": "high",
            "description": "Duplicate title found in system"
        })
    
    # 2. Check tax status (would connect to tax authority API)
    if verification.tax_delinquent:
        issues.append({
            "type": TitleIssueType.TAX_DELINQUENCY.value,
            "severity": "high",
            "description": f"Tax delinquency: ${verification.tax_arrears_amount:.2f} owed"
        })
    
    # 3. Check for liens
    if verification.has_liens:
        issues.append({
            "type": TitleIssueType.UNRESOLVED_LIEN.value,
            "severity": "critical",
            "description": f"{verification.lien_count} lien(s) found on property"
        })
    
    return issues


def calculate_confidence(issues: List[dict]) -> float:
    """Calculate confidence score based on issues found"""
    if not issues:
        return 0.95  # High confidence if no issues
    
    # Reduce confidence for each critical issue
    severity_weights = {"low": 0.05, "medium": 0.10, "high": 0.20, "critical": 0.35}
    
    confidence = 1.0
    for issue in issues:
        weight = severity_weights.get(issue["severity"], 0.05)
        confidence -= weight
    
    return max(0.0, min(1.0, confidence))


@router.put("/verify/{verification_id}", response_model=TitleVerificationResponse)
async def mark_verified(
    verification_id: str,
    update: TitleVerificationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark verification as complete and set verification status"""
    try:
        result = await db.execute(
            select(TitleVerification)
            .where(TitleVerification.id == uuid.UUID(verification_id))
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            raise HTTPException(status_code=404, detail="Verification not found")
        
        # Only admins can mark verified
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can verify titles")
        
        # Update fields
        if update.is_authentic is not None:
            verification.is_authentic = update.is_authentic
        if update.confidence_score is not None:
            verification.confidence_score = update.confidence_score
        if update.verification_notes is not None:
            verification.verification_notes = update.verification_notes
        if update.issue_severity is not None:
            verification.issue_severity = update.issue_severity
        
        # Set as verified
        old_status = verification.status
        verification.status = VerificationStatus.VERIFIED
        verification.verified_at = datetime.utcnow()
        verification.verified_by = current_user.id
        verification.expires_at = datetime.utcnow() + timedelta(days=365)
        
        # Log change
        history = VerificationHistory(
            verification_id=verification.id,
            action="verified",
            status_before=old_status,
            status_after=VerificationStatus.VERIFIED,
            reason=update.verification_notes,
            performed_by=current_user.id,
            performed_by_name=current_user.email
        )
        db.add(history)
        
        await db.commit()
        await db.refresh(verification)
        
        return verification
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/registries", response_model=dict)
async def register_government_registry(
    registry: GovernmentRegistryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register a new government registry connection"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can register registries")
    
    try:
        # Check if already exists
        existing = await db.execute(
            select(GovernmentRegistry).where(
                GovernmentRegistry.registry_name == registry.registry_name
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Registry already registered")
        
        # Create registry record
        gov_registry = GovernmentRegistry(
            registry_name=registry.registry_name,
            country=registry.country,
            region=registry.region,
            api_endpoint=registry.api_endpoint,
            api_key=registry.api_key,  # TODO: Encrypt this
            authentication_method=registry.authentication_method,
            supports_search=registry.supports_search,
            supports_verification=registry.supports_verification,
            supports_transfer=registry.supports_transfer,
            supports_document_retrieval=registry.supports_document_retrieval
        )
        
        db.add(gov_registry)
        await db.commit()
        await db.refresh(gov_registry)
        
        return {"id": str(gov_registry.id), "name": gov_registry.registry_name}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/registries", response_model=List[dict])
async def list_registries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(True)
):
    """List all configured government registries"""
    query = select(GovernmentRegistry)
    
    if active_only:
        query = query.where(GovernmentRegistry.is_active == True)
    
    result = await db.execute(query)
    registries = result.scalars().all()
    
    return [
        {
            "id": str(r.id),
            "name": r.registry_name,
            "region": r.region,
            "country": r.country,
            "supports_verification": r.supports_verification,
            "last_sync": r.last_sync,
            "is_active": r.is_active
        }
        for r in registries
    ]


@router.get("/verification-history/{verification_id}", response_model=List[dict])
async def get_verification_history(
    verification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit trail of verification changes"""
    result = await db.execute(
        select(VerificationHistory)
        .where(VerificationHistory.verification_id == uuid.UUID(verification_id))
        .order_by(VerificationHistory.action_date.desc())
    )
    history = result.scalars().all()
    
    return [
        {
            "action": h.action,
            "status_before": h.status_before,
            "status_after": h.status_after,
            "reason": h.reason,
            "performed_by": h.performed_by_name,
            "action_date": h.action_date
        }
        for h in history
    ]
