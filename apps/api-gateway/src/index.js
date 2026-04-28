const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed origins — read from env or use defaults
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://web-prod-kqr3pbuu3a-uc.a.run.app,http://localhost:5173,http://localhost:3000').split(',');

// CORS options with proper preflight handling
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS rejection for origin: ${origin}`);
      callback(null, true); // Still allow but log - let browser handle
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-privy-token', 'x-api-key'],
  exposedHeaders: ['Content-Length', 'X-JSON-Response-Body'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Add CSP headers that allow Privy
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["'self'", 'https://auth.privy.io', 'https://embedded.privy.io'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://auth.privy.io'],
      connectSrc: ["'self'", 'https://auth.privy.io', 'https://api.privy.io'],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:', 'https:'],
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
  core: process.env.CORE_SERVICE_URL || 'https://backend-prod-kqr3pbuu3a-uc.a.run.app',
  spatial: process.env.SPATIAL_SERVICE_URL || 'https://spatial-service-prod-kqr3pbuu3a-uc.a.run.app',
  ai: process.env.AI_SERVICE_URL || 'https://ai-service-prod-kqr3pbuu3a-uc.a.run.app',
};
console.log('Service Routes:', services);

// Proxy options to preserve headers
const proxyOptions = {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    // Preserve original auth and content headers
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }
    if (srcReq.headers['x-privy-token']) {
      proxyReqOpts.headers['x-privy-token'] = srcReq.headers['x-privy-token'];
    }
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    // Ensure CORS headers are set on response
    const origin = userReq.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      userRes.setHeader('Access-Control-Allow-Origin', origin);
      userRes.setHeader('Access-Control-Allow-Credentials', 'true');
      userRes.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-JSON-Response-Body');
    }
    return proxyResData;
  },
};

// Proxy routes
app.use('/api/v1', proxy(services.core, {
  ...proxyOptions,
  proxyReqPathResolver: (req) => '/api/v1' + req.url,
}));

// Direct routes (frontend calls /land, /listings etc directly)
app.use('/land', proxy(services.core, {
  ...proxyOptions,
  proxyReqPathResolver: (req) => '/api/v1/land' + req.url,
}));

app.use('/api/spatial', proxy(services.spatial, {
  ...proxyOptions,
  proxyReqPathResolver: (req) => req.url,
}));

app.use('/api/ai', proxy(services.ai, {
  ...proxyOptions,
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
