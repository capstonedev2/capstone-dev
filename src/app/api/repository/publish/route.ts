import { UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { publishProjectToRepository } from '@/lib/repository/publish-project';
import { handleApiError, normalizeText, successResponse } from '@/lib/utils';

export const runtime = 'nodejs';

const REPOSITORY_PUBLISH_ROLES = [
  UserRole.RESEARCH_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
];

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, REPOSITORY_PUBLISH_ROLES);
    const body = await request.json().catch(() => ({}));
    const projectId = normalizeText(body?.projectId);

    if (!projectId) {
      return Response.json(
        {
          success: false,
          message: 'A projectId is required to publish a repository record.'
        },
        { status: 400 }
      );
    }

    // Integration point for the two-database architecture:
    // this API reads the active project from the main database and publishes
    // selected approved archive metadata into the repository database.
    const repositoryRecord = await publishProjectToRepository({
      projectId,
      approvedBy: user
    });

    return successResponse({
      repositoryRecord: {
        id: repositoryRecord.id,
        mainProjectId: repositoryRecord.mainProjectId,
        title: repositoryRecord.title,
        status: repositoryRecord.status,
        publishedAt: repositoryRecord.publishedAt,
        authorCount: repositoryRecord.authors.length,
        fileCount: repositoryRecord.files.length
      }
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
