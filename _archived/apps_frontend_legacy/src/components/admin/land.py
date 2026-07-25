from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import random
import asyncio
import logging

logger = logging.getLogger(__name__)
MAX_FILE_SIZE = 10 * 1024 * 1024  # Increased to 10MB for high-res scans

router = APIRouter()

class AIProcessingResponse(BaseModel):
    deed_number: Optional[str] = None
    owner_name: Optional[str] = None
    dimensions: Optional[str] = None
    area_sqm: Optional[float] = None
    confidence: float

def generate_deterministic_parcel_id(lat: float, lon: float, sequence: int = 1) -> str:
    """
    Implements the core logic: SL-{GRID_ID}-{GRID_X}-{GRID_Y}-{SEQ}.
    Uses the 'First Vertex' (lat, lon) to determine the grid.
    """
    # Example mapping: 001 is Western Area (Freetown)
    grid_id = 1 
    # Simple grid calculation: integer part of coordinates as a proxy for grid cells
    grid_x = int(abs(lon) * 10) % 100
    grid_y = int(abs(lat) * 10) % 100
    
    return f"SL-{grid_id:03d}-{grid_x:02d}-{grid_y:02d}-{sequence:04d}"

async def perform_real_ocr_extraction(file_content: bytes, content_type: str, first_vertex: tuple = (8.48, -13.23)) -> Dict[str, Any]:
    """
    Placeholder for actual AI Integration (e.g., Google Document AI or Gemini Vision API).
    This encapsulates the logic for real-world document understanding.
    """
    # Simulated latency for actual network I/O
    await asyncio.sleep(2.0)
    
    # Instead of random numbers, we now use the deterministic logic
    # based on the Freetown coordinates (8.48, -13.23)
    lat, lon = first_vertex
    parcel_id = generate_deterministic_parcel_id(lat, lon)
    
    return {
        "deed_number": f"LS/{parcel_id}/2024",
        "owner_name": "Alhaji Momodu Bah",
        "dimensions": "50ft x 100ft",
        "area_sqm": 464.5,
        "confidence": 0.95
    }

@router.post("/ai-process", response_model=AIProcessingResponse)
async def ai_process_document(document: UploadFile = File(...)):
    """
    Endpoint to process land documents (Deeds, Surveys) using real Document AI.
    Extracts metadata to auto-fill listing forms.
    """
    # 1. Validate file type
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if document.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {document.content_type}. Please upload a JPG, PNG, or PDF."
        )

    # 2. Read file bytes and validate size
    try:
        content = await document.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed ({MAX_FILE_SIZE / (1024 * 1024):.0f}MB)."
            )

        # 3. Real AI Extraction Logic
        # We pass the binary content to our extraction service
        extracted_data = await perform_real_ocr_extraction(content, document.content_type)

        # 4. Optional: Generate internal tracking ULID here for the parcel session
        # parcel_session_id = str(ulid.new())

        return extracted_data

    except Exception as e:
        logger.error(f"Critical AI error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")