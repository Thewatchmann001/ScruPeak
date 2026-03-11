import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
    origin: true, // Allow all origins for debugging
    credentials: true
}));

// Add a simple logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Better Auth handler
app.all("/api/auth/*", (req, res) => {
    return toNodeHandler(auth)(req, res);
});

const port = process.env.PORT || 4005;
app.listen(port, () => {
    console.log(`Auth server running on http://localhost:${port}`);
});
