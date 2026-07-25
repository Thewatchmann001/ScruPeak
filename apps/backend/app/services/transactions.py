import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.core.database import get_async_session
from app.core.config import get_settings
from app.services.monime import MonimeClient, LineItem, MonimeError
from app.services.tax_service import TaxService
from app.services.payout_service import PayoutService
from app.services.blockchain import BlockchainService
from app.services.pdf_signer import PdfSignerService
from app.services.email import send_email_async, send_transaction_status_email
from app.models.transaction_models import User, Land, Escrow, EscrowStatus, PaymentTransaction, PaymentStatus, PaymentType, LandStatus, TaxAssessment
from app.models.taxation import TaxStatus # Assuming this is defined in app/models/taxation.py

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()

class InitiatePurchaseRequest(BaseModel):
    land_id: UUID
    buyer_id: UUID

class FinalizeTransferRequest(BaseModel):
    escrow_id: UUID
    # In a real system, this would include proof of OARG/Ministry approval,
    # or be triggered by an internal system after approvals are recorded.
    # For MVP, we'll assume approvals are handled internally.

@router.post("/initiate-purchase", response_model=Dict[str, Any], status_code=202)
async def initiate_purchase(
    request_data: InitiatePurchaseRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Initiates a land purchase: creates an escrow, assesses stamp duty,
    and generates a Monime checkout session for the buyer.
    """
    land_id = request_data.land_id
    buyer_id = request_data.buyer_id

    # 1. Fetch Land and Users
    land_result = await db.execute(select(Land).where(Land.id == land_id))
    land = land_result.scalars().first()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    if land.status != LandStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Land is not available for purchase. Current status: {land.status}")

    buyer_result = await db.execute(select(User).where(User.id == buyer_id))
    buyer = buyer_result.scalars().first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    seller_result = await db.execute(select(User).where(User.id == land.owner_id))
    seller = seller_result.scalars().first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    # 2. Assess Stamp Duty
    stamp_duty_amount = await TaxService.calculate_stamp_duty(land.price)
    total_amount = land.price + stamp_duty_amount

    # 3. Create Escrow Record (Pending)
    escrow = Escrow(
        land_id=land.id,
        buyer_id=buyer.id,
        seller_id=seller.id,
        amount=total_amount,
        status=EscrowStatus.PENDING.value,
    )
    db.add(escrow)
    await db.flush() # Flush to get escrow.id for tax assessment

    # 4. Record Tax Assessment
    tax_assessment = await TaxService.assess_transfer_tax(db, land.id, land.price, buyer.id)
    escrow.tax_assessment_id = tax_assessment.id
    await db.commit()
    await db.refresh(escrow)
    await db.refresh(tax_assessment)

    # 5. Create Monime Checkout Session
    try:
        monime_client = MonimeClient()
        line_items = [
            LineItem(name=f"Land Purchase: {land.location}", price={"currency": "SLE", "value": int(land.price * 100)}, quantity=1),
            LineItem(name="Stamp Duty", price={"currency": "SLE", "value": int(stamp_duty_amount * 100)}, quantity=1),
        ]
        checkout_session = await monime_client.create_checkout_session(
            name=f"ScruPeak Land Purchase: {land.location}",
            order_id=str(escrow.id),
            line_items=line_items,
            success_url=f"{settings.FRONTEND_URL}/payment-success?escrow_id={escrow.id}",
            cancel_url=f"{settings.FRONTEND_URL}/payment-cancel?escrow_id={escrow.id}",
            metadata={"escrow_id": str(escrow.id), "land_id": str(land.id), "buyer_id": str(buyer.id)},
            callback_state=str(escrow.id), # Use escrow ID as callback state
            idempotency_key=f"checkout-{escrow.id}"
        )
        escrow.monime_checkout_id = checkout_session.get("id")
        # Monime might return an account ID for the checkout session, store it if available
        escrow.monime_account_id = checkout_session.get("financialAccountId")
        await db.commit()
        await db.refresh(escrow)

        # Update land status to pending sale
        land.status = LandStatus.PENDING_SALE.value
        await db.commit()

        # Notify parties about the purchase initiation
        background_tasks.add_task(
            send_transaction_status_email,
            [seller.email],
            f"ScruPeak: Purchase Request for {land.location}",
            f"Hello, a buyer has initiated a purchase for your property at {land.location} for SLE {land.price}. We will notify you once the funds are secured in escrow."
        )
        background_tasks.add_task(
            send_transaction_status_email,
            [buyer.email],
            f"ScruPeak: Purchase Initiated - {land.location}",
            f"Hello, you have started the purchase process for property at {land.location}. Please complete the payment of SLE {total_amount} via the provided link to secure the transaction."
        )

        return {
            "message": "Purchase initiated, redirecting to payment.",
            "checkout_url": checkout_session.get("checkoutUrl"),
            "escrow_id": escrow.id,
            "monime_checkout_id": escrow.monime_checkout_id
        }
    except MonimeError as e:
        logger.error(f"Monime checkout session creation failed for escrow {escrow.id}: {e}")
        escrow.status = EscrowStatus.FAILED.value
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Payment service error: {e.message}")
    except Exception as e:
        logger.error(f"Unexpected error during purchase initiation for escrow {escrow.id}: {e}")
        escrow.status = EscrowStatus.FAILED.value
        await db.commit()
        raise HTTPException(status_code=500, detail="An unexpected error occurred during purchase initiation.")

@router.post("/monime-webhook", status_code=200)
async def monime_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Webhook endpoint to receive payment notifications from Monime.
    Processes payment status and updates escrow.
    """
    payload = await request.json()
    signature = request.headers.get("X-Monime-Signature")
    
    # 1. Security: Verify Webhook Source
    monime_client = MonimeClient()
    if not await monime_client.verify_webhook_signature(await request.body(), signature):
        logger.warning("Invalid Monime webhook signature detected.")
        raise HTTPException(status_code=401, detail="Invalid signature")

    logger.info(f"Received Monime webhook: {payload}")

    event_type = payload.get("type")
    data = payload.get("data", {})
    checkout_session_id = data.get("id")
    order_id = data.get("orderId") # This should be our escrow_id
    monime_transaction_id = data.get("transactionId")
    status = data.get("status")
    amount_minor = data.get("totalAmount", {}).get("value")
    currency = data.get("totalAmount", {}).get("currency")

    if not order_id:
        logger.warning("Monime webhook received without orderId (escrow_id). Ignoring.")
        return {"message": "Ignored: No orderId"}

    escrow_id = UUID(order_id)
    escrow_result = await db.execute(select(Escrow).where(Escrow.id == escrow_id))
    escrow = escrow_result.scalars().first()

    if not escrow:
        logger.error(f"Monime webhook: Escrow {escrow_id} not found.")
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    # 2. Idempotency: Check if already processed
    existing_tx = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.monime_transaction_id == monime_transaction_id)
    )
    if existing_tx.scalars().first():
        logger.info(f"Monime transaction {monime_transaction_id} already processed. Skipping.")
        return {"message": "Already processed"}

    payment_transaction = PaymentTransaction(
        escrow_id=escrow.id,
        monime_transaction_id=monime_transaction_id,
        amount=Decimal(str(amount_minor)) / 100 if amount_minor else Decimal("0"),
        currency=currency or "SLE",
        status=PaymentStatus.PENDING.value, # Will update below
        payment_type=PaymentType.CHECKOUT.value,
        description=f"Monime checkout session {checkout_session_id} event: {event_type}"
    )

    if event_type == "checkout_session.completed" and status == "completed":
        escrow.status = EscrowStatus.FUNDED.value
        payment_transaction.status = PaymentStatus.SUCCESS.value
        logger.info(f"Escrow {escrow.id} funded successfully via Monime.")

        # Mark associated tax assessment as paid
        if escrow.tax_assessment_id:
            tax_assessment_result = await db.execute(select(TaxAssessment).where(TaxAssessment.id == escrow.tax_assessment_id))
            tax_assessment = tax_assessment_result.scalars().first()
            if tax_assessment:
                tax_assessment.status = TaxStatus.PAID.value
                logger.info(f"Tax assessment {tax_assessment.id} marked as PAID.")

        # Update land status to pending approvals
        land_result = await db.execute(select(Land).where(Land.id == escrow.land_id))
        land = land_result.scalars().first()
        if land:
            land.status = LandStatus.PENDING_APPROVALS.value

        # Notify parties that escrow is funded
        buyer_res = await db.execute(select(User).where(User.id == escrow.buyer_id))
        buyer = buyer_res.scalars().first()
        seller_res = await db.execute(select(User).where(User.id == escrow.seller_id))
        seller = seller_res.scalars().first()

        if buyer and seller:
            background_tasks.add_task(
                send_transaction_status_email,
                [buyer.email, seller.email],
                "ScruPeak: Payment Secured in Escrow",
                f"The payment for the property at {land.location if land else 'the requested location'} has been successfully received and is now held in escrow. We are proceeding with final verification and title transfer."
            )

        # TODO: Trigger compliance workflows (e.g., Document Verification, AML for buyer/seller)
        # background_tasks.add_task(AutomatedComplianceOrchestrator.start_workflow, ...)

    elif event_type == "checkout_session.failed" or status == "failed":
        escrow.status = EscrowStatus.FAILED.value
        payment_transaction.status = PaymentStatus.FAILED.value
        logger.warning(f"Escrow {escrow.id} payment failed via Monime.")
    else:
        logger.info(f"Monime webhook event {event_type} with status {status} for escrow {escrow.id} received. No action taken.")
        return {"message": "Webhook received, no relevant action taken."}

    db.add(payment_transaction)
    await db.commit()
    await db.refresh(escrow)

    return {"message": "Webhook processed successfully."}

@router.post("/finalize-transfer", response_model=Dict[str, Any])
async def finalize_transfer(
    request_data: FinalizeTransferRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Finalizes a land transfer after all conditions are met (payment, taxes, approvals).
    This endpoint would typically be called by an authorized internal system or admin.
    """
    escrow_id = request_data.escrow_id

    escrow_result = await db.execute(select(Escrow).where(Escrow.id == escrow_id))
    escrow = escrow_result.scalars().first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    land_result = await db.execute(select(Land).where(Land.id == escrow.land_id))
    land = land_result.scalars().first()
    if not land:
        raise HTTPException(status_code=404, detail="Associated land not found")

    buyer_result = await db.execute(select(User).where(User.id == escrow.buyer_id))
    buyer = buyer_result.scalars().first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    seller_result = await db.execute(select(User).where(User.id == escrow.seller_id))
    seller = seller_result.scalars().first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    # 1. Verify all conditions for transfer (Zero-Trust)
    if escrow.status != EscrowStatus.FUNDED:
        raise HTTPException(status_code=400, detail=f"Escrow not funded. Current status: {escrow.status}")

    is_tax_compliant = await TaxService.check_tax_compliance(db, land.id)
    if not is_tax_compliant:
        raise HTTPException(status_code=400, detail="Land has outstanding taxes. Cannot transfer.")

    # Simulate OARG and Ministry approvals (these would be set by admin actions)
    if not land.is_oarg_approved or not land.is_ministry_approved:
        raise HTTPException(status_code=400, detail="OARG or Ministry approval pending for land transfer.")

    # 2. Digital Signing of Deed of Conveyance (Simulated)
    # In a real scenario, the actual PDF document would be generated/fetched here.
    # For MVP, we'll use dummy bytes.
    dummy_pdf_bytes = b"This is a dummy PDF content for the Deed of Conveyance."
    signatures = [
        {"page_number": 1, "x": 100, "y": 700, "text": "Buyer Signature", "signer_name": buyer.email, "signed_at": datetime.now(timezone.utc)},
        {"page_number": 1, "x": 100, "y": 600, "text": "Seller Signature", "signer_name": seller.email, "signed_at": datetime.now(timezone.utc)},
        # Add OARG/Ministry signatures here if they are part of the digital signing process
    ]
    signed_pdf_bytes, document_hash = PdfSignerService.sign_document(
        dummy_pdf_bytes,
        signatures,
        request_id=escrow.id,
        certificate_number=f"SCRUPEAK-{escrow.id}"
    )
    logger.info(f"Deed of Conveyance digitally signed. Document hash: {document_hash}")

    # 3. Blockchain Notarization
    try:
        blockchain_tx_hash = await BlockchainService.send_transaction(document_hash)
        escrow.blockchain_tx_hash = blockchain_tx_hash
        logger.info(f"Document hash notarized on blockchain. Transaction: {blockchain_tx_hash}")
    except Exception as e:
        logger.error(f"Blockchain notarization failed for escrow {escrow.id}: {e}")
        raise HTTPException(status_code=500, detail="Blockchain notarization failed.")

    # 4. Payout to Seller
    try:
        # Ensure the Monime account ID for the escrow is set (from checkout session or created separately)
        if not escrow.monime_account_id:
            raise HTTPException(status_code=500, detail="Monime escrow account ID not found for payout.")

        payout_results = await PayoutService.process_escrow_payout(
            db, escrow, seller, escrow.monime_account_id
        )
        if payout_results.get("status") != "completed":
            raise HTTPException(status_code=500, detail=f"Seller payout failed: {payout_results.get('error', 'Unknown error')}")
        logger.info(f"Seller payout completed for escrow {escrow.id}.")
    except Exception as e:
        logger.error(f"Seller payout failed for escrow {escrow.id}: {e}")
        raise HTTPException(status_code=500, detail="Seller payout failed.")

    # 5. Update Land Ownership and Escrow Status
    land.owner_id = buyer.id
    land.status = LandStatus.SOLD.value
    escrow.status = EscrowStatus.COMPLETED.value
    await db.commit()

    # Construct the download link for the digital title
    pdf_download_url = f"{settings.FRONTEND_URL}/api/v1/documents/download/{escrow.id}"

    # Notify parties about transaction completion
    background_tasks.add_task(
        send_transaction_status_email,
        [seller.email],
        f"ScruPeak: Transaction Successfully Completed - {land.location}",
        f"The sale of your property at {land.location} is complete. SLE {escrow.seller_payout_amount} has been released to your account.",
        pdf_url=pdf_download_url,
        tx_hash=blockchain_tx_hash
    )
    background_tasks.add_task(
        send_transaction_status_email,
        [buyer.email],
        f"ScruPeak: Land Transfer Complete - {land.location}",
        f"Congratulations! The property at {land.location} is now officially yours. Your digital title has been notarized and recorded on the blockchain for permanent verification.",
        pdf_url=pdf_download_url,
        tx_hash=blockchain_tx_hash
    )

    return {
        "message": "Land transfer finalized successfully.",
        "escrow_id": escrow.id,
        "new_owner_id": buyer.id,
        "blockchain_tx_hash": blockchain_tx_hash,
        "document_hash": document_hash
    }

@router.post("/admin/approve-land/{land_id}", response_model=Dict[str, Any])
async def admin_approve_land(
    land_id: UUID,
    approval_type: str, # "oarg" or "ministry"
    db: AsyncSession = Depends(get_async_session)
):
    """
    Admin endpoint to simulate OARG or Ministry approval for a land.
    """
    land_result = await db.execute(select(Land).where(Land.id == land_id))
    land = land_result.scalars().first()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")

    if approval_type.lower() == "oarg":
        land.is_oarg_approved = True
        message = "OARG approval granted."
    elif approval_type.lower() == "ministry":
        land.is_ministry_approved = True
        message = "Ministry approval granted."
    else:
        raise HTTPException(status_code=400, detail="Invalid approval type. Must be 'oarg' or 'ministry'.")

    await db.commit()
    await db.refresh(land)

    return {
        "message": message,
        "land_id": land.id,
        "is_oarg_approved": land.is_oarg_approved,
        "is_ministry_approved": land.is_ministry_approved
    }