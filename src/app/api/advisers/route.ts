import { UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, successResponse } from '@/lib/utils';

export const runtime = 'nodejs';

/**
 * GET /api/advisers
 * Returns the faculty accounts that can sit on a defense panel.
 * Accessible by authenticated adviser, panel, Research Head, and System Admin users.
 */
export async function GET(request: Request) {
  try {
    await requireAuthenticatedUser(request, [
      UserRole.ADVISER,
      UserRole.PANEL,
      UserRole.PROGRAM_HEAD,
      UserRole.RESEARCH_HEAD,
      UserRole.ADMIN,
      UserRole.SYSTEM_ADMIN
    ]);

    const panelists = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADVISER, UserRole.PANEL],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        displayName: true,
      },
      orderBy: [
        { role: 'desc' },
        { name: 'asc' },
      ],
    });

    return successResponse({ advisers: panelists, panelists });
  } catch (error) {
    return handleApiError(error);
  }
}
