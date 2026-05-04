'use client';

import Link from 'next/link';

export function StudentSettings() {
  return (
    <>
      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Account Settings</span>
              </span>
            </div>
            <h1>Account Settings</h1>
            <p>Manage your notifications, privacy preferences, and workspace security.</p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <section className="student-profile-page">
          <article className="info-card">
            <div className="info-header">
              <h3>
                <i className="fas fa-cog" aria-hidden="true" /> Preferences
              </h3>
              <span className="info-badge">
                <i className="fas fa-lock" aria-hidden="true" /> Active
              </span>
            </div>
            <div className="info-body">
              <div className="preference-grid">
                <section className="preference-group">
                  <div className="preference-group-header">
                    <h4>Email Notifications</h4>
                    <p>Decide which updates should arrive in your inbox.</p>
                  </div>
                  <label className="preference-option">
                    <input type="checkbox" defaultChecked />
                    <span className="preference-copy">
                      <strong>Submission updates</strong>
                      <span>Receive alerts when uploads are reviewed, approved, or returned for revision.</span>
                    </span>
                  </label>
                  <label className="preference-option">
                    <input type="checkbox" defaultChecked />
                    <span className="preference-copy">
                      <strong>Feedback alerts</strong>
                      <span>Get notified when advisers or panel members leave comments on your project.</span>
                    </span>
                  </label>
                  <label className="preference-option">
                    <input type="checkbox" />
                    <span className="preference-copy">
                      <strong>Schedule reminders</strong>
                      <span>Receive reminders for consultations, deadlines, and presentation events.</span>
                    </span>
                  </label>
                </section>

                <section className="preference-group">
                  <div className="preference-group-header">
                    <h4>Privacy Settings</h4>
                    <p>Control who can access your personal student information.</p>
                  </div>
                  <label className="preference-option">
                    <input type="checkbox" />
                    <span className="preference-copy">
                      <strong>Show student profile</strong>
                      <span>Allow approved campus users to view your basic student profile details.</span>
                    </span>
                  </label>
                  <label className="preference-option">
                    <input type="checkbox" />
                    <span className="preference-copy">
                      <strong>Archive-ready access</strong>
                      <span>Permit authorized units to reference your approved academic record for archiving.</span>
                    </span>
                  </label>
                </section>
              </div>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}
