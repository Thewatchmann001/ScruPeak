"""
WebSocket management for real-time chat and notifications
"""
from fastapi import WebSocket
from typing import Dict, Set, List
import json
import logging
from datetime import datetime
from uuid import UUID

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage active WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_rooms: Dict[str, Set[str]] = {}  # Map user to room IDs
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        
        self.user_rooms[user_id].add(room_id)
        logger.info(f"User {user_id} connected to room {room_id}")
    
    def disconnect(self, room_id: str, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]
        
        logger.info(f"User {user_id} disconnected from room {room_id}")
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: str = None):
        """Send message to all users in a room"""
        if room_id not in self.active_connections:
            return
        
        disconnected = []
        for websocket in self.active_connections[room_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to room {room_id}: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected clients
        for ws in disconnected:
            self.active_connections[room_id].remove(ws)
    
    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send message to a specific user"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    def get_room_users(self, room_id: str) -> List[str]:
        """Get list of users in a room"""
        if room_id not in self.active_connections:
            return []
        
        # Count unique users (simplified - in production, track user_id per connection)
        return [f"user_{i}" for i in range(len(self.active_connections[room_id]))]
    
    def get_room_count(self, room_id: str) -> int:
        """Get number of active connections in a room"""
        return len(self.active_connections.get(room_id, []))
    
    def get_user_rooms(self, user_id: str) -> Set[str]:
        """Get all rooms a user is connected to"""
        return self.user_rooms.get(user_id, set())


# Global connection manager
manager = ConnectionManager()


class ChatMessage:
    """Represents a chat message"""
    
    def __init__(self, sender_id: str, room_id: str, content: str, message_type: str = "message"):
        self.sender_id = sender_id
        self.room_id = room_id
        self.content = content
        self.message_type = message_type  # "message", "join", "leave", "system"
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "sender_id": self.sender_id,
            "room_id": self.room_id,
            "content": self.content,
            "message_type": self.message_type,
            "timestamp": self.timestamp.isoformat()
        }
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict())


class NotificationManager:
    """Manage user notifications"""
    
    def __init__(self):
        self.user_notifications: Dict[str, List[dict]] = {}
    
    def add_notification(self, user_id: str, notification: dict):
        """Add notification for user"""
        if user_id not in self.user_notifications:
            self.user_notifications[user_id] = []
        
        notification["timestamp"] = datetime.utcnow().isoformat()
        self.user_notifications[user_id].append(notification)
        
        logger.info(f"Notification added for user {user_id}")
    
    def get_notifications(self, user_id: str, limit: int = 50) -> List[dict]:
        """Get recent notifications for user"""
        notifications = self.user_notifications.get(user_id, [])
        return notifications[-limit:]
    
    def clear_notifications(self, user_id: str):
        """Clear all notifications for user"""
        if user_id in self.user_notifications:
            self.user_notifications[user_id] = []
    
    async def notify_user(self, manager: ConnectionManager, user_id: str, notification: dict):
        """Send notification to user if connected"""
        self.add_notification(user_id, notification)
        
        # TODO: Send to connected user if online


# Global notification manager
notification_manager = NotificationManager()
