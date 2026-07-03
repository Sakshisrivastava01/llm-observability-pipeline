from app.core.config import settings
from app.core.logging import logger
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def send_password_reset_email(to_email: str, otp: str) -> bool:
    if not settings.SENDGRID_API_KEY:
        logger.warning(
            "SENDGRID_API_KEY not configured. Password reset email skipped.",
            email=to_email,
            otp=otp,
        )
        return False

    reset_link = (
        f"https://llm-observability-pipeline.vercel.app/reset-password?token={otp}"
    )
    message = Mail(
        from_email=settings.SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject="Reset your LLM Observe password",
        html_content=f"""
        <p>You requested to reset your password.</p>
        <p>Your OTP is: <strong>{otp}</strong></p>
        <p>Or click this link to reset your password:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>This code expires in 15 minutes.</p>
        """,
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(
            "Password reset email sent successfully",
            status_code=response.status_code,
            email=to_email,
        )
        return True
    except Exception as e:
        logger.error(
            "Failed to send password reset email",
            error=str(e),
            email=to_email,
        )
        return False
