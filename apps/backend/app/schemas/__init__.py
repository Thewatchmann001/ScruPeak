"""
Pydantic schemas for request/response validation
Optimized for FastAPI documentation and type safety
"""
from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from decimal import Decimal

from app.models import UserRole, LandStatus, DocumentType, EscrowStatus


# ============================================================================
# PAGINATION SCHEMAS
# ============================================================================

class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "page_size": 20
            }
        }


class PaginatedResponse(BaseModel):
    """Generic paginated response wrapper"""
    total: int = Field(description="Total items count")
    page: int = Field(description="Current page")
    page_size: int = Field(description="Items per page")
    total_pages: int = Field(description="Total pages")
    items: List[Any] = Field(description="Page items")
    has_next: bool = Field(description="Has next page")
    has_prev: bool = Field(description="Has previous page")

    class Config:
        from_attributes = True

# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "name": "John Doe",
                "phone": "+234801234567"
            }
        }


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=100, description="Password (min 8 chars)")
    role: UserRole = Field(default=UserRole.BUYER)
    
    @validator('password')
    def validate_password(cls, v):
        """Ensure password has complexity"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """User response schema"""
    id: UUID
    role: UserRole
    kyc_verified: bool
    kyc_verified_at: Optional[datetime]
    has_pending_agent_application: Optional[bool] = False
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "name": "John Doe",
                "role": "buyer",
                "kyc_verified": False,
                "created_at": "2024-01-01T00:00:00"
            }
        }


# ============================================================================
# LAND SCHEMAS
# ============================================================================

class LocationSchema(BaseModel):
    """Geographic location"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class LandBase(BaseModel):
    """Base land schema"""
    title: str = Field(..., min_length=5, max_length=500)
    description: Optional[str] = None
    size_sqm: Decimal = Field(..., gt=0, decimal_places=2)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    region: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    
    # Required documents checklist
    has_survey_plan: bool = False
    has_chief_letter: bool = False
    has_agreement: bool = False
    document_chain_depth: int = 1
    spousal_consent: bool = False  # NEW
    surveyor_id: Optional[UUID] = None  # NEW
    is_public: bool = True


class LandCreate(LandBase):
    """Land creation schema"""
    location: Optional[LocationSchema] = None
    
    @root_validator(pre=True)
    def unpack_location(cls, values):
        # Allow creating with nested location for backward compatibility
        loc = values.get('location')
        if loc:
            if isinstance(loc, dict):
                values['latitude'] = loc.get('latitude')
                values['longitude'] = loc.get('longitude')
            else:
                values['latitude'] = loc.latitude
                values['longitude'] = loc.longitude
        return values


class LandUpdate(BaseModel):
    """Land update schema"""
    title: Optional[str] = Field(None, min_length=5, max_length=500)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    status: Optional[LandStatus] = None


class LandResponse(LandBase):
    """Land response schema"""
    id: UUID
    ulid: Optional[str] = None
    parcel_id: Optional[str] = None
    grid_id: Optional[str] = None
    owner_id: UUID
    status: LandStatus
    is_public: bool
    document_chain_depth: int
    blockchain_verified: bool
    blockchain_hash: Optional[str]

    # Trust Score details
    trust_score: float = 0.0
    trust_rating: Optional[str] = None
    trust_factors: Optional[dict] = None

    created_at: datetime
    updated_at: datetime
    
    # Approval details
    approved_by: Optional[UUID] = None
    rejection_reason: Optional[str] = None
    approval_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LandDetailResponse(LandResponse):
    """Detailed land response with relationships"""
    documents: Optional[List['DocumentResponse']] = []
    ownership_history: Optional[List['OwnershipHistoryResponse']] = []

class LandPaginatedResponse(PaginatedResponse):
    items: List[LandResponse]


# ============================================================================
# DOCUMENT SCHEMAS
# ============================================================================

class DocumentCreate(BaseModel):
    """Document creation schema"""
    land_id: UUID
    document_type: DocumentType = Field(..., description="Type of document")
    file_url: str = Field(..., description="URL to document file")


class DocumentResponse(BaseModel):
    """Document response schema"""
    id: UUID
    land_id: UUID
    document_type: DocumentType
    file_url: str
    file_hash: Optional[str]
    ai_fraud_score: Optional[float] = Field(None, ge=0, le=1, description="0=legitimate, 1=fraud")
    ai_fraud_details: Optional[dict] = None
    verified_at: Optional[datetime]
    blockchain_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# ESCROW SCHEMAS
# ============================================================================

class EscrowCreate(BaseModel):
    """Escrow creation schema"""
    land_id: UUID
    seller_id: UUID
    amount: Decimal = Field(..., gt=0, decimal_places=2)


class EscrowUpdate(BaseModel):
    """Escrow update schema"""
    status: Optional[EscrowStatus] = None


class EscrowResponse(BaseModel):
    """Escrow response schema"""
    id: UUID
    land_id: UUID
    buyer_id: UUID
    seller_id: UUID
    amount: Decimal
    status: EscrowStatus
    escrow_contract_address: Optional[str]
    transaction_signature: Optional[str]
    created_at: datetime
    activated_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# CHAT MESSAGE SCHEMAS
# ============================================================================

class ChatMessageCreate(BaseModel):
    """Chat message creation schema"""
    chat_id: str = Field(..., min_length=1, max_length=100)
    land_ulid: Optional[str] = Field(None, min_length=26, max_length=26)
    message: str = Field(..., min_length=1, max_length=5000)
    attachments: Optional[List[str]] = []


class ChatMessageResponse(BaseModel):
    """Chat message response schema"""
    id: UUID
    chat_id: str
    sender_id: UUID
    message: str
    fraud_alert: bool
    fraud_reason: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# AGENT SCHEMAS
# ============================================================================

class AgentCreate(BaseModel):
    """Agent profile creation"""
    ministry_registration_number: Optional[str] = None
    wallet_address: Optional[str] = None


class AgentResponse(BaseModel):
    """Agent response schema"""
    id: UUID
    user_id: UUID
    ministry_registered: bool
    platform_verified: bool
    verified_at: Optional[datetime]
    transactions_completed: int
    rating: float = Field(ge=0, le=5)
    
    class Config:
        from_attributes = True


# ============================================================================
# OWNERSHIP HISTORY SCHEMAS
# ============================================================================

class OwnershipHistoryResponse(BaseModel):
    """Ownership history response"""
    id: UUID
    land_id: UUID
    previous_owner_id: Optional[UUID]
    new_owner_id: Optional[UUID]
    transfer_date: datetime
    blockchain_tx: Optional[str]
    public_summary: Optional[str]
    
    class Config:
        from_attributes = True


# ============================================================================
# NOTIFICATION SCHEMAS
# ============================================================================

class NotificationResponse(BaseModel):
    """Notification response"""
    id: UUID


# ============================================================================
# MARKET ANALYTICS SCHEMAS
# ============================================================================

class DistrictStats(BaseModel):
    """Statistics for a specific district"""
    district: str
    avg_price: float
    listing_count: int
    trend_percent: float = 0.0

class MarketTrend(BaseModel):
    """Monthly market trend data"""
    month: str
    avg_price: float
    listing_volume: int

class MarketInsightsResponse(BaseModel):
    """Aggregated market insights response"""
    district_stats: List[DistrictStats]
    price_trends: List[MarketTrend]
    total_listings: int
    active_listings: int
    sold_listings: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# AUTHENTICATION SCHEMAS
# ============================================================================

class TokenRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(default=1800, description="Seconds until expiry")
    user: UserResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    new_password: str = Field(..., min_length=8)


# ============================================================================
# ERROR SCHEMAS
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    status_code: int
    message: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    path: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status_code": 400,
                "message": "Validation error",
                "detail": "Invalid email format",
                "timestamp": "2024-01-01T00:00:00"
            }
        }


class ValidationErrorResponse(ErrorResponse):
    """Validation error response with field details"""
    errors: List[dict] = Field(default=[], description="Field validation errors")


# ============================================================================
# HEALTH CHECK SCHEMAS
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str
    dependencies: dict = Field(
        default={
            "database": "unknown",
            "redis": "unknown"
        }
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "dependencies": {
                    "database": "connected",
                    "redis": "connected"
                }
            }
        }


# ============================================================================
# SEARCH/FILTER SCHEMAS
# ============================================================================

class LandSearchFilters(BaseModel):
    """Land search filters"""
    status: Optional[LandStatus] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    min_size: Optional[Decimal] = None
    max_size: Optional[Decimal] = None
    region: Optional[str] = None
    district: Optional[str] = None
    verified_only: bool = False


class SearchResponse(BaseModel):
    """Search response wrapper"""
    total_results: int
    page: int
    results: List[Any]

