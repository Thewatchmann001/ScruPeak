from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class LandClassificationBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_state_land: bool = False

class LandClassificationCreate(LandClassificationBase):
    pass

class LandClassificationResponse(LandClassificationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ParcelBase(BaseModel):
    parcel_code: str
    area_sqm: float
    active: bool = True
    properties: Optional[Dict[str, Any]] = None

class ParcelResponse(ParcelBase):
    id: UUID
    grid_id: UUID
    classification_id: Optional[UUID] = None
    spatial_identity_hash: str
    created_at: datetime
    classification: Optional[LandClassificationResponse] = None

    class Config:
        from_attributes = True
