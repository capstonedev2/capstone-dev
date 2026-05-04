'use client';

import { useState } from 'react';
import { PARTNER_PROFILE } from '@/components/partner/partner-data';
import { PartnerButton, PartnerModal } from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerProfile() {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <PartnerShell
      activeNav="profile"
      title="Partner Profile"
      description="Manage organization details, contact points, and collaboration preferences"
      notificationCount={1}
    >
      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-summary">
            <span className="profile-avatar-lg">
              <i aria-hidden="true" className="fas fa-building" />
            </span>
            <h3 style={{ margin: 0 }}>{PARTNER_PROFILE.companyName}</h3>
            <p>{PARTNER_PROFILE.companyType}</p>
            <span className="pill">Partner since {PARTNER_PROFILE.partnerSince}</span>
            <PartnerButton variant="primary" onClick={() => setEditOpen(true)}>
              Edit Profile
            </PartnerButton>
          </div>
        </section>

        <section className="profile-card">
          <h3>Organization Details</h3>
          <div className="detail-list">
            <p><strong>Contact Person:</strong> {PARTNER_PROFILE.contactPerson}</p>
            <p><strong>Role:</strong> {PARTNER_PROFILE.role}</p>
            <p><strong>Email:</strong> {PARTNER_PROFILE.email}</p>
            <p><strong>Phone:</strong> {PARTNER_PROFILE.phone}</p>
            <p><strong>Address:</strong> {PARTNER_PROFILE.address}</p>
          </div>
        </section>

        <section className="profile-card">
          <h3>Adoption Summary</h3>
          <div className="detail-list">
            <p><strong>Active Requests:</strong> {PARTNER_PROFILE.activeRequests}</p>
            <p><strong>Successful Adoptions:</strong> {PARTNER_PROFILE.successfulAdoptions}</p>
            <p><strong>Preferred Departments:</strong> {PARTNER_PROFILE.preferredDepartments.join(', ')}</p>
          </div>
        </section>
      </div>

      <div className="card-grid-two">
        <section className="profile-card">
          <h3>Focus Areas</h3>
          <div className="badge-row">
            {PARTNER_PROFILE.focusAreas.map((focus) => (
              <span className="pill" key={focus}>{focus}</span>
            ))}
          </div>
        </section>

        <section className="profile-card">
          <h3>Portal Preferences</h3>
          <div className="setting-list">
            <div className="setting-item">
              <div>
                <strong>Email updates</strong>
                <p className="inline-note">Receive approval and MOA updates by email.</p>
              </div>
              <span className="pill">Enabled</span>
            </div>
            <div className="setting-item">
              <div>
                <strong>Demo reminders</strong>
                <p className="inline-note">Receive reminders for demos and implementation checkpoints.</p>
              </div>
              <span className="pill">Enabled</span>
            </div>
          </div>
        </section>
      </div>

      <PartnerModal
        open={editOpen}
        title="Edit Partner Profile"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <PartnerButton onClick={() => setEditOpen(false)}>Cancel</PartnerButton>
            <PartnerButton variant="primary" onClick={() => setEditOpen(false)}>
              Save Changes
            </PartnerButton>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="partner-profile-company">Company Name</label>
          <input defaultValue={PARTNER_PROFILE.companyName} id="partner-profile-company" />
        </div>
        <div className="form-group">
          <label htmlFor="partner-profile-contact">Contact Person</label>
          <input defaultValue={PARTNER_PROFILE.contactPerson} id="partner-profile-contact" />
        </div>
        <div className="form-group">
          <label htmlFor="partner-profile-email">Email</label>
          <input defaultValue={PARTNER_PROFILE.email} id="partner-profile-email" />
        </div>
        <div className="form-group">
          <label htmlFor="partner-profile-phone">Phone</label>
          <input defaultValue={PARTNER_PROFILE.phone} id="partner-profile-phone" />
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
