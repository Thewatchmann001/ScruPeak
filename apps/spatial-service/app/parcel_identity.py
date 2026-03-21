"""
Parcel Identity - Core Data Structure

Exact specification:

ParcelIdentity = {
    "parcel_code": str,              # deterministic from grid + sequence
    "reference_grid": GridRef,       # GridReference object
    "sih": str,                      # Spatial Identity Hash (SHA256 of polygon)
    "polygon": List[Tuple[float, float]],  # closed polygon [(lat,lon), ..., (lat,lon)]
    "area": float,                   # computed from polygon (sqm)
    "parents": List[str],            # parent parcel codes (for merged parcels)
    "children": List[str],           # child parcel codes (from subdivisions)
    "birth_event": str,              # creation event (actor + timestamp + reason)
    "created_at": datetime,          # timestamp of creation
    "status": str,                   # unverified, verified, disputed
    "oarg_approved": bool,           # OARG approval flag
    "events": List[Event]            # history of events
}

Core Principle: If you change the geometry, you changed the land.
- Geometry is immutable (truth)
- If geometry changes → different parcel (new code)
- SIH (spatial identity hash) is the fingerprint
"""

from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import hashlib

# Import needed types from their correct source files
from csi_model import EventType, HistoryEvent as Event
from grid_new import GridReference as GridRef

@dataclass
class ParcelIdentity:
    """
    Exact parcel identity: minimal, deterministic, immutable.
    
    Geometry is truth. If polygon changes, it's a different land parcel.
    """
    
    parcel_code: str                        # "SL-001-00-02-0001"
    reference_grid: GridRef                 # GridReference object
    sih: str                                # SHA256(polygon) spatial identity hash
    polygon: List[Tuple[float, float]]      # closed polygon
    area: float                             # computed from polygon (sqm)
    parents: List[str] = field(default_factory=list)   # parent codes
    children: List[str] = field(default_factory=list)  # child codes
    birth_event: str = ""                   # "created by actor_xyz at 2026-01-22 10:15:32 reason: ..."
    created_at: datetime = field(default_factory=datetime.utcnow)  # timestamp
    status: str = "unverified"              # unverified, verified, disputed
    oarg_approved: bool = False             # OARG approval flag
    events: List[Event] = field(default_factory=list) # history of events
    owner: Optional[str] = None             # optional owner

    @property
    def parent_id(self) -> Optional[str]:
        """Legacy compatibility for single parent"""
        return self.parents[0] if self.parents else None

    @parent_id.setter
    def parent_id(self, value: str):
        """Legacy compatibility for setting single parent"""
        if value and value not in self.parents:
            self.parents = [value]
    
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
            timestamp=datetime.utcnow(),
            event_type=event_type,
            actor=actor,
            description=msg,
            metadata=meta or {}
        )
        self.events.append(event)
    
    def register_child(self, child_code: str):
        """Register child parcel"""
        if child_code not in self.children:
            self.children.append(child_code)
    
    def __repr__(self):
        grid_key = self.reference_grid.key() if hasattr(self.reference_grid, "key") else str(self.reference_grid)
        return f"<Parcel {self.parcel_code} grid={grid_key} area={self.area:.0f}sqm>"


def create_parcel_identity(
    polygon: List[Tuple[float, float]],
    parcel_code: str,
    reference_grid: GridRef,
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
    
    sih = ParcelIdentity.compute_spatial_hash(polygon)
    area = ParcelIdentity.compute_polygon_area(polygon)
    
    parcel = ParcelIdentity(
        parcel_code=parcel_code,
        sih=sih,
        polygon=polygon,
        area=area,
        reference_grid=reference_grid,
        owner=owner
    )
    
    parcel.add_event(
        event_type=EventType.CREATED,
        actor=actor,
        msg=f"Parcel created: {parcel_code}",
        meta={"grid": reference_grid.key(), "area": area, "owner": owner}
    )
    
    return parcel
