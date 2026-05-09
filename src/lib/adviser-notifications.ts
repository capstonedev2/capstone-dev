import { NotificationStatus } from '@/generated/prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AdviserNotificationRecord } from '@/components/adviser/shared/components/adviser-notifications';

function formatNotificationTime(value: Date) {
  const diffMs = Date.now() - value.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) return 'Just now';
  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diffMs < 7 * dayMs) {
    const days = Math.floor(diffMs / dayMs);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getNotificationVisual(type: string, entityType: string | null): Pick<AdviserNotificationRecord, 'icon' | 'tone'> {
  if (entityType === 'uploaded_file') {
    return { icon: 'fa-file-circle-plus', tone: 'warning' };
  }

  switch (type) {
    case 'success':
      return { icon: 'fa-circle-check', tone: 'success' };
    case 'feedback':
      return { icon: 'fa-comment-dots', tone: 'warning' };
    case 'deadline':
      return { icon: 'fa-hourglass-half', tone: 'danger' };
    case 'schedule':
      return { icon: 'fa-calendar-days', tone: 'info' };
    default:
      return { icon: 'fa-bell', tone: 'info' };
  }
}

function getNotificationHref(basePath: string, entityType: string | null) {
  if (entityType === 'uploaded_file') {
    return basePath.includes('/panel-mode') ? `${basePath}/evaluation-queue` : `${basePath}/submissions`;
  }

  return `${basePath}/notifications`;
}

export async function getAdviserNotificationRecords(basePath: string) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return notifications.map((notification): AdviserNotificationRecord => {
    const visual = getNotificationVisual(notification.type, notification.entityType);

    return {
      id: notification.id,
      status: notification.status === NotificationStatus.READ ? 'read' : 'unread',
      created_at: notification.createdAt.toISOString(),
      icon: visual.icon,
      title: notification.title,
      text: notification.message,
      time: formatNotificationTime(notification.createdAt),
      href: getNotificationHref(basePath, notification.entityType),
      meta: notification.entityType?.replace(/[_-]+/g, ' ') || notification.type || 'Notification',
      entityType: notification.entityType,
      tone: visual.tone
    };
  });
}
