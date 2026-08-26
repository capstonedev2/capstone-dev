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
  suspendedUntil?: string | null;
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
type SuspensionDuration = {
  key: string;
  label: string;
  helper: string;
};

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

const SUSPENSION_DURATIONS: SuspensionDuration[] = [
  { key: '1m', label: '1 minute', helper: 'Quick access test' },
  { key: '1h', label: '1 hour', helper: 'Short account hold' },
  { key: '6h', label: '6 hours', helper: 'Same-day review' },
  { key: '24h', label: '1 day', helper: 'Temporary suspension' },
  { key: '7d', label: '1 week', helper: 'Formal review window' },
  { key: '30d', label: '30 days', helper: 'Extended restriction' },
  { key: 'indefinite', label: 'Until restored', helper: 'Manual restore required' }
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

function formatDateTime(value?: string | null) {
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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
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

function isStaffManagedRole(role: ApiUserRole): role is UserFormState['role'] {
  return STAFF_ROLE_OPTIONS.some((option) => option.value === role);
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
    <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)', padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span className="admin-kpi-label" style={{ color: '#DBEAFE', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <i className={`fas ${icon}`} style={{ color: '#F6BE00', fontSize: '1.1rem' }}></i> {label}
      </span>
      <strong className="admin-kpi-value" style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem', lineHeight: 1 }}>{value}</strong>
      <span className="admin-kpi-meta" style={{ color: '#93C5FD', fontSize: '0.85rem', marginTop: '0.5rem' }}>{meta}</span>
    </article>
  );
}

export function SystemAdminDashboard() {
  const healthItems = [
    { label: 'Supabase Auth', value: 99, status: 'Operational', icon: 'fa-lock' },
    { label: 'PostgreSQL Database', value: 92, status: 'Healthy', icon: 'fa-database' },
    { label: 'Cloud Storage', value: 85, status: 'Optimized', icon: 'fa-cloud' },
    { label: 'Vercel Edge Functions', value: 96, status: 'Protected', icon: 'fa-bolt' }
  ];

  const recentLogs = [
    { time: '10:42 AM', event: 'Database automated backup completed.', type: 'info', icon: 'fa-check' },
    { time: '09:15 AM', event: 'Failed login attempt from IP 192.168.1.104', type: 'warning', icon: 'fa-triangle-exclamation' },
    { time: '08:30 AM', event: 'System Administrator updated RBAC policy.', type: 'info', icon: 'fa-shield-halved' },
    { time: 'Yesterday', event: 'Maintenance window closed successfully.', type: 'success', icon: 'fa-power-off' },
  ];

  return (
    <SystemAdminShell
      activeNav="dashboard"
      title="System Admin Dashboard"
      description="Live technical overview for platform access, security, settings, and infrastructure health."
    >
      <div className="admin-page-stack" style={{ gap: '1.8rem' }}>
        {/* Premium KPI Section */}
        <section className="admin-grid-4">
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-users-gear" style={{ color: '#F6BE00' }}></i> Managed Staff
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>7</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Across all system scopes</span>
          </article>
          
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-shield-halved" style={{ color: '#F6BE00' }}></i> RBAC Policies
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>Strict</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Zero-trust API boundaries</span>
          </article>

          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-database" style={{ color: '#F6BE00' }}></i> Last Backup
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>02:10 AM</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Automated snapshot secured</span>
          </article>

          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-satellite-dish" style={{ color: '#F6BE00' }}></i> Maintenance
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>Off</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Portal is publicly available</span>
          </article>
        </section>

        {/* Dynamic Main Section */}
        <section className="admin-grid-2" style={{ gap: '1.8rem' }}>
          
          {/* Infrastructure Health */}
          <section className="admin-section-card" style={{ borderTop: '4px solid #003A8F', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.08)' }}>
            <div className="admin-section-head">
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Infrastructure Health</h3>
                <p>Live status of critical ThesisTrack subsystems.</p>
              </div>
              <span className="status-badge status-approved" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: '999px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', animation: 'pulse 2s infinite' }}></span>
                System Optimal
              </span>
            </div>
            <div className="admin-section-body">
              <div className="admin-list">
                {healthItems.map((item) => (
                  <div key={item.label} className="admin-list-item" style={{ border: 'none', background: '#F8FAFC', marginBottom: '0.5rem', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#EFF6FF', color: '#003A8F', borderRadius: '10px' }}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.95rem' }}>{item.label}</strong>
                      <div className="admin-progress-track" style={{ marginTop: '.65rem', height: '0.4rem', background: '#E5E7EB' }}>
                        <div className="admin-progress-bar" style={{ width: `${item.value}%`, background: `linear-gradient(90deg, #003A8F, #1E40AF)` }}></div>
                      </div>
                    </div>
                    <span className="status-badge status-info" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#64748B' }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* System Event Logs */}
          <section className="admin-section-card" style={{ borderTop: '4px solid #F6BE00', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.08)' }}>
            <div className="admin-section-head">
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Recent System Events</h3>
                <p>Security and infrastructure audit trail.</p>
              </div>
              <button className="btn btn-outline small" style={{ border: '1px solid #E5E7EB', color: '#003A8F' }}>View All Logs</button>
            </div>
            <div className="admin-section-body" style={{ padding: '0 1.2rem 1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentLogs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: i === recentLogs.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: log.type === 'warning' ? '#FEF3C7' : log.type === 'success' ? '#DCFCE7' : '#EFF6FF', color: log.type === 'warning' ? '#D97706' : log.type === 'success' ? '#166534' : '#003A8F' }}>
                      <i className={`fas ${log.icon}`}></i>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <strong style={{ color: '#111827', fontSize: '0.9rem' }}>{log.event}</strong>
                      <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
        
        {/* Quick Actions Row */}
        <section style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button className="btn" style={{ flex: 1, padding: '1rem', background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', border: 'none', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 58, 143, 0.25)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
              <i className="fas fa-user-shield"></i> Review Security Settings
            </button>
            <button className="btn" style={{ flex: 1, padding: '1rem', background: 'white', color: '#111827', border: '1px solid #E5E7EB', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease' }}>
              <i className="fas fa-file-export" style={{ color: '#003A8F' }}></i> Trigger Manual Backup
            </button>
            <button className="btn" style={{ flex: 1, padding: '1rem', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s ease' }}>
              <i className="fas fa-power-off"></i> Enable Maintenance Mode
            </button>
        </section>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
          }
        `}} />
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
  const [detailsUser, setDetailsUser] = useState<ManagedUser | null>(null);
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [activeSuspensionUserId, setActiveSuspensionUserId] = useState<string | null>(null);
  const [openSuspensionUserId, setOpenSuspensionUserId] = useState<string | null>(null);

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
  const studentUsers = users.filter((user) => user.role === 'student').length;
  const technicalUsers = users.filter((user) => user.role === 'system_admin').length;
  const researchOversightUsers = users.filter((user) => user.role === 'research_head' || user.role === 'program_head').length;
  const filteredActiveUsers = filteredUsers.filter((user) => !user.isSuspended).length;
  const filteredSuspendedUsers = filteredUsers.length - filteredActiveUsers;
  const filteredStaffUsers = filteredUsers.filter((user) => user.role !== 'student').length;
  const activeRate = users.length ? Math.round((activeUsers / users.length) * 100) : 0;
  const hasActiveFilters = Boolean(query || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all');
  const roleQuickFilters: Array<{ value: 'all' | ApiUserRole; label: string; icon: string; category: string }> = [
    { value: 'all', label: 'All', icon: 'fa-layer-group', category: 'technical' },
    { value: 'student', label: 'Students', icon: ROLE_DECORATION.student.icon, category: ROLE_DECORATION.student.category },
    { value: 'program_head', label: 'Program Heads', icon: ROLE_DECORATION.program_head.icon, category: ROLE_DECORATION.program_head.category },
    { value: 'adviser', label: 'Advisers', icon: ROLE_DECORATION.adviser.icon, category: ROLE_DECORATION.adviser.category },
    { value: 'panel', label: 'Panelists', icon: ROLE_DECORATION.panel.icon, category: ROLE_DECORATION.panel.category },
    { value: 'library', label: 'Library', icon: ROLE_DECORATION.library.icon, category: ROLE_DECORATION.library.category },
    { value: 'partner', label: 'Partners', icon: ROLE_DECORATION.partner.icon, category: ROLE_DECORATION.partner.category }
  ];
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

  const handleSuspensionToggle = async (user: ManagedUser, suspended: boolean, duration?: SuspensionDuration) => {
    setActiveSuspensionUserId(user.id);
    setOpenSuspensionUserId(null);

    try {
      const response = await fetch(`/api/users/${user.id}/suspension`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ suspended, durationKey: duration?.key, durationLabel: duration?.label })
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

              <div className="system-role-filter-row" aria-label="Quick role filters">
                {roleQuickFilters.map((role) => (
                  <button
                    key={role.value}
                    className={`system-role-filter-chip is-${role.category}${roleFilter === role.value ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => setRoleFilter(role.value)}
                  >
                    <i className={`fas ${role.icon}`}></i>
                    {role.label}
                  </button>
                ))}
              </div>

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
                <span className="admin-inline-badge">
                  <i className="fas fa-circle-check"></i>
                  {filteredActiveUsers} active
                </span>
                {filteredSuspendedUsers ? (
                  <span className="admin-inline-badge">
                    <i className="fas fa-user-slash"></i>
                    {filteredSuspendedUsers} suspended
                  </span>
                ) : null}
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
                  {hasActiveFilters ? (
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

          <section className="admin-section-card system-directory-card">
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
                    <th className="system-actions-column">Actions</th>
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
                        <tr key={user.id} className={user.isSuspended ? 'is-suspended-user' : undefined}>
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
                          <td>
                            <span className="table-title">{user.department || 'Unassigned'}</span>
                            <span className="table-subtitle">{user.studentId || 'No linked ID'}</span>
                          </td>
                          <td>
                            <span className="table-title">{decoration.lane}</span>
                            <span className="table-subtitle">{user.role === 'student' ? 'Public registration' : 'Provisioned access'}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${user.isSuspended ? 'status-critical' : 'status-approved'}`}>
                              {user.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                            {user.isSuspended && user.suspendedUntil ? (
                              <span className="table-subtitle">Until {formatDateTime(user.suspendedUntil)}</span>
                            ) : null}
                          </td>
                          <td>
                            <span className="table-title">{formatDate(user.createdAt)}</span>
                            <span className="table-subtitle">{user.updatedAt ? `Updated ${formatDate(user.updatedAt)}` : 'No recent update'}</span>
                          </td>
                          <td>
                            <div className="system-user-actions">
                              <button
                                className="btn btn-outline small"
                                type="button"
                                onClick={() => setDetailsUser(user)}
                              >
                                <i className="fas fa-eye"></i>
                                View
                              </button>

                              {user.isSuspended ? (
                                <button
                                  className="btn btn-outline small"
                                  disabled={activeSuspensionUserId === user.id}
                                  type="button"
                                  onClick={() => void handleSuspensionToggle(user, false)}
                                >
                                  <i className={`fas ${activeSuspensionUserId === user.id ? 'fa-spinner fa-spin' : 'fa-rotate-left'}`}></i>
                                  Restore
                                </button>
                              ) : (
                                <div className="system-suspend-menu">
                                  <button
                                    aria-expanded={openSuspensionUserId === user.id ? 'true' : 'false'}
                                    className="btn btn-outline small"
                                    disabled={activeSuspensionUserId === user.id}
                                    type="button"
                                    onClick={() => setOpenSuspensionUserId((current) => (current === user.id ? null : user.id))}
                                  >
                                    <i className={`fas ${activeSuspensionUserId === user.id ? 'fa-spinner fa-spin' : 'fa-user-slash'}`}></i>
                                    Suspend
                                    <i className="fas fa-chevron-down"></i>
                                  </button>
                                  {openSuspensionUserId === user.id ? (
                                    <div className="system-suspend-dropdown">
                                      <span className="system-suspend-dropdown-title">Suspend for</span>
                                      {SUSPENSION_DURATIONS.map((duration) => (
                                        <button
                                          key={duration.key}
                                          type="button"
                                          onClick={() => void handleSuspensionToggle(user, true, duration)}
                                        >
                                          <strong>{duration.label}</strong>
                                          <small>{duration.helper}</small>
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
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
              <div className="system-modal-title">
                <span className={`system-role-icon is-${selectedRoleOption.category}`} aria-hidden="true">
                  <i className={`fas ${selectedRoleOption.icon}`}></i>
                </span>
                <div>
                  <span className="admin-kpi-label">System Admin</span>
                  <h3>Create Staff Account</h3>
                  <p>Provision a role, identity, and temporary access credentials in one controlled flow.</p>
                </div>
              </div>
              <button className="close-modal" type="button" onClick={closeCreateModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <section className="system-create-hero">
                  <div>
                    <span className="admin-kpi-label">Selected role</span>
                    <strong>{selectedRoleOption.label}</strong>
                    <p>{selectedRoleOption.description}</p>
                  </div>
                  <div className="system-create-hero-meta">
                    <span className={`system-role-pill is-${selectedRoleOption.category}`}>
                      <i className={`fas ${selectedRoleOption.icon}`}></i>
                      {selectedRoleDecoration.lane}
                    </span>
                    <span className={`status-badge ${passwordScore >= 3 ? 'status-success' : passwordScore ? 'status-review' : 'status-neutral'}`}>
                      Password: {passwordStrengthLabel}
                    </span>
                  </div>
                </section>

                <div className="system-modal-steps" aria-hidden="true">
                  {['Role', 'Identity', 'Security'].map((step, index) => (
                    <span key={step} className={`system-modal-step${index === 0 || (index === 1 && form.email.trim()) || (index === 2 && form.password) ? ' is-active' : ''}`}>
                      <strong>{index + 1}</strong>
                      {step}
                    </span>
                  ))}
                </div>

                <div className="system-staff-grid">
                  <section className="system-role-panel" aria-labelledby="staff-role-title">
                    <div className="system-panel-heading">
                      <div>
                        <span className="admin-kpi-label">Portal Role</span>
                        <strong id="staff-role-title">Choose access profile</strong>
                      </div>
                      <small className="system-panel-count">{STAFF_ROLE_OPTIONS.length} managed roles</small>
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
                            <em>{role.boundary}</em>
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

                    <div className="system-panel-heading is-inline">
                      <div>
                        <span className="admin-kpi-label">Identity</span>
                        <strong>Account information</strong>
                      </div>
                      <small>Required fields</small>
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
                          <p>Generate a one-time password and require the user to update it after sign-in.</p>
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
                      <div className="system-password-hints">
                        <span className={form.password.length >= 8 ? 'is-met' : ''}>8+ characters</span>
                        <span className={/[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? 'is-met' : ''}>Mixed case</span>
                        <span className={/\d/.test(form.password) ? 'is-met' : ''}>Number</span>
                        <span className={/[^A-Za-z0-9]/.test(form.password) ? 'is-met' : ''}>Symbol</span>
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

      {detailsUser ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setDetailsUser(null)}>
          <div className="modal-content admin-users-modal system-user-details-modal">
            <div className="modal-header">
              <div>
                <h3>User Details</h3>
                <p>Read-only account profile and access assignment.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setDetailsUser(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                const decoration = ROLE_DECORATION[detailsUser.role];

                return (
                  <div className="system-user-details">
                    <section className="system-user-details-hero">
                      <span className={`admin-users-row-avatar system-role-avatar is-${decoration.category}`} aria-hidden="true">
                        {getInitials(detailsUser)}
                      </span>
                      <div>
                        <span className="admin-kpi-label">Account identity</span>
                        <h4>{detailsUser.name}</h4>
                        <p>{detailsUser.email}</p>
                      </div>
                      <span className={`status-badge ${detailsUser.isSuspended ? 'status-critical' : 'status-approved'}`}>
                        {detailsUser.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </section>

                    <section className="system-user-details-grid">
                      <div>
                        <span>Role</span>
                        <strong>{ROLE_LABELS[detailsUser.role]}</strong>
                      </div>
                      <div>
                        <span>Access Lane</span>
                        <strong>{decoration.lane}</strong>
                      </div>
                      <div>
                        <span>Department / Office</span>
                        <strong>{detailsUser.department || 'Unassigned'}</strong>
                      </div>
                      <div>
                        <span>Account Source</span>
                        <strong>{detailsUser.role === 'student' ? 'Public registration' : 'Provisioned access'}</strong>
                      </div>
                      <div>
                        <span>Created</span>
                        <strong>{formatDate(detailsUser.createdAt)}</strong>
                      </div>
                      <div>
                        <span>Last Updated</span>
                        <strong>{formatDate(detailsUser.updatedAt)}</strong>
                      </div>
                      <div>
                        <span>Suspended At</span>
                        <strong>{formatDate(detailsUser.suspendedAt)}</strong>
                      </div>
                      <div>
                        <span>Suspended Until</span>
                        <strong>{detailsUser.suspendedUntil ? formatDateTime(detailsUser.suspendedUntil) : 'Manual restore'}</strong>
                      </div>
                      <div>
                        <span>User ID</span>
                        <strong>{detailsUser.id}</strong>
                      </div>
                    </section>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" type="button" onClick={() => setDetailsUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SystemAdminRoles() {
  const roles = [
    {
      role: 'System Administrator',
      level: 'Core Control',
      icon: 'fa-user-shield',
      color: '#1A1851', // Primary Dark
      bg: '#E0E7FF',
      badgeColor: '#B45309',
      badgeBg: '#FEF3C7', // Gold-ish
      allowed: ['Full system access', 'RBAC & User provisioning', 'Global settings & Branding', 'System maintenance'],
      restricted: ['No research monitoring workflow ownership']
    },
    {
      role: 'Research Head',
      level: 'Oversight',
      icon: 'fa-building-columns',
      color: '#003A8F', // Primary Navy
      bg: '#EFF6FF',
      badgeColor: '#003A8F',
      badgeBg: '#DBEAFE',
      allowed: ['Global user monitoring', 'Project & Approval pipelines', 'System-wide reporting', 'Final repository release'],
      restricted: ['No technical settings access', 'Cannot create Program Heads']
    },
    {
      role: 'Program Head',
      level: 'Departmental',
      icon: 'fa-sitemap',
      color: '#2563EB',
      bg: '#EFF6FF',
      badgeColor: '#2563EB',
      badgeBg: '#DBEAFE',
      allowed: ['Departmental academic monitoring', 'Create adviser accounts', 'Assign panelists'],
      restricted: ['No system settings', 'No cross-department access']
    },
    {
      role: 'Adviser / Panel',
      level: 'Academic',
      icon: 'fa-chalkboard-user',
      color: '#059669',
      bg: '#ECFDF5',
      badgeColor: '#059669',
      badgeBg: '#D1FAE5',
      allowed: ['Academic review & guidance', 'Evaluate defenses', 'Provide document feedback'],
      restricted: ['No system-level configuration', 'Restricted to assigned students']
    },
    {
      role: 'Library / Partner',
      level: 'External Support',
      icon: 'fa-handshake',
      color: '#7C3AED',
      bg: '#F5F3FF',
      badgeColor: '#7C3AED',
      badgeBg: '#EDE9FE',
      allowed: ['View approved research', 'Process IP / Tech Transfer (Partner)', 'Manage Repository (Library)'],
      restricted: ['No access to ongoing student drafts', 'No system settings']
    },
    {
      role: 'Student',
      level: 'End User',
      icon: 'fa-user-graduate',
      color: '#475569',
      bg: '#F1F5F9',
      badgeColor: '#475569',
      badgeBg: '#E2E8F0',
      allowed: ['Self-register account', 'Submit project proposals', 'Upload workflow files', 'Track defense progress'],
      restricted: ['No administrative access', 'Cannot view other groups']
    }
  ];

  return (
    <SystemAdminShell
      activeNav="roles"
      title="Roles and Permissions"
      description="Central RBAC matrix for technical access control and responsibility separation."
    >
      <div className="admin-page-stack">
        <section className="admin-section-head" style={{ padding: '0 0 1rem 0', borderBottom: 'none' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: '#111827' }}>Role-Based Access Control (RBAC)</h3>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.3rem' }}>System Admin owns technical role configuration. Research workflows stay with functional owners.</p>
          </div>
          <span className="status-badge" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '0.4rem 0.8rem' }}>Strict Separation Enforced</span>
        </section>

        <section className="admin-grid-3" style={{ gap: '1.5rem' }}>
          {roles.map((r) => (
            <article key={r.role} className="admin-impact-card" style={{ borderTop: `4px solid ${r.color}`, background: 'white', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 12px 24px rgba(15, 23, 42, 0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 32px rgba(15, 23, 42, 0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(15, 23, 42, 0.04)'; }}>
              
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
                  <i className={`fas ${r.icon}`}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.role}</h4>
                  <span className="status-badge" style={{ background: r.badgeBg, color: r.badgeColor, fontSize: '0.7rem', padding: '0.2rem 0.6rem', marginTop: '0.25rem', border: 'none', fontWeight: 700 }}>{r.level}</span>
                </div>
              </div>
              
              {/* Capabilities */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <strong style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capabilities</strong>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: '#334155' }}>
                  {r.allowed.map((allow, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', lineHeight: 1.4 }}>
                      <i className="fas fa-check" style={{ color: '#10B981', marginTop: '0.15rem', fontSize: '0.8rem' }}></i> 
                      <span>{allow}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Restrictions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px dashed #E2E8F0' }}>
                <strong style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Restrictions</strong>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: '#64748B' }}>
                  {r.restricted.map((restrict, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', lineHeight: 1.4 }}>
                      <i className="fas fa-xmark" style={{ color: '#EF4444', marginTop: '0.15rem', fontSize: '0.8rem' }}></i> 
                      <span>{restrict}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </article>
          ))}
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
  const configs = [
    { label: 'Active Departments', value: '5 Managed', meta: 'BSIT, BSMET, BSTCM, BSESM, BSNAME', icon: 'fa-building', color: '#003A8F' },
    { label: 'Academic Year', value: '2025-2026', meta: 'Current reporting period', icon: 'fa-calendar-days', color: '#1A1851' },
    { label: 'Approval Workflow', value: 'Standard', meta: 'Adviser → Program Head → Research Head', icon: 'fa-diagram-next', color: '#2563EB' },
    { label: 'Registration Policy', value: 'Self-Register', meta: 'Open for student accounts', icon: 'fa-user-plus', color: '#059669' }
  ];

  return (
    <SystemAdminShell
      activeNav="settings"
      title="System Settings"
      description="Technical configuration for departments, academic year, workflows, and account policies."
    >
      <div className="admin-page-stack" style={{ gap: '1.8rem' }}>
        
        {/* Config Summary Cards */}
        <section className="admin-grid-4">
          {configs.map((c) => (
            <article key={c.label} className="admin-impact-card" style={{ borderTop: `4px solid ${c.color}`, background: 'white', padding: '1.25rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', transition: 'transform 0.2s ease', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, fontSize: '1.1rem' }}>
                  <i className={`fas ${c.icon}`}></i>
                </div>
                <strong style={{ fontSize: '0.85rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</strong>
              </div>
              <strong style={{ display: 'block', fontSize: '1.35rem', color: '#111827', lineHeight: 1.1, marginBottom: '0.25rem' }}>{c.value}</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{c.meta}</span>
            </article>
          ))}
        </section>

        <section className="admin-split-grid">
          {/* Main Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <section className="admin-section-card" style={{ borderTop: '4px solid #003A8F', boxShadow: '0 15px 35px rgba(0, 58, 143, 0.08)' }}>
              <div className="admin-section-head">
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Core Configuration</h3>
                  <p>Global parameters that dictate the system's operational scope.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-form-grid">
                  <div className="form-field">
                    <label>Active Academic Year</label>
                    <select defaultValue="2025-2026" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <option>2025-2026</option>
                      <option>2026-2027</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Default Department Status</label>
                    <select defaultValue="Active" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <option>Active (Onboarding allowed)</option>
                      <option>Inactive (Locked)</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-section-card" style={{ borderTop: '4px solid #F6BE00', boxShadow: '0 15px 35px rgba(0, 58, 143, 0.08)' }}>
              <div className="admin-section-head">
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Workflow & Identity Policies</h3>
                  <p>Determine how users register and how documents are routed.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-form-grid">
                  <div className="form-field">
                    <label>Student Registration</label>
                    <select defaultValue="Self-register enabled" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <option>Self-register enabled (Open)</option>
                      <option>Closed (Invite only)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Workflow Routing Template</label>
                    <select defaultValue="Standard research workflow" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <option>Standard (Adviser → Prog Head → Res Head)</option>
                      <option>Accelerated (Adviser → Res Head)</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Side Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <section className="admin-section-card" style={{ background: 'linear-gradient(135deg, #1A1851, #003A8F)', color: 'white', border: 'none', boxShadow: '0 15px 35px rgba(0, 58, 143, 0.15)' }}>
              <div className="admin-section-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.8rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#F6BE00' }}>
                  <i className="fas fa-shield-halved"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: 'white' }}>Commit Changes</h3>
                  <p style={{ color: '#93C5FD', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>Saving these settings will immediately affect system routing, identity provisioning, and access policies.</p>
                </div>
                <button className="btn" style={{ background: '#F6BE00', color: '#1A1851', border: 'none', padding: '0.9rem', borderRadius: '0.8rem', fontWeight: 800, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 8px 16px rgba(246, 190, 0, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <i className="fas fa-floppy-disk"></i> Apply Configuration
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminLogs() {
  const logs = [
    { event: 'RBAC policy checked', actor: 'System Admin', detail: 'Route /system-admin/users allowed', time: 'Today 10:12 AM', status: 'approved', icon: 'fa-shield-check' },
    { event: 'Research Head denied technical route', actor: 'Proxy', detail: 'Redirected to /admin/dashboard', time: 'Today 9:44 AM', status: 'warning', icon: 'fa-triangle-exclamation' },
    { event: 'Backup completed', actor: 'Scheduler', detail: 'Database snapshot created', time: 'Today 2:10 AM', status: 'approved', icon: 'fa-database' },
    { event: 'Public registration completed', actor: 'Student', detail: 'New student account created through self-register', time: 'Yesterday 4:18 PM', status: 'info', icon: 'fa-user-plus' }
  ];

  return (
    <SystemAdminShell
      activeNav="logs"
      title="Logs and Security"
      description="Audit and security activity for authentication, RBAC, backups, and configuration."
    >
      <div className="admin-page-stack" style={{ gap: '1.8rem' }}>
        <section className="admin-grid-4">
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-file-shield" style={{ color: '#F6BE00' }}></i> Audit Events
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>1,248</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Last 30 days</span>
          </article>
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-ban" style={{ color: '#F87171' }}></i> Denied Access
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>12</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Blocked by route policy</span>
          </article>
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-user-shield" style={{ color: '#F6BE00' }}></i> Privileged Users
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>3</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>System Admin accounts</span>
          </article>
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-key" style={{ color: '#34D399' }}></i> Password Resets
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>7</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Last 30 days</span>
          </article>
        </section>

        <section className="admin-section-card" style={{ borderTop: '4px solid #F6BE00', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.08)' }}>
          <div className="admin-section-head">
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Security Activity Log</h3>
              <p>System logs are technical records and remain outside Research Head access.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button className="btn btn-outline small" style={{ border: '1px solid #E5E7EB', color: '#003A8F' }}>
                <i className="fas fa-filter"></i> Filter
              </button>
              <button className="btn btn-outline small" style={{ border: '1px solid #E5E7EB', color: '#003A8F' }}>
                <i className="fas fa-file-export"></i> Export Logs
              </button>
            </div>
          </div>
          
          <div className="admin-section-body" style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem 0', borderBottom: i === logs.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <div style={{ width: '2.8rem', height: '2.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: log.status === 'warning' ? '#FEF3C7' : log.status === 'approved' ? '#DCFCE7' : '#EFF6FF', color: log.status === 'warning' ? '#D97706' : log.status === 'approved' ? '#16A34A' : '#2563EB', fontSize: '1.1rem', flexShrink: 0 }}>
                    <i className={`fas ${log.icon}`}></i>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ color: '#111827', fontSize: '0.95rem' }}>{log.event}</strong>
                      <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>{log.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.1rem' }}>
                      <span className="admin-inline-badge" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                        <i className="fas fa-user" style={{ marginRight: '0.3rem', color: '#94A3B8' }}></i>
                        {log.actor}
                      </span>
                      <span style={{ color: '#475569', fontSize: '0.85rem' }}>{log.detail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SystemAdminShell>
  );
}

export function SystemAdminBackups() {
  const backups = [
    { file: 'backup-2026-05-01-0210.sql', status: 'Completed', size: '2.4 GB', created: 'Today 2:10 AM' },
    { file: 'backup-2026-04-30-0210.sql', status: 'Completed', size: '2.3 GB', created: 'Apr 30, 2026' },
    { file: 'backup-2026-04-29-0210.sql', status: 'Completed', size: '2.3 GB', created: 'Apr 29, 2026' },
    { file: 'backup-2026-04-28-0210.sql', status: 'Verified', size: '2.3 GB', created: 'Apr 28, 2026' }
  ];

  return (
    <SystemAdminShell
      activeNav="backups"
      title="Backup and Restore"
      description="Technical database backup and restore controls owned by System Admin."
    >
      <div className="admin-page-stack" style={{ gap: '1.8rem' }}>
        <section className="admin-grid-4">
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-database" style={{ color: '#F6BE00' }}></i> Backup Policy
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>Daily</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Automated at 2:10 AM</span>
          </article>
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-clock-rotate-left" style={{ color: '#38BDF8' }}></i> Retention
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>30 Days</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Rolling backup window</span>
          </article>
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-hard-drive" style={{ color: '#F87171' }}></i> Storage Used
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>71%</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Backup storage pool</span>
          </article>
          <article className="admin-kpi-card" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)' }}>
            <span className="admin-kpi-label" style={{ color: '#DBEAFE' }}>
              <i className="fas fa-shield" style={{ color: '#34D399' }}></i> Restore Test
            </span>
            <strong className="admin-kpi-value" style={{ color: 'white' }}>Passed</strong>
            <span className="admin-kpi-meta" style={{ color: '#93C5FD' }}>Latest restore verification</span>
          </article>
        </section>

        <section className="admin-section-card" style={{ borderTop: '4px solid #003A8F', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.08)' }}>
          <div className="admin-section-head">
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Backup Catalog</h3>
              <p>Restore actions require System Administrator access.</p>
            </div>
            <div className="admin-action-row">
              <button className="btn" style={{ background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600, border: 'none', boxShadow: '0 4px 10px rgba(0, 58, 143, 0.2)' }}>
                <i className="fas fa-plus" style={{ marginRight: '0.4rem' }}></i>
                Run Manual Backup
              </button>
              <button className="btn btn-outline" style={{ border: '1px solid #E5E7EB', color: '#003A8F', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600 }}>
                <i className="fas fa-upload" style={{ marginRight: '0.4rem' }}></i>
                Restore Custom
              </button>
            </div>
          </div>
          
          <div className="table-scroll" style={{ padding: '0 1.25rem 1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Snapshot File</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Size</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Created</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b, i) => (
                  <tr key={b.file} style={{ borderBottom: i === backups.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <i className="fas fa-file-zipper" style={{ color: '#94A3B8', fontSize: '1.2rem' }}></i>
                        <span style={{ color: '#003A8F', fontWeight: 600, fontSize: '0.95rem' }}>{b.file}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className="status-badge" style={{ background: b.status === 'Completed' ? '#DCFCE7' : '#EFF6FF', color: b.status === 'Completed' ? '#16A34A' : '#2563EB', fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: '1px solid transparent' }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#475569', fontSize: '0.9rem' }}>{b.size}</td>
                    <td style={{ padding: '1rem 0.5rem', color: '#475569', fontSize: '0.9rem' }}>{b.created}</td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <button className="btn btn-outline small" style={{ border: '1px solid #E5E7EB', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '0.4rem' }}>
                        <i className="fas fa-download"></i>
                      </button>
                    </td>
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
      <div className="admin-page-stack" style={{ gap: '1.8rem' }}>
        
        {/* Hero Control Banner */}
        <section className="admin-impact-card" style={{ 
          background: enabled ? 'linear-gradient(135deg, #7F1D1D, #450A0A)' : 'linear-gradient(135deg, #003A8F, #1A1851)', 
          color: 'white', padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          border: 'none', boxShadow: enabled ? '0 15px 40px rgba(127, 29, 29, 0.4)' : '0 15px 35px rgba(0, 58, 143, 0.15)',
          transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden', borderRadius: '1.5rem'
        }}>
          {enabled && <div style={{ position: 'absolute', inset: 0, border: '4px solid #EF4444', animation: 'pulse 2s infinite', opacity: 0.3, pointerEvents: 'none' }}></div>}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1 }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', color: enabled ? '#FCA5A5' : '#F6BE00' }}>
              <i className={`fas ${enabled ? 'fa-lock' : 'fa-satellite-dish'}`}></i>
            </div>
            <div>
              <h2 style={{ fontSize: '2rem', margin: '0 0 0.3rem 0', color: 'white', fontWeight: 800 }}>
                {enabled ? 'System Offline' : 'System Online'}
              </h2>
              <p style={{ margin: 0, fontSize: '1rem', color: enabled ? '#FECACA' : '#93C5FD' }}>
                {enabled ? 'Users are currently blocked from all workflows.' : 'All role portals are available under the current RBAC rules.'}
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setEnabled(!enabled)}
            style={{ zIndex: 1, padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', transition: 'transform 0.2s',
              background: enabled ? 'white' : '#F6BE00', color: enabled ? '#7F1D1D' : '#1A1851', boxShadow: enabled ? '0 8px 20px rgba(0,0,0,0.2)' : '0 8px 20px rgba(246, 190, 0, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <i className={`fas ${enabled ? 'fa-unlock' : 'fa-power-off'}`}></i>
            {enabled ? 'Restore Access' : 'Initiate Lockdown'}
          </button>
        </section>

        <section className="admin-grid-2">
          {/* Scheduling */}
          <section className="admin-section-card" style={{ borderTop: '4px solid #F6BE00', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.08)' }}>
            <div className="admin-section-head">
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Maintenance Window</h3>
                <p>Schedule and configure the public message shown during downtime.</p>
              </div>
            </div>
            <div className="admin-section-body">
              <div className="admin-form-grid">
                <div className="form-field">
                  <label>Start Time</label>
                  <input type="datetime-local" defaultValue="2026-05-03T22:00" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
                </div>
                <div className="form-field">
                  <label>End Time</label>
                  <input type="datetime-local" defaultValue="2026-05-04T01:00" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Public Interruption Message</label>
                  <textarea defaultValue="Thesis Track is temporarily unavailable for scheduled maintenance." style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', minHeight: '100px', resize: 'vertical' }} />
                </div>
              </div>
            </div>
          </section>

          {/* Exceptions */}
          <section className="admin-section-card" style={{ borderTop: '4px solid #003A8F', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.08)' }}>
            <div className="admin-section-head">
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#111827' }}>Active Exceptions</h3>
                <p>Functions that remain operational during a lockdown.</p>
              </div>
            </div>
            <div className="admin-section-body" style={{ padding: '0 1.25rem 1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {[
                  { name: 'System Administrator Login', icon: 'fa-user-shield', color: '#003A8F' }, 
                  { name: 'Backup and Restore Console', icon: 'fa-database', color: '#003A8F' }, 
                  { name: 'Security & Audit Logs', icon: 'fa-file-shield', color: '#003A8F' }, 
                  { name: 'System Settings', icon: 'fa-sliders', color: '#003A8F' }
                ].map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`fas ${item.icon}`}></i>
                      </div>
                      <strong style={{ color: '#334155', fontSize: '0.95rem' }}>{item.name}</strong>
                    </div>
                    <span className="status-badge" style={{ background: '#DCFCE7', color: '#16A34A', border: 'none', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      <i className="fas fa-check" style={{ marginRight: '0.3rem' }}></i> Allowed
                    </span>
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
