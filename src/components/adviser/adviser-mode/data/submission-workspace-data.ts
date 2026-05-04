export const REVIEW_REFERENCE_DATE = '2026-04-14T00:00:00.000Z';

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
  groupId: `IT-2024-${string}`;
  projectTitle: string;
  submissionTitle: string;
  type: SubmissionType;
  milestone: SubmissionMilestone;
  status: SubmissionStatus;
  version: `v${number}`;
  submittedAt: string;
  deadline: string;
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

export const IT_ADVISER_SUBMISSIONS: AdviserSubmissionRecord[] = [
  {
    id: 'it-submission-01',
    groupId: 'IT-2024-06',
    projectTitle: 'Smart Queue Analytics Dashboard',
    submissionTitle: 'Proposal Scope Alignment and Feasibility Revision',
    type: 'Proposal',
    milestone: 'Proposal Screening',
    status: 'pending-review',
    version: 'v2',
    submittedAt: '2026-04-14T08:15:00.000Z',
    deadline: '2026-04-16T00:00:00.000Z',
    reviewFocus:
      'Check whether the revised scope now matches the approved user roles, queue analytics flow, and infrastructure assumptions for the pilot deployment.',
    nextAction: 'Confirm if the revised scope can move to Chapter 1 drafting.',
    fileUrl: '/mock-files/it-2024-06-proposal-v2.pdf',
    department: 'IT'
  },
  {
    id: 'it-submission-02',
    groupId: 'IT-2024-11',
    projectTitle: 'Barangay Incident Mapping and Alerting',
    submissionTitle: 'Chapter 3 Architecture, Testing Plan, and Data Flow',
    type: 'Chapter',
    milestone: 'Chapter 3 Review',
    status: 'under-review',
    version: 'v1',
    submittedAt: '2026-04-12T09:45:00.000Z',
    deadline: '2026-04-15T00:00:00.000Z',
    reviewFocus:
      'Validate the testing matrix, alert escalation workflow, and whether the system diagrams still align with the approved problem statement.',
    nextAction: 'Finish the second pass and leave consolidated comments for the team.',
    fileUrl: '/mock-files/it-2024-11-chapter-3-v1.pdf',
    department: 'IT'
  },
  {
    id: 'it-submission-03',
    groupId: 'IT-2024-09',
    projectTitle: 'Clinic Appointment Flow Optimizer',
    submissionTitle: 'Chapter 1 Revised Problem Statement and Objectives',
    type: 'Chapter',
    milestone: 'Chapter 1 Review',
    status: 'needs-revision',
    version: 'v3',
    submittedAt: '2026-04-10T13:20:00.000Z',
    deadline: '2026-04-13T00:00:00.000Z',
    reviewFocus:
      'Re-check the revised objectives, boundary conditions, and terminology updates against the feedback already returned during the first adviser round.',
    nextAction: 'Review the resubmission and decide if the revision comments were fully addressed.',
    fileUrl: '/mock-files/it-2024-09-chapter-1-v3.pdf',
    department: 'IT'
  },
  {
    id: 'it-submission-04',
    groupId: 'IT-2024-14',
    projectTitle: 'Student Services Help Desk Portal',
    submissionTitle: 'Final Manuscript and Deployment Checklist',
    type: 'Final',
    milestone: 'Final Manuscript Check',
    status: 'approved',
    version: 'v1',
    submittedAt: '2026-04-11T10:05:00.000Z',
    deadline: '2026-04-18T00:00:00.000Z',
    reviewFocus:
      'The final manuscript package already passed format and completeness checks and is now ready for archiving before the defense file handoff.',
    nextAction: 'Open the approved review packet if you need to revisit the final notes.',
    fileUrl: '/mock-files/it-2024-14-final-v1.pdf',
    department: 'IT',
    approvedAt: '2026-04-12T16:00:00.000Z'
  },
  {
    id: 'it-submission-05',
    groupId: 'IT-2024-18',
    projectTitle: 'Campus Wi-Fi Ticketing Insight Tool',
    submissionTitle: 'Proposal Evaluation Matrix and Risk Adjustments',
    type: 'Proposal',
    milestone: 'Proposal Screening',
    status: 'pending-review',
    version: 'v1',
    submittedAt: '2026-04-13T07:30:00.000Z',
    deadline: '2026-04-15T00:00:00.000Z',
    reviewFocus:
      'Focus on the revised risk assumptions, expected usage metrics, and whether the team clarified the feasibility of live incident monitoring.',
    nextAction: 'Decide if the proposal is ready for adviser endorsement.',
    fileUrl: '/mock-files/it-2024-18-proposal-v1.pdf',
    department: 'IT'
  },
  {
    id: 'it-submission-06',
    groupId: 'IT-2024-21',
    projectTitle: 'Internship Partner Matching Assistant',
    submissionTitle: 'Final Readiness Annexes and Defense Clearance Pack',
    type: 'Final',
    milestone: 'Defense Clearance',
    status: 'pending-review',
    version: 'v2',
    submittedAt: '2026-04-09T15:10:00.000Z',
    deadline: '2026-04-14T00:00:00.000Z',
    reviewFocus:
      'Review the annexes, endorsement forms, and deployment readiness notes to confirm the group can proceed to final defense clearance.',
    nextAction: 'Clear the defense packet or return one final checklist for completion.',
    fileUrl: '/mock-files/it-2024-21-defense-clearance-v2.pdf',
    department: 'IT'
  }
];

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
    label: 'Under Review',
    badgeClassName: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    actionLabel: 'Continue Review'
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

export function getDeadlineLabel(deadline: string, referenceDate = REVIEW_REFERENCE_DATE) {
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

export function getDeadlineToneClass(deadline: string, referenceDate = REVIEW_REFERENCE_DATE) {
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
  referenceDate = REVIEW_REFERENCE_DATE
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
