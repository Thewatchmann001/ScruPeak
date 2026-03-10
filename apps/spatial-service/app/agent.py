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
from registry import ParcelRegistry
from grid_new import determine_reference_grid
from spatial_detector import SpatialRelationshipDetector
from decision_engine import DecisionEngine, SpatialDecision


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
        self.registry = ParcelRegistry()
        self.detector = SpatialRelationshipDetector()
        self.decision_engine = DecisionEngine(self.registry)
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
            raise ValueError("Geometry must be a closed polygon (first = last vertex)")
        if len(geometry) < 4:
            raise ValueError("Polygon must have at least 3 unique vertices")
        
        # Determine reference grid from first vertex
        grid_id, grid_x, grid_y = determine_reference_grid(geometry)
        
        # Register in repository
        csi = self.registry.register_parcel(
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
        subject_csi = self.registry.get_parcel(subject_parcel_code)
        if not subject_csi:
            raise ValueError(f"Parcel not found: {subject_parcel_code}")
        
        # Get all other parcels
        all_parcels = list(self.registry._parcels.values())
        others = [p for p in all_parcels if p.parcel_code != subject_parcel_code]
        
        if not others:
            return None
        
        # Detect conflicts
        event = self.detector.detect_conflict(
            subject=subject_csi,
            others=others,
            initiated_by=initiated_by
        )
        
        if not event:
            return None
        
        # Register event in registry
        self.registry.register_parcel_event(event, initiated_by=initiated_by)
        
        # Classify and produce decision
        decision = self.decision_engine.classify_parcel_event(event, subject_csi)
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
        parent_csi = self.registry.get_parcel(parent_parcel_code)
        if not parent_csi:
            raise ValueError(f"Parent parcel not found: {parent_parcel_code}")
        
        # Check if subdivision is valid
        child_csis_temp = []
        for child_geom in child_geometries:
            grid_id, grid_x, grid_y = determine_reference_grid(child_geom)
            # Create temporary CSI for validation
            from csi_model import GridReference
            temp_csi = CompositeSpatialIdentity(
                csi_id="temp",
                parcel_code="temp",
                geometry=child_geom,
                grid_ref=GridReference(grid_id, grid_x, grid_y)
            )
            child_csis_temp.append(temp_csi)
        
        # Validate subdivision pattern
        if not self.detector.detect_subdivision(parent_csi, child_csis_temp):
            raise ValueError("Invalid subdivision pattern. Child areas do not match parent.")
        
        # Create children with lineage
        children = []
        for i, child_geom in enumerate(child_geometries):
            grid_id, grid_x, grid_y = determine_reference_grid(child_geom)

            # For the last child being created, update the mother polygon if requested
            is_last = (i == len(child_geometries) - 1)
            parent_update = new_parent_geometry if is_last else None

            child_csi = self.registry.create_child_parcel(
                parent_csi=parent_csi,
                child_geometry=child_geom,
                grid_id=grid_id,
                grid_x=grid_x,
                grid_y=grid_y,
                relationship_type=relationship_type,
                initiated_by=initiated_by,
                new_parent_geometry=parent_update
            )
            children.append(child_csi)
        
        return children
    
    def verify_parcel_oarg(
        self,
        parcel_code: str,
        initiated_by: str = "oarg_officer"
    ):
        """Mark parcel as verified by OARG authority"""
        self.registry.verify_parcel(parcel_code, initiated_by=initiated_by)
    
    def flag_fraud_risk(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        """Flag a parcel for fraud risk"""
        self.registry.flag_fraud_risk(parcel_code, reason, initiated_by=initiated_by)
    
    def request_oarg_review(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        """Request manual OARG review"""
        self.registry.request_oarg_review(parcel_code, reason, initiated_by=initiated_by)
    
    def get_parcel_genealogy(self, parcel_code: str) -> dict:
        """Get full lineage: ancestors and children"""
        return self.registry.get_parcel_lineage(parcel_code)
    
    def print_decision(self, decision: SpatialDecision):
        """Pretty-print a decision in three sections"""
        print(decision)
    
    def get_all_decisions(self) -> List[SpatialDecision]:
        """Retrieve all decisions issued"""
        return self.decisions.copy()
    
    def get_all_events(self):
        """Retrieve all parcel events (append-only log)"""
        return self.registry.get_all_events()
    
    def summary_report(self) -> str:
        """Generate a brief report of registry state"""
        return f"""
LandBiznes Spatial Intelligence Agent
=====================================
Registered Parcels: {len(self.registry._parcels)}
Total Events: {len(self.registry._events)}
Decisions Issued: {len(self.decisions)}

Registry: {self.registry}
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
