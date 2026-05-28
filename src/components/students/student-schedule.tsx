'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import {
  buildStudentScheduleModel,
  formatMonthDayLabel,
  formatWeekRangeLabel,
  formatWeekdayLabel,
  startOfDay,
  type AlertTone,
  type ScheduleItemPriority,
  type ScheduleItemStatus,
  type ScheduleItemType,
  type StudentScheduleAlert,
  type StudentScheduleItem
} from '@/lib/student-schedule';

const TYPE_STYLES: Record<ScheduleItemType, string> = {
  Meeting: 'bg-blue-100 text-blue-700',
  Consultation: 'bg-blue-50 text-blue-700',
  Deadline: 'bg-rose-100 text-rose-700',
  Event: 'bg-slate-100 text-slate-700',
  Reminder: 'bg-amber-100 text-amber-700'
};

const STATUS_STYLES: Record<ScheduleItemStatus, string> = {
  upcoming: 'bg-amber-100 text-amber-800',
  today: 'bg-yellow-100 text-amber-900',
  overdue: 'bg-rose-100 text-rose-700',
  completed: 'bg-emerald-100 text-emerald-700'
};

const ALERT_LABEL_STYLES: Record<AlertTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700'
};

const ALERT_CARD_STYLES: Record<AlertTone, string> = {
  neutral: 'bg-slate-50 text-slate-700',
  info: 'bg-blue-50 text-blue-800',
  success: 'bg-green-50 text-emerald-800',
  warning: 'bg-yellow-50 text-amber-900',
  danger: 'bg-red-50 text-rose-900'
};

const ALERT_BAR_STYLES: Record<AlertTone, string> = {
  neutral: 'bg-slate-400',
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500'
};

const PRIORITY_STYLES: Record<ScheduleItemPriority, string> = {
  high: 'bg-rose-50 text-rose-700 ring-rose-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-50 text-slate-600 ring-slate-200'
};

const PRIMARY_SURFACE = 'rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6';
type ScheduleViewFilter = 'all' | 'today' | 'deadline' | 'consultation' | 'event';

const TYPE_ICONS: Record<ScheduleItemType, string> = {
  Meeting: 'fa-users',
  Consultation: 'fa-comments',
  Deadline: 'fa-hourglass-half',
  Event: 'fa-calendar-day',
  Reminder: 'fa-bell'
};

const FILTER_OPTIONS: Array<{ id: ScheduleViewFilter; label: string; icon: string }> = [
  { id: 'all', label: 'All', icon: 'fa-layer-group' },
  { id: 'today', label: 'Today', icon: 'fa-clock' },
  { id: 'deadline', label: 'Deadlines', icon: 'fa-hourglass-half' },
  { id: 'consultation', label: 'Consultations', icon: 'fa-comments' },
  { id: 'event', label: 'Events', icon: 'fa-calendar-day' }
];

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function statusLabel(status: ScheduleItemStatus) {
  if (status === 'today') return 'Today';
  if (status === 'overdue') return 'Overdue';
  if (status === 'completed') return 'Completed';
  return 'Upcoming';
}

function priorityLabel(priority: ScheduleItemPriority) {
  if (priority === 'high') return 'High priority';
  if (priority === 'low') return 'Low priority';
  return 'Medium priority';
}

function getScheduleActionHref(item: StudentScheduleItem) {
  if (item.type === 'Deadline') return '/students/project-files';
  if (item.relatedPhase?.toLowerCase().includes('repository')) return '/students/repository';
  if (item.source === 'milestone') return '/students/milestones';
  return '/students/notifications';
}

function getScheduleSourceLabel(item: StudentScheduleItem) {
  if (item.source === 'schedule') return 'Adviser set';
  if (item.source === 'presentation') return 'Academic event';
  return 'Milestone';
}

function Pill({
  label,
  icon,
  className
}: {
  label: string;
  icon?: string;
  className: string;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
      {icon ? <i className={`fas ${icon} text-[10px] opacity-70`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function EmptyState({ copy = 'No schedule items available' }: { copy?: string }) {
  return (
    <div className="flex min-h-[140px] items-center justify-center rounded-xl bg-slate-50 px-6 py-10 text-center text-sm font-medium text-slate-500">
      {copy}
    </div>
  );
}

function Meta({ icon, value }: { icon: string; value?: string }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
      <i className={`fas ${icon} text-[11px] text-slate-400`} aria-hidden="true" />
      {value}
    </span>
  );
}

function eventTone(item: StudentScheduleItem) {
  if (item.status === 'completed') {
    return {
      border: 'border-emerald-400',
      dot: 'bg-emerald-500',
      panel: 'bg-green-50'
    };
  }

  if (item.status === 'overdue') {
    return {
      border: 'border-rose-400',
      dot: 'bg-rose-500',
      panel: 'bg-red-50'
    };
  }

  return {
    border: 'border-amber-400',
    dot: 'bg-amber-500',
    panel: 'bg-yellow-50'
  };
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  className,
  labelClassName,
  iconClassName
}: {
  label: string;
  value: string | number;
  description: string;
  icon: string;
  className: string;
  labelClassName: string;
  iconClassName: string;
}) {
  return (
    <article className={cx('group relative overflow-hidden rounded-lg border border-slate-200/60 p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:p-5', className)}>
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className={cx('text-[11px] font-bold uppercase tracking-[0.18em]', labelClassName)}>{label}</span>
          <strong className="block text-3xl font-extrabold tracking-tight text-slate-900">{value}</strong>
        </div>
        <span className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-inner ring-1 ring-white/50 transition-transform duration-200 group-hover:scale-105', iconClassName)}>
          <i className={`fas ${icon} text-base drop-shadow-sm`} aria-hidden="true" />
        </span>
      </div>
      <p className="relative mt-3 text-[13px] font-medium leading-relaxed text-slate-600">{description}</p>
    </article>
  );
}

function EventItem({
  item,
  className,
  compact = false
}: {
  item: StudentScheduleItem;
  className?: string;
  compact?: boolean;
}) {
  const tone = eventTone(item);

  return (
    <article className={cx('group relative overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md', className)}>
      <div className={cx('absolute inset-y-0 left-0 w-1', tone.dot)} aria-hidden="true" />
      <div className="grid gap-4 p-4 sm:grid-cols-[116px_minmax(0,1fr)] sm:p-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.dateLabel}</p>
          <p className="mt-1 text-sm font-extrabold tracking-tight text-slate-950">{item.timeLabel}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-white/70', TYPE_STYLES[item.type])}>
              <i className={`fas ${TYPE_ICONS[item.type]} text-[13px]`} aria-hidden="true" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{getScheduleSourceLabel(item)}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={item.type} icon={TYPE_ICONS[item.type]} className={TYPE_STYLES[item.type]} />
                <Pill label={statusLabel(item.status)} icon="fa-signal" className={STATUS_STYLES[item.status]} />
                <Pill label={priorityLabel(item.priority)} icon="fa-flag" className={cx('ring-1', PRIORITY_STYLES[item.priority])} />
              </div>

              <div className="space-y-1.5">
                <h4 className={cx('font-bold tracking-tight text-slate-950 transition-colors group-hover:text-blue-900', compact ? 'text-sm' : 'text-base')}>{item.title}</h4>
                <p className={cx('text-[13px] font-medium text-slate-600', compact ? 'leading-relaxed line-clamp-2' : 'leading-relaxed')}>{item.description}</p>
              </div>
            </div>

            {!compact ? (
              <Link
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                href={getScheduleActionHref(item)}
              >
                <i className="fas fa-arrow-up-right-from-square text-[10px]" aria-hidden="true" />
                Open Action
              </Link>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
            <Meta icon="fa-location-dot" value={item.location} />
            <Meta icon="fa-compass" value={item.mode} />
            <Meta icon="fa-flag-checkered" value={item.relatedPhase || item.milestoneTitle || 'Project schedule'} />
          </div>
        </div>
      </div>
    </article>
  );
}

function TimelineItem({
  item,
  isLast
}: {
  item: StudentScheduleItem;
  isLast: boolean;
}) {
  const tone = eventTone(item);

  return (
    <div className="relative pl-7">
      {!isLast ? <span className="absolute left-[13px] top-12 bottom-[-1.5rem] w-[2px] bg-gradient-to-b from-slate-200 to-slate-100" aria-hidden="true" /> : null}
      <span className={cx('absolute left-[5px] top-8 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200')} aria-hidden="true">
        <span className={cx('h-2.5 w-2.5 rounded-full', tone.dot)} />
      </span>
      <EventItem item={item} className={cx('border-l-4', tone.border)} />
    </div>
  );
}

function TimelineSection({
  eyebrow,
  title,
  description,
  items,
  badgeLabel,
  badgeClassName,
  icon
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: StudentScheduleItem[];
  badgeLabel: string;
  badgeClassName: string;
  icon: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</span>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Pill label={badgeLabel} icon={icon} className={badgeClassName} />
      </div>

      {items.length ? (
        <div className="space-y-4">
          {items.map((event, index) => (
            <TimelineItem key={event.id} item={event} isLast={index === items.length - 1} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

function SignalItem({ alert }: { alert: StudentScheduleAlert }) {
  return (
    <article className={cx('rounded-lg px-4 py-4 ring-1 ring-inset ring-white/60', ALERT_CARD_STYLES[alert.tone])}>
      <div className="flex items-start gap-3">
        <span className={cx('mt-1.5 h-2.5 w-2.5 rounded-full', ALERT_BAR_STYLES[alert.tone])} aria-hidden="true" />
        <div className="min-w-0 space-y-2">
          <Pill label={alert.label} icon="fa-circle-info" className={ALERT_LABEL_STYLES[alert.tone]} />
          <p className="text-sm leading-6 text-current/90">{alert.detail}</p>
        </div>
      </div>
    </article>
  );
}

export function StudentSchedule({ data }: { data: StudentDashboardData }) {
  const [referenceDate, setReferenceDate] = useState(() => startOfDay(data.dashboard?.snapshotAt || new Date()));
  const [activeFilter, setActiveFilter] = useState<ScheduleViewFilter>('all');

  useEffect(() => {
    setReferenceDate(startOfDay(new Date()));
  }, []);

  const model = useMemo(() => buildStudentScheduleModel(data, referenceDate), [data, referenceDate]);
  const generatedItems = model.allItems.filter((item) => item.source === 'milestone').length;
  const manualItems = model.allItems.filter((item) => item.source === 'schedule').length;
  const academicEvents = model.allItems.filter((item) => item.source === 'presentation').length;
  const weekDaysWithItems = model.weeklyPlannerCells.filter((cell) => cell.items.length).length;
  const adviserItems = model.activeItems.filter((item) => item.source === 'schedule');
  const filteredItems = useMemo(() => {
    if (activeFilter === 'today') return model.todayItems;
    if (activeFilter === 'deadline') return model.activeItems.filter((item) => item.type === 'Deadline');
    if (activeFilter === 'consultation') return model.activeItems.filter((item) => item.type === 'Consultation' || item.type === 'Meeting');
    if (activeFilter === 'event') return model.activeItems.filter((item) => item.type === 'Event' || item.type === 'Reminder');

    return model.activeItems;
  }, [activeFilter, model.activeItems, model.todayItems]);

  const summaryCards = [
    {
      label: 'Active Planner',
      value: model.summary.activeItems,
      description: 'Open schedule items across milestones, meetings, and events.',
      icon: 'fa-calendar-day',
      className: 'bg-gradient-to-br from-blue-50/80 to-white border-blue-100/50',
      labelClassName: 'text-blue-600',
      iconClassName: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200'
    },
    {
      label: 'Deadlines',
      value: model.upcomingDeadlines.length,
      description: model.upcomingDeadlines.length
        ? 'Milestone deadlines and submission windows approaching next.'
        : 'No active deadline is queued right now.',
      icon: 'fa-hourglass-half',
      className: 'bg-gradient-to-br from-rose-50/80 to-white border-rose-100/50',
      labelClassName: 'text-rose-600',
      iconClassName: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-200'
    },
    {
      label: 'Consultations',
      value: model.consultationSessions.length,
      description: model.consultationSessions.length
        ? 'Adviser sessions and review meetings already organized in the planner.'
        : 'No active consultation session is currently scheduled.',
      icon: 'fa-users',
      className: 'bg-gradient-to-br from-amber-50/80 to-white border-amber-100/50',
      labelClassName: 'text-amber-600',
      iconClassName: 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200'
    },
    {
      label: 'Completed',
      value: model.completedItems.length,
      description: 'Closed consultations, checkpoints, and academic event records.',
      icon: 'fa-circle-check',
      className: 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-100/50',
      labelClassName: 'text-emerald-600',
      iconClassName: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200'
    }
  ] as const;

  const plannerMetrics = [
    {
      label: 'Generated',
      value: generatedItems,
      detail: 'Milestone-driven schedule items.',
      accentClassName: 'border-blue-200'
    },
    {
      label: 'Manual',
      value: manualItems,
      detail: 'Recorded consultations, deadlines, and event entries.',
      accentClassName: 'border-amber-200'
    },
    {
      label: 'Academic Events',
      value: academicEvents,
      detail: 'Presentation and achievement records.',
      accentClassName: 'border-emerald-200'
    },
    {
      label: "Today's Schedule",
      value: model.todayItems.length,
      detail: model.todayItems.length ? 'Items that need attention before the day closes.' : 'No schedule item is due today.',
      accentClassName: 'border-amber-300'
    },
    {
      label: 'This Week',
      value: model.thisWeekItems.length,
      detail: `${weekDaysWithItems}/7 days currently carrying activity.`,
      accentClassName: 'border-slate-200'
    },
    {
      label: 'Milestones Tracked',
      value: model.summary.totalMilestones,
      detail: `${model.summary.completedMilestones} completed and ${model.summary.activeMilestones} active in the queue.`,
      accentClassName: 'border-emerald-300'
    }
  ] as const;

  const filterCounts: Record<ScheduleViewFilter, number> = {
    all: model.activeItems.length,
    today: model.todayItems.length,
    deadline: model.activeItems.filter((item) => item.type === 'Deadline').length,
    consultation: model.activeItems.filter((item) => item.type === 'Consultation' || item.type === 'Meeting').length,
    event: model.activeItems.filter((item) => item.type === 'Event' || item.type === 'Reminder').length
  };

  const completedPercent = model.summary.totalMilestones
    ? Math.round((model.summary.completedMilestones / model.summary.totalMilestones) * 100)
    : 0;
  const topSignals = model.alerts.slice(0, 4);
  const priorityQueue = model.priorityUpcoming.slice(0, 5);

  const timelineSections = [
    {
      id: 'completed',
      eyebrow: 'Completed',
      title: 'Completed',
      description: 'Finished milestone checkpoints, consultations, and academic event records stay visible for reference.',
      items: model.completedItems,
      badgeLabel: `${model.completedItems.length} record${model.completedItems.length === 1 ? '' : 's'}`,
      badgeClassName: model.completedItems.length ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700',
      icon: 'fa-circle-check'
    }
  ] as const;

  return (
    <div className="student-schedule-page">
      <header className="top-nav student-schedule-header">
        <div className="top-nav-leading w-full">
          <div className="flex w-full flex-col gap-6 border-b border-slate-200/70 pb-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="page-title student-schedule-header-copy space-y-3">
                <div className="page-title-context student-schedule-header-context flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span className="page-kicker">Student Workspace</span>
                  <span className="page-breadcrumb flex items-center gap-2" aria-hidden="true">
                    <i className="fas fa-angle-right" />
                    <span>Schedule</span>
                  </span>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Schedule</h1>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    Consultations, adviser deadlines, reminders, and project events in one weekly view.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md" href="/students/milestones">
                  <i className="fas fa-timeline" aria-hidden="true" />
                  Open Milestones
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition-all duration-200 hover:bg-amber-100 hover:shadow-md" href="/students/notifications">
                  <i className="fas fa-bell" aria-hidden="true" />
                  Review Alerts
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <SummaryCard key={card.label} {...card} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="page-body w-full space-y-6">
        <section className="flex flex-col gap-6">
          <div className="space-y-6">
            <article className={cx(PRIMARY_SURFACE, 'overflow-hidden')}>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
                <div className="min-w-0 space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Command Center</span>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {model.nextUpcomingEvent ? model.nextUpcomingEvent.title : 'No active schedule item'}
                      </h2>
                      <p className="max-w-3xl text-sm leading-6 text-slate-600">{model.plannerNote}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Pill label={`${model.todayItems.length} today`} icon="fa-clock" className={model.todayItems.length ? 'bg-yellow-100 text-amber-900' : 'bg-slate-100 text-slate-700'} />
                      <Pill label={`${model.summary.overdueMilestones} overdue`} icon="fa-triangle-exclamation" className={model.summary.overdueMilestones ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'} />
                      <Pill label={`${adviserItems.length} adviser-set`} icon="fa-user-tie" className={adviserItems.length ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'} />
                    </div>
                  </div>

                  {model.nextUpcomingEvent ? (
                    <EventItem item={model.nextUpcomingEvent} className="bg-slate-50 shadow-none hover:shadow-sm" />
                  ) : (
                    <EmptyState copy="No active schedule item" />
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {plannerMetrics.map((metric) => (
                      <div key={metric.label} className={cx('rounded-lg border bg-white px-4 py-3', metric.accentClassName)}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{metric.label}</p>
                          <strong className="text-xl font-semibold tracking-tight text-slate-950">{metric.value}</strong>
                        </div>
                        <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{metric.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Attention</span>
                      <h3 className="text-base font-semibold tracking-tight text-slate-950">Signals and priority queue</h3>
                    </div>
                    <Pill label={`${completedPercent}% complete`} icon="fa-chart-simple" className="bg-white text-slate-700 ring-1 ring-slate-200" />
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Milestone completion</span>
                      <span className="text-xs font-bold text-slate-700">{model.summary.completedMilestones}/{model.summary.totalMilestones}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${completedPercent}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {topSignals.map((alert) => (
                      <SignalItem key={alert.id} alert={alert} />
                    ))}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Priority queue</span>
                      <span className="text-xs font-semibold text-slate-500">{priorityQueue.length} active</span>
                    </div>
                    {priorityQueue.length ? (
                      <div className="space-y-2">
                        {priorityQueue.map((item) => (
                          <Link
                            key={item.id}
                            href={getScheduleActionHref(item)}
                            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50"
                          >
                            <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', TYPE_STYLES[item.type])}>
                              <i className={`fas ${TYPE_ICONS[item.type]} text-[12px]`} aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span>
                              <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{item.dateLabel} - {item.timeLabel}</span>
                            </span>
                            <i className="fas fa-chevron-right text-[10px] text-slate-400" aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <EmptyState copy="No active priority items" />
                    )}
                  </div>
                </aside>
              </div>
            </article>

            <article className={PRIMARY_SURFACE}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Weekly Planner</span>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">Week of {formatWeekRangeLabel(model.weekStart, model.weekEnd)}</h3>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    Each day stays visible as a clean planning column so meetings, deadlines, and events are easier to scan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill label="Current Week" icon="fa-calendar-week" className="bg-blue-100 text-blue-700" />
                  <Pill label={`${weekDaysWithItems}/7 active`} icon="fa-layer-group" className="bg-slate-100 text-slate-700" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
                {model.weeklyPlannerCells.map((cell) => (
                  <article
                    key={cell.dayKey}
                    className={cx(
                      'group relative flex min-h-[188px] flex-col overflow-hidden rounded-lg border p-3 transition-all duration-200',
                      cell.isToday
                        ? 'border-blue-200 bg-white shadow-[0_4px_18px_rgb(59,130,246,0.10)] ring-1 ring-blue-100'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                    )}
                  >
                    {cell.isToday && (
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand" />
                    )}

                    <div className="relative flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex flex-col">
                        <span className={cx('text-[9px] font-bold uppercase tracking-[0.2em]', cell.isToday ? 'text-blue-600' : 'text-slate-400')}>{formatWeekdayLabel(cell.day)}</span>
                        <strong className={cx('block text-base font-extrabold tracking-tight', cell.isToday ? 'text-blue-950' : 'text-slate-800')}>{formatMonthDayLabel(cell.day)}</strong>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {cell.isToday ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-sm shadow-blue-500/20">
                            <i className="fas fa-clock text-[7px]" /> Today
                          </span>
                        ) : null}
                        {cell.hasUrgent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-rose-700 ring-1 ring-rose-100">
                            <i className="fas fa-flag text-[7px]" /> Priority
                          </span>
                        ) : null}
                        {cell.items.length ? (
                          <span className={cx('inline-flex h-5 items-center justify-center rounded px-2 text-[10px] font-bold', cell.isToday ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
                            {cell.items.length} item{cell.items.length === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="relative mt-3 flex-1 space-y-2">
                      {cell.items.length ? (
                        cell.items.map((item) => {
                          const tone = eventTone(item);

                          return (
                            <Link
                              key={item.id}
                              href={getScheduleActionHref(item)}
                              className="group/cell relative flex gap-2.5 rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md hover:ring-1 hover:ring-blue-100"
                            >
                              <span className={cx('mt-1 flex h-2 w-2 shrink-0 rounded-full', tone.dot)} aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="text-[12px] font-bold leading-tight text-slate-800 transition-colors group-hover/cell:text-blue-700">{item.title}</p>
                                <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                  <i className="fas fa-clock text-[8px] text-slate-400" /> {item.timeLabel}
                                </p>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center transition-colors group-hover:bg-slate-50/80">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 text-slate-300">
                            <i className="fas fa-calendar-minus text-xs" />
                          </div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Open Day</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className={PRIMARY_SURFACE}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Active Agenda</span>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">Filtered schedule items</h3>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    Adviser-created consultations, deadlines, reminders, and generated milestone dates stay in one list.
                  </p>
                </div>
                <Pill label={`${filteredItems.length} shown`} icon="fa-list" className="bg-slate-100 text-slate-700" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {FILTER_OPTIONS.map((option) => {
                  const active = activeFilter === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveFilter(option.id)}
                      className={cx(
                        'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition',
                        active
                          ? 'border-brand bg-brand text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <i className={`fas ${option.icon} text-xs`} aria-hidden="true" />
                      {option.label}
                      <span className={cx('ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[11px] font-bold', active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>
                        {filterCounts[option.id]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {filteredItems.length ? (
                  filteredItems.map((item) => (
                    <EventItem key={item.id} item={item} />
                  ))
                ) : (
                  <EmptyState copy="No schedule items match this view" />
                )}
              </div>
            </article>

            <article className={PRIMARY_SURFACE}>
              <div className="space-y-8">
                {timelineSections.map((section, index) => (
                  <div key={section.id} className="space-y-8">
                    <TimelineSection
                      eyebrow={section.eyebrow}
                      title={section.title}
                      description={section.description}
                      items={section.items}
                      badgeLabel={section.badgeLabel}
                      badgeClassName={section.badgeClassName}
                      icon={section.icon}
                    />
                    {index !== timelineSections.length - 1 ? <div className="h-px bg-slate-100" /> : null}
                  </div>
                ))}
              </div>
            </article>
          </div>

        </section>
      </div>
    </div>
  );
}
