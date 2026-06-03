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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: "Active Implementations", value: PARTNER_IMPLEMENTATIONS.length, icon: "fa-rocket", color: "#003A8F", bg: "#EFF6FF" },
            { title: "In Testing Phase", value: PARTNER_IMPLEMENTATIONS.filter(i => i.currentPhase === 'Testing Phase').length, icon: "fa-flask", color: "#F59E0B", bg: "#FEF3C7" },
            { title: "Fully Operational", value: PARTNER_IMPLEMENTATIONS.filter(i => i.currentPhase === 'Fully Operational').length, icon: "fa-check-circle", color: "#16A34A", bg: "#DCFCE7" },
            { title: "Success Rate", value: "94%", icon: "fa-chart-line", color: "#8B5CF6", bg: "#EDE9FE" }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', fontWeight: 600, padding: '0 0.5rem' }}>
            <i className="fas fa-filter"></i> Filters
          </div>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', outline: 'none', cursor: 'pointer', fontWeight: 600, flex: 1, minWidth: '200px' }}>
            <option>All Departments</option>
            <option>IT</option>
            <option>MET</option>
            <option>TCM</option>
            <option>ESM</option>
            <option>NAME</option>
          </select>
          <select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', outline: 'none', cursor: 'pointer', fontWeight: 600, flex: 1, minWidth: '200px' }}>
            <option>All Phases</option>
            <option>Planning</option>
            <option>Setup</option>
            <option>Testing Phase</option>
            <option>Training</option>
            <option>Go-Live</option>
            <option>Fully Operational</option>
          </select>
        </div>

        {/* Implementation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {implementations.map((implementation) => (
            <article key={implementation.id} style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #F1F5F9', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 58, 143, 0.1)' }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 58, 143, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{implementation.title}</h3>
                <PartnerDepartmentBadge>{implementation.department}</PartnerDepartmentBadge>
              </div>
              
              <div style={{ background: '#F8FAFC', borderRadius: '0.8rem', padding: '1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span style={{ color: '#475569' }}>{implementation.currentPhase}</span>
                  <span style={{ color: '#003A8F' }}>{implementation.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${implementation.progress}%`, height: '100%', background: 'linear-gradient(90deg, #003A8F, #3B82F6)', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, fontSize: '0.75rem' }}>Start Date</span>
                  <span style={{ color: '#334155', fontWeight: 600 }}><i className="far fa-calendar-alt" style={{ marginRight: '0.4rem', color: '#64748B' }}></i>{implementation.startDate}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, fontSize: '0.75rem' }}>Target Go-Live</span>
                  <span style={{ color: '#334155', fontWeight: 600 }}><i className="far fa-flag" style={{ marginRight: '0.4rem', color: '#64748B' }}></i>{implementation.targetDate}</span>
                </div>
                <div style={{ gridColumn: '1 / -1', background: '#DCFCE7', color: '#16A34A', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                  <i className="fas fa-chart-pie"></i> {implementation.impactLabel}
                </div>
              </div>

              {/* Milestones timeline */}
              <div style={{ display: 'flex', marginTop: '0.5rem', padding: '0.5rem 0', gap: '0.2rem' }}>
                {implementation.milestones.map((milestone, idx) => {
                  const isCompleted = milestone.state === 'completed';
                  const isActive = milestone.state === 'current';
                  const isPending = milestone.state === 'pending';
                  
                  return (
                    <div key={milestone.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ height: '4px', background: isCompleted ? '#16A34A' : isActive ? '#3B82F6' : '#E2E8F0', borderRadius: '2px', position: 'relative' }}>
                        {(isCompleted || isActive) && (
                           <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', background: isCompleted ? '#16A34A' : '#3B82F6', border: '2px solid white', boxShadow: '0 0 0 1px ' + (isCompleted ? '#16A34A' : '#3B82F6') }}></div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isCompleted ? '#16A34A' : isActive ? '#3B82F6' : '#94A3B8', textTransform: 'uppercase' }}>
                        {milestone.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <button onClick={() => setSelectedImplementationId(implementation.id)} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'white'}>View Notes</button>
                <button style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 58, 143, 0.2)' }}>Submit Report</button>
              </div>
            </article>
          ))}
        </div>

        {/* Portfolio Table */}
        <section style={{ background: 'white', borderRadius: '1.2rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', overflow: 'hidden', borderTop: '4px solid #003A8F' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Implementation Portfolio</h3>
          </div>
          <div className="table-scroll" style={{ padding: '0 1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Project</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Partner</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Phase</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Progress</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {implementations.map((implementation, i) => (
                  <tr key={implementation.id} style={{ borderBottom: i === implementations.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', color: '#0F172A', fontWeight: 700 }}>{implementation.title}</td>
                    <td style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>{implementation.partner}</td>
                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.95rem' }}>{implementation.currentPhase}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#003A8F', width: '40px' }}>{implementation.progress}%</span>
                        <div style={{ width: '60px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${implementation.progress}%`, height: '100%', background: '#003A8F', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <PartnerStatusBadge tone={getPartnerStatusTone(implementation.status)}>{implementation.status}</PartnerStatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      <PartnerModal
        open={Boolean(selectedImplementationId)}
        title={selectedImplementation.title}
        onClose={() => setSelectedImplementationId('')}
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
            <button onClick={() => setSelectedImplementationId('')} style={{ background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Partner</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{selectedImplementation.partner}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Target Date</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{selectedImplementation.targetDate}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Current Phase</span>
              <div style={{ display: 'inline-block', background: '#EFF6FF', color: '#003A8F', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.85rem' }}>
                {selectedImplementation.currentPhase}
              </div>
            </div>
          </div>
          
          <div style={{ background: '#FEF9C3', padding: '1rem', borderRadius: '0.6rem', borderLeft: '4px solid #F59E0B' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.4rem' }}>Status Note</span>
            <p style={{ margin: 0, color: '#92400E', fontSize: '0.95rem' }}>Maintain weekly coordination and deployment documentation.</p>
          </div>
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
