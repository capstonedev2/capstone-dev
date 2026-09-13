import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import type {
  AttentionAlertItem,
  DashboardMetric,
  DashboardTone,
  GroupProgressSnapshotItem,
  LiveUpdateItem,
  RecentSubmissionItem,
  WeeklyScheduleItem
} from '@/components/adviser/shared/config/dashboard-types';

export const WORKSPACE_META = {
  adviser: {
    pageTitle: 'Adviser Dashboard',
    pageCopy: 'Monitor groups, review submissions, and manage supervision tasks',
    navLabel: 'Dashboard',
    headerLabel: 'Adviser & Panel Portal',
    badgeLabel: 'Faculty Adviser',
    badgeIcon: 'fa-building',
    pillLabel: 'Adviser Workspace',
    primaryActionLabel: 'Review Submissions',
    primaryActionHref: '/adviser/adviser-mode/submissions',
    primaryActionIcon: 'fa-check-double'
  },
  panel: {
    pageTitle: 'Panel Dashboard',
    pageCopy: 'Track evaluations, defense assignments, and panel responsibilities in one workspace',
    navLabel: 'Panel Dashboard',
    headerLabel: 'Panel Workspace',
    badgeLabel: 'Panel Workspace',
    badgeIcon: 'fa-scale-balanced',
    pillLabel: 'Panel Workspace',
    primaryActionLabel: 'Open Evaluation Queue',
    primaryActionHref: '/adviser/panel-mode/evaluation-queue',
    primaryActionIcon: 'fa-clipboard-check'
  }
} as const;

export const WORKSPACE_MODE_STORAGE_KEY = 'thesisTrackAdviserWorkspaceMode';
export type WorkspaceMode = keyof typeof WORKSPACE_META;
export type AdviserGroupLifecycleStatus = 'active' | 'pending' | 'needs-revision' | 'at-risk' | 'completed';

export const ADVISER_GROUP_STATUS_META: Record<
  AdviserGroupLifecycleStatus,
  { label: string; className: string }
> = {
  active: { label: 'Active', className: 'status-active' },
  pending: { label: 'Pending', className: 'status-pending' },
  'needs-revision': { label: 'Needs Revision', className: 'status-revise' },
  'at-risk': { label: 'At Risk', className: 'status-warning' },
  completed: { label: 'Completed', className: 'status-completed' }
};

export function getWorkspaceBasePath(mode: WorkspaceMode): string {
  return mode === 'panel' ? '/adviser/panel-mode' : '/adviser/adviser-mode';
}

export function getWorkspaceDashboardPath(mode: WorkspaceMode): string {
  return `${getWorkspaceBasePath(mode)}/dashboard`;
}

export const NAV_ITEMS = {
  adviser: [
    { href: '/adviser/adviser-mode/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { href: '/adviser/adviser-mode/groups', icon: 'fa-users', label: 'My Groups' },
    { href: '/adviser/adviser-mode/submissions', icon: 'fa-check-double', label: 'Submissions' },
    { href: '/adviser/adviser-mode/progress', icon: 'fa-chart-line', label: 'Progress Monitoring' },
    { href: '/adviser/adviser-mode/title-approvals', icon: 'fa-file-signature', label: 'Title Approvals' },
    { href: '/adviser/adviser-mode/evaluations', icon: 'fa-star', label: 'Evaluations' },
    { href: '/adviser/adviser-mode/schedule', icon: 'fa-calendar', label: 'Schedule' },
    { href: '/adviser/adviser-mode/reports', icon: 'fa-chart-bar', label: 'Reports & Analytics' }
  ],
  panel: [
    { href: '/adviser/panel-mode/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { href: '/adviser/panel-mode/evaluation-queue', icon: 'fa-clipboard-check', label: 'Evaluation Queue' },
    { href: '/adviser/panel-mode/defense-schedule', icon: 'fa-calendar-days', label: 'Defense Schedule' },
    { href: '/adviser/panel-mode/defense-voting', icon: 'fa-check-to-slot', label: 'Defense Voting' },
    { href: '/adviser/panel-mode/review-history', icon: 'fa-folder-open', label: 'Review History' }
  ]
} as const;

/** Derive workspace mode from the current URL pathname. */
export function getWorkspaceModeFromPathname(pathname: string): WorkspaceMode {
  if (pathname.startsWith('/adviser/panel-mode')) return 'panel';
  return 'adviser';
}

/** Check whether a sidebar nav item should be marked active for the given pathname. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

export function getToastIcon(type: 'success' | 'error' | 'info') {
  if (type === 'success') {
    return 'fa-check-circle';
  }

  if (type === 'error') {
    return 'fa-exclamation-circle';
  }

  return 'fa-info-circle';
}

export function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function getShortName(value: string) {
  return value.split(' ').filter(Boolean).slice(0, 2).join(' ') || value;
}

function formatSentenceCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getGroupProjectTitle(group: AdviserDashboardData['groups'][number]) {
  if (group.projectTitle && group.projectTitle !== 'Pending Student Submission') return group.projectTitle;
  if (group.title && group.title !== 'Pending Student Submission') return group.title;
  return 'Pending Title Approval';
}

export function getGroupDepartmentLabel(group: AdviserDashboardData['groups'][number]) {
  return group.department || group.dept;
}

export function getGroupMilestoneLabel(group: AdviserDashboardData['groups'][number]) {
  return group.currentMilestone || group.milestone;
}

export function isGroupCompleted(group: AdviserDashboardData['groups'][number]) {
  return (
    group.finalDefenseResult === 'Passed' &&
    group.finalManuscriptApproved === true &&
    group.allRequiredMilestonesCompleted === true
  );
}

function normalizeLifecycleStatus(status: string, progress?: number): AdviserGroupLifecycleStatus {
  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'needs-revision' || status === 'revise') {
    return 'needs-revision';
  }

  if (status === 'at-risk' || status === 'overdue') {
    return 'at-risk';
  }

  if (status === 'pending') {
    return 'pending';
  }

  if (status === 'active') {
    return 'active';
  }

  if (typeof progress === 'number' && progress < 35) {
    return 'at-risk';
  }

  return 'active';
}

export function getComputedGroupStatus(group: AdviserDashboardData['groups'][number]): AdviserGroupLifecycleStatus {
  if (isGroupCompleted(group)) {
    return 'completed';
  }

  return normalizeLifecycleStatus(group.status, group.progress);
}

export function getComputedGroupStatusLabel(group: AdviserDashboardData['groups'][number]) {
  return ADVISER_GROUP_STATUS_META[getComputedGroupStatus(group)].label;
}

export function getToneFromStatus(status: string, progress?: number): DashboardTone {
  if (
    status === 'needs-revision' ||
    status === 'at-risk' ||
    status === 'revise' ||
    status === 'reject' ||
    status === 'overdue'
  ) {
    return 'danger';
  }

  if (status === 'pending' || status === 'pending-review' || status === 'scheduled') {
    return 'warning';
  }

  if (status === 'approved' || status === 'completed') {
    return 'success';
  }

  if (status === 'under-review' || status === 'confirmed') {
    return 'info';
  }

  if (typeof progress === 'number') {
    if (progress < 50) {
      return 'danger';
    }

    if (progress < 70) {
      return 'warning';
    }

    if (progress >= 85) {
      return 'success';
    }
  }

  return 'primary';
}

function formatRelativeSubmissionDate(isoValue: string) {
  const then = new Date(isoValue).getTime();
  if (Number.isNaN(then)) {
    return 'Recently submitted';
  }

  const diffDays = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Submitted today';
  if (diffDays === 1) return 'Submitted yesterday';
  if (diffDays < 7) return `Submitted ${diffDays} days ago`;

  return `Submitted ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(then))}`;
}

function getActivityStatusLabel(status: string) {
  if (status === 'confirmed') {
    return 'Scheduled';
  }

  return formatSentenceCase(status);
}

function getReviewStatusLabel(status: string) {
  if (status === 'pending' || status === 'pending-review') {
    return 'Pending';
  }

  if (status === 'under-review') {
    return 'Needs Review';
  }

  if (status === 'approved' || status === 'completed') {
    return 'Approved';
  }

  if (status === 'at-risk' || status === 'needs-revision') {
    return 'Warning';
  }

  return formatSentenceCase(status);
}


export function buildPanelMetrics(panelProjects: AdviserDashboardData['panelProjects']): DashboardMetric[] {
  const pendingEvaluations = panelProjects.filter((item) => item.status !== 'completed').length;
  const scheduledDefenses = panelProjects.filter((item) => item.status === 'scheduled' || item.status === 'pending').length;
  const completedReviews = panelProjects.filter((item) => item.status === 'completed').length;

  return [
    { id: 'panel-assignments', icon: 'fa-users-viewfinder', label: 'Panel Assignments', value: String(panelProjects.length), helperText: 'Projects currently routed to your panel workload', trendLabel: 'Current load', tone: 'primary' },
    { id: 'panel-pending', icon: 'fa-clipboard-check', label: 'Pending Evaluations', value: String(pendingEvaluations), helperText: 'Scoring packets still waiting for your recommendation', trendLabel: pendingEvaluations ? 'Open queue' : 'Clear', tone: pendingEvaluations ? 'warning' : 'success' },
    { id: 'panel-defenses', icon: 'fa-calendar-day', label: 'Upcoming Defenses', value: String(scheduledDefenses), helperText: 'Defense sessions already scheduled in this review cycle', trendLabel: scheduledDefenses ? 'Scheduled' : 'No lineup', tone: scheduledDefenses ? 'info' : 'neutral' },
    { id: 'panel-completed', icon: 'fa-check-double', label: 'Completed Reviews', value: String(completedReviews), helperText: 'Evaluations already finalized for consolidation', trendLabel: completedReviews ? 'Submitted' : 'No submissions', tone: completedReviews ? 'success' : 'neutral' }
  ];
}

export function buildAdviserLiveUpdates(activity: AdviserDashboardData['adviserActivity'], groups: AdviserDashboardData['groups']): LiveUpdateItem[] {
  const groupsByProject = new Map(groups.map((group) => [group.project_id, group]));

  return activity.slice(0, 6).map((item, index) => {
    const group = groupsByProject.get(item.project_id);
    const groupName = group?.code ?? 'Supervision update';
    return { id: item.id, icon: item.icon, title: item.title, description: item.text, groupName, timestamp: item.time, statusLabel: getActivityStatusLabel(item.status), tone: getToneFromStatus(item.status), isNew: index === 0 };
  });
}

export function buildPanelLiveUpdates(activity: AdviserDashboardData['panelActivity'], panelProjects: AdviserDashboardData['panelProjects']): LiveUpdateItem[] {
  const projectsById = new Map(panelProjects.map((project) => [project.project_id, project]));
  return activity.slice(0, 6).map((item, index) => {
    const project = projectsById.get(item.project_id);
    return { id: item.id, icon: item.icon, title: item.title, description: item.text, groupName: project?.title ?? 'Panel assignment', timestamp: item.time, statusLabel: getActivityStatusLabel(item.status), tone: getToneFromStatus(item.status), isNew: index === 0 };
  });
}

export function buildAdviserRecentSubmissionItems(recentSubmissions: AdviserDashboardData['recentSubmissions'], groups: AdviserDashboardData['groups']): RecentSubmissionItem[] {
  const groupsByProject = new Map(groups.map((group) => [group.project_id, group]));

  return recentSubmissions.map((item) => {
    const group = groupsByProject.get(item.project_id);
    return {
      id: item.id,
      groupCode: group?.code ?? item.group,
      groupName: group ? getGroupProjectTitle(group) : item.group,
      fileTitle: `${item.type} Submission`,
      submissionType: item.type,
      submittedDate: formatRelativeSubmissionDate(item.created_at),
      statusLabel: getReviewStatusLabel(item.status),
      tone: getToneFromStatus(item.status),
      actionId: item.action,
      meta: 'Waiting for adviser review'
    };
  });
}

export function buildPanelRecentSubmissionItems(panelProjects: AdviserDashboardData['panelProjects']): RecentSubmissionItem[] {
  return panelProjects.map((item, index) => ({ id: item.id, groupCode: item.dept, groupName: item.title, fileTitle: 'Defense Evaluation Packet', submissionType: 'Panel Evaluation', submittedDate: item.defenseDate, statusLabel: getReviewStatusLabel(item.status), tone: getToneFromStatus(item.status), actionId: item.id, meta: item.students, revisionCount: index }));
}

export function buildAdviserAlerts(groups: AdviserDashboardData['groups']): AttentionAlertItem[] {
  const urgentAlerts = groups
    .filter((group) => getComputedGroupStatus(group) === 'needs-revision')
    .map((group) => {
      const milestone = getGroupMilestoneLabel(group);
      return {
        id: `alert-revise-${group.id}`,
        title: `${group.code} is still under revision`,
        description: `${getGroupProjectTitle(group)} needs follow-up on ${milestone.toLowerCase()}.`,
        priority: 'urgent' as const,
        meta: `Unresolved revision - ${milestone}`
      };
    });
  const warningAlerts = groups
    .filter((group) => {
      const status = getComputedGroupStatus(group);
      return status === 'pending' || status === 'at-risk';
    })
    .map((group) => ({
      id: `alert-pending-${group.id}`,
      title: `${group.code} needs your milestone decision`,
      description: `${getGroupProjectTitle(group)} is not yet cleared for the next milestone.`,
      priority: 'warning' as const,
      meta: `Pending approval - ${group.progress}% progress`
    }));
  return [...urgentAlerts, ...warningAlerts].slice(0, 4);
}

export function buildPanelAlerts(panelProjects: AdviserDashboardData['panelProjects']): AttentionAlertItem[] {
  const pending = panelProjects.filter((project) => project.status === 'pending').map((project) => ({ id: `panel-pending-${project.id}`, title: `${project.title} is waiting for panel scoring`, description: `${project.students} still need a completed rubric and recommendation.`, priority: 'urgent' as const, meta: `Pending evaluation - ${project.defenseDate}` }));
  const scheduled = panelProjects.filter((project) => project.status === 'scheduled').map((project) => ({ id: `panel-scheduled-${project.id}`, title: `${project.title} defense is approaching`, description: 'Finalize scoring notes and defense coverage before the scheduled session.', priority: 'warning' as const, meta: `Scheduled defense - ${project.defenseDate}` }));
  const completed = panelProjects.filter((project) => project.status === 'completed').slice(0, 1).map((project) => ({ id: `panel-completed-${project.id}`, title: `${project.title} is ready for consolidation`, description: 'Completed review is already in the archive and ready for records confirmation.', priority: 'normal' as const, meta: `Completed review - ${project.defenseDate}` }));
  return [...pending, ...scheduled, ...completed].slice(0, 4);
}

export function buildAdviserScheduleItems(items: AdviserDashboardData['upcomingSchedule'], groups: AdviserDashboardData['groups']): WeeklyScheduleItem[] {
  const groupsByProject = new Map(groups.map((group) => [group.project_id, group]));

  return items.map((item) => {
    const group = groupsByProject.get(item.project_id);
    return {
      id: item.id,
      dateLabel: item.dateLabel,
      timeLabel: item.timeLabel,
      groupName: group?.code ?? 'Adviser session',
      eventType: item.eventType,
      location: item.location,
      tone: item.tone,
      projectId: item.project_id
    };
  });
}

export function buildPanelScheduleItems(panelProjects: AdviserDashboardData['panelProjects']): WeeklyScheduleItem[] {
  return panelProjects.filter((project) => project.status !== 'completed').map((project) => ({ id: `panel-schedule-${project.id}`, dateLabel: project.defenseDate, timeLabel: project.defenseTime, groupName: project.title, eventType: 'Defense evaluation', location: 'Panel Review Room', tone: getToneFromStatus(project.status) }));
}

export function buildAdviserProgressSnapshot(groups: AdviserDashboardData['groups']): GroupProgressSnapshotItem[] {
  return [...groups]
    .sort((left, right) => left.progress - right.progress)
    .slice(0, 4)
    .map((group) => {
      const computedStatus = getComputedGroupStatus(group);
      return {
        id: group.id,
        groupName: group.code,
        projectTitle: getGroupProjectTitle(group),
        progress: computedStatus === 'completed' ? 100 : group.progress,
        milestone: getGroupMilestoneLabel(group),
        statusLabel: ADVISER_GROUP_STATUS_META[computedStatus].label,
        tone: getToneFromStatus(computedStatus, group.progress)
      };
    });
}

export function buildPanelProgressSnapshot(panelProjects: AdviserDashboardData['panelProjects']): GroupProgressSnapshotItem[] {
  // A defense evaluation is a real discrete state (not-yet-scored vs. scored) — there's no
  // real underlying "percent complete" the way a student group has checkpoints. Rather than
  // invent partial-credit numbers, only "completed" is a real 100%; everything else is 0%
  // until it's actually scored.
  return panelProjects.slice(0, 4).map((project) => {
    const progress = project.status === 'completed' ? 100 : 0;
    return { id: project.id, groupName: project.dept, projectTitle: project.title, progress, milestone: `Defense schedule: ${project.defenseDate}`, statusLabel: project.statusLabel, tone: getToneFromStatus(project.status, progress) };
  });
}
