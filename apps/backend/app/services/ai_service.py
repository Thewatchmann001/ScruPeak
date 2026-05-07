import httpx
import logging
import os
from typing import Dict, Any

logger = logging.getLogger(__name__)

AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8001")

class AIService:
    @staticmethod
    async def audit_chat(message: str, sender_id: str) -> Dict[str, Any]:
        """Call Jems AI for chat auditing"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{AI_SERVICE_URL}/fraud/jems-audit",
                    json={
                        "message": message,
                        "sender_id": sender_id,
                        "type": "chat"
                    },
                    timeout=5.0
                )
                if response.status_code == 200:
                    res = response.json()
                    return {
                        "fraud_alert": res.get("status") in ["suspicious", "high_risk"],
                        "fraud_reason": ", ".join(res.get("alerts", [])) if res.get("alerts") else res.get("reasoning")
                    }
        except Exception as e:
            logger.error(f"Jems AI audit failed: {e}")
        
        # Fallback logic if AI service is down
        return {
            "fraud_alert": "http" in message,
            "fraud_reason": "Suspicious link detected (Fallback)" if "http" in message else None
        }

    @staticmethod
    async def estimate_value(land_data: Dict[str, Any]) -> Dict[str, Any]:
        """Call Lanstimate for land valuation"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{AI_SERVICE_URL}/valuation/lanstimate",
                    json=land_data,
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Lanstimate failed: {e}")
            
        return {"estimated_price": 0, "confidence": 0}
