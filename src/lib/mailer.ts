import path from 'node:path';
import nodemailer from 'nodemailer';
import { SYSTEM_LOGO_SRC } from '@/lib/branding';
import { getRequiredEnv } from '@/lib/utils';

type EmailAttachment = {
  filename: string;
  path: string;
  cid: string;
  contentDisposition: 'inline';
};

type SendEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text: string;
  attachments?: EmailAttachment[];
};

type PasswordResetCodeEmailInput = {
  to: string;
  code: string;
};

type AccountSuspensionEmailInput = {
  to: string;
  name?: string | null;
  durationLabel?: string;
};

type AccountRestoreEmailInput = {
  to: string;
  name?: string | null;
};

const EMAIL_LOGO_CID = 'thesistrack-logo';
const EMAIL_LOGO_PATH = path.join(process.cwd(), 'public', decodeURIComponent(SYSTEM_LOGO_SRC).replace(/^\//, ''));

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

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailInput) {
  const config = getSmtpConfig();

  return createTransporter().sendMail({
    from: config.from,
    to,
    subject,
    html,
    text,
    attachments
  });
}

function getEmailLogoAttachment(): EmailAttachment[] {
  return [
    {
      filename: 'thesistrack-logo.png',
      path: EMAIL_LOGO_PATH,
      cid: EMAIL_LOGO_CID,
      contentDisposition: 'inline'
    }
  ];
}

function renderEmailHeader(subtitle: string) {
  return `
    <td style="background:#003A8F;padding:20px 28px;border-bottom:4px solid #F6BE00">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
        <tr>
          <td width="58" style="width:58px;vertical-align:middle;padding-right:14px">
            <img src="cid:${EMAIL_LOGO_CID}" alt="ThesisTrack logo" width="46" height="46" style="display:block;width:46px;height:46px;border:0;border-radius:10px;background:#ffffff" />
          </td>
          <td style="vertical-align:middle">
            <div style="font-size:22px;font-weight:800;letter-spacing:0;color:#ffffff">
              Thesis<span style="color:#F6BE00">Track</span>
            </div>
            <div style="margin-top:6px;font-size:13px;font-weight:600;color:#dbeafe">
              ${subtitle}
            </div>
          </td>
        </tr>
      </table>
    </td>
  `;
}

function renderEmailFooter() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      <tr>
        <td align="center" style="padding-bottom:10px">
          <img src="cid:${EMAIL_LOGO_CID}" alt="ThesisTrack" width="28" height="28" style="display:block;width:28px;height:28px;border:0;border-radius:7px" />
        </td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b">
            This is an automated message from ThesisTrack. Please do not reply to this email.
          </p>
        </td>
      </tr>
    </table>
  `;
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
                ${renderEmailHeader('Password Reset Verification')}
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
                  ${renderEmailFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return sendEmail({ to, subject, html, text, attachments: getEmailLogoAttachment() });
}

export async function sendAccountSuspensionEmail({ to, name, durationLabel }: AccountSuspensionEmailInput) {
  const displayName = name?.trim() || 'User';
  const durationText = durationLabel ? ` for ${durationLabel}` : '';
  const subject = 'ThesisTrack Account Suspended';
  const text = `Hello ${displayName},

We are writing to inform you that access to your ThesisTrack account has been temporarily suspended${durationText}.

During this period, you may be unable to sign in or use protected portal features.

If you believe this action was made in error, please contact the system administrator for assistance.

Thank you,
ThesisTrack System`;
  const html = `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6fb;margin:0;padding:0">
        <tr>
          <td align="center" style="padding:28px 16px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:600px;background:#ffffff;border:1px solid #dbe4f0;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(0,58,143,0.12)">
              <tr>
                ${renderEmailHeader('Account Access Update')}
              </tr>
              <tr>
                <td style="padding:30px 28px 20px">
                  <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#111827">Hello ${displayName},</p>
                  <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#111827">
                    We are writing to inform you that access to your ThesisTrack account has been temporarily suspended${durationText}.
                  </p>
                  <div style="margin:0 0 22px;padding:16px 18px;border:1px solid #fecaca;border-left:4px solid #ef4444;background:#fef2f2;border-radius:10px">
                    <div style="margin:0 0 6px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#991b1b">
                      Access temporarily restricted
                    </div>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#374151">
                      During this period, you may be unable to sign in or use protected portal features.
                    </p>
                  </div>
                  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151">
                    If you believe this action was made in error, please contact the system administrator for assistance.
                  </p>
                  <div style="margin:0 0 24px;padding:14px 16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#475569">
                      This notice was generated automatically after an administrator updated your account access.
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
                  ${renderEmailFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return sendEmail({ to, subject, html, text, attachments: getEmailLogoAttachment() });
}

export async function sendAccountRestoreEmail({ to, name }: AccountRestoreEmailInput) {
  const displayName = name?.trim() || 'User';
  const subject = 'ThesisTrack Account Restored';
  const text = `Hello ${displayName},

Access to your ThesisTrack account has been restored. You can sign in again using your account credentials.

Thank you,
ThesisTrack System`;
  const html = `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f3f6fb;margin:0;padding:0">
        <tr>
          <td align="center" style="padding:28px 16px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:600px;background:#ffffff;border:1px solid #dbe4f0;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(0,58,143,0.12)">
              <tr>
                ${renderEmailHeader('Account Access Update')}
              </tr>
              <tr>
                <td style="padding:30px 28px 20px">
                  <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#111827">Hello ${displayName},</p>
                  <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#111827">
                    Access to your ThesisTrack account has been restored. You can sign in again using your account credentials.
                  </p>
                  <p style="margin:0;font-size:15px;line-height:1.6;color:#111827">
                    Thank you,<br />
                    <strong>ThesisTrack System</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px 28px;text-align:center">
                  ${renderEmailFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return sendEmail({ to, subject, html, text, attachments: getEmailLogoAttachment() });
}
