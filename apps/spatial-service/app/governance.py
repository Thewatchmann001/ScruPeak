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
    - By parcel_code (primary key)
    - By sih (deduplication)
    - By grid_ref (grid-bounded queries)
    - By parent_code (lineage)
    """
    
    def __init__(self):
        # Primary: parcel_code -> ParcelIdentity
        self._by_code: Dict[str, ParcelIdentity] = {}
        
        # Deduplication: sih -> [parcel_codes]
        self._by_hash: Dict[str, List[str]] = {}
        
        # Grid index: grid_key -> [parcel_codes]
        self._by_grid: Dict[str, List[str]] = {}
        
        # Lineage index: parent_code -> [child_codes]
        self._lineage: Dict[str, List[str]] = {}
        
        # Sequence counter per grid: grid_key -> next_seq
        self._sequences: Dict[str, int] = {}
    
    def store(self, parcel: ParcelIdentity) -> bool:
        """
        Store parcel. Returns True if stored, False if duplicate detected.
        
        Deduplication: Check sih before storing.
        If hash already exists -> FRAUD or duplicate registration.
        """
        # Check for duplicate by hash
        if parcel.sih in self._by_hash:
            existing_codes = self._by_hash[parcel.sih]
            if existing_codes:
                raise ValueError(
                    f"Duplicate geometry detected. "
                    f"Spatial hash {parcel.sih[:12]}... "
                    f"already registered as {existing_codes[0]}"
                )
        
        # Store by Code
        self._by_code[parcel.parcel_code] = parcel
        
        # Index by hash
        if parcel.sih not in self._by_hash:
            self._by_hash[parcel.sih] = []
        self._by_hash[parcel.sih].append(parcel.parcel_code)
        
        # Index by grid
        grid_key = parcel.reference_grid.key()
        if grid_key not in self._by_grid:
            self._by_grid[grid_key] = []
        self._by_grid[grid_key].append(parcel.parcel_code)
        
        # Index lineage
        for parent_code in parcel.parents:
            if parent_code not in self._lineage:
                self._lineage[parent_code] = []
            self._lineage[parent_code].append(parcel.parcel_code)
        
        return True
    
    def get(self, parcel_code: str) -> Optional[ParcelIdentity]:
        """Retrieve by parcel code"""
        return self._by_code.get(parcel_code)
    
    def get_by_hash(self, sih: str) -> List[ParcelIdentity]:
        """Find parcels by spatial hash (should be 0 or 1)"""
        parcel_codes = self._by_hash.get(sih, [])
        return [self._by_code[pc] for pc in parcel_codes]
    
    def get_in_grid(self, grid_ref: GridRef) -> List[ParcelIdentity]:
        """Grid-bounded query: all parcels in a grid cell"""
        grid_key = grid_ref.key()
        parcel_codes = self._by_grid.get(grid_key, [])
        return [self._by_code[pc] for pc in parcel_codes]
    
    def get_children(self, parent_code: str) -> List[ParcelIdentity]:
        """Get all children of a parent"""
        child_codes = self._lineage.get(parent_code, [])
        return [self._by_code[pc] for pc in child_codes]
    
    def next_sequence(self, grid_key: str) -> int:
        """Get next sequence number for a grid"""
        if grid_key not in self._sequences:
            self._sequences[grid_key] = 1
        else:
            self._sequences[grid_key] += 1
        return self._sequences[grid_key]
    
    def all_parcels(self) -> List[ParcelIdentity]:
        """Get all parcels (memory-bounded for small datasets)"""
        return list(self._by_code.values())
    
    def count(self) -> int:
        return len(self._by_code)
    
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
        - Computes deterministic parcel code from grid
        - Checks for duplicate geometry
        """
        # Create parcel identity
        grid_ref = GridRef(grid_id, grid_x, grid_y)
        grid_key = grid_ref.key()
        seq = self.store.next_sequence(grid_key)
        
        parcel_code = f"SL-{grid_key}-{seq:04d}"
        
        parcel = create_parcel_identity(
            polygon=polygon,
            parcel_code=parcel_code,
            reference_grid=grid_ref,
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
        - Child gets new code and lineage link
        - Parent updated with child reference
        """
        # Create child identity
        grid_ref = GridRef(grid_id, grid_x, grid_y)
        grid_key = grid_ref.key()
        seq = self.store.next_sequence(grid_key)
        
        child_code = f"SL-{grid_key}-{seq:04d}"
        
        child = create_parcel_identity(
            polygon=child_polygon,
            parcel_code=child_code,
            reference_grid=grid_ref,
            owner=parent.owner,
            actor=actor
        )
        
        # Set lineage
        child.parents = [parent.parcel_code]
        
        # Store child
        self.store.store(child)
        
        # Update parent
        parent.register_child(child_code)
        parent.add_event(
            event_type=EventType.SUBDIVIDED,
            actor=actor,
            msg=f"Child parcel created: {child_code}",
            meta={"child_code": child_code, "child_area": child.area}
        )
        
        return child
    
    def verify_parcel(self, parcel_code: str, actor: str = "oarg"):
        """Mark parcel as verified by OARG"""
        parcel = self.store.get(parcel_code)
        if not parcel:
            raise ValueError(f"Parcel not found: {parcel_code}")
        
        parcel.status = "verified"
        parcel.oarg_approved = True
        parcel.add_event(
            event_type=EventType.VERIFIED,
            actor=actor,
            msg=f"Parcel verified by OARG",
            meta={"timestamp": datetime.utcnow().isoformat()}
        )
    
    def flag_fraud(self, parcel_code: str, reason: str, actor: str = "system"):
        """Flag parcel as fraudulent"""
        parcel = self.store.get(parcel_code)
        if not parcel:
            raise ValueError(f"Parcel not found: {parcel_code}")
        
        parcel.status = "disputed"
        parcel.add_event(
            event_type=EventType.FRAUD_FLAGGED,
            actor=actor,
            msg=f"Fraud flagged: {reason}",
            meta={"reason": reason}
        )
    
    def detect_duplicate(self, polygon: List[Tuple[float, float]]) -> Optional[ParcelIdentity]:
        """Check if polygon already exists"""
        sih = ParcelIdentity.compute_spatial_hash(polygon)
        duplicates = self.store.get_by_hash(sih)
        return duplicates[0] if duplicates else None
    
    def get_parcel_genealogy(self, parcel_code: str) -> Dict:
        """Get full lineage: parent, children, ancestors"""
        parcel = self.store.get(parcel_code)
        if not parcel:
            return {}
        
        ancestors = []
        current = parcel
        while current.parents:
            parent_code = current.parents[0]
            ancestors.append(parent_code)
            current = self.store.get(parent_code)
            if not current:
                break
        
        return {
            "parcel_code": parcel_code,
            "parents": parcel.parents,
            "children": parcel.children,
            "ancestors": ancestors
        }
    
    def __repr__(self):
        return f"<ParcelGovernance {self.store}>"
