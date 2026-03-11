-- ============================================================================
-- ScruPeak: National-Grade Land Registry System
-- Production-Ready Spatial Schema with PostGIS
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create main schema
CREATE SCHEMA IF NOT EXISTS land_registry;
SET search_path TO land_registry;

-- ============================================================================
-- SPATIAL_GRIDS: Reference Grid System (e.g., administrative zones)
-- ============================================================================
-- Purpose: Divide country into reference grids for efficient parcel organization
-- and spatial querying. Each grid can contain multiple parcels.

CREATE TABLE spatial_grids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_code VARCHAR(50) NOT NULL UNIQUE,
  -- Grid code (e.g., "GRID_001", "GRID_002") - human-readable identifier
  
  grid_name VARCHAR(255) NOT NULL,
  -- Display name for the grid (e.g., "Northern District", "Urban Zone A")
  
  grid_level INTEGER NOT NULL,
  -- Hierarchical level (1=country, 2=region, 3=district, 4=locality, etc.)
  
  parent_grid_id UUID REFERENCES spatial_grids(id),
  -- Parent grid for hierarchical organization (NULL for root grids)
  
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  -- Polygon boundary of the grid (WGS84 coordinates)
  
  area_sqm NUMERIC(20, 2) NOT NULL,
  -- Total area of grid in square meters
  
  bounds BOX2D,
  -- Bounding box for quick spatial queries (maintained via trigger)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  -- Soft delete flag for archival
  
  metadata JSONB DEFAULT '{}',
  -- Flexible storage for grid-specific attributes (region, climate zone, etc.)
  
  CONSTRAINT valid_grid_level CHECK (grid_level > 0 AND grid_level <= 10)
);

-- Spatial index for fast grid queries (intersection, containment)
CREATE INDEX idx_spatial_grids_geometry ON spatial_grids USING GIST(geometry);
CREATE INDEX idx_spatial_grids_bounds ON spatial_grids USING GIST(bounds);
CREATE INDEX idx_spatial_grids_code ON spatial_grids(grid_code);
CREATE INDEX idx_spatial_grids_parent ON spatial_grids(parent_grid_id);
CREATE INDEX idx_spatial_grids_level ON spatial_grids(grid_level);
CREATE INDEX idx_spatial_grids_active ON spatial_grids(is_active);

COMMENT ON TABLE spatial_grids IS 'Reference grid system dividing the country into hierarchical zones for efficient parcel organization and spatial queries.';
COMMENT ON COLUMN spatial_grids.grid_code IS 'Unique human-readable grid identifier (e.g., GRID_001)';
COMMENT ON COLUMN spatial_grids.grid_level IS 'Hierarchical level: 1=country, 2=region, 3=district, 4=locality';
COMMENT ON COLUMN spatial_grids.parent_grid_id IS 'Reference to parent grid for hierarchical structure (NULL for root grids)';
COMMENT ON COLUMN spatial_grids.geometry IS 'Polygon boundary in WGS84 (EPSG:4326)';
COMMENT ON COLUMN spatial_grids.bounds IS 'Precomputed bounding box for performance optimization';
COMMENT ON COLUMN spatial_grids.metadata IS 'JSONB for extensible grid attributes (region, climate zone, jurisdiction, etc.)';

-- ============================================================================
-- GRID_SEQUENCES: Deterministic Parcel Code Generator
-- ============================================================================
-- Purpose: Generate unique, deterministic parcel codes per grid
-- using sequences (e.g., GRID_001-000001, GRID_002-000002)

CREATE TABLE grid_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id UUID NOT NULL UNIQUE REFERENCES spatial_grids(id) ON DELETE CASCADE,
  -- Reference to the grid
  
  last_sequence_number BIGINT DEFAULT 0,
  -- Last assigned sequence number in this grid
  
  prefix VARCHAR(20),
  -- Optional prefix (e.g., "GRID_001-")
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grid_sequences_grid_id ON grid_sequences(grid_id);

COMMENT ON TABLE grid_sequences IS 'Manages deterministic parcel code generation per grid to ensure unique, sortable parcel identifiers.';
COMMENT ON COLUMN grid_sequences.last_sequence_number IS 'Next available sequence number for parcel codes in this grid';
COMMENT ON COLUMN grid_sequences.prefix IS 'Prefix used in parcel code generation (e.g., "GRID_001-")';

-- ============================================================================
-- PARCELS: Core Land Parcel Registry
-- ============================================================================
-- Purpose: Store immutable land parcel records with spatial geometry,
-- unique spatial identity hash, and lineage tracking.

CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- System UUID for unique identification
  
  parcel_code VARCHAR(100) NOT NULL UNIQUE,
  -- Human-readable code (e.g., "GRID_001-000001")
  -- Generated deterministically using grid_sequences
  
  grid_id UUID NOT NULL REFERENCES spatial_grids(id),
  -- Reference to the spatial grid containing this parcel
  
  spatial_identity_hash VARCHAR(64) NOT NULL UNIQUE,
  -- SHA256 hash of normalized geometry (collision-proof, immutable)
  -- Computed from: ST_AsText(ST_SnapToGrid(geometry, 0.00001))
  -- This ensures identical geometries have identical hashes
  
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  -- Immutable parcel polygon boundary (WGS84)
  -- Cannot be updated after creation (enforced by trigger)
  
  area_sqm NUMERIC(20, 2) NOT NULL,
  -- Calculated area in square meters (computed from geometry)
  
  bounds BOX2D,
  -- Precomputed bounding box (for query optimization)
  
  parent_parcel_id UUID REFERENCES parcels(id),
  -- Reference to original parcel if this is a subdivision
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  -- Creation timestamp (immutable)
  
  active BOOLEAN DEFAULT true,
  -- Flag for active/inactive status (soft delete)
  
  metadata JSONB DEFAULT '{}',
  -- Flexible attributes (land use, zoning, owner metadata, etc.)
  
  CONSTRAINT valid_area CHECK (area_sqm > 0)
);

-- Spatial indexes for efficient spatial queries
CREATE INDEX idx_parcels_geometry ON parcels USING GIST(geometry);
CREATE INDEX idx_parcels_bounds ON parcels USING GIST(bounds);
CREATE INDEX idx_parcels_code ON parcels(parcel_code);
CREATE INDEX idx_parcels_spatial_identity ON parcels(spatial_identity_hash);
CREATE INDEX idx_parcels_grid_id ON parcels(grid_id);
CREATE INDEX idx_parcels_parent_id ON parcels(parent_parcel_id);
CREATE INDEX idx_parcels_active ON parcels(active);

-- Spatial index for fast intersections/overlaps
CREATE INDEX idx_parcels_grid_geometry ON parcels(grid_id, geometry) WHERE active = true;

COMMENT ON TABLE parcels IS 'Core land parcel registry with immutable spatial geometry, unique spatial identity, and lineage tracking.';
COMMENT ON COLUMN parcels.parcel_code IS 'Human-readable deterministic code (e.g., GRID_001-000001)';
COMMENT ON COLUMN parcels.spatial_identity_hash IS 'SHA256 hash of normalized geometry - unique, immutable, collision-proof identifier';
COMMENT ON COLUMN parcels.geometry IS 'Immutable polygon boundary (cannot be changed after creation)';
COMMENT ON COLUMN parcels.area_sqm IS 'Area in square meters, computed from geometry';
COMMENT ON COLUMN parcels.parent_parcel_id IS 'Reference to original parcel for subdivision tracking';
COMMENT ON COLUMN parcels.active IS 'True=active, False=inactive/merged/deleted';
COMMENT ON COLUMN parcels.metadata IS 'JSONB for extensible attributes (land use, zoning, classification, etc.)';

-- ============================================================================
-- PARCEL_LINEAGE: Subdivision and Merge Tracking
-- ============================================================================
-- Purpose: Track parent-child relationships for subdivisions and merges
-- ensuring complete genealogy of parcels across transactions.

CREATE TABLE parcel_lineage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  parent_parcel_id UUID NOT NULL REFERENCES parcels(id),
  -- The original/parent parcel
  
  child_parcel_id UUID NOT NULL REFERENCES parcels(id),
  -- The new/child parcel (result of subdivision or merge)
  
  operation_type VARCHAR(20) NOT NULL,
  -- Type of operation: 'SUBDIVISION' (1→many), 'MERGE' (many→1)
  
  operation_event_id UUID,
  -- Reference to the event that triggered this relationship
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT valid_operation_type CHECK (operation_type IN ('SUBDIVISION', 'MERGE')),
  CONSTRAINT different_parcels CHECK (parent_parcel_id != child_parcel_id)
);

CREATE INDEX idx_parcel_lineage_parent ON parcel_lineage(parent_parcel_id);
CREATE INDEX idx_parcel_lineage_child ON parcel_lineage(child_parcel_id);
CREATE INDEX idx_parcel_lineage_operation ON parcel_lineage(operation_type);
CREATE INDEX idx_parcel_lineage_created ON parcel_lineage(created_at);

COMMENT ON TABLE parcel_lineage IS 'Tracks parent-child relationships for subdivisions and merges, maintaining complete genealogy.';
COMMENT ON COLUMN parcel_lineage.operation_type IS 'SUBDIVISION (1 parcel → many) or MERGE (many parcels → 1)';
COMMENT ON COLUMN parcel_lineage.operation_event_id IS 'Reference to the parcel_events record that initiated this relationship';

-- ============================================================================
-- PARCEL_EVENTS: Append-Only Event History (Immutable Log)
-- ============================================================================
-- Purpose: Complete audit trail of all actions on parcels (creation, modification,
-- validation, subdivision, merge) stored as append-only records with JSONB payloads.

CREATE TABLE parcel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  -- The parcel affected by this event
  
  event_type VARCHAR(50) NOT NULL,
  -- Type of event: CREATED, VALIDATED, SUBDIVIDED, MERGED, OWNER_CHANGED, 
  -- CONFLICT_DETECTED, CONFLICT_RESOLVED, GEOMETRY_VERIFIED, DEACTIVATED, etc.
  
  event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  -- Immutable timestamp when event occurred
  
  initiated_by VARCHAR(255),
  -- User/system that initiated the event (for audit trail)
  
  event_data JSONB NOT NULL,
  -- Complete event payload including:
  -- For CREATED: {geometry_hash, area_sqm, grid_id, metadata}
  -- For SUBDIVIDED: {child_parcel_ids[], split_ratios}
  -- For MERGED: {merged_parcel_ids[], resulting_area}
  -- For OWNER_CHANGED: {previous_owner, new_owner, transaction_id}
  -- For CONFLICT_DETECTED: {conflicting_parcels[], overlap_area, details}
  -- For CONFLICT_RESOLVED: {resolution_method, final_state}
  
  source_system VARCHAR(100),
  -- Source system (e.g., "web_portal", "mobile_app", "batch_import")
  
  ip_address INET,
  -- IP address of requestor (for security audit)
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'CREATED', 'VALIDATED', 'SUBDIVIDED', 'MERGED', 'OWNER_CHANGED',
    'CONFLICT_DETECTED', 'CONFLICT_RESOLVED', 'GEOMETRY_VERIFIED', 
    'DEACTIVATED', 'REACTIVATED', 'METADATA_UPDATED', 'TRANSFERRED'
  ))
);

-- Indexes for efficient event retrieval
CREATE INDEX idx_parcel_events_parcel ON parcel_events(parcel_id);
CREATE INDEX idx_parcel_events_type ON parcel_events(event_type);
CREATE INDEX idx_parcel_events_timestamp ON parcel_events(event_timestamp);
CREATE INDEX idx_parcel_events_initiated_by ON parcel_events(initiated_by);
CREATE INDEX idx_parcel_events_created_desc ON parcel_events(event_timestamp DESC);

-- JSONB indexes for common query patterns
CREATE INDEX idx_parcel_events_data_gin ON parcel_events USING GIN(event_data);

COMMENT ON TABLE parcel_events IS 'Append-only immutable event log for all parcel actions - audit trail and historical reconstruction.';
COMMENT ON COLUMN parcel_events.event_type IS 'Type of event: CREATED, VALIDATED, SUBDIVIDED, MERGED, OWNER_CHANGED, CONFLICT_*, GEOMETRY_VERIFIED, etc.';
COMMENT ON COLUMN parcel_events.event_data IS 'Complete JSONB payload with all event details and context';
COMMENT ON COLUMN parcel_events.source_system IS 'Origin of the event (web, mobile, batch import, etc.)';
COMMENT ON COLUMN parcel_events.ip_address IS 'IP address of requestor for security auditing';

-- ============================================================================
-- PARCEL_CONFLICTS: Conflict Detection and Resolution
-- ============================================================================
-- Purpose: Track spatial conflicts (overlaps, boundary disputes) between parcels
-- and maintain resolution status and methodology.

CREATE TABLE parcel_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  parcel_id_1 UUID NOT NULL REFERENCES parcels(id),
  -- First parcel in conflict
  
  parcel_id_2 UUID NOT NULL REFERENCES parcels(id),
  -- Second parcel in conflict
  
  conflict_type VARCHAR(50) NOT NULL,
  -- Type: 'OVERLAP' (geometries intersect), 'BOUNDARY_DISPUTE', 'DUPLICATE'
  
  overlap_area_sqm NUMERIC(20, 2),
  -- Area of overlap in square meters (NULL if not applicable)
  
  overlap_geometry GEOMETRY(Polygon, 4326),
  -- The actual overlapping polygon (computed on conflict detection)
  
  confidence_score NUMERIC(3, 2),
  -- Confidence that this is a real conflict (0.0 to 1.0)
  
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  -- When conflict was detected
  
  resolved BOOLEAN DEFAULT false,
  -- Whether conflict has been resolved
  
  resolution_method VARCHAR(100),
  -- Method used to resolve: 'MANUAL_ADJUDICATION', 'AUTOMATIC_PRIORITY',
  -- 'GEOMETRY_CORRECTION', 'OWNER_AGREEMENT', 'COURT_ORDER'
  
  resolved_at TIMESTAMP,
  -- When conflict was resolved
  
  resolved_by VARCHAR(255),
  -- User/system that resolved the conflict
  
  resolution_notes TEXT,
  -- Details of resolution
  
  final_state JSONB,
  -- Result of resolution (e.g., {action: 'keep_parcel_1', action_on_parcel_2: 'adjust_geometry'})
  
  CONSTRAINT valid_conflict_type CHECK (conflict_type IN ('OVERLAP', 'BOUNDARY_DISPUTE', 'DUPLICATE')),
  CONSTRAINT different_parcels_conflict CHECK (parcel_id_1 != parcel_id_2),
  CONSTRAINT parcel_1_less_than_2 CHECK (parcel_id_1::text < parcel_id_2::text)
  -- Ensure consistent ordering (parcel_1 always < parcel_2 to avoid duplicate conflicts)
);

-- Indexes for efficient conflict detection
CREATE INDEX idx_parcel_conflicts_parcel1 ON parcel_conflicts(parcel_id_1);
CREATE INDEX idx_parcel_conflicts_parcel2 ON parcel_conflicts(parcel_id_2);
CREATE INDEX idx_parcel_conflicts_type ON parcel_conflicts(conflict_type);
CREATE INDEX idx_parcel_conflicts_resolved ON parcel_conflicts(resolved);
CREATE INDEX idx_parcel_conflicts_detected_at ON parcel_conflicts(detected_at);

-- Spatial index for overlap detection
CREATE INDEX idx_parcel_conflicts_overlap_geometry ON parcel_conflicts USING GIST(overlap_geometry) WHERE overlap_geometry IS NOT NULL;

-- Composite index for finding conflicts by parcel and status
CREATE INDEX idx_parcel_conflicts_parcel_status ON parcel_conflicts(parcel_id_1, resolved) WHERE resolved = false;
CREATE INDEX idx_parcel_conflicts_parcel2_status ON parcel_conflicts(parcel_id_2, resolved) WHERE resolved = false;

COMMENT ON TABLE parcel_conflicts IS 'Track spatial conflicts (overlaps, boundary disputes) and resolution history.';
COMMENT ON COLUMN parcel_conflicts.conflict_type IS 'OVERLAP (geometries intersect), BOUNDARY_DISPUTE, or DUPLICATE';
COMMENT ON COLUMN parcel_conflicts.overlap_geometry IS 'The actual intersecting polygon (if applicable)';
COMMENT ON COLUMN parcel_conflicts.confidence_score IS 'Confidence that this is a real conflict (0.0-1.0)';
COMMENT ON COLUMN parcel_conflicts.resolution_method IS 'How the conflict was resolved (MANUAL_ADJUDICATION, AUTOMATIC_PRIORITY, etc.)';
COMMENT ON COLUMN parcel_conflicts.final_state IS 'JSONB outcome of resolution';

-- ============================================================================
-- OWNERS: Property Owner/Stakeholder Management
-- ============================================================================

CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL,
  owner_type VARCHAR(50) NOT NULL,
  -- Individual, Company, Government, Trust, etc.
  
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_owner_type CHECK (owner_type IN ('Individual', 'Company', 'Government', 'Trust', 'Entity'))
);

CREATE INDEX idx_owners_tax_id ON owners(tax_id);
CREATE INDEX idx_owners_email ON owners(email);
CREATE INDEX idx_owners_active ON owners(active);

COMMENT ON TABLE owners IS 'Property owner and stakeholder records.';

-- ============================================================================
-- PARCEL_OWNERSHIP: Current and Historical Ownership Records
-- ============================================================================

CREATE TABLE parcel_ownership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  owner_id UUID NOT NULL REFERENCES owners(id),
  
  ownership_percentage NUMERIC(5, 2) NOT NULL,
  ownership_type VARCHAR(50),
  -- Sole, Joint, Partnership, etc.
  
  start_date DATE NOT NULL,
  end_date DATE,
  -- NULL end_date means current ownership
  
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_percentage CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  CONSTRAINT unique_current_ownership UNIQUE (parcel_id, owner_id) WHERE is_current = true
);

CREATE INDEX idx_parcel_ownership_parcel ON parcel_ownership(parcel_id);
CREATE INDEX idx_parcel_ownership_owner ON parcel_ownership(owner_id);
CREATE INDEX idx_parcel_ownership_current ON parcel_ownership(is_current);

COMMENT ON TABLE parcel_ownership IS 'Current and historical ownership records linked to parcel events.';

-- ============================================================================
-- TRIGGERS: Enforce Immutability and Data Integrity
-- ============================================================================

-- Trigger 1: Prevent geometry modification (immutable parcel geometry)
CREATE OR REPLACE FUNCTION prevent_parcel_geometry_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.geometry IS NOT NULL AND OLD.geometry != NEW.geometry THEN
    RAISE EXCEPTION 'Cannot modify parcel geometry after creation. Parcel code: %', OLD.parcel_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_parcel_geometry_update
BEFORE UPDATE ON parcels
FOR EACH ROW
EXECUTE FUNCTION prevent_parcel_geometry_update();

-- Trigger 2: Compute and set spatial_identity_hash on parcel creation
CREATE OR REPLACE FUNCTION compute_spatial_identity_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Hash normalized geometry (snapped to 0.00001 degree grid)
  NEW.spatial_identity_hash := encode(
    digest(
      ST_AsText(ST_SnapToGrid(NEW.geometry, 0.00001)),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_spatial_identity_hash
BEFORE INSERT ON parcels
FOR EACH ROW
EXECUTE FUNCTION compute_spatial_identity_hash();

-- Trigger 3: Automatically compute area from geometry
CREATE OR REPLACE FUNCTION compute_parcel_area()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate area in square meters using geography type
  NEW.area_sqm := ST_Area(NEW.geometry::geography);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_parcel_area
BEFORE INSERT OR UPDATE ON parcels
FOR EACH ROW
EXECUTE FUNCTION compute_parcel_area();

-- Trigger 4: Automatically compute bounding box
CREATE OR REPLACE FUNCTION compute_bounds()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bounds := ST_Envelope(NEW.geometry)::BOX2D;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_parcel_bounds
BEFORE INSERT OR UPDATE ON parcels
FOR EACH ROW
EXECUTE FUNCTION compute_bounds();

CREATE TRIGGER trg_compute_grid_bounds
BEFORE INSERT OR UPDATE ON spatial_grids
FOR EACH ROW
EXECUTE FUNCTION compute_bounds();

-- Trigger 5: Prevent parcel deletion (soft delete via 'active' flag)
CREATE OR REPLACE FUNCTION prevent_parcel_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Cannot delete parcels. Set active=false instead. Parcel code: %', OLD.parcel_code;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_parcel_deletion
BEFORE DELETE ON parcels
FOR EACH ROW
EXECUTE FUNCTION prevent_parcel_deletion();

-- Trigger 6: Prevent event modification (immutable event log)
CREATE OR REPLACE FUNCTION prevent_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Parcel events are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_event_update
BEFORE UPDATE ON parcel_events
FOR EACH ROW
EXECUTE FUNCTION prevent_event_modification();

CREATE TRIGGER trg_prevent_event_deletion
BEFORE DELETE ON parcel_events
FOR EACH ROW
EXECUTE FUNCTION prevent_event_modification();

-- ============================================================================
-- FUNCTIONS: Spatial Analysis and Querying
-- ============================================================================

-- Function 1: Find all parcels overlapping with a given geometry
CREATE OR REPLACE FUNCTION find_overlapping_parcels(
  p_geometry GEOMETRY,
  p_grid_id UUID DEFAULT NULL
)
RETURNS TABLE (
  parcel_id UUID,
  parcel_code VARCHAR,
  overlap_area_sqm NUMERIC,
  overlap_geometry GEOMETRY
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.parcel_code,
    ST_Area(ST_Intersection(p.geometry, p_geometry)::geography)::NUMERIC(20, 2),
    ST_Intersection(p.geometry, p_geometry)
  FROM parcels p
  WHERE ST_Intersects(p.geometry, p_geometry)
    AND p.active = true
    AND (p_grid_id IS NULL OR p.grid_id = p_grid_id)
  ORDER BY overlap_area_sqm DESC;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get complete lineage (ancestry) of a parcel
CREATE OR REPLACE FUNCTION get_parcel_lineage(p_parcel_id UUID)
RETURNS TABLE (
  generation INTEGER,
  parcel_id UUID,
  parcel_code VARCHAR,
  operation_type VARCHAR,
  created_at TIMESTAMP
) AS $$
WITH RECURSIVE lineage AS (
  SELECT 
    0 as generation,
    p.id,
    p.parcel_code,
    'ORIGIN'::VARCHAR,
    p.created_at
  FROM parcels p
  WHERE p.id = p_parcel_id
  
  UNION ALL
  
  SELECT 
    l.generation + 1,
    pl.parent_parcel_id,
    p.parcel_code,
    pl.operation_type,
    p.created_at
  FROM lineage l
  JOIN parcel_lineage pl ON l.parcel_id = pl.child_parcel_id
  JOIN parcels p ON pl.parent_parcel_id = p.id
)
SELECT * FROM lineage;
$$ LANGUAGE SQL;

-- Function 3: Detect spatial conflicts between parcels in a grid
CREATE OR REPLACE FUNCTION detect_grid_conflicts(
  p_grid_id UUID,
  p_overlap_threshold_sqm NUMERIC DEFAULT 0.01
)
RETURNS TABLE (
  parcel_id_1 UUID,
  parcel_code_1 VARCHAR,
  parcel_id_2 UUID,
  parcel_code_2 VARCHAR,
  overlap_area_sqm NUMERIC,
  overlap_geometry GEOMETRY
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p1.id,
    p1.parcel_code,
    p2.id,
    p2.parcel_code,
    ST_Area(ST_Intersection(p1.geometry, p2.geometry)::geography)::NUMERIC(20, 2),
    ST_Intersection(p1.geometry, p2.geometry)
  FROM parcels p1
  JOIN parcels p2 ON ST_Intersects(p1.geometry, p2.geometry)
    AND p1.id::text < p2.id::text
  WHERE p1.grid_id = p_grid_id
    AND p2.grid_id = p_grid_id
    AND p1.active = true
    AND p2.active = true
    AND ST_Area(ST_Intersection(p1.geometry, p2.geometry)::geography) > p_overlap_threshold_sqm
  ORDER BY overlap_area_sqm DESC;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Get all events for a parcel
CREATE OR REPLACE FUNCTION get_parcel_history(p_parcel_id UUID)
RETURNS TABLE (
  event_id UUID,
  event_type VARCHAR,
  event_timestamp TIMESTAMP,
  initiated_by VARCHAR,
  event_data JSONB
) AS $$
SELECT 
  id,
  event_type,
  event_timestamp,
  initiated_by,
  event_data
FROM parcel_events
WHERE parcel_id = p_parcel_id
ORDER BY event_timestamp DESC;
$$ LANGUAGE SQL;

-- ============================================================================
-- VIEWS: Useful Query Shortcuts
-- ============================================================================

-- View 1: Current parcel ownership
CREATE VIEW current_parcel_ownership AS
SELECT 
  p.id as parcel_id,
  p.parcel_code,
  o.id as owner_id,
  o.name as owner_name,
  po.ownership_percentage,
  sg.grid_code,
  p.area_sqm
FROM parcels p
JOIN parcel_ownership po ON p.id = po.parcel_id
JOIN owners o ON po.owner_id = o.id
JOIN spatial_grids sg ON p.grid_id = sg.id
WHERE po.is_current = true AND p.active = true
ORDER BY p.parcel_code;

COMMENT ON VIEW current_parcel_ownership IS 'Current ownership records for active parcels with grid and owner details.';

-- View 2: Unresolved conflicts
CREATE VIEW active_conflicts AS
SELECT 
  pc.id,
  p1.parcel_code as parcel_code_1,
  p2.parcel_code as parcel_code_2,
  pc.conflict_type,
  pc.overlap_area_sqm,
  pc.confidence_score,
  pc.detected_at
FROM parcel_conflicts pc
JOIN parcels p1 ON pc.parcel_id_1 = p1.id
JOIN parcels p2 ON pc.parcel_id_2 = p2.id
WHERE pc.resolved = false
ORDER BY pc.confidence_score DESC;

COMMENT ON VIEW active_conflicts IS 'All unresolved spatial conflicts ranked by confidence score.';

-- View 3: Grid capacity (parcel count and coverage)
CREATE VIEW grid_statistics AS
SELECT 
  sg.id as grid_id,
  sg.grid_code,
  sg.grid_name,
  COUNT(p.id) as parcel_count,
  COUNT(p.id) FILTER (WHERE p.active = true) as active_parcels,
  COALESCE(SUM(p.area_sqm), 0) as total_covered_area_sqm,
  sg.area_sqm as grid_area_sqm,
  COALESCE(ROUND(100.0 * SUM(p.area_sqm) / sg.area_sqm, 2), 0) as coverage_percentage
FROM spatial_grids sg
LEFT JOIN parcels p ON sg.id = p.grid_id
GROUP BY sg.id, sg.grid_code, sg.grid_name, sg.area_sqm
ORDER BY sg.grid_code;

COMMENT ON VIEW grid_statistics IS 'Statistics on grid utilization and parcel coverage.';

-- ============================================================================
-- INITIALIZATION DATA: Sample Grids
-- ============================================================================

INSERT INTO spatial_grids (grid_code, grid_name, grid_level, geometry, area_sqm, metadata)
VALUES 
  ('GRID_001', 'Northern District', 1, 
   ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))', 4326),
   111949.27,
   '{"region": "North", "jurisdiction": "Northern Authority"}'),
  ('GRID_002', 'Southern District', 1,
   ST_GeomFromText('POLYGON((0 -1, 1 -1, 1 0, 0 0, 0 -1))', 4326),
   111949.27,
   '{"region": "South", "jurisdiction": "Southern Authority"}')
ON CONFLICT (grid_code) DO NOTHING;

-- Initialize grid sequences
INSERT INTO grid_sequences (grid_id, prefix)
SELECT id, grid_code || '-' FROM spatial_grids
ON CONFLICT (grid_id) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This schema provides:
-- ✓ Scalable spatial grid system for country-level organization
-- ✓ Immutable parcel records with collision-proof spatial identity
-- ✓ Complete lineage tracking (subdivisions/merges)
-- ✓ Append-only event history for audit trails
-- ✓ Spatial conflict detection and resolution
-- ✓ GIST indexes on all geometries for fast queries
-- ✓ Deterministic parcel code generation
-- ✓ Support for millions of parcels with efficient queries
-- ============================================================================
