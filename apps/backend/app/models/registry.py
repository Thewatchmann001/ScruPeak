from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Numeric, Text, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
from datetime import datetime
from app.core.database import Base

class LandClassification(Base):
    """
    National land classification reference table.
    Gov/State, Residential, Commercial, etc.
    """
    __tablename__ = "land_classifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_state_land = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to parcels
    parcels = relationship("Parcel", back_populates="classification")


class SpatialGrid(Base):
    """
    Spatial Grid (Reference only for Parcel linkage)
    """
    __tablename__ = "spatial_grids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grid_code = Column(String(50), unique=True, nullable=False)
    grid_name = Column(String(100))
    # Geometry and other fields omitted for brevity as we just need the relation
    
    parcels = relationship("Parcel", back_populates="grid")


class Parcel(Base):
    """
    Core Land Parcel Registry (National Grade).
    Immutable spatial geometry, unique identity.
    """
    __tablename__ = "parcels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_code = Column(String(100), unique=True, nullable=False, index=True)
    
    grid_id = Column(UUID(as_uuid=True), ForeignKey('spatial_grids.id'), nullable=False)
    
    # Link to Classification (New)
    classification_id = Column(UUID(as_uuid=True), ForeignKey('land_classifications.id'), nullable=True, index=True)

    spatial_identity_hash = Column(String(64), unique=True, nullable=False, index=True)
    geometry = Column(Geometry('POLYGON', srid=4326), nullable=False)
    
    area_sqm = Column(Numeric(20, 2), nullable=False)
    
    active = Column(Boolean, default=True, index=True)
    properties = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    grid = relationship("SpatialGrid", back_populates="parcels")
    classification = relationship("LandClassification", back_populates="parcels")
