'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
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

type ScheduleFilter = 'all' | 'consultation' | 'deadline' | 'meeting' | 'reminder' | 'event' | 'defense';

type AdviserScheduleApiItem = {
  id: string;
  projectId: string;
  type: string;
  typeLabel: string;
  status: string;
  title: string;
  scheduledAt: string;
  endsAt?: string | null;
  location?: string;
  notes?: string;
  groupCode?: string;
  groupTitle: string;
  projectTitle: string;
};

type AdviserScheduleProjectOption = {
  id: string;
  title: string;
  groupCode?: string;
  groupTitle: string;
  leaderName?: string;
  members: Array<{
    userId: string;
    name: string;
    isLeader: boolean;
  }>;
};

type ScheduleFormState = {
  projectId: string;
  type: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  notifyStudents: boolean;
};

const SCHEDULE_TYPE_OPTIONS = [
  { value: 'CONSULTATION', label: 'Consultation', icon: 'fa-comments' },
  { value: 'DEADLINE', label: 'Deadline', icon: 'fa-hourglass-half' },
  { value: 'MEETING', label: 'Meeting', icon: 'fa-users' },
  { value: 'REMINDER', label: 'Reminder', icon: 'fa-bell' },
  { value: 'EVENT', label: 'Event', icon: 'fa-calendar-day' },
  { value: 'REVIEW', label: 'Review', icon: 'fa-clipboard-check' }
] as const;

function getInitialScheduleForm(): ScheduleFormState {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  return {
    projectId: '',
    type: 'CONSULTATION',
    title: '',
    date,
    time: '09:00',
    location: '',
    notes: '',
    notifyStudents: true
  };
}

const toneBadgeStyles: Record<string, string> = {
  info: 'bg-sky-100 text-sky-700',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-rose-100 text-rose-700',
  primary: 'bg-[rgba(0,58,143,0.08)] text-[var(--primary)]',
  neutral: 'bg-slate-100 text-slate-600'
};

function getScheduleTypeOption(type: string) {
  return SCHEDULE_TYPE_OPTIONS.find((option) => option.value === type) || SCHEDULE_TYPE_OPTIONS[0];
}

function getScheduleTone(type: string): WeeklyScheduleItem['tone'] {
  if (type === 'DEADLINE') return 'danger';
  if (type === 'REMINDER') return 'warning';
  if (type === 'EVENT') return 'success';
  if (type === 'REVIEW') return 'primary';
  return 'info';
}

function formatApiScheduleDate(value: string) {
  const date = new Date(value);

  return {
    dateLabel: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date),
    timeLabel: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date)
  };
}

function mapApiScheduleItem(item: AdviserScheduleApiItem): WeeklyScheduleItem {
  const option = getScheduleTypeOption(item.type);
  const { dateLabel, timeLabel } = formatApiScheduleDate(item.scheduledAt);

  return {
    id: item.id,
    projectId: item.projectId,
    dateLabel,
    timeLabel,
    groupName: item.groupCode ? `${item.groupCode} - ${item.groupTitle}` : item.groupTitle,
    eventType: `${option.label}: ${item.title}`,
    location: item.location || undefined,
    tone: getScheduleTone(item.type),
    scheduleType: item.type,
    notes: item.notes || undefined
  };
}

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
  switch (item.scheduleType) {
    case 'CONSULTATION':
      return 'consultation';
    case 'DEADLINE':
      return 'deadline';
    case 'MEETING':
    case 'REVIEW':
      return 'meeting';
    case 'REMINDER':
      return 'reminder';
    case 'EVENT':
      return 'event';
  }

  const reference = `${item.groupName} ${item.eventType}`.toLowerCase();
  if (reference.includes('defense')) return 'defense';
  if (reference.includes('deadline') || reference.includes('due')) return 'deadline';
  if (reference.includes('reminder')) return 'reminder';
  if (reference.includes('event')) return 'event';
  if (reference.includes('consultation')) return 'consultation';
  return 'meeting';
}

function getScheduleCategoryLabel(item: WeeklyScheduleItem) {
  switch (getScheduleCategory(item)) {
    case 'defense':
      return 'Defense-Related';
    case 'deadline':
      return 'Deadline';
    case 'reminder':
      return 'Reminder';
    case 'event':
      return 'Event';
    case 'consultation':
      return 'Consultation';
    case 'meeting':
    default:
      return 'Meeting / Review';
  }
}

function getScheduleSupportNote(item: WeeklyScheduleItem) {
  const reference = item.eventType.toLowerCase();

  if (reference.includes('defense')) {
    return 'Confirm scoring notes, room setup, and the final presentation flow before the session opens.';
  }

  if (reference.includes('deadline') || item.scheduleType === 'DEADLINE') {
    return 'Students should see the due date clearly and prepare the required files before the deadline.';
  }

  if (reference.includes('reminder') || item.scheduleType === 'REMINDER') {
    return 'Use this reminder to keep the group aligned on the next required action.';
  }

  if (reference.includes('event') || item.scheduleType === 'EVENT') {
    return 'Confirm attendance, venue details, and any materials needed before the event.';
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
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(() => getInitialScheduleForm());
  const [adviserScheduleItems, setAdviserScheduleItems] = useState<AdviserScheduleApiItem[]>([]);
  const [scheduleProjects, setScheduleProjects] = useState<AdviserScheduleProjectOption[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const meta = WORKSPACE_META[workspaceMode];
  const fallbackScheduleItems = useMemo(
    () =>
      workspaceMode === 'panel'
        ? buildPanelScheduleItems(data.panelProjects)
        : buildAdviserScheduleItems(data.upcomingSchedule),
    [workspaceMode, data.panelProjects, data.upcomingSchedule]
  );
  const savedAdviserScheduleItems = useMemo(
    () => adviserScheduleItems.map(mapApiScheduleItem),
    [adviserScheduleItems]
  );
  const scheduleItems = workspaceMode === 'adviser' ? savedAdviserScheduleItems : fallbackScheduleItems;

  useEffect(() => {
    if (workspaceMode !== 'adviser') {
      return;
    }

    let cancelled = false;

    async function loadScheduleItems() {
      setIsLoadingSchedule(true);
      setScheduleError(null);

      try {
        const response = await fetch('/api/adviser-schedule-items', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load adviser schedule items.');
        }

        if (!cancelled) {
          const nextItems = payload?.items || [];
          const nextProjects = payload?.projects || [];
          setAdviserScheduleItems(nextItems);
          setScheduleProjects(nextProjects);
          setScheduleForm((current) => ({
            ...current,
            projectId: current.projectId || nextProjects[0]?.id || ''
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setScheduleError(error instanceof Error ? error.message : 'Unable to load adviser schedule items.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSchedule(false);
        }
      }
    }

    void loadScheduleItems();

    return () => {
      cancelled = true;
    };
  }, [workspaceMode]);

  function updateScheduleForm<Key extends keyof ScheduleFormState>(key: Key, value: ScheduleFormState[Key]) {
    setScheduleForm((current) => ({ ...current, [key]: value }));
  }

  async function saveScheduleItem() {
    if (workspaceMode !== 'adviser' || isSavingSchedule) {
      return;
    }

    setIsSavingSchedule(true);
    setScheduleError(null);
    setScheduleNotice(null);

    try {
      const response = await fetch('/api/adviser-schedule-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to save schedule item.');
      }

      setAdviserScheduleItems((current) => [...current, payload.item].sort((left, right) =>
        new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
      ));
      setScheduleForm((current) => ({
        ...getInitialScheduleForm(),
        projectId: current.projectId,
        type: current.type,
        notifyStudents: current.notifyStudents
      }));
      setScheduleNotice(payload?.message || 'Schedule item saved.');
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Unable to save schedule item.');
    } finally {
      setIsSavingSchedule(false);
    }
  }

  const filteredItems = useMemo(() => {
    let result = scheduleItems;

    if (activeFilter !== 'all') {
      result = result.filter((item) => getScheduleCategory(item) === activeFilter);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((item) =>
        [item.dateLabel, item.timeLabel, item.groupName, item.eventType, item.location ?? '', item.notes ?? '', item.scheduleType ?? '']
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
  const reviewCount = scheduleItems.filter((item) => ['consultation', 'meeting'].includes(getScheduleCategory(item))).length;
  const deadlineCount = scheduleItems.filter((item) => ['deadline', 'reminder'].includes(getScheduleCategory(item))).length;
  const locationCount = new Set(scheduleItems.map((item) => item.location).filter(Boolean)).size;
  const selectedScheduleTypeOption = getScheduleTypeOption(scheduleForm.type);
  const selectedScheduleProject = scheduleProjects.find((project) => project.id === scheduleForm.projectId) || null;
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
              icon={workspaceMode === 'panel' ? 'fa-gavel' : 'fa-hourglass-half'}
              label={workspaceMode === 'panel' ? 'Defense-Related' : 'Deadlines & Reminders'}
              value={workspaceMode === 'panel' ? defenseCount : deadlineCount}
              helper={workspaceMode === 'panel'
                ? 'Sessions that need defense readiness or evaluation prep'
                : 'Time-sensitive items students can track in their schedule'}
              tone="success"
            />
            <ScheduleSummaryCard
              icon="fa-location-dot"
              label="Active Venues"
              value={locationCount}
              helper="Distinct rooms or work areas used in the current schedule"
            />
          </section>

          {workspaceMode === 'adviser' ? (
            <section className="overflow-hidden rounded-[1.15rem] border border-slate-200/80 bg-white shadow-sm">
              <form
                className="grid lg:grid-cols-[minmax(0,1fr)_300px]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveScheduleItem();
                }}
              >
                <div className="p-5">
                  <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,58,143,0.08)] text-[var(--primary)]">
                        <i className="fas fa-calendar-plus text-sm" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Create Schedule</p>
                        <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">New adviser schedule item</h2>
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      <i className="fas fa-users text-[10px]" aria-hidden="true" />
                      Student schedule
                    </span>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(260px,0.95fr)_minmax(360px,1.05fr)]">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Group / Project</span>
                      <div className="relative">
                        <i className="fas fa-layer-group pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true" />
                        <select
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10"
                          value={scheduleForm.projectId}
                          onChange={(event) => updateScheduleForm('projectId', event.target.value)}
                          disabled={isLoadingSchedule || !scheduleProjects.length}
                        >
                          {scheduleProjects.length ? (
                            scheduleProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.groupCode ? `${project.groupCode} - ` : ''}{project.groupTitle}
                              </option>
                            ))
                          ) : (
                            <option value="">No assigned project found</option>
                          )}
                        </select>
                      </div>
                    </label>

                    <fieldset>
                      <legend className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Type</legend>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {SCHEDULE_TYPE_OPTIONS.map((option) => {
                          const active = scheduleForm.type === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => updateScheduleForm('type', option.value)}
                              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition ${
                                active
                                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <i className={`fas ${option.icon} w-4 text-xs ${active ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
                              <span className="truncate">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(260px,1fr)_150px_130px]">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Title</span>
                      <input
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10"
                        value={scheduleForm.title}
                        onChange={(event) => updateScheduleForm('title', event.target.value)}
                        placeholder={`${selectedScheduleTypeOption.label} title`}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Date</span>
                      <input
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10"
                        type="date"
                        value={scheduleForm.date}
                        onChange={(event) => updateScheduleForm('date', event.target.value)}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Time</span>
                      <input
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10"
                        type="time"
                        value={scheduleForm.time}
                        onChange={(event) => updateScheduleForm('time', event.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Location / Link</span>
                      <div className="relative">
                        <i className="fas fa-location-dot pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true" />
                        <input
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10"
                          value={scheduleForm.location}
                          onChange={(event) => updateScheduleForm('location', event.target.value)}
                          placeholder="Room, classroom, or meeting link"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</span>
                      <div className="relative">
                        <i className="fas fa-clipboard-list pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true" />
                        <input
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10"
                          value={scheduleForm.notes}
                          onChange={(event) => updateScheduleForm('notes', event.target.value)}
                          placeholder="Student preparation"
                        />
                      </div>
                    </label>
                  </div>

                  {scheduleError ? (
                    <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{scheduleError}</p>
                  ) : null}
                  {scheduleNotice ? (
                    <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{scheduleNotice}</p>
                  ) : null}
                </div>

                <aside className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,58,143,0.08)] text-[var(--primary)]">
                        <i className={`fas ${selectedScheduleTypeOption.icon} text-sm`} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Preview</p>
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {scheduleForm.title || selectedScheduleTypeOption.label}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <i className="fas fa-layer-group mt-1 w-4 text-xs text-slate-400" aria-hidden="true" />
                        <span className="min-w-0 flex-1 break-words font-semibold text-slate-700">
                          {selectedScheduleProject
                            ? `${selectedScheduleProject.groupCode ? `${selectedScheduleProject.groupCode} - ` : ''}${selectedScheduleProject.groupTitle}`
                            : 'No group selected'}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <i className="fas fa-clock mt-1 w-4 text-xs text-slate-400" aria-hidden="true" />
                        <span className="font-semibold text-slate-700">{scheduleForm.date} at {scheduleForm.time}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <i className="fas fa-location-dot mt-1 w-4 text-xs text-slate-400" aria-hidden="true" />
                        <span className="min-w-0 flex-1 break-words text-slate-600">{scheduleForm.location || 'Location not set'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-pressed={scheduleForm.notifyStudents}
                    onClick={() => updateScheduleForm('notifyStudents', !scheduleForm.notifyStudents)}
                    className={`mt-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 text-sm font-semibold transition ${
                      scheduleForm.notifyStudents
                        ? 'border-blue-100 bg-blue-50 text-[var(--primary)]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <i className="fas fa-bell text-xs" aria-hidden="true" />
                      Notify students
                    </span>
                    <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${scheduleForm.notifyStudents ? 'bg-[var(--primary)]' : 'bg-slate-300'}`}>
                      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${scheduleForm.notifyStudents ? 'translate-x-5' : 'translate-x-0'}`} />
                    </span>
                  </button>

                  <button
                    className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    type="submit"
                    disabled={isSavingSchedule || isLoadingSchedule || !scheduleForm.projectId}
                  >
                    <i className={`fas ${isSavingSchedule ? 'fa-spinner fa-spin' : 'fa-check'} text-xs`} aria-hidden="true" />
                    {isSavingSchedule ? 'Saving' : 'Save Schedule'}
                  </button>
                </aside>
              </form>
            </section>
          ) : null}

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
                  { id: 'consultation' as const, label: workspaceMode === 'panel' ? 'Review Windows' : 'Consultations' },
                  { id: 'meeting' as const, label: 'Meetings' },
                  { id: 'deadline' as const, label: 'Deadlines' },
                  { id: 'reminder' as const, label: 'Reminders' },
                  { id: 'event' as const, label: 'Events' },
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
                        label: workspaceMode === 'panel' ? 'Defense-related sessions' : 'Deadlines & reminders',
                        value: workspaceMode === 'panel' ? defenseCount : deadlineCount,
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
