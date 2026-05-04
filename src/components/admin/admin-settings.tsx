'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const TABS = [
  { key: 'roles', label: 'Role Matrix' },
  { key: 'scope', label: 'Research Head Scope' },
  { key: 'it-admin', label: 'IT Admin Boundary' }
] as const;

type SettingsTab = (typeof TABS)[number]['key'];

const ROLE_MATRIX = [
  {
    role: 'Student',
    permissions: 'Self-register, submit documents, view feedback, track own project progress',
    researchHeadAccess: 'View profile, project membership, and progress signals',
    creationRule: 'Self-register only'
  },
  {
    role: 'Adviser',
    permissions: 'Guide groups, review submissions, update adviser-side feedback',
    researchHeadAccess: 'View profile, supervision load, and project activity',
    creationRule: 'Added by Program Head, not Research Head'
  },
  {
    role: 'Program Head',
    permissions: 'Program-level monitoring, adviser assignment, departmental user support',
    researchHeadAccess: 'View profile, department scope, and oversight activity',
    creationRule: 'Provisioned outside Research Head workflow'
  },
  {
    role: 'Library Personnel',
    permissions: 'Repository metadata, publication queue, archival validation',
    researchHeadAccess: 'View role and repository activity'
  },
  {
    role: 'Tech Transfer Officer',
    permissions: 'Partner matching, deployment routing, utilization tracking',
    researchHeadAccess: 'View role and transfer activity'
  },
  {
    role: 'Industry Partner',
    permissions: 'View matched projects, submit feedback, confirm utilization',
    researchHeadAccess: 'View partner profile and feedback status'
  }
];

const RESEARCH_SCOPE = [
  'View all users and role assignments for research oversight.',
  'View project inventory, uploaded documents, milestone progress, and approval status.',
  'Create announcements and send notifications to relevant users.',
  'Generate reports for users, projects, progress, and technology transfer.',
  'Review roles and permissions without server-level or database-level controls.'
];

const RESTRICTED_CONTROLS = [
  'Server maintenance and deployment updates',
  'Database backup, restore, and direct database administration',
  'Security patching, bug fixing, diagnostics, and cache clearing',
  'Theme customization and technical platform configuration',
  'Program Head or Adviser account creation from the Research Head interface'
];

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('roles');

  return (
    <AdminShell
      activeNav="settings"
      title="Roles and Access"
      description="Review role permissions and Research Head access boundaries without technical system administration controls."
    >
      <div className="admin-page-stack">
        <div className="admin-tab-bar" role="tablist" aria-label="Research Head access sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              aria-selected={activeTab === tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              role="tab"
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'roles' ? (
          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Role Permission Matrix</h3>
                <p>Research Head can view roles and permissions, but cannot create Program Head or Adviser accounts.</p>
              </div>
              <span className="status-badge status-info">View-only</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Role Permissions</th>
                    <th>Research Head Access</th>
                    <th>Provisioning Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_MATRIX.map((row) => (
                    <tr key={row.role}>
                      <td><span className="admin-inline-badge">{row.role}</span></td>
                      <td>{row.permissions}</td>
                      <td>{row.researchHeadAccess}</td>
                      <td>{row.creationRule || 'Managed by assigned operational owner'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === 'scope' ? (
          <section className="admin-grid-2">
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Allowed Research Head Scope</h3>
                  <p>Functional research administration and oversight actions.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {RESEARCH_SCOPE.map((item) => (
                    <div key={item} className="admin-list-item">
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Explicit Restrictions</h3>
                  <p>Controls intentionally excluded from Research Head access.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {RESTRICTED_CONTROLS.map((item) => (
                    <div key={item} className="admin-list-item">
                      <strong>{item}</strong>
                      <span className="status-badge status-critical">Not available</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'it-admin' ? (
          <section className="admin-section-card">
            <div className="admin-section-body">
              <div className="admin-result-banner is-warning">
                <div>
                  <strong>Technical maintenance is outside the Research Head workflow.</strong>
                  <p>
                    IT Administrator/System Admin handles system updates, security, database backup, server maintenance,
                    bug fixing, diagnostics, and theme customization. Those controls are not exposed here.
                  </p>
                </div>
              </div>
              <div className="admin-grid-3" style={{ marginTop: '1rem' }}>
                {[
                  ['System Updates', 'IT Administrator'],
                  ['Database Backup', 'System Admin'],
                  ['Theme Customization', 'IT Administrator']
                ].map(([task, owner]) => (
                  <article key={task} className="admin-surface-card" style={{ padding: '1rem' }}>
                    <span className="admin-kpi-label">{task}</span>
                    <strong>{owner}</strong>
                    <p className="admin-note">Outside Research Head access.</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
