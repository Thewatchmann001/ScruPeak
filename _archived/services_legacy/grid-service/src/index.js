const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'landbiznes',
  password: process.env.DB_PASSWORD || 'landbiznes',
  database: process.env.DB_NAME || 'landbiznes',
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'grid-service' });
});

// List grids by level or parent
app.get('/grids', async (req, res) => {
  try {
    const { level, parent_id } = req.query;
    
    let query = 'SELECT * FROM spatial_grids WHERE active = true';
    const params = [];
    
    if (level) {
      query += ` AND hierarchy_level = $${params.length + 1}`;
      params.push(level);
    }
    
    if (parent_id) {
      query += ` AND parent_grid_id = $${params.length + 1}`;
      params.push(parent_id);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get single grid
app.get('/grids/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM spatial_grids WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grid not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get grid statistics
app.get('/grids/:id/statistics', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as parcel_count,
        SUM(CASE WHEN active = true THEN 1 ELSE 0 END) as active_parcels,
        (SUM(area_sqm) / ST_Area(g.geometry)) * 100 as coverage_percentage,
        ST_Area(g.geometry) as grid_area_sqm
       FROM spatial_grids g
       LEFT JOIN parcels p ON p.grid_id = g.id
       WHERE g.id = $1
       GROUP BY g.geometry`,
      [req.params.id]
    );
    
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get grid hierarchy
app.get('/grids/hierarchy', async (req, res) => {
  try {
    const result = await pool.query(
      `WITH RECURSIVE grid_tree AS (
        SELECT id, grid_code, grid_name, parent_grid_id, hierarchy_level, geometry
        FROM spatial_grids
        WHERE parent_grid_id IS NULL
        
        UNION ALL
        
        SELECT g.id, g.grid_code, g.grid_name, g.parent_grid_id, g.hierarchy_level, g.geometry
        FROM spatial_grids g
        INNER JOIN grid_tree gt ON g.parent_grid_id = gt.id
      )
      SELECT * FROM grid_tree ORDER BY hierarchy_level, grid_code`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Create new grid
app.post('/grids', async (req, res) => {
  try {
    const { grid_code, grid_name, parent_grid_id, geometry, hierarchy_level } = req.body;
    
    const result = await pool.query(
      `INSERT INTO spatial_grids (grid_code, grid_name, parent_grid_id, geometry, hierarchy_level, active)
       VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4), $5, true)
       RETURNING *`,
      [grid_code, grid_name, parent_grid_id, geometry, hierarchy_level]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Grid Service running on port ${PORT}`);
});
