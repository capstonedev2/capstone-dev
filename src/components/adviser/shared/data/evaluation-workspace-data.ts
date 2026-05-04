export const EVALUATION_REFERENCE_DATE = '2026-04-14T00:00:00.000Z';

export type EvaluationStatus = 'pending' | 'scheduled' | 'completed' | 'overdue';
export type EvaluationRecommendation = 'Passed' | 'With Revision' | 'Failed';
export type StudentEvaluationRecommendation = 'Excellent' | 'Satisfactory' | 'Needs Support';
export type EvaluationDateFilter = 'all' | 'today' | 'this-week' | 'upcoming' | 'past';
export type EvaluationWorkspaceMode = 'adviser' | 'panel';

export type EvaluationRubricItem = {
  id: string;
  label: string;
  maxScore: number;
  score: number;
  comment: string;
};

export type StudentEvaluationCriterion = {
  id: string;
  label: string;
  maxScore: number;
  score: number;
};

export type StudentEvaluation = {
  id: string;
  studentName: string;
  score: number | null;
  recommendation: StudentEvaluationRecommendation | null;
  comment: string;
  rubric: StudentEvaluationCriterion[];
};

export type EvaluationRecord = {
  id: string;
  projectTitle: string;
  groupId: string;
  department: string;
  students: string[];
  defenseDate: string;
  status: EvaluationStatus;
  score: number | null;
  recommendation: EvaluationRecommendation | null;
  evaluatorId: string;
  overallComments: string;
  rubric: EvaluationRubricItem[];
  studentEvaluations: StudentEvaluation[];
  submittedAt: string | null;
};

type StudentEvaluationTemplate = {
  baseScores: [number, number, number, number];
  comment: string;
};

type EvaluationRecordSeed = Omit<EvaluationRecord, 'studentEvaluations'> & {
  studentEvaluationTemplate: StudentEvaluationTemplate;
};

export const EVALUATION_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' }
] as const;

export const EVALUATION_DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past Due Dates' }
] as const;

function buildRubric(
  scores: [number, number, number, number, number],
  comments: [string, string, string, string, string]
): EvaluationRubricItem[] {
  return [
    {
      id: 'problem-relevance',
      label: 'Problem Relevance',
      maxScore: 10,
      score: scores[0],
      comment: comments[0]
    },
    {
      id: 'methodology',
      label: 'Methodology',
      maxScore: 10,
      score: scores[1],
      comment: comments[1]
    },
    {
      id: 'system-implementation',
      label: 'System Implementation',
      maxScore: 10,
      score: scores[2],
      comment: comments[2]
    },
    {
      id: 'presentation',
      label: 'Presentation',
      maxScore: 10,
      score: scores[3],
      comment: comments[3]
    },
    {
      id: 'documentation',
      label: 'Documentation',
      maxScore: 10,
      score: scores[4],
      comment: comments[4]
    }
  ];
}

function buildStudentRubric(scores: [number, number, number, number]): StudentEvaluationCriterion[] {
  return [
    {
      id: 'participation',
      label: 'Participation',
      maxScore: 5,
      score: scores[0]
    },
    {
      id: 'technical-contribution',
      label: 'Technical Contribution',
      maxScore: 5,
      score: scores[1]
    },
    {
      id: 'communication',
      label: 'Communication',
      maxScore: 5,
      score: scores[2]
    },
    {
      id: 'documentation-ownership',
      label: 'Documentation Ownership',
      maxScore: 5,
      score: scores[3]
    }
  ];
}

function clampStudentCriterionScore(value: number) {
  return Math.max(0, Math.min(5, value));
}

export function calculateEvaluationScore<T extends { score: number; maxScore: number }>(rubric: T[]) {
  const totalScore = rubric.reduce((sum, criterion) => sum + criterion.score, 0);
  const totalPossible = rubric.reduce((sum, criterion) => sum + criterion.maxScore, 0);

  if (!totalPossible) {
    return 0;
  }

  return Math.round((totalScore / totalPossible) * 100);
}

export function deriveStudentEvaluationRecommendation(score: number): StudentEvaluationRecommendation {
  if (score >= 90) {
    return 'Excellent';
  }

  if (score >= 75) {
    return 'Satisfactory';
  }

  return 'Needs Support';
}

function buildStudentEvaluations(
  students: string[],
  template: StudentEvaluationTemplate,
  isCompleted: boolean
): StudentEvaluation[] {
  return students.map((student, index) => {
    const adjustedScores = template.baseScores.map((score, criterionIndex) => {
      const positiveOffset = (index + criterionIndex) % 3 === 0 ? 1 : 0;
      const negativeOffset = index % 2 === 1 && criterionIndex === 3 ? 1 : 0;
      return clampStudentCriterionScore(score + positiveOffset - negativeOffset);
    }) as [number, number, number, number];

    const rubric = buildStudentRubric(adjustedScores);
    const score = calculateEvaluationScore(rubric);

    return {
      id: `student-${index + 1}`,
      studentName: student,
      score: isCompleted ? score : null,
      recommendation: isCompleted ? deriveStudentEvaluationRecommendation(score) : null,
      comment: template.comment,
      rubric
    };
  });
}

function toEvaluationRecord({
  studentEvaluationTemplate,
  ...record
}: EvaluationRecordSeed): EvaluationRecord {
  return {
    ...record,
    studentEvaluations: buildStudentEvaluations(
      record.students,
      studentEvaluationTemplate,
      record.status === 'completed'
    )
  };
}

const adviserEvaluationRecordSeeds: EvaluationRecordSeed[] = [
  {
    id: 'eval-adv-01',
    projectTitle: 'Smart Queue Analytics Dashboard',
    groupId: 'IT-2024-06',
    department: 'IT',
    students: ['Alyssa Mendoza', 'John Carlo Lim', 'Miguel Cruz'],
    defenseDate: '2026-04-16T09:00:00.000Z',
    status: 'scheduled',
    score: null,
    recommendation: null,
    evaluatorId: 'user-adviser-001',
    overallComments: 'Review the final results discussion and confirm the service metrics align with the project objectives.',
    rubric: buildRubric(
      [8, 8, 9, 8, 8],
      [
        'Problem framing is relevant to campus service offices.',
        'Method flow is clear but needs a tighter sampling note.',
        'Prototype implementation is stable and matches the declared scope.',
        'Presentation deck is clear with minor wording revisions.',
        'Documentation is complete but needs one final format check.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [4, 4, 4, 4],
      comment: 'Demonstrates clear ownership of the analytics workflow and responds well to follow-up questions.'
    },
    submittedAt: null
  },
  {
    id: 'eval-adv-02',
    projectTitle: 'Clinic Appointment Flow Optimizer',
    groupId: 'IT-2024-09',
    department: 'IT',
    students: ['Daniel Reyes', 'Maria Santos', 'Janelle Garcia'],
    defenseDate: '2026-04-14T13:30:00.000Z',
    status: 'pending',
    score: null,
    recommendation: null,
    evaluatorId: 'user-adviser-001',
    overallComments: 'Validate whether the revised queue forecasting model is ready for final scoring.',
    rubric: buildRubric(
      [7, 7, 8, 7, 7],
      [
        'Problem statement is practical but needs stronger local context.',
        'Method section is acceptable with minor justification gaps.',
        'System implementation covers the core booking workflow.',
        'Presentation structure is understandable but can be tighter.',
        'Document package is complete with minor formatting issues.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [3, 4, 3, 3],
      comment: 'Contribution is visible, but the defense explanation and validation notes still need to be tighter.'
    },
    submittedAt: null
  },
  {
    id: 'eval-adv-03',
    projectTitle: 'Barangay Incident Mapping and Alerting Platform',
    groupId: 'IT-2024-11',
    department: 'IT',
    students: ['Kurt Mendoza', 'Paolo Dela Cruz'],
    defenseDate: '2026-04-10T10:00:00.000Z',
    status: 'overdue',
    score: null,
    recommendation: null,
    evaluatorId: 'user-adviser-001',
    overallComments: 'The defense output is waiting for final rubric scoring and adviser recommendation.',
    rubric: buildRubric(
      [8, 8, 8, 7, 7],
      [
        'Project problem is aligned with community reporting needs.',
        'Methodology is clear but the validation narrative can improve.',
        'Core mapping and alert features are implemented well.',
        'Defense delivery needs stronger transitions between sections.',
        'Supporting documentation still needs a final proofreading pass.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [3, 3, 4, 3],
      comment: 'Needs stronger command of the implementation details before the final defense closure.'
    },
    submittedAt: null
  },
  {
    id: 'eval-adv-04',
    projectTitle: 'Student Services Help Desk Portal',
    groupId: 'IT-2024-14',
    department: 'IT',
    students: ['Mika Tan', 'Rhea Bautista', 'Sean Flores', 'Vince Navarro'],
    defenseDate: '2026-04-09T15:00:00.000Z',
    status: 'completed',
    score: 92,
    recommendation: 'Passed',
    evaluatorId: 'user-adviser-001',
    overallComments: 'Strong implementation and clear documentation. Approved for final archive preparation.',
    rubric: buildRubric(
      [9, 9, 10, 9, 9],
      [
        'The problem is clearly grounded in student support operations.',
        'Method design is justified and well-executed.',
        'Implementation is polished and covers the full help desk cycle.',
        'Presentation delivery was confident and concise.',
        'Documentation package is complete and well organized.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [4, 5, 4, 4],
      comment: 'Delivered a strong defense contribution and supported the final documentation well.'
    },
    submittedAt: '2026-04-09T17:10:00.000Z'
  },
  {
    id: 'eval-adv-05',
    projectTitle: 'Internship Partner Matching Assistant',
    groupId: 'IT-2024-21',
    department: 'IT',
    students: ['Ivy Lopez', 'Carlo Rivera', 'Renz Castillo'],
    defenseDate: '2026-04-18T11:00:00.000Z',
    status: 'scheduled',
    score: null,
    recommendation: null,
    evaluatorId: 'user-adviser-001',
    overallComments: 'Prepare the recommendation notes and verify the final matching criteria before the scheduled defense.',
    rubric: buildRubric(
      [8, 7, 8, 8, 8],
      [
        'The problem is timely and relevant to placement coordination.',
        'Methodology is promising but still needs one clarifying note.',
        'System modules are functional and aligned with the scope.',
        'Presentation materials are organized and readable.',
        'Documentation quality is good with minor revisions pending.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [4, 4, 4, 3],
      comment: 'Shows good command of the assigned module and should keep refining the evaluation notes.'
    },
    submittedAt: null
  }
];

const panelEvaluationRecordSeeds: EvaluationRecordSeed[] = [
  {
    id: 'eval-panel-01',
    projectTitle: 'Flood Risk Decision Support Dashboard',
    groupId: 'CPE-2024-04',
    department: 'CPE',
    students: ['Ramon Castillo', 'Lisa Torres', 'Angela Yu'],
    defenseDate: '2026-04-14T09:30:00.000Z',
    status: 'pending',
    score: null,
    recommendation: null,
    evaluatorId: 'user-panel-003',
    overallComments: 'Scoring packet is ready for formal panel review.',
    rubric: buildRubric(
      [8, 8, 7, 8, 7],
      [
        'Problem statement addresses a real planning concern.',
        'Method is clear enough for panel scoring.',
        'Implementation coverage still needs validation emphasis.',
        'Presentation materials are straightforward and readable.',
        'Documentation package is nearly complete.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [4, 4, 3, 3],
      comment: 'The student contributes well but still needs stronger command of the validation details.'
    },
    submittedAt: null
  },
  {
    id: 'eval-panel-02',
    projectTitle: 'Campus Safety Tracker',
    groupId: 'IT-2024-22',
    department: 'IT',
    students: ['Joan Lopez', 'Allen Reyes'],
    defenseDate: '2026-04-16T14:00:00.000Z',
    status: 'scheduled',
    score: null,
    recommendation: null,
    evaluatorId: 'user-panel-003',
    overallComments: 'Prepare the final rubric and defense notes before the scheduled session.',
    rubric: buildRubric(
      [8, 8, 8, 8, 8],
      [
        'Project objective is relevant to campus monitoring.',
        'Methodology is sound for the proposed scope.',
        'Implementation is complete enough for evaluation.',
        'Presentation flow is balanced and easy to follow.',
        'Documentation is in good condition for scoring.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [4, 4, 4, 4],
      comment: 'The student communicates the assigned defense material clearly and handles follow-up questions well.'
    },
    submittedAt: null
  },
  {
    id: 'eval-panel-03',
    projectTitle: 'Herbal Inventory Traceability Platform',
    groupId: 'TCM-2024-03',
    department: 'TCM',
    students: ['Mila Ramos', 'Carla Perez', 'Noel Lim'],
    defenseDate: '2026-04-08T08:30:00.000Z',
    status: 'completed',
    score: 88,
    recommendation: 'With Revision',
    evaluatorId: 'user-panel-003',
    overallComments: 'The study is acceptable, but the documentation still needs refinement before final endorsement.',
    rubric: buildRubric(
      [9, 8, 8, 9, 7],
      [
        'Problem statement is relevant to inventory tracking in the program.',
        'Method is appropriate and mostly well defended.',
        'Implementation works but still needs a tighter audit trail explanation.',
        'Presentation delivery was clear and confident.',
        'Documentation is acceptable but requires final revisions.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [4, 4, 4, 3],
      comment: 'The student defended the assigned module well, with minor refinement still needed in the final manuscript notes.'
    },
    submittedAt: '2026-04-08T12:45:00.000Z'
  },
  {
    id: 'eval-panel-04',
    projectTitle: 'Marine Engine Monitoring Trainer',
    groupId: 'MET-2024-07',
    department: 'MET',
    students: ['Harvey Cruz', 'Loren Gamboa'],
    defenseDate: '2026-04-11T10:30:00.000Z',
    status: 'overdue',
    score: null,
    recommendation: null,
    evaluatorId: 'user-panel-003',
    overallComments: 'Defense already concluded. Formal panel scoring still needs to be submitted.',
    rubric: buildRubric(
      [7, 7, 8, 7, 7],
      [
        'The problem is relevant to laboratory training needs.',
        'Method structure is acceptable but needs stronger justification.',
        'Implementation has good depth for a trainer platform.',
        'Presentation was adequate but could be more polished.',
        'Documentation package is acceptable with pending edits.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [3, 4, 3, 3],
      comment: 'The student should strengthen the technical explanation and align the supporting files more closely with the defense answers.'
    },
    submittedAt: null
  },
  {
    id: 'eval-panel-05',
    projectTitle: 'Community Water Quality Monitoring App',
    groupId: 'ESM-2024-02',
    department: 'ESM',
    students: ['Nica Dizon', 'Paolo Santos', 'Jude Tan'],
    defenseDate: '2026-04-19T13:00:00.000Z',
    status: 'scheduled',
    score: null,
    recommendation: null,
    evaluatorId: 'user-panel-003',
    overallComments: 'Panel packet is complete and ready for scheduled scoring.',
    rubric: buildRubric(
      [8, 9, 8, 8, 8],
      [
        'Problem relevance is strong and socially grounded.',
        'Methodology is clearly articulated and evidence-based.',
        'Implementation covers the expected monitoring flow.',
        'Presentation plan is clear and organized.',
        'Documentation is in good shape for the defense cycle.'
      ]
    ),
    studentEvaluationTemplate: {
      baseScores: [4, 4, 4, 4],
      comment: 'The student shows solid supervision readiness and should keep the implementation evidence tightly connected to the defense narrative.'
    },
    submittedAt: null
  }
];

export const ADVISER_EVALUATION_RECORDS: EvaluationRecord[] = adviserEvaluationRecordSeeds.map(toEvaluationRecord);
export const PANEL_EVALUATION_RECORDS: EvaluationRecord[] = panelEvaluationRecordSeeds.map(toEvaluationRecord);

const evaluationStatusMeta: Record<
  EvaluationStatus,
  {
    label: string;
    badgeClassName: string;
    rowClassName: string;
    actionLabel: string;
    buttonClassName: string;
  }
> = {
  pending: {
    label: 'Pending',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    rowClassName: 'bg-white',
    actionLabel: 'Open Evaluation',
    buttonClassName:
      'border border-[rgba(0,58,143,0.14)] bg-white text-[var(--primary)] hover:bg-[rgba(0,58,143,0.04)]'
  },
  scheduled: {
    label: 'Scheduled',
    badgeClassName: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    rowClassName: 'bg-white',
    actionLabel: 'Open Evaluation',
    buttonClassName:
      'border border-[rgba(0,58,143,0.14)] bg-white text-[var(--primary)] hover:bg-[rgba(0,58,143,0.04)]'
  },
  completed: {
    label: 'Completed',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    rowClassName: 'bg-white',
    actionLabel: 'View Result',
    buttonClassName:
      'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
  },
  overdue: {
    label: 'Overdue',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    rowClassName: 'bg-rose-50/50',
    actionLabel: 'Open Evaluation',
    buttonClassName:
      'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
  }
};

const recommendationMeta: Record<
  EvaluationRecommendation,
  {
    className: string;
  }
> = {
  Passed: {
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
  },
  'With Revision': {
    className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
  },
  Failed: {
    className: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
  }
};

const studentRecommendationMeta: Record<
  StudentEvaluationRecommendation,
  {
    className: string;
  }
> = {
  Excellent: {
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
  },
  Satisfactory: {
    className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
  },
  'Needs Support': {
    className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
  }
};

const dayInMilliseconds = 1000 * 60 * 60 * 24;

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function diffInDays(left: string, right: string) {
  return Math.round((startOfUtcDay(left) - startOfUtcDay(right)) / dayInMilliseconds);
}

export function cloneEvaluationRecord(record: EvaluationRecord): EvaluationRecord {
  return {
    ...record,
    students: [...record.students],
    rubric: record.rubric.map((criterion) => ({ ...criterion })),
    studentEvaluations: record.studentEvaluations.map((studentEvaluation) => ({
      ...studentEvaluation,
      rubric: studentEvaluation.rubric.map((criterion) => ({ ...criterion }))
    }))
  };
}

export function cloneEvaluationRecords(records: EvaluationRecord[]) {
  return records.map(cloneEvaluationRecord);
}

export function getEvaluationStatusMeta(status: EvaluationStatus) {
  return evaluationStatusMeta[status];
}

export function getRecommendationMeta(recommendation: EvaluationRecommendation) {
  return recommendationMeta[recommendation];
}

export function getStudentEvaluationRecommendationMeta(recommendation: StudentEvaluationRecommendation) {
  return studentRecommendationMeta[recommendation];
}

export function formatEvaluationDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function formatEvaluationDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function getStudentPreview(students: string[], maxVisible = 2) {
  const visibleStudents = students.slice(0, maxVisible);
  const remainingCount = Math.max(0, students.length - visibleStudents.length);

  if (!visibleStudents.length) {
    return 'No students listed';
  }

  const preview = visibleStudents.join(', ');
  return remainingCount ? `${preview} +${remainingCount}` : preview;
}

export function calculateStudentEvaluationCount(record: EvaluationRecord) {
  return record.studentEvaluations.filter((studentEvaluation) => studentEvaluation.score !== null).length;
}

export function matchesEvaluationDateFilter(
  record: EvaluationRecord,
  filter: EvaluationDateFilter,
  referenceDate = EVALUATION_REFERENCE_DATE
) {
  if (filter === 'all') {
    return true;
  }

  const dayDifference = diffInDays(record.defenseDate, referenceDate);

  if (filter === 'today') {
    return dayDifference === 0;
  }

  if (filter === 'this-week') {
    return dayDifference >= 0 && dayDifference <= 7;
  }

  if (filter === 'upcoming') {
    return dayDifference > 0;
  }

  return dayDifference < 0;
}

export function getUpcomingTodayCount(
  records: EvaluationRecord[],
  referenceDate = EVALUATION_REFERENCE_DATE
) {
  return records.filter((record) => matchesEvaluationDateFilter(record, 'today', referenceDate)).length;
}

export function getNextEvaluationDeadline(
  records: EvaluationRecord[],
  referenceDate = EVALUATION_REFERENCE_DATE
) {
  return [...records]
    .filter((record) => record.status !== 'completed' && diffInDays(record.defenseDate, referenceDate) >= 0)
    .sort((left, right) => new Date(left.defenseDate).getTime() - new Date(right.defenseDate).getTime())[0] ?? null;
}

export function getTotalOpenEvaluations(records: EvaluationRecord[]) {
  return records.filter((record) => record.status !== 'completed').length;
}

export function getOverdueEvaluations(records: EvaluationRecord[]) {
  return records.filter((record) => record.status === 'overdue');
}

export function getScopeChipLabel(mode: EvaluationWorkspaceMode) {
  return mode === 'adviser' ? 'IT Department' : 'Assigned Evaluations';
}
