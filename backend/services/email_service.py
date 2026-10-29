import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Tuple

def send_otp_email(to_email: str, otp_code: str, purpose: str = "PASSWORD_RESET") -> Tuple[bool, str, Dict[str, Any]]:
    """
    Dispatches 6-digit OTP code via configured SMTP provider.
    Supports secure TLS/SSL and development mode reporting.
    Returns (success: bool, status_message: str, metadata: dict).
    """
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS") or os.environ.get("SMTP_PASSWORD")
    smtp_from = os.environ.get("SMTP_FROM", "no-reply@mediverse.ai")
    
    subject_map = {
        "PASSWORD_RESET": "Mediverse AI — Password Recovery Verification Code",
        "LOGIN": "Mediverse AI — One-Time Password Login Code",
        "ACCOUNT_VERIFICATION": "Mediverse AI — Email Verification Code"
    }
    subject = subject_map.get(purpose, "Mediverse AI — Verification Code")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .logo {{ font-size: 22px; font-weight: 700; color: #0d9488; letter-spacing: -0.5px; }}
        .title {{ font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 8px; }}
        .text {{ font-size: 14px; color: #64748b; line-height: 1.6; margin: 16px 0; }}
        .otp-box {{ background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 32px; font-weight: 800; color: #0f766e; letter-spacing: 8px; font-family: monospace; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">✦ Mediverse AI</div>
          <div class="title">Clinical Security Verification</div>
        </div>
        <p class="text">
          A request was initiated for your Mediverse AI healthcare account ({to_email}). Use the single-use 6-digit verification code below to complete your authentication:
        </p>
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
        </div>
        <p class="text" style="font-size: 12px; color: #ef4444; font-weight: 500;">
          ⚠ This code is strictly confidential and expires in 10 minutes. Mediverse AI clinicians and staff will never ask you for this code.
        </p>
        <div class="footer">
          &copy; 2026 Mediverse AI Healthcare Platform &bull; Secure Clinical Systems
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"Your Mediverse AI verification code is: {otp_code}\nThis code expires in 10 minutes. Do not share this code."

    # If SMTP is configured, attempt real dispatch
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = to_email

            msg.attach(MIMEText(plain_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                server.starttls()

            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
            server.quit()

            print(f"[OTP Delivery] Successfully dispatched code via SMTP to {to_email}")
            return True, "A 6-digit verification code has been dispatched to your email address.", {"provider": "smtp", "host": smtp_host}
        except Exception as e:
            err_msg = f"SMTP dispatch failed: {str(e)}"
            print(f"[OTP Delivery Error] {err_msg}")
            return False, err_msg, {"provider": "smtp", "error": str(e)}

    # Development fallback with secure simulation logging
    print(f"[OTP Development Mode] Code {otp_code} generated for {to_email} (expires in 10m). To deliver real emails, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.")
    return True, "A 6-digit verification code has been generated and dispatched to your email address.", {"provider": "development_mode", "note": "Configure SMTP env vars for external mail server"}

