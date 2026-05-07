import Link from 'next/link';
import type { ReactNode } from 'react';
import type {
  AdviserReportsModule,
  CompletedProjectRecord,
  ReportDateRange,
  ReportExportFormat,
  ReportSectionKey,
  ReportStatusFilter,
  ReportSummaryMetric,
  ReportType
} from '@/components/adviser/shared/data/report-workspace-data';
import { formatReportDate } from '@/components/adviser/shared/data/report-workspace-data';

type ReportFiltersProps = {
  dateRange: ReportDateRange;
  reportType: ReportType;
  status: ReportStatusFilter;
  dateOptions: Array<{ value: ReportDateRange; label: string }>;
  reportTypeOptions: Array<{ value: ReportType; label: string }>;
  statusOptions: Array<{ value: ReportStatusFilter; label: string }>;
  hasActiveFilters: boolean;
  onDateRangeChange: (value: ReportDateRange) => void;
  onReportTypeChange: (value: ReportType) => void;
  onStatusChange: (value: ReportStatusFilter) => void;
  onClearFilters: () => void;
};

type ExportButtonsProps = {
  section: ReportSectionKey;
  formats: ReportExportFormat[];
  onExport: (section: ReportSectionKey, format: ReportExportFormat) => void;
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

function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="relative flex flex-col gap-4 border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(0,58,143,0.035),rgba(248,250,252,0.96))] px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#003A8F] via-[#1E40AF] to-[#F6BE00]" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--text-light)]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  helperText,
  icon,
  iconClassName
}: {
  label: string;
  value: string | number;
  helperText: string;
  icon: string;
  iconClassName: string;
}) {
  return (
    <article className="group relative flex min-h-[156px] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,58,143,0.10)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#003A8F] via-[#1E40AF] to-[#F6BE00]" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">{label}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[var(--primary)] transition-colors group-hover:text-[#002C6B]">{value}</p>
        </div>
        <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconClassName}`}>
          <i className={`fas ${icon}`} />
        </span>
      </div>
      <p className="mt-4 text-[13px] leading-[1.6] text-[var(--text-light)]">{helperText}</p>
    </article>
  );
}

function EmptySection({
  icon,
  title,
  description
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 px-6 py-10 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,58,143,0.06)] text-[var(--primary)]">
        <i className={`fas ${icon} text-lg`} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--text-dark)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-light)]">{description}</p>
    </div>
  );
}

export function ExportButtons({ section, formats, onExport }: ExportButtonsProps) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {formats.map((format) => (
        <button
          key={`${section}-${format}`}
          type="button"
          onClick={() => onExport(section, format)}
          className="inline-flex min-h-[38px] items-center gap-2 rounded-[0.9rem] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#003A8F]/20 hover:bg-slate-50 hover:text-[#003A8F]"
        >
          <i
            aria-hidden="true"
            className={`fas ${
              format === 'pdf' ? 'fa-file-pdf' : format === 'csv' ? 'fa-file-csv' : 'fa-file-excel'
            } text-xs`}
          />
          {format.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function ReportOverviewPanel({
  reportModule,
  dateRangeLabel,
  reportTypeLabel,
  statusLabel,
  visibleSectionCount
}: {
  reportModule: AdviserReportsModule;
  dateRangeLabel: string;
  reportTypeLabel: string;
  statusLabel: string;
  visibleSectionCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(0,58,143,0.98),rgba(30,64,175,0.94))] p-6 text-white">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(246,190,0,0.22),transparent_42%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-50 ring-1 ring-inset ring-white/15">
                <i className="fas fa-chart-pie text-[10px] text-[#F6BE00]" />
                Adviser Reporting Desk
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Activity Reports</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Consolidated IT supervision, progress, evaluation, and completed-project records for adviser reporting.
              </p>
            </div>

            <div className="grid min-w-[250px] grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">Groups</p>
                <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{reportModule.totalGroups}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">Progress</p>
                <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{reportModule.averageProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 bg-slate-50 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Current Scope</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[dateRangeLabel, reportTypeLabel, statusLabel].map((label) => (
                <span
                  key={label}
                  className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#003A8F] shadow-sm ring-1 ring-inset ring-[rgba(0,58,143,0.12)]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Completed</p>
              <p className="mt-2 text-xl font-extrabold text-emerald-600">{reportModule.completedGroups}</p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Pending</p>
              <p className="mt-2 text-xl font-extrabold text-amber-600">{reportModule.pendingEvaluations}</p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Sections</p>
              <p className="mt-2 text-xl font-extrabold text-[#003A8F]">{visibleSectionCount}</p>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#003A8F,#1E40AF,#F6BE00)]"
              style={{ width: `${Math.min(100, reportModule.averageProgress)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReportSummaryCards({ metrics }: { metrics: ReportSummaryMetric[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricTile key={metric.id} {...metric} />
      ))}
    </div>
  );
}

export function ReportFilters({
  dateRange,
  reportType,
  status,
  dateOptions,
  reportTypeOptions,
  statusOptions,
  hasActiveFilters,
  onDateRangeChange,
  onReportTypeChange,
  onStatusChange,
  onClearFilters
}: ReportFiltersProps) {
  const activeFilterLabels = [
    dateOptions.find((option) => option.value === dateRange)?.label ?? dateRange,
    reportType !== 'all' ? reportTypeOptions.find((option) => option.value === reportType)?.label ?? reportType : null,
    status !== 'all' ? statusOptions.find((option) => option.value === status)?.label ?? status : null
  ].filter((label): label is string => Boolean(label));

  return (
    <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text-dark)]">Report Filters</h2>
          <p className="mt-1 text-sm text-[var(--text-light)]">Tune the reporting scope before exporting or reviewing sections.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[rgba(0,58,143,0.06)] px-4 text-sm font-bold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
            <i className="fas fa-lock text-xs" />
            IT Department
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

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(190px,1fr)_minmax(220px,1.15fr)_minmax(180px,1fr)]">

        <WorkspaceSelect label="Date Range" value={dateRange} onChange={onDateRangeChange}>
          {dateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect label="Report Type" value={reportType} onChange={onReportTypeChange}>
          {reportTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect label="Status" value={status} onChange={onStatusChange}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </WorkspaceSelect>
      </div>

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
    </section>
  );
}

export function EvaluationSummaryCard({
  summary,
  onExport
}: {
  summary: AdviserReportsModule['evaluationSummary'];
  onExport: (section: ReportSectionKey, format: ReportExportFormat) => void;
}) {
  return (
    <SectionCard
      eyebrow="Evaluation"
      title="Evaluation Summary"
      description="Average score distribution and recommendation outcomes for adviser-reviewed IT groups."
      actions={<ExportButtons section="evaluation" formats={['pdf', 'csv', 'excel']} onExport={onExport} />}
    >
      {summary.totalReviewedGroups ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Average Score"
            value={summary.averageScore}
            helperText="Average final or derived review score inside the current reporting scope."
            icon="fa-star"
            iconClassName="bg-blue-50 text-blue-600"
          />
          <MetricTile
            label="Passed Groups"
            value={summary.passedGroups}
            helperText="Groups already cleared for archive, endorsement, or the next academic milestone."
            icon="fa-circle-check"
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <MetricTile
            label="With Revision"
            value={summary.withRevision}
            helperText="Groups that need revisions before a final recommendation can be closed."
            icon="fa-rotate-right"
            iconClassName="bg-amber-50 text-amber-600"
          />
          <MetricTile
            label="Failed Groups"
            value={summary.failedGroups}
            helperText="Groups whose current outcome still falls below the passing recommendation threshold."
            icon="fa-triangle-exclamation"
            iconClassName="bg-rose-50 text-rose-600"
          />
        </div>
      ) : (
        <EmptySection
          icon="fa-clipboard-check"
          title="No evaluation records in this filter"
          description="Adjust the date range or status filter to bring adviser evaluation outcomes into view."
        />
      )}
    </SectionCard>
  );
}

export function ProgressSummaryCard({
  summary,
  onExport
}: {
  summary: AdviserReportsModule['progressSummary'];
  onExport: (section: ReportSectionKey, format: ReportExportFormat) => void;
}) {
  return (
    <SectionCard
      eyebrow="Progress"
      title="Progress Overview"
      description="Completion health, risk distribution, and adviser follow-up signals for assigned IT groups."
      actions={<ExportButtons section="progress" formats={['pdf', 'csv', 'excel']} onExport={onExport} />}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(0,58,143,0.06),rgba(248,250,252,0.96))] p-5">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Completion Health</p>
              <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em] text-[#003A8F]">{summary.averageCompletion}%</p>
            </div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#003A8F] shadow-sm ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
              <i className="fas fa-chart-line" />
            </span>
          </div>
          <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#003A8F,#1E40AF,#F6BE00)]"
              style={{ width: `${summary.averageCompletion}%` }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.2rem] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-[var(--text-light)]">Completion Index</p>
              <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--primary)]">
                {summary.averageCompletion}%
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-[var(--text-light)]">On Track Groups</p>
              <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-emerald-600">
                {summary.onTrackGroups}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-[var(--text-light)]">At Risk Groups</p>
              <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-amber-600">
                {summary.atRiskGroups}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-[var(--text-light)]">Delayed Groups</p>
              <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-rose-600">
                {summary.delayedGroups}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {summary.indicators.map((indicator) => (
            <div key={indicator.id} className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-dark)]">{indicator.label}</p>
                  <p className="mt-1 text-sm text-[var(--text-light)]">{indicator.count} groups in the selected scope</p>
                </div>
                <span className="text-sm font-bold text-[var(--primary)]">{indicator.percentage}%</span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div
                  className={`h-2.5 rounded-full ${indicator.barClassName}`}
                  style={{ width: `${indicator.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function CompletedProjectRow({ project }: { project: CompletedProjectRecord }) {
  return (
    <tr className="group transition">
      <td className="rounded-l-[1.2rem] border-y border-l border-slate-100 bg-slate-50 px-4 py-4 align-top text-sm font-semibold text-[var(--text-dark)] transition group-hover:bg-white">
        <span className="inline-flex rounded-full bg-[rgba(0,58,143,0.08)] px-3 py-1 text-xs font-bold text-[#003A8F] ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
          {project.groupId}
        </span>
      </td>
      <td className="border-y border-slate-100 bg-slate-50 px-4 py-4 align-top text-sm font-semibold text-[var(--text-dark)] transition group-hover:bg-white">
        {project.projectTitle}
      </td>
      <td className="border-y border-slate-100 bg-slate-50 px-4 py-4 align-top text-sm transition group-hover:bg-white">
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          {project.finalScore}
        </span>
      </td>
      <td className="border-y border-slate-100 bg-slate-50 px-4 py-4 align-top text-sm leading-6 text-[var(--text-light)] transition group-hover:bg-white">
        {project.recommendation}
      </td>
      <td className="rounded-r-[1.2rem] border-y border-r border-slate-100 bg-slate-50 px-4 py-4 align-top text-sm font-semibold text-[var(--text-light)] transition group-hover:bg-white">
        {formatReportDate(project.completedAt)}
      </td>
    </tr>
  );
}

export function CompletedProjectsList({
  projects,
  viewAllHref,
  onExport
}: {
  projects: CompletedProjectRecord[];
  viewAllHref: string;
  onExport: (section: ReportSectionKey, format: ReportExportFormat) => void;
}) {
  return (
    <SectionCard
      eyebrow="Archive"
      title="Completed Projects"
      description="Completed IT groups derived from the same completion and archive movement logic used in My Groups."
      actions={
        <>
          <Link
            href={viewAllHref}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-[0.9rem] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#003A8F]/20 hover:bg-slate-50 hover:text-[#003A8F]"
          >
            <i aria-hidden="true" className="fas fa-arrow-up-right-from-square text-xs" />
            View All
          </Link>
          <ExportButtons section="completed-projects" formats={['pdf', 'csv', 'excel']} onExport={onExport} />
        </>
      }
    >
      {projects.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                <th className="px-4 pb-1">Group ID</th>
                <th className="px-4 pb-1">Project Title</th>
                <th className="px-4 pb-1">Final Score</th>
                <th className="px-4 pb-1">Final Recommendation</th>
                <th className="px-4 pb-1">Completed Date</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <CompletedProjectRow key={project.id} project={project} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptySection
          icon="fa-folder-open"
          title="No completed IT projects in this scope"
          description="The selected filters do not currently include any archived or fully completed group records."
        />
      )}
    </SectionCard>
  );
}

export function SupervisionSummaryCard({
  summary,
  onExport
}: {
  summary: AdviserReportsModule['supervisionSummary'];
  onExport: (section: ReportSectionKey, format: ReportExportFormat) => void;
}) {
  return (
    <SectionCard
      eyebrow="Supervision"
      title="Supervision Summary"
      description="Supervision coverage, defense pressure, and evaluation activity aligned with the current IT adviser reporting scope."
      actions={<ExportButtons section="supervision" formats={['pdf', 'excel']} onExport={onExport} />}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
            <p className="text-sm font-semibold text-[var(--text-light)]">Total Groups Handled</p>
            <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--primary)]">
              {summary.totalGroupsHandled}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
            <p className="text-sm font-semibold text-[var(--text-light)]">Upcoming Defenses</p>
            <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-blue-600">
              {summary.upcomingDefenses}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
            <p className="text-sm font-semibold text-[var(--text-light)]">Evaluations This Week</p>
            <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-amber-600">
              {summary.evaluationsThisWeek}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
            <p className="text-sm font-semibold text-[var(--text-light)]">Supervision Level</p>
            <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--text-dark)]">
              {summary.supervisionLevel}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(0,58,143,0.06),rgba(248,250,252,0.96))] p-5">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[rgba(246,190,0,0.16)] blur-2xl" />
          <div className="relative">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${summary.badgeClassName}`}>
              {summary.supervisionLevel} supervision
            </span>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text-dark)]">Supervision load outlook</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-light)]">{summary.helperText}</p>
            <div className="mt-5 rounded-[1.2rem] bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Export focus</p>
              <p className="mt-2 text-sm text-[var(--text-dark)]">
                Generate schedule-aligned supervision summaries for adviser reviews, planning discussions, and archive-ready reporting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
