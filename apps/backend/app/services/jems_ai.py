"""
Jems AI Service
Non-invasive intelligence layer for advisory guidance and fraud detection.
Fuses multiple data streams to monitor ScruPeak transactions.
"""

import httpx
import logging
import json
from typing import Dict, Optional, Any, List
from datetime import datetime
from enum import Enum

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class JemsAIModel(str, Enum):
    """Available models for Jems AI"""
    JEMS_CORE = "deepseek-chat"  # Fused with DeepSeek backend
    JEMS_AUDITOR = "deepseek-coder"


class JemsAIService:
    """
    Jems AI Service
    Provides advisory AI assistance and non-invasive fraud oversight.
    Uses OpenAI as primary and DeepSeek as fallback.
    """
    
    OPENAI_URL = "https://api.openai.com/v1/chat/completions"
    DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
    
    def __init__(self):
        self.openai_api_key = getattr(settings, "OPENAI_API_KEY", None)
        self.deepseek_api_key = getattr(settings, "DEEPSEEK_API_KEY", None)
        self.openai_enabled = getattr(settings, "OPENAI_ENABLED", True) and bool(self.openai_api_key)
        self.deepseek_enabled = getattr(settings, "DEEPSEEK_ENABLED", True) and bool(self.deepseek_api_key)

        self.enabled = self.openai_enabled or self.deepseek_enabled
        self.model = JemsAIModel.JEMS_CORE
    
    async def _make_request(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Optional[Dict[str, Any]]:
        """
        Make request to Jems AI backend.
        Primary: OpenAI (GPT-4o/o1)
        Fallback: DeepSeek
        """
        if not self.enabled:
            logger.warning("Jems AI (Multi-Cloud) is disabled - No API keys configured")
            return None

        # 1. PRIMARY ATTEMPT: OpenAI
        if self.openai_enabled:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o", # High performance primary
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "response_format": {"type": "json_object"}
            }

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(self.OPENAI_URL, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    result = self._parse_ai_response(data)
                    if result:
                        result["provider"] = "openai"
                        return result
            except Exception as e:
                logger.warning(f"Primary OpenAI request failed: {e}. Attempting DeepSeek fallback...")

        # 2. FALLBACK ATTEMPT: DeepSeek
        if self.deepseek_enabled:
            headers = {
                "Authorization": f"Bearer {self.deepseek_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "deepseek-chat",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "response_format": {"type": "json_object"}
            }

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(self.DEEPSEEK_URL, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    result = self._parse_ai_response(data)
                    if result:
                        result["provider"] = "deepseek"
                        result["fallback_used"] = True
                        return result
            except Exception as e:
                logger.error(f"Fallback DeepSeek request failed: {e}")

        return None

    def _parse_ai_response(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract and parse content from AI response choices"""
        if "choices" in data and len(data["choices"]) > 0:
            content = data["choices"][0]["message"]["content"]
            try:
                # Parse JSON response
                return json.loads(content)
            except json.JSONDecodeError:
                # If not JSON, wrap in structured format
                return {
                    "response": content,
                    "raw": True
                }
        return None
    
    async def get_land_guidance(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get plain English land guidance for Sierra Leone context
        
        Args:
            question: User's question about land
            context: Optional context (location, property type, etc.)
        
        Returns:
            Structured guidance response
        """
        prompt = self._build_land_guidance_prompt(question, context)
        
        messages = [
            {
                "role": "system",
                "content": prompt["system"]
            },
            {
                "role": "user",
                "content": prompt["user"]
            }
        ]
        
        response = await self._make_request(messages, temperature=0.7)
        
        if not response:
            return {
                "success": False,
                "error": "AI service unavailable",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Ensure structured response
        return {
            "success": True,
            "guidance": response.get("guidance", response.get("response", "")),
            "explanation": response.get("explanation", ""),
            "cautions": response.get("cautions", []),
            "next_steps": response.get("next_steps", []),
            "disclaimer": "This is advisory information only. Consult legal professionals for official guidance.",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def review_document(
        self,
        document_text: str,
        document_type: str = "survey_plan"
    ) -> Dict[str, Any]:
        """
        Review land document and detect potential red flags
        
        Args:
            document_text: Text content of document
            document_type: Type of document (survey_plan, title_deed, etc.)
        
        Returns:
            Document review with red flags and recommendations
        """
        prompt = self._build_document_review_prompt(document_text, document_type)
        
        messages = [
            {
                "role": "system",
                "content": prompt["system"]
            },
            {
                "role": "user",
                "content": prompt["user"]
            }
        ]
        
        response = await self._make_request(messages, temperature=0.5)  # Lower temp for accuracy
        
        if not response:
            return {
                "success": False,
                "error": "AI service unavailable",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Ensure structured response
        return {
            "success": True,
            "document_type": document_type,
            "summary": response.get("summary", ""),
            "red_flags": response.get("red_flags", []),
            "verification_points": response.get("verification_points", []),
            "recommendations": response.get("recommendations", []),
            "confidence": response.get("confidence", 0.0),
            "disclaimer": "AI review is advisory only. All documents must be verified by qualified professionals.",
            "timestamp": datetime.utcnow().isoformat()
        }

    async def extract_land_data(
        self,
        document_text: str,
        document_type: str = "land_document"
    ) -> Dict[str, Any]:
        """
        Extract structured land data from document text.
        Includes owner names, polygon coordinates, and history.
        """
        prompt = self._build_extraction_prompt(document_text, document_type)

        messages = [
            {
                "role": "system",
                "content": prompt["system"]
            },
            {
                "role": "user",
                "content": prompt["user"]
            }
        ]

        # Low temperature for high precision extraction
        response = await self._make_request(messages, temperature=0.1)

        if not response:
            return {
                "success": False,
                "error": "AI extraction failed",
                "timestamp": datetime.utcnow().isoformat()
            }

        return {
            "success": True,
            "data": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _build_land_guidance_prompt(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """Build prompt for land guidance"""
        
        context_str = ""
        if context:
            context_parts = []
            if "location" in context:
                context_parts.append(f"Location: {context['location']}")
            if "property_type" in context:
                context_parts.append(f"Property Type: {context['property_type']}")
            if "size" in context:
                context_parts.append(f"Size: {context['size']} sqm")
            context_str = "\n".join(context_parts)
        
        system_prompt = """You are a helpful AI assistant providing land transaction guidance for Sierra Leone.

Your role is ADVISORY ONLY. You must:
- Provide clear, plain English explanations
- Reference Sierra Leone land laws and customs where relevant
- Always include cautions and disclaimers
- Never make legal guarantees or promises
- Suggest consulting professionals for official matters

Respond in JSON format with:
{
  "guidance": "Main answer to the question",
  "explanation": "Detailed explanation",
  "cautions": ["List of warnings"],
  "next_steps": ["Recommended actions"]
}"""

        context_block = f"Context:\n{context_str}\n" if context_str else ""
        user_prompt = f"""User Question: {question}
        
{context_block}
        
Provide guidance on this land-related question for Sierra Leone. Be specific, helpful, and always include appropriate cautions."""

        return {
            "system": system_prompt,
            "user": user_prompt
        }

    def _build_extraction_prompt(
        self,
        document_text: str,
        document_type: str
    ) -> Dict[str, str]:
        """Build prompt for structured data extraction"""

        system_prompt = """You are a specialized document extraction agent for Sierra Leone land registry.
Extract structured data from the provided land document text.

Rules:
1. Coordinates: Extract as a list of [latitude, longitude] pairs representing the property boundary polygon.
2. Ownership History: Extract as a list of objects with 'event', 'date', 'from_party', 'to_party'.
3. Owner: Extract current primary owner's full name.
4. Identifiers: Extract any Plot Numbers, Parcel IDs, or Registration numbers.

Respond ONLY in JSON format:
{
  "owner_name": "string",
  "coordinates": [[lat, lon], [lat, lon], ...],
  "ownership_history": [
    {"event": "string", "date": "string", "from_party": "string", "to_party": "string"}
  ],
  "identifiers": {
    "parcel_id": "string",
    "plot_number": "string",
    "registration_number": "string"
  },
  "metadata": {
    "document_date": "string",
    "document_type_detected": "string"
  }
}"""

        user_prompt = f"""Extract details from this {document_type}:

{document_text[:5000]}"""

        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    def _build_document_review_prompt(
        self,
        document_text: str,
        document_type: str
    ) -> Dict[str, str]:
        """Build prompt for document review"""
        
        system_prompt = """You are an AI assistant reviewing land documents for Sierra Leone.

Your role is to:
- Identify potential red flags or inconsistencies
- Suggest verification points
- Provide recommendations
- NEVER make definitive legal judgments

Respond in JSON format with:
{
  "summary": "Brief summary of document",
  "red_flags": ["List of potential issues"],
  "verification_points": ["Things to verify"],
  "recommendations": ["Recommended actions"],
  "confidence": 0.0-1.0
}"""

        user_prompt = f"""Review this {document_type} document:

{document_text[:3000]}  # Limit text length

Identify any red flags, inconsistencies, or items requiring verification. Be thorough but cautious."""

        return {
            "system": system_prompt,
            "user": user_prompt
        }


# Singleton instance
_jems_service: Optional[JemsAIService] = None


def get_jems_service() -> JemsAIService:
    """Get or create Jems AI service instance"""
    global _jems_service
    if _jems_service is None:
        _jems_service = JemsAIService()
    return _jems_service
