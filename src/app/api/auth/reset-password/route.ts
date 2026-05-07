import { type NextRequest } from 'next/server';
import {
  PASSWORD_RESET_SESSION_COOKIE_NAME,
  hashPassword,
  hashResetToken
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  normalizeText,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

const RESET_PASSWORD_MIN_LENGTH = 8;

type ResetPasswordBody = {
  password?: unknown;
  confirmPassword?: unknown;
  confirm_password?: unknown;
};

function resetSessionError() {
  return new HttpError('Reset session has expired. Request a new code.', 401);
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<ResetPasswordBody>(request);
    const password = normalizeText(body.password);
    const confirmPassword = normalizeText(body.confirmPassword ?? body.confirm_password);
    const fieldErrors: Record<string, string> = {};

    if (!password) {
      fieldErrors.password = 'Please enter a new password.';
    } else if (password.length < RESET_PASSWORD_MIN_LENGTH) {
      fieldErrors.password = `Use at least ${RESET_PASSWORD_MIN_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      fieldErrors.confirmPassword = 'Please confirm your new password.';
    } else if (password !== confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(fieldErrors).length) {
      throw new HttpError('Please correct the highlighted fields and try again.', 400, fieldErrors);
    }

    const sessionToken = request.cookies.get(PASSWORD_RESET_SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      throw resetSessionError();
    }

    const resetTokenHash = hashResetToken(sessionToken);
    const resetCode = await prisma.passwordResetCode.findUnique({
      where: {
        resetTokenHash
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        verifiedAt: true
      }
    });

    if (
      !resetCode ||
      resetCode.usedAt ||
      !resetCode.verifiedAt ||
      resetCode.expiresAt.getTime() <= Date.now()
    ) {
      throw resetSessionError();
    }

    const passwordHash = await hashPassword(password);
    const usedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: resetCode.userId
        },
        data: {
          passwordHash
        }
      });

      await tx.passwordResetCode.update({
        where: {
          id: resetCode.id
        },
        data: {
          usedAt
        }
      });

      await tx.passwordResetCode.updateMany({
        where: {
          userId: resetCode.userId,
          usedAt: null,
          id: {
            not: resetCode.id
          }
        },
        data: {
          usedAt
        }
      });
    });

    const response = successResponse({
      message: 'Password updated successfully. You can now sign in with your new password.'
    });

    response.cookies.set(PASSWORD_RESET_SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
