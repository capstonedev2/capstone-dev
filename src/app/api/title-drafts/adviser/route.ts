import { MilestoneCheckpointReviewStatus, UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HttpError, handleApiError, normalizeText, successResponse } from '@/lib/utils';

export const runtime = 'nodejs';

// The adviser-facing side of student-saved "backup titles" (see
// /api/title-drafts). A group's adviser reviews each backup independently of
// whether it's ever actually used — approving one just clears that specific
// idea, which is what lets a later replacement-title submission built from an
// approved draft skip a second review cycle (see POST /api/title-submissions).

const TITLE_DRAFT_REVIEW_ROLES = [
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.RESEARCH_HEAD,
  UserRole.PROGRAM_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
];

// Oversight roles see every group's backups; a plain adviser/panel member only
// sees the groups they actually advise (group.userId === their own id).
const ELEVATED_ROLES = new Set<UserRole>([
  UserRole.RESEARCH_HEAD,
  UserRole.PROGRAM_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
]);

function getPersonName(person?: { name?: string | null; displayName?: string | null } | null) {
  return person?.displayName || person?.name || null;
}

function toAdviserDraftPayload(draft: any) {
  const groupMembers = (draft.group?.groupMembers || []).map((member: any) => {
    const name = getPersonName(member.user) || 'Unnamed student';
    const isLeader = member.role === 'LEADER' || name === draft.group?.leader;
    return { name, isLeader };
  });

  return {
    id: draft.id,
    title: draft.title,
    description: draft.description || '',
    keywords: draft.keywords,
    updatedAt: draft.updatedAt.toISOString(),
    reviewStatus: draft.reviewStatus,
    reviewFeedback: draft.reviewFeedback,
    reviewedAt: draft.reviewedAt ? draft.reviewedAt.toISOString() : null,
    isPriority: draft.isPriority,
    groupId: draft.group?.id || draft.groupId,
    groupCode: draft.group?.code || null,
    groupTitle: draft.group?.title || draft.group?.projectTitle || null,
    groupMembers,
    updatedByName: getPersonName(draft.updatedBy),
    files: (draft.files || []).map((file: any) => ({
      id: file.id,
      name: file.fileName,
      url: `/api/title-drafts/files/${file.id}/download`,
      fileType: file.fileType,
      size: file.size
    }))
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, TITLE_DRAFT_REVIEW_ROLES);
    const isElevated = ELEVATED_ROLES.has(user.role);

    const drafts = await prisma.titleDraft.findMany({
      where: isElevated ? {} : { group: { userId: user.id } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        keywords: true,
        updatedAt: true,
        reviewStatus: true,
        reviewFeedback: true,
        reviewedAt: true,
        isPriority: true,
        files: { select: { id: true, fileName: true, fileType: true, size: true } },
        groupId: true,
        group: {
          select: {
            id: true,
            code: true,
            title: true,
            projectTitle: true,
            leader: true,
            groupMembers: {
              where: { isActive: true },
              select: { role: true, user: { select: { name: true, displayName: true } } }
            }
          }
        },
        updatedBy: { select: { name: true, displayName: true } }
      }
    });

    return successResponse({ drafts: drafts.map(toAdviserDraftPayload) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, TITLE_DRAFT_REVIEW_ROLES);
    const body = await request.json().catch(() => ({}));
    const id = normalizeText(body?.id);
    const decision = normalizeText(body?.decision).toLowerCase();
    const feedback = normalizeText(body?.feedback);

    if (!id || (decision !== 'approve' && decision !== 'needs_revision')) {
      throw new HttpError('Use a valid backup title id and decision: approve or needs_revision.', 400);
    }

    const draft = await prisma.titleDraft.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        groupId: true,
        group: {
          select: {
            userId: true,
            groupMembers: { where: { isActive: true }, select: { userId: true } }
          }
        }
      }
    });

    if (!draft) {
      throw new HttpError('Backup title was not found.', 404);
    }

    const isAssignedAdviser = draft.group.userId === user.id;
    const isElevated = ELEVATED_ROLES.has(user.role);

    if (!isAssignedAdviser && !isElevated) {
      throw new HttpError('You can only review backup titles for your own groups.', 403);
    }

    const nextStatus = decision === 'approve'
      ? MilestoneCheckpointReviewStatus.APPROVED
      : MilestoneCheckpointReviewStatus.NEEDS_REVISION;

    const updated = await prisma.titleDraft.update({
      where: { id },
      data: {
        reviewStatus: nextStatus,
        reviewFeedback: feedback || null,
        reviewedAt: new Date(),
        reviewedById: user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        keywords: true,
        updatedAt: true,
        reviewStatus: true,
        reviewFeedback: true,
        reviewedAt: true,
        isPriority: true,
        files: { select: { id: true, fileName: true, fileType: true, size: true } },
        groupId: true,
        group: {
          select: {
            id: true,
            code: true,
            title: true,
            projectTitle: true,
            leader: true,
            groupMembers: {
              where: { isActive: true },
              select: { role: true, user: { select: { name: true, displayName: true } } }
            }
          }
        },
        updatedBy: { select: { name: true, displayName: true } }
      }
    });

    const memberIds = draft.group.groupMembers.map((member) => member.userId);

    if (memberIds.length) {
      await prisma.notification.createMany({
        data: memberIds.map((userId) => ({
          userId,
          title: nextStatus === MilestoneCheckpointReviewStatus.APPROVED ? 'Backup Title Approved' : 'Backup Title Needs Revision',
          message: nextStatus === MilestoneCheckpointReviewStatus.APPROVED
            ? `Your adviser approved the backup title "${draft.title}". If a new title is ever required, using it submits instantly with no extra wait.`
            : `Your adviser requested changes to the backup title "${draft.title}".${feedback ? ` ${feedback}` : ''}`,
          type: nextStatus === MilestoneCheckpointReviewStatus.APPROVED ? 'success' : 'warning'
        }))
      });
    }

    return successResponse({ draft: toAdviserDraftPayload(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}
