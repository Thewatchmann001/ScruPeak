"""
ScruPeak Spatial Intelligence Agent Orchestrator

Main entry point for spatial operations:
- Register parcels and create CSIs
- Detect spatial conflicts and events
- Classify events and produce decisions
- Enforce OARG authority and lineage rules
"""

from typing import List, Tuple, Optional
from datetime import datetime
import uuid

from csi_model import CompositeSpatialIdentity, ParcelEvent, EventType
from engine import SpatialIntelligence # Renamed to SpatialEngine, but keeping original import for now
from grid_new import determine_reference_grid
from spatial_detector import SpatialRelationshipDetector
from decision_engine import DecisionEngine, SpatialDecision
from exceptions import (
    ParcelNotFoundError,
    InvalidGeometryError,
    LineageError
)


class SpatialIntelligenceAgent:
    """
    High-level orchestrator for spatial verification and integrity.
    
    Responsibilities:
    1. Accept parcel geometries
    2. Assign CSI and grid references
    3. Detect spatial conflicts
    4. Classify events
    5. Produce three-section decisions
    6. Maintain append-only history
    7. Enforce lineage rules
    """
    
    def __init__(self):
        self.engine = SpatialIntelligence() # Use the refactored SpatialIntelligence (formerly engine_v2)
        self.detector = SpatialRelationshipDetector() # Still used for geometry validation
        self.decision_engine = DecisionEngine(self.engine.registry) # Pass the engine's registry to decision engine
        self.decisions: List[SpatialDecision] = []
    
    def register_parcel(
        self,
        geometry: List[Tuple[float, float]],
        owner: Optional[str] = None,
        initiated_by: str = "system"
    ) -> CompositeSpatialIdentity:
        """
        Register a new parcel (parcel birth event).
        
        Args:
            geometry: Closed polygon [(lat, lon), ..., (lat, lon)]
            owner: Owner name (optional)
            initiated_by: Actor name
        
        Returns:
            CompositeSpatialIdentity (CSI) with parcel code
        """
        # Validate geometry
        if geometry[0] != geometry[-1]:
            raise InvalidGeometryError("Geometry must be a closed polygon (first = last vertex)")
        if len(geometry) < 4:
            raise InvalidGeometryError("Polygon must have at least 3 unique vertices")
        
        # Determine reference grid from first vertex
        grid_id, grid_x, grid_y = determine_reference_grid(geometry)
        
        # Use the engine to register the parcel
        csi = self.engine.register_parcel(
            geometry=geometry,
            grid_id=grid_id,
            grid_x=grid_x,
            grid_y=grid_y,
            owner=owner,
            initiated_by=initiated_by
        )
        
        return csi
    
    def detect_and_classify_conflicts(
        self,
        subject_parcel_code: str,
        initiated_by: str = "system"
    ) -> Optional[SpatialDecision]:
        """
        Detect spatial conflicts for a parcel and produce a decision.
        
        Process:
        1. Retrieve subject CSI
        2. Check against all other parcels in registry
        3. Detect spatial relationships
        4. Classify event
        5. Produce three-section decision
        
        Args:
            subject_parcel_code: Parcel code to analyze
            initiated_by: Actor name
        
        Returns:
            SpatialDecision (or None if no conflicts)
        """
        # Use the engine to detect and classify conflicts
        decisions = self.engine.detect_conflicts_for_parcel(subject_parcel_code, initiated_by)
        
        if not decisions:
            return None
        
        # Assuming detect_conflicts_for_parcel returns a list, take the first one for now
        decision = decisions[0]
        self.decisions.append(decision)
        
        return decision
    
    def create_subdivision(
        self,
        parent_parcel_code: str,
        child_geometries: List[List[Tuple[float, float]]],
        relationship_type: str = "subdivision",
        initiated_by: str = "system",
        new_parent_geometry: Optional[List[Tuple[float, float]]] = None
    ) -> List[CompositeSpatialIdentity]:
        """
        Create a subdivision (parent remains intact; children born with lineage).
        
        Args:
            parent_parcel_code: Parent parcel code
            child_geometries: List of child polygon geometries
            relationship_type: "subdivision" or "split"
            initiated_by: Actor name
        
        Returns:
            List of child CSIs with parcel codes
        """
        # The engine's create_subdivision will handle fetching the parent
        # and performing validation.
        
        # Validate subdivision geometries using the detector
        # Check if subdivision is valid
        if not self.detector.validate_subdivision_geometries(parent_csi.geometry, child_geometries):
            raise LineageError("Invalid subdivision pattern. Child areas do not match parent.")
        
        # Create children with lineage
        children = self.engine.create_subdivision(
            parent_code=parent_parcel_code,
            child_polygons=child_geometries,
            relationship_type=relationship_type,
            initiated_by=initiated_by,
            new_parent_polygon=new_parent_geometry
        )
        return children
    
    def verify_parcel_oarg(
        self,
        parcel_code: str,
        initiated_by: str = "oarg_officer"
    ):
        """Mark parcel as verified by OARG authority"""
        self.engine.verify_parcel(parcel_code, actor=initiated_by)
    
    def flag_fraud_risk(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        """Flag a parcel for fraud risk"""
        self.engine.flag_fraud(parcel_code, reason, actor=initiated_by)
    
    def request_oarg_review(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        """Request manual OARG review"""
        # The engine doesn't have a direct request_oarg_review.
        # This functionality should be added to the engine or handled directly by the registry.
        # For now, I'll call the registry directly.
        self.engine.registry.request_oarg_review(parcel_code, reason, initiated_by=initiated_by)
    
    def get_parcel_genealogy(self, parcel_code: str) -> dict:
        """Get full lineage: ancestors and children"""
        return self.engine.get_genealogy(parcel_code)
    
    def print_decision(self, decision: SpatialDecision):
        """Pretty-print a decision in three sections"""
        print(decision)
    
    def get_all_decisions(self) -> List[SpatialDecision]:
        """Retrieve all decisions issued"""
        return self.engine.get_all_decisions() # Get decisions from the engine
    
    def get_all_events(self):
        """Retrieve all parcel events (append-only log)"""
        return self.engine.registry.get_all_events() # Get events from the engine's registry
    
    def summary_report(self) -> str:
        """Generate a brief report of registry state"""
        stats = self.engine.stats()
        return f"""
ScruPeak Spatial Intelligence Agent
=====================================
Registered Parcels: {stats['total_parcels']}
Total Events: {stats['total_events']} # Assuming engine.stats() will provide this
Decisions Issued: {stats['decisions']}
"""


# ========== EXAMPLE USAGE ==========

if __name__ == "__main__":
    agent = SpatialIntelligenceAgent()
    
    # Example: Register a parcel
    parcel_1 = agent.register_parcel(
        geometry=[
            (6.90, -13.30),
            (6.91, -13.30),
            (6.91, -13.31),
            (6.90, -13.31),
            (6.90, -13.30)  # close
        ],
        owner="Alice",
        initiated_by="land_officer"
    )
    print(f"Registered: {parcel_1.parcel_code}")
    print(f"CSI: {parcel_1.csi_id}")
    print(f"Grid: {parcel_1.grid_ref.canonical_key()}")
    
    # Example: Register an overlapping parcel (should trigger conflict)
    parcel_2 = agent.register_parcel(
        geometry=[
            (6.905, -13.305),
            (6.915, -13.305),
            (6.915, -13.315),
            (6.905, -13.315),
            (6.905, -13.305)
        ],
        owner="Bob",
        initiated_by="land_officer"
    )
    print(f"\nRegistered: {parcel_2.parcel_code}")
    
    # Detect conflict
    decision = agent.detect_and_classify_conflicts(
        subject_parcel_code=parcel_1.parcel_code,
        initiated_by="system"
    )
    
    if decision:
        agent.print_decision(decision)
    
    # Summary
    print(agent.summary_report())
