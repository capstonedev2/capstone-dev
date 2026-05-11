'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logout } from '@/lib/mock/auth';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import { STUDENT_NAV_ITEMS } from '@/components/students/student-navigation';

function getInitials(value: string) {
  return value.split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger'; icon?: string }) {
  return (
    <span className={`ui-badge is-${tone}`}>
      {icon && <i className={`fas ${icon}`} aria-hidden="true" />}
      {label}
    </span>
  );
}

export function StudentProgressReports({ data }: { data: StudentDashboardData }) {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setProfileMenuOpen(false); setSidebarOpen(false); }
    };
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('click', handleDocumentClick); document.removeEventListener('keydown', handleKeyDown); };
  }, []);

  const unreadNotificationsCount = data.notifications.filter((item) => !item.read).length;
  const unreadFeedbackCount = data.feedback.filter((item) => item.unread).length;
  
  const reports = data.progressReports || [];
  const latestReport = reports[0];
  const reviewedReports = reports.filter(r => r.statusDisplay?.includes('Reviewed')).length;

  return (
    <>
      
      <button className={`sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`} type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />

      <header className="top-nav">
          <div className="top-nav-leading">
            <div className="page-title">
              <div className="page-title-context">
                <span className="page-kicker">Student Workspace</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>Progress Reports</span>
                </span>
              </div>
              <h1>Progress Reports</h1>
              <p>Submit and review weekly project updates, evidence records, and adviser-facing progress notes.</p>
            </div>
          </div>
        </header><div className="page-body">
          <section className="page-strip">
            <div className="page-strip-main">
              <span className="section-kicker">Weekly Accountability</span>
              <h2>Submit and review weekly project updates</h2>
              <p>Keep your adviser informed about current work, project blockers, evidence updates, and accomplishment metrics.</p>
              <div className="workspace-note is-member">
                <i className="fas fa-circle-info" aria-hidden="true" />
                <p>Only the group leader is required to submit progress reports on behalf of the whole group.</p>
              </div>
              <div className="strip-actions">
                <Link className="btn btn-primary" href="/students/project-overview"><i className="fas fa-folder-open" aria-hidden="true" /> Open Project Data</Link>
                <Link className="btn btn-secondary" href="/students/project-files"><i className="fas fa-file-arrow-up" aria-hidden="true" /> Add Project Evidence</Link>
              </div>
            </div>
            <div className="page-strip-side">
              <div className="strip-stat">
                <strong>{reports.length}</strong>
                <div>
                  <span>Submitted reports</span>
                  <small>Recorded in project history</small>
                </div>
              </div>
              <div className="strip-stat">
                <strong>{reviewedReports}</strong>
                <div>
                  <span className={`ui-badge is-${reviewedReports ? 'success' : 'neutral'}`}>Reviewed by Adviser</span>
                  <small>Verified progress logs</small>
                </div>
              </div>
            </div>
          </section>

          <section className="content-grid two-thirds">
            <article className="surface-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">New Report</span>
                  <h3>Submit a new progress update</h3>
                </div>
              </div>
              <form className="portal-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-field full">
                  <label>Overall Progress Note</label>
                  <textarea rows={3} placeholder="Brief summary of the work done during this reporting period..." />
                </div>
                <div className="form-field full">
                  <label>Completed Activities (Comma-separated)</label>
                  <input type="text" placeholder="E.g. updated evidence, completed field work, refined project documentation" />
                </div>
                <div className="form-grid">
                  <div className="form-field full">
                    <label>Problems Encountered</label>
                    <textarea rows={2} placeholder="Any project hurdles, evidence gaps, or blockers..." />
                  </div>
                  <div className="form-field full">
                    <label>Next Steps / Focus for the Next Week</label>
                    <textarea rows={2} placeholder="What the group will work on next..." />
                  </div>
                </div>
                <div className="form-field" style={{ width: '40%' }}>
                  <label>Estimated Project Completion</label>
                  <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="number" min="0" max="100" defaultValue="50" style={{ maxWidth: '100px' }} />
                    <span style={{ color: 'var(--text-meta)', fontWeight: 600 }}>%</span>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" type="button"><i className="fas fa-paper-plane" aria-hidden="true" /> Submit Report</button>
                  <span className="form-helper" style={{ marginLeft: '1rem' }}>Saves standard report view for adviser access.</span>
                </div>
              </form>
            </article>

            <article className="surface-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Historical Reports</span>
                  <h3>Past progress logs</h3>
                </div>
              </div>
              <div className="stack-list">
                {reports.length ? reports.map((report) => (
                  <article key={report.id} className="stack-card">
                    <div className="stack-card-head">
                      <strong>{report.title}</strong>
                      <Badge label={report.statusDisplay || 'Submitted'} tone={report.statusDisplay === 'Reviewed' ? 'success' : 'warning'} />
                    </div>
                    <p style={{ marginTop: '0.25rem', marginBottom: '1rem' }}>{report.progressDescription}</p>
                    
                    <div className="detail-grid" style={{ gap: '1rem', background: 'var(--surface-sunken)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-meta)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Accomplishments</span>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.875rem' }}>
                          {report.accomplishments.map((act, i) => <li key={i}>{act}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-meta)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Problems / Blockers</span>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>{report.problemsEncountered || 'None reported.'}</p>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-meta)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Next Targets</span>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>{report.nextSteps}</p>
                      </div>
                    </div>
                    
                    <div className="stack-card-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small style={{ color: 'var(--text-meta)' }}>Submitted on: {report.dateLabel}</small>
                      <Badge label={`Est. Progress: ${report.percentageCompleted}%`} tone="neutral" />
                    </div>
                  </article>
                )) : (
                  <div className="empty-state">
                    <span className="empty-state-icon"><i className="fas fa-file-signature" aria-hidden="true" /></span>
                    <strong>No reports filed yet</strong>
                    <p>When you submit a progress report, it will appear here in the historical log.</p>
                  </div>
                )}
              </div>
            </article>
          </section>
        </div>
      </>
  );
}
