"""
Digital Signatures System
Legal digital signing for land transactions
Supports DocuSign, SignNow, and native implementations
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Enum, JSON, Text, LargeBinary, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class SignatureProvider(str, enum.Enum):
    """Digital signature service providers"""
    DOCUSIGN = "docusign"
    SIGNNOW = "signnow"
    NATIVE = "native"
    HELLOSIGN = "hellosign"


class DocumentSignatureStatus(str, enum.Enum):
    """Signature request status"""
    CREATED = "created"
    SENT = "sent"
    VIEWED = "viewed"
    SIGNED = "signed"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class SignatureFieldType(str, enum.Enum):
    """Types of signature fields"""
    SIGNATURE = "signature"
    INITIALS = "initials"
    CHECKBOX = "checkbox"
    RADIO = "radio"
    TEXT = "text"
    DATE = "date"


class DocumentSignatureRequest(Base):
    """Main signature request document"""
    __tablename__ = "document_signature_requests"
    __table_args__ = (
        Index("idx_dsr_document_id", "document_id"),
        Index("idx_dsr_status", "status"),
        Index("idx_dsr_created_at", "created_at"),
        Index("idx_dsr_expires_at", "expires_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("escrow.id"), nullable=True)
    
    # Document metadata
    document_name = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False)  # settlement_agreement, title_transfer, etc.
    
    # Signature workflow
    status = Column(Enum(DocumentSignatureStatus), default=DocumentSignatureStatus.CREATED, nullable=False)
    provider = Column(Enum(SignatureProvider), default=SignatureProvider.NATIVE, nullable=False)
    provider_request_id = Column(String(255), nullable=True)  # External provider reference
    
    # Recipients
    signers_count = Column(Integer, default=1, nullable=False)
    signed_count = Column(Integer, default=0, nullable=False)
    
    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    first_viewed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Additional metadata
    template_id = Column(String(255), nullable=True)
    email_subject = Column(String(255), nullable=True)
    email_message = Column(Text, nullable=True)
    require_all_signatures = Column(Boolean, default=True, nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    
    # Extra data
    request_metadata = Column(JSON, nullable=True)  # Custom fields
    
    def __repr__(self):
        return f"<DocumentSignatureRequest {self.id} - {self.document_type} ({self.status})>"


class SignatureField(Base):
    """Individual signature fields on a document"""
    __tablename__ = "signature_fields"
    __table_args__ = (
        Index("idx_sf_request_id", "request_id"),
        Index("idx_sf_signer_id", "signer_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("document_signature_requests.id"), nullable=False)
    
    # Field positioning and metadata
    page_number = Column(Integer, nullable=False)
    x_coordinate = Column(Integer, nullable=False)  # x position on page
    y_coordinate = Column(Integer, nullable=False)  # y position on page
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    
    # Field configuration
    field_type = Column(Enum(SignatureFieldType), default=SignatureFieldType.SIGNATURE, nullable=False)
    field_name = Column(String(255), nullable=False)
    required = Column(Boolean, default=True, nullable=False)
    
    # Signer assignment
    signer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    signer_index = Column(Integer, nullable=False)  # Order of signing
    
    # Completion status
    is_signed = Column(Boolean, default=False, nullable=False)
    signed_at = Column(DateTime, nullable=True)
    signed_value = Column(String, nullable=True)  # Base64 signature/initial/value
    
    # Tab properties for external providers
    tab_id = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SignatureField {self.field_name} - Signer {self.signer_index}>"


class SignatureResponse(Base):
    """Individual signer response to signature request"""
    __tablename__ = "signature_responses"
    __table_args__ = (
        Index("idx_sr_request_id", "request_id"),
        Index("idx_sr_signer_id", "signer_id"),
        Index("idx_sr_status", "status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("document_signature_requests.id"), nullable=False)
    signer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Response status
    status = Column(Enum(DocumentSignatureStatus), default=DocumentSignatureStatus.CREATED, nullable=False)
    
    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    viewed_at = Column(DateTime, nullable=True)
    signed_at = Column(DateTime, nullable=True)
    
    # Signer info at time of signing
    signer_email = Column(String(255), nullable=False)
    signer_ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    signer_user_agent = Column(String(512), nullable=True)
    
    # Rejection reason
    rejection_reason = Column(Text, nullable=True)
    rejection_at = Column(DateTime, nullable=True)
    
    # Signature metadata
    all_fields_signed = Column(Boolean, default=False, nullable=False)
    signed_field_count = Column(Integer, default=0, nullable=False)
    
    response_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<SignatureResponse {self.id} - {self.status}>"


class SignatureAuditTrail(Base):
    """Audit trail for all signature-related actions"""
    __tablename__ = "signature_audit_trails"
    __table_args__ = (
        Index("idx_sat_request_id", "request_id"),
        Index("idx_sat_action", "action"),
        Index("idx_sat_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("document_signature_requests.id"), nullable=False)
    
    # Action logging
    action = Column(String(100), nullable=False)  # Created, Sent, Viewed, Signed, Rejected, etc.
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    actor_email = Column(String(255), nullable=False)
    actor_ip_address = Column(String(45), nullable=True)
    
    # Action details
    details = Column(JSON, nullable=True)
    change_description = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SignatureAuditTrail {self.action} - {self.created_at}>"


class SignatureTemplate(Base):
    """Reusable signature templates for common document types"""
    __tablename__ = "signature_templates"
    __table_args__ = (
        Index("idx_template_type", "template_type"),
        Index("idx_is_active", "is_active"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template metadata
    name = Column(String(255), nullable=False)
    template_type = Column(String(100), nullable=False)  # settlement_agreement, title_transfer, etc.
    description = Column(Text, nullable=True)
    
    # Template configuration
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Field definitions (JSON array of field configs)
    field_definitions = Column(JSON, nullable=False)
    
    # Email templates
    email_subject = Column(String(255), nullable=True)
    email_message = Column(Text, nullable=True)
    
    # Signer roles
    signer_roles = Column(JSON, nullable=False)  # Array of role names and order
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SignatureTemplate {self.name}>"


class SignatureCertificate(Base):
    """Certificate proving signature validity and authenticity"""
    __tablename__ = "signature_certificates"
    __table_args__ = (
        Index("idx_sc_request_id", "request_id"),
        Index("idx_sc_issued_at", "issued_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("document_signature_requests.id"), nullable=False)
    
    # Certificate data
    certificate_number = Column(String(100), nullable=False, unique=True)
    certificate_hash = Column(String(255), nullable=False)  # SHA-256 of document
    
    # Verification data
    all_signed = Column(Boolean, default=False, nullable=False)
    completion_percentage = Column(Integer, default=0, nullable=False)
    
    # Signer information (JSON)
    signers_info = Column(JSON, nullable=False)
    
    # Certificate validity
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Storage
    certificate_data = Column(LargeBinary, nullable=True)  # PDF certificate
    certificate_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<SignatureCertificate {self.certificate_number}>"
