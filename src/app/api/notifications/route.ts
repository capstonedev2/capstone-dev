import { NextResponse } from 'next/server';
import { GroupMemberRole, NotificationStatus, UserRole, type Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { HttpError } from '@/lib/utils';
import { withApiLogging } from '@/lib/api-logging';

/*
 * Notifications API. Every method requires a signed-in user, and every read or update is limited to
 * that user's OWN notifications: the owner always comes from the session, never from a userId in
 * the query or body. (This route used to run with no sign-in check at all, and POST created any
 * missing user as a "Demo Account".)
 *
 * Creating notifications for other people is normally done server-side by the route that performs
 * the action (uploads, reviews, schedules, …). Through this endpoint a client may only:
 * - ask their group leader for upload permission (a student, for their own active group), or
 * - as a System Administrator, notify existing users (single or batch).
 */

const DEFAULT_NOTIFICATION_LIMIT = 50;
const MAX_NOTIFICATION_LIMIT = 100;
const MAX_BATCH_SIZE = 200;
const UPLOAD_PERMISSION_REQUEST_TITLE = 'Upload Permission Request';

type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  entityType: string | null;
  entityId: string | null;
};

type AuthUser = Awaited<ReturnType<typeof requireAuthenticatedUser>>;

function parsePositiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toNotificationInput(item: any): NotificationInput {
  return {
    userId: text(item?.userId),
    title: text(item?.title),
    message: text(item?.message),
    type: text(item?.type) || 'info',
    entityType: text(item?.entityType) || null,
    entityId: text(item?.entityId) || null
  };
}

/** Same `{ error }` shape the portals already read; 401/403 for auth problems. */
function errorJson(error: unknown, fallback: string, logLabel: string) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(logLabel, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

function personName(user: Pick<AuthUser, 'name' | 'displayName' | 'firstName' | 'lastName'>) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || 'A group member';
}

/** System Administrator: notify existing users only (no user is ever created here). */
async function createAdminNotifications(inputs: NotificationInput[]) {
  const invalid = inputs.find((item) => !item.userId || !item.title || !item.message);
  if (invalid) {
    throw new HttpError('Missing required notification fields', 400);
  }

  const userIds = Array.from(new Set(inputs.map((item) => item.userId)));
  const existing = await prisma.user.count({ where: { id: { in: userIds } } });
  if (existing !== userIds.length) {
    throw new HttpError('One or more recipients do not exist.', 400);
  }

  return inputs;
}

/**
 * A student asks their group leader for permission to upload title files. The server checks that
 * the sender and the leader are active members of the same group and writes the text itself.
 */
async function buildUploadPermissionRequest(user: AuthUser, input: NotificationInput): Promise<NotificationInput> {
  if (user.role !== UserRole.STUDENT || input.title !== UPLOAD_PERMISSION_REQUEST_TITLE || !input.entityId || !input.userId) {
    throw new HttpError('You do not have permission to create this notification.', 403);
  }

  if (input.userId === user.id) {
    throw new HttpError('You cannot send this request to yourself.', 400);
  }

  const [senderMembership, leaderMembership] = await Promise.all([
    prisma.groupMember.findFirst({ where: { groupId: input.entityId, userId: user.id, isActive: true }, select: { id: true } }),
    prisma.groupMember.findFirst({
      where: { groupId: input.entityId, userId: input.userId, isActive: true, role: GroupMemberRole.LEADER },
      select: { id: true }
    })
  ]);

  if (!senderMembership || !leaderMembership) {
    throw new HttpError('You can only send this request to the leader of your own group.', 403);
  }

  return {
    userId: input.userId,
    title: UPLOAD_PERMISSION_REQUEST_TITLE,
    message: `${personName(user)} is requesting permission to upload title proposal files.`,
    type: 'info',
    entityType: 'group',
    entityId: input.entityId
  };
}

async function handlePOST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const data = await request.json().catch(() => null);
    const batch = Array.isArray(data?.notifications) ? data.notifications : null;

    if (batch) {
      if (user.role !== UserRole.SYSTEM_ADMIN) {
        throw new HttpError('Only System Administrators can send notifications in bulk.', 403);
      }
      if (!batch.length || batch.length > MAX_BATCH_SIZE) {
        throw new HttpError(`Send between 1 and ${MAX_BATCH_SIZE} notifications at a time.`, 400);
      }

      const inputs = await createAdminNotifications(batch.map(toNotificationInput));
      const created = await prisma.notification.createMany({
        data: inputs.map((item) => ({ ...item, status: NotificationStatus.UNREAD }))
      });

      return NextResponse.json({ success: true, count: created.count });
    }

    const input = toNotificationInput(data);
    const [notification] =
      user.role === UserRole.SYSTEM_ADMIN ? await createAdminNotifications([input]) : [await buildUploadPermissionRequest(user, input)];

    const created = await prisma.notification.create({
      data: { ...notification, status: NotificationStatus.UNREAD }
    });

    return NextResponse.json(created);
  } catch (error) {
    return errorJson(error, 'Failed to create notification', '[NOTIF POST] Failed to create notification:');
  }
}

async function handleGET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Kept for the portals that still send their own id; anyone else's id is refused.
    if (requestedUserId && requestedUserId !== user.id) {
      throw new HttpError('You can only view your own notifications.', 403);
    }

    const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_NOTIFICATION_LIMIT, MAX_NOTIFICATION_LIMIT);
    const status = searchParams.get('status')?.trim().toUpperCase();
    const entityType = searchParams.get('entityType')?.trim();
    const entityId = searchParams.get('entityId')?.trim();
    const title = searchParams.get('title')?.trim();

    const where: Prisma.NotificationWhereInput = {
      userId: user.id,
      ...(status && status in NotificationStatus ? { status: status as NotificationStatus } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(title ? { title } : {})
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        type: true,
        status: true,
        entityType: true,
        entityId: true,
        readAt: true,
        createdAt: true
      }
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return errorJson(error, 'Failed to fetch notifications', 'Failed to fetch notifications:');
  }
}

async function handlePATCH(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json().catch(() => ({}));
    const { notificationId, notificationIds, userId, action } = body ?? {};
    const readData = { status: NotificationStatus.READ, readAt: new Date() };

    if (action === 'read-all') {
      // The inbox is always the caller's own; a different userId in the body is refused.
      if (typeof userId === 'string' && userId.trim() && userId.trim() !== user.id) {
        throw new HttpError('You can only update your own notifications.', 403);
      }

      const updated = await prisma.notification.updateMany({
        where: { userId: user.id, status: NotificationStatus.UNREAD },
        data: readData
      });

      return NextResponse.json({ success: true, count: updated.count });
    }

    const ids = Array.isArray(notificationIds)
      ? notificationIds.filter((id): id is string => typeof id === 'string' && Boolean(id.trim()))
      : [];

    if (ids.length) {
      if (action !== 'read') {
        return NextResponse.json({ error: 'Batch updates only support read action' }, { status: 400 });
      }

      // Ids that aren't the caller's are simply not updated.
      const updated = await prisma.notification.updateMany({
        where: { id: { in: Array.from(new Set(ids)) }, userId: user.id },
        data: readData
      });

      return NextResponse.json({ success: true, count: updated.count });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    // Someone else's notification answers "not found", same as a missing one.
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Permission requests carry "groupId:memberId". Accepting one tells that member; it's only
    // honored when the member really is active in that group (no user is ever created here).
    let groupId = notification.entityId;
    let memberId: string | null = null;

    if (notification.entityId && notification.entityId.includes(':')) {
      [groupId, memberId] = notification.entityId.split(':');
    }

    if (action === 'accept' && notification.entityType === 'group' && groupId && memberId) {
      const membership = await prisma.groupMember.findFirst({
        where: { groupId, userId: memberId, isActive: true },
        select: { id: true }
      });

      if (membership) {
        await prisma.notification.create({
          data: {
            userId: memberId,
            title: 'Upload Permission Granted',
            message: 'Your leader has approved your request to upload files.',
            type: 'success',
            status: NotificationStatus.UNREAD,
            entityType: 'permission',
            entityId: groupId
          }
        });
      }
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: readData
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorJson(error, 'Failed to update notification', '[NOTIF PATCH] Failed:');
  }
}

export const POST = withApiLogging('POST', '/api/notifications', handlePOST);
export const GET = withApiLogging('GET', '/api/notifications', handleGET);
export const PATCH = withApiLogging('PATCH', '/api/notifications', handlePATCH);
