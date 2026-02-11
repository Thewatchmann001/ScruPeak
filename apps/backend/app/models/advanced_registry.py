"""
Advanced Land Registry Models
Implements Cadastral Versioning, Encumbrance Management, and Surveyor Authentication
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Numeric, Text, Index, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
import enum
from datetime import datetime
from app.core.database import Base

# ============================================================================
# CADASTRAL MAP VERSIONING (TEMPORAL GIS)
# ============================================================================

class CadastralChangeType(str, enum.Enum):
    SUBDIVISION = "subdivision"
    MERGE = "merge"
    BOUNDARY_ADJUSTMENT = "boundary_adjustment"
    INITIAL_REGISTRATION = "initial_registration"

class CadastralHistory(Base):
    """
    Temporal GIS: Tracks geometry changes over time.
    Allows "Time-Travel" to see what the map looked like at any point in history.
    """
    __tablename__ = "cadastral_history"
    __table_args__ = (
        Index('idx_cadastral_history_land_id', 'land_id'),
        Index('idx_cadastral_history_valid_period', 'valid_from', 'valid_to'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    land_id = Column(UUID(as_uuid=True), ForeignKey('land.id', ondelete='CASCADE'), nullable=False)
    
    # Snapshot of the geometry at this point in time
    geometry_snapshot = Column(Geometry('POLYGON', srid=4326), nullable=False)
    
    # Change Metadata
    change_type = Column(Enum(CadastralChangeType), nullable=False)
    change_description = Column(Text)
    authorized_by_surveyor_id = Column(UUID(as_uuid=True), ForeignKey('surveyors.id'))
    
    # Temporal Validity (SCD Type 2)
    valid_from = Column(DateTime, default=datetime.utcnow, nullable=False)
    valid_to = Column(DateTime, nullable=True)  # Null means "Current"
    
    # Parent/Child Lineage (for subdivisions/merges)
    parent_land_ids = Column(JSON)  # List of UUIDs
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    land = relationship("Land", backref="cadastral_history")


# ============================================================================
# ENCUMBRANCE MANAGEMENT (LIEN REGISTRY)
# ============================================================================

class EncumbranceType(str, enum.Enum):
    MORTGAGE = "mortgage"
    LIEN = "lien"
    EASEMENT = "easement"
    CAVEAT = "caveat"
    COURT_ORDER = "court_order"

class EncumbranceStatus(str, enum.Enum):
    ACTIVE = "active"
    DISCHARGED = "discharged"
    EXPIRED = "expired"

class Encumbrance(Base):
    """
    Formal Lien Registry.
    Tracks legal claims against a property (Mortgages, Court Orders).
    """
    __tablename__ = "encumbrances"
    __table_args__ = (
        Index('idx_encumbrance_land_id', 'land_id'),
        Index('idx_encumbrance_status', 'status'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    land_id = Column(UUID(as_uuid=True), ForeignKey('land.id', ondelete='CASCADE'), nullable=False)
    
    # Encumbrance Details
    type = Column(Enum(EncumbranceType), nullable=False)
    status = Column(Enum(EncumbranceStatus), default=EncumbranceStatus.ACTIVE, nullable=False)
    description = Column(Text, nullable=False)
    
    # Financials (if applicable)
    amount = Column(Numeric(18, 2))
    currency = Column(String(3), default="SLE")
    interest_rate = Column(Numeric(5, 2))
    
    # Beneficiary (Bank, Court, Individual)
    beneficiary_name = Column(String(255), nullable=False)
    beneficiary_contact = Column(String(255))
    
    # Dates
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    discharged_at = Column(DateTime)
    expiry_date = Column(DateTime)
    
    # Proof
    supporting_document_url = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    land = relationship("Land", backref="encumbrances")


# ============================================================================
# SURVEYOR DIGITAL SIGNATURE PIPELINE
# ============================================================================

class SurveyorStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"

class Surveyor(Base):
    """
    Licensed Professional Surveyors.
    Only active surveyors can digitally sign Cadastral Maps.
    """
    __tablename__ = "surveyors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Professional Credentials
    license_number = Column(String(50), unique=True, nullable=False)
    license_expiry = Column(DateTime, nullable=False)
    status = Column(Enum(SurveyorStatus), default=SurveyorStatus.PENDING)
    
    # Digital Signature Key (Public Key)
    public_key = Column(Text, nullable=True)
    
    organization = Column(String(255))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="surveyor_profile")
