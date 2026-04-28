const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow web frontend
app.use(cors({
  origin: [
    'https://web-prod-1090857402667.us-central1.run.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-privy-token'],
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": ["'self'", "https://auth.privy.io", "https://api.privy.io", "https://api-gateway-prod-1090857402667.us-central1.run.app", "https://explorer-api.walletconnect.com", "https://mainnet.rpc.privy.systems/"],
      "frame-ancestors": ["'self'", "https://web-prod-1090857402667.us-central1.run.app", "https://auth.privy.io"],
    },
  },
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
      ai: process.env.AI_SERVICE_URL,
    },
  });
});

// Service configuration — use env vars, fallback to real URLs
const services = {
  core: process.env.CORE_SERVICE_URL || 'https://backend-prod-1090857402667.us-central1.run.app',
  spatial: process.env.SPATIAL_SERVICE_URL || 'https://spatial-service-prod-1090857402667.us-central1.run.app',
  ai: process.env.AI_SERVICE_URL || 'https://ai-service-prod-1090857402667.us-central1.run.app',
};
console.log('Service Routes:', services);

// Proxy routes
app.use('/api/v1', proxy(services.core, {
  proxyReqPathResolver: (req) => '/api/v1' + req.url,
}));

// Direct routes (frontend calls /land, /listings etc directly)
app.use('/land', proxy(services.core, {
  proxyReqPathResolver: (req) => '/api/v1/land' + req.url,
}));

app.use('/api/spatial', proxy(services.spatial, {
  proxyReqPathResolver: (req) => req.url,
}));

app.use('/api/ai', proxy(services.ai, {
  proxyReqPathResolver: (req) => req.url,
}));

// Error handling
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
