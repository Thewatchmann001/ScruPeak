"""
SQLAlchemy ORM Models - 12 tables optimized for 20M+ users
Includes proper indexing, relationships, and performance optimizations
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, 
    ForeignKey, Enum, JSON, Index, UniqueConstraint, CheckConstraint,
    TIMESTAMP, func, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
import enum
import ulid as ulid_pkg

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles in the system"""
    BUYER = "buyer"
    OWNER = "owner"
    AGENT = "agent"
    ADMIN = "admin"


class LandStatus(str, enum.Enum):
    """Land property status"""
    AVAILABLE = "available"
    PENDING = "pending"
    SOLD = "sold"
    DISPUTED = "disputed"
    PENDING_APPROVAL = "pending_approval"
    REJECTED = "rejected"


class DocumentType(str, enum.Enum):
    """Types of documents"""
    TITLE_DEED = "title_deed"
    SURVEY_REPORT = "survey_report"
    TAX_CERTIFICATE = "tax_certificate"
    GOVERNMENT_ID = "government_id"
    OTHER = "other"


class EscrowStatus(str, enum.Enum):
    """Escrow transaction status"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


from app.models.registry import LandClassification, Parcel, SpatialGrid

# ============================================================================
# USER MODEL
# ============================================================================

class User(Base):
    """User model - optimized for 20M+ users"""
    __tablename__ = "users"
    __table_args__ = (
        Index('idx_users_email', 'email', unique=True),
        Index('idx_users_role', 'role'),
        Index('idx_users_kyc_verified', 'kyc_verified'),
        Index('idx_users_created_at', 'created_at'),
        # CheckConstraint("email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'", 
        #                name='email_format_check'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.BUYER, nullable=False, index=True)
    kyc_verified = Column(Boolean, default=False, index=True)
    kyc_verified_at = Column(DateTime)
    email_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True, index=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lands = relationship("Land", back_populates="owner", foreign_keys="Land.owner_id")
    documents = relationship("Document", back_populates="owner")
    sent_messages = relationship("ChatMessage", back_populates="sender", foreign_keys="ChatMessage.sender_id")
    agent_profile = relationship("Agent", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")


# ============================================================================
# LAND MODEL
# ============================================================================

class Land(Base):
    """Land property model - optimized for geographic queries"""
    __tablename__ = "land"
    __table_args__ = (
        Index('idx_land_owner_id', 'owner_id'),
        Index('idx_land_status', 'status'),
        Index('idx_land_created_at', 'created_at'),
        # Index('idx_land_location', 'location', postgresql_using='gist'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ulid = Column(String(26), default=lambda: str(ulid_pkg.ULID()), unique=True, index=True)
    parcel_id = Column(String(50), unique=True, index=True)  # New Smart ID
    grid_id = Column(String(20), index=True)  # For spatial grouping
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text)
    size_sqm = Column(Numeric(15, 2), nullable=False)  # Square meters
    price = Column(Numeric(18, 2))  # Price in currency
    status = Column(Enum(LandStatus), default=LandStatus.AVAILABLE, nullable=False, index=True)
    
    # Geographic data (optimized for spatial queries)
    location = Column(Geometry('POINT', srid=4326), nullable=False, index=True)  # Main location
    boundary = Column(Geometry('POLYGON', srid=4326))  # Property boundary
    
    # Blockchain
    blockchain_hash = Column(String(255), index=True)  # Document hash on Solana
    blockchain_verified = Column(Boolean, default=False)
    blockchain_verified_at = Column(DateTime)
    
    # Approval Workflow
    has_survey_plan = Column(Boolean, default=False)
    has_chief_letter = Column(Boolean, default=False)
    has_agreement = Column(Boolean, default=False)
    has_photo = Column(Boolean, default=False)  # NEW: Land photo requirement
    spousal_consent = Column(Boolean, default=False)  # NEW: Spousal consent flag
    surveyor_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)  # NEW: Licensed surveyor
    
    approved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    rejection_reason = Column(Text)
    approval_date = Column(DateTime)
    
    # Metadata
    latitude = Column(Float)
    longitude = Column(Float)
    region = Column(String(100), index=True)
    district = Column(String(100), index=True)
    
    # Trust Score Factor (New)
    trust_score = Column(Float, default=0.0)
    trust_rating = Column(String(50))
    trust_factors = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="lands", foreign_keys=[owner_id])
    documents = relationship("Document", back_populates="land", cascade="all, delete-orphan")
    escrows = relationship("Escrow", back_populates="land", cascade="all, delete-orphan")
    ownership_history = relationship("OwnershipHistory", back_populates="land", cascade="all, delete-orphan")
    title_verifications = relationship("TitleVerification", back_populates="land", cascade="all, delete-orphan")


# ============================================================================
# DOCUMENT MODEL
# ============================================================================

class Document(Base):
    """Document model - for land verification"""
    __tablename__ = "documents"
    __table_args__ = (
        Index('idx_documents_land_id', 'land_id'),
        Index('idx_documents_document_type', 'document_type'),
        Index('idx_documents_verified_at', 'verified_at'),
        Index('idx_documents_ai_fraud_score', 'ai_fraud_score'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    land_id = Column(UUID(as_uuid=True), ForeignKey('land.id', ondelete='CASCADE'), nullable=False, index=True)
    document_type = Column(Enum(DocumentType), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    file_hash = Column(String(255), unique=True, index=True)  # SHA256 hash
    file_size = Column(Integer)  # Bytes
    
    # AI Fraud Detection
    ai_fraud_score = Column(Float)  # 0.0 - 1.0 (0=legitimate, 1=fraud)
    ai_fraud_details = Column(JSON)  # Details from AI analysis
    ai_processed_at = Column(DateTime)
    
    # Verification
    verified_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    verified_at = Column(DateTime, index=True)
    verification_notes = Column(Text)
    
    # Blockchain
    blockchain_hash = Column(String(255), index=True)
    blockchain_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    land = relationship("Land", back_populates="documents")
    owner = relationship("User", back_populates="documents", foreign_keys=[verified_by])


# ============================================================================
# ESCROW MODEL
# ============================================================================

class Escrow(Base):
    """Escrow payment model - holds funds safely during transaction"""
    __tablename__ = "escrow"
    __table_args__ = (
        Index('idx_escrow_land_id', 'land_id'),
        Index('idx_escrow_buyer_id', 'buyer_id'),
        Index('idx_escrow_seller_id', 'seller_id'),
        Index('idx_escrow_status', 'status'),
        UniqueConstraint('land_id', 'buyer_id', name='uq_escrow_land_buyer'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    land_id = Column(UUID(as_uuid=True), ForeignKey('land.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    amount = Column(Numeric(18, 2), nullable=False)
    status = Column(Enum(EscrowStatus), default=EscrowStatus.PENDING, nullable=False, index=True)
    
    # Blockchain
    escrow_contract_address = Column(String(255), index=True)  # Solana contract
    transaction_signature = Column(String(255), unique=True, index=True)  # Solana tx signature
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    activated_at = Column(DateTime)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    land = relationship("Land", back_populates="escrows")


# ============================================================================
# CHAT MESSAGE MODEL
# ============================================================================

class ChatMessage(Base):
    """Chat messages with Jems AI fraud detection and blockchain anchoring"""
    __tablename__ = "chat_messages"
    __table_args__ = (
        Index('idx_chat_messages_chat_id', 'chat_id'),
        Index('idx_chat_messages_sender_id', 'sender_id'),
        Index('idx_chat_messages_land_ulid', 'land_ulid'),
        Index('idx_chat_messages_created_at', 'created_at'),
        Index('idx_chat_messages_fraud_alert', 'fraud_alert'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    chat_id = Column(String(100), nullable=False, index=True)
    land_ulid = Column(String(26), ForeignKey('land.ulid'), nullable=True, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    message = Column(Text, nullable=False)
    attachments = Column(JSON, default=list)
    read_by = Column(JSON, default=list)
    
    # Jems AI Oversight
    contains_external_link = Column(Boolean, default=False, index=True)
    contains_phone = Column(Boolean, default=False)
    fraud_alert = Column(Boolean, default=False, index=True)
    fraud_reason = Column(String(255))
    
    # Blockchain Anchoring
    blockchain_tx_signature = Column(String(255), unique=True, index=True)
    blockchain_timestamp = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])


# ============================================================================
# OWNERSHIP HISTORY MODEL
# ============================================================================

class OwnershipHistory(Base):
    """Track ownership changes over time"""
    __tablename__ = "ownership_history"
    __table_args__ = (
        Index('idx_ownership_history_land_id', 'land_id'),
        Index('idx_ownership_history_transfer_date', 'transfer_date'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    land_id = Column(UUID(as_uuid=True), ForeignKey('land.id', ondelete='CASCADE'), nullable=False, index=True)
    previous_owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), index=True)
    new_owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), index=True)
    
    transfer_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    blockchain_tx = Column(String(255), unique=True, index=True)
    public_summary = Column(String(500))
    
    # Relationships
    land = relationship("Land", back_populates="ownership_history")


# ============================================================================
# AGENT MODEL
# ============================================================================

class Agent(Base):
    """Real estate agents with verification"""
    __tablename__ = "agents"
    __table_args__ = (
        Index('idx_agents_user_id', 'user_id', unique=True),
        Index('idx_agents_verified', 'platform_verified'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    
    # Ministry registration
    ministry_registered = Column(Boolean, default=False)
    ministry_registration_number = Column(String(100), unique=True, nullable=True)
    
    # Platform verification
    platform_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime)
    
    # Wallet for blockchain
    wallet_address = Column(String(100), unique=True, nullable=True)
    
    # Stats
    transactions_completed = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="agent_profile", foreign_keys=[user_id])


# ============================================================================
# NOTIFICATION MODEL
# ============================================================================

class Notification(Base):
    """User notifications"""
    __tablename__ = "notifications"
    __table_args__ = (
        Index('idx_notifications_user_id', 'user_id'),
        Index('idx_notifications_read', 'is_read'),
        Index('idx_notifications_created_at', 'created_at'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50))  # fraud_alert, offer_received, etc.
    related_id = Column(UUID(as_uuid=True))  # ID of related entity (land, escrow, etc.)
    is_read = Column(Boolean, default=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    read_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="notifications")


# Import TitleVerification to ensure relationship is mapped
# This must be imported after Land model is defined but before application startup
from app.models.title_verification import TitleVerification
from app.models.advanced_registry import CadastralHistory, Encumbrance, Surveyor
from app.models.taxation import TaxAssessment
from app.models.digital_signatures import (
    DocumentSignatureRequest, SignatureField, SignatureResponse, SignatureAuditTrail,
    SignatureTemplate, SignatureCertificate
)

# ============================================================================
# PAYMENT TRANSACTION MODEL
# ============================================================================

class PaymentTransaction(Base):
    """Payment transaction tracking"""
    __tablename__ = "payment_transactions"
    __table_args__ = (
        Index('idx_payment_transactions_escrow_id', 'escrow_id'),
        Index('idx_payment_transactions_status', 'status'),
        Index('idx_payment_transactions_created_at', 'created_at'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey('escrow.id'), nullable=False, index=True)
    amount = Column(Numeric(18, 2), nullable=False)
    payment_method = Column(String(50))  # bank_transfer, card, crypto
    status = Column(String(50), default='pending', index=True)  # pending, completed, failed
    currency = Column(String(3), default="SLE", index=True)
    blockchain_tx = Column(String(255), unique=True, index=True)
    reference_number = Column(String(100), unique=True, index=True)
    provider_reference = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# AUDIT LOG MODEL
# ============================================================================

class AuditLog(Base):
    """Comprehensive audit trail for compliance"""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index('idx_audit_logs_user_id', 'user_id'),
        Index('idx_audit_logs_action', 'action'),
        Index('idx_audit_logs_created_at', 'created_at'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), index=True)
    action = Column(String(100), nullable=False, index=True)  # create, update, delete, login
    resource_type = Column(String(50))  # User, Land, Document, etc.
    resource_id = Column(UUID(as_uuid=True))
    changes = Column(JSON)  # What changed
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(String(500))
    status = Column(String(50))  # success, failed
    error_message = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


# ============================================================================
# KYC SUBMISSION MODEL
# ============================================================================

class KycStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class KycSubmission(Base):
    __tablename__ = "kyc_submissions"
    __table_args__ = (
        Index('idx_kyc_user_id', 'user_id'),
        Index('idx_kyc_status', 'status'),
        Index('idx_kyc_created_at', 'created_at'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    status = Column(Enum(KycStatus), default=KycStatus.PENDING, nullable=False, index=True)
    documents = Column(JSON)
    notes = Column(Text)
    
    # Risk & AML
    risk_rating = Column(String(50), default="low")  # low, medium, high
    aml_checked = Column(Boolean, default=False)
    aml_check_date = Column(DateTime)
    
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    rejection_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    reviewed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
