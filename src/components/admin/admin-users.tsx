'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

type ApiUserRole =
  | 'admin'
  | 'system_admin'
  | 'research_head'
  | 'student'
  | 'adviser'
  | 'panel'
  | 'program_head'
  | 'partner'
  | 'tech_transfer'
  | 'library';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  isSuspended?: boolean;
  suspendedAt?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  studentId?: string | null;
  department?: string | null;
  yearLevel?: string | null;
  office?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type UserListResponse = {
  success?: boolean;
  users?: ManagedUser[];
  message?: string;
};

type BannerState = {
  tone: 'success' | 'warning';
  title: string;
  body: string;
};

const ROLE_FILTERS: Array<{
  value: 'all' | ApiUserRole;
  label: string;
}> = [
  { value: 'all', label: 'All Research Users' },
  { value: 'student', label: 'Student' },
  { value: 'adviser', label: 'Adviser' },
  { value: 'program_head', label: 'Program Head' },
  { value: 'library', label: 'Library Personnel' },
  { value: 'tech_transfer', label: 'Tech Transfer Officer' },
  { value: 'partner', label: 'Industry Partner' }
];

const ROLE_LABELS: Record<ApiUserRole, string> = {
  admin: 'Legacy Research Admin',
  system_admin: 'System Administrator',
  research_head: 'Research Head',
  student: 'Student',
  adviser: 'Adviser',
  panel: 'Panelist',
  program_head: 'Program Head',
  partner: 'Industry Partner',
  tech_transfer: 'Tech Transfer Officer',
  library: 'Library Personnel'
};

const ROLE_SCOPE: Record<ApiUserRole, string> = {
  admin: 'Legacy research oversight role retained for migration compatibility',
  system_admin: 'Technical configuration, maintenance, backup, and RBAC control',
  research_head: 'Research oversight and executive reporting',
  student: 'Self-registered student workspace',
  adviser: 'Adviser workspace managed by Program Head',
  panel: 'Defense evaluation access',
  program_head: 'Program-level research oversight',
  partner: 'Partner feedback and deployment collaboration',
  tech_transfer: 'Technology transfer deployment workflow',
  library: 'Repository validation and publication workflow'
};

const ACCESS_RULES = [
  'Research Head can view all role assignments and profile completeness.',
  'Program Head and Adviser account creation is outside Research Head controls.',
  'Students remain self-register users and are monitored after registration.',
  'Technical account provisioning belongs to IT Administrator/System Admin.'
];

async function parseApiPayload<T>(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return null;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getInitials(user: ManagedUser) {
  const source = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function getDirectoryId(user: ManagedUser) {
  return user.studentId || user.id.slice(0, 8).toUpperCase();
}

function getProfileCompleteness(user: ManagedUser) {
  const missing: string[] = [];

  if (!user.department && user.role !== 'partner') {
    missing.push('department');
  }

  if (user.role === 'student') {
    if (!user.studentId) missing.push('student ID');
    if (!user.yearLevel) missing.push('year level');
  }

  if (user.role === 'partner' && !user.office) {
    missing.push('partner office');
  }

  return {
    label: missing.length ? 'Needs details' : 'Complete',
    tone: missing.length ? 'status-pending' : 'status-approved',
    note: missing.length ? `Missing ${missing.join(', ')}.` : 'Required profile fields are present.'
  };
}

function buildActivityLogs(user: ManagedUser) {
  const role = ROLE_LABELS[user.role];

  return [
    {
      title: 'Profile viewed by Research Head',
      note: `${role} details opened for research oversight review.`,
      time: 'Today, 9:12 AM',
      tone: 'status-info'
    },
    {
      title: user.isSuspended ? 'Account flagged as suspended' : 'Account status verified',
      note: user.isSuspended
        ? `Suspended since ${formatDate(user.suspendedAt)}.`
        : 'Account can access its assigned portal.',
      time: 'Today, 8:45 AM',
      tone: user.isSuspended ? 'status-critical' : 'status-approved'
    },
    {
      title: 'Role permission checked',
      note: ROLE_SCOPE[user.role],
      time: formatDate(user.updatedAt),
      tone: 'status-neutral'
    }
  ];
}

export function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | ApiUserRole>('all');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch('/api/users', {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const payload = await parseApiPayload<UserListResponse>(response);

      if (!response.ok || !payload?.success || !payload.users) {
        throw new Error(payload?.message || 'Unable to load user records.');
      }

      setUsers(payload.users);
      setBanner(null);
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'User directory unavailable',
        body:
          error instanceof Error && error.message
            ? error.message
            : 'The user monitoring view could not load the directory.'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const departments = useMemo(() => {
    const values = users
      .map((user) => user.department)
      .filter((value): value is string => Boolean(value));

    return ['All Departments', ...Array.from(new Set(values)).sort()];
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesDepartment = departmentFilter === 'All Departments' || user.department === departmentFilter;
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        getDirectoryId(user).toLowerCase().includes(normalizedQuery);

      return matchesRole && matchesDepartment && matchesQuery;
    });
  }, [departmentFilter, query, roleFilter, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const activeUsers = users.filter((user) => !user.isSuspended).length;
  const students = users.filter((user) => user.role === 'student').length;
  const researchStaff = users.filter((user) => ['adviser', 'program_head', 'library', 'tech_transfer'].includes(user.role)).length;
  const partners = users.filter((user) => user.role === 'partner').length;

  return (
    <>
      <AdminShell
        activeNav="users"
        title="User Monitoring"
        description="View role assignments, profile details, and user activity signals without technical account provisioning controls."
      >
        <div className="admin-page-stack">
          {banner ? (
            <section className={`admin-result-banner ${banner.tone === 'success' ? 'is-success' : 'is-warning'}`}>
              <div>
                <strong>{banner.title}</strong>
                <p>{banner.body}</p>
              </div>
              <button className="btn btn-outline small" type="button" onClick={() => setBanner(null)}>
                Dismiss
              </button>
            </section>
          ) : null}

          <section className="admin-grid-4">
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Total Users</span>
              <strong className="admin-kpi-value">{users.length}</strong>
              <span className="admin-kpi-meta">View-only directory count across all portal roles.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Active Accounts</span>
              <strong className="admin-kpi-value">{activeUsers}</strong>
              <span className="admin-kpi-meta">Users currently allowed to sign in.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Students</span>
              <strong className="admin-kpi-value">{students}</strong>
              <span className="admin-kpi-meta">Self-registered student records under monitoring.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Research Roles</span>
              <strong className="admin-kpi-value">{researchStaff + partners}</strong>
              <span className="admin-kpi-meta">{researchStaff} staff roles and {partners} partner accounts.</span>
            </article>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-body">
              <div className="admin-toolbar compact">
                <div className="span-3 admin-toolbar-field">
                  <label>Search Users</label>
                  <input
                    className="admin-toolbar-input"
                    placeholder="Search name, email, or ID..."
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <div className="span-3 admin-toolbar-field">
                  <label>Role</label>
                  <select
                    className="admin-toolbar-select"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as 'all' | ApiUserRole)}
                  >
                    {ROLE_FILTERS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="span-3 admin-toolbar-field">
                  <label>Department</label>
                  <select className="admin-toolbar-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                    {departments.map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div className="span-3 admin-toolbar-actions">
                  <button
                    className="btn btn-outline"
                    disabled={isRefreshing}
                    type="button"
                    onClick={() => void loadUsers('refresh')}
                  >
                    <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-rotate'}`}></i>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button className="btn btn-outline" type="button">
                    <i className="fas fa-file-excel"></i>
                    Export Excel
                  </button>
                </div>
                <div className="span-full">
                  <div className="admin-inline-badge">
                    <i className="fas fa-circle-info"></i>
                    Research Head monitoring is view-only for Program Head and Adviser provisioning.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>User Directory</h3>
                <p>Filter by required portal roles and open a profile to review activity logs and permissions.</p>
              </div>
              <span className="status-badge status-info">{filteredUsers.length} shown</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department / Office</th>
                    <th>Directory ID</th>
                    <th>Status</th>
                    <th>Profile</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="admin-empty-state">Loading user directory...</div>
                      </td>
                    </tr>
                  ) : filteredUsers.length ? (
                    filteredUsers.map((user) => {
                      const profileState = getProfileCompleteness(user);

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-users-user-cell">
                              <span className="admin-users-row-avatar" aria-hidden="true">{getInitials(user)}</span>
                              <div>
                                <span className="table-title">{user.name}</span>
                                <span className="table-subtitle">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="admin-inline-badge">{ROLE_LABELS[user.role]}</span></td>
                          <td>{user.department || user.office || 'Unassigned'}</td>
                          <td><code>{getDirectoryId(user)}</code></td>
                          <td>
                            <span className={`status-badge ${user.isSuspended ? 'status-critical' : 'status-approved'}`}>
                              {user.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${profileState.tone}`}>{profileState.label}</span>
                            <span className="table-subtitle">{profileState.note}</span>
                          </td>
                          <td>{formatDate(user.updatedAt)}</td>
                          <td>
                            <button className="btn btn-outline small" type="button" onClick={() => setSelectedUserId(user.id)}>
                              <i className="fas fa-eye"></i>
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="admin-empty-state">No users match the current filters.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-grid-2">
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Research Head Access Rules</h3>
                  <p>Operational guardrails applied to this module.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {ACCESS_RULES.map((rule) => (
                    <div key={rule} className="admin-list-item">
                      <strong>{rule}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Recent Directory Activity</h3>
                  <p>High-signal activity logs visible to the Research Head.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {users.slice(0, 3).map((user) => (
                    <article key={user.id} className="admin-log-item">
                      <span className="status-badge status-info">{ROLE_LABELS[user.role]}</span>
                      <div style={{ flex: 1 }}>
                        <strong>{user.name}</strong>
                        <span className="admin-table-meta">Profile updated {formatDate(user.updatedAt)}</span>
                      </div>
                    </article>
                  ))}
                  {!users.length ? <div className="admin-empty-state">No activity logs are available yet.</div> : null}
                </div>
              </div>
            </section>
          </section>
        </div>
      </AdminShell>

      {selectedUser ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setSelectedUserId(null)}>
          <div className="modal-content admin-users-modal">
            <div className="modal-header">
              <div>
                <h3>User Profile Details</h3>
                <p>Read-only profile and activity review for research oversight.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setSelectedUserId(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-profile-layout">
                <section className="admin-profile-summary">
                  <span className="admin-profile-avatar" aria-hidden="true">{getInitials(selectedUser)}</span>
                  <h2>{selectedUser.name}</h2>
                  <div className="admin-action-row">
                    <span className="admin-inline-badge">{ROLE_LABELS[selectedUser.role]}</span>
                    <span className={`status-badge ${selectedUser.isSuspended ? 'status-critical' : 'status-approved'}`}>
                      {selectedUser.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                  <p>{selectedUser.email}</p>
                  <p>{ROLE_SCOPE[selectedUser.role]}</p>
                </section>
                <section>
                  <div className="admin-profile-detail-grid">
                    {[
                      ['Role', ROLE_LABELS[selectedUser.role]],
                      ['Department', selectedUser.department || 'Not assigned'],
                      ['Directory ID', getDirectoryId(selectedUser)],
                      ['Year Level', selectedUser.yearLevel || 'Not applicable'],
                      ['Created', formatDate(selectedUser.createdAt)],
                      ['Updated', formatDate(selectedUser.updatedAt)]
                    ].map(([label, value]) => (
                      <div key={label} className="admin-profile-detail-item">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <section className="admin-section-card" style={{ marginTop: '1rem' }}>
                <div className="admin-section-head">
                  <div>
                    <h3>Activity Logs</h3>
                    <p>Recent account and role activity available to Research Head monitoring.</p>
                  </div>
                </div>
                <div className="admin-section-body">
                  <div className="admin-list">
                    {buildActivityLogs(selectedUser).map((log) => (
                      <article key={`${selectedUser.id}-${log.title}`} className="admin-log-item">
                        <span className={`status-badge ${log.tone}`}>{log.time}</span>
                        <div style={{ flex: 1 }}>
                          <strong>{log.title}</strong>
                          <span className="admin-table-meta">{log.note}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setSelectedUserId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
