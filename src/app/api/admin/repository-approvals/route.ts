import { ProjectStatus, SubmissionStatus, UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/utils';

export const runtime = 'nodejs';

const REPOSITORY_APPROVAL_ROLES = [UserRole.RESEARCH_HEAD, UserRole.SYSTEM_ADMIN, UserRole.ADMIN];

const ELIGIBLE_STATUSES: ProjectStatus[] = [
  ProjectStatus.APPROVED,
  ProjectStatus.DEFENSE_SCHEDULED,
  ProjectStatus.COMPLETED,
  ProjectStatus.ARCHIVED
];

function getPersonName(person?: { name?: string | null; firstName?: string | null; lastName?: string | null; displayName?: string | null } | null) {
  if (!person) return null;
  return person.displayName || person.name || [person.firstName, person.lastName].filter(Boolean).join(' ') || null;
}

function formatFileSize(bytes: number) {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

export async function GET(request: Request) {
  try {
    await requireAuthenticatedUser(request, REPOSITORY_APPROVAL_ROLES);

    const projects = await prisma.project.findMany({
      where: { status: { in: ELIGIBLE_STATUSES } },
      orderBy: [{ repositoryPublishedAt: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        title: true,
        status: true,
        repositoryPublishedAt: true,
        updatedAt: true,
        department: { select: { name: true } },
        group: { select: { department: true, leader: true, students: true } },
        owner: { select: { name: true, firstName: true, lastName: true, displayName: true } },
        adviser: { select: { name: true, firstName: true, lastName: true, displayName: true } },
        files: {
          select: { id: true, fileName: true, size: true, createdAt: true, category: true, documentCategory: true },
          orderBy: { createdAt: 'desc' }
        },
        // Scoped to the final-manuscript files this screen is actually about —
        // otherwise the "latest submission" here could be an unrelated earlier
        // stage (e.g. a Chapter 1 revision request), showing a stale/irrelevant
        // status instead of what's actually gating the repository publish.
        submissions: {
          where: {
            status: { in: [SubmissionStatus.APPROVED, SubmissionStatus.NEEDS_REVISION, SubmissionStatus.UNDER_REVIEW] },
            files: {
              some: {
                OR: [
                  { documentCategory: { contains: 'final', mode: 'insensitive' } },
                  { documentCategory: { contains: 'manuscript', mode: 'insensitive' } },
                  { category: { contains: 'final', mode: 'insensitive' } },
                  { category: { contains: 'manuscript', mode: 'insensitive' } }
                ]
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { status: true, submittedAt: true, reviewedAt: true }
        }
      }
    });

    const records = projects.map((project) => {
      const relevantFiles = project.files.filter((file) => {
        const category = `${file.documentCategory} ${file.category}`.toLowerCase();
        return category.includes('final') || category.includes('manuscript');
      });
      const files = relevantFiles.length ? relevantFiles : project.files;
      const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
      const latestSubmission = project.submissions[0] || null;

      return {
        projectId: project.id,
        projectTitle: project.title,
        department: project.department?.name || project.group?.department || null,
        submittedBy: getPersonName(project.owner) || project.group?.leader || (project.group?.students?.[0] ?? null),
        adviserName: getPersonName(project.adviser),
        adviserReviewStatus: latestSubmission?.status || null,
        lastActivityAt: latestSubmission?.submittedAt || project.updatedAt,
        fileCount: files.length,
        totalFileSize: formatFileSize(totalBytes),
        isPublished: Boolean(project.repositoryPublishedAt),
        publishedAt: project.repositoryPublishedAt
      };
    });

    return Response.json({ success: true, records });
  } catch (error) {
    return handleApiError(error);
  }
}
