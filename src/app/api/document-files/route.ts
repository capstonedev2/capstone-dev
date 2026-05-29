import { MilestoneStatus, ProjectStatus, SubmissionStatus, UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  normalizeText,
  successResponse
} from '@/lib/utils';
import {
  DOCUMENT_STORAGE_BUCKETS,
  DOCUMENT_UPLOAD_ERROR_MESSAGES,
  type DocumentStorageBucket
} from '@/lib/storage/upload-config';
import {
  assertCanUploadDocument,
  canAccessDocument,
  getBestProjectAccessRecord,
  getStudentUploadProjectAccessRecord
} from '@/lib/storage/document-authorization';
import {
  assertDocumentBucket,
  assertValidDocumentFile,
  generateUniqueFilePath,
  uploadFile
} from '@/lib/storage/supabase-storage';
import { toDocumentFilePayload } from '@/lib/storage/document-file-api';
import {
  recordCheckpointSubmission,
  resolveMilestoneCheckpointForSubmission
} from '@/lib/milestone-checkpoint-tracking';

export const runtime = 'nodejs';

const DOCUMENT_VIEWER_ROLES = [
  UserRole.STUDENT,
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.RESEARCH_HEAD,
  UserRole.PROGRAM_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
];

const DEFAULT_DOCUMENT_FILE_LIMIT = 50;
const MAX_DOCUMENT_FILE_LIMIT = 100;

function parsePositiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

function getBucketForCategory(value: string): DocumentStorageBucket {
  if (value === DOCUMENT_STORAGE_BUCKETS.EVALUATION_FILES) {
    return DOCUMENT_STORAGE_BUCKETS.EVALUATION_FILES;
  }

  if (value === DOCUMENT_STORAGE_BUCKETS.FINAL_REPOSITORY) {
    return DOCUMENT_STORAGE_BUCKETS.FINAL_REPOSITORY;
  }

  return DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS;
}

async function assertConceptApprovedForUpload(projectId: string, hasProjectApproval: boolean) {
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { sequence: 'asc' },
    select: {
      title: true,
      status: true,
      completedAt: true
    },
    take: 20
  });
  const conceptMilestone = milestones.find((milestone) => milestone.title.toLowerCase().includes('concept'))
    || milestones[0]
    || null;

  if (!conceptMilestone && hasProjectApproval) {
    return;
  }

  const completedStatuses: MilestoneStatus[] = [MilestoneStatus.APPROVED, MilestoneStatus.COMPLETED];

  if (conceptMilestone && (completedStatuses.includes(conceptMilestone.status) || conceptMilestone.completedAt)) {
    return;
  }

  throw new HttpError(`${conceptMilestone?.title || 'Concept'} must be completed and approved by the panels before project file uploads are available.`, 400, {
    milestone: 'Complete concept approval before uploading project files.'
  });
}

async function createUploadNotifications({
  bucketName,
  documentCategory,
  fileName,
  fileId,
  uploaderId,
  project
}: {
  bucketName: DocumentStorageBucket;
  documentCategory: string;
  fileName: string;
  fileId: string;
  uploaderId: string;
  project: Awaited<ReturnType<typeof getBestProjectAccessRecord>>;
}) {
  const recipientIds = new Set<string>([uploaderId]);

  if (bucketName === DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS && project) {
    if (project.adviserId && project.adviserId !== uploaderId) {
      recipientIds.add(project.adviserId);
    }

    project.evaluations.forEach((evaluation) => {
      if (evaluation.evaluatorId && evaluation.evaluatorId !== uploaderId) {
        recipientIds.add(evaluation.evaluatorId);
      }
    });
  }

  const notifications = Array.from(recipientIds).map((recipientId) => {
    const isUploader = recipientId === uploaderId;
    const isThesisDocument = bucketName === DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS;

    return {
      userId: recipientId,
      title: isUploader
        ? 'Document Uploaded'
        : 'New Student Document Uploaded',
      message: isUploader
        ? `${fileName} was uploaded successfully to private document storage.`
        : `A student uploaded ${fileName} for adviser review.`,
      type: isUploader ? 'success' : isThesisDocument ? 'feedback' : 'info',
      entityType: 'uploaded_file',
      entityId: fileId
    };
  });

  if (!notifications.length) {
    return;
  }

  try {
    await prisma.notification.createMany({
      data: notifications
    });
  } catch (error) {
    console.error('[DOCUMENT UPLOAD] Failed to create upload notifications:', error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, DOCUMENT_VIEWER_ROLES);
    const url = new URL(request.url);
    const bucketName = normalizeText(url.searchParams.get('bucketName'));
    const projectId = normalizeText(url.searchParams.get('projectId'));
    const limit = parsePositiveInteger(url.searchParams.get('limit'), DEFAULT_DOCUMENT_FILE_LIMIT, MAX_DOCUMENT_FILE_LIMIT);
    const page = parsePositiveInteger(url.searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER);

    if (bucketName) {
      assertDocumentBucket(bucketName);
    }

    const adviserPanelProjectWhere = user.role === UserRole.ADVISER || user.role === UserRole.PANEL
      ? {
          OR: [
            { adviserId: user.id },
            { group: { groupMembers: { some: { userId: user.id, isActive: true } } } },
            { evaluations: { some: { evaluatorId: user.id } } }
          ]
        }
      : null;

    const where = {
      ...(bucketName ? { bucketName } : { bucketName: { not: null } }),
      ...(projectId ? { projectId } : {}),
      ...(user.role === UserRole.STUDENT ? { userId: user.id } : {}),
      ...(adviserPanelProjectWhere ? { project: adviserPanelProjectWhere } : {}),
      ...(user.role === UserRole.PROGRAM_HEAD && user.department
        ? {
            OR: [
              { project: { departmentId: user.department } },
              { project: { group: { department: user.department } } }
            ]
          }
        : {})
    };

    const files = await prisma.uploadedFile.findMany({
      where,
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
              take: 10,
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
                  where: { isActive: true },
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
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return successResponse({
      files: files
        .filter((file) => canAccessDocument(user, file))
        .map((file) => toDocumentFilePayload(file, {
          exposeReviewComments: user.role !== UserRole.STUDENT
            || file.submission?.status === SubmissionStatus.NEEDS_REVISION
            || file.submission?.status === SubmissionStatus.APPROVED
        }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, DOCUMENT_VIEWER_ROLES);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new HttpError(DOCUMENT_UPLOAD_ERROR_MESSAGES.missingFile, 400, {
        file: DOCUMENT_UPLOAD_ERROR_MESSAGES.missingFile
      });
    }

    const bucketNameValue = normalizeText(formData.get('bucketName')) || getBucketForCategory(normalizeText(formData.get('documentCategory')));
    assertDocumentBucket(bucketNameValue);
    assertValidDocumentFile(file, bucketNameValue);

    const projectId = normalizeText(formData.get('projectId'));
    const documentCategory = normalizeText(formData.get('documentCategory')) || 'Uncategorized';
    const checkpointKey = normalizeText(formData.get('checkpointKey'));
    const project = bucketNameValue === DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS && user.role === UserRole.STUDENT
      ? await getStudentUploadProjectAccessRecord(user, projectId)
      : await getBestProjectAccessRecord(user, projectId);

    if (bucketNameValue === DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS && user.role === UserRole.STUDENT) {
      if (!project) {
        throw new HttpError('No assigned thesis project was found for your account.', 400, {
          projectId: 'Ask your adviser to assign your group to a project before uploading documents.'
        });
      }

      if (!project.adviserId) {
        throw new HttpError('Your thesis project does not have an assigned adviser yet.', 400, {
          adviserId: 'Ask your program adviser to assign an adviser before uploading documents.'
        });
      }

      const approvedStatuses: ProjectStatus[] = [ProjectStatus.APPROVED, ProjectStatus.DEFENSE_SCHEDULED, ProjectStatus.COMPLETED];
      await assertConceptApprovedForUpload(project.id, approvedStatuses.includes(project.status));
    }

    await assertCanUploadDocument({
      user,
      bucketName: bucketNameValue,
      projectId: project?.id ?? projectId
    });

    const filePath = generateUniqueFilePath({
      bucketName: bucketNameValue,
      projectId: project?.id ?? projectId ?? 'unassigned',
      userId: user.id,
      fileName: file.name
    });

    await uploadFile({
      bucketName: bucketNameValue,
      filePath,
      file
    });

    const uploadedFile = await prisma.$transaction(async (tx) => {
      const checkpoint = bucketNameValue === DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS && project?.id
        ? await resolveMilestoneCheckpointForSubmission(tx, {
            projectId: project.id,
            checkpointKey,
            documentCategory,
            fileName: file.name
          })
        : null;
      const submission = bucketNameValue === DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS && project?.id
        ? await tx.submission.create({
            data: {
              projectId: project.id,
              milestoneId: checkpoint?.milestoneId,
              checkpointId: checkpoint?.id,
              submittedById: user.id,
              title: file.name,
              description: `${documentCategory} document submitted for adviser review.`,
              status: SubmissionStatus.SUBMITTED,
              version: 1
            }
          })
        : null;

      const savedFile = await tx.uploadedFile.create({
        data: {
          fileName: file.name,
          filePath,
          bucketName: bucketNameValue,
          fileType: file.type || 'application/octet-stream',
          documentCategory,
          category: documentCategory,
          visibility: 'private',
          size: file.size,
          userId: user.id,
          projectId: project?.id ?? null,
          submissionId: submission?.id ?? null,
          checkpointId: checkpoint?.id ?? null
        },
        include: {
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
          }
        }
      });

      if (bucketNameValue === DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS && project?.id && submission) {
        await recordCheckpointSubmission(tx, {
          projectId: project.id,
          checkpointKey: checkpoint?.key ?? checkpointKey,
          documentCategory,
          fileName: file.name,
          submissionId: submission.id,
          fileId: savedFile.id
        });
      }

      return savedFile;
    });

    await createUploadNotifications({
      bucketName: bucketNameValue,
      documentCategory,
      fileName: file.name,
      fileId: uploadedFile.id,
      uploaderId: user.id,
      project
    });

    return successResponse(
      {
        file: toDocumentFilePayload(uploadedFile)
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
