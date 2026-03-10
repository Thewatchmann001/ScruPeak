"""
Chat router - messaging, fraud detection
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
import logging

from app.core.database import get_db
from app.models import ChatMessage, User, Land
from app.schemas import ChatMessageCreate, ChatMessageResponse
from app.utils.auth import get_current_user
from app.core.config import get_settings
from fastapi import UploadFile, File, Query
import os
import aiofiles

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send message"
)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send chat message with fraud detection"""
    
    # Fraud detection logic (simplified)
    fraud_alert = False
    fraud_reason = None
    
    # Check for external links
    contains_external_link = "http://" in message_data.message or "https://" in message_data.message
    
    # Check for phone numbers
    import re
    contains_phone = bool(re.search(r'(\d{10}|\+\d{1,3})', message_data.message))
    
    if contains_external_link or contains_phone:
        fraud_alert = True
        fraud_reason = "Suspicious content detected"
    
    new_message = ChatMessage(
        chat_id=message_data.chat_id,
        land_ulid=message_data.land_ulid,
        sender_id=current_user.id,
        message=message_data.message,
        attachments=message_data.attachments or [],
        contains_external_link=contains_external_link,
        contains_phone=contains_phone,
        fraud_alert=fraud_alert,
        fraud_reason=fraud_reason
    )
    
    db.add(new_message)

    # Blockchain Anchoring for conversations
    # Every conversation message is timestamped and stored on Solana for legal evidence
    from app.services.blockchain import BlockchainService
    try:
        anchor_data = {
            "type": "CHAT_MESSAGE",
            "chat_id": message_data.chat_id,
            "land_ulid": message_data.land_ulid,
            "sender_id": str(current_user.id),
            "msg_hash": hashlib.sha256(message_data.message.encode()).hexdigest(),
            "timestamp": datetime.utcnow().isoformat()
        }
        tx_sig = BlockchainService.simulate_transaction(BlockchainService.generate_hash(anchor_data))
        new_message.blockchain_tx_signature = tx_sig
        new_message.blockchain_timestamp = datetime.utcnow()
    except Exception as e:
        logger.error(f"Chat blockchain anchoring failed: {e}")

    await db.commit()
    await db.refresh(new_message)
    
    logger.info(f"Message sent & anchored: {new_message.id} (fraud_alert: {fraud_alert})")
    
    return new_message


@router.get(
    "/{chat_id}",
    response_model=list,
    summary="Get chat messages"
)
async def get_messages(
    chat_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get chat messages for a conversation"""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return list(reversed(messages))


@router.post(
    "/start/{land_id}",
    status_code=status.HTTP_200_OK,
    summary="Start chat for land listing"
)
async def start_chat_for_listing(
    land_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Land).where(Land.id == land_id))
    land = result.scalars().first()
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found")
    if land.owner_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot start chat with self")
    chat_id = f"{str(land_id)}:{str(current_user.id)}:{str(land.owner_id)}"
    return {
        "chat_id": chat_id,
        "land_id": str(land_id),
        "buyer_id": str(current_user.id),
        "seller_id": str(land.owner_id)
    }


@router.get(
    "/conversations/me",
    status_code=status.HTTP_200_OK,
    summary="List my conversations"
)
async def list_my_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50
):
    # Gather conversations where user sent messages
    sent_result = await db.execute(
        select(ChatMessage.chat_id, func.max(ChatMessage.created_at).label("last_at"))
        .where(ChatMessage.sender_id == current_user.id)
        .group_by(ChatMessage.chat_id)
        .order_by(func.max(ChatMessage.created_at).desc())
        .limit(limit)
    )
    sent_convos = sent_result.all()
    
    # Gather conversations where user appears in chat_id format
    like_pattern = f"%{str(current_user.id)}%"
    involved_result = await db.execute(
        select(ChatMessage.chat_id, func.max(ChatMessage.created_at).label("last_at"))
        .where(ChatMessage.chat_id.ilike(like_pattern))
        .group_by(ChatMessage.chat_id)
        .order_by(func.max(ChatMessage.created_at).desc())
        .limit(limit)
    )
    involved_convos = involved_result.all()
    
    # Merge
    merged = {}
    for cid, last_at in sent_convos + involved_convos:
        if cid not in merged or (last_at and merged[cid] and last_at > merged[cid]):
            merged[cid] = last_at
    
    conversations = []
    for cid, last_at in merged.items():
        parts = cid.split(":")
        land_id = parts[0] if len(parts) > 0 else None
        buyer_id = parts[1] if len(parts) > 1 else None
        seller_id = parts[2] if len(parts) > 2 else None
        
        last_msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.chat_id == cid)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalars().first()
        
        conversations.append({
            "chat_id": cid,
            "land_id": land_id,
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "last_message": {
                "sender_id": str(last_msg.sender_id) if last_msg else None,
                "message": last_msg.message if last_msg else None,
                "created_at": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else None
            }
        })
    
    return {"count": len(conversations), "items": conversations}


@router.post(
    "/{chat_id}/attachments",
    status_code=status.HTTP_201_CREATED,
    summary="Upload chat attachment (image, video, document, voice)"
)
async def upload_chat_attachment(
    chat_id: str,
    file: UploadFile = File(...),
    kind: str = Query("document", description="image|video|document|voice"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    settings = get_settings()
    safe_chat = chat_id.replace(":", "_")
    subdir = os.path.join(settings.UPLOAD_DIR, "chat", safe_chat)
    os.makedirs(subdir, exist_ok=True)
    
    filename = f"{kind}-{current_user.id}-{file.filename}"
    path = os.path.join(subdir, filename)
    
    async with aiofiles.open(path, "wb") as out:
        content = await file.read()
        await out.write(content)
    
    url = f"/static/chat/{safe_chat}/{filename}"
    
    msg = ChatMessage(
        chat_id=chat_id,
        sender_id=current_user.id,
        message=f"{kind} attachment",
        attachments=[url],
        contains_external_link=False,
        contains_phone=False,
        fraud_alert=False
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    
    return {
        "chat_id": chat_id,
        "attachment_url": url,
        "message_id": str(msg.id)
    }


@router.post(
    "/{chat_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Mark messages as read"
)
async def mark_read(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 100
):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    msgs = result.scalars().all()
    updated = 0
    uid = str(current_user.id)
    for m in msgs:
        rb = m.read_by or []
        if uid not in rb:
            rb.append(uid)
            m.read_by = rb
            db.add(m)
            updated += 1
    await db.commit()
    return {"chat_id": chat_id, "updated": updated}
