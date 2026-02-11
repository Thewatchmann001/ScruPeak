from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
from typing import List

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models import User, UserRole, Land, LandStatus
from app.models.taxation import TaxAssessment, TaxStatus, TaxType
from app.services.tax_service import TaxService
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/tax", tags=["taxation"])

class TaxAssessmentResponse(BaseModel):
    id: str
    land_id: str
    tax_type: str
    amount_due: float
    status: str
    due_date: datetime
    
    class Config:
        from_attributes = True

@router.post("/assess/{land_id}", response_model=TaxAssessmentResponse)
async def trigger_tax_assessment(
    land_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger an immediate tax assessment (Admin or Owner)"""
    # 1. Fetch Land
    result = await db.execute(select(Land).where(Land.id == land_id))
    land = result.scalars().first()
    
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
        
    # 2. Check Permissions
    if current_user.role != UserRole.ADMIN and current_user.id != land.owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # 3. Generate Assessment (Ground Rent for now)
    assessment = await TaxService.generate_annual_ground_rent(db, land)
    
    return assessment

@router.get("/land/{land_id}", response_model=List[TaxAssessmentResponse])
async def get_land_taxes(
    land_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tax assessments for a land parcel"""
    # Check if user is owner or admin or agent
    # ... logic ...
    
    stmt = select(TaxAssessment).where(TaxAssessment.land_id == land_id)
    result = await db.execute(stmt)
    assessments = result.scalars().all()
    
    return assessments

@router.post("/pay/{assessment_id}")
async def pay_tax(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark tax as paid (Mock payment integration)"""
    stmt = select(TaxAssessment).where(TaxAssessment.id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    if assessment.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to pay this tax")
         
    assessment.status = TaxStatus.PAID
    assessment.paid_at = datetime.utcnow()
    assessment.payment_reference = f"MOCK-PAY-{datetime.utcnow().timestamp()}"
    
    await db.commit()
    
    # Unlock land if it was locked
    result = await db.execute(select(Land).where(Land.id == assessment.land_id))
    land = result.scalars().first()
    if land and land.status == LandStatus.LOCKED_FOR_TAX:
        land.status = LandStatus.AVAILABLE
        await db.commit()
        
    return {"status": "paid", "reference": assessment.payment_reference}
