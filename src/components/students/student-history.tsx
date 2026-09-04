'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import { getProjectFileCategoryLabel } from '@/components/students/student-project-files.shared';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type HistoryFilterKey = 'all' | 'submissions' | 'feedback' | 'revisions' | 'approvals' | 'milestones' | 'files';
type HistoryEventFilterKey = Exclude<HistoryFilterKey, 'all'>;
type HistoryPriority = 'major' | 'minor';

type StudentHistoryEntry = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  sourceLabel: string;
  eventLabel: string;
  statusLabel: string;
  statusTone: BadgeTone;
  route?: string;
  actionLabel?: string;
  icon: string;
  tone: BadgeTone;
  details: string[];
  filters: HistoryEventFilterKey[];
  priority: HistoryPriority;
};

type TimelineDayGroup = {
  key: string;
  label: string;
  weekday: string;
  dayNumber: string;
  monthStamp: string;
  entries: StudentHistoryEntry[];
};

type TimelineMonthGroup = {
  key: string;
  label: string;
  total: number;
  days: TimelineDayGroup[];
};

const HISTORY_FILTERS: Array<{ key: HistoryFilterKey; label: string; icon: string }> = [
  { key: 'all', label: 'All', icon: 'fa-layer-group' },
  { key: 'submissions', label: 'Submissions', icon: 'fa-paper-plane' },
  { key: 'feedback', label: 'Feedback', icon: 'fa-comments' },
  { key: 'revisions', label: 'Revisions', icon: 'fa-rotate-right' },
  { key: 'approvals', label: 'Approvals', icon: 'fa-circle-check' },
  { key: 'milestones', label: 'Milestones', icon: 'fa-timeline' },
  { key: 'files', label: 'Files', icon: 'fa-folder-open' }
];

const HISTORY_EVENT_FILTERS: HistoryEventFilterKey[] = ['submissions', 'feedback', 'revisions', 'approvals', 'milestones', 'files'];

const BADGE_TONE_STYLES: Record<BadgeTone, string> = {
  neutral: 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)]',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700'
};

const ICON_TONE_STYLES: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--surface-alt)] text-[var(--muted)]',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-blue-100 text-[#003A8F]'
};

const SUMMARY_TONE_STYLES: Record<BadgeTone, string> = {
  neutral: 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)]',
  success: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
  warning: 'border-amber-100 bg-amber-50/80 text-amber-700',
  danger: 'border-rose-100 bg-rose-50/80 text-rose-700',
  info: 'border-blue-100 bg-blue-50/80 text-[#003A8F]'
};

const PRIMARY_LINK_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#002c6b] bg-[#003A8F] px-4 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(0,58,143,0.18)] transition duration-150 hover:-translate-y-px hover:bg-[#002c6b] hover:shadow-[0_18px_36px_rgba(0,58,143,0.22)]';
const SECONDARY_LINK_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] shadow-sm transition duration-150 hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]';

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatDisplayLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatHistoryDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatHistoryMonth(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
}

function formatHistoryDay(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function formatHistoryTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getStatusTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();

  if (['approved', 'completed', 'reviewed', 'resolved', 'confirmed', 'active', 'recognized'].includes(normalized)) {
    return 'success';
  }

  if (['pending', 'pending review', 'under review', 'upcoming', 'submitted', 'proposed', 'ongoing', 'resubmitted'].includes(normalized)) {
    return 'warning';
  }

  if (['needs revision', 'returned for revision', 'danger'].includes(normalized)) {
    return 'danger';
  }

  return 'info';
}

function uniqueHistoryFilters(filters: Array<HistoryEventFilterKey | undefined | false>) {
  return Array.from(new Set(filters.filter(Boolean) as HistoryEventFilterKey[]));
}

function compactDetails(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

function getPriorityRank(priority: HistoryPriority) {
  return priority === 'major' ? 0 : 1;
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${BADGE_TONE_STYLES[tone]}`}>
      {icon ? <i className={`fas ${icon} text-[10px]`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function buildHistoryEntries(data: StudentDashboardData): StudentHistoryEntry[] {
  const titleSubmissions =
    data.titleRegistration.submissions?.length
      ? data.titleRegistration.submissions
      : [
          {
            id: data.titleRegistration.id,
            proposalLabel: 'Proposal 01',
            proposedTitle: data.titleRegistration.proposedTitle,
            registrationStatus: data.titleRegistration.registrationStatus,
            category: data.titleRegistration.category,
            revisionHistory: data.titleRegistration.revisionHistory
          }
        ];
  const titleEntries: StudentHistoryEntry[] = titleSubmissions.flatMap((submission) =>
    submission.revisionHistory.map((entry) => {
      const normalizedStatus = entry.status.toLowerCase();
      const isApproval = normalizedStatus.includes('approved');
      const isRevision = normalizedStatus.includes('revision') || normalizedStatus.includes('resubmit');
      const isSubmission = normalizedStatus.includes('submit');

      return {
        id: `history-title-${submission.id}-${entry.id}`,
        timestamp: entry.date,
        title: `${submission.proposalLabel} ${entry.status.toLowerCase()}`,
        description: entry.note,
        actor: entry.reviewedBy,
        sourceLabel: 'Title Submission',
        eventLabel: isApproval ? 'Approval' : isRevision ? 'Revision' : 'Submission',
        statusLabel: entry.status,
        statusTone: getStatusTone(entry.status),
        route: '/students/title-submission',
        actionLabel: 'Open Title Submission',
        icon: isApproval ? 'fa-circle-check' : isRevision ? 'fa-rotate-right' : 'fa-paper-plane',
        tone: isApproval ? 'success' : isRevision ? 'warning' : 'info',
        details: compactDetails([
          submission.registrationStatus,
          submission.category,
          submission.proposedTitle
        ]),
        filters: uniqueHistoryFilters([
          isSubmission ? 'submissions' : undefined,
          isRevision ? 'revisions' : undefined,
          isApproval ? 'approvals' : undefined
        ]),
        priority: 'major'
      };
    })
  );

  const majorFileCategories = new Set(['proposal', 'chapter-3', 'system-files', 'presentation-files', 'certificates']);

  const documentEntries: StudentHistoryEntry[] = data.documents.map((document) => {
    const reviewStatus = document.reviewStatus || formatDisplayLabel(document.status);
    const normalizedStatus = reviewStatus.toLowerCase();
    const isApproval = normalizedStatus.includes('approved') || normalizedStatus.includes('reviewed');
    const isRevision = normalizedStatus.includes('revision');
    const isPending = normalizedStatus.includes('pending');

    return {
      id: `history-document-${document.id}`,
      timestamp: document.created_at,
      title: `Uploaded ${document.fileName}`,
      description: `${document.uploadedBy} added ${document.fileName} to the shared project workspace for review and tracking.`,
      actor: document.uploadedBy,
      sourceLabel: 'Project Files',
      eventLabel: isRevision ? 'Revision' : isApproval ? 'Approval' : 'File',
      statusLabel: reviewStatus,
      statusTone: getStatusTone(reviewStatus),
      route: '/students/project-files',
      actionLabel: 'Open Project Files',
      icon: isRevision ? 'fa-file-pen' : isApproval ? 'fa-file-circle-check' : 'fa-file-arrow-up',
      tone: isRevision ? 'warning' : isApproval ? 'success' : isPending ? 'warning' : 'info',
      details: compactDetails([getProjectFileCategoryLabel(document.category), document.fileType, document.sizeLabel]),
      filters: uniqueHistoryFilters(['files', isRevision ? 'revisions' : undefined, isApproval ? 'approvals' : undefined]),
      priority: majorFileCategories.has(document.category) || isRevision || isPending ? 'major' : 'minor'
    };
  });

  const feedbackEntries: StudentHistoryEntry[] = data.feedback.map((entry) => {
    const normalizedStatus = entry.status.toLowerCase();
    const isResolved = normalizedStatus.includes('resolved');
    const isRevision = normalizedStatus.includes('revised');
    const statusLabel = entry.unread ? 'Unread' : formatDisplayLabel(entry.status);

    return {
      id: `history-feedback-${entry.id}`,
      timestamp: entry.created_at,
      title: entry.title,
      description: entry.content,
      actor: entry.facultyName,
      sourceLabel: 'Faculty Feedback',
      eventLabel: isResolved ? 'Approval' : isRevision ? 'Revision' : 'Feedback',
      statusLabel,
      statusTone: entry.unread ? 'warning' : getStatusTone(entry.status),
      route: '/students/faculty-feedback',
      actionLabel: 'Review Feedback',
      icon: entry.mode === 'Adviser' ? 'fa-user-graduate' : 'fa-users',
      tone: entry.unread ? 'warning' : isResolved ? 'success' : isRevision ? 'warning' : 'info',
      details: compactDetails([entry.mode, entry.unread ? 'Needs acknowledgment' : 'Reviewed']),
      filters: uniqueHistoryFilters(['feedback', isRevision ? 'revisions' : undefined, isResolved ? 'approvals' : undefined]),
      priority: entry.unread || !isResolved ? 'major' : 'minor'
    };
  });

  const milestoneEntries: StudentHistoryEntry[] = data.milestones.map((entry) => {
    const normalizedStatus = entry.status.toLowerCase();
    const normalizedTitle = entry.title.toLowerCase();
    const relatedPhase = entry.relatedPhase || '';
    const isApproval = normalizedTitle.includes('approval') || relatedPhase.toLowerCase().includes('approval');
    const isDefense = normalizedTitle.includes('defense');

    return {
      id: `history-milestone-${entry.id}`,
      timestamp: entry.updated_at,
      title: entry.title,
      description: entry.summary,
      actor: 'Project Roadmap',
      sourceLabel: 'Milestones',
      eventLabel: isDefense ? 'Defense' : 'Milestone',
      statusLabel: formatDisplayLabel(entry.status),
      statusTone: getStatusTone(entry.status),
      route: entry.route || '/students/milestones',
      actionLabel: entry.actionLabel || 'Open Milestones',
      icon: isDefense ? 'fa-person-chalkboard' : 'fa-timeline',
      tone: isApproval ? 'success' : normalizedStatus === 'completed' ? 'info' : 'warning',
      details: compactDetails([relatedPhase, entry.dateLabel, entry.priority ? `${formatDisplayLabel(entry.priority)} priority` : undefined]),
      filters: uniqueHistoryFilters(['milestones', isApproval ? 'approvals' : undefined]),
      priority: entry.priority === 'high' || normalizedStatus !== 'completed' ? 'major' : 'minor'
    };
  });

  const reportEntries: StudentHistoryEntry[] = data.progressReports.map((entry) => {
    const reportStatus = entry.statusDisplay || entry.status;
    const normalizedStatus = reportStatus.toLowerCase();
    const isApproval = normalizedStatus.includes('reviewed') || normalizedStatus.includes('approved');
    const isRevision = normalizedStatus.includes('revision');

    return {
      id: `history-report-${entry.id}`,
      timestamp: entry.created_at,
      title: entry.title,
      description: entry.progressDescription,
      actor: data.profile.fullName,
      sourceLabel: 'Progress Reports',
      eventLabel: isRevision ? 'Revision' : 'Submission',
      statusLabel: reportStatus,
      statusTone: getStatusTone(reportStatus),
      route: '/students/progress-reports',
      actionLabel: 'Open Progress Reports',
      icon: 'fa-clipboard-check',
      tone: isApproval ? 'success' : isRevision ? 'warning' : 'info',
      details: compactDetails([`${entry.percentageCompleted}% complete`, reportStatus]),
      filters: uniqueHistoryFilters(['submissions', isRevision ? 'revisions' : undefined, isApproval ? 'approvals' : undefined]),
      priority: 'major'
    };
  });

  const scheduleEntries: StudentHistoryEntry[] = data.schedules.map((entry) => {
    const titleStack = `${entry.title} ${entry.type}`.toLowerCase();
    const isDefense = titleStack.includes('defense');
    const isDeadline = titleStack.includes('deadline');
    const isConsultation = titleStack.includes('consultation') || titleStack.includes('meeting');

    return {
      id: `history-schedule-${entry.id}`,
      timestamp: entry.created_at,
      title: entry.title,
      description: `${entry.type} scheduled at ${entry.location}. ${entry.description}`,
      actor: 'Student Calendar',
      sourceLabel: 'Schedule',
      eventLabel: isDefense ? 'Defense' : isDeadline ? 'Revision' : 'Milestone',
      statusLabel: formatDisplayLabel(entry.status),
      statusTone: getStatusTone(entry.status),
      route: '/students/schedule',
      actionLabel: 'Open Schedule',
      icon: isDefense ? 'fa-person-chalkboard' : isDeadline ? 'fa-hourglass-half' : 'fa-calendar-check',
      tone: isDefense || isDeadline ? 'warning' : getStatusTone(entry.status),
      details: compactDetails([entry.type, entry.time, entry.location]),
      filters: uniqueHistoryFilters([
        isDeadline ? 'submissions' : undefined,
        isDeadline ? 'revisions' : undefined,
        isConsultation ? 'feedback' : undefined,
        'milestones'
      ]),
      priority: entry.priority === 'high' || isDefense || isDeadline ? 'major' : 'minor'
    };
  });

  const notificationEntries: StudentHistoryEntry[] = data.notifications.map((entry) => {
    const typeLabel = formatDisplayLabel(entry.type);
    const normalizedType = entry.type.toLowerCase();

    return {
      id: `history-notification-${entry.id}`,
      timestamp: entry.created_at,
      title: entry.title,
      description: entry.message,
      actor: 'System Notification',
      sourceLabel: 'Notifications',
      eventLabel:
        normalizedType === 'approval'
          ? 'Approval'
          : normalizedType === 'deadline'
            ? 'Revision'
            : normalizedType === 'feedback'
              ? 'Feedback'
              : normalizedType === 'schedule'
                ? 'Milestone'
                : 'Status',
      statusLabel: entry.read ? 'Read' : 'Unread',
      statusTone: entry.read ? 'neutral' : entry.priority === 'high' ? 'warning' : 'info',
      route: entry.route || '/students/notifications',
      actionLabel: entry.actionLabel || 'Open Notifications',
      icon:
        normalizedType === 'approval'
          ? 'fa-circle-check'
          : normalizedType === 'deadline'
            ? 'fa-hourglass-half'
            : normalizedType === 'feedback'
              ? 'fa-comments'
              : normalizedType === 'schedule'
                ? 'fa-calendar-check'
                : 'fa-bell',
      tone: entry.priority === 'high' ? 'warning' : entry.read ? 'neutral' : 'info',
      details: compactDetails([typeLabel, `${formatDisplayLabel(entry.priority)} priority`, entry.read ? 'Read' : 'Unread']),
      filters: uniqueHistoryFilters([
        normalizedType === 'feedback' ? 'feedback' : undefined,
        normalizedType === 'deadline' ? 'submissions' : undefined,
        normalizedType === 'deadline' ? 'revisions' : undefined,
        normalizedType === 'approval' ? 'approvals' : undefined,
        normalizedType === 'schedule' ? 'milestones' : undefined,
        normalizedType === 'general' ? 'files' : undefined
      ]),
      priority: 'minor'
    };
  });

  const presentationEntries: StudentHistoryEntry[] = data.presentations.map((entry) => {
    const eventStack = `${entry.eventName} ${entry.eventType}`.toLowerCase();
    const isDefense = eventStack.includes('defense') || eventStack.includes('presentation');

    return {
      id: `history-presentation-${entry.id}`,
      timestamp: entry.date,
      title: entry.eventName,
      description: entry.description,
      actor: 'Project Team',
      sourceLabel: 'Academic Activity',
      eventLabel: isDefense ? 'Defense' : 'Milestone',
      statusLabel: entry.achievement ? 'Recognized' : 'Completed',
      statusTone: entry.achievement ? 'success' : 'info',
      route: '/students/project-overview',
      actionLabel: 'Open Project Overview',
      icon: entry.achievement ? 'fa-trophy' : 'fa-person-chalkboard',
      tone: entry.achievement ? 'success' : 'info',
      details: compactDetails([entry.eventType, entry.scope, entry.achievement || entry.venue]),
      filters: uniqueHistoryFilters(['milestones', entry.achievement ? 'approvals' : undefined]),
      priority: 'major'
    };
  });

  const technologyTransferEntries: StudentHistoryEntry[] = [
    {
      id: `history-tech-${data.technologyTransfer.id}`,
      timestamp: data.technologyTransfer.updated_at,
      title: 'Technology transfer status updated',
      description: data.technologyTransfer.implementationNotes,
      actor: 'Project Team',
      sourceLabel: 'Technology Transfer',
      eventLabel: 'Status',
      statusLabel: data.technologyTransfer.transferabilityStatus,
      statusTone: getStatusTone(data.technologyTransfer.transferabilityStatus),
      route: '/students/technology-transfer',
      actionLabel: 'Open Technology Transfer',
      icon: 'fa-handshake-angle',
      tone: getStatusTone(data.technologyTransfer.transferabilityStatus),
      details: compactDetails([data.technologyTransfer.deploymentStatus, data.technologyTransfer.beneficiary]),
      filters: uniqueHistoryFilters(['milestones']),
      priority: 'minor'
    }
  ];

  return [
    ...titleEntries,
    ...documentEntries,
    ...feedbackEntries,
    ...milestoneEntries,
    ...reportEntries,
    ...scheduleEntries,
    ...notificationEntries,
    ...presentationEntries
  ].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
}

export function StudentHistory({ data }: { data: StudentDashboardData }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilterKey>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-refresh data logic removed
  useEffect(() => {
    return () => {};
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const historyEntries = useMemo(() => buildHistoryEntries(data), [data]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return historyEntries.filter((entry) => {
      if (selectedFilter !== 'all' && !entry.filters.includes(selectedFilter)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [entry.title, entry.description, entry.actor, entry.sourceLabel, entry.eventLabel, entry.statusLabel, ...entry.details]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [historyEntries, searchTerm, selectedFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<HistoryEventFilterKey, number> = {
      submissions: 0,
      feedback: 0,
      revisions: 0,
      approvals: 0,
      milestones: 0,
      files: 0
    };

    historyEntries.forEach((entry) => {
      entry.filters.forEach((filterKey) => {
        counts[filterKey] += 1;
      });
    });

    return counts;
  }, [historyEntries]);

  const timelineGroups = useMemo<TimelineMonthGroup[]>(() => {
    const monthMap = new Map<string, { label: string; days: Map<string, TimelineDayGroup> }>();

    filteredEntries.forEach((entry) => {
      const timestamp = new Date(entry.timestamp);
      const monthKey = getMonthKey(timestamp);
      const dayKey = getDateKey(timestamp);

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          label: formatHistoryMonth(entry.timestamp),
          days: new Map()
        });
      }

      const monthGroup = monthMap.get(monthKey)!;

      if (!monthGroup.days.has(dayKey)) {
        monthGroup.days.set(dayKey, {
          key: dayKey,
          label: formatHistoryDay(entry.timestamp),
          weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(timestamp),
          dayNumber: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(timestamp),
          monthStamp: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(timestamp),
          entries: []
        });
      }

      monthGroup.days.get(dayKey)!.entries.push(entry);
    });

    return Array.from(monthMap.entries()).map(([key, monthGroup]) => {
      const days = Array.from(monthGroup.days.values()).map((dayGroup) => ({
        ...dayGroup,
        entries: [...dayGroup.entries].sort((left, right) => {
          const priorityDelta = getPriorityRank(left.priority) - getPriorityRank(right.priority);
          if (priorityDelta !== 0) {
            return priorityDelta;
          }

          return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
        })
      }));

      return {
        key,
        label: monthGroup.label,
        total: days.reduce((sum, day) => sum + day.entries.length, 0),
        days
      };
    });
  }, [filteredEntries]);

  const latestEntry = historyEntries[0] || null;
  const latestMajorEntry = historyEntries.find((entry) => entry.priority === 'major') || latestEntry;
  const importantActivityCount = historyEntries.filter((entry) => entry.priority === 'major').length;
  const approvalCount = historyEntries.filter((entry) => entry.filters.includes('approvals')).length;
  const fileActivityCount = historyEntries.filter((entry) => entry.filters.includes('files')).length;
  const openReviewCount = historyEntries.filter(
    (entry) => (entry.filters.includes('feedback') || entry.filters.includes('revisions')) && entry.statusTone !== 'success'
  ).length;

  const collapsedMinorCount = useMemo(() => {
    return timelineGroups.reduce((monthTotal, monthGroup) => {
      return (
        monthTotal +
        monthGroup.days.reduce((dayTotal, dayGroup) => {
          if (expandedGroups[dayGroup.key]) {
            return dayTotal;
          }

          const majorEntries = dayGroup.entries.filter((entry) => entry.priority === 'major');
          const minorEntries = dayGroup.entries.filter((entry) => entry.priority === 'minor');
          const defaultMinorVisibleCount = majorEntries.length === 0 ? Math.min(1, minorEntries.length) : 0;

          return dayTotal + Math.max(0, minorEntries.length - defaultMinorVisibleCount);
        }, 0)
      );
    }, 0);
  }, [timelineGroups, expandedGroups]);

  const quickLinks = [
    { href: '/students/project-files', label: 'Project Files', copy: 'Review upload history and current file states.', icon: 'fa-file-lines' },
    { href: '/students/faculty-feedback', label: 'Faculty Feedback', copy: 'Open adviser and panel review threads.', icon: 'fa-comments' },
    { href: '/students/milestones', label: 'Milestones', copy: 'Check roadmap checkpoints and due phases.', icon: 'fa-timeline' },
    { href: '/students/project-overview', label: 'Project Overview', copy: 'See the current project snapshot and scope.', icon: 'fa-folder-open' }
  ];

  const summaryCards: Array<{ label: string; value: string | number; note: string; icon: string; tone: BadgeTone }> = [
    {
      label: 'Important Actions',
      value: importantActivityCount,
      note: 'Major submissions, review notes, approvals, and milestone shifts.',
      icon: 'fa-star',
      tone: 'info'
    },
    {
      label: 'Open Review Queue',
      value: openReviewCount,
      note: 'Feedback and revision-related items that still need attention.',
      icon: 'fa-hourglass-half',
      tone: 'warning'
    },
    {
      label: 'Approvals Logged',
      value: approvalCount,
      note: 'Accepted reviews, cleared submissions, and completed formal steps.',
      icon: 'fa-circle-check',
      tone: 'success'
    },
    {
      label: 'File Activity',
      value: fileActivityCount,
      note: 'Major uploads and file state changes across the workspace.',
      icon: 'fa-folder-open',
      tone: 'neutral'
    }
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFilter('all');
    setExpandedGroups({});
  };

  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((previous) => ({ ...previous, [groupKey]: !previous[groupKey] }));
  };

  return (
    <>
      <button className={`sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`} type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />

      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Project History</span>
              </span>
            </div>
            <h1>Project History</h1>
            <p>Trace submissions, feedback, revisions, approvals, milestones, and major project movement from one academic timeline.</p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <section className="grid gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
          <div className="grid gap-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#003A8F]">Activity Timeline</span>
            <div className="grid gap-3">
              <h2 className="max-w-[18ch] text-[clamp(1.7rem,3vw,2.25rem)] font-extrabold leading-tight text-slate-950">
                Cleaner project history for review cycles, submissions, and milestone movement
              </h2>
              <p className="max-w-[64ch] text-sm leading-7 text-[var(--muted)]">
                Major academic actions stay visible first. Routine updates are still preserved, but they sit under each date group so the timeline remains easier to scan.
              </p>
            </div>

            <div className="rounded-[22px] border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <p className="text-sm font-semibold text-[var(--text)]">Latest major activity</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {latestMajorEntry
                  ? `${latestMajorEntry.title} was recorded on ${formatHistoryDateTime(latestMajorEntry.timestamp)} under ${latestMajorEntry.sourceLabel}.`
                  : 'Project activity will appear here once submissions, reviews, and milestone actions are recorded.'}
              </p>
              {latestMajorEntry ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge label={latestMajorEntry.eventLabel} tone={latestMajorEntry.tone} icon={latestMajorEntry.icon} />
                  <Badge label={latestMajorEntry.statusLabel} tone={latestMajorEntry.statusTone} />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link prefetch={false} className={PRIMARY_LINK_CLASS} href="/students/project-files">
                <i className="fas fa-file-lines" aria-hidden="true" /> Open Project Files
              </Link>
              <Link prefetch={false} className={SECONDARY_LINK_CLASS} href="/students/faculty-feedback">
                <i className="fas fa-comments" aria-hidden="true" /> Review Feedback
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {summaryCards.map((item) => (
              <article key={item.label} className={`rounded-[22px] border p-4 shadow-sm ${SUMMARY_TONE_STYLES[item.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${ICON_TONE_STYLES[item.tone]}`}>
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">{item.label}</span>
                </div>
                <strong className="mt-4 block text-3xl font-extrabold leading-none text-slate-950">{item.value}</strong>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#003A8F]">History Filters</span>
              <h3 className="mt-2 text-xl font-bold text-slate-950">Focus the activity stream</h3>
              <p className="mt-1 max-w-[56ch] text-sm leading-6 text-[var(--muted)]">
                Filter the timeline by event type, search for a specific item, and keep minor updates collapsed until you need the extra detail.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge label={`${filteredEntries.length} visible`} tone="info" icon="fa-filter" />
              {collapsedMinorCount ? <Badge label={`${collapsedMinorCount} collapsed`} tone="warning" icon="fa-layer-group" /> : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {HISTORY_FILTERS.map((filter) => {
              const count = filter.key === 'all' ? historyEntries.length : filterCounts[filter.key];
              const isActive = selectedFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  aria-pressed={isActive}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition ${
                    isActive
                      ? 'border-[#003A8F]/20 bg-[#003A8F]/10 text-[#003A8F]'
                      : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                  type="button"
                  onClick={() => setSelectedFilter(filter.key)}
                >
                  <i className={`fas ${filter.icon} text-[12px]`} aria-hidden="true" />
                  {filter.label}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-[var(--surface)] text-[#003A8F]' : 'bg-[var(--surface)] text-[var(--muted)]'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="grid gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Search Timeline</span>
              <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 text-sm text-[var(--muted)] transition focus-within:border-[#003A8F] focus-within:bg-[var(--surface)] focus-within:ring-4 focus-within:ring-[#003A8F]/10">
                <i className="fas fa-magnifying-glass text-[var(--text-meta)]" aria-hidden="true" />
                <input
                  className="w-full border-0 bg-transparent p-0 text-sm font-medium text-[var(--text)] outline-none placeholder:text-[var(--text-meta)]"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by activity title, actor, status, or file"
                />
              </span>
            </label>

            <div className="flex items-end">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
                type="button"
                onClick={handleResetFilters}
              >
                <i className="fas fa-rotate-left" aria-hidden="true" />
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_320px] 2xl:grid-cols-[minmax(0,1.75fr)_340px]">
          <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#003A8F]">Timeline View</span>
                <h3 className="mt-2 text-xl font-bold text-slate-950">Grouped project activity by month and date</h3>
                <p className="mt-1 max-w-[60ch] text-sm leading-6 text-[var(--muted)]">
                  Important actions stay pinned near the top of each date group. Minor system updates remain available through the expanded timeline controls.
                </p>
              </div>
              {latestEntry ? <Badge label={`Latest: ${formatHistoryDay(latestEntry.timestamp)}`} tone="neutral" icon="fa-clock-rotate-left" /> : null}
            </div>

            {timelineGroups.length ? (
              <div className="mt-6 space-y-8">
                {timelineGroups.map((monthGroup) => (
                  <section key={monthGroup.key} className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[#003A8F]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#003A8F]">{monthGroup.label}</div>
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs font-medium text-[var(--muted)]">{monthGroup.total} activities</span>
                    </div>

                    <div className="space-y-5">
                      {monthGroup.days.map((dayGroup) => {
                        const isExpanded = Boolean(expandedGroups[dayGroup.key]);
                        const majorEntries = dayGroup.entries.filter((entry) => entry.priority === 'major');
                        const minorEntries = dayGroup.entries.filter((entry) => entry.priority === 'minor');
                        const defaultMinorVisibleCount = majorEntries.length === 0 ? Math.min(1, minorEntries.length) : 0;
                        const visibleMinorEntries = isExpanded ? minorEntries : minorEntries.slice(0, defaultMinorVisibleCount);
                        const hiddenMinorCount = isExpanded ? 0 : Math.max(0, minorEntries.length - defaultMinorVisibleCount);

                        return (
                          <div key={dayGroup.key} className="grid gap-4 lg:grid-cols-[108px_minmax(0,1fr)]">
                            <div className="flex lg:block">
                              <div className="inline-flex w-full items-center gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 lg:grid lg:gap-1 lg:px-3 lg:text-center">
                                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{dayGroup.weekday}</span>
                                <strong className="text-2xl font-extrabold leading-none text-slate-950">{dayGroup.dayNumber}</strong>
                                <span className="text-xs text-[var(--muted)]">{dayGroup.monthStamp}</span>
                              </div>
                            </div>

                            <div className="relative space-y-3 pl-7 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
                              {[...majorEntries, ...visibleMinorEntries].map((entry) => (
                                <article
                                  key={entry.id}
                                  className={`group relative rounded-[24px] p-4 shadow-sm ring-1 transition duration-150 hover:-translate-y-px hover:shadow-md ${
                                    entry.priority === 'major' ? 'bg-[var(--surface)] ring-slate-200' : 'bg-[var(--surface-alt)] ring-slate-200/80'
                                  }`}
                                >
                                  <span className={`absolute -left-[27px] top-5 flex h-5 w-5 items-center justify-center rounded-full border-4 border-[var(--border)] ${ICON_TONE_STYLES[entry.tone]}`}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                  </span>

                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge label={entry.eventLabel} tone={entry.tone} icon={entry.icon} />
                                        <Badge label={entry.statusLabel} tone={entry.statusTone} />
                                        <span className="text-xs font-medium text-[var(--muted)]">{formatHistoryTime(entry.timestamp)}</span>
                                      </div>

                                      <div className="mt-3">
                                        <h4 className="text-base font-bold leading-6 text-slate-950">{entry.title}</h4>
                                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{entry.description}</p>
                                      </div>
                                    </div>

                                    <div className="flex min-w-[170px] items-center gap-3 rounded-2xl bg-[var(--surface-alt)] px-3 py-2">
                                      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${ICON_TONE_STYLES[entry.tone]}`}>
                                        {getInitials(entry.actor)}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[var(--text)]">{entry.actor}</p>
                                        <p className="truncate text-xs text-[var(--muted)]">{entry.sourceLabel}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {entry.details.map((detail) => (
                                      <span key={`${entry.id}-${detail}`} className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]">
                                        {detail}
                                      </span>
                                    ))}
                                  </div>

                                  {entry.route ? (
                                    <Link prefetch={false}
                                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#003A8F] transition hover:text-[#002c6b]"
                                      href={entry.route}
                                    >
                                      <i className="fas fa-arrow-right" aria-hidden="true" /> {entry.actionLabel || 'Open Related Page'}
                                    </Link>
                                  ) : null}
                                </article>
                              ))}

                              {hiddenMinorCount ? (
                                <button
                                  aria-expanded={isExpanded}
                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
                                  type="button"
                                  onClick={() => toggleGroupExpansion(dayGroup.key)}
                                >
                                  <i className="fas fa-chevron-down text-xs" aria-hidden="true" />
                                  Show {hiddenMinorCount} more update{hiddenMinorCount === 1 ? '' : 's'}
                                </button>
                              ) : null}

                              {isExpanded && minorEntries.length > defaultMinorVisibleCount ? (
                                <button
                                  aria-expanded={isExpanded}
                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                                  type="button"
                                  onClick={() => toggleGroupExpansion(dayGroup.key)}
                                >
                                  <i className="fas fa-chevron-up text-xs" aria-hidden="true" />
                                  Hide minor updates
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-alt)] p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#003A8F]">
                  <i className="fas fa-clock-rotate-left text-lg" aria-hidden="true" />
                </span>
                <strong className="mt-4 block text-lg font-bold text-slate-950">No history records match the current filter</strong>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Try clearing the search or switching to another activity tab to restore the full timeline.</p>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
                  type="button"
                  onClick={handleResetFilters}
                >
                  <i className="fas fa-rotate-left" aria-hidden="true" />
                  Reset Filters
                </button>
              </div>
            )}
          </article>

          <aside className="grid gap-4 xl:sticky xl:top-6 xl:self-start">
            <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003A8F]">Current Context</span>
              <h3 className="mt-2 text-lg font-bold text-slate-950">What matters next</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-[var(--surface-alt)] p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Current Milestone</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{data.project.currentMilestone}</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-alt)] p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Repository Status</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{data.project.repositoryStatus}</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-alt)] p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Upcoming Deadline</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[var(--text)]">{data.project.upcomingDeadline}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003A8F]">Activity Mix</span>
              <h3 className="mt-2 text-lg font-bold text-slate-950">Where the timeline is busiest</h3>
              <div className="mt-4 space-y-2.5">
                {HISTORY_EVENT_FILTERS.map((filterKey) => {
                  const filter = HISTORY_FILTERS.find((item) => item.key === filterKey)!;

                  return (
                    <button
                      key={filterKey}
                      className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-3 text-left transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                      type="button"
                      onClick={() => setSelectedFilter(filterKey)}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#003A8F]">
                          <i className={`fas ${filter.icon}`} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[var(--text)]">{filter.label}</span>
                          <span className="block text-xs text-[var(--muted)]">Mapped from the student workspace records</span>
                        </span>
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--text)] shadow-sm">{filterCounts[filterKey]}</span>
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003A8F]">Related Pages</span>
              <h3 className="mt-2 text-lg font-bold text-slate-950">Jump to the source modules</h3>
              <div className="mt-4 space-y-2.5">
                {quickLinks.map((item) => (
                  <Link prefetch={false}
                    key={item.href}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-3 transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                    href={item.href}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003A8F]">
                      <i className={`fas ${item.icon}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--text)]">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{item.copy}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </>
  );
}
