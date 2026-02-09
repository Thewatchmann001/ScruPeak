from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.registry import LandClassification, Parcel
from app.schemas.registry import LandClassificationResponse, ParcelResponse

router = APIRouter(
    tags=["National Land Registry"],
    responses={404: {"description": "Not found"}},
)

@router.get("/classifications", response_model=List[LandClassificationResponse], summary="Get all land classifications")
async def get_land_classifications(
    db: Session = Depends(get_db)
):
    """
    Fetch all national land classification categories.
    """
    result = await db.execute(select(LandClassification).order_by(LandClassification.code))
    return result.scalars().all()

@router.get("/parcels", response_model=List[ParcelResponse], summary="List parcels (National Registry)")
async def get_parcels(
    skip: int = 0,
    limit: int = 100,
    classification_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    Fetch parcels from the national registry.
    """
    query = select(Parcel)
    
    if classification_id:
        query = query.filter(Parcel.classification_id == classification_id)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/parcels/{parcel_id}", response_model=ParcelResponse)
async def get_parcel(parcel_id: UUID, db: Session = Depends(get_db)):
    """
    Get a specific parcel by ID.
    """
    result = await db.execute(select(Parcel).filter(Parcel.id == parcel_id))
    parcel = result.scalar_one_or_none()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel
