'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import {
  AttentionAlerts,
  GroupProgressSnapshot,
  LiveSupervisionUpdates,
  QuickActions,
  RecentSubmissions,
  WeeklySchedule
} from '@/components/adviser/shared/config/dashboard-sections';
import type { DashboardAction, RecentSubmissionItem } from '@/components/adviser/shared/config/dashboard-types';
import {
  buildAdviserAlerts,
  buildAdviserLiveUpdates,
  buildAdviserProgressSnapshot,
  buildAdviserRecentSubmissionItems,
  buildAdviserScheduleItems,
  buildPanelAlerts,
  buildPanelLiveUpdates,
  buildPanelProgressSnapshot,
  buildPanelRecentSubmissionItems,
  buildPanelScheduleItems,
  getComputedGroupStatus,
  getShortName,
  isNavItemActive,
  NAV_ITEMS,
  WORKSPACE_META
} from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

type WorkspaceMode = keyof typeof WORKSPACE_META;

export const AdviserDashboard = memo(function AdviserDashboard({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const router = useRouter();
  const [groups] = useState(data.groups);
  const [panelProjects] = useState(data.panelProjects);
  const [adviserActivity] = useState(data.adviserActivity);
  const [panelActivity] = useState(data.panelActivity);

  const meta = WORKSPACE_META[workspaceMode];
  const pendingAdviserReviews = useMemo(
    () => data.recentSubmissions.filter((item) => item.status.toUpperCase() !== 'APPROVED').length,
    [data.recentSubmissions]
  );
  const pendingPanelReviews = useMemo(
    () => panelProjects.filter((project) => project.status !== 'completed').length,
    [panelProjects]
  );
  const liveUpdates = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserLiveUpdates(adviserActivity, groups)
        : buildPanelLiveUpdates(panelActivity, panelProjects),
    [workspaceMode, adviserActivity, groups, panelActivity, panelProjects]
  );

  const recentSubmissionItems = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserRecentSubmissionItems(data.recentSubmissions, groups)
        : buildPanelRecentSubmissionItems(panelProjects),
    [workspaceMode, data.recentSubmissions, groups, panelProjects]
  );

  const attentionAlerts = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserAlerts(groups)
        : buildPanelAlerts(panelProjects),
    [workspaceMode, groups, panelProjects]
  );

  const weeklySchedule = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserScheduleItems(data.upcomingSchedule, groups)
        : buildPanelScheduleItems(panelProjects),
    [workspaceMode, data.upcomingSchedule, groups, panelProjects]
  );

  const progressItems = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserProgressSnapshot(groups)
        : buildPanelProgressSnapshot(panelProjects),
    [workspaceMode, groups, panelProjects]
  );
  const activeAdviserGroupCount = useMemo(
    () => groups.filter((group) => getComputedGroupStatus(group) !== 'completed').length,
    [groups]
  );


  const quickActions = useMemo<DashboardAction[]>(
    () =>
      workspaceMode === 'adviser'
        ? [
            { id: 'review-submissions', icon: 'fa-check-double', label: 'Review Submissions', helperText: `${pendingAdviserReviews} items are waiting in your queue`, href: `${basePath}/submissions` },
            { id: 'schedule-consultation', icon: 'fa-calendar-plus', label: 'Schedule Consultation', helperText: 'Adjust meetings and consultation slots quickly', href: `${basePath}/schedule` },
            { id: 'view-groups', icon: 'fa-users', label: 'View My Groups', helperText: `${activeAdviserGroupCount} active groups under your supervision`, href: `${basePath}/groups` },
            { id: 'generate-report', icon: 'fa-chart-line', label: 'Reports & Analytics', helperText: 'Export a real, up-to-date CSV summary for the current cycle', href: `${basePath}/reports` }
          ]
        : [
            { id: 'evaluation-queue', icon: 'fa-clipboard-check', label: 'Review Evaluations', helperText: `${pendingPanelReviews} scoring packets still need your recommendation`, href: `${basePath}/evaluation-queue` },
            { id: 'view-defense-schedule', icon: 'fa-calendar-days', label: 'Defense Schedule', helperText: 'Check upcoming defense sessions and panel assignments', href: `${basePath}/defense-schedule` },
            { id: 'view-panel-profile', icon: 'fa-user', label: 'View My Groups', helperText: 'Open panel profile and current assignment overview', href: `${basePath}/profile` },
            { id: 'review-history', icon: 'fa-clock-rotate-left', label: 'Review History', helperText: 'See your past evaluation and review activity', href: `${basePath}/review-history` }
          ],
    [activeAdviserGroupCount, basePath, pendingAdviserReviews, pendingPanelReviews, workspaceMode]
  );

  const watchedGroups = workspaceMode === 'adviser' ? groups : panelProjects;
  const averageProgress = workspaceMode === 'adviser'
    ? groups.length
      ? Math.round(groups.reduce((total, group) => total + group.progress, 0) / groups.length)
      : 0
    : panelProjects.length
      ? Math.round((panelProjects.filter((project) => project.status === 'completed').length / panelProjects.length) * 100)
      : 0;
  const unresolvedRevisions = workspaceMode === 'adviser'
    ? groups.filter((group) => getComputedGroupStatus(group) === 'needs-revision').length
    : panelProjects.filter((project) => project.status === 'pending').length;
  const atRiskCount = workspaceMode === 'adviser'
    ? groups.filter((group) => {
        const status = getComputedGroupStatus(group);
        return status === 'at-risk' || status === 'needs-revision' || status === 'pending';
      }).length
    : panelProjects.filter((project) => project.status !== 'completed').length;
  const activeReviewCount = workspaceMode === 'adviser' ? pendingAdviserReviews : pendingPanelReviews;
  // Real counts only — no synthesized percentage. The old formula produced a fake
  // "health %" that bottomed out at an arbitrary floor and didn't reflect real severity.
  const concernCount = atRiskCount + activeReviewCount + unresolvedRevisions;
  const healthLabel = concernCount === 0 ? 'Stable' : concernCount <= 3 ? 'Watchlist' : 'Intervention';
  const healthSummary =
    concernCount === 0
      ? `All ${watchedGroups.length} tracked ${workspaceMode === 'adviser' ? 'groups are' : 'assignments are'} clear — nothing pending or flagged right now.`
      : workspaceMode === 'adviser'
        ? `${atRiskCount} group${atRiskCount === 1 ? '' : 's'} need attention and ${activeReviewCount} review${activeReviewCount === 1 ? '' : 's'} ${activeReviewCount === 1 ? 'is' : 'are'} pending.`
        : `${atRiskCount} assignment${atRiskCount === 1 ? '' : 's'} still open and ${activeReviewCount} scorecard${activeReviewCount === 1 ? '' : 's'} pending.`;
  const primaryActionHref = workspaceMode === 'adviser' ? meta.primaryActionHref : `${basePath}/evaluation-queue`;
  const scheduleHref = workspaceMode === 'adviser' ? `${basePath}/schedule` : `${basePath}/defense-schedule`;
  const nextScheduleItem = weeklySchedule[0] ?? null;
  const topQueueItem = recentSubmissionItems[0] ?? null;
  const topAttentionItem = attentionAlerts[0] ?? null;
  const focusMetrics = useMemo(
    () => [
      {
        id: 'review-load',
        icon: workspaceMode === 'adviser' ? 'fa-inbox' : 'fa-clipboard-check',
        label: workspaceMode === 'adviser' ? 'Review load' : 'Evaluation load',
        value: String(activeReviewCount),
        detail: workspaceMode === 'adviser' ? 'Items waiting for adviser action' : 'Packets waiting for scoring',
        tone: activeReviewCount ? 'warning' : 'success'
      },
      {
        id: 'watchlist',
        icon: 'fa-triangle-exclamation',
        label: 'Watchlist',
        value: String(atRiskCount),
        detail: workspaceMode === 'adviser' ? 'Groups with revision or progress risk' : 'Panel assignments not yet completed',
        tone: atRiskCount ? 'danger' : 'success'
      },
      {
        id: 'schedule',
        icon: workspaceMode === 'adviser' ? 'fa-calendar-check' : 'fa-calendar-days',
        label: 'This week',
        value: String(weeklySchedule.length),
        detail: nextScheduleItem ? `${nextScheduleItem.dateLabel}, ${nextScheduleItem.timeLabel}` : 'No scheduled sessions',
        tone: weeklySchedule.length ? 'info' : 'neutral'
      },
      {
        id: 'progress',
        icon: 'fa-chart-simple',
        label: workspaceMode === 'adviser' ? 'Average progress' : 'Completion rate',
        value: `${averageProgress}%`,
        detail: `${watchedGroups.length} ${workspaceMode === 'adviser' ? 'groups' : 'assignments'} tracked`,
        tone: averageProgress >= 80 ? 'success' : averageProgress >= 60 ? 'warning' : 'danger'
      }
    ] as const,
    [activeReviewCount, atRiskCount, averageProgress, nextScheduleItem, watchedGroups.length, weeklySchedule.length, workspaceMode]
  );
  const nextActions = useMemo(
    () => [
      topAttentionItem
        ? {
            id: 'attention',
            icon: topAttentionItem.priority === 'urgent' ? 'fa-circle-exclamation' : 'fa-flag',
            label: topAttentionItem.title,
            detail: topAttentionItem.meta,
            href: workspaceMode === 'adviser' ? `${basePath}/progress` : `${basePath}/evaluation-queue`
          }
        : null,
      topQueueItem
        ? {
            id: 'queue',
            icon: workspaceMode === 'adviser' ? 'fa-file-circle-check' : 'fa-star-half-stroke',
            label: topQueueItem.fileTitle,
            detail: `${topQueueItem.groupCode} - ${topQueueItem.statusLabel}`,
            href: workspaceMode === 'adviser' ? `${basePath}/submissions` : `${basePath}/evaluation-queue`
          }
        : null,
      nextScheduleItem
        ? {
            id: 'schedule',
            icon: workspaceMode === 'adviser' ? 'fa-calendar-check' : 'fa-calendar-days',
            label: nextScheduleItem.groupName,
            detail: `${nextScheduleItem.eventType} - ${nextScheduleItem.dateLabel} ${nextScheduleItem.timeLabel}`,
            href: scheduleHref
          }
        : null
    ].filter((item): item is { id: string; icon: string; label: string; detail: string; href: string } => Boolean(item)),
    [basePath, nextScheduleItem, scheduleHref, topAttentionItem, topQueueItem, workspaceMode]
  );
  const handleRecentSubmissionAction = useCallback(
    (item: RecentSubmissionItem) => {
      if (workspaceMode === 'adviser') {
        // actionId is now a real UploadedFile id — deep-link straight to its review workspace.
        router.push(`${basePath}/submissions/${item.actionId}`);
        return;
      }

      // Panel-mode items are real Evaluation ids — deep-link straight to that record.
      router.push(`${basePath}/evaluation-queue?recordId=${encodeURIComponent(item.actionId)}`);
    },
    [basePath, router, workspaceMode]
  );

  return (
    <>
        <AdviserPageHeader
          title={meta.pageTitle}
          description={meta.pageCopy}
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

        <div className="adviser-dashboard-workspace max-w-[1600px] space-y-6">
          <section className="adviser-command-center" aria-labelledby="adviser-command-center-title">
            <div className="adviser-command-copy">
              <span className="adviser-command-eyebrow">
                <span className="adviser-live-dot" />
                {workspaceMode === 'adviser' ? 'Adviser workbench' : 'Panel workbench'}
              </span>
              <h2 id="adviser-command-center-title">
                {workspaceMode === 'adviser' ? 'Adviser Overview' : 'Panel Overview'}
              </h2>
              <p>
                {workspaceMode === 'adviser'
                  ? 'Review the queue, check group risk, and move the next supervision task without leaving the dashboard.'
                  : 'Review the evaluation queue, check defense schedules, and score project packets efficiently.'}
              </p>
              <div className="adviser-command-actions">
                <Link href={primaryActionHref} prefetch={false}>
                  <i aria-hidden="true" className={`fas ${meta.primaryActionIcon}`} />
                  {meta.primaryActionLabel}
                </Link>
                <Link className="is-secondary" href={scheduleHref} prefetch={false}>
                  <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-calendar' : 'fa-calendar-days'}`} />
                  {workspaceMode === 'adviser' ? 'Open Schedule' : 'Defense Schedule'}
                </Link>
              </div>

              <div className="adviser-focus-grid" aria-label="Dashboard focus metrics">
                {focusMetrics.map((item) => (
                  <article key={item.id} className={`adviser-focus-card is-${item.tone}`}>
                    <span className="adviser-focus-card-icon">
                      <i aria-hidden="true" className={`fas ${item.icon}`} />
                    </span>
                    <span className="adviser-focus-card-copy">
                      <small>{item.label}</small>
                      <strong>{item.value}</strong>
                      <span>{item.detail}</span>
                    </span>
                  </article>
                ))}
              </div>
            </div>

            <div className="adviser-health-panel">
              <div className="adviser-health-header">
                <span>{workspaceMode === 'adviser' ? 'Risk Overview' : 'Evaluation Health'}</span>
                <strong>{healthLabel}</strong>
              </div>
              <div className="adviser-health-score">
                <span>{healthSummary}</span>
              </div>
              <div className="adviser-health-stats">
                <span>
                  <strong>{watchedGroups.length}</strong>
                  Tracked
                </span>
                <span>
                  <strong>{activeReviewCount}</strong>
                  Pending
                </span>
                <span>
                  <strong>{unresolvedRevisions}</strong>
                  Revisions
                </span>
              </div>
              <div className="adviser-next-action-list">
                <div className="adviser-next-action-head">
                  <span>Next best actions</span>
                  <small>{nextActions.length || 0} queued</small>
                </div>
                {nextActions.length ? (
                  nextActions.map((item) => (
                    <Link key={item.id} href={item.href} prefetch={false}>
                      <i aria-hidden="true" className={`fas ${item.icon}`} />
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <i aria-hidden="true" className="fas fa-chevron-right" />
                    </Link>
                  ))
                ) : (
                  <p>No urgent action is queued right now.</p>
                )}
              </div>
            </div>
          </section>

          <div className="adviser-premium-grid grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
            <div className="adviser-primary-stack space-y-6">
              <RecentSubmissions
                actionLabel={workspaceMode === 'adviser' ? 'Review' : 'Evaluate'}
                actionHref={workspaceMode === 'adviser' ? `${basePath}/submissions` : `${basePath}/evaluation-queue`}
                actionLinkLabel={workspaceMode === 'adviser' ? 'Open full queue' : 'Open evaluation queue'}
                items={recentSubmissionItems}
                onAction={handleRecentSubmissionAction}
                title={workspaceMode === 'adviser' ? 'Recent Submissions' : 'Pending Evaluations'}
                description={
                  workspaceMode === 'adviser'
                    ? 'Latest items routed to your dashboard with review state and direct action access.'
                    : 'Evaluation packets and defense reviews currently waiting in your panel queue.'
                }
              />
              <AttentionAlerts items={attentionAlerts} />
              <LiveSupervisionUpdates items={liveUpdates} />
            </div>

            <div className="adviser-smart-rail space-y-6">
              <QuickActions actions={quickActions} />
              <WeeklySchedule items={weeklySchedule} />
              <GroupProgressSnapshot items={progressItems} />
            </div>
          </div>
        </div>
      </>
  );
});
