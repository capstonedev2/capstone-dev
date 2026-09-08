import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthenticatedUser } from '@/lib/auth';
import { resetGroupForNewTitle } from '@/lib/milestone-checkpoint-tracking';
import { GroupDemotionRequestStatus, type Prisma } from '@/generated/prisma/client';

const REVIEW_ROLES = new Set(['PROGRAM_HEAD', 'ADMIN', 'SYSTEM_ADMIN']);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getServerAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!REVIEW_ROLES.has(authUser.role)) {
      return NextResponse.json({ error: 'You do not have permission to approve demotion requests.' }, { status: 403 });
    }

    const { id: requestId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reviewNotes = typeof body?.reviewNotes === 'string' ? body.reviewNotes.trim() || null : null;

    const demotionRequest = await prisma.groupDemotionRequest.findUnique({
      where: { id: requestId },
      include: {
        group: { select: { id: true, code: true, userId: true } }
      }
    });

    if (!demotionRequest) {
      return NextResponse.json({ error: 'Demotion request not found' }, { status: 404 });
    }

    if (demotionRequest.status !== GroupDemotionRequestStatus.PENDING) {
      return NextResponse.json({ error: 'This request has already been reviewed.' }, { status: 400 });
    }

    const project = demotionRequest.projectId
      ? await prisma.project.findUnique({ where: { id: demotionRequest.projectId }, select: { title: true, ownerId: true } })
      : null;

    await resetGroupForNewTitle(prisma, { groupId: demotionRequest.groupId, projectId: demotionRequest.projectId });

    await prisma.groupDemotionRequest.update({
      where: { id: demotionRequest.id },
      data: {
        status: GroupDemotionRequestStatus.APPROVED,
        reviewedById: authUser.id,
        reviewedAt: new Date(),
        reviewNotes
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: authUser.id,
        action: 'group.demotion_approved',
        entityType: 'GroupDemotionRequest',
        entityId: demotionRequest.id,
        metadata: {
          groupId: demotionRequest.groupId,
          reviewNotes
        } as Prisma.InputJsonValue
      }
    });

    const notifyUserIds = [demotionRequest.requestedById, project?.ownerId, demotionRequest.group.userId].filter(
      (id): id is string => Boolean(id)
    );

    if (notifyUserIds.length) {
      await prisma.notification.createMany({
        data: Array.from(new Set(notifyUserIds)).map((userId) => ({
          userId,
          title: 'Demotion Request Approved',
          message: `The program head approved resetting group "${demotionRequest.group.code}"${project?.title ? ` ("${project.title}")` : ''}. A new title must now be submitted.${reviewNotes ? ` Notes: ${reviewNotes}` : ''}`,
          type: 'warning',
          entityType: 'Group',
          entityId: demotionRequest.groupId
        }))
      });
    }

    return NextResponse.json({ success: true, message: 'Request approved — the group has been reset.' });
  } catch (error) {
    console.error('Failed to approve demotion request', error);
    return NextResponse.json({ error: 'Unable to approve this request.' }, { status: 500 });
  }
}
