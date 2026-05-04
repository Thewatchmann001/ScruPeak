import enum

class UserStatus(str, enum.Enum):
    """User verification status"""
    UNVERIFIED = "unverified"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"


class UserRole(str, enum.Enum):
    """User roles in the system"""
    BUYER = "buyer"
    OWNER = "owner"
    AGENT = "agent"
    ADMIN = "admin"
    SELLER = "seller"

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
