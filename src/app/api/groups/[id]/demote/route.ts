import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthenticatedUser } from '@/lib/auth';
import { resetGroupForNewTitle } from '@/lib/milestone-checkpoint-tracking';
import { UserRole, type Prisma } from '@/generated/prisma/client';

const DEMOTE_ELEVATED_ROLES = new Set(['PROGRAM_HEAD', 'RESEARCH_HEAD', 'ADMIN', 'SYSTEM_ADMIN']);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getServerAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

    if (!reason) {
      return NextResponse.json({ error: 'A reason is required to demote a group.' }, { status: 400 });
    }

    const { id: groupId } = await context.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, userId: true, projectId: true, code: true }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isElevated = DEMOTE_ELEVATED_ROLES.has(authUser.role);
    const isOwningAdviser = group.userId === authUser.id;

    if (!isElevated && !isOwningAdviser) {
      return NextResponse.json({ error: 'You do not have permission to demote this group.' }, { status: 403 });
    }

    const project = group.projectId
      ? await prisma.project.findUnique({ where: { id: group.projectId }, select: { id: true, title: true, ownerId: true } })
      : null;

    // Elevated roles (program head/research head/admin/system admin) already have standing
    // authority to make this call directly — unchanged, immediate reset.
    if (isElevated) {
      await resetGroupForNewTitle(prisma, { groupId: group.id, projectId: group.projectId });

      await prisma.auditLog.create({
        data: {
          actorId: authUser.id,
          action: 'group.demoted',
          entityType: 'Group',
          entityId: group.id,
          metadata: {
            reason,
            projectId: group.projectId,
            projectTitle: project?.title ?? null,
            actorRole: authUser.role
          } as Prisma.InputJsonValue
        }
      });

      const notifyUserIds = new Set<string>();
      if (project?.ownerId) {
        notifyUserIds.add(project.ownerId);
      }
      // Someone other than the owning adviser did this — the adviser needs to know too,
      // they wouldn't otherwise find out except by noticing the group reset on its own.
      if (!isOwningAdviser && group.userId) {
        notifyUserIds.add(group.userId);
      }

      for (const userId of notifyUserIds) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Project Reset: New Title Required',
            message: `"${project?.title || group.code}" has been reset by a program head. Reason: ${reason}`,
            type: 'warning',
            entityType: 'Group',
            entityId: group.id
          }
        });
      }

      return NextResponse.json({ success: true, message: 'Group reset — the student will need to submit a new title.' });
    }

    // The owning adviser is using unchecked, unilateral power (no panel vote behind it, unlike
    // the chair-decision flow) — this no longer executes immediately. It becomes a pending
    // request that only a program head can approve before the group is actually reset.
    const demotionRequest = await prisma.groupDemotionRequest.create({
      data: {
        groupId: group.id,
        projectId: group.projectId,
        requestedById: authUser.id,
        reason
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: authUser.id,
        action: 'group.demotion_requested',
        entityType: 'GroupDemotionRequest',
        entityId: demotionRequest.id,
        metadata: {
          reason,
          groupId: group.id,
          projectId: group.projectId,
          projectTitle: project?.title ?? null
        } as Prisma.InputJsonValue
      }
    });

    const programHeads = await prisma.user.findMany({
      where: { role: UserRole.PROGRAM_HEAD },
      select: { id: true }
    });

    if (programHeads.length) {
      await prisma.notification.createMany({
        data: programHeads.map((head) => ({
          userId: head.id,
          title: 'Group Demotion Needs Your Approval',
          message: `An adviser requested to reset group "${group.code}"${project?.title ? ` ("${project.title}")` : ''} and require a new title. Reason: ${reason}`,
          type: 'warning',
          entityType: 'GroupDemotionRequest',
          entityId: demotionRequest.id
        }))
      });
    }

    return NextResponse.json({
      success: true,
      pending: true,
      message: 'Request sent — pending program head approval before the group is reset.'
    });
  } catch (error) {
    console.error('Failed to demote group', error);
    return NextResponse.json({ error: 'Unable to demote this group.' }, { status: 500 });
  }
}
