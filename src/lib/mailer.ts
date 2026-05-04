import nodemailer from 'nodemailer';
import { getRequiredEnv } from '@/lib/utils';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: getRequiredEnv('EMAIL_USER'),
      pass: getRequiredEnv('EMAIL_PASS')
    }
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const from = getRequiredEnv('EMAIL_USER');

  return createTransporter().sendMail({
    from,
    to,
    subject,
    html,
    text
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmailInput) {
  const subject = 'Reset your ThesisTrack password';
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);
  const text = `Hi ${name},\n\nUse this link to reset your ThesisTrack password:\n${resetUrl}\n\nThis link expires in 1 hour.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px;color:#003A8F">Reset your ThesisTrack password</h2>
      <p>Hi ${safeName},</p>
      <p>Use the secure link below to set a new password. This link expires in 1 hour.</p>
      <p>
        <a href="${safeResetUrl}" style="display:inline-block;background:#003A8F;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">
          Reset password
        </a>
      </p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}
