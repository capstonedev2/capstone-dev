import { hashPassword, hashResetToken, validatePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  normalizeText,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

type ResetPasswordBody = {
  token?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  confirm_password?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<ResetPasswordBody>(request);
    const token = normalizeText(body.token);
    const password = normalizeText(body.password);
    const confirmPassword = normalizeText(body.confirmPassword ?? body.confirm_password ?? body.password);
    const fieldErrors: Record<string, string> = {};

    if (!token) {
      fieldErrors.token = 'Reset token is required.';
    }

    if (!password) {
      fieldErrors.password = 'Please enter a new password.';
    } else {
      try {
        validatePassword(password);
      } catch (error) {
        if (error instanceof HttpError) {
          Object.assign(fieldErrors, error.fieldErrors);
        }
      }
    }

    if (password !== confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(fieldErrors).length) {
      throw new HttpError('Please correct the highlighted fields and try again.', 400, fieldErrors);
    }

    const tokenHash = hashResetToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
      throw new HttpError('This reset link is invalid or has expired.', 400, {
        token: 'Request a new password reset link.'
      });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId }
      })
    ]);

    return successResponse({
      message: 'Password updated successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
