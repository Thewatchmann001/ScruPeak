const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'landbiznes',
  password: process.env.DB_PASSWORD || 'landbiznes',
  database: process.env.DB_NAME || 'landbiznes',
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'parcel-service' });
});

// List parcels by grid
app.get('/parcels', async (req, res) => {
  try {
    const { grid_id, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM parcels';
    const params = [];
    
    if (grid_id) {
      query += ' WHERE grid_id = $1';
      params.push(grid_id);
    }
    
    query += ` LIMIT ${Math.min(limit, 1000)}`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get single parcel
app.get('/parcels/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              json_agg(json_build_object(
                'owner_id', o.id, 
                'name', o.owner_name,
                'share', po.ownership_share
              )) as owners
       FROM parcels p
       LEFT JOIN parcel_ownership po ON p.id = po.parcel_id
       LEFT JOIN owners o ON po.owner_id = o.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parcel not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Create new parcel
app.post('/parcels', async (req, res) => {
  try {
    const { grid_id, parcel_code, geometry, area_sqm } = req.body;
    
    const result = await pool.query(
      `INSERT INTO parcels (grid_id, parcel_code, geometry, area_sqm, active)
       VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, true)
       RETURNING *`,
      [grid_id, parcel_code, geometry, area_sqm]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Spatial query
app.post('/parcels/spatial-query', async (req, res) => {
  try {
    const { geometry } = req.body;
    
    const result = await pool.query(
      `SELECT * FROM parcels 
       WHERE ST_Intersects(geometry, ST_GeomFromGeoJSON($1))`,
      [geometry]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get parcel lineage
app.get('/parcels/:id/lineage', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM get_parcel_lineage($1)`,
      [req.params.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get parcel history
app.get('/parcels/:id/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pe.*, json_extract_path(event_data, 'metadata') as metadata
       FROM parcel_events pe
       WHERE parcel_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Parcel Service running on port ${PORT}`);
});
