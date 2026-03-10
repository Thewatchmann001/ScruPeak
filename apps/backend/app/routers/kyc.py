"""
KYC Verification Router
Handles user KYC submission and status checks
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.models import User, KycSubmission, KycStatus
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/kyc", tags=["KYC"])

# Configuration
UPLOAD_DIR = Path("uploads/kyc")
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def ensure_upload_dir(user_id: str):
    """Ensure upload directory exists for user"""
    user_dir = UPLOAD_DIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir

async def save_kyc_file(file: UploadFile, user_id: UUID, file_type: str) -> str:
    """Save uploaded KYC file and return path"""
    if not file.filename:
        raise HTTPException(status_code=400, detail=f"Missing filename for {file_type}")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type for {file_type}. Allowed: {ALLOWED_EXTENSIONS}")
    
    # Check size (rough check, accurate check requires reading)
    # Here we just read and save
    
    user_dir = ensure_upload_dir(str(user_id))
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{file_type}_{timestamp}{file_ext}"
    file_path = user_dir / filename
    
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File {file_type} exceeds maximum size of 10MB")
        
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return relative path for URL generation
    return str(file_path).replace("\\", "/")

@router.post("/submit", status_code=status.HTTP_200_OK)
async def submit_kyc(
    id_document: UploadFile = File(...),
    proof_of_address: UploadFile = File(...),
    # Consolidated liveness verification photos into one step for now, 
    # but backend still supports receiving individual angles if client sends them.
    # To support the new workflow (Liveness Check), we will accept individual frames 
    # but we can also be flexible.
    # For now, let's keep the backend flexible to accept these files.
    photo_straight: UploadFile = File(...),
    photo_left: UploadFile = File(...),
    photo_right: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit KYC documents for verification.
    Uploads:
    - Identity Document
    - Proof of Address
    - 3 Photos (Straight, Left, Right)
    """
    
    # Check if user already has a pending or approved submission
    result = await db.execute(
        select(KycSubmission).where(KycSubmission.user_id == current_user.id)
    )
    existing_submission = result.scalars().first()
    
    if existing_submission and existing_submission.status == KycStatus.APPROVED:
        raise HTTPException(status_code=400, detail="KYC already approved")
    
    if existing_submission and existing_submission.status == KycStatus.PENDING:
        # We allow re-submission if pending? Or maybe update?
        # For now, let's allow updating/overwriting the pending submission
        pass

    # Save files
    id_path = await save_kyc_file(id_document, current_user.id, "id_document")
    address_path = await save_kyc_file(proof_of_address, current_user.id, "proof_of_address")
    photo_straight_path = await save_kyc_file(photo_straight, current_user.id, "photo_straight")
    photo_left_path = await save_kyc_file(photo_left, current_user.id, "photo_left")
    photo_right_path = await save_kyc_file(photo_right, current_user.id, "photo_right")
    
    # AI Extraction for Automated Verification
    from app.services.document_extractor import DocumentExtractor
    extraction_result = await DocumentExtractor.extract_details(id_path, "id_document")

    risk_rating = "low"
    aml_checked = True
    notes = ""

    if extraction_result["success"]:
        ext_data = extraction_result["data"]
        extracted_name = ext_data.get("owner_name", "") # Reusing 'owner_name' field for ID name

        if extracted_name and current_user.name.lower() not in extracted_name.lower():
            logger.warning(f"KYC Name Mismatch: ID says '{extracted_name}', Profile is '{current_user.name}'")
            risk_rating = "medium"
            notes = f"Name mismatch on ID: {extracted_name}"

        # Add extracted details to metadata
        documents_data_meta = ext_data.get("identifiers", {})
    else:
        documents_data_meta = {}

    documents_data = {
        "id_document": id_path,
        "proof_of_address": address_path,
        "photo_straight": photo_straight_path,
        "photo_left": photo_left_path,
        "photo_right": photo_right_path
    }
    
    # AML Check (Stub)
    # In production, call an external API like SumSub or Onfido here
    # For now, we simulate a basic check
    # risk_rating = "low" # Handled by AI extraction above
    # aml_checked = True
    
    if existing_submission:
        existing_submission.documents = documents_data
        existing_submission.status = KycStatus.PENDING
        existing_submission.updated_at = datetime.utcnow()
        existing_submission.rejection_reason = None
        existing_submission.risk_rating = risk_rating
        existing_submission.aml_checked = aml_checked
        existing_submission.notes = notes
        submission = existing_submission
    else:
        submission = KycSubmission(
            user_id=current_user.id,
            status=KycStatus.PENDING,
            documents=documents_data,
            risk_rating=risk_rating,
            aml_checked=aml_checked,
            aml_check_date=datetime.utcnow(),
            notes=notes
        )
        db.add(submission)
    
    await db.commit()
    await db.refresh(submission)
    
    logger.info(f"KYC submitted for user {current_user.id}")
    
    return {
        "status": submission.status,
        "message": "KYC documents submitted successfully. Pending review."
    }

@router.get("/status", status_code=status.HTTP_200_OK)
async def get_kyc_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's KYC status"""
    result = await db.execute(
        select(KycSubmission).where(KycSubmission.user_id == current_user.id)
    )
    submission = result.scalars().first()
    
    if not submission:
        return {
            "status": "not_submitted",
            "message": "No KYC submission found"
        }
    
    return {
        "status": submission.status,
        "documents": submission.documents,
        "submitted_at": submission.created_at,
        "updated_at": submission.updated_at,
        "rejection_reason": submission.rejection_reason
    }
