"""
Digital Signatures Router
Legal document signing workflow endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
from typing import Optional, List
import uuid
import json
import hashlib
import base64
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.digital_signatures import (
    DocumentSignatureRequest, SignatureField, SignatureResponse, SignatureAuditTrail,
    SignatureTemplate, SignatureCertificate, DocumentSignatureStatus, SignatureProvider,
    SignatureFieldType
)
from app.services.pdf_signer import PdfSignerService
from app.utils.auth import get_current_user, get_current_admin
from app.models import User, Document
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

router = APIRouter(prefix="/api/v1/signatures")

# ============================================================================
# SCHEMAS
# ============================================================================

class SignatureFieldRequest(BaseModel):
    """Request to add a signature field"""
    page_number: int
    x_coordinate: int
    y_coordinate: int
    width: int
    height: int
    field_type: SignatureFieldType = SignatureFieldType.SIGNATURE
    field_name: str
    required: bool = True
    signer_id: str
    signer_index: int


class CreateSignatureRequestRequest(BaseModel):
    """Create a new signature request"""
    document_id: str
    document_name: str
    document_type: str  # settlement_agreement, title_transfer, etc.
    transaction_id: Optional[str] = None
    signers_count: int = 1
    email_subject: Optional[str] = None
    email_message: Optional[str] = None
    require_all_signatures: bool = True
    expires_in_days: Optional[int] = 30
    fields: List[SignatureFieldRequest]
    template_id: Optional[str] = None


class SendSignatureRequestRequest(BaseModel):
    """Send signature request to signers"""
    signer_emails: List[str]
    reminder_frequency: Optional[str] = "daily"  # daily, weekly


class SignDocumentRequest(BaseModel):
    """Sign a document"""
    signature_value: str  # Base64 encoded signature
    field_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class RejectSignatureRequest(BaseModel):
    """Reject a signature request"""
    reason: str


class SignatureResponseResponse(BaseModel):
    """Response model for signature request"""
    id: str
    status: str
    document_name: str
    document_type: str
    signed_count: int
    signers_count: int
    expires_at: Optional[datetime]
    completed_at: Optional[datetime]


# ============================================================================
# ENDPOINTS: SIGNATURE REQUEST MANAGEMENT
# ============================================================================

@router.post("/request", response_model=SignatureResponseResponse, status_code=status.HTTP_201_CREATED)
async def create_signature_request(
    request: CreateSignatureRequestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new signature request for a document"""
    try:
        # Validate document exists
        document_id = uuid.UUID(request.document_id)
        
        # Create signature request
        expires_at = None
        if request.expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)
        
        sig_request = DocumentSignatureRequest(
            document_id=document_id,
            transaction_id=uuid.UUID(request.transaction_id) if request.transaction_id else None,
            document_name=request.document_name,
            document_type=request.document_type,
            signers_count=request.signers_count,
            email_subject=request.email_subject,
            email_message=request.email_message,
            require_all_signatures=request.require_all_signatures,
            expires_at=expires_at,
            template_id=request.template_id
        )
        db.add(sig_request)
        await db.flush()
        
        # Add signature fields
        for field_req in request.fields:
            field = SignatureField(
                request_id=sig_request.id,
                page_number=field_req.page_number,
                x_coordinate=field_req.x_coordinate,
                y_coordinate=field_req.y_coordinate,
                width=field_req.width,
                height=field_req.height,
                field_type=field_req.field_type,
                field_name=field_req.field_name,
                required=field_req.required,
                signer_id=uuid.UUID(field_req.signer_id),
                signer_index=field_req.signer_index
            )
            db.add(field)
        
        # Audit trail
        audit = SignatureAuditTrail(
            request_id=sig_request.id,
            action="CREATED",
            actor_id=current_user.id,
            actor_email=current_user.email,
            change_description=f"Signature request created for {request.document_type}"
        )
        db.add(audit)
        
        await db.commit()
        await db.refresh(sig_request)
        
        return SignatureResponseResponse(
            id=str(sig_request.id),
            status=sig_request.status.value,
            document_name=sig_request.document_name,
            document_type=sig_request.document_type,
            signed_count=sig_request.signed_count,
            signers_count=sig_request.signers_count,
            expires_at=sig_request.expires_at,
            completed_at=sig_request.completed_at
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/request/{request_id}", response_model=SignatureResponseResponse)
async def get_signature_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get signature request details"""
    try:
        req_id = uuid.UUID(request_id)
        result = await db.execute(
            select(DocumentSignatureRequest).where(DocumentSignatureRequest.id == req_id)
        )
        sig_request = result.scalar_one_or_none()
        
        if not sig_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signature request not found")
        
        return SignatureResponseResponse(
            id=str(sig_request.id),
            status=sig_request.status.value,
            document_name=sig_request.document_name,
            document_type=sig_request.document_type,
            signed_count=sig_request.signed_count,
            signers_count=sig_request.signers_count,
            expires_at=sig_request.expires_at,
            completed_at=sig_request.completed_at
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request ID")


@router.post("/request/{request_id}/send", status_code=status.HTTP_200_OK)
async def send_signature_request(
    request_id: str,
    send_req: SendSignatureRequestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send signature request to signers"""
    try:
        req_id = uuid.UUID(request_id)
        result = await db.execute(
            select(DocumentSignatureRequest).where(DocumentSignatureRequest.id == req_id)
        )
        sig_request = result.scalar_one_or_none()
        
        if not sig_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signature request not found")
        
        if sig_request.status != DocumentSignatureStatus.CREATED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request already sent")
        
        # Update status
        sig_request.status = DocumentSignatureStatus.SENT
        sig_request.sent_at = datetime.utcnow()
        
        # TODO: Send emails to signers via email service
        
        # Audit trail
        audit = SignatureAuditTrail(
            request_id=sig_request.id,
            action="SENT",
            actor_id=current_user.id,
            actor_email=current_user.email,
            change_description=f"Sent to {len(send_req.signer_emails)} signers"
        )
        db.add(audit)
        await db.commit()
        
        return {"status": "sent", "signer_count": len(send_req.signer_emails)}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request ID")


# ============================================================================
# ENDPOINTS: SIGNING WORKFLOW
# ============================================================================

@router.get("/my-pending", response_model=List[SignatureResponseResponse])
async def get_my_pending_signatures(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending signatures for current user"""
    result = await db.execute(
        select(DocumentSignatureRequest).where(
            (DocumentSignatureRequest.status == DocumentSignatureStatus.SENT) |
            (DocumentSignatureRequest.status == DocumentSignatureStatus.VIEWED)
        ).limit(50)
    )
    requests = result.scalars().all()
    
    return [
        SignatureResponseResponse(
            id=str(r.id),
            status=r.status.value,
            document_name=r.document_name,
            document_type=r.document_type,
            signed_count=r.signed_count,
            signers_count=r.signers_count,
            expires_at=r.expires_at,
            completed_at=r.completed_at
        )
        for r in requests
    ]


@router.post("/request/{request_id}/sign", status_code=status.HTTP_200_OK)
async def sign_document(
    request_id: str,
    sign_req: SignDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sign a document field"""
    try:
        req_id = uuid.UUID(request_id)
        field_id = uuid.UUID(sign_req.field_id)
        
        result = await db.execute(
            select(DocumentSignatureRequest).where(DocumentSignatureRequest.id == req_id)
        )
        sig_request = result.scalar_one_or_none()
        
        if not sig_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signature request not found")
        
        # Get field
        field_result = await db.execute(
            select(SignatureField).where(SignatureField.id == field_id)
        )
        field = field_result.scalar_one_or_none()
        
        if not field:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signature field not found")
        
        # Verify signer
        if field.signer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to sign this field")
        
        # Sign field
        field.is_signed = True
        field.signed_at = datetime.utcnow()
        field.signed_value = sign_req.signature_value
        
        # Update request status
        if sig_request.status == DocumentSignatureStatus.CREATED:
            sig_request.status = DocumentSignatureStatus.VIEWED
            sig_request.first_viewed_at = datetime.utcnow()
        
        sig_request.signed_count += 1
        
        # Check if all signed
        if sig_request.signed_count == sig_request.signers_count:
            sig_request.status = DocumentSignatureStatus.SIGNED
            sig_request.completed_at = datetime.utcnow()
        
        # Audit trail
        audit = SignatureAuditTrail(
            request_id=sig_request.id,
            action="FIELD_SIGNED",
            actor_id=current_user.id,
            actor_email=current_user.email,
            actor_ip_address=sign_req.ip_address,
            change_description=f"Signed field: {field.field_name}"
        )
        db.add(audit)
        await db.commit()
        
        return {
            "status": "signed",
            "field_name": field.field_name,
            "request_status": sig_request.status.value,
            "progress": f"{sig_request.signed_count}/{sig_request.signers_count}"
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID")


@router.post("/request/{request_id}/reject", status_code=status.HTTP_200_OK)
async def reject_signature_request(
    request_id: str,
    reject_req: RejectSignatureRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject signature request"""
    try:
        req_id = uuid.UUID(request_id)
        result = await db.execute(
            select(DocumentSignatureRequest).where(DocumentSignatureRequest.id == req_id)
        )
        sig_request = result.scalar_one_or_none()
        
        if not sig_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signature request not found")
        
        sig_request.status = DocumentSignatureStatus.REJECTED
        
        # Audit trail
        audit = SignatureAuditTrail(
            request_id=sig_request.id,
            action="REJECTED",
            actor_id=current_user.id,
            actor_email=current_user.email,
            change_description=reject_req.reason
        )
        db.add(audit)
        await db.commit()
        
        return {"status": "rejected", "reason": reject_req.reason}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request ID")


# ============================================================================
# ENDPOINTS: CERTIFICATE & VERIFICATION
# ============================================================================

@router.post("/request/{request_id}/seal", status_code=status.HTTP_201_CREATED)
async def seal_signed_document(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create signature certificate for completed signature request"""
    try:
        req_id = uuid.UUID(request_id)
        result = await db.execute(
            select(DocumentSignatureRequest).where(DocumentSignatureRequest.id == req_id)
        )
        sig_request = result.scalar_one_or_none()
        
        if not sig_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signature request not found")
        
        if sig_request.status != DocumentSignatureStatus.SIGNED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All signatures required to seal")
        
        # 1. Fetch Original Document Content
        # In a real app, download from S3/Azure Blob/Local Storage
        document_result = await db.execute(
            select(Document).where(Document.id == sig_request.document_id)
        )
        original_doc = document_result.scalar_one_or_none()
        
        pdf_bytes = None
        if original_doc and original_doc.file_url:
            # TODO: Implement actual file fetching
            # For MVP, we generate a placeholder PDF if fetch fails
            try:
                # import requests
                # response = requests.get(original_doc.file_url)
                # if response.status_code == 200:
                #     pdf_bytes = response.content
                pass
            except Exception:
                pass
        
        if not pdf_bytes:
            # Generate a dummy PDF for demonstration
            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)
            c.drawString(100, 750, f"Document: {sig_request.document_name}")
            c.drawString(100, 730, f"Type: {sig_request.document_type}")
            c.drawString(100, 710, "Content Placeholder for Digital Signature Demo")
            c.save()
            buffer.seek(0)
            pdf_bytes = buffer.getvalue()

        # 2. Get Signatures Data
        fields_result = await db.execute(
            select(SignatureField).where(SignatureField.request_id == req_id)
        )
        fields = fields_result.scalars().all()
        
        signatures_data = []
        signers_info = []
        
        for f in fields:
            if f.is_signed:
                # Fetch signer name
                signer_result = await db.execute(select(User).where(User.id == f.signer_id))
                signer = signer_result.scalar_one_or_none()
                signer_name = signer.full_name if signer else "Unknown Signer"
                
                signatures_data.append({
                    'page_number': f.page_number,
                    'x': f.x_coordinate,
                    'y': f.y_coordinate,
                    'text': f.signed_value or "[Signed]",
                    'signer_name': signer_name,
                    'signed_at': f.signed_at,
                    # 'ip_address': ... (fetch from audit trail if available)
                })
                
                signers_info.append({
                    "signer_id": str(f.signer_id),
                    "field_name": f.field_name,
                    "signed_at": f.signed_at.isoformat() if f.signed_at else None
                })

        # 3. Generate Certificate Number
        cert_num = f"CERT-{datetime.utcnow().strftime('%Y%m%d')}-{str(req_id)[:8]}"
        
        # 4. Sign and Seal Document
        signed_pdf_bytes, cert_hash = PdfSignerService.sign_document(
            pdf_bytes=pdf_bytes,
            signatures=signatures_data,
            request_id=req_id,
            certificate_number=cert_num
        )
        
        # 5. Create Certificate Record
        certificate = SignatureCertificate(
            request_id=sig_request.id,
            certificate_number=cert_num,
            certificate_hash=cert_hash,
            all_signed=True,
            completion_percentage=100,
            signers_info=signers_info,
            certificate_data=signed_pdf_bytes  # Store the signed PDF blob
        )
        db.add(certificate)
        
        # Audit trail
        audit = SignatureAuditTrail(
            request_id=sig_request.id,
            action="SEALED",
            actor_id=current_user.id,
            actor_email=current_user.email,
            change_description=f"Created certificate: {cert_num}"
        )
        db.add(audit)
        await db.commit()
        
        return {
            "certificate_number": cert_num,
            "certificate_hash": cert_hash,
            "status": "sealed",
            "completion_percentage": 100
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request ID")


@router.get("/certificate/{cert_id}")
async def get_certificate(
    cert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get signature certificate"""
    try:
        id = uuid.UUID(cert_id)
        result = await db.execute(
            select(SignatureCertificate).where(SignatureCertificate.id == id)
        )
        certificate = result.scalar_one_or_none()
        
        if not certificate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
        
        return {
            "certificate_number": certificate.certificate_number,
            "certificate_hash": certificate.certificate_hash,
            "all_signed": certificate.all_signed,
            "issued_at": certificate.issued_at,
            "signers": certificate.signers_info
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid certificate ID")


# ============================================================================
# ENDPOINTS: TEMPLATES & ADMIN
# ============================================================================

@router.post("/templates", status_code=status.HTTP_201_CREATED)
async def create_signature_template(
    name: str = Form(...),
    template_type: str = Form(...),
    field_definitions: str = Form(...),
    signer_roles: str = Form(...),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create reusable signature template"""
    try:
        template = SignatureTemplate(
            name=name,
            template_type=template_type,
            field_definitions=json.loads(field_definitions),
            signer_roles=json.loads(signer_roles),
            created_by=current_user.id
        )
        db.add(template)
        await db.commit()
        
        return {"id": str(template.id), "name": template.name, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/templates", response_model=List[dict])
async def list_signature_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List available signature templates"""
    result = await db.execute(
        select(SignatureTemplate).where(SignatureTemplate.is_active == True).limit(100)
    )
    templates = result.scalars().all()
    
    return [
        {"id": str(t.id), "name": t.name, "template_type": t.template_type}
        for t in templates
    ]


@router.get("/statistics")
async def get_signature_statistics(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get signature request statistics"""
    result = await db.execute(
        select(DocumentSignatureRequest).limit(1000)
    )
    requests = result.scalars().all()
    
    total = len(requests)
    completed = len([r for r in requests if r.status == DocumentSignatureStatus.SIGNED])
    pending = len([r for r in requests if r.status in [DocumentSignatureStatus.CREATED, DocumentSignatureStatus.SENT]])
    rejected = len([r for r in requests if r.status == DocumentSignatureStatus.REJECTED])
    
    return {
        "total_requests": total,
        "completed": completed,
        "pending": pending,
        "rejected": rejected,
        "completion_rate": f"{(completed/total*100):.1f}%" if total > 0 else "0%"
    }
