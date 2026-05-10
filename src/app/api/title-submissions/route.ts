import { ProjectStatus, ReviewDecision, SubmissionStatus, UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, normalizeText, successResponse } from '@/lib/utils';
import { DOCUMENT_STORAGE_BUCKETS } from '@/lib/storage/upload-config';
import { uploadFile, generateUniqueFilePath } from '@/lib/storage/supabase-storage';

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
    description: project.abstract || 'Title proposal submitted for adviser validation.',
    department: project.departmentId || project.group?.department || 'IT',
    status: latestSubmission ? (projectStatusToTitleStatus[project.status as ProjectStatus] || 'pending') : 'draft',
    projectStatus: project.status,
    submittedAt: latestSubmission?.submittedAt || project.createdAt,
    updatedAt: project.updatedAt,
    reviewedAt: latestSubmission?.reviewedAt || null,
    keywords: project.keywords || [],
    similarityScore: 0,
    similarTitles: [],
    membersCount: groupMembers.length,
    memberPreview: groupMembers.map((member: any) => member.name).filter(Boolean),
    groupMembers,
    adviserAction: latestComment?.body || 'Pending adviser review for originality, scope fit, and academic clarity.',
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
    uploadedFiles: latestSubmission?.files?.map((file: any) => ({
      id: file.id,
      name: file.fileName,
      url: `/api/document-files/${file.id}/download`,
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
  submissions: {
    orderBy: { submittedAt: 'desc' },
    take: 1,
    include: {
      files: true,
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
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
} as const;

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, TITLE_ROLES);

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
      take: 100
    });

    const titles = projects.map(toTitlePayload);
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
        if (key === 'files' && value instanceof File) {
          uploadedFiles.push(value);
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

    if (!group.userId) {
      return Response.json(
        {
          success: false,
          message: 'This group does not have an assigned adviser yet.'
        },
        { status: 400 }
      );
    }

    const project = await prisma.$transaction(async (tx) => {
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

      // Handle file uploads if any
      for (const file of uploadedFiles) {
        const bucketName = DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS;
        const filePath = generateUniqueFilePath({
          bucketName,
          projectId: createdProject.id,
          userId: user.id,
          fileName: file.name
        });

        await uploadFile({
          bucketName,
          filePath,
          file
        });

        await tx.uploadedFile.create({
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
            projectId: createdProject.id,
            submissionId: submission.id
          }
        });
      }

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

      return tx.project.findUniqueOrThrow({
        where: { id: createdProject.id },
        include: projectInclude
      });
    });

    return successResponse({ title: toTitlePayload(project) }, 201);
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
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SYSTEM_ADMIN || user.role === UserRole.RESEARCH_HEAD;

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
              reviewedAt: new Date()
            }
          })
        : await tx.submission.create({
            data: {
              projectId: project.id,
              submittedById: project.ownerId,
              title: 'Title Proposal Submission',
              description: project.abstract,
              status: submissionStatus,
              reviewedAt: new Date()
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

      if (nextStatus === ProjectStatus.APPROVED && project.groupId) {
        await tx.group.update({
          where: { id: project.groupId },
          data: {
            projectId: project.id,
            projectTitle: project.title,
            title: project.group?.title || project.title
          }
        });
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
    });

    return successResponse({ title: toTitlePayload(updatedProject) });
  } catch (error) {
    return handleApiError(error);
  }
}
