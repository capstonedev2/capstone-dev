import nodemailer from 'nodemailer';
import { getRequiredEnv } from '@/lib/utils';

type SendEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text: string;
};

type PasswordResetCodeEmailInput = {
  to: string;
  code: string;
};

function parseSmtpSecure(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error('SMTP_SECURE must be true or false.');
}

function getSmtpConfig() {
  const port = Number(getRequiredEnv('SMTP_PORT'));

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('SMTP_PORT must be a valid positive integer.');
  }

  return {
    host: getRequiredEnv('SMTP_HOST'),
    port,
    secure: parseSmtpSecure(getRequiredEnv('SMTP_SECURE')),
    user: getRequiredEnv('SMTP_USER'),
    pass: getRequiredEnv('SMTP_PASS'),
    from: getRequiredEnv('SMTP_FROM')
  };
}

function createTransporter() {
  const config = getSmtpConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

export function assertMailerConfig() {
  getSmtpConfig();
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const config = getSmtpConfig();

  return createTransporter().sendMail({
    from: config.from,
    to,
    subject,
    html,
    text
  });
}

export async function sendPasswordResetCodeEmail({ to, code }: PasswordResetCodeEmailInput) {
  const subject = 'ThesisTrack Password Reset Code';
  const text = `Hello,

We received a request to reset the password for your ThesisTrack account.

Please use the verification code below to continue resetting your password:

${code}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email. Your account password will remain unchanged.

Thank you,
ThesisTrack System`;
  const html = `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6fb;margin:0;padding:0">
        <tr>
          <td align="center" style="padding:28px 16px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:600px;background:#ffffff;border:1px solid #dbe4f0;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(0,58,143,0.12)">
              <tr>
                <td style="background:#003A8F;padding:22px 28px;border-bottom:4px solid #F6BE00">
                  <div style="font-size:22px;font-weight:800;letter-spacing:0;color:#ffffff">
                    Thesis<span style="color:#F6BE00">Track</span>
                  </div>
                  <div style="margin-top:6px;font-size:13px;font-weight:600;color:#dbeafe">
                    Password Reset Verification
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 28px 18px">
                  <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#111827">Hello,</p>
                  <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#111827">
                    We received a request to reset the password for your ThesisTrack account.
                  </p>
                  <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#111827">
                    Please use the verification code below to continue resetting your password:
                  </p>
                  <div style="margin:0 auto 22px;padding:18px 16px;border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;text-align:center">
                    <div style="font-size:34px;line-height:1.1;font-weight:800;letter-spacing:8px;color:#003A8F">
                      ${code}
                    </div>
                    <div style="margin-top:10px;font-size:13px;font-weight:700;color:#1E40AF">
                      Expires in 10 minutes
                    </div>
                  </div>
                  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151">
                    This code will expire in 10 minutes.
                  </p>
                  <div style="margin:0 0 24px;padding:14px 16px;border-left:4px solid #F6BE00;background:#fffbeb;border-radius:8px">
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#374151">
                      Security notice: If you did not request a password reset, you can safely ignore this email.
                      Your account password will remain unchanged.
                    </p>
                  </div>
                  <p style="margin:0;font-size:15px;line-height:1.6;color:#111827">
                    Thank you,<br />
                    <strong>ThesisTrack System</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px 28px;text-align:center">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b">
                    This is an automated message from ThesisTrack. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}
