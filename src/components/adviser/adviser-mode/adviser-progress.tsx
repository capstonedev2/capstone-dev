'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive, getShortName } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import {
  AtRiskGroupsPanel,
  GroupProgressList,
  MilestoneTracker,
  ProgressFilters,
  ProgressOverview,
  ProgressSummaryCards,
  type ProgressSummaryMetric
} from '@/components/adviser/adviser-mode/data/progress-workspace-sections';
import {
  IT_PROGRESS_MILESTONES,
  PROGRESS_SORT_OPTIONS,
  PROGRESS_STATUS_FILTER_OPTIONS,
  getAtRiskRecords,
  getMostActiveMilestone,
  getNextMajorDeadline,
  sortProgressRecords,
  type ProgressMilestone,
  type ProgressSortOption,
  type ProgressStatus,
  type AdviserActionStatus,
  type AdviserProgressRecord
} from '@/components/adviser/adviser-mode/data/progress-workspace-data';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export function AdviserProgress({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [statusFilter, setStatusFilter] = useState<ProgressStatus | 'all'>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<ProgressMilestone | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<ProgressSortOption>('nearest-deadline');

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

  const progressRecords = useMemo<AdviserProgressRecord[]>(() => {
    return data.groups.map(g => {
      let mappedStatus: ProgressStatus = 'on-track';
      if (g.statusClass === 'status-warning' || g.statusLabel.toLowerCase().includes('risk')) mappedStatus = 'at-risk';
      else if (g.statusClass === 'status-revise' || g.statusLabel.toLowerCase().includes('delay')) mappedStatus = 'delayed';
      else if (g.statusClass === 'status-approved' || g.progress === 100) mappedStatus = 'completed';

      let mappedMilestone: ProgressMilestone = 'Proposal';
      const validMilestones = [...IT_PROGRESS_MILESTONES] as string[];
      if (validMilestones.includes(g.currentMilestone)) {
        mappedMilestone = g.currentMilestone as ProgressMilestone;
      } else if (g.progress > 80) {
        mappedMilestone = 'Final Defense';
      } else if (g.progress > 40) {
        mappedMilestone = 'Development';
      }

      let action: AdviserActionStatus = 'Waiting for submission';
      if (mappedStatus === 'at-risk' || mappedStatus === 'delayed') action = 'Needs review';
      else if (mappedStatus === 'completed') action = 'Ready for defense';

      return {
        id: g.id,
        groupId: g.code as `IT-2024-${string}`,
        projectTitle: g.projectTitle || g.title,
        department: (g.department || g.dept || 'IT') as 'IT',
        progress: g.progress || 0,
        currentMilestone: mappedMilestone,
        status: mappedStatus,
        deadline: g.completedAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        lastUpdate: g.updated_at || new Date().toISOString(),
        adviserAction: action
      };
    });
  }, [data.groups]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    const filtered = progressRecords.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesMilestone = milestoneFilter === 'all' || record.currentMilestone === milestoneFilter;
      const matchesSearch =
        !normalizedSearch ||
        [record.groupId, record.projectTitle, record.currentMilestone, record.adviserAction]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesMilestone && matchesSearch;
    });

    return sortProgressRecords(filtered, sortBy);
  }, [milestoneFilter, progressRecords, searchValue, sortBy, statusFilter]);

  const summaryMetrics = useMemo<ProgressSummaryMetric[]>(
    () => [
      {
        id: 'total-groups',
        label: 'Total Groups',
        value: progressRecords.length,
        helperText: 'Total advised IT groups currently tracked in this progress workspace.',
        icon: 'fa-users',
        iconClassName: 'bg-blue-50 text-blue-600'
      },
      {
        id: 'on-track',
        label: 'On Track',
        value: progressRecords.filter((record) => record.status === 'on-track').length,
        helperText: 'Groups progressing normally against their current milestone targets.',
        icon: 'fa-circle-check',
        iconClassName: 'bg-emerald-50 text-emerald-600'
      },
      {
        id: 'at-risk',
        label: 'At Risk',
        value: progressRecords.filter((record) => record.status === 'at-risk').length,
        helperText: 'Groups that need closer adviser review before timelines slip further.',
        icon: 'fa-triangle-exclamation',
        iconClassName: 'bg-amber-50 text-amber-600'
      },
      {
        id: 'delayed',
        label: 'Delayed',
        value: progressRecords.filter((record) => record.status === 'delayed').length,
        helperText: 'Groups with overdue milestones or stale activity that need follow-up.',
        icon: 'fa-clock',
        iconClassName: 'bg-rose-50 text-rose-600'
      }
    ],
    [progressRecords]
  );

  const averageProgress = useMemo(
    () =>
      Math.round(
        progressRecords.reduce((total, record) => total + record.progress, 0) / Math.max(1, progressRecords.length)
      ),
    [progressRecords]
  );

  const groupsBehindSchedule = useMemo(() => getAtRiskRecords(progressRecords).length, [progressRecords]);
  const activeMilestone = useMemo(() => getMostActiveMilestone(progressRecords), [progressRecords]);
  const nextMajorDeadline = useMemo(() => getNextMajorDeadline(progressRecords), [progressRecords]);

  return (
    <>
        <AdviserPageHeader
          title="Progress"
          description="Monitor milestone completion, detect delays, and track the performance of your assigned IT groups."
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
          <ProgressSummaryCards metrics={summaryMetrics} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <ProgressOverview
              activeMilestone={activeMilestone}
              averageProgress={averageProgress}
              groupsBehindSchedule={groupsBehindSchedule}
              nextMajorDeadline={nextMajorDeadline}
            />
            <MilestoneTracker records={progressRecords} />
          </div>

          <ProgressFilters
            milestoneFilter={milestoneFilter}
            milestoneOptions={[...IT_PROGRESS_MILESTONES]}
            onMilestoneChange={setMilestoneFilter}
            onSearchChange={setSearchValue}
            onSortChange={setSortBy}
            onStatusChange={setStatusFilter}
            searchValue={searchValue}
            sortBy={sortBy}
            sortOptions={PROGRESS_SORT_OPTIONS}
            statusFilter={statusFilter}
            statusOptions={PROGRESS_STATUS_FILTER_OPTIONS}
          />

          <GroupProgressList records={filteredRecords} />

          <AtRiskGroupsPanel records={progressRecords} />
        </div>
      </>
  );
}
