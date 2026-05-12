'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const TRANSFER_PROJECTS = [
  {
    id: 'TT-2026-001',
    title: 'AI Inventory System',
    department: 'IT',
    partner: 'TechCorp Inc.',
    status: 'Deployed',
    statusClass: 'status-approved',
    adoptionDate: 'Jan 2024',
    impact: '5/5',
    note: 'Operational pilot deployed for inventory visibility and audit automation.'
  },
  {
    id: 'TT-2026-002',
    title: 'Smart Energy Monitor',
    department: 'MET',
    partner: 'GreenEnergy PH',
    status: 'Testing',
    statusClass: 'status-info',
    adoptionDate: 'Feb 2024',
    impact: '4/5',
    note: 'Validation phase underway ahead of a broader sustainability trial.'
  },
  {
    id: 'TT-2026-003',
    title: 'Marine Pollution Detector',
    department: 'NAME',
    partner: 'OceanTech Inc.',
    status: 'Operational',
    statusClass: 'status-approved',
    adoptionDate: 'Dec 2023',
    impact: '5/5',
    note: 'Integrated into a live environmental monitoring workflow.'
  },
  {
    id: 'TT-2026-004',
    title: 'Herbal Medicine Knowledge Portal',
    department: 'TCM',
    partner: 'HealthNet Foundation',
    status: 'Pending',
    statusClass: 'status-pending',
    adoptionDate: '—',
    impact: '—',
    note: 'Awaiting partner agreement finalization.'
  }
];

export function AdminTechnologyTransfer() {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? TRANSFER_PROJECTS : TRANSFER_PROJECTS.filter((p) => p.status === filter);
  const deployed = TRANSFER_PROJECTS.filter((p) => p.status === 'Deployed' || p.status === 'Operational').length;

  return (
    <AdminShell
      activeNav="technology-transfer"
      title="Technology Transfer"
      description="Monitor deployment-ready projects, partner adoptions, and technology transfer outcomes across departments."
    >
      <div className="admin-page-stack">
        <section className="admin-grid-4">
          <article className="admin-kpi-card">
            <span className="admin-kpi-label">Total Transfer Projects</span>
            <strong className="admin-kpi-value">{TRANSFER_PROJECTS.length}</strong>
            <span className="admin-kpi-meta">Projects with partner interest or pilot activity</span>
          </article>
          <article className="admin-kpi-card">
            <span className="admin-kpi-label">Deployed / Operational</span>
            <strong className="admin-kpi-value">{deployed}</strong>
            <span className="admin-kpi-meta">Live deployments with external partners</span>
          </article>
          <article className="admin-kpi-card">
            <span className="admin-kpi-label">Testing Phase</span>
            <strong className="admin-kpi-value">{TRANSFER_PROJECTS.filter((p) => p.status === 'Testing').length}</strong>
            <span className="admin-kpi-meta">Validation before full adoption</span>
          </article>
          <article className="admin-kpi-card">
            <span className="admin-kpi-label">Pending Agreements</span>
            <strong className="admin-kpi-value">{TRANSFER_PROJECTS.filter((p) => p.status === 'Pending').length}</strong>
            <span className="admin-kpi-meta">Awaiting partner finalization</span>
          </article>
        </section>

        <section className="admin-section-card">
          <div className="admin-section-head">
            <div>
              <h3>Technology Transfer Registry</h3>
              <p>Track deployment-ready capstone projects with industry partner adoption status.</p>
            </div>
            <div className="admin-toolbar-actions">
              <select
                className="admin-toolbar-select"
                style={{ width: 'auto', minWidth: '140px' }}
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option>All</option>
                <option>Deployed</option>
                <option>Operational</option>
                <option>Testing</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project</th>
                  <th>Department</th>
                  <th>Partner</th>
                  <th>Status</th>
                  <th>Adoption Date</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id}>
                    <td>{project.id}</td>
                    <td>
                      <span className="table-title">{project.title}</span>
                      <span className="table-subtitle">{project.note}</span>
                    </td>
                    <td><span className="dept-badge">{project.department}</span></td>
                    <td>{project.partner}</td>
                    <td><span className={`status-badge ${project.statusClass}`}>{project.status}</span></td>
                    <td>{project.adoptionDate}</td>
                    <td><strong>{project.impact}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
