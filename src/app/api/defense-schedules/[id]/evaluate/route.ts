import { DefensePanelRole, DefenseStatus, ProjectStatus } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HttpError, handleApiError, parseJsonBody, successResponse } from '@/lib/utils';
import { recordDefenseVoteOutcome } from '@/lib/milestone-checkpoint-tracking';

export const runtime = 'nodejs';

type EvaluateBody = {
  feedback: string;
  vote?: 'yes' | 'no';
  isChairSubmit?: boolean;
};

async function finalizeDefenseSchedule(
  scheduleId: string,
  projectId: string,
  projectTitle: string,
  scheduleTitle: string,
  evaluations: Array<{ recommendation: string }>,
  notifyUserIds: string[],
  groupId: string | null
) {
  await prisma.defenseSchedule.update({
    where: { id: scheduleId },
    data: { status: DefenseStatus.COMPLETED }
  });

  let yesVotes = 0;
  let noVotes = 0;

  for (const ev of evaluations) {
    if (['PASSED', 'PASSED_MINOR', 'PASSED_MAJOR'].includes(ev.recommendation)) {
      yesVotes++;
    } else if (['REDEFENSE', 'FAILED'].includes(ev.recommendation)) {
      noVotes++;
    }
  }

  if (yesVotes > noVotes) {
    const normalizedTitle = scheduleTitle.toLowerCase();
    const isFinal = normalizedTitle.includes('final') && !normalizedTitle.includes('pre-final');
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: isFinal ? ProjectStatus.COMPLETED : ProjectStatus.APPROVED
      }
    });

    // Mark the stage's panel-approval checkpoint(s) done so the student
    // milestone tracker's rollup can actually reach COMPLETED — updating
    // Project.status alone never touched this, which is why "Stage N"
    // stayed stuck even after the panel approved.
    await recordDefenseVoteOutcome(prisma, {
      projectId,
      scheduleTitle,
      outcome: 'passed'
    });

    // Clear the "Needs Revision" flag a prior rejected defense may have set — a
    // group that just passed (including a redefense) isn't flagged anymore.
    // Without this, a group that recovers from a rejection stays stuck showing
    // "Needs Revision" and the loud demotion panel forever, even after passing.
    if (groupId) {
      await prisma.group.update({
        where: { id: groupId },
        data: {
          status: 'active',
          statusLabel: 'Active',
          statusClass: 'status-active'
        }
      });
    }

    if (notifyUserIds.length) {
      await prisma.notification.createMany({
        data: notifyUserIds.map((userId) => ({
          userId,
          title: 'Defense Passed',
          message: `"${projectTitle}" passed its ${scheduleTitle} defense.`,
          type: 'success',
          entityType: 'Project',
          entityId: projectId
        }))
      });
    }
  } else if (noVotes > yesVotes) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.NEEDS_REVISION
      }
    });

    await recordDefenseVoteOutcome(prisma, {
      projectId,
      scheduleTitle,
      outcome: 'redefense'
    });

    // Keep the group's lifecycle status badge in sync with the real defense
    // outcome — without this, Group.status silently keeps whatever value it
    // had before the vote (often still "Pending" or "Active"), so the group
    // list shows a rejected group as if nothing happened.
    if (groupId) {
      await prisma.group.update({
        where: { id: groupId },
        data: {
          status: 'needs-revision',
          statusLabel: 'Needs Revision',
          statusClass: 'status-revise'
        }
      });
    }

    if (notifyUserIds.length) {
      await prisma.notification.createMany({
        data: notifyUserIds.map((userId) => ({
          userId,
          title: 'Defense Not Passed',
          message: `"${projectTitle}" did not pass its ${scheduleTitle} defense — awaiting the panel chair's decision on next steps.`,
          type: 'warning',
          entityType: 'Project',
          entityId: projectId
        }))
      });
    }
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: scheduleId } = await context.params;
    const authUser = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<EvaluateBody>(request);

    // 1. Validate the schedule exists
    const schedule = await prisma.defenseSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: {
          include: {
            group: true
          }
        },
        evaluations: true
      }
    });

    if (!schedule) {
      throw new HttpError('Defense schedule not found', 404);
    }

    // 2. Validate user is an evaluator
    const evaluation = schedule.evaluations.find(e => e.evaluatorId === authUser.id);
    if (!evaluation) {
      throw new HttpError('You are not assigned to this defense panel', 403);
    }

    const isChair = evaluation.panelRole === DefensePanelRole.CHAIR;

    // 3. There is no scoring in this workflow — the panelist's vote alone decides the recommendation.
    let recommendation = evaluation.recommendation;
    if (body.vote === 'yes') {
      recommendation = 'PASSED';
    } else if (body.vote === 'no') {
      recommendation = 'REDEFENSE';
    } else {
      recommendation = 'PENDING';
    }

    // 4. Update the Evaluation record
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        rubricData: {
          vote: body.vote
        },
        remarks: body.feedback,
        recommendation: recommendation,
        submittedAt: new Date()
      }
    });

    // 5. Finalize automatically once every assigned panelist has voted — completion no longer
    // depends on a "live session" chair action. `isChairSubmit` is still honored as a manual
    // override (e.g. a chair closing out a defense early) for backward compatibility.
    const allEvaluations = await prisma.evaluation.findMany({
      where: { defenseScheduleId: schedule.id }
    });
    const allVoted = allEvaluations.length > 0 && allEvaluations.every((ev) => ev.submittedAt !== null);
    const shouldFinalize = schedule.status !== DefenseStatus.COMPLETED && (allVoted || (isChair && body.isChairSubmit));

    if (shouldFinalize) {
      const notifyUserIds = Array.from(
        new Set([schedule.project.ownerId, schedule.project.adviserId].filter((id): id is string => Boolean(id)))
      );
      await finalizeDefenseSchedule(
        schedule.id,
        schedule.projectId,
        schedule.project.title,
        schedule.title,
        allEvaluations,
        notifyUserIds,
        schedule.project.group?.id ?? null
      );
    }

    return successResponse({
      message: shouldFinalize ? 'Defense session completed successfully.' : 'Vote submitted successfully.'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
