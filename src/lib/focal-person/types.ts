/**
 * Types for the Research Focal Person module: the shape of GET /api/focal-person/overview.
 *
 * A focal person is a user account with the FOCAL_PERSON role; their department is User.department.
 * Dates are ISO strings (`YYYY-MM-DD` for due dates, full ISO for timestamps).
 */

/** A department code such as "BSIT" (or the account's own text when it isn't a known program). */
export type DepartmentCode = string;

export type Semester = 'FIRST' | 'SECOND' | 'SUMMER';

export type FocalDepartment = {
  id: DepartmentCode;
  shortName: string;
  name: string;
};

export type AcademicYearSummary = {
  id: string;
  /** e.g. "2026–2027" */
  label: string;
};

export type ProjectStage = 'concept' | 'proposal' | 'development' | 'pre_final' | 'final' | 'completed';

export type DelayedGroup = {
  groupId: string;
  groupCode: string;
  projectTitle: string;
  stage: ProjectStage;
  /** The milestone that is overdue. */
  milestone: string;
  dueOn: string;
  daysOverdue: number;
  adviserName: string;
};

export type UpcomingDefense = {
  id: string;
  groupCode: string;
  projectTitle: string;
  /** The schedule's type, e.g. "Proposal Defense". */
  typeLabel: string;
  scheduledAt: string;
  venue: string;
  panelChair: string;
};

export type RecentSubmission = {
  id: string;
  groupCode: string;
  projectTitle: string;
  /** What was submitted (file or report title). */
  title: string;
  /** Milestone checkpoint it was submitted for, when known. */
  checkpoint: string | null;
  status: 'submitted' | 'under_review' | 'approved' | 'needs_revision' | 'rejected' | 'archived';
  submittedAt: string;
  submittedBy: string;
};

export type ReportRowStatus = 'on_track' | 'delayed' | 'completed';

export type DefenseResult = 'passed' | 'passed_minor' | 'passed_major' | 'redefense' | 'pending';

export type DepartmentReportRow = {
  /** Group id, or the project id for a project with no group. */
  id: string;
  groupCode: string;
  projectTitle: string;
  adviserName: string;
  stage: ProjectStage;
  status: ReportRowStatus;
  lastMilestone: string;
  defenseResult: DefenseResult;
  published: boolean;
  /** School year the project belongs to (its academic year, or the one it was started in). */
  academicYearId: string;
  semester: Semester;
  /** Student members, as listed on the group. */
  members: string[];
  /** Completed workflow checkpoints, 0–100. */
  progress: number;
  /** Latest change to the group or its project. */
  updatedAt: string;
};

export type DepartmentTotals = {
  researchGroups: number;
  activeProjects: number;
  completedProjects: number;
  /** 0–100, completed / (active + completed). */
  completionRate: number;
  delayedGroups: number;
  upcomingDefenses: number;
};

/** GET /api/focal-person/overview */
export type FocalOverview = {
  department: FocalDepartment;
  academicYear: AcademicYearSummary;
  semester: Semester;
  generatedAt: string;
  totals: DepartmentTotals;
  projectsByStage: { stage: ProjectStage; count: number }[];
  delayedGroups: DelayedGroup[];
  upcomingDefenses: UpcomingDefense[];
  recentSubmissions: RecentSubmission[];
  /** One row per research group, for the Reports page (filtered client-side). */
  rows: DepartmentReportRow[];
  /** School years that have projects, newest first (always includes the current one). */
  academicYears: AcademicYearSummary[];
};

export type DepartmentDashboard = Omit<FocalOverview, 'rows' | 'academicYears'>;

export type DepartmentReportFilters = {
  academicYearId: string;
  semester: Semester | 'ALL';
  stage: ProjectStage | 'ALL';
};

export type DepartmentReport = {
  department: FocalDepartment;
  filters: DepartmentReportFilters;
  generatedAt: string;
  summary: {
    projects: number;
    completed: number;
    delayed: number;
    published: number;
    defensesPassed: number;
  };
  rows: DepartmentReportRow[];
};

export type DefenseScheduleStatus = 'scheduled' | 'rescheduled' | 'completed' | 'cancelled';

/** GET /api/focal-person/defense-schedules (one row per defense in the department). */
export type DepartmentDefenseSchedule = {
  id: string;
  groupCode: string;
  projectTitle: string;
  /** The schedule's type, e.g. "Proposal Defense". */
  typeLabel: string;
  scheduledAt: string;
  venue: string;
  panelChair: string | null;
  panelMembers: string[];
  status: DefenseScheduleStatus;
};

/** GET /api/focal-person/notifications */
export type FocalNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
};
