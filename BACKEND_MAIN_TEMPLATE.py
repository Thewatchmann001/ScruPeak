"""
LandBiznes Backend - Main FastAPI Application
Consolidates all microservices into a single FastAPI backend
"""

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.routers import auth, users, land, agents, escrow, chat, blockchain, admin
from app.middleware import error_handler
from app.config.database import init_db

# List of all routers to include
ROUTERS = [
    (auth.router, "/auth"),
    (users.router, "/users"),
    (land.router, "/land"),
    (agents.router, "/agents"),
    (escrow.router, "/escrow"),
    (chat.router, "/chat"),
    (blockchain.router, "/blockchain"),
    (admin.router, "/admin"),
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting LandBiznes Backend...")
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("🛑 Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="LandBiznes API",
    description="Land Registry & Marketplace Platform with AI & Blockchain",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
app.add_exception_handler(Exception, error_handler.global_exception_handler)

# Include all routers
for router, prefix in ROUTERS:
    app.include_router(router, prefix=prefix, tags=[prefix.strip("/")])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "landbiznes-api",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "LandBiznes API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }

# WebSocket connection manager for real-time chat
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, chat_id: str, websocket: WebSocket):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []
        self.active_connections[chat_id].append(websocket)

    def disconnect(self, chat_id: str, websocket: WebSocket):
        self.active_connections[chat_id].remove(websocket)

    async def broadcast(self, chat_id: str, message: dict):
        if chat_id in self.active_connections:
            for connection in self.active_connections[chat_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")

manager = ConnectionManager()

@app.websocket("/ws/chat/{chat_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: str, user_id: str):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(chat_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Process message through chat service
            message = {
                "user_id": user_id,
                "chat_id": chat_id,
                "message": data.get("message"),
                "timestamp": data.get("timestamp"),
                "attachments": data.get("attachments", []),
            }
            # Broadcast to all connections in this chat
            await manager.broadcast(chat_id, message)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(chat_id, websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
