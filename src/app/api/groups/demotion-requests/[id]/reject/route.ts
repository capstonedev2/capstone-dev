import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthenticatedUser } from '@/lib/auth';
import { GroupDemotionRequestStatus, type Prisma } from '@/generated/prisma/client';

const REVIEW_ROLES = new Set(['PROGRAM_HEAD', 'ADMIN', 'SYSTEM_ADMIN']);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getServerAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!REVIEW_ROLES.has(authUser.role)) {
      return NextResponse.json({ error: 'You do not have permission to reject demotion requests.' }, { status: 403 });
    }

    const { id: requestId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reviewNotes = typeof body?.reviewNotes === 'string' ? body.reviewNotes.trim() || null : null;

    const demotionRequest = await prisma.groupDemotionRequest.findUnique({
      where: { id: requestId },
      include: {
        group: { select: { id: true, code: true } }
      }
    });

    if (!demotionRequest) {
      return NextResponse.json({ error: 'Demotion request not found' }, { status: 404 });
    }

    if (demotionRequest.status !== GroupDemotionRequestStatus.PENDING) {
      return NextResponse.json({ error: 'This request has already been reviewed.' }, { status: 400 });
    }

    await prisma.groupDemotionRequest.update({
      where: { id: demotionRequest.id },
      data: {
        status: GroupDemotionRequestStatus.REJECTED,
        reviewedById: authUser.id,
        reviewedAt: new Date(),
        reviewNotes
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: authUser.id,
        action: 'group.demotion_rejected',
        entityType: 'GroupDemotionRequest',
        entityId: demotionRequest.id,
        metadata: {
          groupId: demotionRequest.groupId,
          reviewNotes
        } as Prisma.InputJsonValue
      }
    });

    if (demotionRequest.requestedById) {
      await prisma.notification.create({
        data: {
          userId: demotionRequest.requestedById,
          title: 'Demotion Request Declined',
          message: `The program head declined your request to reset group "${demotionRequest.group.code}". Nothing changed.${reviewNotes ? ` Notes: ${reviewNotes}` : ''}`,
          type: 'info',
          entityType: 'Group',
          entityId: demotionRequest.groupId
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Request declined — the group was left unchanged.' });
  } catch (error) {
    console.error('Failed to reject demotion request', error);
    return NextResponse.json({ error: 'Unable to reject this request.' }, { status: 500 });
  }
}
