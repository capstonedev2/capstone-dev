import { DefenseChairDecision, DefensePanelRole, DefenseStatus, ProjectStatus } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HttpError, handleApiError, parseJsonBody, successResponse } from '@/lib/utils';
import { attachDefenseDecisionFeedback, resetGroupForNewTitle } from '@/lib/milestone-checkpoint-tracking';

export const runtime = 'nodejs';

type ChairDecisionBody = {
  decision: 'redefense' | 'new_title';
  remarks?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: scheduleId } = await context.params;
    const authUser = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<ChairDecisionBody>(request);

    if (body.decision !== 'redefense' && body.decision !== 'new_title') {
      throw new HttpError('Invalid decision.', 400);
    }

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

    // 2. Only the panel chair can record this follow-up decision
    const evaluation = schedule.evaluations.find((e) => e.evaluatorId === authUser.id);
    if (!evaluation || evaluation.panelRole !== DefensePanelRole.CHAIR) {
      throw new HttpError('Only the panel chair can record this decision.', 403);
    }

    // 3. The defense must already be finalized (all votes in), and the outcome must not be a pass —
    // this decision only applies when the panel rejected or tied.
    if (schedule.status !== DefenseStatus.COMPLETED) {
      throw new HttpError('This defense has not been finalized yet.', 400);
    }

    let yesVotes = 0;
    let noVotes = 0;
    for (const ev of schedule.evaluations) {
      if (['PASSED', 'PASSED_MINOR', 'PASSED_MAJOR'].includes(ev.recommendation)) {
        yesVotes++;
      } else if (['REDEFENSE', 'FAILED'].includes(ev.recommendation)) {
        noVotes++;
      }
    }

    if (yesVotes > noVotes) {
      throw new HttpError('This decision only applies when the panel did not pass the defense.', 400);
    }

    const decision = body.decision === 'redefense' ? DefenseChairDecision.REDEFENSE : DefenseChairDecision.NEW_TITLE;
    const remarks = body.remarks?.trim() || null;
    const reviewerName = authUser.displayName || authUser.name || undefined;

    await prisma.defenseSchedule.update({
      where: { id: schedule.id },
      data: {
        chairDecision: decision,
        chairDecisionAt: new Date(),
        chairDecisionRemarks: remarks
      }
    });

    if (decision === DefenseChairDecision.REDEFENSE) {
      // Project.status/checkpoint status are already NEEDS_REVISION from the vote finalize step —
      // this just attaches the chair's rationale so the student sees why.
      await attachDefenseDecisionFeedback(prisma, {
        projectId: schedule.projectId,
        scheduleTitle: schedule.title,
        remarks,
        reviewerName
      });
    } else {
      // This title's track ends here. Archive the project and send the group back through
      // title submission — POST /api/title-submissions already creates a fresh Project from
      // scratch for a group with no special-casing, so resetting the group is all that's needed.
      const group = schedule.project.group;
      if (group && group.projectId === schedule.projectId) {
        await resetGroupForNewTitle(prisma, { groupId: group.id, projectId: schedule.projectId });
      } else {
        await prisma.project.update({
          where: { id: schedule.projectId },
          data: { status: ProjectStatus.ARCHIVED }
        });
      }
    }

    // Notify the student and their adviser — same pattern as title-submissions' review
    // notification. Neither would otherwise learn about this decision until they happened
    // to notice the project status change or a resubmitted title.
    const notifyUserIds = Array.from(
      new Set([schedule.project.ownerId, schedule.project.adviserId].filter((id): id is string => Boolean(id)))
    );

    if (notifyUserIds.length) {
      const notificationTitle =
        decision === DefenseChairDecision.REDEFENSE ? 'Defense Decision: Redefense Required' : 'Defense Decision: New Title Required';
      const notificationMessage =
        decision === DefenseChairDecision.REDEFENSE
          ? `The panel chair recorded a redefense decision for "${schedule.project.title}".${remarks ? ` ${remarks}` : ''}`
          : `The panel chair determined "${schedule.project.title}" requires a new title. The group will need to submit a new title proposal.${remarks ? ` ${remarks}` : ''}`;

      await prisma.notification.createMany({
        data: notifyUserIds.map((userId) => ({
          userId,
          title: notificationTitle,
          message: notificationMessage,
          type: decision === DefenseChairDecision.REDEFENSE ? 'warning' : 'info',
          entityType: 'project',
          entityId: schedule.projectId
        }))
      });
    }

    return successResponse({
      message:
        decision === DefenseChairDecision.REDEFENSE
          ? 'Recorded: the student will revise and re-attempt this title.'
          : 'Recorded: this title has been archived — the student will need to submit a new title.'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
