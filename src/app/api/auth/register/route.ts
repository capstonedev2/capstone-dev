import crypto from 'node:crypto';
import { Prisma, UserRole } from '@/generated/prisma/client';
import {
  buildDisplayName,
  ensureAuthConfig,
  hashPassword,
  publicUserSelect,
  setAuthCookie,
  signAuthToken,
  toPublicUser,
  validatePassword
} from '@/lib/auth';
import {
  clearGoogleRegistrationCookie,
  getGoogleRegistrationContext
} from '@/lib/google-oauth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  isValidEmail,
  normalizeEmail,
  normalizeText,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  confirm_password?: unknown;
  name?: unknown;
  firstName?: unknown;
  first_name?: unknown;
  lastName?: unknown;
  last_name?: unknown;
  studentId?: unknown;
  student_id?: unknown;
  department?: unknown;
  yearLevel?: unknown;
  year_level?: unknown;
  role?: unknown;
  provider?: unknown;
};

export async function POST(request: Request) {
  try {
    ensureAuthConfig();

    const body = await parseJsonBody<RegisterBody>(request);
    const provider = normalizeText(body.provider).toLowerCase();
    const isGoogleRegistration = provider === 'google';
    const googleRegistrationContext = isGoogleRegistration
      ? getGoogleRegistrationContext(request)
      : null;

    if (isGoogleRegistration && !googleRegistrationContext) {
      throw new HttpError('Google registration session has expired. Start again from Google sign in.', 401);
    }

    const email = normalizeEmail(body.email);
    const password = normalizeText(body.password);
    const confirmPassword = normalizeText(body.confirmPassword ?? body.confirm_password ?? body.password);
    const firstName = normalizeText(body.firstName ?? body.first_name) || googleRegistrationContext?.firstName || '';
    const lastName = normalizeText(body.lastName ?? body.last_name) || googleRegistrationContext?.lastName || '';
    const studentId = normalizeText(body.studentId ?? body.student_id);
    const department = normalizeText(body.department);
    const yearLevel = normalizeText(body.yearLevel ?? body.year_level);
    const role = UserRole.STUDENT;
    const fieldErrors: Record<string, string> = {};

    if (!email) {
      fieldErrors.email = 'Please enter your email address.';
    } else if (!isValidEmail(email)) {
      fieldErrors.email = 'Enter a valid email address.';
    } else if (googleRegistrationContext && email !== googleRegistrationContext.email) {
      fieldErrors.email = 'Use the email from your verified Google account.';
    }

    if (!firstName) {
      fieldErrors.firstName = 'Please enter your first name.';
    }

    if (!lastName) {
      fieldErrors.lastName = 'Please enter your last name.';
    }

    if (!studentId) {
      fieldErrors.studentId = 'Please enter your student ID.';
    }

    if (!department) {
      fieldErrors.department = 'Please select your department.';
    }

    if (!yearLevel) {
      fieldErrors.yearLevel = 'Please select your year level.';
    }

    if (!isGoogleRegistration && !password) {
      fieldErrors.password = 'Please enter a password.';
    }

    if (!isGoogleRegistration && password) {
      try {
        validatePassword(password);
      } catch (error) {
        if (error instanceof HttpError) {
          Object.assign(fieldErrors, error.fieldErrors);
        }
      }
    }

    if (!isGoogleRegistration && password !== confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(fieldErrors).length) {
      throw new HttpError('Please correct the highlighted fields and try again.', 400, fieldErrors);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new HttpError(
        isGoogleRegistration
          ? 'This Google account is already registered. Use Continue with Google to sign in.'
          : 'An account with this email already exists.',
        409,
        {
          email: isGoogleRegistration
            ? 'Use Continue with Google to sign in.'
            : 'An account with this email already exists.'
        }
      );
    }

    if (googleRegistrationContext) {
      const existingGoogleUser = await prisma.user.findUnique({
        where: {
          googleSub: googleRegistrationContext.sub
        }
      });

      if (existingGoogleUser) {
        throw new HttpError('This Google account is already linked to a ThesisTrack account.', 409, {
          email: 'Use Continue with Google to sign in.'
        });
      }
    }

    if (studentId) {
      const existingStudent = await prisma.user.findUnique({
        where: { studentId }
      });

      if (existingStudent) {
        throw new HttpError('A student account with this ID already exists.', 409, {
          studentId: 'A student account with this ID already exists.'
        });
      }
    }

    const passwordHash = await hashPassword(
      isGoogleRegistration ? crypto.randomBytes(32).toString('hex') : password
    );
    const name = buildDisplayName({
      name: normalizeText(body.name),
      firstName,
      lastName,
      email
    });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        googleSub: googleRegistrationContext?.sub || null,
        name,
        firstName: firstName || null,
        lastName: lastName || null,
        studentId: studentId || null,
        department: department || null,
        yearLevel: yearLevel || null,
        role
      },
      select: publicUserSelect
    });

    const token = signAuthToken(user);
    const response = successResponse({ user: toPublicUser(user) }, 201);
    setAuthCookie(response, token);
    clearGoogleRegistrationCookie(response);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.map((value) => String(value))
        : [];
      const fieldErrors: Record<string, string> = {};

      if (target.includes('email')) {
        fieldErrors.email = 'An account with this email already exists.';
      }

      if (target.includes('studentId')) {
        fieldErrors.studentId = 'A student account with this ID already exists.';
      }

      if (target.includes('googleSub')) {
        fieldErrors.email = 'This Google account is already linked to a ThesisTrack account.';
      }

      return handleApiError(
        new HttpError(
          'Please correct the highlighted fields and try again.',
          409,
          Object.keys(fieldErrors).length ? fieldErrors : undefined
        )
      );
    }

    return handleApiError(error);
  }
}
