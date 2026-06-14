import { DefensePanelRole, DefenseStatus, ProjectStatus } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HttpError, handleApiError, parseJsonBody, successResponse } from '@/lib/utils';

export const runtime = 'nodejs';

type EvaluateBody = {
  scores: Record<string, number>;
  individualScores: Record<string, number>;
  notes: Record<string, string>;
  feedback: string;
  vote?: 'yes' | 'no';
  isChairSubmit?: boolean;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuthenticatedUser(request);
    const scheduleId = params.id;
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
    const isChairSubmit = isChair && body.isChairSubmit;

    // 3. Calculate total score and construct rubric data
    let totalScore = 0;
    for (const score of Object.values(body.scores || {})) {
      totalScore += typeof score === 'number' ? score : 0;
    }

    // We can infer recommendation from vote and score (e.g. "yes" = PASSED)
    // You can customize this business logic.
    let recommendation = evaluation.recommendation;
    if (body.vote === 'yes') {
      recommendation = totalScore >= 70 ? 'PASSED' : 'PASSED_MINOR';
    } else if (body.vote === 'no') {
      recommendation = totalScore < 50 ? 'FAILED' : 'REDEFENSE';
    } else {
      recommendation = 'PENDING';
    }

    // 4. Update the Evaluation record
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        score: totalScore,
        rubricData: {
          scores: body.scores,
          notes: body.notes,
          vote: body.vote
        },
        studentEvaluations: body.individualScores,
        remarks: body.feedback,
        recommendation: recommendation,
        submittedAt: new Date()
      }
    });

    // 5. If Chair is finalizing the defense
    if (isChairSubmit) {
      // Chair decides to finalize and complete the session.
      // E.g. Check all votes to determine final project status.
      // For now, we'll just mark the defense as COMPLETED.
      await prisma.defenseSchedule.update({
        where: { id: schedule.id },
        data: {
          status: DefenseStatus.COMPLETED
        }
      });

      // Optionally, update project/group status if necessary.
      // If majority voted yes, project is COMPLETED or APPROVED
    }

    return successResponse({
      message: isChairSubmit ? 'Defense session completed successfully.' : 'Evaluation submitted successfully.'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
