'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { getToastIcon, NAV_ITEMS, WORKSPACE_META, isNavItemActive } from '@/components/adviser/shared/config/dashboard-utils';
import {
  buildAdviserReportsModule,
  REPORT_DATE_RANGE_OPTIONS,
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
  type ReportDateRange,
  type ReportExportFormat,
  type ReportSectionKey,
  type ReportStatusFilter,
  type ReportType
} from '@/components/adviser/shared/data/report-workspace-data';
import {
  CompletedProjectsList,
  EvaluationSummaryCard,
  ProgressSummaryCard,
  ReportFilters,
  ReportOverviewPanel,
  ReportSummaryCards,
  SupervisionSummaryCard
} from '@/components/adviser/shared/data/report-workspace-sections';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

type ToastState = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

export function AdviserReports({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [dateRange, setDateRange] = useState<ReportDateRange>('current-cycle');
  const [reportType, setReportType] = useState<ReportType>('all');
  const [status, setStatus] = useState<ReportStatusFilter>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const meta = WORKSPACE_META[workspaceMode];

  const reportModule = useMemo(() => buildAdviserReportsModule(data, { dateRange, status }), [data, dateRange, status]);
  const hasActiveFilters = dateRange !== 'current-cycle' || reportType !== 'all' || status !== 'all';

  const showEvaluation = reportType === 'all' || reportType === 'evaluation';
  const showProgress = reportType === 'all' || reportType === 'progress';
  const showCompletedProjects = reportType === 'all' || reportType === 'completed-projects';
  const showSupervision = reportType === 'all' || reportType === 'supervision';
  const visibleSectionCount = [showEvaluation, showProgress, showCompletedProjects, showSupervision].filter(Boolean).length;
  const dateRangeLabel = REPORT_DATE_RANGE_OPTIONS.find((option) => option.value === dateRange)?.label ?? 'Current Cycle';
  const reportTypeLabel = REPORT_TYPE_OPTIONS.find((option) => option.value === reportType)?.label ?? 'All Reports';
  const statusLabel = REPORT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'All Status';

  function clearFilters() {
    setDateRange('current-cycle');
    setReportType('all');
    setStatus('all');
  }

  function showToast(message: string, type: ToastState['type'] = 'info') {
    const id = Date.now();
    setToast({ id, message, type });

    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }

  function handleExport(section: ReportSectionKey, format: ReportExportFormat) {
    const sectionLabel =
      section === 'evaluation'
        ? 'evaluation summary'
        : section === 'progress'
          ? 'progress overview'
          : section === 'completed-projects'
            ? 'completed projects'
            : 'supervision summary';

    showToast(`Preparing ${sectionLabel} export in ${format.toUpperCase()} format.`, 'success');
  }

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{meta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>Generate summaries for tracking deliverables, evaluation results, and supervision activity.</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${meta.badgeIcon}`} />
            <span>{meta.badgeLabel}</span>
          </span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className={isNavItemActive(pathname, item.href) ? 'active' : ''}>
              <i className={`fas ${item.icon}`}></i> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <AdviserPageHeader
          title="Activity Reports"
          description="Generate summaries for tracking deliverables, evaluation results, and supervision activity."
          actions={
            <AdviserShellActions
              basePath={basePath}
              fullName={data.profile.fullName}
              notificationCount={data.profile.notificationCount}
              workspaceMode={workspaceMode}
              onSwitchWorkspace={switchWorkspace}
            />
          }
        />

        <div className="adviser-reports-page mx-auto max-w-[1600px] space-y-6">
          <ReportOverviewPanel
            dateRangeLabel={dateRangeLabel}
            reportModule={reportModule}
            reportTypeLabel={reportTypeLabel}
            statusLabel={statusLabel}
            visibleSectionCount={visibleSectionCount}
          />

          <ReportSummaryCards metrics={reportModule.summaryMetrics} />

          <ReportFilters
            dateRange={dateRange}
            reportType={reportType}
            status={status}
            dateOptions={REPORT_DATE_RANGE_OPTIONS}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            reportTypeOptions={REPORT_TYPE_OPTIONS}
            statusOptions={REPORT_STATUS_OPTIONS}
            onDateRangeChange={setDateRange}
            onReportTypeChange={setReportType}
            onStatusChange={setStatus}
          />

          {showEvaluation || showProgress ? (
            <div className={`grid gap-6 ${showEvaluation && showProgress ? 'xl:grid-cols-2' : ''}`}>
              {showEvaluation ? (
                <EvaluationSummaryCard summary={reportModule.evaluationSummary} onExport={handleExport} />
              ) : null}
              {showProgress ? (
                <ProgressSummaryCard summary={reportModule.progressSummary} onExport={handleExport} />
              ) : null}
            </div>
          ) : null}

          {showCompletedProjects ? (
            <CompletedProjectsList
              projects={reportModule.completedProjects}
              viewAllHref={`${basePath}/groups`}
              onExport={handleExport}
            />
          ) : null}

          {showSupervision ? (
            <SupervisionSummaryCard summary={reportModule.supervisionSummary} onExport={handleExport} />
          ) : null}
        </div>

        {toast ? (
          <div
            className={`fixed bottom-6 right-6 z-[140] flex min-w-[280px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'error'
                  ? 'bg-rose-600'
                  : 'bg-[var(--primary)]'
            }`}
            role="status"
          >
            <i aria-hidden="true" className={`fas ${getToastIcon(toast.type)}`} />
            <span>{toast.message}</span>
          </div>
        ) : null}
      </main>
    </div>
  );
}
