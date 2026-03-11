const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'scrupeak',
  password: process.env.DB_PASSWORD || 'scrupeak',
  database: process.env.DB_NAME || 'scrupeak',
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'conflict-service' });
});

// List conflicts
app.get('/conflicts', async (req, res) => {
  try {
    const { grid_id, resolved = false } = req.query;
    
    let query = 'SELECT * FROM parcel_conflicts WHERE resolved = $1';
    const params = [resolved === 'true' ? true : false];
    
    if (grid_id) {
      query += ` AND grid_id = $${params.length + 1}`;
      params.push(grid_id);
    }
    
    query += ' ORDER BY confidence_score DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get single conflict
app.get('/conflicts/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM parcel_conflicts WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conflict not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Detect conflicts in a grid
app.post('/conflicts/detect/:gridId', async (req, res) => {
  try {
    const { gridId } = req.params;
    
    // Call database function to detect conflicts
    const result = await pool.query(
      'SELECT detect_grid_conflicts($1)',
      [gridId]
    );
    
    // Return newly detected conflicts
    const conflicts = await pool.query(
      `SELECT * FROM parcel_conflicts 
       WHERE grid_id = $1 AND resolved = false 
       ORDER BY confidence_score DESC`,
      [gridId]
    );
    
    res.json(conflicts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Resolve a conflict
app.put('/conflicts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_method, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE parcel_conflicts 
       SET resolved = true, 
           resolution_method = $1,
           resolution_notes = $2,
           resolved_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [resolution_method, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conflict not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Conflict Service running on port ${PORT}`);
});
