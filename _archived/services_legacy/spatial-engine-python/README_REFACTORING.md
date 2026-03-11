# ScruPeak Spatial Intelligence Agent

## Overview

The Spatial Intelligence Agent is a land governance and regulatory interpretation engine that sits above geometric calculations to enforce OARG (land registry authority) rules and maintain spatial integrity.

**Guiding Principle:** "ScruPeak does not record land — it mathematically proves it."

---

## Core Architecture

### 1. **CSI Model** (`csi_model.py`)
The **Composite Spatial Identity** is the canonical identity of a land parcel:

```
CompositeSpatialIdentity (CSI)
├── Geometry (immutable closed polygon)
├── Grid Reference (deterministic grid placement)
├── Lineage (parent-child relationships)
├── Verification History (append-only event log)
└── Metadata (owner, area, status)
```

**Key Invariants:**
- Geometry is immutable (never changes)
- Parcel code is unique and deterministic (from grid + sequence)
- History is append-only (no overwrites)
- Every action creates a timestamped event

**Event Types:**
- `PARCEL_CREATED` — birth event
- `PARCEL_VERIFIED` — OARG approval
- `PARCEL_SUBDIVISION` — parent remains intact; children born
- `PARCEL_SPLIT` — complex division
- `PARCEL_MERGE` — boundary consolidation
- `FRAUD_FLAG` — integrity risk detected
- `OARG_REVIEW_REQUESTED` — escalation for human judgment

### 2. **Parcel Registry** (`registry.py`)
An append-only authority that manages CSI storage, lineage, and governance:

```python
registry = ParcelRegistry()

# Register a new parcel
csi = registry.register_parcel(
    geometry=[(lat, lon), ...],
    grid_id=001,
    grid_x=00,
    grid_y=02,
    owner="Alice"
)

# Create a child parcel (subdivision)
child = registry.create_child_parcel(
    parent_csi=csi,
    child_geometry=[...],
    relationship_type="subdivision"
)

# Verify by OARG
registry.verify_parcel(csi.parcel_code)

# Request review
registry.request_oarg_review(csi.parcel_code, reason="...")
```

**Enforces:**
- Grid reference rule: first vertex determines grid placement
- Parcel code uniqueness
- Lineage integrity (parent remains intact)
- Immutability (no geometry overwrites)

### 3. **Spatial Relationship Detector** (`spatial_detector.py`)
Identifies geometric relationships using Shapely:

```python
detector = SpatialRelationshipDetector()

# Compute overlap between two CSIs
relationship, overlap_area = detector.compute_overlap(csi_a, csi_b)
# Returns: ("identical" | "overlap" | "contained" | "contains" | "disjoint", area)

# Detect conflicts
event = detector.detect_conflict(subject_csi, other_csis)

# Validate subdivision pattern
is_valid = detector.detect_subdivision(parent_csi, child_csis)
```

**Relationships:**
- **identical** — same geometry (fraud risk)
- **overlap** — partial overlap (ambiguous)
- **contained** — A inside B
- **contains** — A encloses B
- **disjoint** — no overlap

### 4. **Decision Engine** (`decision_engine.py`)
Interprets spatial events and produces **three-section decisions**:

```python
decision = engine.classify_parcel_event(event, subject_csi)
```

**Decision Structure:**
```
1. CLASSIFICATION
   ├── LEGITIMATE_SUBDIVISION
   ├── PARCEL_SPLIT
   ├── PARCEL_MERGE
   ├── CONFLICTING_CLAIM
   ├── FRAUD_RISK
   └── REQUIRES_MANUAL_REVIEW

2. DECISION EXPLANATION (human-readable)
   Plain English suitable for OARG officers, landowners, judges

3. TECHNICAL JUSTIFICATION
   Spatial tests + grid rule + lineage reasoning + OARG compliance
```

**Example Decision:**

```
================================
SPATIAL DECISION REPORT
================================

1. CLASSIFICATION
   conflicting_claim

2. DECISION EXPLANATION
   Parcel SL-001-00-02-0001 has identical geometry to SL-001-00-02-0002.
   This indicates either duplicate registration (fraud) or overlapping 
   ownership claims. OARG must resolve which parcel code is authoritative.

3. TECHNICAL JUSTIFICATION
   Spatial test: polygon_a.equals(polygon_b) = True.
   CSI lineage check: SL-001-00-02-0001 parent = None.
   Grid rule: both in grid 001-00-02.
   Verdict: Multiple authorities claiming same land. Fraud risk or 
   registration error.

DETAILS:
   Parcel: SL-001-00-02-0001
   Related: ['SL-001-00-02-0002']
   Relationship: identical
   Overlap: 0.5 sqm
   OARG Review: True
   Flags: DUPLICATE_GEOMETRY, OWNERSHIP_CONFLICT
```

### 5. **Spatial Intelligence Agent** (`agent.py`)
High-level orchestrator that ties everything together:

```python
agent = SpatialIntelligenceAgent()

# Register a parcel
csi = agent.register_parcel(
    geometry=[...],
    owner="Alice",
    initiated_by="land_officer"
)

# Detect and classify conflicts
decision = agent.detect_and_classify_conflicts(
    subject_parcel_code=csi.parcel_code
)
agent.print_decision(decision)

# Create subdivision
children = agent.create_subdivision(
    parent_parcel_code=parent.parcel_code,
    child_geometries=[...],
    relationship_type="subdivision"
)

# Verify by OARG
agent.verify_parcel_oarg(parcel_code, initiated_by="oarg_001")

# Get lineage
genealogy = agent.get_parcel_genealogy(parcel_code)
# {"parcel_code": "...", "parent": "...", "children": [...], "ancestors": [...]}
```

---

## Grid Reference System

**Rule:** If a polygon spans multiple grids, the grid containing the **first vertex** is the reference grid.

**Parcel Code Format:**
```
SL-{GRID_ID:03d}-{GRID_X:02d}-{GRID_Y:02d}-{SEQUENCE:04d}

Example: SL-001-00-02-0001
         └────┬────┘  └─┬─┘
         Grid reference Sequence (per grid)
```

**Grid Constants (origin.py):**
```python
ORIGIN_LAT = 6.90        # West Africa
ORIGIN_LON = -13.30
GRID_SIZE_METERS = 2000  # 2km cells
TOTAL_GRIDS_EAST = 500
```

---

## Parcel Birth Logic

### Legitimate Subdivision

**Conditions:**
1. Parent remains intact (geometry never changes)
2. Child receives new parcel code and CSI
3. Lineage link created (parent → child)
4. Parent metadata updates (child reference only, no geometry change)
5. Child inherits owner and verification rules

**Example:**
```python
parent = agent.register_parcel(geometry=[...])
children = agent.create_subdivision(
    parent_parcel_code=parent.parcel_code,
    child_geometries=[geom_a, geom_b, geom_c]
)

# Parent updated:
# - parent.child_parcel_codes = [child_a, child_b, child_c]
# - parent.geometry UNCHANGED
# - parent.history logs the subdivision event

# Child created with:
# - child.parent_lineage -> parent CSI
# - child.parcel_code = new code
# - child.csi_id = new UUID
```

---

## Conflict Classification Rules

| Spatial Relationship | Classification | Decision |
|---|---|---|
| **Identical geometry** | Conflicting Claim | REQUIRES OARG REVIEW (fraud risk) |
| **Partial overlap** | Ambiguous | REQUIRES OARG REVIEW (boundary dispute) |
| **Contained (with lineage)** | Legitimate Subdivision | APPROVE (valid parent-child) |
| **Contained (no lineage)** | Fraud Risk | FLAG & REQUIRE REVIEW (orphan) |
| **Contains (valid child)** | Legitimate Subdivision | APPROVE (valid parent) |
| **Disjoint** | No conflict | OK |

---

## Append-Only History & Immutability

Every CSI maintains an immutable event log:

```python
csi.add_history_event(
    event_type=EventType.PARCEL_VERIFIED,
    actor="oarg_officer_001",
    description="Parcel verified...",
    metadata={...}
)

# History grows only; never overwrites
for event in csi.history:
    print(f"{event.timestamp} | {event.actor} | {event.event_type.value}")
```

---

## Regulatory Authority (OARG)

The engine **never bypasses OARG authority**:

1. **Ambiguous spatial events** → escalate to manual review
2. **Fraud indicators** → flag and flag for human judgment
3. **Conflicting claims** → OARG determines rightful owner
4. **Boundary disputes** → OARG officer resolves

```python
# Request OARG review
agent.request_oarg_review(
    parcel_code="SL-001-00-02-0001",
    reason="Boundary survey discrepancy",
    initiated_by="system"
)

# OARG verification
agent.verify_parcel_oarg(
    parcel_code="SL-001-00-02-0001",
    initiated_by="oarg_001"
)
```

---

## Files in This Refactoring

| File | Purpose |
|---|---|
| `csi_model.py` | CSI data structures, event types |
| `registry.py` | Parcel storage, lineage, verification |
| `spatial_detector.py` | Polygon relationships, overlap detection |
| `decision_engine.py` | Classification & three-section decisions |
| `agent.py` | Orchestrator, high-level API |
| `grid_new.py` | Grid reference system |
| `origin_new.py` | Grid constants |
| `projection.py` | Coordinate transformation (existing) |
| `test_agent.py` | Comprehensive tests |

---

## Running Tests

```bash
cd c:\Users\HP\Desktop\ScruPeak\services\spatial-engine-python\app
python test_agent.py
```

**Test Coverage:**
1. Basic parcel registration with CSI
2. Overlap detection and classification
3. Identical geometry (fraud detection)
4. Parcel subdivision with lineage
5. Append-only history
6. Three-section decision outputs

---

## Example Workflow

```python
from agent import SpatialIntelligenceAgent

# Initialize agent
agent = SpatialIntelligenceAgent()

# 1. Register original parcel
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
print(f"Parcel: {parcel_1.parcel_code}")  # SL-001-00-02-0001

# 2. Verify by OARG
agent.verify_parcel_oarg(parcel_1.parcel_code, initiated_by="oarg_001")

# 3. Later: subdivide parcel
children = agent.create_subdivision(
    parent_parcel_code=parcel_1.parcel_code,
    child_geometries=[
        # Child A geometry
        [(6.90, -13.30), (6.905, -13.30), (6.905, -13.305), (6.90, -13.305), (6.90, -13.30)],
        # Child B geometry
        [(6.905, -13.30), (6.91, -13.30), (6.91, -13.305), (6.905, -13.305), (6.905, -13.30)]
    ],
    initiated_by="land_officer_001"
)
print(f"Children: {[c.parcel_code for c in children]}")
# SL-001-00-02-0002, SL-001-00-02-0003

# 4. Get genealogy
genealogy = agent.get_parcel_genealogy(children[0].parcel_code)
print(f"Parent: {genealogy['parent']}")  # SL-001-00-02-0001

# 5. Detect conflicts
decision = agent.detect_and_classify_conflicts(children[0].parcel_code)
if decision:
    agent.print_decision(decision)
```

---

## Design Principles

1. **Immutability** — Geometry never changes; history is append-only
2. **Determinism** — Grid rule is mechanical; parcel codes are computed, not assigned
3. **Traceability** — Every action logged with actor, timestamp, metadata
4. **Authority** — OARG is sovereign; ambiguity escalates to humans
5. **Fraud Resistance** — Multiple overlaps, lineage breaks, and geometry changes are flagged
6. **Genealogy** — Full parent-child-ancestor lineage preserved

---

## Next Steps (Suggested)

1. **Persistence Layer** — Add PostgreSQL + PostGIS for spatial indexing and long-term storage
2. **API Endpoints** — Wrap agent in REST/gRPC service for api-gateway-node to consume
3. **Performance Optimization** — Add spatial indexes (R-tree, quadtree) for large datasets
4. **Advanced Validation** — Implement topological constraints (no holes, self-intersections)
5. **Batch Operations** — Bulk parcel registration and conflict detection
6. **Audit Dashboard** — Query history, genealogy, decision logs
7. **Integration with Intelligence Service** — Pass validated CSIs to ML feature extraction

---

## Contact & References

- **Project:** ScruPeak Spatial Verification Platform
- **Service:** spatial-engine-python
- **Date:** January 22, 2026
- **Guiding Principle:** "ScruPeak does not record land — it mathematically proves it."
