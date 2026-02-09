"""
Parcel Identity - Core Data Structure

Exact specification:

ParcelIdentity = {
    "parcel_code": str,              # deterministic from grid + sequence
    "reference_grid": str,           # "001-00-02" (from first vertex)
    "sih": str,                      # Spatial Identity Hash (SHA256 of polygon)
    "polygon": List[Tuple[float, float]],  # closed polygon [(lat,lon), ..., (lat,lon)]
    "area": float,                   # computed from polygon (Shoelace)
    "parents": List[str],            # parent parcel codes (for merged parcels)
    "children": List[str],           # child parcel codes (from subdivisions)
    "birth_event": str,              # creation event (actor + timestamp + reason)
    "created_at": datetime           # timestamp of creation
}

Core Principle: If you change the geometry, you changed the land.
- Geometry is immutable (truth)
- If geometry changes → different parcel (new code)
- SIH (spatial identity hash) is the fingerprint
"""

from dataclasses import dataclass, field
from typing import List, Tuple
from datetime import datetime
import hashlib


@dataclass
class ParcelIdentity:
    """
    Exact parcel identity: minimal, deterministic, immutable.
    
    Geometry is truth. If polygon changes, it's a different land parcel.
    """
    
    parcel_code: str                        # "SL-001-00-02-0001"
    reference_grid: str                     # "001-00-02"
    sih: str                                # SHA256(polygon) spatial identity hash
    polygon: List[Tuple[float, float]]      # closed polygon
    area: float                             # computed from polygon (sqm)
    parents: List[str] = field(default_factory=list)   # parent codes
    children: List[str] = field(default_factory=list)  # child codes
    birth_event: str = ""                   # "created by actor_xyz at 2026-01-22 10:15:32 reason: ..."
    created_at: datetime = field(default_factory=datetime.utcnow)  # timestamp


# ========== UTILITY FUNCTIONS ==========

def compute_sih(polygon: List[Tuple[float, float]]) -> str:
    """
    Compute Spatial Identity Hash (SHA256 of polygon).
    
    Deterministic fingerprint of geometry.
    If polygon changes → different SIH → different land.
    """
    coords_str = ";".join([f"{lat:.10f},{lon:.10f}" for lat, lon in polygon])
    return hashlib.sha256(coords_str.encode()).hexdigest()


def compute_area(polygon: List[Tuple[float, float]]) -> float:
    """
    Compute polygon area from lat/lon coordinates (Shoelace formula).
    
    Returns area in square meters (rough; use UTM projection for precision).
    """
    if len(polygon) < 4:  # Need at least 3 unique vertices + closing vertex
        return 0.0
    
    # Remove closing vertex if present
    verts = polygon[:-1] if polygon[0] == polygon[-1] else polygon
    
    # Shoelace formula
    area = 0.0
    for i in range(len(verts)):
        lat1, lon1 = verts[i]
        lat2, lon2 = verts[(i + 1) % len(verts)]
        area += lat1 * lon2 - lat2 * lon1
    
    area = abs(area) / 2.0
    
    # Rough conversion: ~111km per degree latitude
    area_sqm = area * 111000 * 111000
    return area_sqm


def is_closed_polygon(polygon: List[Tuple[float, float]]) -> bool:
    """Validate polygon is closed (first == last vertex)"""
    return len(polygon) >= 4 and polygon[0] == polygon[-1]


def validate_polygon(polygon: List[Tuple[float, float]]) -> Tuple[bool, str]:
    """
    Validate polygon.
    
    Returns: (is_valid, error_message)
    """
    if len(polygon) < 4:
        return False, "Polygon must have at least 3 unique vertices"
    if not is_closed_polygon(polygon):
        return False, "Polygon must be closed (first vertex == last vertex)"
    return True, ""


def create_parcel_identity(
    parcel_code: str,
    reference_grid: str,
    polygon: List[Tuple[float, float]],
    birth_event: str,
    actor: str = "system",
    parents: List[str] = None,
    created_at: datetime = None
) -> ParcelIdentity:
    """
    Factory: Create a new parcel identity.
    
    Validates polygon, computes SIH and area, creates parcel record.
    """
    # Validate
    is_valid, error = validate_polygon(polygon)
    if not is_valid:
        raise ValueError(error)
    
    # Compute SIH and area
    sih = compute_sih(polygon)
    area = compute_area(polygon)
    
    # Create record
    parcel = ParcelIdentity(
        parcel_code=parcel_code,
        reference_grid=reference_grid,
        sih=sih,
        polygon=polygon,
        area=area,
        parents=parents or [],
        children=[],
        birth_event=birth_event or f"created by {actor} at {datetime.utcnow()}",
        created_at=created_at or datetime.utcnow()
    )
    
    return parcel
