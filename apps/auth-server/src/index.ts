console.log("Starting Auth Server...");
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth.js';

const app = new Hono();

app.use('/*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://127.0.0.1:3000'],
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

app.on(['POST', 'GET'], '/api/auth/**', async (c) => {
    console.log(`[Auth] Request: ${c.req.method} ${c.req.url}`);
    try {
        const response = await auth.handler(c.req.raw);
        console.log(`[Auth] Response status: ${response.status}`);
        
        // If better-auth returns an internal error, log the body
        if (response.status === 500) {
            const body = await response.clone().text();
            console.error("[Auth] 500 Error Body:", body);
        }
        
        const origin = c.req.header('origin') || '*';
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Credentials', 'true');
        return new Response(response.body, { status: response.status, headers });
    } catch (e) {
        console.error("[Auth] Handler Error:", e);
        // Log full error details including stack trace
        if (e instanceof Error) {
            console.error(e.stack);
        }
        return c.json({ error: "Internal Server Error", details: String(e) }, 500);
    }
});

const port = 4005;
console.log(`Attempting to start server on port ${port}...`);

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

try {
    serve({
      fetch: app.fetch,
      port,
      hostname: '0.0.0.0'
    }, (info) => {
        console.log(`Server is running on http://${info.address}:${info.port}`);
    });
} catch (e) {
    console.error("Failed to start server:", e);
}
