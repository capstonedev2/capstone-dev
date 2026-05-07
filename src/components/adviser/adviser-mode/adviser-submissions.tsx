'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import {
  FiltersBar,
  SubmissionFocusPanel,
  SubmissionList,
  SummaryCards,
  type SubmissionSummaryMetric
} from '@/components/adviser/adviser-mode/data/submission-workspace-sections';
import {
  IT_ADVISER_SUBMISSIONS,
  SUBMISSION_STATUS_FILTER_OPTIONS,
  getApprovedThisWeekCount,
  getSubmissionMilestoneOptions,
  getSubmissionTypeOptions,
  type SubmissionMilestone,
  type SubmissionStatus,
  type SubmissionType
} from '@/components/adviser/adviser-mode/data/submission-workspace-data';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export function AdviserSubmissions({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [typeFilter, setTypeFilter] = useState<SubmissionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<SubmissionMilestone | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');

  const adviserMeta = WORKSPACE_META[workspaceMode];
  const submissions = IT_ADVISER_SUBMISSIONS;
  const typeOptions = useMemo(() => getSubmissionTypeOptions(submissions), [submissions]);
  const milestoneOptions = useMemo(() => getSubmissionMilestoneOptions(submissions), [submissions]);
  const hasActiveFilters =
    typeFilter !== 'all' || statusFilter !== 'all' || milestoneFilter !== 'all' || searchValue.trim().length > 0;

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setMilestoneFilter('all');
    setSearchValue('');
  };

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesType = typeFilter === 'all' || submission.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesMilestone = milestoneFilter === 'all' || submission.milestone === milestoneFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          submission.groupId,
          submission.projectTitle,
          submission.submissionTitle,
          submission.reviewFocus,
          submission.nextAction
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesType && matchesStatus && matchesMilestone && matchesSearch;
    }).sort((left, right) => {
      const statusPriority: Record<SubmissionStatus, number> = {
        'needs-revision': 0,
        'pending-review': 1,
        'under-review': 2,
        approved: 3
      };

      return statusPriority[left.status] - statusPriority[right.status] || new Date(left.deadline).getTime() - new Date(right.deadline).getTime();
    });
  }, [milestoneFilter, searchValue, statusFilter, submissions, typeFilter]);

  const activeReviewCount = useMemo(
    () => submissions.filter((submission) => submission.status !== 'approved').length,
    [submissions]
  );
  const nextDueSubmission = useMemo(
    () =>
      [...submissions]
        .filter((submission) => submission.status !== 'approved')
        .sort((left, right) => new Date(left.deadline).getTime() - new Date(right.deadline).getTime())[0] ?? null,
    [submissions]
  );
  const completionRate = Math.round(
    (submissions.filter((submission) => submission.status === 'approved').length / Math.max(1, submissions.length)) * 100
  );

  const summaryMetrics = useMemo<SubmissionSummaryMetric[]>(
    () => [
      {
        id: 'pending-review',
        label: 'Pending Review',
        value: submissions.filter((submission) => submission.status === 'pending-review').length,
        helperText: 'IT submissions waiting for a first-pass adviser decision.',
        icon: 'fa-clock',
        iconClassName: 'bg-amber-50 text-amber-600'
      },
      {
        id: 'under-review',
        label: 'Under Review',
        value: submissions.filter((submission) => submission.status === 'under-review').length,
        helperText: 'Active IT documents currently in your review flow.',
        icon: 'fa-magnifying-glass',
        iconClassName: 'bg-blue-50 text-blue-600'
      },
      {
        id: 'approved-this-week',
        label: 'Approved This Week',
        value: getApprovedThisWeekCount(submissions),
        helperText: 'Documents cleared for the next milestone this week.',
        icon: 'fa-circle-check',
        iconClassName: 'bg-emerald-50 text-emerald-600'
      },
      {
        id: 'needs-revision',
        label: 'Needs Revision',
        value: submissions.filter((submission) => submission.status === 'needs-revision').length,
        helperText: 'Groups that still need follow-up comments and another pass.',
        icon: 'fa-rotate-left',
        iconClassName: 'bg-rose-50 text-rose-600'
      }
    ],
    [submissions]
  );

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{adviserMeta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>Review submitted chapters, proposals, and final documents from your assigned IT groups.</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${adviserMeta.badgeIcon}`} />
            <span>{adviserMeta.badgeLabel}</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link
              key={item.href}
              className={isNavItemActive(pathname, item.href) ? 'active' : ''}
              href={item.href}
            >
              <i className={`fas ${item.icon}`} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <AdviserPageHeader
          description="Review submitted chapters, proposals, and final documents from your assigned IT groups."
          title="Submissions"
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

        <div className="mx-auto max-w-[1600px] space-y-6">
          <SubmissionFocusPanel
            activeReviewCount={activeReviewCount}
            completionRate={completionRate}
            nextDueSubmission={nextDueSubmission}
          />

          <SummaryCards metrics={summaryMetrics} />

          <FiltersBar
            hasActiveFilters={hasActiveFilters}
            milestoneFilter={milestoneFilter}
            milestoneOptions={milestoneOptions}
            onClearFilters={clearFilters}
            onMilestoneChange={setMilestoneFilter}
            onSearchChange={setSearchValue}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            resultCount={filteredSubmissions.length}
            searchValue={searchValue}
            statusFilter={statusFilter}
            statusOptions={SUBMISSION_STATUS_FILTER_OPTIONS}
            totalCount={submissions.length}
            typeFilter={typeFilter}
            typeOptions={typeOptions}
          />

          <SubmissionList
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            submissions={filteredSubmissions}
            totalSubmissions={submissions.length}
          />
        </div>
      </main>
    </div>
  );
}
