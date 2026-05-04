'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'research_head';
  firstName?: string | null;
  lastName?: string | null;
  department?: string | null;
  isSuspended?: boolean;
  suspendedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type AuthMeResponse = {
  success?: boolean;
  user?: AuthUser;
  message?: string;
};

type UserDirectoryResponse = {
  success?: boolean;
  users?: Array<{
    role: string;
    isSuspended?: boolean;
  }>;
  message?: string;
};

type UserMutationResponse = {
  success?: boolean;
  message?: string;
  user?: AuthUser;
  fieldErrors?: Record<string, string>;
};

type BannerState = {
  tone: 'success' | 'warning';
  title: string;
  body: string;
};

type EditProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
};

type ChangePasswordForm = {
  password: string;
  confirmPassword: string;
};

type OversightMetrics = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  students: number;
};

const EMPTY_METRICS: OversightMetrics = {
  totalUsers: 0,
  activeUsers: 0,
  suspendedUsers: 0,
  students: 0
};

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

function getInitials(user: Pick<AuthUser, 'firstName' | 'lastName' | 'name'>) {
  const source = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

async function parseApiPayload<T>(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return null;
}

export function AdminProfile() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [metrics, setMetrics] = useState<OversightMetrics>(EMPTY_METRICS);
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
    department: ''
  });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    password: '',
    confirmPassword: ''
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const [meResponse, usersResponse] = await Promise.all([
        fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'same-origin'
        }),
        fetch('/api/users', {
          cache: 'no-store',
          credentials: 'same-origin'
        })
      ]);

      const mePayload = await parseApiPayload<AuthMeResponse>(meResponse);
      const usersPayload = await parseApiPayload<UserDirectoryResponse>(usersResponse);

      if (!meResponse.ok || !mePayload?.success || !mePayload.user) {
        throw new Error(mePayload?.message || 'Unable to load the current admin profile.');
      }

      setUser(mePayload.user);
      setEditForm({
        firstName: mePayload.user.firstName || '',
        lastName: mePayload.user.lastName || '',
        email: mePayload.user.email,
        department: mePayload.user.department || 'Research Head Office'
      });

      if (usersResponse.ok && usersPayload?.success && usersPayload.users) {
        const totalUsers = usersPayload.users.length;
        const suspendedUsers = usersPayload.users.filter((entry) => entry.isSuspended).length;
        const activeUsers = totalUsers - suspendedUsers;
        const students = usersPayload.users.filter((entry) => entry.role === 'student').length;

        setMetrics({
          totalUsers,
          activeUsers,
          suspendedUsers,
          students
        });
      }

      setBanner(null);
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'Unable to load the admin profile',
        body:
          error instanceof Error && error.message
            ? error.message
            : 'The profile data could not be loaded.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const profileSummary = useMemo(() => {
    if (!user) {
      return [];
    }

    return [
      { label: 'Email', value: user.email },
      { label: 'Office', value: user.department || 'Research Head Office' },
      { label: 'Role', value: 'Research Head' },
      { label: 'Member Since', value: formatDate(user.createdAt) },
      { label: 'Last Updated', value: formatDate(user.updatedAt) },
      { label: 'Account Status', value: user.isSuspended ? 'Suspended' : 'Active' }
    ];
  }, [user]);

  const oversightCards = [
    {
      label: 'Accounts Managed',
      value: metrics.totalUsers,
      note: 'Total accounts available in the portal directory.'
    },
    {
      label: 'Active Accounts',
      value: metrics.activeUsers,
      note: 'Accounts currently allowed to authenticate.'
    },
    {
      label: 'Suspended Accounts',
      value: metrics.suspendedUsers,
      note: 'Accounts currently blocked from login and session checks.'
    },
    {
      label: 'Student Records',
      value: metrics.students,
      note: 'Student workspace profiles in the active directory.'
    }
  ];

  const openEditModal = () => {
    if (!user) {
      return;
    }

    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      department: user.department || 'Research Head Office'
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const openPasswordModal = () => {
    setPasswordForm({
      password: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setPasswordOpen(true);
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim(),
          department: editForm.department.trim(),
          role: user.role
        })
      });

      const result = await parseApiPayload<UserMutationResponse>(response);

      if (!response.ok || !result?.success || !result.user) {
        setEditErrors(result?.fieldErrors || {});
        setBanner({
          tone: 'warning',
          title: 'Unable to update the profile',
          body: result?.message || 'The server rejected this request.'
        });
        return;
      }

      setUser(result.user);
      setEditOpen(false);
      setBanner({
        tone: 'success',
        title: 'Profile updated',
        body: result.message || 'Your admin profile was updated successfully.'
      });
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'Unable to update the profile',
        body:
          error instanceof Error && error.message
            ? error.message
            : 'The request could not be completed.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          firstName: user.firstName || user.name,
          lastName: user.lastName || 'Research Head',
          email: user.email,
          department: user.department || 'Research Head Office',
          role: user.role,
          password: passwordForm.password,
          confirmPassword: passwordForm.confirmPassword
        })
      });

      const result = await parseApiPayload<UserMutationResponse>(response);

      if (!response.ok || !result?.success || !result.user) {
        setPasswordErrors(result?.fieldErrors || {});
        setBanner({
          tone: 'warning',
          title: 'Unable to change the password',
          body: result?.message || 'The server rejected this request.'
        });
        return;
      }

      setUser(result.user);
      setPasswordForm({
        password: '',
        confirmPassword: ''
      });
      setPasswordOpen(false);
      setBanner({
        tone: 'success',
        title: 'Password updated',
        body: result.message || 'Your admin password was updated successfully.'
      });
    } catch (error) {
      setBanner({
        tone: 'warning',
        title: 'Unable to change the password',
        body:
          error instanceof Error && error.message
            ? error.message
            : 'The request could not be completed.'
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <>
      <AdminShell
        activeNav="profile"
        title="Research Head Profile"
        description="Review your account details and research oversight scope."
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

          {isLoading ? (
            <section className="admin-section-card">
              <div className="admin-empty-state">Loading the admin profile...</div>
            </section>
          ) : user ? (
            <>
              <div className="admin-profile-layout">
                <section className="admin-section-card">
                  <div className="admin-section-body admin-profile-summary">
                    <span className="admin-profile-avatar" aria-hidden="true">
                      {getInitials(user)}
                    </span>
                    <h2>{user.name}</h2>
                    <div className="admin-action-row">
                      <span className="admin-inline-badge">Research Head</span>
                      <span className={`status-badge ${user.isSuspended ? 'status-critical' : 'status-approved'}`}>
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    <p>{user.email}</p>
                    <p>{user.department || 'Research Head Office'}</p>
                    <div className="admin-action-row">
                      <button className="btn btn-primary" type="button" onClick={openEditModal}>
                        Edit Profile
                      </button>
                      <button className="btn btn-outline" type="button" onClick={openPasswordModal}>
                        Change Password
                      </button>
                    </div>
                  </div>
                </section>

                <section className="admin-section-card">
                  <div className="admin-section-head">
                    <div>
                      <h3>Account Details</h3>
                      <p>Administrative identity and access details used across the portal.</p>
                    </div>
                  </div>
                  <div className="admin-section-body">
                    <div className="admin-profile-detail-grid">
                      {profileSummary.map((item) => (
                        <div key={item.label} className="admin-profile-detail-item">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <section className="admin-grid-4">
                {oversightCards.map((card) => (
                  <article key={card.label} className="admin-kpi-card">
                    <span className="admin-kpi-label">{card.label}</span>
                    <strong className="admin-kpi-value">{card.value}</strong>
                    <span className="admin-kpi-meta">{card.note}</span>
                  </article>
                ))}
              </section>

              <section className="admin-section-card">
                <div className="admin-section-head">
                  <div>
                    <h3>Research Head Responsibilities</h3>
                    <p>Functional oversight scope for the research head account.</p>
                  </div>
                </div>
                <div className="admin-section-body">
                  <div className="admin-list">
                    <div className="admin-list-item">
                      <div>
                        <strong>User Monitoring</strong>
                        <p className="admin-note">View portal users, role assignments, profile completeness, and activity logs.</p>
                      </div>
                    </div>
                    <div className="admin-list-item">
                      <div>
                        <strong>Institutional Research Governance</strong>
                        <p className="admin-note">Monitor projects, approvals, reports, repository evidence, and technology transfer outcomes.</p>
                      </div>
                    </div>
                    <div className="admin-list-item">
                      <div>
                        <strong>Limited Access Boundary</strong>
                        <p className="admin-note">Technical maintenance, backups, server settings, and Program Head/Adviser provisioning are outside this role.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="admin-section-card">
              <div className="admin-empty-state">No admin profile was returned by the current session.</div>
            </section>
          )}
        </div>
      </AdminShell>

      {editOpen ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setEditOpen(false)}>
          <div className="modal-content admin-profile-modal">
            <div className="modal-header">
              <div>
                <h3>Edit Admin Profile</h3>
                <p>Update your administrative contact details without changing the portal role.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setEditOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleProfileSave}>
              <div className="modal-body">
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label htmlFor="admin-profile-first-name">First Name</label>
                    <input
                      id="admin-profile-first-name"
                      aria-invalid={editErrors.firstName ? 'true' : 'false'}
                      value={editForm.firstName}
                      onChange={(event) => setEditForm((current) => ({ ...current, firstName: event.target.value }))}
                    />
                    {editErrors.firstName ? <span className="admin-field-error">{editErrors.firstName}</span> : null}
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin-profile-last-name">Last Name</label>
                    <input
                      id="admin-profile-last-name"
                      aria-invalid={editErrors.lastName ? 'true' : 'false'}
                      value={editForm.lastName}
                      onChange={(event) => setEditForm((current) => ({ ...current, lastName: event.target.value }))}
                    />
                    {editErrors.lastName ? <span className="admin-field-error">{editErrors.lastName}</span> : null}
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin-profile-email">Email</label>
                    <input
                      id="admin-profile-email"
                      type="email"
                      aria-invalid={editErrors.email ? 'true' : 'false'}
                      value={editForm.email}
                      onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                    />
                    {editErrors.email ? <span className="admin-field-error">{editErrors.email}</span> : null}
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin-profile-department">Office</label>
                    <input
                      id="admin-profile-department"
                      aria-invalid={editErrors.department ? 'true' : 'false'}
                      value={editForm.department}
                      onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
                    />
                    {editErrors.department ? <span className="admin-field-error">{editErrors.department}</span> : null}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" type="button" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {passwordOpen ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setPasswordOpen(false)}>
          <div className="modal-content admin-profile-modal">
            <div className="modal-header">
              <div>
                <h3>Change Admin Password</h3>
                <p>Set a new administrative password for the current account.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setPasswordOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handlePasswordSave}>
              <div className="modal-body">
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label htmlFor="admin-profile-password">New Password</label>
                    <input
                      id="admin-profile-password"
                      type="password"
                      aria-invalid={passwordErrors.password ? 'true' : 'false'}
                      value={passwordForm.password}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    {passwordErrors.password ? <span className="admin-field-error">{passwordErrors.password}</span> : null}
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin-profile-confirm-password">Confirm Password</label>
                    <input
                      id="admin-profile-confirm-password"
                      type="password"
                      aria-invalid={passwordErrors.confirmPassword ? 'true' : 'false'}
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    />
                    {passwordErrors.confirmPassword ? <span className="admin-field-error">{passwordErrors.confirmPassword}</span> : null}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" type="button" onClick={() => setPasswordOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
