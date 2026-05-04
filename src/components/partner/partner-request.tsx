'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getPartnerTechnology } from '@/components/partner/partner-data';
import {
  PartnerButton,
  PartnerDepartmentBadge,
  PartnerModal
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerRequest() {
  const searchParams = useSearchParams();
  const technology = getPartnerTechnology(searchParams.get('id'));
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <PartnerShell
      activeNav="request"
      title="Request Technology Adoption"
      description="Submit a formal request to adopt a thesis/capstone technology"
      notificationCount={2}
    >
      <div className="stats-grid">
        <article className="stat-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Selected Technology</h3>
          <h2 style={{ fontSize: '1.5rem' }}>{technology.title}</h2>
          <div className="badge-row mt-2">
            <PartnerDepartmentBadge>{technology.department} Department</PartnerDepartmentBadge>
            <span className="pill">{technology.trl}</span>
          </div>
          <p className="mt-2">{technology.summary}</p>
        </article>
      </div>

      <section className="table-container">
        <div className="table-head">
          <div>
            <h3>Adoption Request Form</h3>
          </div>
        </div>
        <div className="modal-body" style={{ paddingTop: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="partner-request-org">Organization Name</label>
            <input defaultValue="TechCorp Inc." id="partner-request-org" type="text" />
          </div>
          <div className="form-group">
            <label htmlFor="partner-request-contact">Contact Person</label>
            <input defaultValue="John Smith" id="partner-request-contact" type="text" />
          </div>
          <div className="form-group">
            <label htmlFor="partner-request-role">Position / Title</label>
            <input defaultValue="CTO" id="partner-request-role" type="text" />
          </div>
          <div className="form-group">
            <label htmlFor="partner-request-email">Email Address</label>
            <input defaultValue="john.smith@techcorp.com" id="partner-request-email" type="email" />
          </div>
          <div className="form-group">
            <label htmlFor="partner-request-phone">Contact Number</label>
            <input defaultValue="+63 917 123 4567" id="partner-request-phone" type="tel" />
          </div>
          <div className="form-group">
            <label htmlFor="partner-request-plan">Proposed Implementation Plan</label>
            <textarea
              defaultValue="We plan to implement this technology in our main facility with an initial 3-month pilot before a phased rollout."
              id="partner-request-plan"
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>Expected Timeline</label>
            <div className="form-grid">
              <input defaultValue="2026-05-01" type="date" />
              <input defaultValue="2026-08-01" type="date" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="partner-request-budget">Budget Range (USD)</label>
            <select defaultValue="$10,000 - $25,000" id="partner-request-budget">
              <option>$5,000 - $10,000</option>
              <option>$10,000 - $25,000</option>
              <option>$25,000 - $50,000</option>
              <option>$50,000+</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="partner-request-extra">Additional Requirements</label>
            <textarea
              defaultValue="We require API integration with our current ERP workflow and partner training for operations staff."
              id="partner-request-extra"
              rows={3}
            />
          </div>
          <label className="checkbox-label">
            <input defaultChecked type="checkbox" />
            I confirm that I have read and agree to the technology transfer agreement terms.
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            I would like to schedule a demo before finalizing.
          </label>
          <div className="card-actions mt-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <PartnerButton variant="primary" onClick={() => setSubmitted(true)}>
              Submit Adoption Request
            </PartnerButton>
            <PartnerButton onClick={() => setDraftSaved(true)}>Save as Draft</PartnerButton>
            <Link className="btn btn-outline" href="/partner/project">
              Cancel
            </Link>
          </div>
        </div>
      </section>

      <PartnerModal
        open={draftSaved}
        title="Save as Draft"
        narrow
        onClose={() => setDraftSaved(false)}
        footer={<PartnerButton variant="primary" onClick={() => setDraftSaved(false)}>OK</PartnerButton>}
      >
        <p>Your request has been saved as a draft. You can continue editing it later from My Requests.</p>
      </PartnerModal>

      <PartnerModal
        open={submitted}
        title="Request Submitted"
        narrow
        onClose={() => setSubmitted(false)}
        footer={
          <>
            <PartnerButton onClick={() => setSubmitted(false)}>Close</PartnerButton>
            <Link className="btn btn-primary" href="/partner/requests">
              Open My Requests
            </Link>
          </>
        }
      >
        <p>
          Your adoption request for <strong>{technology.title}</strong> has been submitted to the technology transfer review queue.
        </p>
      </PartnerModal>
    </PartnerShell>
  );
}
