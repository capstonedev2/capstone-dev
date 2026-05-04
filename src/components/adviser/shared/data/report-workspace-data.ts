import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import { getComputedGroupStatus, getGroupProjectTitle, isGroupCompleted } from '@/components/adviser/shared/config/dashboard-utils';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const REPORT_REFERENCE_DATE = '2026-04-06T00:00:00.000Z';

export type ReportDateRange = 'current-cycle' | 'last-30-days' | 'last-90-days' | 'academic-year';
export type ReportType = 'all' | 'evaluation' | 'progress' | 'completed-projects' | 'supervision';
export type ReportStatusFilter = 'all' | 'open' | 'attention' | 'completed';
export type ReportExportFormat = 'pdf' | 'csv' | 'excel';
export type ReportSectionKey = 'evaluation' | 'progress' | 'completed-projects' | 'supervision';

export type ReportSummaryMetric = {
  id: string;
  label: string;
  value: string;
  helperText: string;
  icon: string;
  iconClassName: string;
};

export type EvaluationSummary = {
  averageScore: number;
  passedGroups: number;
  withRevision: number;
  failedGroups: number;
  totalReviewedGroups: number;
};

export type ProgressIndicator = {
  id: string;
  label: string;
  count: number;
  percentage: number;
  barClassName: string;
};

export type ProgressSummary = {
  averageCompletion: number;
  onTrackGroups: number;
  atRiskGroups: number;
  delayedGroups: number;
  indicators: ProgressIndicator[];
};

export type CompletedProjectRecord = {
  id: string;
  groupId: string;
  projectTitle: string;
  finalScore: number;
  recommendation: string;
  completedAt: string;
};

export type SupervisionSummary = {
  totalGroupsHandled: number;
  upcomingDefenses: number;
  evaluationsThisWeek: number;
  supervisionLevel: 'Light' | 'Moderate' | 'High';
  helperText: string;
  badgeClassName: string;
};

export type AdviserReportsModule = {
  department: 'IT';
  totalGroups: number;
  completedGroups: number;
  averageProgress: number;
  pendingEvaluations: number;
  summaryMetrics: ReportSummaryMetric[];
  evaluationSummary: EvaluationSummary;
  progressSummary: ProgressSummary;
  completedProjects: CompletedProjectRecord[];
  supervisionSummary: SupervisionSummary;
};

export const REPORT_DATE_RANGE_OPTIONS: Array<{ value: ReportDateRange; label: string }> = [
  { value: 'current-cycle', label: 'Current Cycle' },
  { value: 'last-30-days', label: 'Last 30 Days' },
  { value: 'last-90-days', label: 'Last 90 Days' },
  { value: 'academic-year', label: 'Academic Year' }
];

export const REPORT_TYPE_OPTIONS: Array<{ value: ReportType; label: string }> = [
  { value: 'all', label: 'All Reports' },
  { value: 'evaluation', label: 'Evaluation Summary' },
  { value: 'progress', label: 'Progress Overview' },
  { value: 'completed-projects', label: 'Completed Projects' },
  { value: 'supervision', label: 'Supervision Summary' }
];

export const REPORT_STATUS_OPTIONS: Array<{ value: ReportStatusFilter; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'open', label: 'Open Records' },
  { value: 'attention', label: 'Needs Attention' },
  { value: 'completed', label: 'Completed' }
];

type ReportsFilterInput = {
  dateRange: ReportDateRange;
  status: ReportStatusFilter;
};

type AdviserGroup = AdviserDashboardData['groups'][number];
type PanelProject = AdviserDashboardData['panelProjects'][number];
type ProgressBucket = 'on-track' | 'at-risk' | 'delayed' | 'completed';

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function parseDateValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}T/.test(value) ? value : `${value} UTC`;
  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateToUtcDay(value: string | null | undefined) {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return null;
  }

  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function matchesDateRange(value: string | null | undefined, range: ReportDateRange, referenceDate = REPORT_REFERENCE_DATE) {
  const reportDay = dateToUtcDay(value);
  if (reportDay === null) {
    return false;
  }

  const referenceDay = startOfUtcDay(referenceDate);

  if (range === 'current-cycle') {
    return reportDay >= Date.UTC(2026, 2, 1) && reportDay <= referenceDay;
  }

  if (range === 'last-30-days') {
    return reportDay >= referenceDay - 29 * DAY_IN_MS && reportDay <= referenceDay;
  }

  if (range === 'last-90-days') {
    return reportDay >= referenceDay - 89 * DAY_IN_MS && reportDay <= referenceDay;
  }

  return reportDay >= Date.UTC(2025, 5, 1) && reportDay <= referenceDay;
}

function getGroupReportDate(group: AdviserGroup) {
  return group.completedAt ?? group.updated_at;
}

function getProgressBucket(group: AdviserGroup): ProgressBucket {
  if (isGroupCompleted(group)) {
    return 'completed';
  }

  const computedStatus = getComputedGroupStatus(group);

  if (computedStatus === 'at-risk' || group.progress < 40) {
    return 'delayed';
  }

  if (computedStatus === 'needs-revision' || computedStatus === 'pending') {
    return 'at-risk';
  }

  return 'on-track';
}

function matchesGroupStatus(group: AdviserGroup, status: ReportStatusFilter) {
  if (status === 'all') {
    return true;
  }

  const progressBucket = getProgressBucket(group);

  if (status === 'open') {
    return progressBucket !== 'completed';
  }

  if (status === 'attention') {
    return progressBucket === 'at-risk' || progressBucket === 'delayed';
  }

  return progressBucket === 'completed';
}

function matchesEvaluationStatus(project: PanelProject, status: ReportStatusFilter) {
  if (status === 'all') {
    return true;
  }

  if (status === 'open') {
    return project.status !== 'completed';
  }

  if (status === 'attention') {
    return project.status === 'pending' || project.status === 'scheduled';
  }

  return project.status === 'completed';
}

function getPanelProjectReportDate(project: PanelProject) {
  return project.defenseDate || project.updated_at;
}

function deriveEvaluationScore(group: AdviserGroup) {
  if (typeof group.finalScore === 'number') {
    return group.finalScore;
  }

  const computedStatus = getComputedGroupStatus(group);
  const baselineScore = Math.round(55 + group.progress * 0.4);

  if (computedStatus === 'needs-revision') {
    return Math.min(84, baselineScore);
  }

  if (computedStatus === 'at-risk') {
    return Math.max(65, Math.min(74, baselineScore - 4));
  }

  if (computedStatus === 'pending') {
    return Math.min(79, baselineScore);
  }

  return Math.min(92, baselineScore + 4);
}

function isEvaluationReadyGroup(group: AdviserGroup) {
  const computedStatus = getComputedGroupStatus(group);

  return (
    isGroupCompleted(group) ||
    computedStatus === 'needs-revision' ||
    computedStatus === 'at-risk' ||
    typeof group.finalScore === 'number' ||
    Boolean(group.finalRecommendation)
  );
}

function classifyEvaluationResult(group: AdviserGroup) {
  const computedStatus = getComputedGroupStatus(group);
  const score = deriveEvaluationScore(group);

  if (isGroupCompleted(group) || group.finalDefenseResult === 'Passed') {
    return 'passed';
  }

  if (group.finalDefenseResult === 'Failed' || score < 75 || computedStatus === 'at-risk') {
    return 'failed';
  }

  return 'revision';
}

function formatPercentValue(value: number) {
  return `${value}%`;
}

export function formatReportDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function buildAdviserReportsModule(data: AdviserDashboardData, filters: ReportsFilterInput): AdviserReportsModule {
  const adviserGroups = data.groups.filter((group) => (group.department || group.dept) === 'IT');
  const panelProjects = data.panelProjects.filter((project) => project.dept === 'IT');

  const filteredGroups = adviserGroups
    .filter((group) => matchesDateRange(getGroupReportDate(group), filters.dateRange))
    .filter((group) => matchesGroupStatus(group, filters.status));

  const filteredPanelProjects = panelProjects
    .filter((project) => matchesDateRange(getPanelProjectReportDate(project), filters.dateRange))
    .filter((project) => matchesEvaluationStatus(project, filters.status));

  const completedGroups = filteredGroups.filter((group) => isGroupCompleted(group));
  const averageProgress = filteredGroups.length
    ? Math.round(filteredGroups.reduce((sum, group) => sum + group.progress, 0) / filteredGroups.length)
    : 0;
  const pendingEvaluations = filteredPanelProjects.filter((project) => project.status !== 'completed').length;

  const evaluationGroups = filteredGroups.filter(isEvaluationReadyGroup);
  const evaluationAverage = evaluationGroups.length
    ? Math.round(evaluationGroups.reduce((sum, group) => sum + deriveEvaluationScore(group), 0) / evaluationGroups.length)
    : 0;

  const passedGroups = evaluationGroups.filter((group) => classifyEvaluationResult(group) === 'passed').length;
  const withRevision = evaluationGroups.filter((group) => classifyEvaluationResult(group) === 'revision').length;
  const failedGroups = evaluationGroups.filter((group) => classifyEvaluationResult(group) === 'failed').length;

  const progressBuckets = filteredGroups.map((group) => getProgressBucket(group));
  const onTrackGroups = progressBuckets.filter((bucket) => bucket === 'on-track').length;
  const atRiskGroups = progressBuckets.filter((bucket) => bucket === 'at-risk').length;
  const delayedGroups = progressBuckets.filter((bucket) => bucket === 'delayed').length;

  const completedProjects = completedGroups
    .sort((left, right) => {
      const leftTime = parseDateValue(left.completedAt)?.getTime() ?? 0;
      const rightTime = parseDateValue(right.completedAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .map((group) => ({
      id: group.project_id,
      groupId: group.code,
      projectTitle: getGroupProjectTitle(group),
      finalScore: deriveEvaluationScore(group),
      recommendation: group.finalRecommendation ?? 'Completed and cleared for institutional archive.',
      completedAt: group.completedAt ?? group.updated_at
    }));

  const referenceDay = startOfUtcDay(REPORT_REFERENCE_DATE);
  const evaluationsThisWeek = filteredPanelProjects.filter((project) => {
    const defenseDay = dateToUtcDay(project.defenseDate);
    if (defenseDay === null) {
      return false;
    }

    return Math.abs(defenseDay - referenceDay) <= 6 * DAY_IN_MS;
  }).length;

  const attentionLoad = atRiskGroups + delayedGroups + pendingEvaluations;
  const supervisionLevel: SupervisionSummary['supervisionLevel'] =
    attentionLoad >= 4 || filteredGroups.length >= 5
      ? 'High'
      : attentionLoad >= 2 || filteredGroups.length >= 3
        ? 'Moderate'
        : 'Light';

  const supervisionMeta =
    supervisionLevel === 'High'
      ? {
          helperText: 'Multiple reviews, follow-ups, and defense checkpoints are competing for adviser time.',
          badgeClassName: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
        }
      : supervisionLevel === 'Moderate'
        ? {
            helperText: 'Current supervision load is steady, with manageable review and defense activity.',
            badgeClassName: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
          }
        : {
            helperText: 'The active queue is light enough for catch-up, consolidation, and archive work.',
            badgeClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
          };

  return {
    department: 'IT',
    totalGroups: filteredGroups.length,
    completedGroups: completedGroups.length,
    averageProgress,
    pendingEvaluations,
    summaryMetrics: [
      {
        id: 'total-groups',
        label: 'Total Groups',
        value: String(filteredGroups.length),
        helperText: 'IT groups currently included in the selected reporting scope.',
        icon: 'fa-users',
        iconClassName: 'bg-blue-50 text-blue-600'
      },
      {
        id: 'completed-projects',
        label: 'Completed Projects',
        value: String(completedGroups.length),
        helperText: 'Groups that already satisfy the same completion rule used in My Groups.',
        icon: 'fa-folder-open',
        iconClassName: 'bg-emerald-50 text-emerald-600'
      },
      {
        id: 'average-progress',
        label: 'Average Progress',
        value: formatPercentValue(averageProgress),
        helperText: 'Average completion across the selected IT adviser records.',
        icon: 'fa-chart-line',
        iconClassName: 'bg-sky-50 text-sky-600'
      },
      {
        id: 'pending-evaluations',
        label: 'Pending Evaluations',
        value: String(pendingEvaluations),
        helperText: 'Evaluation packets still waiting for adviser-side action or confirmation.',
        icon: 'fa-clipboard-check',
        iconClassName: 'bg-amber-50 text-amber-600'
      }
    ],
    evaluationSummary: {
      averageScore: evaluationAverage,
      passedGroups,
      withRevision,
      failedGroups,
      totalReviewedGroups: evaluationGroups.length
    },
    progressSummary: {
      averageCompletion: averageProgress,
      onTrackGroups,
      atRiskGroups,
      delayedGroups,
      indicators: [
        {
          id: 'on-track',
          label: 'On Track Groups',
          count: onTrackGroups,
          percentage: filteredGroups.length ? Math.round((onTrackGroups / filteredGroups.length) * 100) : 0,
          barClassName: 'bg-emerald-500'
        },
        {
          id: 'at-risk',
          label: 'At Risk Groups',
          count: atRiskGroups,
          percentage: filteredGroups.length ? Math.round((atRiskGroups / filteredGroups.length) * 100) : 0,
          barClassName: 'bg-amber-500'
        },
        {
          id: 'delayed',
          label: 'Delayed Groups',
          count: delayedGroups,
          percentage: filteredGroups.length ? Math.round((delayedGroups / filteredGroups.length) * 100) : 0,
          barClassName: 'bg-rose-500'
        }
      ]
    },
    completedProjects,
    supervisionSummary: {
      totalGroupsHandled: filteredGroups.length,
      upcomingDefenses: filteredPanelProjects.filter((project) => project.status !== 'completed').length,
      evaluationsThisWeek,
      supervisionLevel,
      helperText: supervisionMeta.helperText,
      badgeClassName: supervisionMeta.badgeClassName
    }
  };
}
