export type DefenseArtifact = {
  label: string;
  status: 'Ready' | 'Missing' | 'For review';
  url?: string;
};

export type PanelistVoteStatus = 'pending' | 'yes' | 'no';

export type DefenseVotingPanelist = {
  id: string;
  name: string;
  department: string;
  role: 'Panel Chair' | 'Panel Member';
  isMe: boolean;
  voteStatus: PanelistVoteStatus;
};

export type DefenseVotingStatus = 'awaiting-vote' | 'awaiting-others' | 'passed' | 'needs-redefense' | 'tie';

export type DefenseChairDecision = 'REDEFENSE' | 'NEW_TITLE';

export type DefenseVotingRecord = {
  id: string;
  projectId: string;
  projectTitle: string;
  groupCode: string;
  scheduleType: string;
  department: string;
  students: string[];
  leader: string;
  adviserName: string;
  scheduledAt: string;
  date: string;
  time: string;
  room: string;
  scheduleStatus: 'SCHEDULED' | 'COMPLETED';
  isChair: boolean;
  isMyAdvisee: boolean;
  myVote: PanelistVoteStatus;
  panelists: DefenseVotingPanelist[];
  artifacts: DefenseArtifact[];
  votingStatus: DefenseVotingStatus;
  chairDecision: DefenseChairDecision | null;
  chairDecisionAt: string | null;
  chairDecisionRemarks: string | null;
};

export const DEFAULT_ARTIFACTS: DefenseArtifact[] = [
  { label: 'Manuscript', status: 'For review' },
  { label: 'Presentation deck', status: 'For review' },
  { label: 'Panel checklist', status: 'Ready' }
];

// -- Identity helpers -------------------------------------------------------

export type UserIdentity = {
  id?: string;
  email?: string;
  name?: string;
  displayName?: string | null;
  department?: string | null;
  role?: string | null;
};

export type PanelistIdentity = UserIdentity & {
  panelRole?: 'CHAIR' | 'MEMBER';
  recommendation?: string;
  submittedAt?: string | null;
};

export type DefenseAssignment = {
  id: string;
  projectId: string;
  groupCode: string;
  groupTitle?: string;
  projectTitle: string;
  scheduleType?: string;
  department?: string;
  students?: string[];
  leader?: string;
  adviserName?: string;
  scheduledAt: string;
  date: string;
  time: string;
  room: string;
  status: 'SCHEDULED' | 'COMPLETED';
  panelists: PanelistIdentity[];
  chairDecision?: DefenseChairDecision | null;
  chairDecisionAt?: string | null;
  chairDecisionRemarks?: string | null;
};

export function normalizeIdentityValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() || '';
}

export function getIdentityDisplayName(user: UserIdentity | null | undefined) {
  return user?.displayName?.trim() || user?.name?.trim() || user?.email?.trim() || '';
}

export function isSameIdentity(left: UserIdentity | null | undefined, right: UserIdentity | null | undefined) {
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

function toVoteStatus(recommendation: string | undefined): PanelistVoteStatus {
  if (!recommendation) return 'pending';
  if (['PASSED', 'PASSED_MINOR', 'PASSED_MAJOR'].includes(recommendation)) return 'yes';
  if (['REDEFENSE', 'FAILED'].includes(recommendation)) return 'no';
  return 'pending';
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

export function artifactTone(status: DefenseArtifact['status']) {
  if (status === 'Ready') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Missing') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function deriveVotingStatus(myVote: PanelistVoteStatus, panelists: DefenseVotingPanelist[]): DefenseVotingStatus {
  if (myVote === 'pending') return 'awaiting-vote';

  const allVoted = panelists.every((panelist) => panelist.voteStatus !== 'pending');
  if (!allVoted) return 'awaiting-others';

  const yesCount = panelists.filter((panelist) => panelist.voteStatus === 'yes').length;
  const noCount = panelists.filter((panelist) => panelist.voteStatus === 'no').length;
  if (yesCount > noCount) return 'passed';
  if (noCount > yesCount) return 'needs-redefense';
  return 'tie';
}

export function buildDefenseVotingRecord(
  assignment: DefenseAssignment,
  currentUser: UserIdentity | null
): DefenseVotingRecord {
  const students = assignment.students?.length ? assignment.students : ['Student roster pending'];
  const leader = assignment.leader || students[0] || 'Leader pending';

  const chairIdentity = assignment.panelists.find((panelist) => panelist.panelRole === 'CHAIR') ?? null;
  const orderedPanelists = chairIdentity
    ? [chairIdentity, ...assignment.panelists.filter((panelist) => !isSameIdentity(panelist, chairIdentity))]
    : assignment.panelists;

  const panelists: DefenseVotingPanelist[] = orderedPanelists.map((panelist, index) => ({
    id: panelist.id || panelist.email || `p${index}`,
    name: getIdentityDisplayName(panelist),
    department: panelist.department || '',
    role: panelist.panelRole === 'CHAIR' ? 'Panel Chair' : 'Panel Member',
    isMe: isSameIdentity(currentUser, panelist),
    voteStatus: toVoteStatus(panelist.recommendation)
  }));

  const isChair = Boolean(currentUser && chairIdentity && isSameIdentity(currentUser, chairIdentity));
  const isMyAdvisee = Boolean(
    currentUser &&
      assignment.adviserName &&
      normalizeIdentityValue(assignment.adviserName) === normalizeIdentityValue(getIdentityDisplayName(currentUser))
  );
  const myVote = panelists.find((panelist) => panelist.isMe)?.voteStatus ?? 'pending';

  return {
    id: assignment.id,
    projectId: assignment.projectId,
    projectTitle: assignment.projectTitle,
    groupCode: assignment.groupCode || assignment.groupTitle || 'Assigned Defense',
    scheduleType: assignment.scheduleType || 'Capstone Defense',
    department: assignment.department || '',
    students,
    leader,
    adviserName: assignment.adviserName || 'Adviser pending',
    scheduledAt: assignment.scheduledAt,
    date: assignment.date,
    time: assignment.time,
    room: assignment.room || 'Room pending',
    scheduleStatus: assignment.status,
    isChair,
    isMyAdvisee,
    myVote,
    panelists,
    artifacts: DEFAULT_ARTIFACTS,
    votingStatus: deriveVotingStatus(myVote, panelists),
    chairDecision: assignment.chairDecision ?? null,
    chairDecisionAt: assignment.chairDecisionAt ?? null,
    chairDecisionRemarks: assignment.chairDecisionRemarks ?? null
  };
}

// -- Display helpers ---------------------------------------------------------

export type DefenseVotingStatusFilter = 'all' | 'awaiting-vote' | 'awaiting-others' | 'decided';

export const DEFENSE_VOTING_STATUS_FILTER_OPTIONS: Array<{ value: DefenseVotingStatusFilter; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'awaiting-vote', label: 'Awaiting My Vote' },
  { value: 'awaiting-others', label: 'Awaiting Other Panelists' },
  { value: 'decided', label: 'Decided' }
];

const votingStatusMeta: Record<
  DefenseVotingStatus,
  { label: string; badgeClassName: string; icon: string }
> = {
  'awaiting-vote': {
    label: 'Awaiting Your Vote',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    icon: 'fa-hourglass-half'
  },
  'awaiting-others': {
    label: 'Awaiting Other Panelists',
    badgeClassName: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    icon: 'fa-user-clock'
  },
  passed: {
    label: 'Passed',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    icon: 'fa-circle-check'
  },
  'needs-redefense': {
    label: 'Needs Re-Defense',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    icon: 'fa-rotate-left'
  },
  tie: {
    label: 'Tie — Chair Decides',
    badgeClassName: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200',
    icon: 'fa-scale-balanced'
  }
};

export function getVotingStatusMeta(status: DefenseVotingStatus) {
  return votingStatusMeta[status];
}

export function matchesVotingStatusFilter(record: DefenseVotingRecord, filter: DefenseVotingStatusFilter) {
  if (filter === 'all') return true;
  if (filter === 'awaiting-vote') return record.votingStatus === 'awaiting-vote';
  if (filter === 'awaiting-others') return record.votingStatus === 'awaiting-others';
  return ['passed', 'needs-redefense', 'tie'].includes(record.votingStatus);
}

export function formatScheduleDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}
