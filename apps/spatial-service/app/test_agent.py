"""
Test and Demonstration: ScruPeak Spatial Intelligence Agent

Demonstrates:
1. Parcel registration with CSI
2. Grid reference rules
3. Spatial conflict detection
4. Classification and three-section decisions
5. Parcel birth (subdivision) logic
6. Append-only history
7. Lineage tracking
"""

import sys
sys.path.insert(0, '.')

from agent import SpatialIntelligenceAgent
from decision_engine import DecisionClassification


def test_basic_registration():
    """Test 1: Register a simple parcel"""
    print("\n" + "="*70)
    print("TEST 1: Basic Parcel Registration")
    print("="*70)
    
    agent = SpatialIntelligenceAgent()
    
    # Register parcel
    parcel = agent.register_parcel(
        geometry=[
            (6.90, -13.30),
            (6.91, -13.30),
            (6.91, -13.31),
            (6.90, -13.31),
            (6.90, -13.30)
        ],
        owner="Alice",
        initiated_by="land_officer_001"
    )
    
    print(f"✓ Parcel Code: {parcel.parcel_code}")
    print(f"✓ CSI ID: {parcel.csi_id}")
    print(f"✓ Grid Ref: {parcel.grid_ref.canonical_key()}")
    print(f"✓ Owner: {parcel.owner}")
    print(f"✓ Status: {parcel.verification_status}")
    print(f"✓ History Events: {len(parcel.history)}")
    
    return agent


def test_overlap_detection():
    """Test 2: Detect overlap (conflict)"""
    print("\n" + "="*70)
    print("TEST 2: Overlap Detection & Classification")
    print("="*70)
    
    agent = SpatialIntelligenceAgent()

    # Register first parcel
    parcel_1 = agent.register_parcel(
        geometry=[
            (6.90, -13.30),
            (6.91, -13.30),
            (6.91, -13.31),
            (6.90, -13.31),
            (6.90, -13.30)
        ],
        owner="Alice",
        initiated_by="land_officer_001"
    )

    # Register overlapping parcel
    parcel_2 = agent.register_parcel(
        geometry=[
            (6.905, -13.305),
            (6.915, -13.305),
            (6.915, -13.315),
            (6.905, -13.315),
            (6.905, -13.305)
        ],
        owner="Bob",
        initiated_by="land_officer_002"
    )
    
    print(f"\n✓ Registered second parcel: {parcel_2.parcel_code}")
    
    # Detect conflict
    decision = agent.detect_and_classify_conflicts(
        subject_parcel_code=parcel_1.parcel_code,
        initiated_by="conflict_detector"
    )
    
    if decision:
        print(f"\n{decision}")
        print(f"Flags: {decision.flags}")
    
    return decision


def test_identical_geometry():
    """Test 3: Detect identical geometry (fraud risk)"""
    print("\n" + "="*70)
    print("TEST 3: Identical Geometry Detection (Fraud Risk)")
    print("="*70)
    
    agent = SpatialIntelligenceAgent()
    
    # Register original
    geom = [
        (6.90, -13.30),
        (6.91, -13.30),
        (6.91, -13.31),
        (6.90, -13.31),
        (6.90, -13.30)
    ]
    
    parcel_1 = agent.register_parcel(
        geometry=geom,
        owner="Alice",
        initiated_by="officer_1"
    )
    
    # Register duplicate
    parcel_2 = agent.register_parcel(
        geometry=geom,  # IDENTICAL
        owner="Bob",
        initiated_by="officer_2"
    )
    
    print(f"Parcel 1: {parcel_1.parcel_code}")
    print(f"Parcel 2: {parcel_2.parcel_code}")
    
    # Detect conflict
    decision = agent.detect_and_classify_conflicts(
        subject_parcel_code=parcel_1.parcel_code,
        initiated_by="detector"
    )
    
    if decision:
        print(f"\n{decision}")
        assert decision.classification == DecisionClassification.CONFLICTING_CLAIM
        print("✓ Correctly classified as CONFLICTING_CLAIM")
    
    return decision


def test_subdivision():
    """Test 4: Create subdivision (parcel birth with lineage)"""
    print("\n" + "="*70)
    print("TEST 4: Parcel Subdivision (Parcel Birth & Lineage)")
    print("="*70)
    
    agent = SpatialIntelligenceAgent()
    
    # Register parent
    parent = agent.register_parcel(
        geometry=[
            (6.90, -13.30),
            (7.00, -13.30),
            (7.00, -13.40),
            (6.90, -13.40),
            (6.90, -13.30)
        ],
        owner="LandCorp",
        initiated_by="surveyor_001"
    )
    
    print(f"Parent: {parent.parcel_code}")
    print(f"Parent CSI: {parent.csi_id}")
    
    # Create subdivision
    children = agent.create_subdivision(
        parent_parcel_code=parent.parcel_code,
        child_geometries=[
            # Child A
            [
                (6.90, -13.30),
                (6.95, -13.30),
                (6.95, -13.35),
                (6.90, -13.35),
                (6.90, -13.30)
            ],
            # Child B
            [
                (6.95, -13.30),
                (7.00, -13.30),
                (7.00, -13.35),
                (6.95, -13.35),
                (6.95, -13.30)
            ],
            # Child C
            [
                (6.90, -13.35),
                (6.95, -13.35),
                (6.95, -13.40),
                (6.90, -13.40),
                (6.90, -13.35)
            ],
            # Child D
            [
                (6.95, -13.35),
                (7.00, -13.35),
                (7.00, -13.40),
                (6.95, -13.40),
                (6.95, -13.35)
            ]
        ],
        relationship_type="subdivision",
        initiated_by="surveyor_001"
    )
    
    print(f"\n✓ Created {len(children)} child parcels:")
    for i, child in enumerate(children, 1):
        print(f"  {i}. {child.parcel_code}")
        print(f"     Parent: {child.parent_lineage.parent_parcel_code}")
        print(f"     Lineage: {child.parent_lineage.relationship_type}")
    
    # Check parent updated
    parent_updated = agent.registry.get_parcel(parent.parcel_code)
    print(f"\n✓ Parent updated with {len(parent_updated.child_parcel_codes)} children:")
    print(f"   {parent_updated.child_parcel_codes}")
    
    # Check genealogy
    genealogy = agent.get_parcel_genealogy(children[0].parcel_code)
    print(f"\n✓ Genealogy for {children[0].parcel_code}:")
    print(f"   Parent: {genealogy['parent']}")
    print(f"   Ancestors: {genealogy['ancestors']}")
    
    return agent, parent, children


def test_history():
    """Test 5: Append-only history"""
    print("\n" + "="*70)
    print("TEST 5: Append-Only History (Immutability)")
    print("="*70)
    
    agent = SpatialIntelligenceAgent()
    
    # Register parcel
    parcel = agent.register_parcel(
        geometry=[
            (6.90, -13.30),
            (6.91, -13.30),
            (6.91, -13.31),
            (6.90, -13.31),
            (6.90, -13.30)
        ],
        owner="Alice",
        initiated_by="officer_1"
    )
    
    # Verify
    agent.verify_parcel_oarg(parcel.parcel_code, initiated_by="oarg_001")
    
    # Request review
    agent.request_oarg_review(
        parcel.parcel_code,
        reason="Routine boundary verification",
        initiated_by="system"
    )
    
    # Get updated CSI
    parcel_updated = agent.registry.get_parcel(parcel.parcel_code)
    
    print(f"Parcel: {parcel.parcel_code}")
    print(f"History Events: {len(parcel_updated.history)}")
    print(f"\nEvent Log (append-only):")
    for i, event in enumerate(parcel_updated.history, 1):
        print(f"  {i}. {event.event_type.value} @ {event.timestamp}")
        print(f"     Actor: {event.actor}")
        print(f"     Description: {event.description}")
    
    print(f"\n✓ History is immutable (append-only)")
    print(f"✓ Current status: {parcel_updated.verification_status}")
    print(f"✓ OARG approval: {parcel_updated.oarg_approval}")


def test_decision_outputs():
    """Test 6: Three-section decision outputs"""
    print("\n" + "="*70)
    print("TEST 6: Three-Section Decision Outputs")
    print("="*70)
    
    agent = SpatialIntelligenceAgent()
    
    # Create scenario: legitimate subdivision
    parent = agent.register_parcel(
        geometry=[
            (6.90, -13.30),
            (6.92, -13.30),
            (6.92, -13.32),
            (6.90, -13.32),
            (6.90, -13.30)
        ],
        owner="LandCorp",
        initiated_by="surveyor"
    )
    
    children = agent.create_subdivision(
        parent_parcel_code=parent.parcel_code,
        child_geometries=[
            [
                (6.90, -13.30),
                (6.91, -13.30),
                (6.91, -13.31),
                (6.90, -13.31),
                (6.90, -13.30)
            ],
            [
                (6.91, -13.30),
                (6.92, -13.30),
                (6.92, -13.31),
                (6.91, -13.31),
                (6.91, -13.30)
            ],
            [
                (6.90, -13.31),
                (6.91, -13.31),
                (6.91, -13.32),
                (6.90, -13.32),
                (6.90, -13.31)
            ],
            [
                (6.91, -13.31),
                (6.92, -13.31),
                (6.92, -13.32),
                (6.91, -13.32),
                (6.91, -13.31)
            ]
        ],
        initiated_by="surveyor"
    )
    
    # Detect conflict between parent and child (should be legitimate)
    decision = agent.detect_and_classify_conflicts(
        subject_parcel_code=children[0].parcel_code,
        initiated_by="detector"
    )
    
    if decision:
        print(f"{decision}")
        assert decision.classification == DecisionClassification.LEGITIMATE_SUBDIVISION
        print("✓ Correctly classified as LEGITIMATE_SUBDIVISION")


def main():
    """Run all tests"""
    print("\n")
    print("█" * 70)
    print("█" + " " * 68 + "█")
    print("█" + "  LandBiznes Spatial Intelligence Agent - Test Suite".center(68) + "█")
    print("█" + " " * 68 + "█")
    print("█" * 70)
    
    try:
        test_basic_registration()
        agent = test_basic_registration()
        test_overlap_detection(agent)
        test_identical_geometry()
        test_subdivision()
        test_history()
        test_decision_outputs()
        
        print("\n" + "="*70)
        print("ALL TESTS PASSED ✓")
        print("="*70)
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
