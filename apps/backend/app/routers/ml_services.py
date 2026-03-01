"""
ML Services Router
Advanced fraud detection, price prediction, and risk scoring API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.core.database import get_db
from app.utils.auth import get_current_user, get_current_admin
from app.models import User, UserRole
from app.services.ml_models import ml_registry

router = APIRouter(prefix="/api/v1/ml")

# ============================================================================
# SCHEMAS
# ============================================================================

class PriceEstimateRequest(BaseModel):
    """Request price estimate for property"""
    area: float
    property_type: str  # residential, commercial, agricultural
    location: str
    access_type: str = "road_access"
    boundary_count: int = 4
    distance_to_city: float = 50
    elevation: float = 1000
    water_access: bool = False
    infrastructure_quality: float = 0.5


class RiskAssessmentRequest(BaseModel):
    """Request risk assessment for transaction"""
    buyer_id: str
    seller_id: str
    property_id: str
    transaction_amount: float
    document_quality_score: float = 0.8


class TransactionFraudAnalysisRequest(BaseModel):
    """Request fraud analysis for transaction"""
    transaction_id: str
    amount: float
    buyer_risk_score: float
    seller_risk_score: float
    document_quality_score: float
    buyer_transactions_count: int = 0
    seller_transactions_count: int = 0


# ============================================================================
# ENDPOINTS: PRICE PREDICTION
# ============================================================================

@router.post("/lanstimate")
async def lanstimate_property_price(
    request: PriceEstimateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lanstimate™ AI Valuation Engine: Estimates land market value based on
    locality pricing averages, topography, and regional patterns.
    """
    try:
        model = ml_registry.get_model("price_prediction")
        if not model:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Price model not available")
        
        result = model.predict_price({
            "area": request.area,
            "property_type": request.property_type,
            "location": request.location,
            "access_type": request.access_type,
            "boundary_count": request.boundary_count,
            "distance_to_city": request.distance_to_city,
            "elevation": request.elevation,
            "water_access": request.water_access,
            "infrastructure_quality": request.infrastructure_quality
        })
        
        return {
            "estimated_price": result["estimated_price"],
            "currency": "NGN",
            "price_range": {
                "min": result["price_range"]["min"],
                "max": result["price_range"]["max"]
            },
            "confidence": result["confidence_interval"],
            "comparable_properties": result["comparable_properties"],
            "market_trend": result["market_trend"],
            "property_details": {
                "area": request.area,
                "property_type": request.property_type,
                "location": request.location
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/price-compare/{property_id}")
async def compare_property_prices(
    property_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Compare property prices with market comps"""
    # In production: fetch property from database
    # For now: return mock data
    
    return {
        "property_id": property_id,
        "estimated_value": 50000000,
        "market_range": {
            "low": 40000000,
            "high": 60000000
        },
        "comparable_sales": [
            {
                "id": "comp_1",
                "price": 48000000,
                "days_to_sale": 15
            },
            {
                "id": "comp_2",
                "price": 52000000,
                "days_to_sale": 22
            }
        ],
        "valuation_date": datetime.utcnow().isoformat()
    }


@router.get("/price-trends")
async def get_price_trends(
    location: str = Query(...),
    property_type: str = Query("residential"),
    period_days: int = Query(90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get price trends for location"""
    return {
        "location": location,
        "property_type": property_type,
        "period_days": period_days,
        "trend": "rising",
        "trend_percentage": 12.5,
        "average_price": 45000000,
        "median_price": 42000000,
        "price_change": 5000000,
        "transactions_count": 156,
        "historical_data": [
            {
                "date": "2026-01-26",
                "average_price": 45000000,
                "transactions": 20
            },
            {
                "date": "2026-01-19",
                "average_price": 44500000,
                "transactions": 18
            }
        ]
    }


# ============================================================================
# ENDPOINTS: FRAUD DETECTION
# ============================================================================

@router.post("/jems-fraud-analyze")
async def analyze_fraud_with_jems(
    request: TransactionFraudAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Jems AI Fraud Analysis: Non-invasive AI oversight layer for auditing transactions,
    flagging anomalies, and monitoring user behavior patterns.
    """
    try:
        model = ml_registry.get_model("fraud_detection")
        if not model:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Fraud model not available")
        
        result = model.detect_fraud_patterns({
            "amount": request.amount,
            "buyer_risk_score": request.buyer_risk_score,
            "seller_risk_score": request.seller_risk_score,
            "document_quality_score": request.document_quality_score,
            "buyer_transactions_count": request.buyer_transactions_count,
            "seller_transactions_count": request.seller_transactions_count
        })
        
        return {
            "transaction_id": request.transaction_id,
            "fraud_probability": result["fraud_probability"],
            "risk_level": result["risk_level"],
            "recommendation": result["recommendation"],
            "patterns_detected": result["patterns_detected"],
            "confidence": result["confidence_score"],
            "analyzed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/fraud-patterns")
async def get_fraud_patterns(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get common fraud patterns detected"""
    return {
        "patterns": [
            {
                "pattern": "price_anomaly",
                "frequency": 245,
                "success_rate": 0.92,
                "description": "Prices far above/below market"
            },
            {
                "pattern": "rapid_resale",
                "frequency": 156,
                "success_rate": 0.88,
                "description": "Property quickly resold for profit"
            },
            {
                "pattern": "identity_mismatch",
                "frequency": 89,
                "success_rate": 0.95,
                "description": "Owner ID doesn't match records"
            },
            {
                "pattern": "document_forgery",
                "frequency": 67,
                "success_rate": 0.91,
                "description": "Forged or altered documents"
            },
            {
                "pattern": "shell_company",
                "frequency": 45,
                "success_rate": 0.87,
                "description": "Unknown or untraceable buyer"
            }
        ],
        "total_patterns_detected": 602,
        "detection_period_days": 30,
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# ENDPOINTS: RISK SCORING
# ============================================================================

@router.post("/risk-score")
async def calculate_risk_score(
    request: RiskAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate comprehensive risk score for transaction"""
    try:
        model = ml_registry.get_model("risk_scoring")
        if not model:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Risk model not available")
        
        user_data = {
            "dispute_history_count": 0,  # In production: fetch from DB
            "verification_complete": True,
            "credit_score": 750,
            "previous_defaults": 0,
            "account_age_days": 365,
            "sanctions_list": False,
            "compliance_checks_passed": 4
        }
        
        transaction_data = {
            "amount": request.transaction_amount,
            "title_issues_detected": False,
            "flood_zone": False,
            "contamination_history": False
        }
        
        result = model.calculate_overall_risk(user_data, transaction_data)
        
        return {
            "overall_risk_score": result["overall_risk_score"],
            "risk_level": result["risk_level"],
            "category_risks": result["category_risks"],
            "risk_factors": result["risk_factors"],
            "mitigation_steps": result["mitigation_steps"],
            "transaction_amount": request.transaction_amount,
            "calculated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/risk-score/{entity_id}/by-role/{role}")
async def get_entity_risk_by_role(
    entity_id: str,
    role: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get risk score for entity by stakeholder role"""
    # Different risk assessments for different roles
    risk_adjustments = {
        "buyer": 1.0,
        "seller": 0.8,
        "agent": 1.2,
        "government_official": 0.5
    }
    
    base_risk = 35.5
    adjusted_risk = base_risk * risk_adjustments.get(role, 1.0)
    
    return {
        "entity_id": entity_id,
        "role": role,
        "base_risk_score": base_risk,
        "adjusted_risk_score": adjusted_risk,
        "risk_level": "medium" if adjusted_risk > 50 else "low",
        "last_assessment": datetime.utcnow().isoformat()
    }


# ============================================================================
# ENDPOINTS: MODEL MANAGEMENT
# ============================================================================

@router.get("/models")
async def list_ml_models(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all available ML models"""
    models = ml_registry.list_models()
    return {
        "models": models,
        "total_models": len(models),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/models/{model_name}")
async def get_model_info(
    model_name: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed model information"""
    info = ml_registry.get_model_info(model_name)
    if not info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model {model_name} not found")
    
    return info


@router.post("/models/{model_name}/deploy")
async def deploy_ml_model(
    model_name: str,
    version: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Deploy ML model to production"""
    success = ml_registry.deploy_model(model_name, version)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model {model_name} not found")
    
    return {
        "model_name": model_name,
        "version": version,
        "status": "deployed",
        "deployed_at": datetime.utcnow().isoformat()
    }


# ============================================================================
# ENDPOINTS: MODEL PERFORMANCE & MONITORING
# ============================================================================

@router.get("/models/{model_name}/performance")
async def get_model_performance(
    model_name: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get model performance metrics"""
    model = ml_registry.get_model(model_name)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model {model_name} not found")
    
    # Extract available metrics
    metrics = {}
    for metric in ["accuracy", "precision", "recall", "f1_score", "roc_auc", "rmse"]:
        value = getattr(model, metric, None)
        if value is not None:
            metrics[metric] = float(value)
    
    return {
        "model_name": model_name,
        "metrics": metrics,
        "last_updated": getattr(model, "created_at", datetime.utcnow()).isoformat()
    }


@router.get("/predictions/history")
async def get_prediction_history(
    limit: int = Query(100),
    model_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get recent prediction history"""
    # In production: query prediction logs from database
    return {
        "predictions": [
            {
                "prediction_id": "pred_001",
                "model": "price_prediction",
                "input": {"area": 1000},
                "output": 50000000,
                "confidence": 92.5,
                "timestamp": datetime.utcnow().isoformat()
            }
        ],
        "total_predictions": 1,
        "period": "last_24h"
    }


@router.post("/models/{model_name}/retrain")
async def retrain_ml_model(
    model_name: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Trigger model retraining"""
    # In production: trigger async retraining job
    return {
        "model_name": model_name,
        "status": "retraining_queued",
        "estimated_duration_hours": 2,
        "queued_at": datetime.utcnow().isoformat()
    }


# ============================================================================
# ENDPOINTS: INSIGHTS & ANALYTICS
# ============================================================================

@router.get("/insights/market")
async def get_market_insights(
    period_days: int = Query(30),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get market insights from ML analysis"""
    return {
        "period_days": period_days,
        "insights": [
            {
                "insight": "Rising demand in premium locations",
                "confidence": 0.92,
                "impact": "high"
            },
            {
                "insight": "Increased fraud attempts in Q1",
                "confidence": 0.88,
                "impact": "high"
            },
            {
                "insight": "Longer time-to-sale for remote properties",
                "confidence": 0.85,
                "impact": "medium"
            }
        ],
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/insights/user/{user_id}")
async def get_user_insights(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get personalized insights for user"""
    # Check if user is requesting their own data
    if user_id != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    return {
        "user_id": user_id,
        "insights": [
            {
                "insight": "Your properties are priced 8% above market average",
                "recommendation": "Consider reducing price for faster sale"
            },
            {
                "insight": "You have 3 ongoing transactions",
                "recommendation": "Monitor for completion timelines"
            }
        ],
        "timestamp": datetime.utcnow().isoformat()
    }
