"""
Legal Compliance & Regulatory Tracking System
Automated compliance checking, audit trails, and regulatory reporting
"""

from sqlalchemy import (
    Column, String, DateTime, Boolean, Integer, ForeignKey, 
    Enum, Text, JSON, Float, Index
)
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class ComplianceRequirement(str, enum.Enum):
    """Types of compliance requirements"""
    AML_KYC = "aml_kyc"  # Anti-Money Laundering / Know Your Customer
    DATA_PROTECTION = "data_protection"  # GDPR, data privacy laws
    REAL_ESTATE_LICENSE = "real_estate_license"  # Agent licensing
    TAX_COMPLIANCE = "tax_compliance"  # Tax reporting
    DOCUMENT_RETENTION = "document_retention"  # Document retention rules
    DISCLOSURE = "disclosure"  # Required disclosures
    APPRAISAL = "appraisal"  # Property appraisal requirements
    TITLE_INSURANCE = "title_insurance"  # Title insurance
    ENVIRONMENTAL = "environmental"  # Environmental compliance
    ACCESSIBILITY = "accessibility"  # Accessibility standards
    FAIR_LENDING = "fair_lending"  # Fair lending laws
    FRAUD_DETECTION = "fraud_detection"  # Fraud detection procedures


class ComplianceStatus(str, enum.Enum):
    """Status of compliance check"""
    NOT_CHECKED = "not_checked"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING_REVIEW = "pending_review"
    EXCEPTION_APPROVED = "exception_approved"
    WAIVED = "waived"


class RegulatoryJurisdiction(str, enum.Enum):
    """Regulatory jurisdictions"""
    FEDERAL = "federal"  # Federal/national level
    STATE = "state"  # State/provincial level
    COUNTY = "county"  # County/local level
    MUNICIPAL = "municipal"  # Municipal level


class ComplianceCheck(Base):
    """Compliance check record"""
    __tablename__ = "compliance_checks"
    __table_args__ = (
        Index("idx_cc_transaction_id", "transaction_id"),
        Index("idx_cc_requirement_type", "requirement_type"),
        Index("idx_cc_status", "status"),
        Index("idx_cc_check_date", "check_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Related entities
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("escrow.id"), nullable=False)
    land_id = Column(UUID(as_uuid=True), ForeignKey("land.id"), nullable=False)
    
    # Compliance type
    requirement_type = Column(Enum(ComplianceRequirement), nullable=False)
    requirement_name = Column(String(255), nullable=False)
    
    # Jurisdiction
    jurisdiction = Column(Enum(RegulatoryJurisdiction), nullable=False)
    jurisdiction_name = Column(String(100), nullable=False)  # e.g., "California", "Cook County"
    
    # Status
    status = Column(Enum(ComplianceStatus), default=ComplianceStatus.NOT_CHECKED)
    is_critical = Column(Boolean, default=False)
    
    # Check details
    check_description = Column(Text, nullable=True)
    check_result = Column(Text, nullable=True)
    findings = Column(JSON, nullable=True)  # Detailed findings
    risk_level = Column(String(50), nullable=True)  # "low", "medium", "high", "critical"
    
    # Evidence
    evidence_url = Column(String(500), nullable=True)
    documentation = Column(JSON, nullable=True)
    
    # Review
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_date = Column(DateTime, nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    
    # Exception
    exception_approved = Column(Boolean, default=False)
    exception_approved_by = Column(UUID(as_uuid=True), nullable=True)
    exception_reason = Column(Text, nullable=True)
    exception_expiry = Column(DateTime, nullable=True)
    
    # Remediation
    remediation_required = Column(Boolean, default=False)
    remediation_action = Column(Text, nullable=True)
    remediation_deadline = Column(DateTime, nullable=True)
    remediation_completed = Column(Boolean, default=False)
    remediation_completed_date = Column(DateTime, nullable=True)
    
    # Dates
    check_date = Column(DateTime, default=datetime.utcnow, index=True)
    due_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CompliancePolicy(Base):
    """Compliance policies and procedures"""
    __tablename__ = "compliance_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Policy details
    policy_name = Column(String(255), nullable=False, unique=True)
    policy_code = Column(String(50), nullable=False, unique=True)  # e.g., "POL-AML-001"
    policy_description = Column(Text, nullable=False)
    
    # Requirement
    requirement_type = Column(Enum(ComplianceRequirement), nullable=False)
    jurisdiction = Column(Enum(RegulatoryJurisdiction), nullable=False)
    jurisdiction_name = Column(String(100), nullable=False)
    
    # Authority
    regulatory_authority = Column(String(255), nullable=False)  # e.g., "FinCEN", "SEC"
    regulation_reference = Column(String(255), nullable=True)  # e.g., "31 U.S.C. § 5301"
    
    # Policy content
    requirements = Column(JSON, nullable=False)  # Detailed requirements
    procedures = Column(JSON, nullable=False)  # Step-by-step procedures
    check_points = Column(JSON, nullable=False)  # Control points
    
    # Applicability
    applicable_to_roles = Column(JSON, nullable=False)  # ["buyer", "seller", "agent"]
    applicable_transaction_types = Column(JSON, nullable=False)
    
    # Enforcement
    is_active = Column(Boolean, default=True)
    enforcement_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    
    # Documentation
    policy_document_url = Column(String(500), nullable=True)
    training_required = Column(Boolean, default=False)
    training_url = Column(String(500), nullable=True)
    
    # Version control
    version = Column(String(20), default="1.0")
    previous_version_id = Column(UUID(as_uuid=True), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ComplianceTraining(Base):
    """User compliance training records"""
    __tablename__ = "compliance_training"
    __table_args__ = (
        Index("idx_ct_user_id", "user_id"),
        Index("idx_ct_completion_date", "completion_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User and training
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    requirement_type = Column(Enum(ComplianceRequirement), nullable=False)
    training_name = Column(String(255), nullable=False)
    
    # Training details
    training_url = Column(String(500), nullable=True)
    training_provider = Column(String(255), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Completion
    is_completed = Column(Boolean, default=False)
    completion_date = Column(DateTime, nullable=True)
    passed = Column(Boolean, default=False)
    score = Column(Float, nullable=True)  # 0.0-100.0
    
    # Certificate
    certificate_url = Column(String(500), nullable=True)
    certificate_issued_date = Column(DateTime, nullable=True)
    certificate_expiry_date = Column(DateTime, nullable=True)
    
    # Renewal
    renewal_required = Column(Boolean, default=False)
    renewal_due_date = Column(DateTime, nullable=True)
    
    # Acknowledgment
    acknowledged_by_user = Column(Boolean, default=False)
    acknowledged_date = Column(DateTime, nullable=True)
    acknowledgment_ip_address = Column(String(50), nullable=True)
    
    assigned_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class ComplianceReport(Base):
    """Compliance audit reports"""
    __tablename__ = "compliance_reports"
    __table_args__ = (
        Index("idx_cr_report_date", "report_date"),
        Index("idx_cr_report_type", "report_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Report details
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)  # "monthly", "quarterly", "annual", "audit"
    report_date = Column(DateTime, default=datetime.utcnow, index=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Scope
    scope_description = Column(Text, nullable=False)
    included_requirements = Column(JSON, nullable=False)  # Compliance areas covered
    
    # Findings
    total_checks_performed = Column(Integer, default=0)
    checks_passed = Column(Integer, default=0)
    checks_failed = Column(Integer, default=0)
    exceptions_approved = Column(Integer, default=0)
    
    # Summary
    compliance_percentage = Column(Float, nullable=True)
    overall_assessment = Column(String(50), nullable=True)  # "compliant", "partially_compliant", "non_compliant"
    risk_level = Column(String(50), nullable=True)  # "low", "medium", "high", "critical"
    
    # Details
    findings_summary = Column(Text, nullable=False)
    remediation_actions = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # Sign-off
    report_prepared_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    report_approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    
    # Distribution
    recipients = Column(JSON, nullable=True)  # Email addresses/user IDs
    distribution_date = Column(DateTime, nullable=True)
    
    # Document
    report_document_url = Column(String(500), nullable=True)
    report_hash = Column(String(256), nullable=True)  # For integrity
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ComplianceAuditTrail(Base):
    """Audit trail for compliance actions"""
    __tablename__ = "compliance_audit_trail"
    __table_args__ = (
        Index("idx_cat_compliance_id", "compliance_check_id"),
        Index("idx_cat_action_date", "action_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Related check
    compliance_check_id = Column(UUID(as_uuid=True), ForeignKey("compliance_checks.id"), nullable=False)
    
    # Action
    action = Column(String(100), nullable=False)  # "created", "reviewed", "approved", "remediated"
    description = Column(Text, nullable=False)
    
    # Actor
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=True)
    
    # Changes
    changes = Column(JSON, nullable=True)
    
    # Metadata
    ip_address = Column(String(50), nullable=True)
    action_date = Column(DateTime, default=datetime.utcnow, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
