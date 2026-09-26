import { UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, successResponse } from '@/lib/utils';
import { withApiLogging } from '@/lib/api-logging';

export const runtime = 'nodejs';

const LIMIT = 20;

/**
 * The signed-in Research Focal Person's own notifications (newest first) plus the unread count.
 * The user comes from the session, so it can't be pointed at anyone else's inbox. Marking as read
 * still goes through the shared notification menu, like every other portal.
 */
async function handleGET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, [UserRole.FOCAL_PERSON]);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id, status: { not: 'ARCHIVED' } },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
        select: { id: true, title: true, message: true, type: true, status: true, entityType: true, entityId: true, createdAt: true }
      }),
      prisma.notification.count({ where: { userId: user.id, status: 'UNREAD' } })
    ]);

    return successResponse({
      unreadCount,
      notifications: notifications.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withApiLogging('GET', '/api/focal-person/notifications', handleGET);
