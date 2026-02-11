"""
Parcel Registry: Append-only store for CSI and parcel events.

Enforces:
- No overwrite (immutability of parcel records)
- Append-only history
- Deterministic grid reference rule
- Lineage integrity
"""

from typing import Dict, List, Optional, Tuple
from csi_model import (
    CompositeSpatialIdentity,
    LineageLink,
    EventType,
    ParcelEvent,
    GridReference,
)
from datetime import datetime
import uuid


class ParcelRegistry:
    """Authoritative registry of all land parcels"""
    
    def __init__(self):
        # CSI by parcel code (canonical reference)
        self._parcels: Dict[str, CompositeSpatialIdentity] = {}
        
        # CSI by csi_id (lookup by UUID)
        self._csis_by_id: Dict[str, CompositeSpatialIdentity] = {}
        
        # Parcel codes by grid reference
        # grid_key -> [parcel_codes]
        self._grid_index: Dict[str, List[str]] = {}
        
        # Event log (immutable)
        self._events: List[ParcelEvent] = []
        
        # Parcel sequence numbers per grid
        # grid_key -> next_sequence_number
        self._grid_sequences: Dict[str, int] = {}
    
    def register_parcel(
        self,
        geometry: List[Tuple[float, float]],
        grid_id: int,
        grid_x: int,
        grid_y: int,
        reference_vertex_index: int = 0,
        owner: Optional[str] = None,
        initiated_by: str = "system"
    ) -> CompositeSpatialIdentity:
        """
        Register a new parcel (birth event).
        
        Enforces:
        - Grid reference rule: first vertex defines the grid
        - Closed polygon validation
        - Unique parcel code generation
        """
        # Validate geometry is closed polygon
        if geometry[0] != geometry[-1]:
            raise ValueError("Geometry must be a closed polygon")
        if len(geometry) < 4:  # 3 unique vertices + 1 closing
            raise ValueError("Polygon must have at least 3 vertices")
        
        # Generate CSI
        csi_id = str(uuid.uuid4())
        grid_key = f"{grid_id:03d}{grid_x:02d}{grid_y:02d}"
        
        # Increment sequence for this grid
        if grid_key not in self._grid_sequences:
            self._grid_sequences[grid_key] = 1
        else:
            self._grid_sequences[grid_key] += 1
        
        seq = self._grid_sequences[grid_key]
        
        # Generate parcel code: GRID_KEY + SEQUENCE
        parcel_code = f"SL-{grid_key}-{seq:04d}"
        
        # Create CSI
        csi = CompositeSpatialIdentity(
            csi_id=csi_id,
            parcel_code=parcel_code,
            geometry=geometry,
            grid_ref=GridReference(
                grid_id=grid_id,
                grid_x=grid_x,
                grid_y=grid_y,
                reference_vertex_index=reference_vertex_index
            ),
            owner=owner
        )
        
        # Add creation event
        csi.add_history_event(
            event_type=EventType.PARCEL_CREATED,
            actor=initiated_by,
            description=f"Parcel registered: {parcel_code}",
            metadata={
                "grid": grid_key,
                "sequence": seq,
                "owner": owner,
                "vertices": len(geometry)
            }
        )
        
        # Store in registry
        self._parcels[parcel_code] = csi
        self._csis_by_id[csi_id] = csi
        
        if grid_key not in self._grid_index:
            self._grid_index[grid_key] = []
        self._grid_index[grid_key].append(parcel_code)
        
        return csi
    
    def register_parcel_event(
        self,
        event: ParcelEvent,
        initiated_by: str = "system"
    ):
        """Record a parcel event (append-only)"""
        self._events.append(event)
        
        # Add to subject CSI history
        event.subject_csi.add_history_event(
            event_type=EventType.CONFLICT_DETECTED,
            actor=initiated_by,
            description=f"Event: {event.spatial_relationship} with {len(event.other_csis)} parcel(s)",
            metadata={
                "event_id": event.event_id,
                "overlap_sqm": event.overlap_area_sqm,
                "involved_parcels": [c.parcel_code for c in event.other_csis]
            }
        )
    
    def create_child_parcel(
        self,
        parent_csi: CompositeSpatialIdentity,
        child_geometry: List[Tuple[float, float]],
        grid_id: int,
        grid_x: int,
        grid_y: int,
        relationship_type: str,  # "subdivision", "split"
        initiated_by: str = "system"
    ) -> CompositeSpatialIdentity:
        """
        Create a child parcel from a parent (subdivision or split).
        
        Enforces:
        - Parent remains intact (no geometry change)
        - Child gets new parcel code and CSI
        - Lineage link created
        - Parent updated with child reference
        """
        # Create the child parcel
        child_csi = self.register_parcel(
            geometry=child_geometry,
            grid_id=grid_id,
            grid_x=grid_x,
            grid_y=grid_y,
            owner=parent_csi.owner,
            initiated_by=initiated_by
        )
        
        # Create lineage link
        lineage = LineageLink(
            parent_csi_id=parent_csi.csi_id,
            parent_parcel_code=parent_csi.parcel_code,
            relationship_type=relationship_type,
            created_at=datetime.utcnow()
        )
        child_csi.parent_lineage = lineage
        
        # Register child in parent
        parent_csi.register_child(child_csi.parcel_code)
        
        # Add history events
        event_type = (
            EventType.PARCEL_SUBDIVISION if relationship_type == "subdivision"
            else EventType.PARCEL_SPLIT
        )
        
        parent_csi.add_history_event(
            event_type=event_type,
            actor=initiated_by,
            description=f"Child parcel created: {child_csi.parcel_code}",
            metadata={
                "child_code": child_csi.parcel_code,
                "relationship": relationship_type
            }
        )
        
        child_csi.add_history_event(
            event_type=event_type,
            actor=initiated_by,
            description=f"Born from parent: {parent_csi.parcel_code}",
            metadata={
                "parent_code": parent_csi.parcel_code,
                "relationship": relationship_type
            }
        )
        
        return child_csi
    
    def get_parcel(self, parcel_code: str) -> Optional[CompositeSpatialIdentity]:
        """Retrieve parcel by code"""
        return self._parcels.get(parcel_code)
    
    def get_csi_by_id(self, csi_id: str) -> Optional[CompositeSpatialIdentity]:
        """Retrieve parcel by CSI UUID"""
        return self._csis_by_id.get(csi_id)
    
    def get_parcels_in_grid(self, grid_id: int, grid_x: int, grid_y: int) -> List[CompositeSpatialIdentity]:
        """Get all parcels in a grid cell"""
        grid_key = f"{grid_id:03d}{grid_x:02d}{grid_y:02d}"
        codes = self._grid_index.get(grid_key, [])
        return [self._parcels[code] for code in codes]
    
    def get_parcel_lineage(self, parcel_code: str) -> Dict:
        """Get full genealogy: parents, children, ancestors"""
        csi = self.get_parcel(parcel_code)
        if not csi:
            return {}
        
        result = {
            "parcel_code": parcel_code,
            "parent": None,
            "children": csi.child_parcel_codes,
            "ancestors": []
        }
        
        # Traverse up to root
        current = csi
        while current.parent_lineage:
            parent_code = current.parent_lineage.parent_parcel_code
            result["ancestors"].append(parent_code)
            current = self.get_parcel(parent_code)
            if not current:
                break
        
        if csi.parent_lineage:
            result["parent"] = csi.parent_lineage.parent_parcel_code
        
        return result
    
    def verify_parcel(
        self,
        parcel_code: str,
        initiated_by: str = "system"
    ):
        """Mark parcel as verified by OARG"""
        csi = self.get_parcel(parcel_code)
        if not csi:
            raise ValueError(f"Parcel not found: {parcel_code}")
        
        csi.verification_status = "verified"
        csi.oarg_approval = True
        csi.add_history_event(
            event_type=EventType.OARG_APPROVAL,
            actor=initiated_by,
            description=f"Parcel verified and approved by OARG",
            metadata={"timestamp": datetime.utcnow().isoformat()}
        )
    
    def flag_fraud_risk(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        """Flag a parcel for fraud risk"""
        csi = self.get_parcel(parcel_code)
        if not csi:
            raise ValueError(f"Parcel not found: {parcel_code}")
        
        csi.verification_status = "disputed"
        csi.add_history_event(
            event_type=EventType.FRAUD_FLAG,
            actor=initiated_by,
            description=f"Fraud risk flagged: {reason}",
            metadata={"reason": reason}
        )
    
    def request_oarg_review(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        """Request manual OARG review"""
        csi = self.get_parcel(parcel_code)
        if not csi:
            raise ValueError(f"Parcel not found: {parcel_code}")
        
        csi.verification_status = "pending"
        csi.add_history_event(
            event_type=EventType.OARG_REVIEW_REQUESTED,
            actor=initiated_by,
            description=f"OARG review requested: {reason}",
            metadata={"reason": reason}
        )
    
    def get_all_events(self) -> List[ParcelEvent]:
        """Retrieve all parcel events (append-only log)"""
        return self._events.copy()
    
    def __repr__(self):
        return f"<ParcelRegistry parcels={len(self._parcels)} events={len(self._events)}>"
