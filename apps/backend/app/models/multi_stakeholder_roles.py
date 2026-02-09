"""
Multi-Stakeholder Roles System
Government officials, appraisers, surveyors, lawyers, and other land market participants
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Enum, JSON, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class StakeholderRole(str, enum.Enum):
    """Extended stakeholder roles in land marketplace"""
    # Core roles
    BUYER = "buyer"
    SELLER = "seller"
    AGENT = "agent"
    OWNER = "owner"
    
    # Professional roles
    GOVERNMENT_OFFICIAL = "government_official"
    APPRAISER = "appraiser"
    SURVEYOR = "surveyor"
    TITLE_COMPANY = "title_company"
    LAWYER = "lawyer"
    NOTARY = "notary"
    
    # Compliance & Resolution
    MEDIATOR = "mediator"
    ARBITRATOR = "arbitrator"
    AUDITOR = "auditor"
    COMPLIANCE_OFFICER = "compliance_officer"
    
    # Finance
    INSURANCE_AGENT = "insurance_agent"
    LENDER = "lender"
    ACCOUNTANT = "accountant"


class GovernmentOfficialType(str, enum.Enum):
    """Types of government officials"""
    LAND_REGISTRY_OFFICER = "land_registry_officer"
    SURVEYOR_GENERAL = "surveyor_general"
    TAX_ASSESSOR = "tax_assessor"
    ZONING_OFFICER = "zoning_officer"
    ENVIRONMENTAL_OFFICER = "environmental_officer"
    LEGAL_OFFICER = "legal_officer"


class CredentialType(str, enum.Enum):
    """Professional credentials and licenses"""
    LICENSE = "license"
    CERTIFICATION = "certification"
    DEGREE = "degree"
    PERMIT = "permit"
    REGISTRATION = "registration"
    APPOINTMENT = "appointment"


class CredentialStatus(str, enum.Enum):
    """Status of professional credentials"""
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPENDED = "suspended"


class StakeholderProfile(Base):
    """Extended profile for professional stakeholders"""
    __tablename__ = "stakeholder_profiles"
    __table_args__ = (
        Index("idx_sp_user_id", "user_id"),
        Index("idx_sp_role", "role"),
        Index("idx_sp_is_verified", "is_verified"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Role and specialization
    role = Column(Enum(StakeholderRole), nullable=False)
    specialization = Column(String(255), nullable=True)  # e.g., "Residential Properties", "Commercial"
    
    # Professional details
    professional_license_number = Column(String(100), nullable=True)
    license_issuing_authority = Column(String(255), nullable=True)
    license_state = Column(String(50), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    
    # Organization
    organization_name = Column(String(255), nullable=True)
    organization_registration_number = Column(String(100), nullable=True)
    
    # Verification status
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Background check
    background_check_completed = Column(Boolean, default=False, nullable=False)
    background_check_date = Column(DateTime, nullable=True)
    background_check_result = Column(JSON, nullable=True)
    
    # Service area
    service_areas = Column(JSON, nullable=True)  # List of jurisdictions/regions
    
    # Professional profile
    bio = Column(Text, nullable=True)
    credentials_summary = Column(Text, nullable=True)
    languages = Column(JSON, nullable=True)  # List of languages
    
    # Activity tracking
    active_transactions = Column(Integer, default=0, nullable=False)
    completed_transactions = Column(Integer, default=0, nullable=False)
    
    # Ratings and reviews
    average_rating = Column(Integer, nullable=True)  # 1-5 stars
    total_reviews = Column(Integer, default=0, nullable=False)
    
    # Settings
    is_available_for_work = Column(Boolean, default=True, nullable=False)
    service_fee = Column(String(50), nullable=True)  # e.g., "$500", "3%"
    
    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_activity = Column(DateTime, nullable=True)
    
    profile_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<StakeholderProfile {self.role} - {self.user_id}>"


class ProfessionalCredential(Base):
    """Professional credentials and licenses"""
    __tablename__ = "professional_credentials"
    __table_args__ = (
        Index("idx_pc_user_id", "user_id"),
        Index("idx_pc_credential_type", "credential_type"),
        Index("idx_pc_status", "status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Credential details
    credential_type = Column(Enum(CredentialType), nullable=False)
    credential_name = Column(String(255), nullable=False)
    credential_number = Column(String(100), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    issuing_country = Column(String(100), nullable=False)
    issuing_state = Column(String(50), nullable=True)
    
    # Validity
    issue_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    status = Column(Enum(CredentialStatus), default=CredentialStatus.PENDING_VERIFICATION, nullable=False)
    
    # Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Documentation
    document_url = Column(String(512), nullable=True)  # URL to stored credential document
    credential_details = Column(JSON, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<ProfessionalCredential {self.credential_name} - {self.status}>"


class RolePermission(Base):
    """Permissions for each stakeholder role"""
    __tablename__ = "role_permissions"
    __table_args__ = (
        Index("idx_rp_role", "role"),
        Index("idx_rp_permission", "permission"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(Enum(StakeholderRole), nullable=False)
    
    # Permission details
    permission = Column(String(255), nullable=False)  # e.g., "view_properties", "verify_titles"
    resource = Column(String(100), nullable=False)  # e.g., "land", "transaction", "document"
    action = Column(String(50), nullable=False)  # read, write, delete, approve
    
    # Scope
    is_scoped = Column(Boolean, default=False, nullable=False)  # If limited to specific regions
    scope_parameters = Column(JSON, nullable=True)
    
    # Approval required
    requires_approval = Column(Boolean, default=False, nullable=False)
    approval_role = Column(Enum(StakeholderRole), nullable=True)
    
    # Created
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<RolePermission {self.role} - {self.permission}>"


class RoleAccess(Base):
    """Data visibility and access rules for roles"""
    __tablename__ = "role_access"
    __table_args__ = (
        Index("idx_ra_role", "role"),
        Index("idx_ra_data_type", "data_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(Enum(StakeholderRole), nullable=False)
    
    # Data access rules
    data_type = Column(String(100), nullable=False)  # property, transaction, user_profile, etc.
    can_view = Column(Boolean, default=False, nullable=False)
    can_edit = Column(Boolean, default=False, nullable=False)
    can_delete = Column(Boolean, default=False, nullable=False)
    
    # Field-level access
    visible_fields = Column(JSON, nullable=True)  # List of fields user can see
    hidden_fields = Column(JSON, nullable=True)  # List of fields user cannot see
    
    # Conditions
    conditions = Column(JSON, nullable=True)  # JSON conditions for access (e.g., region, transaction status)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<RoleAccess {self.role} - {self.data_type}>"


class GovernmentOfficialRegistration(Base):
    """Registration for government officials"""
    __tablename__ = "government_official_registrations"
    __table_args__ = (
        Index("idx_gor_user_id", "user_id"),
        Index("idx_gor_official_type", "official_type"),
        Index("idx_gor_jurisdiction", "jurisdiction"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Official details
    official_type = Column(Enum(GovernmentOfficialType), nullable=False)
    office_name = Column(String(255), nullable=False)
    position_title = Column(String(255), nullable=False)
    jurisdiction = Column(String(255), nullable=False)  # e.g., County/State
    jurisdiction_level = Column(String(50), nullable=False)  # local, state, national
    
    # Authority
    authorization_number = Column(String(100), nullable=False)
    authorized_by = Column(String(255), nullable=False)
    authorization_date = Column(DateTime, nullable=False)
    
    # Verification
    is_approved = Column(Boolean, default=False, nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Contact info
    office_phone = Column(String(20), nullable=True)
    office_email = Column(String(255), nullable=True)
    
    # Timeline
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<GovernmentOfficialRegistration {self.position_title}>"


class RoleAuditLog(Base):
    """Audit trail for role-based actions"""
    __tablename__ = "role_audit_logs"
    __table_args__ = (
        Index("idx_ral_user_id", "user_id"),
        Index("idx_ral_role", "role"),
        Index("idx_ral_action", "action"),
        Index("idx_ral_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(Enum(StakeholderRole), nullable=False)
    
    # Action tracking
    action = Column(String(100), nullable=False)  # viewed, edited, deleted, approved
    resource_type = Column(String(100), nullable=False)  # what was accessed
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Details
    action_details = Column(JSON, nullable=True)
    changes_made = Column(JSON, nullable=True)
    
    # Access info
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<RoleAuditLog {self.role} - {self.action}>"


class RoleReview(Base):
    """Reviews and ratings for professionals"""
    __tablename__ = "role_reviews"
    __table_args__ = (
        Index("idx_professional_id", "professional_id"),
        Index("idx_reviewer_id", "reviewer_id"),
        Index("idx_rating", "rating"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Parties
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("escrow.id"), nullable=True)
    
    # Review content
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255), nullable=True)
    comment = Column(Text, nullable=True)
    
    # Aspects
    professionalism = Column(Integer, nullable=True)  # 1-5
    communication = Column(Integer, nullable=True)  # 1-5
    reliability = Column(Integer, nullable=True)  # 1-5
    value_for_money = Column(Integer, nullable=True)  # 1-5
    
    # Visibility
    is_verified_transaction = Column(Boolean, default=False, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)
    
    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<RoleReview {self.rating} stars>"
