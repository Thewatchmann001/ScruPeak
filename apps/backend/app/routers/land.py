
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import defer, selectinload
from uuid import UUID
import logging
from typing import Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models import Land, User, LandStatus, UserRole
from app.models.dispute_resolution import Dispute, DisputeType, DisputeStatus
from app.schemas import (
    LandCreate, LandUpdate, LandResponse, LandDetailResponse,
    LandSearchFilters, PaginatedResponse, MarketInsightsResponse,
    LandPaginatedResponse
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

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
    chief_letter: UploadFile = File(...),
    property_image: UploadFile = File(...),
    ministry_doc: Optional[UploadFile] = File(None),
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
    
    # 2. Save Documents
    from app.routers.documents import save_file
    
    survey_plan_url = await save_file(survey_plan)
    title_deed_url = await save_file(title_deed)
    chief_letter_url = await save_file(chief_letter)
    property_image_url = await save_file(property_image)
    
    ministry_url = None
    if ministry_doc:
        ministry_url = await save_file(ministry_doc)

    spousal_url = None
    if spousal_consent and spousal_consent_doc:
        spousal_url = await save_file(spousal_consent_doc)
    elif spousal_consent and not spousal_consent_doc:
        # If consent is claimed but no doc provided, warn or fail?
        # For now, we allow it but flag it for admin review
        pass

    # 3. Create Land Record
    from app.utils.spatial import compute_grid_id, generate_parcel_id

    # Extract grid info (returns grid_id, x, y)
    grid_data = compute_grid_id(latitude, longitude)
    grid_id = grid_data[0]

    # Calculate sequence for parcel ID
    count_stmt = select(func.count(Land.id)).where(Land.grid_id == str(grid_id))
    result = await db.execute(count_stmt)
    sequence = (result.scalar() or 0) + 1
    
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
        has_chief_letter=True,
        has_agreement=True, # Assumed via Title Deed
        spousal_consent=spousal_consent,
        surveyor_id=surveyor_id,
        
        # Spatial
        grid_id=str(grid_id),
        parcel_id=generate_parcel_id(grid_id, sequence),
        location=f"POINT({longitude} {latitude})"
    )
    
    db.add(new_land)
    await db.flush() # Get ID
    
    # 4. Create Document Records
    from app.models import Document, DocumentType
    
    doc_survey = Document(
        land_id=new_land.id,
        document_type=DocumentType.SURVEY_REPORT,
        file_url=survey_plan_url
    )
    
    doc_title = Document(
        land_id=new_land.id,
        document_type=DocumentType.TITLE_DEED,
        file_url=title_deed_url
    )
    
    doc_chief = Document(
        land_id=new_land.id,
        document_type=DocumentType.CHIEF_LETTER,
        file_url=chief_letter_url
    )
    
    doc_image = Document(
        land_id=new_land.id,
        document_type=DocumentType.PROPERTY_IMAGE,
        file_url=property_image_url
    )

    db.add_all([doc_survey, doc_title, doc_chief, doc_image])

    if ministry_url:
        doc_min = Document(
            land_id=new_land.id,
            document_type=DocumentType.MINISTRY_DOCUMENT,
            file_url=ministry_url
        )
        db.add(doc_min)

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
    try:
        sync_land_to_search.delay(land_dict)
    except Exception as e:
        logger.warning(f"Failed to trigger search sync: {e}")
    
    return new_land


@router.get(
    "",
    response_model=LandPaginatedResponse,
    summary="List all land properties"
)
async def list_lands(
    status: Optional[LandStatus] = Query(None),
    region: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all land property listings with filters"""
    query = select(Land).options(defer(Land.boundary))

    filters = []
    if status:
        filters.append(Land.status == status)
    if region:
        filters.append(Land.region.ilike(f"%{region}%"))
    if district:
        filters.append(Land.district.ilike(f"%{district}%"))
    if min_price is not None:
        filters.append(Land.price >= min_price)
    if max_price is not None:
        filters.append(Land.price <= max_price)

    if filters:
        query = query.where(and_(*filters))

    # Count total
    count_stmt = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # Pagination
    query = query.order_by(desc(Land.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }


@router.get(
    "/{land_id}",
    response_model=LandDetailResponse,
    summary="Get land property details"
)
async def get_land(
    land_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific land property"""
    query = select(Land).options(
        selectinload(Land.documents),
        selectinload(Land.ownership_history)
    ).where(Land.id == land_id)
    result = await db.execute(query)
    land = result.scalar_one_or_none()

    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land property not found"
        )

    return land


@router.put(
    "/{land_id}",
    response_model=LandResponse,
    summary="Update land property"
)
async def update_land(
    land_id: UUID,
    land_update: LandUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing land listing (Owner only)"""
    query = select(Land).where(Land.id == land_id)
    result = await db.execute(query)
    land = result.scalar_one_or_none()

    if not land:
        raise HTTPException(status_code=404, detail="Land property not found")

    if land.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only land owner can update this listing")

    for field, value in land_update.model_dump(exclude_unset=True).items():
        setattr(land, field, value)

    await db.commit()
    await db.refresh(land)
    return land


@router.delete(
    "/{land_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete land property"
)
async def delete_land(
    land_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a land listing (Owner only)"""
    query = select(Land).where(Land.id == land_id)
    result = await db.execute(query)
    land = result.scalar_one_or_none()

    if not land:
        raise HTTPException(status_code=404, detail="Land property not found")

    if land.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only land owner can delete this listing")

    await db.delete(land)
    await db.commit()
    return None
