"""
WebSocket endpoints for real-time chat and notifications
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
from uuid import UUID

from app.core.database import get_db
from app.core.config import get_settings
from app.models import User
from app.models import ChatMessage as DBChatMessage
from app.utils.auth import jwt_handler
from app.websockets.manager import manager, ChatMessage, notification_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["WebSocket"])


def verify_token(token: str):
    """Verify JWT token and return payload"""
    return jwt_handler.decode_token(token, token_type="access")


@router.websocket("/chat/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time chat
    
    Usage:
    - Connect: ws://localhost:8000/ws/chat/room123?token=<jwt_token>
    - Send: {"type": "message", "content": "Hello"}
    - Receive: {"type": "message", "user": "user123", "content": "Hello", "timestamp": "..."}
    """
    
    try:
        # Verify token and get user
        user_data = verify_token(token)
        if not user_data:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return
        
        user_id = user_data.get("sub")
        
        # Connect to room
        await manager.connect(websocket, room_id, user_id)
        
        # Notify others that user joined
        join_message = ChatMessage(
            sender_id=user_id,
            room_id=room_id,
            content=f"User {user_id} joined",
            message_type="join"
        )
        await manager.broadcast_to_room(room_id, join_message.to_dict())
        
        logger.info(f"User {user_id} joined chat room {room_id}")
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_json()
                
                message_type = data.get("type", "message")
                content = data.get("content", "")
                
                if message_type == "message":
                    # Create and broadcast message
                    msg = ChatMessage(
                        sender_id=user_id,
                        room_id=room_id,
                        content=content,
                        message_type="message"
                    )
                    
                    await manager.broadcast_to_room(room_id, msg.to_dict())
                    logger.debug(f"Message from {user_id} in room {room_id}: {content}")
                    
                    # Persist to database
                    try:
                        db_msg = DBChatMessage(
                            chat_id=room_id,
                            sender_id=UUID(user_id),
                            message=content,
                            attachments=[]
                        )
                        db.add(db_msg)
                        await db.commit()
                    except Exception as e:
                        await db.rollback()
                        logger.error(f"Failed to persist chat message: {e}")
                
                elif message_type == "typing":
                    # Notify others that user is typing
                    typing_msg = {
                        "type": "typing",
                        "user_id": user_id,
                        "room_id": room_id
                    }
                    await manager.broadcast_to_room(room_id, typing_msg)
                
                elif message_type == "status":
                    # User status update
                    status_msg = {
                        "type": "user_status",
                        "user_id": user_id,
                        "status": data.get("status", "online")
                    }
                    await manager.broadcast_to_room(room_id, status_msg)
        
        except WebSocketDisconnect:
            # Notify others that user left
            leave_message = ChatMessage(
                sender_id=user_id,
                room_id=room_id,
                content=f"User {user_id} left",
                message_type="leave"
            )
            await manager.broadcast_to_room(room_id, leave_message.to_dict())
            manager.disconnect(room_id, websocket, user_id)
            logger.info(f"User {user_id} disconnected from room {room_id}")
        
        except Exception as e:
            logger.error(f"WebSocket error in room {room_id}: {e}")
            manager.disconnect(room_id, websocket, user_id)
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close(code=status.WS_1011_SERVER_ERROR, reason="Internal error")


@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time notifications
    
    Usage:
    - Connect: ws://localhost:8000/ws/notifications?token=<jwt_token>
    - Receive: {"type": "notification", "title": "...", "message": "..."}
    """
    
    try:
        # Verify token
        user_data = verify_token(token)
        if not user_data:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return
        
        user_id = user_data.get("sub")
        
        await websocket.accept()
        logger.info(f"User {user_id} connected to notifications")
        
        try:
            while True:
                # Keep connection alive
                data = await websocket.receive_json()
                
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                
        except WebSocketDisconnect:
            logger.info(f"User {user_id} disconnected from notifications")
        
        except Exception as e:
            logger.error(f"Notification WebSocket error: {e}")
    
    except Exception as e:
        logger.error(f"Notification connection error: {e}")
        await websocket.close(code=status.WS_1011_SERVER_ERROR, reason="Internal error")


# REST API endpoints for chat history and notifications

from fastapi import Path

@router.get("/chat/{room_id}/users", tags=["Chat"])
async def get_room_users(
    room_id: str = Path(...)
):
    """Get list of active users in a chat room"""
    users = manager.get_room_users(room_id)
    return {
        "room_id": room_id,
        "user_count": manager.get_room_count(room_id),
        "users": users
    }


@router.get("/chat/{room_id}/status", tags=["Chat"])
async def get_room_status(
    room_id: str = Path(...)
):
    """Get chat room status"""
    return {
        "room_id": room_id,
        "active": manager.get_room_count(room_id) > 0,
        "user_count": manager.get_room_count(room_id)
    }


@router.get("/notifications/me", tags=["Notifications"])
async def get_my_notifications(
    limit: int = 50,
    token: str = Query(...)
):
    """Get user's notifications"""
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = user_data.get("sub")
    notifications = notification_manager.get_notifications(user_id, limit)
    
    return {
        "user_id": user_id,
        "notification_count": len(notifications),
        "notifications": notifications
    }


@router.post("/notifications/clear", tags=["Notifications"])
async def clear_notifications(
    token: str = Query(...)
):
    """Clear user's notifications"""
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = user_data.get("sub")
    notification_manager.clear_notifications(user_id)
    
    logger.info(f"Cleared notifications for user {user_id}")
    
    return {"message": "Notifications cleared"}
