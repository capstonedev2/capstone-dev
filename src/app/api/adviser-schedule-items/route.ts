import {
  AdviserScheduleItemStatus,
  AdviserScheduleItemType,
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

const ADVISER_SCHEDULE_ROLES = [
  UserRole.ADVISER,
  UserRole.ADMIN,
  UserRole.SYSTEM_ADMIN
];

const DEFAULT_SCHEDULE_LIMIT = 50;
const DEFAULT_SCHEDULE_PROJECT_LIMIT = 100;
const MAX_SCHEDULE_LIMIT = 100;

function parsePositiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

const scheduleTypeLabels: Record<AdviserScheduleItemType, string> = {
  [AdviserScheduleItemType.CONSULTATION]: 'Consultation',
  [AdviserScheduleItemType.DEADLINE]: 'Deadline',
  [AdviserScheduleItemType.MEETING]: 'Meeting',
  [AdviserScheduleItemType.REMINDER]: 'Reminder',
  [AdviserScheduleItemType.EVENT]: 'Event',
  [AdviserScheduleItemType.REVIEW]: 'Review'
};

function parseScheduleType(value: unknown) {
  const normalized = normalizeText(value).toLowerCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'consultation':
      return AdviserScheduleItemType.CONSULTATION;
    case 'deadline':
    case 'due_date':
      return AdviserScheduleItemType.DEADLINE;
    case 'meeting':
      return AdviserScheduleItemType.MEETING;
    case 'reminder':
      return AdviserScheduleItemType.REMINDER;
    case 'event':
      return AdviserScheduleItemType.EVENT;
    case 'review':
    case 'milestone_review':
      return AdviserScheduleItemType.REVIEW;
    default:
      throw new HttpError('Choose a valid schedule type.', 400, {
        type: 'Choose consultation, deadline, meeting, reminder, event, or review.'
      });
  }
}

function parseScheduleDate(dateValue: unknown, timeValue: unknown) {
  const date = normalizeText(dateValue);
  const time = normalizeText(timeValue) || '08:00';

  if (!date) {
    throw new HttpError('Choose a schedule date.', 400, {
      date: 'Choose a schedule date.'
    });
  }

  const scheduledAt = new Date(`${date}T${time}:00`);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new HttpError('Choose a valid schedule date and time.', 400, {
      date: 'Choose a valid date.',
      time: 'Choose a valid time.'
    });
  }

  return scheduledAt;
}

function getProjectAccessWhere(user: Awaited<ReturnType<typeof requireAuthenticatedUser>>) {
  if (user.role === UserRole.ADMIN || user.role === UserRole.SYSTEM_ADMIN) {
    return {};
  }

  return {
    OR: [
      { adviserId: user.id },
      { group: { userId: user.id } }
    ]
  };
}

function formatPersonName(user?: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
} | null) {
  return normalizeText(user?.displayName)
    || normalizeText(user?.name)
    || normalizeText(`${user?.firstName || ''} ${user?.lastName || ''}`)
    || normalizeText(user?.email)
    || 'Student';
}

function formatScheduleItem(item: {
  id: string;
  projectId: string;
  type: AdviserScheduleItemType;
  status: AdviserScheduleItemStatus;
  title: string;
  scheduledAt: Date;
  endsAt: Date | null;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    title: string;
    group: {
      code: string;
      title: string;
    } | null;
  };
}) {
  return {
    id: item.id,
    projectId: item.projectId,
    type: item.type,
    typeLabel: scheduleTypeLabels[item.type],
    status: item.status,
    title: item.title,
    scheduledAt: item.scheduledAt.toISOString(),
    endsAt: item.endsAt?.toISOString() || null,
    location: item.location || '',
    notes: item.notes || '',
    groupCode: item.project.group?.code || '',
    groupTitle: item.project.group?.title || item.project.title,
    projectTitle: item.project.title,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

function formatProjectOption(project: {
  id: string;
  title: string;
  group: {
    code: string;
    title: string;
    students: string[];
    leader: string | null;
    groupMembers: Array<{
      userId: string;
      isActive: boolean;
      role: string;
      user: {
        id: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        email: string;
      };
    }>;
  } | null;
}) {
  const activeMembers = project.group?.groupMembers.filter((member) => member.isActive) || [];

  return {
    id: project.id,
    title: project.title,
    groupCode: project.group?.code || '',
    groupTitle: project.group?.title || project.title,
    leaderName: project.group?.leader || activeMembers.find((member) => member.role === 'LEADER')?.user.name || '',
    members: activeMembers.map((member) => ({
      userId: member.userId,
      name: formatPersonName(member.user),
      isLeader: member.role === 'LEADER'
    }))
  };
}

async function getProjectForSchedule(projectId: string, user: Awaited<ReturnType<typeof requireAuthenticatedUser>>) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ...getProjectAccessWhere(user)
    },
    include: {
      group: {
        include: {
          groupMembers: {
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
          }
        }
      }
    }
  });
}

async function notifyProjectStudents({
  project,
  itemId,
  type,
  title,
  scheduledAt
}: {
  project: Awaited<ReturnType<typeof getProjectForSchedule>>;
  itemId: string;
  type: AdviserScheduleItemType;
  title: string;
  scheduledAt: Date;
}) {
  if (!project?.group) {
    return;
  }

  const recipientIds = Array.from(new Set(
    project.group.groupMembers
      .filter((member) => member.isActive)
      .map((member) => member.userId)
      .filter(Boolean)
  ));

  if (!recipientIds.length) {
    return;
  }

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(scheduledAt);
  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      title: 'Schedule Updated',
      message: `${scheduleTypeLabels[type]} scheduled: "${title}" on ${dateLabel}.`,
      type: type === AdviserScheduleItemType.DEADLINE ? 'deadline' : 'info',
      entityType: 'adviser_schedule_item',
      entityId: itemId
    }))
  });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, ADVISER_SCHEDULE_ROLES);
    const accessWhere = getProjectAccessWhere(user);
    const url = new URL(request.url);
    const itemLimit = parsePositiveInteger(url.searchParams.get('limit'), DEFAULT_SCHEDULE_LIMIT, MAX_SCHEDULE_LIMIT);
    const projectLimit = parsePositiveInteger(url.searchParams.get('projectLimit'), DEFAULT_SCHEDULE_PROJECT_LIMIT, MAX_SCHEDULE_LIMIT);

    const [items, projects] = await Promise.all([
      prisma.adviserScheduleItem.findMany({
        where: {
          project: { is: accessWhere }
        },
        include: {
          project: {
            select: {
              title: true,
              group: {
                select: {
                  code: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { scheduledAt: 'asc' },
        take: itemLimit
      }),
      prisma.project.findMany({
        where: accessWhere,
        select: {
          id: true,
          title: true,
          group: {
            select: {
              code: true,
              title: true,
              students: true,
              leader: true,
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
                      displayName: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: projectLimit
      })
    ]);

    return successResponse({
      items: items.map(formatScheduleItem),
      projects: projects.map(formatProjectOption)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, ADVISER_SCHEDULE_ROLES);
    const body = await parseJsonBody<{
      projectId?: unknown;
      type?: unknown;
      title?: unknown;
      date?: unknown;
      time?: unknown;
      location?: unknown;
      notes?: unknown;
      notifyStudents?: unknown;
    }>(request);

    const projectId = normalizeText(body.projectId);
    const type = parseScheduleType(body.type);
    const scheduledAt = parseScheduleDate(body.date, body.time);
    const location = normalizeText(body.location);
    const notes = normalizeText(body.notes);
    const title = normalizeText(body.title) || `${scheduleTypeLabels[type]} schedule`;

    if (!projectId) {
      throw new HttpError('Choose a project or group for this schedule.', 400, {
        projectId: 'Choose a project or group.'
      });
    }

    const project = await getProjectForSchedule(projectId, user);

    if (!project) {
      throw new HttpError('Project was not found or is not assigned to this adviser.', 404);
    }

    const item = await prisma.adviserScheduleItem.create({
      data: {
        projectId,
        scheduledById: user.id,
        type,
        title,
        scheduledAt,
        location: location || null,
        notes: notes || null
      },
      include: {
        project: {
          select: {
            title: true,
            group: {
              select: {
                code: true,
                title: true
              }
            }
          }
        }
      }
    });

    await recordCheckpointSchedule(prisma, {
      projectId,
      title,
      scheduledAt
    });

    if (body.notifyStudents !== false) {
      await notifyProjectStudents({
        project,
        itemId: item.id,
        type,
        title,
        scheduledAt
      });
    }

    return successResponse({
      item: formatScheduleItem(item),
      message: `${scheduleTypeLabels[type]} schedule saved.`
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
