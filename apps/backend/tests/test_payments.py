"""
Payment processing endpoint tests
Tests Stripe/Paystack integration and payment verification
"""
import pytest
from uuid import uuid4
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models import User, Escrow, PaymentTransaction
from tests.conftest import get_test_db, create_test_user, create_test_escrow


@pytest.mark.asyncio
class TestPaymentInitiation:
    """Test payment initiation endpoints"""
    
    async def test_initiate_stripe_payment(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str,
        test_db: AsyncSession
    ):
        """Test initiating a Stripe payment"""
        
        # Create escrow first
        escrow_id = uuid4()
        escrow = Escrow(
            id=escrow_id,
            buyer_id=test_user.id,
            seller_id=uuid4(),
            amount=Decimal("50000.00"),
            status="pending"
        )
        test_db.add(escrow)
        await test_db.commit()
        
        # Initiate payment
        response = await async_client.post(
            "/api/v1/payments/initiate",
            json={
                "escrow_id": str(escrow_id),
                "amount": "50000.00",
                "payment_method": "stripe"
            },
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "pending"
        assert data["payment_method"] == "stripe"
        assert "payment_id" in data
        assert "payment_url" in data
    
    async def test_initiate_paystack_payment(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str,
        test_db: AsyncSession
    ):
        """Test initiating a Paystack payment"""
        
        # Create escrow
        escrow_id = uuid4()
        escrow = Escrow(
            id=escrow_id,
            buyer_id=test_user.id,
            seller_id=uuid4(),
            amount=Decimal("50000.00"),
            status="pending"
        )
        test_db.add(escrow)
        await test_db.commit()
        
        # Initiate payment
        response = await async_client.post(
            "/api/v1/payments/initiate",
            json={
                "escrow_id": str(escrow_id),
                "amount": "50000.00",
                "payment_method": "paystack"
            },
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["payment_method"] == "paystack"
    
    async def test_initiate_payment_invalid_amount(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str,
        test_db: AsyncSession
    ):
        """Test payment initiation with mismatched amount"""
        
        escrow_id = uuid4()
        escrow = Escrow(
            id=escrow_id,
            buyer_id=test_user.id,
            seller_id=uuid4(),
            amount=Decimal("50000.00"),
            status="pending"
        )
        test_db.add(escrow)
        await test_db.commit()
        
        # Try to initiate with wrong amount
        response = await async_client.post(
            "/api/v1/payments/initiate",
            json={
                "escrow_id": str(escrow_id),
                "amount": "40000.00",  # Wrong amount
                "payment_method": "stripe"
            },
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 400
        assert "Amount must equal" in response.json()["detail"]
    
    async def test_initiate_payment_nonexistent_escrow(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str
    ):
        """Test payment initiation for nonexistent escrow"""
        
        response = await async_client.post(
            "/api/v1/payments/initiate",
            json={
                "escrow_id": str(uuid4()),
                "amount": "50000.00",
                "payment_method": "stripe"
            },
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


@pytest.mark.asyncio
class TestPaymentWebhooks:
    """Test payment webhook handlers"""
    
    async def test_stripe_webhook_success(
        self,
        async_client: AsyncClient,
        test_db: AsyncSession
    ):
        """Test Stripe webhook for successful payment"""
        
        # Create payment in database
        payment_id = uuid4()
        escrow_id = uuid4()
        payment = PaymentTransaction(
            id=payment_id,
            escrow_id=escrow_id,
            amount=Decimal("50000.00"),
            payment_method="stripe",
            status="pending"
        )
        test_db.add(payment)
        await test_db.commit()
        
        # Send webhook
        response = await async_client.post(
            "/api/v1/payments/stripe/webhook",
            json={
                "type": "charge.succeeded",
                "data": {
                    "object": {
                        "id": "ch_test123",
                        "metadata": {
                            "payment_id": str(payment_id)
                        }
                    }
                }
            }
        )
        
        assert response.status_code == 200
        
        # Verify payment status updated
        await test_db.refresh(payment)
        assert payment.status == "completed"
    
    async def test_stripe_webhook_failure(
        self,
        async_client: AsyncClient,
        test_db: AsyncSession
    ):
        """Test Stripe webhook for failed payment"""
        
        payment_id = uuid4()
        payment = PaymentTransaction(
            id=payment_id,
            escrow_id=uuid4(),
            amount=Decimal("50000.00"),
            payment_method="stripe",
            status="pending"
        )
        test_db.add(payment)
        await test_db.commit()
        
        # Send failure webhook
        response = await async_client.post(
            "/api/v1/payments/stripe/webhook",
            json={
                "type": "charge.failed",
                "data": {
                    "object": {
                        "metadata": {
                            "payment_id": str(payment_id)
                        }
                    }
                }
            }
        )
        
        assert response.status_code == 200
        
        # Verify payment marked as failed
        await test_db.refresh(payment)
        assert payment.status == "failed"
    
    async def test_paystack_webhook_success(
        self,
        async_client: AsyncClient,
        test_db: AsyncSession
    ):
        """Test Paystack webhook for successful payment"""
        
        payment_id = uuid4()
        payment = PaymentTransaction(
            id=payment_id,
            escrow_id=uuid4(),
            amount=Decimal("50000.00"),
            payment_method="paystack",
            status="pending"
        )
        test_db.add(payment)
        await test_db.commit()
        
        # Send webhook
        response = await async_client.post(
            "/api/v1/payments/paystack/webhook",
            json={
                "event": "charge.success",
                "data": {
                    "reference": "ref_12345",
                    "metadata": {
                        "payment_id": str(payment_id)
                    }
                }
            }
        )
        
        assert response.status_code == 200
        
        # Verify payment status
        await test_db.refresh(payment)
        assert payment.status == "completed"
        assert payment.reference_number == "ref_12345"


@pytest.mark.asyncio
class TestPaymentStatus:
    """Test payment status endpoints"""
    
    async def test_get_payment_status(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str,
        test_db: AsyncSession
    ):
        """Test retrieving payment status"""
        
        # Create payment
        payment_id = uuid4()
        escrow_id = uuid4()
        payment = PaymentTransaction(
            id=payment_id,
            escrow_id=escrow_id,
            amount=Decimal("50000.00"),
            payment_method="stripe",
            status="pending"
        )
        test_db.add(payment)
        await test_db.commit()
        
        # Get status
        response = await async_client.get(
            f"/api/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert data["payment_method"] == "stripe"
        assert data["amount"] == "50000.00"
    
    async def test_get_nonexistent_payment(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str
    ):
        """Test getting status of nonexistent payment"""
        
        response = await async_client.get(
            f"/api/v1/payments/{uuid4()}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 404


@pytest.mark.asyncio
class TestPaymentRefunds:
    """Test payment refund functionality"""
    
    async def test_request_refund(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str,
        test_db: AsyncSession
    ):
        """Test requesting a payment refund"""
        
        # Create completed payment
        payment_id = uuid4()
        payment = PaymentTransaction(
            id=payment_id,
            escrow_id=uuid4(),
            amount=Decimal("50000.00"),
            payment_method="stripe",
            status="completed"
        )
        test_db.add(payment)
        await test_db.commit()
        
        # Request refund
        response = await async_client.post(
            f"/api/v1/payments/{payment_id}/refund",
            json={"reason": "Customer request"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "refunded"
    
    async def test_refund_pending_payment_fails(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str,
        test_db: AsyncSession
    ):
        """Test that refunding pending payment fails"""
        
        payment_id = uuid4()
        payment = PaymentTransaction(
            id=payment_id,
            escrow_id=uuid4(),
            amount=Decimal("50000.00"),
            payment_method="stripe",
            status="pending"
        )
        test_db.add(payment)
        await test_db.commit()
        
        # Try to refund
        response = await async_client.post(
            f"/api/v1/payments/{payment_id}/refund",
            json={"reason": "Test"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 400
        assert "Only completed payments" in response.json()["detail"]


@pytest.mark.asyncio
class TestEscrowPayments:
    """Test payments associated with escrow"""
    
    async def test_get_escrow_payments(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_token: str,
        test_db: AsyncSession
    ):
        """Test retrieving all payments for an escrow"""
        
        escrow_id = uuid4()
        
        # Create escrow
        escrow = Escrow(
            id=escrow_id,
            buyer_id=test_user.id,
            seller_id=uuid4(),
            amount=Decimal("50000.00"),
            status="pending"
        )
        test_db.add(escrow)
        
        # Create multiple payments for this escrow
        for i in range(3):
            payment = PaymentTransaction(
                id=uuid4(),
                escrow_id=escrow_id,
                amount=Decimal("50000.00"),
                payment_method="stripe",
                status="completed" if i == 0 else "pending"
            )
            test_db.add(payment)
        
        await test_db.commit()
        
        # Get payments
        response = await async_client.get(
            f"/api/v1/payments/escrow/{escrow_id}/payments",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["payment_count"] == 3
        assert len(data["payments"]) == 3


@pytest.mark.asyncio
class TestPaymentSecurity:
    """Test payment security features"""
    
    async def test_payment_unauthorized_access(
        self,
        async_client: AsyncClient,
        test_db: AsyncSession
    ):
        """Test that unauthorized users cannot access payments"""
        
        payment_id = uuid4()
        
        # Try without token
        response = await async_client.get(
            f"/api/v1/payments/{payment_id}"
        )
        
        assert response.status_code == 403
    
    async def test_payment_invalid_token(
        self,
        async_client: AsyncClient
    ):
        """Test payment access with invalid token"""
        
        response = await async_client.get(
            f"/api/v1/payments/{uuid4()}",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
