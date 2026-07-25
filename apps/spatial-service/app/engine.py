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
from registry import ParcelRegistry
from spatial_analysis import (
    analyze_spatial_relation,
    detect_conflicts,
    is_valid_subdivision,
    find_overlaps_in_grid
)
from decisions import classify_relation, Decision, DecisionType # Assuming Decision and DecisionType are still relevant
from grid_new import determine_reference_grid
import uuid
from csi_model import CompositeSpatialIdentity, GridReference, EventType as CSIEventType

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
        self.registry = ParcelRegistry() # Use the PostGIS registry
        self.decisions: List[Decision] = []
    
    def register_parcel(
        self,
        polygon: List[Tuple[float, float]],
        owner: Optional[str] = None,
        actor: str = "system"
    ) -> CompositeSpatialIdentity:
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
        # This check should ideally be done in the registry or a service layer
        # For now, we'll rely on the registry's internal checks or add one here if needed.
        # The registry.register_parcel method will handle uniqueness.

        # Check for partial overlaps in the same grid
        # This logic should be part of the conflict detection, not registration.
        # The registry.register_parcel will handle basic uniqueness.
        # More complex overlap checks are done via detect_conflicts_for_parcel.

        # Register parcel using the PostGIS registry
        parcel = self.registry.register_parcel(
            geometry=polygon,
            grid_id=grid_id,
            grid_x=grid_x,
            grid_y=grid_y,
            owner=owner,
            initiated_by=actor
        )
        
        # After registration, immediately check for conflicts with existing parcels
        # This is a critical step to prevent new parcels from encroaching.
        # The registry's detect_spatial_conflicts should be used here.
        conflict_event = self.registry.detect_spatial_conflicts(parcel)
        if conflict_event and conflict_event.spatial_relationship in ("overlap", "contains", "contained", "identical"):
            raise ValueError(f"SPATIAL OVERLAP DETECTED with {conflict_event.other_csis[0].parcel_code}. New parcels cannot encroach on existing ones.")

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
        
        # Use the registry's PostGIS-backed conflict detection
        subject_csi = self.registry.get_parcel(parcel_code)
        if not subject_csi:
            raise ValueError(f"Parcel not found: {parcel_code}")

        event = self.registry.detect_spatial_conflicts(subject_csi, initiated_by=actor)
        if not event:
            return [] # No conflicts found

        # Register the event in the registry
        self.registry.register_parcel_event(event, initiated_by=actor)

        # Classify the event to get a decision
        decision = self.decision_engine.classify_parcel_event(event, subject_csi)
        self.decisions.append(decision)

        # The decision object itself contains the classification, explanation, and justification
        # If there are multiple conflicts, detect_spatial_conflicts should return multiple events
        # or the decision engine should handle a list of events. For now, assuming one primary event.
        return [decision]
    
    def create_subdivision(
        self,
        parent_code: str,
        child_polygons: List[List[Tuple[float, float]]],
        actor: str = "system",
        new_parent_polygon: Optional[List[Tuple[float, float]]] = None
    ) -> List[CompositeSpatialIdentity]:
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
        for i, child_poly in enumerate(child_polygons):
            grid_id, grid_x, grid_y = determine_reference_grid(child_poly)
            child = self.gov.create_child_parcel(
                parent=parent,
                child_polygon=child_poly,
                grid_id=grid_id,
                grid_x=grid_x,
                grid_y=grid_y,
                actor=actor,
                new_parent_polygon=new_parent_polygon if i == len(child_polygons) - 1 else None
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
