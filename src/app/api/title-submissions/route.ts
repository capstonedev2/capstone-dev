import { Prisma, ProjectStatus, ReviewDecision, SubmissionStatus, UserRole } from '@/generated/prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, normalizeText, successResponse } from '@/lib/utils';
import { DOCUMENT_STORAGE_BUCKETS } from '@/lib/storage/upload-config';
import { uploadFile, generateUniqueFilePath } from '@/lib/storage/supabase-storage';
import {
  recordCheckpointSubmission,
  syncCheckpointReview
} from '@/lib/milestone-checkpoint-tracking';
import { findSimilarTitles, type SimilarTitleMatch } from '@/lib/title-similarity';

export const runtime = 'nodejs';

const TITLE_ROLES = [
  UserRole.STUDENT,
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.RESEARCH_HEAD,
  UserRole.PROGRAM_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
];

const DEFAULT_TITLE_LIMIT = 50;
const MAX_TITLE_LIMIT = 100;

function parsePositiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

const projectStatusToTitleStatus: Record<ProjectStatus, 'pending' | 'approved' | 'needs-revision' | 'rejected'> = {
  [ProjectStatus.DRAFT]: 'pending',
  [ProjectStatus.SUBMITTED]: 'pending',
  [ProjectStatus.UNDER_REVIEW]: 'pending',
  [ProjectStatus.APPROVED]: 'approved',
  [ProjectStatus.NEEDS_REVISION]: 'needs-revision',
  [ProjectStatus.DEFENSE_SCHEDULED]: 'approved',
  [ProjectStatus.COMPLETED]: 'approved',
  [ProjectStatus.ARCHIVED]: 'rejected'
};

const titleStatusToProjectStatus = {
  approved: ProjectStatus.APPROVED,
  needs_revision: ProjectStatus.NEEDS_REVISION,
  rejected: ProjectStatus.ARCHIVED,
  pending: ProjectStatus.SUBMITTED
} as const;

function getUserNameCandidates(user: { name?: string | null; firstName?: string | null; lastName?: string | null; displayName?: string | null; email?: string | null }) {
  return Array.from(new Set([
    user.displayName,
    [user.firstName, user.lastName].filter(Boolean).join(' '),
    user.name,
    user.email
  ]
    .map((value) => String(value || '').trim().replace(/\s+/g, ' '))
    .filter(Boolean)));
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getPersonName(person?: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
} | null) {
  if (!person) {
    return '';
  }

  return person.displayName || person.name || [person.firstName, person.lastName].filter(Boolean).join(' ');
}

async function findStudentGroup(user: Awaited<ReturnType<typeof requireAuthenticatedUser>>) {
  const groupByMembership = await prisma.group.findFirst({
    where: {
      groupMembers: {
        some: {
          userId: user.id,
          isActive: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  if (groupByMembership) {
    return groupByMembership;
  }

  const candidates = getUserNameCandidates(user);

  for (const candidate of candidates) {
    const group = await prisma.group.findFirst({
      where: {
        students: {
          has: candidate
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (group) {
      return group;
    }
  }

  const normalizedCandidates = new Set(candidates.map(normalizeName));
  const possibleGroups = await prisma.group.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 200
  });

  return possibleGroups.find((group) =>
    group.students.some((student) => normalizedCandidates.has(normalizeName(student)))
  ) || null;
}

function toTitlePayload(project: any) {
  const latestSubmission = project.submissions?.[0] ?? null;
  const latestComment = latestSubmission?.comments?.[0] ?? null;
  const groupMembers = project.group?.groupMembers?.length
    ? project.group.groupMembers.map((member: any) => {
        const name = getPersonName(member.user);
        const isLeader = member.role === 'LEADER' || name === project.group?.leader;

        return {
          name,
          role: isLeader ? 'Leader' : 'Member',
          isLeader
        };
      })
    : (project.group?.students || []).map((name: string) => ({
        name,
        role: name === project.group?.leader ? 'Leader' : 'Member',
        isLeader: name === project.group?.leader
      }));

  return {
    id: project.id,
    groupId: project.group?.code || project.groupId || 'Assigned Group',
    groupTitle: project.group?.title || null,
    title: project.title,
    description: project.abstract || '',
    department: project.departmentId || project.group?.department || 'IT',
    status: latestSubmission ? (projectStatusToTitleStatus[project.status as ProjectStatus] || 'pending') : 'draft',
    projectStatus: project.status,
    submittedAt: latestSubmission?.submittedAt || project.createdAt,
    updatedAt: project.updatedAt,
    reviewedAt: latestSubmission?.reviewedAt || null,
    keywords: project.keywords || [],
    similarityScore: 0 as number,
    similarTitles: [] as SimilarTitleMatch[],
    membersCount: groupMembers.length,
    memberPreview: groupMembers.map((member: any) => member.name).filter(Boolean),
    groupMembers,
    rejectionReason: latestSubmission?.rejectionReason || null,
    adviserAction: latestSubmission?.rejectionReason || latestComment?.body || 'Pending adviser review for originality, scope fit, and academic clarity.',
    latestReviewComment: latestComment
      ? {
          id: latestComment.id,
          body: latestComment.body,
          decision: latestComment.decision,
          createdAt: latestComment.createdAt,
          authorName: getPersonName(latestComment.author) || null
        }
      : null,
    academicYear: project.academicYear?.label || 'Current Academic Year',
    submissionId: latestSubmission?.id || null,
    uploadedFiles: (latestSubmission?.files?.length ? latestSubmission.files : project.files)?.map((file: any) => ({
      id: file.id,
      name: file.fileName,
      url: `/api/document-files/${file.id}/download`,
      previewUrl: `/api/document-files/${file.id}/preview`,
      fileType: file.fileType,
      size: file.size
    })) || []
  };
}

const projectInclude = {
  academicYear: {
    select: {
      label: true
    }
  },
  group: {
    select: {
      id: true,
      code: true,
      title: true,
      projectTitle: true,
      department: true,
      leader: true,
      students: true,
      groupMembers: {
        where: { isActive: true },
        select: {
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
  files: {
    where: { 
      documentCategory: { in: ['Title Proposal', 'Proposal'] }
    },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      size: true
    }
  },
  submissions: {
    orderBy: { submittedAt: 'desc' },
    take: 1,
    select: {
      id: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionReason: true,
      files: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          size: true
        }
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          body: true,
          decision: true,
          createdAt: true,
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
} satisfies Prisma.ProjectInclude;

// Shared by GET (list view) and POST (immediately after a new submission) so a
// student sees the duplicate-title warning right away, not only after the page
// reloads. Mutates the already-built title payloads in place.
async function enrichWithSimilarity(
  titlePayloads: ReturnType<typeof toTitlePayload>[],
  projectsToCheck: Array<{ id: string; title: string }>
) {
  if (projectsToCheck.length === 0) {
    return;
  }

  const candidatePool = await prisma.project.findMany({
    where: {
      status: { notIn: [ProjectStatus.DRAFT, ProjectStatus.ARCHIVED] },
      title: { not: '' }
    },
    select: { id: true, title: true, group: { select: { code: true } } },
    take: 500
  });

  const candidates = candidatePool.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    groupCode: candidate.group?.code ?? null
  }));

  const payloadsById = new Map(titlePayloads.map((payload) => [payload.id, payload]));

  for (const project of projectsToCheck) {
    const payload = payloadsById.get(project.id);
    if (!payload) continue;

    const matches = findSimilarTitles(project.title, project.id, candidates);
    payload.similarityScore = matches[0]?.score ?? 0;
    payload.similarTitles = matches;
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, TITLE_ROLES);
    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_TITLE_LIMIT, MAX_TITLE_LIMIT);
    const page = parsePositiveInteger(searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER);

    let where: any = {};

    if (user.role === UserRole.STUDENT) {
      const group = await findStudentGroup(user);
      where = group
        ? {
            groupId: group.id
          }
        : {
            ownerId: user.id
          };
    } else if (user.role === UserRole.ADVISER || user.role === UserRole.PANEL) {
      where = {
        adviserId: user.id
      };
    } else if (user.role === UserRole.PROGRAM_HEAD && user.department) {
      where = {
        OR: [
          { departmentId: user.department },
          { group: { department: user.department } }
        ]
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const titles = projects.map(toTitlePayload);

    // Only titles still awaiting a decision are worth duplicate-checking — an
    // approved or archived one doesn't need a fresh similarity read every time
    // someone loads this list.
    const projectsNeedingSimilarityCheck = projects.filter(
      (project) => project.status === ProjectStatus.SUBMITTED || project.status === ProjectStatus.UNDER_REVIEW
    );
    await enrichWithSimilarity(titles, projectsNeedingSimilarityCheck);

    const filteredTitles = user.role === UserRole.STUDENT
      ? titles
      : titles.filter(t => t.status !== 'draft');

    return successResponse({ titles: filteredTitles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, [UserRole.STUDENT]);
    const contentType = request.headers.get('content-type') || '';
    
    let title = '';
    let description = '';
    let keywords: string[] = [];
    let uploadedFiles: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = normalizeText(formData.get('title') as string);
      description = normalizeText(formData.get('description') as string);
      
      const keywordsData = formData.get('keywords');
      if (keywordsData) {
        try {
          keywords = JSON.parse(keywordsData as string);
        } catch {
          keywords = [];
        }
      }

      for (const [key, value] of formData.entries()) {
        if (key === 'files' && typeof value === 'object' && value !== null && 'size' in value && 'name' in value) {
          uploadedFiles.push(value as File);
        }
      }
    } else {
      const body = await request.json().catch(() => ({}));
      title = normalizeText(body?.title);
      description = normalizeText(body?.description);
      keywords = Array.isArray(body?.keywords)
        ? body.keywords.map((keyword: unknown) => normalizeText(keyword)).filter(Boolean)
        : [];
    }

    if (!title) {
      return Response.json(
        {
          success: false,
          message: 'Enter a proposed project title before submitting.'
        },
        { status: 400 }
      );
    }

    const group = await findStudentGroup(user);

    if (!group) {
      return Response.json(
        {
          success: false,
          message: 'No assigned group was found for this student account.'
        },
        { status: 400 }
      );
    }

    // Removed the requirement for an assigned adviser so students can submit a proposal to the pending queue

    const { project, submissionId } = await prisma.$transaction(async (tx) => {
      const deptName = group.department || group.dept || null;
      let resolvedDeptId: string | null = null;
      if (deptName) {
        const dept = await tx.department.findFirst({
          where: {
            OR: [
              { id: deptName },
              { name: { equals: deptName, mode: 'insensitive' } }
            ]
          },
          select: { id: true }
        });
        resolvedDeptId = dept?.id ?? null;
      }

      const createdProject = await tx.project.create({
        data: {
          title,
          abstract: description || 'Title proposal submitted for adviser validation.',
          keywords,
          status: ProjectStatus.SUBMITTED,
          groupId: group.id,
          ownerId: user.id,
          adviserId: group.userId,
          departmentId: resolvedDeptId
        }
      });

      const submission = await tx.submission.create({
        data: {
          projectId: createdProject.id,
          submittedById: user.id,
          title: 'Title Proposal Submission',
          description: description || `Proposed project title: ${title}`,
          status: SubmissionStatus.SUBMITTED,
          version: 1
        }
      });

      await recordCheckpointSubmission(tx, {
        projectId: createdProject.id,
        checkpointKey: 'concept-title',
        submissionId: submission.id
      });

      if (group.userId) {
        await tx.notification.create({
          data: {
            userId: group.userId,
            title: 'New Title Proposal Submitted',
            message: `${getPersonName(user) || 'A student'} submitted "${title}" for adviser title review.`,
            type: 'feedback',
            entityType: 'project',
            entityId: createdProject.id
          }
        });
      }

      const fullProject = await tx.project.findUniqueOrThrow({
        where: { id: createdProject.id },
        include: projectInclude
      });

      return { project: fullProject, submissionId: submission.id };
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    // Handle file uploads OUTSIDE the transaction so slow Supabase calls don't cause timeouts
    for (const file of uploadedFiles) {
      const bucketName = DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS;
      const filePath = generateUniqueFilePath({
        bucketName,
        projectId: project.id,
        userId: user.id,
        fileName: file.name
      });

      try {
        await uploadFile({ bucketName, filePath, file });
      } catch (uploadError) {
        console.warn(`Supabase file upload skipped for ${file.name}:`, uploadError);
      }

      try {
        const uploadedFile = await prisma.uploadedFile.create({
          data: {
            fileName: file.name,
            filePath,
            bucketName,
            fileType: file.type || 'application/octet-stream',
            documentCategory: 'Title Proposal',
            category: 'Title Proposal',
            visibility: 'private',
            size: file.size,
            userId: user.id,
            projectId: project.id,
            submissionId: submissionId
          }
        });

        await recordCheckpointSubmission(prisma, {
          projectId: project.id,
          checkpointKey: 'concept-paper',
          documentCategory: 'Title Proposal',
          fileName: file.name,
          fileId: uploadedFile.id
        });
      } catch (fileDbError) {
        console.warn(`File database record skipped for ${file.name}:`, fileDbError);
      }
    }

    // Check for duplicates immediately so the student sees the warning right on
    // the submission response, instead of only finding out after reloading the
    // page (which is when GET's version of this same check would otherwise run).
    const titlePayload = toTitlePayload(project);
    await enrichWithSimilarity([titlePayload], [{ id: project.id, title: project.title }]);

    return successResponse({ title: titlePayload }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, [
      UserRole.ADVISER,
      UserRole.PANEL,
      UserRole.RESEARCH_HEAD,
      UserRole.PROGRAM_HEAD,
      UserRole.SYSTEM_ADMIN,
      UserRole.ADMIN
    ]);
    const body = await request.json().catch(() => ({}));
    const id = normalizeText(body?.id);
    const decision = normalizeText(body?.decision).toLowerCase();
    const remarks = normalizeText(body?.remarks);
    const nextStatus = titleStatusToProjectStatus[decision as keyof typeof titleStatusToProjectStatus];

    if (!id || !nextStatus) {
      return Response.json(
        {
          success: false,
          message: 'Use a valid title id and decision: approved, needs_revision, rejected, or pending.'
        },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        group: true,
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!project) {
      return Response.json(
        {
          success: false,
          message: 'Title submission was not found.'
        },
        { status: 404 }
      );
    }

    const isAssignedAdviser = project.adviserId === user.id;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SYSTEM_ADMIN || user.role === UserRole.RESEARCH_HEAD || user.role === UserRole.PROGRAM_HEAD;

    if (!isAssignedAdviser && !isAdmin) {
      return Response.json(
        {
          success: false,
          message: 'You can update only title submissions assigned to you.'
        },
        { status: 403 }
      );
    }

    const submissionStatus = nextStatus === ProjectStatus.APPROVED
      ? SubmissionStatus.APPROVED
      : nextStatus === ProjectStatus.NEEDS_REVISION
        ? SubmissionStatus.NEEDS_REVISION
        : nextStatus === ProjectStatus.ARCHIVED
          ? SubmissionStatus.REJECTED
          : SubmissionStatus.SUBMITTED;
    const reviewDecision = nextStatus === ProjectStatus.APPROVED
      ? ReviewDecision.APPROVE
      : nextStatus === ProjectStatus.NEEDS_REVISION
        ? ReviewDecision.REQUEST_CHANGES
        : nextStatus === ProjectStatus.ARCHIVED
          ? ReviewDecision.REJECT
          : ReviewDecision.COMMENT;

    const updatedProject = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: project.id },
        data: { status: nextStatus }
      });

      const submission = project.submissions[0]
        ? await tx.submission.update({
            where: { id: project.submissions[0].id },
            data: {
              status: submissionStatus,
              reviewedAt: new Date(),
              rejectionReason: submissionStatus === SubmissionStatus.REJECTED ? remarks : undefined
            }
          })
        : await tx.submission.create({
            data: {
              projectId: project.id,
              submittedById: project.ownerId,
              title: 'Title Proposal Submission',
              description: project.abstract,
              status: submissionStatus,
              reviewedAt: new Date(),
              rejectionReason: submissionStatus === SubmissionStatus.REJECTED ? remarks : undefined
            }
          });

      if (remarks) {
        await tx.reviewComment.create({
          data: {
            submissionId: submission.id,
            authorId: user.id,
            body: remarks,
            decision: reviewDecision
          }
        });
      }

      await recordCheckpointSubmission(tx, {
        projectId: project.id,
        checkpointKey: 'concept-title',
        submissionId: submission.id
      });

      await syncCheckpointReview(tx, {
        submissionId: submission.id,
        nextStatus: submissionStatus,
        reviewNotes: remarks,
        reviewerName: getPersonName(user) || user.name,
        reviewerRole: user.role
      });

      if (nextStatus === ProjectStatus.APPROVED && project.groupId) {
        // Group.status/statusLabel/statusClass are separate stored columns from
        // Project.status — this endpoint used to only sync the title fields, so an
        // approved title left the group's own status badge stuck on "Pending"
        // indefinitely. Set it the same way the adviser-groups quick-approve action
        // already does, so both approval paths agree.
        await tx.group.update({
          where: { id: project.groupId },
          data: {
            projectId: project.id,
            projectTitle: project.title,
            title: project.title,
            status: 'active',
            statusLabel: 'Active',
            statusClass: 'status-active',
            milestone: 'Concept Proposal',
            currentMilestone: 'Concept Proposal'
          }
        });

        const otherProjects = await tx.project.findMany({
          where: {
            groupId: project.groupId,
            id: { not: project.id },
            status: { notIn: [ProjectStatus.ARCHIVED, ProjectStatus.APPROVED] }
          },
          select: { id: true }
        });

        if (otherProjects.length > 0) {
          const otherProjectIds = otherProjects.map((p) => p.id);
          
          await tx.project.updateMany({
            where: { id: { in: otherProjectIds } },
            data: { status: ProjectStatus.ARCHIVED }
          });
          
          await tx.submission.updateMany({
            where: {
              projectId: { in: otherProjectIds },
              status: { notIn: [SubmissionStatus.APPROVED, SubmissionStatus.REJECTED, SubmissionStatus.ARCHIVED] }
            },
            data: { status: SubmissionStatus.REJECTED, reviewedAt: new Date() }
          });
        }
      }

      if (project.ownerId) {
        await tx.notification.create({
          data: {
            userId: project.ownerId,
            title: 'Title Review Updated',
            message: `"${project.title}" was ${projectStatusToTitleStatus[nextStatus]} by your adviser.${remarks ? ' Review notes are available.' : ''}`,
            type: nextStatus === ProjectStatus.APPROVED ? 'success' : nextStatus === ProjectStatus.NEEDS_REVISION ? 'warning' : 'info',
            entityType: 'project',
            entityId: project.id
          }
        });
      }

      return tx.project.findUniqueOrThrow({
        where: { id: updated.id },
        include: projectInclude
      });
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    return successResponse({ title: toTitlePayload(updatedProject) });
  } catch (error) {
    return handleApiError(error);
  }
}
