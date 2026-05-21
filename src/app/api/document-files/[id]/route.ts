import { ReviewDecision, SubmissionStatus, UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError, normalizeText, successResponse } from '@/lib/utils';
import {
  canDeleteDocument,
  canAccessDocument,
  getAuthorizedDocumentFile
} from '@/lib/storage/document-authorization';
import { assertDocumentBucket, deleteFile } from '@/lib/storage/supabase-storage';
import { prisma } from '@/lib/prisma';
import { toDocumentFilePayload } from '@/lib/storage/document-file-api';
import { syncCheckpointReview } from '@/lib/milestone-checkpoint-tracking';

export const runtime = 'nodejs';

const DOCUMENT_MANAGER_ROLES = [
  UserRole.STUDENT,
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.RESEARCH_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
];

const ADVISER_REVIEW_ROLES = [
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.RESEARCH_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
];

const reviewStatusMap: Record<string, SubmissionStatus> = {
  submitted: SubmissionStatus.SUBMITTED,
  pending: SubmissionStatus.SUBMITTED,
  accepted: SubmissionStatus.UNDER_REVIEW,
  still_reviewing: SubmissionStatus.UNDER_REVIEW,
  under_review: SubmissionStatus.UNDER_REVIEW,
  comment: SubmissionStatus.UNDER_REVIEW,
  save_comment: SubmissionStatus.UNDER_REVIEW,
  approved: SubmissionStatus.APPROVED,
  revision: SubmissionStatus.NEEDS_REVISION,
  needs_revision: SubmissionStatus.NEEDS_REVISION
};

const reviewDecisionMap: Record<SubmissionStatus, ReviewDecision> = {
  [SubmissionStatus.SUBMITTED]: ReviewDecision.COMMENT,
  [SubmissionStatus.UNDER_REVIEW]: ReviewDecision.COMMENT,
  [SubmissionStatus.APPROVED]: ReviewDecision.APPROVE,
  [SubmissionStatus.NEEDS_REVISION]: ReviewDecision.REQUEST_CHANGES,
  [SubmissionStatus.REJECTED]: ReviewDecision.REJECT,
  [SubmissionStatus.ARCHIVED]: ReviewDecision.COMMENT
};

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request, DOCUMENT_MANAGER_ROLES);
    const { id } = await props.params;
    const file = await getAuthorizedDocumentFile(id, user);

    if (!canDeleteDocument(user, file)) {
      return Response.json(
        {
          success: false,
          message: 'You do not have permission to delete this document.'
        },
        { status: 403 }
      );
    }

    const bucketName = file.bucketName!;
    assertDocumentBucket(bucketName);
    await deleteFile(bucketName, file.filePath!);
    await prisma.uploadedFile.delete({ where: { id: file.id } });

    return successResponse({ message: 'Document deleted successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request, ADVISER_REVIEW_ROLES);
    const { id } = await props.params;
    const body = await request.json().catch(() => ({}));
    const requestedStatus = normalizeText(body?.status).toLowerCase();
    const reviewNotes = normalizeText(body?.notes);
    const isCommentOnly = requestedStatus === 'comment' || requestedStatus === 'save_comment';
    const nextStatus = reviewStatusMap[requestedStatus];

    if (!nextStatus) {
      return Response.json(
        {
          success: false,
          message: 'Use a valid review status: accepted, still_reviewing, comment, approved, or needs_revision.'
        },
        { status: 400 }
      );
    }

    const file = await prisma.uploadedFile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            displayName: true
          }
        },
        submission: true,
        project: {
          select: {
            id: true,
            status: true,
            title: true,
            ownerId: true,
            adviserId: true,
            departmentId: true,
            groupId: true,
            group: {
              select: {
                code: true,
                title: true,
                projectTitle: true,
                currentMilestone: true,
                leader: true,
                students: true,
                department: true,
                groupMembers: {
                  select: {
                    userId: true,
                    isActive: true,
                    role: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        displayName: true
                      }
                    }
                  }
                }
              }
            },
            evaluations: {
              select: {
                evaluatorId: true
              }
            }
          }
        }
      }
    });

    if (!file || !file.bucketName || !file.filePath) {
      return Response.json(
        {
          success: false,
          message: 'Document file was not found.'
        },
        { status: 404 }
      );
    }

    if (!canAccessDocument(user, file)) {
      return Response.json(
        {
          success: false,
          message: 'You do not have permission to update this document review.'
        },
        { status: 403 }
      );
    }

    const submission = await prisma.$transaction(async (tx) => {
      const nextReviewedAt = nextStatus === SubmissionStatus.SUBMITTED ? null : new Date();
      const updatedSubmission = file.submissionId
        ? await tx.submission.update({
            where: { id: file.submissionId },
            data: {
              status: nextStatus,
              reviewedAt: isCommentOnly && file.submission?.reviewedAt ? file.submission.reviewedAt : nextReviewedAt
            }
          })
        : file.projectId
          ? await tx.submission.create({
              data: {
                projectId: file.projectId,
                submittedById: file.userId,
                title: file.fileName,
                description: `${file.documentCategory} document submitted for adviser review.`,
                status: nextStatus,
                version: 1,
                reviewedAt: nextReviewedAt,
                files: {
                  connect: { id: file.id }
                }
              }
            })
          : null;

      if (updatedSubmission && reviewNotes) {
        await tx.reviewComment.create({
          data: {
            submissionId: updatedSubmission.id,
            authorId: user.id,
            body: reviewNotes,
            decision: reviewDecisionMap[nextStatus]
          }
        });
      }

      if (updatedSubmission) {
        await syncCheckpointReview(tx, {
          submissionId: updatedSubmission.id,
          nextStatus,
          reviewNotes,
          reviewerName: user.name,
          reviewerRole: user.role
        });
      }

      return updatedSubmission;
    });

    if (!submission) {
      return Response.json(
        {
          success: false,
          message: 'This file is not linked to an assigned project.'
        },
        { status: 400 }
      );
    }

    const reviewCommentCount = await prisma.reviewComment.count({
      where: { submissionId: submission.id }
    });

    if (!isCommentOnly) {
      const recipientIds = new Set<string>();

      if (file.userId && file.userId !== user.id) {
        recipientIds.add(file.userId);
      }

      file.project?.group?.groupMembers?.forEach((member) => {
        if (member.isActive === false || !member.userId || member.userId === user.id) {
          return;
        }

        recipientIds.add(member.userId);
      });

      const notificationTitle = nextStatus === SubmissionStatus.UNDER_REVIEW
        ? 'Under Adviser Review'
        : nextStatus === SubmissionStatus.NEEDS_REVISION
          ? 'Revision Requested'
          : nextStatus === SubmissionStatus.APPROVED
            ? 'Submission Approved'
            : 'Adviser Review Updated';
      const notificationMessage = nextStatus === SubmissionStatus.UNDER_REVIEW
        ? `Your adviser has started reviewing ${file.fileName}. Your adviser is currently reviewing your submission.`
        : nextStatus === SubmissionStatus.NEEDS_REVISION
          ? `Your adviser requested revisions for ${file.fileName}. Review ${reviewCommentCount || 'the'} adviser comment${reviewCommentCount === 1 ? '' : 's'} and upload a revised version.`
          : nextStatus === SubmissionStatus.APPROVED
            ? `${file.fileName} was approved by your adviser. You can now view the adviser remarks and approval status.`
            : `${file.fileName} was updated by your adviser.`;

      if (recipientIds.size) {
        await prisma.notification.createMany({
          data: Array.from(recipientIds).map((userId) => ({
            userId,
            title: notificationTitle,
            message: notificationMessage,
            type: nextStatus === SubmissionStatus.NEEDS_REVISION
              ? 'warning'
              : nextStatus === SubmissionStatus.UNDER_REVIEW
                ? 'info'
                : 'success',
            entityType: 'uploaded_file',
            entityId: file.id
          }))
        });
      }
    }

    const updatedFile = await prisma.uploadedFile.findUniqueOrThrow({
      where: { id: file.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            displayName: true
          }
        },
        submission: {
          select: {
            id: true,
            status: true,
            version: true,
            submittedAt: true,
            reviewedAt: true,
            comments: {
              orderBy: { createdAt: 'desc' },
              take: 50,
              select: {
                id: true,
                body: true,
                decision: true,
                createdAt: true,
                authorId: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    displayName: true
                  }
                }
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                code: true,
                title: true,
                projectTitle: true,
                currentMilestone: true,
                leader: true,
                students: true,
                groupMembers: {
                  select: {
                    userId: true,
                    isActive: true,
                    role: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        displayName: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return successResponse({ file: toDocumentFilePayload(updatedFile) });
  } catch (error) {
    return handleApiError(error);
  }
}
