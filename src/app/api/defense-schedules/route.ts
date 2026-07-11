import {
  DefensePanelRole,
  DefenseStatus,
  MilestoneStatus,
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
import { recordCheckpointSchedule } from '@/lib/milestone-checkpoint-tracking';

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

const DEFAULT_DEFENSE_SCHEDULE_LIMIT = 50;
const DEFAULT_DEFENSE_PROJECT_LIMIT = 100;
const MAX_DEFENSE_LIMIT = 200;

function parsePositiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

const SCHEDULE_TYPES = [
  'Concept Presentation',
  'Proposal Defense',
  'Pre-Final Defense',
  'Final Defense'
] as const;
const APPROVED_TITLE_PROJECT_STATUSES = new Set<ProjectStatus>([
  ProjectStatus.APPROVED,
  ProjectStatus.DEFENSE_SCHEDULED,
  ProjectStatus.COMPLETED
]);
const COMPLETED_MILESTONE_STATUSES = new Set<MilestoneStatus>([
  MilestoneStatus.APPROVED,
  MilestoneStatus.COMPLETED
]);

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

const scheduleGroupInclude = {
  groupMembers: {
    where: { isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true
        }
      }
    }
  },
  projects: {
    orderBy: { updatedAt: 'desc' },
    include: {
      adviser: {
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          displayName: true,
          department: true
        }
      },
      milestones: {
        orderBy: { sequence: 'asc' },
        select: {
          title: true,
          sequence: true,
          status: true,
          completedAt: true
        }
      },
      defenseSchedules: {
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          status: true,
          title: true
        }
      },
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: {
          status: true,
          submittedAt: true,
          reviewedAt: true
        }
      }
    }
  }
} satisfies Prisma.GroupInclude;

type DefenseAssignmentRecord = Prisma.DefenseScheduleGetPayload<{
  include: typeof defenseAssignmentInclude;
}>;

type ScheduleGroupRecord = Prisma.GroupGetPayload<{
  include: typeof scheduleGroupInclude;
}>;

type ScheduleTitleProjectRecord = ScheduleGroupRecord['projects'][number];

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

function normalizeScheduleType(value: unknown) {
  const normalized = normalizeText(value).toLowerCase();
  return SCHEDULE_TYPES.find((type) => type.toLowerCase() === normalized) || '';
}

function getPersonName(person?: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
} | null) {
  if (!person) return '';
  return person.displayName || person.name || [person.firstName, person.lastName].filter(Boolean).join(' ') || person.email || '';
}

function getApprovedTitleProject(group: ScheduleGroupRecord) {
  const preferredProject = group.projects.find((project) => (
    project.id === group.projectId && APPROVED_TITLE_PROJECT_STATUSES.has(project.status)
  ));

  return preferredProject || group.projects.find((project) => APPROVED_TITLE_PROJECT_STATUSES.has(project.status)) || null;
}

function inferScheduleStage(project: ScheduleTitleProjectRecord | null, group?: ScheduleGroupRecord) {
  const activeMilestone = project?.milestones.find((milestone) => (
    !COMPLETED_MILESTONE_STATUSES.has(milestone.status) && !milestone.completedAt
  ));
  const reference = normalizeName(
    activeMilestone?.title ||
    group?.currentMilestone ||
    group?.milestone ||
    project?.status
  );

  if (reference.includes('final') || reference.includes('completion') || project?.status === ProjectStatus.COMPLETED) {
    return 'Final Defense';
  }

  if (
    reference.includes('mock') ||
    reference.includes('pre-final') ||
    reference.includes('development') ||
    reference.includes('prototype') ||
    reference.includes('testing') ||
    reference.includes('chapter 3') ||
    reference.includes('data analysis')
  ) {
    return 'Pre-Final Defense';
  }

  if (
    reference.includes('proposal') ||
    reference.includes('chapter 1') ||
    reference.includes('chapter 2') ||
    reference.includes('chapters 1')
  ) {
    return 'Proposal Defense';
  }

  return 'Concept Presentation';
}

function getScheduleStatus(project: ScheduleTitleProjectRecord | null) {
  if (!project) {
    return 'Not Eligible';
  }

  if (project.defenseSchedules.some((schedule) => schedule.status === DefenseStatus.SCHEDULED)) {
    return 'Scheduled';
  }

  if (
    project.status === ProjectStatus.NEEDS_REVISION ||
    project.milestones.some((milestone) => milestone.status === MilestoneStatus.NEEDS_REVISION)
  ) {
    return 'Revision Required';
  }

  if (project.defenseSchedules.length > 0) {
    return 'Ready for Reschedule';
  }

  return 'Ready First Schedule';
}

function formatScheduleGroup(group: ScheduleGroupRecord) {
  const approvedProject = getApprovedTitleProject(group);
  const activeProject = approvedProject || group.projects[0] || null;
  const students = group.groupMembers.length
    ? group.groupMembers.map((member) => getPersonName(member.user) || member.userId)
    : group.students || [];
  const department = group.department || group.dept || activeProject?.departmentId || activeProject?.adviser?.department || 'Unassigned';
  const titles = group.projects
    .filter((project) => APPROVED_TITLE_PROJECT_STATUSES.has(project.status))
    .map((project) => {
    const latestSubmission = project.submissions[0] || null;

    return {
      id: project.id,
      title: project.title,
      status: project.status,
      submittedAt: latestSubmission?.submittedAt?.toISOString() || project.createdAt.toISOString(),
      reviewedAt: latestSubmission?.reviewedAt?.toISOString() || null,
      isApproved: APPROVED_TITLE_PROJECT_STATUSES.has(project.status)
    };
  });

  return {
    id: group.id,
    groupId: group.id,
    projectId: approvedProject?.id || null,
    code: group.code,
    title: (group.title && group.title !== 'Pending Student Submission' && group.title !== 'Awaiting Adviser Approval') ? group.title : (group.projectTitle || approvedProject?.title || group.code),
    approvedTitle: approvedProject?.title || null,
    titles,
    isEligible: Boolean(approvedProject),
    ineligibilityReason: approvedProject ? null : 'No adviser-approved title yet.',
    department,
    batchSection: group.code || department,
    adviser: getPersonName(activeProject?.adviser) || 'Unassigned adviser',
    students,
    currentStage: approvedProject?.milestones.find((milestone) => (
      !COMPLETED_MILESTONE_STATUSES.has(milestone.status) && !milestone.completedAt
    ))?.title || group.currentMilestone || group.milestone || 'Concept',
    eligibleStage: inferScheduleStage(approvedProject, group),
    attemptCount: Math.max(1, (approvedProject?.defenseSchedules.length || 0) + 1),
    scheduleStatus: getScheduleStatus(approvedProject)
  };
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
    const scheduleLimit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_DEFENSE_SCHEDULE_LIMIT, MAX_DEFENSE_LIMIT);
    const projectLimit = parsePositiveInteger(searchParams.get('projectLimit'), DEFAULT_DEFENSE_PROJECT_LIMIT, MAX_DEFENSE_LIMIT);
    const page = parsePositiveInteger(searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER);

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
      },
      skip: (page - 1) * scheduleLimit,
      take: scheduleLimit
    });

    const assignments = schedules.map(formatAssignment);
    const groupWhere: Prisma.GroupWhereInput = {};

    /* if ((authUser.role === UserRole.PROGRAM_HEAD || authUser.role === UserRole.RESEARCH_HEAD) && authUser.department) {
      const deptSearch = { equals: authUser.department, mode: 'insensitive' as Prisma.QueryMode };
      groupWhere.OR = [
        { department: deptSearch },
        { dept: deptSearch },
        { projects: { some: { departmentId: deptSearch } } }
      ];
    } */

    const scheduleGroups = await prisma.group.findMany({
      where: groupWhere,
      include: scheduleGroupInclude,
      orderBy: {
        updatedAt: 'desc'
      },
      take: projectLimit
    });

    return successResponse({
      assignment: assignments[0] || null,
      assignments,
      scheduleProjects: scheduleGroups.map(formatScheduleGroup)
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
    const scheduleType = normalizeScheduleType(body.scheduleType);
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
    if (!scheduleType) fieldErrors.scheduleType = 'Choose a valid presentation type.';
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

    const group = await prisma.group.findUnique({
      where: { code: groupCode },
      include: scheduleGroupInclude
    });

    if (!group) {
      throw new HttpError('Group was not found.', 404, {
        group: 'Choose an existing group from the schedule list.'
      });
    }

    const approvedProject = getApprovedTitleProject(group);

    if (!approvedProject) {
      throw new HttpError('This group is not eligible for defense scheduling because it has no approved title yet.', 400, {
        group: 'Approve one title proposal before scheduling a presentation.'
      });
    }

    const actualAdviserIsPanelist = approvedProject.adviserId
      ? uniquePanelIds.includes(approvedProject.adviserId)
      : false;
    const adviserKey = normalizeFacultyIdentity(adviserName);
    const adviserNameIsPanelist = adviserKey
      ? panelUsers.some((user) => getFacultyIdentityKeys(user).includes(adviserKey))
      : false;

    if (actualAdviserIsPanelist || adviserNameIsPanelist) {
      throw new HttpError('The academic adviser cannot be assigned as a scoring panelist.', 400, {
        panel: 'Choose faculty who are not the project adviser.'
      });
    }

    const project = await prisma.project.update({
      where: { id: approvedProject.id },
      data: {
        status: ProjectStatus.DEFENSE_SCHEDULED,
        groupId: group.id
      }
    });

    if (group.projectId !== project.id || group.projectTitle !== project.title) {
      await prisma.group.update({
        where: { id: group.id },
        data: {
          projectId: project.id,
          projectTitle: project.title
        }
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

    await recordCheckpointSchedule(prisma, {
      projectId: project.id,
      title: scheduleType,
      scheduledAt
    });

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
