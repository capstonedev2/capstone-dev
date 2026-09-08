import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuthenticatedUser } from '@/lib/auth';

const REVIEW_ROLES = new Set(['PROGRAM_HEAD', 'ADMIN', 'SYSTEM_ADMIN']);

export async function GET(request: Request) {
  try {
    const authUser = await getServerAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!REVIEW_ROLES.has(authUser.role)) {
      return NextResponse.json({ error: 'You do not have permission to view demotion requests.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const requests = await prisma.groupDemotionRequest.findMany({
      where: statusParam ? { status: statusParam.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED' } : undefined,
      include: {
        group: {
          select: { id: true, code: true, title: true, department: true, progress: true }
        },
        requestedBy: {
          select: { id: true, name: true, displayName: true, email: true }
        },
        reviewedBy: {
          select: { id: true, name: true, displayName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({
      requests: requests.map((item) => ({
        id: item.id,
        groupId: item.groupId,
        groupCode: item.group.code,
        groupTitle: item.group.title,
        department: item.group.department,
        progress: item.group.progress,
        projectId: item.projectId,
        reason: item.reason,
        status: item.status,
        requestedBy: item.requestedBy?.displayName || item.requestedBy?.name || item.requestedBy?.email || 'Unknown',
        requestedAt: item.createdAt.toISOString(),
        reviewedBy: item.reviewedBy?.displayName || item.reviewedBy?.name || item.reviewedBy?.email || null,
        reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
        reviewNotes: item.reviewNotes
      }))
    });
  } catch (error) {
    console.error('Failed to load demotion requests', error);
    return NextResponse.json({ error: 'Unable to load demotion requests.' }, { status: 500 });
  }
}
