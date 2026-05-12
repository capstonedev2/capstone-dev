'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { SystemAdminShell } from '@/components/system-admin/system-admin-shell';

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
  createdAt?: string;
  updatedAt?: string;
};

type UserListResponse = {
  success?: boolean;
  users?: ManagedUser[];
  message?: string;
};

type UserMutationResponse = {
  success?: boolean;
  message?: string;
  user?: ManagedUser;
  fieldErrors?: Record<string, string>;
};

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  role: Exclude<ApiUserRole, 'admin' | 'student'>;
  department: string;
  password: string;
  confirmPassword: string;
};

type StatusFilter = 'all' | 'active' | 'suspended';

type BannerState = {
  tone: 'success' | 'warning';
  title: string;
  body: string;
};

const ROLE_LABELS: Record<ApiUserRole, string> = {
  admin: 'Legacy Admin',
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

const STAFF_ROLE_OPTIONS: Array<{
  value: UserFormState['role'];
  label: string;
  description: string;
  boundary: string;
  category: 'technical' | 'oversight' | 'academic' | 'workflow' | 'external';
  icon: string;
}> = [
  {
    value: 'system_admin',
    label: 'System Administrator',
    description: 'Technical super admin for platform settings, RBAC, logs, backups, and maintenance.',
    boundary: 'No research monitoring workflow ownership.',
    category: 'technical',
    icon: 'fa-server'
  },
  {
    value: 'research_head',
    label: 'Research Head',
    description: 'Functional research oversight without technical maintenance controls.',
    boundary: 'Cannot create Program Head or Adviser accounts.',
    category: 'oversight',
    icon: 'fa-building-columns'
  },
  {
    value: 'program_head',
    label: 'Program Head',
    description: 'Academic manager for adviser accounts and department monitoring.',
    boundary: 'No system settings or cross-role management.',
    category: 'academic',
    icon: 'fa-user-tie'
  },
  {
    value: 'adviser',
    label: 'Adviser',
    description: 'Faculty adviser access for group supervision and submission reviews.',
    boundary: 'Usually provisioned by Program Head.',
    category: 'academic',
    icon: 'fa-chalkboard-user'
  },
  {
    value: 'panel',
    label: 'Panelist',
    description: 'Defense review and evaluation access.',
    boundary: 'Evaluation workflow only.',
    category: 'academic',
    icon: 'fa-clipboard-check'
  },
  {
    value: 'library',
    label: 'Library Personnel',
    description: 'Repository validation and archival workflow access.',
    boundary: 'Repository workflow only.',
    category: 'workflow',
    icon: 'fa-book-open-reader'
  },
  {
    value: 'tech_transfer',
    label: 'Tech Transfer Officer',
    description: 'Technology transfer deployment and utilization workflow access.',
    boundary: 'Transfer workflow only.',
    category: 'workflow',
    icon: 'fa-arrow-up-right-dots'
  },
  {
    value: 'partner',
    label: 'Industry Partner',
    description: 'Partner collaboration, matching, feedback, and deployment status access.',
    boundary: 'External collaboration only.',
    category: 'external',
    icon: 'fa-handshake'
  }
];

const ROLE_DECORATION: Record<ApiUserRole, {
  icon: string;
  lane: string;
  category: 'technical' | 'oversight' | 'academic' | 'workflow' | 'external' | 'student' | 'legacy';
}> = {
  admin: { icon: 'fa-user-shield', lane: 'Legacy access', category: 'legacy' },
  system_admin: { icon: 'fa-server', lane: 'Technical control', category: 'technical' },
  research_head: { icon: 'fa-building-columns', lane: 'Research oversight', category: 'oversight' },
  student: { icon: 'fa-user-graduate', lane: 'Self-register', category: 'student' },
  adviser: { icon: 'fa-chalkboard-user', lane: 'Academic review', category: 'academic' },
  panel: { icon: 'fa-clipboard-check', lane: 'Defense evaluation', category: 'academic' },
  program_head: { icon: 'fa-user-tie', lane: 'Department management', category: 'academic' },
  partner: { icon: 'fa-handshake', lane: 'External partner', category: 'external' },
  tech_transfer: { icon: 'fa-arrow-up-right-dots', lane: 'Transfer workflow', category: 'workflow' },
  library: { icon: 'fa-book-open-reader', lane: 'Repository workflow', category: 'workflow' }
};

const EMPTY_USER_FORM: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'program_head',
  department: '',
  password: '',
  confirmPassword: ''
};

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

function getPasswordScore(value: string) {
  if (!value) {
    return 0;
  }

  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  return Math.min(score, 5);
}

function getPasswordStrengthLabel(score: number) {
  if (score >= 5) return 'Excellent';
  if (score >= 4) return 'Strong';
  if (score >= 3) return 'Good';
  if (score >= 2) return 'Fair';
  if (score >= 1) return 'Weak';
  return 'Not set';
}

function generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*?';
  const all = `${upper}${lower}${numbers}${symbols}`;
  const required = [upper, lower, numbers, symbols].map((group) => group[Math.floor(Math.random() * group.length)]);
  const extra = Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]);

  return [...required, ...extra]
    .sort(() => Math.random() - 0.5)
    .join('');
}

function SystemAdminKpi({
  icon,
  label,
  value,
  meta
}: {
  icon: string;
  label: string;
  value: string | number;
  meta: string;
}) {
  return (
    <article className="admin-kpi-card">
      <span className="admin-kpi-label">
        <i className={`fas ${icon}`}></i> {label}
      </span>
      <strong className="admin-kpi-value">{value}</strong>
      <span className="admin-kpi-meta">{meta}</span>
    </article>
  );
}

export function SystemAdminDashboard() {
  const healthItems = [
    { label: 'Auth and RBAC', value: 98, status: 'Operational' },
    { label: 'Database', value: 92, status: 'Backup current' },
    { label: 'File Storage', value: 81, status: 'Healthy' },
    { label: 'API Routes', value: 96, status: 'Protected' }
  ];

  return (
    <SystemAdminShell
      activeNav="dashboard"
      title="System Admin Dashboard"
      description="Technical operations overview for platform access, security, settings, backup, and maintenance."
    >
      <div className="admin-page-stack">
        <section className="admin-grid-4">
          <SystemAdminKpi icon="fa-users-gear" label="Managed Staff Roles" value="8" meta="System, Research, Program, Library, Transfer, Partner, Adviser, Panel" />
          <SystemAdminKpi icon="fa-shield-halved" label="RBAC Policies" value="Strict" meta="Route and API access separated by role" />
          <SystemAdminKpi icon="fa-database" label="Last Backup" value="02:10" meta="Automated database backup completed today" />
          <SystemAdminKpi icon="fa-screwdriver-wrench" label="Maintenance" value="Off" meta="Portal is available to users" />
        </section>

        <section className="admin-grid-2">
          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Platform Health</h3>
                <p>Technical indicators owned by System Administrator.</p>
              </div>
              <span className="status-badge status-approved">Operational</span>
            </div>
            <div className="admin-section-body">
              <div className="admin-list">
                {healthItems.map((item) => (
                  <div key={item.label} className="admin-list-item">
                    <div style={{ flex: 1 }}>
                      <strong>{item.label}</strong>
                      <div className="admin-progress-track" style={{ marginTop: '.55rem' }}>
                        <div className="admin-progress-bar" style={{ width: `${item.value}%` }}></div>
                      </div>
                    </div>
                    <span className="status-badge status-info">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Responsibility Boundary</h3>
                <p>Technical control is intentionally separate from research monitoring.</p>
              </div>
            </div>
            <div className="admin-section-body">
              <div className="admin-list">
                {[
                  ['System Admin', 'RBAC, user provisioning, settings, logs, backups, maintenance, branding'],
                  ['Research Head', 'User monitoring, projects, approvals, reports'],
                  ['Program Head', 'Adviser account creation and department-level academic monitoring']
                ].map(([role, scope]) => (
                  <div key={role} className="admin-list-item">
                    <strong>{role}</strong>
                    <span className="admin-table-meta">{scope}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | ApiUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [activeSuspensionUserId, setActiveSuspensionUserId] = useState<string | null>(null);

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
        title: 'Unable to load users',
        body: error instanceof Error && error.message ? error.message : 'The user directory could not be loaded.'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !user.isSuspended) ||
        (statusFilter === 'suspended' && user.isSuspended);
      const matchesDepartment = departmentFilter === 'all' || (user.department || 'Unassigned') === departmentFilter;
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        (user.department || '').toLowerCase().includes(normalizedQuery) ||
        (user.studentId || '').toLowerCase().includes(normalizedQuery);

      return matchesRole && matchesStatus && matchesDepartment && matchesQuery;
    });
  }, [departmentFilter, query, roleFilter, statusFilter, users]);

  const departments = useMemo(() => {
    const values = users
      .map((user) => user.department || 'Unassigned')
      .filter(Boolean);

    return Array.from(new Set(values)).sort();
  }, [users]);

  const activeUsers = users.filter((user) => !user.isSuspended).length;
  const suspendedUsers = users.length - activeUsers;
  const staffUsers = users.filter((user) => user.role !== 'student').length;
  const technicalUsers = users.filter((user) => user.role === 'system_admin').length;
  const researchOversightUsers = users.filter((user) => user.role === 'research_head' || user.role === 'program_head').length;
  const selectedRoleOption =
    STAFF_ROLE_OPTIONS.find((role) => role.value === form.role) ?? STAFF_ROLE_OPTIONS[0];
  const selectedRoleDecoration = ROLE_DECORATION[selectedRoleOption.value];
  const passwordScore = getPasswordScore(form.password);
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordScore);
  const passwordMismatch = Boolean(form.password && form.confirmPassword && form.password !== form.confirmPassword);
  const previewName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim() || 'New staff account';

  const updateFormField = (field: keyof UserFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setShowTemporaryPassword(false);
    setShowConfirmPassword(false);
    setForm(EMPTY_USER_FORM);
    setFieldErrors({});
  };

  const openCreateModal = () => {
    setForm(EMPTY_USER_FORM);
    setFieldErrors({});
    setShowTemporaryPassword(false);
    setShowConfirmPassword(false);
    setIsCreateOpen(true);
  };

  const handleGeneratePassword = () => {
    const password = generateTemporaryPassword();

    setForm((current) => ({
      ...current,
      password,
      confirmPassword: password
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.password;
      delete next.confirmPassword;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          role: form.role,
          department: form.department.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword
        })
      });
      const payload = await parseApiPayload<UserMutationResponse>(response);

      if (!response.ok || !payload?.success || !payload.user) {
        setFieldErrors(payload?.fieldErrors || {});
        setBanner({
          tone: 'warning',
          title: 'Unable to create account',
          body: payload?.message || 'The server rejected this account.'
        });
        return;
      }

      setUsers((current) => [payload.user as ManagedUser, ...current]);
      setBanner({
        tone: 'success',
        title: 'Account created',
        body: payload.message || `${payload.user.name} can now sign in.`
      });
      closeCreateModal();
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'Unable to create account',
        body: error instanceof Error && error.message ? error.message : 'The account could not be created.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuspensionToggle = async (user: ManagedUser, suspended: boolean) => {
    setActiveSuspensionUserId(user.id);

    try {
      const response = await fetch(`/api/users/${user.id}/suspension`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ suspended })
      });
      const payload = await parseApiPayload<UserMutationResponse>(response);

      if (!response.ok || !payload?.success || !payload.user) {
        setBanner({
          tone: 'warning',
          title: suspended ? 'Unable to suspend account' : 'Unable to restore account',
          body: payload?.message || 'The server rejected this request.'
        });
        return;
      }

      setUsers((current) => current.map((item) => (item.id === payload.user?.id ? payload.user : item)));
      setBanner({
        tone: 'success',
        title: suspended ? 'Account suspended' : 'Account restored',
        body: payload.message || `${user.name} has been updated.`
      });
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: suspended ? 'Unable to suspend account' : 'Unable to restore account',
        body: error instanceof Error && error.message ? error.message : 'The request could not be completed.'
      });
    } finally {
      setActiveSuspensionUserId(null);
    }
  };

  return (
    <>
      <SystemAdminShell
        activeNav="users"
        title="User Management"
        description="Provision technical and staff roles while students remain self-register users."
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
            <SystemAdminKpi icon="fa-users" label="Total Users" value={users.length} meta={`${filteredUsers.length} shown after filters`} />
            <SystemAdminKpi icon="fa-user-check" label="Active Accounts" value={activeUsers} meta="Accounts allowed to sign in" />
            <SystemAdminKpi icon="fa-id-badge" label="Staff and Partners" value={staffUsers} meta="Provisioned or delegated non-student access" />
            <SystemAdminKpi icon="fa-server" label="Technical Admins" value={technicalUsers} meta={`${researchOversightUsers} oversight managers, ${suspendedUsers} suspended`} />
          </section>

          <section className="admin-section-card system-user-command">
            <div className="admin-section-head">
              <div>
                <h3>Account Control Center</h3>
                <p>Manage technical and staff access without changing student self-registration.</p>
              </div>
              <button className="btn btn-primary" type="button" onClick={openCreateModal}>
                <i className="fas fa-user-plus"></i>
                Create Staff Account
              </button>
            </div>
            <div className="admin-section-body">
              <div className="system-user-toolbar">
                <div className="admin-toolbar-field system-user-search">
                  <label>Search Directory</label>
                  <div className="system-input-shell">
                    <i className="fas fa-magnifying-glass"></i>
                    <input
                      className="admin-toolbar-input"
                      placeholder="Name, email, department, or ID"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-toolbar-field">
                  <label>Role</label>
                  <select
                    className="admin-toolbar-select"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as 'all' | ApiUserRole)}
                  >
                    <option value="all">All roles</option>
                    {Object.entries(ROLE_LABELS)
                      .filter(([role]) => role !== 'admin')
                      .map(([role, label]) => (
                        <option key={role} value={role}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="admin-toolbar-field">
                  <label>Status</label>
                  <select
                    className="admin-toolbar-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="admin-toolbar-field">
                  <label>Department / Office</label>
                  <select
                    className="admin-toolbar-select"
                    value={departmentFilter}
                    onChange={(event) => setDepartmentFilter(event.target.value)}
                  >
                    <option value="all">All departments</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="system-filter-strip">
                <span className="admin-inline-badge">
                  <i className="fas fa-user-graduate"></i>
                  Students self-register
                </span>
                <span className="admin-inline-badge">
                  <i className="fas fa-user-tie"></i>
                  Program Heads manage Advisers
                </span>
                <span className="admin-inline-badge">
                  <i className="fas fa-server"></i>
                  System Admin manages staff access
                </span>
                <div className="system-filter-actions">
                  <button
                    className="btn btn-outline small"
                    disabled={isRefreshing}
                    type="button"
                    onClick={() => void loadUsers('refresh')}
                  >
                    <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-rotate'}`}></i>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  {(query || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') ? (
                    <button
                      className="btn btn-outline small"
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setRoleFilter('all');
                        setStatusFilter('all');
                        setDepartmentFilter('all');
                      }}
                    >
                      <i className="fas fa-filter-circle-xmark"></i>
                      Clear Filters
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Account Directory</h3>
                <p>System Admin can provision staff roles and suspend or restore accounts.</p>
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
                    <th>Access Lane</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-empty-state">Loading account directory...</div>
                      </td>
                    </tr>
                  ) : filteredUsers.length ? (
                    filteredUsers.map((user) => {
                      const decoration = ROLE_DECORATION[user.role];

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-users-user-cell system-user-cell">
                              <span className={`admin-users-row-avatar system-role-avatar is-${decoration.category}`} aria-hidden="true">
                                {getInitials(user)}
                              </span>
                              <div>
                                <span className="table-title">{user.name}</span>
                                <span className="table-subtitle">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`system-role-pill is-${decoration.category}`}>
                              <i className={`fas ${decoration.icon}`}></i>
                              {ROLE_LABELS[user.role]}
                            </span>
                          </td>
                          <td>{user.department || 'Unassigned'}</td>
                          <td>
                            <span className="table-title">{decoration.lane}</span>
                            <span className="table-subtitle">{user.role === 'student' ? 'Public registration' : 'Provisioned access'}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${user.isSuspended ? 'status-critical' : 'status-approved'}`}>
                              {user.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <button
                              className="btn btn-outline small"
                              disabled={activeSuspensionUserId === user.id}
                              type="button"
                              onClick={() => void handleSuspensionToggle(user, !user.isSuspended)}
                            >
                              <i className={`fas ${activeSuspensionUserId === user.id ? 'fa-spinner fa-spin' : user.isSuspended ? 'fa-rotate-left' : 'fa-user-slash'}`}></i>
                              {user.isSuspended ? 'Restore' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-empty-state">No users match the current filters.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </SystemAdminShell>

      {isCreateOpen ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && closeCreateModal()}>
          <div className="modal-content admin-users-modal system-staff-modal">
            <div className="modal-header">
              <div>
                <h3>Create Staff Account</h3>
                <p>Provision technical, academic, and workflow roles with clear responsibility boundaries.</p>
              </div>
              <button className="close-modal" type="button" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="system-modal-steps" aria-hidden="true">
                  {['Role', 'Identity', 'Security'].map((step, index) => (
                    <span key={step} className="system-modal-step">
                      <strong>{index + 1}</strong>
                      {step}
                    </span>
                  ))}
                </div>

                <div className="system-staff-grid">
                  <section className="system-role-panel" aria-labelledby="staff-role-title">
                    <div className="system-panel-heading">
                      <span className="admin-kpi-label">Portal Role</span>
                      <strong id="staff-role-title">Access profile</strong>
                    </div>
                    <div className="system-role-picker" role="radiogroup" aria-label="Staff role">
                      {STAFF_ROLE_OPTIONS.map((role) => (
                        <button
                          key={role.value}
                          aria-checked={form.role === role.value}
                          className={`system-role-option${form.role === role.value ? ' is-active' : ''}`}
                          role="radio"
                          type="button"
                          onClick={() => updateFormField('role', role.value)}
                        >
                          <span className={`system-role-icon is-${role.category}`}>
                            <i className={`fas ${role.icon}`}></i>
                          </span>
                          <span>
                            <strong>{role.label}</strong>
                            <small>{role.description}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                    {fieldErrors.role ? <span className="admin-field-error">{fieldErrors.role}</span> : null}
                  </section>

                  <section className="system-staff-form-panel">
                    <div className="system-selected-role-card">
                      <span className={`system-role-icon is-${selectedRoleOption.category}`}>
                        <i className={`fas ${selectedRoleOption.icon}`}></i>
                      </span>
                      <div>
                        <span className="admin-kpi-label">{selectedRoleDecoration.lane}</span>
                        <strong>{selectedRoleOption.label}</strong>
                        <p>{selectedRoleOption.boundary}</p>
                      </div>
                    </div>

                    <div className="admin-form-grid">
                      <div className="form-field">
                        <label htmlFor="system-user-first-name">First Name</label>
                        <input
                          id="system-user-first-name"
                          aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
                          value={form.firstName}
                          onChange={(event) => updateFormField('firstName', event.target.value)}
                        />
                        {fieldErrors.firstName ? <span className="admin-field-error">{fieldErrors.firstName}</span> : null}
                      </div>
                      <div className="form-field">
                        <label htmlFor="system-user-last-name">Last Name</label>
                        <input
                          id="system-user-last-name"
                          aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
                          value={form.lastName}
                          onChange={(event) => updateFormField('lastName', event.target.value)}
                        />
                        {fieldErrors.lastName ? <span className="admin-field-error">{fieldErrors.lastName}</span> : null}
                      </div>
                      <div className="form-field">
                        <label htmlFor="system-user-email">Email</label>
                        <input
                          id="system-user-email"
                          aria-invalid={fieldErrors.email ? 'true' : 'false'}
                          type="email"
                          value={form.email}
                          onChange={(event) => updateFormField('email', event.target.value)}
                        />
                        {fieldErrors.email ? <span className="admin-field-error">{fieldErrors.email}</span> : null}
                      </div>
                      <div className="form-field">
                        <label htmlFor="system-user-department">Department / Office</label>
                        <input
                          id="system-user-department"
                          aria-invalid={fieldErrors.department ? 'true' : 'false'}
                          placeholder="Research Office, BSIT, Library, IT Office"
                          value={form.department}
                          onChange={(event) => updateFormField('department', event.target.value)}
                        />
                        {fieldErrors.department ? <span className="admin-field-error">{fieldErrors.department}</span> : null}
                      </div>
                    </div>

                    <div className="system-security-panel">
                      <div className="system-security-head">
                        <div>
                          <span className="admin-kpi-label">Temporary Password</span>
                          <strong>{passwordStrengthLabel}</strong>
                        </div>
                        <button className="btn btn-outline small" type="button" onClick={handleGeneratePassword}>
                          <i className="fas fa-wand-magic-sparkles"></i>
                          Generate
                        </button>
                      </div>
                      <div className="admin-form-grid">
                        <div className="form-field">
                          <label htmlFor="system-user-password">Temporary Password</label>
                          <div className="system-password-field">
                            <input
                              id="system-user-password"
                              aria-invalid={fieldErrors.password ? 'true' : 'false'}
                              type={showTemporaryPassword ? 'text' : 'password'}
                              value={form.password}
                              onChange={(event) => updateFormField('password', event.target.value)}
                            />
                            <button
                              aria-label={showTemporaryPassword ? 'Hide temporary password' : 'Show temporary password'}
                              className="system-password-toggle"
                              type="button"
                              onClick={() => setShowTemporaryPassword((current) => !current)}
                            >
                              <i className={`fas ${showTemporaryPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                          {fieldErrors.password ? <span className="admin-field-error">{fieldErrors.password}</span> : null}
                        </div>
                        <div className="form-field">
                          <label htmlFor="system-user-confirm-password">Confirm Password</label>
                          <div className="system-password-field">
                            <input
                              id="system-user-confirm-password"
                              aria-invalid={fieldErrors.confirmPassword || passwordMismatch ? 'true' : 'false'}
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={form.confirmPassword}
                              onChange={(event) => updateFormField('confirmPassword', event.target.value)}
                            />
                            <button
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                              className="system-password-toggle"
                              type="button"
                              onClick={() => setShowConfirmPassword((current) => !current)}
                            >
                              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                          {passwordMismatch ? <span className="admin-field-error">Passwords do not match.</span> : null}
                          {fieldErrors.confirmPassword ? <span className="admin-field-error">{fieldErrors.confirmPassword}</span> : null}
                        </div>
                      </div>
                      <div className="system-password-meter" aria-hidden="true">
                        <span className={`level-${passwordScore}`} style={{ width: `${Math.max(passwordScore, 1) * 20}%` }}></span>
                      </div>
                    </div>

                    <div className="system-account-preview">
                      <div className="admin-users-user-cell">
                        <span className={`admin-users-row-avatar system-role-avatar is-${selectedRoleOption.category}`} aria-hidden="true">
                          {previewName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SA'}
                        </span>
                        <div>
                          <span className="table-title">{previewName}</span>
                          <span className="table-subtitle">{form.email.trim() || 'email@university.edu.ph'}</span>
                        </div>
                      </div>
                      <div className="system-preview-meta">
                        <span className={`system-role-pill is-${selectedRoleOption.category}`}>
                          <i className={`fas ${selectedRoleOption.icon}`}></i>
                          {selectedRoleOption.label}
                        </span>
                        <span className="status-badge status-approved">Active on creation</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" disabled={isSaving} type="button" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={isSaving} type="submit">
                  <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-user-plus'}`}></i>
                  {isSaving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SystemAdminRoles() {
  const rows = [
    ['System Administrator', 'Full system control, RBAC, settings, branding, logs, backups, maintenance', 'No research monitoring workflow ownership'],
    ['Research Head', 'View users, projects, analytics, approvals, reports', 'No technical settings, no Program Head or Adviser creation'],
    ['Program Head', 'Create adviser accounts, monitor students and adviser performance in department', 'No system settings or cross-role management'],
    ['Student', 'Self-register, submit projects, upload files, track progress', 'No admin access'],
    ['Adviser / Panel', 'Academic review, guidance, evaluations, defense workflow', 'No system-level access'],
    ['Library / Tech Transfer / Partner', 'Research workflow support based on assigned process role', 'No system-level access']
  ];

  return (
    <SystemAdminShell
      activeNav="roles"
      title="Roles and Permissions"
      description="Central RBAC matrix for technical access control and responsibility separation."
    >
      <div className="admin-page-stack">
        <section className="admin-section-card">
          <div className="admin-section-head">
            <div>
              <h3>RBAC Matrix</h3>
              <p>System Admin owns role configuration. Research workflows stay with functional owners.</p>
            </div>
            <span className="status-badge status-approved">Strict separation</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Allowed Responsibility</th>
                  <th>Restriction</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([role, allowed, restricted]) => (
                  <tr key={role}>
                    <td><span className="admin-inline-badge">{role}</span></td>
                    <td>{allowed}</td>
                    <td>{restricted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminBranding() {
  return (
    <SystemAdminShell
      activeNav="branding"
      title="Theme and Branding"
      description="Technical branding controls for logo, colors, and system name."
    >
      <div className="admin-page-stack">
        <section className="admin-grid-2">
          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Brand Settings</h3>
                <p>These controls belong to System Admin, not Research Head.</p>
              </div>
            </div>
            <div className="admin-section-body">
              <div className="admin-form-grid">
                <div className="form-field">
                  <label>System Name</label>
                  <input defaultValue="Thesis Track" />
                </div>
                <div className="form-field">
                  <label>Primary Color</label>
                  <input defaultValue="#003A8F" />
                </div>
                <div className="form-field">
                  <label>Accent Color</label>
                  <input defaultValue="#F6BE00" />
                </div>
                <div className="form-field">
                  <label>Logo Asset</label>
                  <input defaultValue="/logo.png" />
                </div>
              </div>
              <div className="admin-action-row" style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary" type="button">
                  <i className="fas fa-floppy-disk"></i>
                  Save Branding
                </button>
                <button className="btn btn-outline" type="button">
                  <i className="fas fa-rotate-left"></i>
                  Restore Defaults
                </button>
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Preview</h3>
                <p>Portal identity shown to all roles.</p>
              </div>
            </div>
            <div className="admin-section-body">
              <div className="admin-profile-summary">
                <span className="admin-profile-avatar" aria-hidden="true">
                  <i className="fas fa-graduation-cap"></i>
                </span>
                <h2>Thesis Track</h2>
                <p>Higher Education Institutions</p>
                <div className="admin-action-row">
                  <span className="admin-inline-badge">#003A8F</span>
                  <span className="admin-inline-badge">#F6BE00</span>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminSettings() {
  const settings = [
    ['Departments', 'BSIT, BSMET, BSTCM, BSESM, BSNAME', 'Academic configuration'],
    ['Academic Year', '2025-2026', 'Active reporting period'],
    ['Approval Workflow', 'Adviser -> Program Head -> Research Head', 'Research process routing'],
    ['Registration', 'Students self-register', 'Public account policy']
  ];

  return (
    <SystemAdminShell
      activeNav="settings"
      title="System Settings"
      description="Technical configuration for departments, academic year, workflows, and account policies."
    >
      <div className="admin-page-stack">
        <section className="admin-grid-4">
          {settings.map(([label, value, meta]) => (
            <SystemAdminKpi key={label} icon="fa-sliders" label={label} value={value} meta={meta} />
          ))}
        </section>

        <section className="admin-section-card">
          <div className="admin-section-head">
            <div>
              <h3>Configuration Controls</h3>
              <p>System-level settings are not exposed in Research Head pages.</p>
            </div>
          </div>
          <div className="admin-section-body">
            <div className="admin-form-grid">
              <div className="form-field">
                <label>Active Academic Year</label>
                <select defaultValue="2025-2026">
                  <option>2025-2026</option>
                  <option>2026-2027</option>
                </select>
              </div>
              <div className="form-field">
                <label>Default Department Status</label>
                <select defaultValue="Active">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="form-field">
                <label>Student Registration</label>
                <select defaultValue="Self-register enabled">
                  <option>Self-register enabled</option>
                  <option>Closed</option>
                </select>
              </div>
              <div className="form-field">
                <label>Workflow Template</label>
                <select defaultValue="Standard research workflow">
                  <option>Standard research workflow</option>
                  <option>Accelerated review workflow</option>
                </select>
              </div>
            </div>
            <div className="admin-action-row" style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" type="button">
                <i className="fas fa-floppy-disk"></i>
                Save Settings
              </button>
            </div>
          </div>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminLogs() {
  const logs = [
    ['RBAC policy checked', 'System Admin', 'Route /system-admin/users allowed', 'Today 10:12 AM', 'status-approved'],
    ['Research Head denied technical route', 'Proxy', 'Redirected to /admin/dashboard', 'Today 9:44 AM', 'status-warning'],
    ['Backup completed', 'Scheduler', 'Database snapshot created', 'Today 2:10 AM', 'status-approved'],
    ['Public registration completed', 'Student', 'New student account created through self-register', 'Yesterday 4:18 PM', 'status-info']
  ];

  return (
    <SystemAdminShell
      activeNav="logs"
      title="Logs and Security"
      description="Audit and security activity for authentication, RBAC, backups, and configuration."
    >
      <div className="admin-page-stack">
        <section className="admin-grid-4">
          <SystemAdminKpi icon="fa-file-shield" label="Audit Events" value="1,248" meta="Last 30 days" />
          <SystemAdminKpi icon="fa-ban" label="Denied Access" value="12" meta="Blocked by route policy" />
          <SystemAdminKpi icon="fa-user-shield" label="Privileged Users" value="3" meta="System Admin accounts" />
          <SystemAdminKpi icon="fa-key" label="Password Resets" value="7" meta="Last 30 days" />
        </section>

        <section className="admin-section-card">
          <div className="admin-section-head">
            <div>
              <h3>Security Activity</h3>
              <p>System logs are technical records and remain outside Research Head access.</p>
            </div>
            <button className="btn btn-outline small" type="button">
              <i className="fas fa-file-export"></i>
              Export Logs
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Detail</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(([event, actor, detail, time, status]) => (
                  <tr key={`${event}-${time}`}>
                    <td><span className="table-title">{event}</span></td>
                    <td>{actor}</td>
                    <td>{detail}</td>
                    <td>{time}</td>
                    <td><span className={`status-badge ${status}`}>{status.replace('status-', '')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminBackups() {
  const backups = [
    ['backup-2026-05-01-0210.sql', 'Completed', '2.4 GB', 'Today 2:10 AM'],
    ['backup-2026-04-30-0210.sql', 'Completed', '2.3 GB', 'Apr 30, 2026'],
    ['backup-2026-04-29-0210.sql', 'Completed', '2.3 GB', 'Apr 29, 2026']
  ];

  return (
    <SystemAdminShell
      activeNav="backups"
      title="Backup and Restore"
      description="Technical database backup and restore controls owned by System Admin."
    >
      <div className="admin-page-stack">
        <section className="admin-grid-4">
          <SystemAdminKpi icon="fa-database" label="Backup Policy" value="Daily" meta="Automated at 2:10 AM" />
          <SystemAdminKpi icon="fa-clock-rotate-left" label="Retention" value="30 days" meta="Rolling backup window" />
          <SystemAdminKpi icon="fa-hard-drive" label="Storage Used" value="71%" meta="Backup storage pool" />
          <SystemAdminKpi icon="fa-shield" label="Restore Test" value="Passed" meta="Latest restore verification" />
        </section>

        <section className="admin-section-card">
          <div className="admin-section-head">
            <div>
              <h3>Backup Catalog</h3>
              <p>Restore actions require System Administrator access.</p>
            </div>
            <div className="admin-action-row">
              <button className="btn btn-primary small" type="button">
                <i className="fas fa-download"></i>
                Run Backup
              </button>
              <button className="btn btn-outline small" type="button">
                <i className="fas fa-upload"></i>
                Restore
              </button>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(([file, status, size, created]) => (
                  <tr key={file}>
                    <td><span className="table-title">{file}</span></td>
                    <td><span className="status-badge status-approved">{status}</span></td>
                    <td>{size}</td>
                    <td>{created}</td>
                    <td><button className="btn btn-outline small" type="button">Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminMaintenance() {
  const [enabled, setEnabled] = useState(false);

  return (
    <SystemAdminShell
      activeNav="maintenance"
      title="Maintenance Mode"
      description="Control planned technical downtime and platform availability."
    >
      <div className="admin-page-stack">
        <section className={`admin-result-banner ${enabled ? 'is-warning' : 'is-success'}`}>
          <div>
            <strong>{enabled ? 'Maintenance mode is enabled.' : 'Portal is available.'}</strong>
            <p>{enabled ? 'Users are blocked from normal workflows while maintenance is active.' : 'All role portals are available under the current RBAC rules.'}</p>
          </div>
          <button className={enabled ? 'btn btn-outline' : 'btn btn-primary'} type="button" onClick={() => setEnabled((current) => !current)}>
            <i className={`fas ${enabled ? 'fa-unlock' : 'fa-lock'}`}></i>
            {enabled ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </section>

        <section className="admin-grid-2">
          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Maintenance Window</h3>
                <p>Schedule and message shown during planned downtime.</p>
              </div>
            </div>
            <div className="admin-section-body">
              <div className="admin-form-grid">
                <div className="form-field">
                  <label>Start</label>
                  <input defaultValue="2026-05-03 22:00" />
                </div>
                <div className="form-field">
                  <label>End</label>
                  <input defaultValue="2026-05-04 01:00" />
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label>User Message</label>
                  <textarea defaultValue="Thesis Track is temporarily unavailable for scheduled maintenance." />
                </div>
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Allowed During Maintenance</h3>
                <p>Only technical operators should retain access.</p>
              </div>
            </div>
            <div className="admin-section-body">
              <div className="admin-list">
                {['System Administrator login', 'Backup and restore console', 'Security logs', 'System settings'].map((item) => (
                  <div key={item} className="admin-list-item">
                    <strong>{item}</strong>
                    <span className="status-badge status-approved">Allowed</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </SystemAdminShell>
  );
}
