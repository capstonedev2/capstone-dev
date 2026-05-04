'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';
import { ProgramHeadButton, ProgramHeadCardSection, ProgramHeadDrawer, ProgramHeadStatCard, ProgramHeadStatusBadge } from '@/components/program-head/program-head-primitives';

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

type BannerState = {
  tone: 'success' | 'warning';
  title: string;
  body: string;
};

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  role: ApiUserRole;
  department: string;
  studentId: string;
  yearLevel: string;
  password: string;
  confirmPassword: string;
};

const ROLE_OPTIONS: Array<{
  value: ApiUserRole;
  label: string;
  description: string;
}> = [
  { value: 'student', label: 'Student', description: 'Student portal access and thesis submission workspace.' },
  { value: 'adviser', label: 'Adviser', description: 'Faculty adviser review and guidance tools.' },
  { value: 'panel', label: 'Panelist', description: 'Panel review access for evaluations and defense workflows.' },
  { value: 'program_head', label: 'Program Head', description: 'Program-level approval and oversight access.' },
  { value: 'library', label: 'Library', description: 'Repository release and archival access.' },
  { value: 'partner', label: 'Partner', description: 'Industry partner view for collaborations and feedback.' },
  { value: 'tech_transfer', label: 'Tech Transfer', description: 'Deployment and commercialization workflow access.' },
  { value: 'research_head', label: 'Research Head', description: 'Research oversight and analytics access.' },
  { value: 'system_admin', label: 'System Administrator', description: 'Technical system configuration and maintenance access.' },
  { value: 'admin', label: 'Legacy Admin', description: 'Legacy research administrator role retained for compatibility.' }
];


const YEAR_LEVEL_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];

const EMPTY_FORM: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'adviser',
  department: '',
  studentId: '',
  yearLevel: '',
  password: '',
  confirmPassword: ''
};

function roleLabel(role: ApiUserRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function roleDescription(role: ApiUserRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.description ?? 'Account access is managed through the assigned role.';
}

function formatDate(value?: string) {
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

function getDirectoryId(user: ManagedUser) {
  return user.studentId || user.id.slice(0, 8).toUpperCase();
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

function getProfileState(user: ManagedUser) {
  const missingFields: string[] = [];

  if (!user.department) {
    missingFields.push('department');
  }

  if (user.role === 'student') {
    if (!user.studentId) {
      missingFields.push('student ID');
    }

    if (!user.yearLevel) {
      missingFields.push('year level');
    }
  }

  if (!missingFields.length) {
    return {
      label: 'Ready',
      tone: 'status-approved',
      note: user.role === 'student' ? 'Student profile is complete.' : 'Account profile is complete.',
      missingFields
    };
  }

  return {
    label: 'Needs details',
    tone: 'status-pending',
    note: `Missing ${missingFields.join(', ')}.`,
    missingFields
  };
}

async function parseApiPayload<T>(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return null;
}

export function ProgramHeadUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | ApiUserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<{ mode: 'create' } | { mode: 'edit'; userId: string } | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
        throw new Error(payload?.message || 'Unable to load the user directory right now.');
      }

      setUsers(payload.users);
      setBanner(null);
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'Unable to load the user directory',
        body:
          error instanceof Error && error.message
            ? error.message
            : 'The page could not load user records from the server.'
      });
    } finally {
      if (mode === 'initial') {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);



  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.studentId || '').toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchQuery, users]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => !user.isSuspended).length;
  const suspendedUsers = users.filter((user) => user.isSuspended).length;
  const accountsNeedingAttention = users.filter((user) => getProfileState(user).missingFields.length > 0).length;
  const recentlyAdded = users.filter((user) => {
    if (!user.createdAt) {
      return false;
    }

    const createdAt = new Date(user.createdAt);
    return Date.now() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const statCards = [
    {
      label: 'Total Accounts',
      value: totalUsers,
      meta: `${filteredUsers.length} shown in current view`,
      icon: 'fas fa-users'
    },
    {
      label: 'Active Accounts',
      value: activeUsers,
      meta: 'Can sign in and use portals',
      icon: 'fas fa-user-check'
    },
    {
      label: 'Suspended',
      value: suspendedUsers,
      meta: suspendedUsers ? 'Blocked at login' : 'None suspended',
      icon: 'fas fa-user-slash'
    },
    {
      label: 'Needs Attention',
      value: accountsNeedingAttention,
      meta: recentlyAdded ? `${recentlyAdded} added this month` : 'No recent additions',
      icon: 'fas fa-exclamation-triangle'
    }
  ];

  const isStudentRole = form.role === 'student';

  const openCreateModal = () => {
    setModalState({ mode: 'create' });
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const openEditModal = (user: ManagedUser) => {
    setModalState({ mode: 'edit', userId: user.id });
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      department: user.department || '',
      studentId: user.studentId || '',
      yearLevel: user.yearLevel || '',
      password: '',
      confirmPassword: ''
    });
    setFieldErrors({});
  };

  const closeModal = () => {
    setModalState(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const updateFormField = (field: keyof UserFormState, value: string) => {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value
      };

      if (field === 'role' && value !== 'student') {
        next.studentId = '';
        next.yearLevel = '';
      }

      return next;
    });

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = modalState?.mode === 'edit' ? `/api/users/${modalState.userId}` : '/api/users';
      const method = modalState?.mode === 'edit' ? 'PATCH' : 'POST';
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        department: form.department.trim(),
        studentId: form.studentId.trim(),
        yearLevel: form.yearLevel.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      const result = await parseApiPayload<UserMutationResponse>(response);

      if (!response.ok || !result?.success || !result.user) {
        setFieldErrors(result?.fieldErrors || {});
        setBanner({
          tone: 'warning',
          title: modalState?.mode === 'edit' ? 'Unable to update the account' : 'Unable to create the account',
          body: result?.message || 'The server rejected this request.'
        });
        return;
      }

      const savedUser = result.user;

      setUsers((current) => {
        if (modalState?.mode === 'edit') {
          return current.map((user) => (user.id === savedUser.id ? savedUser : user));
        }

        return [savedUser, ...current];
      });
      setBanner({
        tone: 'success',
        title: modalState?.mode === 'edit' ? 'Account updated' : 'Account created',
        body: result.message || `${savedUser.name} is now available in the directory.`
      });
      closeModal();
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: modalState?.mode === 'edit' ? 'Unable to update the account' : 'Unable to create the account',
        body:
          error instanceof Error && error.message
            ? error.message
            : 'The request could not be completed.'
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
      const result = await parseApiPayload<UserMutationResponse>(response);

      if (!response.ok || !result?.success || !result.user) {
        setBanner({
          tone: 'warning',
          title: suspended ? 'Unable to suspend the account' : 'Unable to restore the account',
          body: result?.message || 'The server rejected this request.'
        });
        return;
      }

      const updatedUser = result.user;

      setUsers((current) =>
        current.map((currentUser) => (currentUser.id === updatedUser.id ? updatedUser : currentUser))
      );
      setBanner({
        tone: 'success',
        title: suspended ? 'Account suspended' : 'Account restored',
        body: result.message || `${user.name} has been updated.`
      });
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: suspended ? 'Unable to suspend the account' : 'Unable to restore the account',
        body:
          error instanceof Error && error.message
            ? error.message
            : 'The request could not be completed.'
      });
    } finally {
      setActiveSuspensionUserId(null);
    }
  };

  return (
    <>
      <ProgramHeadShell
        activeNav="users"
        title="Adviser Accounts"
        description="Create and manage adviser accounts while keeping student records view-only under the department."
      >
        <div className="ph-page-content">
          {banner ? (
            <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm mb-2 animate-in slide-in-from-top ${
              banner.tone === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                  banner.tone === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <i className={`fas ${banner.tone === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-lg`}></i>
                </div>
                <div>
                  <strong className="text-sm font-bold block">{banner.title}</strong>
                  <p className="text-sm opacity-80 m-0">{banner.body}</p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-lg bg-white/60 hover:bg-white text-current flex items-center justify-center transition-all hover:shadow-sm"
                type="button"
                onClick={() => setBanner(null)}
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          ) : null}

          {/* Premium Filter Bar */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200/60 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center relative overflow-hidden group/toolbar">
            {/* Subtle decorative background glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-500 group-hover/toolbar:scale-150"></div>
            
            {/* Search Input */}
            <div className="w-full md:w-[22rem] relative z-10">
              <div className="relative group/search">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <i className="fas fa-search text-slate-400 group-focus-within/search:text-[#003a8f] transition-colors"></i>
                </div>
                <input
                  id="user-search"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50/80 border border-slate-200/60 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#003a8f]/30 focus:ring-4 focus:ring-[#003a8f]/10 outline-none transition-all shadow-sm hover:bg-slate-50"
                  placeholder="Search name, email, or ID..."
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <i className="fas fa-times-circle text-sm"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-56 relative z-10 flex items-center">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <i className="fas fa-filter text-slate-400 group-focus-within:text-[#003a8f] transition-colors"></i>
              </div>
              <select
                id="user-role-filter"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50/80 border border-slate-200/60 text-sm font-bold text-slate-700 focus:bg-white focus:border-[#003a8f]/30 focus:ring-4 focus:ring-[#003a8f]/10 outline-none cursor-pointer transition-all shadow-sm hover:bg-slate-50 appearance-none"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as 'all' | ApiUserRole)}
              >
                <option value="all">All roles</option>
                {ROLE_OPTIONS.filter((r) => r.value === 'student' || r.value === 'adviser').map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <i className="fas fa-chevron-down text-slate-400 text-[10px]"></i>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full md:w-auto flex items-center justify-end gap-2.5 ml-auto z-10">
              {(roleFilter !== 'all' || searchQuery) && (
                <button
                  className="h-11 px-4 rounded-xl bg-rose-50/50 border border-rose-100 text-sm font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200"
                  type="button"
                  onClick={() => {
                    setRoleFilter('all');
                    setSearchQuery('');
                  }}
                >
                  <i className="fas fa-eraser text-xs"></i> Clear
                </button>
              )}
              
              <button
                className="h-11 w-11 md:w-auto md:px-4 rounded-xl bg-white border border-slate-200/60 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#003a8f] hover:border-[#003a8f]/20 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 group/refresh"
                type="button"
                title="Refresh Directory"
                onClick={() => void loadUsers('refresh')}
                disabled={isRefreshing}
              >
                <i className={`fas fa-sync-alt text-xs ${isRefreshing ? 'animate-spin text-[#003a8f]' : 'group-hover/refresh:rotate-180 transition-transform duration-500'}`}></i>
                <span className="hidden md:inline">{isRefreshing ? 'Loading...' : 'Refresh'}</span>
              </button>
              
              <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

              <button
                className="h-11 px-5 bg-gradient-to-r from-[#003a8f] to-[#002660] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 overflow-hidden relative group/add border border-transparent hover:border-blue-500/30"
                type="button"
                onClick={openCreateModal}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/add:translate-y-0 transition-transform duration-300 ease-out"></div>
                <i className="fas fa-user-plus relative z-10 text-blue-100"></i> 
                <span className="relative z-10 tracking-wide">Add Adviser</span>
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card) => (
              <ProgramHeadStatCard key={card.label} title={card.label} value={card.value} note={card.meta} icon={card.icon} />
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
                  <i className="fas fa-address-book text-[#003a8f]"></i> Directory
                </h3>
                <p className="text-sm text-slate-500 m-0 mt-1">{filteredUsers.length} accounts match the current filters.</p>
              </div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#003a8f] text-xs font-bold ring-1 ring-[#003a8f]/10">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live Prisma records
              </span>
            </div>
            <div className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <i className="fas fa-spinner fa-spin text-3xl text-[#003a8f] mb-4"></i>
                  <p className="text-sm font-medium text-slate-500">Loading the user directory...</p>
                </div>
              ) : filteredUsers.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
                      <tr>
                        <th className="px-6 py-4 border-b border-slate-100">User</th>
                        <th className="px-6 py-4 border-b border-slate-100">Role</th>
                        <th className="px-6 py-4 border-b border-slate-100">Department</th>
                        <th className="px-6 py-4 border-b border-slate-100">Directory ID</th>
                        <th className="px-6 py-4 border-b border-slate-100">Status</th>
                        <th className="px-6 py-4 border-b border-slate-100">Profile</th>
                        <th className="px-6 py-4 border-b border-slate-100">Updated</th>
                        <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((user) => {
                        const profileState = getProfileState(user);

                        return (
                          <tr key={user.id} className="group transition-all duration-200 hover:bg-blue-50/30">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white" aria-hidden="true">
                                  {getInitials(user)}
                                </div>
                                <div>
                                  <strong className="text-sm font-bold text-slate-800 block group-hover:text-[#003a8f] transition-colors">{user.name}</strong>
                                  <span className="text-xs text-slate-500">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#003a8f] text-xs font-bold ring-1 ring-[#003a8f]/10">
                                {roleLabel(user.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {user.department ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100">
                                  {user.department}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{getDirectoryId(user)}</code>
                              <span className="block text-[11px] text-slate-400 mt-1">{user.role === 'student' ? 'Student record' : 'System record'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                                user.isSuspended
                                  ? 'bg-red-50 text-red-700 border border-red-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'}`}></span>
                                {user.isSuspended ? 'Suspended' : 'Active'}
                              </span>
                              <span className="block text-[11px] text-slate-400 mt-1">
                                {user.isSuspended && user.suspendedAt
                                  ? `Since ${formatDate(user.suspendedAt)}`
                                  : 'Login allowed'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                                profileState.missingFields.length === 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                <i className={`fas ${profileState.missingFields.length === 0 ? 'fa-check-circle' : 'fa-clock'} text-[10px]`}></i>
                                {profileState.label}
                              </span>
                              <span className="block text-[11px] text-slate-400 mt-1">{profileState.note}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{formatDate(user.updatedAt)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end opacity-0 transition-all duration-200 group-hover:opacity-100 focus-within:opacity-100 translate-x-2 group-hover:translate-x-0">
                                <button
                                  className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 transition-all hover:bg-[#003A8F] hover:text-white hover:-translate-y-0.5 hover:shadow-md"
                                  type="button"
                                  disabled={user.role !== 'adviser'}
                                  onClick={() => user.role === 'adviser' && openEditModal(user)}
                                >
                                  <i className={`fas ${user.role === 'adviser' ? 'fa-pen' : 'fa-eye'} text-[10px]`}></i> {user.role === 'adviser' ? 'Edit' : 'View Only'}
                                </button>
                                <button
                                  className={`flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-md ${user.isSuspended ? 'bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white'}`}
                                  type="button"
                                  disabled={user.role !== 'adviser' || activeSuspensionUserId === user.id}
                                  onClick={() => void handleSuspensionToggle(user, !user.isSuspended)}
                                >
                                  {activeSuspensionUserId === user.id
                                    ? user.isSuspended
                                      ? <i className="fas fa-spinner fa-spin text-[10px]"></i>
                                      : <i className="fas fa-spinner fa-spin text-[10px]"></i>
                                    : user.isSuspended
                                      ? <><i className="fas fa-undo text-[10px]"></i> Restore</>
                                      : <><i className="fas fa-ban text-[10px]"></i> Suspend</>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                    <i className="fas fa-users-slash text-3xl text-slate-300"></i>
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-slate-800">No accounts found</h4>
                  <p className="max-w-sm text-sm text-slate-500">
                    We couldn't find any users matching your current search or filters. Try adjusting them or add a new user.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ProgramHeadShell>

      <ProgramHeadDrawer open={!!modalState} title={modalState?.mode === 'edit' ? 'Edit Adviser Account' : 'Add Adviser Account'} onClose={closeModal} maxWidth={650}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Section: Identity --- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/50">
                <i className="fas fa-user text-xl" aria-hidden="true" />
              </div>
              <div>
                <h4 className="m-0 text-base font-bold text-slate-800">Personal Information</h4>
                <p className="m-0 mt-1 text-sm text-slate-500">Full name and institutional email address.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="ph-form-field">
                <label htmlFor="user-first-name">First Name</label>
                <input
                  id="user-first-name"
                  className="ph-input"
                  placeholder="e.g. Juan"
                  aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
                  value={form.firstName}
                  onChange={(event) => updateFormField('firstName', event.target.value)}
                />
                {fieldErrors.firstName ? <span className="ph-field-error"><i className="fas fa-circle-exclamation" aria-hidden="true" /> {fieldErrors.firstName}</span> : null}
              </div>
              <div className="ph-form-field">
                <label htmlFor="user-last-name">Last Name</label>
                <input
                  id="user-last-name"
                  className="ph-input"
                  placeholder="e.g. Dela Cruz"
                  aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
                  value={form.lastName}
                  onChange={(event) => updateFormField('lastName', event.target.value)}
                />
                {fieldErrors.lastName ? <span className="ph-field-error"><i className="fas fa-circle-exclamation" aria-hidden="true" /> {fieldErrors.lastName}</span> : null}
              </div>
              <div className="ph-form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="user-email">Email Address</label>
                <div className="ph-input-icon-wrap">
                  <i className="fas fa-envelope" aria-hidden="true" />
                  <input
                    id="user-email"
                    className="ph-input"
                    type="email"
                    placeholder="juan.delacruz@university.edu.ph"
                    aria-invalid={fieldErrors.email ? 'true' : 'false'}
                    value={form.email}
                    onChange={(event) => updateFormField('email', event.target.value)}
                  />
                </div>
                {fieldErrors.email ? <span className="ph-field-error"><i className="fas fa-circle-exclamation" aria-hidden="true" /> {fieldErrors.email}</span> : null}
              </div>
            </div>
          </div>

          {/* --- Section: Access --- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100/50">
                <i className="fas fa-shield-halved text-xl" aria-hidden="true" />
              </div>
              <div>
                <h4 className="m-0 text-base font-bold text-slate-800">Portal Role</h4>
                <p className="m-0 mt-1 text-sm text-slate-500">Portal access level.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="ph-form-field">
                <label htmlFor="user-role">Portal Role</label>
                <select
                  id="user-role"
                  className="ph-select"
                  value={form.role}
                  onChange={(event) => updateFormField('role', event.target.value)}
                >
                  {ROLE_OPTIONS.filter((roleOption) =>
                    roleOption.value === 'adviser' ||
                    (modalState?.mode === 'edit' && roleOption.value === form.role)
                  ).map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <span className="ph-role-hint">
                  <i className="fas fa-info-circle" aria-hidden="true" /> {roleDescription(form.role)}
                </span>
              </div>
            </div>
          </div>

          {/* --- Section: Student Details (conditional) --- */}
          {isStudentRole ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50">
                  <i className="fas fa-id-card text-xl" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="m-0 text-base font-bold text-slate-800">Student Profile</h4>
                  <p className="m-0 mt-1 text-sm text-slate-500">Academic record identifiers for the student portal.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="ph-form-field">
                  <label htmlFor="user-student-id">Student ID</label>
                  <input
                    id="user-student-id"
                    className="ph-input"
                    placeholder="e.g. 2024-00123"
                    aria-invalid={fieldErrors.studentId ? 'true' : 'false'}
                    value={form.studentId}
                    onChange={(event) => updateFormField('studentId', event.target.value)}
                  />
                  {fieldErrors.studentId ? <span className="ph-field-error"><i className="fas fa-circle-exclamation" aria-hidden="true" /> {fieldErrors.studentId}</span> : null}
                </div>
                <div className="ph-form-field">
                  <label htmlFor="user-year-level">Year Level</label>
                  <select
                    id="user-year-level"
                    className="ph-select"
                    aria-invalid={fieldErrors.yearLevel ? 'true' : 'false'}
                    value={form.yearLevel}
                    onChange={(event) => updateFormField('yearLevel', event.target.value)}
                  >
                    <option value="">Select year level</option>
                    {YEAR_LEVEL_OPTIONS.map((yearLevel) => (
                      <option key={yearLevel} value={yearLevel}>
                        {yearLevel}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.yearLevel ? <span className="ph-field-error"><i className="fas fa-circle-exclamation" aria-hidden="true" /> {fieldErrors.yearLevel}</span> : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* --- Section: Credentials --- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100/50">
                <i className="fas fa-lock text-xl" aria-hidden="true" />
              </div>
              <div>
                <h4 className="m-0 text-base font-bold text-slate-800">{modalState?.mode === 'edit' ? 'Change Password' : 'Account Credentials'}</h4>
                <p className="m-0 mt-1 text-sm text-slate-500">
                  {modalState?.mode === 'edit' ? 'Leave blank to keep the current password.' : 'Set a temporary password for the first login.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="ph-form-field">
                <label htmlFor="user-password">
                  {modalState?.mode === 'edit' ? 'New Password' : 'Temporary Password'}
                </label>
                <div className="ph-input-icon-wrap">
                  <i className="fas fa-key" aria-hidden="true" />
                  <input
                    id="user-password"
                    className="ph-input"
                    type="password"
                    placeholder="Min. 6 characters"
                    aria-invalid={fieldErrors.password ? 'true' : 'false'}
                    value={form.password}
                    onChange={(event) => updateFormField('password', event.target.value)}
                  />
                </div>
                {fieldErrors.password ? <span className="ph-field-error"><i className="fas fa-circle-exclamation" aria-hidden="true" /> {fieldErrors.password}</span> : null}
              </div>
              <div className="ph-form-field">
                <label htmlFor="user-confirm-password">Confirm Password</label>
                <div className="ph-input-icon-wrap">
                  <i className="fas fa-key" aria-hidden="true" />
                  <input
                    id="user-confirm-password"
                    className="ph-input"
                    type="password"
                    placeholder="Re-enter password"
                    aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                    value={form.confirmPassword}
                    onChange={(event) => updateFormField('confirmPassword', event.target.value)}
                  />
                </div>
                {fieldErrors.confirmPassword ? <span className="ph-field-error"><i className="fas fa-circle-exclamation" aria-hidden="true" /> {fieldErrors.confirmPassword}</span> : null}
              </div>
            </div>
          </div>

          {/* --- Footer Actions --- */}
          <div className="sticky bottom-0 -mx-8 -mb-8 mt-8 flex items-center justify-end gap-3 border-t border-slate-100 bg-white/80 px-8 py-5 backdrop-blur-md">
            <button className="flex h-11 items-center justify-center rounded-xl px-5 font-bold text-slate-600 transition-colors hover:bg-slate-100" type="button" onClick={closeModal}>
              Cancel
            </button>
            <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#003A8F] px-6 font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg focus:ring-4 focus:ring-blue-500/30" type="submit" disabled={isSaving}>
              <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : modalState?.mode === 'edit' ? 'fa-save' : 'fa-user-plus'}`} aria-hidden="true" />
              {isSaving
                ? modalState?.mode === 'edit'
                  ? 'Saving...'
                  : 'Creating...'
                : modalState?.mode === 'edit'
                  ? 'Save Changes'
                  : 'Create User'}
            </button>
          </div>
        </form>
      </ProgramHeadDrawer>
    </>
  );
}
