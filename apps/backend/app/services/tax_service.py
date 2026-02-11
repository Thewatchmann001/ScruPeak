import logging
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models import Land, LandStatus
from app.models.taxation import TaxAssessment, TaxType, TaxStatus

logger = logging.getLogger(__name__)

class TaxService:
    """
    Service for calculating and managing land taxes (Stamp Duty, Ground Rent)
    """
    
    # Constants for tax calculation (should be in config/DB in real system)
    STAMP_DUTY_RATE = 0.05  # 5% of property value
    GROUND_RENT_PER_SQM = 2.50  # Currency units per sqm per year
    
    @staticmethod
    async def calculate_stamp_duty(price: float) -> float:
        """Calculate Stamp Duty based on property price"""
        return price * TaxService.STAMP_DUTY_RATE
    
    @staticmethod
    async def calculate_ground_rent(size_sqm: float) -> float:
        """Calculate Ground Rent based on size"""
        return size_sqm * TaxService.GROUND_RENT_PER_SQM

    @staticmethod
    async def assess_transfer_tax(
        db: AsyncSession, 
        land_id: UUID, 
        transaction_price: float,
        buyer_id: UUID
    ) -> TaxAssessment:
        """
        Assess Stamp Duty/Transfer Tax upon sale.
        This should be called during the Escrow/Transfer process.
        """
        amount = await TaxService.calculate_stamp_duty(transaction_price)
        
        assessment = TaxAssessment(
            land_id=land_id,
            owner_id=buyer_id,  # Buyer pays stamp duty usually
            tax_type=TaxType.STAMP_DUTY,
            fiscal_year=str(datetime.utcnow().year),
            assessed_value=transaction_price,
            tax_rate=TaxService.STAMP_DUTY_RATE,
            amount_due=amount,
            status=TaxStatus.PENDING,
            due_date=datetime.utcnow() + timedelta(days=30), # 30 days to pay
            generated_by="system_transfer_event"
        )
        
        db.add(assessment)
        await db.commit()
        await db.refresh(assessment)
        
        logger.info(f"Assessed Stamp Duty for Land {land_id}: {amount}")
        return assessment

    @staticmethod
    async def generate_annual_ground_rent(
        db: AsyncSession,
        land: Land
    ) -> Optional[TaxAssessment]:
        """
        Generate annual ground rent for a property.
        """
        # Check if already generated for this year
        current_year = str(datetime.utcnow().year)
        
        stmt = select(TaxAssessment).where(
            and_(
                TaxAssessment.land_id == land.id,
                TaxAssessment.tax_type == TaxType.GROUND_RENT,
                TaxAssessment.fiscal_year == current_year
            )
        )
        result = await db.execute(stmt)
        existing = result.scalars().first()
        
        if existing:
            return existing
            
        amount = await TaxService.calculate_ground_rent(float(land.size_sqm))
        
        assessment = TaxAssessment(
            land_id=land.id,
            owner_id=land.owner_id,
            tax_type=TaxType.GROUND_RENT,
            fiscal_year=current_year,
            assessed_value=float(land.price or 0), # Estimated value
            tax_rate=0.0, # Flat rate per sqm
            amount_due=amount,
            status=TaxStatus.PENDING,
            due_date=datetime(int(current_year), 12, 31), # Due end of year
            generated_by="system_annual_job"
        )
        
        db.add(assessment)
        
        # Lock land if tax is generated? Maybe not immediately.
        # But if overdue, yes.
        
        await db.commit()
        await db.refresh(assessment)
        return assessment

    @staticmethod
    async def check_tax_compliance(db: AsyncSession, land_id: UUID) -> bool:
        """
        Check if land has any overdue taxes.
        Returns True if compliant, False if overdue taxes exist.
        """
        stmt = select(TaxAssessment).where(
            and_(
                TaxAssessment.land_id == land_id,
                TaxAssessment.status == TaxStatus.OVERDUE
            )
        )
        result = await db.execute(stmt)
        overdue = result.scalars().first()
        
        return overdue is None

    @staticmethod
    async def lock_if_non_compliant(db: AsyncSession, land: Land):
        """
        Lock land status if taxes are overdue.
        """
        compliant = await TaxService.check_tax_compliance(db, land.id)
        if not compliant and land.status != LandStatus.LOCKED_FOR_TAX:
            land.status = LandStatus.LOCKED_FOR_TAX
            await db.commit()
            logger.warning(f"Land {land.id} LOCKED due to tax non-compliance")
        elif compliant and land.status == LandStatus.LOCKED_FOR_TAX:
            land.status = LandStatus.AVAILABLE # Or previous status?
            await db.commit()
            logger.info(f"Land {land.id} UNLOCKED (Tax compliant)")
