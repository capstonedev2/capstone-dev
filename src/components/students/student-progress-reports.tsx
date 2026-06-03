'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logoutWithApi } from '@/lib/client-auth';
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
    <div className="student-progress-reports-page">
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
      </header>

      <div className="page-body">
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
                <Link prefetch={false} className="btn btn-primary" href="/students/project-overview"><i className="fas fa-folder-open" aria-hidden="true" /> Open Project Data</Link>
                <Link prefetch={false} className="btn btn-secondary" href="/students/project-files"><i className="fas fa-file-arrow-up" aria-hidden="true" /> Add Project Evidence</Link>
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

          <section className="content-grid two-thirds progress-reports-layout">
            <article className="surface-card progress-reports-form-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">New Report</span>
                  <h3>Submit a new progress update</h3>
                </div>
              </div>
              <form className="portal-form progress-reports-form" onSubmit={(e) => e.preventDefault()}>
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
                <div className="form-field progress-reports-percent-field">
                  <label>Estimated Project Completion</label>
                  <div className="progress-reports-percent-input">
                    <input type="number" min="0" max="100" defaultValue="50" />
                    <span>%</span>
                  </div>
                </div>
                <div className="form-actions progress-reports-form-actions">
                  <button className="btn btn-primary" type="button"><i className="fas fa-paper-plane" aria-hidden="true" /> Submit Report</button>
                  <span className="form-helper">Saves a standard report view for adviser access.</span>
                </div>
              </form>
            </article>

            <article className="surface-card progress-reports-history-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Historical Reports</span>
                  <h3>Past progress logs</h3>
                </div>
              </div>
              <div className="stack-list progress-reports-history-list">
                {reports.length ? reports.map((report) => (
                  <article key={report.id} className="stack-card progress-reports-history-item">
                    <div className="stack-card-head">
                      <strong>{report.title}</strong>
                      <Badge label={report.statusDisplay || 'Submitted'} tone={report.statusDisplay === 'Reviewed' ? 'success' : 'warning'} />
                    </div>
                    <p className="progress-reports-history-summary">{report.progressDescription}</p>
                    
                    <div className="detail-grid progress-reports-detail-grid">
                      <div>
                        <span>Accomplishments</span>
                        <ul>
                          {report.accomplishments.map((act, i) => <li key={i}>{act}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span>Problems / Blockers</span>
                        <p>{report.problemsEncountered || 'None reported.'}</p>
                      </div>
                      <div>
                        <span>Next Targets</span>
                        <p>{report.nextSteps}</p>
                      </div>
                    </div>
                    
                    <div className="stack-card-footer progress-reports-history-footer">
                      <small>Submitted on: {report.dateLabel}</small>
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
    </div>
  );
}
