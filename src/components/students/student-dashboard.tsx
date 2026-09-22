'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useMemo, useState, useEffect } from 'react';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import {
  fetchAcademicActivities,
  formatIsoDateLabel,
  type ApiAcademicActivity
} from '@/components/students/student-academic-activity.shared';
import { getProjectFileCategoryLabel } from '@/components/students/student-project-files.shared';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type ShellTone =
  | 'completed'
  | 'current'
  | 'pending'
  | 'needs-revision'
  | 'overdue'
  | 'archived'
  | 'transfer-ready';
type WorkflowStatus = 'completed' | 'current' | 'pending' | 'delayed';
type DashboardWorkflowStep = {
  id: string;
  key: string;
  title: string;
  summary: string;
  status: WorkflowStatus;
  dateLabel: string;
  route: string;
  actionLabel?: string;
};
type PriorityTask = {
  id: string;
  title: string;
  label: string;
  tone: BadgeTone;
  description: string;
  href: string;
  actionLabel: string;
  meta?: string;
  icon?: string;
};

type StudentNotification = StudentDashboardData['notifications'][number];

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function sortByDateDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
}

function createExcerpt(value: string, maxLength = 150) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  const firstSentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? normalized;

  if (firstSentence.length <= maxLength) {
    return firstSentence;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function getStatusTone(status: string): BadgeTone {
  // Raw Prisma enum values (e.g. "UNDER_REVIEW", "DEFENSE_SCHEDULED") use
  // underscores, but several match keywords below are space-separated
  // multi-word phrases ("under review", "in development") — without this,
  // those specific keywords never matched an underscored enum value.
  const normalized = status.toLowerCase().replace(/_/g, ' ');

  if (
    // 'defense scheduled' is treated as an approved-equivalent status
    // throughout the backend (repository eligibility, tech-transfer,
    // document-file access) — the project's title has already been approved,
    // a defense is just now on the calendar for it. Without this, the
    // dashboard's title card fell back to the "pending approval" locked
    // state for every DEFENSE_SCHEDULED project, even ones with a long-since
    // approved title.
    ['approved', 'completed', 'resolved', 'confirmed', 'ready', 'success', 'defense scheduled'].some(kw => normalized.includes(kw))
  ) {
    return 'success';
  }

  if (
    ['needs revision', 'revision', 'delayed', 'high priority', 'overdue', 'needs action', 're-defense', 're-defend', 'rejected', 'failed'].some(kw => normalized.includes(kw))
  ) {
    return 'danger';
  }

  if (
    ['current', 'ongoing', 'in development', 'under review', 'upcoming', 'pending endorsement'].some(kw => normalized.includes(kw))
  ) {
    return 'warning';
  }

  if (['pending', 'submitted', 'normal', 'event schedule', 'consultation'].includes(normalized)) {
    return 'neutral';
  }

  return 'info';
}

function getShellToneFromWorkflowStatus(status: WorkflowStatus): ShellTone {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'current':
      return 'current';
    case 'delayed':
      return 'overdue';
    case 'pending':
    default:
      return 'pending';
  }
}

function getAttentionShellTone({
  attentionCount,
  overdueCount,
  dueSoonCount,
  highPriorityNotificationCount,
  unreadFeedbackCount,
  revisionCount,
  redefenseCount
}: {
  attentionCount: number;
  overdueCount: number;
  dueSoonCount: number;
  highPriorityNotificationCount: number;
  unreadFeedbackCount: number;
  revisionCount: number;
  redefenseCount: number;
}): ShellTone {
  if (!attentionCount) {
    return 'completed';
  }

  if (overdueCount || highPriorityNotificationCount) {
    return 'overdue';
  }

  if (revisionCount || redefenseCount || unreadFeedbackCount) {
    return 'needs-revision';
  }

  if (dueSoonCount) {
    return 'pending';
  }

  return 'current';
}

function getShellToneUi(tone: ShellTone) {
  switch (tone) {
    case 'completed':
      return { tone: 'success' as const, panelClassName: 'is-success', icon: 'fa-circle-check' };
    case 'current':
      return { tone: 'info' as const, panelClassName: 'is-info', icon: 'fa-compass' };
    case 'pending':
      return { tone: 'warning' as const, panelClassName: 'is-warning', icon: 'fa-hourglass-half' };
    case 'needs-revision':
      return { tone: 'danger' as const, panelClassName: 'is-danger', icon: 'fa-pen-to-square' };
    case 'overdue':
      return { tone: 'danger' as const, panelClassName: 'is-danger', icon: 'fa-triangle-exclamation' };
    case 'transfer-ready':
      return { tone: 'success' as const, panelClassName: 'is-success', icon: 'fa-rocket' };
    case 'archived':
    default:
      return { tone: 'neutral' as const, panelClassName: 'is-neutral', icon: 'fa-box-archive' };
  }
}

function getWorkflowStatusConfig(status: WorkflowStatus) {
  if (status === 'completed') {
    return { label: 'Completed', tone: 'success' as const };
  }

  if (status === 'current') {
    return { label: 'Current', tone: 'warning' as const };
  }

  if (status === 'delayed') {
    return { label: 'Delayed', tone: 'danger' as const };
  }

  return { label: 'Pending', tone: 'neutral' as const };
}

const DEFENSE_APPLICATION_STAGES = [
  { key: 'concept-defense-application', label: 'Concept' },
  { key: 'proposal-defense-application', label: 'Proposal' },
  { key: 'final-defense-application', label: 'Final' }
] as const;

function getDefenseEvidenceStatusConfig(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === 'APPROVED' || normalized === 'COMPLETED') {
    return { label: 'Approved', tone: 'success' as const, hint: 'The adviser cleared this evidence.' };
  }

  if (normalized === 'NEEDS_REVISION') {
    return { label: 'Needs Revision', tone: 'danger' as const, hint: 'Upload a corrected copy of the signed form.' };
  }

  if (normalized === 'REJECTED') {
    return { label: 'Rejected', tone: 'danger' as const, hint: 'Check adviser remarks and re-submit.' };
  }

  if (normalized === 'SUBMITTED' || normalized === 'IN_REVIEW') {
    return { label: 'Pending Review', tone: 'warning' as const, hint: 'Waiting for the adviser to review your evidence.' };
  }

  return { label: 'Not Uploaded', tone: 'neutral' as const, hint: 'Upload a photo of the signed application form.' };
}

function getToneVisual(tone: BadgeTone) {
  switch (tone) {
    case 'danger':
      return { bar: 'bg-red-500', iconBg: 'bg-red-50 text-red-600' };
    case 'warning':
      return { bar: 'bg-amber-500', iconBg: 'bg-amber-50 text-amber-600' };
    case 'success':
      return { bar: 'bg-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600' };
    case 'info':
      return { bar: 'bg-blue-500', iconBg: 'bg-blue-50 text-blue-600' };
    default:
      return { bar: 'bg-slate-400', iconBg: 'bg-slate-100 text-slate-600' };
  }
}

function getFeedbackStatusConfig(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === 'resolved') {
    return { label: 'Resolved', tone: 'success' as const };
  }

  if (normalized === 'revised') {
    return { label: 'Updated', tone: 'warning' as const };
  }

  return { label: 'Needs review', tone: 'danger' as const };
}

function getNotificationRoute(item: StudentNotification) {
  if (item.route) {
    return {
      href: item.route,
      label: item.actionLabel ?? 'Open update'
    };
  }

  if (item.type === 'feedback') {
    return {
      href: '/students/faculty-feedback',
      label: 'Open feedback'
    };
  }

  if (item.type === 'deadline' || item.type === 'schedule') {
    return {
      href: '/students/schedule',
      label: 'Open schedule'
    };
  }

  if (item.type === 'approval') {
    return {
      href: '/students/project-files',
      label: 'Open files'
    };
  }

  return {
    href: '/students/project-overview',
    label: 'Open project'
  };
}

function buildFallbackWorkflow(
  milestones: StudentDashboardData['milestones']
): DashboardWorkflowStep[] {
  const steps = milestones.map((item, index) => {
    const normalizedStatus = item.status.toLowerCase();
    
    let uiStatus: WorkflowStatus = 'pending';
    if (normalizedStatus === 'completed' || normalizedStatus === 'approved') {
      uiStatus = 'completed';
    } else if (
      normalizedStatus === 'ongoing' ||
      normalizedStatus === 'in_progress' ||
      normalizedStatus === 'needs_revision' ||
      normalizedStatus === 'under_review' ||
      normalizedStatus === 'current'
    ) {
      uiStatus = 'current';
    } else if (normalizedStatus === 'delayed' || normalizedStatus === 'overdue') {
      uiStatus = 'delayed';
    }

    return {
      id: item.id,
      key: `phase-${index + 1}`,
      title: item.title,
      summary: item.summary,
      status: uiStatus,
      dateLabel: item.dateLabel,
      route: item.route,
      actionLabel: item.actionLabel
    };
  });

  // Ensure there is at least one "current" step if the workflow isn't fully completed
  const hasCurrentStep = steps.some(step => step.status === 'current' || step.status === 'delayed');
  if (!hasCurrentStep) {
    const firstPendingIndex = steps.findIndex(step => step.status === 'pending');
    if (firstPendingIndex !== -1) {
      steps[firstPendingIndex].status = 'current';
    }
  }

  return steps;
}

function Badge({
  label,
  tone,
  icon
}: {
  label: string;
  tone?: BadgeTone;
  icon?: string;
}) {
  return (
    <span className={`ui-badge ${tone ? `is-${tone}` : ''}`}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function EmptyState({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <i className={`fas ${icon}`} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const realGroup = data.group.id
    ? {
        id: data.group.id,
        title: data.group.groupName,
        projectTitle: data.project.title,
        leader: data.group.leaderName,
        allowMemberSubmission: data.group.allowMemberSubmission ?? false
      }
    : null;

  const realNotifications = useMemo(
    () =>
      (data.notifications || []).map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        status: notification.read ? 'READ' : 'UNREAD',
        createdAt: notification.created_at
      })),
    [data.notifications]
  );

  const projectId = data.project.project_id || data.project.id;
  const [activities, setActivities] = useState<ApiAcademicActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!projectId) {
      setIsLoadingActivities(false);
      return;
    }

    setIsLoadingActivities(true);
    fetchAcademicActivities(projectId)
      .then((items) => {
        if (!cancelled) {
          setActivities(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActivities([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingActivities(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const recentActivities = useMemo(
    () =>
      [...activities]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 3),
    [activities]
  );

  // Surfaces whichever defense-application stage is currently relevant — the
  // first one the group has actually touched, so a Concept-stage project
  // doesn't show a premature "Not Uploaded" badge for Proposal/Final.
  const defenseApplicationStatus = useMemo(() => {
    const checkpoints = data.milestoneCheckpoints || [];

    for (const stage of DEFENSE_APPLICATION_STAGES) {
      const checkpoint = checkpoints.find((item) => item.key === stage.key);

      if (checkpoint && checkpoint.status !== 'PENDING') {
        return { label: stage.label, status: checkpoint.status };
      }
    }

    const firstStageCheckpoint = checkpoints.find((item) =>
      DEFENSE_APPLICATION_STAGES.some((stage) => stage.key === item.key)
    );

    if (!firstStageCheckpoint) {
      return null;
    }

    const stage = DEFENSE_APPLICATION_STAGES.find((item) => item.key === firstStageCheckpoint.key);
    return stage ? { label: stage.label, status: firstStageCheckpoint.status } : null;
  }, [data.milestoneCheckpoints]);

  const workflow = useMemo<DashboardWorkflowStep[]>(
    () => (data.dashboard?.workflow?.length ? data.dashboard.workflow : buildFallbackWorkflow(data.milestones)),
    [data.dashboard?.workflow, data.milestones]
  );

  const snapshotAt = data.dashboard?.snapshotAt ?? data.project.updated_at ?? data.profile.updated_at;
  const snapshotTimestamp = useMemo(() => {
    const parsed = new Date(snapshotAt).getTime();
    return Number.isFinite(parsed) ? parsed : Date.now();
  }, [snapshotAt]);

  const sortedSchedules = useMemo(
    () =>
      [...data.schedules].sort(
        (left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime()
      ),
    [data.schedules]
  );

  const upcomingSchedules = useMemo(
    () => sortedSchedules.filter((item) => new Date(item.startDate).getTime() >= snapshotTimestamp),
    [snapshotTimestamp, sortedSchedules]
  );

  const nextSchedule = upcomingSchedules[0] ?? null;
  const schedulePreview = upcomingSchedules.slice(0, 3);
  const recentUploads = useMemo(() => sortByDateDesc(data.documents).slice(0, 3), [data.documents]);
  const latestSubmission = useMemo(() => sortByDateDesc(data.documents)[0] ?? null, [data.documents]);
  const revisionFiles = useMemo(
    () => sortByDateDesc(data.documents.filter((item) => item.reviewStatus === 'Needs Revision' && !item.isSuperseded)).slice(0, 2),
    [data.documents]
  );
  const pendingReviewFiles = useMemo(
    () => sortByDateDesc(data.documents.filter((item) => item.reviewStatus === 'Pending Review')).slice(0, 2),
    [data.documents]
  );
  const recentFeedback = useMemo(() => sortByDateDesc(data.feedback).slice(0, 2), [data.feedback]);
  const latestFeedback = recentFeedback[0] ?? null;
  const mergedNotifications = useMemo(() => {
    const combined: any[] = [];
    if (realNotifications.length > 0) {
      realNotifications.forEach(notif => {
        combined.push({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          priority: notif.type === 'warning' || notif.type === 'danger' ? 'high' : 'normal',
          read: notif.status === 'READ',
          dateLabel: new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          route: '/students/notifications',
          timestamp: new Date(notif.createdAt).getTime()
        } as any);
      });
    }
    return combined.sort((a, b) => {
      const timeA = a.timestamp || new Date(a.dateLabel + ' ' + new Date().getFullYear()).getTime();
      const timeB = b.timestamp || new Date(b.dateLabel + ' ' + new Date().getFullYear()).getTime();
      return timeB - timeA;
    });
  }, [realNotifications]);

  const recentNotifications = useMemo(() => mergedNotifications.slice(0, 2), [mergedNotifications]);

  const approvedCount = data.documents.filter((item) => item.reviewStatus === 'Approved').length;
  const pendingCount = data.documents.filter((item) => item.reviewStatus === 'Pending Review').length;
  const revisionCount = data.documents.filter((item) => item.reviewStatus === 'Needs Revision' && !item.isSuperseded).length;
  const unreadFeedbackCount = data.feedback.filter((item) => item.unread).length;
  const unreadNotificationsCount = mergedNotifications.filter((item) => !item.read).length;
  const highPriorityNotificationCount = mergedNotifications.filter(
    (item) => !item.read && item.priority === 'high'
  ).length;
  const overdueCount = sortedSchedules.filter((item) => {
    const scheduleTimestamp = new Date(item.startDate).getTime();
    return scheduleTimestamp < snapshotTimestamp && item.status.toLowerCase() !== 'completed';
  }).length;
  const dueSoonCount = upcomingSchedules.filter((item) => {
    const dayDifference = Math.ceil(
      (new Date(item.startDate).getTime() - snapshotTimestamp) / (1000 * 60 * 60 * 24)
    );

    return dayDifference <= 7;
  }).length;

  const currentWorkflowIndex = workflow.findIndex(
    (item) => item.status === 'current' || item.status === 'delayed'
  );
  const currentWorkflowStep =
    (currentWorkflowIndex >= 0 ? workflow[currentWorkflowIndex] : null) ??
    workflow.find((item) => item.status === 'pending') ??
    workflow[workflow.length - 1] ??
    null;
  const nextWorkflowStep =
    workflow.find(
      (item, index) =>
        index > Math.max(currentWorkflowIndex, -1) &&
        (item.status === 'pending' || item.status === 'delayed')
    ) ??
    workflow.find((item) => item.status === 'pending' || item.status === 'delayed') ??
    null;
  const completedWorkflowCount = workflow.filter((item) => item.status === 'completed').length;
  const delayedWorkflowCount = workflow.filter((item) => item.status === 'delayed').length;
  // A failed defense flags its milestone NEEDS_REVISION, but buildFallbackWorkflow
  // maps that to the plain 'current' workflow status (not 'delayed', which reads
  // as a missed deadline) — so this needs its own count to actually surface it.
  const redefenseCount = data.milestones.filter((m) => m.status === 'NEEDS_REVISION').length;
  const currentPhaseTitle = currentWorkflowStep?.title ?? data.project.currentMilestone;
  const currentPhaseSummary =
    currentWorkflowStep?.summary ??
    'Your project is active and ready for the next academic review step.';

  const projectStatusTone = getStatusTone(data.project.status);

  // Dynamic progress calculation using checkpoints for granular tracking, fallback to milestones
  const totalCheckpoints = data.milestoneCheckpoints?.length || 0;
  const completedCheckpoints = data.milestoneCheckpoints?.filter(cp => cp.status === 'COMPLETED').length || 0;
  
  const calculatedProgress = totalCheckpoints > 0 
    ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
    : Math.round((completedWorkflowCount / Math.max(workflow.length, 1)) * 100);
    
  const displayProgress = data.project.progressPercentage || calculatedProgress;

  const [animatedProgress, setAnimatedProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(displayProgress);
    }, 300);
    return () => clearTimeout(timer);
  }, [displayProgress]);

  const summaryCards = [
    {
      id: 'progress',
      label: 'Overall progress',
      value: `${displayProgress}%`,
      note: totalCheckpoints > 0 
        ? `${completedCheckpoints} of ${totalCheckpoints} checkpoints completed` 
        : `${completedWorkflowCount} of ${workflow.length} phases completed`
    },
    {
      id: 'next-milestone',
      label: 'Next milestone',
      value: nextWorkflowStep?.title ?? 'Final review preparation',
      note: nextWorkflowStep?.dateLabel ?? 'Awaiting schedule confirmation'
    },
    {
      id: 'next-event',
      label: 'Next activity',
      value: nextSchedule?.title ?? 'No upcoming activity',
      note: nextSchedule
        ? `${nextSchedule.startDateLabel} | ${nextSchedule.time}`
        : 'Schedule updates will appear here once confirmed.'
    },
    {
      id: 'repository',
      label: 'Repository status',
      value: data.project.repositoryStatus,
      note:
        data.project.technologyTransferStatus ??
        data.technologyTransfer.transferabilityStatus ??
        'Waiting for archive endorsement.'
    }
  ];

  const priorityTasks = useMemo<PriorityTask[]>(() => {
    const tasks: PriorityTask[] = [];

    const delayedStep = workflow.find((item) => item.status === 'delayed');
    if (delayedStep) {
      tasks.push({
        id: `delayed-${delayedStep.id}`,
        title: delayedStep.title,
        label: 'Overdue',
        tone: 'danger',
        description: 'This milestone is past its due date and has not been marked complete.',
        href: delayedStep.route,
        actionLabel: 'Open Milestones',
        meta: delayedStep.dateLabel,
        icon: 'fa-triangle-exclamation'
      });
    }

    const redefenseMilestone = data.milestones.find((m) => m.status === 'NEEDS_REVISION');
    if (redefenseMilestone) {
      tasks.push({
        id: `redefense-${redefenseMilestone.id}`,
        title: redefenseMilestone.title,
        label: 'Redefense Required',
        tone: 'danger',
        description: "Your panel did not pass this defense — check the chair's decision and adviser feedback before your next attempt.",
        href: '/students/faculty-feedback',
        actionLabel: 'Review Feedback',
        meta: redefenseMilestone.dateLabel,
        icon: 'fa-rotate-left'
      });
    }

    if (revisionFiles[0]) {
      tasks.push({
        id: `revision-${revisionFiles[0].id}`,
        title: `Revise ${getProjectFileCategoryLabel(revisionFiles[0].category)}`,
        label: 'Needs Revision',
        tone: 'danger',
        description: 'A submitted file still needs updates before the next review cycle can move forward.',
        href: '/students/project-files',
        actionLabel: 'Open Project Files',
        meta: revisionFiles[0].uploadDateLabel,
        icon: 'fa-rotate-right'
      });
    }

    if (latestFeedback?.unread) {
      tasks.push({
        id: `feedback-${latestFeedback.id}`,
        title: latestFeedback.title,
        label: 'Adviser Feedback',
        tone: getFeedbackStatusConfig(latestFeedback.status).tone,
        description: `${latestFeedback.facultyName} added a note that should be acknowledged before the next checkpoint.`,
        href: '/students/faculty-feedback',
        actionLabel: 'Review Feedback',
        meta: latestFeedback.dateLabel,
        icon: 'fa-comments'
      });
    }

    if (nextSchedule) {
      tasks.push({
        id: `schedule-${nextSchedule.id}`,
        title: nextSchedule.title,
        label: nextSchedule.type,
        tone:
          nextSchedule.type.toLowerCase().includes('deadline') ||
          nextSchedule.type.toLowerCase().includes('defense')
            ? 'warning'
            : 'neutral',
        description: createExcerpt(
          `${nextSchedule.startDateLabel} | ${nextSchedule.time} | ${nextSchedule.location}`,
          88
        ),
        href: '/students/schedule',
        actionLabel: 'Open Schedule',
        meta: nextSchedule.startDateLabel,
        icon: 'fa-calendar-check'
      });
    }

    return tasks.slice(0, 3);
  }, [data.milestones, latestFeedback, nextSchedule, revisionFiles, workflow]);

  const attentionCount =
    revisionCount + highPriorityNotificationCount + dueSoonCount + overdueCount + unreadFeedbackCount + delayedWorkflowCount + redefenseCount;
  const currentPhaseTone = getShellToneFromWorkflowStatus(currentWorkflowStep?.status ?? 'current');
  const attentionTone = getAttentionShellTone({
    attentionCount,
    overdueCount,
    dueSoonCount,
    highPriorityNotificationCount,
    unreadFeedbackCount,
    revisionCount,
    redefenseCount
  });
  const attentionLabel = attentionCount
    ? `${attentionCount} item${attentionCount === 1 ? '' : 's'} need attention`
    : 'On track';
  const currentPhaseToneUi = getShellToneUi(currentPhaseTone);
  const attentionToneUi = getShellToneUi(attentionTone);

  // "Not assigned" reads poorly as a "current focus" — swap in an actionable
  // message once there's genuinely no workflow step yet, instead of echoing
  // whatever placeholder the raw project record happens to hold.
  const hasAssignedFocus = Boolean(currentWorkflowStep) || Boolean(
    data.project.currentMilestone &&
      !['not assigned', 'n/a', ''].includes(data.project.currentMilestone.trim().toLowerCase())
  );
  const focusTitle = hasAssignedFocus ? currentPhaseTitle : 'Milestones not set up yet';
  const focusSummary = hasAssignedFocus
    ? currentPhaseSummary
    : "Your adviser hasn't initialized your project workflow yet. Check the Milestones page for updates.";
  const focusRoute = currentWorkflowStep?.route ?? '/students/milestones';
  const focusActionLabel = hasAssignedFocus
    ? (currentWorkflowStep?.actionLabel ?? 'Continue Phase')
    : 'View Milestones';

  const progressRingColors = (() => {
    switch (currentPhaseToneUi.tone) {
      case 'success':
        return { from: '#34D399', to: '#047857', glow: 'bg-emerald-500/10' };
      case 'danger':
        return { from: '#F87171', to: '#B91C1C', glow: 'bg-red-500/10' };
      case 'warning':
        return { from: '#FBBF24', to: '#B45309', glow: 'bg-amber-500/10' };
      default:
        return { from: '#60A5FA', to: '#003A8F', glow: 'bg-blue-500/10' };
    }
  })();
  const workspaceHeroActions = [
    {
      id: 'continue-phase',
      href: currentWorkflowStep?.route ?? '/students/milestones',
      label: currentWorkflowStep?.actionLabel ?? 'Continue Phase',
      meta: currentPhaseTitle,
      icon: currentPhaseToneUi.icon,
      tone: currentPhaseToneUi.tone
    },
    {
      id: 'manage-files',
      href: '/students/project-files',
      label: revisionCount ? 'Resolve Revisions' : 'Manage Files',
      meta: revisionCount
        ? `${revisionCount} needs revision`
        : `${data.documents.length} tracked file${data.documents.length === 1 ? '' : 's'}`,
      icon: revisionCount ? 'fa-rotate-right' : 'fa-file-arrow-up',
      tone: revisionCount ? 'danger' : 'neutral'
    },
    {
      id: 'review-feedback',
      href: '/students/faculty-feedback',
      label: unreadFeedbackCount ? 'Read Feedback' : 'Faculty Notes',
      meta: unreadFeedbackCount
        ? `${unreadFeedbackCount} unread`
        : latestFeedback?.dateLabel ?? 'No new notes',
      icon: 'fa-comments',
      tone: unreadFeedbackCount ? 'warning' : 'neutral'
    }
  ];
  return (
    <>
      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Student Dashboard</span>
              </span>
            </div>
            <h1>Student Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="page-body student-dashboard-page">



        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Main Hero Card */}
          <article className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-[var(--surface)] backdrop-blur-xl p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] border border-[var(--border)] transition-all duration-300 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] hover:-translate-y-1">

            <div className="relative z-10 flex flex-col gap-5">
              {/* Header: Status and Badges */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                <span className="text-[11px] font-bold tracking-widest text-[var(--text-meta)] uppercase">Project Workspace</span>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${projectStatusTone === 'success' ? 'bg-emerald-100 text-emerald-700' : projectStatusTone === 'danger' ? 'bg-red-100 text-red-700' : projectStatusTone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {data.project.status}
                  </span>
                  <Badge label={attentionLabel} tone={attentionToneUi.tone} icon={attentionToneUi.icon} />
                </div>
              </div>

              {/* Title Block */}
              <div>
                {projectStatusTone !== 'success' || (realGroup && (realGroup.title === 'Pending Student Submission' || realGroup.title === 'Awaiting Adviser Approval' || realGroup.title === 'Pending Concept Presentation')) ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
                        <i className="fas fa-lock text-[var(--text-meta)]" aria-hidden="true"></i>
                        Project title pending approval
                      </h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 align-middle">
                        <i className="fas fa-clock"></i>
                        {realGroup?.title === 'Pending Student Submission'
                          ? 'Awaiting Title Submission'
                          : realGroup?.title === 'Pending Concept Presentation'
                            ? 'Pending Concept Presentation'
                            : 'Awaiting Adviser Approval'}
                      </span>
                    </div>
                    <p className="text-base text-[var(--muted)] max-w-2xl leading-relaxed">
                      Your project title will appear here once the concept proposal has been submitted and approved by your adviser and panel.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
                      {realGroup ? realGroup.projectTitle || realGroup.title : data.project.title}
                    </h2>
                    <p className="text-base text-[var(--muted)] max-w-3xl leading-relaxed">
                      {data.project.description ||
                        'Track academic progress, active deliverables, faculty guidance, and the next capstone commitments from one focused workspace.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--muted)]">
                <span className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm">
                  <i className="fas fa-hashtag text-[var(--text-meta)]" aria-hidden="true" />
                  {data.project.projectCode}
                </span>
                <span className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm">
                  <i className="fas fa-user-tie text-[var(--text-meta)]" aria-hidden="true" />
                  {data.project.adviser}
                </span>
                <span className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm">
                  <i className="fas fa-users text-[var(--text-meta)]" aria-hidden="true" />
                  {data.group.groupCode !== 'N/A' ? data.group.groupCode : data.group.groupName}
                </span>
                <span className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm">
                  <i className="fas fa-calendar-check text-[var(--text-meta)]" aria-hidden="true" />
                  {nextSchedule?.startDateLabel ?? 'No scheduled review'}
                </span>
              </div>

              {/* Primary Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {workspaceHeroActions.map((item) => {
                  let toneClasses = '';
                  let iconBgClass = '';
                  
                  if (item.tone === 'danger') {
                    toneClasses = 'border-red-200 bg-[var(--surface)] hover:border-red-300 hover:shadow-md hover:shadow-red-50 text-[var(--text)]';
                    iconBgClass = 'bg-red-50 text-red-600';
                  } else if (item.tone === 'warning') {
                    toneClasses = 'border-amber-200 bg-[var(--surface)] hover:border-amber-300 hover:shadow-md hover:shadow-amber-50 text-[var(--text)]';
                    iconBgClass = 'bg-amber-50 text-amber-600';
                  } else if (item.tone === 'success') {
                    toneClasses = 'border-emerald-200 bg-[var(--surface)] hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-50 text-[var(--text)]';
                    iconBgClass = 'bg-emerald-50 text-emerald-600';
                  } else {
                    toneClasses = 'border-blue-200 bg-[var(--surface)] hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 text-[var(--text)]';
                    iconBgClass = 'bg-blue-50 text-blue-600';
                  }

                  return (
                    <Link prefetch={false} key={item.id} href={item.href} className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 transition-all ${toneClasses}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
                        <i className={`fas ${item.icon} text-[13px]`} aria-hidden="true" />
                      </div>
                      <div className="flex flex-col flex-grow">
                        <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-0.5">{item.meta}</span>
                        <span className="text-sm font-bold text-[var(--text)] leading-tight">{item.label}</span>
                      </div>
                      <i className="fas fa-chevron-right text-[var(--text-meta)] group-hover:text-blue-600 transition-colors text-xs" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>

              {/* Project Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 mt-1 border-t border-[var(--border)]">
                {summaryCards.map((item) => (
                  <div key={item.id} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">{item.label}</span>
                    <strong className="text-base font-bold text-[var(--text)] leading-tight">{item.value}</strong>
                    <span className="text-[11px] text-[var(--muted)] line-clamp-1">{item.note}</span>
                  </div>
                ))}
              </div>

            </div>
          </article>

          {/* Side Progress Card */}
          <div className="lg:col-span-1 h-full">
            <article className="h-full relative overflow-hidden rounded-2xl bg-[var(--surface)] backdrop-blur-xl p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] border border-[var(--border)] flex flex-col transition-all duration-300 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] hover:-translate-y-1">
               <div className="flex items-center justify-between w-full mb-2">
                 <h3 className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Progress Monitoring</h3>
                 <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
               </div>
               
               {/* Center content wrapper */}
               <div className="flex flex-col items-center justify-center flex-grow py-4">
                 {/* Premium Progress Orb */}
                 <div className="relative flex items-center justify-center h-44 w-44 my-4">
                   {/* Outer glow aura */}
                   <div className={`absolute inset-0 rounded-full blur-3xl animate-pulse pointer-events-none ${progressRingColors.glow}`} />

                   {/* Background decoration ring */}
                   <div className="absolute inset-3 border border-dashed border-[var(--border)] rounded-full animate-[spin_40s_linear_infinite] opacity-60 pointer-events-none" />

                   <svg className="relative z-10 w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                     <defs>
                       <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                         <stop offset="0%" stopColor={progressRingColors.from} />
                         <stop offset="100%" stopColor={progressRingColors.to} />
                       </linearGradient>
                       <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                         <feGaussianBlur stdDeviation="1" result="blur" />
                         <feComposite in="SourceGraphic" in2="blur" operator="over" />
                       </filter>
                     </defs>
                     {/* Track */}
                     <path
                       className="text-[var(--border)]"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="1.5"
                     />
                     {/* Progress — only rendered once there's something to show; a
                         zero-length dash with a round linecap otherwise paints a
                         stray dot at the arc's start point. */}
                     {animatedProgress > 0 ? (
                       <path
                         className="transition-all duration-1000 ease-out"
                         strokeDasharray={`${animatedProgress}, 100`}
                         d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                         fill="none"
                         stroke="url(#progressGradient)"
                         strokeWidth="3"
                         strokeLinecap="round"
                         filter="url(#glow)"
                       />
                     ) : null}
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center z-20">
                     <span className="text-4xl font-black bg-gradient-to-br from-[#3B82F6] to-[#003A8F] bg-clip-text text-transparent drop-shadow-sm tracking-tighter">
                       {animatedProgress}%
                     </span>
                     <span className="text-[9px] font-extrabold text-[var(--muted)] uppercase tracking-[0.2em] mt-1">Completed</span>
                     {totalCheckpoints > 0 ? (
                       <span className="text-[10px] font-bold text-[var(--muted)] mt-1.5">
                         {completedCheckpoints} of {totalCheckpoints} checkpoints
                       </span>
                     ) : null}
                   </div>
                 </div>
               </div>

               {/* Upgraded Current Focus Block */}
               <div className="flex flex-col w-full bg-[var(--surface-alt)] p-5 rounded-2xl border border-[var(--border)] mt-auto relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#3B82F6] to-[#003A8F]" />
                 <div className="flex items-center gap-2 mb-2">
                   <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-blue-500/10 text-[#3B82F6]">
                     <i className="fas fa-crosshairs text-[10px]" aria-hidden="true"></i>
                   </div>
                   <span className="text-[10px] font-extrabold text-[var(--primary)] uppercase tracking-widest">
                     Current Focus
                   </span>
                 </div>
                 <p className="text-[15px] font-black text-[var(--text)] leading-tight mb-1">{focusTitle}</p>
                 <span className="text-[11px] text-[var(--muted)] font-medium leading-relaxed line-clamp-2">{focusSummary}</span>
                 <Link
                   prefetch={false}
                   href={focusRoute}
                   className="bg-gradient-to-r from-[#003A8F] to-[#1E40AF] hover:from-[#002c6b] hover:to-[#003A8F] transition-all text-white text-[12px] font-bold py-2.5 px-4 rounded-xl mt-4 w-full flex items-center justify-center gap-2 shadow-md shadow-blue-900/20 active:scale-[0.98]"
                 >
                   <i className="fas fa-file-alt"></i> {focusActionLabel}
                 </Link>
               </div>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Priority Actions</span>
              <h3 className="text-lg font-bold text-[var(--text)]">What needs your attention</h3>
            </div>
            <Badge label={attentionLabel} tone={attentionToneUi.tone} icon={attentionToneUi.icon} />
          </div>

          {priorityTasks.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {priorityTasks.map((task) => {
                const visual = getToneVisual(task.tone);

                return (
                  <Link
                    prefetch={false}
                    key={task.id}
                    href={task.href}
                    className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 pl-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className={`absolute top-0 left-0 h-full w-1 ${visual.bar}`} aria-hidden="true" />
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${visual.iconBg}`}>
                        <i className={`fas ${task.icon || 'fa-circle-exclamation'} text-xs`} aria-hidden="true" />
                      </span>
                      <Badge label={task.label} tone={task.tone} />
                    </div>
                    <strong className="text-sm font-bold text-[var(--text)] leading-tight line-clamp-1">{task.title}</strong>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed line-clamp-2">{task.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      {task.meta ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-meta)]">{task.meta}</span>
                      ) : <span />}
                      <span className="text-[11px] font-bold text-[#003A8F] group-hover:text-blue-700 transition-colors flex items-center gap-1">
                        {task.actionLabel} <i className="fas fa-arrow-right text-[9px]" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <i className="fas fa-champagne-glasses text-sm" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <strong className="text-[13px] font-bold text-[var(--text)]">You&apos;re all caught up</strong>
                <span className="text-[11px] text-[var(--muted)]">No pending revisions, unread feedback, or upcoming deadlines need action right now.</span>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Column 1: Milestone Pipeline & Submission Health */}
          <div className="flex flex-col gap-5">
            <article className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] p-5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Milestone Pipeline</span>
                  <h3 className="text-lg font-bold text-[var(--text)]">Proposal to defense</h3>
                </div>
                <Link prefetch={false} className="text-sm font-semibold text-[#003A8F] hover:text-blue-700 transition-colors" href="/students/milestones">
                  Open milestones
                </Link>
              </div>
              {workflow.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {workflow.map((item, index) => {
                    const workflowStatus = getWorkflowStatusConfig(item.status);

                    return (
                      <article key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] ${item.status === 'completed' ? 'bg-[var(--surface-alt)]' : item.status === 'current' ? 'bg-blue-50/40 border-blue-100 shadow-sm' : 'bg-[var(--surface)]'}`}>
                        <span className={`flex items-center justify-center h-7 w-7 rounded-full font-bold text-xs shrink-0 ${item.status === 'current' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-[var(--muted)]'}`}>{index + 1}</span>
                        <div className="flex flex-col flex-grow">
                          <strong className="text-[13px] font-bold text-[var(--text)] leading-tight">{item.title}</strong>
                          <small className="text-[11px] text-[var(--muted)] font-medium">{item.summary}</small>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge label={workflowStatus.label} tone={workflowStatus.tone} />
                          <small className="text-[9px] font-bold text-[var(--text-meta)] uppercase tracking-wider">{item.dateLabel}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No milestones assigned"
                  description="Your academic workflow has not been initialized yet. Check back later."
                  icon="fa-route"
                />
              )}
            </article>

            <article className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] p-5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-1">
              <div className="flex flex-col gap-1 mb-5">
                <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Submission Health</span>
                <h4 className="text-lg font-bold text-[var(--text)]">Review status overview</h4>
              </div>

              <div className="flex flex-col gap-3.5 mb-5">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-emerald-700">Approved</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 text-xs rounded-full border border-emerald-100">{approvedCount}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--surface-alt)] rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(approvedCount / Math.max(data.documents.length, 1)) * 100}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-amber-700">Pending Review</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 text-xs rounded-full border border-amber-100">{pendingCount}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--surface-alt)] rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(pendingCount / Math.max(data.documents.length, 1)) * 100}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-red-700">Needs Revision</span>
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 text-xs rounded-full border border-red-100">{revisionCount}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--surface-alt)] rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(revisionCount / Math.max(data.documents.length, 1)) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col items-center justify-center gap-1 bg-amber-50/80 hover:bg-amber-50 transition-colors rounded-xl p-3 border border-amber-100">
                  <strong className="text-xl font-black text-amber-700">{dueSoonCount}</strong>
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest text-center leading-tight">Due<br/>soon</span>
                </div>
                <div className={`flex flex-col items-center justify-center gap-1 transition-colors rounded-xl p-3 border ${overdueCount ? 'bg-red-50/80 hover:bg-red-50 border-red-200' : 'bg-[var(--surface-alt)] border-[var(--border)]'}`}>
                  <strong className={`text-xl font-black ${overdueCount ? 'text-red-700' : 'text-[var(--text)]'}`}>{overdueCount}</strong>
                  <span className={`text-[9px] font-bold uppercase tracking-widest text-center leading-tight ${overdueCount ? 'text-red-600' : 'text-[var(--muted)]'}`}>Overdue</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 bg-blue-50/80 hover:bg-blue-50 transition-colors rounded-xl p-3 border border-blue-100">
                  <strong className="text-xl font-black text-blue-700">{unreadFeedbackCount}</strong>
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest text-center leading-tight">New<br/>feedback</span>
                </div>
              </div>
            </article>
          </div>

          {/* Column 2: Upcoming Activity & Faculty Feedback */}
          <div className="flex flex-col gap-5">
            <article className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] p-5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Upcoming Activity</span>
                  <h4 className="text-lg font-bold text-[var(--text)]">Next events</h4>
                </div>
                <Link prefetch={false} className="text-sm font-semibold text-[#003A8F] hover:text-blue-700 transition-colors" href="/students/schedule">
                  Open schedule
                </Link>
              </div>
              {schedulePreview.length ? (
                <div className="flex flex-col gap-2.5">
                  {schedulePreview.map((item) => (
                    <article key={item.id} className="flex flex-col gap-2 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] hover:bg-[var(--surface-alt)] transition-colors">
                      <div className="flex items-start justify-between">
                        <strong className="text-[13px] font-bold text-[var(--text)] leading-tight">{item.title}</strong>
                        <Badge
                          label={item.type}
                          tone={
                            item.type.toLowerCase().includes('deadline') ||
                            item.type.toLowerCase().includes('defense')
                              ? 'warning'
                              : 'neutral'
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] text-[var(--muted)] font-bold uppercase tracking-wide">
                        <span className="flex items-center gap-1.5"><i className="fas fa-calendar-day w-3.5 text-center text-[var(--text-meta)]" /> {item.startDateLabel}</span>
                        <span className="flex items-center gap-1.5"><i className="fas fa-clock w-3.5 text-center text-[var(--text-meta)]" /> {item.time}</span>
                        <span className="flex items-center gap-1.5"><i className="fas fa-location-dot w-3.5 text-center text-[var(--text-meta)]" /> {item.location}</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5 line-clamp-2">{createExcerpt(item.description, 116)}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming activity"
                  description="Confirmed consultations, defenses, and academic events will appear here."
                  icon="fa-calendar-check"
                />
              )}
            </article>

            <article className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] p-5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Faculty Feedback</span>
                  <h3 className="text-lg font-bold text-[var(--text)]">Recent comments</h3>
                </div>
                <Link prefetch={false} className="text-sm font-semibold text-[#003A8F] hover:text-blue-700 transition-colors" href="/students/faculty-feedback">
                  Open feedback
                </Link>
              </div>
              {recentFeedback.length ? (
                <div className="flex flex-col gap-3">
                  {recentFeedback.map((item) => {
                    const statusConfig = getFeedbackStatusConfig(item.status);

                    return (
                      <article
                        key={item.id}
                        className={`flex flex-col gap-3 p-4 rounded-xl border ${item.unread ? 'bg-blue-50/40 border-blue-100 shadow-sm' : 'bg-[var(--surface)] border-[var(--border)] shadow-sm'} transition-colors group cursor-pointer`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col">
                            <strong className="text-[13px] font-bold text-[var(--text)] group-hover:text-[#003A8F] transition-colors leading-tight">{item.title}</strong>
                            <small className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
                              {item.facultyName} <span className="mx-1 text-[var(--muted)]">•</span> {item.dateLabel}
                            </small>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            <Badge label={item.mode} tone={item.mode === 'Adviser' ? 'warning' : 'neutral'} />
                            <Badge label={statusConfig.label} tone={statusConfig.tone} />
                          </div>
                        </div>
                        <div className="relative bg-[var(--surface-alt)] p-3 rounded-lg border border-[var(--border)]">
                           <i className="fas fa-quote-left absolute top-2.5 left-2.5 text-[var(--muted)] text-lg" aria-hidden="true" />
                           <p className="text-[11px] text-[var(--muted)] font-medium italic relative z-10 pl-6 leading-relaxed line-clamp-3">
                             {createExcerpt(item.content, 156)}
                           </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No feedback yet"
                  description="Adviser and panel comments will appear here after the next review session."
                  icon="fa-comments"
                />
              )}
            </article>
          </div>

          {/* Column 3: Document Submissions & Team */}
          <div className="flex flex-col gap-5">
            <article className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] p-5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Document Submissions</span>
                  <h3 className="text-lg font-bold text-[var(--text)]">Files &amp; activity log</h3>
                </div>
                <Link prefetch={false} className="text-sm font-semibold text-[#003A8F] hover:text-blue-700 transition-colors" href="/students/project-files">
                  Open submissions
                </Link>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <i className="fas fa-file-lines text-[9px] text-[var(--text-meta)]" aria-hidden="true" />
                <span className="text-[9px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Project Documents</span>
              </div>
              {recentUploads.length ? (
                <div className="flex flex-col gap-2 mb-4">
                  {recentUploads.slice(0, 2).map((item) => (
                    <article key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 text-blue-600 shrink-0 transition-transform group-hover:scale-105">
                          <i className="fas fa-file-lines text-sm" aria-hidden="true" />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <strong className="text-[12px] font-bold text-[var(--text)] group-hover:text-[#003A8F] transition-colors leading-tight truncate">{item.fileName}</strong>
                          <small className="text-[9px] font-semibold text-[var(--muted)] uppercase tracking-wider">{getProjectFileCategoryLabel(item.category)}</small>
                        </div>
                      </div>
                      <Badge label={item.reviewStatus} tone={getStatusTone(item.reviewStatus)} />
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-[11px] text-[var(--muted)] leading-relaxed">
                  No recent uploads. Latest file activity will appear here once your group submits project documents.
                </p>
              )}

              <div className="border-t border-[var(--border)] mb-4" />

              <div className="flex items-center gap-1.5 mb-2">
                <i className="fas fa-award text-[9px] text-[var(--text-meta)]" aria-hidden="true" />
                <span className="text-[9px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Academic Activities &amp; Evidence</span>
              </div>

              {defenseApplicationStatus ? (() => {
                const statusConfig = getDefenseEvidenceStatusConfig(defenseApplicationStatus.status);

                return (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0">
                        <i className="fas fa-file-signature text-sm" aria-hidden="true" />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <strong className="text-[12px] font-bold text-[var(--text)] leading-tight">
                          Defense Application ({defenseApplicationStatus.label})
                        </strong>
                        <span className="text-[10px] text-[var(--muted)] font-medium leading-snug">{statusConfig.hint}</span>
                      </div>
                    </div>
                    <Badge label={statusConfig.label} tone={statusConfig.tone} />
                  </div>
                );
              })() : null}

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-4 text-[11px] font-semibold text-[var(--muted)]">
                  Loading activity log...
                </div>
              ) : recentActivities.length ? (
                <div className="flex flex-col gap-2">
                  {recentActivities.slice(0, 2).map((activity) => (
                    <article key={activity.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)]">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                        <i className={`fas ${activity.markAsAchievement ? 'fa-award' : 'fa-diagram-project'} text-sm`} aria-hidden="true" />
                      </span>
                      <div className="flex flex-col flex-grow min-w-0">
                        <strong className="text-[12px] font-bold text-[var(--text)] leading-tight truncate">{activity.eventName}</strong>
                        <small className="text-[9px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                          {activity.activityType} &bull; {formatIsoDateLabel(activity.eventDate || activity.createdAt)}
                        </small>
                      </div>
                      {activity.markAsAchievement ? <Badge label="Achievement" tone="warning" icon="fa-award" /> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  No activities logged yet. Awards, presentations, and other academic activities you log will appear here.
                </p>
              )}
            </article>

            <article className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] p-6 hover:shadow-[0_24px_48px_rgba(15,23,42,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-5 pb-4 border-b border-[var(--border)]">
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 text-[11px] font-bold text-[#003A8F] uppercase tracking-widest">
                    <i className="fas fa-users" aria-hidden="true" /> {data.group.groupCode !== 'N/A' ? data.group.groupCode : 'Project Team'}
                  </span>
                  <h3 className="text-xl font-extrabold text-[var(--text)] tracking-tight">{data.group.groupName}</h3>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {data.group.members.map((member) => (
                  <article
                    key={member.id}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                      member.isCurrent 
                        ? 'bg-blue-50/30 border-blue-200/60 shadow-sm hover:shadow-md hover:bg-blue-50/50' 
                        : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-alt)] hover:border-[var(--border-strong)] shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
                      <span className={`student-member-avatar flex items-center justify-center h-11 w-11 rounded-full font-bold text-sm uppercase tracking-wider shadow-inner ring-4 overflow-hidden ${
                        member.isCurrent 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white ring-blue-100/50' 
                          : 'bg-gradient-to-br from-slate-100 to-slate-200 text-[var(--text)] ring-slate-50'
                      }`}>
                        {member.profileImage ? (
                          <img src={member.profileImage} alt={member.fullName} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(member.fullName)
                        )}
                      </span>
                      {member.isLeader && (
                        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-[var(--border)] shadow-md z-10 transition-transform duration-300 group-hover:rotate-12">
                          <i className="fas fa-crown text-[10px] text-white drop-shadow-sm" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-grow justify-center">
                      <strong className={`text-[15px] font-extrabold leading-tight tracking-tight ${member.isCurrent ? 'text-blue-900' : 'text-[var(--text)]'}`}>
                        {member.fullName}
                      </strong>
                      <div className="flex items-center gap-2 mt-1">
                        <small className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-widest">
                          {member.studentId}
                        </small>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge
                        label={member.isLeader ? 'Leader' : 'Member'}
                        tone={member.isLeader ? 'warning' : 'neutral'}
                        icon={member.isLeader ? 'fa-crown' : 'fa-user'}
                      />
                      {member.isCurrent && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/80 px-2 py-1 rounded-md border border-emerald-200/50 shadow-sm">
                          <i className="fas fa-check-circle" /> You
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </>
  );
}
