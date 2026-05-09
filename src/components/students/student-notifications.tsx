'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { StudentDashboardData } from '@/lib/mock/student-dashboard';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type NotificationType = StudentDashboardData['notifications'][number]['type'];
type StudentNotification = StudentDashboardData['notifications'][number];

const BADGE_STYLES: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700'
};

const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#002c6b] bg-[#003A8F] px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-px hover:bg-[#002c6b] hover:shadow-md';
const SECONDARY_ACTION_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900';

function sortByCreatedAtDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${BADGE_STYLES[tone]}`}>
      {icon ? <i className={`fas ${icon} text-[10px]`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function getNotificationAction(item: StudentNotification) {
  if (item.route) {
    return {
      href: item.route,
      label: item.actionLabel || 'View Detail'
    };
  }

  const fallbackActionByType: Record<string, { href: string; label: string }> = {
    approval: { href: '/students/project-files', label: 'Open Project Files' },
    deadline: { href: '/students/project-files', label: 'Open Project Files' },
    feedback: { href: '/students/faculty-feedback', label: 'Open Feedback' },
    general: { href: '/students/dashboard', label: 'Open Dashboard' },
    schedule: { href: '/students/schedule', label: 'Check Schedule' },
    transfer: { href: '/students/project-overview', label: 'Open Project Overview' }
  };

  return fallbackActionByType[item.type] || fallbackActionByType.general;
}

function getNotificationTypeMeta(type: NotificationType) {
  switch (type) {
    case 'deadline':
      return {
        label: 'Deadline',
        icon: 'fa-hourglass-half',
        tone: 'danger' as BadgeTone,
        indicatorClass: 'bg-rose-500',
        iconWrapClass: 'bg-rose-50 text-rose-600',
        surfaceClass: 'from-rose-50/90 to-white'
      };
    case 'feedback':
      return {
        label: 'Feedback',
        icon: 'fa-comments',
        tone: 'info' as BadgeTone,
        indicatorClass: 'bg-blue-500',
        iconWrapClass: 'bg-blue-50 text-[#003A8F]',
        surfaceClass: 'from-blue-50/90 to-white'
      };
    case 'schedule':
      return {
        label: 'Schedule',
        icon: 'fa-calendar-check',
        tone: 'neutral' as BadgeTone,
        indicatorClass: 'bg-violet-500',
        iconWrapClass: 'bg-violet-50 text-violet-700',
        surfaceClass: 'from-violet-50/90 to-white'
      };
    case 'approval':
      return {
        label: 'Approval',
        icon: 'fa-circle-check',
        tone: 'success' as BadgeTone,
        indicatorClass: 'bg-emerald-500',
        iconWrapClass: 'bg-emerald-50 text-emerald-700',
        surfaceClass: 'from-emerald-50/90 to-white'
      };
    case 'transfer':
      return {
        label: 'Project Update',
        icon: 'fa-diagram-project',
        tone: 'neutral' as BadgeTone,
        indicatorClass: 'bg-slate-400',
        iconWrapClass: 'bg-slate-100 text-slate-600',
        surfaceClass: 'from-slate-50/90 to-white'
      };
    default:
      return {
        label: 'General',
        icon: 'fa-bell',
        tone: 'neutral' as BadgeTone,
        indicatorClass: 'bg-slate-400',
        iconWrapClass: 'bg-slate-100 text-slate-600',
        surfaceClass: 'from-slate-50/90 to-white'
      };
  }
}

function isUrgentNotification(item: StudentNotification) {
  return !item.read && (item.priority === 'high' || item.type === 'deadline');
}

function isNeedsActionNotification(item: StudentNotification) {
  return !item.read && (item.priority === 'high' || item.type === 'feedback' || item.type === 'deadline' || item.type === 'approval');
}

function NotificationCard({
  item,
  onMarkRead,
  onAction
}: {
  item: StudentNotification & { entityType?: string; entityId?: string };
  onMarkRead: (id: string) => void;
  onAction?: (id: string, action: 'accept' | 'reject') => void;
}) {
  const action = getNotificationAction(item);
  const typeMeta = getNotificationTypeMeta(item.type);
  const priorityTone: BadgeTone = item.priority === 'high' ? 'danger' : 'neutral';
  const isPermissionRequest = item.title === 'Upload Permission Request';

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition duration-150 hover:-translate-y-px hover:shadow-md">
      <span className={`absolute inset-y-0 left-0 w-1 ${typeMeta.indicatorClass}`} />
      <div className="p-5 pl-6">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${typeMeta.iconWrapClass}`}>
              <i className={`fas ${typeMeta.icon}`} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge label={typeMeta.label} tone={typeMeta.tone} icon={typeMeta.icon} />
                <Badge label={item.priority === 'high' ? 'Urgent' : 'Standard'} tone={priorityTone} />
                <Badge label={item.read ? 'Completed' : 'Unread'} tone={item.read ? 'success' : 'warning'} />
                {isPermissionRequest && !item.read ? <Badge label="Action Required" tone="danger" icon="fa-hand" /> : null}
              </div>
              <h4 className="mt-3 text-base font-bold leading-6 text-slate-950 sm:text-lg">{item.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <i className="fas fa-clock" aria-hidden="true" /> {item.dateLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <i className="fas fa-layer-group" aria-hidden="true" /> {item.priority === 'high' ? 'Needs immediate attention' : 'Routine update'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            {isPermissionRequest && !item.read && onAction ? (
              <>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-px hover:bg-emerald-700 hover:shadow-md"
                  type="button"
                  onClick={() => onAction(item.id, 'accept')}
                >
                  <i className="fas fa-check" aria-hidden="true" /> Accept
                </button>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 shadow-sm transition duration-150 hover:-translate-y-px hover:border-rose-300 hover:bg-rose-50 hover:shadow-md"
                  type="button"
                  onClick={() => onAction(item.id, 'reject')}
                >
                  <i className="fas fa-xmark" aria-hidden="true" /> Reject
                </button>
              </>
            ) : (
              <>
                <Link className={PRIMARY_ACTION_CLASS} href={action.href} onClick={() => !item.read && onMarkRead(item.id)}>
                  <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /> {action.label}
                </Link>
                {!item.read ? (
                  <button className={SECONDARY_ACTION_CLASS} type="button" onClick={() => onMarkRead(item.id)}>
                    <i className="fas fa-check" aria-hidden="true" /> Mark Read
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function NotificationSection({
  kicker,
  title,
  copy,
  items,
  emptyCopy,
  tone,
  actions,
  onMarkRead,
  onAction
}: {
  kicker: string;
  title: string;
  copy: string;
  items: StudentNotification[];
  emptyCopy: string;
  tone: BadgeTone;
  actions?: ReactNode;
  onMarkRead: (id: string) => void;
  onAction?: (id: string, action: 'accept' | 'reject') => void;
}) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#003A8F]">{kicker}</span>
          <h3 className="mt-2 text-xl font-bold text-slate-950">{title}</h3>
          <p className="mt-1 max-w-[58ch] text-sm leading-6 text-slate-600">{copy}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge label={`${items.length} item${items.length === 1 ? '' : 's'}`} tone={tone} />
          {actions}
        </div>
      </div>

      {items.length ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <NotificationCard key={item.id} item={item as any} onMarkRead={onMarkRead} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">{emptyCopy}</div>
      )}
    </section>
  );
}

export function StudentNotifications({ data }: { data: StudentDashboardData }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [completedOpen, setCompletedOpen] = useState(false);
  const [notificationsData, setNotificationsData] = useState(() => sortByCreatedAtDesc(data.notifications || []));

  const [realNotifications, setRealNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!data.profile.user_id) return;

    const fetchNotifications = async () => {
      try {
        const notifRes = await fetch(`/api/notifications?userId=${encodeURIComponent(data.profile.user_id)}`, { cache: 'no-store' });
        if (notifRes.ok) {
          const notifs = await notifRes.json();
          setRealNotifications(notifs);
        }
      } catch (e) {
        console.error('Failed to poll notifications', e);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [data.profile.user_id]);

  useEffect(() => {
    const combined: any[] = [];
    if (realNotifications.length > 0) {
      realNotifications.forEach(notif => {
        combined.push({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type === 'info' ? 'general' : notif.type,
          priority: notif.type === 'warning' || notif.type === 'danger' ? 'high' : 'normal',
          read: notif.status === 'READ',
          created_at: notif.createdAt,
          dateLabel: new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          route: '/students/notifications',
        } as any);
      });
    }
    setNotificationsData(sortByCreatedAtDesc(combined));
  }, [realNotifications]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadFeedbackCount = data.feedback.filter((item) => item.unread).length;
  const filteredNotifications = useMemo(() => {
    return notificationsData.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter === 'read' && !item.read) return false;
      if (statusFilter === 'unread' && item.read) return false;
      return true;
    });
  }, [notificationsData, statusFilter, typeFilter]);
  const unreadNotificationsCount = notificationsData.filter((item) => !item.read).length;
  const deadlines = notificationsData.filter((item) => item.type === 'deadline').length;
  const feedbackItems = notificationsData.filter((item) => item.type === 'feedback').length;
  const scheduleItems = notificationsData.filter((item) => item.type === 'schedule').length;
  const completedCount = notificationsData.filter((item) => item.read).length;
  const latestNotification = notificationsData[0] || null;
  const focusNotification = filteredNotifications.find((item) => isUrgentNotification(item)) || filteredNotifications.find((item) => !item.read) || filteredNotifications[0] || null;
  const focusNotificationAction = focusNotification ? getNotificationAction(focusNotification) : null;
  const focusNotificationMeta = focusNotification ? getNotificationTypeMeta(focusNotification.type) : null;
  const remainingNotifications = focusNotification
    ? filteredNotifications.filter((item) => item.id !== focusNotification.id)
    : filteredNotifications;
  const needsActionNotifications = remainingNotifications.filter((item) => isNeedsActionNotification(item));
  const needsActionIds = new Set(needsActionNotifications.map((item) => item.id));
  const updatesNotifications = remainingNotifications.filter((item) => !item.read && !needsActionIds.has(item.id));
  const completedNotifications = remainingNotifications.filter((item) => item.read);
  const focusQueue = filteredNotifications.filter((item) => !item.read || item.priority === 'high').slice(0, 5);
  const notificationBreakdown = [
    { key: 'feedback', label: 'Feedback Notices', count: feedbackItems, href: '/students/faculty-feedback', icon: 'fa-comments' },
    { key: 'deadlines', label: 'Deadline Reminders', count: deadlines, href: '/students/project-files', icon: 'fa-hourglass-half' },
    { key: 'schedule', label: 'Schedule Alerts', count: scheduleItems, href: '/students/schedule', icon: 'fa-calendar-check' }
  ].filter((item) => item.count > 0);

  const markRead = (id: string) => {
    setNotificationsData((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setRealNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'READ', readAt: new Date().toISOString() } : item)));
    void fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id, action: 'read' }),
      keepalive: true
    }).finally(() => {
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    });
  };

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action })
      });
      if (res.ok) {
        // Optimistically update the UI to mark it read
        markRead(id);
      }
    } catch (e) {
      console.error('Failed to process notification action', e);
    }
  };

  const markAllRead = () => {
    setNotificationsData((prev) => prev.map((item) => ({ ...item, read: true })));
    const unreadIds = notificationsData.filter((item) => !item.read).map((item) => item.id);
    setRealNotifications((prev) => prev.map((item) => (unreadIds.includes(item.id) ? { ...item, status: 'READ', readAt: new Date().toISOString() } : item)));
    unreadIds.forEach((notificationId) => {
      void fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'read' }),
        keepalive: true
      });
    });
    window.dispatchEvent(new Event('thesistrack:notifications-updated'));
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const completedIsOpen = statusFilter === 'read' ? true : completedOpen;
  const summaryCards = [
    {
      label: 'Needs Attention',
      value: unreadNotificationsCount,
      note: unreadNotificationsCount ? 'Unread items still waiting in the student inbox.' : 'The active inbox is currently clear.',
      icon: 'fa-bell',
      tone: 'warning' as BadgeTone
    },
    {
      label: 'Deadline Alerts',
      value: deadlines,
      note: deadlines ? 'Time-sensitive reminders for files, submissions, or defense prep.' : 'No deadline alert is currently active.',
      icon: 'fa-hourglass-half',
      tone: 'danger' as BadgeTone
    },
    {
      label: 'Feedback Notices',
      value: unreadFeedbackCount,
      note: unreadFeedbackCount ? 'Unread adviser or panel items need review.' : 'No unread faculty feedback notice is pending.',
      icon: 'fa-comments',
      tone: 'info' as BadgeTone
    },
    {
      label: 'Completed',
      value: completedCount,
      note: completedCount ? 'Read notifications preserved for follow-up and reference.' : 'No completed notification is stored yet.',
      icon: 'fa-check-double',
      tone: 'success' as BadgeTone
    }
  ];

  const typeFilterOptions: Array<{ value: NotificationType | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: 'fa-layer-group' },
    { value: 'feedback', label: 'Feedback', icon: 'fa-comments' },
    { value: 'deadline', label: 'Deadline', icon: 'fa-hourglass-half' },
    { value: 'approval', label: 'Approval', icon: 'fa-circle-check' },
    { value: 'schedule', label: 'Schedule', icon: 'fa-calendar-check' },
    { value: 'general', label: 'General', icon: 'fa-bell' },
    { value: 'transfer', label: 'Project', icon: 'fa-diagram-project' }
  ];

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
                <span>Notifications</span>
              </span>
            </div>
            <h1>Notifications</h1>
            <p>Stay updated on project alerts, evaluation schedules, and upcoming milestones.</p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <article className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#003A8F]">Notification Center</span>
                <h2 className="mt-2 max-w-[18ch] text-[clamp(1.65rem,3vw,2.15rem)] font-extrabold leading-tight text-slate-950">
                  A cleaner student inbox for alerts, deadlines, and review updates
                </h2>
                <p className="mt-3 max-w-[62ch] text-sm leading-7 text-slate-600">
                  Focus on the urgent item first, process what still needs action, then keep the remaining updates organized without losing the academic trail.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className={PRIMARY_ACTION_CLASS} href="/students/faculty-feedback">
                  <i className="fas fa-comments" aria-hidden="true" /> Open Feedback
                </Link>
                <Link className={SECONDARY_ACTION_CLASS} href="/students/schedule">
                  <i className="fas fa-calendar-check" aria-hidden="true" /> Check Schedule
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((item) => (
                <article key={item.label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/80">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        item.tone === 'danger'
                          ? 'bg-rose-50 text-rose-600'
                          : item.tone === 'warning'
                            ? 'bg-amber-50 text-amber-700'
                            : item.tone === 'success'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-[#003A8F]'
                      }`}
                    >
                      <i className={`fas ${item.icon}`} aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{item.label}</span>
                  </div>
                  <strong className="mt-4 block text-3xl font-extrabold leading-none text-slate-950">{item.value}</strong>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.note}</p>
                </article>
              ))}
            </div>
          </article>

          <article
            className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br p-6 shadow-sm ring-1 ring-slate-200/80 ${
              focusNotificationMeta ? focusNotificationMeta.surfaceClass : 'from-blue-50/90 to-white'
            }`}
          >
            {focusNotificationMeta ? <span className={`absolute inset-y-0 left-0 w-1.5 ${focusNotificationMeta.indicatorClass}`} /> : null}

            <div className="pl-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#003A8F]">Focus Alert</span>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">{focusNotification ? focusNotification.title : 'Inbox is clear'}</h3>
                </div>
                {focusNotification ? (
                  <Badge
                    label={focusNotification.read ? 'Reviewed' : focusNotification.priority === 'high' ? 'Urgent' : 'Action Needed'}
                    tone={focusNotification.read ? 'success' : focusNotification.priority === 'high' ? 'danger' : 'warning'}
                  />
                ) : null}
              </div>

              {focusNotification ? (
                <>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{focusNotification.message}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge label={focusNotificationMeta?.label || 'Notification'} tone={focusNotificationMeta?.tone || 'info'} icon={focusNotificationMeta?.icon} />
                    <Badge label={focusNotification.dateLabel} tone="neutral" icon="fa-clock" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {focusNotificationAction ? (
                      <Link className={PRIMARY_ACTION_CLASS} href={focusNotificationAction.href}>
                        <i className="fas fa-arrow-right" aria-hidden="true" /> {focusNotificationAction.label}
                      </Link>
                    ) : null}
                    {!focusNotification.read ? (
                      <button className={SECONDARY_ACTION_CLASS} type="button" onClick={() => markRead(focusNotification.id)}>
                        <i className="fas fa-check" aria-hidden="true" /> Mark Read
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-600">No active notification is waiting in the current view.</p>
              )}

              <div className="mt-6 rounded-2xl bg-white/80 p-4 ring-1 ring-white/70">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Latest Inbox Activity</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {latestNotification ? `${latestNotification.title} was recorded on ${latestNotification.dateLabel}.` : 'No student portal notification has been recorded yet.'}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003A8F]">Inbox Filters</span>
              <p className="mt-2 text-sm text-slate-600">Refine the inbox by type or read state without leaving the current workflow.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge label={`${filteredNotifications.length} visible`} tone="info" icon="fa-filter" />
              <Badge label={`${focusQueue.length} in queue`} tone={focusQueue.length ? 'warning' : 'neutral'} icon="fa-list-check" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {typeFilterOptions.map((option) => {
              const isActive = typeFilter === option.value;
              const count = option.value === 'all' ? notificationsData.length : notificationsData.filter((item) => item.type === option.value).length;

              return (
                <button
                  key={option.value}
                  aria-pressed={isActive}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition ${
                    isActive
                      ? 'border-[#003A8F]/20 bg-[#003A8F]/10 text-[#003A8F]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900'
                  }`}
                  type="button"
                  onClick={() => setTypeFilter(option.value)}
                >
                  <i className={`fas ${option.icon} text-[12px]`} aria-hidden="true" />
                  {option.label}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-white/80 text-[#003A8F]' : 'bg-white text-slate-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="grid gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Status</span>
              <select
                className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#003A8F] focus:bg-white focus:ring-4 focus:ring-[#003A8F]/10"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'read' | 'unread')}
              >
                <option value="all">All notifications</option>
                <option value="unread">Unread only</option>
                <option value="read">Completed only</option>
              </select>
            </label>

            <button className={SECONDARY_ACTION_CLASS} type="button" onClick={resetFilters}>
              <i className="fas fa-rotate-left" aria-hidden="true" /> Reset Filters
            </button>

            <button className={PRIMARY_ACTION_CLASS} type="button" onClick={markAllRead} disabled={!unreadNotificationsCount}>
              <i className="fas fa-check-double" aria-hidden="true" /> Mark All Read
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_320px] 2xl:grid-cols-[minmax(0,1.65fr)_340px]">
          <div className="grid gap-5">
            <NotificationSection
              kicker="Needs Action"
              title="Priority inbox"
              copy="Unread feedback, deadlines, and actionable approvals stay here until the student team responds."
              items={needsActionNotifications}
              emptyCopy="No actionable notification is waiting after the current filters were applied."
              tone="warning"
              actions={needsActionNotifications.length ? <Badge label="Respond first" tone="danger" icon="fa-bolt" /> : undefined}
              onMarkRead={markRead}
              onAction={handleAction}
            />

            <NotificationSection
              kicker="Updates"
              title="Non-urgent updates"
              copy="Schedule changes, general reminders, and lower-pressure updates remain visible without crowding the action queue."
              items={updatesNotifications}
              emptyCopy="No non-urgent update is present in the current filtered view."
              tone="info"
              onMarkRead={markRead}
              onAction={handleAction}
            />

            <section className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#003A8F]">Completed</span>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">Archived after review</h3>
                  <p className="mt-1 max-w-[58ch] text-sm leading-6 text-slate-600">Read notifications stay stored for reference, traceability, and follow-up navigation.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={`${completedNotifications.length} item${completedNotifications.length === 1 ? '' : 's'}`} tone="success" />
                  <button className={SECONDARY_ACTION_CLASS} type="button" onClick={() => setCompletedOpen((previous) => !previous)}>
                    <i className={`fas ${completedIsOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
                    {completedIsOpen ? 'Hide Completed' : 'Show Completed'}
                  </button>
                </div>
              </div>

              {completedIsOpen ? (
                completedNotifications.length ? (
                  <div className="mt-5 space-y-3">
                    {completedNotifications.map((item) => (
                      <NotificationCard key={item.id} item={item as any} onMarkRead={markRead} onAction={handleAction} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
                    No completed notification is available after the current filters were applied.
                  </div>
                )
              ) : (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
                  Completed notifications are hidden by default to keep the inbox focused. Open this section when you need past items.
                </div>
              )}
            </section>
          </div>

          <aside className="grid gap-4 xl:sticky xl:top-6 xl:self-start">
            <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003A8F]">Action Queue</span>
                  <h3 className="mt-2 text-lg font-bold text-slate-950">Priority follow-ups</h3>
                </div>
                <Badge label={`${focusQueue.length} queued`} tone={focusQueue.length ? 'warning' : 'neutral'} />
              </div>

              <div className="mt-4 space-y-2.5">
                {focusQueue.length ? (
                  focusQueue.map((item) => {
                    const action = getNotificationAction(item);
                    const typeMeta = getNotificationTypeMeta(item.type);

                    return (
                      <Link
                        key={item.id}
                        className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/80 transition hover:-translate-y-px hover:bg-white hover:shadow-sm"
                        href={action.href}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${typeMeta.iconWrapClass}`}>
                          <i className={`fas ${typeMeta.icon}`} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-5 text-slate-900">{item.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{item.dateLabel}</span>
                            <span className="text-[#F6BE00]">•</span>
                            <span>{typeMeta.label}</span>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right mt-1 text-xs text-slate-400" aria-hidden="true" />
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm leading-6 text-slate-600">No priority item is waiting in the current filtered view.</p>
                )}
              </div>
            </article>

            <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003A8F]">Notification Breakdown</span>
              <h3 className="mt-2 text-lg font-bold text-slate-950">Where updates are coming from</h3>

              <div className="mt-4 space-y-2.5">
                {notificationBreakdown.map((item) => (
                  <Link
                    key={item.key}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/80 transition hover:-translate-y-px hover:bg-white hover:shadow-sm"
                    href={item.href}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003A8F]">
                      <i className={`fas ${item.icon}`} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-sm text-slate-900">{item.label}</strong>
                      <small className="text-xs text-slate-500">{item.count} alert{item.count === 1 ? '' : 's'}</small>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{item.count}</span>
                  </Link>
                ))}
              </div>
            </article>

            <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003A8F]">Quick Access</span>
              <h3 className="mt-2 text-lg font-bold text-slate-950">Continue related student workflows</h3>

              <div className="mt-4 space-y-2.5">
                {[
                  { href: '/students/faculty-feedback', label: 'Faculty Feedback', copy: 'Respond to adviser and panel comments.', icon: 'fa-comments' },
                  { href: '/students/project-files', label: 'Project Files', copy: 'Review uploads tied to deadlines and approvals.', icon: 'fa-folder-open' },
                  { href: '/students/schedule', label: 'Schedule', copy: 'Check consultation sessions and updated events.', icon: 'fa-calendar-days' }
                ].map((item) => (
                  <Link
                    key={item.href}
                    className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/80 transition hover:-translate-y-px hover:bg-white hover:shadow-sm"
                    href={item.href}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003A8F]">
                      <i className={`fas ${item.icon}`} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <strong className="block text-sm text-slate-900">{item.label}</strong>
                      <small className="text-xs leading-5 text-slate-500">{item.copy}</small>
                    </div>
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
