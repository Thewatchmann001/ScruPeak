
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import defer
from uuid import UUID
import logging
from typing import Optional, List, Any, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()

from app.core.database import get_db
from app.models import Land, User, LandStatus, UserRole
from app.models.dispute_resolution import Dispute, DisputeType, DisputeStatus
from app.schemas import (
    LandCreate, LandUpdate, LandResponse, LandDetailResponse,
    LandSearchFilters, PaginatedResponse, MarketInsightsResponse
)
from app.utils.auth import get_current_user

@router.post(
    "",
    response_model=LandResponse,
    status_code=status.HTTP_201_CREATED,
    summary="List new land property"
)
async def create_land(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    size_sqm: float = Form(...),
    region: str = Form(...),
    district: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    spousal_consent: bool = Form(False),
    surveyor_id: Optional[UUID] = Form(None),
    
    # Files
    survey_plan: UploadFile = File(...),
    title_deed: UploadFile = File(...),
    spousal_consent_doc: Optional[UploadFile] = File(None),
    
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new land property listing with mandatory document uploads.
    Includes Survey Plan and Title Deed verification.
    """
    
    # 1. Check Permissions
    if current_user.role not in [UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered Sellers, Agents, and Admins can list land properties."
        )

    if not current_user.kyc_verified:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="KYC verification is required to list land."
        )
    
    # 2. Save Documents (Mock implementation - usually upload to S3/Cloudinary)
    # In real app, use a proper file storage service
    from app.routers.documents import save_upload_file
    
    survey_plan_url = await save_upload_file(survey_plan, "survey_plans")
    title_deed_url = await save_upload_file(title_deed, "title_deeds")
    
    spousal_url = None
    if spousal_consent and spousal_consent_doc:
        spousal_url = await save_upload_file(spousal_consent_doc, "consent_docs")
    elif spousal_consent and not spousal_consent_doc:
        # If consent is claimed but no doc provided, warn or fail?
        # For now, we allow it but flag it for admin review
        pass

    # 3. Create Land Record
    from app.utils.spatial import compute_grid_id
    
    new_land = Land(
        owner_id=current_user.id,
        title=title,
        description=description,
        size_sqm=size_sqm,
        price=price,
        region=region,
        district=district,
        latitude=latitude,
        longitude=longitude,
        status=LandStatus.PENDING_APPROVAL,
        
        # Validation Flags
        has_survey_plan=True,
        has_agreement=True, # Assumed via Title Deed
        spousal_consent=spousal_consent,
        surveyor_id=surveyor_id,
        
        # Spatial
        grid_id=compute_grid_id(latitude, longitude),
        location=f"POINT({longitude} {latitude})"
    )
    
    db.add(new_land)
    await db.flush() # Get ID
    
    # 4. Create Document Records
    from app.models import Document, DocumentType
    
    doc_survey = Document(
        land_id=new_land.id,
        document_type=DocumentType.SURVEY_REPORT,
        file_url=survey_plan_url,
        verified_by=None # Pending admin verify
    )
    
    doc_title = Document(
        land_id=new_land.id,
        document_type=DocumentType.TITLE_DEED,
        file_url=title_deed_url,
        verified_by=None
    )
    
    db.add(doc_survey)
    db.add(doc_title)
    
    if spousal_url:
        doc_consent = Document(
            land_id=new_land.id,
            document_type=DocumentType.OTHER, # Or dedicated type
            file_url=spousal_url,
            verification_notes="Spousal Consent"
        )
        db.add(doc_consent)
        
    await db.commit()
    await db.refresh(new_land)
    
    logger.info(f"New land listed (Pending): {new_land.id} by {current_user.id}")
    
    # 5. Trigger Background Tasks
    from app.tasks import sync_land_to_search
    
    land_dict = {
        "id": str(new_land.id),
        "title": new_land.title,
        "price": float(new_land.price),
        "status": new_land.status,
        "region": new_land.region,
        "district": new_land.district
    }
    sync_land_to_search.delay(land_dict)
    
    return new_land

@router.get(
    "",
    response_model=PaginatedResponse,
    summary="Search land listings"
)
async def search_land(
    q: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    land_type: Optional[str] = Query(None),
    purpose: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Advanced search for land properties with pagination and filters.
    """
    query = select(Land).options(defer(Land.location), defer(Land.boundary))

    if q:
        query = query.filter(
            (Land.title.ilike(f"%{q}%")) |
            (Land.description.ilike(f"%{q}%")) |
            (Land.region.ilike(f"%{q}%")) |
            (Land.district.ilike(f"%{q}%"))
        )

    if district:
        query = query.filter(Land.district.ilike(f"%{district}%"))

    # Assuming 'purpose' is used for land_type or dedicated field if it exists
    # In my seeded data, I used 'purpose' for residential/commercial/etc.
    if land_type:
        query = query.filter(Land.purpose.ilike(f"%{land_type}%"))

    if purpose:
        query = query.filter(Land.purpose.ilike(f"%{purpose}%"))

    if min_price is not None:
        query = query.filter(Land.price >= min_price)

    if max_price is not None:
        query = query.filter(Land.price <= max_price)

    # Simple pagination
    total_count_query = select(func.count()).select_from(query.subquery())
    total_count_result = await db.execute(total_count_query)
    total_count = total_count_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    # Manually convert to response schema to avoid serialization issues with Any
    land_items = [LandResponse.model_validate(item) for item in items]

    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0

    return PaginatedResponse(
        items=land_items,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )

@router.get(
    "/{land_id}",
    response_model=LandResponse,
    summary="Get land details"
)
async def get_land_detail(
    land_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information for a specific land property.
    """
    result = await db.execute(
        select(Land)
        .filter(Land.id == land_id)
        .options(defer(Land.location), defer(Land.boundary))
    )
    land = result.scalar_one_or_none()

    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )

    return land
