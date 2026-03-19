"""
ScruPeak AI Service Router
Handles Lanstimate™ valuations and Jems AI transaction monitoring
"""

import os
import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Security
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models import User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ScruPeak AI Services"])

AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "https://ai-service-prod-198638918293.us-central1.run.app")

# ============================================================
# SCHEMAS
# ============================================================

class ValuationRequest(BaseModel):
    district: str
    city: str
    land_type: str
    size_sqm: float
    verification_status: str

class BehaviorAnalysisRequest(BaseModel):
    user_id: str
    activities: list

class DocumentModerationRequest(BaseModel):
    document_id: str
    text: str

# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/valuation/lanstimate")
async def get_valuation(request: ValuationRequest, current_user: User = Depends(get_current_user)):
    """Lanstimate™ AI Land Valuation"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/valuation/lanstimate",
                json=request.dict(),
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Valuation error: {e}")
        raise HTTPException(status_code=503, detail="AI valuation service unavailable")

@router.get("/valuation/market-insights")
async def get_market_insights(district: str = "Western Area", land_type: str = "residential", current_user: User = Depends(get_current_user)):
    """Lanstimate™ Market Insights"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AI_SERVICE_URL}/valuation/market-insights",
                params={"district": district, "land_type": land_type},
                timeout=20.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Market insights error: {e}")
        raise HTTPException(status_code=503, detail="Market insights service unavailable")

@router.post("/jems/behavior-analysis")
async def analyze_user_behavior(request: BehaviorAnalysisRequest, current_user: User = Depends(get_current_user)):
    """Jems AI Behavioral Analysis"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/jems/behavior-analysis",
                json=request.dict(),
                timeout=20.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Behavior analysis error: {e}")
        raise HTTPException(status_code=503, detail="Behavior analysis service unavailable")

@router.post("/moderation/document")
async def moderate_land_document(request: DocumentModerationRequest, current_user: User = Depends(get_current_user)):
    """Jems AI Document Moderation"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/moderation/document",
                json=request.dict(),
                timeout=20.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Document moderation error: {e}")
        raise HTTPException(status_code=503, detail="Document moderation service unavailable")

@router.get("/status")
async def get_ai_status():
    """AI Service Health Check"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{AI_SERVICE_URL}/health")
            return response.json()
    except Exception:
        return {"status": "unreachable"}
