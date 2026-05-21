'use client';

import { useEffect, useMemo, useState } from 'react';

const ROOMS = ['Room 401', 'Room 402', 'Room 403', 'Conference Room A', 'Virtual - Zoom'];
const SCHEDULE_STAGES = [
  { type: 'Concept Presentation', icon: 'fa-lightbulb', helper: 'First validation of problem, scope, and feasibility.', tone: 'from-blue-600 to-indigo-700' },
  { type: 'Proposal Defense', icon: 'fa-file-signature', helper: 'Formal proposal panel review before development.', tone: 'from-[#003a8f] to-[#002c6b]' },
  { type: 'Mock Defense', icon: 'fa-chalkboard-user', helper: 'Practice defense for readiness and delivery checks.', tone: 'from-amber-500 to-orange-600' },
  { type: 'Final Defense', icon: 'fa-gavel', helper: 'Final evaluation session for completion decision.', tone: 'from-emerald-600 to-teal-700' }
] as const;
const STAGE_FILTERS = ['All Stages', ...SCHEDULE_STAGES.map((stage) => stage.type)] as const;
const DEFAULT_SLOT_DURATION_MINUTES = 45;
const DEFAULT_BREAK_MINUTES = 10;
const DRAFT_STORAGE_KEY = 'thesistrack-program-head-defense-scheduler-draft';

type FacultyOption = { id: string; name: string; email?: string; department?: string | null; role?: string | null; };

type DefenseAssignment = {
  id: string; groupCode: string; scheduleType?: string; date: string; time: string; room: string; chairId: string; memberIds: string[]; scheduledAt?: string;
  panelists: Array<{ id: string; name: string; panelRole: 'CHAIR' | 'MEMBER'; }>;
};

type StageFilter = typeof STAGE_FILTERS[number];
type ScheduleStageType = typeof SCHEDULE_STAGES[number]['type'];
type CalculatedSlot = { code: string; start: string; end: string; startMinutes: number; endMinutes: number; };
type ScheduleTitleOption = {
  id: string;
  title: string;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  isApproved: boolean;
};
type ScheduleProject = {
  id: string;
  groupId?: string;
  projectId?: string | null;
  code: string;
  title: string;
  approvedTitle?: string | null;
  titles: ScheduleTitleOption[];
  isEligible: boolean;
  ineligibilityReason?: string | null;
  department: string;
  batchSection: string;
  adviser: string;
  students: string[];
  currentStage: string;
  eligibleStage: ScheduleStageType;
  attemptCount: number;
  scheduleStatus: ScheduleStatus;
};
type AdviserApiResponse = { advisers?: FacultyOption[]; panelists?: FacultyOption[]; data?: { advisers?: FacultyOption[]; panelists?: FacultyOption[]; }; };
type DefenseSchedulesApiResponse = {
  success?: boolean;
  message?: string;
  assignment?: DefenseAssignment | null;
  assignments?: DefenseAssignment[];
  scheduleProjects?: ScheduleProject[];
  fieldErrors?: Record<string, string>;
};
type ScheduleDraft = {
  activeTab: ScheduleStatus;
  stageFilter: StageFilter;
  selectedGroupCodes: string[];
  presentationOrder: string[];
  date: string;
  startTime: string;
  room: string;
  chair: string;
  members: string[];
};

function getFacultyName(faculty: FacultyOption) { return faculty.name || faculty.email || 'Faculty'; }

function normalizeFacultyIdentity(value: string) {
  return value.trim().toLowerCase().replace(/(^|\s)(dr|prof|professor|engr|engineer|mr|mrs|ms)\.?(?=\s|$)/g, ' ').replace(/[^\p{L}\p{N}@.]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeComparable(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60).toString().padStart(2, '0');
  const minutes = (normalized % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function getSelectedPanelIds(chair: string, members: string[]) {
  return [chair, ...members].filter(Boolean);
}

function getAssignmentPanelIds(assignment: DefenseAssignment) {
  return Array.from(new Set([
    assignment.chairId,
    ...assignment.memberIds,
    ...assignment.panelists.map((panelist) => panelist.id)
  ].filter(Boolean)));
}

function getFacultyLabel(facultyOptions: FacultyOption[], id: string) {
  const faculty = facultyOptions.find((option) => option.id === id);
  return faculty ? getFacultyName(faculty) : 'Selected faculty';
}

function getStageVisual(stageType?: string) {
  return SCHEDULE_STAGES.find((stage) => stage.type === stageType) ?? SCHEDULE_STAGES[0];
}

function formatTitleStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isScheduleStageType(value: string): value is ScheduleStageType {
  return SCHEDULE_STAGES.some((stage) => stage.type === value);
}

type ScheduleStatus = 'Ready First Schedule' | 'Ready for Reschedule' | 'Scheduled' | 'Revision Required' | 'Not Eligible';

interface EnrichedProject extends ScheduleProject {
  assignment?: DefenseAssignment;
}

function enrichProjects(projects: readonly ScheduleProject[], assignmentsByCode: Record<string, DefenseAssignment>): EnrichedProject[] {
  return projects.map((project) => ({
    ...project,
    scheduleStatus: assignmentsByCode[project.code] ? 'Scheduled' : project.scheduleStatus,
    assignment: assignmentsByCode[project.code]
  }));
}

const TABS: Array<{ label: ScheduleStatus; colorClass: string; activeClass: string; icon: string }> = [
  { label: 'Ready First Schedule', colorClass: 'bg-blue-100 text-blue-700', activeClass: 'border-blue-600 text-blue-700', icon: 'fa-calendar-plus' },
  { label: 'Ready for Reschedule', colorClass: 'bg-purple-100 text-purple-700', activeClass: 'border-purple-600 text-purple-700', icon: 'fa-calendar-day' },
  { label: 'Scheduled', colorClass: 'bg-emerald-100 text-emerald-700', activeClass: 'border-emerald-600 text-emerald-700', icon: 'fa-calendar-check' },
  { label: 'Revision Required', colorClass: 'bg-orange-100 text-orange-700', activeClass: 'border-orange-500 text-orange-700', icon: 'fa-file-pen' },
  { label: 'Not Eligible', colorClass: 'bg-rose-100 text-rose-700', activeClass: 'border-rose-600 text-rose-700', icon: 'fa-lock' },
];

export function ProgramHeadSchedule() {
  const [activeTab, setActiveTab] = useState<ScheduleStatus>('Ready First Schedule');
  const [stageFilter, setStageFilter] = useState<StageFilter>('All Stages');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk selection and queue state
  const [selectedGroupCodes, setSelectedGroupCodes] = useState<string[]>([]);
  const [presentationOrder, setPresentationOrder] = useState<string[]>([]);
  
  // Schedule settings state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [room, setRoom] = useState('');
  const [chair, setChair] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');
  const [member4, setMember4] = useState('');
  const [member5, setMember5] = useState('');
  
  const [scheduleProjects, setScheduleProjects] = useState<ScheduleProject[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [assignments, setAssignments] = useState<DefenseAssignment[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const panelFaculty = facultyOptions;
  
  const assignmentsByCode = useMemo(() => {
    const map: Record<string, DefenseAssignment> = {};
    assignments.forEach((assignment) => { if (assignment.groupCode) map[assignment.groupCode] = assignment; });
    return map;
  }, [assignments]);

  const enrichedGroups = useMemo(() => enrichProjects(scheduleProjects, assignmentsByCode), [assignmentsByCode, scheduleProjects]);
  const selectedScheduleStage = useMemo(
    () => (isScheduleStageType(stageFilter) ? getStageVisual(stageFilter) : null),
    [stageFilter]
  );

  const activeList = useMemo(() => enrichedGroups.filter((g) => (
    g.scheduleStatus === activeTab &&
    (stageFilter === 'All Stages' || (g.isEligible && g.eligibleStage === stageFilter))
  )), [enrichedGroups, activeTab, stageFilter]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.trim().toLowerCase();
    return activeList.filter(p => (
      p.title.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.adviser.toLowerCase().includes(q) ||
      (p.approvedTitle || '').toLowerCase().includes(q) ||
      p.titles.some((title) => title.title.toLowerCase().includes(q))
    ));
  }, [activeList, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    async function loadFaculty() {
      try {
        const response = await fetch('/api/advisers', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) return;
        const payload = (await response.json()) as AdviserApiResponse;
        const fetched = payload.panelists ?? payload.advisers ?? payload.data?.panelists ?? payload.data?.advisers ?? [];
        const unique = new Map<string, FacultyOption>();
        fetched.forEach((faculty) => {
          if (faculty.id && !unique.has(faculty.id)) {
            unique.set(faculty.id, { ...faculty, name: getFacultyName(faculty) });
          }
        });
        if (!cancelled) setFacultyOptions(Array.from(unique.values()));
      } catch {
        if (!cancelled) setFacultyOptions([]);
      }
    }
    async function loadAssignments() {
      setIsLoadingProjects(true);
      try {
        const response = await fetch('/api/defense-schedules', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) return;
        const payload = (await response.json()) as DefenseSchedulesApiResponse;
        if (!cancelled) {
          setAssignments(payload.assignments ?? []);
          setScheduleProjects(payload.scheduleProjects ?? []);
        }
      } catch {
        if (!cancelled) {
          setAssignments([]);
          setScheduleProjects([]);
        }
      } finally {
        if (!cancelled) setIsLoadingProjects(false);
      }
    }
    void loadFaculty();
    void loadAssignments();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!rawDraft) return;

      const draft = JSON.parse(rawDraft) as Partial<ScheduleDraft>;
      if (draft.activeTab && TABS.some((tab) => tab.label === draft.activeTab)) setActiveTab(draft.activeTab);
      if (draft.stageFilter && STAGE_FILTERS.includes(draft.stageFilter)) setStageFilter(draft.stageFilter);
      if (Array.isArray(draft.selectedGroupCodes)) setSelectedGroupCodes(draft.selectedGroupCodes);
      if (Array.isArray(draft.presentationOrder)) setPresentationOrder(draft.presentationOrder);
      if (typeof draft.date === 'string') setDate(draft.date);
      if (typeof draft.startTime === 'string') setStartTime(draft.startTime);
      if (typeof draft.room === 'string') setRoom(draft.room);
      if (typeof draft.chair === 'string') setChair(draft.chair);
      if (Array.isArray(draft.members)) {
        setMember1(draft.members[0] || '');
        setMember2(draft.members[1] || '');
        setMember3(draft.members[2] || '');
        setMember4(draft.members[3] || '');
        setMember5(draft.members[4] || '');
      }
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  // Queue logic
  const toggleGroup = (code: string) => {
    const group = enrichedGroups.find((item) => item.code === code);
    if (!group?.isEligible) {
      setFormMessage({ tone: 'danger', text: 'This group is not eligible yet because it has no approved title.' });
      return;
    }

    if (selectedGroupCodes.includes(code)) {
      setSelectedGroupCodes(prev => prev.filter(c => c !== code));
      setPresentationOrder(prev => prev.filter(c => c !== code));
    } else {
      setSelectedGroupCodes(prev => [...prev, code]);
      setPresentationOrder(prev => [...prev, code]);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...presentationOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setPresentationOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === presentationOrder.length - 1) return;
    const newOrder = [...presentationOrder];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setPresentationOrder(newOrder);
  };

  const removeGroup = (code: string) => {
    setSelectedGroupCodes(prev => prev.filter(c => c !== code));
    setPresentationOrder(prev => prev.filter(c => c !== code));
  };

  const clearSelection = () => {
    setSelectedGroupCodes([]);
    setPresentationOrder([]);
    setFormMessage(null);
  };
  
  const selectAll = () => {
    const codes = filteredList.filter(p => p.isEligible).map(p => p.code);
    setSelectedGroupCodes(codes);
    setPresentationOrder(codes);
  };

  const calculatedTimes = useMemo<CalculatedSlot[]>(() => {
    const times: CalculatedSlot[] = [];
    if (!startTime) return times;

    const startMinutes = timeToMinutes(startTime);
    if (startMinutes === null) {
      return times;
    }

    let currentMinutes = startMinutes;

    presentationOrder.forEach((code) => {
      const slotStart = currentMinutes;
      const slotEnd = slotStart + DEFAULT_SLOT_DURATION_MINUTES;
      times.push({
        code,
        start: formatMinutes(slotStart),
        end: formatMinutes(slotEnd),
        startMinutes: slotStart,
        endMinutes: slotEnd
      });
      currentMinutes = slotEnd + DEFAULT_BREAK_MINUTES;
    });

    return times;
  }, [presentationOrder, startTime]);

  const getTimeSlot = (code: string) => {
    const slot = calculatedTimes.find(t => t.code === code);
    return slot ? `${slot.start} - ${slot.end}` : '--:--';
  };

  const selectedAdvisers = useMemo(() => {
    const names = presentationOrder.map(code => enrichedGroups.find(p => p.code === code)?.adviser).filter(Boolean);
    return new Set(names.map(name => normalizeFacultyIdentity(name!)));
  }, [presentationOrder, enrichedGroups]);

  const selectedPanelIds = useMemo(() =>
    getSelectedPanelIds(chair, [member1, member2, member3, member4, member5]),
    [chair, member1, member2, member3, member4, member5]
  );

  const scheduleConflicts = useMemo(() => {
    const conflicts: string[] = [];
    const selectedPanelSet = new Set(selectedPanelIds);

    if (selectedPanelIds.length !== selectedPanelSet.size) {
      conflicts.push('The selected panel contains duplicate faculty accounts.');
    }

    if (!date || !room || !startTime || !presentationOrder.length) {
      return conflicts;
    }

    calculatedTimes.forEach((slot) => {
      assignments
        .filter((assignment) => assignment.groupCode !== slot.code && assignment.date === date)
        .forEach((assignment) => {
          const existingStart = timeToMinutes(assignment.time);
          if (existingStart === null) return;

          const existingEnd = existingStart + DEFAULT_SLOT_DURATION_MINUTES;
          if (!intervalsOverlap(slot.startMinutes, slot.endMinutes, existingStart, existingEnd)) return;

          if (normalizeComparable(assignment.room) === normalizeComparable(room)) {
            conflicts.push(`${slot.code} overlaps ${assignment.groupCode} in ${room} at ${slot.start}.`);
          }

          const panelMatches = getAssignmentPanelIds(assignment).filter((panelId) => selectedPanelSet.has(panelId));
          if (panelMatches.length) {
            const names = panelMatches.map((panelId) => getFacultyLabel(panelFaculty, panelId)).join(', ');
            conflicts.push(`${slot.code} conflicts with ${assignment.groupCode} panel availability (${names}).`);
          }
        });
    });

    return conflicts;
  }, [assignments, calculatedTimes, date, panelFaculty, presentationOrder.length, room, selectedPanelIds, startTime]);

  const handlePublish = async () => {
    if (!presentationOrder.length || isSaving) return;

    setFormMessage(null);
    const panelIds = selectedPanelIds;
    const uniquePanelIds = new Set(panelIds);

    if (!selectedScheduleStage) {
      setFormMessage({ tone: 'danger', text: 'Choose the presentation type before publishing the schedule.' });
      return;
    }

    const invalidStageGroups = presentationOrder
      .map((code) => enrichedGroups.find((project) => project.code === code))
      .filter((group): group is EnrichedProject => Boolean(group))
      .filter((group) => group.eligibleStage !== selectedScheduleStage.type);

    const ineligibleGroups = presentationOrder
      .map((code) => enrichedGroups.find((project) => project.code === code))
      .filter((group): group is EnrichedProject => Boolean(group))
      .filter((group) => !group.isEligible);

    if (ineligibleGroups.length) {
      setFormMessage({
        tone: 'danger',
        text: `Remove groups without an approved title: ${ineligibleGroups.map((group) => group.code).join(', ')}.`
      });
      return;
    }

    if (invalidStageGroups.length) {
      setFormMessage({
        tone: 'danger',
        text: `Remove groups that are not ready for ${selectedScheduleStage.type}: ${invalidStageGroups.map((group) => group.code).join(', ')}.`
      });
      return;
    }

    if (!date || !startTime || !room || !chair) {
      setFormMessage({ tone: 'danger', text: 'Fill out all batch settings (Date, Start Time, Venue, Panel Chair).' });
      return;
    }

    if (uniquePanelIds.size !== panelIds.length) {
      setFormMessage({ tone: 'danger', text: 'Panel members must be different faculty accounts.' });
      return;
    }

    if (scheduleConflicts.length) {
      setFormMessage({ tone: 'danger', text: 'Resolve schedule conflicts before publishing.' });
      return;
    }

    if (!panelFaculty.length) {
      setFormMessage({ tone: 'danger', text: 'No real faculty panel accounts are available. Add adviser or panel accounts first.' });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    
    try {
      const newAssignments: DefenseAssignment[] = [];
      
      for (const code of presentationOrder) {
        const group = enrichedGroups.find(p => p.code === code);
        if (!group) continue;
        const timeSlot = calculatedTimes.find(t => t.code === code)?.start || startTime;

        const response = await fetch('/api/defense-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            groupCode: group.code,
            projectTitle: group.approvedTitle || group.title,
            scheduleType: selectedScheduleStage.type,
            department: group.department,
            adviserName: group.adviser,
            students: group.students,
            date,
            time: timeSlot,
            room,
            chairId: chair,
            memberIds: [member1, member2, member3, member4, member5].filter(Boolean)
          })
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
           throw new Error(`Failed to schedule ${group.code}: ${payload.message}`);
        }
        if (payload.assignment) newAssignments.push(payload.assignment as DefenseAssignment);
        successCount++;
      }

      setAssignments(current => {
        const filtered = current.filter(a => !newAssignments.some(na => na.groupCode === a.groupCode));
        return [...newAssignments, ...filtered];
      });
      
      setFormMessage({ tone: 'success', text: `Successfully published ${successCount} schedules.` });
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      clearSelection();
      setActiveTab('Scheduled');
    } catch (error) {
      setFormMessage({ tone: 'danger', text: error instanceof Error ? error.message : 'Batch publish failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraft = () => {
    const draft: ScheduleDraft = {
      activeTab,
      stageFilter,
      selectedGroupCodes,
      presentationOrder,
      date,
      startTime,
      room,
      chair,
      members: [member1, member2, member3, member4, member5]
    };

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setFormMessage({ tone: 'success', text: 'Queue draft saved on this device.' });
  };

  const getTotalDurationStr = () => {
    if (!presentationOrder.length) return '0h 0m';
    const totalMins = (DEFAULT_SLOT_DURATION_MINUTES * presentationOrder.length) + (DEFAULT_BREAK_MINUTES * Math.max(presentationOrder.length - 1, 0));
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  const getCardToneClasses = (status: ScheduleStatus) => {
    switch (status) {
      case 'Ready First Schedule': return 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700';
      case 'Ready for Reschedule': return 'from-purple-50 to-fuchsia-50 border-purple-200 text-purple-700';
      case 'Scheduled': return 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700';
      case 'Revision Required': return 'from-orange-50 to-amber-50 border-orange-200 text-orange-700';
      case 'Not Eligible': return 'from-rose-50 to-red-50 border-rose-200 text-rose-700';
      default: return 'from-slate-50 to-slate-100 border-slate-200 text-slate-700';
    }
  };

  const getStatusIconColor = (status: ScheduleStatus) => {
    switch (status) {
      case 'Ready First Schedule': return 'text-blue-500 bg-blue-100';
      case 'Ready for Reschedule': return 'text-purple-500 bg-purple-100';
      case 'Scheduled': return 'text-emerald-500 bg-emerald-100';
      case 'Revision Required': return 'text-orange-500 bg-orange-100';
      case 'Not Eligible': return 'text-rose-500 bg-rose-100';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* HEADER SECTION */}
      <section className="rounded-[20px] bg-white border border-slate-200 shadow-sm p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Defense Scheduler</h1>
            <p className="mt-1.5 text-[15px] text-slate-500">Group-based presentation scheduling using approved title proposals.</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Published Sessions</span>
              <span className="text-xl font-black text-slate-800">{enrichedGroups.filter(g => g.scheduleStatus === 'Scheduled').length}</span>
            </div>
            <div className="w-px h-10 bg-slate-200 mx-2" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conflicts Detected</span>
              <span className={`text-xl font-black flex items-center gap-1.5 ${scheduleConflicts.length ? 'text-rose-600' : 'text-emerald-600'}`}>
                <i className={`fas ${scheduleConflicts.length ? 'fa-triangle-exclamation' : 'fa-check-circle'} text-[14px]`}></i>
                {scheduleConflicts.length}
              </span>
            </div>
          </div>
        </div>

        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
          {TABS.map((tab) => {
            const count = enrichedGroups.filter(g => g.scheduleStatus === tab.label).length;
            return (
              <div key={tab.label} className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-[16px] p-4 transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getCardToneClasses(tab.label).split(' ')[0]} ${getCardToneClasses(tab.label).split(' ')[1]}`} />
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusIconColor(tab.label)}`}>
                    <i className={`fas ${tab.icon} text-lg`}></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{count}</div>
                    <div className="text-[11px] font-semibold text-slate-500 leading-tight">{tab.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STATUS TABS (Segmented Navigation) */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const count = enrichedGroups.filter(g => g.scheduleStatus === tab.label).length;
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => { setActiveTab(tab.label); clearSelection(); }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-[14px] transition-colors flex items-center gap-2 ${
                  isActive ? tab.activeClass : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 py-0.5 px-2.5 rounded-full text-[11px] font-bold ${
                  isActive ? tab.colorClass : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STAGE_FILTERS.map((filter) => {
          const isActive = stageFilter === filter;
          const visual = filter === 'All Stages' ? null : getStageVisual(filter);
          return (
            <button
              key={filter}
              type="button"
              onClick={() => { setStageFilter(filter); clearSelection(); }}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[12px] font-extrabold transition-all ${
                isActive
                  ? 'border-[#003a8f] bg-[#003a8f] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#003a8f]'
              }`}
            >
              <i className={`fas ${visual?.icon ?? 'fa-layer-group'}`} aria-hidden="true"></i>
              {filter}
            </button>
          );
        })}
      </div>

      {/* WORKSPACE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        
        {/* ELIGIBLE GROUPS PANEL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-bold text-slate-800">{activeTab} Groups</h3>
            <div className="relative w-72">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                placeholder="Search groups, titles, or advisers..."
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoadingProjects ? (
            <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <i className="fas fa-spinner fa-spin text-xl" aria-hidden="true"></i>
              </div>
              <h3 className="text-[15px] font-bold text-slate-700 mb-1">Loading real groups</h3>
              <p className="text-[13px] text-slate-500 font-medium">Fetching groups, title proposals, and approval readiness from the database.</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-slate-50 rounded-[20px] border border-dashed border-slate-300 p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200">
                <i className="fas fa-folder-open text-2xl text-slate-400"></i>
              </div>
              <h3 className="text-[15px] font-bold text-slate-700 mb-1">No groups found</h3>
              <p className="text-[13px] text-slate-500 font-medium">No groups match this status and presentation stage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map(group => {
                const isSelected = selectedGroupCodes.includes(group.code);
                const queueIndex = presentationOrder.indexOf(group.code);
                const isActionableTab = group.isEligible && (activeTab === 'Ready First Schedule' || activeTab === 'Ready for Reschedule');
                const stageVisual = getStageVisual(group.eligibleStage);
                const visibleTitles = group.titles.slice(0, 3);

                return (
                  <div
                    key={group.code}
                    className={`group relative bg-white border rounded-[16px] p-5 transition-all duration-200 flex items-start gap-4 ${
                      isSelected 
                        ? 'border-blue-500 ring-1 ring-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.12)]' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    } ${!isActionableTab ? 'opacity-80' : ''}`}
                  >
                    {isActionableTab && (
                      <div className="pt-1 cursor-pointer" onClick={() => toggleGroup(group.code)}>
                        <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400 text-transparent'
                        }`}>
                          <i className="fas fa-check text-[10px]"></i>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {group.batchSection}
                        </span>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <i className={`fas ${stageVisual.icon} mr-1`} aria-hidden="true"></i>
                          {group.eligibleStage}
                        </span>
                        {group.attemptCount > 1 && (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            Attempt {group.attemptCount}
                          </span>
                        )}
                        {isSelected && queueIndex !== -1 && (
                          <span className="text-[11px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-md ml-auto shadow-sm">
                            Queue #{queueIndex + 1}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-[15px] font-bold text-slate-900 leading-tight mb-2 pr-8">
                        <i className="fas fa-users text-blue-500 mr-2" aria-hidden="true"></i>
                        {group.title || group.code}
                      </h4>
                      
                      <div className="flex items-center gap-4 text-[12px] font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <i className="fas fa-user-tie text-slate-400"></i> {group.adviser}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="fas fa-users text-slate-400"></i> {group.students.length} Members
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="fas fa-hashtag text-slate-400"></i> {group.code}
                        </div>
                      </div>

                      <div className={`mt-4 rounded-xl border p-3 ${
                        group.approvedTitle
                          ? 'border-emerald-100 bg-emerald-50/70 text-emerald-950'
                          : 'border-rose-100 bg-rose-50/70 text-rose-900'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            group.approvedTitle ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            <i className={`fas ${group.approvedTitle ? 'fa-circle-check' : 'fa-lock'} text-[12px]`} aria-hidden="true"></i>
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wider">
                              {group.approvedTitle ? 'Approved Title' : 'Not Eligible'}
                            </p>
                            <p className="mt-0.5 text-[13px] font-bold leading-snug">
                              {group.approvedTitle || group.ineligibilityReason || 'No approved title yet.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Title Proposals</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                            {group.titles.length} submitted
                          </span>
                        </div>
                        {visibleTitles.length ? (
                          <div className="space-y-1.5">
                            {visibleTitles.map((title) => (
                              <div key={title.id} className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2 text-[12px] ring-1 ring-slate-100">
                                <span className="min-w-0 truncate font-semibold text-slate-700">{title.title}</span>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                                  title.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {title.isApproved ? 'Approved' : formatTitleStatus(title.status)}
                                </span>
                              </div>
                            ))}
                            {group.titles.length > visibleTitles.length ? (
                              <p className="text-[11px] font-semibold text-slate-500">
                                +{group.titles.length - visibleTitles.length} more title proposal(s)
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-[12px] font-semibold text-slate-500">No title proposal has been submitted for this group.</p>
                        )}
                      </div>

                      {group.assignment ? (
                        <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-[12px] font-semibold text-emerald-900 sm:grid-cols-3">
                          <span className="flex items-center gap-1.5">
                            <i className="fas fa-calendar-day text-emerald-600" aria-hidden="true"></i>
                            {group.assignment.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="fas fa-clock text-emerald-600" aria-hidden="true"></i>
                            {group.assignment.time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="fas fa-location-dot text-emerald-600" aria-hidden="true"></i>
                            {group.assignment.room || 'TBA'}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <button className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PRESENTATION QUEUE & SETTINGS PANEL */}
        <div className="sticky top-6 flex flex-col gap-6">
          
          {/* QUEUE TIMELINE */}
          <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">Presentation Queue</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">{presentationOrder.length} groups selected - {getTotalDurationStr()}</p>
              </div>
              {presentationOrder.length > 0 && (
                <button onClick={clearSelection} className="text-[12px] font-bold text-slate-500 hover:text-rose-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors">
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-200">
              {presentationOrder.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl mb-3">
                    <i className="fas fa-list-ol"></i>
                  </div>
                  <p className="text-[13px] font-bold text-slate-700">Queue is empty</p>
                  <p className="text-[12px] text-slate-500 mt-1 max-w-[200px]">Select groups from the left panel to build the timeline.</p>
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                  {presentationOrder.map((code, index) => {
                    const group = enrichedGroups.find(p => p.code === code);
                    const isFirst = index === 0;
                    const isLast = index === presentationOrder.length - 1;
                    return (
                      <div key={code} className="relative group">
                        {/* Timeline node */}
                        <div className="absolute -left-[25px] top-1 w-[18px] h-[18px] bg-white border-4 border-blue-500 rounded-full z-10" />
                        
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {getTimeSlot(code)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{code}</span>
                              </div>
                              <p className="text-[13px] font-bold text-slate-800 leading-snug truncate">{group?.title || code}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{group?.approvedTitle || group?.adviser}</p>
                            </div>
                            
                            {/* Reorder Controls */}
                            <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveUp(index)} disabled={isFirst} className="w-6 h-6 rounded bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 flex items-center justify-center">
                                <i className="fas fa-caret-up"></i>
                              </button>
                              <button onClick={() => moveDown(index)} disabled={isLast} className="w-6 h-6 rounded bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 flex items-center justify-center">
                                <i className="fas fa-caret-down"></i>
                              </button>
                            </div>
                            <button onClick={() => removeGroup(code)} className="w-6 h-6 shrink-0 text-slate-300 hover:text-rose-500 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <i className="fas fa-times text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SCHEDULE SETTINGS */}
          <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-slate-900 mb-5 flex items-center gap-2">
              <i className="fas fa-sliders-h text-slate-400"></i> Schedule Parameters
            </h3>

            {formMessage && (
              <div className={`mb-5 rounded-lg border p-3 text-[13px] font-medium flex items-start gap-2.5 ${formMessage.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                <i className={`fas mt-0.5 ${formMessage.tone === 'success' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-rose-500'}`}></i>
                <span className="leading-snug">{formMessage.text}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Presentation Type / Stage</label>
                <div className="relative">
                  <select
                    value={selectedScheduleStage?.type ?? ''}
                    onChange={(event) => {
                      const nextStage = event.target.value;
                      setStageFilter(isScheduleStageType(nextStage) ? nextStage : 'All Stages');
                      clearSelection();
                    }}
                    className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="">Select presentation stage...</option>
                    {SCHEDULE_STAGES.map((stage) => (
                      <option key={stage.type} value={stage.type}>{stage.type}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                </div>
                {selectedScheduleStage ? (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[12px] font-semibold text-blue-900">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${selectedScheduleStage.tone} text-white`}>
                        <i className={`fas ${selectedScheduleStage.icon} text-[12px]`} aria-hidden="true"></i>
                      </span>
                      <span>
                        Scheduling <strong>{selectedScheduleStage.type}</strong>. The group list is filtered to groups whose current milestone is ready for this stage.
                        <span className="mt-1 block text-blue-700/80">{selectedScheduleStage.helper}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    Choose a presentation type to publish schedules and update the matching milestone checkpoint.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full text-[13px] p-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-[13px] p-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none transition-all shadow-sm" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Venue / Room</label>
                <div className="relative">
                  <select value={room} onChange={e => setRoom(e.target.value)} className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer">
                    <option value="">Select venue...</option>
                    {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div>
                <label className="block text-[11px] font-bold text-amber-600 mb-1.5 flex items-center gap-1.5"><i className="fas fa-crown"></i> Panel Chair</label>
                <div className="relative">
                  <select value={chair} onChange={e => setChair(e.target.value)} className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer">
                    <option value="">Select chair...</option>
                    {panelFaculty.map(a => {
                      const facultyNorm = normalizeFacultyIdentity(getFacultyName(a));
                      const isAdviser = selectedAdvisers.has(facultyNorm);
                      return <option key={a.id} value={a.id} disabled={isAdviser}>{getFacultyName(a)}{isAdviser ? ' (Conflict)' : ''}</option>;
                    })}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Member 1</label>
                  <div className="relative">
                    <select value={member1} onChange={e => setMember1(e.target.value)} className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer">
                      <option value="">Select member...</option>
                      {panelFaculty.map(a => {
                        const facultyNorm = normalizeFacultyIdentity(getFacultyName(a));
                        const isAdviser = selectedAdvisers.has(facultyNorm);
                        return <option key={a.id} value={a.id} disabled={isAdviser}>{getFacultyName(a)}</option>;
                      })}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Member 2</label>
                  <div className="relative">
                    <select value={member2} onChange={e => setMember2(e.target.value)} className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer">
                      <option value="">Select member...</option>
                      {panelFaculty.map(a => {
                        const facultyNorm = normalizeFacultyIdentity(getFacultyName(a));
                        const isAdviser = selectedAdvisers.has(facultyNorm);
                        return <option key={a.id} value={a.id} disabled={isAdviser}>{getFacultyName(a)}</option>;
                      })}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Member 3</label>
                  <div className="relative">
                    <select value={member3} onChange={e => setMember3(e.target.value)} className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer">
                      <option value="">Select member...</option>
                      {panelFaculty.map(a => {
                        const facultyNorm = normalizeFacultyIdentity(getFacultyName(a));
                        const isAdviser = selectedAdvisers.has(facultyNorm);
                        return <option key={a.id} value={a.id} disabled={isAdviser}>{getFacultyName(a)}</option>;
                      })}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Member 4</label>
                  <div className="relative">
                    <select value={member4} onChange={e => setMember4(e.target.value)} className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer">
                      <option value="">Select member...</option>
                      {panelFaculty.map(a => {
                        const facultyNorm = normalizeFacultyIdentity(getFacultyName(a));
                        const isAdviser = selectedAdvisers.has(facultyNorm);
                        return <option key={a.id} value={a.id} disabled={isAdviser}>{getFacultyName(a)}</option>;
                      })}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Member 5</label>
                  <div className="relative">
                    <select value={member5} onChange={e => setMember5(e.target.value)} className="w-full text-[13px] p-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium outline-none appearance-none shadow-sm cursor-pointer">
                      <option value="">Select member...</option>
                      {panelFaculty.map(a => {
                        const facultyNorm = normalizeFacultyIdentity(getFacultyName(a));
                        const isAdviser = selectedAdvisers.has(facultyNorm);
                        return <option key={a.id} value={a.id} disabled={isAdviser}>{getFacultyName(a)}</option>;
                      })}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                  </div>
                </div>
              </div>

              {presentationOrder.length > 0 && selectedAdvisers.size > 0 && (
                <div className="mt-4 bg-blue-50 text-blue-800 text-[11px] font-medium p-3 rounded-lg flex gap-2 items-start">
                  <i className="fas fa-shield-alt text-blue-500 mt-0.5"></i>
                  <span>Smart Scheduling: Faculty acting as advisers in this queue are locked from panel selection to prevent conflicts.</span>
                </div>
              )}

              {presentationOrder.length > 0 && scheduleConflicts.length > 0 && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11px] font-semibold text-rose-800">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-black">
                    <i className="fas fa-triangle-exclamation text-rose-500" aria-hidden="true"></i>
                    Resolve conflicts before publishing
                  </div>
                  <div className="grid gap-1.5">
                    {scheduleConflicts.slice(0, 4).map((conflict) => (
                      <span key={conflict}>{conflict}</span>
                    ))}
                    {scheduleConflicts.length > 4 ? <span>{scheduleConflicts.length - 4} more conflict(s)</span> : null}
                  </div>
                </div>
              )}

              {presentationOrder.length > 0 && date && startTime && room && !scheduleConflicts.length && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] font-semibold text-emerald-800 flex items-start gap-2">
                  <i className="fas fa-circle-check text-emerald-500 mt-0.5" aria-hidden="true"></i>
                  <span>No room or panel conflict detected for this queue.</span>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Queue</span>
                    <strong className="mt-0.5 block text-[14px] font-black text-slate-900">{presentationOrder.length} Groups</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
                    <strong className="mt-0.5 block text-[14px] font-black text-blue-600">{getTotalDurationStr()}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Conflicts</span>
                    <strong className={`mt-0.5 block text-[14px] font-black ${scheduleConflicts.length ? 'text-rose-600' : 'text-emerald-600'}`}>{scheduleConflicts.length}</strong>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={handleDraft} disabled={isSaving || presentationOrder.length === 0} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-50">
                    Save Draft
                  </button>
                  <button onClick={handlePublish} disabled={isSaving || presentationOrder.length === 0 || scheduleConflicts.length > 0 || !selectedScheduleStage} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F6BE00] to-yellow-500 px-4 text-[13px] font-black text-white shadow-md transition-all hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:grayscale-[0.5]">
                    <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                    {isSaving ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
