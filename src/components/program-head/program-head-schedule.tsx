'use client';

import { useEffect, useMemo, useState } from 'react';
import { PROGRAM_HEAD_PROJECTS, PROGRAM_HEAD_ADVISERS, type ProgramHeadProject } from './program-head-data';
import { ProgramHeadStatCard } from './program-head-primitives';

const ROOMS = ['Room 401', 'Room 402', 'Room 403', 'Conference Room A'];

type FacultyOption = {
  id: string;
  name: string;
  email?: string;
  department?: string | null;
  role?: string | null;
};

type DefenseAssignment = {
  id: string;
  groupCode: string;
  date: string;
  time: string;
  room: string;
  chairId: string;
  memberIds: string[];
  panelists: Array<{
    id: string;
    name: string;
    panelRole: 'CHAIR' | 'MEMBER';
  }>;
};

type AdviserApiResponse = {
  advisers?: FacultyOption[];
  panelists?: FacultyOption[];
  data?: {
    advisers?: FacultyOption[];
    panelists?: FacultyOption[];
  };
};

type DefenseSchedulesApiResponse = {
  success?: boolean;
  message?: string;
  assignment?: DefenseAssignment | null;
  assignments?: DefenseAssignment[];
  fieldErrors?: Record<string, string>;
};

function getFacultyName(faculty: FacultyOption) {
  return faculty.name || faculty.email || 'Faculty';
}

function normalizeFacultyIdentity(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|\s)(dr|prof|professor|engr|engineer|mr|mrs|ms)\.?(?=\s|$)/g, ' ')
    .replace(/[^\p{L}\p{N}@.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProjectAssignmentKey(assignment?: DefenseAssignment) {
  if (!assignment) return '';
  return [
    assignment.id,
    assignment.date,
    assignment.time,
    assignment.room,
    assignment.chairId,
    assignment.memberIds.join('|')
  ].join(':');
}

function formatScheduleLine(assignment?: DefenseAssignment) {
  if (!assignment) {
    return {
      time: 'Schedule pending',
      room: 'No room assigned',
      panel: 'No panel assigned'
    };
  }

  return {
    time: `${assignment.date} at ${assignment.time}`,
    room: assignment.room || 'No room assigned',
    panel: `${assignment.panelists.length} panelist${assignment.panelists.length === 1 ? '' : 's'}`
  };
}

export function ProgramHeadSchedule() {
  const [activeTab, setActiveTab] = useState<'pending' | 'scheduled'>('pending');
  const [selectedGroup, setSelectedGroup] = useState<ProgramHeadProject | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [room, setRoom] = useState('');
  const [chair, setChair] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [assignments, setAssignments] = useState<DefenseAssignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const fallbackFacultyOptions = useMemo<FacultyOption[]>(
    () => PROGRAM_HEAD_ADVISERS.map((adviser) => ({
      id: `mock:${adviser.name}`,
      name: adviser.name,
      department: adviser.department,
      role: 'adviser'
    })),
    []
  );
  const panelFaculty = facultyOptions.length ? facultyOptions : fallbackFacultyOptions;
  const assignmentsByCode = useMemo(() => {
    const map: Record<string, DefenseAssignment> = {};
    assignments.forEach((assignment) => {
      if (assignment.groupCode) map[assignment.groupCode] = assignment;
    });
    return map;
  }, [assignments]);
  const selectedAssignment = selectedGroup ? assignmentsByCode[selectedGroup.code] : undefined;
  const selectedAssignmentKey = getProjectAssignmentKey(selectedAssignment);

  const pendingGroups = useMemo(
    () => PROGRAM_HEAD_PROJECTS.filter((p) => !assignmentsByCode[p.code] && (p.status === 'Active' || p.status === 'Pending')),
    [assignmentsByCode]
  );
  const scheduledGroups = useMemo(
    () => PROGRAM_HEAD_PROJECTS.filter((p) => assignmentsByCode[p.code] || p.status === 'Completed'),
    [assignmentsByCode]
  );
  const activeList = activeTab === 'pending' ? pendingGroups : scheduledGroups;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.trim().toLowerCase();
    return activeList.filter(p => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.adviser.toLowerCase().includes(q));
  }, [activeList, searchQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadFaculty() {
      try {
        const response = await fetch('/api/advisers', {
          cache: 'no-store',
          credentials: 'same-origin'
        });
        if (!response.ok) return;

        const payload = (await response.json()) as AdviserApiResponse;
        const fetched = payload.panelists ?? payload.advisers ?? payload.data?.panelists ?? payload.data?.advisers ?? [];
        const unique = new Map<string, FacultyOption>();

        fetched.forEach((faculty) => {
          if (faculty.id && !unique.has(faculty.id)) {
            unique.set(faculty.id, {
              ...faculty,
              name: getFacultyName(faculty)
            });
          }
        });

        if (!cancelled) {
          setFacultyOptions(Array.from(unique.values()));
        }
      } catch {
        if (!cancelled) setFacultyOptions([]);
      }
    }

    async function loadAssignments() {
      try {
        const response = await fetch('/api/defense-schedules', {
          cache: 'no-store',
          credentials: 'same-origin'
        });
        if (!response.ok) return;

        const payload = (await response.json()) as DefenseSchedulesApiResponse;
        if (!cancelled) {
          setAssignments(payload.assignments ?? []);
        }
      } catch {
        if (!cancelled) setAssignments([]);
      }
    }

    void loadFaculty();
    void loadAssignments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFormMessage(null);

    if (!selectedGroup) {
      setDate('');
      setTime('');
      setRoom('');
      setChair('');
      setMember1('');
      setMember2('');
      return;
    }

    if (selectedAssignment) {
      setDate(selectedAssignment.date);
      setTime(selectedAssignment.time);
      setRoom(selectedAssignment.room);
      setChair(selectedAssignment.chairId);
      setMember1(selectedAssignment.memberIds[0] || '');
      setMember2(selectedAssignment.memberIds[1] || '');
      return;
    }

    setDate('');
    setTime('');
    setRoom('');
    setChair('');
    setMember1('');
    setMember2('');
  }, [selectedGroup?.code, selectedAssignmentKey]);

  const handleSchedule = async () => {
    if (!selectedGroup || isSaving) return;

    setFormMessage(null);

    const panelIds = [chair, member1, member2].filter(Boolean);
    const uniquePanelIds = new Set(panelIds);

    if (!date || !time || !room || !chair) {
      setFormMessage({ tone: 'danger', text: 'Choose the date, time, room, and panel chair before publishing.' });
      return;
    }

    if (uniquePanelIds.size !== panelIds.length) {
      setFormMessage({ tone: 'danger', text: 'Panel chair and members must be different faculty accounts.' });
      return;
    }

    if (panelIds.some((id) => id.startsWith('mock:'))) {
      setFormMessage({ tone: 'danger', text: 'Create or load real faculty accounts before publishing a panel assignment.' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/defense-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          groupCode: selectedGroup.code,
          projectTitle: selectedGroup.title,
          department: selectedGroup.department,
          adviserName: selectedGroup.adviser,
          students: selectedGroup.students,
          date,
          time,
          room,
          chairId: chair,
          memberIds: [member1, member2].filter(Boolean)
        })
      });
      const payload = (await response.json()) as DefenseSchedulesApiResponse;

      if (!response.ok || !payload.success || !payload.assignment) {
        throw new Error(payload.message || 'Unable to save the defense schedule.');
      }

      setAssignments((current) => [
        payload.assignment as DefenseAssignment,
        ...current.filter((assignment) => assignment.groupCode !== payload.assignment?.groupCode)
      ]);
      setActiveTab('scheduled');
      setFormMessage({ tone: 'success', text: 'Panel chair assignment saved and published.' });
    } catch (error) {
      setFormMessage({
        tone: 'danger',
        text: error instanceof Error ? error.message : 'Unable to save the defense schedule.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProgramHeadStatCard title="Needs Scheduling" value={pendingGroups.length} note="Active & pending groups" icon="fas fa-calendar-plus" />
        <ProgramHeadStatCard title="Scheduled" value={scheduledGroups.length} note="Defense dates locked" icon="fas fa-calendar-check" />
        <ProgramHeadStatCard title="Available Rooms" value={ROOMS.length} note="Venues ready" icon="fas fa-door-open" />
        <ProgramHeadStatCard title="Panel Members" value={panelFaculty.length} note={facultyOptions.length ? 'Faculty accounts loaded' : 'Demo faculty fallback'} icon="fas fa-users" />
      </div>

      {/* Tab Header + Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => { setActiveTab('pending'); setSelectedGroup(null); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pending' ? 'shadow-sm bg-white text-[#003a8f]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-clock text-xs"></i> Needs Scheduling <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === 'pending' ? 'bg-blue-50 text-[#003a8f]' : 'bg-slate-200 text-slate-600'}`}>{pendingGroups.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('scheduled'); setSelectedGroup(null); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scheduled' ? 'shadow-sm bg-white text-[#003a8f]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-check-circle text-xs"></i> Scheduled <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === 'scheduled' ? 'bg-blue-50 text-[#003a8f]' : 'bg-slate-200 text-slate-600'}`}>{scheduledGroups.length}</span>
            </button>
          </div>
          <div className="relative w-full md:w-72">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border-none text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 hover:bg-slate-100 transition-colors"
              placeholder="Search groups..."
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Group List */}
        <div className="w-full lg:w-1/2 xl:w-7/12 space-y-3">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <i className="fas fa-search text-4xl text-slate-200 mb-3 block"></i>
              <p className="text-slate-500 font-medium m-0">No groups found.</p>
            </div>
          ) : filteredList.map(group => {
            const assignment = assignmentsByCode[group.code];
            const scheduleLine = formatScheduleLine(assignment);

            return (
            <div
              key={group.code}
              className={`bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-md group ${
                selectedGroup?.code === group.code ? 'border-[#003a8f] border-2 shadow-sm' : 'border-slate-100 hover:border-slate-300'
              }`}
              onClick={() => setSelectedGroup(group)}
            >
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <code className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#003a8f] uppercase tracking-wider">{group.code}</code>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-500">
                      <i className="fas fa-chalkboard-teacher text-[10px] mr-1 text-slate-400"></i>{group.adviser}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight mb-1.5 group-hover:text-[#003a8f] transition-colors">{group.title}</h3>
                  <div className="flex -space-x-2 mt-2">
                    {group.students.slice(0, 3).map((s, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-500" title={s}>
                        {s.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {group.students.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-600">+{group.students.length - 3}</div>
                    )}
                    <span className="text-[11px] text-slate-400 self-center ml-3">{group.students.length} members</span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  selectedGroup?.code === group.code ? 'bg-[#003a8f] text-white shadow-md' : 'bg-blue-50 text-[#003a8f] group-hover:bg-[#003a8f] group-hover:text-white'
                }`}>
                  <i className={`fas ${activeTab === 'pending' ? 'fa-calendar-plus' : 'fa-calendar-check'}`}></i>
                </div>
              </div>
              {activeTab === 'scheduled' && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-2xl flex flex-wrap gap-4 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5"><i className="fas fa-clock text-[#003a8f]"></i> {scheduleLine.time}</span>
                  <span className="flex items-center gap-1.5"><i className="fas fa-door-open text-[#003a8f]"></i> {scheduleLine.room}</span>
                  <span className="flex items-center gap-1.5"><i className="fas fa-users text-[#003a8f]"></i> {scheduleLine.panel}</span>
                </div>
              )}
            </div>
          )})}
        </div>

        {/* Scheduling Panel */}
        <div className="w-full lg:w-1/2 xl:w-5/12 bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-6">
          {selectedGroup ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-[#003a8f]/5 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#003a8f] text-white flex items-center justify-center shadow-md">
                    <i className={`fas ${activeTab === 'pending' ? 'fa-calendar-plus' : 'fa-edit'}`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 m-0">{activeTab === 'pending' ? 'Schedule Defense' : 'Edit Schedule'}</h3>
                    <p className="text-sm text-slate-500 m-0 truncate max-w-[280px]">{selectedGroup.title}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="w-full text-sm p-3 rounded-xl bg-slate-50 border-none font-medium outline-none hover:bg-slate-100 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Time</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)}
                      className="w-full text-sm p-3 rounded-xl bg-slate-50 border-none font-medium outline-none hover:bg-slate-100 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Venue / Room</label>
                  <select value={room} onChange={e => setRoom(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl bg-slate-50 border-none font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                    <option value="">Select a room...</option>
                    {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <i className="fas fa-users-cog text-[#003a8f]"></i> Panel Configuration
                  </h4>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs font-medium text-amber-800 flex gap-2">
                    <i className="fas fa-info-circle mt-0.5 text-amber-500"></i>
                    <div><strong>Note:</strong> {selectedGroup.adviser} is the academic adviser and cannot be a scoring panelist.</div>
                  </div>

                  {[
                    { label: 'Panel Chair', value: chair, setter: setChair, icon: 'fa-crown', iconColor: 'text-amber-500' },
                    { label: 'Panel Member 1', value: member1, setter: setMember1, icon: 'fa-user', iconColor: 'text-slate-400' },
                    { label: 'Panel Member 2', value: member2, setter: setMember2, icon: 'fa-user', iconColor: 'text-slate-400' }
                  ].map(field => (
                    <div key={field.label}>
                      <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <i className={`fas ${field.icon} ${field.iconColor}`}></i> {field.label}
                      </label>
                      <select value={field.value} onChange={e => field.setter(e.target.value)}
                        className="w-full text-sm p-3 rounded-xl bg-slate-50 border-none font-medium outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                        <option value="">Select...</option>
                        {panelFaculty.map(a => {
                          const selectedIds = new Set([chair, member1, member2].filter(Boolean));
                          const isAcademicAdviser = normalizeFacultyIdentity(getFacultyName(a)) === normalizeFacultyIdentity(selectedGroup.adviser);
                          const selectedElsewhere = selectedIds.has(a.id) && a.id !== field.value;

                          return (
                          <option key={a.id} value={a.id} disabled={isAcademicAdviser || selectedElsewhere}>
                            {getFacultyName(a)}{a.department ? ` - ${a.department}` : ''}
                          </option>
                        )})}
                      </select>
                    </div>
                  ))}
                </div>

                {selectedAssignment && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                    <i className="fas fa-circle-check mr-1.5"></i>
                    Current chair: {selectedAssignment.panelists.find((panelist) => panelist.panelRole === 'CHAIR')?.name || 'Assigned faculty'}
                  </div>
                )}

                {formMessage && (
                  <div className={`rounded-xl border p-3 text-xs font-semibold ${formMessage.tone === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-rose-100 bg-rose-50 text-rose-700'}`}>
                    <i className={`fas ${formMessage.tone === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'} mr-1.5`}></i>
                    {formMessage.text}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl mt-auto">
                <button onClick={handleSchedule} disabled={isSaving}
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-md bg-[#003a8f] hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0">
                  <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-lock'}`}></i>
                  {isSaving ? 'Publishing...' : activeTab === 'pending' ? 'Lock Schedule & Publish' : 'Update Published Schedule'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-3xl text-[#003a8f]/30 mb-6 border-2 border-dashed border-[#003a8f]/10">
                <i className="fas fa-calendar-day"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Group Selected</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">Select a group from the list to assign their defense date, room, and faculty panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
