'use client';

import { useMemo, useState } from 'react';
import {
  PARTNER_IMPLEMENTATIONS,
  getPartnerStatusTone
} from '@/components/partner/partner-data';
import {
  PartnerButton,
  PartnerDepartmentBadge,
  PartnerModal,
  PartnerStatCard,
  PartnerStatusBadge
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerImplementations() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [phaseFilter, setPhaseFilter] = useState('All Phases');
  const [selectedImplementationId, setSelectedImplementationId] = useState('');

  const implementations = useMemo(() => {
    return PARTNER_IMPLEMENTATIONS.filter((implementation) => {
      const matchesDepartment =
        departmentFilter === 'All Departments' || implementation.department === departmentFilter;
      const matchesPhase = phaseFilter === 'All Phases' || implementation.currentPhase === phaseFilter;

      return matchesDepartment && matchesPhase;
    });
  }, [departmentFilter, phaseFilter]);

  const selectedImplementation =
    PARTNER_IMPLEMENTATIONS.find((implementation) => implementation.id === selectedImplementationId) ??
    PARTNER_IMPLEMENTATIONS[0];

  return (
    <PartnerShell
      activeNav="implementations"
      title="Active Implementations"
      description="Monitor and manage your ongoing technology implementations"
      notificationCount={2}
    >
      <div className="filter-bar">
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option>All Departments</option>
          <option>IT</option>
          <option>MET</option>
          <option>TCM</option>
          <option>ESM</option>
          <option>NAME</option>
        </select>
        <select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}>
          <option>All Phases</option>
          <option>Planning</option>
          <option>Setup</option>
          <option>Testing Phase</option>
          <option>Training</option>
          <option>Go-Live</option>
          <option>Fully Operational</option>
        </select>
      </div>

      <div className="stats-grid">
        <PartnerStatCard title="Active Implementations" value={PARTNER_IMPLEMENTATIONS.length} />
        <PartnerStatCard title="In Testing Phase" value={PARTNER_IMPLEMENTATIONS.filter((item) => item.currentPhase === 'Testing Phase').length} />
        <PartnerStatCard title="Fully Operational" value={PARTNER_IMPLEMENTATIONS.filter((item) => item.currentPhase === 'Fully Operational').length} />
        <PartnerStatCard title="Success Rate" value="94%" />
      </div>

      <div className="features-grid">
        {implementations.map((implementation) => (
          <article className="feature-card implementation-card" key={implementation.id}>
            <h3>{implementation.title}</h3>
            <PartnerDepartmentBadge>{implementation.department}</PartnerDepartmentBadge>
            <div className="progress-container">
              <span className="progress-fill" style={{ width: `${implementation.progress}%` }} />
            </div>
            <p>
              Current Phase: <strong>{implementation.currentPhase}</strong>
            </p>
            <div className="implementation-meta">
              <span>Start Date: {implementation.startDate}</span>
              <span>Target Go-Live: {implementation.targetDate}</span>
              <span>{implementation.impactLabel}</span>
            </div>
            <div className="timeline mt-2">
              {implementation.milestones.map((milestone) => (
                <div className={`timeline-item ${milestone.state}`} key={milestone.label}>
                  <div className="timeline-content">
                    <h4>{milestone.label}</h4>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-actions" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <PartnerButton onClick={() => setSelectedImplementationId(implementation.id)}>
                View Notes
              </PartnerButton>
              <PartnerButton variant="primary">Submit Report</PartnerButton>
            </div>
          </article>
        ))}
      </div>

      <section className="table-container">
        <div className="table-head">
          <div>
            <h3>Implementation Portfolio</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Partner</th>
                <th>Phase</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {implementations.map((implementation) => (
                <tr key={implementation.id}>
                  <td>{implementation.title}</td>
                  <td>{implementation.partner}</td>
                  <td>{implementation.currentPhase}</td>
                  <td>{implementation.progress}%</td>
                  <td>
                    <PartnerStatusBadge tone={getPartnerStatusTone(implementation.status)}>
                      {implementation.status}
                    </PartnerStatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PartnerModal
        open={Boolean(selectedImplementationId)}
        title={selectedImplementation.title}
        onClose={() => setSelectedImplementationId('')}
        footer={<PartnerButton variant="primary" onClick={() => setSelectedImplementationId('')}>Close</PartnerButton>}
      >
        <p><strong>Partner:</strong> {selectedImplementation.partner}</p>
        <p><strong>Current Phase:</strong> {selectedImplementation.currentPhase}</p>
        <p><strong>Target Date:</strong> {selectedImplementation.targetDate}</p>
        <p><strong>Status Note:</strong> Maintain weekly coordination and deployment documentation.</p>
      </PartnerModal>
    </PartnerShell>
  );
}
