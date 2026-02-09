"""
Payment processing router - integrates with Stripe/Paystack
Handles transactions, invoices, and payment verification
"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID, uuid4
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional
from enum import Enum

from app.core.database import get_db
from app.models import User, Escrow, PaymentTransaction, EscrowStatus
from app.core.config import get_settings
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])


class PaymentMethod(str, Enum):
    STRIPE = "stripe"
    PAYSTACK = "paystack"
    BANK_TRANSFER = "bank_transfer"
    MONIME = "monime"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


@router.post("/initiate", status_code=status.HTTP_201_CREATED)
async def initiate_payment(
    escrow_id: UUID,
    amount: Decimal,
    payment_method: PaymentMethod,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initiate a payment for an escrow transaction"""
    
    # Verify escrow exists
    escrow_result = await db.execute(
        select(Escrow).where(Escrow.id == escrow_id)
    )
    escrow = escrow_result.scalar_one_or_none()
    
    if not escrow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow transaction not found"
        )
    
    # Verify user is involved
    if not hasattr(escrow, 'buyer_id') or not hasattr(escrow, 'seller_id'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid escrow record"
        )
    
    if escrow.buyer_id != current_user.id and escrow.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You're not involved in this transaction"
        )
    
    # Verify amount matches escrow amount
    if amount != escrow.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must equal escrow amount: {escrow.amount}"
        )
    
    # Create payment record
    payment = PaymentTransaction(
        id=uuid4(),
        escrow_id=escrow_id,
        amount=amount,
        payment_method=payment_method.value,
        status=PaymentStatus.PENDING.value
    )
    
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    logger.info(f"Payment initiated: {payment.id} via {payment_method}")
    
    # Generate payment URL based on method
    payment_url = await generate_payment_url(payment, payment_method)
    
    return {
        "payment_id": str(payment.id),
        "escrow_id": str(escrow_id),
        "amount": str(amount),
        "status": PaymentStatus.PENDING.value,
        "payment_method": payment_method.value,
        "payment_url": payment_url
    }


async def generate_payment_url(payment: PaymentTransaction, method: PaymentMethod) -> str:
    """Generate payment URL based on payment method"""
    
    if method == PaymentMethod.STRIPE:
        return f"/payments/stripe/checkout/{payment.id}"
    elif method == PaymentMethod.PAYSTACK:
        return f"/payments/paystack/checkout/{payment.id}"
    elif method == PaymentMethod.BANK_TRANSFER:
        return f"/payments/bank-transfer/{payment.id}"
    elif method == PaymentMethod.MONIME:
        return f"/api/v1/payments/monime/checkout/{payment.id}"
    else:
        return ""


@router.post("/stripe/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    event: dict,
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook callbacks"""
    
    event_type = event.get("type")
    
    if event_type == "charge.succeeded":
        payment_intent = event.get("data", {}).get("object", {})
        payment_id = payment_intent.get("metadata", {}).get("payment_id")
        
        if payment_id:
            # Update payment status
            result = await db.execute(
                select(PaymentTransaction).where(PaymentTransaction.id == UUID(payment_id))
            )
            payment = result.scalar_one_or_none()
            
            if payment:
                payment.status = PaymentStatus.COMPLETED.value
                payment.reference_number = payment_intent.get("id")
                payment.completed_at = datetime.utcnow()
                
                db.add(payment)
                await db.commit()
                
                logger.info(f"Stripe payment completed: {payment_id}")
                
                # Update escrow status if possible
                try:
                    escrow_result = await db.execute(
                        select(Escrow).where(Escrow.id == payment.escrow_id)
                    )
                    escrow = escrow_result.scalar_one_or_none()
                    if escrow:
                        escrow.status = EscrowStatus.ACTIVE
                        db.add(escrow)
                        await db.commit()
                except Exception as e:
                    logger.warning(f"Could not update escrow: {e}")
    
    elif event_type == "charge.failed":
        payment_intent = event.get("data", {}).get("object", {})
        payment_id = payment_intent.get("metadata", {}).get("payment_id")
        
        if payment_id:
            result = await db.execute(
                select(PaymentTransaction).where(PaymentTransaction.id == UUID(payment_id))
            )
            payment = result.scalar_one_or_none()
            
            if payment:
                payment.status = PaymentStatus.FAILED.value
                db.add(payment)
                await db.commit()
                logger.warning(f"Stripe payment failed: {payment_id}")
    
    return {"status": "ok"}


@router.post("/paystack/webhook", status_code=status.HTTP_200_OK)
async def paystack_webhook(
    event: dict,
    db: AsyncSession = Depends(get_db)
):
    """Handle Paystack webhook callbacks"""
    
    if event.get("event") == "charge.success":
        data = event.get("data", {})
        payment_id = data.get("metadata", {}).get("payment_id")
        
        if payment_id:
            result = await db.execute(
                select(PaymentTransaction).where(PaymentTransaction.id == UUID(payment_id))
            )
            payment = result.scalar_one_or_none()
            
            if payment:
                payment.status = PaymentStatus.COMPLETED.value
                payment.reference_number = data.get("reference")
                payment.completed_at = datetime.utcnow()
                
                db.add(payment)
                await db.commit()
                
                logger.info(f"Paystack payment completed: {payment_id}")
                
                # Update escrow
                try:
                    escrow_result = await db.execute(
                        select(Escrow).where(Escrow.id == payment.escrow_id)
                    )
                    escrow = escrow_result.scalar_one_or_none()
                    if escrow:
                        escrow.status = EscrowStatus.ACTIVE
                        db.add(escrow)
                        await db.commit()
                except Exception as e:
                    logger.warning(f"Could not update escrow: {e}")
    
    return {"status": "ok"}


@router.get("/{payment_id}", status_code=status.HTTP_200_OK)
async def get_payment_status(
    payment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get payment status"""
    
    result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return {
        "payment_id": str(payment.id),
        "escrow_id": str(payment.escrow_id),
        "amount": str(payment.amount),
        "status": payment.status,
        "payment_method": payment.payment_method,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "completed_at": payment.completed_at.isoformat() if payment.completed_at else None
    }


@router.post("/{payment_id}/refund", status_code=status.HTTP_200_OK)
async def request_refund(
    payment_id: UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Request payment refund"""
    
    result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check if payment is completed
    if payment.status != PaymentStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed payments can be refunded"
        )
    
    # Mark for refund
    payment.status = PaymentStatus.REFUNDED.value
    
    db.add(payment)
    await db.commit()
    
    logger.info(f"Refund requested for payment: {payment_id}")
    
    return {
        "message": "Refund requested",
        "payment_id": str(payment_id),
        "status": PaymentStatus.REFUNDED.value
    }


@router.get("/escrow/{escrow_id}/payments", status_code=status.HTTP_200_OK)
async def get_escrow_payments(
    escrow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all payments for an escrow transaction"""
    
    # Verify escrow exists
    escrow_result = await db.execute(
        select(Escrow).where(Escrow.id == escrow_id)
    )
    escrow = escrow_result.scalar_one_or_none()
    
    if not escrow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow not found"
        )
    
    # Get payments
    payments_result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.escrow_id == escrow_id)
    )
    payments = payments_result.scalars().all()
    
    return {
        "escrow_id": str(escrow_id),
        "payment_count": len(payments),
        "payments": [
            {
                "payment_id": str(p.id),
                "amount": str(p.amount),
                "currency": p.currency,
                "status": p.status,
                "method": p.payment_method,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in payments
        ]
    }


@router.get("/monime/checkout/{payment_id}", status_code=status.HTTP_200_OK)
async def monime_checkout(
    payment_id: UUID,
    currency: str = "SLE",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create Monime checkout session and return redirect URL"""
    settings = get_settings()
    
    result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    
    escrow_result = await db.execute(select(Escrow).where(Escrow.id == payment.escrow_id))
    escrow = escrow_result.scalar_one_or_none()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow not found")
    
    if escrow.buyer_id != current_user.id and escrow.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this payment")
    
    payment.currency = currency
    payment.payment_method = PaymentMethod.MONIME.value
    db.add(payment)
    await db.flush()
    
    if not settings.MONIME_ACCESS_TOKEN or not settings.MONIME_API_URL:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Monime not configured")
    
    import httpx
    headers = {
        "Authorization": f"Bearer {settings.MONIME_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "amount": str(payment.amount),
        "currency": currency,
        "reference": str(payment.id),
        "metadata": {
            "escrow_id": str(payment.escrow_id),
            "buyer_id": str(escrow.buyer_id),
            "seller_id": str(escrow.seller_id),
        },
        "webhook_id": settings.MONIME_WEBHOOK_ID,
        "success_url": settings.MONIME_APP_URL or "http://localhost:3000/payments/success",
        "cancel_url": settings.MONIME_APP_URL or "http://localhost:3000/payments/cancel",
    }
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(f"{settings.MONIME_API_URL}/checkout/sessions", json=payload, headers=headers)
        if resp.status_code >= 200 and resp.status_code < 300:
            data = resp.json()
            redirect_url = data.get("checkout_url") or data.get("url") or ""
            payment.provider_reference = data.get("id") or data.get("session_id")
            db.add(payment)
            await db.commit()
            await db.refresh(payment)
            return {"payment_id": str(payment.id), "redirect_url": redirect_url, "provider_reference": payment.provider_reference}
        else:
            err = resp.text
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Monime error: {err}")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Monime request failed: {str(e)}")


@router.post("/monime/webhook", status_code=status.HTTP_200_OK)
async def monime_webhook(
    event: dict,
    db: AsyncSession = Depends(get_db)
):
    """Handle Monime webhook callbacks"""
    event_type = event.get("type") or event.get("event")
    data = event.get("data") or event
    reference = (data.get("reference") if isinstance(data, dict) else None) or event.get("reference")
    
    if not reference:
        return {"status": "ignored"}
    
    try:
        result = await db.execute(
            select(PaymentTransaction).where(PaymentTransaction.id == UUID(reference))
        )
        payment = result.scalar_one_or_none()
        if not payment:
            return {"status": "ignored"}
        
        if event_type in ("checkout.session.completed", "payment.success", "payment.completed"):
            payment.status = PaymentStatus.COMPLETED.value
            payment.completed_at = datetime.utcnow()
            db.add(payment)
            await db.flush()
            
            escrow_result = await db.execute(select(Escrow).where(Escrow.id == payment.escrow_id))
            escrow = escrow_result.scalar_one_or_none()
            if escrow:
                escrow.status = EscrowStatus.ACTIVE
                db.add(escrow)
            
            await db.commit()
            return {"status": "ok"}
        
        if event_type in ("payment.failed", "checkout.session.expired"):
            payment.status = PaymentStatus.FAILED.value
            db.add(payment)
            await db.commit()
            return {"status": "ok"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Monime webhook error: {e}")
        return {"status": "error"}
