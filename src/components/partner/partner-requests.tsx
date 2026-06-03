'use client';

import { useMemo, useState } from 'react';
import {
  PARTNER_REQUESTS,
  getPartnerRequest,
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

export function PartnerRequests() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [search, setSearch] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');

  const filteredRequests = useMemo(() => {
    return PARTNER_REQUESTS.filter((request) => {
      const matchesDepartment =
        departmentFilter === 'All Departments' || request.department === departmentFilter;
      const matchesStatus = statusFilter === 'All Statuses' || request.status === statusFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term || request.projectTitle.toLowerCase().includes(term) || request.id.toLowerCase().includes(term);

      return matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [departmentFilter, search, statusFilter]);

  const selectedRequest = getPartnerRequest(selectedRequestId || null);

  return (
    <PartnerShell
      activeNav="requests"
      title="My Adoption Requests"
      description="Track and manage your technology adoption requests"
      notificationCount={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: "Total Requests", value: PARTNER_REQUESTS.length, icon: "fa-folder-open", color: "#003A8F", bg: "#EFF6FF" },
            { title: "Pending Review", value: PARTNER_REQUESTS.filter(i => i.status === 'Pending').length, icon: "fa-clock", color: "#F59E0B", bg: "#FEF3C7" },
            { title: "Approved", value: PARTNER_REQUESTS.filter(i => i.status === 'Approved').length, icon: "fa-check-circle", color: "#16A34A", bg: "#DCFCE7" },
            { title: "In Negotiation", value: PARTNER_REQUESTS.filter(i => i.status === 'Negotiation').length, icon: "fa-handshake", color: "#8B5CF6", bg: "#EDE9FE" }
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

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'white', padding: '1rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.5rem 1rem', flex: 1, minWidth: '300px' }}>
            <i className="fas fa-search" style={{ color: '#94A3B8', marginRight: '0.8rem' }}></i>
            <input
              placeholder="Search by project title or ID..."
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
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: 'white', color: '#475569', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Under Review</option>
            <option>Approved</option>
            <option>Negotiation</option>
            <option>Completed</option>
          </select>
        </div>

        {/* Table */}
        <section style={{ background: 'white', borderRadius: '1.2rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', overflow: 'hidden', borderTop: '4px solid #003A8F' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Active Requests</h3>
          </div>
          <div className="table-scroll" style={{ padding: '0 1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Request ID</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Project Title</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Request Date</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, i) => (
                  <tr key={request.id} style={{ borderBottom: i === filteredRequests.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>{request.id}</td>
                    <td style={{ padding: '1rem', color: '#0F172A', fontWeight: 700 }}>{request.projectTitle}</td>
                    <td style={{ padding: '1rem' }}><PartnerDepartmentBadge>{request.department}</PartnerDepartmentBadge></td>
                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.95rem' }}>{request.requestDate}</td>
                    <td style={{ padding: '1rem' }}>
                      <PartnerStatusBadge tone={getPartnerStatusTone(request.status)}>{request.status}</PartnerStatusBadge>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={() => setSelectedRequestId(request.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>View</button>
                        {request.status === 'Approved' ? (
                          <button style={{ padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: 'none', background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Proceed to MOA</button>
                        ) : request.status === 'Pending' ? (
                          <button style={{ padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                        ) : (
                          <button style={{ padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Continue</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: '#003A8F', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,58,143,0.2)' }}>1</button>
          <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'white'}>2</button>
          <button style={{ padding: '0 1rem', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'white'}>Next <i className="fas fa-chevron-right" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}></i></button>
        </div>
      </div>

      <PartnerModal
        open={Boolean(selectedRequestId)}
        title={`Request Details - ${selectedRequest.id}`}
        onClose={() => setSelectedRequestId('')}
        footer={
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
            <button onClick={() => setSelectedRequestId('')} style={{ background: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            <button onClick={() => setSelectedRequestId('')} style={{ background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              Download MOA Draft <i className="fas fa-file-download"></i>
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#0F172A', fontWeight: 800 }}>{selectedRequest.projectTitle}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <PartnerDepartmentBadge>{selectedRequest.department}</PartnerDepartmentBadge>
              <PartnerStatusBadge tone={getPartnerStatusTone(selectedRequest.status)}>{selectedRequest.status}</PartnerStatusBadge>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Request Date</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{selectedRequest.requestDate}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Budget Range</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{selectedRequest.budgetRange}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Timeline</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{selectedRequest.timeline}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Implementation Plan</span>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: 1.5 }}>{selectedRequest.implementationPlan}</p>
            </div>
            {selectedRequest.comments ? (
              <div style={{ gridColumn: '1 / -1', background: '#FEF9C3', padding: '1rem', borderRadius: '0.6rem', borderLeft: '4px solid #F59E0B' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.4rem' }}>TTO Comments</span>
                <p style={{ margin: 0, color: '#92400E', fontSize: '0.95rem' }}>{selectedRequest.comments}</p>
              </div>
            ) : null}
          </div>
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
