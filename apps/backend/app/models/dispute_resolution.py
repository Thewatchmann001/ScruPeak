"""
Dispute Resolution & Arbitration System
Handles land disputes, conflicts, and resolution workflows
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


class DisputeType(str, enum.Enum):
    """Types of disputes"""
    BOUNDARY = "boundary"  # Boundary line disagreement
    OWNERSHIP = "ownership"  # Competing ownership claims
    TITLE = "title"  # Title defect or dispute
    PAYMENT = "payment"  # Payment/escrow issues
    CONTRACT = "contract"  # Contract violation
    ENVIRONMENTAL = "environmental"  # Environmental claims
    EASEMENT = "easement"  # Right of way/easement issues
    ENCROACHMENT = "encroachment"  # Property encroachment
    LIEN = "lien"  # Lien disputes
    OTHER = "other"  # Other disputes


class DisputeStatus(str, enum.Enum):
    """Status of dispute"""
    FILED = "filed"
    UNDER_REVIEW = "under_review"
    MEDIATION = "mediation"
    ARBITRATION = "arbitration"
    LITIGATION = "litigation"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ResolutionMethod(str, enum.Enum):
    """Method of resolution"""
    NEGOTIATION = "negotiation"
    MEDIATION = "mediation"
    ARBITRATION = "arbitration"
    LITIGATION = "litigation"
    SETTLEMENT = "settlement"


class DecisionOutcome(str, enum.Enum):
    """Outcome of dispute"""
    PLAINTIFF_WINS = "plaintiff_wins"
    DEFENDANT_WINS = "defendant_wins"
    MUTUAL_AGREEMENT = "mutual_agreement"
    PARTIAL_RESOLUTION = "partial_resolution"
    WITHDRAWN = "withdrawn"
    DISMISSED = "dismissed"


class Dispute(Base):
    """Land disputes"""
    __tablename__ = "disputes"
    __table_args__ = (
        Index("idx_dis_land_id", "land_id"),
        Index("idx_dis_status", "status"),
        Index("idx_dis_created_at", "created_at"),
        Index("idx_dis_plaintiff_id", "plaintiff_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Related entities
    land_id = Column(UUID(as_uuid=True), ForeignKey("land.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("escrow.id"), nullable=True)
    
    # Parties
    plaintiff_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    defendant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Dispute details
    dispute_type = Column(Enum(DisputeType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    amount_in_dispute = Column(Float, nullable=True)  # Disputed amount
    
    # Status and timeline
    status = Column(Enum(DisputeStatus), default=DisputeStatus.FILED, index=True)
    resolution_method = Column(Enum(ResolutionMethod), nullable=True)
    
    # Priority
    urgency = Column(String(50), default="normal")  # "low", "normal", "high", "critical"
    
    # Supporting information
    evidence_submitted = Column(JSON, nullable=True)  # URLs/references to evidence
    supporting_documents = Column(JSON, nullable=True)  # Document references
    
    # Resolution
    outcome = Column(Enum(DecisionOutcome), nullable=True)
    outcome_details = Column(Text, nullable=True)
    monetary_award = Column(Float, nullable=True)
    
    # Assignment
    assigned_mediator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_arbitrator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Dates
    filed_date = Column(DateTime, default=datetime.utcnow, index=True)
    assigned_date = Column(DateTime, nullable=True)
    resolution_date = Column(DateTime, nullable=True)
    closed_date = Column(DateTime, nullable=True)
    
    # Appeal
    can_appeal = Column(Boolean, default=True)
    appeal_filed = Column(Boolean, default=False)
    appeal_date = Column(DateTime, nullable=True)
    
    # Metadata
    case_number = Column(String(50), unique=True, nullable=True)
    reference_cases = Column(JSON, nullable=True)  # Related case numbers
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DisputeEvidenceSubmission(Base):
    """Evidence submitted for disputes"""
    __tablename__ = "dispute_evidence"
    __table_args__ = (
        Index("idx_des_dispute_id", "dispute_id"),
        Index("idx_des_submitted_by", "submitted_by"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispute_id = Column(UUID(as_uuid=True), ForeignKey("disputes.id"), nullable=False)
    
    # Submission info
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    evidence_type = Column(String(100), nullable=False)  # "document", "photo", "survey", "witness", "expert_report"
    
    # Evidence details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    file_hash = Column(String(256), nullable=True)
    
    # Verification
    is_verified = Column(Boolean, default=False)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verification_date = Column(DateTime, nullable=True)
    
    # Relevance
    relevance_score = Column(Float, nullable=True)  # 0.0-1.0
    is_admissible = Column(Boolean, default=True)
    
    submitted_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MediationSession(Base):
    """Mediation session for dispute resolution"""
    __tablename__ = "mediation_sessions"
    __table_args__ = (
        Index("idx_ms_dispute_id", "dispute_id"),
        Index("idx_ms_mediator_id", "mediator_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispute_id = Column(UUID(as_uuid=True), ForeignKey("disputes.id"), nullable=False)
    
    # Mediator
    mediator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mediator_qualifications = Column(String(255), nullable=True)
    
    # Session details
    session_number = Column(Integer, default=1)
    session_date = Column(DateTime, nullable=True)
    session_duration_minutes = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)  # Virtual or physical
    
    # Progress
    items_discussed = Column(JSON, nullable=True)  # Topics covered
    agreements_reached = Column(JSON, nullable=True)  # Partial agreements
    unresolved_issues = Column(JSON, nullable=True)  # Still open issues
    
    # Outcome
    session_outcome = Column(String(100), nullable=True)  # "continued", "settled", "impasse"
    settlement_draft = Column(Text, nullable=True)
    
    # Notes
    mediator_notes = Column(Text, nullable=True)
    next_session_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ArbitrationHearing(Base):
    """Arbitration hearing"""
    __tablename__ = "arbitration_hearings"
    __table_args__ = (
        Index("idx_ah_dispute_id", "dispute_id"),
        Index("idx_ah_arbitrator_id", "arbitrator_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispute_id = Column(UUID(as_uuid=True), ForeignKey("disputes.id"), nullable=False)
    
    # Arbitrator
    arbitrator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    arbitrator_experience = Column(Integer, nullable=True)  # Years of experience
    
    # Hearing
    hearing_date = Column(DateTime, nullable=True)
    hearing_location = Column(String(255), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Proceedings
    hearing_transcript = Column(Text, nullable=True)
    expert_witnesses = Column(JSON, nullable=True)  # Witness details
    arguments_plaintiff = Column(Text, nullable=True)
    arguments_defendant = Column(Text, nullable=True)
    
    # Determination
    binding_determination = Column(Boolean, default=True)
    determination_date = Column(DateTime, nullable=True)
    determination_text = Column(Text, nullable=True)
    
    # Award
    award_type = Column(String(100), nullable=True)  # "monetary", "declaratory", "injunctive"
    award_amount = Column(Float, nullable=True)
    award_terms = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DisputeResolution(Base):
    """Final resolution of dispute"""
    __tablename__ = "dispute_resolutions"
    __table_args__ = (
        Index("idx_dr_dispute_id", "dispute_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispute_id = Column(UUID(as_uuid=True), ForeignKey("disputes.id"), nullable=False, unique=True)
    
    # Resolution details
    resolution_type = Column(String(100), nullable=False)  # "mediated", "arbitrated", "litigated", "settled"
    resolution_date = Column(DateTime, nullable=False)
    resolved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Outcome
    outcome = Column(Enum(DecisionOutcome), nullable=False)
    outcome_description = Column(Text, nullable=False)
    
    # Terms
    settlement_terms = Column(JSON, nullable=True)
    compensation_awarded = Column(Float, nullable=True)
    other_terms = Column(JSON, nullable=True)  # Non-monetary terms
    
    # Binding
    is_binding = Column(Boolean, default=False)
    can_appeal = Column(Boolean, default=False)
    appeal_deadline = Column(DateTime, nullable=True)
    
    # Compliance
    compliance_required = Column(Boolean, default=False)
    compliance_deadline = Column(DateTime, nullable=True)
    compliance_verified = Column(Boolean, default=False)
    compliance_verified_date = Column(DateTime, nullable=True)
    
    # Enforcement
    enforcement_required = Column(Boolean, default=False)
    enforcement_action = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DisputeAuditTrail(Base):
    """Audit trail for dispute"""
    __tablename__ = "dispute_audit_trail"
    __table_args__ = (
        Index("idx_dat_dispute_id", "dispute_id"),
        Index("idx_dat_action_date", "action_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispute_id = Column(UUID(as_uuid=True), ForeignKey("disputes.id"), nullable=False)
    
    # Action
    action = Column(String(100), nullable=False)  # "filed", "updated", "assigned", "resolved", etc.
    description = Column(Text, nullable=False)
    
    # Actor
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=True)
    
    # Change details
    changes = Column(JSON, nullable=True)
    
    action_date = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String(50), nullable=True)


class DisputeStatistics(Base):
    """Aggregate statistics for disputes"""
    __tablename__ = "dispute_statistics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Period
    period_date = Column(DateTime, default=datetime.utcnow)
    period_year = Column(Integer, nullable=False)
    period_month = Column(Integer, nullable=False)
    
    # Counts
    total_disputes_filed = Column(Integer, default=0)
    disputes_resolved = Column(Integer, default=0)
    disputes_pending = Column(Integer, default=0)
    
    # Methods
    disputes_by_mediation = Column(Integer, default=0)
    disputes_by_arbitration = Column(Integer, default=0)
    disputes_by_litigation = Column(Integer, default=0)
    
    # Types
    boundary_disputes = Column(Integer, default=0)
    ownership_disputes = Column(Integer, default=0)
    title_disputes = Column(Integer, default=0)
    other_disputes = Column(Integer, default=0)
    
    # Outcomes
    resolved_favorably = Column(Integer, default=0)
    resolved_unfavorably = Column(Integer, default=0)
    settled_cases = Column(Integer, default=0)
    
    # Metrics
    average_resolution_days = Column(Float, nullable=True)
    average_award_amount = Column(Float, nullable=True)
    settlement_rate = Column(Float, nullable=True)  # Percentage
    
    created_at = Column(DateTime, default=datetime.utcnow)
