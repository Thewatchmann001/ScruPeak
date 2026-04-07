"""
Payout Service - handles split payments and platform fees
Calculates 7% platform fee and 93% seller payout
"""
import logging
from decimal import Decimal
from typing import Tuple, Dict, Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.models import Escrow, User
from app.services.monime import MonimeClient

logger = logging.getLogger(__name__)
settings = get_settings()

class PayoutService:
    @staticmethod
    def calculate_split(amount: Decimal) -> Tuple[Decimal, Decimal]:
        """
        Calculate the 7% platform fee and 93% seller payout.
        Returns (platform_fee, seller_payout)
        """
        fee_rate = Decimal(str(settings.PLATFORM_FEE_RATE))
        platform_fee = (amount * fee_rate).quantize(Decimal("0.01"))
        seller_payout = amount - platform_fee
        return platform_fee, seller_payout

    @staticmethod
    async def process_escrow_payout(
        db: AsyncSession,
        escrow: Escrow,
        seller: User,
        monime_source_account: str
    ) -> Dict[str, Any]:
        """
        Execute the split payout via Monime.
        1. Calculate split (7% / 93%)
        2. 7% stays in the source escrow account (Revenue)
        3. Payout 93% to seller
        """
        platform_fee, seller_payout = PayoutService.calculate_split(escrow.amount)

        # Update escrow record with calculated amounts
        escrow.platform_fee_amount = platform_fee
        escrow.seller_payout_amount = seller_payout

        results = {
            "platform_fee": str(platform_fee),
            "seller_payout": str(seller_payout),
            "status": "initiated",
            "revenue_retained_in_account": monime_source_account
        }

        try:
            client = MonimeClient()

            # Note: 7% platform fee is NOT transferred out.
            # It remains in the source account as revenue.

            # Payout 93% to seller
            payout_minor = int(seller_payout * 100)

            destination = None
            if seller.agent_profile:
                if seller.agent_profile.wallet_address:
                    destination = {"type": "wallet", "address": seller.agent_profile.wallet_address}

            if not destination:
                # Fallback to a mock for now, but in production we'd require a configured destination
                destination = {"type": "account", "accountId": "SELLER_ACCOUNT_ID_MOCK"}

            payout_res = await client.payout(
                source_account_id=monime_source_account,
                destination=destination,
                amount_minor=payout_minor,
                currency="SLE",
                description=f"Seller Payout (93%) - Escrow {escrow.id}. Platform Fee (7%) retained."
            )
            results["seller_payout_res"] = payout_res
            results["status"] = "completed"

        except Exception as e:
            logger.error(f"Payout failed for escrow {escrow.id}: {str(e)}")
            results["status"] = "failed"
            results["error"] = str(e)

        return results
