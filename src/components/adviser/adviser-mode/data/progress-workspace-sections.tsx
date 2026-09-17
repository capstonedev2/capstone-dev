import type { ReactNode } from 'react';
import Link from 'next/link';
import type {
  AdviserActionStatus,
  AdviserProgressRecord,
  ProgressMilestone,
  ProgressSortOption,
  ProgressStatus
} from '@/components/adviser/adviser-mode/data/progress-workspace-data';
import {
  IT_PROGRESS_MILESTONES,
  formatProgressDate,
  getAttentionReason,
  getAtRiskRecords,
  getDeadlineLabel,
  getDeadlineToneClass,
  getLastUpdateLabel,
  getLastUpdateToneClass,
  getProgressStatusMeta
} from '@/components/adviser/adviser-mode/data/progress-workspace-data';

export type ProgressSummaryMetric = {
  id: string;
  label: string;
  value: number;
  icon: string;
  iconClassName: string;
};

type ProgressFiltersProps = {
  statusFilter: ProgressStatus | 'all';
  milestoneFilter: ProgressMilestone | 'all';
  searchValue: string;
  sortBy: ProgressSortOption;
  milestoneOptions: ProgressMilestone[];
  statusOptions: ReadonlyArray<{ value: ProgressStatus | 'all'; label: string }>;
  sortOptions: ReadonlyArray<{ value: ProgressSortOption; label: string }>;
  onStatusChange: (value: ProgressStatus | 'all') => void;
  onMilestoneChange: (value: ProgressMilestone | 'all') => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ProgressSortOption) => void;
};

type ProgressOverviewProps = {
  averageProgress: number;
  activeMilestone: ProgressMilestone;
  groupsBehindSchedule: number;
  nextMajorDeadline: AdviserProgressRecord | null;
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

function getAdviserActionMeta(action: AdviserActionStatus) {
  if (action === 'Ready for defense') {
    return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
  }

  if (action === 'Ready for approval') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  if (action === 'Needs review') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
  }

  return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200';
}

export function ProgressSummaryCards({ metrics }: { metrics: ProgressSummaryMetric[] }) {
  return (
    <div className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:flex-row sm:divide-x sm:divide-y-0">
      {metrics.map((metric) => (
        <div key={metric.id} className="flex flex-1 items-center gap-3 px-5 py-4">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm shadow-sm ${metric.iconClassName}`}
          >
            <i className={`fas ${metric.icon}`} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">{metric.label}</p>
            <p className="mt-0.5 text-xl font-extrabold leading-tight tracking-[-0.02em] text-[var(--primary)]">
              {metric.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressOverview({
  averageProgress,
  activeMilestone,
  groupsBehindSchedule,
  nextMajorDeadline
}: ProgressOverviewProps) {
  const deadlineCopy = nextMajorDeadline?.deadline
    ? `${nextMajorDeadline.groupId} • ${formatProgressDate(nextMajorDeadline.deadline)}`
    : 'No open deadlines';

  return (
    <section className="flex h-full flex-col rounded-[1.75rem] bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Progress Overview</h2>
          <p className="text-sm text-[var(--text-light)]">Key numbers across all assigned IT groups, at a glance.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(0,58,143,0.06)] px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
          <i className="fas fa-building text-[10px]" />
          IT adviser scope
        </span>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-between gap-3">
        <OverviewMetric icon="fa-chart-line" iconClassName="bg-blue-50 text-blue-600" label="Average Progress" value={`${averageProgress}%`} />
        <OverviewMetric icon="fa-flag" iconClassName="bg-indigo-50 text-indigo-600" label="Current Active Milestone" value={activeMilestone} />
        <OverviewMetric icon="fa-user-clock" iconClassName="bg-amber-50 text-amber-600" label="Groups Behind Schedule" value={groupsBehindSchedule} />
        <OverviewMetric icon="fa-calendar-check" iconClassName="bg-rose-50 text-rose-600" label="Next Major Deadline" value={deadlineCopy} />
      </div>
    </section>
  );
}

export function MilestoneTracker({ records }: { records: AdviserProgressRecord[] }) {
  const activeMilestone = IT_PROGRESS_MILESTONES.reduce(
    (selectedStage, currentStage) => {
      const selectedCount = records.filter((record) => record.currentMilestone === selectedStage).length;
      const currentCount = records.filter((record) => record.currentMilestone === currentStage).length;
      return currentCount > selectedCount ? currentStage : selectedStage;
    },
    IT_PROGRESS_MILESTONES[0]
  );

  return (
    <section className="flex h-full flex-col rounded-[1.75rem] bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Milestone Tracking</h2>
          <p className="text-sm text-[var(--text-light)]">Where each assigned group sits in the shared 6-stage pipeline.</p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-[var(--text-light)]">
          Active stage: <span className="text-[var(--primary)]">{activeMilestone}</span>
        </p>
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        {IT_PROGRESS_MILESTONES.map((stage, index) => {
          const groupCount = records.filter((record) => record.currentMilestone === stage).length;
          const isActive = stage === activeMilestone;
          const isReached = groupCount > 0;
          const isLast = index === IT_PROGRESS_MILESTONES.length - 1;

          return (
            <div key={stage} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : isReached
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {index + 1}
                </span>
                {!isLast && <span className="my-1 w-[2px] flex-1 rounded-full bg-slate-200" />}
              </div>

              <article
                className={`mb-3 flex flex-1 items-center justify-between gap-3 rounded-[1.25rem] p-4 transition ${
                  isActive
                    ? 'bg-[rgba(0,58,143,0.08)] ring-1 ring-inset ring-[rgba(0,58,143,0.14)]'
                    : isReached
                      ? 'bg-slate-50'
                      : 'bg-slate-50/70'
                }`}
              >
                <p className="text-sm font-semibold leading-6 text-[var(--text-dark)]">{stage}</p>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-light)]">
                  {groupCount} group{groupCount === 1 ? '' : 's'}
                </span>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ProgressFilters({
  statusFilter,
  milestoneFilter,
  searchValue,
  sortBy,
  milestoneOptions,
  statusOptions,
  sortOptions,
  onStatusChange,
  onMilestoneChange,
  onSearchChange,
  onSortChange
}: ProgressFiltersProps) {
  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
        {statusOptions.map((option) => {
          const isActive = statusFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={`min-h-9 rounded-full px-4 text-xs font-bold uppercase tracking-wide transition ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-slate-100 text-[var(--text-light)] hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_minmax(320px,1.5fr)]">
        <WorkspaceSelect value={milestoneFilter} onChange={onMilestoneChange}>
          <option value="all">All Milestones</option>
          {milestoneOptions.map((milestone) => (
            <option key={milestone} value={milestone}>
              {milestone}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect value={sortBy} onChange={onSortChange}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </WorkspaceSelect>

        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--text-light)]">
            <i className="fas fa-search text-sm" />
          </span>
          <input
            className="min-h-12 w-full rounded-2xl border border-[rgba(226,232,240,0.92)] bg-white pl-11 pr-4 text-sm text-[var(--text-dark)] shadow-sm outline-none transition placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
            placeholder="Search groups or project titles"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}

export function GroupProgressList({ records }: { records: AdviserProgressRecord[] }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Active Group Progress</h2>
          <p className="text-sm text-[var(--text-light)]">
            Current milestone standing, adviser action status, and deadline readiness for assigned IT groups.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--text-light)]">
          {records.length} progress record{records.length === 1 ? '' : 's'}
        </p>
      </div>

      {records.length ? (
        <div className="space-y-4">
          {records.map((record) => (
            <GroupProgressItem key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] bg-white px-6 py-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,58,143,0.06)] text-[var(--primary)]">
            <i className="fas fa-chart-line text-lg" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--text-dark)]">No matching IT progress records</h3>
          <p className="mt-2 text-sm text-[var(--text-light)]">
            Adjust the filters or search terms to bring the assigned groups back into view.
          </p>
        </div>
      )}
    </section>
  );
}

export function AtRiskGroupsPanel({ records }: { records: AdviserProgressRecord[] }) {
  const attentionRecords = getAtRiskRecords(records);

  return (
    <section className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Attention Needed</h2>
          <p className="text-sm text-[var(--text-light)]">
            Groups with overdue milestones, low progress, or inactive updates that may need adviser follow-up.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(246,190,0,0.12)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          {attentionRecords.length} flagged
        </span>
      </div>

      {attentionRecords.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {attentionRecords.map((record) => {
            const statusMeta = getProgressStatusMeta(record.status);

            return (
              <article
                key={record.id}
                className="rounded-[1.5rem] bg-[rgba(248,250,252,0.98)] p-5 transition hover:bg-white hover:shadow-[0_18px_32px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">{record.groupId}</p>
                    <h3 className="mt-1 text-base font-semibold leading-6 text-[var(--text-dark)]">
                      {record.projectTitle}
                    </h3>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClassName}`}>
                    {statusMeta.label}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--text-dark)]">
                  {getAttentionReason(record)}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <p className={`${getLastUpdateToneClass(record.lastUpdate)} font-medium`}>
                    Last activity: {formatProgressDate(record.lastUpdate)}
                  </p>
                  <p className={`${getDeadlineToneClass(record.deadline)} font-medium`}>
                    Deadline: {record.deadline ? formatProgressDate(record.deadline) : 'Not set'}
                  </p>
                </div>

                <Link
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-semibold text-[var(--primary)] transition hover:-translate-y-0.5 hover:bg-[rgba(0,58,143,0.04)]"
                  href="/adviser/adviser-mode/groups"
                >
                  View Group
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] bg-slate-50 px-6 py-8 text-center text-sm text-[var(--text-light)]">
          No at-risk IT groups are flagged right now.
        </div>
      )}
    </section>
  );
}

function OverviewMetric({
  label,
  value,
  icon,
  iconClassName
}: {
  label: string;
  value: ReactNode;
  icon: string;
  iconClassName: string;
}) {
  return (
    <article className="flex items-start gap-3 rounded-[1.35rem] bg-slate-50/90 p-4">
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm ${iconClassName}`}>
        <i className={`fas ${icon}`} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">{label}</p>
        <p className="mt-1.5 truncate text-lg font-bold leading-7 text-[var(--text-dark)]">{value}</p>
      </div>
    </article>
  );
}

export function GroupProgressItem({ record }: { record: AdviserProgressRecord }) {
  const statusMeta = getProgressStatusMeta(record.status);
  const currentMilestoneIndex = IT_PROGRESS_MILESTONES.indexOf(record.currentMilestone);

  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] ring-1 ring-inset ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)] sm:p-6">
      <span
        className={`absolute inset-y-0 left-0 w-1.5 ${
          record.status === 'delayed'
            ? 'bg-rose-500'
            : record.status === 'at-risk'
              ? 'bg-amber-500'
              : record.status === 'completed'
                ? 'bg-[var(--primary)]'
                : 'bg-emerald-500'
        }`}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-5 pl-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[rgba(0,58,143,0.08)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
              {record.groupId}
            </span>
            <span className="text-xs font-semibold text-[var(--text-light)]">{record.department}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClassName}`}>
              <i className={`fas ${statusMeta.icon} text-[10px]`} aria-hidden="true" />
              {statusMeta.label}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold leading-tight tracking-[-0.02em] text-[var(--text-dark)]">
            {record.projectTitle}
          </h3>

          {/* Milestone stepper — mirrors the Milestone Tracking bar above so a single glance
              tells the adviser exactly where this group sits in the shared 6-stage pipeline. */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
            {IT_PROGRESS_MILESTONES.map((stage, index) => {
              const isDone = index < currentMilestoneIndex || record.status === 'completed';
              const isCurrent = index === currentMilestoneIndex && record.status !== 'completed';

              return (
                <div key={stage} className="flex items-center gap-1.5" title={stage}>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${
                      isCurrent
                        ? `${statusMeta.progressClassName} ring-4 ring-offset-1 ${
                            record.status === 'delayed'
                              ? 'ring-rose-100'
                              : record.status === 'at-risk'
                                ? 'ring-amber-100'
                                : 'ring-emerald-100'
                          }`
                        : isDone
                          ? 'bg-[var(--primary)]'
                          : 'bg-slate-200'
                    }`}
                  />
                  {index < IT_PROGRESS_MILESTONES.length - 1 && (
                    <span className={`h-px w-4 shrink-0 ${isDone ? 'bg-[var(--primary)]' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
            <span className="ml-1 shrink-0 text-xs font-semibold text-[var(--text-dark)]">{record.currentMilestone}</span>
          </div>

          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-dark)]">
              <span>Progress</span>
              <span>{record.progress}%</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-200">
              <div
                className={`h-2 rounded-full transition-all ${statusMeta.progressClassName}`}
                style={{ width: `${Math.min(100, Math.max(0, record.progress))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:w-[260px]">
          <div className="grid grid-cols-2 gap-2">
            <MetaStat
              icon="fa-calendar-day"
              label="Deadline"
              value={getDeadlineLabel(record.deadline)}
              toneClass={getDeadlineToneClass(record.deadline)}
            />
            <MetaStat
              icon="fa-clock-rotate-left"
              label="Activity"
              value={getLastUpdateLabel(record.lastUpdate)}
              toneClass={getLastUpdateToneClass(record.lastUpdate)}
            />
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getAdviserActionMeta(record.adviserAction)}`}
          >
            <i className="fas fa-user-check text-[10px]" aria-hidden="true" />
            {record.adviserAction}
          </span>

          <Link
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[rgba(0,58,143,0.14)] bg-[rgba(0,58,143,0.02)] px-3 text-xs font-semibold text-[var(--primary)] transition hover:-translate-y-0.5 hover:bg-[rgba(0,58,143,0.06)]"
            href="/adviser/adviser-mode/groups"
          >
            <i className="fas fa-folder-open text-[11px]" aria-hidden="true" />
            View Group
          </Link>
        </div>
      </div>
    </article>
  );
}

function MetaStat({
  icon,
  label,
  value,
  toneClass
}: {
  icon: string;
  label: string;
  value: string;
  toneClass: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50/90 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-light)]">
        <i className={`fas ${icon} text-[9px]`} aria-hidden="true" />
        {label}
      </p>
      <p className={`mt-1 text-xs font-bold leading-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

