'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const PERFORMANCE_ROWS = [
  { name: 'Information Technology', projects: 42, successRate: 86, note: 'Highest transfer yield', width: 86 },
  { name: 'Mechanical Engineering Technology', projects: 28, successRate: 78, note: 'Stable throughput', width: 78 },
  { name: 'Technology Communication Management', projects: 19, successRate: 82, note: 'Strong completion pace', width: 82 },
  { name: 'Environmental and Safety Management', projects: 35, successRate: 74, note: 'Review defense backlog', width: 74 },
  { name: 'Naval Architecture and Marine Engineering', projects: 32, successRate: 79, note: 'Strong industry adoption', width: 79 }
];

const WATCHLIST = [
  { title: 'School-wide accreditation pack', note: 'Update adviser productivity charts and attach the latest completion distribution.', status: 'Due today' },
  { title: 'IT transfer memo briefing', note: 'Finalize the partner-ready case summary for the top three pilot deployments.', status: 'Needs release' },
  { title: 'ESM defense backlog review', note: 'Three projects remain pending due to incomplete compliance evidence.', status: 'Escalate' },
  { title: 'NAME deployment follow-up', note: 'Confirm post-adoption metrics for the marine pollution detector rollout.', status: 'External partner' }
];

const PORTFOLIO_STATUS = [
  { label: 'Active research projects', value: 156, description: 'projects are still within development and review cycles.', percentage: '45.6%', width: 45.6, color: '#16a34a' },
  { label: 'Completed projects', value: 124, description: 'projects have passed final submission and validation.', percentage: '36.3%', width: 36.3, color: '#991b1b' },
  { label: 'Pending projects', value: 38, description: 'projects are awaiting approvals, routing, or missing requirements.', percentage: '11.1%', width: 11.1, color: '#d97706' },
  { label: 'On-hold projects', value: 24, description: 'projects are paused because of compliance or staffing constraints.', percentage: '7.0%', width: 7, color: '#ef4444' }
];

const YEAR_GROWTH = [
  { year: '2020-2021', count: '187 projects', trend: '' },
  { year: '2021-2022', count: '234 projects', trend: '+25%' },
  { year: '2022-2023', count: '298 projects', trend: '+27%' },
  { year: '2023-2024', count: '342 projects', trend: '+15%' }
];

const BRIEFING_PACKAGES = [
  { title: 'Project inventory report', description: 'Filtered project records with department, adviser, status, year, and document counts.', action: 'Export' },
  { title: 'Progress monitoring report', description: 'Milestone progress, delayed records, at-risk projects, and pending approvals.', action: 'Export' },
  { title: 'Technology transfer report', description: 'Deployable projects, partner matches, utilization status, and impact notes.', action: 'Export' }
];

const ADVISER_TABLE = [
  { adviser: 'Dr. Ricardo Cruz', department: 'IT', supervised: 12, completionRate: '92%', avgScore: '89%', outputs: 5 },
  { adviser: 'Prof. Maria Ramos', department: 'MET', supervised: 8, completionRate: '85%', avgScore: '86%', outputs: 3 },
  { adviser: 'Dr. Anna Reyes', department: 'TCM', supervised: 6, completionRate: '88%', avgScore: '87%', outputs: 2 },
  { adviser: 'Prof. Jose Lopez', department: 'ESM', supervised: 9, completionRate: '82%', avgScore: '84%', outputs: 4 },
  { adviser: 'Dr. Elena Aquino', department: 'NAME', supervised: 7, completionRate: '86%', avgScore: '85%', outputs: 3 }
];

const TRANSFER_SHOWCASE = [
  { department: 'IT', status: 'Deployed', title: 'AI Inventory System', note: 'Operational pilot deployed with TechCorp Inc. for inventory visibility and audit automation.', adoptionDate: 'January 2024', impact: '5/5' },
  { department: 'MET', status: 'Testing', title: 'Smart Energy Monitor', note: 'Validation phase underway with GreenEnergy PH ahead of a broader sustainability trial.', adoptionDate: 'February 2024', impact: '4/5' },
  { department: 'NAME', status: 'Operational', title: 'Marine Pollution Detector', note: 'OceanTech Inc. has integrated the detector into a live environmental monitoring workflow.', adoptionDate: 'December 2023', impact: '5/5' }
];

export function AdminReports() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  return (
    <>
      <AdminShell
        activeNav="reports"
        title="Analytics & Reports"
        description="Review executive research outcomes, adviser coverage, and transfer-ready outputs in one reporting workspace."
      >
        <div className="admin-page-stack">
          <div className="admin-split-grid">
            <section className="admin-section-card">
              <div className="admin-section-body">
                <div className="admin-page-stack">
                  <span className="kicker">
                    <i className="fas fa-chart-line"></i>
                    Research Head Reports
                  </span>
                  <div>
                    <h2 style={{ fontSize: '2.2rem', lineHeight: '1', letterSpacing: '-0.05em' }}>
                      Executive reporting center for school-wide capstone performance.
                    </h2>
                    <p className="admin-note" style={{ marginTop: '0.85rem', fontSize: '0.92rem' }}>
                      Monitor completion movement, adviser productivity, and technology transfer readiness without
                      jumping across separate views.
                    </p>
                  </div>
                  <div className="admin-pill-list">
                    <span className="admin-inline-badge">All Departments</span>
                    <span className="admin-inline-badge">AY 2023-2024</span>
                    <span className="admin-inline-badge">Refreshed 8:00 AM</span>
                  </div>
                </div>
              </div>
            </section>
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <span className="kicker">
                    <i className="fas fa-bolt"></i>
                    Reporting Actions
                  </span>
                  <h3>Prepare leadership-ready output packs faster.</h3>
                  <p>Generate custom reports, schedule recurring digests, and export clean briefing packages for meetings or audits.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-grid-2">
                  <article className="admin-surface-card" style={{ padding: '1rem' }}>
                    <span className="admin-kpi-label">Queued Briefings</span>
                    <strong className="admin-kpi-value" style={{ fontSize: '1.8rem' }}>6</strong>
                    <span className="admin-note">Pending signature and review before release.</span>
                  </article>
                  <article className="admin-surface-card" style={{ padding: '1rem' }}>
                    <span className="admin-kpi-label">Scheduled Digests</span>
                    <strong className="admin-kpi-value" style={{ fontSize: '1.8rem' }}>3</strong>
                    <span className="admin-note">Weekly and monthly deliveries configured.</span>
                  </article>
                </div>
                <div className="admin-toolbar-actions" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" type="button" onClick={() => setReportModalOpen(true)}>
                    <i className="fas fa-file-lines"></i>
                    Generate Report
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => setScheduleModalOpen(true)}>
                    <i className="fas fa-calendar-days"></i>
                    Schedule Digest
                  </button>
                </div>
              </div>
            </section>
          </div>

          <section className="admin-section-card">
            <div className="admin-section-body">
              <div className="admin-toolbar compact">
                <div className="span-3 admin-toolbar-field">
                  <label>Department Scope</label>
                  <select className="admin-toolbar-select" defaultValue="All Departments">
                    <option>All Departments</option>
                    <option>IT</option>
                    <option>MET</option>
                    <option>TCM</option>
                    <option>ESM</option>
                    <option>NAME</option>
                  </select>
                </div>
                <div className="span-3 admin-toolbar-field">
                  <label>Academic Year</label>
                  <select className="admin-toolbar-select" defaultValue="AY 2023-2024">
                    <option>AY 2023-2024</option>
                    <option>AY 2022-2023</option>
                  </select>
                </div>
                <div className="span-3 admin-toolbar-field">
                  <label>Report Type</label>
                  <select className="admin-toolbar-select" defaultValue="Project Inventory Report">
                    <option>Project Inventory Report</option>
                    <option>Progress Monitoring Report</option>
                    <option>Technology Transfer Report</option>
                  </select>
                </div>
                <div className="span-3 admin-toolbar-actions">
                  <button className="btn btn-primary" type="button">
                    <i className="fas fa-file-pdf"></i>
                    Export PDF
                  </button>
                  <button className="btn btn-outline" type="button">
                    <i className="fas fa-file-excel"></i>
                    Export Excel
                  </button>
                </div>
                <div className="span-full">
                  <div className="admin-inline-badge">
                    <i className="fas fa-circle-info"></i>
                    Showing all departments for AY 2023-2024 in the Executive Briefing Pack.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-grid-4">
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Total Active Projects</span>
              <strong className="admin-kpi-value">342</strong>
              <span className="admin-note">Up 12% from the previous academic year.</span>
              <span className="status-badge status-success">Strong pipeline</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Completion Readiness</span>
              <strong className="admin-kpi-value">124</strong>
              <span className="admin-note">Teams positioned for final validation and defense closeout.</span>
              <span className="status-badge status-approved">36.3% completed</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Adviser Coverage</span>
              <strong className="admin-kpi-value">48</strong>
              <span className="admin-note">Active advisers supporting 987 students across five departments.</span>
              <span className="status-badge status-review">7 near capacity</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Transfer-Ready Outputs</span>
              <strong className="admin-kpi-value">23</strong>
              <span className="admin-note">Deployable projects with external partner interest or pilot activity.</span>
              <span className="status-badge status-success">7 new this term</span>
            </article>
          </section>

          <div className="admin-split-grid">
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <span className="kicker">
                    <i className="fas fa-chart-column"></i>
                    Department Performance
                  </span>
                  <h3>Department performance dashboard</h3>
                  <p>Compare completion momentum, research output volume, and success rate by department.</p>
                </div>
                <div className="status-badge status-review">5 departments tracked</div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {PERFORMANCE_ROWS.map((row) => (
                    <div key={row.name} className="admin-surface-card" style={{ padding: '1rem' }}>
                      <div className="admin-metric-row-header">
                        <strong>
                          {row.name} <span className="admin-note">{row.projects} projects | {row.successRate}% success rate</span>
                        </strong>
                        <span className="status-badge status-neutral">{row.note}</span>
                      </div>
                      <div className="admin-progress-track" style={{ marginTop: '0.85rem' }}>
                        <div className="admin-progress-bar" style={{ width: `${row.width}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <span className="kicker">
                    <i className="fas fa-list-check"></i>
                    Priority Queue
                  </span>
                  <h3>Research head watchlist</h3>
                  <p>High-signal items that need attention before your next review cycle.</p>
                </div>
                <div className="status-badge status-review">4 urgent items</div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {WATCHLIST.map((item) => (
                    <div key={item.title} className="admin-watchlist-item">
                      <div>
                        <strong>{item.title}</strong>
                        <span className="admin-table-meta">{item.note}</span>
                      </div>
                      <span className="status-badge status-review">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="admin-split-grid">
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <span className="kicker">
                    <i className="fas fa-chart-pie"></i>
                    Portfolio Health
                  </span>
                  <h3>Project status distribution and growth</h3>
                  <p>Use the current portfolio mix to anticipate review load and resource pressure.</p>
                </div>
                <div className="status-badge status-review">342 tracked projects</div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {PORTFOLIO_STATUS.map((item) => (
                    <div key={item.label} className="admin-surface-card" style={{ padding: '1rem' }}>
                      <div className="admin-metric-row-header">
                        <strong>
                          {item.label} <span className="admin-note">{item.value} {item.description}</span>
                        </strong>
                        <span className="status-badge status-critical">{item.percentage}</span>
                      </div>
                      <div className="admin-progress-track" style={{ marginTop: '0.85rem' }}>
                        <div className="admin-progress-bar" style={{ width: `${item.width}%`, background: item.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="admin-list" style={{ marginTop: '1rem' }}>
                  {YEAR_GROWTH.map((row) => (
                    <div key={row.year} className="admin-list-item">
                      <strong>{row.year}</strong>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span className="admin-note">{row.count}</span>
                        {row.trend ? <span className="status-badge status-approved">{row.trend}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <span className="kicker">
                    <i className="fas fa-box-open"></i>
                    Export Center
                  </span>
                  <h3>Ready-made Research Head reports</h3>
                  <p>Choose user, project, progress, or technology transfer outputs for council meetings and audits.</p>
                </div>
                <div className="status-badge status-review">4 presets</div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {BRIEFING_PACKAGES.map((item) => (
                    <div key={item.title} className="admin-package-item">
                      <div>
                        <strong>{item.title}</strong>
                        <span className="admin-table-meta">{item.description}</span>
                      </div>
                      <button className="btn btn-outline small" type="button">
                        <i className="fas fa-file-export"></i>
                        {item.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <span className="kicker">
                  <i className="fas fa-user-tie"></i>
                  Adviser Productivity
                </span>
                <h3>Top performing advisers</h3>
                <p>Ranked by completion strength, student outcomes, and transfer participation.</p>
              </div>
              <div className="status-badge status-review">Updated weekly</div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Adviser</th>
                    <th>Department</th>
                    <th>Projects Supervised</th>
                    <th>Completion Rate</th>
                    <th>Avg. Student Score</th>
                    <th>Transfer Outputs</th>
                  </tr>
                </thead>
                <tbody>
                  {ADVISER_TABLE.map((row) => (
                    <tr key={row.adviser}>
                      <td>{row.adviser}</td>
                      <td><span className="dept-badge">{row.department}</span></td>
                      <td>{row.supervised}</td>
                      <td>{row.completionRate}</td>
                      <td>{row.avgScore}</td>
                      <td>{row.outputs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-grid-3">
            {TRANSFER_SHOWCASE.map((item) => (
              <article key={item.title} className="admin-feature-card">
                <div className="admin-feature-meta">
                  <span className="dept-badge">{item.department}</span>
                  <span className="status-badge status-review">{item.status}</span>
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p className="admin-note" style={{ marginTop: '0.35rem' }}>{item.note}</p>
                </div>
                <div className="admin-feature-meta">
                  <span>Adoption Date {item.adoptionDate}</span>
                  <strong>Impact {item.impact}</strong>
                </div>
              </article>
            ))}
          </section>
        </div>
      </AdminShell>

      {reportModalOpen ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setReportModalOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Generate Custom Report</h3>
                <p>Build an executive output tailored to your selected reporting scope.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setReportModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Report Type</label>
                  <select defaultValue="Project Inventory Report">
                    <option>Project Inventory Report</option>
                    <option>Progress Monitoring Report</option>
                    <option>Technology Transfer Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select defaultValue="All Departments">
                    <option>All Departments</option>
                    <option>IT</option>
                    <option>MET</option>
                    <option>TCM</option>
                    <option>ESM</option>
                    <option>NAME</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Academic Year</label>
                  <select defaultValue="AY 2023-2024">
                    <option>AY 2023-2024</option>
                    <option>AY 2022-2023</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Output Format</label>
                  <select defaultValue="PDF">
                    <option>PDF</option>
                    <option>Excel</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setReportModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setReportModalOpen(false)}>
                Generate
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {scheduleModalOpen ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setScheduleModalOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Schedule Report Digest</h3>
                <p>Set a recurring summary delivery for leadership and research office stakeholders.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setScheduleModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Frequency</label>
                  <select defaultValue="Weekly">
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Audience</label>
                  <input placeholder="Research council, deans, chairs" />
                </div>
                <div className="form-group">
                  <label>Delivery Format</label>
                  <select defaultValue="Email + PDF">
                    <option>Email + PDF</option>
                    <option>Email only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Time</label>
                  <input type="time" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setScheduleModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setScheduleModalOpen(false)}>
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
