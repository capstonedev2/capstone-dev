'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, SectionCard, StatusPill } from '@/components/system-admin/ui';
import { getAcademicYears, getDepartmentReport } from '@/lib/focal-person/service';
import { currentAcademicYearId, SEMESTER_LABELS, SEMESTER_ORDER, STAGE_LABELS } from '@/lib/focal-person/terms';
import type {
  AcademicYearSummary,
  DefenseResult,
  DepartmentReport,
  DepartmentReportFilters,
  ProjectStage,
  ReportRowStatus
} from '@/lib/focal-person/types';
import styles from './focal-person.module.css';

const STATUS_LABELS: Record<ReportRowStatus, string> = { on_track: 'On track', delayed: 'Delayed', completed: 'Completed' };
const RESULT_LABELS: Record<DefenseResult, string> = {
  passed: 'Passed',
  passed_minor: 'Passed (minor revisions)',
  passed_major: 'Passed (major revisions)',
  redefense: 'Redefense',
  pending: 'Pending'
};

function csvCell(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(report: DepartmentReport, yearLabel: string) {
  const header = ['Group', 'Project title', 'Adviser', 'Stage', 'Status', 'Last milestone', 'Defense result', 'Published', 'School year', 'Semester'];
  const lines = report.rows.map((row) =>
    [
      row.groupCode,
      row.projectTitle,
      row.adviserName,
      STAGE_LABELS[row.stage],
      STATUS_LABELS[row.status],
      row.lastMilestone,
      RESULT_LABELS[row.defenseResult],
      row.published ? 'Yes' : 'No',
      yearLabel,
      SEMESTER_LABELS[row.semester]
    ]
      .map(csvCell)
      .join(',')
  );
  // BOM so Excel opens the UTF-8 file with the right characters (e.g. the en dash in "2026–2027").
  const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const semester = report.filters.semester === 'ALL' ? 'all-semesters' : report.filters.semester.toLowerCase();
  link.href = url;
  link.download = `focal-report-${report.department.id}-${yearLabel.replace(/[^\d]+/g, '-')}-${semester}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Read-only department report; the server limits the rows to the signed-in account's department. */
export function FocalReports() {
  const [years, setYears] = useState<AcademicYearSummary[]>([]);
  const [filters, setFilters] = useState<DepartmentReportFilters>({
    academicYearId: currentAcademicYearId(),
    semester: 'ALL',
    stage: 'ALL'
  });
  const [report, setReport] = useState<DepartmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAcademicYears()
      .then(setYears)
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDepartmentReport(filters)
      .then((result) => {
        if (!cancelled) {
          setReport(result);
          setError('');
          setLoading(false);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load the report.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const yearLabel = useMemo(() => years.find((year) => year.id === filters.academicYearId)?.label ?? '', [filters.academicYearId, years]);
  const update = (patch: Partial<DepartmentReportFilters>) => setFilters((current) => ({ ...current, ...patch }));

  return (
    <SectionCard
      title="Department report"
      description="Projects, milestones, defense results, and repository publishing for the research office."
      icon="fa-file-lines"
      titleId="focal-report"
      action={
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => report && downloadCsv(report, yearLabel)}
          disabled={!report || loading || !report.rows.length}
        >
          <i className="fas fa-file-csv" aria-hidden="true" />
          Export CSV
        </button>
      }
    >
      <div className={styles.filters} role="group" aria-label="Report filters">
        <label className={styles.field}>
          <span>School year</span>
          <select value={filters.academicYearId} onChange={(event) => update({ academicYearId: event.target.value })}>
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Semester</span>
          <select value={filters.semester} onChange={(event) => update({ semester: event.target.value as DepartmentReportFilters['semester'] })}>
            <option value="ALL">All semesters</option>
            {SEMESTER_ORDER.map((semester) => (
              <option key={semester} value={semester}>
                {SEMESTER_LABELS[semester]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Stage</span>
          <select value={filters.stage} onChange={(event) => update({ stage: event.target.value as DepartmentReportFilters['stage'] })}>
            <option value="ALL">All stages</option>
            {(Object.keys(STAGE_LABELS) as ProjectStage[]).map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {report ? (
        <ul className={styles.summaryChips} aria-label="Report summary">
          <li>
            <strong>{report.summary.projects}</strong> projects
          </li>
          <li>
            <strong>{report.summary.completed}</strong> completed
          </li>
          <li className={report.summary.delayed ? styles.chipAlert : undefined}>
            <strong>{report.summary.delayed}</strong> delayed
          </li>
          <li>
            <strong>{report.summary.defensesPassed}</strong> defenses passed
          </li>
          <li>
            <strong>{report.summary.published}</strong> published
          </li>
        </ul>
      ) : null}

      {error ? (
        <EmptyState icon="fa-triangle-exclamation" message={error} />
      ) : loading && !report ? (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Loading report…
        </div>
      ) : report && report.rows.length ? (
        <div className={styles.tableScroll} tabIndex={0} aria-label="Report rows, scrolls horizontally" aria-busy={loading}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              {report.department.shortName} report for {yearLabel}
            </caption>
            <thead>
              <tr>
                <th scope="col">Group</th>
                <th scope="col">Project</th>
                <th scope="col">Adviser</th>
                <th scope="col">Stage</th>
                <th scope="col">Status</th>
                <th scope="col">Defense result</th>
                <th scope="col">Published</th>
                <th scope="col">Semester</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={`${row.groupCode}-${row.projectTitle}`}>
                  <th scope="row">{row.groupCode}</th>
                  <td>
                    <span className={styles.cellTitle}>{row.projectTitle}</span>
                    <span className={styles.subtle}>{row.lastMilestone}</span>
                  </td>
                  <td>{row.adviserName}</td>
                  <td>{STAGE_LABELS[row.stage]}</td>
                  <td>
                    <StatusPill tone={row.status === 'delayed' ? 'error' : row.status === 'completed' ? 'success' : 'neutral'}>
                      {STATUS_LABELS[row.status]}
                    </StatusPill>
                  </td>
                  <td>{RESULT_LABELS[row.defenseResult]}</td>
                  <td>{row.published ? 'Yes' : 'No'}</td>
                  <td className={styles.nowrap}>{SEMESTER_LABELS[row.semester]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="fa-filter-circle-xmark" message="No projects match these filters." />
      )}
    </SectionCard>
  );
}
