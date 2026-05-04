'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getImpactStars, getPartnerTechnology } from '@/components/partner/partner-data';
import {
  PartnerButton,
  PartnerDepartmentBadge,
  PartnerModal,
  PartnerStatusBadge
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerDetails() {
  const searchParams = useSearchParams();
  const [contactOpen, setContactOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const technology = getPartnerTechnology(searchParams.get('id'));

  return (
    <PartnerShell
      activeNav="details"
      title="Project Details"
      description="Comprehensive information about available technologies"
      notificationCount={2}
    >
      <section className="details-hero">
        <div className="details-hero-top">
          <div className="section-stack">
            <h2 style={{ margin: 0 }}>{technology.title}</h2>
            <div className="badge-row">
              <PartnerDepartmentBadge>{technology.department} Department</PartnerDepartmentBadge>
              <PartnerStatusBadge tone="approved">{technology.trl}</PartnerStatusBadge>
            </div>
          </div>
          <Link className="btn btn-primary" href={`/partner/request?id=${technology.id}`}>
            Request Adoption
          </Link>
        </div>
        <div className="progress-container">
          <span className="progress-fill" style={{ width: `${technology.readinessPercent}%` }} />
        </div>
        <p>Technology Readiness: {technology.readinessPercent}% - system complete and field-tested.</p>
      </section>

      <div className="card-grid-two">
        <section className="summary-card">
          <h3>Project Overview</h3>
          <div className="detail-list">
            <p><strong>Developers:</strong> {technology.developers}</p>
            <p><strong>Adviser:</strong> {technology.adviser}</p>
            <p><strong>Development Period:</strong> {technology.timeline}</p>
            <p><strong>Status:</strong> Completed, ready for commercialization</p>
          </div>
        </section>

        <section className="summary-card">
          <h3>Technology Specifications</h3>
          <div className="detail-list">
            <p><strong>Platform:</strong> {technology.platform}</p>
            <p><strong>Technologies:</strong> {technology.stack}</p>
            <p><strong>Deployment Profile:</strong> Cloud-ready with partner onboarding package</p>
            <p><strong>Impact Rating:</strong> {getImpactStars(technology.impactRating)}</p>
          </div>
        </section>
      </div>

      <section className="table-container">
        <div className="table-head">
          <div>
            <h3>Project Abstract</h3>
          </div>
        </div>
        <div className="modal-body" style={{ paddingTop: '0.75rem' }}>
          <p>{technology.abstract}</p>
        </div>
      </section>

      <div className="card-grid-two">
        <section className="summary-card">
          <h3>Performance Metrics</h3>
          <div className="detail-list">
            <p><strong>Accuracy Rate:</strong> 94.5% in demand prediction</p>
            <p><strong>Response Time:</strong> Less than 200ms for live queries</p>
            <p><strong>User Adoption:</strong> Tested with 50+ end users</p>
            <p><strong>Cost Savings:</strong> Estimated 30% reduction in overhead</p>
          </div>
          <div className="progress-container mt-2">
            <span className="progress-fill" style={{ width: '94%' }} />
          </div>
        </section>

        <section className="summary-card">
          <h3>Target Industries</h3>
          <div className="detail-list">
            {technology.industries.map((industry) => (
              <p key={industry}>✓ {industry}</p>
            ))}
          </div>
        </section>
      </div>

      <section className="table-container">
        <div className="table-head">
          <div>
            <h3>Implementation Requirements</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Description</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {technology.requirements.map((item) => (
                <tr key={item.requirement}>
                  <td>{item.requirement}</td>
                  <td>{item.description}</td>
                  <td>{item.timeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="details-toolbar" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="card-actions" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href={`/partner/request?id=${technology.id}`}>
            <i aria-hidden="true" className="fas fa-handshake" />
            Request Adoption
          </Link>
          <PartnerButton onClick={() => setContactOpen(true)}>
            <i aria-hidden="true" className="fas fa-envelope" />
            Contact Developer Team
          </PartnerButton>
        </div>
        <PartnerButton onClick={() => setDownloadOpen(true)}>
          <i aria-hidden="true" className="fas fa-download" />
          Download Brochure
        </PartnerButton>
      </div>

      <PartnerModal
        open={contactOpen}
        title="Contact Development Team"
        onClose={() => setContactOpen(false)}
        footer={
          <>
            <PartnerButton onClick={() => setContactOpen(false)}>Cancel</PartnerButton>
            <PartnerButton variant="primary" onClick={() => setContactOpen(false)}>
              Send Message
            </PartnerButton>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="partner-contact-name">Your Name</label>
          <input defaultValue="TechCorp Inc." id="partner-contact-name" />
        </div>
        <div className="form-group">
          <label htmlFor="partner-contact-email">Email</label>
          <input defaultValue="contact@techcorp.com" id="partner-contact-email" />
        </div>
        <div className="form-group">
          <label htmlFor="partner-contact-subject">Subject</label>
          <input defaultValue={`Inquiry about ${technology.title}`} id="partner-contact-subject" />
        </div>
        <div className="form-group">
          <label htmlFor="partner-contact-message">Message</label>
          <textarea
            defaultValue="We are interested in adopting this technology. Please share more information about implementation and operational requirements."
            id="partner-contact-message"
            rows={5}
          />
        </div>
      </PartnerModal>

      <PartnerModal
        open={downloadOpen}
        title="Download Information Package"
        narrow
        onClose={() => setDownloadOpen(false)}
        footer={
          <>
            <PartnerButton onClick={() => setDownloadOpen(false)}>Cancel</PartnerButton>
            <PartnerButton variant="primary" onClick={() => setDownloadOpen(false)}>
              Download
            </PartnerButton>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="partner-download-format">Select Format</label>
          <select defaultValue="PDF Brochure" id="partner-download-format">
            <option>PDF Brochure</option>
            <option>Technical Specification Sheet</option>
            <option>Case Study Document</option>
            <option>Full Documentation Package</option>
          </select>
        </div>
        <label className="checkbox-label">
          <input defaultChecked type="checkbox" />
          Also send to my email
        </label>
      </PartnerModal>
    </PartnerShell>
  );
}
