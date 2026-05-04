export type DefenseArtifact = {
  label: string;
  status: 'Ready' | 'Missing' | 'For review';
};

export type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  group: string;
  status: string;
  members: string[];
  leader: string;
  adviser: string;
  room: string;
  program: string;
  deckUrl: string;
  attendance: Record<string, boolean>;
  isMyAdvisee?: boolean;
  focusAreas: string[];
  artifacts: DefenseArtifact[];
};

export const MOCK_SCHEDULE: ScheduleItem[] = [
  {
    id: '1',
    time: '09:00 AM',
    title: 'AI-Powered Campus Navigation',
    group: 'BSIT-4A-01',
    status: 'presenting',
    members: ['Alex Santos', 'Maria Reyes', 'John Cruz'],
    leader: 'Alex Santos',
    adviser: 'Prof. Alan Turing',
    room: 'Research Hall A',
    program: 'BSIT Capstone',
    deckUrl: '/mock-deck.pdf',
    attendance: { 'Alex Santos': true, 'Maria Reyes': true, 'John Cruz': true },
    focusAreas: ['Route accuracy', 'Offline fallback', 'Accessibility for first-year users'],
    artifacts: [
      { label: 'Manuscript', status: 'Ready' },
      { label: 'Source repository', status: 'Ready' },
      { label: 'Deployment link', status: 'For review' }
    ]
  },
  {
    id: '2',
    time: '10:00 AM',
    title: 'Smart Parking Allocation System',
    group: 'BSIT-4A-02',
    status: 'waiting',
    members: ['Sarah Lee', 'David Kim', 'Chris Tan'],
    leader: 'Sarah Lee',
    adviser: 'Dr. Emily Chen',
    room: 'Research Hall A',
    program: 'BSIT Capstone',
    deckUrl: '#',
    isMyAdvisee: true,
    attendance: { 'Sarah Lee': true, 'David Kim': true, 'Chris Tan': false },
    focusAreas: ['Slot assignment logic', 'Peak-hour handling', 'Admin override controls'],
    artifacts: [
      { label: 'Manuscript', status: 'Ready' },
      { label: 'Source repository', status: 'For review' },
      { label: 'Presentation deck', status: 'Missing' }
    ]
  },
  {
    id: '3',
    time: '11:00 AM',
    title: 'Blockchain Credential Verification',
    group: 'BSIT-4B-01',
    status: 'waiting',
    members: ['Mark Lim', 'Anna Perez'],
    leader: 'Mark Lim',
    adviser: 'Prof. Grace Hopper',
    room: 'Innovation Lab 2',
    program: 'BSIT Capstone',
    deckUrl: '#',
    attendance: { 'Mark Lim': true, 'Anna Perez': true },
    focusAreas: ['Verification flow', 'Issuer trust model', 'Privacy boundaries'],
    artifacts: [
      { label: 'Manuscript', status: 'Ready' },
      { label: 'Prototype demo', status: 'Ready' },
      { label: 'Panel checklist', status: 'For review' }
    ]
  },
  {
    id: '4',
    time: '01:00 PM',
    title: 'IoT Greenhouse Monitor',
    group: 'BSIT-4B-02',
    status: 'waiting',
    members: ['Paul Go', 'Kevin Sy', 'Lisa Chua'],
    leader: 'Paul Go',
    adviser: 'Engr. John Doe',
    room: 'Innovation Lab 2',
    program: 'BSIT Capstone',
    deckUrl: '#',
    attendance: { 'Paul Go': true, 'Kevin Sy': true, 'Lisa Chua': true },
    focusAreas: ['Sensor calibration', 'Alert reliability', 'Data retention policy'],
    artifacts: [
      { label: 'Manuscript', status: 'Ready' },
      { label: 'Hardware evidence', status: 'Ready' },
      { label: 'Deployment notes', status: 'Ready' }
    ]
  }
];

export const RUBRIC = [
  {
    id: 'presentation',
    label: 'Presentation & Communication',
    desc: 'Clarity, confidence, pacing, and quality of visual support.',
    weight: 10,
    anchor: 'Narrative and response quality'
  },
  {
    id: 'technical',
    label: 'Technical Execution',
    desc: 'Architecture, implementation quality, testing evidence, and working demo.',
    weight: 10,
    anchor: 'Build quality and validation'
  },
  {
    id: 'innovation',
    label: 'Innovation & Impact',
    desc: 'Originality, problem fit, practical value, and feasibility of adoption.',
    weight: 10,
    anchor: 'Contribution and usefulness'
  }
];

export const MAX_SCORE = RUBRIC.reduce((a, c) => a + c.weight, 0);

export function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const m = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const s = (safeSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function timerColor(seconds: number, total: number) {
  const pct = seconds / total;
  if (pct > 0.5) return 'text-emerald-600';
  if (pct > 0.2) return 'text-amber-500';
  return 'text-red-500';
}

export function timerBg(seconds: number, total: number) {
  const pct = seconds / total;
  if (pct > 0.5) return 'bg-emerald-500';
  if (pct > 0.2) return 'bg-amber-400';
  return 'bg-red-500';
}

export function artifactTone(status: DefenseArtifact['status']) {
  if (status === 'Ready') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Missing') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

export function scoreTone(score: number, max: number) {
  const pct = score / max;
  if (score === 0) return 'text-slate-400';
  if (pct >= 0.8) return 'text-emerald-600';
  if (pct >= 0.6) return 'text-amber-600';
  return 'text-rose-600';
}
