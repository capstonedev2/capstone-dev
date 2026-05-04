import { Prisma, UserRole } from '@/generated/prisma/client';
import {
  buildDisplayName,
  hashPassword,
  parseUserRole,
  publicUserSelect,
  requireAuthenticatedUser,
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

const USER_DIRECTORY_ROLES: UserRole[] = [
  UserRole.SYSTEM_ADMIN,
  UserRole.RESEARCH_HEAD,
  UserRole.ADMIN,
  UserRole.PROGRAM_HEAD
];

const MANAGED_USER_ROLES: UserRole[] = [UserRole.SYSTEM_ADMIN, UserRole.PROGRAM_HEAD];

type CreateUserBody = {
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  name?: unknown;
  role?: unknown;
  studentId?: unknown;
  department?: unknown;
  yearLevel?: unknown;
};

function validateManagedUserInput({
  email,
  firstName,
  lastName,
  password,
  confirmPassword,
  role,
  studentId,
  department,
  yearLevel,
  requirePassword
}: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  studentId: string;
  department: string;
  yearLevel: string;
  requirePassword: boolean;
}) {
  const fieldErrors: Record<string, string> = {};

  if (!email) {
    fieldErrors.email = 'Please enter an email address.';
  } else if (!isValidEmail(email)) {
    fieldErrors.email = 'Enter a valid email address.';
  }

  if (!firstName) {
    fieldErrors.firstName = 'Please enter a first name.';
  }

  if (!lastName) {
    fieldErrors.lastName = 'Please enter a last name.';
  }

  if (!department) {
    fieldErrors.department = 'Please enter a department.';
  }

  if (role === UserRole.STUDENT) {
    if (!studentId) {
      fieldErrors.studentId = 'Please enter a student ID.';
    }

    if (!yearLevel) {
      fieldErrors.yearLevel = 'Please enter a year level.';
    }
  }

  if (requirePassword && !password) {
    fieldErrors.password = 'Please enter a temporary password.';
  }

  if (password) {
    try {
      validatePassword(password);
    } catch (error) {
      if (error instanceof HttpError && error.fieldErrors) {
        Object.assign(fieldErrors, error.fieldErrors);
      }
    }
  }

  if ((requirePassword || password || confirmPassword) && password !== confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(fieldErrors).length) {
    throw new HttpError('Please correct the highlighted fields and try again.', 400, fieldErrors);
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await requireAuthenticatedUser(request, USER_DIRECTORY_ROLES);

    const whereClause: Prisma.UserWhereInput = {};

    if (authUser.role === UserRole.PROGRAM_HEAD) {
      whereClause.role = {
        in: [UserRole.STUDENT, UserRole.ADVISER]
      };

      if (authUser.department) {
        whereClause.department = authUser.department;
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      select: publicUserSelect
    });

    return successResponse({
      users: users.map(toPublicUser)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireAuthenticatedUser(request, MANAGED_USER_ROLES);

    const body = await parseJsonBody<CreateUserBody>(request);
    const email = normalizeEmail(body.email);
    const password = normalizeText(body.password);
    const confirmPassword = normalizeText(body.confirmPassword ?? body.password);
    const firstName = normalizeText(body.firstName);
    const lastName = normalizeText(body.lastName);
    const role = parseUserRole(body.role);
    const studentId = normalizeText(body.studentId);
    let department = normalizeText(body.department);
    const yearLevel = normalizeText(body.yearLevel);

    if (authUser.role === UserRole.PROGRAM_HEAD && authUser.department) {
      department = authUser.department;
    }

    validateManagedUserInput({
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      role,
      studentId,
      department,
      yearLevel,
      requirePassword: true
    });

    if (authUser.role === UserRole.PROGRAM_HEAD) {
      if (role !== UserRole.ADVISER) {
        throw new HttpError('Program Heads can only create Adviser accounts. Students must self-register.', 403, {
          role: 'Must be Adviser.'
        });
      }
      
      if (authUser.department && department !== authUser.department) {
        throw new HttpError(`You can only create users for your assigned department (${authUser.department}).`, 403, {
          department: `Must be ${authUser.department}.`
        });
      }
    }

    if (authUser.role === UserRole.SYSTEM_ADMIN && role === UserRole.STUDENT) {
      throw new HttpError('Students must self-register through the public registration flow.', 403, {
        role: 'Use staff or partner roles here.'
      });
    }

    if (authUser.role === UserRole.SYSTEM_ADMIN && role === UserRole.ADMIN) {
      throw new HttpError('Legacy Admin is no longer assigned. Use System Administrator or Research Head.', 403, {
        role: 'Choose System Administrator or Research Head.'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new HttpError('An account with this email already exists.', 409, {
        email: 'An account with this email already exists.'
      });
    }

    if (role === UserRole.STUDENT && studentId) {
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
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: buildDisplayName({
          name: normalizeText(body.name),
          firstName,
          lastName,
          email
        }),
        firstName: firstName || null,
        lastName: lastName || null,
        studentId: role === UserRole.STUDENT ? studentId || null : null,
        department: department || null,
        yearLevel: role === UserRole.STUDENT ? yearLevel || null : null,
        role
      },
      select: publicUserSelect
    });

    return successResponse(
      {
        message: 'User account created successfully.',
        user: toPublicUser(user)
      },
      201
    );
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
