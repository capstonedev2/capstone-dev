import Link from 'next/link';
import type { ReactNode } from 'react';
import type {
  AdviserSubmissionRecord,
  SubmissionMilestone,
  SubmissionSortOption,
  SubmissionStatus,
  SubmissionType
} from '@/components/adviser/adviser-mode/data/submission-workspace-data';
import {
  REVIEW_WORKFLOW_STEPS,
  SUBMISSION_SORT_OPTIONS,
  formatSubmissionDate,
  formatSubmissionDateTime,
  getCommentCategoryMeta,
  getDeadlineLabel,
  getDeadlineToneClass,
  getReviewReferenceDate,
  getSubmissionStatusMeta
} from '@/components/adviser/adviser-mode/data/submission-workspace-data';

export type SubmissionSummaryMetric = {
  id: string;
  label: string;
  value: number;
  helperText: string;
  icon: string;
  tone: 'orange' | 'blue' | 'red' | 'green' | 'purple';
};

type FiltersBarProps = {
  typeFilter: SubmissionType | 'all';
  statusFilter: SubmissionStatus | 'all';
  milestoneFilter: SubmissionMilestone | 'all';
  sortBy: SubmissionSortOption;
  searchValue: string;
  typeOptions: SubmissionType[];
  milestoneOptions: SubmissionMilestone[];
  statusOptions: ReadonlyArray<{ value: SubmissionStatus | 'all'; label: string }>;
  resultCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onTypeChange: (value: SubmissionType | 'all') => void;
  onStatusChange: (value: SubmissionStatus | 'all') => void;
  onMilestoneChange: (value: SubmissionMilestone | 'all') => void;
  onSortChange: (value: SubmissionSortOption) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
};

type SubmissionFocusPanelProps = {
  openReviewCount: number;
  needsRevisionCount: number;
  approvedThisWeekCount: number;
  awaitingResubmissionCount: number;
  nextDueSubmission: AdviserSubmissionRecord | null;
  isLoading?: boolean;
};

const dayInMilliseconds = 1000 * 60 * 60 * 24;

const metricToneClass: Record<SubmissionSummaryMetric['tone'], { icon: string; border: string; text: string; glow: string }> = {
  orange: {
    icon: 'bg-orange-50 text-orange-600 ring-orange-200',
    border: 'border-t-orange-400',
    text: 'text-orange-600',
    glow: 'group-hover:shadow-orange-500/10'
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600 ring-blue-200',
    border: 'border-t-blue-500',
    text: 'text-blue-700',
    glow: 'group-hover:shadow-blue-500/10'
  },
  red: {
    icon: 'bg-red-50 text-red-600 ring-red-200',
    border: 'border-t-red-500',
    text: 'text-red-600',
    glow: 'group-hover:shadow-red-500/10'
  },
  green: {
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    border: 'border-t-emerald-500',
    text: 'text-emerald-600',
    glow: 'group-hover:shadow-emerald-500/10'
  },
  purple: {
    icon: 'bg-violet-50 text-violet-600 ring-violet-200',
    border: 'border-t-violet-500',
    text: 'text-violet-600',
    glow: 'group-hover:shadow-violet-500/10'
  }
};

const submissionStatusVisuals: Record<
  SubmissionStatus,
  {
    borderClassName: string;
    progressClassName: string;
    fileRingClassName: string;
  }
> = {
  'pending-review': {
    borderClassName: 'border-l-orange-400',
    progressClassName: 'bg-orange-500',
    fileRingClassName: 'ring-orange-200'
  },
  'under-review': {
    borderClassName: 'border-l-orange-500',
    progressClassName: 'bg-orange-500',
    fileRingClassName: 'ring-orange-200'
  },
  'needs-revision': {
    borderClassName: 'border-l-red-500',
    progressClassName: 'bg-red-500',
    fileRingClassName: 'ring-red-200'
  },
  approved: {
    borderClassName: 'border-l-emerald-500',
    progressClassName: 'bg-emerald-500',
    fileRingClassName: 'ring-emerald-200'
  }
};

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getDeadlineDelta(deadline: string | null) {
  if (!deadline) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.round((startOfUtcDay(deadline) - startOfUtcDay(getReviewReferenceDate())) / dayInMilliseconds);
}

function getDeadlineVisual(deadline: string | null, status: SubmissionStatus) {
  if (status === 'approved') {
    return {
      label: 'Cleared',
      icon: 'fa-circle-check',
      className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
      barClassName: 'bg-emerald-500'
    };
  }

  if (!deadline) {
    return {
      label: 'No due date',
      icon: 'fa-calendar',
      className: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
      barClassName: 'bg-slate-300'
    };
  }

  const delta = getDeadlineDelta(deadline);

  if (delta < 0) {
    return {
      label: getDeadlineLabel(deadline),
      icon: 'fa-triangle-exclamation',
      className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
      barClassName: 'bg-red-500'
    };
  }

  if (delta <= 1) {
    return {
      label: getDeadlineLabel(deadline),
      icon: 'fa-bell',
      className: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
      barClassName: 'bg-orange-500'
    };
  }

  return {
    label: getDeadlineLabel(deadline),
    icon: 'fa-calendar-day',
    className: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    barClassName: 'bg-blue-600'
  };
}

function getFileVisual(submission: AdviserSubmissionRecord) {
  const extension = submission.fileExtension.toLowerCase();

  if (extension === 'pdf') {
    return { icon: 'fa-file-pdf', label: 'PDF', className: 'bg-red-50 text-red-600' };
  }

  if (['doc', 'docx'].includes(extension)) {
    return { icon: 'fa-file-word', label: 'DOCX', className: 'bg-blue-50 text-blue-600' };
  }

  if (['ppt', 'pptx'].includes(extension)) {
    return { icon: 'fa-file-powerpoint', label: 'PPT', className: 'bg-orange-50 text-orange-600' };
  }

  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return { icon: 'fa-file-excel', label: 'XLS', className: 'bg-emerald-50 text-emerald-600' };
  }

  return { icon: 'fa-file-lines', label: extension.toUpperCase(), className: 'bg-slate-100 text-slate-700' };
}

function WorkspaceSelect<TValue extends string>({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: TValue;
  onChange: (value: TValue) => void;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm outline-none transition focus:border-[#003A8F] focus:ring-4 focus:ring-blue-900/10"
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
      >
        {children}
      </select>
    </label>
  );
}

export function SummaryCards({ metrics, isLoading }: { metrics: SubmissionSummaryMetric[], isLoading?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => {
        const tone = metricToneClass[metric.tone];

        return (
          <article
            key={metric.id}
            className={`group min-h-[136px] rounded-2xl border border-slate-100 ${tone.border} border-t-4 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-xl ${tone.glow}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                {isLoading ? (
                  <div className="mt-4 h-9 w-14 animate-pulse rounded bg-slate-100" />
                ) : (
                  <p className={`mt-3 text-4xl font-black tracking-[-0.05em] ${tone.text}`}>{metric.value}</p>
                )}
              </div>
              <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ring-1 ring-inset ${tone.icon}`}>
                <i className={`fas ${metric.icon}`} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{metric.helperText}</p>
          </article>
        );
      })}
    </div>
  );
}

export function SubmissionFocusPanel({
  openReviewCount,
  needsRevisionCount,
  approvedThisWeekCount,
  awaitingResubmissionCount,
  nextDueSubmission,
  isLoading
}: SubmissionFocusPanelProps) {
  const deadlineVisual = nextDueSubmission
    ? getDeadlineVisual(nextDueSubmission.deadline, nextDueSubmission.status)
    : null;

  const quickStats = [
    { label: 'Open Reviews', value: openReviewCount, icon: 'fa-inbox' },
    { label: 'Needs Revision', value: needsRevisionCount, icon: 'fa-rotate-left' },
    { label: 'Approved This Week', value: approvedThisWeekCount, icon: 'fa-circle-check' },
    { label: 'Awaiting Resubmission', value: awaitingResubmissionCount, icon: 'fa-users-gear' }
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.55fr)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#003A8F_0%,#1E40AF_62%,#0B2F7D_100%)] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F6BE00]/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-blue-50 ring-1 ring-inset ring-white/15">
              <i className="fas fa-circle text-[7px] text-[#F6BE00]" aria-hidden="true" />
              Adviser Review Desk
            </span>
            <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">Submission Queue</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Manage student submissions, track review progress, provide feedback, and approve documents for the next academic workflow.
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-2xl border border-white/20 bg-white px-4 text-sm font-black text-[#003A8F] shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
                href="/adviser/adviser-mode/reports"
              >
                <i className="fas fa-chart-simple text-xs" aria-hidden="true" />
                View Analytics
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-blue-100">{stat.label}</p>
                    <i className={`fas ${stat.icon} text-[#F6BE00]`} aria-hidden="true" />
                  </div>
                  {isLoading ? (
                    <div className="mt-3 h-8 w-12 animate-pulse rounded bg-white/20" />
                  ) : (
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em]">{stat.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-5 bg-slate-50 p-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Next Due Date</p>
            {isLoading ? (
              <div className="mt-4 space-y-3">
                <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              </div>
            ) : nextDueSubmission ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${deadlineVisual?.className}`}>
                    <i className={`fas ${deadlineVisual?.icon} text-[10px]`} aria-hidden="true" />
                    {deadlineVisual?.label}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600 ring-1 ring-inset ring-slate-200">
                    {nextDueSubmission.version}
                  </span>
                </div>
                <h2 className="mt-4 overflow-hidden text-lg font-black leading-6 text-slate-950 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {nextDueSubmission.submissionTitle}
                </h2>
                <p className="mt-2 text-sm font-bold text-[#003A8F]">{nextDueSubmission.groupId}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {nextDueSubmission.deadline ? formatSubmissionDate(nextDueSubmission.deadline) : 'Not set'}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No adviser due dates have been set.</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Queue progress</span>
              <span>{nextDueSubmission ? `${nextDueSubmission.deadlineProgress}%` : '100%'}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#003A8F,#1E40AF,#F6BE00)]"
                style={{ width: `${nextDueSubmission ? nextDueSubmission.deadlineProgress : 100}%` }}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function FiltersBar({
  typeFilter,
  statusFilter,
  milestoneFilter,
  sortBy,
  searchValue,
  typeOptions,
  milestoneOptions,
  statusOptions,
  resultCount,
  totalCount,
  hasActiveFilters,
  onTypeChange,
  onStatusChange,
  onMilestoneChange,
  onSortChange,
  onSearchChange,
  onClearFilters
}: FiltersBarProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Review Filters</h2>
          <p className="mt-1 text-sm text-slate-500">
            {resultCount} of {totalCount} assigned submissions shown
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-black text-[#003A8F] ring-1 ring-inset ring-blue-100 transition hover:bg-blue-100"
            href="/adviser/adviser-mode/groups"
          >
            <i className="fas fa-user-group text-xs" aria-hidden="true" />
            Assigned Projects
          </Link>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#003A8F]/30 hover:text-[#003A8F]"
            >
              <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(135px,0.8fr)_minmax(150px,0.9fr)_minmax(200px,1.1fr)_minmax(190px,1fr)_minmax(280px,1.5fr)]">
        <WorkspaceSelect label="Type" value={typeFilter} onChange={onTypeChange}>
          <option value="all">All Types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect label="Status" value={statusFilter} onChange={onStatusChange}>
          {statusOptions.map((statusOption) => (
            <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect label="Milestone" value={milestoneFilter} onChange={onMilestoneChange}>
          <option value="all">All Milestones</option>
          {milestoneOptions.map((milestone) => (
            <option key={milestone} value={milestone}>{milestone}</option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect label="Sort By" value={sortBy} onChange={onSortChange}>
          {SUBMISSION_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </WorkspaceSelect>

        <label className="relative block">
          <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Search</span>
          <span className="pointer-events-none absolute bottom-0 left-4 flex h-12 items-center text-slate-400">
            <i className="fas fa-search text-sm" aria-hidden="true" />
          </span>
          <input
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#003A8F] focus:ring-4 focus:ring-blue-900/10"
            placeholder="Search groups, projects, or documents..."
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}

export function SubmissionList({
  submissions,
  totalSubmissions,
  hasActiveFilters,
  isLoading,
  onClearFilters,
  onDownloadSubmission
}: {
  submissions: AdviserSubmissionRecord[];
  totalSubmissions: number;
  hasActiveFilters: boolean;
  isLoading?: boolean;
  onClearFilters: () => void;
  onViewSubmission?: (submission: AdviserSubmissionRecord) => void;
  onDownloadSubmission?: (submission: AdviserSubmissionRecord) => void;
  onStartReview?: (submission: AdviserSubmissionRecord) => void;
  onRequestRevision?: (submission: AdviserSubmissionRecord) => void;
  onApproveNotify?: (submission: AdviserSubmissionRecord) => void;
  onSendReminder?: (submission: AdviserSubmissionRecord) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">Assigned Document Reviews</h2>
          <p className="mt-1 text-sm text-slate-500">
            Real student uploads from assigned projects, sorted by review priority, upload date, and current version.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
          <i className="fas fa-layer-group text-[10px]" aria-hidden="true" />
          {submissions.length}/{totalSubmissions} shown
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)]" />
          ))}
        </div>
      ) : submissions.length ? (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <SubmissionItem
              key={submission.id}
              submission={submission}
              onDownloadSubmission={onDownloadSubmission}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#003A8F]">
            <i className="fas fa-folder-open text-lg" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950">No matching document reviews</h3>
          <p className="mt-2 text-sm text-slate-500">
            Adjust the filters or search terms to bring assigned documents back into view.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#003A8F] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#002C6B]"
            >
              <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
              Clear filters
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function SubmissionItem({
  submission,
  onDownloadSubmission
}: {
  submission: AdviserSubmissionRecord;
  onDownloadSubmission?: (submission: AdviserSubmissionRecord) => void;
}) {
  const statusMeta = getSubmissionStatusMeta(submission.status);
  const statusVisual = submissionStatusVisuals[submission.status];
  const deadlineVisual = getDeadlineVisual(submission.deadline, submission.status);
  const deadlineDelta = getDeadlineDelta(submission.deadline);
  const isUrgent = Boolean(submission.deadline) && submission.status !== 'approved' && deadlineDelta <= 1;
  const fileVisual = getFileVisual(submission);
  const visibleMembers = submission.groupMembers?.slice(0, 2) || [];
  const remainingMembers = Math.max(0, (submission.groupMembers?.length || 0) - visibleMembers.length);
  const currentWorkflowStep = REVIEW_WORKFLOW_STEPS[submission.workflowStepIndex] || REVIEW_WORKFLOW_STEPS[0];
  const latestTimelineEvent = [...submission.timeline].reverse().find((event) => event.isComplete) || submission.timeline[0];
  const latestNote = submission.latestReviewComment?.body || 'No adviser notes yet. Open the review workspace to add comments.';
  const primaryActionLabel = submission.status === 'approved' ? 'View Summary' : 'Open Review';

  return (
    <article className={`adviser-submission-card group overflow-hidden rounded-2xl border border-l-4 border-slate-100 ${statusVisual.borderClassName} bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(0,58,143,0.10)]`}>
      <div className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)_220px]">
        <section className="border-b border-slate-100 p-4 xl:border-b-0 xl:border-r">
          <div className="flex items-start gap-3">
            <span className={`inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl ${fileVisual.className} ring-1 ring-inset ${statusVisual.fileRingClassName}`}>
              <i className={`fas ${fileVisual.icon} text-lg`} aria-hidden="true" />
              <span className="mt-1 text-[9px] font-black uppercase tracking-wide">{fileVisual.label}</span>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
                  {submission.groupId}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusMeta.badgeClassName}`}>
                  {statusMeta.label}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">{submission.version}</span>
              </div>
              <h3 className="mt-2 overflow-hidden text-base font-black leading-6 text-slate-950 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]" title={submission.submissionTitle}>
                {submission.submissionTitle}
              </h3>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">{submission.projectTitle}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Student</p>
              <p className="mt-0.5 truncate font-black text-slate-900">{submission.submittedBy || 'Project Member'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Milestone</p>
              <p className="mt-0.5 truncate font-black text-slate-900">{submission.milestone}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {visibleMembers.length ? (
              visibleMembers.map((member) => (
                <span
                  key={`${submission.id}-${member.name}`}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
                    member.isLeader
                      ? 'bg-amber-50 text-amber-800 ring-amber-200'
                      : 'bg-slate-100 text-slate-700 ring-slate-200'
                  }`}
                >
                  {member.name}
                </span>
              ))
            ) : null}
            {remainingMembers ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                +{remainingMembers}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">{submission.type}</span>
          </div>
        </section>

        <section className="min-w-0 border-b border-slate-100 p-4 xl:border-b-0 xl:border-r">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Review Stage</p>
              <p className="mt-1 text-sm font-black text-slate-950">{currentWorkflowStep.label}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {isUrgent ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700 ring-1 ring-inset ring-red-200">
                  Priority
                </span>
              ) : null}
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-black ${deadlineVisual.className}`}>
                <i className={`fas ${deadlineVisual.icon} text-[10px]`} aria-hidden="true" />
                {deadlineVisual.label}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            {REVIEW_WORKFLOW_STEPS.map((step, index) => {
                const timelineEvent = submission.timeline.find((event) => event.id === step.id);
                const nextStep = REVIEW_WORKFLOW_STEPS[index + 1];
                const nextTimelineEvent = nextStep
                  ? submission.timeline.find((event) => event.id === nextStep.id)
                  : null;
                const isCurrentUnderReview = submission.status === 'under-review' && step.id === 'under-review';
                const isCurrentApproved = submission.status === 'approved' && step.id === 'approved';
                const isComplete = step.id === 'submitted'
                  || Boolean(timelineEvent?.isComplete)
                  || (submission.status === 'approved' && ['under-review', 'approved'].includes(step.id));
                const isNextComplete = Boolean(nextStep) && (
                  nextStep.id === 'submitted'
                  || Boolean(nextTimelineEvent?.isComplete)
                  || (submission.status === 'approved' && ['under-review', 'approved'].includes(nextStep.id))
                );
                const isCurrent = index === submission.workflowStepIndex;
                const completeClassName = isCurrentUnderReview
                  ? 'adviser-under-review-glow bg-orange-500 text-white'
                  : isCurrentApproved
                    ? 'adviser-approval-success-glow bg-emerald-600 text-white'
                    : isComplete
                      ? `${statusVisual.progressClassName} text-white`
                      : 'bg-white text-slate-400 ring-slate-200';

                return (
                  <div key={step.id} className="relative flex flex-1 items-center">
                    {index < REVIEW_WORKFLOW_STEPS.length - 1 ? (
                      <span className={`absolute left-4 right-[-0.4rem] top-1/2 h-0.5 ${isComplete && isNextComplete ? statusVisual.progressClassName : 'bg-slate-200'}`} aria-hidden="true" />
                    ) : null}
                    <span className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] ring-2 ring-white transition-all duration-500 ${completeClassName}`} title={step.label}>
                      <i className={`fas ${isCurrent ? step.icon : isComplete ? 'fa-check' : step.icon}`} aria-hidden="true" />
                    </span>
                  </div>
                );
            })}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className={`rounded-2xl p-3 ${submission.status === 'approved' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#003A8F]">Latest Note</p>
              <p className="mt-2 overflow-hidden text-sm leading-6 text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {latestNote}
              </p>
              <p className="mt-2 text-xs font-bold text-slate-500">
                {submission.latestReviewComment
                  ? `${submission.latestReviewComment.authorName || 'Adviser'} | ${formatSubmissionDateTime(submission.latestReviewComment.createdAt)} | ${submission.version}`
                  : `Current version ${submission.version}`}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#003A8F]">Latest Activity</p>
              <p className="mt-2 text-sm font-black text-slate-900">{latestTimelineEvent?.label || statusMeta.label}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {latestTimelineEvent ? formatSubmissionDateTime(latestTimelineEvent.occurredAt) : formatSubmissionDateTime(submission.submittedAt)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {submission.commentCategories.slice(0, 3).map((category) => (
              <span key={`${submission.id}-${category}`} className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getCommentCategoryMeta(category)}`}>
                {category}
              </span>
            ))}
            <Link className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-[#003A8F] ring-1 ring-inset ring-blue-100 hover:bg-blue-100" href={submission.workspaceHref}>
              Full details
            </Link>
          </div>
        </section>

        <aside className="flex min-h-full flex-col justify-between gap-3 bg-slate-50 p-4">
          <div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-inset ring-slate-200">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Submitted</p>
                <p className="mt-0.5 font-black text-slate-900">{formatSubmissionDate(submission.submittedAt)}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-inset ring-slate-200">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Due Date</p>
                <p className={`mt-0.5 font-black ${getDeadlineToneClass(submission.deadline)}`}>
                  {submission.deadline ? formatSubmissionDate(submission.deadline) : 'Not set'}
                </p>
              </div>
            </div>

            <div className="mt-3">
              {submission.deadline || submission.status === 'approved' ? (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{submission.deadline ? 'Due progress' : 'Review status'}</span>
                    <span>{submission.deadlineProgress}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${deadlineVisual.barClassName}`} style={{ width: `${submission.deadlineProgress}%` }} />
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold leading-4 text-slate-500 ring-1 ring-inset ring-slate-200">
                  No adviser due date has been set for this review.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2 pt-1">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#003A8F] px-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#002C6B]"
              href={submission.workspaceHref}
            >
              <i className="fas fa-up-right-from-square text-xs" aria-hidden="true" />
              {primaryActionLabel}
            </Link>
            <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#003A8F] transition hover:bg-blue-50" type="button" onClick={() => onDownloadSubmission?.(submission)}>
              <i className="fas fa-download text-[10px]" aria-hidden="true" />
              Download
            </button>
            <p className="text-center text-[11px] font-bold leading-4 text-slate-500">
              Review actions are inside the workspace.
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}
