"""
Jems AI Advisory Router
Non-invasive Jems AI integration for land guidance and document review
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.utils.auth import get_current_user
from app.models import User
from app.services.jems_ai import get_jems_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Jems AI Advisory"])

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
        service = get_jems_service()
        
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
    Get plain English Jems AI guidance for Sierra Leone context
    Advisory only - no legal guarantees
    """
    try:
        service = get_jems_service()
        
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
    Review land document and detect potential red flags using Jems AI
    Advisory only - all documents must be verified by professionals
    """
    try:
        service = get_jems_service()
        
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


# ============================================================================
# ENDPOINTS: SERVICE STATUS
# ============================================================================

@router.get("/status")
async def get_ai_status(
    current_user: User = Depends(get_current_user)
):
    """Get Jems AI service status and availability"""
    service = get_jems_service()
    
    return {
        "enabled": service.enabled,
        "model": service.model.value if service.enabled else None,
        "status": "available" if service.enabled else "disabled",
        "message": "Jems AI service is available" if service.enabled else "Jems AI service is not configured",
        "timestamp": datetime.utcnow().isoformat()
    }
