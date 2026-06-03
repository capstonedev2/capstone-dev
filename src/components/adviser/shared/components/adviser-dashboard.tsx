'use client';

import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
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
  getToastIcon,
  isNavItemActive,
  NAV_ITEMS,
  WORKSPACE_META
} from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

type WorkspaceMode = keyof typeof WORKSPACE_META;
type ModalKey = 'review' | 'evaluation' | 'report' | null;
type ToastType = 'success' | 'error' | 'info';

export const AdviserDashboard = memo(function AdviserDashboard({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [groups, setGroups] = useState(data.groups);
  const [panelProjects, setPanelProjects] = useState(data.panelProjects);
  const [adviserActivity, setAdviserActivity] = useState(data.adviserActivity);
  const [panelActivity, setPanelActivity] = useState(data.panelActivity);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [reviewGroupId, setReviewGroupId] = useState(data.groups[0]?.id ?? '');
  const [reviewDecision, setReviewDecision] = useState('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [notifyStudentReview, setNotifyStudentReview] = useState(true);
  const [evaluationProjectId, setEvaluationProjectId] = useState(data.panelProjects[0]?.id ?? '');
  const [evaluationScores, setEvaluationScores] = useState([8, 12, 8, 4]);
  const [evaluationRecommendation, setEvaluationRecommendation] = useState('Pass - Proceed to Development');
  const [reportType, setReportType] = useState('Group Progress Report');
  const [reportFormat, setReportFormat] = useState('PDF Document');
  const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(null);


  useEffect(() => {
    document.body.style.overflow = activeModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModal]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModal(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const meta = WORKSPACE_META[workspaceMode];
  const pendingAdviserReviews = useMemo(
    () => data.adviserSubmissions.filter((item) => item.status !== 'approved').length,
    [data.adviserSubmissions]
  );
  const pendingPanelReviews = useMemo(
    () => panelProjects.filter((project) => project.status !== 'completed').length,
    [panelProjects]
  );
  const selectedReviewGroup = groups.find((group) => group.id === reviewGroupId) ?? groups[0] ?? null;
  const selectedPanelProject = panelProjects.find((project) => project.id === evaluationProjectId) ?? panelProjects[0] ?? null;

  const liveUpdates = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserLiveUpdates(adviserActivity, data.recentSubmissions, data.adviserSubmissions, groups)
        : buildPanelLiveUpdates(panelActivity, panelProjects),
    [workspaceMode, adviserActivity, data.recentSubmissions, data.adviserSubmissions, groups, panelActivity, panelProjects]
  );

  const recentSubmissionItems = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserRecentSubmissionItems(data.recentSubmissions, data.adviserSubmissions, groups)
        : buildPanelRecentSubmissionItems(panelProjects),
    [workspaceMode, data.recentSubmissions, data.adviserSubmissions, groups, panelProjects]
  );

  const attentionAlerts = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserAlerts(groups, data.adviserSubmissions)
        : buildPanelAlerts(panelProjects),
    [workspaceMode, groups, data.adviserSubmissions, panelProjects]
  );

  const weeklySchedule = useMemo(
    () =>
      workspaceMode === 'adviser'
        ? buildAdviserScheduleItems(data.upcomingSchedule)
        : buildPanelScheduleItems(panelProjects),
    [workspaceMode, data.upcomingSchedule, panelProjects]
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

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });

    window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  const openReviewModal = useCallback((groupId: string) => {
    setReviewGroupId(groupId);
    setReviewDecision('approve');
    setReviewComments('');
    setNotifyStudentReview(true);
    setActiveModal('review');
  }, []);

  const openEvaluationModal = useCallback((projectId: string) => {
    setEvaluationProjectId(projectId);
    setEvaluationScores([8, 12, 8, 4]);
    setEvaluationRecommendation('Pass - Proceed to Development');
    setActiveModal('evaluation');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  function submitReview() {
    if (!reviewComments.trim() || !selectedReviewGroup) {
      showToast('Please provide feedback comments before submitting the review.', 'error');
      return;
    }

    const timestamp = new Date().toISOString();

    setGroups((current) =>
      current.map((group) => {
        if (group.id !== selectedReviewGroup.id) {
          return group;
        }

        if (reviewDecision === 'approve') {
          return { ...group, status: 'active', statusLabel: 'Active', statusClass: 'status-active' };
        }

        if (reviewDecision === 'revision') {
          return { ...group, status: 'needs-revision', statusLabel: 'Needs Revision', statusClass: 'status-revise' };
        }

        return { ...group, status: 'pending', statusLabel: 'Pending', statusClass: 'status-pending' };
      })
    );

    setAdviserActivity((current) => [
      {
        id: `activity-${Date.now()}`,
        user_id: data.profile.user_id,
        project_id: selectedReviewGroup.project_id,
        status: reviewDecision === 'approve' ? 'approved' : reviewDecision === 'revision' ? 'needs-revision' : 'pending',
        created_at: timestamp,
        updated_at: timestamp,
        icon: reviewDecision === 'approve' ? 'fa-check-circle' : 'fa-comment-dots',
        title: `${selectedReviewGroup.code} review submitted`,
        text:
          reviewDecision === 'approve'
            ? `${selectedReviewGroup.title} is cleared for the next milestone.`
            : `${selectedReviewGroup.title} was returned with focused revision guidance.`,
        time: 'Just now'
      },
      ...current
    ].slice(0, 6));

    closeModal();
    showToast(
      `Review submitted for ${selectedReviewGroup.code}${notifyStudentReview ? ' - Students notified' : ''}`,
      'success'
    );
  }

  function submitEvaluation() {
    if (!selectedPanelProject) {
      showToast('Select a panel assignment first.', 'error');
      return;
    }

    const timestamp = new Date().toISOString();

    setPanelProjects((current) =>
      current.map((project) =>
        project.id === selectedPanelProject.id
          ? { ...project, status: 'completed', statusLabel: 'Completed', statusClass: 'status-approved' }
          : project
      )
    );

    setPanelActivity((current) => [
      {
        id: `panel-activity-${Date.now()}`,
        user_id: data.profile.user_id,
        project_id: selectedPanelProject.project_id,
        status: 'completed',
        created_at: timestamp,
        updated_at: timestamp,
        icon: 'fa-check-double',
        title: `Evaluation submitted - ${selectedPanelProject.title}`,
        text: `Recommendation recorded: ${evaluationRecommendation}.`,
        time: 'Just now'
      },
      ...current
    ].slice(0, 6));

    closeModal();
    showToast(`Evaluation submitted for ${selectedPanelProject.title}`, 'success');
  }

  function generateReport() {
    showToast(`Generating ${reportType} in ${reportFormat} format...`, 'info');
    window.setTimeout(() => {
      closeModal();
      showToast('Report generation completed. Your export will be ready shortly.', 'success');
    }, 1200);
  }

  const quickActions = useMemo<DashboardAction[]>(
    () =>
      workspaceMode === 'adviser'
        ? [
            { id: 'review-submissions', icon: 'fa-check-double', label: 'Review Submissions', helperText: `${pendingAdviserReviews} items are waiting in your queue`, href: `${basePath}/submissions` },
            { id: 'schedule-consultation', icon: 'fa-calendar-plus', label: 'Schedule Consultation', helperText: 'Adjust meetings and consultation slots quickly', href: `${basePath}/schedule` },
            { id: 'view-groups', icon: 'fa-users', label: 'View My Groups', helperText: `${activeAdviserGroupCount} active groups under your supervision`, href: `${basePath}/groups` },
            { id: 'generate-report', icon: 'fa-chart-line', label: 'Generate Report', helperText: 'Prepare a progress summary for the current cycle', onClick: () => setActiveModal('report') }
          ]
        : [
            { id: 'evaluation-queue', icon: 'fa-clipboard-check', label: 'Review Evaluations', helperText: `${pendingPanelReviews} scoring packets still need your recommendation`, href: `${basePath}/evaluation-queue` },
            { id: 'view-defense-schedule', icon: 'fa-calendar-days', label: 'Defense Schedule', helperText: 'Check upcoming defense sessions and panel assignments', href: `${basePath}/defense-schedule` },
            { id: 'view-panel-profile', icon: 'fa-user', label: 'View My Groups', helperText: 'Open panel profile and current assignment overview', href: `${basePath}/profile` },
            { id: 'panel-report', icon: 'fa-chart-bar', label: 'Generate Report', helperText: 'Export a consolidated review-cycle report', onClick: () => setActiveModal('report') }
          ],
    [activeAdviserGroupCount, basePath, pendingAdviserReviews, pendingPanelReviews, workspaceMode]
  );

  const watchedGroups = workspaceMode === 'adviser' ? groups : panelProjects;
  const averageProgress = workspaceMode === 'adviser'
    ? groups.length
      ? Math.round(groups.reduce((total, group) => total + group.progress, 0) / groups.length)
      : 100
    : panelProjects.length
      ? Math.round((panelProjects.filter((project) => project.status === 'completed').length / panelProjects.length) * 100)
      : 100;
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
  const supervisionHealth = Math.max(
    12,
    Math.min(98, averageProgress - atRiskCount * 4 - activeReviewCount * 2 + (attentionAlerts.length ? 0 : 6))
  );
  const healthRingStyle = { '--health-value': `${supervisionHealth}%` } as CSSProperties;
  const healthLabel = supervisionHealth >= 82 ? 'Stable' : supervisionHealth >= 64 ? 'Watchlist' : 'Intervention';
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
        openReviewModal(item.actionId);
        return;
      }

      openEvaluationModal(item.actionId);
    },
    [openEvaluationModal, openReviewModal, workspaceMode]
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
                Welcome back, {getShortName(data.profile.fullName)}
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
              <div className="adviser-health-meter" style={healthRingStyle} aria-label={`Health overview ${supervisionHealth}%`}>
                <span />
              </div>
              <div className="adviser-health-score">
                <strong>{supervisionHealth}%</strong>
                <span>
                  {workspaceMode === 'adviser'
                    ? 'Based on progress, unresolved reviews, and active risk items.'
                    : 'Based on evaluation completion rate and pending scorecards.'}
                </span>
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

        <div className={`modal ${activeModal === 'review' ? 'show' : ''}`} onClick={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fas fa-check-double" /> Review Submission</h3>
              <button className="close-modal" type="button" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedReviewGroup ? (
                <>
                  <div className="form-group" style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '0.75rem' }}>
                    <div><strong><i className="fas fa-users" /> Group:</strong> {selectedReviewGroup.code} - {selectedReviewGroup.title}</div>
                    <div style={{ marginTop: '0.5rem' }}><strong><i className="fas fa-file-alt" /> Current Milestone:</strong> {selectedReviewGroup.milestone}</div>
                    <div style={{ marginTop: '0.5rem' }}><strong><i className="fas fa-chart-line" /> Progress:</strong> {selectedReviewGroup.progress}%</div>
                  </div>
                  <div className="form-group">
                    <label>Review Decision</label>
                    <select value={reviewDecision} onChange={(event) => setReviewDecision(event.target.value)}>
                      <option value="approve">Approve - Ready for next stage</option>
                      <option value="revision">Request Revision - Minor changes needed</option>
                      <option value="reject">Reject - Not acceptable</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Feedback / Comments</label>
                    <textarea rows={5} placeholder="Provide detailed guidance for the students..." value={reviewComments} onChange={(event) => setReviewComments(event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="checkbox">
                      <input checked={notifyStudentReview} type="checkbox" onChange={(event) => setNotifyStudentReview(event.target.checked)} />
                      <span>Notify students after submitting this review</span>
                    </label>
                  </div>
                </>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" type="button" onClick={submitReview}><i className="fas fa-paper-plane" /> Submit Review</button>
              <button className="btn btn-outline" type="button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>

        <div className={`modal ${activeModal === 'evaluation' ? 'show' : ''}`} onClick={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3><i className="fas fa-star" /> Panel Evaluation Form</h3>
              <button className="close-modal" type="button" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedPanelProject ? (
                <>
                  <div className="form-group" style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '0.75rem' }}>
                    <div><strong><i className="fas fa-project-diagram" /> Project:</strong> {selectedPanelProject.title}</div>
                    <div style={{ marginTop: '0.5rem' }}><strong><i className="fas fa-building" /> Department:</strong> {selectedPanelProject.dept} Department</div>
                    <div style={{ marginTop: '0.5rem' }}><strong><i className="fas fa-calendar" /> Defense Date:</strong> {selectedPanelProject.defenseDate}</div>
                  </div>
                  {[{ label: 'Research Problem & Objectives (10 points)', max: 10 }, { label: 'Methodology & Approach (15 points)', max: 15 }, { label: 'Significance & Impact (10 points)', max: 10 }, { label: 'Presentation & Clarity (5 points)', max: 5 }].map((item, index) => (
                    <div key={item.label} className="form-group">
                      <label>{item.label}</label>
                      <div className="score-input-group">
                        <input max={item.max} min="0" step="0.5" type="range" value={evaluationScores[index]} onChange={(event) => setEvaluationScores((current) => current.map((score, scoreIndex) => (scoreIndex === index ? Number(event.target.value) : score)))} />
                        <input className="score-input" step="0.5" type="number" value={evaluationScores[index]} onChange={(event) => setEvaluationScores((current) => current.map((score, scoreIndex) => (scoreIndex === index ? Number(event.target.value) : score)))} />
                      </div>
                      {index < 3 ? <textarea rows={2} placeholder="Notes..." /> : null}
                    </div>
                  ))}
                  <div className="form-group">
                    <label>Overall Recommendation</label>
                    <select value={evaluationRecommendation} onChange={(event) => setEvaluationRecommendation(event.target.value)}>
                      <option>Pass - Proceed to Development</option>
                      <option>Conditional Pass - Minor Revisions Required</option>
                      <option>Revise and Resubmit</option>
                      <option>Fail</option>
                    </select>
                  </div>
                </>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" type="button" onClick={submitEvaluation}><i className="fas fa-save" /> Submit Evaluation</button>
              <button className="btn btn-outline" type="button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>

        <div className={`modal ${activeModal === 'report' ? 'show' : ''}`} onClick={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fas fa-chart-line" /> Generate Progress Report</h3>
              <button className="close-modal" type="button" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Report Type</label>
                <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
                  <option>Group Progress Report</option>
                  <option>Individual Student Assessment</option>
                  <option>Submission Summary</option>
                  <option>Evaluation Summary</option>
                  <option>Comprehensive Report</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select defaultValue={data.profile.department}><option>{data.profile.department}</option></select>
              </div>
              <div className="form-group">
                <label>Date Range</label>
                <input defaultValue="2026-03" type="month" />
              </div>
              <div className="form-group">
                <label>Include Sections</label>
                <label className="checkbox"><input defaultChecked type="checkbox" /> Progress Data</label>
                <label className="checkbox"><input defaultChecked type="checkbox" /> Submission History</label>
                <label className="checkbox"><input type="checkbox" /> Feedback Comments</label>
                <label className="checkbox"><input type="checkbox" /> Evaluation Scores</label>
                <label className="checkbox"><input type="checkbox" /> Performance Charts</label>
              </div>
              <div className="form-group">
                <label>Format</label>
                <select value={reportFormat} onChange={(event) => setReportFormat(event.target.value)}>
                  <option>PDF Document</option>
                  <option>Excel Spreadsheet</option>
                  <option>CSV File</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" type="button" onClick={generateReport}><i className="fas fa-download" /> Generate Report</button>
              <button className="btn btn-outline" type="button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>

        {toast ? (
          <div className="notification">
            <i className={`fas ${getToastIcon(toast.type)}`} style={{ color: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--danger)' : 'var(--primary)' }} />
            <span>{toast.message}</span>
          </div>
        ) : null}
      </>
  );
});
