'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PARTNER_TECHNOLOGIES, getImpactStars } from '@/components/partner/partner-data';
import {
  PartnerButton,
  PartnerDepartmentBadge,
  PartnerModal
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerProject() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [sortBy, setSortBy] = useState('Sort by: Latest');
  const [search, setSearch] = useState('');
  const [selectedTechnologyId, setSelectedTechnologyId] = useState('');

  const technologies = useMemo(() => {
    const filtered = PARTNER_TECHNOLOGIES.filter((technology) => {
      const matchesDepartment =
        departmentFilter === 'All Departments' || technology.department === departmentFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        technology.title.toLowerCase().includes(term) ||
        technology.summary.toLowerCase().includes(term) ||
        technology.industries.join(' ').toLowerCase().includes(term);

      return matchesDepartment && matchesSearch;
    });

    if (sortBy === 'Highest Impact') {
      return [...filtered].sort((left, right) => right.impactRating - left.impactRating);
    }

    if (sortBy === 'Technology Readiness') {
      return [...filtered].sort((left, right) => right.readinessPercent - left.readinessPercent);
    }

    return filtered;
  }, [departmentFilter, search, sortBy]);

  const selectedTechnology = PARTNER_TECHNOLOGIES.find((technology) => technology.id === selectedTechnologyId);

  return (
    <PartnerShell
      activeNav="project"
      title="Browse Available Technologies"
      description="Discover innovative solutions ready for industry adoption"
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
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option>Sort by: Latest</option>
          <option>Most Popular</option>
          <option>Highest Impact</option>
          <option>Technology Readiness</option>
        </select>
        <input
          placeholder="Search by keyword, technology, or application..."
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="features-grid">
        {technologies.map((technology) => (
          <article className="feature-card" key={technology.id}>
            <div className="details-hero-top">
              <i aria-hidden="true" className={`fas ${technology.icon}`} style={{ fontSize: '2rem', color: 'var(--portal-primary)' }} />
              <PartnerDepartmentBadge>{technology.department}</PartnerDepartmentBadge>
            </div>
            <h3>{technology.title}</h3>
            <p>{technology.summary}</p>
            <div className="progress-container">
              <span className="progress-fill" style={{ width: `${technology.readinessPercent}%` }} />
            </div>
            <p>
              <strong>Technology Readiness:</strong> {technology.trl}
            </p>
            <p>
              <strong>Impact Rating:</strong> {getImpactStars(technology.impactRating)}
            </p>
            <p>
              <strong>Developers:</strong> {technology.developers}
            </p>
            <div className="card-actions" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <PartnerButton variant="primary" onClick={() => setSelectedTechnologyId(technology.id)}>
                Request Adoption
              </PartnerButton>
              <Link className="btn btn-outline" href={`/partner/details?id=${technology.id}`}>
                View Details
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="pagination">
        <button className="active" type="button">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <button type="button">Next</button>
      </div>

      <PartnerModal
        open={Boolean(selectedTechnology)}
        title="Request Adoption"
        narrow
        onClose={() => setSelectedTechnologyId('')}
        footer={
          <>
            <PartnerButton onClick={() => setSelectedTechnologyId('')}>Cancel</PartnerButton>
            {selectedTechnology ? (
              <Link className="btn btn-primary" href={`/partner/request?id=${selectedTechnology.id}`}>
                Open Request Form
              </Link>
            ) : null}
          </>
        }
      >
        {selectedTechnology ? (
          <>
            <p>
              <strong>{selectedTechnology.title}</strong>
            </p>
            <p>{selectedTechnology.summary}</p>
            <p className="inline-note">{selectedTechnology.trl}</p>
          </>
        ) : null}
      </PartnerModal>
    </PartnerShell>
  );
}
