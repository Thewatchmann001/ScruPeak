from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.models.agent_application import ApplicationStatus

class AgentApplicationCreate(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    years_experience: int = 0
    license_number: Optional[str] = None
    operating_districts: List[str] = []
    bio: Optional[str] = None
    id_document_type: Optional[str] = None
    id_document_number: Optional[str] = None

class AgentApplicationResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: str
    years_experience: int
    license_number: Optional[str]
    operating_districts: List[str]
    bio: Optional[str]
    status: ApplicationStatus
    created_at: datetime
    reviewed_at: Optional[datetime]

    class Config:
        from_attributes = True
