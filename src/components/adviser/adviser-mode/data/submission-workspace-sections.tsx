import type { ReactNode } from 'react';
import type { AdviserSubmissionRecord, SubmissionMilestone, SubmissionStatus, SubmissionType } from '@/components/adviser/adviser-mode/data/submission-workspace-data';
import {
  IT_REVIEW_CHECKLIST,
  formatSubmissionDate,
  getDeadlineLabel,
  getDeadlineToneClass,
  getPriorityQueue,
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
  onTypeChange: (value: SubmissionType | 'all') => void;
  onStatusChange: (value: SubmissionStatus | 'all') => void;
  onMilestoneChange: (value: SubmissionMilestone | 'all') => void;
  onSearchChange: (value: string) => void;
};

function WorkspaceSelect<TValue extends string>({
  value,
  onChange,
  children
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  children: ReactNode;
}) {
  return (
    <select
      className="min-h-12 rounded-2xl border border-[rgba(226,232,240,0.92)] bg-white px-4 text-sm font-medium text-[var(--text-dark)] shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
      value={value}
      onChange={(event) => onChange(event.target.value as TValue)}
    >
      {children}
    </select>
  );
}

export function SummaryCards({ metrics }: { metrics: SubmissionSummaryMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className="flex min-h-[152px] flex-col justify-between rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-light)]">{metric.label}</p>
              <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--primary)]">
                {metric.value}
              </p>
            </div>
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base ${metric.iconClassName}`}
            >
              <i className={`fas ${metric.icon}`} />
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--text-light)]">{metric.helperText}</p>
        </article>
      ))}
    </div>
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
  onTypeChange,
  onStatusChange,
  onMilestoneChange,
  onSearchChange
}: FiltersBarProps) {
  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="grid gap-3 xl:grid-cols-[minmax(170px,1fr)_minmax(150px,1fr)_minmax(160px,1fr)_minmax(220px,1.2fr)_minmax(280px,1.6fr)]">
        <div className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[rgba(0,58,143,0.06)] px-4 text-sm font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
          <i className="fas fa-lock text-xs" />
          IT Department
        </div>

        <WorkspaceSelect value={typeFilter} onChange={onTypeChange}>
          <option value="all">All Types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect value={statusFilter} onChange={onStatusChange}>
          {statusOptions.map((statusOption) => (
            <option key={statusOption.value} value={statusOption.value}>
              {statusOption.label}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect value={milestoneFilter} onChange={onMilestoneChange}>
          <option value="all">All Milestones</option>
          {milestoneOptions.map((milestone) => (
            <option key={milestone} value={milestone}>
              {milestone}
            </option>
          ))}
        </WorkspaceSelect>

        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--text-light)]">
            <i className="fas fa-search text-sm" />
          </span>
          <input
            className="min-h-12 w-full rounded-2xl border border-[rgba(226,232,240,0.92)] bg-white pl-11 pr-4 text-sm text-[var(--text-dark)] shadow-sm outline-none transition placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
            placeholder="Search IT groups, projects, or documents"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}

export function SubmissionList({ submissions }: { submissions: AdviserSubmissionRecord[] }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Assigned IT Submissions</h2>
          <p className="text-sm text-[var(--text-light)]">
            Review proposals, chapters, and final documents from your current IT groups.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--text-light)]">
          {submissions.length} submission{submissions.length === 1 ? '' : 's'}
        </p>
      </div>

      {submissions.length ? (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <SubmissionItem key={submission.id} submission={submission} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] bg-white px-6 py-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,58,143,0.06)] text-[var(--primary)]">
            <i className="fas fa-folder-open text-lg" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--text-dark)]">No matching IT submissions</h3>
          <p className="mt-2 text-sm text-[var(--text-light)]">
            Adjust the filters or search terms to bring the assigned documents back into view.
          </p>
        </div>
      )}
    </section>
  );
}

export function PriorityQueue({ submissions }: { submissions: AdviserSubmissionRecord[] }) {
  const priorityItems = getPriorityQueue(submissions);

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div>
        <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text-dark)]">Priority Queue</h2>
        <p className="mt-1 text-sm text-[var(--text-light)]">Your next urgent IT reviews.</p>
      </div>

      <div className="mt-5 space-y-3">
        {priorityItems.map((submission) => {
          const statusMeta = getSubmissionStatusMeta(submission.status);

          return (
            <article
              key={submission.id}
              className="rounded-[1.25rem] bg-[rgba(248,250,252,0.95)] p-4 transition hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--primary)]">{submission.groupId}</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClassName}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <p
                className="mt-3 overflow-hidden text-sm font-semibold leading-6 text-[var(--text-dark)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                title={submission.submissionTitle}
              >
                {submission.submissionTitle}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-[var(--text-light)]">{submission.milestone}</span>
                <span className={`font-semibold ${getDeadlineToneClass(submission.deadline)}`}>
                  {getDeadlineLabel(submission.deadline)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ReviewChecklist() {
  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div>
        <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text-dark)]">Review Checklist</h2>
        <p className="mt-1 text-sm text-[var(--text-light)]">
          Keep each IT review consistent before approving a document.
        </p>
      </div>

      <ul className="mt-5 space-y-3">
        {IT_REVIEW_CHECKLIST.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(0,58,143,0.08)] text-[var(--primary)]">
              <i className="fas fa-check text-[10px]" />
            </span>
            <span className="text-sm leading-6 text-[var(--text-dark)]">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SubmissionItem({ submission }: { submission: AdviserSubmissionRecord }) {
  const statusMeta = getSubmissionStatusMeta(submission.status);

  return (
    <article className="group rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[rgba(0,58,143,0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
              IT
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
              {statusMeta.label}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {submission.type}
            </span>
            <span className="inline-flex rounded-full bg-[rgba(246,190,0,0.14)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
              {submission.milestone}
            </span>
          </div>

          <div className="min-w-0">
            <h3
              className="truncate text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]"
              title={submission.submissionTitle}
            >
              {submission.submissionTitle}
            </h3>
            <p className="mt-1 truncate text-sm text-[var(--text-light)]" title={submission.projectTitle}>
              {submission.projectTitle} - {submission.groupId}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[1.25rem] bg-[rgba(0,58,143,0.04)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                Review Focus
              </p>
              <p
                className="mt-2 overflow-hidden text-sm leading-6 text-[var(--text-dark)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                title={submission.reviewFocus}
              >
                {submission.reviewFocus}
              </p>
            </div>

            <div className="rounded-[1.25rem] bg-[rgba(246,190,0,0.12)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                Next Step
              </p>
              <p className="mt-2 truncate text-sm leading-6 text-[var(--text-dark)]" title={submission.nextAction}>
                {submission.nextAction}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full rounded-[1.5rem] bg-[rgba(248,250,252,0.98)] p-4 xl:max-w-[300px]">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)] shadow-sm ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
              {submission.version}
            </span>
            <span className={`text-xs font-semibold ${getDeadlineToneClass(submission.deadline)}`}>
              {getDeadlineLabel(submission.deadline)}
            </span>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-light)]">Submitted</dt>
              <dd className="font-semibold text-[var(--text-dark)]">{formatSubmissionDate(submission.submittedAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-light)]">Deadline</dt>
              <dd className="font-semibold text-[var(--text-dark)]">{formatSubmissionDate(submission.deadline)}</dd>
            </div>
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-3 text-sm font-semibold text-[var(--primary)] transition hover:-translate-y-0.5 hover:bg-[rgba(0,58,143,0.04)]"
              data-file-url={submission.fileUrl}
              type="button"
            >
              Download
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--primary-dark)]"
              type="button"
            >
              {statusMeta.actionLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
