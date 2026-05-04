'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { logout } from '@/lib/mock/auth';
import type { StudentDashboardData } from '@/lib/mock/student-dashboard';
import { STUDENT_NAV_ITEMS } from '@/components/students/student-navigation';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type FeedbackWorkflowStatus = 'Pending' | 'Revised' | 'Resolved';
type FeedbackFilter = 'all' | 'unread' | 'pending' | 'resolved';
type FeedbackSortOption = 'latest' | 'oldest' | 'priority';
type FeedbackBoardColumnKey = 'unread' | 'pending' | 'resolved';

type FeedbackRecord = StudentDashboardData['feedback'][number] & {
  workflowStatus: FeedbackWorkflowStatus;
  studentReply?: string;
  studentReplyDate?: string;
  relatedChapter: string;
  relatedMilestone: string;
  relatedFile: string;
};

type FeedbackBoardColumn = {
  key: FeedbackBoardColumnKey;
  title: string;
  description: string;
  tone: BadgeTone;
  items: FeedbackRecord[];
};

const WORKFLOW_FILTER_OPTIONS: Array<{ value: FeedbackFilter; label: string; icon: string }> = [
  { value: 'all', label: 'All', icon: 'fa-layer-group' },
  { value: 'unread', label: 'Unread', icon: 'fa-envelope' },
  { value: 'pending', label: 'Pending', icon: 'fa-clock' },
  { value: 'resolved', label: 'Resolved', icon: 'fa-circle-check' }
];

const BUTTON_BASE_CLASS = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#003A8F]/20';
const PRIMARY_BUTTON_CLASS = `${BUTTON_BASE_CLASS} border border-[#002c6b] bg-[#003A8F] text-white shadow-[0_16px_32px_rgba(0,58,143,0.18)] hover:-translate-y-px hover:bg-[#002c6b] hover:shadow-[0_18px_36px_rgba(0,58,143,0.22)]`;
const SECONDARY_BUTTON_CLASS = `${BUTTON_BASE_CLASS} border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50 hover:shadow-md`;
const TERTIARY_BUTTON_CLASS = `${BUTTON_BASE_CLASS} min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-700 shadow-sm hover:-translate-y-px hover:border-slate-300 hover:bg-white`;

const BOARD_COLUMN_STYLES: Record<FeedbackBoardColumnKey, {
  shell: string;
  accent: string;
  badgeTone: BadgeTone;
  iconWrap: string;
  icon: string;
  emptyIcon: string;
  emptyCopy: string;
}> = {
  unread: {
    shell: 'border-blue-100 bg-gradient-to-b from-blue-50/90 to-white',
    accent: 'bg-blue-600',
    badgeTone: 'info',
    iconWrap: 'bg-blue-100 text-blue-700',
    icon: 'fa-envelope',
    emptyIcon: 'fa-inbox',
    emptyCopy: 'No unread review notes in this lane.'
  },
  pending: {
    shell: 'border-amber-100 bg-gradient-to-b from-amber-50/90 to-white',
    accent: 'bg-amber-500',
    badgeTone: 'warning',
    iconWrap: 'bg-amber-100 text-amber-700',
    icon: 'fa-hourglass-half',
    emptyIcon: 'fa-list-check',
    emptyCopy: 'No pending review items at the moment.'
  },
  resolved: {
    shell: 'border-emerald-100 bg-gradient-to-b from-emerald-50/90 to-white',
    accent: 'bg-emerald-500',
    badgeTone: 'success',
    iconWrap: 'bg-emerald-100 text-emerald-700',
    icon: 'fa-circle-check',
    emptyIcon: 'fa-check-double',
    emptyCopy: 'No resolved items in the current filtered view.'
  }
};

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function normalizeFeedbackStatus(status: string): FeedbackWorkflowStatus {
  const normalized = status.toLowerCase();

  if (normalized.includes('resolved') || normalized.includes('approved') || normalized.includes('completed')) {
    return 'Resolved';
  }

  if (normalized.includes('revised') || normalized.includes('reply') || normalized.includes('progress')) {
    return 'Revised';
  }

  return 'Pending';
}

function getStatusTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();
  if (['approved', 'completed', 'resolved'].includes(normalized)) return 'success';
  if (['pending review', 'pending', 'under review', 'revised'].includes(normalized)) return 'warning';
  if (['needs revision', 'danger'].includes(normalized)) return 'danger';
  return 'neutral';
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  const toneClassName = {
    neutral: 'border-slate-200 bg-slate-100 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700'
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${toneClassName}`}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function findLatestDocumentByCategory(data: StudentDashboardData, categories: string[]) {
  return [...data.documents]
    .filter((item) => categories.includes(item.category))
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0]
    ?.fileName;
}

function inferFeedbackContext(item: StudentDashboardData['feedback'][number], data: StudentDashboardData) {
  const haystack = `${item.title} ${item.content}`.toLowerCase();

  if (haystack.includes('chapter 3') || haystack.includes('methodology') || haystack.includes('validation')) {
    return {
      relatedChapter: 'Chapter 3',
      relatedMilestone: 'Development',
      relatedFile: findLatestDocumentByCategory(data, ['chapter-3']) || 'Chapter-3-Methodology-Revision.pdf'
    };
  }

  if (haystack.includes('presentation') || haystack.includes('slide') || haystack.includes('defense')) {
    return {
      relatedChapter: 'Presentation Deck',
      relatedMilestone: 'Final Defense',
      relatedFile: findLatestDocumentByCategory(data, ['presentation-files']) || 'Midterm-Presentation-Deck.pptx'
    };
  }

  if (haystack.includes('pilot') || haystack.includes('beneficiary')) {
    return {
      relatedChapter: 'Implementation Notes',
      relatedMilestone: 'Mock Defense',
      relatedFile: findLatestDocumentByCategory(data, ['system-files']) || 'System-Prototype-v0.9.zip'
    };
  }

  if (haystack.includes('architecture') || haystack.includes('system')) {
    return {
      relatedChapter: 'System Design',
      relatedMilestone: 'Development',
      relatedFile: findLatestDocumentByCategory(data, ['system-files']) || 'System-Prototype-v0.9.zip'
    };
  }

  return {
    relatedChapter: 'General Review',
    relatedMilestone: data.project.currentMilestone || 'Project Review',
    relatedFile: data.documents[0]?.fileName || 'Shared Project Record'
  };
}

function buildFeedbackRecords(data: StudentDashboardData): FeedbackRecord[] {
  return data.feedback.map((item) => ({
    ...item,
    workflowStatus: normalizeFeedbackStatus(item.status),
    ...inferFeedbackContext(item, data)
  }));
}

function getFeedbackPriorityScore(item: FeedbackRecord) {
  let score = 0;

  if (item.unread) score += 40;
  if (item.workflowStatus === 'Pending') score += 30;
  if (item.workflowStatus === 'Revised') score += 20;
  if (item.workflowStatus === 'Resolved') score += 10;
  if (item.mode === 'Adviser') score += 5;

  return score;
}

function sortFeedbackRecords(items: FeedbackRecord[], sortBy: FeedbackSortOption) {
  return [...items].sort((left, right) => {
    const leftDate = new Date(left.created_at).getTime();
    const rightDate = new Date(right.created_at).getTime();

    if (sortBy === 'oldest') {
      return leftDate - rightDate;
    }

    if (sortBy === 'priority') {
      const priorityDelta = getFeedbackPriorityScore(right) - getFeedbackPriorityScore(left);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
    }

    return rightDate - leftDate;
  });
}

function getFeedbackLane(item: FeedbackRecord): FeedbackBoardColumnKey {
  if (item.unread) {
    return 'unread';
  }

  if (item.workflowStatus === 'Resolved') {
    return 'resolved';
  }

  return 'pending';
}

function matchesFeedbackFilter(item: FeedbackRecord, filter: FeedbackFilter) {
  if (filter === 'all') return true;
  return getFeedbackLane(item) === filter;
}

function getFeedbackCardClass(item: FeedbackRecord) {
  if (item.workflowStatus === 'Resolved') return 'is-resolved';
  if (item.workflowStatus === 'Revised') return 'is-revised';
  return 'is-pending';
}

function formatFeedbackTimestamp(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(createdAt));
}

function getFeedbackPreview(content: string, maxLength = 220) {
  return content.length > maxLength ? `${content.slice(0, maxLength).trimEnd()}...` : content;
}

export function StudentFacultyFeedback({ data }: { data: StudentDashboardData }) {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [workflowFilter, setWorkflowFilter] = useState<FeedbackFilter>('all');
  const [reviewerFilter, setReviewerFilter] = useState<'all' | 'Adviser' | 'Panel'>('all');
  const [sortBy, setSortBy] = useState<FeedbackSortOption>('priority');
  const [feedbackData, setFeedbackData] = useState<FeedbackRecord[]>(() => buildFeedbackRecords(data));
  const [replyForms, setReplyForms] = useState<Record<string, boolean>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadNotificationsCount = data.notifications.filter((item) => !item.read).length;
  const unreadFeedbackCount = feedbackData.filter((item) => getFeedbackLane(item) === 'unread').length;
  const pendingRevisionCount = feedbackData.filter((item) => getFeedbackLane(item) === 'pending').length;
  const resolvedCount = feedbackData.filter((item) => getFeedbackLane(item) === 'resolved').length;
  const latestFeedback = sortFeedbackRecords(feedbackData, 'latest')[0] || null;

  const visibleFeedback = useMemo(() => {
    const filtered = feedbackData.filter((item) => {
      if (!matchesFeedbackFilter(item, workflowFilter)) {
        return false;
      }

      if (reviewerFilter !== 'all' && item.mode !== reviewerFilter) {
        return false;
      }

      return true;
    });

    return sortFeedbackRecords(filtered, sortBy);
  }, [feedbackData, reviewerFilter, sortBy, workflowFilter]);

  const boardColumns = useMemo<FeedbackBoardColumn[]>(() => {
    const sectionMap: Record<FeedbackBoardColumnKey, FeedbackRecord[]> = {
      unread: [],
      pending: [],
      resolved: []
    };

    visibleFeedback.forEach((item) => {
      sectionMap[getFeedbackLane(item)].push(item);
    });

    return [
      {
        key: 'unread',
        title: 'Unread',
        description: 'Fresh adviser or panel comments that have not been acknowledged yet.',
        tone: 'info',
        items: sectionMap.unread
      },
      {
        key: 'pending',
        title: 'Pending',
        description: 'Threads currently being revised, replied to, or tracked for follow-up.',
        tone: 'warning',
        items: sectionMap.pending
      },
      {
        key: 'resolved',
        title: 'Resolved',
        description: 'Completed review threads kept as part of the academic review history.',
        tone: 'success',
        items: sectionMap.resolved
      }
    ];
  }, [visibleFeedback]);

  const resetFilters = () => {
    setWorkflowFilter('all');
    setReviewerFilter('all');
    setSortBy('priority');
  };

  const markRead = (id: string) => {
    setFeedbackData((previous) => previous.map((item) => (
      item.id === id ? { ...item, unread: false } : item
    )));
  };

  const resolveFeedback = (id: string) => {
    setFeedbackData((previous) => previous.map((item) => (
      item.id === id
        ? {
            ...item,
            workflowStatus: 'Resolved',
            status: 'Resolved'
          }
        : item
    )));
  };

  const toggleReply = (id: string) => {
    setReplyForms((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const submitReply = (id: string) => {
    const text = replyTexts[id];
    if (!text?.trim()) {
      return;
    }

    setFeedbackData((previous) => previous.map((item) => {
      if (item.id !== id) {
        return item;
      }

      return {
        ...item,
        studentReply: text.trim(),
        studentReplyDate: 'Just now',
        workflowStatus: item.workflowStatus === 'Resolved' ? 'Resolved' : 'Revised',
        status: item.workflowStatus === 'Resolved' ? 'Resolved' : 'Revised'
      };
    }));

    setReplyForms((previous) => ({ ...previous, [id]: false }));
    setReplyTexts((previous) => ({ ...previous, [id]: '' }));
  };

  return (
    <div className="student-faculty-feedback-page w-full min-w-0">
      <button className={`sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`} type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />

      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Faculty Feedback</span>
              </span>
            </div>
            <h1>Faculty Feedback</h1>
            <p>Review adviser comments, feedback history, and revision instructions.</p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <section className="grid gap-5 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <div className="grid gap-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#003A8F]">Academic Review Workflow</span>
            <div className="grid gap-3">
              <h2 className="max-w-[18ch] text-[clamp(1.55rem,2.7vw,2rem)] font-extrabold leading-tight text-slate-950">Track review threads in a clearer academic workflow board</h2>
              <p className="max-w-[62ch] text-sm leading-7 text-slate-600">Unread notes, ongoing revisions, and resolved comments now sit in one Kanban-style review board so the group can scan priorities faster.</p>
            </div>

            <div className="rounded-[22px] border border-blue-100 bg-blue-50/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <p className="text-sm font-semibold text-slate-900">Latest review activity</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {latestFeedback
                  ? `${latestFeedback.title} from ${latestFeedback.facultyName} on ${formatFeedbackTimestamp(latestFeedback.created_at)}.`
                  : 'No faculty comment has been recorded yet for this project workspace.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className={PRIMARY_BUTTON_CLASS} href="/students/project-files">
                <i className="fas fa-file-arrow-up" aria-hidden="true" /> Open Project Files
              </Link>
              <Link className={SECONDARY_BUTTON_CLASS} href="/students/project-overview">
                <i className="fas fa-folder-open" aria-hidden="true" /> View Project
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <article className="rounded-[22px] border border-blue-100 bg-blue-50/80 p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">Unread</span>
              <strong className="mt-2 block text-3xl font-extrabold leading-none text-slate-950">{unreadFeedbackCount}</strong>
              <small className="mt-2 block text-xs leading-5 text-slate-600">New review notes that still need acknowledgment.</small>
            </article>
            <article className="rounded-[22px] border border-amber-100 bg-amber-50/80 p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Pending</span>
              <strong className="mt-2 block text-3xl font-extrabold leading-none text-slate-950">{pendingRevisionCount}</strong>
              <small className="mt-2 block text-xs leading-5 text-slate-600">Threads still being revised, replied to, or monitored.</small>
            </article>
            <article className="rounded-[22px] border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Resolved</span>
              <strong className="mt-2 block text-3xl font-extrabold leading-none text-slate-950">{resolvedCount}</strong>
              <small className="mt-2 block text-xs leading-5 text-slate-600">Completed review records preserved for project history.</small>
            </article>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#003A8F]">Board Controls</span>
              <h3 className="mt-2 text-xl font-bold text-slate-950">Refine the review board</h3>
              <p className="mt-1 max-w-[56ch] text-sm leading-6 text-slate-600">Workflow tabs filter the board lanes, while reviewer and sort options reshape the cards shown in each column.</p>
            </div>
            <Badge label={`${visibleFeedback.length} visible`} tone="warning" icon="fa-filter" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {WORKFLOW_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                aria-pressed={workflowFilter === option.value}
                className={`${BUTTON_BASE_CLASS} min-h-9 rounded-full border px-3.5 text-[13px] shadow-none ${
                  workflowFilter === option.value
                    ? 'border-[#003A8F]/20 bg-[#003A8F]/10 text-[#003A8F]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800'
                }`}
                type="button"
                onClick={() => setWorkflowFilter(option.value)}
              >
                <i className={`fas ${option.icon}`} aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="grid gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500" htmlFor="feedback-reviewer-filter">Reviewer</label>
              <select
                id="feedback-reviewer-filter"
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#003A8F] focus:bg-white focus:ring-4 focus:ring-[#003A8F]/10"
                value={reviewerFilter}
                onChange={(event) => setReviewerFilter(event.target.value as 'all' | 'Adviser' | 'Panel')}
              >
                <option value="all">All reviewers</option>
                <option value="Adviser">Adviser</option>
                <option value="Panel">Panel</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500" htmlFor="feedback-sort">Sort</label>
              <select
                id="feedback-sort"
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#003A8F] focus:bg-white focus:ring-4 focus:ring-[#003A8F]/10"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as FeedbackSortOption)}
              >
                <option value="priority">Priority</option>
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className={SECONDARY_BUTTON_CLASS} type="button" onClick={resetFilters}>
                <i className="fas fa-rotate-left" aria-hidden="true" /> Reset Filters
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {boardColumns.map((column) => {
            const columnStyle = BOARD_COLUMN_STYLES[column.key];

            return (
              <section key={column.key} className={`flex min-h-[24rem] flex-col rounded-[28px] border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)] ${columnStyle.shell}`}>
                <div className={`mb-4 h-1.5 w-full rounded-full ${columnStyle.accent}`} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${columnStyle.iconWrap}`}>
                      <i className={`fas ${columnStyle.icon}`} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-950">{column.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{column.description}</p>
                    </div>
                  </div>
                  <Badge label={`${column.items.length}`} tone={columnStyle.badgeTone} />
                </div>

                <div className="mt-4 grid gap-4">
                  {column.items.length ? (
                    column.items.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${item.mode === 'Adviser' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {getInitials(item.facultyName)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.facultyName}</p>
                              <h4 className="mt-1 text-sm font-bold leading-6 text-slate-950">{item.title}</h4>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            <Badge label={item.mode} tone={item.mode === 'Adviser' ? 'warning' : 'neutral'} />
                            {item.unread ? <Badge label="Unread" tone="info" icon="fa-envelope" /> : null}
                            <Badge label={item.workflowStatus === 'Revised' ? 'Needs Revision' : item.workflowStatus} tone={getStatusTone(item.workflowStatus)} />
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">{getFeedbackPreview(item.content)}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                            <i className="fas fa-user" aria-hidden="true" />
                            {item.facultyName}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                            <i className="fas fa-clock" aria-hidden="true" />
                            {formatFeedbackTimestamp(item.created_at)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">Chapter: {item.relatedChapter}</span>
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">Milestone: {item.relatedMilestone}</span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">File: {item.relatedFile}</span>
                        </div>

                        {item.studentReply ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Your Reply</span>
                              <span className="text-xs font-medium text-slate-400">{item.studentReplyDate}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.studentReply}</p>
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.unread ? (
                            <button className={`${TERTIARY_BUTTON_CLASS} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`} type="button" onClick={() => markRead(item.id)}>
                              <i className="fas fa-envelope-open" aria-hidden="true" /> Mark Read
                            </button>
                          ) : null}
                          {item.workflowStatus !== 'Resolved' ? (
                            <button className={`${TERTIARY_BUTTON_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`} type="button" onClick={() => resolveFeedback(item.id)}>
                              <i className="fas fa-circle-check" aria-hidden="true" /> Resolve
                            </button>
                          ) : null}
                          <button className={TERTIARY_BUTTON_CLASS} type="button" onClick={() => toggleReply(item.id)}>
                            <i className="fas fa-reply" aria-hidden="true" />
                            {replyForms[item.id] ? 'Hide Reply' : item.studentReply ? 'Edit Reply' : 'Reply'}
                          </button>
                        </div>

                        {replyForms[item.id] ? (
                          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <textarea
                              className="min-h-[6.5rem] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#003A8F] focus:ring-4 focus:ring-[#003A8F]/10"
                              rows={4}
                              placeholder="Write a short acknowledgment or update"
                              value={replyTexts[item.id] || ''}
                              onChange={(event) => setReplyTexts((previous) => ({ ...previous, [item.id]: event.target.value }))}
                            />
                            <div className="flex flex-wrap justify-end gap-2">
                              <button className={SECONDARY_BUTTON_CLASS} type="button" onClick={() => toggleReply(item.id)}>
                                <i className="fas fa-xmark" aria-hidden="true" /> Cancel
                              </button>
                              <button className={PRIMARY_BUTTON_CLASS} type="button" onClick={() => submitReply(item.id)}>
                                <i className="fas fa-paper-plane" aria-hidden="true" /> Save Reply
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <div className="flex min-h-[14rem] items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-white/85 p-6 text-center">
                      <div className="grid gap-3">
                        <span className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl ${columnStyle.iconWrap}`}>
                          <i className={`fas ${columnStyle.emptyIcon}`} aria-hidden="true" />
                        </span>
                        <div className="grid gap-1">
                          <strong className="text-sm font-semibold text-slate-900">Nothing to review here</strong>
                          <p className="text-sm leading-6 text-slate-500">{columnStyle.emptyCopy}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </section>
      </div>
    </div>
  );
}
