"""
Parcel Storage & Governance

Grid-bounded queries, deterministic deduplication, lineage enforcement.
"""

from typing import Dict, List, Optional, Tuple, Set
from parcel_identity import ParcelIdentity, GridRef, EventType, create_parcel_identity
from datetime import datetime


class ParcelStore:
    """
    Deterministic parcel storage with deduplication via spatial hash.
    
    Lookups:
    - By parcel_id (primary key)
    - By spatial_hash (deduplication)
    - By grid_ref (grid-bounded queries)
    - By parent_id (lineage)
    """
    
    def __init__(self):
        # Primary: parcel_id -> ParcelIdentity
        self._by_id: Dict[str, ParcelIdentity] = {}
        
        # Deduplication: spatial_hash -> [parcel_ids]
        self._by_hash: Dict[str, List[str]] = {}
        
        # Grid index: grid_key -> [parcel_ids]
        self._by_grid: Dict[str, List[str]] = {}
        
        # Lineage index: parent_id -> [child_ids]
        self._lineage: Dict[str, List[str]] = {}
        
        # Sequence counter per grid: grid_key -> next_seq
        self._sequences: Dict[str, int] = {}
    
    def store(self, parcel: ParcelIdentity) -> bool:
        """
        Store parcel. Returns True if stored, False if duplicate detected.
        
        Deduplication: Check spatial_hash before storing.
        If hash already exists -> FRAUD or duplicate registration.
        """
        # Check for duplicate by hash
        if parcel.spatial_hash in self._by_hash:
            existing_ids = self._by_hash[parcel.spatial_hash]
            if existing_ids:
                raise ValueError(
                    f"Duplicate geometry detected. "
                    f"Spatial hash {parcel.spatial_hash[:12]}... "
                    f"already registered as {existing_ids[0]}"
                )
        
        # Store by ID
        self._by_id[parcel.parcel_id] = parcel
        
        # Index by hash
        if parcel.spatial_hash not in self._by_hash:
            self._by_hash[parcel.spatial_hash] = []
        self._by_hash[parcel.spatial_hash].append(parcel.parcel_id)
        
        # Index by grid
        grid_key = parcel.grid_ref.key()
        if grid_key not in self._by_grid:
            self._by_grid[grid_key] = []
        self._by_grid[grid_key].append(parcel.parcel_id)
        
        # Index lineage
        if parcel.parent_id:
            if parcel.parent_id not in self._lineage:
                self._lineage[parcel.parent_id] = []
            self._lineage[parcel.parent_id].append(parcel.parcel_id)
        
        return True
    
    def get(self, parcel_id: str) -> Optional[ParcelIdentity]:
        """Retrieve by parcel ID"""
        return self._by_id.get(parcel_id)
    
    def get_by_hash(self, spatial_hash: str) -> List[ParcelIdentity]:
        """Find parcels by spatial hash (should be 0 or 1)"""
        parcel_ids = self._by_hash.get(spatial_hash, [])
        return [self._by_id[pid] for pid in parcel_ids]
    
    def get_in_grid(self, grid_ref: GridRef) -> List[ParcelIdentity]:
        """Grid-bounded query: all parcels in a grid cell"""
        grid_key = grid_ref.key()
        parcel_ids = self._by_grid.get(grid_key, [])
        return [self._by_id[pid] for pid in parcel_ids]
    
    def get_children(self, parent_id: str) -> List[ParcelIdentity]:
        """Get all children of a parent"""
        child_ids = self._lineage.get(parent_id, [])
        return [self._by_id[pid] for pid in child_ids]
    
    def next_sequence(self, grid_key: str) -> int:
        """Get next sequence number for a grid"""
        if grid_key not in self._sequences:
            self._sequences[grid_key] = 1
        else:
            self._sequences[grid_key] += 1
        return self._sequences[grid_key]
    
    def all_parcels(self) -> List[ParcelIdentity]:
        """Get all parcels (memory-bounded for small datasets)"""
        return list(self._by_id.values())
    
    def count(self) -> int:
        return len(self._by_id)
    
    def __repr__(self):
        return f"<ParcelStore {self.count()} parcels, {len(self._by_hash)} hashes>"


class ParcelGovernance:
    """
    Parcel creation, subdivision, verification, and fraud detection.
    
    Rules:
    - No overwrite (append-only)
    - Grid reference rule (first vertex)
    - Deterministic parcel IDs
    - Lineage preservation
    """
    
    def __init__(self):
        self.store = ParcelStore()
    
    def register_parcel(
        self,
        polygon: List[Tuple[float, float]],
        grid_id: int,
        grid_x: int,
        grid_y: int,
        owner: Optional[str] = None,
        actor: str = "system"
    ) -> ParcelIdentity:
        """
        Register a new parcel.
        
        - Validates closed polygon
        - Computes deterministic parcel ID from grid
        - Checks for duplicate geometry
        """
        # Create parcel identity
        grid_ref = GridRef(grid_id, grid_x, grid_y)
        grid_key = grid_ref.key()
        seq = self.store.next_sequence(grid_key)
        
        parcel_id = f"SL-{grid_key}-{seq:04d}"
        
        parcel = create_parcel_identity(
            polygon=polygon,
            parcel_id=parcel_id,
            grid_ref=grid_ref,
            owner=owner,
            actor=actor
        )
        
        # Store (will raise if duplicate hash)
        self.store.store(parcel)
        
        return parcel
    
    def create_child_parcel(
        self,
        parent: ParcelIdentity,
        child_polygon: List[Tuple[float, float]],
        grid_id: int,
        grid_x: int,
        grid_y: int,
        actor: str = "system"
    ) -> ParcelIdentity:
        """
        Create a child parcel (subdivision).
        
        - Parent geometry UNCHANGED
        - Child gets new ID and lineage link
        - Parent updated with child reference
        """
        # Create child identity
        grid_ref = GridRef(grid_id, grid_x, grid_y)
        grid_key = grid_ref.key()
        seq = self.store.next_sequence(grid_key)
        
        child_id = f"SL-{grid_key}-{seq:04d}"
        
        child = create_parcel_identity(
            polygon=child_polygon,
            parcel_id=child_id,
            grid_ref=grid_ref,
            owner=parent.owner,
            actor=actor
        )
        
        # Set lineage
        child.parent_id = parent.parcel_id
        
        # Store child
        self.store.store(child)
        
        # Update parent
        parent.register_child(child_id)
        parent.add_event(
            event_type=EventType.SUBDIVIDED,
            actor=actor,
            msg=f"Child parcel created: {child_id}",
            meta={"child_id": child_id, "child_area": child.area_sqm}
        )
        
        return child
    
    def verify_parcel(self, parcel_id: str, actor: str = "oarg"):
        """Mark parcel as verified by OARG"""
        parcel = self.store.get(parcel_id)
        if not parcel:
            raise ValueError(f"Parcel not found: {parcel_id}")
        
        parcel.status = "verified"
        parcel.oarg_approved = True
        parcel.add_event(
            event_type=EventType.VERIFIED,
            actor=actor,
            msg=f"Parcel verified by OARG",
            meta={"timestamp": datetime.utcnow().isoformat()}
        )
    
    def flag_fraud(self, parcel_id: str, reason: str, actor: str = "system"):
        """Flag parcel as fraudulent"""
        parcel = self.store.get(parcel_id)
        if not parcel:
            raise ValueError(f"Parcel not found: {parcel_id}")
        
        parcel.status = "disputed"
        parcel.add_event(
            event_type=EventType.FRAUD_FLAGGED,
            actor=actor,
            msg=f"Fraud flagged: {reason}",
            meta={"reason": reason}
        )
    
    def detect_duplicate(self, polygon: List[Tuple[float, float]]) -> Optional[ParcelIdentity]:
        """Check if polygon already exists"""
        spatial_hash = ParcelIdentity.compute_spatial_hash(polygon)
        duplicates = self.store.get_by_hash(spatial_hash)
        return duplicates[0] if duplicates else None
    
    def get_parcel_genealogy(self, parcel_id: str) -> Dict:
        """Get full lineage: parent, children, ancestors"""
        parcel = self.store.get(parcel_id)
        if not parcel:
            return {}
        
        ancestors = []
        current = parcel
        while current.parent_id:
            ancestors.append(current.parent_id)
            current = self.store.get(current.parent_id)
            if not current:
                break
        
        return {
            "parcel_id": parcel_id,
            "parent": parcel.parent_id,
            "children": parcel.child_ids,
            "ancestors": ancestors
        }
    
    def __repr__(self):
        return f"<ParcelGovernance {self.store}>"
