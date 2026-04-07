
import pytest
from decimal import Decimal
from app.services.payout_service import PayoutService
from app.core.config import get_settings

def test_calculate_split_7_percent():
    """Test that the payout split correctly calculates 7% and 93%"""
    settings = get_settings()
    # Ensure settings is 0.07 for the test
    original_rate = settings.PLATFORM_FEE_RATE
    settings.PLATFORM_FEE_RATE = 0.07

    try:
        # Case 1: 100 units
        amount = Decimal("100.00")
        fee, payout = PayoutService.calculate_split(amount)
        assert fee == Decimal("7.00")
        assert payout == Decimal("93.00")
        assert fee + payout == amount

        # Case 2: 1,000,000 units
        amount = Decimal("1000000.00")
        fee, payout = PayoutService.calculate_split(amount)
        assert fee == Decimal("70000.00")
        assert payout == Decimal("930000.00")
        assert fee + payout == amount

        # Case 3: Small amount with rounding
        amount = Decimal("10.55")
        # 10.55 * 0.07 = 0.7385 -> rounds to 0.74
        # 10.55 - 0.74 = 9.81
        fee, payout = PayoutService.calculate_split(amount)
        assert fee == Decimal("0.74")
        assert payout == Decimal("9.81")
        assert fee + payout == amount

    finally:
        settings.PLATFORM_FEE_RATE = original_rate

@pytest.mark.asyncio
async def test_calculate_split_integration_logic():
    """Verify the logic used in process_escrow_payout (split calculation part)"""
    amount = Decimal("500.00")
    fee, payout = PayoutService.calculate_split(amount)

    assert fee == Decimal("35.00")
    assert payout == Decimal("465.00")
    assert fee + payout == amount
