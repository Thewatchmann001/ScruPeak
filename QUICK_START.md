# Quick Start Guide: ScruPeak Spatial Intelligence Agent

## Installation

```bash
# Navigate to the spatial engine directory
cd c:\Users\HP\Desktop\ScruPeak\services\spatial-engine-python

# Install dependencies (if needed)
pip install shapely pyproj
```

## Running Tests

```bash
# Navigate to app directory
cd app

# Run comprehensive test suite
python test_agent.py
```

**Expected Output:**
```
█████████████████████████████████████████████████████████████████████

  ScruPeak Spatial Intelligence Agent - Test Suite

█████████████████████████████████████████████████████████████████████

TEST 1: Basic Parcel Registration
✓ Parcel Code: SL-001-00-02-0001
✓ CSI ID: <uuid>
✓ Grid Ref: 001-00-02
✓ Owner: Alice
✓ Status: unverified
✓ History Events: 1

TEST 2: Overlap Detection & Classification
✓ Registered second parcel: SL-001-00-02-0002
[Decision output with classification, explanation, justification]

TEST 3: Identical Geometry Detection (Fraud Risk)
Parcel 1: SL-001-00-02-0001
Parcel 2: SL-001-00-02-0002
✓ Correctly classified as CONFLICTING_CLAIM

TEST 4: Parcel Subdivision (Parcel Birth & Lineage)
Parent: SL-001-00-02-0001
Parent CSI: <uuid>
✓ Created 4 child parcels:
  1. SL-001-00-02-0002
  2. SL-001-00-02-0003
  3. SL-001-00-02-0004
  4. SL-001-00-02-0005
✓ Parent updated with 4 children
✓ Genealogy for SL-001-00-02-0002:
   Parent: SL-001-00-02-0001
   Ancestors: []

TEST 5: Append-Only History (Immutability)
Parcel: SL-001-00-02-0001
History Events: 3
Event Log (append-only):
  1. parcel_created @ 2026-01-22 10:15:32.123456
     Actor: officer_1
     Description: Parcel registered...
  2. parcel_verified @ 2026-01-22 10:15:33.456789
     Actor: oarg_001
     Description: Parcel verified and approved by OARG
  3. oarg_review_requested @ 2026-01-22 10:15:34.789012
     Actor: system
     Description: OARG review requested: Routine boundary verification
✓ History is immutable (append-only)
✓ Current status: pending
✓ OARG approval: True

TEST 6: Three-Section Decision Outputs
[Decision output with all three sections]
✓ Correctly classified as LEGITIMATE_SUBDIVISION

==============================================================================
ALL TESTS PASSED ✓
==============================================================================
```

---

## Basic Usage

### 1. Register a Parcel

```python
from agent import SpatialIntelligenceAgent

# Initialize agent
agent = SpatialIntelligenceAgent()

# Register a parcel
parcel = agent.register_parcel(
    geometry=[
        (6.90, -13.30),   # lat, lon (West Africa)
        (6.91, -13.30),
        (6.91, -13.31),
        (6.90, -13.31),
        (6.90, -13.30)    # must close polygon
    ],
    owner="Alice",
    initiated_by="land_officer_001"
)

print(f"Registered: {parcel.parcel_code}")
# Output: Registered: SL-001-00-02-0001
```

### 2. Verify by OARG

```python
# Verify parcel by OARG
agent.verify_parcel_oarg(
    parcel_code=parcel.parcel_code,
    initiated_by="oarg_officer_001"
)

print(f"Status: {parcel.verification_status}")
# Output: Status: verified
```

### 3. Subdivide (Parcel Birth)

```python
# Create subdivision
children = agent.create_subdivision(
    parent_parcel_code=parcel.parcel_code,
    child_geometries=[
        # Child A
        [
            (6.90, -13.30),
            (6.905, -13.30),
            (6.905, -13.305),
            (6.90, -13.305),
            (6.90, -13.30)
        ],
        # Child B
        [
            (6.905, -13.30),
            (6.91, -13.30),
            (6.91, -13.305),
            (6.905, -13.305),
            (6.905, -13.30)
        ]
    ],
    initiated_by="surveyor_001"
)

print(f"Children created:")
for child in children:
    print(f"  - {child.parcel_code}")
# Output:
#   - SL-001-00-02-0002
#   - SL-001-00-02-0003
```

### 4. Detect Conflicts & Get Decisions

```python
# Detect spatial conflicts for a parcel
decision = agent.detect_and_classify_conflicts(
    subject_parcel_code=parcel.parcel_code,
    initiated_by="conflict_detector"
)

if decision:
    # Print three-section decision
    agent.print_decision(decision)

# Get all decisions
all_decisions = agent.get_all_decisions()
print(f"Total decisions: {len(all_decisions)}")
```

### 5. Query Genealogy

```python
# Get parcel lineage (ancestors and children)
genealogy = agent.get_parcel_genealogy(parcel_code="SL-001-00-02-0002")

print(f"Parent: {genealogy['parent']}")
print(f"Children: {genealogy['children']}")
print(f"Ancestors: {genealogy['ancestors']}")
# Output:
# Parent: SL-001-00-02-0001
# Children: []
# Ancestors: []
```

### 6. Flag Fraud & Request Review

```python
# Flag fraud risk
agent.flag_fraud_risk(
    parcel_code=parcel.parcel_code,
    reason="Lineage inconsistency detected",
    initiated_by="system"
)

# Request manual OARG review
agent.request_oarg_review(
    parcel_code=parcel.parcel_code,
    reason="Boundary survey discrepancy",
    initiated_by="surveyor_001"
)
```

---

## Understanding Parcel Codes

**Format:** `SL-{GRID_ID:03d}-{GRID_X:02d}-{GRID_Y:02d}-{SEQUENCE:04d}`

**Example:** `SL-001-00-02-0001`

- `SL` — Standard Land (country prefix)
- `001` — Grid ID (computed from lat/lon)
- `00` — Grid X (within national grid)
- `02` — Grid Y (within national grid)
- `0001` — Sequence number (per grid cell)

**Key Point:** Parcel codes are **deterministic** (computed from geometry) and **immutable** (never change).

---

## Decision Classification Reference

| Classification | When | Action |
|---|---|---|
| **LEGITIMATE_SUBDIVISION** | Child contained in parent with lineage | APPROVE |
| **PARCEL_SPLIT** | Parent divided into multiple parts | APPROVE (with lineage) |
| **PARCEL_MERGE** | Multiple parcels combined | REQUIRES REVIEW |
| **CONFLICTING_CLAIM** | Identical geometry, multiple owners | REQUIRE OARG JUDGMENT |
| **FRAUD_RISK** | Lineage broken, orphan contained | FLAG & INVESTIGATE |
| **REQUIRES_MANUAL_REVIEW** | Ambiguous spatial relationship | ESCALATE TO OARG |

---

## Three-Section Decision Format

Every decision has three mandatory sections:

```
1. CLASSIFICATION
   → Single, unambiguous category

2. DECISION EXPLANATION
   → Human-readable (for OARG, judges, landowners)
   → Plain English, no jargon

3. TECHNICAL JUSTIFICATION
   → Spatial tests (overlap, containment, area)
   → Grid rule enforcement
   → Lineage validation
   → Regulatory compliance reasoning
```

---

## Common Workflows

### Workflow A: Register & Verify Parcel

```python
# 1. Register
parcel = agent.register_parcel(geometry=[...], owner="Alice")

# 2. Detect conflicts (optional)
decision = agent.detect_and_classify_conflicts(parcel.parcel_code)
if decision:
    print(decision)

# 3. Verify by OARG
agent.verify_parcel_oarg(parcel.parcel_code, initiated_by="oarg_001")

# Result: Parcel is now verified with full history
```

### Workflow B: Subdivide Parcel

```python
# 1. Register parent
parent = agent.register_parcel(geometry=[...], owner="Corporation")

# 2. Create subdivision
children = agent.create_subdivision(
    parent_parcel_code=parent.parcel_code,
    child_geometries=[child_geom_1, child_geom_2, ...]
)

# 3. Verify parent and children
agent.verify_parcel_oarg(parent.parcel_code, initiated_by="oarg_001")
for child in children:
    agent.verify_parcel_oarg(child.parcel_code, initiated_by="oarg_001")

# Result: Parent + children lineage, all verified
```

### Workflow C: Detect Conflict & Escalate

```python
# 1. Register parcels
parcel_1 = agent.register_parcel(geometry=[...], owner="Alice")
parcel_2 = agent.register_parcel(geometry=[...], owner="Bob")  # overlaps

# 2. Detect conflict
decision = agent.detect_and_classify_conflicts(parcel_1.parcel_code)

# 3. Check classification
if decision.classification == DecisionClassification.CONFLICTING_CLAIM:
    print("Overlap detected! Escalating to OARG...")
    agent.request_oarg_review(
        parcel_1.parcel_code,
        reason=decision.decision_explanation,
        initiated_by="system"
    )

# Result: Decision issued, OARG review requested
```

---

## Troubleshooting

### Issue: "Point lies outside defined national grid"
**Cause:** Geometry coordinates outside West Africa region  
**Solution:** Use correct lat/lon (around 6.90, -13.30)

### Issue: "Geometry must be a closed polygon"
**Cause:** First and last vertices don't match  
**Solution:** Ensure `geometry[0] == geometry[-1]`

### Issue: "Invalid subdivision pattern"
**Cause:** Child areas don't match parent area  
**Solution:** Ensure children are non-overlapping and total area = parent area

### Issue: No decision returned
**Cause:** No spatial conflicts detected  
**Solution:** Check if parcels actually overlap before expecting a decision

---

## Performance Notes

- **Small dataset** (< 1,000 parcels): Native Python implementation is fine
- **Medium dataset** (1,000 - 100,000 parcels): Consider adding spatial indexing (R-tree)
- **Large dataset** (> 100,000 parcels): Use PostgreSQL + PostGIS for efficient queries

---

## References

- **Architecture:** See `README_REFACTORING.md`
- **Specification:** See initial governance spec
- **Examples:** See `test_agent.py` for complete examples
- **Code:** `agent.py`, `csi_model.py`, `registry.py`, `spatial_detector.py`, `decision_engine.py`

---

## Guiding Principle

> **"ScruPeak does not record land — it mathematically proves it."**

All decisions are based on deterministic spatial tests, immutable history, and regulatory authority preservation.

---

**Version:** 1.0  
**Date:** January 22, 2026  
**Status:** Production Ready ✅
