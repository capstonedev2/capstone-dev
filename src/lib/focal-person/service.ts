/**
 * Research Focal Person: client data service.
 *
 * A focal person is a user account with the FOCAL_PERSON role; their department is the one on
 * their account (User.department), set by the System Admin. All data comes from the server, which
 * decides the department from the session. Nothing here sends a department.
 *
 * - GET /api/focal-person/overview           → dashboard numbers + one row per research group
 * - GET /api/focal-person/defense-schedules  → every defense in the department (read-only)
 * - GET /api/focal-person/notifications      → the signed-in user's own notifications
 */

import type {
  AcademicYearSummary,
  DepartmentDashboard,
  DepartmentDefenseSchedule,
  DepartmentReport,
  DepartmentReportRow,
  DepartmentReportFilters,
  FocalDepartment,
  FocalNotification,
  FocalOverview
} from './types';

/** An API refusal, with its HTTP status (403 = not a focal person, 409 = no department set). */
export class FocalServiceError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
  const payload = (await response.json().catch(() => null)) as ({ success?: boolean; message?: string } & T) | null;

  if (!response.ok || !payload?.success) {
    throw new FocalServiceError(payload?.message || 'Could not load department data.', response.status);
  }

  return payload;
}

// The dashboard and the report filters all read the same overview; reuse one request for a short
// while so changing a report filter doesn't refetch it.
const OVERVIEW_TTL_MS = 30_000;
let overviewRequest: { at: number; promise: Promise<FocalOverview> } | null = null;

export function getFocalOverview({ fresh = false } = {}): Promise<FocalOverview> {
  if (!fresh && overviewRequest && Date.now() - overviewRequest.at < OVERVIEW_TTL_MS) {
    return overviewRequest.promise;
  }

  const promise = getJson<{ overview: FocalOverview }>('/api/focal-person/overview').then((payload) => payload.overview);
  overviewRequest = { at: Date.now(), promise };
  promise.catch(() => {
    if (overviewRequest?.promise === promise) overviewRequest = null;
  });
  return promise;
}

/** The department the signed-in focal person monitors. */
export async function getMyDepartment(): Promise<FocalDepartment> {
  return (await getFocalOverview({ fresh: true })).department;
}

export async function getDepartmentDashboard(): Promise<DepartmentDashboard> {
  const { rows: _rows, academicYears: _years, ...dashboard } = await getFocalOverview();
  return dashboard;
}

/** School years to filter the report by (years that have projects, plus the current one). */
export async function getAcademicYears(): Promise<AcademicYearSummary[]> {
  return (await getFocalOverview()).academicYears;
}

/** Report rows for the filters. The server already limited the rows to the user's department. */
export async function getDepartmentReport(filters: DepartmentReportFilters): Promise<DepartmentReport> {
  const overview = await getFocalOverview();
  const rows = overview.rows.filter(
    (row) =>
      row.academicYearId === filters.academicYearId &&
      (filters.semester === 'ALL' || row.semester === filters.semester) &&
      (filters.stage === 'ALL' || row.stage === filters.stage)
  );

  return {
    department: overview.department,
    filters,
    generatedAt: overview.generatedAt,
    summary: {
      projects: rows.length,
      completed: rows.filter((row) => row.status === 'completed').length,
      delayed: rows.filter((row) => row.status === 'delayed').length,
      published: rows.filter((row) => row.published).length,
      defensesPassed: rows.filter((row) => row.defenseResult.startsWith('passed')).length
    },
    rows
  };
}

/** Every research group in the department (the same rows the report uses). */
export async function getResearchGroups(): Promise<DepartmentReportRow[]> {
  return (await getFocalOverview()).rows;
}

/** Every defense schedule in the department, newest first. */
export async function getDefenseSchedules(): Promise<DepartmentDefenseSchedule[]> {
  return (await getJson<{ schedules: DepartmentDefenseSchedule[] }>('/api/focal-person/defense-schedules')).schedules;
}

export async function getMyNotifications(): Promise<{ unreadCount: number; notifications: FocalNotification[] }> {
  const { unreadCount, notifications } = await getJson<{ unreadCount: number; notifications: FocalNotification[] }>(
    '/api/focal-person/notifications'
  );
  return { unreadCount, notifications };
}
