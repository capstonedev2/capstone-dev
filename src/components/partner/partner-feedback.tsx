'use client';

import { useMemo, useState } from 'react';
import {
  PARTNER_FEEDBACK,
  PARTNER_IMPLEMENTATIONS,
  getPartnerStatusTone
} from '@/components/partner/partner-data';
import {
  PartnerButton,
  PartnerModal,
  PartnerStatCard,
  PartnerStatusBadge
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerFeedback() {
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);

  const feedbackEntries = useMemo(() => {
    return PARTNER_FEEDBACK.filter((entry) => {
      return categoryFilter === 'All Categories' || entry.category === categoryFilter;
    });
  }, [categoryFilter]);

  const selectedFeedback = PARTNER_FEEDBACK.find((entry) => entry.id === selectedFeedbackId) ?? PARTNER_FEEDBACK[0];

  return (
    <PartnerShell
      activeNav="feedback"
      title="Feedback & Reports"
      description="Share partner observations, issue logs, and rollout updates"
      notificationCount={2}
    >
      <div className="filter-bar">
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option>All Categories</option>
          <option>Progress Report</option>
          <option>Issue Log</option>
          <option>Impact Feedback</option>
        </select>
        <PartnerButton variant="primary" onClick={() => setSubmitOpen(true)}>
          <i aria-hidden="true" className="fas fa-plus" />
          New Feedback Report
        </PartnerButton>
      </div>

      <div className="stats-grid">
        <PartnerStatCard title="Reports Submitted" value={PARTNER_FEEDBACK.length} />
        <PartnerStatCard title="Needs Follow-up" value={PARTNER_FEEDBACK.filter((entry) => entry.status === 'Needs Follow-up').length} />
        <PartnerStatCard title="Resolved Items" value={PARTNER_FEEDBACK.filter((entry) => entry.status === 'Resolved').length} />
        <PartnerStatCard title="Active Implementations" value={PARTNER_IMPLEMENTATIONS.length} />
      </div>

      <div className="feedback-list">
        {feedbackEntries.map((entry) => (
          <article className="feedback-card" key={entry.id}>
            <h3>{entry.title}</h3>
            <div className="feedback-meta">
              <span>{entry.category}</span>
              <span>{entry.submittedAt}</span>
            </div>
            <p>{entry.summary}</p>
            <div className="card-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <PartnerStatusBadge tone={getPartnerStatusTone(entry.status)}>{entry.status}</PartnerStatusBadge>
              <PartnerButton small onClick={() => setSelectedFeedbackId(entry.id)}>
                Open Entry
              </PartnerButton>
            </div>
          </article>
        ))}
      </div>

      <section className="table-container">
        <div className="table-head">
          <div>
            <h3>Partner Reporting Notes</h3>
            <p>Use this area for implementation blockers, user feedback, and operational impact documentation.</p>
          </div>
        </div>
        <div className="modal-body" style={{ paddingTop: '1rem' }}>
          <p>
            Reporting records support TTO validation, refinement requests, and implementation closeout. Keep summaries concise and attach evidence during scheduled reviews.
          </p>
        </div>
      </section>

      <PartnerModal
        open={Boolean(selectedFeedbackId)}
        title={selectedFeedback.title}
        onClose={() => setSelectedFeedbackId('')}
        footer={<PartnerButton variant="primary" onClick={() => setSelectedFeedbackId('')}>Close</PartnerButton>}
      >
        <p><strong>Category:</strong> {selectedFeedback.category}</p>
        <p><strong>Submitted:</strong> {selectedFeedback.submittedAt}</p>
        <p><strong>Status:</strong> {selectedFeedback.status}</p>
        <p>{selectedFeedback.summary}</p>
      </PartnerModal>

      <PartnerModal
        open={submitOpen}
        title="New Feedback Report"
        onClose={() => setSubmitOpen(false)}
        footer={
          <>
            <PartnerButton onClick={() => setSubmitOpen(false)}>Cancel</PartnerButton>
            <PartnerButton variant="primary" onClick={() => setSubmitOpen(false)}>
              Submit Report
            </PartnerButton>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="partner-feedback-implementation">Implementation</label>
          <select defaultValue={PARTNER_IMPLEMENTATIONS[0].id} id="partner-feedback-implementation">
            {PARTNER_IMPLEMENTATIONS.map((implementation) => (
              <option key={implementation.id} value={implementation.id}>
                {implementation.title}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="partner-feedback-category">Category</label>
          <select defaultValue="Progress Report" id="partner-feedback-category">
            <option>Progress Report</option>
            <option>Issue Log</option>
            <option>Impact Feedback</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="partner-feedback-summary">Summary</label>
          <textarea id="partner-feedback-summary" rows={5} />
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
