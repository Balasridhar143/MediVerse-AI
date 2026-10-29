import nodemailer from 'nodemailer';

/**
 * Dispatch OTP verification code using configured SMTP or return explicit failure.
 * Never claims an email was sent if credentials are not configured or dispatch fails.
 */
export async function sendOtpEmail(toEmail, otpCode, purpose = 'PASSWORD_RESET') {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const from = process.env.SMTP_FROM || '"MediVerse AI Security" <security@mediverse.org>';

  if (!host || !user || !pass) {
    console.warn(`[Email Service] SMTP provider not configured in environment variables. OTP code ${otpCode} was NOT dispatched via email to ${toEmail}.`);
    return {
      sent: false,
      configured: false,
      reason: 'SMTP email provider credentials are not configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).'
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });

    const isReset = purpose === 'PASSWORD_RESET';
    const subject = isReset
      ? 'MediVerse AI — Password Recovery Verification Code'
      : 'MediVerse AI — Secure Login Verification Code';

    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      text: `Your MediVerse AI verification code is ${otpCode}. This code is valid for 10 minutes.\n\nIf you did not request this verification, please secure your account immediately.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0d9488; font-size: 24px; margin: 0;">MediVerse AI</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Integrated Telemedicine & Clinical Health Platform</p>
          </div>
          <p style="color: #1e293b; font-size: 15px;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">
            You requested a verification code for <strong>${isReset ? 'Password Recovery' : 'Account Access'}</strong>. Enter the following 6-digit code to continue:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 28px; border-radius: 8px;">
              ${otpCode}
            </div>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            This verification code is valid for <strong>10 minutes</strong>. For your clinical data security, never disclose this code to anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            If you did not initiate this request, no action is needed or you can contact your hospital administrator.
          </p>
        </div>
      `,
    });

    console.log(`[Email Service] Verification OTP email successfully delivered to ${toEmail}`);
    return { sent: true, configured: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send email to ${toEmail}:`, err.message);
    return {
      sent: false,
      configured: true,
      reason: `SMTP delivery failed: ${err.message}`
    };
  }
}
