from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import math

from app.core.config import get_settings
from app.core.database import get_db
from app.models import Escrow, PaymentTransaction, User
from app.utils.auth import get_current_user
from app.services.monime import MonimeClient, LineItem, MonimeError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Payments - Monime"])
settings = get_settings()


def to_minor_units(amount_major: float) -> int:
    return int(math.floor(amount_major * 100))


@router.post("/api/v1/payments/monime/accounts", status_code=status.HTTP_201_CREATED)
async def create_buyer_accounts(
    buyer_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create buyer financial accounts in SLE and USD.
    Returns the created account IDs.
    """
    try:
        client = MonimeClient()
        sle = await client.create_financial_account(currency="SLE", name=f"{buyer_name} - SLE")
        usd = await client.create_financial_account(currency="USD", name=f"{buyer_name} - USD")
        return {"sle_account": sle.get("id"), "usd_account": usd.get("id")}
    except MonimeError as e:
        logger.error(f"Monime account creation failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.post("/api/v1/payments/monime/checkout", status_code=status.HTTP_201_CREATED)
async def start_checkout(
    escrow_id: UUID,
    currency: str,  # "SLE" or "USD"
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create Monime Checkout Session for an escrow.
    """
    # Verify escrow and ownership/participation
    result = await db.execute(select(Escrow).where(Escrow.id == escrow_id))
    escrow = result.scalar_one_or_none()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow not found")
    if escrow.buyer_id != current_user.id and escrow.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for escrow")
    amount_major = float(escrow.amount)
    amount_minor = to_minor_units(amount_major)
    try:
        client = MonimeClient()
        app_url = settings.MONIME_APP_URL or "http://localhost:3006"
        success_url = f"{app_url}/api/checkout/success?escrowId={escrow_id}"
        cancel_url = f"{app_url}/checkout/cancelled?escrowId={escrow_id}"
        line_items = [
            LineItem(
                name=f"Escrow Payment for {escrow_id}",
                price={"currency": currency, "value": amount_minor},
                quantity=1,
                description="ScruPeak escrow payment",
                reference=str(escrow_id),
            )
        ]
        session = await client.create_checkout_session(
            name=f"Escrow {escrow_id}",
            order_id=str(escrow_id),
            line_items=line_items,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"escrow_id": str(escrow_id), "currency": currency},
            callback_state=f"escrow_{escrow_id}",
        )
        # Record payment
        payment = PaymentTransaction(
            id=uuid4(),
            escrow_id=escrow_id,
            amount=escrow.amount,
            payment_method="monime",
            status="pending",
            reference_number=session.get("id"),
        )
        db.add(payment)
        await db.commit()
        return {"redirectUrl": session.get("redirectUrl"), "sessionId": session.get("id"), "payment_id": str(payment.id)}
    except MonimeError as e:
        logger.error(f"Monime checkout failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.post("/api/v1/payments/monime/webhook", status_code=status.HTTP_200_OK)
async def monime_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Monime webhook callbacks and release escrow funds on payment confirmation.
    Basic verification via Monime-Webhook-Id header; recommend signature verification if available.
    """
    webhook_id = request.headers.get("Monime-Webhook-Id")
    if settings.MONIME_WEBHOOK_ID and webhook_id != settings.MONIME_WEBHOOK_ID:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook")
    payload = await request.json()
    event_type = payload.get("type")
    data = payload.get("data", {})
    try:
        if event_type in ("checkout_session.completed", "payment.succeeded"):
            session_id = data.get("id") or data.get("sessionId")
            metadata = data.get("metadata", {})
            escrow_id_str = metadata.get("escrow_id")
            # Update payment
            payment_result = await db.execute(
                select(PaymentTransaction).where(PaymentTransaction.reference_number == session_id)
            )
            payment = payment_result.scalar_one_or_none()
            if payment:
                payment.status = "completed"
                db.add(payment)
                await db.commit()
            # Update escrow
            if escrow_id_str:
                escrow_id = UUID(escrow_id_str)
                escrow_result = await db.execute(select(Escrow).where(Escrow.id == escrow_id))
                escrow = escrow_result.scalar_one_or_none()
                if escrow:
                    escrow.status = "active"
                    db.add(escrow)
                    await db.commit()
            # Payout to seller (example: destination uses seller metadata or configured account)
            # This assumes you manage seller destination details externally.
            # If you maintain seller Monime account in your DB, use it here.
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Webhook processing error")


@router.post("/api/v1/payments/monime/payout", status_code=status.HTTP_201_CREATED)
async def release_funds_to_seller(
    source_account_id: str,
    destination: Dict[str, Any],  # e.g., {"type":"account","accountId":"..."} or bank details
    amount_minor: int,
    currency: str,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Release funds from escrow float account to seller via Monime Payout API.
    """
    try:
        client = MonimeClient()
        result = await client.payout(
            source_account_id=source_account_id,
            destination=destination,
            amount_minor=amount_minor,
            currency=currency,
            description=description or "Escrow payout",
        )
        return {"payout": result}
    except MonimeError as e:
        logger.error(f"Payout failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.post("/api/v1/payments/monime/transfer", status_code=status.HTTP_201_CREATED)
async def internal_transfer(
    from_account_id: str,
    to_account_id: str,
    amount_minor: int,
    currency: str,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Internal transfer for float management.
    """
    try:
        client = MonimeClient()
        result = await client.create_internal_transfer(
            from_account_id=from_account_id,
            to_account_id=to_account_id,
            amount_minor=amount_minor,
            currency=currency,
            description=description,
        )
        return {"transfer": result}
    except MonimeError as e:
        logger.error(f"Internal transfer failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.get("/api/v1/payments/monime/receipt/{transaction_id}", status_code=status.HTTP_200_OK)
async def get_receipt(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a receipt for compliance using transaction details.
    """
    try:
        client = MonimeClient()
        receipt = await client.generate_receipt(transaction_id)
        return {"receipt": receipt}
    except MonimeError as e:
        logger.error(f"Receipt generation failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

