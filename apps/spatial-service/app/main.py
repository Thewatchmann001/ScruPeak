from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.engine import SpatialIntelligence # Now the refactored SpatialIntelligence

app = FastAPI(title="Spatial Service", version="1.0.0")

# Initialize Engine
spatial_engine = SpatialIntelligence() # Use the refactored SpatialIntelligence

class PolygonRequest(BaseModel):
    polygon: List[Tuple[float, float]]
    owner: Optional[str] = None
    actor: str = "system"

@app.get("/health")
def health():
    return {"status": "healthy", "service": "spatial-service"}

@app.post("/register")
def register_parcel(request: PolygonRequest):
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
    try:
        decisions = spatial_engine.detect_conflicts_for_parcel(parcel_id, actor=actor)
        return decisions
    except ValueError as e:
         raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error detecting conflicts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
