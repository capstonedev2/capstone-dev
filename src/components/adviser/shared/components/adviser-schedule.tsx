'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import type { WeeklyScheduleItem } from '@/components/adviser/shared/config/dashboard-types';
import {
  NAV_ITEMS,
  WORKSPACE_META,
  buildAdviserScheduleItems,
  buildPanelScheduleItems,
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
  requiredSubmission: string;
  // Own dedicated fields for the two "Other" text boxes, kept separate from `title` so the
  // Agenda field never doubles up with a second box editing the exact same value live.
  otherTypeLabel: string;
  otherSubmissionLabel: string;
};

const SCHEDULE_TYPE_OPTIONS = [
  { value: 'CONSULTATION', label: 'Consultation', icon: 'fa-comments' },
  { value: 'DEADLINE', label: 'Submission', icon: 'fa-hourglass-half' },
  { value: 'MEETING', label: 'Meeting', icon: 'fa-users' },
  { value: 'REMINDER', label: 'Reminder', icon: 'fa-bell' },
  { value: 'EVENT', label: 'Event', icon: 'fa-calendar-day' },
  { value: 'REVIEW', label: 'Review', icon: 'fa-clipboard-check' },
  // UI-only — AdviserScheduleItemType has no "other" value in the schema, so this is
  // translated to EVENT before it's ever sent to the API (see saveScheduleItem below);
  // the adviser's own wording is preserved in the title instead of the type badge.
  { value: 'OTHER', label: 'Other', icon: 'fa-shapes' }
] as const;

// Deadline-only: lets the adviser say exactly what deliverable a deadline is for, instead of
// students having to guess from a generic "Deadline" agenda line. Not a DB column — there's no
// AdviserScheduleItem field for this, so picking one just pre-fills the Agenda/Notes text below
// (which the adviser can still edit), rather than requiring a schema migration for a label.
const REQUIRED_SUBMISSION_OPTIONS = [
  { value: '', label: 'Not specified', hint: '' },
  { value: 'title-proposal', label: 'Title Proposal', hint: 'Students submit their proposed thesis/capstone title for review.' },
  { value: 'concept-paper', label: 'Concept Paper', hint: 'Students submit the concept paper covering the research problem and scope.' },
  { value: 'proposal-chapters', label: 'Proposal (Chapters 1-3)', hint: 'Students submit the formal proposal document (Introduction, Review of Related Literature, Methodology).' },
  {
    value: 'progress-development',
    label: 'Progress of Development',
    hint: 'Students submit a development progress update. Remind them to attach photo or video evidence if the project is a hardware prototype or IoT system.'
  },
  { value: 'web-application', label: 'Web Application / System Demo', hint: 'Students submit or demo the working web application or system build.' },
  { value: 'system-documentation', label: 'System Documentation', hint: 'Students submit technical or user documentation for the system.' },
  { value: 'final-manuscript', label: 'Final Manuscript', hint: 'Students submit the final, panel-approved manuscript.' },
  { value: 'other', label: 'Other requirement', hint: 'Specify the exact requirement in the field below so students know what to submit.' }
] as const;

// Mirrors DEADLINE_REQUIREMENT_MILESTONE_SEQUENCE in milestone-checkpoint-tracking.ts —
// which stage's due date (shown on the student's roadmap and driving the overdue alert)
// gets set when this requirement is picked, so the adviser knows this isn't just a
// calendar note. 'other'/unset are deliberately left out there — too ambiguous to map.
const REQUIRED_SUBMISSION_STAGE_LABEL: Record<string, string> = {
  'title-proposal': 'Concept',
  'concept-paper': 'Concept',
  'proposal-chapters': 'Proposal',
  'progress-development': 'Development',
  'web-application': 'Development',
  'system-documentation': 'Development',
  'final-manuscript': 'Final Defense'
};

function getRequiredSubmissionOption(value: string) {
  return REQUIRED_SUBMISSION_OPTIONS.find((option) => option.value === value) ?? REQUIRED_SUBMISSION_OPTIONS[0];
}

// Folds the dedicated "Other" specify field into the final title, since AdviserScheduleItem
// has nowhere else to store it. Used by both the live Preview panel and the actual save,
// so what the adviser previews is exactly what gets sent.
function buildScheduleTitle(form: ScheduleFormState) {
  const otherLabel = (
    form.type === 'OTHER'
      ? form.otherTypeLabel
      : form.type === 'DEADLINE' && form.requiredSubmission === 'other'
        ? form.otherSubmissionLabel
        : ''
  ).trim();

  if (!otherLabel) {
    return form.title;
  }

  return form.title.trim() ? `${otherLabel}: ${form.title.trim()}` : otherLabel;
}

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
    notifyStudents: true,
    requiredSubmission: '',
    otherTypeLabel: '',
    otherSubmissionLabel: ''
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
  tone = 'primary'
}: {
  icon: string;
  label: string;
  value: string | number;
  tone?: 'primary' | 'warning' | 'success';
}) {
  const toneStyles =
    tone === 'warning'
      ? { background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)' }
      : tone === 'success'
        ? { background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)' }
        : { background: 'rgba(0, 58, 143, 0.08)', color: 'var(--primary)' };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</h2>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm ring-1 ring-inset ring-white/60"
          style={toneStyles}
        >
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
      return 'Submission';
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
  const createFormRef = useRef<HTMLElement | null>(null);

  const meta = WORKSPACE_META[workspaceMode];
  const fallbackScheduleItems = useMemo(
    () =>
      workspaceMode === 'panel'
        ? buildPanelScheduleItems(data.panelProjects)
        : buildAdviserScheduleItems(data.upcomingSchedule, data.groups),
    [workspaceMode, data.panelProjects, data.upcomingSchedule, data.groups]
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
        const response = await fetch('/api/adviser-schedule-items?limit=50&projectLimit=100', { cache: 'no-store' });
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
      // AdviserScheduleItemType has no "other" value, and there's no column for a custom
      // requirement label either — so both get folded into the title here, exactly as the
      // Preview panel already shows it, and only the DB-safe type needs swapping.
      const response = await fetch('/api/adviser-schedule-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleForm,
          title: buildScheduleTitle(scheduleForm),
          type: scheduleForm.type === 'OTHER' ? 'EVENT' : scheduleForm.type
        })
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

  // Counts always reflect the full scheduleItems set (not filteredItems) so pills show
  // how many exist in each bucket regardless of which filter is currently active.
  const filterCounts = useMemo(() => {
    const counts: Record<ScheduleFilter, number> = {
      all: scheduleItems.length,
      consultation: 0,
      meeting: 0,
      deadline: 0,
      reminder: 0,
      event: 0,
      defense: 0
    };

    scheduleItems.forEach((item) => {
      counts[getScheduleCategory(item)] += 1;
    });

    return counts;
  }, [scheduleItems]);

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

  const defenseCount = scheduleItems.filter((item) => getScheduleCategory(item) === 'defense').length;
  const reviewCount = scheduleItems.filter((item) => ['consultation', 'meeting'].includes(getScheduleCategory(item))).length;
  const deadlineCount = scheduleItems.filter((item) => ['deadline', 'reminder'].includes(getScheduleCategory(item))).length;
  const locationCount = new Set(scheduleItems.map((item) => item.location).filter(Boolean)).size;
  const selectedScheduleTypeOption = getScheduleTypeOption(scheduleForm.type);
  const isOtherType = scheduleForm.type === 'OTHER';
  const isOtherRequirement = scheduleForm.type === 'DEADLINE' && scheduleForm.requiredSubmission === 'other';
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
    <>
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
            />
            <ScheduleSummaryCard
              icon="fa-comments"
              label={workspaceMode === 'panel' ? 'Review Slots' : 'Consultations & Reviews'}
              value={reviewCount}
              tone="warning"
            />
            <ScheduleSummaryCard
              icon={workspaceMode === 'panel' ? 'fa-gavel' : 'fa-hourglass-half'}
              label={workspaceMode === 'panel' ? 'Defense-Related' : 'Submissions & Reminders'}
              value={workspaceMode === 'panel' ? defenseCount : deadlineCount}
              tone="success"
            />
            <ScheduleSummaryCard
              icon="fa-location-dot"
              label="Active Venues"
              value={locationCount}
            />
          </section>

          {workspaceMode === 'adviser' ? (
            <section
              ref={createFormRef}
              className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
              <form
                className="grid lg:grid-cols-[minmax(0,1fr)_320px]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveScheduleItem();
                }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col gap-4 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 text-[var(--primary)] shadow-sm ring-1 ring-blue-100/50">
                        <i className="fas fa-calendar-plus text-base" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Create Schedule</p>
                        <h2 className="truncate text-2xl font-bold tracking-tight text-slate-800">New adviser schedule item</h2>
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/60 bg-white/50 px-4 py-1.5 text-xs font-bold tracking-wide text-slate-600 shadow-sm backdrop-blur-md">
                      <i className="fas fa-users text-[10px]" aria-hidden="true" />
                      Student schedule
                    </span>
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(260px,0.95fr)_minmax(360px,1.05fr)]">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Group / Project</span>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="fas fa-layer-group text-sm text-slate-400 transition-colors group-focus-within:text-[var(--primary)]" aria-hidden="true" />
                        </div>
                        <select
                          className="min-h-[3.25rem] w-full appearance-none rounded-2xl border border-slate-200/60 bg-white/50 pl-11 pr-10 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-blue-900/10 outline-none"
                          value={scheduleForm.projectId}
                          onChange={(event) => updateScheduleForm('projectId', event.target.value)}
                          disabled={isLoadingSchedule || !scheduleProjects.length}
                        >
                          {scheduleProjects.length > 1 && (
                            <option value="ALL">All My Groups ({scheduleProjects.length})</option>
                          )}
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
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <i className="fas fa-chevron-down text-[10px] text-slate-400" aria-hidden="true" />
                        </div>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</span>
                      <div
                        className={`overflow-hidden rounded-2xl border bg-white/50 shadow-sm backdrop-blur-sm transition-all ${
                          isOtherType ? 'border-amber-300/80' : 'border-slate-200/60'
                        }`}
                      >
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <i className={`fas ${SCHEDULE_TYPE_OPTIONS.find(o => o.value === scheduleForm.type)?.icon || 'fa-tag'} text-sm text-slate-400 transition-colors group-focus-within:text-[var(--primary)]`} aria-hidden="true" />
                          </div>
                          <select
                            className="min-h-[3.25rem] w-full appearance-none border-0 bg-transparent pl-11 pr-10 text-sm font-semibold text-slate-700 outline-none transition-all hover:bg-white focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                            value={scheduleForm.type}
                            onChange={(event) => {
                              const nextType = event.target.value;
                              setScheduleForm((current) => ({
                                ...current,
                                type: nextType,
                                requiredSubmission: nextType === 'DEADLINE' ? current.requiredSubmission : '',
                                otherTypeLabel: nextType === 'OTHER' ? current.otherTypeLabel : ''
                              }));
                            }}
                            disabled={isLoadingSchedule}
                          >
                            {SCHEDULE_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <i className="fas fa-chevron-down text-[10px] text-slate-400" aria-hidden="true" />
                          </div>
                        </div>

                        {isOtherType && (
                          <div className="flex items-center gap-2 border-t border-amber-300/60 bg-amber-50/40 px-4 py-3">
                            <span className="shrink-0 text-sm font-medium text-slate-600">Specify:</span>
                            <input
                              className="min-w-0 flex-1 border-0 border-b border-dashed border-slate-400 bg-transparent pb-0.5 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-normal focus:border-amber-500"
                              value={scheduleForm.otherTypeLabel}
                              onChange={(event) => updateScheduleForm('otherTypeLabel', event.target.value)}
                              placeholder="Ethics review hearing, Turnitin check, MOA signing, etc."
                              required
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {scheduleForm.type === 'DEADLINE' && (
                    <div className="mt-6">
                      <label className="block">
                        <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          What should students submit?
                        </span>
                        <div
                          className={`overflow-hidden rounded-2xl border bg-white/50 shadow-sm backdrop-blur-sm transition-all ${
                            isOtherRequirement ? 'border-amber-300/80' : 'border-slate-200/60'
                          }`}
                        >
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                              <i className="fas fa-file-circle-check text-sm text-slate-400 transition-colors group-focus-within:text-[var(--primary)]" aria-hidden="true" />
                            </div>
                            <select
                              className="min-h-[3.25rem] w-full appearance-none border-0 bg-transparent pl-11 pr-10 text-sm font-semibold text-slate-700 outline-none transition-all hover:bg-white focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                              value={scheduleForm.requiredSubmission}
                              onChange={(event) => {
                                const option = getRequiredSubmissionOption(event.target.value);
                                const isOther = option.value === 'other';
                                setScheduleForm((current) => ({
                                  ...current,
                                  requiredSubmission: option.value,
                                  // "Other" has no generic label worth prefilling — the Specify
                                  // row below asks the adviser to type it instead.
                                  title: isOther || current.title.trim() ? current.title : option.label,
                                  notes: isOther || current.notes.trim() ? current.notes : option.hint,
                                  otherSubmissionLabel: isOther ? current.otherSubmissionLabel : ''
                                }));
                              }}
                            >
                              {REQUIRED_SUBMISSION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                              <i className="fas fa-chevron-down text-[10px] text-slate-400" aria-hidden="true" />
                            </div>
                          </div>

                          {isOtherRequirement && (
                            <div className="flex items-center gap-2 border-t border-amber-300/60 bg-amber-50/40 px-4 py-3">
                              <span className="shrink-0 text-sm font-medium text-slate-600">Specify:</span>
                              <input
                                className="min-w-0 flex-1 border-0 border-b border-dashed border-slate-400 bg-transparent pb-0.5 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-normal focus:border-amber-500"
                                value={scheduleForm.otherSubmissionLabel}
                                onChange={(event) => updateScheduleForm('otherSubmissionLabel', event.target.value)}
                                placeholder="Source code repository link, user manual, deployment evidence, etc."
                                required
                              />
                            </div>
                          )}
                        </div>
                        {getRequiredSubmissionOption(scheduleForm.requiredSubmission).hint && (
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            <i className="fas fa-circle-info mr-1 text-[var(--primary)]" aria-hidden="true" />
                            {getRequiredSubmissionOption(scheduleForm.requiredSubmission).hint}
                          </p>
                        )}
                        {REQUIRED_SUBMISSION_STAGE_LABEL[scheduleForm.requiredSubmission] && (
                          <p className="mt-2 text-xs leading-5 text-emerald-700">
                            <i className="fas fa-calendar-check mr-1" aria-hidden="true" />
                            This also sets the due date for the {REQUIRED_SUBMISSION_STAGE_LABEL[scheduleForm.requiredSubmission]} stage on the student's roadmap.
                          </p>
                        )}
                      </label>
                    </div>
                  )}

                  <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(260px,1fr)_160px_140px]">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Agenda</span>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="fas fa-align-left text-sm text-slate-400 transition-colors group-focus-within:text-[var(--primary)]" aria-hidden="true" />
                        </div>
                        <input
                          className="min-h-[3.25rem] w-full rounded-2xl border border-slate-200/60 bg-white/50 pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm outline-none transition-all placeholder:text-slate-400 hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                          value={scheduleForm.title}
                          onChange={(event) => updateScheduleForm('title', event.target.value)}
                          placeholder={`${selectedScheduleTypeOption.label} agenda (optional extra detail)`}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</span>
                      <input
                        className="min-h-[3.25rem] w-full rounded-2xl border border-slate-200/60 bg-white/50 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm outline-none transition-all hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                        type="date"
                        value={scheduleForm.date}
                        onChange={(event) => updateScheduleForm('date', event.target.value)}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Time</span>
                      <input
                        className="min-h-[3.25rem] w-full rounded-2xl border border-slate-200/60 bg-white/50 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm outline-none transition-all hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                        type="time"
                        value={scheduleForm.time}
                        onChange={(event) => updateScheduleForm('time', event.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Location / Link</span>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="fas fa-location-dot text-sm text-slate-400 transition-colors group-focus-within:text-[var(--primary)]" aria-hidden="true" />
                        </div>
                        <input
                          className="min-h-[3.25rem] w-full rounded-2xl border border-slate-200/60 bg-white/50 pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm outline-none transition-all placeholder:text-slate-400 hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                          value={scheduleForm.location}
                          onChange={(event) => updateScheduleForm('location', event.target.value)}
                          placeholder="Room, classroom, or meeting link"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Notes</span>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="fas fa-clipboard-list text-sm text-slate-400 transition-colors group-focus-within:text-[var(--primary)]" aria-hidden="true" />
                        </div>
                        <input
                          className="min-h-[3.25rem] w-full rounded-2xl border border-slate-200/60 bg-white/50 pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm outline-none transition-all placeholder:text-slate-400 hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                          value={scheduleForm.notes}
                          onChange={(event) => updateScheduleForm('notes', event.target.value)}
                          placeholder="Student preparation"
                        />
                      </div>
                    </label>
                  </div>

                  {scheduleError ? (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-800 shadow-sm backdrop-blur-sm">
                      <i className="fas fa-circle-exclamation mt-0.5 shrink-0" aria-hidden="true" />
                      <p>{scheduleError}</p>
                    </div>
                  ) : null}
                  {scheduleNotice ? (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur-sm">
                      <i className="fas fa-circle-check mt-0.5 shrink-0" aria-hidden="true" />
                      <p>{scheduleNotice}</p>
                    </div>
                  ) : null}
                </div>

                <aside className="border-t border-slate-200/60 bg-gradient-to-b from-slate-50/50 to-slate-100/50 p-6 md:p-8 lg:border-l lg:border-t-0">
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 text-[var(--primary)] shadow-inner ring-1 ring-blue-100/50">
                        <i className={`fas ${selectedScheduleTypeOption.icon} text-base`} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Preview</p>
                        <h3 className="truncate text-base font-bold tracking-tight text-slate-800">
                          {buildScheduleTitle(scheduleForm) || selectedScheduleTypeOption.label}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3.5 text-sm">
                      <div className="flex items-start gap-3.5">
                        <i className="fas fa-layer-group mt-1 w-4 shrink-0 text-center text-xs text-slate-400" aria-hidden="true" />
                        <span className="min-w-0 flex-1 break-words font-medium text-slate-700">
                          {scheduleForm.projectId === 'ALL'
                            ? `All My Groups (${scheduleProjects.length})`
                            : selectedScheduleProject
                            ? `${selectedScheduleProject.groupCode ? `${selectedScheduleProject.groupCode} - ` : ''}${selectedScheduleProject.groupTitle}`
                            : 'No group selected'}
                        </span>
                      </div>
                      <div className="flex items-start gap-3.5">
                        <i className="fas fa-clock mt-1 w-4 shrink-0 text-center text-xs text-slate-400" aria-hidden="true" />
                        <span className="font-medium text-slate-700">{scheduleForm.date} at {scheduleForm.time}</span>
                      </div>
                      <div className="flex items-start gap-3.5">
                        <i className="fas fa-location-dot mt-1 w-4 shrink-0 text-center text-xs text-slate-400" aria-hidden="true" />
                        <span className="min-w-0 flex-1 break-words text-slate-500">{scheduleForm.location || 'Location not set'}</span>
                      </div>
                      {scheduleForm.type === 'DEADLINE' && scheduleForm.requiredSubmission && (
                        <div className="flex items-start gap-3.5">
                          <i className="fas fa-file-circle-check mt-1 w-4 shrink-0 text-center text-xs text-slate-400" aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words font-medium text-slate-700">
                            {scheduleForm.requiredSubmission === 'other'
                              ? scheduleForm.otherSubmissionLabel || 'Other requirement'
                              : getRequiredSubmissionOption(scheduleForm.requiredSubmission).label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-pressed={scheduleForm.notifyStudents}
                    onClick={() => updateScheduleForm('notifyStudents', !scheduleForm.notifyStudents)}
                    className={`mt-6 flex min-h-[3.25rem] w-full items-center justify-between gap-3 rounded-2xl border px-5 text-sm font-semibold transition-all duration-300 ${
                      scheduleForm.notifyStudents
                        ? 'border-blue-200/60 bg-blue-50 text-[var(--primary)] shadow-sm'
                        : 'border-slate-200/60 bg-white/50 text-slate-500 hover:bg-white hover:text-slate-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <i className={`fas fa-bell text-sm transition-colors ${scheduleForm.notifyStudents ? 'text-[var(--primary)]' : 'text-slate-400'}`} aria-hidden="true" />
                      Notify students
                    </span>
                    <span className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-300 ease-in-out ${scheduleForm.notifyStudents ? 'bg-[var(--primary)]' : 'bg-slate-300'}`}>
                      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${scheduleForm.notifyStudents ? 'translate-x-5' : 'translate-x-0'}`} />
                    </span>
                  </button>

                  <button
                    className="mt-4 flex min-h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-blue-700 px-5 text-sm font-bold tracking-wide text-white shadow-md ring-1 ring-blue-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md"
                    type="submit"
                    disabled={isSavingSchedule || isLoadingSchedule || !scheduleForm.projectId}
                  >
                    <i className={`fas ${isSavingSchedule ? 'fa-spinner fa-spin' : 'fa-check'} text-sm`} aria-hidden="true" />
                    {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
                  </button>
                </aside>
              </form>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300">
            <SectionHeader
              eyebrow="Planner"
              title="Weekly supervision planner"
              description="Filter the week by session type, scan each day's agenda, and jump into the linked workspace when you need to act."
              actions={
                <>
                  <Link
                    href={primaryActionHref}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-md ring-1 ring-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                  >
                    <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                    {primaryActionLabel}
                  </Link>
                  <Link
                    href={secondaryActionHref}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/50 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-900"
                  >
                    <i className="fas fa-layer-group text-xs"></i>
                    {secondaryActionLabel}
                  </Link>
                </>
              }
            />

            <div className="grid gap-4 border-b border-slate-200/60 px-6 py-5 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)] lg:items-center">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all' as const, label: 'All Sessions' },
                  { id: 'consultation' as const, label: workspaceMode === 'panel' ? 'Review Windows' : 'Consultations' },
                  { id: 'meeting' as const, label: 'Meetings' },
                  { id: 'deadline' as const, label: 'Submissions' },
                  { id: 'reminder' as const, label: 'Reminders' },
                  { id: 'event' as const, label: 'Events' },
                  { id: 'defense' as const, label: 'Defense-Related' }
                ].map((option) => {
                  const active = activeFilter === option.id;
                  const count = filterCounts[option.id];
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveFilter(option.id)}
                      className={`inline-flex min-h-[2.5rem] items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all duration-300 ${
                        active
                          ? 'border-transparent bg-gradient-to-r from-[var(--primary)] to-blue-700 text-white shadow-md ring-1 ring-blue-900/20'
                          : 'border-slate-200/60 bg-white/50 text-slate-600 shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:border-slate-300/80 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                      <span
                        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                          active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <i className="fas fa-search text-sm text-slate-400 transition-colors group-focus-within:text-[var(--primary)]"></i>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by group, event, room, or date..."
                  className="min-h-[3rem] w-full rounded-2xl border border-slate-200/60 bg-white/50 pl-11 pr-4 text-sm text-slate-700 shadow-sm backdrop-blur-sm outline-none transition-all placeholder:text-slate-400 hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-blue-900/10"
                />
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {groupedItems.length ? (
                  groupedItems.map((group) => (
                    <section key={group.dateLabel} className="rounded-3xl border border-white/60 bg-gradient-to-b from-slate-50/50 to-white/30 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/60 pb-5">
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
                      {scheduleItems.length === 0 ? (
                        <>
                          <p className="text-base font-semibold text-slate-700">No sessions scheduled yet.</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {workspaceMode === 'adviser'
                              ? 'Create your first consultation, submission deadline, or meeting above.'
                              : 'Sessions your advisees schedule will show up here.'}
                          </p>
                          {workspaceMode === 'adviser' && (
                            <button
                              type="button"
                              onClick={() => createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                              className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-md ring-1 ring-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                            >
                              <i className="fas fa-calendar-plus text-xs" aria-hidden="true" />
                              Create a schedule item
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-base font-semibold text-slate-700">No schedule items match the current view.</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Try switching the session filter or clearing the search field.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFilter('all');
                              setSearch('');
                            }}
                            className="mt-5 inline-flex min-h-[38px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                          >
                            <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
                            Clear filters
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>
        </div>
      </>
  );
}
