import logging
import asyncio
from typing import List, Dict, Any, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from app.core.config import get_settings
from pathlib import Path

logger = logging.getLogger(__name__)
settings = get_settings()

# Email Configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.EMAIL_USER,
    MAIL_PASSWORD=settings.EMAIL_PASSWORD,
    MAIL_FROM=settings.EMAIL_USER if settings.EMAIL_USER else "noreply@scrupeak.com",
    MAIL_PORT=settings.EMAIL_PORT,
    MAIL_SERVER=settings.EMAIL_HOST,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_email_async(subject: str, recipients: List[EmailStr], body: str, max_retries: int = 3):
    """
    Send email using FastAPI-Mail (Async) with linear backoff retry logic.
    Ensures background tasks don't fail permanently on transient network or SMTP issues.
    """
    if not settings.EMAIL_ENABLED or not settings.EMAIL_USER:
        logger.info(f"EMAIL_ENABLED is False or missing credentials. Mocking email send.")
        logger.info(f"To: {recipients}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {body}")
        return True

    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=MessageType.html
    )

    fm = FastMail(conf)

    for attempt in range(max_retries):
        try:
            await fm.send_message(message)
            logger.info(f"Email sent successfully to {recipients}")
            return True
        except Exception as e:
            wait_time = (attempt + 1) * 3  # Backoff: 3s, 6s, 9s
            logger.warning(f"Email attempt {attempt + 1} failed for {recipients}: {str(e)}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Max retries reached for email to {recipients}. Task abandoned.")

    return False

async def send_verification_email(to_email: str, token: str):
    """Send verification email with token"""
    subject = "Verify your ScruPeak Account"
    verification_link = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"
    
    body = f"""
    <html>
        <body>
            <h1>Welcome to ScruPeak!</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="{verification_link}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>Or copy this link: {verification_link}</p>
        </body>
    </html>
    """
    return await send_email_async(subject, [to_email], body)

async def send_transaction_status_email(
    recipients: List[EmailStr],
    subject: str,
    main_message: str,
    pdf_url: Optional[str] = None,
    tx_hash: Optional[str] = None
):
    """
    Personalized transaction template including title and blockchain verification links.
    """
    explorer_url = getattr(settings, "BLOCKCHAIN_EXPLORER_URL", "https://solscan.io/tx")
    
    link_content = ""
    if pdf_url:
        link_content += f"""
            <div style='margin: 15px 0;'>
                <a href="{pdf_url}" style="background-color: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Digital Title Deed</a>
            </div>
        """
    
    if tx_hash:
        link_content += f"""
            <p style='margin-top: 25px; font-size: 14px;'>
                <strong>Blockchain Notarization:</strong><br/>
                <code style='background: #f3f4f6; padding: 4px; border-radius: 3px;'>{tx_hash}</code><br/>
                <a href="{explorer_url}/{tx_hash}" target="_blank" style="color: #2563eb;">Verify Authenticity on Explorer &rarr;</a>
            </p>
        """

    body = f"""
    <html>
        <body style="font-family: sans-serif; color: #374151; line-height: 1.5;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="color: #047857; margin-top: 0;">ScruPeak Transaction Update</h2>
                <p>{main_message}</p>
                
                {link_content}
                
                <p style="margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 15px;">
                    Secure Land Administration System. All titles are cryptographically signed.
                </p>
            </div>
        </body>
    </html>
    """
    return await send_email_async(subject, recipients, body)

async def send_reset_password_email(to_email: str, token: str):
    """Send reset password email with token"""
    subject = "Reset your ScruPeak Password"
    reset_link = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
    
    body = f"""
    <html>
        <body>
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <a href="{reset_link}" style="padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>Or copy this link: {reset_link}</p>
            <p>If you did not request this, please ignore this email.</p>
        </body>
    </html>
    """
    return await send_email_async(subject, [to_email], body)
