'use client';

import { useEffect, useMemo, useState } from 'react';
import { PROGRAM_HEAD_PROJECTS, PROGRAM_HEAD_ADVISERS, type ProgramHeadProject } from './program-head-data';

const ROOMS = ['Room 401', 'Room 402', 'Room 403', 'Conference Room A', 'Virtual - Zoom'];
const SCHEDULE_STAGES = [
  { type: 'Concept Presentation', icon: 'fa-lightbulb', helper: 'First validation of problem, scope, and feasibility.', tone: 'from-blue-600 to-indigo-700' },
  { type: 'Proposal Defense', icon: 'fa-file-signature', helper: 'Formal proposal panel review before development.', tone: 'from-[#003a8f] to-[#002c6b]' },
  { type: 'Mock Defense', icon: 'fa-chalkboard-user', helper: 'Practice defense for readiness and delivery checks.', tone: 'from-amber-500 to-orange-600' },
  { type: 'Final Defense', icon: 'fa-gavel', helper: 'Final evaluation session for completion decision.', tone: 'from-emerald-600 to-teal-700' }
];

type FacultyOption = { id: string; name: string; email?: string; department?: string | null; role?: string | null; };

type DefenseAssignment = {
  id: string; groupCode: string; scheduleType?: string; date: string; time: string; room: string; chairId: string; memberIds: string[];
  panelists: Array<{ id: string; name: string; panelRole: 'CHAIR' | 'MEMBER'; }>;
};

type AdviserApiResponse = { advisers?: FacultyOption[]; panelists?: FacultyOption[]; data?: { advisers?: FacultyOption[]; panelists?: FacultyOption[]; }; };
type DefenseSchedulesApiResponse = { success?: boolean; message?: string; assignment?: DefenseAssignment | null; assignments?: DefenseAssignment[]; fieldErrors?: Record<string, string>; };

function getFacultyName(faculty: FacultyOption) { return faculty.name || faculty.email || 'Faculty'; }

function normalizeFacultyIdentity(value: string) {
  return value.trim().toLowerCase().replace(/(^|\s)(dr|prof|professor|engr|engineer|mr|mrs|ms)\.?(?=\s|$)/g, ' ').replace(/[^\p{L}\p{N}@.]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

// ─── EXTENDED MOCK LOGIC FOR REDESIGN ──────────────────────────────────────────

type ScheduleStatus = 'Ready First Schedule' | 'Ready for Reschedule' | 'Scheduled' | 'Revision Required' | 'Re-proposal Required';

interface EnrichedProject extends ProgramHeadProject {
  batchSection: string;
  attemptCount: number;
  scheduleStatus: ScheduleStatus;
  eligibleStage: string;
}

// Map existing mocked projects to the new scheduling logic
function enrichProjects(projects: readonly ProgramHeadProject[], assignmentsByCode: Record<string, DefenseAssignment>): EnrichedProject[] {
  return projects.map((p, index) => {
    let eligibleStage = 'Concept Presentation';
    if (p.currentStage === 'Chapter 1' || p.currentStage === 'Chapter 2') eligibleStage = 'Proposal Defense';
    if (p.currentStage === 'Chapter 3' || p.currentStage === 'Data Analysis') eligibleStage = 'Mock Defense';
    if (p.currentStage === 'Final Defense' || p.status === 'Completed') eligibleStage = 'Final Defense';

    let attemptCount = 1;
    let scheduleStatus: ScheduleStatus = 'Ready First Schedule';

    if (assignmentsByCode[p.code]) {
      scheduleStatus = 'Scheduled';
    } else {
      // Create some fake variety based on index
      if (index % 7 === 0) {
        scheduleStatus = 'Ready for Reschedule';
        attemptCount = 2;
      } else if (index % 5 === 0) {
        scheduleStatus = 'Revision Required';
      } else if (index % 8 === 0) {
        scheduleStatus = 'Re-proposal Required';
      }
    }

    return {
      ...p,
      batchSection: `BS${p.department}-${(index % 4) + 1}${(index % 2 === 0 ? 'A' : 'B')}`,
      attemptCount,
      scheduleStatus,
      eligibleStage,
    };
  });
}

const TABS: Array<{ label: ScheduleStatus; colorClass: string; activeClass: string; icon: string }> = [
  { label: 'Ready First Schedule', colorClass: 'bg-blue-100 text-blue-700', activeClass: 'border-blue-600 text-blue-700', icon: 'fa-calendar-plus' },
  { label: 'Ready for Reschedule', colorClass: 'bg-purple-100 text-purple-700', activeClass: 'border-purple-600 text-purple-700', icon: 'fa-calendar-day' },
  { label: 'Scheduled', colorClass: 'bg-emerald-100 text-emerald-700', activeClass: 'border-emerald-600 text-emerald-700', icon: 'fa-calendar-check' },
  { label: 'Revision Required', colorClass: 'bg-orange-100 text-orange-700', activeClass: 'border-orange-500 text-orange-700', icon: 'fa-file-pen' },
  { label: 'Re-proposal Required', colorClass: 'bg-rose-100 text-rose-700', activeClass: 'border-rose-600 text-rose-700', icon: 'fa-rotate-left' },
];

// ─────────────────────────────────────────────────────────────────────────────

export function ProgramHeadSchedule() {
  const [activeTab, setActiveTab] = useState<ScheduleStatus>('Ready First Schedule');
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
  
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [assignments, setAssignments] = useState<DefenseAssignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const fallbackFacultyOptions = useMemo<FacultyOption[]>(() => PROGRAM_HEAD_ADVISERS.map((adviser) => ({ id: `mock:${adviser.name}`, name: adviser.name, department: adviser.department, role: 'adviser' })), []);
  const panelFaculty = facultyOptions.length ? facultyOptions : fallbackFacultyOptions;
  
  const assignmentsByCode = useMemo(() => {
    const map: Record<string, DefenseAssignment> = {};
    assignments.forEach((assignment) => { if (assignment.groupCode) map[assignment.groupCode] = assignment; });
    return map;
  }, [assignments]);

  const enrichedGroups = useMemo(() => enrichProjects(PROGRAM_HEAD_PROJECTS, assignmentsByCode), [assignmentsByCode]);

  const activeList = useMemo(() => enrichedGroups.filter((g) => g.scheduleStatus === activeTab), [enrichedGroups, activeTab]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.trim().toLowerCase();
    return activeList.filter(p => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.adviser.toLowerCase().includes(q));
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
      try {
        const response = await fetch('/api/defense-schedules', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) return;
        const payload = (await response.json()) as DefenseSchedulesApiResponse;
        if (!cancelled) setAssignments(payload.assignments ?? []);
      } catch {
        if (!cancelled) setAssignments([]);
      }
    }
    void loadFaculty();
    void loadAssignments();
    return () => { cancelled = true; };
  }, []);

  // Queue logic
  const toggleGroup = (code: string) => {
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
    const codes = filteredList.map(p => p.code);
    setSelectedGroupCodes(codes);
    setPresentationOrder(codes);
  };

  const calculatedTimes = useMemo(() => {
    const times: Array<{ code: string; start: string; end: string }> = [];
    if (!startTime) return times;
    
    let currentMs = 0;
    try {
      const [h, m] = startTime.split(':').map(Number);
      currentMs = new Date().setHours(h, m, 0, 0);
    } catch {
      return times;
    }

    const duration = 45;
    const breakMins = 0;

    presentationOrder.forEach((code) => {
      const startD = new Date(currentMs);
      const startHours = startD.getHours().toString().padStart(2, '0');
      const startMins = startD.getMinutes().toString().padStart(2, '0');
      
      currentMs += duration * 60000;
      
      const endD = new Date(currentMs);
      const endHours = endD.getHours().toString().padStart(2, '0');
      const endMins = endD.getMinutes().toString().padStart(2, '0');
      
      times.push({ code, start: `${startHours}:${startMins}`, end: `${endHours}:${endMins}` });
      currentMs += breakMins * 60000; // add break after group
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

  const handlePublish = async () => {
    if (!presentationOrder.length || isSaving) return;

    setFormMessage(null);
    const panelIds = [chair, member1, member2, member3, member4, member5].filter(Boolean);
    const uniquePanelIds = new Set(panelIds);

    if (!date || !startTime || !room || !chair) {
      setFormMessage({ tone: 'danger', text: 'Fill out all batch settings (Date, Start Time, Venue, Panel Chair).' });
      return;
    }

    if (uniquePanelIds.size !== panelIds.length) {
      setFormMessage({ tone: 'danger', text: 'Panel members must be different faculty accounts.' });
      return;
    }

    if (panelIds.some(id => id.startsWith('mock:'))) {
      setFormMessage({ tone: 'danger', text: 'Please create or load real faculty accounts to publish panels.' });
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
            projectTitle: group.title,
            scheduleType: group.eligibleStage,
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
      clearSelection();
      setActiveTab('Scheduled');
    } catch (error) {
      setFormMessage({ tone: 'danger', text: error instanceof Error ? error.message : 'Batch publish failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraft = () => {
    setFormMessage({ tone: 'success', text: 'Queue saved as Draft.' });
  };

  const getTotalDurationStr = () => {
    if (!presentationOrder.length) return '0h 0m';
    const totalMins = 45 * presentationOrder.length;
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
      case 'Re-proposal Required': return 'from-rose-50 to-red-50 border-rose-200 text-rose-700';
      default: return 'from-slate-50 to-slate-100 border-slate-200 text-slate-700';
    }
  };

  const getStatusIconColor = (status: ScheduleStatus) => {
    switch (status) {
      case 'Ready First Schedule': return 'text-blue-500 bg-blue-100';
      case 'Ready for Reschedule': return 'text-purple-500 bg-purple-100';
      case 'Scheduled': return 'text-emerald-500 bg-emerald-100';
      case 'Revision Required': return 'text-orange-500 bg-orange-100';
      case 'Re-proposal Required': return 'text-rose-500 bg-rose-100';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* HEADER SECTION */}
      <section className="rounded-[20px] bg-white border border-slate-200 shadow-sm p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Defense Scheduler</h1>
            <p className="mt-1.5 text-[15px] text-slate-500">Smart queue scheduling for eligible capstone groups.</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Scheduled Today</span>
              <span className="text-xl font-black text-slate-800">{enrichedGroups.filter(g => g.scheduleStatus === 'Scheduled').length}</span>
            </div>
            <div className="w-px h-10 bg-slate-200 mx-2" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conflicts Detected</span>
              <span className="text-xl font-black text-emerald-600 flex items-center gap-1.5"><i className="fas fa-check-circle text-[14px]"></i> 0</span>
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
                placeholder="Search projects or advisers..."
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="bg-slate-50 rounded-[20px] border border-dashed border-slate-300 p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200">
                <i className="fas fa-folder-open text-2xl text-slate-400"></i>
              </div>
              <h3 className="text-[15px] font-bold text-slate-700 mb-1">No groups found</h3>
              <p className="text-[13px] text-slate-500 font-medium">There are currently no groups in this status.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map(group => {
                const isSelected = selectedGroupCodes.includes(group.code);
                const queueIndex = presentationOrder.indexOf(group.code);
                const isActionableTab = activeTab === 'Ready First Schedule' || activeTab === 'Ready for Reschedule';

                return (
                  <div
                    key={group.code}
                    className={`group relative bg-white border rounded-[16px] p-5 transition-all duration-200 flex items-start gap-4 ${
                      isSelected 
                        ? 'border-blue-500 ring-1 ring-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.12)]' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    } ${!isActionableTab ? 'opacity-80 grayscale-[0.2]' : ''}`}
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
                      
                      <h4 className="text-[15px] font-bold text-slate-900 leading-tight mb-2 pr-8">{group.title}</h4>
                      
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
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">{presentationOrder.length} groups selected • {getTotalDurationStr()}</p>
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
                              <p className="text-[13px] font-bold text-slate-800 leading-snug truncate">{group?.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{group?.adviser}</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] md:w-auto md:min-w-[600px] z-50">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-6 px-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Queue</span>
              <span className="text-[14px] font-black text-slate-900">{presentationOrder.length} Groups</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Duration</span>
              <span className="text-[14px] font-black text-blue-600">{getTotalDurationStr()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={handleDraft} disabled={isSaving || presentationOrder.length === 0} className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[13px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50">
              Save Draft
            </button>
            <button onClick={handlePublish} disabled={isSaving || presentationOrder.length === 0} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[13px] font-black text-white bg-gradient-to-r from-[#F6BE00] to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale-[0.5]">
              <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
              {isSaving ? 'Publishing...' : 'Publish Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
