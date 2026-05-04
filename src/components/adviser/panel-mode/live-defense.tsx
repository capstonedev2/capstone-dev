'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import { artifactTone, MAX_SCORE, MOCK_SCHEDULE, RUBRIC, type ScheduleItem } from './live-defense-logic';
import { DefenseTopBar } from './defense-top-bar';
import { DefenseLeftPanel } from './defense-left-panel';
import { DefenseEvalPanel } from './defense-eval-panel';

const DEFAULT_TOTAL_TIME = 15 * 60;
const LIVE_DEFENSE_STORAGE_PREFIX = 'thesisTrackLiveDefenseSession';

type LiveDefenseSessionSnapshot = {
  sessionStarted: boolean;
  evaluationNeeds: string[];
  attendance: Record<string, boolean>;
  sessionDuration: number;
  updatedAt: string;
};

function buildDefaultEvaluationNeeds(focusAreas: string[]) {
  return focusAreas.map((area) => `Ask the presenters to defend the ${area.toLowerCase()} with clear evidence.`);
}

function getLiveDefenseStorageKey(groupId: string) {
  return `${LIVE_DEFENSE_STORAGE_PREFIX}:${groupId}`;
}

function readLiveDefenseSnapshot(groupId: string) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getLiveDefenseStorageKey(groupId));
    if (!raw) return null;
    return JSON.parse(raw) as LiveDefenseSessionSnapshot;
  } catch {
    return null;
  }
}

type UserIdentity = {
  id?: string;
  email?: string;
  name?: string;
  displayName?: string | null;
  department?: string | null;
  role?: string | null;
};

type CurrentUser = UserIdentity;
type AdviserIdentity = UserIdentity & {
  panelRole?: 'CHAIR' | 'MEMBER';
};
type LiveDefenseScheduleItem = ScheduleItem & {
  assignedPanelists?: AdviserIdentity[];
};
type DefenseAssignment = {
  id: string;
  groupCode: string;
  groupTitle?: string;
  projectTitle: string;
  department?: string;
  students?: string[];
  leader?: string;
  adviserName?: string;
  date: string;
  time: string;
  room: string;
  panelists: AdviserIdentity[];
};

function normalizeIdentityValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() || '';
}

function getIdentityDisplayName(user: UserIdentity | null | undefined) {
  return user?.displayName?.trim() || user?.name?.trim() || user?.email?.trim() || '';
}

function getIdentityKey(user: UserIdentity) {
  return normalizeIdentityValue(user.id) || normalizeIdentityValue(user.email) || normalizeIdentityValue(getIdentityDisplayName(user));
}

function isSameIdentity(left: UserIdentity | null | undefined, right: UserIdentity | null | undefined) {
  const leftId = normalizeIdentityValue(left?.id);
  const rightId = normalizeIdentityValue(right?.id);
  const leftEmail = normalizeIdentityValue(left?.email);
  const rightEmail = normalizeIdentityValue(right?.email);

  if (leftId && rightId) return leftId === rightId;
  if (leftEmail && rightEmail) return leftEmail === rightEmail;
  if (leftId || rightId || leftEmail || rightEmail) return false;

  const leftName = normalizeIdentityValue(getIdentityDisplayName(left));
  const rightName = normalizeIdentityValue(getIdentityDisplayName(right));
  return Boolean(leftName && leftName === rightName);
}

function isPanelAccount(user: UserIdentity) {
  return normalizeIdentityValue(user.role) === 'panel';
}

function toAssignedScheduleItem(assignment: DefenseAssignment): LiveDefenseScheduleItem {
  const members = assignment.students?.length ? assignment.students : ['Student roster pending'];
  const leader = assignment.leader || members[0] || 'Leader pending';

  return {
    id: assignment.id,
    time: assignment.time || assignment.date,
    title: assignment.projectTitle,
    group: assignment.groupCode || assignment.groupTitle || 'Assigned Defense',
    status: 'waiting',
    members,
    leader,
    adviser: assignment.adviserName || 'Adviser pending',
    room: assignment.room || 'Room pending',
    program: assignment.department ? `${assignment.department} Capstone` : 'Capstone Defense',
    deckUrl: '#',
    attendance: members.reduce<Record<string, boolean>>((record, member) => {
      record[member] = true;
      return record;
    }, {}),
    focusAreas: ['Technical execution', 'Project validation', 'Deployment readiness'],
    artifacts: [
      { label: 'Manuscript', status: 'For review' },
      { label: 'Presentation deck', status: 'For review' },
      { label: 'Panel checklist', status: 'Ready' }
    ],
    assignedPanelists: assignment.panelists
  };
}

export function LiveDefenseView({ data }: { data: AdviserDashboardData }) {
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ presentation: 0, technical: 0, innovation: 0 });
  const [individualScores, setIndividualScores] = useState<Record<string, number>>({});
  const [attendance, setAttendance] = useState<Record<string, boolean>>(MOCK_SCHEDULE[0].attendance);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(DEFAULT_TOTAL_TIME);
  const [timer, setTimer] = useState(DEFAULT_TOTAL_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isViewingDeck, setIsViewingDeck] = useState(true);
  const [evaluationNeeds, setEvaluationNeeds] = useState<string[]>(() => buildDefaultEvaluationNeeds(MOCK_SCHEDULE[0].focusAreas));
  const [loadedSessionGroupId, setLoadedSessionGroupId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [advisers, setAdvisers] = useState<AdviserIdentity[]>([]);
  const [defenseAssignments, setDefenseAssignments] = useState<DefenseAssignment[]>([]);
  const [panelistVotes, setPanelistVotes] = useState<Record<string, 'yes' | 'no'>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (response.ok) {
          const payload = (await response.json()) as { user?: CurrentUser; data?: { user?: CurrentUser } };
          const user = payload?.user ?? payload?.data?.user;
          if (user && getIdentityDisplayName(user)) {
            setCurrentUser(user);
            return;
          }
        }
      } catch {}

      import('@/lib/mock/auth').then(({ getStoredUser }) => {
        const stored = getStoredUser() as CurrentUser | null;
        if (stored && getIdentityDisplayName(stored)) setCurrentUser(stored);
      });
    })();

    (async () => {
      try {
        const response = await fetch('/api/advisers', { cache: 'no-store' });
        if (response.ok) {
          const payload = (await response.json()) as {
            advisers?: AdviserIdentity[];
            panelists?: AdviserIdentity[];
            data?: { advisers?: AdviserIdentity[]; panelists?: AdviserIdentity[] };
          };
          const fetchedPanelists = payload?.panelists ?? payload?.advisers ?? payload?.data?.panelists ?? payload?.data?.advisers ?? [];
          if (fetchedPanelists.length) {
            setAdvisers(fetchedPanelists);
            return;
          }
        }
      } catch {}
    })();

    (async () => {
      try {
        const response = await fetch('/api/defense-schedules', { cache: 'no-store' });
        if (response.ok) {
          const payload = (await response.json()) as { assignments?: DefenseAssignment[] };
          setDefenseAssignments(payload.assignments ?? []);
        }
      } catch {} finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const defenseSchedule = useMemo<LiveDefenseScheduleItem[]>(() => {
    return defenseAssignments.map(toAssignedScheduleItem);
  }, [defenseAssignments]);

  useEffect(() => {
    if (idx >= defenseSchedule.length) {
      setIdx(0);
    }
  }, [defenseSchedule.length, idx]);

  const databasePanelists = useMemo(() => {
    const seen = new Set<string>();

    return advisers.filter((adviser) => {
      if (!getIdentityDisplayName(adviser)) return false;

      const key = getIdentityKey(adviser);
      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }, [advisers]);

  const group = defenseSchedule[idx] ?? MOCK_SCHEDULE[0];
  const assignedPanelists = group?.assignedPanelists ?? [];
  const assignedChair = assignedPanelists.find((panelist) => panelist.panelRole === 'CHAIR') ?? null;
  const chairAccount = assignedChair ?? null;
  const orderedPanelists = assignedPanelists.length
    ? [
        ...(assignedChair ? [assignedChair] : []),
        ...assignedPanelists.filter((panelist) => !assignedChair || !isSameIdentity(panelist, assignedChair))
      ]
    : [];

  const panelists = orderedPanelists.map((adviser, index) => {
    const displayName = getIdentityDisplayName(adviser);
    const isMe = isSameIdentity(currentUser, adviser);
    const role = adviser.panelRole === 'CHAIR' ? 'Panel Chair' : 'Panel Member';
    return {
      id: adviser.id || adviser.email || `p${index}`,
      name: displayName,
      department: adviser.department || 'IT Department',
      role,
      status: isMe ? 'Active' : 'Listening',
      isMe
    };
  });

  const isChair = Boolean(currentUser && chairAccount && isSameIdentity(currentUser, chairAccount));
  const canNext = idx < defenseSchedule.length - 1;
  const presentCount = group.members.filter((member) => attendance[member] !== false).length;
  const scoredCriteria = RUBRIC.filter((criteria) => scores[criteria.id] > 0).length;
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const deckAvailable = group.deckUrl !== '#';
  const nextGroups = defenseSchedule.slice(idx + 1, idx + 3);
  const activeEvaluationNeeds = evaluationNeeds.map((need) => need.trim()).filter(Boolean);
  const evaluationSetupReady = activeEvaluationNeeds.length > 0;
  const packetReadyCount = group.artifacts.filter((artifact) => artifact.status === 'Ready').length;
  const packetIssueCount = group.artifacts.length - packetReadyCount;
  const readinessItems = [
    { id: 'roll-call', label: 'Roll Call', ready: presentCount === group.members.length, icon: 'fa-user-check' },
    { id: 'evaluation', label: 'Evaluation Guide', ready: evaluationSetupReady, icon: 'fa-list-check' },
    { id: 'packet', label: 'Defense Packet', ready: packetIssueCount === 0, icon: 'fa-folder-open' },
    { id: 'deck', label: 'Presentation Deck', ready: deckAvailable, icon: 'fa-file-powerpoint' }
  ];
  const readyItemCount = readinessItems.filter((item) => item.ready).length;
  const showMemberWaitingRoom = !sessionStarted && !isChair;

  useEffect(() => {
    const storedSnapshot = readLiveDefenseSnapshot(group.id);
    resetScoringState();

    if (storedSnapshot) {
      setAttendance(storedSnapshot.attendance ?? group.attendance);
      setEvaluationNeeds(storedSnapshot.evaluationNeeds?.length ? storedSnapshot.evaluationNeeds : buildDefaultEvaluationNeeds(group.focusAreas));
      setSessionDuration(storedSnapshot.sessionDuration || DEFAULT_TOTAL_TIME);
      setTimer(storedSnapshot.sessionDuration || DEFAULT_TOTAL_TIME);
      setSessionStarted(Boolean(storedSnapshot.sessionStarted));
      setTimerActive(Boolean(storedSnapshot.sessionStarted));
    } else {
      setAttendance(group.attendance);
      setEvaluationNeeds(buildDefaultEvaluationNeeds(group.focusAreas));
      setSessionDuration(DEFAULT_TOTAL_TIME);
      setTimer(DEFAULT_TOTAL_TIME);
      setTimerActive(false);
      setSessionStarted(false);
    }

    setIsViewingDeck(true);
    setFocusMode(false);
    setLoadedSessionGroupId(group.id);
  }, [group.id]);

  useEffect(() => {
    function applySnapshot(snapshot: LiveDefenseSessionSnapshot) {
      setAttendance(snapshot.attendance ?? group.attendance);
      setEvaluationNeeds(snapshot.evaluationNeeds?.length ? snapshot.evaluationNeeds : buildDefaultEvaluationNeeds(group.focusAreas));
      setSessionDuration(snapshot.sessionDuration || DEFAULT_TOTAL_TIME);
      setTimer(snapshot.sessionDuration || DEFAULT_TOTAL_TIME);
      setSessionStarted(Boolean(snapshot.sessionStarted));
      setTimerActive(Boolean(snapshot.sessionStarted));
      setIsViewingDeck(true);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== getLiveDefenseStorageKey(group.id) || !event.newValue) return;
      try {
        applySnapshot(JSON.parse(event.newValue) as LiveDefenseSessionSnapshot);
      } catch {}
    }

    function handleSessionUpdate(event: Event) {
      const detail = (event as CustomEvent<{ groupId: string; snapshot: LiveDefenseSessionSnapshot }>).detail;
      if (detail?.groupId !== group.id || !detail.snapshot) return;
      applySnapshot(detail.snapshot);
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('liveDefenseSessionUpdated', handleSessionUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('liveDefenseSessionUpdated', handleSessionUpdate);
    };
  }, [group.id, group.attendance, group.focusAreas]);

  useEffect(() => {
    if (!isChair || loadedSessionGroupId !== group.id) return;

    const snapshot: LiveDefenseSessionSnapshot = {
      sessionStarted,
      evaluationNeeds,
      attendance,
      sessionDuration,
      updatedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(getLiveDefenseStorageKey(group.id), JSON.stringify(snapshot));
      window.dispatchEvent(new CustomEvent('liveDefenseSessionUpdated', { detail: { groupId: group.id, snapshot } }));
    } catch {}
  }, [attendance, evaluationNeeds, group.id, isChair, loadedSessionGroupId, sessionDuration, sessionStarted]);

  useEffect(() => {
    if (!timerActive || timer <= 0) return;
    const intervalId = window.setInterval(() => setTimer((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(intervalId);
  }, [timerActive, timer]);

  useEffect(() => {
    if (timer === 0) setTimerActive(false);
  }, [timer]);

  function resetScoringState() {
    setScores({ presentation: 0, technical: 0, innovation: 0 });
    setIndividualScores({});
    setNotes({});
    setFeedback('');
    setSubmitted(false);
    setPanelistVotes({});
  }

  function nextGroup() {
    if (!canNext) return;
    const nextIndex = idx + 1;
    const next = defenseSchedule[nextIndex];
    setIdx(nextIndex);
    setAttendance(next.attendance);
    resetScoringState();
    setSessionDuration(DEFAULT_TOTAL_TIME);
    setTimer(DEFAULT_TOTAL_TIME);
    setTimerActive(false);
    setSessionStarted(false);
    setIsViewingDeck(true);
    setFocusMode(false);
  }

  function clearAllSessionSnapshots() {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(LIVE_DEFENSE_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch {}
  }

  async function endAllDefenses() {
    if (!isChair) return;
    try {
      const response = await fetch('/api/defense-schedules', { method: 'DELETE' });
      if (!response.ok) return;
    } catch {}
    clearAllSessionSnapshots();
    resetScoringState();
    setDefenseAssignments([]);
    setSessionStarted(false);
    setTimerActive(false);
    setTimer(DEFAULT_TOTAL_TIME);
    setSessionDuration(DEFAULT_TOTAL_TIME);
    setIdx(0);
  }

  function startSession() {
    setSessionStarted(true);
    setTimerActive(true);
    setIsViewingDeck(true);
  }

  function toggleAttendance(name: string) {
    if (!isChair) return;

    setAttendance((previous) => {
      const nextPresent = previous[name] === false;
      if (!nextPresent) {
        setIndividualScores((currentScores) => {
          const { [name]: _removedScore, ...remainingScores } = currentScores;
          return remainingScores;
        });
      }

      return { ...previous, [name]: nextPresent };
    });
  }

  function updateEvaluationNeed(index: number, value: string) {
    if (!isChair || sessionStarted) return;
    setEvaluationNeeds((current) => current.map((need, needIndex) => (needIndex === index ? value : need)));
  }

  function addEvaluationNeed() {
    if (!isChair || sessionStarted) return;
    setEvaluationNeeds((current) => [...current, '']);
  }

  function removeEvaluationNeed(index: number) {
    if (!isChair || sessionStarted) return;
    setEvaluationNeeds((current) => (current.length > 1 ? current.filter((_, needIndex) => needIndex !== index) : current));
  }

  function addFiveMinutes() {
    setTimer((current) => current + 300);
    setSessionDuration((current) => current + 300);
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[1000] flex h-[100dvh] w-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <i className="fas fa-circle-notch animate-spin text-4xl text-[#003a8f]" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Schedule</p>
        </div>
      </div>
    );
  }

  if (defenseAssignments.length === 0) {
    return (
      <div className="fixed inset-0 z-[1000] flex h-[100dvh] w-screen items-center justify-center bg-[#f8fafc]">
        <div className="max-w-md text-center">
          <div className="mb-6 mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 border-8 border-white shadow-sm">
            <i className="fas fa-calendar-xmark text-4xl text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-[#102033] tracking-tight">No Defenses Scheduled</h2>
          <p className="mt-3 text-slate-500 font-medium leading-relaxed">
            You do not have any live defense sessions scheduled for today. You will be notified when the Program Head assigns you to a panel.
          </p>
          <Link
            href="/adviser/panel-mode/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003a8f] to-[#082a67] px-6 py-3 text-sm font-black text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <i className="fas fa-arrow-left" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex h-[100dvh] w-screen flex-col overflow-hidden font-sans text-slate-900"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(0, 58, 143, 0.06), transparent 28%), radial-gradient(circle at top right, rgba(246, 190, 0, 0.07), transparent 22%), linear-gradient(180deg, #f8fafc 0%, #eff4fa 100%)'
      }}
    >
      <DefenseTopBar
        title={group.title}
        group={group.group}
        timer={timer}
        totalTime={sessionDuration}
        timerActive={timerActive}
        isChair={isChair}
        groupIndex={idx}
        totalGroups={defenseSchedule.length}
        room={group.room}
        time={group.time}
        presentCount={presentCount}
        totalMembers={group.members.length}
        sessionStarted={sessionStarted}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
        {!showMemberWaitingRoom && (
          <DefenseLeftPanel
            group={group.group}
            adviser={group.adviser}
            members={group.members}
            leader={group.leader}
            attendance={attendance}
            panelists={panelists}
            focusMode={focusMode}
            room={group.room}
            program={group.program}
            time={group.time}
            isChair={isChair}
            onToggleAttendance={toggleAttendance}
          />
        )}

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-transparent">
          {showMemberWaitingRoom ? (
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6 relative">
              {/* Premium Background Glow for Waiting Room */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(0,58,143,0.08),transparent_70%)] blur-3xl pointer-events-none" />
              
              <section className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,43,89,0.08)] relative z-10 transition-all duration-500 hover:shadow-[0_30px_70px_rgba(15,43,89,0.12)]">
                <div className="border-b border-white/40 bg-gradient-to-br from-white via-white/90 to-blue-50/50 p-8 sm:p-10 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#003a8f] to-transparent opacity-30" />
                  
                  <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.25rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50 text-3xl text-[#003a8f] shadow-[0_8px_20px_rgba(0,58,143,0.08)]">
                    <span className="absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-white/50" />
                    <i className="fas fa-hourglass-half animate-[pulse_3s_ease-in-out_infinite]" />
                  </span>
                  
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#dbe9fb] bg-[#ebf5ff] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#003a8f]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#003a8f] animate-ping" />
                    Panel Member Waiting Room
                  </div>
                  
                  <h2 className="mt-4 text-[clamp(1.5rem,3vw,2rem)] font-black tracking-tight text-[#102033]">Waiting for the panel chair</h2>
                  <p className="mx-auto mt-3 max-w-xl text-[0.95rem] font-medium leading-relaxed text-[#536982]">
                    The chair is currently finalizing the evaluation guide, roll call, and defense packet. The live defense workspace will open automatically when the session starts.
                  </p>
                </div>

                <div className="grid gap-6 p-6 sm:p-8 sm:grid-cols-2 bg-gradient-to-b from-transparent to-slate-50/50">
                  <div className="rounded-[1.25rem] border border-white/80 bg-white/60 backdrop-blur-sm p-6 shadow-[0_4px_20px_rgba(15,43,89,0.03)] hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400 mb-1">Current Defense</p>
                    <h3 className="text-xl font-black text-[#102033] leading-tight">{group.title}</h3>
                    <div className="mt-5 grid gap-3 text-xs font-bold text-[#536982]">
                      <span className="flex items-center gap-3 bg-white/80 p-2.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#f0f5ff] text-[#003a8f]">
                          <i className="fas fa-users" />
                        </span>
                        {group.group}
                      </span>
                      <span className="flex items-center gap-3 bg-white/80 p-2.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#f0f5ff] text-[#003a8f]">
                          <i className="fas fa-location-dot" />
                        </span>
                        {group.room}
                      </span>
                      <span className="flex items-center gap-3 bg-white/80 p-2.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#f0f5ff] text-[#003a8f]">
                          <i className="fas fa-clock" />
                        </span>
                        {group.time}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-white/80 bg-white/60 backdrop-blur-sm p-6 shadow-[0_4px_20px_rgba(15,43,89,0.03)] hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400 mb-1">Setup Status</p>
                        <p className="text-2xl font-black text-[#102033] tracking-tight">{readyItemCount}<span className="text-[#66758a] text-lg">/{readinessItems.length} ready</span></p>
                      </div>
                      <span className={`rounded-full px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wider shadow-sm ${evaluationSetupReady ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 text-amber-700'}`}>
                        {evaluationSetupReady ? 'Guide Ready' : 'Preparing'}
                      </span>
                    </div>
                    <div className="mt-auto pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {readinessItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-[0.85rem] border border-white bg-white/80 px-3 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.5rem] shadow-sm border ${item.ready ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                            <i className={`fas ${item.ready ? 'fa-check' : item.icon} text-[10px]`} />
                          </span>
                          <span className="min-w-0 truncate text-[0.7rem] font-black text-[#102033] uppercase tracking-wide">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's Defense Schedule */}
                <div className="border-t border-white/40 p-6 sm:p-8 bg-gradient-to-b from-transparent to-slate-50/30">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Today&apos;s Defense Schedule</h3>
                      <p className="mt-1 text-sm font-bold text-[#102033]">{defenseSchedule.length} group{defenseSchedule.length !== 1 ? 's' : ''} scheduled</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/50 bg-blue-50/80 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-[#003a8f] shadow-sm">
                      <i className="fas fa-calendar-day" />
                      Schedule
                    </span>
                  </div>

                  <div className="space-y-3">
                    {defenseSchedule.map((schedItem, schedIdx) => (
                      <div
                        key={schedItem.id}
                        className={`flex items-center gap-4 rounded-[1.25rem] border p-4 transition-all duration-300 ${
                          schedIdx === idx
                            ? 'border-[#003a8f]/30 bg-gradient-to-r from-[#ebf5ff] to-white shadow-[0_4px_20px_rgba(0,58,143,0.08)] ring-1 ring-[#003a8f]/10'
                            : schedIdx < idx
                              ? 'border-slate-100 bg-white/40 opacity-60'
                              : 'border-white bg-white/70 hover:border-blue-100 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,43,89,0.06)]'
                        }`}
                      >
                        {/* Order Number */}
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] text-sm font-black shadow-sm ${
                          schedIdx === idx
                            ? 'bg-gradient-to-br from-[#003a8f] to-[#082a67] text-white shadow-[0_4px_12px_rgba(0,58,143,0.2)]'
                            : schedIdx < idx
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                              : 'bg-white border border-slate-200 text-slate-500'
                        }`}>
                          {schedIdx < idx ? <i className="fas fa-check text-xs" /> : schedIdx + 1}
                        </span>

                        {/* Group Info */}
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[0.95rem] font-black leading-tight ${schedIdx === idx ? 'text-[#003a8f]' : 'text-[#102033]'}`}>
                            {schedItem.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-bold text-[#536982]">
                            <span className="inline-flex items-center gap-1"><i className="fas fa-users text-[0.6rem] text-[#003a8f]/50" /> {schedItem.group}</span>
                            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                            <span className="inline-flex items-center gap-1"><i className="fas fa-clock text-[0.6rem] text-[#003a8f]/50" /> {schedItem.time}</span>
                            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                            <span className="inline-flex items-center gap-1"><i className="fas fa-location-dot text-[0.6rem] text-[#003a8f]/50" /> {schedItem.room}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`shrink-0 rounded-full border px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest ${
                          schedIdx === idx
                            ? 'border-[#003a8f]/20 bg-[#003a8f] text-white shadow-sm'
                            : schedIdx < idx
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                          {schedIdx === idx ? 'Current' : schedIdx < idx ? 'Done' : 'Upcoming'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200/50 bg-[#f8fbff]/80 backdrop-blur-md px-6 py-4 text-center">
                  <p className="text-[0.75rem] font-bold text-[#003a8f] flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch animate-spin text-[#f6be00]" />
                    Keep this page open. It updates when the chair proceeds to live defense.
                  </p>
                </div>
              </section>
            </div>
          ) : !sessionStarted ? (
            <div className="min-h-full p-4 sm:p-8 relative">
              <div className="mx-auto flex flex-col min-h-full w-full max-w-[1600px] gap-8 relative z-10">
                <section className="flex flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,43,89,0.08)]">
                  <div className="border-b border-white/40 bg-gradient-to-br from-[#003a8f] to-[#082a67] p-8 sm:p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(246,190,0,0.15),transparent_60%)] pointer-events-none blur-2xl" />
                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                          <span className="h-2 w-2 rounded-full bg-[#f6be00] animate-pulse shadow-[0_0_10px_rgba(246,190,0,0.8)]" />
                          Chair Ready Room
                        </span>
                        <h2 className="mt-5 text-[clamp(1.8rem,3vw,2.5rem)] font-black tracking-tight text-white leading-tight">{group.title}</h2>
                        <div className="mt-4 flex flex-wrap gap-3 text-[0.75rem] font-bold text-blue-100 uppercase tracking-wide">
                          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                            <i className="fas fa-users text-[#f6be00]" />
                            {group.group}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                            <i className="fas fa-user-tie text-[#f6be00]" />
                            {group.adviser}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                            <i className="fas fa-location-dot text-[#f6be00]" />
                            {group.room}
                          </span>
                        </div>
                      </div>
                      <div className="w-full rounded-[1.25rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.2)] lg:min-w-[380px] xl:w-[440px]">
                        <div className="mb-5 flex items-center justify-between">
                          <div>
                            <p className="text-[0.7rem] font-black uppercase tracking-widest text-blue-200">Readiness</p>
                            <p className="mt-1 text-lg font-black text-white">{readyItemCount}/{readinessItems.length} checks ready</p>
                          </div>
                          <span className={`rounded-full px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wider ${readyItemCount === readinessItems.length ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#f6be00]/20 text-[#f6be00] border border-[#f6be00]/30'}`}>
                            {readyItemCount === readinessItems.length ? 'Ready' : 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {readinessItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
                              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.6rem] border ${item.ready ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/10 border-white/20 text-blue-200'}`}>
                                <i className={`fas ${item.ready ? 'fa-check' : item.icon} text-xs`} />
                              </span>
                              <span className="min-w-0 text-[0.7rem] font-black text-white uppercase tracking-wider leading-snug">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.9fr)] bg-gradient-to-b from-transparent to-slate-50/50 flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-3 mb-5">
                        <div>
                          <h3 className="text-[0.8rem] font-black uppercase tracking-widest text-[#102033]">Evaluation Setup</h3>
                          <p className="mt-1 text-sm font-medium text-[#536982]">
                            {isChair ? 'Configure the questions the panel will use for Q&A and scoring.' : 'Prepared by the panel chair.'}
                          </p>
                        </div>
                        {isChair && (
                          <button
                            type="button"
                            onClick={addEvaluationNeed}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black text-[#003a8f] shadow-sm transition-all hover:border-[#003a8f] hover:bg-blue-50 hover:shadow-md"
                          >
                            <i className="fas fa-plus" />
                            Add Focus
                          </button>
                        )}
                      </div>
                      <div className="space-y-3 flex-1">
                        {evaluationNeeds.map((need, index) => (
                          <div key={`evaluation-need-${index}`} className="group relative overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/70 backdrop-blur-sm p-4 shadow-[0_4px_20px_rgba(15,43,89,0.03)] transition-all hover:border-[#b6c9e5] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(15,43,89,0.06)]">
                            <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#003a8f] to-blue-400" />
                            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 border border-blue-100 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-widest text-[#003a8f] shadow-sm">
                              <i className="fas fa-circle-question" />
                              Question {index + 1}
                            </span>
                            {isChair ? (
                              <div className="flex min-w-0 gap-3">
                                <textarea
                                  value={need}
                                  onChange={(event) => updateEvaluationNeed(index, event.target.value)}
                                  placeholder="Enter an evaluation question or panel focus."
                                  className="min-h-24 flex-1 resize-none rounded-[1rem] border border-slate-200 bg-white p-4 text-[0.95rem] font-semibold leading-relaxed text-[#102033] outline-none shadow-inner transition focus:border-[#003a8f] focus:ring-2 focus:ring-[#003a8f]/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeEvaluationNeed(index)}
                                  disabled={evaluationNeeds.length <= 1}
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] border border-rose-100 bg-rose-50 text-rose-500 transition-colors hover:bg-rose-500 hover:text-white hover:border-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Remove evaluation question"
                                >
                                  <i className="fas fa-trash text-sm" />
                                </button>
                              </div>
                            ) : (
                              <p className="min-w-0 text-[0.95rem] font-bold leading-relaxed text-[#102033]">{need || 'No question set yet.'}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {!evaluationSetupReady && (
                        <p className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 shadow-sm flex items-center gap-3">
                          <i className="fas fa-triangle-exclamation text-base" />
                          Please add at least one evaluation question before starting the defense.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-6">
                      <div className="rounded-[1.5rem] border border-white/80 bg-white/70 backdrop-blur-sm p-6 shadow-[0_8px_30px_rgba(15,43,89,0.04)]">
                        <div className="flex items-center justify-between gap-3 mb-5">
                          <div>
                            <h3 className="text-[0.7rem] font-black uppercase tracking-widest text-[#102033]">Defense Packet</h3>
                            <p className="mt-1 text-xs font-medium text-[#536982]">{packetReadyCount}/{group.artifacts.length} items ready</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider shadow-sm ${packetIssueCount ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                            {packetIssueCount ? `${packetIssueCount} Open` : 'Complete'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {group.artifacts.map((artifact) => (
                            <div key={artifact.label} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-100 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors hover:border-blue-100">
                              <span className="flex min-w-0 items-center gap-3 text-sm font-bold text-[#102033]">
                                <span className={`flex w-7 h-7 items-center justify-center rounded-md ${artifact.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : artifact.status === 'Missing' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                  <i className={`fas ${artifact.status === 'Ready' ? 'fa-check' : artifact.status === 'Missing' ? 'fa-triangle-exclamation' : 'fa-clock'} text-[10px]`} />
                                </span>
                                <span className="min-w-0 text-[0.85rem] leading-tight break-words">{artifact.label}</span>
                              </span>
                              <span className={`rounded-md border px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest ${artifactTone(artifact.status)}`}>
                                {artifact.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-[#f2f7ff] to-[#e6f0ff] p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 text-[6rem] text-[#003a8f]/5 pointer-events-none">
                          <i className="fas fa-route" />
                        </div>
                        <p className="text-[0.7rem] font-black uppercase tracking-widest text-[#003a8f] mb-4">Panel Flow Preview</p>
                        <div className="grid gap-3 text-[0.8rem] font-bold text-[#102033] relative z-10">
                          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-2 rounded-xl">
                            <span className="flex h-7 w-7 items-center justify-center rounded-[0.6rem] bg-[#003a8f] text-white shadow-sm">1</span>
                            Confirm roll call
                          </div>
                          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-2 rounded-xl">
                            <span className="flex h-7 w-7 items-center justify-center rounded-[0.6rem] bg-[#003a8f] text-white shadow-sm">2</span>
                            Use chair questions during Q&A
                          </div>
                          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-2 rounded-xl">
                            <span className="flex h-7 w-7 items-center justify-center rounded-[0.6rem] bg-[#003a8f] text-white shadow-sm">3</span>
                            Submit individual panel score
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {nextGroups.length > 0 && (
                    <div className="border-t border-slate-200/60 bg-[#f8fbff]/80 backdrop-blur-md px-6 py-5 sm:px-10">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-md shadow-sm border border-slate-100">Upcoming Defenses</span>
                        {nextGroups.map((item) => (
                          <span key={item.id} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#102033] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <i className="fas fa-clock text-[#003a8f] mr-2" />
                            {item.time} &bull; <span className="text-[#66758a] ml-1">{item.group}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-t border-slate-200/60 bg-white/80 backdrop-blur-md p-6 sm:p-8">
                    <div className="flex-1 min-w-[300px]">
                      <div className="flex items-center gap-4">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] shadow-sm bg-white text-2xl ${isChair ? 'text-[#003a8f] border border-blue-200' : 'text-[#f6be00] border border-[#f6be00]/30'}`}>
                          <i className={`fas ${isChair ? 'fa-user-shield' : 'fa-hourglass-half'}`} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[1rem] font-black text-[#102033]">{isChair ? 'Chair Setup Authorization' : 'Chair Setup In Progress'}</p>
                          <p className="mt-1 text-[0.85rem] font-medium leading-relaxed text-[#536982]">
                            {isChair ? 'Verify attendance and evaluation questions before starting the live defense session.' : 'The chair is verifying attendance. The session will begin shortly.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-4 w-full lg:w-auto">
                      <div className="shrink-0 w-full lg:w-[340px]">
                      {isChair ? (
                        <button
                          type="button"
                          onClick={startSession}
                          disabled={!evaluationSetupReady}
                          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-[#003a8f] to-[#082a67] px-6 py-4 text-[1.05rem] font-black text-white shadow-[0_12px_30px_rgba(0,58,143,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,58,143,0.35)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:transform-none disabled:from-slate-200 disabled:to-slate-300"
                        >
                          <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <i className="fas fa-play" />
                          <span className="relative z-10">Start Live Defense</span>
                          <div className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            <i className="fas fa-arrow-right text-sm" />
                          </div>
                        </button>
                      ) : (
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-center text-[0.95rem] font-bold text-slate-500 shadow-inner flex items-center justify-center gap-2">
                          <i className="fas fa-circle-notch animate-spin" />
                          Waiting for Panel Chair
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex min-h-full flex-col p-4 sm:p-6 relative z-10">
              <section className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,43,89,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/40 bg-gradient-to-r from-white via-white/80 to-[#f2f7ff] px-6 py-4">
                  <div className="min-w-0 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-gradient-to-br from-[#003a8f] to-[#082a67] text-white shadow-[0_4px_15px_rgba(0,58,143,0.2)]">
                      <i className="fas fa-desktop" />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-black uppercase tracking-widest text-[#003a8f]">Presentation Workspace</p>
                      <h2 className="mt-0.5 truncate text-[1.1rem] font-black text-[#102033] tracking-tight">{group.title}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-[1rem] border border-white/80 bg-white/60 backdrop-blur-sm p-1.5 shadow-[0_2px_10px_rgba(15,43,89,0.04)]">
                    <button
                      type="button"
                      onClick={() => setIsViewingDeck(true)}
                      className={`flex items-center gap-2 rounded-[0.75rem] px-4 py-2 text-[0.75rem] font-black transition-all duration-300 ${isViewingDeck ? 'bg-gradient-to-br from-[#003a8f] to-blue-700 text-white shadow-[0_4px_15px_rgba(0,58,143,0.2)]' : 'text-[#536982] hover:bg-white hover:text-[#003a8f] hover:shadow-sm'}`}
                    >
                      <i className={`fas fa-file-powerpoint ${isViewingDeck ? 'text-blue-200' : 'text-[#f6be00]'}`} />
                      Slides
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsViewingDeck(false)}
                      className={`flex items-center gap-2 rounded-[0.75rem] px-4 py-2 text-[0.75rem] font-black transition-all duration-300 ${!isViewingDeck ? 'bg-gradient-to-br from-[#003a8f] to-blue-700 text-white shadow-[0_4px_15px_rgba(0,58,143,0.2)]' : 'text-[#536982] hover:bg-white hover:text-[#003a8f] hover:shadow-sm'}`}
                    >
                      <i className={`fas fa-list-check ${!isViewingDeck ? 'text-blue-200' : 'text-emerald-500'}`} />
                      Brief
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 bg-gradient-to-b from-[#f8fbff] to-white relative">
                  {isViewingDeck ? (
                    deckAvailable ? (
                      <iframe src={`${group.deckUrl}#toolbar=0&navpanes=0`} className="h-full min-h-[520px] w-full border-0 bg-transparent" title="Defense slides" />
                    ) : (
                      <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-5 p-8 text-center">
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.5rem] border border-white bg-white/50 backdrop-blur-md text-4xl text-slate-300 shadow-[0_8px_30px_rgba(15,43,89,0.06)]">
                          <i className="fas fa-file-circle-xmark relative z-10" />
                          <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-tr from-slate-100 to-transparent opacity-50" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[#102033] tracking-tight">No Presentation Uploaded</h3>
                          <p className="mt-2 max-w-sm text-[0.95rem] font-medium leading-relaxed text-[#536982]">
                            The panel can proceed using the defense brief and scoring workspace.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsViewingDeck(false)}
                          className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-xs font-black text-[#003a8f] shadow-sm transition-all hover:bg-blue-50 hover:shadow-md"
                        >
                          Switch to Brief <i className="fas fa-arrow-right" />
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="h-full min-h-[520px] overflow-y-auto p-6 sm:p-8 relative">
                      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="rounded-[1.5rem] border border-white/80 bg-white/70 backdrop-blur-sm p-6 shadow-[0_8px_30px_rgba(15,43,89,0.04)]">
                          <p className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Evaluation Questions</p>
                          <h3 className="mt-2 text-2xl font-black text-[#102033] leading-tight tracking-tight">{group.title}</h3>
                          <div className="mt-6 grid gap-4">
                            {activeEvaluationNeeds.map((need, index) => (
                              <div key={`brief-evaluation-need-${index}`} className="flex items-start gap-4 rounded-[1.25rem] border border-white bg-white/80 p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem] bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-xs font-black text-[#003a8f] shadow-inner">
                                  {index + 1}
                                </span>
                                <p className="text-[0.95rem] font-semibold leading-relaxed text-[#102033] mt-1">{need}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="rounded-[1.5rem] border border-white/80 bg-white/70 backdrop-blur-sm p-6 shadow-[0_8px_30px_rgba(15,43,89,0.04)] relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 text-[8rem] text-[#003a8f]/5 pointer-events-none">
                              <i className="fas fa-chart-pie" />
                            </div>
                            <p className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400 relative z-10">Live Panel Score</p>
                            <div className="mt-4 flex items-end justify-between relative z-10">
                              <span className="text-5xl font-black tabular-nums text-[#003a8f] tracking-tighter">{totalScore}</span>
                              <span className="text-lg font-black text-slate-400 mb-1">/{MAX_SCORE}</span>
                            </div>
                            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner relative z-10">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#003a8f] to-blue-400 transition-all duration-500" style={{ width: `${(scoredCriteria / RUBRIC.length) * 100}%` }} />
                            </div>
                            <p className="mt-3 text-[0.7rem] font-bold text-[#536982] text-right">{scoredCriteria} of {RUBRIC.length} criteria evaluated</p>
                          </div>

                          <div className="rounded-[1.5rem] border border-white/80 bg-white/70 backdrop-blur-sm p-6 shadow-[0_8px_30px_rgba(15,43,89,0.04)]">
                            <p className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Defense Packet</p>
                            <div className="mt-4 space-y-3">
                              {group.artifacts.map((artifact) => (
                                <div key={artifact.label} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-100 bg-white p-3.5 shadow-sm transition-colors hover:border-blue-100">
                                  <span className="text-[0.85rem] font-bold text-[#102033]">{artifact.label}</span>
                                  <span className={`rounded-md border px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest ${artifactTone(artifact.status)}`}>
                                    {artifact.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-2xl px-5 py-4 shadow-[0_8px_30px_rgba(15,43,89,0.06)] relative z-20">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFocusMode(!focusMode)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[0.8rem] font-black transition-all duration-300 ${
                      focusMode ? 'border-[#003a8f] bg-[#003a8f] text-white shadow-[0_4px_15px_rgba(0,58,143,0.3)]' : 'border-white bg-white text-[#536982] shadow-sm hover:border-blue-200 hover:text-[#003a8f]'
                    }`}
                  >
                    <i className={`fas ${focusMode ? 'fa-compress' : 'fa-expand'}`} />
                    {focusMode ? 'Exit Focus' : 'Focus Mode'}
                  </button>
                  <div className="flex items-center gap-2 rounded-xl border border-white bg-white/80 px-4 py-2.5 text-[0.8rem] font-bold text-[#536982] shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Scoring Active
                  </div>

                </div>

                {isChair && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white/80 border border-white shadow-sm rounded-xl overflow-hidden p-1 mr-2">
                      <button
                        type="button"
                        onClick={() => setTimerActive(!timerActive)}
                        className={`flex items-center gap-2 rounded-[0.65rem] px-4 py-2 text-[0.75rem] font-black transition-all ${
                          timerActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-[#003a8f] text-white hover:bg-blue-800 shadow-sm'
                        }`}
                      >
                        <i className={`fas ${timerActive ? 'fa-pause' : 'fa-play'}`} />
                        {timerActive ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        type="button"
                        onClick={addFiveMinutes}
                        className="flex items-center gap-2 rounded-[0.65rem] bg-transparent px-3 py-2 text-[0.75rem] font-black text-[#536982] transition-colors hover:bg-slate-100"
                        title="Add 5 Minutes"
                      >
                        <i className="fas fa-plus text-[#003a8f]" />
                        5m
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTimer(sessionDuration);
                          setTimerActive(false);
                        }}
                        className="flex items-center gap-2 rounded-[0.65rem] bg-transparent px-3 py-2 text-[0.75rem] font-black text-[#536982] transition-colors hover:bg-slate-100"
                        title="Reset Timer"
                      >
                        <i className="fas fa-rotate-left" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={endAllDefenses}
                      className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[0.8rem] font-black text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 hover:shadow-sm"
                    >
                      <i className="fas fa-stop-circle" />
                      End All Defenses
                    </button>
                    {canNext ? (
                      <button
                        type="button"
                        onClick={nextGroup}
                        disabled={!submitted || Object.keys(panelistVotes).length < panelists.length}
                        className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003a8f] to-[#082a67] px-5 py-2.5 text-[0.8rem] font-black text-white shadow-[0_4px_15px_rgba(0,58,143,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,58,143,0.3)] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50 disabled:shadow-none"
                      >
                        {!submitted ? 'Waiting for Submission...' : Object.keys(panelistVotes).length < panelists.length ? 'Complete Voting First' : 'Next Defense Group'}
                        <i className="fas fa-arrow-right transition-transform group-hover:translate-x-1" />
                      </button>
                    ) : (
                      <Link
                        href="/adviser/panel-mode/dashboard"
                        onClick={clearAllSessionSnapshots}
                        className={`group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-5 py-2.5 text-[0.8rem] font-black text-white shadow-[0_4px_15px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] ${!submitted || Object.keys(panelistVotes).length < panelists.length ? 'pointer-events-none opacity-50 shadow-none' : ''}`}
                      >
                        {submitted ? 'Complete Session & Exit' : 'Waiting for Submission...'}
                        <i className="fas fa-check transition-transform group-hover:scale-110" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {sessionStarted && (
          <DefenseEvalPanel
            scores={scores}
            setScore={(id, value) => setScores((previous) => ({ ...previous, [id]: value }))}
            individualScores={individualScores}
            setIndividualScore={(name, value) => setIndividualScores((previous) => ({ ...previous, [name]: value }))}
            attendance={attendance}
            evaluationNeeds={activeEvaluationNeeds}
            members={group.members}
            notes={notes}
            setNote={(id, value) => setNotes((previous) => ({ ...previous, [id]: value }))}
            overallFeedback={feedback}
            setOverallFeedback={setFeedback}
            submitted={submitted}
            onSubmit={() => {
              setSubmitted(true);
              setTimerActive(false);
            }}
            isChair={isChair}
            isMyAdvisee={group.isMyAdvisee}
            focusMode={focusMode}
            onNextGroup={nextGroup}
            canGoNext={canNext}
            panelistVotes={panelistVotes}
            setPanelistVote={(name, vote) => setPanelistVotes((prev) => ({ ...prev, [name]: vote }))}
            panelistNames={panelists.map((p) => p.name)}
            currentPanelistName={panelists.find((p) => p.isMe)?.name ?? ''}
          />
        )}
      </div>
    </div>
  );
}
