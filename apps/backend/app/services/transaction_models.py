from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship, declarative_base
from enum import Enum

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    wallet_address = Column(String, nullable=True) # Solana/EVM wallet address
    # Simplified for MVP

    lands_owned = relationship("Land", back_populates="owner")
    escrows_as_buyer = relationship("Escrow", foreign_keys="[Escrow.buyer_id]", back_populates="buyer")
    escrows_as_seller = relationship("Escrow", foreign_keys="[Escrow.seller_id]", back_populates="seller")

class LandStatus(str, Enum):
    AVAILABLE = "available"
    PENDING_SALE = "pending_sale"
    LOCKED_FOR_TAX = "locked_for_tax"
    PENDING_APPROVALS = "pending_approvals"
    SOLD = "sold"

class Land(Base):
    __tablename__ = "lands"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    price = Column(Float, nullable=False)
    size_sqm = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, default=LandStatus.AVAILABLE.value, nullable=False)
    is_oarg_approved = Column(Boolean, default=False) # Simulated OARG approval
    is_ministry_approved = Column(Boolean, default=False) # Simulated Ministry approval
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="lands_owned")
    escrows = relationship("Escrow", back_populates="land")

class EscrowStatus(str, Enum):
    PENDING = "pending"
    FUNDED = "funded"
    PENDING_APPROVALS = "pending_approvals"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Escrow(Base):
    __tablename__ = "escrows"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    land_id = Column(PG_UUID(as_uuid=True), ForeignKey("lands.id"), nullable=False)
    buyer_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seller_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False) # Total amount including taxes
    status = Column(String, default=EscrowStatus.PENDING.value, nullable=False)
    monime_checkout_id = Column(String, nullable=True)
    monime_account_id = Column(String, nullable=True) # Monime internal account for escrow
    platform_fee_amount = Column(Float, default=0.0)
    seller_payout_amount = Column(Float, default=0.0)
    tax_assessment_id = Column(PG_UUID(as_uuid=True), ForeignKey("tax_assessments.id"), nullable=True)
    blockchain_tx_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    land = relationship("Land", back_populates="escrows")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="escrows_as_buyer")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="escrows_as_seller")
    payments = relationship("PaymentTransaction", back_populates="escrow")
    tax_assessment = relationship("TaxAssessment")

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentType(str, Enum):
    CHECKOUT = "checkout"
    PAYOUT = "payout"
    REFUND = "refund"

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    escrow_id = Column(PG_UUID(as_uuid=True), ForeignKey("escrows.id"), nullable=False)
    monime_transaction_id = Column(String, unique=True, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    status = Column(String, default=PaymentStatus.PENDING.value, nullable=False)
    payment_type = Column(String, default=PaymentType.CHECKOUT.value, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    escrow = relationship("Escrow", back_populates="payments")

# Assuming app/models/taxation.py defines TaxAssessment, TaxType, TaxStatus
# For simplicity, I'll define a minimal TaxAssessment here if it's not in context
class TaxAssessment(Base): # Minimal definition if not already in app/models/taxation.py
    __tablename__ = "tax_assessments"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    land_id = Column(PG_UUID(as_uuid=True), ForeignKey("lands.id"), nullable=False)
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tax_type = Column(String, nullable=False) # e.g., "STAMP_DUTY", "GROUND_RENT"
    amount_due = Column(Float, nullable=False)
    status = Column(String, nullable=False) # e.g., "PENDING", "PAID", "OVERDUE"
    due_date = Column(DateTime, nullable=False)
    generated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)