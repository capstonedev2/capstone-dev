import path from 'node:path';
import nodemailer from 'nodemailer';
import { PASSWORD_RESET_CODE_TTL_MINUTES } from '@/lib/auth';


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

type AccountSuspensionEmailInput = {
  to: string;
  name?: string | null;
  durationLabel?: string;
};

type AccountRestoreEmailInput = {
  to: string;
  name?: string | null;
};

type ScheduleNotificationEmailInput = {
  to: string;
  name?: string | null;
  typeLabel: string;
  title: string;
  dateLabel: string;
  location?: string | null;
  notes?: string | null;
};

export async function sendPasswordResetCodeEmail({ to, code }: PasswordResetCodeEmailInput) {
  const subject = 'ThesisTrack Password Reset Code';
  const text = `Hello,

We received a request to reset the password for your ThesisTrack account.

Please use the verification code below to continue resetting your password:

${code}

This code will expire in ${PASSWORD_RESET_CODE_TTL_MINUTES} minutes.

If you did not request a password reset, you can safely ignore this email. Your account password will remain unchanged.

Thank you,
ThesisTrack System`;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #111827; max-width: 600px;">
      <p>Hello,</p>
      <p>We received a request to reset the password for your ThesisTrack account.</p>
      <p>Please use the verification code below to continue resetting your password:</p>
      <p style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${code}</p>
      <p>This code will expire in ${PASSWORD_RESET_CODE_TTL_MINUTES} minutes.</p>
      <p>If you did not request a password reset, you can safely ignore this email. Your account password will remain unchanged.</p>
      <p>Thank you,<br><strong>ThesisTrack System</strong></p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
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
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #111827; max-width: 600px;">
      <p>Hello ${displayName},</p>
      <p>We are writing to inform you that access to your ThesisTrack account has been temporarily suspended${durationText}.</p>
      <p>During this period, you may be unable to sign in or use protected portal features.</p>
      <p>If you believe this action was made in error, please contact the system administrator for assistance.</p>
      <p>Thank you,<br><strong>ThesisTrack System</strong></p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}

export async function sendAccountRestoreEmail({ to, name }: AccountRestoreEmailInput) {
  const displayName = name?.trim() || 'User';
  const subject = 'ThesisTrack Account Restored';
  const text = `Hello ${displayName},

Access to your ThesisTrack account has been restored. You can sign in again using your account credentials.

Thank you,
ThesisTrack System`;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #111827; max-width: 600px;">
      <p>Hello ${displayName},</p>
      <p>Access to your ThesisTrack account has been restored. You can sign in again using your account credentials.</p>
      <p>Thank you,<br><strong>ThesisTrack System</strong></p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}
export async function sendScheduleNotificationEmail({
  to,
  name,
  typeLabel,
  title,
  dateLabel,
  location,
  notes
}: ScheduleNotificationEmailInput) {
  const displayName = name?.trim() || 'Student';
  const subject = `New ${typeLabel} Scheduled: ${title}`;
  
  let text = `Hello ${displayName},\n\nA new ${typeLabel.toLowerCase()} has been scheduled by your adviser:\n\nTitle: ${title}\nDate & Time: ${dateLabel}\n`;
  if (location) text += `Location/Link: ${location}\n`;
  if (notes) text += `Notes: ${notes}\n`;
  text += `\nPlease check your ThesisTrack portal for more details.\n\nThank you,\nThesisTrack System`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #111827; max-width: 600px;">
      <p>Hello ${displayName},</p>
      <p>A new <strong>${typeLabel.toLowerCase()}</strong> has been scheduled by your adviser:</p>
      <ul style="list-style-type: none; padding: 0; margin: 16px 0; background: #f9fafb; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <li style="margin-bottom: 8px;"><strong>Title:</strong> ${title}</li>
        <li style="margin-bottom: 8px;"><strong>Date & Time:</strong> ${dateLabel}</li>
        ${location ? `<li style="margin-bottom: 8px;"><strong>Location/Link:</strong> ${location}</li>` : ''}
        ${notes ? `<li style="margin-bottom: 8px;"><strong>Notes:</strong> ${notes}</li>` : ''}
      </ul>
      <p>Please log in to your ThesisTrack portal for more details.</p>
      <p>Thank you,<br><strong>ThesisTrack System</strong></p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}
