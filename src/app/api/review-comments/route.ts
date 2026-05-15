import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, successResponse } from '@/lib/utils';
import { UserRole } from '@/generated/prisma/client';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, [UserRole.STUDENT, UserRole.ADVISER, UserRole.PANEL]);
    const body = await request.json();
    const { commentId, isResolved } = body;

    if (!commentId) {
      return Response.json({ success: false, message: 'Missing commentId' }, { status: 400 });
    }

    const updateData: any = {};
    if (isResolved !== undefined) {
      updateData.isResolved = isResolved;
      if (isResolved) {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = user.id;
      }
    }

    const existingComment = await prisma.reviewComment.findUnique({
      where: { id: commentId },
      include: {
        submission: {
          include: { project: true }
        }
      }
    });

    if (!existingComment) {
      return Response.json({ success: false, message: 'Comment not found' }, { status: 404 });
    }

    const updatedComment = await prisma.reviewComment.update({
      where: { id: commentId },
      data: updateData
    });

    // Notify the author (Adviser/Panel) if someone else (Student) resolved it
    if (isResolved && existingComment.authorId && existingComment.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: existingComment.authorId,
          title: 'Feedback Resolved',
          message: `${user.name || 'A student'} marked your feedback on "${existingComment.submission.title}" as resolved.`,
          type: 'success',
          entityType: 'review_comment',
          entityId: commentId
        }
      });
    }

    return successResponse({ comment: updatedComment });
  } catch (error) {
    return handleApiError(error);
  }
}
