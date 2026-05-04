export const PROGRESS_REFERENCE_DATE = '2026-04-14T00:00:00.000Z';

export const IT_PROGRESS_MILESTONES = [
  'Concept',
  'Proposal',
  'Development',
  'Mock Defense',
  'Final Defense',
  'Completion'
] as const;

export type ProgressMilestone = (typeof IT_PROGRESS_MILESTONES)[number];
export type ProgressStatus = 'on-track' | 'at-risk' | 'delayed' | 'completed';
export type AdviserActionStatus =
  | 'Waiting for submission'
  | 'Needs review'
  | 'Ready for approval'
  | 'Ready for defense';

export type AdviserProgressRecord = {
  id: string;
  groupId: `IT-2024-${string}`;
  projectTitle: string;
  department: 'IT';
  progress: number;
  currentMilestone: ProgressMilestone;
  status: ProgressStatus;
  deadline: string;
  lastUpdate: string;
  adviserAction: AdviserActionStatus;
};

export type ProgressSortOption =
  | 'nearest-deadline'
  | 'highest-progress'
  | 'lowest-progress'
  | 'latest-update';

export const IT_ADVISER_PROGRESS_RECORDS: AdviserProgressRecord[] = [
  {
    id: 'progress-it-01',
    groupId: 'IT-2024-06',
    projectTitle: 'Smart Queue Analytics Dashboard',
    department: 'IT',
    progress: 82,
    currentMilestone: 'Mock Defense',
    status: 'on-track',
    deadline: '2026-04-18T00:00:00.000Z',
    lastUpdate: '2026-04-13T10:15:00.000Z',
    adviserAction: 'Ready for approval'
  },
  {
    id: 'progress-it-02',
    groupId: 'IT-2024-09',
    projectTitle: 'Clinic Appointment Flow Optimizer',
    department: 'IT',
    progress: 58,
    currentMilestone: 'Proposal',
    status: 'at-risk',
    deadline: '2026-04-17T00:00:00.000Z',
    lastUpdate: '2026-04-06T14:20:00.000Z',
    adviserAction: 'Waiting for submission'
  },
  {
    id: 'progress-it-03',
    groupId: 'IT-2024-11',
    projectTitle: 'Barangay Incident Mapping and Alerting',
    department: 'IT',
    progress: 69,
    currentMilestone: 'Development',
    status: 'at-risk',
    deadline: '2026-04-15T00:00:00.000Z',
    lastUpdate: '2026-04-09T09:30:00.000Z',
    adviserAction: 'Needs review'
  },
  {
    id: 'progress-it-04',
    groupId: 'IT-2024-14',
    projectTitle: 'Student Services Help Desk Portal',
    department: 'IT',
    progress: 100,
    currentMilestone: 'Final Defense',
    status: 'completed',
    deadline: '2026-04-12T00:00:00.000Z',
    lastUpdate: '2026-04-14T08:00:00.000Z',
    adviserAction: 'Ready for defense'
  },
  {
    id: 'progress-it-05',
    groupId: 'IT-2024-18',
    projectTitle: 'Campus Wi-Fi Ticketing Insight Tool',
    department: 'IT',
    progress: 74,
    currentMilestone: 'Development',
    status: 'on-track',
    deadline: '2026-04-20T00:00:00.000Z',
    lastUpdate: '2026-04-12T16:45:00.000Z',
    adviserAction: 'Needs review'
  },
  {
    id: 'progress-it-06',
    groupId: 'IT-2024-21',
    projectTitle: 'Internship Partner Matching Assistant',
    department: 'IT',
    progress: 46,
    currentMilestone: 'Mock Defense',
    status: 'delayed',
    deadline: '2026-04-13T00:00:00.000Z',
    lastUpdate: '2026-04-04T11:05:00.000Z',
    adviserAction: 'Waiting for submission'
  }
];

const progressStatusMeta: Record<
  ProgressStatus,
  {
    label: string;
    badgeClassName: string;
    progressClassName: string;
    icon: string;
  }
> = {
  'on-track': {
    label: 'On Track',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    progressClassName: 'bg-emerald-500',
    icon: 'fa-circle-check'
  },
  'at-risk': {
    label: 'At Risk',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    progressClassName: 'bg-amber-500',
    icon: 'fa-triangle-exclamation'
  },
  delayed: {
    label: 'Delayed',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    progressClassName: 'bg-rose-500',
    icon: 'fa-clock'
  },
  completed: {
    label: 'Completed',
    badgeClassName: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    progressClassName: 'bg-[var(--primary)]',
    icon: 'fa-flag-checkered'
  }
};

export const PROGRESS_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'on-track', label: 'On Track' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'completed', label: 'Completed' }
] as const;

export const PROGRESS_SORT_OPTIONS: Array<{ value: ProgressSortOption; label: string }> = [
  { value: 'nearest-deadline', label: 'Nearest Deadline' },
  { value: 'highest-progress', label: 'Highest Progress' },
  { value: 'lowest-progress', label: 'Lowest Progress' },
  { value: 'latest-update', label: 'Latest Update' }
];

const dayInMilliseconds = 1000 * 60 * 60 * 24;

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function diffInDays(left: string, right: string) {
  return Math.round((startOfUtcDay(left) - startOfUtcDay(right)) / dayInMilliseconds);
}

export function getProgressStatusMeta(status: ProgressStatus) {
  return progressStatusMeta[status];
}

export function formatProgressDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function getDeadlineLabel(deadline: string, referenceDate = PROGRESS_REFERENCE_DATE) {
  const days = diffInDays(deadline, referenceDate);

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return `Overdue ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
  }

  if (days === 0) {
    return 'Due today';
  }

  if (days === 1) {
    return 'Due tomorrow';
  }

  return `Due in ${days} days`;
}

export function getDeadlineToneClass(deadline: string, referenceDate = PROGRESS_REFERENCE_DATE) {
  const days = diffInDays(deadline, referenceDate);

  if (days < 0) {
    return 'text-rose-600';
  }

  if (days <= 1) {
    return 'text-amber-600';
  }

  return 'text-[var(--text-light)]';
}

export function getLastUpdateLabel(lastUpdate: string, referenceDate = PROGRESS_REFERENCE_DATE) {
  const days = Math.abs(diffInDays(referenceDate, lastUpdate));

  if (days === 0) {
    return 'Updated today';
  }

  if (days === 1) {
    return 'Updated yesterday';
  }

  return `Updated ${days} days ago`;
}

export function getLastUpdateToneClass(lastUpdate: string, referenceDate = PROGRESS_REFERENCE_DATE) {
  const days = Math.abs(diffInDays(referenceDate, lastUpdate));

  if (days >= 7) {
    return 'text-rose-600';
  }

  if (days >= 4) {
    return 'text-amber-600';
  }

  return 'text-[var(--text-light)]';
}

export function getMostActiveMilestone(records: AdviserProgressRecord[]) {
  const counts = new Map<ProgressMilestone, number>();

  records
    .filter((record) => record.status !== 'completed')
    .forEach((record) => {
      counts.set(record.currentMilestone, (counts.get(record.currentMilestone) ?? 0) + 1);
    });

  const mostCommon = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  return mostCommon?.[0] ?? 'Proposal';
}

export function getNextMajorDeadline(records: AdviserProgressRecord[]) {
  return [...records]
    .filter((record) => record.status !== 'completed')
    .sort((left, right) => new Date(left.deadline).getTime() - new Date(right.deadline).getTime())[0] ?? null;
}

export function getAttentionReason(record: AdviserProgressRecord, referenceDate = PROGRESS_REFERENCE_DATE) {
  const deadlineDays = diffInDays(record.deadline, referenceDate);
  const inactivityDays = Math.abs(diffInDays(referenceDate, record.lastUpdate));

  if (record.status === 'delayed' && deadlineDays < 0) {
    return `Milestone overdue by ${Math.abs(deadlineDays)} day${Math.abs(deadlineDays) === 1 ? '' : 's'}.`;
  }

  if (inactivityDays >= 7) {
    return `No recent activity for ${inactivityDays} days.`;
  }

  if (record.progress < 60) {
    return 'Progress is below the expected milestone pace.';
  }

  if (record.status === 'at-risk') {
    return 'Review turnaround is needed before the next milestone slips.';
  }

  return 'Needs adviser attention before the next checkpoint.';
}

export function getAtRiskRecords(records: AdviserProgressRecord[]) {
  return records.filter((record) => record.status === 'at-risk' || record.status === 'delayed');
}

export function sortProgressRecords(records: AdviserProgressRecord[], sortBy: ProgressSortOption) {
  return [...records].sort((left, right) => {
    if (sortBy === 'highest-progress') {
      return right.progress - left.progress;
    }

    if (sortBy === 'lowest-progress') {
      return left.progress - right.progress;
    }

    if (sortBy === 'latest-update') {
      return new Date(right.lastUpdate).getTime() - new Date(left.lastUpdate).getTime();
    }

    return new Date(left.deadline).getTime() - new Date(right.deadline).getTime();
  });
}
