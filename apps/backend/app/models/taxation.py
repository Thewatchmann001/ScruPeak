from sqlalchemy import (
    Column, String, Float, Boolean, DateTime, ForeignKey, Enum, Text, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime

from app.core.database import Base

class TaxType(str, enum.Enum):
    STAMP_DUTY = "stamp_duty"
    GROUND_RENT = "ground_rent"
    CAPITAL_GAINS = "capital_gains"
    TRANSFER_TAX = "transfer_tax"

class TaxStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    WAIVED = "waived"

class TaxAssessment(Base):
    """Tax assessment for land properties"""
    __tablename__ = "tax_assessments"
    __table_args__ = (
        Index("idx_tax_land_id", "land_id"),
        Index("idx_tax_status", "status"),
        Index("idx_tax_owner_id", "owner_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    land_id = Column(UUID(as_uuid=True), ForeignKey("land.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    tax_type = Column(Enum(TaxType), nullable=False)
    fiscal_year = Column(String(4), nullable=False) # e.g., "2024"
    
    assessed_value = Column(Float, nullable=False) # The value of land used for calculation
    tax_rate = Column(Float, nullable=False) # Percentage
    amount_due = Column(Float, nullable=False)
    
    status = Column(Enum(TaxStatus), default=TaxStatus.PENDING, nullable=False)
    due_date = Column(DateTime, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    payment_reference = Column(String(100), nullable=True) # Link to PaymentTransaction
    
    generated_by = Column(String(50), default="system") # system or manual
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    land = relationship("Land", backref="tax_assessments")
    owner = relationship("User", backref="tax_obligations")
