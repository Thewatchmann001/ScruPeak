
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import defer
from uuid import UUID
import logging
import time
from typing import Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models import Land, User, LandStatus, UserRole
from app.models.dispute_resolution import Dispute, DisputeType, DisputeStatus
from app.schemas import (
    LandCreate, LandUpdate, LandResponse, LandDetailResponse,
    LandSearchFilters, PaginatedResponse, MarketInsightsResponse
)
from app.utils.auth import get_current_user, require_verified_landowner, require_verified_agent
from shapely.geometry import Polygon, mapping
import json

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Land Management"])

@router.get(
    "",
    response_model=PaginatedResponse,
    summary="List and search land properties"
)
async def list_lands(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Search land properties with filters.
    Returns listings with owner info and trust scores.
    """
    # Base query joining Land and User
    stmt = select(Land, User.name, User.role).join(User, Land.owner_id == User.id)

    # Apply filters
    if q:
        stmt = stmt.where(Land.title.ilike(f"%{q}%") | Land.description.ilike(f"%{q}%"))
    if status:
        stmt = stmt.where(Land.status == status)
    if region:
        stmt = stmt.where(Land.region.ilike(f"%{region}%"))
    if min_price:
        stmt = stmt.where(Land.price >= min_price)
    if max_price:
        stmt = stmt.where(Land.price <= max_price)

    stmt = stmt.order_by(desc(Land.created_at))

    # Get total count for pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count_res = await db.execute(count_stmt)
    total_count = total_count_res.scalar() or 0

    # Apply pagination
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)

    items = []
    for row in result.all():
        land_obj, name, role = row
        try:
            # Map role to display label
            role_labels = {
                UserRole.OWNER: "Owner",
                UserRole.AGENT: "Agent",
                UserRole.SELLER: "Seller",
                UserRole.ADMIN: "Admin",
                UserRole.GOVERNMENT_OFFICIAL: "Government Official",
                UserRole.SURVEYOR: "Licensed Surveyor",
                UserRole.LAWYER: "Lawyer",
                UserRole.NOTARY: "Notary",
                UserRole.APPRAISER: "Appraiser",
                UserRole.TITLE_COMPANY: "Title Company",
                UserRole.MEDIATOR: "Mediator",
                UserRole.ARBITRATOR: "Arbitrator",
                UserRole.AUDITOR: "Auditor",
                UserRole.COMPLIANCE_OFFICER: "Compliance Officer",
                UserRole.INSURANCE_AGENT: "Insurance Agent",
                UserRole.LENDER: "Lender",
                UserRole.ACCOUNTANT: "Accountant"
            }
            role_label = role_labels.get(role, "Seller")

            # Build payload defensively to avoid runtime serialization failures
            # caused by unexpected values in production data.
            items.append({
                "id": land_obj.id,
                "ulid": land_obj.ulid,
                "parcel_id": land_obj.parcel_id,
                "grid_id": land_obj.grid_id,
                "owner_id": land_obj.owner_id,
                "owner_name": name,
                "owner_role": role_label,
                "title": land_obj.title,
                "description": land_obj.description,
                "size_sqm": land_obj.size_sqm,
                "price": land_obj.price,
                "region": land_obj.region,
                "district": land_obj.district,
                "latitude": land_obj.latitude,
                "longitude": land_obj.longitude,
                "has_survey_plan": bool(land_obj.has_survey_plan),
                "has_chief_letter": bool(land_obj.has_chief_letter),
                "has_agreement": bool(land_obj.has_agreement),
                "spousal_consent": bool(land_obj.spousal_consent),
                "surveyor_id": land_obj.surveyor_id,
                "status": land_obj.status,
                "blockchain_verified": bool(land_obj.blockchain_verified),
                "blockchain_hash": land_obj.blockchain_hash,
                "trust_score": float(land_obj.trust_score or 0.0),
                "trust_rating": land_obj.trust_rating,
                "trust_factors": land_obj.trust_factors or {},
                "created_at": land_obj.created_at,
                "updated_at": land_obj.updated_at,
                "approved_by": land_obj.approved_by,
                "rejection_reason": land_obj.rejection_reason,
                "approval_date": land_obj.approval_date
            })
        except Exception as e:
            logger.exception(f"Failed to serialize land listing {getattr(land_obj, 'id', 'unknown')}: {e}")
            # Skip malformed records rather than failing the whole endpoint.
            continue

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
        "items": items,
        "has_next": page * page_size < total_count,
        "has_prev": page > 1
    }

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
    boundary_wkt: str = Form(..., description="WKT representation of the boundary polygon"),
    spousal_consent: bool = Form(False),
    surveyor_id: Optional[UUID] = Form(None),
    
    # Files
    survey_plan: UploadFile = File(...),
    title_deed: UploadFile = File(...),
    land_photo: Optional[UploadFile] = File(None), # NEW
    spousal_consent_doc: Optional[UploadFile] = File(None),
    
    current_user: User = Depends(get_current_user), # Generic auth first
    db: AsyncSession = Depends(get_db)
):
    """
    Create new land property listing with mandatory document uploads.
    Visibility is direct: immediately AVAILABLE and public.
    """
    
    # 1. Strict Role & Status Enforcement
    from app.models import UserStatus
    if current_user.role not in [UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN]:
         raise HTTPException(status_code=403, detail="Only Landowners and Agents can list land.")

    if current_user.role != UserRole.ADMIN and current_user.status != UserStatus.VERIFIED:
         raise HTTPException(status_code=403, detail="Your account must be VERIFIED to list land.")

    # 2. Geospatial Validation
    try:
        from shapely import wkt
        poly = wkt.loads(boundary_wkt)
        if not isinstance(poly, Polygon):
            raise ValueError("Boundary must be a Polygon.")
        if not poly.is_valid:
            raise ValueError("Invalid polygon geometry.")

        # Verify coordinates are within sane bounds (Sierra Leone roughly 7-10N, -13--10W)
        # But we'll allow standard WGS84 bounds
        for x, y in poly.exterior.coords:
            if not (-180 <= x <= 180 and -90 <= y <= 90):
                raise ValueError(f"Invalid coordinates: {x}, {y}")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Geospatial validation failed: {str(e)}")
    
    # 2. Save Documents (Mock implementation - usually upload to S3/Cloudinary)
    # In real app, use a proper file storage service
    from app.routers.documents import save_upload_file
    
    survey_plan_url = await save_upload_file(survey_plan, "survey_plans")
    title_deed_url = await save_upload_file(title_deed, "title_deeds")
    
    photo_url = None
    if land_photo:
        photo_url = await save_upload_file(land_photo, "land_photos")

    spousal_url = None
    if spousal_consent and spousal_consent_doc:
        spousal_url = await save_upload_file(spousal_consent_doc, "consent_docs")
    elif spousal_consent and not spousal_consent_doc:
        # If consent is claimed but no doc provided, warn or fail?
        # For now, we allow it but flag it for admin review
        pass

    # 3. Create Land Record - SPATIAL-FIRST REGISTRATION
    from app.utils.spatial import compute_grid_id, generate_parcel_id
    
    # Deterministic Parcel ID from Grid + Sequence
    try:
        grid_id, grid_x, grid_y = compute_grid_id(latitude, longitude)
    except Exception as e:
        logger.error(f"Spatial error: {e}")
        raise HTTPException(status_code=400, detail=f"Spatial registration failed: {str(e)}")

    # In a production system, we would query the current sequence from the DB
    # For now, we simulate sequence tracking
    mock_sequence = int(time.time()) % 10000
    parcel_id = generate_parcel_id(grid_id, mock_sequence)

    new_land = Land(
        owner_id=current_user.id,
        parcel_id=parcel_id,
        title=title,
        description=description,
        size_sqm=size_sqm,
        price=price,
        region=region,
        district=district,
        latitude=latitude,
        longitude=longitude,
        status=LandStatus.AVAILABLE, # Direct visibility
        
        # Validation Flags
        has_survey_plan=True,
        has_agreement=True, # Assumed via Title Deed
        has_photo=bool(photo_url),
        spousal_consent=spousal_consent,
        surveyor_id=surveyor_id,
        
        # Spatial
        grid_id=str(grid_id),
        location=f"POINT({longitude} {latitude})",
        boundary=f"SRID=4326;{boundary_wkt}"
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
    
    # 5. AI Extraction from Documents (Owner, Boundary, History)
    from app.services.document_extractor import DocumentExtractor
    from app.models import OwnershipHistory

    # Extract from Survey Plan (Highest accuracy for coordinates/boundary)
    extraction_result = await DocumentExtractor.extract_details(survey_plan_url, "survey_plan")

    if extraction_result["success"]:
        ext_data = extraction_result["data"]

        # Update Boundary if polygon found
        coords = ext_data.get("coordinates")
        if coords and len(coords) >= 3:
            # Construct WKT Polygon: POLYGON((lon lat, lon lat, ...))
            # Note: GeoAlchemy2/PostGIS expects (lon lat)
            polygon_pts = ", ".join([f"{p[1]} {p[0]}" for p in coords])
            # Ensure it's closed
            if coords[0] != coords[-1]:
                polygon_pts += f", {coords[0][1]} {coords[0][0]}"

            new_land.boundary = f"SRID=4326;POLYGON(({polygon_pts}))"
            logger.info(f"Land {new_land.id} boundary extracted from document")

        # Record Ownership History
        history = ext_data.get("ownership_history", [])
        for item in history:
            oh = OwnershipHistory(
                land_id=new_land.id,
                public_summary=f"{item.get('event')} - {item.get('date', 'Unknown Date')}",
                # Placeholder for historical mapping if we had historical user IDs
            )
            db.add(oh)

        # Verify Owner Name Consistency
        extracted_owner = ext_data.get("owner_name", "")
        if extracted_owner and current_user.name.lower() not in extracted_owner.lower():
            logger.warning(f"Owner Name Mismatch: Document says '{extracted_owner}', User is '{current_user.name}'")
            # We could flag this for admin or lower trust score
            new_land.rejection_reason = f"Name mismatch: Document mentions {extracted_owner}"

    # 6. Calculate Initial Trust Score
    from app.services.trust_score import calculate_trust_score

    # Check provided mandatory docs (Max 4: Survey, Deed, Consent, Photo)
    provided_count = 2 # Survey and Deed are mandatory in this endpoint
    if spousal_url: provided_count += 1
    if photo_url: provided_count += 1

    ts_result = calculate_trust_score(
        mandatory_docs_provided=provided_count,
        admin_verified=False,
        kyc_completeness=1.0 if current_user.kyc_verified else 0.0,
        land_type="formal" if region.lower() in ["freetown", "western area"] else "traditional"
    )

    new_land.trust_score = ts_result["score"]
    new_land.trust_rating = ts_result["rating"]
    new_land.trust_factors = ts_result["factors"]

    await db.commit()
    await db.refresh(new_land)

    # 7. Trigger Background Tasks
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
