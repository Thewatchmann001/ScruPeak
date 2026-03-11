// Shared database client for microservices
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'scrupeak',
  password: process.env.DB_PASSWORD || 'scrupeak',
  database: process.env.DB_NAME || 'scrupeak',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = { pool, query: (text, params) => pool.query(text, params) };
