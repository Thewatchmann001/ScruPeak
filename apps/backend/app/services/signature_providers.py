"""
Digital Signature API Integrations
Support for DocuSign, SignNow, and HelloSign APIs
"""

import aiohttp
import json
import base64
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# DOCUSIGN INTEGRATION
# ============================================================================

class DocuSignAPI:
    """DocuSign API client for enterprise digital signatures"""
    
    def __init__(self, api_key: str, integrator_id: str, account_id: str, api_url: str):
        self.api_key = api_key
        self.integrator_id = integrator_id
        self.account_id = account_id
        self.api_url = api_url or "https://api.docusign.net/v2.1"
        self.access_token = None
        self.token_expires_at = None
    
    async def authenticate(self) -> bool:
        """Authenticate with DocuSign API"""
        try:
            auth_url = f"{self.api_url}/oauth/token"
            headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            data = {
                "grant_type": "authorization_code",
                "client_id": self.integrator_id,
                "client_secret": self.api_key,
                "code": self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(auth_url, headers=headers, data=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        self.access_token = result.get("access_token")
                        self.token_expires_at = datetime.utcnow().timestamp() + result.get("expires_in", 3600)
                        logger.info("DocuSign authentication successful")
                        return True
                    else:
                        logger.error(f"DocuSign authentication failed: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"DocuSign authentication error: {e}")
            return False
    
    async def create_envelope(self, document_data: Dict) -> Tuple[bool, Optional[str]]:
        """
        Create a DocuSign envelope (signature request)
        
        Args:
            document_data: {
                'document_name': str,
                'document_base64': str,
                'recipients': [{'email': str, 'name': str, 'role': str}],
                'cc_recipients': List[Dict],
                'email_subject': str,
                'email_message': str,
                'status': str  # 'sent' or 'draft'
            }
        
        Returns:
            (success: bool, envelope_id: Optional[str])
        """
        try:
            await self._ensure_authenticated()
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            # Build envelope payload
            envelope = {
                "emailSubject": document_data.get("email_subject", "Please sign this document"),
                "emailBlurb": document_data.get("email_message", ""),
                "documents": [{
                    "documentBase64": document_data.get("document_base64"),
                    "name": document_data.get("document_name"),
                    "documentId": "1"
                }],
                "recipients": {
                    "signers": [
                        {
                            "email": recipient["email"],
                            "name": recipient["name"],
                            "recipientId": str(i + 1),
                            "routingOrder": recipient.get("routing_order", i + 1),
                            "tabs": {
                                "signHereTabs": [{
                                    "documentId": "1",
                                    "pageNumber": recipient.get("page_number", 1),
                                    "xPosition": str(recipient.get("x_position", 100)),
                                    "yPosition": str(recipient.get("y_position", 100))
                                }]
                            }
                        }
                        for i, recipient in enumerate(document_data.get("recipients", []))
                    ],
                    "carbonCopies": [
                        {
                            "email": cc["email"],
                            "name": cc.get("name", ""),
                            "recipientId": str(len(document_data.get("recipients", [])) + i + 1)
                        }
                        for i, cc in enumerate(document_data.get("cc_recipients", []))
                    ]
                },
                "status": document_data.get("status", "sent")
            }
            
            url = f"{self.api_url}/accounts/{self.account_id}/envelopes"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=envelope) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        envelope_id = result.get("envelopeId")
                        logger.info(f"DocuSign envelope created: {envelope_id}")
                        return (True, envelope_id)
                    else:
                        logger.error(f"DocuSign envelope creation failed: {response.status}")
                        return (False, None)
        except Exception as e:
            logger.error(f"DocuSign envelope creation error: {e}")
            return (False, None)
    
    async def get_envelope_status(self, envelope_id: str) -> Optional[Dict]:
        """Get envelope status from DocuSign"""
        try:
            await self._ensure_authenticated()
            
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            url = f"{self.api_url}/accounts/{self.account_id}/envelopes/{envelope_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "status": result.get("status"),
                            "recipients": result.get("recipients"),
                            "sent_at": result.get("sentDateTime"),
                            "completed_at": result.get("completedDateTime")
                        }
                    return None
        except Exception as e:
            logger.error(f"DocuSign status check error: {e}")
            return None
    
    async def download_documents(self, envelope_id: str) -> Optional[bytes]:
        """Download signed documents from DocuSign"""
        try:
            await self._ensure_authenticated()
            
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            url = f"{self.api_url}/accounts/{self.account_id}/envelopes/{envelope_id}/documents/combined"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return await response.read()
                    return None
        except Exception as e:
            logger.error(f"DocuSign document download error: {e}")
            return None
    
    async def _ensure_authenticated(self):
        """Ensure valid authentication token"""
        if not self.access_token or datetime.utcnow().timestamp() > self.token_expires_at - 300:
            await self.authenticate()


# ============================================================================
# SIGNNOW INTEGRATION
# ============================================================================

class SignNowAPI:
    """SignNow API client for digital signatures"""
    
    def __init__(self, api_token: str, api_url: str = None):
        self.api_token = api_token
        self.api_url = api_url or "https://api.signnow.com/v2"
    
    async def upload_document(self, document_bytes: bytes, filename: str) -> Optional[str]:
        """Upload document to SignNow"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/octet-stream"
            }
            
            url = f"{self.api_url}/documents"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    headers=headers,
                    data=document_bytes,
                    params={"filename": filename}
                ) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        document_id = result.get("id")
                        logger.info(f"SignNow document uploaded: {document_id}")
                        return document_id
                    return None
        except Exception as e:
            logger.error(f"SignNow document upload error: {e}")
            return None
    
    async def create_signature_request(self, document_id: str, request_data: Dict) -> Optional[str]:
        """Create signature request in SignNow"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }
            
            # Build payload
            payload = {
                "to": [
                    {
                        "email": recipient["email"],
                        "name": recipient.get("name", ""),
                        "role": recipient.get("role", "signer"),
                        "order": recipient.get("order", 1)
                    }
                    for recipient in request_data.get("recipients", [])
                ],
                "from": request_data.get("from_email"),
                "message": request_data.get("message", ""),
                "subject": request_data.get("subject", "Please sign document"),
                "document_id": document_id
            }
            
            url = f"{self.api_url}/document_invites"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        invite_id = result.get("id")
                        logger.info(f"SignNow invite created: {invite_id}")
                        return invite_id
                    return None
        except Exception as e:
            logger.error(f"SignNow invite creation error: {e}")
            return None
    
    async def get_document_status(self, document_id: str) -> Optional[Dict]:
        """Get document status from SignNow"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_token}"
            }
            
            url = f"{self.api_url}/documents/{document_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "status": result.get("status"),
                            "pages": result.get("pages"),
                            "created_at": result.get("created")
                        }
                    return None
        except Exception as e:
            logger.error(f"SignNow status check error: {e}")
            return None
    
    async def download_signed_document(self, document_id: str) -> Optional[bytes]:
        """Download signed document from SignNow"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_token}"
            }
            
            url = f"{self.api_url}/documents/{document_id}/download"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return await response.read()
                    return None
        except Exception as e:
            logger.error(f"SignNow document download error: {e}")
            return None


# ============================================================================
# HELLOSIGN INTEGRATION
# ============================================================================

class HelloSignAPI:
    """HelloSign (Dropbox Sign) API client"""
    
    def __init__(self, api_key: str, api_url: str = None):
        self.api_key = api_key
        self.api_url = api_url or "https://api.hellosign.com/v3"
    
    async def create_signature_request(self, request_data: Dict) -> Optional[str]:
        """Create signature request in HelloSign"""
        try:
            # Basic auth with API key
            auth = aiohttp.BasicAuth(self.api_key, "")
            
            # Build multipart form data
            payload = {
                "title": request_data.get("title", "Signature Request"),
                "subject": request_data.get("subject", "Please sign"),
                "message": request_data.get("message", ""),
                "signers": [
                    {
                        f"signers[{i}][email]": signer["email"],
                        f"signers[{i}][name]": signer.get("name", ""),
                        f"signers[{i}][order]": signer.get("order", i)
                    }
                    for i, signer in enumerate(request_data.get("signers", []))
                ],
                "cc_email_addresses[]": request_data.get("cc_emails", []),
                "client_id": request_data.get("client_id"),
                "files": request_data.get("files", [])  # Files to sign
            }
            
            url = f"{self.api_url}/signature_request/send"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    auth=auth,
                    data=payload
                ) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        request_id = result.get("signature_request", {}).get("id")
                        logger.info(f"HelloSign request created: {request_id}")
                        return request_id
                    return None
        except Exception as e:
            logger.error(f"HelloSign request creation error: {e}")
            return None
    
    async def get_signature_request_status(self, request_id: str) -> Optional[Dict]:
        """Get signature request status"""
        try:
            auth = aiohttp.BasicAuth(self.api_key, "")
            
            url = f"{self.api_url}/signature_request/{request_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, auth=auth) as response:
                    if response.status == 200:
                        result = await response.json()
                        sr = result.get("signature_request", {})
                        return {
                            "status": sr.get("status"),
                            "signers": sr.get("signatures"),
                            "created_at": sr.get("created_at")
                        }
                    return None
        except Exception as e:
            logger.error(f"HelloSign status check error: {e}")
            return None


# ============================================================================
# UNIFIED SIGNATURE SERVICE
# ============================================================================

class UnifiedSignatureService:
    """Unified service for multiple signature providers"""
    
    def __init__(self):
        self.providers = {}
    
    def add_provider(self, name: str, provider: object):
        """Register a signature provider"""
        self.providers[name] = provider
    
    async def send_for_signature(
        self,
        provider: str,
        document_bytes: bytes,
        document_name: str,
        recipients: List[Dict],
        **kwargs
    ) -> Optional[str]:
        """
        Send document for signature using specified provider
        
        Returns:
            Signature request ID
        """
        if provider == "docusign":
            doc_base64 = base64.b64encode(document_bytes).decode()
            success, envelope_id = await self.providers["docusign"].create_envelope({
                "document_name": document_name,
                "document_base64": doc_base64,
                "recipients": recipients,
                **kwargs
            })
            return envelope_id if success else None
        
        elif provider == "signnow":
            doc_id = await self.providers["signnow"].upload_document(document_bytes, document_name)
            if doc_id:
                invite_id = await self.providers["signnow"].create_signature_request(
                    doc_id,
                    {"recipients": recipients, **kwargs}
                )
                return invite_id
            return None
        
        elif provider == "hellosign":
            return await self.providers["hellosign"].create_signature_request({
                "signers": recipients,
                **kwargs
            })
        
        return None
    
    async def get_status(self, provider: str, request_id: str) -> Optional[Dict]:
        """Get signature request status"""
        if provider == "docusign":
            return await self.providers["docusign"].get_envelope_status(request_id)
        elif provider == "signnow":
            return await self.providers["signnow"].get_document_status(request_id)
        elif provider == "hellosign":
            return await self.providers["hellosign"].get_signature_request_status(request_id)
        return None
    
    async def download_signed_document(self, provider: str, request_id: str) -> Optional[bytes]:
        """Download signed document"""
        if provider == "docusign":
            return await self.providers["docusign"].download_documents(request_id)
        elif provider == "signnow":
            return await self.providers["signnow"].download_signed_document(request_id)
        elif provider == "hellosign":
            # HelloSign requires different approach
            logger.warning("HelloSign document download not fully implemented")
            return None
        return None
