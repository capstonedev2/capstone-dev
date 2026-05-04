'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import type { WeeklyScheduleItem } from '@/components/adviser/shared/config/dashboard-types';
import {
  NAV_ITEMS,
  WORKSPACE_META,
  buildAdviserScheduleItems,
  buildPanelScheduleItems,
  getShortName,
  isNavItemActive
} from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

type ScheduleFilter = 'all' | 'review' | 'defense';

const toneBadgeStyles: Record<string, string> = {
  info: 'bg-sky-100 text-sky-700',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-rose-100 text-rose-700',
  primary: 'bg-[rgba(0,58,143,0.08)] text-[var(--primary)]',
  neutral: 'bg-slate-100 text-slate-600'
};

function ScheduleSummaryCard({
  icon,
  label,
  value,
  helper,
  tone = 'primary'
}: {
  icon: string;
  label: string;
  value: string | number;
  helper: string;
  tone?: 'primary' | 'warning' | 'success';
}) {
  const toneStyles =
    tone === 'warning'
      ? { background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)' }
      : tone === 'success'
        ? { background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)' }
        : { background: 'rgba(0, 58, 143, 0.08)', color: 'var(--primary)' };

  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</h2>
          <p className="text-sm text-slate-500">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm" style={toneStyles}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

function getScheduleCategory(item: WeeklyScheduleItem): Exclude<ScheduleFilter, 'all'> {
  const reference = `${item.groupName} ${item.eventType}`.toLowerCase();
  return reference.includes('defense') ? 'defense' : 'review';
}

function getScheduleCategoryLabel(item: WeeklyScheduleItem) {
  return getScheduleCategory(item) === 'defense' ? 'Defense-Related' : 'Consultation / Review';
}

function getScheduleSupportNote(item: WeeklyScheduleItem) {
  const reference = item.eventType.toLowerCase();

  if (reference.includes('defense')) {
    return 'Confirm scoring notes, room setup, and the final presentation flow before the session opens.';
  }

  if (reference.includes('consultation')) {
    return 'Bring the latest adviser notes and make sure the students have their progress evidence ready.';
  }

  if (reference.includes('review')) {
    return 'Use this slot to lock the next milestone and surface any revisions that still need a response.';
  }

  return 'Keep the latest supervision notes ready so the next action can be agreed on quickly.';
}

function getActionMeta(workspaceMode: keyof typeof WORKSPACE_META, basePath: string, item: WeeklyScheduleItem) {
  if (workspaceMode === 'panel') {
    return {
      href: `${basePath}/evaluation-queue`,
      label: 'Open queue'
    };
  }

  return {
    href: `${basePath}/groups`,
    label: getScheduleCategory(item) === 'defense' ? 'Open groups' : 'Review groups'
  };
}

function formatDayGroupTitle(dateLabel: string, itemCount: number) {
  return `${dateLabel} - ${itemCount} ${itemCount === 1 ? 'session' : 'sessions'}`;
}

export function AdviserSchedule({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>('all');
  const [search, setSearch] = useState('');

  const meta = WORKSPACE_META[workspaceMode];
  const scheduleItems = useMemo(
    () =>
      workspaceMode === 'panel'
        ? buildPanelScheduleItems(data.panelProjects)
        : buildAdviserScheduleItems(data.upcomingSchedule),
    [workspaceMode, data.panelProjects, data.upcomingSchedule]
  );

  const filteredItems = useMemo(() => {
    let result = scheduleItems;

    if (activeFilter !== 'all') {
      result = result.filter((item) => getScheduleCategory(item) === activeFilter);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((item) =>
        [item.dateLabel, item.timeLabel, item.groupName, item.eventType, item.location ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    return result;
  }, [activeFilter, scheduleItems, search]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, WeeklyScheduleItem[]>();

    filteredItems.forEach((item) => {
      const current = groups.get(item.dateLabel) ?? [];
      current.push(item);
      groups.set(item.dateLabel, current);
    });

    return Array.from(groups.entries()).map(([dateLabel, items]) => ({
      dateLabel,
      items
    }));
  }, [filteredItems]);

  const nextSession = filteredItems[0] ?? scheduleItems[0] ?? null;
  const defenseCount = scheduleItems.filter((item) => getScheduleCategory(item) === 'defense').length;
  const reviewCount = scheduleItems.filter((item) => getScheduleCategory(item) === 'review').length;
  const locationCount = new Set(scheduleItems.map((item) => item.location).filter(Boolean)).size;
  const primaryActionHref =
    workspaceMode === 'panel' ? `${basePath}/evaluation-queue` : `${basePath}/submissions`;
  const primaryActionLabel =
    workspaceMode === 'panel' ? 'Open evaluation queue' : 'Open submissions';
  const secondaryActionHref =
    workspaceMode === 'panel' ? `${basePath}/review-history` : `${basePath}/groups`;
  const secondaryActionLabel =
    workspaceMode === 'panel' ? 'Review history' : 'Open my groups';

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{meta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>Manage consultations, milestone reviews, and defense-related sessions.</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${meta.badgeIcon}`} />
            <span>{meta.badgeLabel}</span>
          </span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link key={item.href} href={item.href} className={isNavItemActive(pathname, item.href) ? 'active' : ''}>
              <i className={`fas ${item.icon}`}></i> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <AdviserPageHeader
          title={workspaceMode === 'panel' ? 'Defense Schedule' : 'Schedule'}
          description={
            workspaceMode === 'panel'
              ? 'Track defense evaluations, review windows, and panel commitments in a cleaner planning view.'
              : 'Manage consultations, milestone reviews, and defense-related sessions in one organized planner.'
          }
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

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ScheduleSummaryCard
              icon="fa-calendar-check"
              label="Upcoming Sessions"
              value={scheduleItems.length}
              helper="Scheduled items currently visible in this workspace"
            />
            <ScheduleSummaryCard
              icon="fa-comments"
              label={workspaceMode === 'panel' ? 'Review Slots' : 'Consultations & Reviews'}
              value={reviewCount}
              helper={
                workspaceMode === 'panel'
                  ? 'Working sessions attached to defense preparation'
                  : 'Meetings focused on milestone guidance and follow-up'
              }
              tone="warning"
            />
            <ScheduleSummaryCard
              icon="fa-gavel"
              label="Defense-Related"
              value={defenseCount}
              helper="Sessions that need defense readiness or evaluation prep"
              tone="success"
            />
            <ScheduleSummaryCard
              icon="fa-location-dot"
              label="Active Venues"
              value={locationCount}
              helper="Distinct rooms or work areas used in the current schedule"
            />
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
            <SectionHeader
              eyebrow="Planner"
              title="Weekly supervision planner"
              description="Filter the week by session type, scan each day's agenda, and jump into the linked workspace when you need to act."
              actions={
                <>
                  <Link
                    href={primaryActionHref}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                  >
                    <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                    {primaryActionLabel}
                  </Link>
                  <Link
                    href={secondaryActionHref}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    <i className="fas fa-layer-group text-xs"></i>
                    {secondaryActionLabel}
                  </Link>
                </>
              }
            />

            <div className="grid gap-3 border-b border-slate-200/80 px-6 py-5 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)] lg:items-center">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all' as const, label: 'All Sessions' },
                  { id: 'review' as const, label: workspaceMode === 'panel' ? 'Review Windows' : 'Consultations & Reviews' },
                  { id: 'defense' as const, label: 'Defense-Related' }
                ].map((option) => {
                  const active = activeFilter === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveFilter(option.id)}
                      className={`inline-flex min-h-[40px] items-center gap-2 rounded-[0.9rem] border px-4 text-sm font-semibold transition ${
                        active
                          ? 'border-transparent bg-[var(--primary)] text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <i className="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by group, event, room, or date..."
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.95fr)]">
              <div className="space-y-5">
                {groupedItems.length ? (
                  groupedItems.map((group) => (
                    <section key={group.dateLabel} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Day Agenda</p>
                          <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                            {formatDayGroupTitle(group.dateLabel, group.items.length)}
                          </h3>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          {group.items.length} planned
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        {group.items.map((item) => {
                          const action = getActionMeta(workspaceMode, basePath, item);
                          return (
                            <article
                              key={item.id}
                              className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                                <div className="w-full max-w-[120px] rounded-2xl bg-slate-50 px-4 py-3 text-center xl:shrink-0">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Time</p>
                                  <p className="mt-2 text-base font-semibold text-slate-900">{item.timeLabel}</p>
                                  <span
                                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                      toneBadgeStyles[item.tone ?? 'primary']
                                    }`}
                                  >
                                    {getScheduleCategoryLabel(item)}
                                  </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <h4 className="text-base font-semibold tracking-tight text-slate-900">
                                        {item.groupName}
                                      </h4>
                                      <p className="mt-1 text-sm text-slate-500">{item.eventType}</p>
                                    </div>
                                    <Link
                                      href={action.href}
                                      className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                                    >
                                      <i className="fas fa-arrow-right text-xs"></i>
                                      {action.label}
                                    </Link>
                                  </div>

                                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Location</p>
                                      <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {item.location ?? 'Venue to be confirmed'}
                                      </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Preparation Focus</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {getScheduleSupportNote(item)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                    <div>
                      <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ background: 'rgba(0, 58, 143, 0.08)', color: 'var(--primary)' }}
                      >
                        <i className="fas fa-calendar-day text-xl"></i>
                      </div>
                      <p className="text-base font-semibold text-slate-700">No schedule items match the current view.</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try switching the session filter or clearing the search field.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-5">
                <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Next Up</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                    {nextSession ? nextSession.groupName : 'Schedule is clear'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {nextSession
                      ? `${nextSession.eventType} - ${nextSession.dateLabel}`
                      : 'No upcoming item is queued in the current planner view.'}
                  </p>

                  {nextSession ? (
                    <>
                      <div className="mt-5 grid gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Time</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{nextSession.timeLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Venue</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {nextSession.location ?? 'Venue to be confirmed'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Assigned To</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {getShortName(data.profile.fullName)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[1.15rem] border border-[rgba(0,58,143,0.12)] bg-[rgba(0,58,143,0.04)] px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900">Preparation note</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{getScheduleSupportNote(nextSession)}</p>
                      </div>
                    </>
                  ) : null}
                </section>

                <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Week At A Glance</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Schedule balance</h3>
                  <div className="mt-5 space-y-3">
                    {[
                      {
                        label: workspaceMode === 'panel' ? 'Evaluation sessions' : 'Consultations & reviews',
                        value: reviewCount,
                        tone: 'warning'
                      },
                      {
                        label: 'Defense-related sessions',
                        value: defenseCount,
                        tone: 'success'
                      },
                      {
                        label: 'Distinct venues',
                        value: locationCount,
                        tone: 'primary'
                      }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <span className="text-sm font-medium text-slate-600">{item.label}</span>
                        <span
                          className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.tone === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : item.tone === 'success'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-[rgba(0,58,143,0.08)] text-[var(--primary)]'
                          }`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Planning Notes</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Keep the week moving</h3>
                  <div className="mt-5 space-y-3">
                    {[
                      workspaceMode === 'panel'
                        ? 'Review the evaluation packet before each defense slot so scoring time stays focused.'
                        : 'Open the latest submission notes before each consultation so feedback stays specific.',
                      'Confirm rooms and attendance early when the same venue is used by multiple sessions.',
                      'Use the grouped agenda above to clear the next milestone decision while the meeting is still fresh.'
                    ].map((note) => (
                      <div key={note} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs"
                          style={{ background: 'rgba(0, 58, 143, 0.08)', color: 'var(--primary)' }}
                        >
                          <i className="fas fa-check"></i>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{note}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
