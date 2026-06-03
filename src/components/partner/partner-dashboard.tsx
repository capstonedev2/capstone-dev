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
  PartnerStatusBadge
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerDashboard() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [search, setSearch] = useState('');
  const [selectedTechnologyId, setSelectedTechnologyId] = useState<string | null>(null);

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
    PARTNER_TECHNOLOGIES.find((technology) => technology.id === selectedTechnologyId) || null;

  return (
    <PartnerShell
      activeNav="dashboard"
      title="Partner / Beneficiary Dashboard"
      description="Discover and adopt innovative technologies"
      notificationCount={2}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Premium KPI Section */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <article style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ color: '#DBEAFE', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-microchip" style={{ color: '#F6BE00', fontSize: '1.1rem' }}></i> Available Technologies
            </span>
            <strong style={{ color: 'white', fontSize: '2.5rem', lineHeight: 1 }}>{PARTNER_TECHNOLOGIES.length}</strong>
            <span style={{ color: '#93C5FD', fontSize: '0.85rem' }}>Ready for adoption</span>
            <i className="fas fa-microchip" style={{ position: 'absolute', right: '-15px', bottom: '-20px', fontSize: '7rem', color: 'rgba(255,255,255,0.05)', transform: 'rotate(-15deg)' }}></i>
          </article>

          <article style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ color: '#DBEAFE', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-code-pull-request" style={{ color: '#38BDF8', fontSize: '1.1rem' }}></i> My Requests
            </span>
            <strong style={{ color: 'white', fontSize: '2.5rem', lineHeight: 1 }}>{PARTNER_REQUESTS.length}</strong>
            <span style={{ color: '#93C5FD', fontSize: '0.85rem' }}>2 approved, 2 pending</span>
            <i className="fas fa-code-pull-request" style={{ position: 'absolute', right: '-15px', bottom: '-20px', fontSize: '7rem', color: 'rgba(255,255,255,0.05)', transform: 'rotate(-15deg)' }}></i>
          </article>

          <article style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ color: '#DBEAFE', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-network-wired" style={{ color: '#F87171', fontSize: '1.1rem' }}></i> Active Implementations
            </span>
            <strong style={{ color: 'white', fontSize: '2.5rem', lineHeight: 1 }}>{PARTNER_IMPLEMENTATIONS.length}</strong>
            <span style={{ color: '#93C5FD', fontSize: '0.85rem' }}>Currently deployed</span>
            <i className="fas fa-network-wired" style={{ position: 'absolute', right: '-15px', bottom: '-20px', fontSize: '7rem', color: 'rgba(255,255,255,0.05)', transform: 'rotate(-15deg)' }}></i>
          </article>

          <article style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ color: '#DBEAFE', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-chart-line" style={{ color: '#34D399', fontSize: '1.1rem' }}></i> Success Rate
            </span>
            <strong style={{ color: 'white', fontSize: '2.5rem', lineHeight: 1 }}>85%</strong>
            <span style={{ color: '#93C5FD', fontSize: '0.85rem' }}>Successful adoptions</span>
            <i className="fas fa-chart-line" style={{ position: 'absolute', right: '-15px', bottom: '-20px', fontSize: '7rem', color: 'rgba(255,255,255,0.05)', transform: 'rotate(-15deg)' }}></i>
          </article>
        </section>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'white', padding: '1rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.5rem 1rem', flex: 1, minWidth: '250px' }}>
            <i className="fas fa-search" style={{ color: '#94A3B8', marginRight: '0.8rem' }}></i>
            <input
              placeholder="Search available technologies..."
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#334155' }}
            />
          </div>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: 'white', color: '#475569', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
            <option>All Departments</option>
            <option>IT</option>
            <option>MET</option>
            <option>TCM</option>
            <option>ESM</option>
            <option>NAME</option>
          </select>
          <select defaultValue="Sort by: Latest" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: 'white', color: '#475569', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
            <option>Sort by: Latest</option>
            <option>Most Popular</option>
            <option>Highest Impact</option>
          </select>
        </div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {visibleTechnologies.map((technology) => (
            <article key={technology.id} style={{ borderTop: '4px solid #003A8F', borderRadius: '1rem', padding: '1.5rem', background: 'white', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 58, 143, 0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 58, 143, 0.05)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003A8F', fontSize: '1.6rem' }}>
                  <i aria-hidden="true" className={`fas ${technology.icon}`} />
                </div>
                <PartnerDepartmentBadge>{technology.department}</PartnerDepartmentBadge>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#111827', margin: '0 0 0.5rem 0', fontWeight: 800 }}>{technology.title}</h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{technology.summary}</p>
              </div>
              
              <div style={{ background: '#F8FAFC', padding: '1.2rem', borderRadius: '12px', border: '1px solid #F1F5F9', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  <span>Readiness: {technology.readinessLabel}</span>
                  <span style={{ color: '#003A8F' }}>{technology.readinessPercent}%</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${technology.readinessPercent}%`, background: 'linear-gradient(90deg, #003A8F, #2563EB)', height: '100%' }}></div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ color: '#334155' }}>Impact Rating:</strong> 
                  <span style={{ color: '#F6BE00' }}>{getImpactStars(technology.impactRating)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button onClick={() => setSelectedTechnologyId(technology.id)} style={{ flex: 1, padding: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderRadius: '0.6rem', fontWeight: 600, background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', border: 'none', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 4px 10px rgba(0, 58, 143, 0.2)' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 58, 143, 0.3)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 58, 143, 0.2)'}>
                  <i className="fas fa-handshake"></i> Adopt
                </button>
                <Link className="btn btn-outline" href={`/partner/details?id=${technology.id}`} style={{ flex: 1, padding: '0.7rem', textAlign: 'center', borderColor: '#E5E7EB', color: '#475569', borderRadius: '0.6rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  Details
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Implementations Table */}
        <section style={{ borderTop: '4px solid #F6BE00', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.06)', background: 'white', borderRadius: '1rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 800 }}>My Active Implementations</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>Monitor deployment phase, partner coordination, and feedback timing.</p>
            </div>
            <Link className="btn btn-outline small" href="/partner/implementations" style={{ borderColor: '#E5E7EB', color: '#003A8F', borderRadius: '0.6rem', fontWeight: 600, padding: '0.5rem 1rem' }}>
              Open Full Tracker <i className="fas fa-arrow-right" style={{ marginLeft: '0.4rem' }}></i>
            </Link>
          </div>
          
          <div className="table-scroll" style={{ padding: '0 1.5rem 1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Project</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Adoption Date</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>Impact</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {PARTNER_IMPLEMENTATIONS.map((implementation, i) => (
                  <tr key={implementation.id} style={{ borderBottom: i === PARTNER_IMPLEMENTATIONS.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 0.5rem', color: '#003A8F', fontWeight: 700 }}>{implementation.title}</td>
                    <td style={{ padding: '1rem 0.5rem' }}><PartnerDepartmentBadge>{implementation.department}</PartnerDepartmentBadge></td>
                    <td style={{ padding: '1rem 0.5rem', color: '#475569' }}>{implementation.startDate}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <PartnerStatusBadge tone={getPartnerStatusTone(implementation.status)}>{implementation.status}</PartnerStatusBadge>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#475569', fontWeight: 600 }}>{implementation.impactLabel}</td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link className="btn btn-outline small" href="/partner/feedback" style={{ borderColor: '#E5E7EB', color: '#475569', borderRadius: '0.4rem', fontWeight: 600 }}>Report</Link>
                        <Link className="btn btn-outline small" href="/partner/implementations" style={{ borderColor: '#E5E7EB', color: '#003A8F', borderRadius: '0.4rem', fontWeight: 600 }}>Monitor</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <PartnerModal
        open={Boolean(selectedTechnologyId)}
        title="Request Technology Adoption"
        onClose={() => setSelectedTechnologyId(null)}
        footer={
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setSelectedTechnologyId(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600 }}>Cancel</button>
            <Link className="btn btn-primary" href={`/partner/request?id=${selectedTechnology?.id}`} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #003A8F, #1E40AF)', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', textDecoration: 'none' }}>
              Continue Request <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        }
      >
        <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#EFF6FF', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003A8F', fontSize: '1.3rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <i className={`fas ${selectedTechnology?.icon}`}></i>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Project</span>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1E3A8A', fontWeight: 800 }}>{selectedTechnology?.title}</h4>
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="partner-dashboard-plan" style={{ fontWeight: 600, color: '#334155' }}>Proposed Implementation Plan</label>
            <textarea
              defaultValue="We plan to deploy the system in a controlled pilot environment before full organizational rollout."
              id="partner-dashboard-plan"
              rows={4}
              style={{ padding: '0.8rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', resize: 'vertical' }}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="partner-dashboard-date" style={{ fontWeight: 600, color: '#334155' }}>Expected Timeline</label>
            <input defaultValue="2026-05-15" id="partner-dashboard-date" type="date" style={{ padding: '0.8rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none' }} />
          </div>
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
