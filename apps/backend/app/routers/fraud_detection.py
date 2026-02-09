"""
Fraud Detection Router
Endpoints for ML-based fraud analysis and risk assessment
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from datetime import datetime, timedelta
import uuid
import json
from typing import List, Optional

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models import User, Escrow, Land
from app.models.fraud_detection import (
    FraudAnalysis, FraudFlag, PartyRiskProfile, 
    FraudDetectionModel, FraudDetectionLog,
    FraudRiskLevel, FraudPattern
)
from pydantic import BaseModel, Field


# ============= Schemas =============

class FraudFlagResponse(BaseModel):
    id: str
    flag_type: str
    severity: str
    description: str
    evidence: Optional[dict]
    is_resolved: bool
    
    class Config:
        from_attributes = True


class FraudAnalysisResponse(BaseModel):
    id: str
    transaction_id: str
    risk_level: str
    fraud_probability: float
    confidence_score: float
    detected_patterns: Optional[List[str]]
    recommendation: Optional[str]
    buyer_risk_score: float
    seller_risk_score: float
    is_price_anomaly: bool
    is_reviewed: bool
    flags: List[FraudFlagResponse]
    
    class Config:
        from_attributes = True


class PartyRiskProfileResponse(BaseModel):
    id: str
    user_id: str
    overall_risk_score: float
    risk_level: str
    total_transactions: int
    completed_transactions: int
    flagged_transactions: int
    kyc_verified: bool
    aml_screened: bool
    peer_comparison_percentile: Optional[float]
    
    class Config:
        from_attributes = True


class FraudAnalysisRequest(BaseModel):
    transaction_id: str = Field(..., description="Escrow/transaction ID to analyze")
    include_historical: bool = True
    include_market_comparison: bool = True


# ============= Router =============
router = APIRouter(prefix="/api/v1/fraud-detection", tags=["fraud-detection"])


@router.post("/analyze", response_model=FraudAnalysisResponse)
async def analyze_transaction_fraud(
    request: FraudAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze transaction for fraud risk
    Uses ML models to detect suspicious patterns
    """
    try:
        # Get escrow/transaction
        escrow_result = await db.execute(
            select(Escrow).where(Escrow.id == uuid.UUID(request.transaction_id))
        )
        escrow = escrow_result.scalar_one_or_none()
        
        if not escrow:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Check permission - only involved parties or admins can request analysis
        if (current_user.id not in [escrow.buyer_id, escrow.seller_id] and 
            current_user.role != "admin"):
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Check for existing analysis
        existing = await db.execute(
            select(FraudAnalysis)
            .where(FraudAnalysis.transaction_id == uuid.UUID(request.transaction_id))
            .order_by(FraudAnalysis.created_at.desc())
            .limit(1)
        )
        existing_analysis = existing.scalar_one_or_none()
        
        # If analysis is recent (< 1 hour), return it
        if existing_analysis and (datetime.utcnow() - existing_analysis.created_at).seconds < 3600:
            return existing_analysis
        
        # Create new analysis
        analysis = FraudAnalysis(transaction_id=uuid.UUID(request.transaction_id))
        
        # Get land info
        land_result = await db.execute(
            select(Land).where(Land.id == escrow.land_id)
        )
        land = land_result.scalar_one_or_none()
        
        # Run fraud detection algorithms
        fraud_results = await run_fraud_detection(
            escrow, land, db, 
            include_historical=request.include_historical,
            include_market_comparison=request.include_market_comparison
        )
        
        # Update analysis with results
        analysis.risk_level = fraud_results["risk_level"]
        analysis.fraud_probability = fraud_results["fraud_probability"]
        analysis.confidence_score = fraud_results["confidence_score"]
        analysis.detected_patterns = fraud_results["patterns"]
        analysis.pattern_details = fraud_results["pattern_details"]
        analysis.is_price_anomaly = fraud_results["is_price_anomaly"]
        analysis.price_percentile = fraud_results["price_percentile"]
        analysis.buyer_risk_score = fraud_results["buyer_risk"]
        analysis.seller_risk_score = fraud_results["seller_risk"]
        analysis.recommendation = fraud_results["recommendation"]
        
        db.add(analysis)
        await db.flush()
        
        # Create fraud flags for detected issues
        for pattern in fraud_results["patterns"]:
            flag = FraudFlag(
                analysis_id=analysis.id,
                flag_type=pattern,
                severity=fraud_results["pattern_details"].get(pattern, {}).get("severity", "warning"),
                description=fraud_results["pattern_details"].get(pattern, {}).get("description", "")
            )
            db.add(flag)
        
        await db.commit()
        await db.refresh(analysis)
        
        return analysis
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


async def run_fraud_detection(escrow: Escrow, land: Land, db: AsyncSession, 
                              include_historical: bool = True,
                              include_market_comparison: bool = True) -> dict:
    """
    Run comprehensive fraud detection analysis
    In production, this would call ML model inference
    """
    
    patterns_detected = []
    pattern_details = {}
    fraud_probability = 0.0
    buyer_risk = 0.0
    seller_risk = 0.0
    
    # 1. Price Anomaly Detection
    price_anomaly, price_percentile = await detect_price_anomaly(escrow, land, db)
    if price_anomaly:
        patterns_detected.append(FraudPattern.PRICE_ANOMALY.value)
        pattern_details[FraudPattern.PRICE_ANOMALY.value] = {
            "severity": "high",
            "description": f"Price is at {price_percentile}th percentile - unusual for area",
            "value": escrow.escrow_amount,
            "percentile": price_percentile
        }
        fraud_probability += 0.15
    
    # 2. Rapid Resale Detection
    rapid_resale = await detect_rapid_resale(land, db)
    if rapid_resale:
        patterns_detected.append(FraudPattern.RAPID_RESALE.value)
        pattern_details[FraudPattern.RAPID_RESALE.value] = {
            "severity": "high",
            "description": "Property resold within 6 months - potential flipping scheme",
            "days_since_last_sale": rapid_resale["days"]
        }
        fraud_probability += 0.20
    
    # 3. Party Risk Assessment
    buyer_risk, buyer_profile = await assess_party_risk(escrow.buyer_id, db)
    seller_risk, seller_profile = await assess_party_risk(escrow.seller_id, db)
    
    if buyer_risk > 0.6:
        patterns_detected.append(FraudPattern.IDENTITY_MISMATCH.value)
        pattern_details[FraudPattern.IDENTITY_MISMATCH.value] = {
            "severity": "medium",
            "description": f"Buyer has high risk profile (score: {buyer_risk:.2f})"
        }
        fraud_probability += buyer_risk * 0.15
    
    if seller_risk > 0.6:
        if FraudPattern.IDENTITY_MISMATCH.value not in patterns_detected:
            patterns_detected.append(FraudPattern.IDENTITY_MISMATCH.value)
        pattern_details[FraudPattern.IDENTITY_MISMATCH.value] = {
            "severity": "medium",
            "description": f"Seller has high risk profile (score: {seller_risk:.2f})"
        }
        fraud_probability += seller_risk * 0.15
    
    # 4. Title Chain Analysis
    title_issues = await analyze_title_chain(land, db)
    if title_issues:
        patterns_detected.append(FraudPattern.TITLE_JUMPING.value)
        pattern_details[FraudPattern.TITLE_JUMPING.value] = {
            "severity": "critical",
            "description": "Title chain has gaps or suspicious jumps",
            "issues": title_issues
        }
        fraud_probability += 0.25
    
    # 5. Market Comparison
    if include_market_comparison:
        market_anomaly = await check_market_anomalies(escrow, land, db)
        if market_anomaly:
            patterns_detected.append(FraudPattern.COLLUSIVE_PRICING.value)
            pattern_details[FraudPattern.COLLUSIVE_PRICING.value] = {
                "severity": "medium",
                "description": market_anomaly["description"],
                "details": market_anomaly["details"]
            }
            fraud_probability += 0.10
    
    # Calculate final risk level
    fraud_probability = min(1.0, fraud_probability)
    confidence = 0.85 if patterns_detected else 0.95
    
    if fraud_probability > 0.75:
        risk_level = FraudRiskLevel.CRITICAL.value
        recommendation = "block"
    elif fraud_probability > 0.50:
        risk_level = FraudRiskLevel.HIGH.value
        recommendation = "escalate"
    elif fraud_probability > 0.25:
        risk_level = FraudRiskLevel.MEDIUM.value
        recommendation = "review"
    else:
        risk_level = FraudRiskLevel.LOW.value
        recommendation = "approve"
    
    return {
        "risk_level": risk_level,
        "fraud_probability": fraud_probability,
        "confidence_score": confidence,
        "patterns": patterns_detected,
        "pattern_details": pattern_details,
        "is_price_anomaly": FraudPattern.PRICE_ANOMALY.value in patterns_detected,
        "price_percentile": price_percentile if price_anomaly else 50.0,
        "buyer_risk": buyer_risk,
        "seller_risk": seller_risk,
        "recommendation": recommendation
    }


async def detect_price_anomaly(escrow: Escrow, land: Land, db: AsyncSession) -> tuple:
    """Detect if transaction price is anomalous for the area"""
    # Get similar properties in area
    similar = await db.execute(
        select(Land).where(
            and_(
                Land.location == land.location,  # Same area
                Land.status == "sold"  # Only sold properties
            )
        ).limit(100)
    )
    similar_lands = similar.scalars().all()
    
    if not similar_lands:
        return False, 50.0
    
    prices = [s.price for s in similar_lands if s.price]
    if not prices:
        return False, 50.0
    
    # Calculate percentile
    sorted_prices = sorted(prices)
    percentile = (len([p for p in sorted_prices if p < escrow.escrow_amount]) / len(sorted_prices)) * 100
    
    # Flag if price is in extreme 5% or 95%
    is_anomaly = percentile < 5 or percentile > 95
    
    return is_anomaly, percentile


async def detect_rapid_resale(land: Land, db: AsyncSession) -> Optional[dict]:
    """Detect if property was recently resold"""
    # Get previous transactions
    previous = await db.execute(
        select(Escrow)
        .where(and_(
            Escrow.land_id == land.id,
            Escrow.status == "completed"
        ))
        .order_by(Escrow.created_at.desc())
        .limit(1)
    )
    
    previous_sale = previous.scalar_one_or_none()
    if not previous_sale:
        return None
    
    days_since = (datetime.utcnow() - previous_sale.completed_at).days if previous_sale.completed_at else None
    
    # Flag if resold within 6 months
    if days_since and days_since < 180:
        return {"days": days_since, "previous_price": previous_sale.escrow_amount}
    
    return None


async def assess_party_risk(user_id: uuid.UUID, db: AsyncSession) -> tuple:
    """Assess risk score for a party (buyer/seller/agent)"""
    # Check if profile exists
    result = await db.execute(
        select(PartyRiskProfile).where(PartyRiskProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    if profile:
        return profile.overall_risk_score, profile
    
    # Create new profile
    profile = PartyRiskProfile(user_id=user_id)
    db.add(profile)
    await db.flush()
    
    return 0.0, profile


async def analyze_title_chain(land: Land, db: AsyncSession) -> Optional[List[str]]:
    """Analyze title ownership chain for gaps or issues"""
    # This would check:
    # - Gaps in ownership history
    # - Skipped sellers
    # - Unusual transfers
    # - Missing documents
    
    # For now, return None if no issues
    return None


async def check_market_anomalies(escrow: Escrow, land: Land, db: AsyncSession) -> Optional[dict]:
    """Check for market-related fraud patterns"""
    # Check if buyer/seller are related or connected
    # Check for shell companies
    # Check for money laundering patterns
    
    return None


@router.get("/transaction/{transaction_id}/analysis", response_model=Optional[FraudAnalysisResponse])
async def get_fraud_analysis(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get latest fraud analysis for a transaction"""
    result = await db.execute(
        select(FraudAnalysis)
        .where(FraudAnalysis.transaction_id == uuid.UUID(transaction_id))
        .order_by(FraudAnalysis.created_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="No fraud analysis found")
    
    return analysis


@router.get("/party/{user_id}/risk-profile", response_model=PartyRiskProfileResponse)
async def get_party_risk_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get risk profile for a party"""
    result = await db.execute(
        select(PartyRiskProfile)
        .where(PartyRiskProfile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Risk profile not found")
    
    return profile


@router.post("/party/{user_id}/flag")
async def flag_suspicious_party(
    user_id: str,
    reason: str = Query(..., description="Reason for flagging"),
    severity: str = Query("medium", pattern="^(low|medium|high|critical)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Flag a party as suspicious"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can flag parties")
    
    # Get or create profile
    result = await db.execute(
        select(PartyRiskProfile)
        .where(PartyRiskProfile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = PartyRiskProfile(user_id=uuid.UUID(user_id))
        db.add(profile)
    
    # Update risk
    profile.overall_risk_score = min(1.0, profile.overall_risk_score + 0.2)
    profile.risk_level = FraudRiskLevel.HIGH.value
    profile.risk_notes = reason
    
    await db.commit()
    
    return {"message": "Party flagged", "risk_score": profile.overall_risk_score}


@router.get("/high-risk-transactions", response_model=List[FraudAnalysisResponse])
async def get_high_risk_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, le=100)
):
    """Get recent high-risk transactions"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view risk dashboard")
    
    result = await db.execute(
        select(FraudAnalysis)
        .where(FraudAnalysis.risk_level.in_([
            FraudRiskLevel.HIGH.value,
            FraudRiskLevel.CRITICAL.value
        ]))
        .order_by(FraudAnalysis.created_at.desc())
        .limit(limit)
    )
    
    return result.scalars().all()


@router.get("/statistics", response_model=dict)
async def get_fraud_detection_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=365)
):
    """Get fraud detection statistics"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view statistics")
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all analyses
    result = await db.execute(
        select(FraudAnalysis)
        .where(FraudAnalysis.created_at >= cutoff_date)
    )
    analyses = result.scalars().all()
    
    # Calculate statistics
    total = len(analyses)
    high_risk = len([a for a in analyses if a.risk_level in [FraudRiskLevel.HIGH.value, FraudRiskLevel.CRITICAL.value]])
    avg_fraud_prob = sum(a.fraud_probability for a in analyses) / total if total > 0 else 0
    
    return {
        "period_days": days,
        "total_analyses": total,
        "high_risk_count": high_risk,
        "high_risk_percentage": (high_risk / total * 100) if total > 0 else 0,
        "average_fraud_probability": avg_fraud_prob,
        "analyses": [
            {
                "transaction_id": str(a.transaction_id),
                "risk_level": a.risk_level,
                "fraud_probability": a.fraud_probability,
                "patterns": a.detected_patterns or []
            }
            for a in analyses[:10]  # Top 10 recent
        ]
    }
