"""
Real estate agents router - agent verification, ratings, transactions
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from datetime import datetime
from typing import List
import logging

from app.core.database import get_db
from app.models import Agent, User, UserRole
from app.models.agent_application import AgentApplication, ApplicationStatus
from app.schemas import AgentCreate, AgentResponse
from app.schemas.agent_application import AgentApplicationCreate, AgentApplicationResponse
from app.utils.auth import get_current_user, get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Agents"])


@router.post(
    "/register",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register as real estate agent"
)
async def register_agent(
    full_legal_name: str = Form(...),
    nin: str = Form(...),
    dob: str = Form(...),
    gender: str = Form(...),
    whatsapp_number: str = Form(...),
    residential_address: str = Form(...),
    real_estate_license_number: str = Form(...),
    years_experience: int = Form(...),
    primary_region: str = Form(...),
    office_address: str = Form(...),
    office_phone: str = Form(...),
    business_email: str = Form(...),
    bank_name: str = Form(...),
    account_name: str = Form(...),
    account_number: str = Form(...),
    bank_branch_name: str = Form(...),
    digital_signature: str = Form(...),
    id_document: UploadFile = File(...),
    proof_of_address: UploadFile = File(...),
    photo_straight: UploadFile = File(...),
    photo_left: UploadFile = File(None),
    photo_right: UploadFile = File(None),
    professional_photo: UploadFile = File(None),
    license_file: UploadFile = File(None),
    # Optional fields
    ministry_registration_number: str = Form(None),
    wallet_address: str = Form(None),
    secondary_phone: str = Form(None),
    secondary_regions: str = Form(None),
    market_focus: str = Form(None),
    transactions_last_12_months: int = Form(0),
    is_independent: bool = Form(True),
    agency_name: str = Form(None),
    agency_office_address: str = Form(None),
    has_surveyor_access: bool = Form(False),
    has_disputed_history: bool = Form(False),
    can_verify_authenticity: bool = Form(False),
    background_check_auth: bool = Form(False),
    swift_code: str = Form(None),
    reference1_name: str = Form(None),
    reference1_contact: str = Form(None),
    reference2_name: str = Form(None),
    reference2_contact: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register user as real estate agent with integrated KYC"""
    
    # Check if already an agent
    result = await db.execute(
        select(Agent).where(Agent.user_id == current_user.id)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered as agent"
        )
    
    # In a real production app, we would upload these to Cloud Storage (GCS/S3)
    # For this implementation, we simulate the URLs
    new_agent = Agent(
        user_id=current_user.id,
        full_legal_name=full_legal_name,
        nin=nin,
        dob=datetime.fromisoformat(dob) if dob else None,
        gender=gender,
        whatsapp_number=whatsapp_number,
        secondary_phone=secondary_phone,
        residential_address=residential_address,
        real_estate_license_number=real_estate_license_number,
        ministry_registration_number=ministry_registration_number,
        years_experience=years_experience,
        primary_region=primary_region,
        secondary_regions=secondary_regions,
        market_focus=market_focus,
        transactions_last_12_months=transactions_last_12_months,
        is_independent=is_independent,
        agency_name=agency_name,
        agency_office_address=agency_office_address,
        has_surveyor_access=has_surveyor_access,
        has_disputed_history=has_disputed_history,
        can_verify_authenticity=can_verify_authenticity,
        bank_name=bank_name,
        account_name=account_name,
        account_number=account_number,
        bank_branch_name=bank_branch_name,
        swift_code=swift_code,
        office_address=office_address,
        office_phone=office_phone,
        business_email=business_email,
        reference1_name=reference1_name,
        reference1_contact=reference1_contact,
        reference2_name=reference2_name,
        reference2_contact=reference2_contact,
        background_check_auth=background_check_auth,
        digital_signature=digital_signature,
        wallet_address=wallet_address,
        # Simulated URLs
        id_document_url=f"uploads/kyc/{current_user.id}/id_doc.jpg",
        proof_of_address_url=f"uploads/kyc/{current_user.id}/poa.jpg",
        photo_straight_url=f"uploads/kyc/{current_user.id}/straight.jpg",
        photo_left_url=f"uploads/kyc/{current_user.id}/left.jpg" if photo_left else None,
        photo_right_url=f"uploads/kyc/{current_user.id}/right.jpg" if photo_right else None,
        professional_photo_url=f"uploads/agents/{current_user.id}/photo.jpg" if professional_photo else None,
        license_file_url=f"uploads/agents/{current_user.id}/license.pdf" if license_file else None
    )
    
    # Update user pending status
    current_user.has_pending_agent_application = True
    db.add(current_user)

    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    
    logger.info(f"New agent registered: {new_agent.id}")
    
    return new_agent


@router.get(
    "/me",
    response_model=AgentResponse,
    summary="Get current agent profile"
)
async def get_agent_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get authenticated agent's profile"""
    result = await db.execute(
        select(Agent).where(Agent.user_id == current_user.id)
    )
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found"
        )
    
    return agent

@router.post("/apply", response_model=AgentApplicationResponse, status_code=201)
async def submit_application(
    data: AgentApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submit agent application — no auth required, anyone can apply as long as they are signed in"""
    application = AgentApplication(**data.model_dump())
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application

@router.get("/applications", response_model=List[AgentApplicationResponse])
async def list_applications(
    status: str = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all applications — admin only"""
    query = select(AgentApplication)
    if status:
        query = query.where(AgentApplication.status == status)
    query = query.order_by(AgentApplication.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/applications/{application_id}/approve")
async def approve_application(
    application_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve agent application"""
    result = await db.execute(
        select(AgentApplication).where(AgentApplication.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = ApplicationStatus.APPROVED
    application.reviewed_by = current_user.email
    application.reviewed_at = datetime.utcnow()


    # Update user role to AGENT
    user_result = await db.execute(
        select(User).where(User.email == application.email)
    )
    user = user_result.scalar_one_or_none()
    if user:
        user.role = UserRole.AGENT
        user.has_pending_agent_application = False
        db.add(user)

    await db.commit()
    return {"message": "Application approved and user role updated", "id": str(application_id)}

@router.put("/applications/{application_id}/reject")
async def reject_application(
    application_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject agent application"""
    result = await db.execute(
        select(AgentApplication).where(AgentApplication.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = ApplicationStatus.REJECTED
    application.reviewed_by = current_user.email
    application.reviewed_at = datetime.utcnow()
    await db.commit()
    return {"message": "Application rejected", "id": str(application_id)}

@router.get("/applications/stats")
async def application_stats(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get application counts by status"""
    result = await db.execute(
        select(AgentApplication.status, func.count(AgentApplication.id))
        .group_by(AgentApplication.status)
    )

    stats = {row[0]: row[1] for row in result.all()}
    return {
        "pending": stats.get(ApplicationStatus.PENDING, 0),
        "approved": stats.get(ApplicationStatus.APPROVED, 0),
        "rejected": stats.get(ApplicationStatus.REJECTED, 0),
        "total": sum(stats.values())
    }

@router.get("/me/role")
async def get_my_role(email: str, db: AsyncSession = Depends(get_db)):
    """Check if user has approved agent role by email"""
    result = await db.execute(
        select(AgentApplication).where(
            AgentApplication.email == email,
            AgentApplication.status == ApplicationStatus.APPROVED
        )
    )
    application = result.scalar_one_or_none()
    if application:
        return {"role": "agent", "status": "approved"}
    return {"role": "user", "status": "none"}


@router.get(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Get agent profile by ID"
)
async def get_agent(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get agent profile (public information)"""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return agent
