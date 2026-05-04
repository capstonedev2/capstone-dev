import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/utils';

export const runtime = 'nodejs';

/**
 * POST /api/auth/reset-all-passwords
 *
 * Temporary dev-only endpoint that resets every user's password
 * to "password123" so you can log in while debugging.
 *
 * ⚠️  DELETE THIS FILE before deploying to production.
 */
export async function POST() {
  try {
    const newPlainPassword = 'password123';
    const newHash = await hashPassword(newPlainPassword);

    const result = await prisma.user.updateMany({
      data: { passwordHash: newHash },
    });

    return successResponse({
      message: `Reset ${result.count} user(s) to password "${newPlainPassword}".`,
      count: result.count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
