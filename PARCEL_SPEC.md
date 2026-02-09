# ParcelIdentity Exact Specification

## Data Structure

```python
ParcelIdentity = {
    "parcel_code": str,                      # "SL-001-00-02-0001"
    "reference_grid": str,                   # "001-00-02"
    "sih": str,                              # SHA256(polygon)
    "polygon": List[Tuple[float, float]],   # closed polygon
    "area": float,                           # sqm (computed)
    "parents": List[str],                    # ["SL-001-00-02-0001"]
    "children": List[str],                   # ["SL-001-00-02-0002", ...]
    "birth_event": str,                      # "created by actor_xyz at 2026-01-22 10:15:32"
    "created_at": datetime                   # timestamp
}
```

## Core Principle

**"If you change the geometry, you changed the land."**

- Geometry is immutable (truth)
- If polygon changes → different SIH → different parcel → new parcel_code
- SIH is the fingerprint of identity

## Implementation Files

| File | Purpose |
|---|---|
| `parcel_id.py` | ParcelIdentity dataclass + utilities |
| `registry_v2.py` | ParcelStore + ParcelRegistry (storage + governance) |
| `engine_v2.py` | SpatialEngine (orchestrator) |

## Usage

```python
from engine_v2 import SpatialEngine

engine = SpatialEngine()

# Register
parcel = engine.register_parcel(
    polygon=[(lat, lon), ..., (lat, lon)],
    actor="officer_001",
    reason="Initial registration"
)
# → SL-001-00-02-0001

# Detect conflicts
decisions = engine.detect_conflicts(parcel.parcel_code)

# Create subdivision
children = engine.create_subdivision(
    parent_code=parcel.parcel_code,
    child_polygons=[...],
    actor="surveyor"
)

# Get genealogy
gen = engine.get_genealogy(parcel.parcel_code)
# → {"parents": [...], "children": [...], "sih": "...", ...}
```

## Key Properties

| Property | Behavior |
|---|---|
| `parcel_code` | Deterministic (grid + sequence), immutable |
| `sih` | SHA256 hash of polygon, unique per geometry |
| `polygon` | Immutable (cannot change after creation) |
| `area` | Computed from polygon at creation, never recalculated |
| `parents` | List of parent codes (for subdivided parcels) |
| `children` | List of child codes (from subdivisions) |
| `birth_event` | Immutable record of creation (who, when, why) |

## Fraud Detection

**Duplicate geometry detected automatically via SIH:**

```python
# If you try to register the same polygon twice:
p1 = engine.register_parcel(polygon=[...])  # OK
p2 = engine.register_parcel(polygon=[...])  # RAISES ValueError
# "DUPLICATE GEOMETRY. SIH ... already registered as SL-001-00-02-0001"
```

## Grid Reference

**Format:** `"001-00-02"` (GRID_ID-GRID_X-GRID_Y)

**Derived from:** First vertex of polygon (deterministic)

```python
# First vertex (6.90, -13.30) → grid "001-00-02"
# All parcels in that grid: SL-001-00-02-0001, SL-001-00-02-0002, ...
# Grid-bounded queries: O(1) lookup, no full scans
```

## Lineage

**Parent-Child Relationships:**

```python
# Parent
parent = engine.register_parcel(polygon=[...])
# → SL-001-00-02-0001

# Subdivision
children = engine.create_subdivision(
    parent_code="SL-001-00-02-0001",
    child_polygons=[..., ...],
    actor="surveyor"
)
# → [SL-001-00-02-0002, SL-001-00-02-0003]

# Genealogy
gen = engine.get_genealogy("SL-001-00-02-0002")
# {
#   "parcel_code": "SL-001-00-02-0002",
#   "parents": ["SL-001-00-02-0001"],
#   "children": [],
#   "sih": "...",
#   "area": 12345.0,
#   "reference_grid": "001-00-02"
# }
```

## Summary

**Minimal, deterministic, immutable parcel identity.**

- No overwrite (geometry is sacred)
- No reassignment (codes are computed, not assigned)
- Deduplication via SIH (automatic fraud detection)
- Grid-bounded (performance guaranteed)
- Full lineage preservation (genealogy forever)

**Status:** ✅ Production Ready
