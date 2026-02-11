"""
AI Advisory Router
Non-invasive DeepSeek AI integration for land guidance and document review
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.utils.auth import get_current_user, get_optional_user
from app.models import User
from app.services.deepseek_ai import get_deepseek_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["AI Advisory"])

# ============================================================================
# SCHEMAS
# ============================================================================

class LandGuidanceRequest(BaseModel):
    """Request for land guidance"""
    question: str = Field(..., description="User's question about land", min_length=10, max_length=1000)
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional context (location, property_type, size, etc.)"
    )


class DocumentReviewRequest(BaseModel):
    """Request for document review"""
    document_text: str = Field(..., description="Text content of document", min_length=50, max_length=10000)
    document_type: str = Field(
        default="survey_plan",
        description="Type of document (survey_plan, title_deed, chief_form, etc.)"
    )


class AIAssistRequest(BaseModel):
    """General AI assistance request"""
    query: str = Field(..., description="User query", min_length=10, max_length=1000)
    context: Optional[Dict[str, Any]] = None


class LanstimateRequest(BaseModel):
    """Request for Lanstimate price estimation"""
    location: Dict[str, str] = Field(..., description="district, chiefdom, community")
    size_sqm: float = Field(..., description="size in sqm")
    purpose: str = Field(..., description="residential, commercial, etc.")
    nearby_prices: Optional[List[Dict[str, Any]]] = None


# ============================================================================
# ENDPOINTS: LAND GUIDANCE
# ============================================================================

@router.post("/assist")
async def ai_assist(
    request: AIAssistRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    General AI assistance endpoint
    Provides advisory guidance on land-related questions
    """
    try:
        service = get_deepseek_service()
        
        if not service.enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured or disabled"
            )
        
        result = await service.get_land_guidance(
            question=request.query,
            context=request.context
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=result.get("error", "AI service unavailable")
            )
        
        logger.info(f"AI assist request from user {current_user.id}: {request.query[:50]}...")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI assist: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process AI request"
        )


@router.post("/land-guidance")
async def get_land_guidance(
    request: LandGuidanceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get plain English land guidance for Sierra Leone context
    Advisory only - no legal guarantees
    """
    try:
        service = get_deepseek_service()
        
        if not service.enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured or disabled"
            )
        
        result = await service.get_land_guidance(
            question=request.question,
            context=request.context
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=result.get("error", "AI service unavailable")
            )
        
        logger.info(f"Land guidance request from user {current_user.id}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in land guidance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process guidance request"
        )


# ============================================================================
# ENDPOINTS: DOCUMENT REVIEW
# ============================================================================

@router.post("/document-review")
async def review_document(
    request: DocumentReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Review land document and detect potential red flags
    Advisory only - all documents must be verified by professionals
    """
    try:
        service = get_deepseek_service()
        
        if not service.enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured or disabled"
            )
        
        result = await service.review_document(
            document_text=request.document_text,
            document_type=request.document_type
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=result.get("error", "AI service unavailable")
            )
        
        logger.info(f"Document review request from user {current_user.id} for {request.document_type}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in document review: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process document review"
        )


@router.post("/lanstimate")
async def get_lanstimate(
    request: LanstimateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get land price estimation (Lanstimate)
    Advisory only - no legal guarantees
    """
    try:
        service = get_deepseek_service()

        if not service.enabled:
            # Fallback mock for demonstration if AI is disabled
            return {
                "success": True,
                "estimated_price": request.size_sqm * 20, # Mock logic
                "price_range": [request.size_sqm * 15, request.size_sqm * 25],
                "confidence_score": 0.65,
                "valuation_factors": ["Location", "Market Size", "Mock Estimation"],
                "market_trend": "stable",
                "disclaimer": "AI service is disabled. This is a mock estimation."
            }

        result = await service.estimate_land_price(
            location=request.location,
            size_sqm=request.size_sqm,
            purpose=request.purpose,
            nearby_prices=request.nearby_prices
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=result.get("error", "AI service unavailable")
            )

        user_id = current_user.id if current_user else "anonymous"
        logger.info(f"Lanstimate request from user {user_id}")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Lanstimate: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process Lanstimate request"
        )


# ============================================================================
# ENDPOINTS: SERVICE STATUS
# ============================================================================

@router.get("/status")
async def get_ai_status(
    current_user: User = Depends(get_current_user)
):
    """Get AI service status and availability"""
    service = get_deepseek_service()
    
    return {
        "enabled": service.enabled,
        "model": service.model.value if service.enabled else None,
        "status": "available" if service.enabled else "disabled",
        "message": "AI service is available" if service.enabled else "AI service is not configured",
        "timestamp": datetime.utcnow().isoformat()
    }
