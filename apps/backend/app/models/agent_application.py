import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AgentApplication(Base):
    __tablename__ = "agent_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=True)  # Privy user ID
    full_name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(200), nullable=False)
    years_experience = Column(Integer, default=0)
    license_number = Column(String(100), nullable=True)
    operating_districts = Column(JSON, default=list)
    bio = Column(Text, nullable=True)
    id_document_type = Column(String(50), nullable=True)
    id_document_number = Column(String(100), nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    reviewed_by = Column(String(200), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
