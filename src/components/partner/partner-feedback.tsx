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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: "Reports Submitted", value: PARTNER_FEEDBACK.length, icon: "fa-file-alt", color: "#003A8F", bg: "#EFF6FF" },
            { title: "Needs Follow-up", value: PARTNER_FEEDBACK.filter(i => i.status === 'Needs Follow-up').length, icon: "fa-exclamation-circle", color: "#F59E0B", bg: "#FEF3C7" },
            { title: "Resolved Items", value: PARTNER_FEEDBACK.filter(i => i.status === 'Resolved').length, icon: "fa-check-circle", color: "#16A34A", bg: "#DCFCE7" },
            { title: "Active Implementations", value: PARTNER_IMPLEMENTATIONS.length, icon: "fa-rocket", color: "#8B5CF6", bg: "#EDE9FE" }
          ].map((stat, i) => (
            <article key={i} style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', alignItems: 'center', gap: '1.2rem', borderTop: `4px solid ${stat.color}`, position: 'relative', overflow: 'hidden' }}>
              <i className={`fas ${stat.icon}`} style={{ position: 'absolute', right: '-15px', bottom: '-15px', fontSize: '6rem', color: stat.color, opacity: 0.05, transform: 'rotate(-10deg)' }}></i>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0, zIndex: 1 }}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div style={{ zIndex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.title}</h3>
                <h2 style={{ margin: 0, fontSize: '2rem', color: '#0F172A', fontWeight: 800 }}>{stat.value}</h2>
              </div>
            </article>
          ))}
        </div>

        {/* Filter and Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', fontWeight: 600, padding: '0 0.5rem' }}>
              <i className="fas fa-filter"></i> Category
            </div>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', outline: 'none', cursor: 'pointer', fontWeight: 600, minWidth: '200px' }}>
              <option>All Categories</option>
              <option>Progress Report</option>
              <option>Issue Log</option>
              <option>Impact Feedback</option>
            </select>
          </div>
          <button onClick={() => setSubmitOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 58, 143, 0.2)' }}>
            <i className="fas fa-plus"></i> New Feedback Report
          </button>
        </div>

        {/* Feedback Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {feedbackEntries.map((entry) => (
            <article key={entry.id} style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #F1F5F9', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 58, 143, 0.1)' }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 58, 143, 0.05)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{entry.title}</h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontWeight: 600 }}>{entry.category}</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}><i className="far fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i>{entry.submittedAt}</span>
              </div>
              
              <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: 1.5, flex: 1, background: '#F8FAFC', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #E2E8F0' }}>
                {entry.summary}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <PartnerStatusBadge tone={getPartnerStatusTone(entry.status)}>{entry.status}</PartnerStatusBadge>
                <button onClick={() => setSelectedFeedbackId(entry.id)} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid #003A8F', background: 'white', color: '#003A8F', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#EFF6FF' }} onMouseOut={(e) => { e.currentTarget.style.background = 'white' }}>
                  Open Entry
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Info Note */}
        <section style={{ background: 'white', borderRadius: '1.2rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', overflow: 'hidden', borderTop: '4px solid #003A8F', display: 'flex', alignItems: 'flex-start', padding: '1.5rem', gap: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#003A8F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Partner Reporting Notes</h3>
            <p style={{ margin: '0 0 0.8rem 0', color: '#475569', fontSize: '0.95rem', lineHeight: 1.5 }}>Use this area for implementation blockers, user feedback, and operational impact documentation.</p>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, background: '#F8FAFC', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #E2E8F0' }}>
              Reporting records support TTO validation, refinement requests, and implementation closeout. Keep summaries concise and attach evidence during scheduled reviews.
            </p>
          </div>
        </section>

      </div>

      <PartnerModal
        open={Boolean(selectedFeedbackId)}
        title={selectedFeedback.title}
        onClose={() => setSelectedFeedbackId('')}
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
            <button onClick={() => setSelectedFeedbackId('')} style={{ background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.4rem 1rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.85rem' }}>{selectedFeedback.category}</span>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}><i className="far fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i>{selectedFeedback.submittedAt}</span>
            <PartnerStatusBadge tone={getPartnerStatusTone(selectedFeedback.status)}>{selectedFeedback.status}</PartnerStatusBadge>
          </div>
          
          <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid #E2E8F0' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.8rem' }}>Summary details</span>
            <p style={{ margin: 0, color: '#0F172A', fontSize: '0.95rem', lineHeight: 1.6 }}>{selectedFeedback.summary}</p>
          </div>
        </div>
      </PartnerModal>

      <PartnerModal
        open={submitOpen}
        title="New Feedback Report"
        onClose={() => setSubmitOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
            <button onClick={() => setSubmitOpen(false)} style={{ background: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => setSubmitOpen(false)} style={{ background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              Submit Report
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="partner-feedback-implementation" style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Implementation Project</label>
            <select id="partner-feedback-implementation" style={{ padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', color: '#0F172A', cursor: 'pointer', fontWeight: 600 }}>
              {PARTNER_IMPLEMENTATIONS.map((implementation) => (
                <option key={implementation.id} value={implementation.id}>
                  {implementation.title}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="partner-feedback-category" style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Report Category</label>
            <select defaultValue="Progress Report" id="partner-feedback-category" style={{ padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', color: '#0F172A', cursor: 'pointer', fontWeight: 600 }}>
              <option>Progress Report</option>
              <option>Issue Log</option>
              <option>Impact Feedback</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="partner-feedback-summary" style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Detailed Summary</label>
            <textarea id="partner-feedback-summary" rows={5} placeholder="Describe the progress, issue, or feedback in detail..." style={{ padding: '1rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', color: '#0F172A', resize: 'vertical' }} />
          </div>
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
