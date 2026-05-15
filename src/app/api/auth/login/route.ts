import {
  ensureAuthConfig,
  isAccountSuspended,
  publicUserSelect,
  restoreExpiredSuspension,
  setAuthCookie,
  signAuthToken,
  toPublicUser,
  verifyPassword
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

type LoginBody = {
  identifier?: unknown;
  password?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    ensureAuthConfig();

    const body = await parseJsonBody<LoginBody>(request);
    const identifier = normalizeText(body.identifier);
    const password = normalizeText(body.password);
    const fieldErrors: Record<string, string> = {};

    if (!identifier) {
      fieldErrors.identifier = 'Please enter your Student ID or email address.';
    }

    if (!password) {
      fieldErrors.password = 'Please enter your password.';
    }

    if (Object.keys(fieldErrors).length) {
      throw new HttpError('Please correct the highlighted fields and try again.', 400, fieldErrors);
    }

    // Auto-detect: if it looks like an email, search by email; otherwise by studentId
    const isEmail = emailPattern.test(identifier);

    const user = await prisma.user.findUnique({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { studentId: identifier },
      select: {
        ...publicUserSelect,
        passwordHash: true
      }
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError('Invalid credentials.', 401, {
        password: 'The Student ID/email or password is incorrect.'
      });
    }

    const authUser = await restoreExpiredSuspension(user);

    if (isAccountSuspended(authUser)) {
      throw new HttpError('This account has been suspended. Contact your administrator for assistance.', 403);
    }

    const token = signAuthToken(authUser);
    const response = successResponse({ user: toPublicUser(authUser) });
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
