import { createPasswordResetToken, publicUserSelect, toPublicUser } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  isValidEmail,
  normalizeEmail,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

type ForgotPasswordBody = {
  email?: unknown;
};

function buildResetUrl(request: Request, token: string) {
  const url = new URL('/reset-password', request.url);
  url.searchParams.set('token', token);
  return url.toString();
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<ForgotPasswordBody>(request);
    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email)) {
      throw new HttpError('Enter a valid email address.', 400, {
        email: 'Enter a valid email address.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: publicUserSelect
    });

    if (!user) {
      return successResponse({
        message: 'If an account exists for that email, a password reset link has been sent.'
      });
    }

    const resetToken = createPasswordResetToken();

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id
        }
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: resetToken.tokenHash,
          expiresAt: resetToken.expiresAt
        }
      })
    ]);

    const publicUser = toPublicUser(user);

    await sendPasswordResetEmail({
      to: publicUser.email,
      name: publicUser.name,
      resetUrl: buildResetUrl(request, resetToken.token)
    });

    return successResponse({
      message: 'If an account exists for that email, a password reset link has been sent.'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
