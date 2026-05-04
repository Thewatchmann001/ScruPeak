import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models import UserRole, UserStatus
import enum

class RoleApplication(Base):
    __tablename__ = "role_applications"
    __table_args__ = (
        Index('idx_role_app_user_id', 'user_id'),
        Index('idx_role_app_status', 'status'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    requested_role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False)

    # JSON field for supporting documents (URLs, metadata)
    documents = Column(JSON, default=dict)

    # Optional geospatial data for landowners
    geospatial_data = Column(JSON, nullable=True)

    rejection_reason = Column(String(500), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
