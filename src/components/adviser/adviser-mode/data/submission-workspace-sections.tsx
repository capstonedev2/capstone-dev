import type { ReactNode } from 'react';
import type { AdviserSubmissionRecord, SubmissionMilestone, SubmissionStatus, SubmissionType } from '@/components/adviser/adviser-mode/data/submission-workspace-data';
import {
  formatSubmissionDate,
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
  iconClassName: string;
};

type FiltersBarProps = {
  typeFilter: SubmissionType | 'all';
  statusFilter: SubmissionStatus | 'all';
  milestoneFilter: SubmissionMilestone | 'all';
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
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
};

type SubmissionFocusPanelProps = {
  activeReviewCount: number;
  completionRate: number;
  nextDueSubmission: AdviserSubmissionRecord | null;
};

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
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <select
        className="min-h-12 w-full rounded-2xl border border-[rgba(226,232,240,0.92)] bg-white px-4 text-sm font-semibold text-[var(--text-dark)] shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
      >
        {children}
      </select>
    </label>
  );
}

const dayInMilliseconds = 1000 * 60 * 60 * 24;

const submissionStatusVisuals: Record<
  SubmissionStatus,
  {
    accentClassName: string;
    icon: string;
    iconClassName: string;
    actionIcon: string;
  }
> = {
  'pending-review': {
    accentClassName: 'from-amber-400 to-[#F6BE00]',
    icon: 'fa-clock',
    iconClassName: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    actionIcon: 'fa-pen-to-square'
  },
  'under-review': {
    accentClassName: 'from-blue-500 to-[#1E40AF]',
    icon: 'fa-magnifying-glass',
    iconClassName: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    actionIcon: 'fa-arrow-right'
  },
  approved: {
    accentClassName: 'from-emerald-500 to-emerald-400',
    icon: 'fa-circle-check',
    iconClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    actionIcon: 'fa-eye'
  },
  'needs-revision': {
    accentClassName: 'from-rose-500 to-red-400',
    icon: 'fa-rotate-left',
    iconClassName: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    actionIcon: 'fa-comments'
  }
};

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getDeadlineDelta(deadline: string) {
  return Math.round((startOfUtcDay(deadline) - startOfUtcDay(getReviewReferenceDate())) / dayInMilliseconds);
}

function getDeadlineVisual(deadline: string, status: SubmissionStatus) {
  if (status === 'approved') {
    return {
      label: 'Cleared',
      icon: 'fa-circle-check',
      className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
      barClassName: 'bg-emerald-500'
    };
  }

  const delta = getDeadlineDelta(deadline);

  if (delta < 0) {
    return {
      label: getDeadlineLabel(deadline),
      icon: 'fa-triangle-exclamation',
      className: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
      barClassName: 'bg-rose-500'
    };
  }

  if (delta <= 1) {
    return {
      label: getDeadlineLabel(deadline),
      icon: 'fa-bell',
      className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
      barClassName: 'bg-[#F6BE00]'
    };
  }

  return {
    label: getDeadlineLabel(deadline),
    icon: 'fa-calendar-day',
    className: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    barClassName: 'bg-[#1E40AF]'
  };
}

export function SummaryCards({ metrics }: { metrics: SubmissionSummaryMetric[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className="group relative flex min-h-[156px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,58,143,0.10)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#003A8F] via-[#1E40AF] to-[#F6BE00]" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">{metric.label}</p>
              <p className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[var(--primary)] transition-colors group-hover:text-[#002C6B]">
                {metric.value}
              </p>
            </div>
            <span
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm transition-transform duration-300 group-hover:scale-110 ${metric.iconClassName}`}
            >
              <i className={`fas ${metric.icon}`} />
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-[1.6] text-[var(--text-light)]">{metric.helperText}</p>
        </article>
      ))}
    </div>
  );
}

export function SubmissionFocusPanel({
  activeReviewCount,
  completionRate,
  nextDueSubmission
}: SubmissionFocusPanelProps) {
  const deadlineVisual = nextDueSubmission
    ? getDeadlineVisual(nextDueSubmission.deadline, nextDueSubmission.status)
    : null;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(0,58,143,0.98),rgba(30,64,175,0.94))] p-6 text-white">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(246,190,0,0.22),transparent_42%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-50 ring-1 ring-inset ring-white/15">
                <i className="fas fa-inbox text-[10px] text-[#F6BE00]" />
                Adviser Review Desk
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Submission Queue</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Prioritized view for active student document reviews, version checks, and adviser decisions.
              </p>
            </div>

            <div className="grid min-w-[240px] grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">Open Reviews</p>
                <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{activeReviewCount}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">Cleared</p>
                <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 bg-slate-50 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Next Deadline</p>
            {nextDueSubmission ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${deadlineVisual?.className}`}>
                    <i className={`fas ${deadlineVisual?.icon} text-[10px]`} />
                    {deadlineVisual?.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{nextDueSubmission.version}</span>
                </div>
                <h3 className="mt-4 overflow-hidden text-lg font-bold leading-6 text-slate-950 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{nextDueSubmission.submissionTitle}</h3>
                <p className="mt-2 text-sm font-semibold text-[#003A8F]">{nextDueSubmission.groupId}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No pending review deadlines.</p>
            )}
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#003A8F,#1E40AF,#F6BE00)]"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FiltersBar({
  typeFilter,
  statusFilter,
  milestoneFilter,
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
  onSearchChange,
  onClearFilters
}: FiltersBarProps) {
  const activeFilterLabels = [
    typeFilter !== 'all' ? `Type: ${typeFilter}` : null,
    statusFilter !== 'all' ? `Status: ${statusOptions.find((status) => status.value === statusFilter)?.label ?? statusFilter}` : null,
    milestoneFilter !== 'all' ? `Milestone: ${milestoneFilter}` : null,
    searchValue.trim() ? `Search: ${searchValue.trim()}` : null
  ].filter((label): label is string => Boolean(label));

  return (
    <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text-dark)]">Review Filters</h2>
          <p className="mt-1 text-sm text-[var(--text-light)]">
            {resultCount} of {totalCount} submissions shown
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[rgba(0,58,143,0.06)] px-4 text-sm font-bold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
            <i className="fas fa-lock text-xs" />
            Assigned Projects
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#003A8F]/20 hover:bg-slate-50 hover:text-[#003A8F]"
            >
              <i className="fas fa-rotate-left text-xs" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(150px,0.85fr)_minmax(160px,0.95fr)_minmax(220px,1.15fr)_minmax(280px,1.45fr)]">

        <WorkspaceSelect label="Type" value={typeFilter} onChange={onTypeChange}>
          <option value="all">All Types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect label="Status" value={statusFilter} onChange={onStatusChange}>
          {statusOptions.map((statusOption) => (
            <option key={statusOption.value} value={statusOption.value}>
              {statusOption.label}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect label="Milestone" value={milestoneFilter} onChange={onMilestoneChange}>
          <option value="all">All Milestones</option>
          {milestoneOptions.map((milestone) => (
            <option key={milestone} value={milestone}>
              {milestone}
            </option>
          ))}
        </WorkspaceSelect>

        <label className="relative block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Search</span>
          <span className="pointer-events-none absolute bottom-0 left-4 flex h-12 items-center text-[var(--text-light)]">
            <i className="fas fa-search text-sm" />
          </span>
          <input
            className="min-h-12 w-full rounded-2xl border border-[rgba(226,232,240,0.92)] bg-white pl-11 pr-4 text-sm text-[var(--text-dark)] shadow-sm outline-none transition placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
            placeholder="Search groups, projects, or documents"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>

      {activeFilterLabels.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilterLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function SubmissionList({
  submissions,
  totalSubmissions,
  hasActiveFilters,
  onClearFilters,
  onViewSubmission,
  onDownloadSubmission,
  onReviewSubmission
}: {
  submissions: AdviserSubmissionRecord[];
  totalSubmissions: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onViewSubmission?: (submission: AdviserSubmissionRecord) => void;
  onDownloadSubmission?: (submission: AdviserSubmissionRecord) => void;
  onReviewSubmission?: (submission: AdviserSubmissionRecord) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-white px-5 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Assigned Document Reviews</h2>
          <p className="text-sm text-[var(--text-light)]">
            Real student uploads from your assigned projects, sorted by pending decisions and nearest deadline.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[rgba(0,58,143,0.06)] px-3 py-1 text-xs font-bold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
          <i className="fas fa-layer-group text-[10px]" />
          {submissions.length}/{totalSubmissions} shown
        </span>
      </div>

      {submissions.length ? (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <SubmissionItem
              key={submission.id}
              submission={submission}
              onViewSubmission={onViewSubmission}
              onDownloadSubmission={onDownloadSubmission}
              onReviewSubmission={onReviewSubmission}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] bg-white px-6 py-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,58,143,0.06)] text-[var(--primary)]">
            <i className="fas fa-folder-open text-lg" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--text-dark)]">No matching document reviews</h3>
          <p className="mt-2 text-sm text-[var(--text-light)]">
            Adjust the filters or search terms to bring the assigned documents back into view.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--primary-dark)]"
            >
              <i className="fas fa-rotate-left text-xs" />
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
  onViewSubmission,
  onDownloadSubmission,
  onReviewSubmission
}: {
  submission: AdviserSubmissionRecord;
  onViewSubmission?: (submission: AdviserSubmissionRecord) => void;
  onDownloadSubmission?: (submission: AdviserSubmissionRecord) => void;
  onReviewSubmission?: (submission: AdviserSubmissionRecord) => void;
}) {
  const statusMeta = getSubmissionStatusMeta(submission.status);
  const statusVisual = submissionStatusVisuals[submission.status];
  const deadlineVisual = getDeadlineVisual(submission.deadline, submission.status);
  const deadlineDelta = getDeadlineDelta(submission.deadline);
  const isUrgent = submission.status !== 'approved' && deadlineDelta <= 1;

  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,58,143,0.10)]">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${statusVisual.accentClassName}`} />

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)]">
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base ${statusVisual.iconClassName}`}>
                <i className={`fas ${statusVisual.icon}`} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-[rgba(0,58,143,0.08)] px-3 py-1 text-xs font-bold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
                    {submission.groupId}
                  </span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusMeta.badgeClassName}`}>
                    {statusMeta.label}
                  </span>
                  {isUrgent ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                      <i className="fas fa-bolt text-[10px]" />
                      Priority
                    </span>
                  ) : null}
                </div>

                <h3
                  className="mt-3 overflow-hidden text-lg font-extrabold leading-7 tracking-[-0.03em] text-slate-950 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                  title={submission.submissionTitle}
                >
                  {submission.submissionTitle}
                </h3>
                <p className="mt-1 truncate text-sm font-medium text-slate-500" title={submission.projectTitle}>
                  {submission.projectTitle}
                </p>
                {submission.submittedBy ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    <i className="fas fa-user-graduate mr-1.5 text-[#003A8F]" aria-hidden="true" />
                    Submitted by {submission.submittedBy}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {submission.type}
              </span>
              <span className="inline-flex rounded-full bg-[rgba(246,190,0,0.16)] px-3 py-1 text-xs font-bold text-[#003A8F] ring-1 ring-inset ring-[rgba(246,190,0,0.28)]">
                {submission.milestone}
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#003A8F] ring-1 ring-inset ring-[rgba(0,58,143,0.14)]">
                {submission.version}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Review Focus</p>
              <p
                className="mt-2 overflow-hidden text-sm leading-6 text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
                title={submission.reviewFocus}
              >
                {submission.reviewFocus}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Next Step</p>
              <p
                className="mt-2 overflow-hidden text-sm leading-6 text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
                title={submission.nextAction}
              >
                {submission.nextAction}
              </p>
            </div>
          </div>

          {submission.groupMembers?.length ? (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Group Members</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {submission.groupMembers.map((member) => (
                  <span
                    key={`${submission.id}-${member.name}`}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                      member.isLeader
                        ? 'bg-[rgba(246,190,0,0.18)] text-[#003A8F] ring-[rgba(246,190,0,0.42)]'
                        : 'bg-slate-100 text-slate-700 ring-slate-200'
                    }`}
                  >
                    <i className={`fas ${member.isLeader ? 'fa-crown' : 'fa-user'} text-[10px]`} aria-hidden="true" />
                    {member.name}
                    {member.isLeader ? <span className="text-[10px] uppercase tracking-[0.08em] text-amber-700">Leader</span> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {submission.latestReviewComment ? (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">Latest Adviser Notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{submission.latestReviewComment.body}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {submission.latestReviewComment.authorName || 'Adviser'} · {formatSubmissionDate(String(submission.latestReviewComment.createdAt))}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="flex min-h-full flex-col justify-between gap-5 border-t border-slate-100 bg-slate-50 p-5 xl:border-l xl:border-t-0">
          <div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${deadlineVisual.className}`}>
              <i className={`fas ${deadlineVisual.icon} text-[10px]`} />
              {deadlineVisual.label}
            </span>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Submitted</dt>
                <dd className="mt-1 font-bold text-slate-900">{formatSubmissionDate(submission.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Deadline</dt>
                <dd className={`mt-1 font-bold ${getDeadlineToneClass(submission.deadline)}`}>
                  {formatSubmissionDate(submission.deadline)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${deadlineVisual.barClassName}`} style={{ width: submission.status === 'approved' ? '100%' : '68%' }} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-3 text-sm font-bold text-[var(--primary)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[rgba(0,58,143,0.04)]"
              type="button"
              onClick={() => onDownloadSubmission?.(submission)}
            >
              <i className="fas fa-download text-xs" />
              Download
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--primary-dark)]"
              type="button"
              onClick={() => onReviewSubmission?.(submission)}
            >
              <i className={`fas ${statusVisual.actionIcon} text-xs`} />
              {submission.status === 'pending-review' ? 'Start Review' : statusMeta.actionLabel}
            </button>
          </div>
        </aside>
      </div>
    </article>
  );
}
