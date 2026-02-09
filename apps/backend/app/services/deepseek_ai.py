"""
DeepSeek AI Service
Non-invasive intelligence layer for advisory guidance
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


class DeepSeekModel(str, Enum):
    """Available DeepSeek models"""
    DEEPSEEK_CHAT = "deepseek-chat"
    DEEPSEEK_CODER = "deepseek-coder"


class DeepSeekAIService:
    """
    DeepSeek AI wrapper service
    Provides advisory-only AI assistance for land transactions
    """
    
    BASE_URL = "https://api.deepseek.com/v1/chat/completions"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "DEEPSEEK_API_KEY", None)
        enabled_flag = getattr(settings, "DEEPSEEK_ENABLED", True)
        if not self.api_key:
            logger.warning("DeepSeek API key not configured. AI features will be disabled.")
            self.enabled = False
        else:
            self.enabled = enabled_flag and bool(self.api_key)
        self.model = DeepSeekModel.DEEPSEEK_CHAT
    
    async def _make_request(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Optional[Dict[str, Any]]:
        """Make request to DeepSeek API"""
        if not self.enabled:
            logger.warning("DeepSeek AI is disabled - API key not configured")
            return None
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model.value,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"}  # Force JSON response
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.BASE_URL, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Extract content from response
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
                
        except httpx.HTTPError as e:
            logger.error(f"DeepSeek API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in DeepSeek service: {e}")
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
_deepseek_service: Optional[DeepSeekAIService] = None


def get_deepseek_service() -> DeepSeekAIService:
    """Get or create DeepSeek AI service instance"""
    global _deepseek_service
    if _deepseek_service is None:
        _deepseek_service = DeepSeekAIService()
    return _deepseek_service
