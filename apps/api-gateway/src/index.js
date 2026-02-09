const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      core: process.env.CORE_SERVICE_URL,
      spatial: process.env.SPATIAL_SERVICE_URL,
      ai: process.env.AI_SERVICE_URL
    },
  });
});

// Service Configuration
const services = {
  core: process.env.CORE_SERVICE_URL || 'http://backend:8000',
  spatial: process.env.SPATIAL_SERVICE_URL || 'http://spatial-service:8000',
  ai: process.env.AI_SERVICE_URL || 'http://ai-service:8000',
};

console.log('Service Routes Configuration:', services);

// Proxy Routes

// Core Service (Auth, Users, Land CRUD) - Maps /api/v1/...
app.use('/api/v1', proxy(services.core, {
  proxyReqPathResolver: function (req) {
    return '/api/v1' + req.url;
  }
}));

// Spatial Service - Maps /api/spatial/... -> /...
app.use('/api/spatial', proxy(services.spatial, {
  proxyReqPathResolver: function (req) {
    return req.url; // Maps /api/spatial/register -> /register
  }
}));

// AI Service - Maps /api/ai/... -> /...
app.use('/api/ai', proxy(services.ai, {
  proxyReqPathResolver: function (req) {
    return req.url; // Maps /api/ai/valuation -> /valuation
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;
