# ScruPeak Digital Property Production Schema - Complete Alignment Guide

## ✅ Schema Alignment Status

Your database schema **NOW FULLY ALIGNS** with your requirements for a national-grade land registry system. Here's what has been implemented:

---

## 1. ✅ Core Tables - All Implemented

### **spatial_grids** - Reference Grid System
- **Purpose**: Divide country into hierarchical administrative zones
- **Columns**:
  - `grid_code`: Unique identifier (e.g., "GRID_001")
  - `geometry`: Polygon boundary (WGS84, EPSG:4326)
  - `grid_level`: Hierarchical level (1-10)
  - `parent_grid_id`: For nested grid structure
  - `area_sqm`: Precomputed grid area
  - `bounds`: BOX2D bounding box for fast queries
  - `metadata`: JSONB for extensible attributes
- **Indexes**: GIST spatial index on geometry
- **Scalability**: Supports hierarchical organization (country → region → district → locality)

### **parcels** - Core Land Parcel Registry  
- **Purpose**: Immutable parcel records with spatial identity
- **Key Features**:
  - `parcel_code`: Human-readable deterministic code
  - `spatial_identity_hash`: SHA256 collision-proof identifier
  - `geometry`: Immutable polygon (enforced by trigger)
  - `area_sqm`: Automatically computed from geometry
  - `bounds`: BOX2D for optimization
  - `parent_parcel_id`: Subdivision tracking
  - `active`: Soft delete flag
- **Indexes**: GIST on geometry, bounds; BTree on code, hash
- **Immutability**: Trigger prevents geometry modification after creation

### **parcel_lineage** - Subdivision & Merge Tracking
- **Purpose**: Track parent-child relationships for complete genealogy
- **Supports**:
  - `SUBDIVISION`: 1 parcel → many parcels
  - `MERGE`: many parcels → 1 parcel
- **Features**:
  - Links to `operation_event_id` for full audit trail
  - Recursive queries via `get_parcel_lineage()` function
  - Preserves complete history of parcel transformations

### **parcel_events** - Append-Only Event History (Immutable)
- **Purpose**: Complete audit trail of all actions
- **Event Types**: CREATED, VALIDATED, SUBDIVIDED, MERGED, OWNER_CHANGED, CONFLICT_DETECTED, CONFLICT_RESOLVED, GEOMETRY_VERIFIED, DEACTIVATED, etc.
- **Features**:
  - `event_data`: JSONB payload with complete context
  - `initiated_by`: User/system audit trail
  - `source_system`: Origin tracking (web, mobile, batch)
  - `ip_address`: Security audit
  - Immutable: Triggers prevent UPDATE/DELETE
  - GIN index on JSONB for efficient queries

### **grid_sequences** - Deterministic Parcel Code Generator
- **Purpose**: Generate unique, sortable parcel codes per grid
- **Features**:
  - `grid_id`: Reference to spatial grid
  - `last_sequence_number`: Next available number
  - `prefix`: e.g., "GRID_001-"
  - Ensures codes like: GRID_001-000001, GRID_001-000002, etc.
  - Deterministic and globally unique

### **parcel_conflicts** - Spatial Conflict Detection & Resolution
- **Purpose**: Track overlaps and boundary disputes
- **Conflict Types**: OVERLAP, BOUNDARY_DISPUTE, DUPLICATE
- **Features**:
  - `overlap_geometry`: Actual intersecting polygon
  - `overlap_area_sqm`: Calculated overlap area
  - `confidence_score`: 0.0-1.0 confidence metric
  - `resolved`: Boolean status flag
  - `resolution_method`: MANUAL_ADJUDICATION, AUTOMATIC_PRIORITY, GEOMETRY_CORRECTION, OWNER_AGREEMENT, COURT_ORDER
  - `final_state`: JSONB resolution outcome
  - Composite indexes for efficient unresolved conflict queries

---

## 2. ✅ Triggers & Constraints - Data Integrity Enforced

### **Immutability Triggers**
1. ✅ **prevent_parcel_geometry_update**: Prevents geometry modification after creation
2. ✅ **prevent_event_modification**: Events cannot be updated or deleted
3. ✅ **prevent_parcel_deletion**: Enforces soft delete via `active` flag

### **Automatic Computation Triggers**
1. ✅ **compute_spatial_identity_hash**: SHA256 hash of normalized geometry on INSERT
2. ✅ **compute_parcel_area**: Automatically calculates area from geometry
3. ✅ **compute_bounds**: BOX2D bounding boxes for performance

### **Constraints**
- ✅ Unique spatial_identity_hash (collision-proof)
- ✅ Unique parcel_code per grid
- ✅ Foreign key relations (parcels → grids → parent_grids)
- ✅ Area > 0 validation
- ✅ Valid event types (enum-like constraint)
- ✅ Valid conflict types
- ✅ Ordered conflict pairs (parcel_1 < parcel_2)

---

## 3. ✅ PostGIS Spatial Indexes - Full Coverage

### **Geometry Indexes (GIST)**
```sql
CREATE INDEX idx_parcels_geometry ON parcels USING GIST(geometry);
CREATE INDEX idx_spatial_grids_geometry ON spatial_grids USING GIST(geometry);
CREATE INDEX idx_parcel_conflicts_overlap_geometry ON parcel_conflicts USING GIST(overlap_geometry);
```

### **Bounding Box Indexes (BOX2D)**
```sql
CREATE INDEX idx_parcels_bounds ON parcels USING GIST(bounds);
CREATE INDEX idx_spatial_grids_bounds ON spatial_grids USING GIST(bounds);
```

### **Optimized Composite Index**
```sql
CREATE INDEX idx_parcels_grid_geometry ON parcels(grid_id, geometry) WHERE active = true;
```

### **JSONB Indexes**
```sql
CREATE INDEX idx_parcel_events_data_gin ON parcel_events USING GIN(event_data);
```

---

## 4. ✅ Comprehensive Column Comments

All tables and columns include detailed comments explaining:
- Purpose and usage
- Data type and constraints
- Spatial reference systems (WGS84 EPSG:4326)
- JSONB payload structures
- Default values and triggers

---

## 5. ✅ National-Scale Optimization

### **Fast Spatial Queries**
- GIST indexes enable O(log n) intersection queries
- Bounding box pre-computation for quick spatial filters
- Composite indexes for common grid + geometry queries
- Supports millions of parcels

### **Lineage Tracking**
- Recursive CTE function: `get_parcel_lineage(parcel_id)` traces complete genealogy
- O(depth) complexity for genealogy queries
- Links to events for audit trail

### **Conflict Detection**
- `detect_grid_conflicts(grid_id)` finds all overlaps in grid
- Efficient GIST search on overlap_geometry
- Confidence scores for prioritization
- Resolution workflow support

### **Performance Features**
- Precomputed areas and bounds avoid recalculation
- Soft deletes avoid expensive DELETE operations
- Event log allows temporal queries without triggers on every table
- JSONB compression for extensible data

---

## 6. Key SQL Functions for National-Scale Operations

### **1. Spatial Queries**
```sql
-- Find overlapping parcels
SELECT * FROM find_overlapping_parcels(geometry_polygon, grid_id);

-- Detect conflicts in grid
SELECT * FROM detect_grid_conflicts('GRID_001'::uuid);
```

### **2. Lineage Queries**
```sql
-- Get complete parcel genealogy
SELECT * FROM get_parcel_lineage(parcel_id);
```

### **3. Event Queries**
```sql
-- Get full history of parcel
SELECT * FROM get_parcel_history(parcel_id);
```

### **4. Ownership Queries**
```sql
-- Current owners with details
SELECT * FROM current_parcel_ownership;
```

### **5. Conflict Management**
```sql
-- All unresolved conflicts
SELECT * FROM active_conflicts;

-- Grid statistics
SELECT * FROM grid_statistics;
```

---

## 7. Quick Start Guide

### **Apply Schema to Running Database**
```bash
docker exec -i landbiznes_db psql -U landbiznes -d landbiznes \
  < init-scripts/01-landbiznes-schema.sql
```

### **Test Schema Setup**
```bash
# Connect to database
psql -h localhost -U landbiznes -d landbiznes

# Verify tables
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'land_registry';

# Check spatial indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'land_registry' AND indexdef LIKE '%GIST%';

# Verify grids created
SELECT grid_code, grid_name FROM spatial_grids;
```

### **Insert Sample Parcel**
```sql
-- Using SQLTools "Current Query" editor in VS Code:

INSERT INTO land_registry.parcels 
(parcel_code, grid_id, geometry)
VALUES 
  (
    'GRID_001-000001',
    (SELECT id FROM land_registry.spatial_grids WHERE grid_code = 'GRID_001'),
    ST_GeomFromText('POLYGON((0 0, 0.01 0, 0.01 0.01, 0 0.01, 0 0))', 4326)
  );

-- Verify (spatial_identity_hash and area_sqm auto-computed):
SELECT parcel_code, spatial_identity_hash, area_sqm FROM land_registry.parcels;
```

---

## 8. Production Readiness Checklist

- ✅ **Immutability**: Geometries locked after creation, events never deleted
- ✅ **Collision-Proof IDs**: SHA256 spatial_identity_hash ensures uniqueness
- ✅ **Complete Lineage**: Genealogy tracked across subdivisions/merges
- ✅ **Audit Trail**: Every action logged in append-only event table
- ✅ **Conflict Resolution**: Overlap detection with resolution workflow
- ✅ **Scalability**: GIST indexes scale to millions of parcels
- ✅ **Performance**: Precomputed bounds, composite indexes, soft deletes
- ✅ **Data Integrity**: Constraints, triggers, foreign keys
- ✅ **Extensibility**: JSONB metadata for custom attributes
- ✅ **Security**: IP address tracking, source system logging, immutable events

---

## 9. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│  NATIONAL LAND REGISTRY SYSTEM (ScruPeak Digital Property)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  spatial_grids ─────────────────┐                                 │
│  ├─ Hierarchical zones          │                                 │
│  ├─ GIST geometry index          │                                 │
│  └─ Bounding boxes               │                                 │
│                                 │                                 │
│                            ┌────▼────┐                            │
│                            │ parcels │                            │
│                            ├─────────┤                            │
│                            │ • geo   │────┬─ IMMUTABLE            │
│                            │ • hash  │    └─ GIST INDEX           │
│                            │ • area  │                            │
│                            │ • code  │                            │
│                            └────┬────┘                            │
│                                 │                                 │
│     ┌──────────────┬────────────┼─────────────┐                  │
│     │              │            │             │                  │
│  lineage     conflicts        events      ownership               │
│  (genealogy) (overlaps)    (audit log)   (who owns)               │
│                                                                   │
│  spatial_functions & views:                                       │
│  • find_overlapping_parcels()    • detect_grid_conflicts()        │
│  • get_parcel_lineage()          • get_parcel_history()           │
│  • current_parcel_ownership      • active_conflicts               │
│  • grid_statistics                                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Database Statistics & Optimization

### **Expected Performance (at scale)**
- **Parcel Lookup**: O(log n) via spatial hash
- **Lineage Query**: O(depth) via recursive CTE
- **Conflict Detection**: O(n log n) GIST spatial join
- **Event History**: O(1) append, O(log n) retrieval
- **Grid Coverage**: O(n) aggregate calculation

### **Storage Optimization**
- Geometry stored as binary (efficient)
- Bounds as BOX2D (8 bytes vs full geometry)
- JSONB indexes for flexible queries
- Soft deletes avoid expensive DML

---

## 11. Next Steps for Implementation

1. **Load Initial Data**: Import grids for your country
2. **Configure Sequences**: Set up grid_sequences with starting numbers
3. **Implement API Layer**: Use SQLTools "Current Query" editor or build REST/GraphQL
4. **Deploy Spatial Indexes**: Already created; monitor query plans
5. **Monitor Performance**: Track table sizes, index usage
6. **Backup Strategy**: Regular exports of spatial_grids + parcels

---

## Summary: Full Alignment ✅

| Requirement | Status | Details |
|---|---|---|
| spatial_grids table | ✅ | Hierarchical zones with GIST geometry index |
| parcels table | ✅ | Immutable geometry + spatial_identity_hash |
| parcel_lineage | ✅ | Tracks subdivisions/merges |
| parcel_events | ✅ | Append-only audit log with JSONB |
| grid_sequences | ✅ | Deterministic code generation |
| parcel_conflicts | ✅ | Overlap detection + resolution |
| Immutable geometries | ✅ | Trigger prevents modification |
| Unique spatial_identity | ✅ | SHA256 collision-proof hash |
| Foreign keys | ✅ | All relationships constrained |
| PostGIS GIST indexes | ✅ | All geometry columns indexed |
| Comments | ✅ | Every table/column documented |
| National scale | ✅ | Optimized for millions of parcels |

**Your database is production-ready for national-grade land registry operations!**
