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

const PRIMARY_SURFACE = 'rounded-xl bg-white p-6 shadow-sm';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function statusLabel(status: ScheduleItemStatus) {
  if (status === 'today') return 'Today';
  if (status === 'overdue') return 'Overdue';
  if (status === 'completed') return 'Completed';
  return 'Upcoming';
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
    <article className={cx('rounded-xl p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <span className={cx('text-xs font-semibold uppercase tracking-[0.16em]', labelClassName)}>{label}</span>
          <strong className="block text-3xl font-semibold tracking-tight text-slate-900">{value}</strong>
        </div>
        <span className={cx('inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 shadow-sm', iconClassName)}>
          <i className={`fas ${icon}`} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
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
  return (
    <article className={cx('rounded-xl bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md', className)}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Pill label={item.type} icon="fa-layer-group" className={TYPE_STYLES[item.type]} />
              <Pill label={statusLabel(item.status)} icon="fa-signal" className={STATUS_STYLES[item.status]} />
              {!compact ? <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.sourceLabel}</span> : null}
            </div>

            <div className="space-y-1">
              <h4 className={cx('font-semibold tracking-tight text-slate-900', compact ? 'text-sm' : 'text-base')}>{item.title}</h4>
              <p className={cx('text-sm text-slate-600', compact ? 'leading-5' : 'leading-6')}>{item.description}</p>
            </div>
          </div>

          <div className="shrink-0 space-y-1 text-sm text-slate-500 xl:text-right">
            <p className="font-semibold text-slate-700">{item.dateLabel}</p>
            <p>{item.timeLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Meta icon="fa-location-dot" value={item.location} />
          <Meta icon="fa-compass" value={item.mode} />
          <Meta icon="fa-flag-checkered" value={item.relatedPhase || item.milestoneTitle || 'Project schedule'} />
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
    <div className="relative pl-6">
      {!isLast ? <span className="absolute left-[11px] top-10 bottom-[-1.5rem] w-px bg-slate-200" aria-hidden="true" /> : null}
      <span className={cx('absolute left-[4px] top-7 h-3.5 w-3.5 rounded-full border-4 border-white shadow-sm', tone.dot)} aria-hidden="true" />
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
    <article className={cx('rounded-xl px-4 py-4', ALERT_CARD_STYLES[alert.tone])}>
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

  useEffect(() => {
    setReferenceDate(startOfDay(new Date()));
  }, []);

  const model = useMemo(() => buildStudentScheduleModel(data, referenceDate), [data, referenceDate]);
  const generatedItems = model.allItems.filter((item) => item.source === 'milestone').length;
  const manualItems = model.allItems.filter((item) => item.source === 'schedule').length;
  const academicEvents = model.allItems.filter((item) => item.source === 'presentation').length;
  const weekDaysWithItems = model.weeklyPlannerCells.filter((cell) => cell.items.length).length;

  const summaryCards = [
    {
      label: 'Active Planner',
      value: model.summary.activeItems,
      description: 'Open schedule items across milestones, meetings, and events.',
      icon: 'fa-calendar-day',
      className: 'bg-blue-50',
      labelClassName: 'text-blue-700/70',
      iconClassName: 'text-blue-700'
    },
    {
      label: 'Deadlines',
      value: model.upcomingDeadlines.length,
      description: model.upcomingDeadlines.length
        ? 'Milestone deadlines and submission windows approaching next.'
        : 'No active deadline is queued right now.',
      icon: 'fa-hourglass-half',
      className: 'bg-rose-50',
      labelClassName: 'text-rose-700/70',
      iconClassName: 'text-rose-700'
    },
    {
      label: 'Consultations',
      value: model.consultationSessions.length,
      description: model.consultationSessions.length
        ? 'Adviser sessions and review meetings already organized in the planner.'
        : 'No active consultation session is currently scheduled.',
      icon: 'fa-users',
      className: 'bg-amber-50',
      labelClassName: 'text-amber-700/80',
      iconClassName: 'text-amber-700'
    },
    {
      label: 'Completed',
      value: model.completedItems.length,
      description: 'Closed consultations, checkpoints, and academic event records.',
      icon: 'fa-circle-check',
      className: 'bg-emerald-50',
      labelClassName: 'text-emerald-700/70',
      iconClassName: 'text-emerald-700'
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

  const timelineSections = [
    {
      id: 'priority',
      eyebrow: 'Priority Events',
      title: 'Priority events',
      description: 'Overdue work appears first, followed by the nearest active deadlines and meetings.',
      items: model.priorityUpcoming,
      badgeLabel: `${model.priorityUpcoming.length} item${model.priorityUpcoming.length === 1 ? '' : 's'}`,
      badgeClassName: model.priorityUpcoming.length ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700',
      icon: 'fa-bolt'
    },
    {
      id: 'week',
      eyebrow: 'This Week',
      title: 'This week',
      description: 'Review the current academic week in one readable schedule list.',
      items: model.thisWeekItems,
      badgeLabel: `${model.thisWeekItems.length} item${model.thisWeekItems.length === 1 ? '' : 's'}`,
      badgeClassName: model.thisWeekItems.length ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700',
      icon: 'fa-calendar-week'
    },
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
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Project Schedule</h1>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    Monitor consultations, deadlines, milestone-driven planner items, and academic events in a cleaner academic planning workspace.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md" href="/students/milestones">
                  <i className="fas fa-timeline" aria-hidden="true" />
                  Open Milestones
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition-all duration-200 hover:bg-amber-100 hover:shadow-md" href="/students/notifications">
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
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
          <div className="space-y-6">
            <article className={PRIMARY_SURFACE}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Academic Planner</span>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Cleaner planning, same schedule data</h2>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    Schedule still combines the existing planner entries, milestone-generated checkpoints, and academic events, but now reads as a single backend-ready dashboard.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill label={`${model.summary.totalItems} total items`} icon="fa-list" className="bg-slate-100 text-slate-700" />
                  <Pill label={`${weekDaysWithItems}/7 active days`} icon="fa-calendar-week" className="bg-blue-100 text-blue-700" />
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50/90 p-5">
                <p className="text-sm leading-6 text-slate-700">{model.plannerNote}</p>
                <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                  {plannerMetrics.map((metric) => (
                    <div key={metric.label} className={cx('border-l-2 pl-4', metric.accentClassName)}>
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{metric.label}</dt>
                      <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{metric.value}</dd>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{metric.detail}</p>
                    </div>
                  ))}
                </dl>
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

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                {model.weeklyPlannerCells.map((cell) => (
                  <article
                    key={cell.dayKey}
                    className={cx(
                      'flex min-h-[220px] flex-col rounded-xl p-4',
                      cell.isToday ? 'bg-blue-50/90 shadow-sm' : 'bg-slate-50/80'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{formatWeekdayLabel(cell.day)}</span>
                        <strong className="block text-base font-semibold text-slate-900">{formatMonthDayLabel(cell.day)}</strong>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {cell.isToday ? <Pill label="Today" icon="fa-clock" className="bg-yellow-100 text-amber-900" /> : null}
                        {cell.items.length ? <span className="text-xs font-semibold text-slate-500">{cell.items.length} item{cell.items.length === 1 ? '' : 's'}</span> : null}
                      </div>
                    </div>

                    <div className="mt-4 flex-1 space-y-3">
                      {cell.items.length ? (
                        cell.items.map((item) => {
                          const tone = eventTone(item);

                          return (
                            <div key={item.id} className="flex gap-3 rounded-lg bg-white/90 px-3 py-3 shadow-sm">
                              <span className={cx('mt-1.5 h-2.5 w-2.5 rounded-full', tone.dot)} aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold leading-5 text-slate-900">{item.title}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.timeLabel} &middot; {item.type}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-lg bg-white/70 px-3 text-center text-sm text-slate-400">
                          No schedule items available
                        </div>
                      )}
                    </div>
                  </article>
                ))}
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

          <aside className={PRIMARY_SURFACE}>
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Next Event</span>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                    {model.nextUpcomingEvent ? model.nextUpcomingEvent.title : 'No upcoming planner item'}
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    The next active planner item stays pinned here so the team can see what comes next immediately.
                  </p>
                </div>

                {model.nextUpcomingEvent ? (
                  <EventItem item={model.nextUpcomingEvent} compact className="bg-slate-50 shadow-none hover:shadow-sm" />
                ) : (
                  <EmptyState copy="No schedule items available" />
                )}
              </section>

              <div className="h-px bg-slate-100" />

              <section className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Alerts</span>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">Urgent deadlines</h3>
                    <p className="text-sm leading-6 text-slate-600">Time-sensitive planner items are grouped here with softer alert backgrounds instead of separate cards.</p>
                  </div>
                  <Pill
                    label={`${model.urgentDeadlines.length} queued`}
                    icon="fa-bell"
                    className={model.urgentDeadlines.length ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}
                  />
                </div>

                {model.urgentDeadlines.length ? (
                  <div className="space-y-3">
                    {model.urgentDeadlines.map((item) => {
                      const tone = eventTone(item);

                      return <EventItem key={item.id} item={item} compact className={cx(tone.panel, 'shadow-none hover:shadow-sm')} />;
                    })}
                  </div>
                ) : (
                  <EmptyState copy="No schedule items available" />
                )}
              </section>

              <div className="h-px bg-slate-100" />

              <section className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Planner Signals</span>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">Generated schedule signals</h3>
                    <p className="text-sm leading-6 text-slate-600">Today&apos;s pressure, milestone risk, and follow-up reminders stay organized in one readable signal list.</p>
                  </div>
                  <Pill label={`${model.alerts.length} signals`} icon="fa-wave-square" className="bg-slate-100 text-slate-700" />
                </div>

                {model.alerts.length ? (
                  <div className="space-y-3">
                    {model.alerts.map((alert) => (
                      <SignalItem key={alert.id} alert={alert} />
                    ))}
                  </div>
                ) : (
                  <EmptyState copy="No planner signals available" />
                )}
              </section>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
