'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import { artifactTone, MAX_SCORE, MOCK_SCHEDULE, RUBRIC, INDIVIDUAL_RUBRIC, type ScheduleItem } from './live-defense-logic';
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
  scores: Record<string, number>;
  individualScores: Record<string, number>;
  panelistVotes: Record<string, 'yes' | 'no'>;
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
  scheduleType?: string;
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
  if (leftId && rightId && leftId === rightId) return true;

  const leftEmail = normalizeIdentityValue(left?.email);
  const rightEmail = normalizeIdentityValue(right?.email);
  if (leftEmail && rightEmail && leftEmail === rightEmail) return true;

  const leftName = normalizeIdentityValue(getIdentityDisplayName(left));
  const rightName = normalizeIdentityValue(getIdentityDisplayName(right));
  if (leftName && rightName && leftName === rightName) return true;

  return false;
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
    program: assignment.scheduleType || (assignment.department ? `${assignment.department} Capstone` : 'Capstone Defense'),
    deckUrl: '#',
    attendance: members.reduce<Record<string, boolean>>((record, member) => {
      record[member] = true;
      return record;
    }, {}),
    focusAreas: ['Technical execution', 'Project validation', 'Deployment readiness'],
    artifacts: [
      { label: 'Manuscript', status: 'For review' },
      { label: 'Presentation deck', status: 'For review' },
      { label: 'Panel checklist', status: 'Ready' },
      { label: 'Rating Form', status: 'Ready', url: '/Rating-Form.docx' }
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
    let cancelled = false;

    async function loadInitialDefenseData() {
      setIsLoading(true);

      const [userResult, advisersResult, schedulesResult] = await Promise.allSettled([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/advisers?limit=100', { cache: 'no-store' }),
        fetch('/api/defense-schedules?limit=50&projectLimit=100', { cache: 'no-store' })
      ]);

      if (cancelled) {
        return;
      }

      let loadedUser = false;

      if (userResult.status === 'fulfilled' && userResult.value.ok) {
        const payload = (await userResult.value.json().catch(() => null)) as { user?: CurrentUser; data?: { user?: CurrentUser } } | null;
        const user = payload?.user ?? payload?.data?.user;
        if (user && getIdentityDisplayName(user)) {
          setCurrentUser(user);
          loadedUser = true;
        }
      }

      if (!loadedUser) {
        const { getStoredUser } = await import('@/lib/mock/auth');
        if (!cancelled) {
          const stored = getStoredUser() as CurrentUser | null;
          if (stored && getIdentityDisplayName(stored)) {
            setCurrentUser(stored);
          }
        }
      }

      if (advisersResult.status === 'fulfilled' && advisersResult.value.ok) {
        const payload = (await advisersResult.value.json().catch(() => null)) as {
          advisers?: AdviserIdentity[];
          panelists?: AdviserIdentity[];
          data?: { advisers?: AdviserIdentity[]; panelists?: AdviserIdentity[] };
        } | null;
        const fetchedPanelists = payload?.panelists ?? payload?.advisers ?? payload?.data?.panelists ?? payload?.data?.advisers ?? [];
        if (fetchedPanelists.length) {
          setAdvisers(fetchedPanelists);
        }
      }

      if (schedulesResult.status === 'fulfilled' && schedulesResult.value.ok) {
        const payload = (await schedulesResult.value.json().catch(() => null)) as { assignments?: DefenseAssignment[] } | null;
        setDefenseAssignments(payload?.assignments ?? []);
      }

      setIsLoading(false);
    }

    void loadInitialDefenseData().catch(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const defenseSchedule = useMemo<LiveDefenseScheduleItem[]>(() => {
    let schedules = defenseAssignments.map(toAssignedScheduleItem);

    if (currentUser) {
      const role = normalizeIdentityValue(currentUser.role);
      const isProgramHeadOrAdmin = ['program_head', 'admin', 'system_admin'].includes(role);

      if (!isProgramHeadOrAdmin) {
        schedules = schedules.filter((schedule) => {
          const isPanelist = schedule.assignedPanelists?.some((p) => isSameIdentity(p, currentUser));
          const isAdviser = schedule.adviser.toLowerCase() === getIdentityDisplayName(currentUser).toLowerCase();
          return isPanelist || isAdviser;
        });
      }
    }

    return schedules;
  }, [defenseAssignments, currentUser]);

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
      
      if (storedSnapshot.scores) setScores(storedSnapshot.scores);
      if (storedSnapshot.individualScores) setIndividualScores(storedSnapshot.individualScores);
      if (storedSnapshot.panelistVotes) setPanelistVotes(storedSnapshot.panelistVotes);
    } else {
      setAttendance(group.attendance);
      setEvaluationNeeds(buildDefaultEvaluationNeeds(group.focusAreas));
      setSessionDuration(DEFAULT_TOTAL_TIME);
      setTimer(DEFAULT_TOTAL_TIME);
      setTimerActive(false);
      setSessionStarted(false);
      resetScoringState();
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
      
      if (snapshot.scores) setScores(snapshot.scores);
      if (snapshot.individualScores) setIndividualScores(snapshot.individualScores);
      if (snapshot.panelistVotes) setPanelistVotes(snapshot.panelistVotes);
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
    if (loadedSessionGroupId !== group.id) return;

    const snapshot: LiveDefenseSessionSnapshot = {
      sessionStarted,
      evaluationNeeds,
      attendance,
      sessionDuration,
      scores,
      individualScores,
      panelistVotes,
      updatedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(getLiveDefenseStorageKey(group.id), JSON.stringify(snapshot));
      window.dispatchEvent(new CustomEvent('liveDefenseSessionUpdated', { detail: { groupId: group.id, snapshot } }));
    } catch {}
  }, [attendance, evaluationNeeds, group.id, loadedSessionGroupId, sessionDuration, sessionStarted, scores, individualScores, panelistVotes]);

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

  async function handleSubmitScore() {
    setSubmitted(true);
    setTimerActive(false);

    try {
      const currentPanelistName = panelists.find((p) => p.isMe)?.name ?? '';
      const vote = panelistVotes[currentPanelistName];

      await fetch(`/api/defense-schedules/${group.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores,
          individualScores,
          notes,
          feedback,
          vote,
          isChairSubmit: isChair
        })
      });
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
    }
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

  if (defenseSchedule.length === 0) {
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
      className={`relative flex w-full flex-col font-sans text-slate-900 ${sessionStarted ? 'h-[calc(100vh-4rem)] overflow-hidden' : 'min-h-[calc(100vh-4rem)] overflow-x-hidden'}`}
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
        adviser={group.adviser}
      />

      <div className="flex flex-1 flex-col min-h-0">
        <main className="flex-1 flex flex-col min-h-0 bg-transparent">
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
            <div className="min-h-full p-4 sm:p-8 relative bg-[#f8fbff]">
              {/* Background Ambient Glows */}
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
              
              <div className="flex flex-col min-h-full w-full gap-6 relative z-10">
                <section className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-[0_20px_60px_rgba(15,43,89,0.08)]">
                  <div className="border-b border-white/20 bg-[#003a8f] p-6 sm:p-10 text-white relative overflow-hidden group">
                    {/* Deep Premium Gradients & Glows */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#003a8f] via-[#082a67] to-[#041533] z-0 opacity-95" />
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 blur-[60px] pointer-events-none mix-blend-screen transition-opacity duration-700 group-hover:opacity-100" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#f6be00]/10 blur-[50px] pointer-events-none mix-blend-screen" />
                    
                    {/* Animated Grid Pattern */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIHN0cm9rZS13aWR0aD0iMSIgLz4KPC9zdmc+')] opacity-40 z-0 mask-image:linear-gradient(to_bottom,white,transparent)" />

                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl transform transition-transform duration-500 hover:translate-x-1">
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.15em] text-white backdrop-blur-md shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f6be00] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f6be00] shadow-[0_0_10px_rgba(246,190,0,0.8)]"></span>
                          </span>
                          Chair Ready Room
                        </div>
                        <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tight text-white leading-tight drop-shadow-sm">
                          {group.title}
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-3 text-[0.75rem] font-bold text-blue-50 uppercase tracking-wider">
                          <span className="group/badge inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-md">
                            <i className="fas fa-users text-[#f6be00] transition-transform group-hover/badge:scale-110" />
                            {group.group}
                          </span>
                          <span className="group/badge inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-md">
                            <i className="fas fa-user-tie text-[#f6be00] transition-transform group-hover/badge:scale-110" />
                            {group.adviser}
                          </span>
                          <span className="group/badge inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-md">
                            <i className="fas fa-location-dot text-[#f6be00] transition-transform group-hover/badge:scale-110" />
                            {group.room}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full rounded-[1.5rem] border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-[0_20px_40px_rgba(0,58,143,0.3)] lg:min-w-[400px] xl:w-[440px] transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.15]">
                        <div className="mb-6 flex items-start justify-between">
                          <div>
                            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-200/80">System Readiness</p>
                            <div className="mt-2 flex items-baseline gap-2">
                              <p className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                                {readyItemCount}
                              </p>
                              <span className="text-blue-200/50 font-bold text-lg">/ {readinessItems.length} checks</span>
                            </div>
                          </div>
                          <span className={`flex items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all duration-300 ${readyItemCount === readinessItems.length ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {readyItemCount === readinessItems.length && <i className="fas fa-check-circle text-emerald-400" />}
                            {readyItemCount === readinessItems.length ? 'All Systems Go' : 'Pending Action'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {readinessItems.map((item, i) => (
                            <div 
                              key={item.id} 
                              className="group/item flex items-center gap-3.5 rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-3.5 transition-all duration-300 hover:bg-white/10 hover:border-white/30"
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] border transition-all duration-300 ${item.ready ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 group-hover/item:text-emerald-200' : 'bg-white/5 border-white/20 text-blue-100/60 group-hover/item:text-blue-100'}`}>
                                <i className={`fas ${item.ready ? 'fa-check' : item.icon} text-[13px] relative z-10 ${item.ready ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''} transition-transform`} />
                              </span>
                              <span className={`min-w-0 text-[0.7rem] font-black uppercase tracking-widest leading-tight transition-colors ${item.ready ? 'text-white' : 'text-blue-100/70 group-hover/item:text-white'}`}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.9fr)] bg-white/40 flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-blue-50 text-[#003a8f] shadow-inner">
                            <i className="fas fa-file-signature text-lg" />
                          </div>
                          <div>
                            <h3 className="text-[0.75rem] font-black uppercase tracking-[0.15em] text-[#102033]">Rating Form Setup</h3>
                            <p className="mt-0.5 text-[0.8rem] font-medium text-[#536982]">
                              {isChair ? 'Configure the interactive rating form that will be distributed to all panelists.' : 'The panel chair is configuring the rating form.'}
                            </p>
                          </div>
                        </div>
                        {isChair && (
                          <button
                            type="button"
                            onClick={addEvaluationNeed}
                            className="group inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white px-4 py-2 text-[0.75rem] font-black text-[#003a8f] shadow-[0_2px_10px_rgba(0,58,143,0.06)] transition-all duration-300 hover:border-[#003a8f]/30 hover:bg-blue-50/50 hover:shadow-[0_8px_25px_rgba(0,58,143,0.12)] hover:-translate-y-0.5"
                          >
                            <i className="fas fa-plus text-blue-400 transition-transform group-hover:rotate-90" />
                            Add Custom Field
                          </button>
                        )}
                      </div>
                      
                      <div className="mb-4 rounded-[1rem] bg-blue-50/50 p-4 border border-blue-100 flex gap-3">
                        <i className="fas fa-info-circle text-[#003a8f] mt-0.5" />
                        <p className="text-[0.8rem] text-blue-900 leading-relaxed font-medium">
                          Once the session starts, this rating form will automatically distribute to all panelists' workspaces. They can fill out their scores interactively (similar to Google Docs), and the system will compile them into a downloadable/printable grading sheet at the end.
                        </p>
                      </div>

                      <div className="space-y-4 flex-1">
                        {evaluationNeeds.map((need, index) => (
                          <div key={`evaluation-need-${index}`} className="group relative overflow-hidden rounded-[1.5rem] border border-white bg-white/80 backdrop-blur-xl p-5 shadow-[0_8px_30px_rgba(15,43,89,0.04)] transition-all duration-500 hover:border-blue-200/60 hover:shadow-[0_15px_40px_rgba(0,58,143,0.08)]">
                            <span className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-[#003a8f] via-[#1a5cc7] to-blue-400 opacity-80 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="mb-4 flex items-center justify-between">
                              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50/80 border border-blue-100/50 px-3.5 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#003a8f] shadow-sm">
                                <i className="fas fa-cube opacity-70" />
                                Custom Criteria {index + 1}
                              </span>
                              
                              {isChair && (
                                <button
                                  type="button"
                                  onClick={() => removeEvaluationNeed(index)}
                                  disabled={evaluationNeeds.length <= 1}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-rose-400 transition-all hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                  aria-label="Remove criteria"
                                >
                                  <i className="fas fa-times" />
                                </button>
                              )}
                            </div>
                            
                            {isChair ? (
                              <textarea
                                value={need}
                                onChange={(event) => updateEvaluationNeed(index, event.target.value)}
                                placeholder="Enter specific criteria, rubric instructions, or key focus areas..."
                                className="min-h-[100px] w-full resize-none rounded-[1rem] border-0 bg-slate-50/50 p-4 text-[0.95rem] font-medium leading-relaxed text-[#102033] shadow-inner transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003a8f]/20 focus:outline-none"
                              />
                            ) : (
                              <p className="min-w-0 text-[0.95rem] font-medium leading-relaxed text-[#102033] p-2">{need || 'No custom criteria set yet.'}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {!evaluationSetupReady && (
                        <p className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 shadow-sm flex items-center gap-3">
                          <i className="fas fa-triangle-exclamation text-base" />
                          Please define the rating form criteria before starting the defense.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-6">
                      <div className="group/packet rounded-[1.5rem] border border-white/80 bg-white/60 backdrop-blur-xl p-7 shadow-[0_8px_30px_rgba(15,43,89,0.04)] transition-all duration-500 hover:bg-white/80 hover:shadow-[0_15px_40px_rgba(15,43,89,0.08)]">
                        <div className="flex items-center justify-between gap-3 mb-6">
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-indigo-50 text-indigo-500 transition-transform duration-500 group-hover/packet:scale-110 group-hover/packet:rotate-3">
                              <i className="fas fa-folder-open" />
                            </div>
                            <div>
                              <h3 className="text-[0.75rem] font-black uppercase tracking-[0.15em] text-[#102033]">Defense Packet</h3>
                              <p className="mt-0.5 text-xs font-semibold text-[#536982]">{packetReadyCount}/{group.artifacts.length} items ready</p>
                            </div>
                          </div>
                          <span className={`rounded-full px-3.5 py-1.5 text-[0.65rem] font-black uppercase tracking-wider shadow-sm transition-colors ${packetIssueCount ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                            {packetIssueCount ? `${packetIssueCount} Open Items` : 'Complete'}
                          </span>
                        </div>
                        
                        <div className="space-y-3.5">
                          {group.artifacts.map((artifact) => {
                            const innerContent = (
                              <div className="group/item flex items-center justify-between gap-3 rounded-[1rem] border border-white bg-white/50 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-blue-200/60 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,43,89,0.06)]">
                                <span className="flex min-w-0 items-center gap-3.5 text-sm font-bold text-[#102033]">
                                  <span className={`flex w-8 h-8 items-center justify-center rounded-[0.75rem] transition-colors duration-300 ${artifact.status === 'Ready' ? 'bg-emerald-50 text-emerald-600 group-hover/item:bg-emerald-100' : artifact.status === 'Missing' ? 'bg-rose-50 text-rose-600 group-hover/item:bg-rose-100' : 'bg-amber-50 text-amber-600 group-hover/item:bg-amber-100'}`}>
                                    {artifact.url ? <i className="fas fa-file-arrow-down text-xs" /> : <i className={`fas ${artifact.status === 'Ready' ? 'fa-check' : artifact.status === 'Missing' ? 'fa-triangle-exclamation' : 'fa-clock'} text-xs`} />}
                                  </span>
                                  <span className="min-w-0 text-[0.85rem] leading-tight break-words">{artifact.label}</span>
                                </span>
                                <span className={`rounded-lg border px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-widest ${artifactTone(artifact.status)}`}>
                                  {artifact.status}
                                </span>
                              </div>
                            );
                            
                            return artifact.url ? (
                              <a key={artifact.label} href={artifact.url} target="_blank" rel="noopener noreferrer" className="block outline-none" download>
                                {innerContent}
                              </a>
                            ) : (
                              <div key={artifact.label}>
                                {innerContent}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-blue-100/50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-[#f2f7ff] to-white p-7 shadow-[inset_0_2px_20px_rgba(255,255,255,1)] relative overflow-hidden group/flow">
                        <div className="absolute -right-8 -bottom-8 text-[8rem] text-[#003a8f]/[0.03] transition-transform duration-700 group-hover/flow:scale-110 group-hover/flow:-rotate-6 pointer-events-none">
                          <i className="fas fa-route" />
                        </div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="h-6 w-1.5 rounded-full bg-[#003a8f]" />
                          <p className="text-[0.75rem] font-black uppercase tracking-[0.15em] text-[#003a8f]">Panel Flow Preview</p>
                        </div>
                        <div className="grid gap-3.5 text-[0.8rem] font-bold text-[#102033] relative z-10">
                          <div className="flex items-center gap-3.5 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-white shadow-sm transition-transform hover:translate-x-1">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.6rem] bg-[#003a8f] text-white shadow-sm font-black">1</span>
                            Confirm roll call
                          </div>
                          <div className="flex items-center gap-3.5 bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/50 transition-transform hover:translate-x-1">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.6rem] bg-white text-blue-400 shadow-sm font-black">2</span>
                            Use chair questions during Q&A
                          </div>
                          <div className="flex items-center gap-3.5 bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/50 transition-transform hover:translate-x-1">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.6rem] bg-white text-blue-400 shadow-sm font-black">3</span>
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
            <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-3 relative z-10">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white shadow-[0_10px_40px_rgba(15,43,89,0.06)]">
                <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-slate-900 text-white shadow-sm">
                      <i className="fas fa-desktop text-sm" />
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#003a8f] flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Session Active
                      </p>
                      <h2 className="mt-0.5 truncate text-base font-black text-[#102033] tracking-tight">{group.title}</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFocusMode(!focusMode)}
                      className={`flex items-center justify-center h-9 w-9 rounded-lg border transition-all duration-300 ${
                        focusMode ? 'border-[#003a8f] bg-[#003a8f] text-white shadow-sm' : 'border-slate-200 bg-white text-[#536982] hover:border-blue-200 hover:text-[#003a8f]'
                      }`}
                      title="Focus Mode"
                    >
                      <i className={`fas ${focusMode ? 'fa-compress' : 'fa-expand'}`} />
                    </button>

                    {isChair && (
                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100/80 rounded-lg p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setTimerActive(!timerActive)}
                            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.7rem] font-black transition-all ${
                              timerActive ? 'bg-amber-100 text-amber-800' : 'bg-white text-[#003a8f] shadow-sm'
                            }`}
                          >
                            <i className={`fas ${timerActive ? 'fa-pause' : 'fa-play'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={addFiveMinutes}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.7rem] font-black text-[#536982] hover:text-[#003a8f]"
                            title="Add 5 Minutes"
                          >
                            <i className="fas fa-plus" /> 5m
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTimer(sessionDuration);
                              setTimerActive(false);
                            }}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.7rem] font-black text-[#536982] hover:text-rose-600"
                            title="Reset Timer"
                          >
                            <i className="fas fa-rotate-left" />
                          </button>
                        </div>

                        {canNext ? (
                          <button
                            type="button"
                            onClick={nextGroup}
                            disabled={!submitted || Object.keys(panelistVotes).length < panelists.length}
                            className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#003a8f] to-[#082a67] px-4 py-2 text-[0.75rem] font-black text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="hidden sm:inline">{!submitted ? 'Wait for Subs...' : Object.keys(panelistVotes).length < panelists.length ? 'Pending Votes' : 'Next Group'}</span>
                            <i className="fas fa-arrow-right transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ) : (
                          <Link
                            href="/adviser/panel-mode/dashboard"
                            onClick={clearAllSessionSnapshots}
                            className={`group flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[0.75rem] font-black text-white shadow-sm transition-all hover:bg-emerald-700 ${!submitted || Object.keys(panelistVotes).length < panelists.length ? 'pointer-events-none opacity-50' : ''}`}
                          >
                            <span className="hidden sm:inline">{submitted ? 'Complete Session' : 'Wait for Subs...'}</span>
                            <i className="fas fa-check" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 relative flex flex-col xl:flex-row bg-slate-50 overflow-hidden">
                  {sessionStarted ? (
                    <>
                      {/* Left Side: Presentation & Context Pane */}
                      <div className="flex-1 flex flex-col relative min-w-0 border-b xl:border-b-0 xl:border-r border-slate-200 bg-gradient-to-br from-[#f8fbff] to-slate-50">
                        {deckAvailable && group.deckUrl !== '#' ? (
                          <div className="flex-1 flex flex-col">
                            <iframe src={group.deckUrl} className="w-full flex-1 border-0 bg-white shadow-sm" title="Presentation Deck" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center relative overflow-hidden group bg-gradient-to-br from-slate-50 to-[#f0f5ff]">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,58,143,0.05),transparent_70%)] pointer-events-none" />
                            
                            {/* Animated Background Elements */}
                            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#003a8f]/5 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#f6be00]/5 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />

                            <div className="relative">
                              <div className="absolute -inset-4 bg-white/40 blur-xl rounded-full" />
                              <div className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-white border border-blue-100/60 shadow-[0_10px_40px_rgba(0,58,143,0.08)] text-5xl text-[#003a8f]/30 mb-8 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_20px_50px_rgba(0,58,143,0.12)]">
                                <i className="fas fa-file-powerpoint bg-gradient-to-br from-[#003a8f]/40 to-[#003a8f]/10 bg-clip-text text-transparent" />
                                <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border-2 border-white shadow-sm">
                                  <i className="fas fa-exclamation text-sm" />
                                </div>
                              </div>
                            </div>
                            <h3 className="text-[1.5rem] font-black text-[#102033] tracking-tight drop-shadow-sm">Awaiting Presentation Deck</h3>
                            <p className="mt-4 max-w-md text-[0.95rem] font-medium text-[#536982] leading-relaxed">
                              This group has not linked an interactive presentation. Please refer to their <span className="font-bold text-[#003a8f]">Defense Packet</span> below for the submitted manuscript and materials.
                            </p>
                          </div>
                        )}

                        {/* Unified Context Bottom Bar */}
                        <div className="shrink-0 relative border-t border-white/20 p-5 lg:p-6 flex flex-col xl:flex-row gap-8 bg-white shadow-[0_-10px_40px_rgba(0,58,143,0.04)] z-20">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#003a8f]/10 to-transparent" />
                          
                          {/* Evaluation Questions */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded border border-blue-100 bg-blue-50 text-[#003a8f]"><i className="fas fa-clipboard-question text-[10px]" /></span>
                              Panel Focus Areas
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              {activeEvaluationNeeds.map((need, index) => (
                                <div key={`need-${index}`} className="group/need flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-slate-50/50 pl-2 pr-4 py-2 text-[0.8rem] font-bold text-[#102033] transition-all hover:bg-white hover:border-blue-200 hover:shadow-sm">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#003a8f] shadow-sm font-black group-hover/need:bg-[#003a8f] group-hover/need:text-white group-hover/need:border-[#003a8f] transition-colors">
                                    {index + 1}
                                  </span>
                                  <span className="truncate">{need}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Defense Packet */}
                          <div className="flex-1 min-w-0 xl:border-l border-slate-200/60 xl:pl-8">
                            <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded border border-amber-100 bg-amber-50 text-amber-600"><i className="fas fa-folder-open text-[10px]" /></span>
                              Defense Packet
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              {group.artifacts.map((artifact) => {
                                const isReady = artifact.status === 'Ready';
                                const content = (
                                  <div className={`group/artifact flex items-center gap-3 rounded-xl border px-3 py-2 transition-all ${isReady ? 'bg-white border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#003a8f]/30 hover:shadow-[0_4px_15px_rgba(0,58,143,0.08)] hover:-translate-y-0.5' : 'bg-slate-50/50 border-slate-100 opacity-60 grayscale'}`}>
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isReady ? 'bg-blue-50 text-[#003a8f] group-hover/artifact:bg-[#003a8f] group-hover/artifact:text-white' : 'bg-slate-200 text-slate-400'} transition-colors`}>
                                      <i className={`fas ${isReady ? 'fa-file-pdf' : 'fa-file-circle-xmark'} text-xs`} />
                                    </div>
                                    <span className="text-[0.8rem] font-black text-[#102033] tracking-tight">{artifact.label}</span>
                                    {artifact.url && isReady && <i className="fas fa-download ml-2 text-[0.7rem] text-slate-300 group-hover/artifact:text-[#003a8f]" />}
                                  </div>
                                );
                                return artifact.url && isReady ? (
                                  <a key={artifact.label} href={artifact.url} target="_blank" rel="noopener noreferrer" className="block outline-none" download>
                                    {content}
                                  </a>
                                ) : (
                                  <div key={artifact.label}>{content}</div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Evaluation Panel */}
                      <div className="w-full xl:w-[480px] shrink-0 flex flex-col min-h-0 bg-slate-50">
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
                      onSubmit={handleSubmitScore}
                      isChair={isChair}
                      isMyAdvisee={group.isMyAdvisee}
                      focusMode={focusMode}
                      onNextGroup={nextGroup}
                      canGoNext={canNext}
                      panelistVotes={panelistVotes}
                      setPanelistVote={(name, vote) => setPanelistVotes((prev) => ({ ...prev, [name]: vote }))}
                      panelistNames={panelists.map((p) => p.name)}
                      currentPanelistName={panelists.find((p) => p.isMe)?.name ?? ''}
                      projectTitle={group.title}
                      groupRubric={RUBRIC}
                      individualRubric={INDIVIDUAL_RUBRIC}
                    />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full min-h-[520px] flex-col items-center justify-center text-center p-8 bg-slate-50">
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-4xl text-slate-300 shadow-[0_8px_30px_rgba(15,43,89,0.04)] mb-6">
                        <div className="absolute inset-0 rounded-[2rem] bg-[#003a8f]/5 animate-pulse" />
                        <i className="fas fa-hourglass-start relative z-10 text-slate-400" />
                      </div>
                      <h3 className="text-2xl font-black text-[#102033] tracking-tight">Session Pending</h3>
                      <p className="mt-3 text-[1rem] font-medium text-[#536982] max-w-sm leading-relaxed">
                        The live workspace will open automatically once the panel chair authorizes the start of the defense.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>


      </div>
    </div>
  );
}
