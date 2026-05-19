import type { DocumentFileSummary } from '@/components/documents/document-file-controls';

export function getReviewReferenceDate() {
  return new Date().toISOString();
}

export type SubmissionStatus = 'pending-review' | 'under-review' | 'needs-revision' | 'approved';
export type SubmissionType = 'Proposal' | 'Chapter' | 'Final';
export type SubmissionMilestone =
  | 'Proposal Screening'
  | 'Chapter 1 Review'
  | 'Chapter 3 Review'
  | 'Final Manuscript Check'
  | 'Defense Clearance';
export type SubmissionSortOption = 'deadline' | 'submitted' | 'status' | 'version';
export type CommentCategory = 'General' | 'Formatting' | 'Technical' | 'Methodology' | 'Approved Remark';

export type AdviserSubmissionComment = {
  id: string;
  category: CommentCategory;
  body: string;
  authorName: string;
  version: string;
  createdAt: string;
};

export type AdviserSubmissionVersion = {
  id: string;
  version: string;
  label: string;
  uploadedAt: string;
  uploader: string;
  isCurrent: boolean;
};

export type AdviserSubmissionTimelineEvent = {
  id: string;
  label: string;
  actor: string;
  occurredAt: string;
  isComplete: boolean;
};

export type AdviserSubmissionRecord = {
  id: string;
  groupId: string;
  projectTitle: string;
  submissionTitle: string;
  type: SubmissionType;
  milestone: SubmissionMilestone;
  status: SubmissionStatus;
  statusLabel: string;
  version: string;
  currentVersionNumber: number;
  submittedAt: string;
  deadline: string;
  submittedBy?: string;
  groupMembers?: Array<{
    userId?: string;
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
  fileType: string;
  fileExtension: string;
  documentCategory: string;
  department: 'IT';
  uploadedBy?: string;
  approvedAt?: string;
  workspaceHref: string;
  deadlineProgress: number;
  workflowStepIndex: number;
  commentCategories: CommentCategory[];
  comments: AdviserSubmissionComment[];
  versionHistory: AdviserSubmissionVersion[];
  timeline: AdviserSubmissionTimelineEvent[];
};

export const IT_REVIEW_CHECKLIST = [
  'Confirm correct document version',
  'Verify previous comments are addressed',
  'Check completeness of sections',
  'Provide clear feedback',
  'Approve only when ready'
] as const;

export const REVIEW_WORKFLOW_STEPS = [
  { id: 'submitted', label: 'Submitted', icon: 'fa-check' },
  { id: 'under-review', label: 'Under Review', icon: 'fa-magnifying-glass' },
  { id: 'revision-requested', label: 'Revision Requested', icon: 'fa-rotate-left' },
  { id: 'resubmitted', label: 'Resubmitted', icon: 'fa-file-circle-plus' },
  { id: 'approved', label: 'Approved', icon: 'fa-circle-check' }
] as const;

export const SUBMISSION_SORT_OPTIONS: ReadonlyArray<{ value: SubmissionSortOption; label: string }> = [
  { value: 'deadline', label: 'Deadline (Nearest)' },
  { value: 'submitted', label: 'Recently Submitted' },
  { value: 'status', label: 'Review Priority' },
  { value: 'version', label: 'Current Version' }
];

const submissionStatusMeta: Record<
  SubmissionStatus,
  {
    label: string;
    badgeClassName: string;
    actionLabel: string;
    tone: 'orange' | 'blue' | 'red' | 'green';
  }
> = {
  'pending-review': {
    label: 'Pending Review',
    badgeClassName: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
    actionLabel: 'Still Reviewing',
    tone: 'orange'
  },
  'under-review': {
    label: 'Under Review',
    badgeClassName: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
    actionLabel: 'Continue Review',
    tone: 'orange'
  },
  'needs-revision': {
    label: 'Revision Requested',
    badgeClassName: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    actionLabel: 'Await Resubmission',
    tone: 'red'
  },
  approved: {
    label: 'Approved by Adviser',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    actionLabel: 'View Summary',
    tone: 'green'
  }
};

const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending-review', label: 'Pending Review' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'needs-revision', label: 'Needs Revision' },
  { value: 'approved', label: 'Approved' }
] as const;

const dayInMilliseconds = 1000 * 60 * 60 * 24;

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function addDays(value: string | Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function asIsoString(value: string | Date | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || 'doc';
}

function getWorkflowStepIndex(status: SubmissionStatus, currentVersionNumber: number) {
  if (status === 'approved') return 4;
  if (status === 'needs-revision') return 2;
  if (currentVersionNumber > 1) return 3;
  if (status === 'under-review') return 1;
  return 0;
}

function getDeadlineProgress(submittedAt: string, deadline: string, status: SubmissionStatus) {
  if (status === 'approved') {
    return 100;
  }

  const submittedTime = new Date(submittedAt).getTime();
  const deadlineTime = new Date(deadline).getTime();
  const now = new Date(getReviewReferenceDate()).getTime();
  const totalWindow = Math.max(1, deadlineTime - submittedTime);
  const elapsed = Math.max(0, now - submittedTime);

  return Math.min(100, Math.max(8, Math.round((elapsed / totalWindow) * 100)));
}

function mapSubmissionStatus(status?: string | null): SubmissionStatus {
  switch (String(status || '').toUpperCase()) {
    case 'UNDER_REVIEW':
      return 'under-review';
    case 'APPROVED':
      return 'approved';
    case 'NEEDS_REVISION':
      return 'needs-revision';
    default:
      return 'pending-review';
  }
}

function categoryToType(category: string): SubmissionType {
  const normalized = category.toLowerCase();

  if (normalized.includes('final') || normalized.includes('repository')) {
    return 'Final';
  }

  if (normalized.includes('chapter')) {
    return 'Chapter';
  }

  return 'Proposal';
}

function categoryToMilestone(category: string): SubmissionMilestone {
  const normalized = category.toLowerCase();

  if (normalized.includes('chapter 3')) return 'Chapter 3 Review';
  if (normalized.includes('chapter')) return 'Chapter 1 Review';
  if (normalized.includes('final') || normalized.includes('repository')) return 'Final Manuscript Check';

  return 'Proposal Screening';
}

function inferCommentCategories(
  status: SubmissionStatus,
  milestone: SubmissionMilestone,
  latestComment?: { body?: string | null; decision?: string | null } | null
): CommentCategory[] {
  const body = String(latestComment?.body || '').toLowerCase();
  const categories = new Set<CommentCategory>();

  if (status === 'approved') {
    categories.add('Approved Remark');
  }

  if (body.includes('format') || body.includes('citation') || body.includes('reference')) {
    categories.add('Formatting');
  }

  if (body.includes('system') || body.includes('architecture') || body.includes('technical') || body.includes('code')) {
    categories.add('Technical');
  }

  if (body.includes('method') || body.includes('data') || milestone.toLowerCase().includes('chapter')) {
    categories.add('Methodology');
  }

  categories.add('General');

  return Array.from(categories).slice(0, 4);
}

function buildComments(
  status: SubmissionStatus,
  version: string,
  milestone: SubmissionMilestone,
  reviewComments: NonNullable<DocumentFileSummary['reviewComments']> = [],
  latestComment?: AdviserSubmissionRecord['latestReviewComment']
): AdviserSubmissionComment[] {
  const comments = reviewComments.length
    ? reviewComments
    : latestComment
      ? [latestComment]
      : [];

  if (!comments.length) {
    return [];
  }

  return comments.map((comment) => {
    const [category = 'General'] = inferCommentCategories(status, milestone, comment);

    return {
      id: comment.id,
      category,
      body: comment.body,
      authorName: comment.authorName || 'Adviser',
      version,
      createdAt: new Date(comment.createdAt).toISOString()
    };
  });
}

function buildVersionHistory(file: DocumentFileSummary, currentVersionNumber: number, submittedBy: string) {
  return Array.from({ length: Math.max(1, currentVersionNumber) }, (_, index): AdviserSubmissionVersion => {
    const versionNumber = index + 1;
    const isCurrent = versionNumber === currentVersionNumber;
    const uploadedAt = versionNumber === currentVersionNumber
      ? asIsoString(file.submittedAt) || asIsoString(file.createdAt) || getReviewReferenceDate()
      : addDays(file.createdAt, index * 2);

    return {
      id: `${file.id}-v${versionNumber}`,
      version: `v${versionNumber}`,
      label: versionNumber === 1
        ? 'Original Submission'
        : versionNumber === currentVersionNumber && currentVersionNumber >= 3
          ? 'Final Revision'
          : 'Resubmitted Draft',
      uploadedAt,
      uploader: versionNumber === 1 ? submittedBy : 'Student Resubmission',
      isCurrent
    };
  }).sort((left, right) => Number(right.version.slice(1)) - Number(left.version.slice(1)));
}

function buildTimeline({
  file,
  status,
  submittedBy,
  adviserName,
  reviewedAt,
  currentVersionNumber
}: {
  file: DocumentFileSummary;
  status: SubmissionStatus;
  submittedBy: string;
  adviserName: string;
  reviewedAt: string | null;
  currentVersionNumber: number;
}): AdviserSubmissionTimelineEvent[] {
  const submittedAt = asIsoString(file.submittedAt) || asIsoString(file.createdAt) || getReviewReferenceDate();
  const reviewDate = reviewedAt || addDays(submittedAt, 1);
  const revisionDate = reviewedAt || addDays(submittedAt, 2);
  const resubmittedDate = currentVersionNumber > 1 ? addDays(submittedAt, 3) : addDays(submittedAt, 4);
  const approvedDate = status === 'approved'
    ? reviewedAt || asIsoString(file.updatedAt) || addDays(submittedAt, 5)
    : addDays(submittedAt, 5);
  const hasRevisionRequested = status === 'needs-revision' || (status === 'approved' && currentVersionNumber > 1);
  const hasResubmitted = currentVersionNumber > 1;

  return [
    {
      id: 'submitted',
      label: 'Submitted by student',
      actor: submittedBy,
      occurredAt: submittedAt,
      isComplete: true
    },
    {
      id: 'under-review',
      label: 'Adviser started review',
      actor: adviserName,
      occurredAt: reviewDate,
      isComplete: status !== 'pending-review'
    },
    {
      id: 'revision-requested',
      label: 'Revision requested',
      actor: adviserName,
      occurredAt: revisionDate,
      isComplete: hasRevisionRequested
    },
    {
      id: 'resubmitted',
      label: 'Student resubmitted',
      actor: submittedBy,
      occurredAt: resubmittedDate,
      isComplete: hasResubmitted
    },
    {
      id: 'approved',
      label: 'Approved by adviser',
      actor: adviserName,
      occurredAt: approvedDate,
      isComplete: status === 'approved'
    }
  ];
}

export function toAdviserSubmissionRecord(file: DocumentFileSummary, index = 0): AdviserSubmissionRecord {
  const submittedAt = asIsoString(file.submittedAt) || asIsoString(file.createdAt) || getReviewReferenceDate();
  const deadline = addDays(submittedAt, 7);
  const type = categoryToType(file.documentCategory || '');
  const milestone = categoryToMilestone(file.documentCategory || '');
  const status = mapSubmissionStatus(file.submissionStatus);
  const currentVersionNumber = file.submissionVersion || index + 1 || 1;
  const version = `v${currentVersionNumber}`;
  const submittedBy = file.uploadedByName || 'Project Member';
  const reviewedAt = asIsoString(file.reviewedAt);
  const approvedAt = status === 'approved'
    ? reviewedAt || asIsoString(file.updatedAt) || submittedAt
    : undefined;
  const latestReviewComment = file.latestReviewComment || null;
  const adviserName = latestReviewComment?.authorName || 'Adviser';
  const commentCategories = inferCommentCategories(status, milestone, latestReviewComment);

  return {
    id: file.id,
    groupId: file.groupCode || file.groupTitle || 'Assigned Project',
    projectTitle: file.projectTitle || file.groupTitle || 'Student thesis project',
    submissionTitle: file.fileName,
    type,
    milestone,
    status,
    statusLabel: getSubmissionStatusMeta(status).label,
    version,
    currentVersionNumber,
    submittedAt,
    deadline,
    submittedBy,
    uploadedBy: file.uploadedBy,
    groupMembers: file.groupMembers || [],
    latestReviewComment,
    reviewedAt,
    reviewFocus: `${submittedBy} submitted ${file.documentCategory || 'a document'} for adviser review under ${file.groupCode || file.groupTitle || 'the assigned project'}.`,
    nextAction: status === 'approved'
      ? 'Approved by adviser. The student can view the adviser remarks and approval status.'
      : status === 'needs-revision'
        ? 'Student resubmission is unlocked. Wait for the next version or send a reminder.'
        : status === 'under-review'
          ? 'Review session is active. Student tracker now shows Under Adviser Review.'
          : 'Start review to move this submission into the adviser review workspace.',
    fileUrl: `/api/document-files/${file.id}/download`,
    fileType: file.fileType,
    fileExtension: getFileExtension(file.fileName),
    documentCategory: file.documentCategory,
    department: 'IT',
    approvedAt,
    workspaceHref: `/adviser/adviser-mode/submissions/${file.id}`,
    deadlineProgress: getDeadlineProgress(submittedAt, deadline, status),
    workflowStepIndex: getWorkflowStepIndex(status, currentVersionNumber),
    commentCategories,
    comments: buildComments(status, version, milestone, file.reviewComments || [], latestReviewComment),
    versionHistory: buildVersionHistory(file, currentVersionNumber, submittedBy),
    timeline: buildTimeline({ file, status, submittedBy, adviserName, reviewedAt, currentVersionNumber })
  };
}

export function getSubmissionStatusMeta(status: SubmissionStatus) {
  return submissionStatusMeta[status];
}

export function getCommentCategoryMeta(category: CommentCategory) {
  switch (category) {
    case 'Formatting':
      return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200';
    case 'Technical':
      return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
    case 'Methodology':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
    case 'Approved Remark':
      return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200';
    case 'General':
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200';
  }
}

export function formatSubmissionDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function formatSubmissionDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
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
    return 'text-red-600';
  }

  if (diffInDays <= 1) {
    return 'text-orange-600';
  }

  return 'text-slate-600';
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
