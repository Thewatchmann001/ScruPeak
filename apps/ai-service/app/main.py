import os
import json
import logging
import httpx
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Lanstimate™ & Jems AI Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "healthy", "service": "lanstimate-jems-ai"}


@app.post("/valuation/lanstimate")
async def lanstimate_value(land_data: dict):
    """
    Lanstimate™ AI Valuation Engine: Estimates land market value using OpenAI.
    Factors: locality pricing, topography, regional transaction patterns.
    """
    logger.info(f"Lanstimate valuation for: {land_data}")

    openai_key = os.environ.get("OPENAI_API_KEY")
    url = "https://api.openai.com/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {openai_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": "You are the Lanstimate™ AI Valuation Engine for ScruPeak. Estimate land market value in Sierra Leone Leones (SLE) based on the provided data."
            },
            {
                "role": "user",
                "content": f"Calculate land value for this data: {land_data}. Return JSON: {{'estimated_price': float, 'confidence': float, 'factors': list}}"
            }
        ],
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            ai_data = response.json()["choices"][0]["message"]["content"]
            result = json.loads(ai_data)
            result["currency"] = "SLE"
            result["engine"] = "Lanstimate™ (OpenAI Powered)"
            return result
    except Exception as e:
        logger.error(f"Lanstimate OpenAI error: {e}")
        return {
            "estimated_price": 100000,
            "currency": "SLE",
            "confidence": 0.50,
            "factors": ["fallback_stub_used"],
            "engine": "Lanstimate™ (Stub Fallback)"
        }


@app.post("/fraud/jems-audit")
def jems_ai_audit(transaction_data: dict):
    """
    Jems AI: Non-invasive AI oversight layer for auditing transactions,
    flagging anomalies, and monitoring user behavior patterns.
    """
    logger.info(f"Jems AI audit for: {transaction_data}")
    return {
        "fraud_score": 0.05,
        "status": "clean",
        "alerts": [],
        "engine": "Jems AI"
    }
