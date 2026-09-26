'use client';

import { useState } from 'react';
import { SystemAdminShell } from '@/components/system-admin/system-admin-shell';

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
    { event: 'Research Head denied technical route', actor: 'Proxy', detail: 'Redirected to /research-head/dashboard', time: 'Today 9:44 AM', status: 'warning', icon: 'fa-triangle-exclamation' },
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
