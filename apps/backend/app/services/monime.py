from typing import Any, Dict, Optional, List
from uuid import UUID
import httpx
import logging
from datetime import datetime
from pydantic import BaseModel
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MonimeError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Any] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


class LineItem(BaseModel):
    type: str = "custom"
    name: str
    price: Dict[str, Any]  # { currency: 'SLE'|'USD', value: int (minor units) }
    quantity: int
    description: Optional[str] = None
    reference: Optional[str] = None


class MonimeClient:
    def __init__(self, access_token: Optional[str] = None, space_id: Optional[str] = None):
        self.base_url = settings.MONIME_API_URL.rstrip("/")
        self.access_token = access_token or settings.MONIME_ACCESS_TOKEN
        self.space_id = space_id or settings.MONIME_SPACE_ID
        if not self.access_token or not self.space_id:
            raise MonimeError("Monime access token and space id are required")
        self._client = httpx.AsyncClient(timeout=20)

    def _headers(self, idempotency_key: Optional[str] = None) -> Dict[str, str]:
        hdrs = {
            "Authorization": f"Bearer {self.access_token}",
            "Monime-Space-Id": self.space_id,
            "Content-Type": "application/json",
        }
        if idempotency_key:
            hdrs["Idempotency-Key"] = idempotency_key
        return hdrs

    async def create_financial_account(self, currency: str, name: str, metadata: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/financial-accounts"
        payload = {"currency": currency, "name": name, "metadata": metadata or {}}
        res = await self._client.post(url, headers=self._headers(), json=payload)
        if res.status_code >= 400:
            raise MonimeError(f"Failed to create financial account: {res.text}", res.status_code)
        return res.json().get("result", {})

    async def create_checkout_session(
        self,
        name: str,
        order_id: str,
        line_items: List[LineItem],
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict[str, str]] = None,
        callback_state: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/checkout-sessions"
        payload = {
            "name": name,
            "successUrl": success_url,
            "cancelUrl": cancel_url,
            "lineItems": [li.model_dump() for li in line_items],
            "metadata": metadata or {},
            "callbackState": callback_state,
        }
        res = await self._client.post(url, headers=self._headers(idempotency_key), json=payload)
        if res.status_code >= 400:
            raise MonimeError(f"Checkout session error: {await res.text() if hasattr(res,'text') else res.content}", res.status_code)
        return res.json().get("result", {})

    async def get_checkout_session(self, session_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/checkout-sessions/{session_id}"
        res = await self._client.get(url, headers=self._headers())
        if res.status_code >= 400:
            raise MonimeError(f"Get checkout session failed: {res.text}", res.status_code)
        return res.json().get("result", {})

    async def create_internal_transfer(self, from_account_id: str, to_account_id: str, amount_minor: int, currency: str, description: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/internal-transfers"
        payload = {
            "fromAccountId": from_account_id,
            "toAccountId": to_account_id,
            "amount": {"currency": currency, "value": amount_minor},
            "description": description,
        }
        res = await self._client.post(url, headers=self._headers(), json=payload)
        if res.status_code >= 400:
            raise MonimeError(f"Internal transfer failed: {res.text}", res.status_code)
        return res.json().get("result", {})

    async def payout(self, source_account_id: str, destination: Dict[str, Any], amount_minor: int, currency: str, description: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/payouts"
        payload = {
            "sourceAccountId": source_account_id,
            "destination": destination,
            "amount": {"currency": currency, "value": amount_minor},
            "description": description,
        }
        res = await self._client.post(url, headers=self._headers(), json=payload)
        if res.status_code >= 400:
            raise MonimeError(f"Payout failed: {res.text}", res.status_code)
        return res.json().get("result", {})

    async def generate_receipt(self, transaction_id: str) -> Dict[str, Any]:
        # Fallback: Use transaction endpoint; if a dedicated receipts API exists, replace accordingly
        url = f"{self.base_url}/financial-transactions/{transaction_id}"
        res = await self._client.get(url, headers=self._headers())
        if res.status_code >= 400:
            raise MonimeError(f"Receipt generation failed: {res.text}", res.status_code)
        tx = res.json().get("result", {})
        return {
            "receipt_id": tx.get("id"),
            "amount": tx.get("amount"),
            "status": tx.get("status"),
            "created_at": tx.get("createdAt"),
            "parties": {
                "source_account": tx.get("sourceAccountId"),
                "destination_account": tx.get("destinationAccountId"),
            },
        }

