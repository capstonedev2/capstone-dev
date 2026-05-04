'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const TRANSFER_PROJECTS = [
  {
    id: 'TT-IT-014',
    project: 'AI-Powered Learning Management System',
    department: 'IT',
    adviser: 'Dr. Ricardo Cruz',
    partner: 'CDO Learning Resource Center',
    status: 'Under Review',
    statusClass: 'status-review',
    readiness: 84,
    impact: 'Projected 600 student users per semester',
    utilization: 'Pilot dashboard prepared',
    feedback: 'Partner requested a data privacy checklist before pilot launch.'
  },
  {
    id: 'TT-MET-021',
    project: 'Smart Solar Energy Monitoring System',
    department: 'MET',
    adviser: 'Prof. Maria Ramos',
    partner: 'GreenEnergy PH',
    status: 'Matched',
    statusClass: 'status-success',
    readiness: 72,
    impact: 'Expected 14% energy-use visibility improvement',
    utilization: 'Prototype installed in test bay',
    feedback: 'Partner approved pilot scope and requested maintenance guide.'
  },
  {
    id: 'TT-ESM-017',
    project: 'Sustainable Agriculture IoT System',
    department: 'ESM',
    adviser: 'Prof. Jose Lopez',
    partner: 'Lumbia Farmers Cooperative',
    status: 'Deployed',
    statusClass: 'status-approved',
    readiness: 91,
    impact: '36 farm plots monitored during first deployment month',
    utilization: 'Active field deployment',
    feedback: 'Partner reported improved irrigation scheduling and requested training materials.'
  },
  {
    id: 'TT-NAME-011',
    project: 'Marine Pollution Detection Drone',
    department: 'NAME',
    adviser: 'Dr. Elena Aquino',
    partner: 'OceanTech Inc.',
    status: 'In Use',
    statusClass: 'status-info',
    readiness: 96,
    impact: '5 coastal monitoring runs completed',
    utilization: 'Operational partner workflow',
    feedback: 'Partner confirmed continued adoption for environmental monitoring.'
  },
  {
    id: 'TT-TCM-008',
    project: 'Herbal Medicine Knowledge Portal',
    department: 'TCM',
    adviser: 'Dr. Anna Reyes',
    partner: 'Unmatched',
    status: 'Under Review',
    statusClass: 'status-review',
    readiness: 48,
    impact: 'Potential community health reference portal',
    utilization: 'Needs content validation',
    feedback: 'No partner feedback yet. Requires validation partner matching.'
  }
];

const PARTNER_MATCHES = [
  { partner: 'CDO Learning Resource Center', sector: 'Education', interests: 'Learning analytics, student retention', matched: 2 },
  { partner: 'GreenEnergy PH', sector: 'Energy', interests: 'IoT monitoring, renewable energy dashboards', matched: 1 },
  { partner: 'Lumbia Farmers Cooperative', sector: 'Agriculture', interests: 'Smart irrigation, farm analytics', matched: 1 },
  { partner: 'OceanTech Inc.', sector: 'Marine Technology', interests: 'Pollution monitoring, drone systems', matched: 1 }
];

const STATUS_OPTIONS = ['All Deployment Statuses', 'Under Review', 'Matched', 'Deployed', 'In Use'];

export function AdminTechnologyTransfer() {
  const [statusFilter, setStatusFilter] = useState('All Deployment Statuses');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(
    () =>
      TRANSFER_PROJECTS.filter((project) => {
        const matchesStatus = statusFilter === 'All Deployment Statuses' || project.status === statusFilter;
        const matchesDepartment = departmentFilter === 'All Departments' || project.department === departmentFilter;

        return matchesStatus && matchesDepartment;
      }),
    [departmentFilter, statusFilter]
  );

  const selectedProject = TRANSFER_PROJECTS.find((project) => project.id === selectedProjectId) ?? null;
  const availableCount = TRANSFER_PROJECTS.filter((project) => project.status === 'Under Review').length;
  const matchedCount = TRANSFER_PROJECTS.filter((project) => project.status === 'Matched').length;
  const deployedCount = TRANSFER_PROJECTS.filter((project) => project.status === 'Deployed' || project.status === 'In Use').length;
  const averageReadiness = Math.round(TRANSFER_PROJECTS.reduce((sum, project) => sum + project.readiness, 0) / TRANSFER_PROJECTS.length);

  return (
    <>
      <AdminShell
        activeNav="technology-transfer"
        title="Technology Transfer"
        description="View transfer-ready projects, partner matches, deployment status, feedback, and utilization impact."
      >
        <div className="admin-page-stack">
          <section className="admin-grid-4">
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Available for Review</span>
              <strong className="admin-kpi-value">{availableCount}</strong>
              <span className="admin-kpi-meta">Projects being screened for transfer readiness.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Partner Matched</span>
              <strong className="admin-kpi-value">{matchedCount}</strong>
              <span className="admin-kpi-meta">Projects with active partner matching records.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Deployed / In Use</span>
              <strong className="admin-kpi-value">{deployedCount}</strong>
              <span className="admin-kpi-meta">Projects already deployed or adopted by partners.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Readiness Score</span>
              <strong className="admin-kpi-value">{averageReadiness}%</strong>
              <span className="admin-kpi-meta">Average transfer readiness across tracked projects.</span>
            </article>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-body">
              <div className="admin-toolbar compact">
                <div className="span-3 admin-toolbar-field">
                  <label>Deployment Status</label>
                  <select className="admin-toolbar-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="span-3 admin-toolbar-field">
                  <label>Department</label>
                  <select className="admin-toolbar-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                    {['All Departments', 'IT', 'MET', 'ESM', 'NAME', 'TCM'].map((department) => <option key={department}>{department}</option>)}
                  </select>
                </div>
                <div className="span-6 admin-toolbar-actions">
                  <button className="btn btn-primary" type="button">
                    <i className="fas fa-handshake"></i>
                    Match Partner
                  </button>
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
                <h3>Transfer Pipeline</h3>
                <p>Track deployment status: Under Review, Matched, Deployed, and In Use.</p>
              </div>
              <span className="status-badge status-info">{filteredProjects.length} projects</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Department</th>
                    <th>Adviser</th>
                    <th>Partner</th>
                    <th>Status</th>
                    <th>Readiness</th>
                    <th>Utilization / Impact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <span className="table-title">{project.project}</span>
                        <span className="table-subtitle">{project.id}</span>
                      </td>
                      <td><span className="dept-badge">{project.department}</span></td>
                      <td>{project.adviser}</td>
                      <td>{project.partner}</td>
                      <td><span className={`status-badge ${project.statusClass}`}>{project.status}</span></td>
                      <td>
                        <div className="admin-metric-row">
                          <span>{project.readiness}%</span>
                          <div className="admin-progress-track">
                            <div className="admin-progress-bar" style={{ width: `${project.readiness}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-title">{project.utilization}</span>
                        <span className="table-subtitle">{project.impact}</span>
                      </td>
                      <td>
                        <button className="btn btn-outline small" type="button" onClick={() => setSelectedProjectId(project.id)}>
                          View Feedback
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
                  <h3>Partner Matching Board</h3>
                  <p>Potential partners and their current research interests.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {PARTNER_MATCHES.map((partner) => (
                    <article key={partner.partner} className="admin-list-item">
                      <div>
                        <strong>{partner.partner}</strong>
                        <span className="admin-table-meta">{partner.sector} | {partner.interests}</span>
                      </div>
                      <span className="status-badge status-info">{partner.matched} match{partner.matched === 1 ? '' : 'es'}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Partner Feedback Highlights</h3>
                  <p>Recent utilization and adoption notes from partner records.</p>
                </div>
              </div>
              <div className="admin-section-body">
                <div className="admin-list">
                  {TRANSFER_PROJECTS.filter((project) => project.status === 'Deployed' || project.status === 'In Use').map((project) => (
                    <article key={project.id} className="admin-watchlist-item">
                      <div>
                        <strong>{project.partner}</strong>
                        <span className="admin-table-meta">{project.feedback}</span>
                      </div>
                      <span className={`status-badge ${project.statusClass}`}>{project.status}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </div>
      </AdminShell>

      {selectedProject ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setSelectedProjectId(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Partner Feedback and Impact</h3>
                <p>{selectedProject.id} | {selectedProject.partner}</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setSelectedProjectId(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-page-stack">
                <section>
                  <span className={`status-badge ${selectedProject.statusClass}`}>{selectedProject.status}</span>
                  <h2 style={{ marginTop: '0.8rem', fontSize: '1.45rem', fontWeight: 800 }}>{selectedProject.project}</h2>
                  <p className="admin-note">{selectedProject.feedback}</p>
                </section>
                <div className="admin-profile-detail-grid">
                  {[
                    ['Department', selectedProject.department],
                    ['Adviser', selectedProject.adviser],
                    ['Partner', selectedProject.partner],
                    ['Readiness', `${selectedProject.readiness}%`],
                    ['Utilization', selectedProject.utilization],
                    ['Impact', selectedProject.impact]
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
              <button className="btn btn-outline" type="button" onClick={() => setSelectedProjectId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
