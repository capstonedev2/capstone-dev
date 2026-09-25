/**
 * MOCK DATA for the System Admin dashboard (/system-admin/dashboard).
 *
 * Shaped like the future API response so the page can switch to a real endpoint by replacing
 * `getSystemAdminDashboardMock()` with a fetch. See PLACEHOLDERS.md for each section's data source.
 */

export type DashboardKpis = {
  totalUsers: number;
  newUsersThisWeek: number;
  activeAccounts: number;
  suspendedAccounts: number;
  suspensionsExpiringThisWeek: number;
  staffAccounts: number;
};

export type DashboardRoleGroup = 'students' | 'advisers_panelists' | 'program_heads' | 'partners' | 'other_staff';

export type DashboardRoleCount = {
  group: DashboardRoleGroup;
  count: number;
};

export type DashboardActivity =
  | { id: string; type: 'account_created'; occurredAt: string; subjectName: string; subjectRole: string }
  | { id: string; type: 'account_suspended'; occurredAt: string; subjectName: string; durationDays: number }
  | { id: string; type: 'account_restored'; occurredAt: string; subjectName: string }
  | { id: string; type: 'branding_updated'; occurredAt: string; area: string };

export type DashboardAttentionKind = 'suspensions_ending' | 'temporary_passwords' | 'new_registrations';

export type DashboardAttentionItem = {
  id: string;
  kind: DashboardAttentionKind;
  count: number;
  /** 'warning' shows a gold dot, 'neutral' a gray one; the text always states the issue too. */
  tone: 'warning' | 'neutral';
  href: string;
};

export type DashboardPortalStatus = {
  maintenanceMode: boolean;
  academicYear: string;
  studentRegistration: 'open' | 'closed';
  lastBrandingUpdate: string;
};

export type SystemAdminDashboardData = {
  kpis: DashboardKpis;
  usersByRole: DashboardRoleCount[];
  recentActivity: DashboardActivity[];
  needsAttention: DashboardAttentionItem[];
  portalStatus: DashboardPortalStatus;
};

/** ISO timestamp for today (or `daysAgo` days back) at a given local time, so relative labels stay realistic. */
function at(hours: number, minutes: number, daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function getSystemAdminDashboardMock(): SystemAdminDashboardData {
  return {
    kpis: {
      totalUsers: 1284,
      newUsersThisWeek: 32,
      activeAccounts: 1261,
      suspendedAccounts: 23,
      suspensionsExpiringThisWeek: 4,
      staffAccounts: 47
    },
    usersByRole: [
      { group: 'students', count: 1152 },
      { group: 'advisers_panelists', count: 58 },
      { group: 'program_heads', count: 5 },
      { group: 'partners', count: 19 },
      { group: 'other_staff', count: 50 }
    ],
    recentActivity: [
      { id: 'act-1', type: 'account_created', occurredAt: at(10, 42), subjectName: 'M. Reyes', subjectRole: 'Adviser' },
      { id: 'act-2', type: 'account_suspended', occurredAt: at(9, 15), subjectName: 'J. Cruz', durationDays: 7 },
      { id: 'act-3', type: 'account_restored', occurredAt: at(8, 30), subjectName: 'A. Lim' },
      { id: 'act-4', type: 'branding_updated', occurredAt: at(16, 5, 1), area: 'colors' }
    ],
    needsAttention: [
      { id: 'att-1', kind: 'suspensions_ending', count: 4, tone: 'warning', href: '/system-admin/users' },
      { id: 'att-2', kind: 'temporary_passwords', count: 6, tone: 'warning', href: '/system-admin/users' },
      { id: 'att-3', kind: 'new_registrations', count: 12, tone: 'neutral', href: '/system-admin/users' }
    ],
    portalStatus: {
      maintenanceMode: false,
      academicYear: '2025–2026',
      studentRegistration: 'open',
      lastBrandingUpdate: at(16, 5, 1)
    }
  };
}
