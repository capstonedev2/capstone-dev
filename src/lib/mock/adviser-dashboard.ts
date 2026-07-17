import { cache } from 'react';
import { getServerAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@/generated/prisma/client';

const now = '2026-04-06T00:00:00.000Z';

export type AdviserDashboardData = {
  profile: {
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    fullName: string;
    roleLabel: string;
    department: string;
    notificationCount: number;
    email?: string;
    contactNumber?: string;
    office?: string;
    accountSummary?: string;
    profileImage?: string;
    displayName?: string;
    rawRole?: string;
  };
  adviserActivity: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    icon: string;
    title: string;
    text: string;
    time: string;
    href?: string;
    meta?: string;
    tone?: 'primary' | 'info' | 'warning' | 'danger' | 'success' | 'neutral';
  }>;
  panelActivity: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    icon: string;
    title: string;
    text: string;
    time: string;
    href?: string;
    meta?: string;
    tone?: 'primary' | 'info' | 'warning' | 'danger' | 'success' | 'neutral';
  }>;
  groups: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    code: string;
    title: string;
    projectTitle: string;
    dept: string;
    department: string;
    members: number;
    students: string[];
    progress: number;
    statusLabel: string;
    statusClass: string;
    milestone: string;
    currentMilestone: string;
    finalDefenseResult: 'Passed' | 'Failed' | 'Pending' | 'Scheduled';
    finalManuscriptApproved: boolean;
    allRequiredMilestonesCompleted: boolean;
    completedAt: string | null;
    finalScore: number | null;
    finalRecommendation: string | null;
    leader: string | null;
  }>;
  panelProjects: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    title: string;
    dept: string;
    students: string;
    defenseDate: string;
    statusLabel: string;
    statusClass: string;
  }>;
  recentSubmissions: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    group: string;
    type: string;
    action: string;
  }>;
  upcomingSchedule: string[];
  departmentPerformance: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    name: string;
    progress: number;
  }>;
  adviserSubmissions: Array<{
    id: string;
    groupCode: string;
    groupName: string;
    dept: string;
    type: string;
    title: string;
    submitted: string;
    status: string;
    reviewDays: number;
    icon: string;
    summary: string;
    latestNote: string;
    nextStep: string;
    dueLabel: string;
    approvedThisWeek: boolean;
  }>;
};

const adviserDashboardData: AdviserDashboardData = {
  profile: {
    id: 'user-adviser-001',
    user_id: 'user-adviser-001',
    project_id: 'project-it-dashboard',
    status: 'active',
    created_at: now,
    updated_at: now,
    fullName: 'Dr. Ricardo M. Cruz',
    roleLabel: 'Adviser & Panel Portal',
    department: 'IT Department',
    notificationCount: 5
  },
  adviserActivity: [
    {
      id: 'activity-001',
      user_id: 'user-adviser-001',
      project_id: 'project-it-001',
      status: 'completed',
      created_at: now,
      updated_at: now,
      icon: 'fa-check-circle',
      title: 'Chapter 3 Approved - Group A1',
      text: 'Methodology chapter approved. Students can proceed to data collection.',
      time: '2 hours ago',
      meta: 'Adviser Activity'
    },
    {
      id: 'activity-002',
      user_id: 'user-adviser-001',
      project_id: 'project-it-002',
      status: 'completed',
      created_at: now,
      updated_at: now,
      icon: 'fa-comment',
      title: 'Feedback Provided - Group B2',
      text: 'Proposal revision comments were sent with a follow-up due on Mar 30.',
      time: 'Yesterday',
      meta: 'Adviser Activity'
    },
    {
      id: 'activity-003',
      user_id: 'user-adviser-001',
      project_id: 'project-it-003',
      status: 'confirmed',
      created_at: now,
      updated_at: now,
      icon: 'fa-calendar-check',
      title: 'Consultation Scheduled - Group C3',
      text: 'Meeting locked in for Mar 29, 2026 at 10:30 AM in Consult Room B.',
      time: '2 days ago',
      meta: 'Adviser Activity'
    },
    {
      id: 'activity-004',
      user_id: 'user-adviser-001',
      project_id: 'project-it-004',
      status: 'approved',
      created_at: now,
      updated_at: now,
      icon: 'fa-file-signature',
      title: 'Title Approved - Group D4',
      text: '"Capstone Submission Monitoring Platform" cleared initial review and is ready for the next phase.',
      time: '3 days ago',
      meta: 'Adviser Activity'
    }
  ],
  panelActivity: [
    {
      id: 'panel-activity-001',
      user_id: 'user-adviser-001',
      project_id: 'project-panel-001',
      status: 'confirmed',
      created_at: now,
      updated_at: now,
      icon: 'fa-users-viewfinder',
      title: 'Panel Assignment Confirmed',
      text: 'You were assigned to two upcoming IT proposal defenses this review cycle.',
      time: 'Today',
      meta: 'Panel Activity'
    },
    {
      id: 'panel-activity-002',
      user_id: 'user-adviser-001',
      project_id: 'project-panel-002',
      status: 'pending',
      created_at: now,
      updated_at: now,
      icon: 'fa-clipboard-check',
      title: 'Evaluation Packet Ready',
      text: 'Blockchain for Supply Chain is ready for scoring before the Apr 3 defense.',
      time: 'Yesterday',
      meta: 'Panel Activity'
    },
    {
      id: 'panel-activity-003',
      user_id: 'user-adviser-001',
      project_id: 'project-panel-003',
      status: 'scheduled',
      created_at: now,
      updated_at: now,
      icon: 'fa-calendar-day',
      title: 'Defense Schedule Published',
      text: 'Campus Safety Tracker was added to the Apr 5 defense lineup.',
      time: '2 days ago',
      meta: 'Panel Activity'
    }
  ],
  groups: [
    {
      id: 'A1',
      user_id: 'user-adviser-001',
      project_id: 'project-it-001',
      status: 'active',
      created_at: now,
      updated_at: now,
      code: 'IT-2024-01',
      title: 'AI-Powered Learning System',
      projectTitle: 'AI-Powered Learning System',
      dept: 'IT',
      department: 'IT',
      members: 0,
      students: [],
      progress: 75,
      statusLabel: 'Active',
      statusClass: 'status-active',
      milestone: 'Chapter 3 revision',
      currentMilestone: 'Chapter 3 revision',
      finalDefenseResult: 'Scheduled',
      finalManuscriptApproved: false,
      allRequiredMilestonesCompleted: false,
      completedAt: null,
      finalScore: null,
      finalRecommendation: null,
      leader: null
    },
    {
      id: 'B2',
      user_id: 'user-adviser-001',
      project_id: 'project-it-002',
      status: 'pending',
      created_at: now,
      updated_at: now,
      code: 'IT-2024-02',
      title: 'Capstone Submission Platform',
      projectTitle: 'Capstone Submission Platform',
      dept: 'IT',
      department: 'IT',
      members: 0,
      students: [],
      progress: 45,
      statusLabel: 'Pending',
      statusClass: 'status-pending',
      milestone: 'Proposal refinement',
      currentMilestone: 'Proposal refinement',
      finalDefenseResult: 'Pending',
      finalManuscriptApproved: false,
      allRequiredMilestonesCompleted: false,
      completedAt: null,
      finalScore: null,
      finalRecommendation: null,
      leader: null
    },
    {
      id: 'C3',
      user_id: 'user-adviser-001',
      project_id: 'project-it-003',
      status: 'needs-revision',
      created_at: now,
      updated_at: now,
      code: 'IT-2024-03',
      title: 'Campus Safety Tracker',
      projectTitle: 'Campus Safety Tracker',
      dept: 'IT',
      department: 'IT',
      members: 0,
      students: [],
      progress: 60,
      statusLabel: 'Needs Revision',
      statusClass: 'status-revise',
      milestone: 'Security testing review',
      currentMilestone: 'Security testing review',
      finalDefenseResult: 'Pending',
      finalManuscriptApproved: false,
      allRequiredMilestonesCompleted: false,
      completedAt: null,
      finalScore: null,
      finalRecommendation: 'Resubmit the security validation report before final scheduling.',
      leader: null
    },
    {
      id: 'D4',
      user_id: 'user-adviser-001',
      project_id: 'project-it-004',
      status: 'active',
      created_at: now,
      updated_at: now,
      code: 'IT-2024-04',
      title: 'Smart Inventory Assistant',
      projectTitle: 'Smart Inventory Assistant',
      dept: 'IT',
      department: 'IT',
      members: 0,
      students: [],
      progress: 100,
      statusLabel: 'Active',
      statusClass: 'status-active',
      milestone: 'Final archive endorsement',
      currentMilestone: 'Final archive endorsement',
      finalDefenseResult: 'Passed',
      finalManuscriptApproved: true,
      allRequiredMilestonesCompleted: true,
      completedAt: '2026-04-04T00:00:00.000Z',
      finalScore: 96,
      finalRecommendation: 'Ready for archiving and alumni showcase endorsement.',
      leader: null
    },
    {
      id: 'E5',
      user_id: 'user-adviser-001',
      project_id: 'project-it-005',
      status: 'at-risk',
      created_at: now,
      updated_at: now,
      code: 'IT-2024-05',
      title: 'Smart Barangay Response Hub',
      projectTitle: 'Smart Barangay Response Hub',
      dept: 'IT',
      department: 'IT',
      members: 0,
      students: [],
      progress: 32,
      statusLabel: 'At Risk',
      statusClass: 'status-warning',
      milestone: 'Prototype recovery sprint',
      currentMilestone: 'Prototype recovery sprint',
      finalDefenseResult: 'Pending',
      finalManuscriptApproved: false,
      allRequiredMilestonesCompleted: false,
      completedAt: null,
      finalScore: null,
      finalRecommendation: 'Prioritize system stabilization and document the recovery plan.',
      leader: null
    }
  ],
  panelProjects: [
    {
      id: 'panel-project-001',
      user_id: 'user-adviser-001',
      project_id: 'project-panel-001',
      status: 'pending',
      created_at: now,
      updated_at: now,
      title: 'Blockchain for Supply Chain',
      dept: 'IT',
      students: 'No students assigned',
      defenseDate: 'Apr 3, 2026',
      statusLabel: 'Pending',
      statusClass: 'status-pending'
    },
    {
      id: 'panel-project-002',
      user_id: 'user-adviser-001',
      project_id: 'project-panel-002',
      status: 'scheduled',
      created_at: now,
      updated_at: now,
      title: 'Campus Safety Tracker',
      dept: 'IT',
      students: 'No students assigned',
      defenseDate: 'Apr 5, 2026',
      statusLabel: 'Scheduled',
      statusClass: 'status-warning'
    },
    {
      id: 'panel-project-003',
      user_id: 'user-adviser-001',
      project_id: 'project-panel-003',
      status: 'completed',
      created_at: now,
      updated_at: now,
      title: 'Smart Inventory Assistant',
      dept: 'IT',
      students: 'No students assigned',
      defenseDate: 'Mar 18, 2026',
      statusLabel: 'Completed',
      statusClass: 'status-approved'
    }
  ],
  recentSubmissions: [
    {
      id: 'submission-001',
      user_id: 'user-adviser-001',
      project_id: 'project-it-001',
      status: 'pending-review',
      created_at: now,
      updated_at: now,
      group: 'Group A1',
      type: 'Chapter 3',
      action: 'A1'
    },
    {
      id: 'submission-002',
      user_id: 'user-adviser-001',
      project_id: 'project-it-002',
      status: 'pending-review',
      created_at: now,
      updated_at: now,
      group: 'Group B2',
      type: 'Proposal',
      action: 'B2'
    },
    {
      id: 'submission-003',
      user_id: 'user-adviser-001',
      project_id: 'project-it-005',
      status: 'pending-review',
      created_at: now,
      updated_at: now,
      group: 'Group E5',
      type: 'Recovery Plan',
      action: 'E5'
    }
  ],
  upcomingSchedule: [
    'Mar 28: Group A1 Defense Readiness',
    'Mar 29: Group B2 Proposal Review',
    'Mar 30: Group C3 Consultation',
    'Apr 1: Group E5 Recovery Consultation'
  ],
  departmentPerformance: [
    {
      id: 'department-it',
      user_id: 'user-adviser-001',
      project_id: 'project-it-dashboard',
      status: 'active',
      created_at: now,
      updated_at: now,
      name: 'IT',
      progress: 68
    }
  ],
  adviserSubmissions: [
    {
        id: 'sub-it-01',
        groupCode: 'IT-2024-01',
        groupName: 'AI-Powered Learning System',
        dept: 'IT',
        type: 'Chapter 3',
        title: 'Methodology and Data Collection',
        submitted: 'Mar 24, 2026',
        status: 'pending',
        reviewDays: 0,
        icon: 'fa-laptop-code',
        summary: 'The team submitted the revised methodology section and is waiting for your go signal.',
        latestNote: 'Check if the data gathering flow already matches the approved scope.',
        nextStep: 'Confirm the methodology revisions and tell the group whether they can proceed to the final build test.',
        dueLabel: 'Due tomorrow',
        approvedThisWeek: false
    },
    {
        id: 'sub-met-02',
        groupCode: 'MET-2024-02',
        groupName: 'Smart Energy Monitor',
        dept: 'MET',
        type: 'Proposal',
        title: 'Project Proposal Revision',
        submitted: 'Mar 23, 2026',
        status: 'pending',
        reviewDays: 0,
        icon: 'fa-bolt',
        summary: 'The feasibility section was updated after the first adviser comments.',
        latestNote: 'Review the revised budget assumptions before you approve the proposal.',
        nextStep: 'Check the feasibility summary and confirm if the proposal can move to Chapter 1 writing.',
        dueLabel: 'Due in 2 days',
        approvedThisWeek: false
    },
    {
        id: 'sub-tcm-03',
        groupCode: 'TCM-2024-03',
        groupName: 'Herbal Database System',
        dept: 'TCM',
        type: 'Chapter 2',
        title: 'Literature Review',
        submitted: 'Mar 22, 2026',
        status: 'under-review',
        reviewDays: 2,
        icon: 'fa-leaf',
        summary: 'The group responded to earlier comments and is waiting for your second pass.',
        latestNote: 'Focus on source quality and make sure the framework references are updated.',
        nextStep: 'Continue the second review pass and either approve the revision or return a cleaner comment list.',
        dueLabel: 'In progress',
        approvedThisWeek: false
    },
    {
        id: 'sub-esm-04',
        groupCode: 'ESM-2024-04',
        groupName: 'Waste Management System',
        dept: 'ESM',
        type: 'Final Manuscript',
        title: 'Complete Thesis Document',
        submitted: 'Mar 20, 2026',
        status: 'approved',
        reviewDays: 3,
        icon: 'fa-recycle',
        summary: 'This record is already approved and ready for file reference.',
        latestNote: 'Approval note sent. Keep the final manuscript record for defense preparation.',
        nextStep: 'Open the stored review if you need to revisit the approved manuscript notes.',
        dueLabel: 'Approved this week',
        approvedThisWeek: true
    }
  ]
};

function cloneAdviserDashboardData() {
  return JSON.parse(JSON.stringify(adviserDashboardData)) as AdviserDashboardData;
}

function clearMockStudentData(data: AdviserDashboardData) {
  data.groups = [];
  data.panelProjects = [];
  data.recentSubmissions = [];
  data.upcomingSchedule = [];
}

function toIsoString(value: Date | string | null | undefined, fallback = now) {
  if (value instanceof Date) return value.toISOString();
  return value || fallback;
}

function getDisplayName(user: { name?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.name || user.email || 'Adviser';
}

function getFacultyRoleLabel(role: unknown) {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('panel')) return 'Panel';
  if (normalized.includes('adviser')) return 'Faculty Adviser';
  return 'Faculty';
}

function getStatusClass(value: unknown) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('complete') || normalized.includes('approve') || normalized.includes('pass')) return 'status-approved';
  if (normalized.includes('schedule') || normalized.includes('pending')) return 'status-pending';
  if (normalized.includes('risk') || normalized.includes('revision') || normalized.includes('changes')) return 'status-warning';
  return 'status-active';
}

function toTitleCase(value: unknown, fallback = 'Pending') {
  const normalized = String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();

  if (!normalized) return fallback;

  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toFinalDefenseResult(value: string): AdviserDashboardData['groups'][number]['finalDefenseResult'] {
  const normalized = toTitleCase(value);

  if (normalized === 'Passed' || normalized === 'Failed' || normalized === 'Scheduled') {
    return normalized;
  }

  return 'Pending';
}

function formatDefenseDate(value: Date | string | null | undefined) {
  if (!value) return 'Not scheduled';
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

const ADVISER_DASHBOARD_GROUP_LIMIT = 40;
const ADVISER_DASHBOARD_PANEL_LIMIT = 40;

const adviserDashboardGroupSelect = {
  id: true,
  userId: true,
  projectId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  code: true,
  title: true,
  projectTitle: true,
  dept: true,
  department: true,
  members: true,
  students: true,
  progress: true,
  statusLabel: true,
  statusClass: true,
  milestone: true,
  currentMilestone: true,
  finalDefenseResult: true,
  finalManuscriptApproved: true,
  allRequiredMilestonesCompleted: true,
  completedAt: true,
  finalScore: true,
  finalRecommendation: true,
  leader: true
} as const;

const adviserDashboardEvaluationSelect = {
  id: true,
  projectId: true,
  recommendation: true,
  createdAt: true,
  updatedAt: true,
  defenseSchedule: {
    select: {
      status: true,
      scheduledAt: true
    }
  },
  project: {
    select: {
      id: true,
      title: true,
      status: true,
      group: {
        select: {
          dept: true,
          department: true,
          students: true
        }
      }
    }
  }
} as const;

export const getAdviserDashboardData = cache(async function getAdviserDashboardData() {
  const data = cloneAdviserDashboardData();

  try {
    const dbUser = await getServerAuthenticatedUser();

    if (!dbUser) {
      return { data };
    }

    const userName = getDisplayName(dbUser);
    const createdAt = toIsoString(dbUser.createdAt, data.profile.created_at);
    const updatedAt = toIsoString(dbUser.updatedAt, data.profile.updated_at);

    data.profile = {
      ...data.profile,
      id: dbUser.id,
      user_id: dbUser.id,
      status: 'active',
      created_at: createdAt,
      updated_at: updatedAt,
      fullName: userName,
      roleLabel: getFacultyRoleLabel(dbUser.role),
      department: dbUser.department || '',
      notificationCount: 0,
      email: dbUser.email || '',
      contactNumber: dbUser.contactNumber || '',
      office: dbUser.office || '',
      accountSummary: dbUser.accountSummary || '',
      profileImage: dbUser.profileImage || '',
      displayName: dbUser.displayName || '',
      rawRole: dbUser.role
    };

    // Ensure mock data groups belong to the logged-in user so they aren't filtered out
    data.groups = data.groups.map(g => ({ ...g, user_id: dbUser.id }));
    data.panelProjects = data.panelProjects.map(p => ({ ...p, user_id: dbUser.id }));


    try {
      const [groups, panelEvaluations, unreadNotificationCount] = await Promise.all([
        prisma.group.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: 'desc' },
          take: ADVISER_DASHBOARD_GROUP_LIMIT,
          select: adviserDashboardGroupSelect
        }),
        prisma.evaluation.findMany({
          where: { evaluatorId: dbUser.id },
          orderBy: { createdAt: 'desc' },
          take: ADVISER_DASHBOARD_PANEL_LIMIT,
          select: adviserDashboardEvaluationSelect
        }),
        prisma.notification.count({
          where: {
            userId: dbUser.id,
            status: NotificationStatus.UNREAD
          }
        })
      ]);

      data.profile.notificationCount = unreadNotificationCount;
      
      data.groups = groups.map((group) => ({
        id: group.id,
        user_id: group.userId,
        project_id: group.projectId || '',
        status: group.status,
        created_at: toIsoString(group.createdAt),
        updated_at: toIsoString(group.updatedAt),
        code: group.code,
        title: group.title,
        projectTitle: group.projectTitle,
        dept: group.dept,
        department: group.department,
        members: group.members,
        students: group.students,
        progress: group.progress,
        statusLabel: group.statusLabel,
        statusClass: group.statusClass,
        milestone: group.milestone,
        currentMilestone: group.currentMilestone,
        finalDefenseResult: toFinalDefenseResult(group.finalDefenseResult),
        finalManuscriptApproved: group.finalManuscriptApproved,
        allRequiredMilestonesCompleted: group.allRequiredMilestonesCompleted,
        completedAt: group.completedAt ? toIsoString(group.completedAt) : null,
        finalScore: group.finalScore,
        finalRecommendation: group.finalRecommendation,
        leader: group.leader
      }));

      data.panelProjects = panelEvaluations.map((evaluation) => {
        const project = evaluation.project;
        const group = project.group;
        const statusValue = evaluation.defenseSchedule?.status || evaluation.recommendation || project.status;

        return {
          id: evaluation.id,
          user_id: dbUser.id,
          project_id: project.id,
          status: String(statusValue || '').toLowerCase(),
          created_at: toIsoString(evaluation.createdAt),
          updated_at: toIsoString(evaluation.updatedAt),
          title: project.title,
          dept: group?.dept || group?.department || dbUser.department || '',
          students: group?.students?.length ? group.students.join(', ') : 'No students assigned',
          defenseDate: formatDefenseDate(evaluation.defenseSchedule?.scheduledAt),
          statusLabel: toTitleCase(statusValue),
          statusClass: getStatusClass(statusValue)
        };
      });
    } catch {
      // Fallback to mock data if database fails
    }
  } catch {
    return { data };
  }

  return { data };
});

