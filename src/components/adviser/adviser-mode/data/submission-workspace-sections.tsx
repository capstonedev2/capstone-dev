import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  getFileExtension,
  getReviewReferenceDate,
  getSubmissionStatusMeta
} from '@/components/adviser/adviser-mode/data/submission-workspace-data';

export type SubmissionSummaryMetric = {
  id: string;
  label: string;
  value: number;
  icon: string;
  tone: 'orange' | 'blue' | 'red' | 'green' | 'purple';
  // The status this card filters the list to when clicked. Omit for a metric
  // that isn't a clean 1:1 match with a single SubmissionStatus filter value.
  filterStatus?: SubmissionStatus;
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

export function SummaryCards({
  metrics,
  isLoading,
  activeStatus,
  onSelect
}: {
  metrics: SubmissionSummaryMetric[];
  isLoading?: boolean;
  activeStatus?: SubmissionStatus | 'all';
  onSelect?: (status: SubmissionStatus | 'all') => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => {
        const tone = metricToneClass[metric.tone];
        const isFilterable = Boolean(metric.filterStatus);
        const isActive = isFilterable && activeStatus === metric.filterStatus;

        return (
          <button
            key={metric.id}
            type="button"
            disabled={!isFilterable}
            onClick={() => {
              if (!metric.filterStatus) {
                return;
              }
              onSelect?.(isActive ? 'all' : metric.filterStatus);
            }}
            className={`group min-h-[124px] rounded-2xl border bg-white p-5 text-left shadow-[0_16px_34px_rgba(15,23,42,0.06)] transition duration-300 ${tone.border} border-t-4 ${
              isFilterable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : 'cursor-default'
            } ${tone.glow} ${isActive ? 'border-slate-200 ring-2 ring-[#003A8F]/40 ring-offset-2' : 'border-slate-100'}`}
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
            {isFilterable ? (
              <p className={`mt-4 flex items-center gap-1.5 text-[11px] font-black ${isActive ? tone.text : 'text-slate-400 opacity-0 transition group-hover:opacity-100'}`}>
                <i className={`fas ${isActive ? 'fa-circle-check' : 'fa-filter'} text-[10px]`} aria-hidden="true" />
                {isActive ? 'Filtering by this' : 'Click to filter'}
              </p>
            ) : null}
          </button>
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
  onDownloadSubmission,
  onViewSubmission
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
          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">Assigned Document &amp; Title Reviews</h2>
          <p className="mt-1 text-sm text-slate-500">
            Student uploads and title proposals from assigned projects, sorted by review priority, upload date, and current version.
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
              onViewSubmission={onViewSubmission}
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
  onDownloadSubmission,
  onViewSubmission
}: {
  submission: AdviserSubmissionRecord;
  onDownloadSubmission?: (submission: AdviserSubmissionRecord) => void;
  onViewSubmission?: (submission: AdviserSubmissionRecord) => void;
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
  const isTitleOrEvidence = submission.type === 'Title' || submission.type === 'Evidence' || submission.type === 'Backup';
  const primaryActionLabel = 'Preview & Details';

  return (
    <article
      className={`adviser-submission-card group overflow-hidden rounded-2xl border border-l-4 border-slate-100 ${statusVisual.borderClassName} bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(0,58,143,0.10)] cursor-pointer`}
      onClick={() => onViewSubmission?.(submission)}
    >
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
            <button
              className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-[#003A8F] ring-1 ring-inset ring-blue-100 hover:bg-blue-100"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onViewSubmission?.(submission);
              }}
            >
              Full details
            </button>
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
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#003A8F] px-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#002C6B]"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onViewSubmission?.(submission);
              }}
            >
              <i className="fas fa-eye text-xs" aria-hidden="true" />
              {primaryActionLabel}
            </button>
            {submission.fileUrl ? (
              <button
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#003A8F] transition hover:bg-blue-50"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDownloadSubmission?.(submission);
                }}
              >
                <i className="fas fa-download text-[10px]" aria-hidden="true" />
                Download
              </button>
            ) : null}
            <Link
              className="text-center text-[11px] font-bold leading-4 text-[#003A8F] underline-offset-2 hover:underline"
              href={submission.workspaceHref}
              onClick={(event) => event.stopPropagation()}
            >
              {isTitleOrEvidence ? 'Approve/reject from Title & Evidence Approval' : 'Open full review workspace'}
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

const DETAILS_MODAL_OFFICE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
const DETAILS_MODAL_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

/**
 * Read-only preview for Title and Evidence cards on Document Submissions —
 * lets the adviser see the file, latest note, and timeline without leaving
 * this page. The actual Approve/Needs Revision decision still only happens
 * on Title & Evidence Approval (linked from here), same as before; this just
 * removes the forced navigation for the common case of just wanting to look.
 */
export function SubmissionDetailsModal({
  submission,
  onClose
}: {
  submission: AdviserSubmissionRecord;
  onClose: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const previewFiles = submission.previewFiles;
  const activeFile = previewFiles[activeFileIndex] || null;
  const activeFileId = activeFile?.id || submission.previewFileId;
  // Backup title files have no Project yet, so the generic document-files
  // routes (which authorize off a project relation) 403 on them — they're
  // only reachable through their own dedicated, group-scoped API.
  const documentApiBase = submission.type === 'Backup' ? '/api/title-drafts/files' : '/api/document-files';

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.removeProperty('overflow'); };
  }, []);

  // A new submission was opened (not just paging within the same one's files) —
  // start back at its first file.
  useEffect(() => {
    setActiveFileIndex(0);
  }, [submission.id]);

  useEffect(() => {
    let cancelled = false;

    if (!activeFileId) {
      return;
    }

    setSignedUrl(null);
    setPreviewError(null);

    const loadSignedUrl = async () => {
      try {
        const response = await fetch(`${documentApiBase}/${activeFileId}/signed-url`, { method: 'POST' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || payload?.error || 'Unable to prepare document preview.');
        }

        if (!cancelled) {
          setSignedUrl(payload.signedUrl);
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : 'Unable to prepare document preview.');
        }
      }
    };

    loadSignedUrl();

    return () => {
      cancelled = true;
    };
  }, [activeFileId]);

  if (!isMounted) {
    return null;
  }

  const statusMeta = getSubmissionStatusMeta(submission.status);
  const fileExtension = activeFile ? getFileExtension(activeFile.name) : submission.fileExtension.toLowerCase();
  const isOfficeFile = DETAILS_MODAL_OFFICE_EXTENSIONS.includes(fileExtension);
  const isImageFile = DETAILS_MODAL_IMAGE_EXTENSIONS.includes(fileExtension);
  const previewIcon = isImageFile ? 'fa-image' : isOfficeFile ? 'fa-file-lines' : fileExtension === 'pdf' ? 'fa-file-pdf' : 'fa-file';
  const previewUrl = signedUrl
    ? isOfficeFile
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`
      : signedUrl
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        aria-label="Submission details"
        aria-modal="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-white/60"
      >
        <header className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#003A8F,#1E40AF)] px-6 py-6 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/20">
                <i className={`fas ${previewIcon} text-xl`} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-100">
                  <i className="fas fa-eye opacity-70" aria-hidden="true" /> {submission.type} Preview
                </p>
                <h2 className="mt-1 truncate text-2xl font-black tracking-tight leading-tight" title={submission.submissionTitle}>
                  {submission.submissionTitle}
                </h2>
                <p className="mt-1 truncate text-sm font-bold text-blue-100">{submission.projectTitle}</p>
              </div>
            </div>
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus:outline-none"
              type="button"
              onClick={onClose}
            >
              <i className="fas fa-xmark text-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusMeta.badgeClassName}`}>
              {statusMeta.label}
            </span>
            <span className="inline-flex rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-inset ring-white/20">
              {submission.documentCategory}
            </span>
            <span className="inline-flex rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-inset ring-white/20">
              {submission.milestone}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-4 py-4 sm:px-6 sm:py-6 custom-scrollbar">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                      <i className={`fas ${previewIcon} text-sm`} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-700">
                        {fileExtension.toUpperCase()} Preview
                        {previewFiles.length > 1 ? ` — ${activeFileIndex + 1} of ${previewFiles.length}` : ''}
                      </p>
                      <h2 className="mt-0.5 truncate text-lg font-black text-slate-950">
                        {activeFile?.name || 'Document Preview'}
                      </h2>
                    </div>
                  </div>
                  {activeFileId ? (
                    <div className="flex items-center gap-2">
                      <a
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                        href={previewUrl || `${documentApiBase}/${activeFileId}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="fas fa-up-right-from-square text-[10px]" aria-hidden="true" />
                        Open
                      </a>
                      <a
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                        href={`${documentApiBase}/${activeFileId}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="fas fa-download text-[10px]" aria-hidden="true" />
                        Download
                      </a>
                    </div>
                  ) : null}
                </div>

                {previewFiles.length > 1 ? (
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-blue-50/40 px-4 py-2">
                    <button
                      className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                      type="button"
                      disabled={activeFileIndex === 0}
                      onClick={() => setActiveFileIndex((index) => Math.max(0, index - 1))}
                    >
                      <i className="fas fa-chevron-left text-[10px]" aria-hidden="true" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1.5">
                      {previewFiles.map((file, index) => (
                        <button
                          key={file.id}
                          type="button"
                          aria-label={`Show file ${index + 1}`}
                          className={`h-2 w-2 rounded-full transition ${index === activeFileIndex ? 'bg-blue-700' : 'bg-blue-200 hover:bg-blue-300'}`}
                          onClick={() => setActiveFileIndex(index)}
                        />
                      ))}
                    </div>
                    <button
                      className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                      type="button"
                      disabled={activeFileIndex === previewFiles.length - 1}
                      onClick={() => setActiveFileIndex((index) => Math.min(previewFiles.length - 1, index + 1))}
                    >
                      Next
                      <i className="fas fa-chevron-right text-[10px]" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}

                <div className="bg-slate-100 p-3 sm:p-4">
                  {!activeFileId ? (
                    <div className="flex h-[min(60vh,640px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white">
                      <i className="fas fa-file-circle-question text-2xl text-slate-300" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-500">No file has been uploaded for this stage yet.</p>
                    </div>
                  ) : previewError ? (
                    <div className="flex h-[min(60vh,640px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-center">
                      <i className="fas fa-triangle-exclamation text-2xl text-amber-500" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-600">{previewError}</p>
                      <p className="text-xs text-slate-400">Use Download instead.</p>
                    </div>
                  ) : previewUrl && isImageFile ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/preview relative flex h-[min(65vh,700px)] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[repeating-conic-gradient(#f8fafc_0%_25%,white_0%_50%)] bg-[length:20px_20px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL, not a static asset Next's optimizer can process */}
                      <img
                        src={previewUrl}
                        alt={activeFile?.name || submission.submissionTitle}
                        className="max-h-full max-w-full object-contain"
                      />
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 backdrop-blur transition group-hover/preview:opacity-100">
                        <i className="fas fa-up-right-and-down-left-from-center text-[10px]" aria-hidden="true" />
                        Open full size
                      </span>
                    </a>
                  ) : previewUrl ? (
                    <iframe
                      className="h-[min(60vh,640px)] w-full rounded-xl border border-slate-200 bg-white"
                      src={previewUrl}
                      title={`${submission.submissionTitle} preview`}
                    />
                  ) : (
                    <div className="flex h-[min(60vh,640px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white">
                      <i className="fas fa-spinner fa-spin text-2xl text-[var(--primary)]" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-500">Preparing preview...</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Latest Note</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {submission.latestReviewComment?.body || 'No adviser notes yet.'}
                </p>
                {submission.latestReviewComment ? (
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#003A8F] text-[10px] font-black text-white">RC</span>
                    {submission.latestReviewComment.authorName || 'Adviser'} <span aria-hidden="true">|</span> {formatSubmissionDateTime(submission.latestReviewComment.createdAt)}
                  </p>
                ) : null}
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#003A8F]">Timeline</p>
                <div className="mt-4 space-y-3">
                  {submission.timeline.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${event.isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <i className={`fas ${event.isComplete ? 'fa-check' : 'fa-clock'}`} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-900">{event.label}</p>
                        <p className="text-xs text-slate-500">{event.isComplete ? formatSubmissionDateTime(event.occurredAt) : 'Pending'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Submitted By</p>
                <p className="mt-2 text-sm font-black text-slate-900">{submission.submittedBy || 'Project Member'}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{formatSubmissionDateTime(submission.submittedAt)}</p>

                {submission.groupMembers?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {submission.groupMembers.map((member, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                        {member.isLeader ? <i className="fas fa-crown text-[10px] text-amber-500" aria-hidden="true" /> : null}
                        {member.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>

              <Link
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#003A8F] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#002C6B]"
                href={submission.workspaceHref}
              >
                <i className="fas fa-up-right-from-square text-xs" aria-hidden="true" />
                {submission.type === 'Title' || submission.type === 'Evidence' || submission.type === 'Backup'
                  ? 'Approve/Reject on Title & Evidence Approval'
                  : 'Open Full Review Workspace'}
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
