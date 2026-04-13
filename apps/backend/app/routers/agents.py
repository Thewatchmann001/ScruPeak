"""
Real estate agents router - agent verification, ratings, transactions
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
import logging

from app.core.database import get_db
from app.models import Agent, User, UserRole
from app.schemas import AgentCreate, AgentResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


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
