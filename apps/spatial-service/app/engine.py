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
from parcel_identity import ParcelIdentity, EventType, GridRef
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
        - Generates deterministic parcel code
        - Checks for duplicate geometry (fraud detection)
        
        Returns: ParcelIdentity with parcel_code, sih, area, grid
        """
        # Validate polygon
        if polygon[0] != polygon[-1]:
            raise ValueError("Polygon must be closed (first == last vertex)")
        
        # Detect grid from first vertex
        grid_id, grid_x, grid_y = determine_reference_grid(polygon)
        
        # Check for duplicate geometry BEFORE storing
        sih = ParcelIdentity.compute_spatial_hash(polygon)
        duplicates = self.gov.store.get_by_hash(sih)
        if duplicates:
            raise ValueError(
                f"DUPLICATE GEOMETRY DETECTED. "
                f"Spatial hash already registered as {duplicates[0].parcel_code}"
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
        parcel_code: str,
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
        parcel = self.gov.store.get(parcel_code)
        if not parcel:
            raise ValueError(f"Parcel not found: {parcel_code}")
        
        # Grid-bounded query: only parcels in same grid cell
        grid_parcels = self.gov.store.get_in_grid(parcel.reference_grid)
        other_parcels = [p for p in grid_parcels if p.parcel_code != parcel_code]
        
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
                msg=f"Conflict with {other_parcel.parcel_code}: {decision.classification.value}",
                meta={
                    "related_parcel": other_parcel.parcel_code,
                    "relation": spatial_result.relation.value,
                    "overlap_pct": spatial_result.overlap_pct_a,
                    "decision": decision.classification.value
                }
            )
        
        return decisions
    
    def create_subdivision(
        self,
        parent_code: str,
        child_polygons: List[List[Tuple[float, float]]],
        actor: str = "system"
    ) -> List[ParcelIdentity]:
        """
        Create a subdivision (parcel birth).
        
        Rules:
        - Parent geometry UNCHANGED
        - Each child gets new parcel code and lineage link
        - Validates subdivision pattern (containment + area)
        
        Returns: List of child ParcelIdentity
        """
        parent = self.gov.store.get(parent_code)
        if not parent:
            raise ValueError(f"Parent parcel not found: {parent_code}")
        
        # Validate subdivision pattern
        # (Create temporary child parcels for validation)
        temp_children = []
        for child_poly in child_polygons:
            grid_id, grid_x, grid_y = determine_reference_grid(child_poly)
            child = ParcelIdentity(
                parcel_code="temp",
                sih="temp",
                polygon=child_poly,
                area=ParcelIdentity.compute_polygon_area(child_poly),
                reference_grid=GridRef(grid_id, grid_x, grid_y)
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
    
    def verify_parcel(self, parcel_code: str, actor: str = "oarg"):
        """Verify parcel by OARG authority"""
        self.gov.verify_parcel(parcel_code, actor=actor)
    
    def flag_fraud(self, parcel_code: str, reason: str, actor: str = "system"):
        """Flag parcel for fraud"""
        self.gov.flag_fraud(parcel_code, reason, actor=actor)
    
    def get_genealogy(self, parcel_code: str) -> dict:
        """Get parcel genealogy (parent, children, ancestors)"""
        return self.gov.get_parcel_genealogy(parcel_code)
    
    def get_parcel(self, parcel_code: str) -> Optional[ParcelIdentity]:
        """Retrieve parcel by code"""
        return self.gov.store.get(parcel_code)
    
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
