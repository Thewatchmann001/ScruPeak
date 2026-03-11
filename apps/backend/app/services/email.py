import logging
from typing import List, Dict, Any
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

async def send_email_async(subject: str, recipients: List[EmailStr], body: str):
    """
    Send email using FastAPI-Mail (Async)
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
    
    try:
        await fm.send_message(message)
        logger.info(f"Email sent successfully to {recipients}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        # Don't raise exception to avoid crashing background tasks
        return False

async def send_verification_email(to_email: str, token: str):
    """Send verification email with token"""
    subject = "Verify your ScruPeak Account"
    # Detect frontend URL dynamically or from config in future
    verification_link = f"http://localhost:3002/auth/verify-email?token={token}"
    
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

async def send_reset_password_email(to_email: str, token: str):
    """Send reset password email with token"""
    subject = "Reset your ScruPeak Password"
    reset_link = f"http://localhost:3002/auth/reset-password?token={token}"
    
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
