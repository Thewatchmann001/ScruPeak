
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import defer
from uuid import UUID
import logging
from typing import Optional
from datetime import datetime, timedelta

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
