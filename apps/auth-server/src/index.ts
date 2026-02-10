import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';

const app = new Hono();

app.use('/*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'], // Adjust if your frontend runs on a different port
    credentials: true,
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => {
    return c.json({ 
        status: "OK", 
        service: "LandBiznes Auth Server", 
        documentation: "/api/auth/reference" 
    });
});

app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    return auth.handler(c.req.raw);
});

const port = 4005;
console.log(`Attempting to start server on port ${port}...`);

try {
    serve({
      fetch: app.fetch,
      port
    }, (info) => {
        console.log(`Server is running on port ${info.port}`);
    });
} catch (e) {
    console.error("Failed to start server:", e);
}
