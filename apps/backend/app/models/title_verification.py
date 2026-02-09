"""
Land Title Verification Models
Handles verification workflows, government registry checks, and title authenticity
"""

from sqlalchemy import (
    Column, String, DateTime, Boolean, Integer, ForeignKey, 
    Enum, Text, JSON, Float, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    """Status of title verification process"""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"
    DISPUTED = "disputed"


class TitleIssueType(str, enum.Enum):
    """Types of title issues detected"""
    DUPLICATE = "duplicate"
    CONFLICTING_OWNERSHIP = "conflicting_ownership"
    UNRESOLVED_LIEN = "unresolved_lien"
    BOUNDARY_DISPUTE = "boundary_dispute"
    ENCUMBRANCE = "encumbrance"
    INCOMPLETE_CHAIN = "incomplete_chain"
    FORGED_DOCUMENT = "forged_document"
    TAX_DELINQUENCY = "tax_delinquency"
    ENVIRONMENTAL_RESTRICTION = "environmental_restriction"
    ZONING_VIOLATION = "zoning_violation"


class TitleVerification(Base):
    """Core title verification record"""
    __tablename__ = "title_verifications"
    __table_args__ = (
        Index("idx_tv_land_id", "land_id"),
        Index("idx_tv_status", "status"),
        Index("idx_tv_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    land_id = Column(UUID(as_uuid=True), ForeignKey("land.id"), nullable=False)
    
    # Verification status
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, index=True)
    
    # Registry reference
    registry_id = Column(String(255), unique=True, nullable=True)  # Government registry ID
    registry_source = Column(String(100), nullable=False)  # "NATIONAL_REGISTRY", "COUNTY_OFFICE", etc.
    
    # Title holder info
    title_holder_name = Column(String(255), nullable=True)
    title_holder_id_number = Column(String(50), nullable=True)
    title_holder_phone = Column(String(20), nullable=True)
    
    # Title document
    title_document_url = Column(String(500), nullable=True)
    title_document_hash = Column(String(256), nullable=True)  # SHA256 for authenticity
    issue_date = Column(DateTime, nullable=True)
    
    # Verification results
    is_authentic = Column(Boolean, default=False)
    confidence_score = Column(Float, default=0.0)  # 0.0-1.0
    
    # Chain of ownership
    ownership_chain = Column(JSON, nullable=True)  # Historical ownership data
    chain_verified = Column(Boolean, default=False)
    
    # Issues found
    issues_detected = Column(JSON, nullable=True)  # List of TitleIssueType
    issue_severity = Column(String(50), nullable=True)  # "none", "low", "medium", "high", "critical"
    
    # Liens and encumbrances
    has_liens = Column(Boolean, default=False)
    lien_count = Column(Integer, default=0)
    liens_data = Column(JSON, nullable=True)  # Details of each lien
    
    # Tax status
    tax_delinquent = Column(Boolean, default=False)
    tax_arrears_amount = Column(Float, nullable=True)
    tax_status_check_date = Column(DateTime, nullable=True)
    
    # Verification metadata
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verification_method = Column(String(100), nullable=True)  # "manual", "automated", "blockchain"
    verification_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # Verification expiry
    
    # Relationships
    land = relationship("Land", back_populates="title_verifications")
    verified_by_admin = relationship("User", foreign_keys=[verified_by])
    title_issues = relationship("TitleIssue", back_populates="verification", cascade="all, delete-orphan")
    verification_history = relationship("VerificationHistory", back_populates="verification", cascade="all, delete-orphan")


class TitleIssue(Base):
    """Specific issues found during title verification"""
    __tablename__ = "title_issues"
    __table_args__ = (
        Index("idx_ti_verification_id", "verification_id"),
        Index("idx_ti_issue_type", "issue_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("title_verifications.id"), nullable=False)
    
    # Issue details
    issue_type = Column(Enum(TitleIssueType), nullable=False)
    severity = Column(String(50), nullable=False)  # "low", "medium", "high", "critical"
    description = Column(Text, nullable=False)
    
    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolution_date = Column(DateTime, nullable=True)
    resolution_method = Column(String(255), nullable=True)
    
    # Evidence
    evidence_url = Column(String(500), nullable=True)
    evidence_type = Column(String(100), nullable=True)  # "document", "photo", "registry_record"
    
    # Related data
    affected_parties = Column(JSON, nullable=True)  # Names/IDs of parties affected
    financial_impact = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    verification = relationship("TitleVerification", back_populates="title_issues")


class VerificationHistory(Base):
    """Audit trail of verification changes"""
    __tablename__ = "verification_history"
    __table_args__ = (
        Index("idx_vh_verification_id", "verification_id"),
        Index("idx_vh_action_date", "action_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("title_verifications.id"), nullable=False)
    
    # Action details
    action = Column(String(100), nullable=False)  # "created", "updated", "verified", "disputed", etc.
    status_before = Column(String(50), nullable=True)
    status_after = Column(String(50), nullable=True)
    
    # Change details
    changes = Column(JSON, nullable=True)  # What changed
    reason = Column(Text, nullable=True)
    
    # Performed by
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    performed_by_name = Column(String(255), nullable=True)
    
    action_date = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String(50), nullable=True)
    
    # Relationships
    verification = relationship("TitleVerification", back_populates="verification_history")


class GovernmentRegistry(Base):
    """Connection to government land registries"""
    __tablename__ = "government_registries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Registry info
    registry_name = Column(String(255), nullable=False, unique=True)
    country = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)  # State, province, county, etc.
    
    # API connection
    api_endpoint = Column(String(500), nullable=False)
    api_key = Column(String(500), nullable=False)  # Encrypted
    authentication_method = Column(String(50), nullable=False)  # "api_key", "oauth2", "certificate"
    
    # Connection status
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)
    sync_frequency_hours = Column(Integer, default=24)
    
    # Coverage
    supports_search = Column(Boolean, default=False)
    supports_verification = Column(Boolean, default=False)
    supports_transfer = Column(Boolean, default=False)
    supports_document_retrieval = Column(Boolean, default=False)
    
    # Rate limiting
    requests_per_minute = Column(Integer, default=60)
    requests_per_day = Column(Integer, default=10000)
    
    # Metadata
    data_format = Column(String(50), nullable=False)  # "json", "xml", "csv", "custom"
    response_time_ms = Column(Integer, nullable=True)
    success_rate_percent = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RegistrySyncLog(Base):
    """Log of registry synchronization"""
    __tablename__ = "registry_sync_logs"
    __table_args__ = (
        Index("idx_rsl_registry_id", "registry_id"),
        Index("idx_rsl_sync_date", "sync_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registry_id = Column(UUID(as_uuid=True), ForeignKey("government_registries.id"), nullable=False)
    
    # Sync details
    sync_type = Column(String(50), nullable=False)  # "full", "incremental", "verification"
    total_records_synced = Column(Integer, default=0)
    records_added = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    
    # Status
    status = Column(String(50), nullable=False)  # "success", "partial", "failed"
    error_message = Column(Text, nullable=True)
    
    # Performance
    duration_seconds = Column(Float, nullable=True)
    sync_date = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Data
    sync_data = Column(JSON, nullable=True)  # Details of synced data


# Add relationship to Land model (update in main models file)
# title_verifications = relationship("TitleVerification", back_populates="land")
