'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { SystemAdminShell } from '@/components/system-admin/system-admin-shell';
import { AdminDialog, AdminPage, EmptyState, KpiCard, SectionCard } from '@/components/system-admin/ui';
import { getStoredUser } from '@/lib/mock/auth';
// Same status banner as the System Admin dashboard (the portal's main page style).
import bannerStyles from './system-admin-dashboard.module.css';
import styles from './system-admin-users.module.css';

/* ---------- Types (shape of /api/users) ---------- */

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
  | 'library'
  | 'focal_person';

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

type ApiResponse = {
  success?: boolean;
  message?: string;
  users?: ManagedUser[];
  user?: ManagedUser;
  fieldErrors?: Record<string, string>;
};

type StaffRole = 'system_admin' | 'research_head' | 'program_head' | 'adviser' | 'panel' | 'focal_person' | 'library' | 'partner';

type AccountForm = {
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  department: string;
  password: string;
  confirmPassword: string;
};

type RoleTone = 'technical' | 'oversight' | 'academic' | 'workflow' | 'external' | 'student' | 'legacy';
type StatusFilter = 'all' | 'active' | 'suspended';
type SortKey = 'newest' | 'oldest' | 'name';
type Notice = { tone: 'success' | 'warning'; text: string };

type AccountDialog = { mode: 'create' } | { mode: 'edit'; user: ManagedUser };
type AccessDialog = { mode: 'suspend' | 'restore'; user: ManagedUser };

/* ---------- Role metadata ---------- */

const ROLE_META: Record<ApiUserRole, { label: string; plural: string; icon: string; tone: RoleTone; lane: string }> = {
  system_admin: { label: 'System Administrator', plural: 'System Admins', icon: 'fa-server', tone: 'technical', lane: 'Technical control' },
  research_head: { label: 'Research Head', plural: 'Research Heads', icon: 'fa-building-columns', tone: 'oversight', lane: 'Research oversight' },
  program_head: { label: 'Program Head', plural: 'Program Heads', icon: 'fa-user-tie', tone: 'academic', lane: 'Department management' },
  adviser: { label: 'Adviser', plural: 'Advisers', icon: 'fa-chalkboard-user', tone: 'academic', lane: 'Academic review' },
  panel: { label: 'Panelist', plural: 'Panelists', icon: 'fa-clipboard-check', tone: 'academic', lane: 'Defense evaluation' },
  focal_person: { label: 'Research Focal Person', plural: 'Focal Persons', icon: 'fa-user-tag', tone: 'oversight', lane: 'Department research monitoring' },
  student: { label: 'Student', plural: 'Students', icon: 'fa-user-graduate', tone: 'student', lane: 'Student workspace' },
  library: { label: 'Library Personnel', plural: 'Library', icon: 'fa-book-open-reader', tone: 'workflow', lane: 'Repository workflow' },
  tech_transfer: { label: 'Tech Transfer Officer', plural: 'Tech Transfer', icon: 'fa-arrow-up-right-dots', tone: 'workflow', lane: 'Transfer workflow' },
  partner: { label: 'Industry Partner', plural: 'Partners', icon: 'fa-handshake', tone: 'external', lane: 'External partner' },
  admin: { label: 'Legacy Admin', plural: 'Legacy Admins', icon: 'fa-user-shield', tone: 'legacy', lane: 'Legacy access' }
};

/** Order of the role tabs. */
const ROLE_ORDER: ApiUserRole[] = [
  'student',
  'adviser',
  'panel',
  'focal_person',
  'program_head',
  'research_head',
  'system_admin',
  'library',
  'tech_transfer',
  'partner',
  'admin'
];

/** Roles the System Admin can create or edit here (mirrors POST/PATCH /api/users). */
const STAFF_ROLES: { value: StaffRole; description: string }[] = [
  { value: 'program_head', description: 'Manages a department: advisers, defenses, and its research focal person.' },
  { value: 'adviser', description: 'Supervises groups and reviews their submissions.' },
  { value: 'panel', description: 'Evaluates and votes in defenses.' },
  { value: 'focal_person', description: "Monitors one department's research: progress, delayed groups, defenses, and reports." },
  { value: 'research_head', description: 'Research oversight across departments; no technical settings.' },
  { value: 'library', description: 'Validates and archives repository records.' },
  { value: 'partner', description: 'External collaboration, matching, and deployment feedback.' },
  { value: 'system_admin', description: 'Platform settings, access control, logs, and backups.' }
];

const DEPARTMENT_SUGGESTIONS = ['BSIT', 'BSMET', 'BSTCM', 'BSESM', 'BSNAME', 'Research Office', 'Library', 'IT Office'];

/** Keys must match SUSPENSION_DURATION_MS in /api/users/[id]/suspension. */
const SUSPENSION_DURATIONS = [
  { key: '1m', label: '1 minute (test)' },
  { key: '1h', label: '1 hour' },
  { key: '6h', label: '6 hours' },
  { key: '24h', label: '1 day' },
  { key: '7d', label: '1 week' },
  { key: '30d', label: '30 days' },
  { key: 'indefinite', label: 'Until restored' }
];

const PAGE_SIZE = 15;

const todayFormat = new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' });
const PASSWORD_MIN_LENGTH = 8;

const EMPTY_FORM: AccountForm = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'program_head',
  department: '',
  password: '',
  confirmPassword: ''
};

/* ---------- Helpers ---------- */

const isStaffRole = (role: ApiUserRole): role is StaffRole => STAFF_ROLES.some((item) => item.value === role);

async function readJson(response: Response): Promise<ApiResponse | null> {
  return (response.headers.get('content-type') || '').includes('application/json') ? ((await response.json()) as ApiResponse) : null;
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {})
  }).format(date);
}

function initials(user: Pick<ManagedUser, 'name' | 'firstName' | 'lastName'>) {
  const source = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
  return (
    source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'
  );
}

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return value ? Math.max(score, 1) : 0;
}

const STRENGTH_LABELS = ['Not set', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

function generatePassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const pick = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  const chars = [...sets.map(pick), ...Array.from({ length: 8 }, () => pick(all))];

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }

  return chars.join('');
}

function RolePill({ role }: { role: ApiUserRole }) {
  const meta = ROLE_META[role];
  return (
    <span className={`${styles.rolePill} ${styles[`tone_${meta.tone}`]}`}>
      <i className={`fas ${meta.icon}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function StatusBadge({ user }: { user: ManagedUser }) {
  return user.isSuspended ? (
    <span className={`${styles.status} ${styles.statusSuspended}`}>
      <i className="fas fa-user-slash" aria-hidden="true" />
      Suspended
    </span>
  ) : (
    <span className={`${styles.status} ${styles.statusActive}`}>
      <i className="fas fa-circle-check" aria-hidden="true" />
      Active
    </span>
  );
}

/* ---------- Page ---------- */

export function SystemAdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const today = useMemo(() => todayFormat.format(new Date()), []);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | ApiUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  const [details, setDetails] = useState<ManagedUser | null>(null);
  const [accountDialog, setAccountDialog] = useState<AccountDialog | null>(null);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessDialog, setAccessDialog] = useState<AccessDialog | null>(null);
  const [duration, setDuration] = useState('24h');
  const [accessError, setAccessError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    setViewerId(stored?.id != null ? String(stored.id) : null);
  }, []);

  const loadUsers = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);

    try {
      const response = await fetch('/api/users', { cache: 'no-store', credentials: 'same-origin' });
      const payload = await readJson(response);
      if (!response.ok || !payload?.success || !payload.users) {
        throw new Error(payload?.message || 'The user directory could not be loaded.');
      }
      setUsers(payload.users);
      setLoadError('');
      setLastLoadedAt(new Date());
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'The user directory could not be loaded.';
      if (mode === 'refresh') setNotice({ tone: 'warning', text: message });
      else setLoadError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* ---------- Derived data ---------- */

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const suspended = users.filter((user) => user.isSuspended);
    return {
      total: users.length,
      students: users.filter((user) => user.role === 'student').length,
      active: users.length - suspended.length,
      suspended: suspended.length,
      manualRestore: suspended.filter((user) => !user.suspendedUntil).length,
      newThisWeek: users.filter((user) => user.createdAt && new Date(user.createdAt).getTime() >= weekAgo).length
    };
  }, [users]);

  const roleCounts = useMemo(() => {
    const counts = new Map<ApiUserRole, number>();
    users.forEach((user) => counts.set(user.role, (counts.get(user.role) ?? 0) + 1));
    return counts;
  }, [users]);

  const departments = useMemo(
    () => Array.from(new Set(users.map((user) => user.department || 'Unassigned'))).sort((a, b) => a.localeCompare(b)),
    [users]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter === 'active' && user.isSuspended) return false;
      if (statusFilter === 'suspended' && !user.isSuspended) return false;
      if (departmentFilter !== 'all' && (user.department || 'Unassigned') !== departmentFilter) return false;
      if (!needle) return true;
      return [user.name, user.email, user.department, user.studentId].some((value) => (value || '').toLowerCase().includes(needle));
    });

    return list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      const diff = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      return sort === 'oldest' ? diff : -diff;
    });
  }, [departmentFilter, query, roleFilter, sort, statusFilter, users]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(query || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all');

  // Any filter change goes back to the first page.
  useEffect(() => setPage(1), [query, roleFilter, statusFilter, departmentFilter, sort]);

  const clearFilters = () => {
    setQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDepartmentFilter('all');
  };

  const replaceUser = (user: ManagedUser) => {
    setUsers((current) => current.map((item) => (item.id === user.id ? user : item)));
    setDetails((current) => (current?.id === user.id ? user : current));
  };

  /* ---------- Create / edit ---------- */

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setShowPassword(false);
    setAccountDialog({ mode: 'create' });
  };

  const openEdit = (user: ManagedUser) => {
    if (!isStaffRole(user.role)) return;
    const [first = '', ...rest] = user.name.split(/\s+/);
    setForm({
      firstName: user.firstName || first,
      lastName: user.lastName || rest.join(' '),
      email: user.email,
      role: user.role,
      department: user.department || '',
      password: '',
      confirmPassword: ''
    });
    setFieldErrors({});
    setFormError('');
    setShowPassword(false);
    setDetails(null);
    setAccountDialog({ mode: 'edit', user });
  };

  const updateField = (field: keyof AccountForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const isEditing = accountDialog?.mode === 'edit';
  const editingSelf = accountDialog?.mode === 'edit' && accountDialog.user.id === viewerId;
  const score = passwordScore(form.password);
  const passwordMismatch = Boolean(form.confirmPassword && form.password !== form.confirmPassword);
  const passwordRequired = !isEditing;
  const canSubmitAccount =
    Boolean(form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.department.trim()) &&
    (passwordRequired ? form.password.length >= PASSWORD_MIN_LENGTH : !form.password || form.password.length >= PASSWORD_MIN_LENGTH) &&
    !passwordMismatch &&
    (!form.password || Boolean(form.confirmPassword));

  const submitAccount = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!accountDialog || !canSubmitAccount) return;
    setBusy(true);
    setFormError('');

    const body = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      role: form.role,
      department: form.department.trim(),
      ...(form.password ? { password: form.password, confirmPassword: form.confirmPassword } : {})
    };

    try {
      const response = await fetch(accountDialog.mode === 'edit' ? `/api/users/${accountDialog.user.id}` : '/api/users', {
        method: accountDialog.mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });
      const payload = await readJson(response);

      if (!response.ok || !payload?.success || !payload.user) {
        setFieldErrors(payload?.fieldErrors || {});
        setFormError(payload?.message || 'The server rejected this account.');
        return;
      }

      const saved = payload.user;
      if (accountDialog.mode === 'edit') replaceUser(saved);
      else setUsers((current) => [saved, ...current]);
      setAccountDialog(null);
      setNotice({
        tone: 'success',
        text: payload.message || (accountDialog.mode === 'edit' ? `${saved.name} was updated.` : `${saved.name} can now sign in.`)
      });
    } catch (error) {
      setFormError(error instanceof Error && error.message ? error.message : 'The account could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Suspend / restore ---------- */

  const openAccess = (user: ManagedUser, mode: AccessDialog['mode']) => {
    setDuration('24h');
    setAccessError('');
    setDetails(null);
    setAccessDialog({ user, mode });
  };

  const submitAccess = async () => {
    if (!accessDialog) return;
    const suspend = accessDialog.mode === 'suspend';
    const choice = SUSPENSION_DURATIONS.find((item) => item.key === duration);
    setBusy(true);
    setAccessError('');

    try {
      const response = await fetch(`/api/users/${accessDialog.user.id}/suspension`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(suspend ? { suspended: true, durationKey: choice?.key, durationLabel: choice?.label } : { suspended: false })
      });
      const payload = await readJson(response);

      if (!response.ok || !payload?.success || !payload.user) {
        setAccessError(payload?.message || 'The server rejected this request.');
        return;
      }

      replaceUser(payload.user);
      setAccessDialog(null);
      setNotice({
        tone: 'success',
        text: payload.message || (suspend ? `${payload.user.name} was suspended.` : `${payload.user.name} was restored.`)
      });
    } catch (error) {
      setAccessError(error instanceof Error && error.message ? error.message : 'The request could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Render ---------- */


  const rowActions = (user: ManagedUser) => {
    const isSelf = user.id === viewerId;
    return (
      <div className={styles.rowActions}>
        <button type="button" className={styles.iconButton} onClick={() => setDetails(user)} aria-label={`View ${user.name}`} title="View details">
          <i className="fas fa-eye" aria-hidden="true" />
        </button>
        {isStaffRole(user.role) ? (
          <button type="button" className={styles.iconButton} onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`} title="Edit account">
            <i className="fas fa-pen" aria-hidden="true" />
          </button>
        ) : null}
        {isSelf ? null : user.isSuspended ? (
          <button type="button" className={styles.smallButton} onClick={() => openAccess(user, 'restore')}>
            <i className="fas fa-rotate-left" aria-hidden="true" />
            Restore
          </button>
        ) : (
          <button type="button" className={`${styles.smallButton} ${styles.smallDanger}`} onClick={() => openAccess(user, 'suspend')}>
            <i className="fas fa-user-slash" aria-hidden="true" />
            Suspend
          </button>
        )}
      </div>
    );
  };

  return (
    <SystemAdminShell activeNav="users" title="User Management" description="Provision staff accounts and control access.">
      <AdminPage>
        <section className={bannerStyles.banner} aria-label="Directory status">
          <div className={bannerStyles.bannerLead}>
            <span className={`${bannerStyles.liveBadge} ${loadError ? bannerStyles.liveBadgeOff : ''}`}>
              <span className={bannerStyles.liveDot} aria-hidden="true" />
              {loading ? 'Loading directory' : loadError ? 'Directory unavailable' : 'Directory is live'}
            </span>
            <span className={bannerStyles.bannerDate}>{today}</span>
          </div>

          <dl className={bannerStyles.bannerStats}>
            <div className={bannerStyles.bannerStat}>
              <dt>
                <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                Last refreshed
              </dt>
              <dd className={lastLoadedAt ? undefined : bannerStyles.statMuted}>{lastLoadedAt ? timeFormat.format(lastLoadedAt) : '—'}</dd>
            </div>
            <div className={bannerStyles.bannerStat}>
              <dt>
                <i className="fas fa-user-graduate" aria-hidden="true" />
                Students
              </dt>
              <dd>Self-register</dd>
            </div>
            <div className={bannerStyles.bannerStat}>
              <dt>
                <i className="fas fa-chalkboard-user" aria-hidden="true" />
                Advisers by
              </dt>
              <dd>Program Heads</dd>
            </div>
            <div className={bannerStyles.bannerStat}>
              <dt>
                <i className="fas fa-id-badge" aria-hidden="true" />
                You can create
              </dt>
              <dd>{STAFF_ROLES.length} staff roles</dd>
            </div>
          </dl>

          <div className={bannerStyles.bannerActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => void loadUsers('refresh')} disabled={refreshing || loading}>
              <i className={`fas ${refreshing ? 'fa-spinner fa-spin' : 'fa-rotate'}`} aria-hidden="true" />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className={styles.primaryButton} onClick={openCreate}>
              <i className="fas fa-user-plus" aria-hidden="true" />
              Create staff account
            </button>
          </div>
        </section>

        {notice ? (
          <div className={`${styles.notice} ${notice.tone === 'warning' ? styles.noticeWarning : ''}`} role={notice.tone === 'warning' ? 'alert' : 'status'}>
            <i className={`fas ${notice.tone === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`} aria-hidden="true" />
            <span>{notice.text}</span>
            <button type="button" className={styles.noticeClose} onClick={() => setNotice(null)} aria-label="Dismiss message">
              <i className="fas fa-xmark" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <section className={styles.kpiGrid} aria-label="Account summary">
          <KpiCard label="Total users" icon="fa-users" value={String(stats.total)} helper={`${stats.students} students · ${stats.total - stats.students} staff`} />
          <KpiCard
            label="Active accounts"
            icon="fa-user-check"
            iconTone="success"
            value={String(stats.active)}
            meter={stats.total ? (stats.active / stats.total) * 100 : 0}
            helper={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% can sign in`}
          />
          <KpiCard
            label="Suspended"
            icon="fa-user-slash"
            iconTone={stats.suspended ? 'error' : 'accent'}
            accent="accent"
            valueTone={stats.suspended ? 'error' : 'default'}
            value={String(stats.suspended)}
            helper={stats.suspended ? `${stats.manualRestore} need a manual restore` : 'No accounts on hold'}
          />
          <KpiCard
            label="New this week"
            icon="fa-user-plus"
            iconTone="accent"
            accent="accent"
            value={String(stats.newThisWeek)}
            helper="Created in the last 7 days"
          />
        </section>

        <SectionCard
          title="Account directory"
          description="Search, filter, and manage every account."
          icon="fa-address-book"
          titleId="users-directory"
          action={<span className={styles.countBadge}>{filtered.length} shown</span>}
        >
          <div className={styles.roleTabs} role="group" aria-label="Filter by role">
            <button type="button" className={roleFilter === 'all' ? styles.roleTabActive : styles.roleTab} aria-pressed={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>
              All <span>{users.length}</span>
            </button>
            {ROLE_ORDER.filter((role) => roleCounts.get(role)).map((role) => (
              <button
                key={role}
                type="button"
                className={roleFilter === role ? styles.roleTabActive : styles.roleTab}
                aria-pressed={roleFilter === role}
                onClick={() => setRoleFilter(role)}
              >
                <i className={`fas ${ROLE_META[role].icon}`} aria-hidden="true" />
                {ROLE_META[role].plural} <span>{roleCounts.get(role)}</span>
              </button>
            ))}
          </div>

          <div className={styles.toolbar}>
            <label className={`${styles.field} ${styles.searchField}`}>
              <span>Search</span>
              <span className={styles.searchInput}>
                <i className="fas fa-magnifying-glass" aria-hidden="true" />
                <input type="search" placeholder="Name, email, department, or student ID" value={query} onChange={(event) => setQuery(event.target.value)} />
              </span>
            </label>
            <label className={styles.field}>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Department / office</span>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </label>
            {hasFilters ? (
              <button type="button" className={styles.linkButton} onClick={clearFilters}>
                <i className="fas fa-filter-circle-xmark" aria-hidden="true" />
                Clear filters
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className={styles.loading} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              Loading accounts…
            </div>
          ) : loadError ? (
            <div className={styles.loadError}>
              <EmptyState icon="fa-triangle-exclamation" message={loadError} />
              <button type="button" className={styles.secondaryButton} onClick={() => void loadUsers('refresh')}>
                <i className="fas fa-rotate" aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : filtered.length ? (
            <>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">User</th>
                      <th scope="col">Role</th>
                      <th scope="col">Department / office</th>
                      <th scope="col">Status</th>
                      <th scope="col">Created</th>
                      <th scope="col" className={styles.actionsHead}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((user) => (
                      <tr key={user.id} className={user.isSuspended ? styles.rowSuspended : undefined}>
                        <td>
                          <div className={styles.userCell}>
                            <span className={`${styles.avatar} ${styles[`tone_${ROLE_META[user.role].tone}`]}`} aria-hidden="true">
                              {initials(user)}
                            </span>
                            <span className={styles.userText}>
                              <span className={styles.userName}>
                                {user.name}
                                {user.id === viewerId ? <span className={styles.youTag}>You</span> : null}
                              </span>
                              <span className={styles.muted}>{user.email}</span>
                            </span>
                          </div>
                        </td>
                        <td data-label="Role">
                          <RolePill role={user.role} />
                        </td>
                        <td data-label="Department">
                          <span className={styles.cellMain}>{user.department || 'Unassigned'}</span>
                          {user.studentId ? <span className={styles.muted}>ID {user.studentId}</span> : null}
                        </td>
                        <td data-label="Status">
                          <StatusBadge user={user} />
                          {user.isSuspended ? (
                            <span className={styles.muted}>{user.suspendedUntil ? `Until ${formatDate(user.suspendedUntil, true)}` : 'Until restored'}</span>
                          ) : null}
                        </td>
                        <td data-label="Created">
                          <span className={styles.cellMain}>{formatDate(user.createdAt)}</span>
                        </td>
                        <td className={styles.actionsCell}>{rowActions(user)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <span className={styles.muted}>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                {pageCount > 1 ? (
                  <div className={styles.pageButtons}>
                    <button type="button" className={styles.iconButton} onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
                      <i className="fas fa-chevron-left" aria-hidden="true" />
                    </button>
                    <span className={styles.pageLabel}>
                      Page {currentPage} of {pageCount}
                    </span>
                    <button type="button" className={styles.iconButton} onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Next page">
                      <i className="fas fa-chevron-right" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className={styles.loadError}>
              <EmptyState icon="fa-user-magnifying-glass" message="No accounts match these filters." />
              {hasFilters ? (
                <button type="button" className={styles.secondaryButton} onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
          )}
        </SectionCard>
      </AdminPage>

      {/* ---------- Details ---------- */}
      <AdminDialog
        open={Boolean(details)}
        titleId="user-details-title"
        title="Account details"
        onClose={() => setDetails(null)}
        footer={
          details ? (
            <>
              {details.id !== viewerId ? (
                details.isSuspended ? (
                  <button type="button" className={styles.secondaryButton} onClick={() => openAccess(details, 'restore')}>
                    <i className="fas fa-rotate-left" aria-hidden="true" />
                    Restore
                  </button>
                ) : (
                  <button type="button" className={styles.dangerButton} onClick={() => openAccess(details, 'suspend')}>
                    <i className="fas fa-user-slash" aria-hidden="true" />
                    Suspend
                  </button>
                )
              ) : null}
              {isStaffRole(details.role) ? (
                <button type="button" className={styles.primaryButton} onClick={() => openEdit(details)}>
                  <i className="fas fa-pen" aria-hidden="true" />
                  Edit account
                </button>
              ) : (
                <button type="button" className={styles.primaryButton} onClick={() => setDetails(null)} data-autofocus>
                  Close
                </button>
              )}
            </>
          ) : null
        }
      >
        {details ? (
          <div className={styles.details}>
            <div className={styles.detailsHero}>
              <span className={`${styles.avatarLarge} ${styles[`tone_${ROLE_META[details.role].tone}`]}`} aria-hidden="true">
                {initials(details)}
              </span>
              <div className={styles.userText}>
                <span className={styles.detailsName}>
                  {details.name}
                  {details.id === viewerId ? <span className={styles.youTag}>You</span> : null}
                </span>
                <span className={styles.muted}>{details.email}</span>
                <span className={styles.detailsPills}>
                  <RolePill role={details.role} />
                  <StatusBadge user={details} />
                </span>
              </div>
            </div>
            <dl className={styles.detailsGrid}>
              <div>
                <dt>Access lane</dt>
                <dd>{ROLE_META[details.role].lane}</dd>
              </div>
              <div>
                <dt>Department / office</dt>
                <dd>{details.department || 'Unassigned'}</dd>
              </div>
              {details.role === 'student' ? (
                <>
                  <div>
                    <dt>Student ID</dt>
                    <dd>{details.studentId || '—'}</dd>
                  </div>
                  <div>
                    <dt>Year level</dt>
                    <dd>{details.yearLevel || '—'}</dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt>Account source</dt>
                <dd>{details.role === 'student' ? 'Self-registered' : 'Created by an administrator'}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(details.createdAt, true)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatDate(details.updatedAt, true)}</dd>
              </div>
              {details.isSuspended ? (
                <>
                  <div>
                    <dt>Suspended on</dt>
                    <dd>{formatDate(details.suspendedAt, true)}</dd>
                  </div>
                  <div>
                    <dt>Suspended until</dt>
                    <dd>{details.suspendedUntil ? formatDate(details.suspendedUntil, true) : 'Until restored'}</dd>
                  </div>
                </>
              ) : null}
              <div className={styles.detailsWide}>
                <dt>User ID</dt>
                <dd className={styles.mono}>{details.id}</dd>
              </div>
            </dl>
            {details.role === 'student' ? (
              <p className={styles.hint}>
                <i className="fas fa-circle-info" aria-hidden="true" />
                Students manage their own profile, so student accounts can only be suspended or restored here.
              </p>
            ) : null}
          </div>
        ) : null}
      </AdminDialog>

      {/* ---------- Create / edit ---------- */}
      <AdminDialog
        open={Boolean(accountDialog)}
        titleId="user-account-title"
        title={isEditing ? 'Edit staff account' : 'Create staff account'}
        description={
          isEditing
            ? 'Update the name, email, role, or department. Leave the password blank to keep the current one.'
            : 'The account is active right away. Share the temporary password with the user privately.'
        }
        size="lg"
        busy={busy}
        onClose={() => setAccountDialog(null)}
        footer={
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => setAccountDialog(null)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="user-account-form" className={styles.primaryButton} disabled={busy || !canSubmitAccount}>
              {busy ? <span className={styles.spinnerSmall} aria-hidden="true" /> : <i className={`fas ${isEditing ? 'fa-check' : 'fa-user-plus'}`} aria-hidden="true" />}
              {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Create account'}
            </button>
          </>
        }
      >
        <form id="user-account-form" className={styles.form} onSubmit={(event) => void submitAccount(event)} noValidate>
          <fieldset className={styles.field}>
            <legend>Role</legend>
            {editingSelf ? (
              <p className={styles.hint}>
                <i className="fas fa-lock" aria-hidden="true" />
                You can&rsquo;t change your own role. Ask another System Administrator.
              </p>
            ) : null}
            <div className={styles.rolePicker}>
              {STAFF_ROLES.map((option) => {
                const meta = ROLE_META[option.value];
                const checked = form.role === option.value;
                return (
                  <label key={option.value} className={`${styles.roleOption} ${checked ? styles.roleOptionActive : ''} ${editingSelf && !checked ? styles.roleOptionDisabled : ''}`}>
                    <input
                      type="radio"
                      name="user-role"
                      value={option.value}
                      checked={checked}
                      disabled={editingSelf && !checked}
                      onChange={() => updateField('role', option.value)}
                    />
                    <span className={`${styles.roleIcon} ${styles[`tone_${meta.tone}`]}`} aria-hidden="true">
                      <i className={`fas ${meta.icon}`} />
                    </span>
                    <span className={styles.roleOptionText}>
                      <strong>{meta.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            {fieldErrors.role ? <small className={styles.fieldError}>{fieldErrors.role}</small> : null}
          </fieldset>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>First name</span>
              <input data-autofocus autoComplete="off" value={form.firstName} aria-invalid={Boolean(fieldErrors.firstName)} onChange={(event) => updateField('firstName', event.target.value)} />
              {fieldErrors.firstName ? <small className={styles.fieldError}>{fieldErrors.firstName}</small> : null}
            </label>
            <label className={styles.field}>
              <span>Last name</span>
              <input autoComplete="off" value={form.lastName} aria-invalid={Boolean(fieldErrors.lastName)} onChange={(event) => updateField('lastName', event.target.value)} />
              {fieldErrors.lastName ? <small className={styles.fieldError}>{fieldErrors.lastName}</small> : null}
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Email</span>
              <input type="email" autoComplete="off" value={form.email} aria-invalid={Boolean(fieldErrors.email)} onChange={(event) => updateField('email', event.target.value)} />
              {fieldErrors.email ? <small className={styles.fieldError}>{fieldErrors.email}</small> : null}
            </label>
            <label className={styles.field}>
              <span>Department / office</span>
              <input
                list="user-department-options"
                placeholder={form.role === 'focal_person' ? 'Program code, e.g. BSIT' : 'e.g. BSIT, Research Office'}
                value={form.department}
                aria-invalid={Boolean(fieldErrors.department)}
                onChange={(event) => updateField('department', event.target.value)}
              />
              <datalist id="user-department-options">
                {Array.from(new Set([...DEPARTMENT_SUGGESTIONS, ...departments.filter((item) => item !== 'Unassigned')])).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              {fieldErrors.department ? (
                <small className={styles.fieldError}>{fieldErrors.department}</small>
              ) : form.role === 'focal_person' ? (
                <small className={styles.fieldHint}>Their Focal Person workspace shows this department.</small>
              ) : null}
            </label>
          </div>

          <div className={styles.passwordPanel}>
            <div className={styles.passwordHead}>
              <span>
                <strong>{isEditing ? 'New temporary password' : 'Temporary password'}</strong>
                <small>{isEditing ? 'Optional. Only fill this in to reset the password.' : `At least ${PASSWORD_MIN_LENGTH} characters.`}</small>
              </span>
              <button
                type="button"
                className={styles.smallButton}
                onClick={() => {
                  const password = generatePassword();
                  setForm((current) => ({ ...current, password, confirmPassword: password }));
                  setShowPassword(true);
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.password;
                    delete next.confirmPassword;
                    return next;
                  });
                }}
              >
                <i className="fas fa-wand-magic-sparkles" aria-hidden="true" />
                Generate
              </button>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>Password</span>
                <span className={styles.passwordInput}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    aria-invalid={Boolean(fieldErrors.password)}
                    onChange={(event) => updateField('password', event.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                  </button>
                </span>
                {fieldErrors.password ? <small className={styles.fieldError}>{fieldErrors.password}</small> : null}
              </label>
              <label className={styles.field}>
                <span>Confirm password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  aria-invalid={passwordMismatch || Boolean(fieldErrors.confirmPassword)}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                />
                {passwordMismatch ? <small className={styles.fieldError}>Passwords do not match.</small> : null}
                {fieldErrors.confirmPassword && !passwordMismatch ? <small className={styles.fieldError}>{fieldErrors.confirmPassword}</small> : null}
              </label>
            </div>
            <div className={styles.meterRow}>
              <span className={styles.meter} aria-hidden="true">
                <span className={styles[`meter${score}`]} style={{ width: `${score * 20}%` }} />
              </span>
              <small>Strength: {STRENGTH_LABELS[score]}</small>
            </div>
          </div>

          {formError ? (
            <p className={styles.formError} role="alert">
              <i className="fas fa-circle-exclamation" aria-hidden="true" />
              {formError}
            </p>
          ) : null}
          {/* Lets Enter submit from any field. */}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      </AdminDialog>

      {/* ---------- Suspend / restore ---------- */}
      <AdminDialog
        open={Boolean(accessDialog)}
        titleId="user-access-title"
        tone={accessDialog?.mode === 'suspend' ? 'danger' : 'default'}
        title={accessDialog?.mode === 'suspend' ? 'Suspend account' : 'Restore account'}
        description={accessDialog ? `${accessDialog.user.name} · ${ROLE_META[accessDialog.user.role].label}` : undefined}
        busy={busy}
        onClose={() => setAccessDialog(null)}
        footer={
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => setAccessDialog(null)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className={accessDialog?.mode === 'suspend' ? styles.dangerSolidButton : styles.primaryButton}
              onClick={() => void submitAccess()}
              disabled={busy}
              data-autofocus={accessDialog?.mode === 'restore' ? true : undefined}
            >
              {busy ? <span className={styles.spinnerSmall} aria-hidden="true" /> : null}
              {busy ? 'Saving…' : accessDialog?.mode === 'suspend' ? 'Suspend account' : 'Restore access'}
            </button>
          </>
        }
      >
        {accessDialog?.mode === 'suspend' ? (
          <div className={styles.form}>
            <p className={styles.dialogText}>They are signed out and can&rsquo;t sign in until the suspension ends. They get an email about it.</p>
            <fieldset className={styles.field}>
              <legend>Suspend for</legend>
              <div className={styles.durationGrid}>
                {SUSPENSION_DURATIONS.map((item, index) => (
                  <label key={item.key} className={duration === item.key ? styles.durationActive : styles.duration}>
                    <input
                      type="radio"
                      name="suspension-duration"
                      value={item.key}
                      checked={duration === item.key}
                      onChange={() => setDuration(item.key)}
                      data-autofocus={index === 0 ? true : undefined}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>
            {accessError ? (
              <p className={styles.formError} role="alert">
                <i className="fas fa-circle-exclamation" aria-hidden="true" />
                {accessError}
              </p>
            ) : null}
          </div>
        ) : accessDialog ? (
          <div className={styles.form}>
            <p className={styles.dialogText}>They can sign in again right away and get an email that their access is back.</p>
            {accessError ? (
              <p className={styles.formError} role="alert">
                <i className="fas fa-circle-exclamation" aria-hidden="true" />
                {accessError}
              </p>
            ) : null}
          </div>
        ) : null}
      </AdminDialog>
    </SystemAdminShell>
  );
}
