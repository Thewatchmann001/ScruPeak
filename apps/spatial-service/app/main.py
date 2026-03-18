from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Package-aware import
try:
    from app.agent import SpatialIntelligenceAgent
except ImportError:
    # Fallback for different execution contexts
    try:
        from .agent import SpatialIntelligenceAgent
    except ImportError:
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        from agent import SpatialIntelligenceAgent

app = FastAPI(title="ScruPeak Spatial Service", version="1.0.0")

# Initialize Agent
try:
    spatial_agent = SpatialIntelligenceAgent()
except Exception as e:
    logger.error(f"Failed to initialize SpatialIntelligenceAgent: {e}")
    spatial_agent = None

class PolygonRequest(BaseModel):
    polygon: List[Tuple[float, float]]
    owner: Optional[str] = None
    actor: str = "system"

class SubdivisionRequest(BaseModel):
    parent_parcel_code: str
    child_polygons: List[List[Tuple[float, float]]]
    actor: str = "system"
    new_parent_geometry: Optional[List[Tuple[float, float]]] = None

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "spatial-service",
        "agent_initialized": spatial_agent is not None
    }

@app.post("/api/v1/spatial/register")
def register_parcel(request: PolygonRequest):
    if not spatial_agent:
        raise HTTPException(status_code=503, detail="Spatial Agent not initialized")
    
    try:
        csi = spatial_agent.register_parcel(
            geometry=request.polygon,
            owner=request.owner,
            initiated_by=request.actor
        )
        return {
            "csi_id": csi.csi_id,
            "parcel_code": csi.parcel_code,
            "grid_ref": csi.grid_ref.canonical_key(),
            "status": csi.verification_status,
            "owner": csi.owner
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error registering parcel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/spatial/conflicts/{parcel_code}")
def detect_conflicts(parcel_code: str, actor: str = "system"):
    if not spatial_agent:
        raise HTTPException(status_code=503, detail="Spatial Agent not initialized")
        
    try:
        decision = spatial_agent.detect_and_classify_conflicts(parcel_code, initiated_by=actor)
        if not decision:
            return {"status": "no_conflicts", "parcel_code": parcel_code}

        return {
            "decision_id": decision.decision_id,
            "classification": decision.classification.value,
            "explanation": decision.decision_explanation,
            "justification": decision.technical_justification,
            "flags": decision.flags,
            "oarg_authority_invoked": decision.oarg_authority_invoked
        }
    except Exception as e:
        logger.error(f"Error detecting conflicts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/spatial/subdivide")
def create_subdivision(request: SubdivisionRequest):
    if not spatial_agent:
        raise HTTPException(status_code=503, detail="Spatial Agent not initialized")

    try:
        children = spatial_agent.create_subdivision(
            parent_parcel_code=request.parent_parcel_code,
            child_geometries=request.child_polygons,
            initiated_by=request.actor,
            new_parent_geometry=request.new_parent_geometry
        )
        return [
            {
                "csi_id": c.csi_id,
                "parcel_code": c.parcel_code,
                "grid_ref": c.grid_ref.canonical_key()
            } for c in children
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating subdivision: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/spatial/genealogy/{parcel_code}")
def get_genealogy(parcel_code: str):
    if not spatial_agent:
        raise HTTPException(status_code=503, detail="Spatial Agent not initialized")

    try:
        genealogy = spatial_agent.get_parcel_genealogy(parcel_code)
        return genealogy
    except Exception as e:
        logger.error(f"Error getting genealogy: {e}")
        raise HTTPException(status_code=500, detail=str(e))
