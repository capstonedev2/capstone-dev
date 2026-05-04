'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const APPROVAL_RECORDS = [
  {
    id: 'APR-2026-018',
    title: 'AI-Powered Learning Management System',
    department: 'IT',
    adviser: 'Dr. Ricardo Cruz',
    type: 'Final manuscript clearance',
    status: 'Pending Approval',
    statusClass: 'status-pending',
    submittedAt: 'Apr 28, 2026',
    dueIn: '18 hours',
    risk: 'Normal',
    milestone: 'Final Review',
    progress: 88,
    notes: 'Ready for Research Head endorsement after final similarity check.'
  },
  {
    id: 'APR-2026-019',
    title: 'Smart Solar Energy Monitoring System',
    department: 'MET',
    adviser: 'Prof. Maria Ramos',
    type: 'Pilot testing evidence',
    status: 'Needs Revision',
    statusClass: 'status-review',
    submittedAt: 'Apr 26, 2026',
    dueIn: 'Overdue 1 day',
    risk: 'At Risk',
    milestone: 'Pilot Validation',
    progress: 61,
    notes: 'Deployment photos are present, but utilization checklist is incomplete.'
  },
  {
    id: 'APR-2026-020',
    title: 'Herbal Medicine Knowledge Portal',
    department: 'TCM',
    adviser: 'Dr. Anna Reyes',
    type: 'Revised Chapters 1-3',
    status: 'Pending Approval',
    statusClass: 'status-pending',
    submittedAt: 'Apr 25, 2026',
    dueIn: 'Overdue 2 days',
    risk: 'Delayed',
    milestone: 'Revision Compliance',
    progress: 44,
    notes: 'Adviser comments remain unresolved on methodology scope.'
  },
  {
    id: 'APR-2026-021',
    title: 'Sustainable Agriculture IoT System',
    department: 'ESM',
    adviser: 'Prof. Jose Lopez',
    type: 'Transfer endorsement',
    status: 'Under Review',
    statusClass: 'status-info',
    submittedAt: 'Apr 29, 2026',
    dueIn: '2 days',
    risk: 'Normal',
    milestone: 'Technology Transfer',
    progress: 82,
    notes: 'Partner acceptance letter attached for Research Head routing.'
  }
];

const MILESTONE_ROWS = [
  { label: 'Proposal Clearance', completed: 42, pending: 4, progress: 91 },
  { label: 'Ethics / Similarity Review', completed: 31, pending: 9, progress: 78 },
  { label: 'Final Manuscript', completed: 24, pending: 12, progress: 67 },
  { label: 'Technology Transfer Routing', completed: 13, pending: 8, progress: 62 }
];

const STATUS_OPTIONS = ['All Statuses', 'Pending Approval', 'Under Review', 'Needs Revision'];
const RISK_OPTIONS = ['All Risk Levels', 'Normal', 'At Risk', 'Delayed'];

export function AdminApprovals() {
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [riskFilter, setRiskFilter] = useState('All Risk Levels');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const filteredApprovals = useMemo(
    () =>
      APPROVAL_RECORDS.filter((record) => {
        const matchesStatus = statusFilter === 'All Statuses' || record.status === statusFilter;
        const matchesRisk = riskFilter === 'All Risk Levels' || record.risk === riskFilter;
        const matchesDepartment = departmentFilter === 'All Departments' || record.department === departmentFilter;

        return matchesStatus && matchesRisk && matchesDepartment;
      }),
    [departmentFilter, riskFilter, statusFilter]
  );

  const selectedApproval = APPROVAL_RECORDS.find((record) => record.id === selectedApprovalId) ?? null;
  const pendingCount = APPROVAL_RECORDS.filter((record) => record.status === 'Pending Approval').length;
  const atRiskCount = APPROVAL_RECORDS.filter((record) => record.risk !== 'Normal').length;
  const averageProgress = Math.round(APPROVAL_RECORDS.reduce((sum, record) => sum + record.progress, 0) / APPROVAL_RECORDS.length);

  return (
    <>
      <AdminShell
        activeNav="approvals"
        title="Approvals and Monitoring"
        description="Review pending approvals, track project status, and prioritize delayed or at-risk research work."
      >
        <div className="admin-page-stack">
          <section className="admin-grid-4">
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Pending Approvals</span>
              <strong className="admin-kpi-value">{pendingCount}</strong>
              <span className="admin-kpi-meta">Items waiting for Research Head action.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">At Risk / Delayed</span>
              <strong className="admin-kpi-value">{atRiskCount}</strong>
              <span className="admin-kpi-meta">Projects requiring escalation or follow-up.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Average Milestone Progress</span>
              <strong className="admin-kpi-value">{averageProgress}%</strong>
              <span className="admin-kpi-meta">Across current approval queue records.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Due Within 48 Hours</span>
              <strong className="admin-kpi-value">2</strong>
              <span className="admin-kpi-meta">Approval reviews that need immediate routing.</span>
            </article>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-body">
              <div className="admin-toolbar compact">
                <div className="span-3 admin-toolbar-field">
                  <label>Status</label>
                  <select className="admin-toolbar-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="span-3 admin-toolbar-field">
                  <label>Risk</label>
                  <select className="admin-toolbar-select" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
                    {RISK_OPTIONS.map((risk) => <option key={risk}>{risk}</option>)}
                  </select>
                </div>
                <div className="span-3 admin-toolbar-field">
                  <label>Department</label>
                  <select className="admin-toolbar-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                    {['All Departments', 'IT', 'MET', 'TCM', 'ESM'].map((department) => <option key={department}>{department}</option>)}
                  </select>
                </div>
                <div className="span-3 admin-toolbar-actions">
                  <button className="btn btn-outline" type="button">
                    <i className="fas fa-file-pdf"></i>
                    Export PDF
                  </button>
                  <button className="btn btn-outline" type="button">
                    <i className="fas fa-file-excel"></i>
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Approval Queue</h3>
                <p>Pending approvals are shown with status, risk, due timing, and milestone progress.</p>
              </div>
              <span className="status-badge status-info">{filteredApprovals.length} items</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Approval ID</th>
                    <th>Project</th>
                    <th>Department</th>
                    <th>Request Type</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>Milestone</th>
                    <th>Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>
                        <span className="table-title">{record.title}</span>
                        <span className="table-subtitle">{record.adviser} | Submitted {record.submittedAt}</span>
                      </td>
                      <td><span className="dept-badge">{record.department}</span></td>
                      <td>{record.type}</td>
                      <td><span className={`status-badge ${record.statusClass}`}>{record.status}</span></td>
                      <td>
                        <span className={`status-badge ${record.risk === 'Normal' ? 'status-approved' : record.risk === 'At Risk' ? 'status-review' : 'status-critical'}`}>
                          {record.risk}
                        </span>
                      </td>
                      <td>
                        <div className="admin-metric-row">
                          <span>{record.milestone}</span>
                          <div className="admin-progress-track">
                            <div className="admin-progress-bar" style={{ width: `${record.progress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td>{record.dueIn}</td>
                      <td>
                        <button className="btn btn-outline small" type="button" onClick={() => setSelectedApprovalId(record.id)}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-grid-2">
            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Milestone Progress</h3>
                  <p>Project monitoring by major research milestone.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {MILESTONE_ROWS.map((row) => (
                    <article key={row.label} className="admin-surface-card" style={{ padding: '1rem' }}>
                      <div className="admin-metric-row-header">
                        <strong>{row.label}</strong>
                        <span className="admin-note">{row.completed} complete | {row.pending} pending</span>
                      </div>
                      <div className="admin-progress-track" style={{ marginTop: '0.85rem' }}>
                        <div className="admin-progress-bar" style={{ width: `${row.progress}%` }}></div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Delayed or At-Risk Projects</h3>
                  <p>Records highlighted for Research Head follow-up.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {APPROVAL_RECORDS.filter((record) => record.risk !== 'Normal').map((record) => (
                    <article key={record.id} className="admin-watchlist-item">
                      <div>
                        <strong>{record.title}</strong>
                        <span className="admin-table-meta">{record.notes}</span>
                      </div>
                      <span className={`status-badge ${record.risk === 'Delayed' ? 'status-critical' : 'status-review'}`}>{record.risk}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </div>
      </AdminShell>

      {selectedApproval ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setSelectedApprovalId(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Approval Review</h3>
                <p>{selectedApproval.id} | {selectedApproval.type}</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setSelectedApprovalId(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-page-stack">
                <section>
                  <span className={`status-badge ${selectedApproval.statusClass}`}>{selectedApproval.status}</span>
                  <h2 style={{ marginTop: '0.8rem', fontSize: '1.45rem', fontWeight: 800 }}>{selectedApproval.title}</h2>
                  <p className="admin-note">{selectedApproval.notes}</p>
                </section>
                <div className="admin-profile-detail-grid">
                  {[
                    ['Department', selectedApproval.department],
                    ['Adviser', selectedApproval.adviser],
                    ['Submitted', selectedApproval.submittedAt],
                    ['Due', selectedApproval.dueIn],
                    ['Risk', selectedApproval.risk],
                    ['Milestone', `${selectedApproval.progress}% ${selectedApproval.milestone}`]
                  ].map(([label, value]) => (
                    <div key={label} className="admin-profile-detail-item">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setSelectedApprovalId(null)}>
                Close
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setSelectedApprovalId(null)}>
                Mark Reviewed
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
