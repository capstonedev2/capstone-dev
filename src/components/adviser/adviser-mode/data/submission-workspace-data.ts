export function getReviewReferenceDate() {
  return new Date().toISOString();
}

export type SubmissionStatus = 'pending-review' | 'under-review' | 'approved' | 'needs-revision';
export type SubmissionType = 'Proposal' | 'Chapter' | 'Final';
export type SubmissionMilestone =
  | 'Proposal Screening'
  | 'Chapter 1 Review'
  | 'Chapter 3 Review'
  | 'Final Manuscript Check'
  | 'Defense Clearance';

export type AdviserSubmissionRecord = {
  id: string;
  groupId: string;
  projectTitle: string;
  submissionTitle: string;
  type: SubmissionType;
  milestone: SubmissionMilestone;
  status: SubmissionStatus;
  version: string;
  submittedAt: string;
  deadline: string;
  submittedBy?: string;
  groupMembers?: Array<{
    name: string;
    role: string;
    isLeader: boolean;
  }>;
  latestReviewComment?: {
    id: string;
    body: string;
    decision: string;
    createdAt: string | Date;
    authorName?: string | null;
  } | null;
  reviewedAt?: string | null;
  reviewFocus: string;
  nextAction: string;
  fileUrl: string;
  department: 'IT';
  approvedAt?: string;
};

export const IT_REVIEW_CHECKLIST = [
  'Confirm correct document version',
  'Verify previous comments are addressed',
  'Check completeness of sections',
  'Provide clear feedback',
  'Approve only when ready'
] as const;

const submissionStatusMeta: Record<
  SubmissionStatus,
  {
    label: string;
    badgeClassName: string;
    actionLabel: string;
  }
> = {
  'pending-review': {
    label: 'Pending Review',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    actionLabel: 'Review'
  },
  'under-review': {
    label: 'Still Reviewing',
    badgeClassName: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    actionLabel: 'Still Reviewing'
  },
  approved: {
    label: 'Approved',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    actionLabel: 'View Review'
  },
  'needs-revision': {
    label: 'Needs Revision',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    actionLabel: 'Review Again'
  }
};

const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending-review', label: 'Pending Review' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs-revision', label: 'Needs Revision' }
] as const;

const dayInMilliseconds = 1000 * 60 * 60 * 24;

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getSubmissionStatusMeta(status: SubmissionStatus) {
  return submissionStatusMeta[status];
}

export function formatSubmissionDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function getDeadlineLabel(deadline: string, referenceDate = getReviewReferenceDate()) {
  const diffInDays = Math.round((startOfUtcDay(deadline) - startOfUtcDay(referenceDate)) / dayInMilliseconds);

  if (diffInDays < 0) {
    const overdueDays = Math.abs(diffInDays);
    return `Overdue ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
  }

  if (diffInDays === 0) {
    return 'Due today';
  }

  if (diffInDays === 1) {
    return 'Due tomorrow';
  }

  return `Due in ${diffInDays} days`;
}

export function getDeadlineToneClass(deadline: string, referenceDate = getReviewReferenceDate()) {
  const diffInDays = Math.round((startOfUtcDay(deadline) - startOfUtcDay(referenceDate)) / dayInMilliseconds);

  if (diffInDays < 0) {
    return 'text-rose-600';
  }

  if (diffInDays <= 1) {
    return 'text-amber-600';
  }

  return 'text-[var(--text-light)]';
}

export function getApprovedThisWeekCount(
  submissions: AdviserSubmissionRecord[],
  referenceDate = getReviewReferenceDate()
) {
  const referenceDay = startOfUtcDay(referenceDate);
  const weekStart = referenceDay - dayInMilliseconds * 6;

  return submissions.filter((submission) => {
    if (submission.status !== 'approved' || !submission.approvedAt) {
      return false;
    }

    const approvedDay = startOfUtcDay(submission.approvedAt);
    return approvedDay >= weekStart && approvedDay <= referenceDay;
  }).length;
}

export function getPriorityQueue(submissions: AdviserSubmissionRecord[]) {
  return [...submissions]
    .filter((submission) => submission.status !== 'approved')
    .sort((left, right) => new Date(left.deadline).getTime() - new Date(right.deadline).getTime())
    .slice(0, 3);
}

export function getSubmissionTypeOptions(submissions: AdviserSubmissionRecord[]) {
  return Array.from(new Set(submissions.map((submission) => submission.type)));
}

export function getSubmissionMilestoneOptions(submissions: AdviserSubmissionRecord[]) {
  return Array.from(new Set(submissions.map((submission) => submission.milestone)));
}

export const SUBMISSION_STATUS_FILTER_OPTIONS = statusFilterOptions;
