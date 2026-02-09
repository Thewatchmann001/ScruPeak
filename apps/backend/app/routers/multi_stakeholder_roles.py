"""
Multi-Stakeholder Roles Router
Professional roles, credentials, and permissions management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from typing import Optional, List
import uuid
import json
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.multi_stakeholder_roles import (
    StakeholderProfile, ProfessionalCredential, RolePermission, RoleAccess,
    GovernmentOfficialRegistration, RoleAuditLog, RoleReview,
    StakeholderRole, CredentialType, CredentialStatus, GovernmentOfficialType
)
from app.utils.auth import get_current_user, get_current_admin
from app.models import User

router = APIRouter(prefix="/api/v1/stakeholders")

# ============================================================================
# SCHEMAS
# ============================================================================

class CreateStakeholderProfileRequest(BaseModel):
    """Create stakeholder profile"""
    role: StakeholderRole
    specialization: Optional[str] = None
    professional_license_number: Optional[str] = None
    organization_name: Optional[str] = None
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    service_fee: Optional[str] = None
    languages: Optional[List[str]] = None


class AddCredentialRequest(BaseModel):
    """Add professional credential"""
    credential_type: CredentialType
    credential_name: str
    credential_number: str
    issuing_organization: str
    issuing_country: str
    issue_date: datetime
    expiry_date: Optional[datetime] = None


class RegisterGovernmentOfficialRequest(BaseModel):
    """Register government official"""
    official_type: GovernmentOfficialType
    office_name: str
    position_title: str
    jurisdiction: str
    authorization_number: str
    authorized_by: str


class LeaveReviewRequest(BaseModel):
    """Leave review for professional"""
    professional_id: str
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    professionalism: Optional[int] = None
    communication: Optional[int] = None
    reliability: Optional[int] = None
    value_for_money: Optional[int] = None


class StakeholderProfileResponse(BaseModel):
    """Stakeholder profile response"""
    id: str
    role: str
    specialization: Optional[str]
    is_verified: bool
    average_rating: Optional[int]
    total_reviews: int
    active_transactions: int
    completed_transactions: int


# ============================================================================
# ENDPOINTS: STAKEHOLDER PROFILE MANAGEMENT
# ============================================================================

@router.post("/profile", response_model=StakeholderProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_stakeholder_profile(
    request: CreateStakeholderProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create stakeholder profile for current user"""
    try:
        # Check if profile already exists
        existing = await db.execute(
            select(StakeholderProfile).where(StakeholderProfile.user_id == current_user.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile already exists")
        
        # Create profile
        profile = StakeholderProfile(
            user_id=current_user.id,
            role=request.role,
            specialization=request.specialization,
            professional_license_number=request.professional_license_number,
            organization_name=request.organization_name,
            years_of_experience=request.years_of_experience,
            bio=request.bio,
            service_fee=request.service_fee,
            languages=request.languages
        )
        db.add(profile)
        await db.commit()
        
        return StakeholderProfileResponse(
            id=str(profile.id),
            role=profile.role.value,
            specialization=profile.specialization,
            is_verified=profile.is_verified,
            average_rating=profile.average_rating,
            total_reviews=profile.total_reviews,
            active_transactions=profile.active_transactions,
            completed_transactions=profile.completed_transactions
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/profile/me", response_model=StakeholderProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's stakeholder profile"""
    result = await db.execute(
        select(StakeholderProfile).where(StakeholderProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    
    return StakeholderProfileResponse(
        id=str(profile.id),
        role=profile.role.value,
        specialization=profile.specialization,
        is_verified=profile.is_verified,
        average_rating=profile.average_rating,
        total_reviews=profile.total_reviews,
        active_transactions=profile.active_transactions,
        completed_transactions=profile.completed_transactions
    )


@router.get("/profile/{user_id}", response_model=StakeholderProfileResponse)
async def get_stakeholder_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get stakeholder profile by user ID"""
    try:
        id = uuid.UUID(user_id)
        result = await db.execute(
            select(StakeholderProfile).where(StakeholderProfile.user_id == id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        
        return StakeholderProfileResponse(
            id=str(profile.id),
            role=profile.role.value,
            specialization=profile.specialization,
            is_verified=profile.is_verified,
            average_rating=profile.average_rating,
            total_reviews=profile.total_reviews,
            active_transactions=profile.active_transactions,
            completed_transactions=profile.completed_transactions
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")


@router.put("/profile/me")
async def update_my_profile(
    bio: Optional[str] = Form(None),
    service_fee: Optional[str] = Form(None),
    is_available: Optional[bool] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's stakeholder profile"""
    result = await db.execute(
        select(StakeholderProfile).where(StakeholderProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    
    if bio is not None:
        profile.bio = bio
    if service_fee is not None:
        profile.service_fee = service_fee
    if is_available is not None:
        profile.is_available_for_work = is_available
    
    profile.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"status": "updated"}


# ============================================================================
# ENDPOINTS: PROFESSIONAL CREDENTIALS
# ============================================================================

@router.post("/credentials", status_code=status.HTTP_201_CREATED)
async def add_credential(
    request: AddCredentialRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add professional credential"""
    credential = ProfessionalCredential(
        user_id=current_user.id,
        credential_type=request.credential_type,
        credential_name=request.credential_name,
        credential_number=request.credential_number,
        issuing_organization=request.issuing_organization,
        issuing_country=request.issuing_country,
        issue_date=request.issue_date,
        expiry_date=request.expiry_date
    )
    db.add(credential)
    await db.commit()
    
    return {
        "credential_id": str(credential.id),
        "status": "pending_verification",
        "credential_name": credential.credential_name
    }


@router.get("/credentials/me", response_model=List[dict])
async def get_my_credentials(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's credentials"""
    result = await db.execute(
        select(ProfessionalCredential).where(ProfessionalCredential.user_id == current_user.id)
    )
    credentials = result.scalars().all()
    
    return [
        {
            "id": str(c.id),
            "credential_type": c.credential_type,
            "credential_name": c.credential_name,
            "issuing_organization": c.issuing_organization,
            "status": c.status,
            "is_verified": c.is_verified,
            "expiry_date": c.expiry_date
        }
        for c in credentials
    ]


@router.post("/credentials/{credential_id}/verify")
async def verify_credential(
    credential_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Verify professional credential (admin only)"""
    try:
        id = uuid.UUID(credential_id)
        result = await db.execute(
            select(ProfessionalCredential).where(ProfessionalCredential.id == id)
        )
        credential = result.scalar_one_or_none()
        
        if not credential:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
        
        credential.status = CredentialStatus.VERIFIED
        credential.is_verified = True
        credential.verified_at = datetime.utcnow()
        credential.verified_by = current_user.id
        
        await db.commit()
        
        return {"credential_id": str(credential.id), "status": "verified"}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credential ID")


# ============================================================================
# ENDPOINTS: GOVERNMENT OFFICIALS
# ============================================================================

@router.post("/government-official/register", status_code=status.HTTP_201_CREATED)
async def register_government_official(
    request: RegisterGovernmentOfficialRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register as government official"""
    # Check if already registered
    existing = await db.execute(
        select(GovernmentOfficialRegistration).where(
            GovernmentOfficialRegistration.user_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already registered as official")
    
    registration = GovernmentOfficialRegistration(
        user_id=current_user.id,
        official_type=request.official_type,
        office_name=request.office_name,
        position_title=request.position_title,
        jurisdiction=request.jurisdiction,
        jurisdiction_level="local",  # default
        authorization_number=request.authorization_number,
        authorized_by=request.authorized_by,
        authorization_date=datetime.utcnow(),
        start_date=datetime.utcnow()
    )
    db.add(registration)
    await db.commit()
    
    return {
        "registration_id": str(registration.id),
        "status": "pending_approval",
        "position": request.position_title
    }


@router.get("/government-official/me")
async def get_my_government_registration(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's government registration"""
    result = await db.execute(
        select(GovernmentOfficialRegistration).where(
            GovernmentOfficialRegistration.user_id == current_user.id
        )
    )
    registration = result.scalar_one_or_none()
    
    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not registered as official")
    
    return {
        "registration_id": str(registration.id),
        "official_type": registration.official_type,
        "office_name": registration.office_name,
        "position_title": registration.position_title,
        "jurisdiction": registration.jurisdiction,
        "is_approved": registration.is_approved,
        "is_active": registration.is_active
    }


@router.post("/government-official/{registration_id}/approve")
async def approve_government_registration(
    registration_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve government official registration (admin only)"""
    try:
        id = uuid.UUID(registration_id)
        result = await db.execute(
            select(GovernmentOfficialRegistration).where(
                GovernmentOfficialRegistration.id == id
            )
        )
        registration = result.scalar_one_or_none()
        
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
        
        registration.is_approved = True
        registration.approved_by = current_user.id
        registration.approved_at = datetime.utcnow()
        
        await db.commit()
        
        return {"status": "approved"}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID")


# ============================================================================
# ENDPOINTS: PERMISSIONS & ACCESS CONTROL
# ============================================================================

@router.get("/permissions/{role}")
async def get_role_permissions(
    role: StakeholderRole,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get permissions for a role"""
    result = await db.execute(
        select(RolePermission).where(RolePermission.role == role)
    )
    permissions = result.scalars().all()
    
    return [
        {
            "permission": p.permission,
            "resource": p.resource,
            "action": p.action,
            "requires_approval": p.requires_approval
        }
        for p in permissions
    ]


@router.get("/access/{role}")
async def get_role_access(
    role: StakeholderRole,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get data access rules for a role"""
    result = await db.execute(
        select(RoleAccess).where(RoleAccess.role == role)
    )
    access_rules = result.scalars().all()
    
    return [
        {
            "data_type": a.data_type,
            "can_view": a.can_view,
            "can_edit": a.can_edit,
            "can_delete": a.can_delete,
            "visible_fields": a.visible_fields
        }
        for a in access_rules
    ]


# ============================================================================
# ENDPOINTS: REVIEWS & RATINGS
# ============================================================================

@router.post("/reviews", status_code=status.HTTP_201_CREATED)
async def leave_review(
    request: LeaveReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Leave review for professional"""
    try:
        prof_id = uuid.UUID(request.professional_id)
        
        # Check if professional exists
        prof_result = await db.execute(
            select(User).where(User.id == prof_id)
        )
        if not prof_result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional not found")
        
        # Validate rating
        if not 1 <= request.rating <= 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating must be 1-5")
        
        review = RoleReview(
            professional_id=prof_id,
            reviewer_id=current_user.id,
            rating=request.rating,
            title=request.title,
            comment=request.comment,
            professionalism=request.professionalism,
            communication=request.communication,
            reliability=request.reliability,
            value_for_money=request.value_for_money
        )
        db.add(review)
        
        # Update professional's average rating
        prof_result = await db.execute(
            select(StakeholderProfile).where(StakeholderProfile.user_id == prof_id)
        )
        profile = prof_result.scalar_one_or_none()
        if profile:
            profile.total_reviews += 1
            if profile.average_rating is None:
                profile.average_rating = request.rating
            else:
                profile.average_rating = int((profile.average_rating + request.rating) / 2)
        
        await db.commit()
        
        return {
            "review_id": str(review.id),
            "status": "published"
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid professional ID")


@router.get("/reviews/{professional_id}", response_model=List[dict])
async def get_professional_reviews(
    professional_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for a professional"""
    try:
        prof_id = uuid.UUID(professional_id)
        result = await db.execute(
            select(RoleReview).where(
                (RoleReview.professional_id == prof_id) &
                (RoleReview.is_published == True)
            ).order_by(RoleReview.created_at.desc()).limit(50)
        )
        reviews = result.scalars().all()
        
        return [
            {
                "id": str(r.id),
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "created_at": r.created_at,
                "professionalism": r.professionalism,
                "communication": r.communication,
                "reliability": r.reliability
            }
            for r in reviews
        ]
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid professional ID")


# ============================================================================
# ENDPOINTS: AUDIT & ACTIVITY
# ============================================================================

@router.get("/audit-log/me", response_model=List[dict])
async def get_my_audit_log(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit log for current user's role-based actions"""
    result = await db.execute(
        select(RoleAuditLog).where(RoleAuditLog.user_id == current_user.id)
        .order_by(RoleAuditLog.created_at.desc()).limit(100)
    )
    logs = result.scalars().all()
    
    return [
        {
            "action": log.action,
            "resource_type": log.resource_type,
            "action_details": log.action_details,
            "created_at": log.created_at
        }
        for log in logs
    ]


@router.get("/directory", response_model=List[dict])
async def get_professional_directory(
    role: Optional[StakeholderRole] = Query(None),
    specialization: Optional[str] = Query(None),
    verified_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get directory of professionals"""
    query = select(StakeholderProfile).where(StakeholderProfile.is_available_for_work == True)
    
    if role:
        query = query.where(StakeholderProfile.role == role)
    if specialization:
        query = query.where(StakeholderProfile.specialization.ilike(f"%{specialization}%"))
    if verified_only:
        query = query.where(StakeholderProfile.is_verified == True)
    
    result = await db.execute(query.limit(100))
    profiles = result.scalars().all()
    
    return [
        {
            "id": str(p.id),
            "role": p.role.value,
            "specialization": p.specialization,
            "organization": p.organization_name,
            "rating": p.average_rating,
            "reviews": p.total_reviews,
            "is_verified": p.is_verified,
            "service_fee": p.service_fee
        }
        for p in profiles
    ]
