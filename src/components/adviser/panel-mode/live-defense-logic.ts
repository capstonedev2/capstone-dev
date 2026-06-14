export type DefenseArtifact = {
  label: string;
  status: 'Ready' | 'Missing' | 'For review';
  url?: string;
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
    members: ['Student roster pending'],
    leader: 'Leader pending',
    adviser: 'Prof. Alan Turing',
    room: 'Research Hall A',
    program: 'BSIT Capstone',
    deckUrl: '/mock-deck.pdf',
    attendance: { 'Student roster pending': false },
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
    members: ['Student roster pending'],
    leader: 'Leader pending',
    adviser: 'Dr. Emily Chen',
    room: 'Research Hall A',
    program: 'BSIT Capstone',
    deckUrl: '#',
    isMyAdvisee: true,
    attendance: { 'Student roster pending': false },
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
    members: ['Student roster pending'],
    leader: 'Leader pending',
    adviser: 'Prof. Grace Hopper',
    room: 'Innovation Lab 2',
    program: 'BSIT Capstone',
    deckUrl: '#',
    attendance: { 'Student roster pending': false },
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
    members: ['Student roster pending'],
    leader: 'Leader pending',
    adviser: 'Engr. John Doe',
    room: 'Innovation Lab 2',
    program: 'BSIT Capstone',
    deckUrl: '#',
    attendance: { 'Student roster pending': false },
    focusAreas: ['Sensor calibration', 'Alert reliability', 'Data retention policy'],
    artifacts: [
      { label: 'Manuscript', status: 'Ready' },
      { label: 'Hardware evidence', status: 'Ready' },
      { label: 'Deployment notes', status: 'Ready' }
    ]
  }
];

export const RUBRIC = [
  { id: 'manuscript_initial', label: 'Initial Pages', desc: 'Completeness and formatting of preliminary pages.', weight: 5, anchor: 'Project Fullblown Manuscript' },
  { id: 'manuscript_ch1', label: 'Chapter 1', desc: 'Introduction, background, objectives, and scope.', weight: 15, anchor: 'Project Fullblown Manuscript' },
  { id: 'manuscript_ch2', label: 'Chapter 2', desc: 'Review of related literature and conceptual framework.', weight: 10, anchor: 'Project Fullblown Manuscript' },
  { id: 'manuscript_ch3', label: 'Chapter 3', desc: 'Methodology, system design, and architecture.', weight: 20, anchor: 'Project Fullblown Manuscript' },
  { id: 'manuscript_ch4', label: 'Chapter 4', desc: 'Results, discussion, and implementation details.', weight: 25, anchor: 'Project Fullblown Manuscript' },
  { id: 'manuscript_ch5', label: 'Chapter 5 & Final Pages', desc: 'Conclusion, recommendations, bibliography, and appendices.', weight: 20, anchor: 'Project Fullblown Manuscript' },
  { id: 'manuscript_mechanics', label: 'Manuscript Mechanics', desc: 'Grammar, citations, and overall formatting.', weight: 5, anchor: 'Project Fullblown Manuscript' },
  { id: 'output_objectives', label: 'Consistency with Objectives', desc: 'The output should be consistent with the objectives as defined during the proposal stage.', weight: 40, anchor: 'Project Output' },
  { id: 'output_modules', label: 'Module Delivery', desc: 'All major modules and features defined after the proposal stage are delivered.', weight: 40, anchor: 'Project Output' },
  { id: 'output_coding', label: 'Coding Style', desc: 'Code quality, maintainability, and standards.', weight: 20, anchor: 'Project Output' }
];

export const INDIVIDUAL_RUBRIC = [
  { id: 'oral_mastery', label: 'Mastery of subject matters', desc: 'Demonstrated deep understanding of the project and domain.', weight: 40, anchor: 'Oral Examination' },
  { id: 'oral_delivery', label: 'Delivery and Presentation of Idea', desc: 'Clarity, pacing, confidence, and professionalism.', weight: 40, anchor: 'Oral Examination' },
  { id: 'oral_receptiveness', label: 'Ability to answer questions', desc: 'Receptiveness to feedback and ability to defend ideas.', weight: 20, anchor: 'Oral Examination' }
];

export const MAX_SCORE = RUBRIC.reduce((a, c) => a + c.weight, 0);
export const MAX_INDIVIDUAL_SCORE = INDIVIDUAL_RUBRIC.reduce((a, c) => a + c.weight, 0);

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
