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
  PROGRESS_REFERENCE_DATE,
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
  helperText: string;
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

export function ProgressOverview({
  averageProgress,
  activeMilestone,
  groupsBehindSchedule,
  nextMajorDeadline
}: ProgressOverviewProps) {
  const deadlineCopy = nextMajorDeadline
    ? `${nextMajorDeadline.groupId} • ${formatProgressDate(nextMajorDeadline.deadline)}`
    : 'No open deadlines';

  return (
    <section className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Progress Overview</h2>
          <p className="text-sm text-[var(--text-light)]">
            Quick view of milestone flow, pacing, and the next adviser checkpoint.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(0,58,143,0.06)] px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
          <i className="fas fa-building text-[10px]" />
          IT adviser scope
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <OverviewMetric
          label="Average Progress Percentage"
          value={`${averageProgress}%`}
          note="Average completion across assigned IT groups."
        />
        <OverviewMetric
          label="Current Active Milestone"
          value={activeMilestone}
          note="Most common active stage in the current review cycle."
        />
        <OverviewMetric
          label="Groups Behind Schedule"
          value={groupsBehindSchedule}
          note="Groups flagged as at risk or delayed."
        />
        <OverviewMetric
          label="Next Major Deadline"
          value={deadlineCopy}
          note={nextMajorDeadline ? getDeadlineLabel(nextMajorDeadline.deadline) : 'No urgent target date.'}
        />
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
    <section className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Milestone Tracking</h2>
          <p className="text-sm text-[var(--text-light)]">
            Backend-ready stage flow for thesis and capstone progress monitoring.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--text-light)]">
          Active stage: <span className="text-[var(--primary)]">{activeMilestone}</span>
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="flex min-w-max items-center gap-3 pr-2">
          {IT_PROGRESS_MILESTONES.map((stage, index) => {
            const groupCount = records.filter((record) => record.currentMilestone === stage).length;
            const isActive = stage === activeMilestone;
            const isReached = groupCount > 0;

            return (
              <div key={stage} className="flex items-center gap-3">
                <article
                  className={`min-w-[158px] rounded-[1.35rem] p-4 transition ${
                    isActive
                      ? 'bg-[rgba(0,58,143,0.08)] ring-1 ring-inset ring-[rgba(0,58,143,0.14)]'
                      : isReached
                        ? 'bg-slate-50'
                        : 'bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-[var(--primary)] text-white'
                          : isReached
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-light)]">
                      {groupCount} groups
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[var(--text-dark)]">{stage}</p>
                </article>

                {index < IT_PROGRESS_MILESTONES.length - 1 ? (
                  <span className="h-[2px] w-8 rounded-full bg-slate-200" />
                ) : null}
              </div>
            );
          })}
        </div>
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
      <div className="grid gap-3 xl:grid-cols-[minmax(170px,1fr)_minmax(160px,1fr)_minmax(180px,1fr)_minmax(220px,1fr)_minmax(320px,1.5fr)]">
        <div className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[rgba(0,58,143,0.06)] px-4 text-sm font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
          <i className="fas fa-lock text-xs" />
          IT Department
        </div>

        <WorkspaceSelect value={statusFilter} onChange={onStatusChange}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
                  {getAttentionReason(record, PROGRESS_REFERENCE_DATE)}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <p className={`${getLastUpdateToneClass(record.lastUpdate)} font-medium`}>
                    Last activity: {formatProgressDate(record.lastUpdate)}
                  </p>
                  <p className={`${getDeadlineToneClass(record.deadline)} font-medium`}>
                    Deadline: {formatProgressDate(record.deadline)}
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
  note
}: {
  label: string;
  value: ReactNode;
  note: string;
}) {
  return (
    <article className="rounded-[1.35rem] bg-slate-50/90 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">{label}</p>
      <p className="mt-3 text-lg font-bold leading-7 text-[var(--text-dark)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-light)]">{note}</p>
    </article>
  );
}

export function GroupProgressItem({ record }: { record: AdviserProgressRecord }) {
  const statusMeta = getProgressStatusMeta(record.status);

  return (
    <article className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(280px,0.9fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[rgba(0,58,143,0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
              IT
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
              {statusMeta.label}
            </span>
          </div>

          <h3 className="mt-4 text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">{record.groupId}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-light)]">{record.projectTitle}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Deadline" value={formatProgressDate(record.deadline)} toneClass={getDeadlineToneClass(record.deadline)} />
            <InfoBlock label="Last Update" value={formatProgressDate(record.lastUpdate)} toneClass={getLastUpdateToneClass(record.lastUpdate)} />
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-[rgba(248,250,252,0.98)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                Current Milestone
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-dark)]">{record.currentMilestone}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-sm">
              <i className={`fas ${statusMeta.icon}`} />
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--text-dark)]">
              <span>Progress Percentage</span>
              <span>{record.progress}%</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-200">
              <div
                className={`h-3 rounded-full transition ${statusMeta.progressClassName}`}
                style={{ width: `${Math.min(100, Math.max(0, record.progress))}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAdviserActionMeta(record.adviserAction)}`}
              >
                {record.adviserAction}
              </span>
              <span className={`text-xs font-semibold ${getDeadlineToneClass(record.deadline)}`}>
                {getDeadlineLabel(record.deadline)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-inset ring-slate-200/70">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                Adviser Action
              </dt>
              <dd className="mt-2 font-semibold text-[var(--text-dark)]">{record.adviserAction}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                Deadline Status
              </dt>
              <dd className={`mt-2 font-semibold ${getDeadlineToneClass(record.deadline)}`}>
                {getDeadlineLabel(record.deadline)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                Activity Status
              </dt>
              <dd className={`mt-2 font-semibold ${getLastUpdateToneClass(record.lastUpdate)}`}>
                {getLastUpdateLabel(record.lastUpdate)}
              </dd>
            </div>
          </dl>

          <Link
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[rgba(0,58,143,0.14)] bg-[rgba(0,58,143,0.02)] px-4 text-sm font-semibold text-[var(--primary)] transition hover:-translate-y-0.5 hover:bg-[rgba(0,58,143,0.06)]"
            href="/adviser/adviser-mode/groups"
          >
            View Group
          </Link>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({
  label,
  value,
  toneClass
}: {
  label: string;
  value: string;
  toneClass: string;
}) {
  return (
    <div className="rounded-[1.25rem] bg-slate-50/90 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
