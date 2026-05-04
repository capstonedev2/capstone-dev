export type TitleStatus = 'pending' | 'approved' | 'needs-revision' | 'rejected';
export type TitleSortOption = 'newest' | 'oldest' | 'highest-similarity';

export type SimilarTitleRecord = {
  id: string;
  title: string;
  similarityScore: number;
};

export type AdviserTitleRecord = {
  id: string;
  groupId: string;
  title: string;
  description: string;
  department: 'IT';
  status: TitleStatus;
  submittedAt: string;
  keywords: string[];
  similarityScore: number;
  similarTitles: SimilarTitleRecord[];
  membersCount: number;
  memberPreview: string[];
  adviserAction: string;
  academicYear: string;
};

export const TITLE_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs-revision', label: 'Needs Revision' },
  { value: 'rejected', label: 'Rejected' }
] as const;

export const TITLE_SORT_OPTIONS: Array<{ value: TitleSortOption; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest-similarity', label: 'Highest Similarity' }
];

export const IT_ADVISER_TITLES: AdviserTitleRecord[] = [
  {
    id: 'title-it-student-001',
    groupId: 'GRP-IT-2026-014',
    title: 'AI-Powered Learning Management System with Predictive Analytics',
    description:
      'A decision-support portal that helps advisers monitor at-risk students through analytics-driven alerts, consultations, and intervention records.',
    department: 'IT',
    status: 'approved',
    submittedAt: '2025-12-01T10:00:00.000Z',
    keywords: ['AI', 'Predictive Analytics', 'Student Support', 'Web Portal'],
    similarityScore: 24,
    similarTitles: [
      {
        id: 'similar-student-001',
        title: 'Student Risk Monitoring Platform with Predictive Alerts',
        similarityScore: 24
      },
      {
        id: 'similar-student-002',
        title: 'Academic Analytics Portal for Adviser Intervention Tracking',
        similarityScore: 21
      }
    ],
    membersCount: 4,
    memberPreview: ['Maria Concepcion Santos', 'Daniel Reyes', 'Alyssa Mendoza', 'John Carlo Lim'],
    adviserAction:
      'Approved and recorded as the official project title. Keep the wording aligned across project files, repository records, and defense materials.',
    academicYear: 'AY 2025-2026'
  },
  {
    id: 'title-it-01',
    groupId: 'IT-2024-06',
    title: 'Smart Queue Analytics Dashboard for Campus Service Offices',
    description:
      'A monitoring dashboard that tracks queue behavior, service bottlenecks, and peak-hour demand to improve response time across campus offices.',
    department: 'IT',
    status: 'pending',
    submittedAt: '2026-04-13T09:15:00.000Z',
    keywords: ['Queue Analytics', 'Dashboard', 'Campus Services', 'Monitoring'],
    similarityScore: 31,
    similarTitles: [
      {
        id: 'similar-001',
        title: 'Campus Service Monitoring Dashboard',
        similarityScore: 31
      }
    ],
    membersCount: 4,
    memberPreview: ['Alyssa Mendoza', 'John Carlo Lim', 'Miguel Cruz', 'Paula Ramos'],
    adviserAction: 'Validate scope wording and decide if the title is ready for official registration.',
    academicYear: 'AY 2025-2026'
  },
  {
    id: 'title-it-02',
    groupId: 'IT-2024-09',
    title: 'Clinic Appointment Flow Optimizer with Patient Queue Forecasting',
    description:
      'A capstone proposal focused on streamlining clinic booking and queue planning through usage forecasting and schedule balancing.',
    department: 'IT',
    status: 'needs-revision',
    submittedAt: '2026-04-10T13:40:00.000Z',
    keywords: ['Clinic Scheduling', 'Forecasting', 'Appointment Flow', 'Optimization'],
    similarityScore: 64,
    similarTitles: [
      {
        id: 'similar-002',
        title: 'Patient Appointment Forecasting and Queue Planner',
        similarityScore: 64
      },
      {
        id: 'similar-003',
        title: 'Clinic Booking and Queue Monitoring System',
        similarityScore: 52
      }
    ],
    membersCount: 3,
    memberPreview: ['Daniel Reyes', 'Maria Santos', 'Janelle Garcia'],
    adviserAction: 'Revise the title so the optimization scope is clearer and less similar to earlier clinic scheduling studies.',
    academicYear: 'AY 2025-2026'
  },
  {
    id: 'title-it-03',
    groupId: 'IT-2024-11',
    title: 'Barangay Incident Mapping and Alerting Platform',
    description:
      'A geospatial reporting platform that supports barangay incident logging, area-based alerts, and response visibility for local responders.',
    department: 'IT',
    status: 'approved',
    submittedAt: '2026-04-08T11:20:00.000Z',
    keywords: ['Incident Mapping', 'Alerting', 'Barangay', 'Geospatial'],
    similarityScore: 18,
    similarTitles: [
      {
        id: 'similar-004',
        title: 'Community Incident Visualization Dashboard',
        similarityScore: 18
      }
    ],
    membersCount: 2,
    memberPreview: ['Kurt Mendoza', 'Paolo Dela Cruz'],
    adviserAction: 'Approved. Keep this title consistent across the manuscript, repository record, and defense materials.',
    academicYear: 'AY 2025-2026'
  },
  {
    id: 'title-it-04',
    groupId: 'IT-2024-14',
    title: 'Student Services Help Desk Portal with Resolution Tracking',
    description:
      'A help desk platform for campus support units that records requests, tracks resolution progress, and monitors response quality.',
    department: 'IT',
    status: 'pending',
    submittedAt: '2026-04-14T08:05:00.000Z',
    keywords: ['Help Desk', 'Student Services', 'Ticketing', 'Resolution Tracking'],
    similarityScore: 27,
    similarTitles: [],
    membersCount: 4,
    memberPreview: ['Mika Tan', 'Rhea Bautista', 'Sean Flores', 'Vince Navarro'],
    adviserAction: 'Check originality and confirm the title still matches the approved service workflow.',
    academicYear: 'AY 2025-2026'
  },
  {
    id: 'title-it-05',
    groupId: 'IT-2024-18',
    title: 'Campus Wi-Fi Ticketing Insight Tool for ICT Support',
    description:
      'An internal ICT support tool that categorizes Wi-Fi issues, tracks ticket resolution, and identifies recurring network problem patterns.',
    department: 'IT',
    status: 'rejected',
    submittedAt: '2026-04-06T14:55:00.000Z',
    keywords: ['ICT Support', 'Wi-Fi Issues', 'Ticketing', 'Insights'],
    similarityScore: 82,
    similarTitles: [
      {
        id: 'similar-005',
        title: 'Wi-Fi Support Ticketing and Incident Insights Platform',
        similarityScore: 82
      },
      {
        id: 'similar-006',
        title: 'Network Support Ticket Dashboard for Campus ICT',
        similarityScore: 76
      }
    ],
    membersCount: 3,
    memberPreview: ['Lance Go', 'Jessa David', 'Nicole Ramos'],
    adviserAction: 'Rejected due to strong overlap with archived ICT support studies. Propose a more distinct scope before resubmission.',
    academicYear: 'AY 2025-2026'
  },
  {
    id: 'title-it-06',
    groupId: 'IT-2024-21',
    title: 'Internship Partner Matching Assistant for Academic Coordinators',
    description:
      'A recommendation support tool that aligns internship opportunities with student competencies and partner requirements for coordinator review.',
    department: 'IT',
    status: 'approved',
    submittedAt: '2026-04-05T10:30:00.000Z',
    keywords: ['Internship Matching', 'Recommendation Support', 'Academic Coordinators', 'Placement'],
    similarityScore: 22,
    similarTitles: [
      {
        id: 'similar-007',
        title: 'OJT Placement Recommendation System',
        similarityScore: 22
      }
    ],
    membersCount: 4,
    memberPreview: ['Ivy Lopez', 'Carlo Rivera', 'Renz Castillo', 'Patricia Ong'],
    adviserAction: 'Approved. Proceed with Chapter 1 development using the accepted title wording.',
    academicYear: 'AY 2025-2026'
  }
];

const titleStatusMeta: Record<
  TitleStatus,
  {
    label: string;
    badgeClassName: string;
    icon: string;
  }
> = {
  pending: {
    label: 'Pending',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    icon: 'fa-clock'
  },
  approved: {
    label: 'Approved',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    icon: 'fa-circle-check'
  },
  'needs-revision': {
    label: 'Needs Revision',
    badgeClassName: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    icon: 'fa-rotate-left'
  },
  rejected: {
    label: 'Rejected',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    icon: 'fa-ban'
  }
};

export function getTitleStatusMeta(status: TitleStatus) {
  return titleStatusMeta[status];
}

export function formatTitleDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function formatMemberPreview(members: string[], maxVisible = 2) {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - visibleMembers.length);

  if (!visibleMembers.length) {
    return 'No members listed';
  }

  const preview = visibleMembers.join(', ');
  return remainingCount ? `${preview} +${remainingCount}` : preview;
}

export function getAcademicYearOptions(records: AdviserTitleRecord[]) {
  return Array.from(new Set(records.map((record) => record.academicYear)));
}

export function sortTitleRecords(records: AdviserTitleRecord[], sortBy: TitleSortOption) {
  return [...records].sort((left, right) => {
    if (sortBy === 'oldest') {
      return new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime();
    }

    if (sortBy === 'highest-similarity') {
      return right.similarityScore - left.similarityScore;
    }

    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  });
}

export function getSimilarityMeta(score: number, similarTitles: SimilarTitleRecord[]) {
  if (score >= 75 || similarTitles.length >= 2) {
    return {
      label: 'Similar Titles Found',
      toneClass: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
      helperClass: 'text-rose-600'
    };
  }

  if (score >= 45) {
    return {
      label: 'Needs Validation',
      toneClass: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
      helperClass: 'text-amber-600'
    };
  }

  return {
    label: 'Similarity Cleared',
    toneClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    helperClass: 'text-emerald-600'
  };
}

export function getDefaultActionForStatus(status: TitleStatus) {
  if (status === 'approved') {
    return 'Approved. Proceed with official title registration and align the title across all project records.';
  }

  if (status === 'needs-revision') {
    return 'Revise the title wording, improve scope clarity, and resubmit for adviser validation.';
  }

  if (status === 'rejected') {
    return 'Rejected. Submit a more original and scope-aligned title before the next adviser review cycle.';
  }

  return 'Pending adviser review for originality, scope fit, and academic clarity.';
}
