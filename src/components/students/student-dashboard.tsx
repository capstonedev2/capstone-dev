'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useMemo, useState, useEffect } from 'react';
import type { StudentDashboardData } from '@/lib/services/student-workspace';

const CATEGORY_LABELS: Record<string, string> = {
  Proposal: 'Proposal',
  'Chapter 1': 'Chapter 1',
  'Chapter 2': 'Chapter 2',
  'Chapter 3': 'Chapter 3',
  'System Files': 'System Files',
  'Supporting Documents': 'Supporting Documents',
  'Presentation Files': 'Presentation Files',
  Certificates: 'Certificates',
  proposal: 'Proposal',
  'chapter-1': 'Chapter 1',
  'chapter-2': 'Chapter 2',
  'chapter-3': 'Chapter 3',
  'system-files': 'System Files',
  'supporting-documents': 'Supporting Documents',
  'presentation-files': 'Presentation Files',
  certificates: 'Certificates'
};

const DEFAULT_QUICK_LINKS = [
  {
    id: 'project-overview',
    label: 'View Project',
    href: '/students/project-overview',
    icon: 'fa-folder-open'
  },
  {
    id: 'project-files',
    label: 'Open Files',
    href: '/students/project-files',
    icon: 'fa-file-arrow-up'
  },
  {
    id: 'faculty-feedback',
    label: 'Open Feedback',
    href: '/students/faculty-feedback',
    icon: 'fa-comments'
  },
  {
    id: 'schedule',
    label: 'Open Schedule',
    href: '/students/schedule',
    icon: 'fa-calendar-check'
  }
] as const;

function canPollApi() {
  return (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'http:' || window.location.protocol === 'https:') &&
    window.navigator.onLine
  );
}

function isExpectedPollError(error: unknown) {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  ) || (
    error instanceof TypeError && (!canPollApi() || error.message === 'Failed to fetch')
  );
}

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
type DashboardQuickLink = {
  id: string;
  label: string;
  href: string;
  icon: string;
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
  const normalized = status.toLowerCase();

  if (
    ['approved', 'completed', 'resolved', 'confirmed', 'ready', 'ready for final library endorsement'].includes(
      normalized
    )
  ) {
    return 'success';
  }

  if (
    ['current', 'ongoing', 'in development', 'under review', 'upcoming', 'pending endorsement'].includes(
      normalized
    )
  ) {
    return 'warning';
  }

  if (
    ['needs revision', 'revision', 'delayed', 'high priority', 'overdue', 'needs action'].includes(normalized)
  ) {
    return 'danger';
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

function getNotificationShellTone(
  unreadNotificationsCount: number,
  highPriorityNotificationCount: number
): ShellTone {
  if (!unreadNotificationsCount) {
    return 'archived';
  }

  if (highPriorityNotificationCount) {
    return 'overdue';
  }

  return 'pending';
}

function getAttentionShellTone({
  attentionCount,
  overdueCount,
  dueSoonCount,
  highPriorityNotificationCount,
  unreadFeedbackCount,
  revisionCount
}: {
  attentionCount: number;
  overdueCount: number;
  dueSoonCount: number;
  highPriorityNotificationCount: number;
  unreadFeedbackCount: number;
  revisionCount: number;
}): ShellTone {
  if (!attentionCount) {
    return 'completed';
  }

  if (overdueCount || highPriorityNotificationCount) {
    return 'overdue';
  }

  if (revisionCount || unreadFeedbackCount) {
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
  return milestones.map((item, index) => ({
    id: item.id,
    key: `phase-${index + 1}`,
    title: item.title,
    summary: item.summary,
    status:
      item.status === 'completed'
        ? 'completed'
        : item.status === 'ongoing'
          ? 'current'
          : item.status === 'delayed'
            ? 'delayed'
            : 'pending',
    dateLabel: item.dateLabel,
    route: item.route,
    actionLabel: item.actionLabel
  }));
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
  const [realGroup, setRealGroup] = useState<any>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>({ status: 'Loading...' });
  const [accessRequested, setAccessRequested] = useState(false);
  const [isTogglingAccess, setIsTogglingAccess] = useState(false);

  const [realNotifications, setRealNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRealGroup() {
      try {
        let realStudentName = data.profile.fullName;
        
        try {
          const resAuth = await fetch('/api/auth/me');
          if (resAuth.ok) {
            const authData = await resAuth.json();
            if (authData.user && authData.user.name) {
              realStudentName = authData.user.name;
            }
          }
        } catch (e) {
          if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem('capstoneAuthUser');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.name) {
                realStudentName = parsed.name;
              }
            }
          }
        }
        
        if (!realStudentName && typeof window !== 'undefined') {
          try {
            const raw = window.localStorage.getItem('capstoneAuthUser');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.name) {
                realStudentName = parsed.name;
              }
            }
          } catch (e) {}
        }
        
        if (!realStudentName) {
          setDebugInfo({ status: 'Not logged in via API or Mock Storage' });
          return;
        }

        setDebugInfo({ status: 'Logged in as', name: realStudentName });

        const res = await fetch(`/api/groups?studentName=${encodeURIComponent(realStudentName)}`, { cache: 'no-store' });
        if (res.ok) {
          const groups = await res.json();
          setDebugInfo((prev: any) => ({ ...prev, groupsFound: groups.length }));
          if (groups.length > 0) {
            setRealGroup(groups[0]);
          }
        } else {
          setDebugInfo((prev: any) => ({ ...prev, groupFetchError: res.statusText }));
        }

        if (data.profile.user_id) {
          const notifRes = await fetch(`/api/notifications?userId=${encodeURIComponent(data.profile.user_id)}`, { cache: 'no-store' });
          if (notifRes.ok) {
            const notifs = await notifRes.json();
            setRealNotifications(notifs);
          }
        }

      } catch (e: any) {
        setDebugInfo({ status: 'Error during fetch', error: e.message });
        console.error('Failed to fetch student real group', e);
      }
    }
    fetchRealGroup();
  }, [data.profile.user_id, data.profile.fullName]);

  // Real-time polling for notifications
  useEffect(() => {
    if (!data.profile.user_id) return;

    let cancelled = false;
    let inFlightController: AbortController | null = null;

    const fetchNotifications = async () => {
      if (cancelled || inFlightController || !canPollApi()) {
        return;
      }

      const controller = new AbortController();
      inFlightController = controller;

      try {
        const notifRes = await fetch(`/api/notifications?userId=${encodeURIComponent(data.profile.user_id)}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        if (notifRes.ok) {
          const notifs = await notifRes.json();
          if (!cancelled) {
            setRealNotifications(notifs);
          }
        }
      } catch (e) {
        if (!isExpectedPollError(e)) {
          console.warn('Failed to poll dashboard notifications', e);
        }
      } finally {
        if (inFlightController === controller) {
          inFlightController = null;
        }
      }
    };

    const pollNotifications = () => {
      void fetchNotifications().catch((error) => {
        if (!isExpectedPollError(error)) {
          console.warn('Failed to poll dashboard notifications', error);
        }
      });
    };

    const intervalId = setInterval(pollNotifications, 5000);
    return () => {
      cancelled = true;
      inFlightController?.abort();
      clearInterval(intervalId);
    };
  }, [data.profile.user_id]);

  const handleSubmitTitle = async () => {
    if (!realGroup || !titleDraft.trim()) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: realGroup.id, 
          title: 'Awaiting Adviser Approval',
          projectTitle: titleDraft 
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setRealGroup(updated);
      }
    } catch (e) {
      console.error('Failed to update group title', e);
    }
  };

  const handleToggleMemberAccess = async () => {
    if (!realGroup) return;
    setIsTogglingAccess(true);
    try {
      const nextState = !realGroup.allowMemberSubmission;
      const res = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: realGroup.id, allowMemberSubmission: nextState })
      });
      if (res.ok) {
        setRealGroup({ ...realGroup, allowMemberSubmission: nextState });
      }
    } catch (e) {
      console.error('Failed to toggle member access', e);
    } finally {
      setIsTogglingAccess(false);
    }
  };

  const isLeader = realGroup && debugInfo?.name === realGroup.leader;
  const canSubmitTitle = isLeader || realGroup?.allowMemberSubmission;

  const quickLinks: DashboardQuickLink[] = data.dashboard?.quickLinks?.length
    ? data.dashboard.quickLinks
    : [...DEFAULT_QUICK_LINKS];

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
    () => sortByDateDesc(data.documents.filter((item) => item.reviewStatus === 'Needs Revision')).slice(0, 2),
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
  const revisionCount = data.documents.filter((item) => item.reviewStatus === 'Needs Revision').length;
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
  const currentPhaseTitle = currentWorkflowStep?.title ?? data.project.currentMilestone;
  const currentPhaseSummary =
    currentWorkflowStep?.summary ??
    'Your project is active and ready for the next academic review step.';

  const projectStatusTone = getStatusTone(data.project.status);

  const summaryCards = [
    {
      id: 'progress',
      label: 'Overall progress',
      value: `${data.project.progressPercentage}%`,
      note: `${completedWorkflowCount} of ${workflow.length} phases completed`
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

  const projectMeta = [
    {
      id: 'project-code',
      label: 'Project code',
      value: data.project.projectCode
    },
    {
      id: 'adviser',
      label: 'Adviser',
      value: data.project.adviser
    },
    {
      id: 'group',
      label: 'Group',
      value: data.group.groupName
    },
    {
      id: 'program',
      label: 'Program',
      value: data.project.program
    },
    {
      id: 'academic-year',
      label: 'Academic year',
      value: data.project.academicYear
    },
    {
      id: 'category',
      label: 'Category',
      value: data.project.category
    }
  ];

  const analyticsCards = [
    {
      id: 'submissions',
      icon: 'fa-file-lines',
      value: `${data.documents.length}`,
      label: 'Tracked submissions',
      badgeLabel: 'Active',
      note: latestSubmission
        ? `Latest: ${CATEGORY_LABELS[latestSubmission.category] ?? latestSubmission.category}`
        : 'No project file is recorded yet.',
      tone: 'info' as const
    },
    {
      id: 'revisions',
      icon: revisionCount ? 'fa-rotate-right' : 'fa-check-circle',
      value: `${revisionCount}`,
      label: 'Pending revisions',
      badgeLabel: revisionCount ? 'Needs Action' : 'Up to date',
      note: revisionFiles[0]
        ? createExcerpt(`${revisionFiles[0].fileName} still needs updates before the next review pass.`, 72)
        : 'No file is currently waiting for revision.',
      tone: revisionCount ? ('danger' as const) : ('neutral' as const)
    },
    {
      id: 'overdue',
      icon: overdueCount ? 'fa-triangle-exclamation' : 'fa-check-circle',
      value: `${overdueCount}`,
      label: 'Overdue items',
      badgeLabel: overdueCount ? 'Action Required' : 'On schedule',
      note: overdueCount
        ? 'Resolve delayed deadlines and missed confirmations as soon as possible.'
        : 'No overdue schedules are currently recorded.',
      tone: overdueCount ? ('danger' as const) : ('neutral' as const)
    },
    {
      id: 'alerts',
      icon: 'fa-bell',
      value: `${unreadNotificationsCount}`,
      label: 'Unread alerts',
      badgeLabel: highPriorityNotificationCount ? 'Check now' : 'All clear',
      note: highPriorityNotificationCount
        ? `${highPriorityNotificationCount} high-priority reminder${highPriorityNotificationCount === 1 ? '' : 's'}`
        : 'No high-priority notification is waiting.',
      tone: highPriorityNotificationCount ? ('warning' as const) : ('info' as const)
    }
  ];

  const priorityTasks = useMemo<PriorityTask[]>(() => {
    const tasks: PriorityTask[] = [];

    if (revisionFiles[0]) {
      tasks.push({
        id: `revision-${revisionFiles[0].id}`,
        title: `Revise ${CATEGORY_LABELS[revisionFiles[0].category] ?? revisionFiles[0].category}`,
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
  }, [latestFeedback, nextSchedule, revisionFiles]);

  const readinessItems = [
    {
      id: 'repository',
      label: 'Repository status',
      value: data.project.repositoryStatus,
      note: `${approvedCount} approved file${approvedCount === 1 ? '' : 's'} are ready for archive or endorsement review.`,
      tone: approvedCount >= 4 ? ('success' as const) : ('warning' as const)
    },
    {
      id: 'transfer',
      label: 'Technology transfer',
      value: data.project.technologyTransferStatus ?? data.technologyTransfer.transferabilityStatus,
      note: data.technologyTransfer.beneficiary,
      tone: getStatusTone(data.project.technologyTransferStatus ?? data.technologyTransfer.transferabilityStatus)
    },
    {
      id: 'reports',
      label: 'Latest progress report',
      value: data.progressReports[0]?.title ?? 'No report submitted yet',
      note:
        data.progressReports[0]?.dateLabel ??
        'Submit a report to capture adviser review history and implementation notes.',
      tone: data.progressReports[0] ? ('neutral' as const) : ('warning' as const)
    }
  ];

  const fileSummaryCards = [
    {
      id: 'latest-submission',
      label: 'Latest submission',
      value: latestSubmission?.fileName ?? 'No submission yet',
      note: latestSubmission?.uploadDateLabel ?? 'Upload project files to start your archive record.'
    },
    {
      id: 'pending-revision',
      label: 'Pending revisions',
      value: `${revisionCount}`,
      note: revisionFiles[0]?.fileName ?? 'All tracked files are currently clear.'
    },
    {
      id: 'pending-review',
      label: 'Pending review',
      value: `${pendingCount}`,
      note: pendingReviewFiles[0]?.fileName ?? 'No file is currently waiting for adviser validation.'
    },
    {
      id: 'archive-status',
      label: 'Archive readiness',
      value: data.project.repositoryStatus,
      note:
        data.project.technologyTransferStatus ??
        data.technologyTransfer.transferabilityStatus ??
        'Waiting for archive endorsement.'
    }
  ];

  const attentionCount =
    revisionCount + highPriorityNotificationCount + dueSoonCount + overdueCount + unreadFeedbackCount;
  const currentPhaseTone = getShellToneFromWorkflowStatus(currentWorkflowStep?.status ?? 'current');
  const nextMilestoneTone = nextWorkflowStep
    ? getShellToneFromWorkflowStatus(nextWorkflowStep.status)
    : ('archived' as const);
  const notificationTone = getNotificationShellTone(
    unreadNotificationsCount,
    highPriorityNotificationCount
  );
  const attentionTone = getAttentionShellTone({
    attentionCount,
    overdueCount,
    dueSoonCount,
    highPriorityNotificationCount,
    unreadFeedbackCount,
    revisionCount
  });
  const topNavAlertCopy = unreadNotificationsCount
    ? highPriorityNotificationCount
      ? `${highPriorityNotificationCount} high-priority alert${highPriorityNotificationCount === 1 ? '' : 's'}`
      : `${unreadNotificationsCount} unread update${unreadNotificationsCount === 1 ? '' : 's'}`
    : 'All caught up';
  const attentionLabel = attentionCount
    ? `${attentionCount} item${attentionCount === 1 ? '' : 's'} need attention`
    : 'On track';
  const currentPhaseToneUi = getShellToneUi(currentPhaseTone);
  const nextMilestoneToneUi = getShellToneUi(nextMilestoneTone);
  const notificationToneUi = getShellToneUi(notificationTone);
  const attentionToneUi = getShellToneUi(attentionTone);
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
  const workspaceActions = quickLinks.map((item) => {
    if (item.href === '/students/project-overview') {
      return {
        ...item,
        metric: currentPhaseTitle,
        description: 'Review scope, implementation status, and adviser-aligned project context.'
      };
    }

    if (item.href === '/students/project-files') {
      return {
        ...item,
        metric: `${data.documents.length} tracked file${data.documents.length === 1 ? '' : 's'}`,
        description: revisionCount
          ? `${revisionCount} submission${revisionCount === 1 ? '' : 's'} need revision before the next review cycle.`
          : pendingCount
            ? `${pendingCount} file${pendingCount === 1 ? '' : 's'} waiting for adviser validation.`
            : 'All tracked files are currently clear or approved.'
      };
    }

    if (item.href === '/students/faculty-feedback') {
      return {
        ...item,
        metric: unreadFeedbackCount
          ? `${unreadFeedbackCount} unread comment${unreadFeedbackCount === 1 ? '' : 's'}`
          : 'Feedback clear',
        description: latestFeedback
          ? `${latestFeedback.facultyName}: ${createExcerpt(latestFeedback.content, 92)}`
          : 'Adviser and panel recommendations will surface here after the next review pass.'
      };
    }

    if (item.href === '/students/schedule') {
      return {
        ...item,
        metric: nextSchedule?.startDateLabel ?? 'No schedule yet',
        description: nextSchedule
          ? createExcerpt(`${nextSchedule.title} | ${nextSchedule.time} | ${nextSchedule.location}`, 96)
          : 'Consultations, deadlines, and defense events will appear here once confirmed.'
      };
    }

    return {
      ...item,
      metric: 'Workspace',
      description: 'Open the next part of your student workflow.'
    };
  });
  const pulseItems = [
    {
      id: 'phase',
      label: 'Current phase',
      value: currentPhaseTitle,
      note: currentWorkflowStep?.dateLabel ?? 'Current academic cycle',
      tone: currentPhaseToneUi
    },
    {
      id: 'milestone',
      label: 'Next milestone',
      value: nextWorkflowStep?.title ?? 'Final review preparation',
      note: nextWorkflowStep?.dateLabel ?? 'Waiting for schedule confirmation',
      tone: nextMilestoneToneUi
    },
    {
      id: 'alerts',
      label: 'Notifications',
      value: topNavAlertCopy,
      note: attentionLabel,
      tone: notificationToneUi
    },
    {
      id: 'feedback',
      label: 'Latest feedback',
      value: latestFeedback?.title ?? 'No new adviser feedback',
      note: latestFeedback ? `${latestFeedback.facultyName} | ${latestFeedback.dateLabel}` : 'Waiting for next review.',
      tone: latestFeedback?.unread ? getShellToneUi('needs-revision') : getShellToneUi('completed')
    }
  ];
  const phaseSummaryCards = [
    {
      id: 'completed',
      label: 'Completed phases',
      value: `${completedWorkflowCount}`,
      note: `${Math.max(workflow.length - completedWorkflowCount, 0)} remaining in the workflow`,
      tone: 'success' as const
    },
    {
      id: 'active',
      label: 'Active focus',
      value: currentPhaseTitle,
      note: currentWorkflowStep?.dateLabel ?? 'Current academic cycle',
      tone: currentPhaseToneUi.tone
    },
    {
      id: 'risk',
      label: 'Recovery items',
      value: delayedWorkflowCount || overdueCount ? `${delayedWorkflowCount + overdueCount}` : 'Clear',
      note:
        delayedWorkflowCount || overdueCount
          ? 'Delayed phases or overdue schedules need recovery planning.'
          : 'No delayed phase or overdue event is recorded right now.',
      tone: delayedWorkflowCount || overdueCount ? ('danger' as const) : ('success' as const)
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
            <p>Keep progress, files, adviser feedback, and the next academic commitment readable from one focused workspace.</p>
          </div>
        </div>
      </header>

      <div className="page-body student-dashboard-page">
        <section className="dashboard-hero">
          <article className="dashboard-hero-main student-dashboard-workspace-hero">

            <div className="student-dashboard-overview-top">
              <span className="section-kicker">Project Workspace</span>
              <div className="chip-row">
                <span className={`student-project-status-badge is-${projectStatusTone}`}>{data.project.status}</span>
                <Badge label={attentionLabel} tone={attentionToneUi.tone} icon={attentionToneUi.icon} />
              </div>
            </div>

            <div className="student-dashboard-title-block">
              {projectStatusTone !== 'success' || (realGroup && (realGroup.title === 'Pending Student Submission' || realGroup.title === 'Awaiting Adviser Approval' || realGroup.title === 'Pending Concept Presentation')) ? (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="student-dashboard-pending-title">
                      <i className="fas fa-lock" aria-hidden="true"></i>
                      Project title pending approval
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[0.65em] font-semibold text-amber-700 shadow-sm align-middle">
                      <i className="fas fa-clock"></i>
                      {realGroup?.title === 'Pending Student Submission'
                        ? 'Awaiting Title Submission'
                        : realGroup?.title === 'Pending Concept Presentation'
                          ? 'Pending Concept Presentation'
                          : 'Awaiting Adviser Approval'}
                    </span>
                  </div>
                  <p className="student-dashboard-intro">
                    Your project title will appear here once the concept proposal has been submitted and approved by your adviser.
                  </p>
                </>
              ) : (
                <>
                  <h2>
                    {realGroup ? realGroup.projectTitle || realGroup.title : data.project.title}
                  </h2>
                  <p className="student-dashboard-intro">
                    {data.project.description ||
                      'Track academic progress, active deliverables, faculty guidance, and the next capstone commitments from one focused workspace.'}
                  </p>
                </>
              )}
            </div>

            <div className="student-workspace-hero-meta" aria-label="Project workspace essentials">
              <span>
                <i className="fas fa-hashtag" aria-hidden="true" />
                {data.project.projectCode}
              </span>
              <span>
                <i className="fas fa-user-tie" aria-hidden="true" />
                {data.project.adviser}
              </span>
              <span>
                <i className="fas fa-users" aria-hidden="true" />
                {data.group.groupName}
              </span>
              <span>
                <i className="fas fa-calendar-check" aria-hidden="true" />
                {nextSchedule?.startDateLabel ?? 'No scheduled review'}
              </span>
            </div>

            <div className="student-workspace-hero-actions" aria-label="Primary workspace actions">
              {workspaceHeroActions.map((item) => (
                <Link key={item.id} className={`student-workspace-hero-action is-${item.tone}`} href={item.href}>
                  <span className="student-workspace-action-icon">
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
                  </span>
                  <span>
                    <small>{item.meta}</small>
                    <strong>{item.label}</strong>
                  </span>
                </Link>
              ))}
            </div>

            <div className="student-project-metrics">
              {summaryCards.map((item) => (
                <article key={item.id} className="student-project-metric">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </article>
              ))}
            </div>

            <div className="dashboard-action-grid">
              {workspaceActions.map((item) => (
                <Link key={item.id} className="dashboard-action-card" href={item.href}>
                  <span className="dashboard-action-icon">
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
                  </span>
                  <div className="student-dashboard-action-copy">
                    <span className="student-dashboard-action-meta">{item.metric}</span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <div className="dashboard-hero-side">
            <article className="dashboard-pulse-card">
              <div className="dashboard-pulse-head">
                <div className="progress-orb" style={{ '--progress': data.project.progressPercentage } as CSSProperties}>
                  <strong>{data.project.progressPercentage}%</strong>
                  <span>Completed</span>
                </div>
                <div className="dashboard-pulse-summary">
                  <span className="section-kicker">Current Focus</span>
                  <h3>{currentPhaseTitle}</h3>
                  <p>{currentPhaseSummary}</p>
                </div>
              </div>

              <div className="dashboard-pulse-list">
                {pulseItems.map((item) => (
                  <article key={item.id} className={`dashboard-pulse-item ${item.tone.panelClassName}`}>
                    <span className="dashboard-pulse-icon">
                      <i className={`fas ${item.tone.icon}`} aria-hidden="true" />
                    </span>
                    <div className="dashboard-pulse-copy">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.note}</small>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="dashboard-brief-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Project Snapshot</span>
                  <h3>Workspace essentials</h3>
                  <p>Core context stays visible without opening separate student pages.</p>
                </div>
              </div>
              <div className="detail-grid student-dashboard-snapshot-grid">
                {projectMeta.map((item) => (
                  <article key={item.id} className="detail-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="stats-grid student-dashboard-kpi-grid">
          {analyticsCards.map((item) => (
            <article key={item.id} className={`stat-card student-dashboard-stat is-${item.tone}`}>
              <div className="stat-card-head">
                <span className="stat-card-icon">
                  <i className={`fas ${item.icon}`} aria-hidden="true" />
                </span>
                <Badge label={item.badgeLabel} tone={item.tone} />
              </div>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.note}</small>
            </article>
          ))}
        </section>

        <section className="dashboard-layout">
          <div className="dashboard-main-column">
            <article className="surface-card student-dashboard-card student-dashboard-action-center">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Action Center</span>
                  <h3>What needs attention now</h3>
                  <p>Start with the highest-friction item first, then continue through the next milestone.</p>
                </div>
                <Badge
                  label={priorityTasks.length ? 'Action Needed' : 'Clear'}
                  tone={priorityTasks.length ? 'danger' : 'success'}
                />
              </div>
              {priorityTasks.length ? (
                <div className="stack-list">
                  {priorityTasks.map((item) => (
                    <article key={item.id} className={`stack-card student-priority-card is-${item.tone}`}>
                      <span className="student-priority-icon" aria-hidden="true">
                        <i className={`fas ${item.icon ?? 'fa-circle-exclamation'}`} />
                      </span>
                      <div className="stack-card-head">
                        <div>
                          <strong>{item.title}</strong>
                          {item.meta ? <small>{item.meta}</small> : null}
                        </div>
                        <Badge label={item.label} tone={item.tone} icon={item.icon} />
                      </div>
                      <p>{item.description}</p>
                      <Link className="inline-link" href={item.href}>
                        {item.actionLabel}
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No immediate blocker"
                  description="Your active dashboard queue is clear. Continue preparing the next milestone and scheduled review."
                  icon="fa-circle-check"
                />
              )}
            </article>

            <article className="surface-card student-dashboard-card student-dashboard-milestone-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Milestone Pipeline</span>
                  <h3>Proposal to defense workflow</h3>
                  <p>Keep the academic sequence visible so the next deliverable is obvious.</p>
                </div>
                <Link className="inline-link" href="/students/milestones">
                  Open milestones
                </Link>
              </div>
              <div className="student-dashboard-phase-summary-grid">
                {phaseSummaryCards.map((item) => (
                  <article key={item.id} className={`student-dashboard-phase-summary-item is-${item.tone}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>
              <div className="student-phase-tracker">
                {workflow.map((item, index) => {
                  const workflowStatus = getWorkflowStatusConfig(item.status);

                  return (
                    <article key={item.id} className={`student-phase-tracker-item is-${item.status}`}>
                      <span className="student-phase-step">{index + 1}</span>
                      <div className="student-phase-copy">
                        <strong>{item.title}</strong>
                        <small>{item.summary}</small>
                      </div>
                      <div className="student-phase-meta">
                        <Badge label={workflowStatus.label} tone={workflowStatus.tone} />
                        <small>{item.dateLabel}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>

            <section className="surface-card student-dashboard-card student-upload-preview-card student-dashboard-files-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Project Files</span>
                  <h3>Latest submissions and archive readiness</h3>
                  <p>Track the most recent uploads while keeping revision-heavy files and archive status visible.</p>
                </div>
                <div className="student-section-actions">
                  <Link className="inline-link" href="/students/project-files">
                    Open project files
                  </Link>
                  <Link className="student-dashboard-action-link is-compact" href="/students/project-files">
                    <i className="fas fa-book-open-reader" aria-hidden="true" />
                    Open Project Files
                  </Link>
                </div>
              </div>
              {recentUploads.length ? (
                <div className="student-dashboard-files-grid">
                  <div className="dashboard-upload-list is-preview">
                    {recentUploads.map((item) => (
                      <article key={item.id} className="dashboard-upload-item">
                        <div className="dashboard-upload-main">
                          <span className="table-file-icon">
                            <i className="fas fa-file-lines" aria-hidden="true" />
                          </span>
                          <div>
                            <strong>{item.fileName}</strong>
                            <small>{CATEGORY_LABELS[item.category] ?? item.category}</small>
                          </div>
                        </div>
                        <div className="dashboard-upload-meta">
                          <Badge label={item.reviewStatus} tone={getStatusTone(item.reviewStatus)} />
                          <span>{item.uploadDateLabel}</span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="student-dashboard-file-summary-grid">
                    {fileSummaryCards.map((item) => (
                      <article key={item.id} className="student-dashboard-file-summary-item">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <small>{item.note}</small>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No recent uploads"
                  description="Latest file activity will appear here once your group records project submissions."
                  icon="fa-file-circle-plus"
                />
              )}
            </section>
          </div>

          <div className="dashboard-side-column">
            <article className="student-insight-panel student-dashboard-side-panel student-dashboard-upcoming-panel">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Upcoming Activity</span>
                  <h4>Consultations, deadlines, and key events</h4>
                </div>
                <Link className="inline-link" href="/students/schedule">
                  Open schedule
                </Link>
              </div>
              {schedulePreview.length ? (
                <div className="stack-list student-dashboard-schedule-list">
                  {schedulePreview.map((item) => (
                    <article key={item.id} className="stack-card student-dashboard-schedule-card">
                      <div className="stack-card-head">
                        <strong>{item.title}</strong>
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
                      <div className="student-dashboard-schedule-meta">
                        <span>
                          <i className="fas fa-calendar-day" aria-hidden="true" /> {item.startDateLabel}
                        </span>
                        <span>
                          <i className="fas fa-clock" aria-hidden="true" /> {item.time}
                        </span>
                        <span>
                          <i className="fas fa-location-dot" aria-hidden="true" /> {item.location}
                        </span>
                      </div>
                      <p>{createExcerpt(item.description, 116)}</p>
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

            <article className="student-insight-panel student-dashboard-side-panel student-dashboard-health-panel">
              <div>
                <span className="section-kicker">Submission Health</span>
                <h4>Approved, pending, and revision status</h4>
              </div>
              <div className="student-health-list">
                <div className="student-health-item">
                  <div>
                    <span>Approved</span>
                    <strong>{approvedCount}</strong>
                  </div>
                  <div className="student-health-bar" aria-hidden="true">
                    <span style={{ width: `${(approvedCount / Math.max(data.documents.length, 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="student-health-item">
                  <div>
                    <span>Pending Review</span>
                    <strong>{pendingCount}</strong>
                  </div>
                  <div className="student-health-bar is-warning" aria-hidden="true">
                    <span style={{ width: `${(pendingCount / Math.max(data.documents.length, 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="student-health-item">
                  <div>
                    <span>Needs Revision</span>
                    <strong>{revisionCount}</strong>
                  </div>
                  <div className="student-health-bar is-danger" aria-hidden="true">
                    <span style={{ width: `${(revisionCount / Math.max(data.documents.length, 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="student-deadline-grid">
                <div className="student-deadline-item is-warning">
                  <strong>{dueSoonCount}</strong>
                  <span>Due soon</span>
                </div>
                <div className={`student-deadline-item ${overdueCount ? 'is-danger' : 'is-neutral'}`}>
                  <strong>{overdueCount}</strong>
                  <span>Overdue</span>
                </div>
                <div className="student-deadline-item is-neutral">
                  <strong>{unreadFeedbackCount}</strong>
                  <span>New feedback</span>
                </div>
              </div>
            </article>

            <article className="surface-card student-dashboard-card student-dashboard-feedback-panel">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Faculty Feedback</span>
                  <h3>Latest adviser and panel recommendations</h3>
                </div>
                <Link className="inline-link" href="/students/faculty-feedback">
                  Open feedback
                </Link>
              </div>
              {recentFeedback.length ? (
                <div className="stack-list">
                  {recentFeedback.map((item) => {
                    const statusConfig = getFeedbackStatusConfig(item.status);

                    return (
                      <article
                        key={item.id}
                        className={`stack-card student-feedback-card ${item.unread ? 'is-highlighted' : ''}`}
                      >
                        <div className="stack-card-head">
                          <div>
                            <strong>{item.title}</strong>
                            <small>
                              {item.facultyName} | {item.dateLabel}
                            </small>
                          </div>
                          <div className="chip-row">
                            <Badge label={item.mode} tone={item.mode === 'Adviser' ? 'warning' : 'neutral'} />
                            <Badge label={statusConfig.label} tone={statusConfig.tone} />
                          </div>
                        </div>
                        <p>{createExcerpt(item.content, 156)}</p>
                        <Link className="inline-link" href="/students/faculty-feedback">
                          Open feedback
                        </Link>
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

            <article className="surface-card student-dashboard-card student-dashboard-team-panel">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Shared Group Workspace</span>
                  <h3>Team snapshot</h3>
                </div>
                <Badge label={data.profile.groupRole} tone="warning" />
              </div>
              <div className="student-summary-strip">
                <div className="student-summary-metric">
                  <span>Group members</span>
                  <strong>{data.group.memberCount}</strong>
                </div>
                <div className="student-summary-metric">
                  <span>Leader</span>
                  <strong>{data.group.leaderName}</strong>
                </div>
              </div>
              <p className="student-dashboard-team-note">
                Official submissions, title updates, and schedule coordination are currently handled through the group leader workspace.
              </p>
              <div className="dashboard-roster-list is-compact">
                {data.group.members.map((member) => (
                  <article
                    key={member.id}
                    className={`dashboard-roster-item ${member.isLeader ? 'is-leader' : ''} ${member.isCurrent ? 'is-current' : ''}`}
                  >
                    <span className="member-avatar">{getInitials(member.fullName)}</span>
                    <div className="dashboard-roster-copy">
                      <strong>{member.fullName}</strong>
                      <small>{member.studentId}</small>
                    </div>
                    <div className="chip-row">
                      <Badge
                        label={member.isLeader ? 'Leader' : 'Member'}
                        tone={member.isLeader ? 'warning' : 'neutral'}
                        icon={member.isLeader ? 'fa-crown' : 'fa-user'}
                      />
                      {member.isCurrent ? <Badge label="You" tone="success" icon="fa-user-check" /> : null}
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
