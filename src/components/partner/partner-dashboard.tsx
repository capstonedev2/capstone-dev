'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  PARTNER_IMPLEMENTATIONS,
  PARTNER_REQUESTS,
  PARTNER_TECHNOLOGIES,
  getImpactStars,
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

export function PartnerDashboard() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [search, setSearch] = useState('');
  const [selectedTechnologyId, setSelectedTechnologyId] = useState(PARTNER_TECHNOLOGIES[0].id);

  const visibleTechnologies = useMemo(() => {
    return PARTNER_TECHNOLOGIES.filter((technology) => {
      const matchesDepartment =
        departmentFilter === 'All Departments' || technology.department === departmentFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        technology.title.toLowerCase().includes(term) ||
        technology.summary.toLowerCase().includes(term);

      return matchesDepartment && matchesSearch;
    }).slice(0, 3);
  }, [departmentFilter, search]);

  const selectedTechnology =
    PARTNER_TECHNOLOGIES.find((technology) => technology.id === selectedTechnologyId) ??
    PARTNER_TECHNOLOGIES[0];

  return (
    <PartnerShell
      activeNav="dashboard"
      title="Partner / Beneficiary Dashboard"
      description="Discover and adopt innovative technologies"
      notificationCount={2}
    >
      <div className="stats-grid">
        <PartnerStatCard title="Available Technologies" value={PARTNER_TECHNOLOGIES.length} note="Ready for adoption" />
        <PartnerStatCard title="My Requests" value={PARTNER_REQUESTS.length} note="2 approved, 2 pending" />
        <PartnerStatCard title="Active Implementations" value={PARTNER_IMPLEMENTATIONS.length} note="Currently deployed" />
        <PartnerStatCard title="Success Rate" value="85%" note="Successful adoptions" />
      </div>

      <div className="filter-bar">
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option>All Departments</option>
          <option>IT</option>
          <option>MET</option>
          <option>TCM</option>
          <option>ESM</option>
          <option>NAME</option>
        </select>
        <select defaultValue="Sort by: Latest">
          <option>Sort by: Latest</option>
          <option>Most Popular</option>
          <option>Highest Impact</option>
        </select>
        <input
          placeholder="Search technologies..."
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="features-grid">
        {visibleTechnologies.map((technology) => (
          <article className="feature-card" key={technology.id}>
            <i aria-hidden="true" className={`fas ${technology.icon}`} style={{ fontSize: '2rem', color: 'var(--portal-primary)' }} />
            <h3>{technology.title}</h3>
            <PartnerDepartmentBadge>{technology.department}</PartnerDepartmentBadge>
            <p>{technology.summary}</p>
            <div className="progress-container">
              <span className="progress-fill" style={{ width: `${technology.readinessPercent}%` }} />
            </div>
            <p>
              Technology Readiness: <strong>{technology.readinessLabel}</strong>
            </p>
            <p>Impact Rating: {getImpactStars(technology.impactRating)}</p>
            <div className="card-actions" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <PartnerButton
                variant="primary"
                onClick={() => {
                  setSelectedTechnologyId(technology.id);
                }}
              >
                Request Adoption
              </PartnerButton>
              <Link className="btn btn-outline" href={`/partner/details?id=${technology.id}`}>
                View Details
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className="table-container mt-3">
        <div className="table-head">
          <div>
            <h3>My Active Implementations</h3>
            <p>Monitor deployment phase, partner coordination, and feedback timing.</p>
          </div>
          <Link className="btn btn-outline small" href="/partner/implementations">
            Open Full Tracker
          </Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Department</th>
                <th>Adoption Date</th>
                <th>Status</th>
                <th>Impact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {PARTNER_IMPLEMENTATIONS.map((implementation) => (
                <tr key={implementation.id}>
                  <td>
                    <strong>{implementation.title}</strong>
                  </td>
                  <td>
                    <PartnerDepartmentBadge>{implementation.department}</PartnerDepartmentBadge>
                  </td>
                  <td>{implementation.startDate}</td>
                  <td>
                    <PartnerStatusBadge tone={getPartnerStatusTone(implementation.status)}>
                      {implementation.status}
                    </PartnerStatusBadge>
                  </td>
                  <td>{implementation.impactLabel}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-outline small" href="/partner/feedback">
                        Report
                      </Link>
                      <Link className="btn btn-outline small" href="/partner/implementations">
                        Monitor
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PartnerModal
        open={Boolean(selectedTechnologyId)}
        title="Request Technology Adoption"
        onClose={() => setSelectedTechnologyId('')}
        footer={
          <>
            <PartnerButton onClick={() => setSelectedTechnologyId('')}>Cancel</PartnerButton>
            <Link className="btn btn-primary" href={`/partner/request?id=${selectedTechnology.id}`}>
              Continue Request
            </Link>
          </>
        }
      >
        <p>
          <strong>Project:</strong> {selectedTechnology.title}
        </p>
        <div className="form-group">
          <label htmlFor="partner-dashboard-plan">Proposed Implementation Plan</label>
          <textarea
            defaultValue="We plan to deploy the system in a controlled pilot environment before full organizational rollout."
            id="partner-dashboard-plan"
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="partner-dashboard-date">Expected Timeline</label>
          <input defaultValue="2026-05-15" id="partner-dashboard-date" type="date" />
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
