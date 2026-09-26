import { UserRole } from '@/generated/prisma/client';
import { userDepartmentWhere } from '@/lib/department-scope';
import { prisma } from '@/lib/prisma';

type FocalNotification = {
  title: string;
  message: string;
  type?: string;
  entityType?: string | null;
  entityId?: string | null;
};

/**
 * Notifies every active Research Focal Person of `department` (alias-aware: "ICT" and "BSIT" are
 * one department) through the normal Notification table.
 *
 * Call it AFTER the main write, never inside a transaction: it swallows its own errors so a
 * notification problem can't undo a submission, schedule, or decision.
 */
export async function notifyDepartmentFocalPersons(department: string | null | undefined, notification: FocalNotification) {
  if (!department) return;

  try {
    const recipients = await prisma.user.findMany({
      where: { role: UserRole.FOCAL_PERSON, isSuspended: false, ...userDepartmentWhere(department) },
      select: { id: true }
    });

    if (!recipients.length) return;

    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.id,
        title: notification.title,
        message: notification.message,
        type: notification.type ?? 'info',
        entityType: notification.entityType ?? null,
        entityId: notification.entityId ?? null
      }))
    });
  } catch (error) {
    console.error('[FOCAL PERSON] Failed to create department notifications:', error);
  }
}
