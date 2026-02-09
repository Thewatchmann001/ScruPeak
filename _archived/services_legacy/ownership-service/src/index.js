const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

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
  res.json({ status: 'healthy', service: 'ownership-service' });
});

// Get current ownership of a parcel
app.get('/ownership/:parcelId/current', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM current_parcel_ownership 
       WHERE parcel_id = $1`,
      [req.params.parcelId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get ownership history
app.get('/ownership/:parcelId/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT po.*, o.owner_name, o.contact_info
       FROM parcel_ownership po
       JOIN owners o ON po.owner_id = o.id
       WHERE po.parcel_id = $1
       ORDER BY po.ownership_start_date DESC`,
      [req.params.parcelId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer ownership
app.post('/ownership/:parcelId/transfer', async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { new_owner_id, transfer_share, transfer_date, reference_document } = req.body;
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // End previous ownership
      await client.query(
        `UPDATE parcel_ownership 
         SET ownership_end_date = $1
         WHERE parcel_id = $2 AND ownership_end_date IS NULL`,
        [transfer_date, parcelId]
      );
      
      // Create new ownership record
      const result = await client.query(
        `INSERT INTO parcel_ownership (parcel_id, owner_id, ownership_share, ownership_start_date, reference_document)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [parcelId, new_owner_id, transfer_share, transfer_date, reference_document]
      );
      
      // Log transfer event
      await client.query(
        `INSERT INTO parcel_events (parcel_id, event_type, event_data)
         VALUES ($1, 'OWNERSHIP_TRANSFER', $2)`,
        [
          parcelId,
          JSON.stringify({
            previous_owner: req.body.previous_owner_id,
            new_owner: new_owner_id,
            share: transfer_share,
            date: transfer_date,
          }),
        ]
      );
      
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Ownership Service running on port ${PORT}`);
});
