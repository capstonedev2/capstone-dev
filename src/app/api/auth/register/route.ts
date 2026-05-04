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
};

export async function POST(request: Request) {
  try {
    ensureAuthConfig();

    const body = await parseJsonBody<RegisterBody>(request);
    const email = normalizeEmail(body.email);
    const password = normalizeText(body.password);
    const confirmPassword = normalizeText(body.confirmPassword ?? body.confirm_password ?? body.password);
    const firstName = normalizeText(body.firstName ?? body.first_name);
    const lastName = normalizeText(body.lastName ?? body.last_name);
    const studentId = normalizeText(body.studentId ?? body.student_id);
    const department = normalizeText(body.department);
    const yearLevel = normalizeText(body.yearLevel ?? body.year_level);
    const role = UserRole.STUDENT;
    const fieldErrors: Record<string, string> = {};

    if (!email) {
      fieldErrors.email = 'Please enter your email address.';
    } else if (!isValidEmail(email)) {
      fieldErrors.email = 'Enter a valid email address.';
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

    if (!password) {
      fieldErrors.password = 'Please enter a password.';
    }

    if (password) {
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

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new HttpError('An account with this email already exists.', 409, {
        email: 'An account with this email already exists.'
      });
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

    const passwordHash = await hashPassword(password);
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
