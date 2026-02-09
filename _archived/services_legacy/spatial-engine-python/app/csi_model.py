"""
Composite Spatial Identity (CSI) Model

Represents the complete, immutable identity of a land parcel:
- geometry (closed polygon)
- grid reference
- lineage (parent/child relationships)
- verification history (append-only)
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from enum import Enum


class EventType(Enum):
    """Append-only event types for CSI history"""
    PARCEL_CREATED = "parcel_created"
    PARCEL_VERIFIED = "parcel_verified"
    PARCEL_SPLIT = "parcel_split"
    PARCEL_MERGE = "parcel_merge"
    PARCEL_SUBDIVISION = "parcel_subdivision"
    PARCEL_GEOMETRY_CONFIRMED = "parcel_geometry_confirmed"
    CONFLICT_DETECTED = "conflict_detected"
    FRAUD_FLAG = "fraud_flag"
    OARG_REVIEW_REQUESTED = "oarg_review_requested"
    OARG_APPROVAL = "oarg_approval"


@dataclass
class HistoryEvent:
    """Immutable event in parcel history"""
    timestamp: datetime
    event_type: EventType
    actor: str  # who made this change
    description: str
    metadata: Dict = field(default_factory=dict)

    def __repr__(self):
        return f"<Event {self.event_type.value} @ {self.timestamp}>"


@dataclass
class GridReference:
    """Grid placement for a parcel"""
    grid_id: int
    grid_x: int
    grid_y: int
    reference_vertex_index: int = 0  # vertex index that defines the grid

    def canonical_key(self) -> str:
        """Deterministic grid key for parcel coding"""
        return f"{self.grid_id:03d}{self.grid_x:02d}{self.grid_y:02d}"


@dataclass
class LineageLink:
    """Parent-child relationship in parcel genealogy"""
    parent_csi_id: str
    parent_parcel_code: str
    relationship_type: str  # "subdivision", "split", "merge"
    created_at: datetime


@dataclass
class CompositeSpatialIdentity:
    """
    CSI: The canonical identity of a land parcel.
    
    Invariants:
    - geometry is immutable (closed polygon)
    - parcel_code is unique and immutable
    - history is append-only
    - no overwrite allowed
    """
    
    # Identity
    csi_id: str  # unique, immutable UUID
    parcel_code: str  # human-readable code from grid + sequence
    
    # Geometry (immutable)
    geometry: List[Tuple[float, float]]  # closed polygon: [(lat, lon), ...]
    
    # Grid reference
    grid_ref: GridReference
    
    # Lineage
    parent_lineage: Optional[LineageLink] = None
    child_parcel_codes: List[str] = field(default_factory=list)
    
    # Verification state
    verification_status: str = "unverified"  # unverified, pending, verified, disputed
    oarg_approval: bool = False
    
    # Metadata
    transferable_area_sqm: Optional[float] = None
    owner: Optional[str] = None
    
    # History (append-only event log)
    history: List[HistoryEvent] = field(default_factory=list)
    
    # Creation
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def add_history_event(
        self,
        event_type: EventType,
        actor: str,
        description: str,
        metadata: Optional[Dict] = None
    ):
        """Append-only: add event to history"""
        event = HistoryEvent(
            timestamp=datetime.utcnow(),
            event_type=event_type,
            actor=actor,
            description=description,
            metadata=metadata or {}
        )
        self.history.append(event)
    
    def register_child(self, child_parcel_code: str):
        """Register a child parcel born from this parent"""
        if child_parcel_code not in self.child_parcel_codes:
            self.child_parcel_codes.append(child_parcel_code)
    
    def is_closed_polygon(self) -> bool:
        """Validate that geometry is a closed polygon"""
        if len(self.geometry) < 3:
            return False
        return self.geometry[0] == self.geometry[-1]
    
    def __repr__(self):
        return f"<CSI {self.parcel_code} [{self.verification_status}]>"


@dataclass
class ParcelEvent:
    """
    A spatial event involving one or more parcels.
    Used to classify and decide on parcel actions.
    """
    event_id: str
    timestamp: datetime
    
    # Spatial relationship detected
    subject_csi: CompositeSpatialIdentity
    other_csis: List[CompositeSpatialIdentity] = field(default_factory=list)
    
    # Relationship type
    spatial_relationship: str  # "overlap", "containment", "coincident", "disjoint"
    overlap_area_sqm: Optional[float] = None
    
    # Initiator
    initiated_by: str  # actor name or system
    request_metadata: Dict = field(default_factory=dict)
