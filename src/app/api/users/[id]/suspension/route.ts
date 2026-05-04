import { UserRole } from '@/generated/prisma/client';
import { publicUserSelect, requireAuthenticatedUser, toPublicUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  normalizeText,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

const SUSPENSION_MANAGER_ROLES: UserRole[] = [UserRole.SYSTEM_ADMIN, UserRole.PROGRAM_HEAD];

type SuspensionBody = {
  suspended?: unknown;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseSuspendedValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = normalizeText(value).toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new HttpError('Suspension state must be a boolean value.', 400, {
    suspended: 'Choose whether the account should be active or suspended.'
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireAuthenticatedUser(request, SUSPENSION_MANAGER_ROLES);
    const { id } = await context.params;
    const userId = normalizeText(id);

    if (!userId) {
      throw new HttpError('User ID is required.', 400);
    }

    const body = await parseJsonBody<SuspensionBody>(request);
    const suspended = parseSuspendedValue(body.suspended);

    if (actor.id === userId && suspended) {
      throw new HttpError('You cannot suspend the account you are currently using.', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        isSuspended: true,
        department: true
      }
    });

    if (!existingUser) {
      throw new HttpError('The selected user no longer exists.', 404);
    }

    if (actor.role === UserRole.PROGRAM_HEAD && existingUser.role !== UserRole.ADVISER) {
      throw new HttpError('Program Heads can only suspend or restore Adviser accounts.', 403);
    }

    if (actor.role === UserRole.PROGRAM_HEAD && actor.department) {
      if (existingUser.department !== actor.department) {
        throw new HttpError('You do not have permission to modify users outside your department.', 403);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: suspended,
        suspendedAt: suspended ? new Date() : null
      },
      select: publicUserSelect
    });

    return successResponse({
      message: suspended
        ? `${existingUser.name} has been suspended.`
        : `${existingUser.name} has been restored.`,
      user: toPublicUser(user)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
