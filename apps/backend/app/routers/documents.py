"""
Document upload and management router
Handles property documents, proof of ownership, KYC documents, etc.
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID, uuid4
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from app.core.database import get_db
from app.models import User, Document, Land
from app.schemas import DocumentResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

# Configuration
UPLOAD_DIR = Path("uploads/documents")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}


def ensure_upload_dir():
    """Ensure upload directory exists"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file"""
    if not file.filename:
        return False
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    
    return True


async def save_file(file: UploadFile) -> str:
    """Save uploaded file and return path"""
    ensure_upload_dir()
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    logger.info(f"File saved: {unique_filename}")
    return str(file_path)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = "general",
    description: Optional[str] = None,
    land_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a document
    
    Document types:
    - kyc: Know Your Customer documents
    - proof_of_ownership: Land ownership proof
    - survey: Property survey documents
    - deed: Property deed/title
    - permit: Building permits
    - contract: Purchase/sale contracts
    - general: General documents
    """
    
    # Validate file
    if not validate_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type or name"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed"
        )
    
    # If land_id provided, verify user owns the land
    if land_id:
        land_result = await db.execute(
            select(Land).where(Land.id == land_id)
        )
        land = land_result.scalar_one_or_none()
        
        if not land:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Land not found"
            )
        
        if land.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only upload documents for your own properties"
            )
    
    # Save file
    # Rewind file pointer
    await file.seek(0)
    file_path = await save_file(file)
    
    # Create document record
    document = Document(
        id=uuid4(),
        user_id=current_user.id,
        land_id=land_id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(contents),
        mime_type=file.content_type,
        doc_type=doc_type,
        description=description,
        created_at=datetime.utcnow()
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    logger.info(f"Document uploaded by user {current_user.id}: {document.id}")
    
    return document


@router.post("/extract", status_code=status.HTTP_200_OK)
async def extract_document_details(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and extract details from a land document (PDF/Text).
    Returns coordinates, owner name, and history.
    Does NOT save the file permanently (processing only).
    """
    if not validate_file(file):
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Save temp file
    temp_path = UPLOAD_DIR / f"temp_{uuid4()}_{file.filename}"
    ensure_upload_dir()
    
    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # Run Extraction
        result = DocumentExtractor.extract_details(str(temp_path))
        
        return result
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if temp_path.exists():
            os.remove(temp_path)


@router.get("/{document_id}", response_model=DocumentResponse, status_code=status.HTTP_200_OK)
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get document metadata"""
    
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check access permission
    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this document"
        )
    
    return document


@router.get("/land/{land_id}", response_model=list, status_code=status.HTTP_200_OK)
async def get_land_documents(
    land_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all documents for a property"""
    
    # Verify land exists and user has access
    land_result = await db.execute(
        select(Land).where(Land.id == land_id)
    )
    land = land_result.scalar_one_or_none()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land not found"
        )
    
    if land.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access these documents"
        )
    
    # Get documents
    result = await db.execute(
        select(Document).where(Document.land_id == land_id)
    )
    documents = result.scalars().all()
    
    return documents


@router.get("/user/me", response_model=list, status_code=status.HTTP_200_OK)
async def get_my_documents(
    doc_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's documents"""
    
    query = select(Document).where(Document.user_id == current_user.id)
    
    if doc_type:
        query = query.where(Document.doc_type == doc_type)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return documents


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a document"""
    
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check permission
    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this document"
        )
    
    # Delete file
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except Exception as e:
        logger.error(f"Error deleting file {document.file_path}: {e}")
    
    # Delete record
    await db.delete(document)
    await db.commit()
    
    logger.info(f"Document deleted: {document_id}")
    return None


@router.post("/{document_id}/verify", status_code=status.HTTP_200_OK)
async def verify_document(
    document_id: UUID,
    status_update: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify/approve document (admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can verify documents"
        )
    
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Update verification status
    if hasattr(document, 'verification_status'):
        document.verification_status = status_update
    
    if hasattr(document, 'verification_notes'):
        document.verification_notes = notes
    
    if hasattr(document, 'verified_at'):
        document.verified_at = datetime.utcnow()
    
    if hasattr(document, 'verified_by'):
        document.verified_by = current_user.id
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    logger.info(f"Document {document_id} verification status updated to {status_update}")
    
    return {
        "message": "Document status updated",
        "document_id": str(document_id),
        "status": status_update
    }
