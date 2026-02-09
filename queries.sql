-- ============================================================================
-- LandBiznes SQLTools Reference Guide
-- Copy-paste queries into "Current Query" editor in VS Code
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY SCHEMA INSTALLATION
-- ============================================================================

-- Check all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'land_registry' 
ORDER BY table_name;

-- Count tables
SELECT count(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'land_registry';

-- Verify spatial indexes
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'land_registry' AND indexdef LIKE '%GIST%'
ORDER BY tablename;

-- Check sample grids
SELECT grid_code, grid_name, grid_level, area_sqm FROM land_registry.spatial_grids;

-- ============================================================================
-- SECTION 2: INSERT SAMPLE DATA
-- ============================================================================

-- Create a sample owner
INSERT INTO land_registry.owners (name, owner_type, email, tax_id)
VALUES ('John Doe', 'Individual', 'john@example.com', 'TAX123456');

-- Create another owner
INSERT INTO land_registry.owners (name, owner_type, email, tax_id)
VALUES ('Smith Enterprises', 'Company', 'contact@smith.com', 'TAX789012');

-- Get owner IDs for reference
SELECT id, name, tax_id FROM land_registry.owners;

-- Insert a sample parcel in GRID_001
INSERT INTO land_registry.parcels 
(parcel_code, grid_id, geometry)
VALUES 
  (
    'GRID_001-000001',
    (SELECT id FROM land_registry.spatial_grids WHERE grid_code = 'GRID_001'),
    ST_GeomFromText('POLYGON((0 0, 0.01 0, 0.01 0.01, 0 0.01, 0 0))', 4326)
  )
RETURNING id, parcel_code, area_sqm, spatial_identity_hash;

-- Insert another parcel
INSERT INTO land_registry.parcels 
(parcel_code, grid_id, geometry)
VALUES 
  (
    'GRID_001-000002',
    (SELECT id FROM land_registry.spatial_grids WHERE grid_code = 'GRID_001'),
    ST_GeomFromText('POLYGON((0.01 0, 0.02 0, 0.02 0.01, 0.01 0.01, 0.01 0))', 4326)
  )
RETURNING id, parcel_code, area_sqm;

-- ============================================================================
-- SECTION 3: OWNERSHIP MANAGEMENT
-- ============================================================================

-- Add owner to a parcel
INSERT INTO land_registry.parcel_ownership (parcel_id, owner_id, ownership_percentage, ownership_type, start_date)
VALUES 
  (
    (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000001'),
    (SELECT id FROM land_registry.owners WHERE tax_id = 'TAX123456'),
    100,
    'Sole',
    CURRENT_DATE
  );

-- Add owner to another parcel
INSERT INTO land_registry.parcel_ownership (parcel_id, owner_id, ownership_percentage, ownership_type, start_date)
VALUES 
  (
    (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000002'),
    (SELECT id FROM land_registry.owners WHERE tax_id = 'TAX789012'),
    100,
    'Sole',
    CURRENT_DATE
  );

-- View current ownership
SELECT * FROM land_registry.current_parcel_ownership;

-- Get owner's portfolio
SELECT 
  o.name, 
  COUNT(po.parcel_id) as parcels_owned,
  SUM(p.area_sqm) as total_area_sqm
FROM land_registry.owners o
LEFT JOIN land_registry.parcel_ownership po ON o.id = po.owner_id AND po.is_current = true
LEFT JOIN land_registry.parcels p ON po.parcel_id = p.id
WHERE o.tax_id = 'TAX123456'
GROUP BY o.id, o.name;

-- ============================================================================
-- SECTION 4: PARCEL EVENTS & AUDIT TRAIL
-- ============================================================================

-- Record a parcel creation event
INSERT INTO land_registry.parcel_events 
(parcel_id, event_type, event_data, initiated_by, source_system, ip_address)
VALUES 
  (
    (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000001'),
    'CREATED',
    jsonb_build_object(
      'geometry_hash', 'abc123',
      'area_sqm', 1234.56,
      'grid_code', 'GRID_001',
      'surveyor', 'John Smith'
    ),
    'system-admin',
    'web_portal',
    '192.168.1.1'::inet
  );

-- Get parcel history
SELECT * FROM land_registry.get_parcel_history(
  (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000001')
);

-- View all events by type
SELECT event_type, COUNT(*) as count FROM land_registry.parcel_events
GROUP BY event_type
ORDER BY count DESC;

-- Recent events (last 10)
SELECT 
  id, parcel_id, event_type, event_timestamp, initiated_by
FROM land_registry.parcel_events
ORDER BY event_timestamp DESC
LIMIT 10;

-- ============================================================================
-- SECTION 5: SPATIAL QUERIES & ANALYSIS
-- ============================================================================

-- Find parcels overlapping with a point
SELECT * FROM land_registry.find_overlapping_parcels(
  ST_GeomFromText('POINT(0.005 0.005)', 4326)
);

-- Find parcels overlapping with a polygon
SELECT * FROM land_registry.find_overlapping_parcels(
  ST_GeomFromText('POLYGON((0 0, 0.015 0, 0.015 0.015, 0 0.015, 0 0))', 4326)
);

-- Find overlapping parcels in specific grid
SELECT * FROM land_registry.find_overlapping_parcels(
  ST_GeomFromText('POLYGON((0 0, 0.025 0, 0.025 0.025, 0 0.025, 0 0))', 4326),
  (SELECT id FROM land_registry.spatial_grids WHERE grid_code = 'GRID_001')
);

-- Calculate distance between parcels
SELECT 
  p1.parcel_code,
  p2.parcel_code,
  ST_Distance(p1.geometry::geography, p2.geometry::geography) as distance_meters
FROM land_registry.parcels p1
JOIN land_registry.parcels p2 ON p1.id < p2.id
WHERE p1.active = true AND p2.active = true;

-- Get spatial statistics for a grid
SELECT 
  grid_code,
  parcel_count,
  active_parcels,
  total_covered_area_sqm,
  grid_area_sqm,
  coverage_percentage
FROM land_registry.grid_statistics
WHERE grid_code = 'GRID_001';

-- ============================================================================
-- SECTION 6: CONFLICT DETECTION & RESOLUTION
-- ============================================================================

-- Detect conflicts in GRID_001
SELECT * FROM land_registry.detect_grid_conflicts(
  (SELECT id FROM land_registry.spatial_grids WHERE grid_code = 'GRID_001'),
  0.01  -- 0.01 sq meter threshold
);

-- View all unresolved conflicts
SELECT * FROM land_registry.active_conflicts;

-- Record a detected conflict
INSERT INTO land_registry.parcel_conflicts 
(parcel_id_1, parcel_id_2, conflict_type, overlap_area_sqm, confidence_score)
VALUES 
  (
    (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000001' LIMIT 1),
    (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000002' LIMIT 1),
    'OVERLAP',
    0.0001,
    0.95
  );

-- Resolve a conflict
UPDATE land_registry.parcel_conflicts
SET 
  resolved = true,
  resolved_at = CURRENT_TIMESTAMP,
  resolved_by = 'conflict-manager',
  resolution_method = 'MANUAL_ADJUDICATION',
  resolution_notes = 'Boundary adjusted per surveyor report',
  final_state = jsonb_build_object('action', 'adjust_parcel_2_geometry', 'status', 'completed')
WHERE 
  conflict_type = 'OVERLAP' 
  AND resolved = false
  AND confidence_score > 0.90;

-- ============================================================================
-- SECTION 7: LINEAGE & GENEALOGY
-- ============================================================================

-- Track subdivision (1 parcel becomes 2)
INSERT INTO land_registry.parcel_lineage (parent_parcel_id, child_parcel_id, operation_type)
VALUES 
  (
    (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000001'),
    (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000003'),
    'SUBDIVISION'
  );

-- Get complete lineage of a parcel
SELECT * FROM land_registry.get_parcel_lineage(
  (SELECT id FROM land_registry.parcels WHERE parcel_code = 'GRID_001-000003')
);

-- Find all descendants of a parcel
WITH RECURSIVE descendants AS (
  SELECT id, parcel_code, parent_parcel_id
  FROM land_registry.parcels
  WHERE parcel_code = 'GRID_001-000001'
  
  UNION ALL
  
  SELECT p.id, p.parcel_code, p.parent_parcel_id
  FROM land_registry.parcels p
  JOIN land_registry.parcel_lineage pl ON p.id = pl.child_parcel_id
  JOIN descendants d ON pl.parent_parcel_id = d.id
)
SELECT * FROM descendants;

-- ============================================================================
-- SECTION 8: METADATA & EXTENSIBILITY
-- ============================================================================

-- Update parcel metadata
UPDATE land_registry.parcels
SET metadata = jsonb_build_object(
  'land_use', 'AGRICULTURAL',
  'zoning', 'RURAL_A',
  'classification', 'CLASS_1',
  'surveyed_date', '2024-01-15',
  'adjacent_roads', 'Highway_101'
)
WHERE parcel_code = 'GRID_001-000001';

-- Query by metadata
SELECT parcel_code, area_sqm, metadata->>'land_use' as land_use
FROM land_registry.parcels
WHERE metadata->>'land_use' = 'AGRICULTURAL';

-- Update grid metadata
UPDATE land_registry.spatial_grids
SET metadata = jsonb_build_object(
  'region', 'Northern',
  'population', 50000,
  'climate_zone', 'Temperate',
  'primary_use', 'Agricultural'
)
WHERE grid_code = 'GRID_001';

-- ============================================================================
-- SECTION 9: PERFORMANCE & MAINTENANCE
-- ============================================================================

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'land_registry'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Analyze query performance (view plans)
EXPLAIN ANALYZE
SELECT p.parcel_code, p.area_sqm
FROM land_registry.parcels p
WHERE ST_Intersects(p.geometry, ST_GeomFromText('POLYGON((0 0, 0.1 0, 0.1 0.1, 0 0.1, 0 0))', 4326));

-- Update statistics (after large inserts)
ANALYZE land_registry.parcels;
ANALYZE land_registry.parcel_conflicts;

-- Check index usage
SELECT 
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'land_registry'
ORDER BY idx_scan DESC;

-- ============================================================================
-- SECTION 10: BULK OPERATIONS
-- ============================================================================

-- Bulk insert parcels (example with 3 parcels)
INSERT INTO land_registry.parcels (parcel_code, grid_id, geometry)
SELECT 
  'GRID_001-' || LPAD((row_number() OVER (ORDER BY seq))::text, 6, '0'),
  (SELECT id FROM land_registry.spatial_grids WHERE grid_code = 'GRID_001'),
  ST_GeomFromText('POLYGON((0 0, 0.01 0, 0.01 0.01, 0 0.01, 0 0))', 4326)
FROM generate_series(4, 6) as seq
RETURNING parcel_code;

-- Bulk insert ownership
INSERT INTO land_registry.parcel_ownership (parcel_id, owner_id, ownership_percentage, ownership_type, start_date)
SELECT 
  p.id,
  o.id,
  100,
  'Sole',
  CURRENT_DATE
FROM land_registry.parcels p
CROSS JOIN land_registry.owners o
WHERE NOT EXISTS (
  SELECT 1 FROM land_registry.parcel_ownership 
  WHERE parcel_id = p.id AND owner_id = o.id AND is_current = true
)
LIMIT 10;

-- ============================================================================
-- SECTION 11: SAMPLE REPORTS
-- ============================================================================

-- Grid utilization report
SELECT 
  grid_code,
  grid_name,
  parcel_count,
  active_parcels,
  ROUND(coverage_percentage, 2) as coverage_pct,
  ROUND(total_covered_area_sqm::numeric, 2) as covered_sqm,
  ROUND(grid_area_sqm::numeric, 2) as grid_sqm
FROM land_registry.grid_statistics
ORDER BY grid_code;

-- Ownership concentration report
SELECT 
  o.name,
  COUNT(po.id) as parcel_count,
  ROUND(SUM(p.area_sqm)::numeric, 2) as total_area_sqm,
  ROUND(AVG(p.area_sqm)::numeric, 2) as avg_parcel_area,
  MIN(p.area_sqm) as min_area,
  MAX(p.area_sqm) as max_area
FROM land_registry.owners o
LEFT JOIN land_registry.parcel_ownership po ON o.id = po.owner_id AND po.is_current = true
LEFT JOIN land_registry.parcels p ON po.parcel_id = p.id AND p.active = true
GROUP BY o.id, o.name
ORDER BY total_area_sqm DESC;

-- Active conflicts severity report
SELECT 
  conflict_type,
  COUNT(*) as conflict_count,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  ROUND(SUM(overlap_area_sqm)::numeric, 2) as total_overlap_sqm
FROM land_registry.parcel_conflicts
WHERE resolved = false
GROUP BY conflict_type
ORDER BY conflict_count DESC;

-- Recent activity log
SELECT 
  event_type,
  COUNT(*) as event_count,
  MAX(event_timestamp) as last_event
FROM land_registry.parcel_events
WHERE event_timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC;

-- ============================================================================
-- TIPS FOR USING SQLTools IN VS CODE
-- ============================================================================

/*
1. SELECT DATABASE:
   - Click "LandBiznes" connection at bottom-left
   - Verify you're in "landbiznes" database

2. EXECUTE QUERIES:
   - Select entire query block
   - Press Ctrl+Shift+E (or right-click > Execute Query)
   - Results appear in "Results" tab

3. USE SNIPPETS:
   - Copy query blocks above into new tab
   - Modify as needed
   - Execute with Ctrl+Shift+E

4. SAVE QUERIES:
   - Save as .sql file in project
   - Organize by function (spatial, ownership, conflicts, etc.)

5. TROUBLESHOOTING:
   - Check connection: "Current Query" tab shows status
   - Column order: Use explicit SELECT list, not *
   - Geometry display: Use ST_AsText() for readable output
   - Large results: Use LIMIT 100 to avoid timeout

6. PERFORMANCE:
   - Use EXPLAIN ANALYZE before production queries
   - Check index usage with pg_stat_user_indexes
   - Monitor table sizes regularly

7. BACKUP:
   - Export schema: pg_dump --schema-only
   - Export data: pg_dump -T (specific tables)
*/

-- ============================================================================
