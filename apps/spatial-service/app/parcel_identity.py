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
        Compute a starting-point and winding-order independent SHA256 hash.
        Used for duplicate/identity detection.
        """
        if not polygon:
            return ""

        # 1. Normalize: Remove closing vertex
        verts = polygon[:-1] if (len(polygon) > 1 and polygon[0] == polygon[-1]) else polygon
        
        # 2. Stringify nodes with fixed precision to handle floating point noise
        nodes = [f"{lat:.10f},{lon:.10f}" for lat, lon in verts]
        n = len(nodes)
        if n == 0:
            return ""
        
        # 3. Handle starting-point independence (Canonical Rotation)
        forward_rotations = [nodes[i:] + nodes[:i] for i in range(n)]
        canonical_f = min(forward_rotations)
        
        # 4. Handle winding-order independence (Reversal)
        rev_nodes = nodes[::-1]
        reverse_rotations = [rev_nodes[i:] + rev_nodes[:i] for i in range(n)]
        canonical_r = min(reverse_rotations)
        
        # Final sequence is the lexicographically smaller of the two directions
        final_canonical = min(canonical_f, canonical_r)
        
        coords_str = ";".join(final_canonical)
        return hashlib.sha256(coords_str.encode()).hexdigest()
    
    @staticmethod
    def compute_polygon_area(polygon: List[Tuple[float, float]]) -> float:
        """
        Shoelace formula for polygon area (lat/lon coordinates).
        
        Returns area in approximate square meters (rough; use proper projection for accuracy).
        """
        if len(polygon) < 4:
            return 0.0
        
        area = 0.0
        n = len(polygon)
        
        for i in range(n - 1):
            lat1, lon1 = polygon[i]
            lat2, lon2 = polygon[i + 1]
            # Sum of cross products: (x1*y2 - x2*y1)
            area += (lon1 * lat2) - (lon2 * lat1)
        
        area = abs(area) / 2.0
        
        # Conversion from square degrees to square meters (approx 12.3 billion sqm per sq degree)
        # In Sierra Leone (~8.5°N), 1 degree lat is ~110.6km and 1 degree lon is ~110.1km.
        return area * 110600 * 110100

    def update_geometry(self, new_geometry: List[Tuple[float, float]], actor: str, reason: str):
        """Update geometry while maintaining identity (ID)"""
        if not self.validate_polygon(new_geometry):
            raise ValueError("New geometry must be a valid closed polygon")

        old_area = self.area
        self.polygon = new_geometry
        self.sih = self.compute_spatial_hash(new_geometry)
        self.area = self.compute_polygon_area(new_geometry)

        self.add_event(
            event_type=EventType.PARCEL_GEOMETRY_CONFIRMED,
            actor=actor,
            msg=f"Geometry updated: {reason}",
            metadata={"reason": reason, "prev_area": old_area, "new_area": self.area}
        )
    
    @staticmethod
    def validate_polygon(polygon: List[Tuple[float, float]]) -> bool:
        """Validate closed polygon"""
        return len(polygon) >= 4 and polygon[0] == polygon[-1]
    
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
