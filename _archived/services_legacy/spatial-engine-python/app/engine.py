"""
ScruPeak Spatial Intelligence Orchestrator

Core operations:
1. Register parcels (deterministic ID + spatial hash)
2. Detect spatial conflicts (grid-bounded queries)
3. Classify conflicts (3-section decisions)
4. Create subdivisions (parcel birth with lineage)
5. Query genealogy (full lineage history)
"""

from typing import List, Tuple, Optional
from parcel_identity import ParcelIdentity, GridRef, EventType
from governance import ParcelGovernance
from spatial_analysis import (
    analyze_spatial_relation,
    detect_conflicts,
    is_valid_subdivision,
    find_overlaps_in_grid
)
from decisions import classify_relation, Decision, DecisionType
from grid_new import determine_reference_grid
import uuid


class SpatialIntelligence:
    """
    Unified spatial intelligence engine.
    
    Core responsibility:
    - Register parcels with deterministic IDs
    - Detect overlaps via grid-bounded queries
    - Classify conflicts (3-section decisions)
    - Preserve lineage forever
    - Flag fraud (duplicate geometry, orphans, unauthorized overlap)
    """
    
    def __init__(self):
        self.gov = ParcelGovernance()
        self.decisions: List[Decision] = []
    
    def register_parcel(
        self,
        polygon: List[Tuple[float, float]],
        owner: Optional[str] = None,
        actor: str = "system"
    ) -> ParcelIdentity:
        """
        Register a new parcel.
        
        - Validates closed polygon
        - Auto-detects grid from first vertex
        - Generates deterministic parcel ID
        - Checks for duplicate geometry (fraud detection)
        
        Returns: ParcelIdentity with parcel_id, spatial_hash, area, grid
        """
        # Validate polygon
        if polygon[0] != polygon[-1]:
            raise ValueError("Polygon must be closed (first == last vertex)")
        
        # Detect grid from first vertex
        grid_id, grid_x, grid_y = determine_reference_grid(polygon)
        
        # Check for duplicate geometry BEFORE storing
        spatial_hash = ParcelIdentity.compute_spatial_hash(polygon)
        duplicates = self.gov.store.get_by_hash(spatial_hash)
        if duplicates:
            raise ValueError(
                f"DUPLICATE GEOMETRY DETECTED. "
                f"Spatial hash already registered as {duplicates[0].parcel_id}"
            )
        
        # Register parcel
        parcel = self.gov.register_parcel(
            polygon=polygon,
            grid_id=grid_id,
            grid_x=grid_x,
            grid_y=grid_y,
            owner=owner,
            actor=actor
        )
        
        return parcel
    
    def detect_conflicts_for_parcel(
        self,
        parcel_id: str,
        actor: str = "system"
    ) -> List[Decision]:
        """
        Detect spatial conflicts for a parcel.
        
        Process:
        1. Retrieve parcel
        2. Get all parcels in same grid (grid-bounded query)
        3. Analyze spatial relationships
        4. Classify each conflict
        5. Return list of 3-section decisions
        """
        parcel = self.gov.store.get(parcel_id)
        if not parcel:
            raise ValueError(f"Parcel not found: {parcel_id}")
        
        # Grid-bounded query: only parcels in same grid cell
        grid_key = parcel.grid_ref.key()
        grid_parcels = self.gov.store.get_in_grid(parcel.grid_ref)
        other_parcels = [p for p in grid_parcels if p.parcel_id != parcel_id]
        
        # Detect conflicts
        conflicts = detect_conflicts(parcel, other_parcels)
        
        # Classify each conflict
        decisions = []
        for other_parcel, spatial_result in conflicts:
            decision = classify_relation(parcel, other_parcel, spatial_result)
            decisions.append(decision)
            self.decisions.append(decision)
            
            # Log event to parcel
            parcel.add_event(
                event_type=EventType.OVERLAP_DETECTED,
                actor=actor,
                msg=f"Conflict with {other_parcel.parcel_id}: {decision.classification.value}",
                meta={
                    "related_parcel": other_parcel.parcel_id,
                    "relation": spatial_result.relation.value,
                    "overlap_pct": spatial_result.overlap_pct_a,
                    "decision": decision.classification.value
                }
            )
        
        return decisions
    
    def create_subdivision(
        self,
        parent_id: str,
        child_polygons: List[List[Tuple[float, float]]],
        actor: str = "system"
    ) -> List[ParcelIdentity]:
        """
        Create a subdivision (parcel birth).
        
        Rules:
        - Parent geometry UNCHANGED
        - Each child gets new parcel ID and lineage link
        - Validates subdivision pattern (containment + area)
        
        Returns: List of child ParcelIdentity
        """
        parent = self.gov.store.get(parent_id)
        if not parent:
            raise ValueError(f"Parent parcel not found: {parent_id}")
        
        # Validate subdivision pattern
        # (Create temporary child parcels for validation)
        temp_children = []
        for child_poly in child_polygons:
            grid_id, grid_x, grid_y = determine_reference_grid(child_poly)
            child = ParcelIdentity(
                parcel_id="temp",
                spatial_hash="temp",
                polygon=child_poly,
                area_sqm=ParcelIdentity.compute_polygon_area(child_poly),
                grid_ref=GridRef(grid_id, grid_x, grid_y)
            )
            temp_children.append(child)
        
        is_valid, reason = is_valid_subdivision(parent, temp_children)
        if not is_valid:
            raise ValueError(f"Invalid subdivision: {reason}")
        
        # Create actual child parcels
        children = []
        for child_poly in child_polygons:
            grid_id, grid_x, grid_y = determine_reference_grid(child_poly)
            child = self.gov.create_child_parcel(
                parent=parent,
                child_polygon=child_poly,
                grid_id=grid_id,
                grid_x=grid_x,
                grid_y=grid_y,
                actor=actor
            )
            children.append(child)
        
        return children
    
    def verify_parcel(self, parcel_id: str, actor: str = "oarg"):
        """Verify parcel by OARG authority"""
        self.gov.verify_parcel(parcel_id, actor=actor)
    
    def flag_fraud(self, parcel_id: str, reason: str, actor: str = "system"):
        """Flag parcel for fraud"""
        self.gov.flag_fraud(parcel_id, reason, actor=actor)
    
    def get_genealogy(self, parcel_id: str) -> dict:
        """Get parcel genealogy (parent, children, ancestors)"""
        return self.gov.get_parcel_genealogy(parcel_id)
    
    def get_parcel(self, parcel_id: str) -> Optional[ParcelIdentity]:
        """Retrieve parcel by ID"""
        return self.gov.store.get(parcel_id)
    
    def get_all_decisions(self) -> List[Decision]:
        """Get all issued decisions"""
        return self.decisions
    
    def print_decision(self, decision: Decision):
        """Pretty-print a decision"""
        print(decision)
    
    def stats(self) -> dict:
        """System statistics"""
        all_parcels = self.gov.store.all_parcels()
        return {
            "total_parcels": len(all_parcels),
            "verified": len([p for p in all_parcels if p.status == "verified"]),
            "disputed": len([p for p in all_parcels if p.status == "disputed"]),
            "decisions": len(self.decisions),
            "grids_active": len(self.gov.store._by_grid)
        }
    
    def __repr__(self):
        stats = self.stats()
        return (
            f"<SpatialIntelligence "
            f"parcels={stats['total_parcels']} "
            f"verified={stats['verified']} "
            f"decisions={stats['decisions']}>"
        )


# ========== QUICK TEST ==========

if __name__ == "__main__":
    print("\n" + "="*70)
    print("ScruPeak Spatial Intelligence - Quick Test")
    print("="*70)
    
    si = SpatialIntelligence()
    
    # 1. Register parcel
    print("\n1. Register parcel...")
    p1 = si.register_parcel(
        polygon=[
            (6.90, -13.30),
            (6.91, -13.30),
            (6.91, -13.31),
            (6.90, -13.31),
            (6.90, -13.30)
        ],
        owner="Alice",
        actor="officer_001"
    )
    print(f"   ✓ {p1.parcel_id}")
    print(f"   ✓ Hash: {p1.spatial_hash[:12]}...")
    print(f"   ✓ Area: {p1.area_sqm:.0f} sqm")
    print(f"   ✓ Grid: {p1.grid_ref.key()}")
    
    # 2. Register overlapping parcel
    print("\n2. Register overlapping parcel...")
    p2 = si.register_parcel(
        polygon=[
            (6.905, -13.305),
            (6.915, -13.305),
            (6.915, -13.315),
            (6.905, -13.315),
            (6.905, -13.305)
        ],
        owner="Bob",
        actor="officer_002"
    )
    print(f"   ✓ {p2.parcel_id}")
    
    # 3. Detect conflicts
    print("\n3. Detect conflicts...")
    decisions = si.detect_conflicts_for_parcel(p1.parcel_id)
    if decisions:
        for d in decisions:
            si.print_decision(d)
    
    # 4. Verify parcel
    print("\n4. Verify parcel...")
    si.verify_parcel(p1.parcel_id, actor="oarg_001")
    print(f"   ✓ {p1.parcel_id} verified")
    
    # 5. Check stats
    print(f"\n5. System stats:")
    stats = si.stats()
    for k, v in stats.items():
        print(f"   {k}: {v}")
    
    print("\n" + "="*70)
    print("✓ QUICK TEST COMPLETE")
    print("="*70 + "\n")
