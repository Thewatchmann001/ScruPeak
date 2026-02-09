from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try importing from local module (for Docker/package) or relative (for local dev)
try:
    from app.engine import SpatialIntelligence
except ImportError:
    try:
        from .engine import SpatialIntelligence
    except ImportError:
        # Fallback if running directly
        from engine import SpatialIntelligence

app = FastAPI(title="Spatial Service", version="1.0.0")

# Initialize Engine
try:
    spatial_engine = SpatialIntelligence()
except Exception as e:
    logger.error(f"Failed to initialize SpatialIntelligence: {e}")
    spatial_engine = None

class PolygonRequest(BaseModel):
    polygon: List[Tuple[float, float]]
    owner: Optional[str] = None
    actor: str = "system"

@app.get("/health")
def health():
    return {"status": "healthy", "service": "spatial-service"}

@app.post("/register")
def register_parcel(request: PolygonRequest):
    if not spatial_engine:
        raise HTTPException(status_code=503, detail="Spatial Engine not initialized")
    
    try:
        parcel = spatial_engine.register_parcel(
            polygon=request.polygon, 
            owner=request.owner,
            actor=request.actor
        )
        return parcel
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error registering parcel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conflicts/{parcel_id}")
def detect_conflicts(parcel_id: str, actor: str = "system"):
    if not spatial_engine:
        raise HTTPException(status_code=503, detail="Spatial Engine not initialized")
        
    try:
        decisions = spatial_engine.detect_conflicts_for_parcel(parcel_id, actor=actor)
        return decisions
    except Exception as e:
        logger.error(f"Error detecting conflicts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
