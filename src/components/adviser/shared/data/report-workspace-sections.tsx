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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  section: ReportSectionKey | 'all';
  formats: ReportExportFormat[];
  onExport: (section: ReportSectionKey | 'all', format: ReportExportFormat) => void;
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
    <section className="adviser-report-section overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
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
    <div className="inline-flex items-center gap-1.5 rounded-[1rem] border border-slate-200 bg-white p-1 shadow-sm">
      {formats.map((format) => (
        <button
          key={`${section}-${format}`}
          type="button"
          title={`Export as ${format.toUpperCase()}`}
          onClick={() => onExport(section, format)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[0.7rem] text-slate-500 transition hover:bg-slate-100 hover:text-[#003A8F]"
        >
          <i
            aria-hidden="true"
            className={`fas ${
              format === 'pdf' ? 'fa-file-pdf' : format === 'csv' ? 'fa-file-csv' : 'fa-file-excel'
            }`}
          />
        </button>
      ))}
    </div>
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
  onClearFilters,
  onGlobalExport
}: ReportFiltersProps & { onGlobalExport: (format: ReportExportFormat) => void }) {
  const activeFilterLabels = [
    dateOptions.find((option) => option.value === dateRange)?.label ?? dateRange,
    reportType !== 'all' ? reportTypeOptions.find((option) => option.value === reportType)?.label ?? reportType : null,
    status !== 'all' ? statusOptions.find((option) => option.value === status)?.label ?? status : null
  ].filter((label): label is string => Boolean(label));

  return (
    <section className="adviser-report-filters rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text-dark)]">Report Filters</h2>
          <p className="mt-1 text-sm text-[var(--text-light)]">Tune the reporting scope before exporting or reviewing sections.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">

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
          <div className="ml-2 border-l border-slate-200 pl-4">
            <ExportButtons section="all" formats={['pdf', 'csv', 'excel']} onExport={(_, format) => onGlobalExport(format)} />
          </div>
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
  summary
}: {
  summary: AdviserReportsModule['evaluationSummary'];
}) {
  return (
    <SectionCard
      eyebrow="Evaluation"
      title="Evaluation Summary"
      description="Average score distribution and recommendation outcomes for adviser-reviewed IT groups."
    >
      {summary.totalReviewedGroups ? (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col justify-center gap-4">
            <MetricTile
              label="Average Score"
              value={summary.averageScore}
              helperText="Average final or derived review score inside the current reporting scope."
              icon="fa-star"
              iconClassName="bg-blue-50 text-blue-600"
            />
          </div>
          
          <div className="flex flex-col rounded-[1.5rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <h3 className="mb-4 text-center text-sm font-bold tracking-tight text-slate-800">Outcome Distribution</h3>
            <div className="relative flex-1">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Passed', value: summary.passedGroups, color: '#10b981' },
                      { name: 'Revision', value: summary.withRevision, color: '#f59e0b' },
                      { name: 'Failed', value: summary.failedGroups, color: '#f43f5e' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {
                      [
                        { name: 'Passed', value: summary.passedGroups, color: '#10b981' },
                        { name: 'Revision', value: summary.withRevision, color: '#f59e0b' },
                        { name: 'Failed', value: summary.failedGroups, color: '#f43f5e' }
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Pie>
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
                      padding: '12px 20px',
                      fontWeight: '600'
                    }} 
                    itemStyle={{ color: '#334155' }} 
                  />
                  <Legend 
                    iconType="circle" 
                    wrapperStyle={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: '#475569',
                      paddingTop: '20px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text for the donut chart */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                <span className="text-3xl font-extrabold text-[var(--primary)]">{summary.totalReviewedGroups}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
              </div>
            </div>
          </div>
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
  summary
}: {
  summary: AdviserReportsModule['progressSummary'];
}) {
  return (
    <SectionCard
      eyebrow="Progress"
      title="Progress Overview"
      description="Completion health, risk distribution, and adviser follow-up signals for assigned IT groups."
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
  viewAllHref
}: {
  projects: CompletedProjectRecord[];
  viewAllHref: string;
}) {
  return (
    <SectionCard
      eyebrow="Archive"
      title="Completed Projects"
      description="Completed IT groups derived from the same completion and archive movement logic used in My Groups."
      actions={
        <Link
          href={viewAllHref}
          className="inline-flex min-h-[38px] items-center gap-2 rounded-[0.9rem] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#003A8F]/20 hover:bg-slate-50 hover:text-[#003A8F]"
        >
          <i aria-hidden="true" className="fas fa-arrow-up-right-from-square text-xs" />
          View All
        </Link>
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
  summary
}: {
  summary: AdviserReportsModule['supervisionSummary'];
}) {
  return (
    <SectionCard
      eyebrow="Supervision"
      title="Supervision Summary"
      description="Supervision coverage, defense pressure, and evaluation activity aligned with the current IT adviser reporting scope."
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
