"""
ScruPeak Spatial Intelligence Engine (Exact Spec)

Core operations:
1. Register parcels (deterministic code + SIH dedup)
2. Detect conflicts (grid-bounded queries)
3. Create subdivisions (parcel birth with lineage)
4. Query genealogy (full family tree)
"""

from typing import List, Tuple, Optional
from parcel_id import ParcelIdentity, compute_sih, validate_polygon
from registry_v2 import ParcelRegistry
from spatial_analysis import analyze_spatial_relation, SpatialRelation
from decisions import classify_relation, Decision, DecisionType
from grid_new import determine_reference_grid


class SpatialEngine:
    """
    ScruPeak Spatial Intelligence Engine.
    
    Core principle: Geometry is truth.
    If you change the geometry, you changed the land.
    """
    
    def __init__(self):
        self.registry = ParcelRegistry()
        self.decisions: List[Decision] = []
    
    def register_parcel(
        self,
        polygon: List[Tuple[float, float]],
        actor: str = "system",
        reason: str = ""
    ) -> ParcelIdentity:
        """
        Register a new parcel.
        
        - Validates closed polygon
        - Auto-detects grid from first vertex
        - Checks for duplicate geometry (SIH)
        - Generates deterministic parcel code
        
        Returns: ParcelIdentity
        """
        # Validate polygon
        is_valid, error = validate_polygon(polygon)
        if not is_valid:
            raise ValueError(f"Invalid polygon: {error}")
        
        # Detect grid from first vertex
        grid_id, grid_x, grid_y = determine_reference_grid(polygon)
        reference_grid = f"{grid_id:03d}{grid_x:02d}{grid_y:02d}"
        
        # Register
        parcel = self.registry.register_parcel(
            polygon=polygon,
            reference_grid=reference_grid,
            actor=actor,
            reason=reason
        )
        
        return parcel
    
    def detect_conflicts(
        self,
        parcel_code: str,
        actor: str = "system"
    ) -> List[Decision]:
        """
        Detect spatial conflicts for a parcel.
        
        Grid-bounded query: only check parcels in same grid cell.
        
        Returns: List of 3-section decisions
        """
        parcel = self.registry.store.get(parcel_code)
        if not parcel:
            raise ValueError(f"Parcel not found: {parcel_code}")
        
        # Get grid-bounded parcels (only same grid cell)
        grid_parcels = self.registry.store.get_in_grid(parcel.reference_grid)
        others = [p for p in grid_parcels if p.parcel_code != parcel_code]
        
        # Analyze spatial relationships
        decisions = []
        for other in others:
            result = analyze_spatial_relation(parcel, other)
            
            # Skip if disjoint (no conflict)
            if result.relation == SpatialRelation.DISJOINT:
                continue
            
            # Classify conflict
            decision = classify_relation(parcel, other, result)
            decisions.append(decision)
            self.decisions.append(decision)
        
        return decisions
    
    def create_subdivision(
        self,
        parent_code: str,
        child_polygons: List[List[Tuple[float, float]]],
        actor: str = "system",
        reason: str = ""
    ) -> List[ParcelIdentity]:
        """
        Create a subdivision (parcel birth).
        
        - Parent geometry stays immutable
        - Each child gets new code with lineage
        
        Returns: List of child ParcelIdentities
        """
        parent = self.registry.store.get(parent_code)
        if not parent:
            raise ValueError(f"Parent parcel not found: {parent_code}")
        
        children = []
        for child_poly in child_polygons:
            # Detect grid from child's first vertex
            grid_id, grid_x, grid_y = determine_reference_grid(child_poly)
            child_reference_grid = f"{grid_id:03d}{grid_x:02d}{grid_y:02d}"
            
            # Create child
            child = self.registry.create_child_parcel(
                parent_code=parent_code,
                child_polygon=child_poly,
                child_reference_grid=child_reference_grid,
                actor=actor,
                reason=reason
            )
            children.append(child)
        
        return children
    
    def get_genealogy(self, parcel_code: str) -> dict:
        """Get parcel genealogy (parents, children, SIH, area)"""
        return self.registry.get_genealogy(parcel_code)
    
    def get_parcel(self, parcel_code: str) -> Optional[ParcelIdentity]:
        """Retrieve parcel by code"""
        return self.registry.store.get(parcel_code)
    
    def get_all_decisions(self) -> List[Decision]:
        """Get all decisions"""
        return self.decisions
    
    def print_decision(self, decision: Decision):
        """Pretty-print a decision"""
        print(decision)
    
    def stats(self) -> dict:
        """System stats"""
        all_parcels = self.registry.store.all_parcels()
        return {
            "total_parcels": len(all_parcels),
            "unique_sihs": len(self.registry.store._by_sih),
            "grids_active": len(self.registry.store._by_grid),
            "decisions": len(self.decisions)
        }
    
    def __repr__(self):
        stats = self.stats()
        return (
            f"<SpatialEngine parcels={stats['total_parcels']} "
            f"decisions={stats['decisions']}>"
        )


# ========== QUICK TEST ==========

if __name__ == "__main__":
    print("\n" + "="*70)
    print("ScruPeak Spatial Intelligence Engine - Test")
    print("="*70)
    
    engine = SpatialEngine()
    
    # 1. Register parcel
    print("\n1. Register parcel...")
    p1 = engine.register_parcel(
        polygon=[
            (6.90, -13.30),
            (6.91, -13.30),
            (6.91, -13.31),
            (6.90, -13.31),
            (6.90, -13.30)
        ],
        actor="officer_001",
        reason="Initial land registration"
    )
    print(f"   ✓ {p1.parcel_code}")
    print(f"   ✓ Grid: {p1.reference_grid}")
    print(f"   ✓ SIH: {p1.sih[:12]}...")
    print(f"   ✓ Area: {p1.area:.0f} sqm")
    
    # 2. Try duplicate (should fail)
    print("\n2. Try registering duplicate geometry (should fail)...")
    try:
        p_dup = engine.register_parcel(
            polygon=p1.polygon,  # SAME geometry
            actor="fraud_actor",
            reason="Fraudulent duplicate"
        )
    except ValueError as e:
        print(f"   ✓ Caught duplicate: {str(e)[:60]}...")
    
    # 3. Register overlapping parcel
    print("\n3. Register overlapping parcel...")
    p2 = engine.register_parcel(
        polygon=[
            (6.905, -13.305),
            (6.915, -13.305),
            (6.915, -13.315),
            (6.905, -13.315),
            (6.905, -13.305)
        ],
        actor="officer_002",
        reason="Overlapping land"
    )
    print(f"   ✓ {p2.parcel_code}")
    
    # 4. Detect conflicts
    print("\n4. Detect conflicts...")
    decisions = engine.detect_conflicts(p1.parcel_code)
    if decisions:
        for d in decisions:
            print(f"   - Classification: {d.classification.value}")
            print(f"   - Overlap: {d.overlap_pct:.1f}%")
    
    # 5. Create subdivision
    print("\n5. Create subdivision...")
    children = engine.create_subdivision(
        parent_code=p1.parcel_code,
        child_polygons=[
            [
                (6.90, -13.30),
                (6.905, -13.30),
                (6.905, -13.305),
                (6.90, -13.305),
                (6.90, -13.30)
            ],
            [
                (6.905, -13.30),
                (6.91, -13.30),
                (6.91, -13.305),
                (6.905, -13.305),
                (6.905, -13.30)
            ]
        ],
        actor="surveyor_001",
        reason="Land subdivision"
    )
    for child in children:
        print(f"   ✓ {child.parcel_code}")
        print(f"     Parents: {child.parents}")
    
    # 6. Get genealogy
    print(f"\n6. Get genealogy for {children[0].parcel_code}...")
    gen = engine.get_genealogy(children[0].parcel_code)
    print(f"   Parents: {gen['parents']}")
    print(f"   Children: {gen['children']}")
    
    # 7. Stats
    print(f"\n7. System stats:")
    stats = engine.stats()
    for k, v in stats.items():
        print(f"   {k}: {v}")
    
    print("\n" + "="*70)
    print("✓ TEST COMPLETE")
    print("="*70 + "\n")
