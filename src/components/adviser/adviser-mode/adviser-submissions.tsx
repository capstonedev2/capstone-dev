'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive, getShortName } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import {
  FiltersBar,
  PriorityQueue,
  ReviewChecklist,
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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return;
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const adviserMeta = WORKSPACE_META[workspaceMode];
  const submissions = IT_ADVISER_SUBMISSIONS;
  const typeOptions = useMemo(() => getSubmissionTypeOptions(submissions), [submissions]);
  const milestoneOptions = useMemo(() => getSubmissionMilestoneOptions(submissions), [submissions]);

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
    });
  }, [milestoneFilter, searchValue, statusFilter, submissions, typeFilter]);

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
          <SummaryCards metrics={summaryMetrics} />

          <FiltersBar
            milestoneFilter={milestoneFilter}
            milestoneOptions={milestoneOptions}
            onMilestoneChange={setMilestoneFilter}
            onSearchChange={setSearchValue}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            searchValue={searchValue}
            statusFilter={statusFilter}
            statusOptions={SUBMISSION_STATUS_FILTER_OPTIONS}
            typeFilter={typeFilter}
            typeOptions={typeOptions}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
            <SubmissionList submissions={filteredSubmissions} />

            <div className="space-y-6">
              <PriorityQueue submissions={submissions} />
              <ReviewChecklist />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
