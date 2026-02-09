"""
Parcel Storage & Governance (Exact Spec)

Grid-indexed storage, SIH deduplication, lineage enforcement.
"""

from typing import Dict, List, Optional, Tuple
from parcel_id import ParcelIdentity, compute_sih, compute_area, validate_polygon, create_parcel_identity
from datetime import datetime


class ParcelStore:
    """
    Deterministic parcel storage indexed by grid.
    
    Lookups:
    - By parcel_code (primary key)
    - By sih (deduplication)
    - By reference_grid (grid-bounded queries)
    - By parents (genealogy)
    """
    
    def __init__(self):
        # Primary: parcel_code -> ParcelIdentity
        self._by_code: Dict[str, ParcelIdentity] = {}
        
        # Deduplication: sih -> parcel_code (unique)
        self._by_sih: Dict[str, str] = {}
        
        # Grid index: "001-00-02" -> [parcel_codes]
        self._by_grid: Dict[str, List[str]] = {}
        
        # Lineage: parent_code -> [child_codes]
        self._lineage: Dict[str, List[str]] = {}
        
        # Sequence counter: "001-00-02" -> next_seq
        self._sequences: Dict[str, int] = {}
    
    def store(self, parcel: ParcelIdentity) -> bool:
        """
        Store parcel. Returns True if stored.
        Raises ValueError if SIH already exists (duplicate geometry).
        """
        # Deduplication check: SIH must be unique
        if parcel.sih in self._by_sih:
            existing_code = self._by_sih[parcel.sih]
            raise ValueError(
                f"DUPLICATE GEOMETRY DETECTED. "
                f"SIH {parcel.sih[:12]}... already registered as {existing_code}"
            )
        
        # Store by code
        self._by_code[parcel.parcel_code] = parcel
        
        # Index by SIH
        self._by_sih[parcel.sih] = parcel.parcel_code
        
        # Index by grid
        grid_key = parcel.reference_grid
        if grid_key not in self._by_grid:
            self._by_grid[grid_key] = []
        self._by_grid[grid_key].append(parcel.parcel_code)
        
        # Index lineage (parents)
        for parent_code in parcel.parents:
            if parent_code not in self._lineage:
                self._lineage[parent_code] = []
            if parcel.parcel_code not in self._lineage[parent_code]:
                self._lineage[parent_code].append(parcel.parcel_code)
        
        return True
    
    def get(self, parcel_code: str) -> Optional[ParcelIdentity]:
        """Retrieve by parcel code"""
        return self._by_code.get(parcel_code)
    
    def get_by_sih(self, sih: str) -> Optional[ParcelIdentity]:
        """Check if geometry already exists (deduplication)"""
        parcel_code = self._by_sih.get(sih)
        return self._by_code.get(parcel_code) if parcel_code else None
    
    def get_in_grid(self, reference_grid: str) -> List[ParcelIdentity]:
        """Grid-bounded query: all parcels in a grid cell"""
        parcel_codes = self._by_grid.get(reference_grid, [])
        return [self._by_code[code] for code in parcel_codes if code in self._by_code]
    
    def get_children(self, parent_code: str) -> List[ParcelIdentity]:
        """Get all children of a parent"""
        child_codes = self._lineage.get(parent_code, [])
        return [self._by_code[code] for code in child_codes if code in self._by_code]
    
    def next_sequence(self, reference_grid: str) -> int:
        """Get next sequence number for a grid"""
        if reference_grid not in self._sequences:
            self._sequences[reference_grid] = 1
        else:
            self._sequences[reference_grid] += 1
        return self._sequences[reference_grid]
    
    def all_parcels(self) -> List[ParcelIdentity]:
        """Get all parcels"""
        return list(self._by_code.values())
    
    def count(self) -> int:
        return len(self._by_code)
    
    def __repr__(self):
        return f"<ParcelStore {self.count()} parcels, {len(self._by_sih)} SIHs>"


class ParcelRegistry:
    """
    Parcel creation, subdivision, lineage, and governance.
    
    Rules:
    - No overwrite (append-only)
    - Grid reference from first vertex
    - Deterministic parcel codes
    - SIH deduplication
    - Lineage preservation
    """
    
    def __init__(self):
        self.store = ParcelStore()
    
    def register_parcel(
        self,
        polygon: List[Tuple[float, float]],
        reference_grid: str,
        actor: str = "system",
        reason: str = ""
    ) -> ParcelIdentity:
        """
        Register a new parcel.
        
        - Validates closed polygon
        - Checks for duplicate geometry (SIH)
        - Generates deterministic parcel_code
        """
        # Validate geometry
        is_valid, error = validate_polygon(polygon)
        if not is_valid:
            raise ValueError(error)
        
        # Check for duplicate geometry
        sih = compute_sih(polygon)
        duplicate = self.store.get_by_sih(sih)
        if duplicate:
            raise ValueError(
                f"DUPLICATE GEOMETRY. Already registered as {duplicate.parcel_code}"
            )
        
        # Generate parcel code: "SL-{reference_grid}-{sequence:04d}"
        seq = self.store.next_sequence(reference_grid)
        parcel_code = f"SL-{reference_grid}-{seq:04d}"
        
        # Create parcel identity
        birth_event = f"created by {actor} at {datetime.utcnow()}"
        if reason:
            birth_event += f" reason: {reason}"
        
        parcel = create_parcel_identity(
            parcel_code=parcel_code,
            reference_grid=reference_grid,
            polygon=polygon,
            birth_event=birth_event,
            actor=actor
        )
        
        # Store
        self.store.store(parcel)
        
        return parcel
    
    def create_child_parcel(
        self,
        parent_code: str,
        child_polygon: List[Tuple[float, float]],
        child_reference_grid: str,
        actor: str = "system",
        reason: str = ""
    ) -> ParcelIdentity:
        """
        Create a child parcel (subdivision).
        
        - Parent remains in store (immutable)
        - Child created with lineage link
        - Both parent and child updated
        """
        # Get parent
        parent = self.store.get(parent_code)
        if not parent:
            raise ValueError(f"Parent parcel not found: {parent_code}")
        
        # Create child
        seq = self.store.next_sequence(child_reference_grid)
        child_code = f"SL-{child_reference_grid}-{seq:04d}"
        
        birth_event = f"created by {actor} at {datetime.utcnow()} parent={parent_code}"
        if reason:
            birth_event += f" reason: {reason}"
        
        child = create_parcel_identity(
            parcel_code=child_code,
            reference_grid=child_reference_grid,
            polygon=child_polygon,
            birth_event=birth_event,
            actor=actor,
            parents=[parent_code]  # Child has parent link
        )
        
        # Store child
        self.store.store(child)
        
        # Update parent: add child to parent.children
        if child_code not in parent.children:
            parent.children.append(child_code)
        
        return child
    
    def get_genealogy(self, parcel_code: str) -> Dict:
        """Get parcel genealogy"""
        parcel = self.store.get(parcel_code)
        if not parcel:
            return {}
        
        return {
            "parcel_code": parcel_code,
            "parents": parcel.parents,
            "children": parcel.children,
            "sih": parcel.sih,
            "area": parcel.area,
            "reference_grid": parcel.reference_grid
        }
    
    def __repr__(self):
        return f"<ParcelRegistry {self.store}>"
