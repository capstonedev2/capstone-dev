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
    badgeLabel: 'IT Department',
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
    { href: '/adviser/adviser-mode/reports', icon: 'fa-chart-bar', label: 'Reports' }
  ],
  panel: [
    { href: '/adviser/panel-mode/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { href: '/adviser/panel-mode/evaluation-queue', icon: 'fa-clipboard-check', label: 'Evaluation Queue' },
    { href: '/adviser/panel-mode/defense-schedule', icon: 'fa-calendar-days', label: 'Defense Schedule' },
    { href: '/adviser/panel-mode/live-defense', icon: 'fa-tower-broadcast', label: 'Live Defense' },
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

const adviserScheduleTimes = ['9:00 AM', '1:30 PM', '10:00 AM', '3:00 PM'];
const panelScheduleTimes = ['9:00 AM', '1:30 PM', '3:30 PM', '10:30 AM'];

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
  return group.projectTitle || group.title;
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

function getActivityStatusLabel(status: string) {
  if (status === 'confirmed') {
    return 'Scheduled';
  }

  return formatSentenceCase(status);
}

export function buildAdviserMetrics(
  groups: AdviserDashboardData['groups'],
  submissions: AdviserDashboardData['adviserSubmissions'],
  panelProjects: AdviserDashboardData['panelProjects']
): DashboardMetric[] {
  const totalStudents = groups.reduce((sum, group) => sum + group.members, 0);
  const pendingReviews = submissions.filter((item) => item.status !== 'approved').length;
  const upcomingDefenses = panelProjects.filter((item) => item.status !== 'completed').length;
  const atRiskGroups = groups.filter((group) => {
    const status = getComputedGroupStatus(group);
    return status === 'pending' || status === 'needs-revision' || status === 'at-risk';
  }).length;

  return [
    { id: 'assigned-groups', icon: 'fa-users', label: 'Assigned Groups', value: String(groups.length), helperText: `${totalStudents} students currently under supervision`, trendLabel: 'Active load', tone: 'primary' },
    { id: 'pending-reviews', icon: 'fa-clock', label: 'Pending Reviews', value: String(pendingReviews), helperText: 'Submissions and revisions waiting for adviser action', trendLabel: pendingReviews ? 'Needs attention' : 'Clear', tone: pendingReviews ? 'warning' : 'success' },
    { id: 'upcoming-defenses', icon: 'fa-gavel', label: 'Upcoming Defenses', value: String(upcomingDefenses), helperText: 'Defense sessions and panel commitments on the current cycle', trendLabel: upcomingDefenses ? 'This cycle' : 'No lineup', tone: upcomingDefenses ? 'info' : 'neutral' },
    { id: 'at-risk-groups', icon: 'fa-triangle-exclamation', label: 'At-Risk Groups', value: String(atRiskGroups), helperText: 'Groups flagged for revisions, delays, or low milestone progress', trendLabel: atRiskGroups ? 'Escalate' : 'Stable', tone: atRiskGroups ? 'danger' : 'success' }
  ];
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

export function buildAdviserLiveUpdates(activity: AdviserDashboardData['adviserActivity'], recentSubmissions: AdviserDashboardData['recentSubmissions'], adviserSubmissions: AdviserDashboardData['adviserSubmissions'], groups: AdviserDashboardData['groups']): LiveUpdateItem[] {
  const groupsByProject = new Map(groups.map((group) => [group.project_id, group]));
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const submissionByCode = new Map(adviserSubmissions.map((item) => [item.groupCode, item]));

  const activityItems = activity.map((item) => {
    const group = groupsByProject.get(item.project_id);
    const groupName = group?.code ?? item.title.split('-').pop()?.trim() ?? 'Supervision update';
    return { id: item.id, icon: item.icon, title: item.title, description: item.text, groupName, timestamp: item.time, statusLabel: getActivityStatusLabel(item.status), tone: getToneFromStatus(item.status) };
  });

  const submissionUpdates = recentSubmissions.map((item, index) => {
    const group = groupsById.get(item.action);
    const detailedSubmission = group ? submissionByCode.get(group.code) : null;
    return { id: `submission-${item.id}`, icon: 'fa-file-circle-plus', title: `${item.group} uploaded ${item.type}`, description: detailedSubmission?.summary ?? `${item.type} is now waiting inside your review queue.`, groupName: group?.code ?? item.group, timestamp: index === 0 ? 'Just now' : 'Today', statusLabel: 'Pending Review', tone: 'warning' as const };
  });

  return [...activityItems, ...submissionUpdates].slice(0, 6).map((item, index) => ({ ...item, isNew: index === 0 }));
}

export function buildPanelLiveUpdates(activity: AdviserDashboardData['panelActivity'], panelProjects: AdviserDashboardData['panelProjects']): LiveUpdateItem[] {
  const projectsById = new Map(panelProjects.map((project) => [project.project_id, project]));
  return activity.slice(0, 6).map((item, index) => {
    const project = projectsById.get(item.project_id);
    return { id: item.id, icon: item.icon, title: item.title, description: item.text, groupName: project?.title ?? 'Panel assignment', timestamp: item.time, statusLabel: getActivityStatusLabel(item.status), tone: getToneFromStatus(item.status), isNew: index === 0 };
  });
}

export function buildAdviserRecentSubmissionItems(recentSubmissions: AdviserDashboardData['recentSubmissions'], adviserSubmissions: AdviserDashboardData['adviserSubmissions'], groups: AdviserDashboardData['groups']): RecentSubmissionItem[] {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const adviserSubmissionsByCode = new Map(adviserSubmissions.map((item) => [item.groupCode, item]));
  return recentSubmissions.map((item) => {
    const group = groupsById.get(item.action);
    const detailedSubmission = group ? adviserSubmissionsByCode.get(group.code) : undefined;
    return {
      id: item.id,
      groupCode: group?.code ?? item.group,
      groupName: group ? getGroupProjectTitle(group) : item.group,
      fileTitle: detailedSubmission?.title ?? `${item.type} Submission`,
      submissionType: detailedSubmission?.type ?? item.type,
      submittedDate: detailedSubmission?.submitted ?? 'Submitted today',
      statusLabel: group ? getComputedGroupStatusLabel(group) : 'Pending',
      tone: getToneFromStatus(group ? getComputedGroupStatus(group) : item.status),
      actionId: item.action,
      meta: detailedSubmission?.dueLabel ?? 'Waiting for initial review'
    };
  });
}

export function buildPanelRecentSubmissionItems(panelProjects: AdviserDashboardData['panelProjects']): RecentSubmissionItem[] {
  return panelProjects.map((item) => ({ id: item.id, groupCode: item.dept, groupName: item.title, fileTitle: 'Defense Evaluation Packet', submissionType: 'Panel Evaluation', submittedDate: item.defenseDate, statusLabel: item.statusLabel, tone: getToneFromStatus(item.status), actionId: item.id, meta: item.students }));
}

export function buildAdviserAlerts(groups: AdviserDashboardData['groups'], adviserSubmissions: AdviserDashboardData['adviserSubmissions']): AttentionAlertItem[] {
  const urgentAlerts = groups
    .filter((group) => getComputedGroupStatus(group) === 'needs-revision')
    .map((group) => {
      const milestone = getGroupMilestoneLabel(group);
      return {
        id: `alert-revise-${group.id}`,
        title: `${group.code} is still under revision`,
        description: `${getGroupProjectTitle(group)} needs follow-up on ${milestone.toLowerCase()}.`,
        priority: 'urgent' as const,
        meta: `Unresolved revision · ${milestone}`
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
      meta: `Pending approval · ${group.progress}% progress`
    }));
  const normalAlerts = adviserSubmissions
    .filter((item) => item.status === 'under-review')
    .map((item) => ({
      id: `alert-submission-${item.id}`,
      title: `${item.groupCode} is waiting on a second review pass`,
      description: item.latestNote,
      priority: 'normal' as const,
      meta: `${item.type} · ${item.dueLabel}`
    }));
  return [...urgentAlerts, ...warningAlerts, ...normalAlerts].slice(0, 4);
}

export function buildPanelAlerts(panelProjects: AdviserDashboardData['panelProjects']): AttentionAlertItem[] {
  const pending = panelProjects.filter((project) => project.status === 'pending').map((project) => ({ id: `panel-pending-${project.id}`, title: `${project.title} is waiting for panel scoring`, description: `${project.students} still need a completed rubric and recommendation.`, priority: 'urgent' as const, meta: `Pending evaluation · ${project.defenseDate}` }));
  const scheduled = panelProjects.filter((project) => project.status === 'scheduled').map((project) => ({ id: `panel-scheduled-${project.id}`, title: `${project.title} defense is approaching`, description: 'Finalize scoring notes and defense coverage before the scheduled session.', priority: 'warning' as const, meta: `Scheduled defense · ${project.defenseDate}` }));
  const completed = panelProjects.filter((project) => project.status === 'completed').slice(0, 1).map((project) => ({ id: `panel-completed-${project.id}`, title: `${project.title} is ready for consolidation`, description: 'Completed review is already in the archive and ready for records confirmation.', priority: 'normal' as const, meta: `Completed review · ${project.defenseDate}` }));
  return [...pending, ...scheduled, ...completed].slice(0, 4);
}

export function buildAdviserScheduleItems(items: AdviserDashboardData['upcomingSchedule']): WeeklyScheduleItem[] {
  return items.map((item, index) => {
    const [rawDate, ...rest] = item.split(':');
    const details = rest.join(':').trim();
    const groupMatch = details.match(/Group\s+[A-Z]\d/i);
    const groupName = groupMatch?.[0] ?? 'Adviser session';
    const eventType = details.replace(groupName, '').trim() || 'Consultation';
    const location = eventType.toLowerCase().includes('defense') ? 'Research Hall' : eventType.toLowerCase().includes('consultation') ? 'Consultation Room B' : 'Adviser Conference Room';
    return { id: `schedule-${index}`, dateLabel: rawDate.trim(), timeLabel: adviserScheduleTimes[index % adviserScheduleTimes.length], groupName, eventType, location, tone: eventType.toLowerCase().includes('defense') ? 'warning' : 'info' };
  });
}

export function buildPanelScheduleItems(panelProjects: AdviserDashboardData['panelProjects']): WeeklyScheduleItem[] {
  return panelProjects.filter((project) => project.status !== 'completed').map((project, index) => ({ id: `panel-schedule-${project.id}`, dateLabel: project.defenseDate, timeLabel: panelScheduleTimes[index % panelScheduleTimes.length], groupName: project.title, eventType: 'Defense evaluation', location: 'Panel Review Room', tone: getToneFromStatus(project.status) }));
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
  return panelProjects.slice(0, 4).map((project) => {
    const progress = project.status === 'completed' ? 100 : project.status === 'scheduled' ? 72 : project.status === 'pending' ? 38 : 54;
    return { id: project.id, groupName: project.dept, projectTitle: project.title, progress, milestone: `Defense schedule: ${project.defenseDate}`, statusLabel: project.statusLabel, tone: getToneFromStatus(project.status, progress) };
  });
}
