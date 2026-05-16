'use client';

import { useEffect, useMemo, useState } from 'react';
import { PROGRAM_HEAD_PROJECTS, PROGRAM_HEAD_ADVISERS, type ProgramHeadProject } from './program-head-data';
import { ProgramHeadStatCard } from './program-head-primitives';

const ROOMS = ['Room 401', 'Room 402', 'Room 403', 'Conference Room A'];
const SCHEDULE_STAGES = [
  { type: 'Concept Proposal', icon: 'fa-lightbulb', helper: 'First validation of problem, scope, and feasibility.', tone: 'from-[#003a8f] to-[#002c6b]' },
  { type: 'Proposal Defense', icon: 'fa-file-signature', helper: 'Formal proposal panel review before development.', tone: 'from-blue-600 to-indigo-700' },
  { type: 'Mock Defense', icon: 'fa-chalkboard-user', helper: 'Practice defense for readiness and delivery checks.', tone: 'from-amber-500 to-orange-600' },
  { type: 'Final Defense', icon: 'fa-gavel', helper: 'Final evaluation session for completion decision.', tone: 'from-emerald-600 to-teal-700' }
];
const SCHEDULE_TYPES = SCHEDULE_STAGES.map((stage) => stage.type);

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

function formatScheduleLine(assignment?: DefenseAssignment) {
  if (!assignment) return { time: 'Schedule pending', room: 'No room assigned', panel: 'No panel assigned', type: 'Schedule pending' };
  return { time: `${assignment.date} at ${assignment.time}`, room: assignment.room || 'No room assigned', panel: `${assignment.panelists.length} panelist${assignment.panelists.length === 1 ? '' : 's'}`, type: assignment.scheduleType || 'Defense Schedule' };
}

function getScheduleStageMeta(type: string) { return SCHEDULE_STAGES.find((stage) => stage.type === type) ?? SCHEDULE_STAGES[0]; }

export function ProgramHeadSchedule() {
  const [activeTab, setActiveTab] = useState<'queue' | 'scheduled'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk selection and queue state
  const [selectedGroupCodes, setSelectedGroupCodes] = useState<string[]>([]);
  const [presentationOrder, setPresentationOrder] = useState<string[]>([]);
  
  // Schedule settings state
  const [scheduleType, setScheduleType] = useState(SCHEDULE_TYPES[0]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [room, setRoom] = useState('');
  const [chair, setChair] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  
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

  const pendingGroups = useMemo(() => PROGRAM_HEAD_PROJECTS.filter((p) => !assignmentsByCode[p.code] && (p.status === 'Active' || p.status === 'Pending')), [assignmentsByCode]);
  const scheduledGroups = useMemo(() => PROGRAM_HEAD_PROJECTS.filter((p) => assignmentsByCode[p.code] || p.status === 'Completed'), [assignmentsByCode]);
  const activeList = activeTab === 'queue' ? pendingGroups : scheduledGroups;

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
    const times: Record<string, string> = {};
    if (!startTime) return times;
    
    let currentMs = 0;
    try {
      const [h, m] = startTime.split(':').map(Number);
      currentMs = new Date().setHours(h, m, 0, 0);
    } catch {
      return times;
    }

    const duration = parseInt(durationMinutes, 10) || 45;
    presentationOrder.forEach((code) => {
      const d = new Date(currentMs);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      times[code] = `${hours}:${mins}`;
      currentMs += duration * 60000;
    });
    return times;
  }, [presentationOrder, startTime, durationMinutes]);

  const selectedAdvisers = useMemo(() => {
    const names = presentationOrder.map(code => activeList.find(p => p.code === code)?.adviser).filter(Boolean);
    return new Set(names.map(name => normalizeFacultyIdentity(name!)));
  }, [presentationOrder, activeList]);

  const handlePublish = async () => {
    if (!presentationOrder.length || isSaving) return;

    setFormMessage(null);
    const panelIds = [chair, member1, member2].filter(Boolean);
    const uniquePanelIds = new Set(panelIds);

    if (!scheduleType || !date || !startTime || !room || !chair) {
      setFormMessage({ tone: 'danger', text: 'Fill out all batch settings (Stage, Date, Start Time, Venue, Panel Chair).' });
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
        const group = activeList.find(p => p.code === code);
        if (!group) continue;
        const timeSlot = calculatedTimes[code];

        const response = await fetch('/api/defense-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            groupCode: group.code,
            projectTitle: group.title,
            scheduleType,
            department: group.department,
            adviserName: group.adviser,
            students: group.students,
            date,
            time: timeSlot,
            room,
            chairId: chair,
            memberIds: [member1, member2].filter(Boolean)
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
      setActiveTab('scheduled');
    } catch (error) {
      setFormMessage({ tone: 'danger', text: error instanceof Error ? error.message : 'Batch publish failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraft = () => {
    // Just a placeholder since API only has POST for publish right now
    setFormMessage({ tone: 'success', text: 'Queue saved as Draft.' });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2.5rem] border-0 bg-white shadow-xl shadow-[#003a8f]/5 ring-1 ring-slate-200/50">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <div className="relative overflow-hidden bg-[#172554] p-8 sm:p-10 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-[#003a8f] via-[#0b4fb3] to-[#172554]" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(246,190,0,0.26),transparent_45%)]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 blur-[80px] mix-blend-screen -translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-50 backdrop-blur-md">
                <i className="fas fa-calendar-days text-[#f6be00]" />
                Defense Queue Builder
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                Orchestrate your <br className="hidden sm:block" /> panel defenses.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-100/80">
                Select multiple groups to build a presentation queue. Assign a starting time and duration to auto-generate the time slots, then assign the venue and panel.
              </p>
            </div>
          </div>
          <div className="grid gap-4 bg-slate-50/50 p-6 sm:p-8 backdrop-blur-3xl">
            <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-shadow hover:shadow-md flex flex-col justify-center">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#003a8f]/5 to-[#f6be00]/10 opacity-50 transition-transform group-hover:scale-150" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#003a8f]/10 text-[#003a8f]">
                    <i className="fas fa-layer-group" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Queue Status</p>
                    <p className="text-lg font-black text-slate-900">{presentationOrder.length} Selected</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{pendingGroups.length}</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Published</p>
                <p className="mt-2 text-3xl font-black text-emerald-600">{scheduledGroups.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Header + Search */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 bg-slate-100/80 p-1.5 rounded-2xl">
            <button
              onClick={() => { setActiveTab('queue'); clearSelection(); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${
                activeTab === 'queue' ? 'shadow-sm bg-white text-[#003a8f] ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <i className="fas fa-list-ol text-[#003a8f]"></i> Build Queue <span className={`ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${activeTab === 'queue' ? 'bg-[#003a8f]/10 text-[#003a8f]' : 'bg-slate-200/80 text-slate-500'}`}>{pendingGroups.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('scheduled'); clearSelection(); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${
                activeTab === 'scheduled' ? 'shadow-sm bg-white text-[#003a8f] ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <i className="fas fa-check-circle text-emerald-500"></i> Scheduled <span className={`ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${activeTab === 'scheduled' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200/80 text-slate-500'}`}>{scheduledGroups.length}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'queue' && (
              <button onClick={selectAll} className="text-xs font-bold text-[#003a8f] hover:text-[#002c6b] px-4 py-2.5 bg-[#003a8f]/5 hover:bg-[#003a8f]/10 rounded-xl transition-colors whitespace-nowrap">
                Select All
              </button>
            )}
            <div className="relative w-full md:w-72">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200/60 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 hover:bg-white focus:bg-white focus:border-[#003a8f] focus:ring-4 focus:ring-[#003a8f]/10 transition-all"
                placeholder="Search titles or advisers..."
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Group List */}
        <div className="w-full lg:w-7/12 space-y-4">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-3xl text-slate-300"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No groups found</h3>
              <p className="text-slate-500 font-medium m-0">Try adjusting your search criteria.</p>
            </div>
          ) : filteredList.map(group => {
            const assignment = assignmentsByCode[group.code];
            const scheduleLine = formatScheduleLine(assignment);
            const isSelected = selectedGroupCodes.includes(group.code);
            const queueIndex = presentationOrder.indexOf(group.code);

            return (
            <div
              key={group.code}
              className={`relative overflow-hidden bg-white rounded-[1.5rem] border transition-all duration-300 cursor-pointer group ${
                isSelected
                  ? 'border-[#003a8f] shadow-[0_8px_30px_rgba(0,58,143,0.12)] ring-1 ring-[#003a8f]' 
                  : 'border-slate-200/80 hover:border-[#003a8f]/30 hover:shadow-lg hover:shadow-[#003a8f]/5'
              }`}
              onClick={() => activeTab === 'queue' ? toggleGroup(group.code) : null}
            >
              {activeTab === 'queue' && (
                <div className="absolute top-4 right-4 z-10">
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#003a8f] text-white shadow-md' : 'bg-slate-100 text-transparent border border-slate-200 group-hover:border-[#003a8f]/30'
                  }`}>
                    <i className="fas fa-check text-xs"></i>
                  </div>
                </div>
              )}
              
              {isSelected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#003a8f]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              )}
              <div className="relative p-5 sm:p-6 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      isSelected ? 'bg-[#003a8f]/10 text-[#003a8f]' : 'bg-slate-100 text-slate-600 group-hover:bg-[#003a8f]/10 group-hover:text-[#003a8f]'
                    }`}>
                      {group.code}
                    </span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <i className="fas fa-chalkboard-teacher text-[10px] text-slate-400"></i>{group.adviser}
                    </span>
                    {isSelected && queueIndex !== -1 && (
                      <span className="text-xs font-black text-[#f6be00] flex items-center gap-1.5 ml-auto">
                        <i className="fas fa-list-ol text-[10px]"></i> Presenter #{queueIndex + 1}
                      </span>
                    )}
                  </div>
                  <h3 className={`text-base font-bold leading-tight mb-4 transition-colors pr-2 ${
                    isSelected ? 'text-[#003a8f]' : 'text-slate-800 group-hover:text-[#003a8f]'
                  }`}>
                    {group.title}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {group.students.slice(0, 3).map((s, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-600" title={s}>
                            {s.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))}
                        {group.students.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-500">
                            +{group.students.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-medium ml-2">{group.students.length} Members</span>
                    </div>
                  </div>
                </div>
              </div>
              {activeTab === 'scheduled' && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:px-6 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-2"><i className="fas fa-layer-group text-[#003a8f]"></i> {scheduleLine.type}</span>
                  <span className="flex items-center gap-2"><i className="fas fa-clock text-[#003a8f]"></i> {scheduleLine.time}</span>
                  <span className="flex items-center gap-2"><i className="fas fa-door-open text-[#003a8f]"></i> {scheduleLine.room}</span>
                  <span className="flex items-center gap-2"><i className="fas fa-users text-[#003a8f]"></i> {scheduleLine.panel}</span>
                </div>
              )}
            </div>
          )})}
        </div>

        {/* Right Column: Queue Builder / Settings */}
        <div className="w-full lg:w-5/12 sticky top-6">
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col h-[calc(100vh-2rem)] max-h-[900px]">
          {activeTab === 'queue' ? (
            <>
              <div className="p-6 border-b border-slate-100 bg-white z-10 relative flex items-center justify-between">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#003a8f] via-[#0b4fb3] to-[#f6be00]" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#003a8f]/10 text-[#003a8f] flex items-center justify-center shrink-0">
                    <i className="fas fa-list-ol text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">Presentation Queue</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">{presentationOrder.length} groups selected</p>
                  </div>
                </div>
                {presentationOrder.length > 0 && (
                  <button onClick={clearSelection} className="text-xs font-bold text-slate-400 hover:text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                    Clear All
                  </button>
                )}
              </div>

              {presentationOrder.length > 0 ? (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  
                  {/* Presentation Order List */}
                  <div className="p-6 pb-0">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Order & Times</h4>
                    <div className="space-y-2">
                      {presentationOrder.map((code, index) => {
                        const group = activeList.find(p => p.code === code);
                        if (!group) return null;
                        return (
                          <div key={code} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 group hover:border-[#003a8f]/30 hover:bg-white transition-colors">
                            <div className="flex flex-col gap-1 shrink-0">
                              <button onClick={() => moveUp(index)} disabled={index === 0} className="text-slate-300 hover:text-[#003a8f] disabled:opacity-30"><i className="fas fa-caret-up"></i></button>
                              <button onClick={() => moveDown(index)} disabled={index === presentationOrder.length - 1} className="text-slate-300 hover:text-[#003a8f] disabled:opacity-30"><i className="fas fa-caret-down"></i></button>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#003a8f] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{group.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{group.code} • {group.adviser}</p>
                            </div>
                            <div className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-md ${startTime ? 'text-[#f6be00] bg-[#f6be00]/10' : 'text-slate-400 bg-slate-200/50'}`}>
                              {calculatedTimes[code] || '--:--'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batch Settings */}
                  <div className="p-6 space-y-5">
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Batch Settings</h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="text-[10px] mb-2 font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Defense Stage</label>
                            <div className="relative">
                              <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} className="w-full text-sm p-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003a8f] focus:bg-white focus:ring-4 focus:ring-[#003a8f]/10 font-bold outline-none cursor-pointer transition-all appearance-none">
                                {SCHEDULE_STAGES.map(stage => <option key={stage.type} value={stage.type}>{stage.type}</option>)}
                              </select>
                              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] mb-2 font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003a8f] focus:bg-white focus:ring-4 focus:ring-[#003a8f]/10 font-medium outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-[10px] mb-2 font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Start Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-sm p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003a8f] focus:bg-white focus:ring-4 focus:ring-[#003a8f]/10 font-medium outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-[10px] mb-2 font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Time per group</label>
                            <div className="relative">
                              <select value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} className="w-full text-sm p-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003a8f] focus:bg-white focus:ring-4 focus:ring-[#003a8f]/10 font-medium outline-none cursor-pointer transition-all appearance-none">
                                <option value="30">30 mins</option>
                                <option value="45">45 mins</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                              </select>
                              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] mb-2 font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Venue</label>
                            <div className="relative">
                              <select value={room} onChange={e => setRoom(e.target.value)} className="w-full text-sm p-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003a8f] focus:bg-white focus:ring-4 focus:ring-[#003a8f]/10 font-medium outline-none cursor-pointer transition-all appearance-none">
                                <option value="">Select venue...</option>
                                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shared Panel Configuration</h4>
                        <p className="mt-1 text-[11px] font-medium text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200/50 flex items-start gap-2">
                          <i className="fas fa-info-circle mt-0.5"></i> Faculty acting as an adviser for ANY group in this queue cannot be selected as panel members.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {[
                          { label: 'Panel Chair', value: chair, setter: setChair, icon: 'fa-crown', color: 'text-amber-500' },
                          { label: 'Panel Member 1', value: member1, setter: setMember1, icon: 'fa-user', color: 'text-indigo-400' },
                          { label: 'Panel Member 2', value: member2, setter: setMember2, icon: 'fa-user', color: 'text-indigo-400' }
                        ].map(field => (
                          <div key={field.label}>
                            <label className="text-[10px] mb-2 font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <i className={`fas ${field.icon} ${field.color}`}></i> {field.label}
                            </label>
                            <div className="relative">
                              <select value={field.value} onChange={e => field.setter(e.target.value)}
                                className="w-full text-sm p-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#003a8f] focus:bg-white focus:ring-4 focus:ring-[#003a8f]/10 font-medium outline-none cursor-pointer transition-all appearance-none">
                                <option value="">Select faculty...</option>
                                {panelFaculty.map(a => {
                                  const facultyNorm = normalizeFacultyIdentity(getFacultyName(a));
                                  const selectedIds = new Set([chair, member1, member2].filter(Boolean));
                                  const isAcademicAdviser = selectedAdvisers.has(facultyNorm);
                                  const selectedElsewhere = selectedIds.has(a.id) && a.id !== field.value;

                                  return (
                                  <option key={a.id} value={a.id} disabled={isAcademicAdviser || selectedElsewhere}>
                                    {getFacultyName(a)}{a.department ? ` - ${a.department}` : ''} {isAcademicAdviser ? '(Queue Adviser)' : ''}
                                  </option>
                                )})}
                              </select>
                              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Preview Table */}
                    <div className="pt-4 border-t border-slate-100 overflow-x-auto">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Schedule Preview</h4>
                      <div className="min-w-[600px] border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black">
                            <tr>
                              <th className="px-3 py-2 w-8">#</th>
                              <th className="px-3 py-2 w-16">Time</th>
                              <th className="px-3 py-2">Group</th>
                              <th className="px-3 py-2">Adviser</th>
                              <th className="px-3 py-2">Venue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                            {presentationOrder.map((code, index) => {
                              const group = activeList.find(p => p.code === code);
                              return (
                                <tr key={code} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-3 py-2 text-[#003a8f] font-black">{index + 1}</td>
                                  <td className="px-3 py-2 text-[#f6be00] font-black">{calculatedTimes[code] || '--:--'}</td>
                                  <td className="px-3 py-2 font-bold max-w-[200px] truncate" title={group?.title}>{group?.title}</td>
                                  <td className="px-3 py-2 truncate max-w-[120px]">{group?.adviser}</td>
                                  <td className="px-3 py-2 text-slate-500">{room || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {formMessage && (
                      <div className={`rounded-xl border p-4 text-sm font-semibold flex items-start gap-3 ${formMessage.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                        <i className={`fas mt-0.5 ${formMessage.tone === 'success' ? 'fa-circle-check text-emerald-500' : 'fa-triangle-exclamation text-rose-500'}`}></i>
                        <span className="leading-relaxed">{formMessage.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center p-10 bg-slate-50/50">
                  <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-[#003a8f]/10 rounded-full blur-xl group-hover:bg-[#003a8f]/20 transition-colors" />
                    <div className="relative w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-4xl text-slate-300 border border-slate-100">
                      <i className="fas fa-check-square"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Select Groups</h3>
                  <p className="text-sm text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                    Check the boxes on the left to add groups to the defense queue.
                  </p>
                </div>
              )}

              {/* Action Footer */}
              {presentationOrder.length > 0 && (
                <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50/80 z-10 relative">
                  <div className="flex gap-3">
                    <button onClick={handleDraft} disabled={isSaving} className="w-1/3 py-3 rounded-xl font-bold text-[#003a8f] bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                      <i className="fas fa-save"></i> Save Draft
                    </button>
                    <button onClick={handlePublish} disabled={isSaving} className="flex-1 py-3 rounded-xl font-black text-white shadow-[0_8px_20px_rgba(0,58,143,0.3)] bg-[#003a8f] hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                      <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                      {isSaving ? 'Publishing...' : `Publish ${presentationOrder.length} Schedules`}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-10 bg-slate-50/50">
              <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl transition-colors" />
                <div className="relative w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-4xl text-emerald-500 border border-slate-100">
                  <i className="fas fa-calendar-check"></i>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Scheduled Defenses</h3>
              <p className="text-base text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                Viewing all published schedules. Switch to the Queue Builder to add new defense times.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
