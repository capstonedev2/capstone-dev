import {
  DefensePanelRole,
  DefenseStatus,
  Prisma,
  ProjectStatus,
  UserRole
} from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  normalizeText,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

const SCHEDULE_VIEWER_ROLES: UserRole[] = [
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.PROGRAM_HEAD,
  UserRole.RESEARCH_HEAD,
  UserRole.ADMIN,
  UserRole.SYSTEM_ADMIN
];

const SCHEDULE_MANAGER_ROLES: UserRole[] = [
  UserRole.PROGRAM_HEAD,
  UserRole.SYSTEM_ADMIN
];

const SESSION_END_ROLES: UserRole[] = [
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.PROGRAM_HEAD,
  UserRole.SYSTEM_ADMIN
];

const defenseAssignmentInclude = {
  project: {
    include: {
      group: true,
      adviser: {
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          department: true
        }
      }
    }
  },
  evaluations: {
    include: {
      evaluator: {
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          department: true,
          role: true
        }
      }
    },
    orderBy: [
      { panelRole: 'asc' },
      { createdAt: 'asc' }
    ]
  }
} satisfies Prisma.DefenseScheduleInclude;

type DefenseAssignmentRecord = Prisma.DefenseScheduleGetPayload<{
  include: typeof defenseAssignmentInclude;
}>;

type SaveDefenseScheduleBody = {
  groupCode?: unknown;
  projectTitle?: unknown;
  scheduleType?: unknown;
  department?: unknown;
  adviserName?: unknown;
  students?: unknown;
  date?: unknown;
  time?: unknown;
  room?: unknown;
  chairId?: unknown;
  memberIds?: unknown;
};

function normalizeName(value: unknown) {
  return normalizeText(value).replace(/\s+/g, ' ').toLowerCase();
}

function normalizeFacultyIdentity(value: unknown) {
  return normalizeName(value)
    .replace(/(^|\s)(dr|prof|professor|engr|engineer|mr|mrs|ms)\.?(?=\s|$)/g, ' ')
    .replace(/[^\p{L}\p{N}@.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFacultyIdentityKeys(user: {
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
}) {
  return [
    normalizeFacultyIdentity(user.displayName),
    normalizeFacultyIdentity(user.name),
    normalizeFacultyIdentity(user.email)
  ].filter(Boolean);
}

function toScheduledAt(dateValue: string, timeValue: string) {
  const scheduledAt = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new HttpError('Choose a valid defense date and time.', 400, {
      date: 'Choose a valid date.',
      time: 'Choose a valid time.'
    });
  }

  return scheduledAt;
}

function formatAssignment(schedule: DefenseAssignmentRecord) {
  const panelists = schedule.evaluations
    .filter((evaluation) => evaluation.evaluator)
    .map((evaluation) => ({
      id: evaluation.evaluator?.id || '',
      email: evaluation.evaluator?.email || '',
      name: evaluation.evaluator?.displayName || evaluation.evaluator?.name || evaluation.evaluator?.email || 'Panelist',
      department: evaluation.evaluator?.department || '',
      role: evaluation.evaluator?.role,
      panelRole: evaluation.panelRole
    }));
  const chair = panelists.find((panelist) => panelist.panelRole === DefensePanelRole.CHAIR) || null;

  return {
    id: schedule.id,
    projectId: schedule.projectId,
    groupCode: schedule.project.group?.code || '',
    groupTitle: schedule.project.group?.title || '',
    projectTitle: schedule.project.title,
    scheduleType: schedule.title,
    department: schedule.project.group?.department || schedule.project.adviser?.department || '',
    students: schedule.project.group?.students || [],
    leader: schedule.project.group?.leader || schedule.project.group?.students?.[0] || '',
    adviserName: schedule.project.adviser?.displayName || schedule.project.adviser?.name || schedule.project.adviser?.email || '',
    scheduledAt: schedule.scheduledAt.toISOString(),
    date: schedule.scheduledAt.toISOString().slice(0, 10),
    time: schedule.scheduledAt.toTimeString().slice(0, 5),
    room: schedule.location || '',
    status: schedule.status,
    chairId: chair?.id || '',
    memberIds: panelists.filter((panelist) => panelist.panelRole === DefensePanelRole.MEMBER).map((panelist) => panelist.id),
    panelists
  };
}

async function findAssignmentById(id: string) {
  return prisma.defenseSchedule.findUnique({
    where: { id },
    include: defenseAssignmentInclude
  });
}

export async function GET(request: Request) {
  try {
    const authUser = await requireAuthenticatedUser(request, SCHEDULE_VIEWER_ROLES);
    const { searchParams } = new URL(request.url);
    const groupCode = normalizeText(searchParams.get('groupCode'));

    const where: Prisma.DefenseScheduleWhereInput = {
      status: DefenseStatus.SCHEDULED
    };

    if (groupCode) {
      const group = await prisma.group.findUnique({
        where: { code: groupCode },
        select: { id: true }
      });

      if (!group) {
        return successResponse({ assignment: null, assignments: [] });
      }

      where.project = {
        groupId: group.id
      };
    }

    if (authUser.role === UserRole.ADVISER || authUser.role === UserRole.PANEL) {
      where.OR = [
        { evaluations: { some: { evaluatorId: authUser.id } } },
        { project: { adviserId: authUser.id } }
      ];
    }

    const schedules = await prisma.defenseSchedule.findMany({
      where,
      include: defenseAssignmentInclude,
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    const assignments = schedules.map(formatAssignment);

    return successResponse({
      assignment: assignments[0] || null,
      assignments
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireAuthenticatedUser(request, SCHEDULE_MANAGER_ROLES);
    const body = await parseJsonBody<SaveDefenseScheduleBody>(request);

    const groupCode = normalizeText(body.groupCode);
    const projectTitle = normalizeText(body.projectTitle);
    const scheduleType = normalizeText(body.scheduleType) || 'Concept Proposal';
    const department = normalizeText(body.department);
    const adviserName = normalizeText(body.adviserName);
    const date = normalizeText(body.date);
    const time = normalizeText(body.time);
    const room = normalizeText(body.room);
    const chairId = normalizeText(body.chairId);
    const memberIds = Array.isArray(body.memberIds)
      ? body.memberIds.map(normalizeText).filter(Boolean)
      : [];

    const fieldErrors: Record<string, string> = {};

    if (!groupCode) fieldErrors.group = 'Select a group to schedule.';
    if (!projectTitle) fieldErrors.projectTitle = 'Project title is required.';
    if (!scheduleType) fieldErrors.scheduleType = 'Choose the schedule type.';
    if (!date) fieldErrors.date = 'Choose a defense date.';
    if (!time) fieldErrors.time = 'Choose a defense time.';
    if (!room) fieldErrors.room = 'Choose a venue.';
    if (!chairId) fieldErrors.chairId = 'Choose a panel chair.';

    const panelIds = [chairId, ...memberIds].filter(Boolean);
    const uniquePanelIds = Array.from(new Set(panelIds));

    if (uniquePanelIds.length !== panelIds.length) {
      fieldErrors.panel = 'Panel chair and members must be different faculty accounts.';
    }

    if (Object.keys(fieldErrors).length) {
      throw new HttpError('Please complete the defense schedule details.', 400, fieldErrors);
    }

    const scheduledAt = toScheduledAt(date, time);
    const panelUsers = await prisma.user.findMany({
      where: {
        id: { in: uniquePanelIds },
        role: { in: [UserRole.ADVISER, UserRole.PANEL] },
        isSuspended: false
      }
    });

    if (panelUsers.length !== uniquePanelIds.length) {
      throw new HttpError('One or more selected panelists are no longer available.', 400, {
        panel: 'Refresh and choose available faculty accounts.'
      });
    }

    const adviserKey = normalizeFacultyIdentity(adviserName);
    const adviserIsPanelist = adviserKey
      ? panelUsers.some((user) => (
          getFacultyIdentityKeys(user).includes(adviserKey)
        ))
      : false;

    if (adviserIsPanelist) {
      throw new HttpError('The academic adviser cannot be assigned as a scoring panelist.', 400, {
        panel: 'Choose faculty who are not the project adviser.'
      });
    }

    const academicAdviser = adviserName
      ? await prisma.user.findFirst({
          where: {
            OR: [
              { name: adviserName },
              { displayName: adviserName },
              { email: adviserName },
              { name: { contains: adviserName.replace(/\b(Dr|Prof|Professor|Engr|Engineer|Mr|Mrs|Ms)\.?\s+/gi, ''), mode: 'insensitive' } },
              { displayName: { contains: adviserName.replace(/\b(Dr|Prof|Professor|Engr|Engineer|Mr|Mrs|Ms)\.?\s+/gi, ''), mode: 'insensitive' } }
            ]
          }
        })
      : null;
    const students = Array.isArray(body.students)
      ? body.students.map(normalizeText).filter(Boolean)
      : [];
    const departmentCode = department || authUser.department || 'IT';

    const group = await prisma.group.upsert({
      where: { code: groupCode },
      update: {
        title: groupCode,
        projectTitle,
        dept: departmentCode,
        department: departmentCode,
        students,
        members: students.length,
        ...(academicAdviser ? { userId: academicAdviser.id } : {})
      },
      create: {
        userId: academicAdviser?.id || authUser.id,
        code: groupCode,
        title: groupCode,
        projectTitle,
        dept: departmentCode,
        department: departmentCode,
        students,
        members: students.length,
        leader: students[0] || null,
        status: 'active',
        statusLabel: 'Active',
        statusClass: 'status-active'
      }
    });

    const existingProject = group.projectId
      ? await prisma.project.findUnique({ where: { id: group.projectId } })
      : await prisma.project.findFirst({
          where: {
            OR: [
              { groupId: group.id },
              { title: projectTitle }
            ]
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

    const project = existingProject
      ? await prisma.project.update({
          where: { id: existingProject.id },
          data: {
            title: projectTitle,
            status: ProjectStatus.DEFENSE_SCHEDULED,
            groupId: group.id,
            adviserId: academicAdviser?.id || existingProject.adviserId
          }
        })
      : await prisma.project.create({
          data: {
            title: projectTitle,
            status: ProjectStatus.DEFENSE_SCHEDULED,
            groupId: group.id,
            adviserId: academicAdviser?.id || null
          }
        });

    if (group.projectId !== project.id) {
      await prisma.group.update({
        where: { id: group.id },
        data: { projectId: project.id }
      });
    }

    const existingSchedule = await prisma.defenseSchedule.findFirst({
      where: {
        projectId: project.id,
        title: scheduleType,
        status: { not: DefenseStatus.CANCELLED }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const schedule = existingSchedule
      ? await prisma.defenseSchedule.update({
          where: { id: existingSchedule.id },
          data: {
            scheduledById: authUser.id,
            title: scheduleType,
            scheduledAt,
            location: room,
            status: DefenseStatus.SCHEDULED,
            notes: `${scheduleType} scheduled. Panel chair assigned to ${panelUsers.find((user) => user.id === chairId)?.name || 'selected faculty'}.`
          }
        })
      : await prisma.defenseSchedule.create({
          data: {
            projectId: project.id,
            scheduledById: authUser.id,
            title: scheduleType,
            scheduledAt,
            location: room,
            status: DefenseStatus.SCHEDULED,
            notes: `${scheduleType} scheduled. Panel chair assigned to ${panelUsers.find((user) => user.id === chairId)?.name || 'selected faculty'}.`
          }
        });

    await prisma.evaluation.deleteMany({
      where: {
        defenseScheduleId: schedule.id,
        evaluatorId: {
          notIn: uniquePanelIds
        }
      }
    });

    await Promise.all(uniquePanelIds.map((evaluatorId) => (
      prisma.evaluation.upsert({
        where: {
          defenseScheduleId_evaluatorId: {
            defenseScheduleId: schedule.id,
            evaluatorId
          }
        },
        update: {
          projectId: project.id,
          panelRole: evaluatorId === chairId ? DefensePanelRole.CHAIR : DefensePanelRole.MEMBER
        },
        create: {
          projectId: project.id,
          defenseScheduleId: schedule.id,
          evaluatorId,
          panelRole: evaluatorId === chairId ? DefensePanelRole.CHAIR : DefensePanelRole.MEMBER
        }
      })
    )));

    const assignment = await findAssignmentById(schedule.id);

    if (!assignment) {
      throw new HttpError('Defense schedule was saved but could not be reloaded.', 500);
    }

    return successResponse({
      message: 'Defense schedule and panel chair assignment saved.',
      assignment: formatAssignment(assignment)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await requireAuthenticatedUser(request, SESSION_END_ROLES);

    const activeSchedules = await prisma.defenseSchedule.findMany({
      where: {
        status: DefenseStatus.SCHEDULED,
        evaluations: {
          some: { evaluatorId: authUser.id }
        }
      },
      select: { id: true }
    });

    if (activeSchedules.length === 0) {
      return successResponse({ message: 'No active defense sessions found.', ended: 0 });
    }

    const scheduleIds = activeSchedules.map((s) => s.id);

    await prisma.defenseSchedule.updateMany({
      where: { id: { in: scheduleIds } },
      data: { status: DefenseStatus.COMPLETED }
    });

    return successResponse({
      message: `${scheduleIds.length} defense session(s) ended successfully.`,
      ended: scheduleIds.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}
