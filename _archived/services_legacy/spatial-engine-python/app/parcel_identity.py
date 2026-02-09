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
from typing import List, Dict, Tuple
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
    
    @staticmethod
    def compute_spatial_hash(polygon: List[Tuple[float, float]]) -> str:
        """
        Compute deterministic SHA256 hash of polygon geometry.
        Used for duplicate/identity detection.
        
        Invariant: Same polygon always produces same hash.
        """
        # Serialize polygon as ordered lat/lon pairs (high precision)
        coords_str = ";".join([f"{lat:.10f},{lon:.10f}" for lat, lon in polygon])
        return hashlib.sha256(coords_str.encode()).hexdigest()
    
    @staticmethod
    def compute_polygon_area(polygon: List[Tuple[float, float]]) -> float:
        """
        Shoelace formula for polygon area (lat/lon coordinates).
        
        Returns area in approximate square meters (rough; use proper projection for accuracy).
        For exact: use UTM projection before computing area.
        """
        if len(polygon) < 3:
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
        
        # Very rough conversion from decimal degrees to sqm (~111km per degree)
        # For production: use proper UTM projection
        area_sqm = area * 111000 * 111000
        return area_sqm
    
    @staticmethod
    def validate_polygon(polygon: List[Tuple[float, float]]) -> bool:
        """Validate closed polygon"""
        if len(polygon) < 4:
            return False
        return polygon[0] == polygon[-1]
    
    def add_event(self, event_type: EventType, actor: str, msg: str, meta: Optional[Dict] = None):
        """Append event to immutable log"""
        event = Event(
            ts=datetime.utcnow(),
            event_type=event_type,
            actor=actor,
            msg=msg,
            meta=meta or {}
        )
        self.events.append(event)
    
    def register_child(self, child_id: str):
        """Register child parcel"""
        if child_id not in self.child_ids:
            self.child_ids.append(child_id)
    
    def __repr__(self):
        return f"<Parcel {self.parcel_id} grid={self.grid_ref.key()} area={self.area_sqm:.0f}sqm>"


def create_parcel_identity(
    polygon: List[Tuple[float, float]],
    parcel_id: str,
    grid_ref: GridRef,
    owner: Optional[str] = None,
    actor: str = "system"
) -> ParcelIdentity:
    """
    Factory: Create a new parcel identity.
    
    Validates:
    - Closed polygon
    - Deterministic ID format
    - Spatial hash uniqueness (caller must check)
    """
    if not ParcelIdentity.validate_polygon(polygon):
        raise ValueError("Invalid polygon (must be closed)")
    
    spatial_hash = ParcelIdentity.compute_spatial_hash(polygon)
    area_sqm = ParcelIdentity.compute_polygon_area(polygon)
    
    parcel = ParcelIdentity(
        parcel_id=parcel_id,
        spatial_hash=spatial_hash,
        polygon=polygon,
        area_sqm=area_sqm,
        grid_ref=grid_ref,
        owner=owner
    )
    
    parcel.add_event(
        event_type=EventType.CREATED,
        actor=actor,
        msg=f"Parcel created: {parcel_id}",
        meta={"grid": grid_ref.key(), "area": area_sqm, "owner": owner}
    )
    
    return parcel
