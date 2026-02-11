import io
import hashlib
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from uuid import UUID

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.colors import black, blue, red
from reportlab.lib.units import inch

from jose import jwt, jws

class PdfSignerService:
    """
    Service for digitally signing PDFs with visual overlays and cryptographic seals.
    """
    
    # In production, load this from secure storage (HSM/Key Vault)
    # This is a generated RSA key or similar for the platform
    PLATFORM_PRIVATE_KEY = "SECRET_KEY_FOR_SIGNING" 
    ALGORITHM = "HS256" # Use RS256 with proper keys in production

    @staticmethod
    def sign_document(
        pdf_bytes: bytes,
        signatures: List[Dict],
        request_id: UUID,
        certificate_number: str
    ) -> Tuple[bytes, str]:
        """
        Apply visual signatures to a PDF and append a certificate page.
        
        Args:
            pdf_bytes: Original PDF content
            signatures: List of signature dicts:
                {
                    'page_number': int (1-based),
                    'x': int,
                    'y': int,
                    'text': str, # Name or initials
                    'image_bytes': Optional[bytes], # Signature image
                    'signer_name': str,
                    'signed_at': datetime
                }
            request_id: ID of the signature request
            certificate_number: Unique certificate ID
            
        Returns:
            (signed_pdf_bytes, document_hash)
        """
        
        # 1. Prepare Base PDF
        packet = io.BytesIO()
        # Create a new PDF with Reportlab
        can = canvas.Canvas(packet, pagesize=A4)
        
        # 2. Draw Visual Signatures
        # Group signatures by page to optimize
        sigs_by_page = {}
        for sig in signatures:
            page = sig.get('page_number', 1)
            if page not in sigs_by_page:
                sigs_by_page[page] = []
            sigs_by_page[page].append(sig)
            
        # We need to iterate through existing pages and overlay
        # Since Reportlab creates a full PDF, we'll create a "watermark" PDF 
        # for each page that has signatures, then merge.
        
        # Better approach: Create a single watermark PDF with multiple pages corresponding to the original?
        # No, easier to merge page by page.
        
        original_pdf = PdfReader(io.BytesIO(pdf_bytes))
        output = PdfWriter()
        
        for i, page in enumerate(original_pdf.pages):
            page_num = i + 1
            if page_num in sigs_by_page:
                # Create watermark for this page
                overlay_buffer = io.BytesIO()
                c = canvas.Canvas(overlay_buffer, pagesize=(float(page.mediabox.width), float(page.mediabox.height)))
                
                for sig in sigs_by_page[page_num]:
                    x = sig.get('x', 100)
                    y = sig.get('y', 100)
                    text = sig.get('text', '')
                    signer = sig.get('signer_name', 'Signer')
                    date_str = sig.get('signed_at', datetime.utcnow()).strftime("%Y-%m-%d %H:%M")
                    
                    # Draw text signature
                    c.setFont("Helvetica", 10)
                    c.setFillColor(black)
                    c.drawString(x, y, f"Signed by: {signer}")
                    c.setFont("Helvetica-Oblique", 8)
                    c.drawString(x, y - 10, f"Date: {date_str}")
                    c.drawString(x, y - 20, f"ID: {str(request_id)[:8]}")
                    
                    # If image exists (e.g. drawn signature), draw it
                    # image_data = sig.get('image_bytes')
                    # if image_data:
                    #     image = ImageReader(io.BytesIO(image_data))
                    #     c.drawImage(image, x, y + 10, width=100, height=50, mask='auto')
                
                c.save()
                overlay_buffer.seek(0)
                
                # Merge
                overlay_pdf = PdfReader(overlay_buffer)
                page.merge_page(overlay_pdf.pages[0])
            
            output.add_page(page)
            
        # 3. Append Certificate Page
        cert_buffer = io.BytesIO()
        c = canvas.Canvas(cert_buffer, pagesize=A4)
        width, height = A4
        
        # Header
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width / 2, height - 100, "Digital Signature Certificate")
        
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2, height - 130, f"Certificate Number: {certificate_number}")
        c.drawCentredString(width / 2, height - 150, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        
        # Line
        c.line(50, height - 170, width - 50, height - 170)
        
        # Signers List
        y = height - 200
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Signatures:")
        y -= 30
        
        c.setFont("Helvetica", 12)
        for sig in signatures:
            signer = sig.get('signer_name', 'Unknown')
            date_str = sig.get('signed_at', datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S UTC")
            ip = sig.get('ip_address', 'N/A')
            
            c.drawString(70, y, f"• Signed by {signer}")
            y -= 20
            c.setFont("Helvetica-Oblique", 10)
            c.setFillColor(black)
            c.drawString(90, y, f"Timestamp: {date_str}")
            y -= 15
            c.drawString(90, y, f"IP Address: {ip}")
            y -= 30
            c.setFont("Helvetica", 12)
            c.setFillColor(black)
            
        # Document Hash
        # We need the hash of the *content* before this page, but simpler to just hash the original + signatures
        # For this certificate, we'll hash the original content ID
        
        y -= 50
        c.line(50, y, width - 50, y)
        y -= 30
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y, "Cryptographic Seal:")
        y -= 20
        c.setFont("Courier", 8)
        
        # Create a JWS token as the "Seal"
        payload = {
            "req_id": str(request_id),
            "cert_num": certificate_number,
            "timestamp": datetime.utcnow().isoformat(),
            "signers": [s.get('signer_name') for s in signatures]
        }
        token = jwt.encode(payload, PdfSignerService.PLATFORM_PRIVATE_KEY, algorithm=PdfSignerService.ALGORITHM)
        
        # Split token into lines
        chunks = [token[i:i+80] for i in range(0, len(token), 80)]
        for chunk in chunks:
            c.drawString(50, y, chunk)
            y -= 10
            
        c.save()
        cert_buffer.seek(0)
        
        cert_pdf = PdfReader(cert_buffer)
        output.add_page(cert_pdf.pages[0])
        
        # 4. Final Output
        final_buffer = io.BytesIO()
        output.write(final_buffer)
        final_bytes = final_buffer.getvalue()
        
        # Generate Hash of Final Document
        doc_hash = hashlib.sha256(final_bytes).hexdigest()
        
        return final_bytes, doc_hash
