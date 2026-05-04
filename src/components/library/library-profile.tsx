'use client';

import { useState } from 'react';
import {
  LIBRARY_PROFILE,
  LIBRARY_PROFILE_ACTIVITY,
  getDepartmentLabel,
  type LibraryDepartment
} from '@/components/library/library-data';
import { LibraryDepartmentBadge, LibraryModal } from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

export function LibraryProfile() {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [fullName, setFullName] = useState<string>(LIBRARY_PROFILE.fullName);
  const [email, setEmail] = useState<string>(LIBRARY_PROFILE.email);
  const [departmentInterest, setDepartmentInterest] = useState<'all' | LibraryDepartment>('IT');
  const [newPublications, setNewPublications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [savedStudyUpdates, setSavedStudyUpdates] = useState(false);

  return (
    <LibraryShell
      activeNav="profile"
      title="My Profile"
      description="E-Library Access Account"
    >
      <div className="library-card-grid">
        <section className="library-section-card">
          <div className="library-section-body library-profile-summary">
            <span className="library-profile-avatar-lg">
              <i className="fas fa-user-graduate" aria-hidden="true" />
            </span>
            <h2>{LIBRARY_PROFILE.displayName}</h2>
            <p>
              <LibraryDepartmentBadge>{LIBRARY_PROFILE.roleLabel}</LibraryDepartmentBadge>
            </p>
            <p>Member Since: {LIBRARY_PROFILE.memberSince}</p>
            <button
              className="library-btn is-outline"
              type="button"
              onClick={() => setEditProfileOpen(true)}
            >
              Edit Profile
            </button>
          </div>
        </section>

        <section className="library-section-card">
          <div className="library-section-head">
            <h3>Account Information</h3>
          </div>
          <div className="library-section-body">
            <div className="library-detail-list">
              <p>
                <strong>Full Name:</strong> {fullName}
              </p>
              <p>
                <strong>Email:</strong> {email}
              </p>
              <p>
                <strong>Department Interest:</strong>{' '}
                {departmentInterest === 'all'
                  ? 'All Departments'
                  : getDepartmentLabel(departmentInterest as LibraryDepartment)}
              </p>
              <p>
                <strong>Role:</strong> {LIBRARY_PROFILE.roleDescription}
              </p>
              <p>
                <strong>Account Status:</strong> {LIBRARY_PROFILE.accountStatus}
              </p>
            </div>
          </div>
        </section>

        <section className="library-section-card">
          <div className="library-section-head">
            <h3>Repository Activity</h3>
          </div>
          <div className="library-section-body">
            <div className="library-detail-list">
              <p>
                <strong>Saved Projects:</strong> {LIBRARY_PROFILE.savedProjects}
              </p>
              <p>
                <strong>Documents Viewed:</strong> {LIBRARY_PROFILE.documentsViewed}
              </p>
              <p>
                <strong>Downloads:</strong> {LIBRARY_PROFILE.downloads}
              </p>
              <p>
                <strong>Last Active:</strong> {LIBRARY_PROFILE.lastActive}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="library-section-card">
        <div className="library-section-head">
          <h3>Recent Activity</h3>
        </div>
        <div className="library-section-body">
          <div className="library-timeline">
            {LIBRARY_PROFILE_ACTIVITY.map((activity) => (
              <div className="library-timeline-item" key={activity}>
                <small>{activity}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="library-section-card">
        <div className="library-section-head">
          <h3>Account Settings</h3>
        </div>
        <div className="library-section-body">
          <div className="library-form-grid">
            <div className="library-form-field">
              <label>Notification Preferences</label>
              <div className="library-checkbox-list">
                <label className="library-checkbox">
                  <input
                    checked={newPublications}
                    type="checkbox"
                    onChange={(event) => setNewPublications(event.target.checked)}
                  />
                  New publications in my interests
                </label>
                <label className="library-checkbox">
                  <input
                    checked={weeklyDigest}
                    type="checkbox"
                    onChange={(event) => setWeeklyDigest(event.target.checked)}
                  />
                  Weekly repository digest
                </label>
                <label className="library-checkbox">
                  <input
                    checked={savedStudyUpdates}
                    type="checkbox"
                    onChange={(event) => setSavedStudyUpdates(event.target.checked)}
                  />
                  Saved study updates
                </label>
              </div>
            </div>

            <div className="library-form-field">
              <label htmlFor="library-default-search">Default Search Filters</label>
              <select
                id="library-default-search"
                value={departmentInterest}
                onChange={(event) =>
                  setDepartmentInterest(event.target.value as 'all' | LibraryDepartment)
                }
              >
                <option value="all">All Departments</option>
                <option value="IT">IT</option>
                <option value="MET">MET</option>
                <option value="TCM">TCM</option>
                <option value="ESM">ESM</option>
                <option value="NAME">NAME</option>
              </select>
            </div>

            <div className="library-card-actions">
              <button
                className="library-btn is-outline"
                type="button"
                onClick={() => setChangePasswordOpen(true)}
              >
                Change Password
              </button>
              <button className="library-btn is-outline" type="button">
                <i className="fas fa-bell-slash" aria-hidden="true" />
                Manage Email Preferences
              </button>
            </div>
          </div>
        </div>
      </section>

      <LibraryModal
        open={editProfileOpen}
        title="Edit Profile"
        onClose={() => setEditProfileOpen(false)}
      >
        <div className="library-form-grid">
          <div className="library-form-field">
            <label htmlFor="library-profile-name">Full Name</label>
            <input
              id="library-profile-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="library-form-field">
            <label htmlFor="library-profile-email">Email</label>
            <input
              id="library-profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="library-form-field">
            <label htmlFor="library-profile-interest">Department Interest</label>
            <select
              id="library-profile-interest"
              value={departmentInterest}
              onChange={(event) =>
                setDepartmentInterest(event.target.value as 'all' | LibraryDepartment)
              }
            >
              <option value="IT">IT</option>
              <option value="MET">MET</option>
              <option value="TCM">TCM</option>
              <option value="ESM">ESM</option>
              <option value="NAME">NAME</option>
            </select>
          </div>
        </div>
        <div className="library-modal-actions">
          <button
            className="library-btn is-primary"
            type="button"
            onClick={() => setEditProfileOpen(false)}
          >
            Save Changes
          </button>
          <button
            className="library-btn is-outline"
            type="button"
            onClick={() => setEditProfileOpen(false)}
          >
            Cancel
          </button>
        </div>
      </LibraryModal>

      <LibraryModal
        open={changePasswordOpen}
        title="Change Password"
        onClose={() => setChangePasswordOpen(false)}
      >
        <div className="library-form-grid">
          <div className="library-form-field">
            <label htmlFor="library-current-password">Current Password</label>
            <input id="library-current-password" type="password" />
          </div>
          <div className="library-form-field">
            <label htmlFor="library-new-password">New Password</label>
            <input id="library-new-password" type="password" />
          </div>
          <div className="library-form-field">
            <label htmlFor="library-confirm-password">Confirm Password</label>
            <input id="library-confirm-password" type="password" />
          </div>
        </div>
        <div className="library-modal-actions">
          <button
            className="library-btn is-primary"
            type="button"
            onClick={() => setChangePasswordOpen(false)}
          >
            Update
          </button>
          <button
            className="library-btn is-outline"
            type="button"
            onClick={() => setChangePasswordOpen(false)}
          >
            Cancel
          </button>
        </div>
      </LibraryModal>
    </LibraryShell>
  );
}
