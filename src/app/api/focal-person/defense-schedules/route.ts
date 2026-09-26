import { DefensePanelRole } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { handleApiError, successResponse } from '@/lib/utils';
import { withApiLogging } from '@/lib/api-logging';
import { projectDepartmentWhere } from '@/lib/department-scope';
import { personName, requireFocalDepartment } from '@/lib/focal-person/server';
import type { DefenseScheduleStatus, DepartmentDefenseSchedule } from '@/lib/focal-person/types';

export const runtime = 'nodejs';

const LIMIT = 300;

/**
 * Every defense schedule (past and upcoming) for projects in the signed-in Research Focal Person's
 * own department, read-only. The department comes from the session; there is no parameter for it.
 */
async function handleGET(request: Request) {
  try {
    const { departmentText } = await requireFocalDepartment(request);

    const schedules = await prisma.defenseSchedule.findMany({
      where: { project: projectDepartmentWhere(departmentText) },
      orderBy: { scheduledAt: 'desc' },
      take: LIMIT,
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        location: true,
        status: true,
        project: { select: { title: true, group: { select: { code: true } } } },
        evaluations: {
          select: {
            panelRole: true,
            evaluator: { select: { name: true, displayName: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    const rows: DepartmentDefenseSchedule[] = schedules.map((schedule) => {
      const chair = schedule.evaluations.find((evaluation) => evaluation.panelRole === DefensePanelRole.CHAIR);
      return {
        id: schedule.id,
        groupCode: schedule.project.group?.code ?? '—',
        projectTitle: schedule.project.title,
        typeLabel: schedule.title,
        scheduledAt: schedule.scheduledAt.toISOString(),
        venue: schedule.location || 'Venue to be announced',
        panelChair: chair ? personName(chair.evaluator) || null : null,
        panelMembers: schedule.evaluations
          .filter((evaluation) => evaluation.panelRole !== DefensePanelRole.CHAIR)
          .map((evaluation) => personName(evaluation.evaluator))
          .filter(Boolean),
        status: schedule.status.toLowerCase() as DefenseScheduleStatus
      };
    });

    return successResponse({ schedules: rows });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withApiLogging('GET', '/api/focal-person/defense-schedules', handleGET);
