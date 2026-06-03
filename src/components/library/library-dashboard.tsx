'use client';

import Link from 'next/link';
import {
  LIBRARY_DEPARTMENT_SUMMARY,
  LIBRARY_PROJECTS,
  LIBRARY_RECENT_STUDIES,
  getProjectIcon
} from '@/components/library/library-data';
import { LibraryDepartmentBadge, LibraryStatCard } from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

function getTopProject() {
  return [...LIBRARY_PROJECTS].sort((left, right) => right.views - left.views)[0] ?? LIBRARY_PROJECTS[0];
}

export function LibraryDashboard() {
  const featuredProjects = LIBRARY_PROJECTS.slice(0, 4);
  const topProject = getTopProject();

  return (
    <LibraryShell
      activeNav="dashboard"
      title="Digital Knowledge Vault"
      description="Discover, explore, and reference completed academic research."
      hideHeader={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '2rem' }}>
        
        {/* Hero Search Section */}
        <section style={{ position: 'relative', borderRadius: '1.5rem', overflow: 'hidden', background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', padding: '3rem 2rem', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.15)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.5 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '1.5rem 0' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.8rem', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Digital Knowledge Vault</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>Access and manage thousands of completed academic studies, thesis projects, and technology transfer records across all university departments.</p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/library/repository" style={{ textDecoration: 'none', background: '#F6BE00', color: '#003A8F', border: 'none', padding: '0.8rem 2rem', borderRadius: '2rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 8px 15px rgba(246, 190, 0, 0.3)', display: 'flex', alignItems: 'center', gap: '0.6rem' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(246, 190, 0, 0.4)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(246, 190, 0, 0.3)'; }}>
                <i className="fas fa-search" aria-hidden="true" /> Browse Repository
              </Link>
            </div>
          </div>
        </section>

        {/* Bento Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #003A8F', position: 'relative', overflow: 'hidden' }}>
             <i className="fas fa-star" style={{ position: 'absolute', right: '-15px', bottom: '-15px', fontSize: '6rem', color: '#003A8F', opacity: 0.05, transform: 'rotate(-10deg)' }}></i>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#003A8F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-crown"></i></div>
               <span style={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Most Viewed Research</span>
             </div>
             <div>
               <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{topProject.title}</h3>
               <p style={{ margin: 0, color: '#3B82F6', fontWeight: 700, fontSize: '0.9rem' }}>{topProject.views.toLocaleString()} views this semester</p>
             </div>
          </div>
          <div style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #F59E0B', position: 'relative', overflow: 'hidden' }}>
             <i className="fas fa-archive" style={{ position: 'absolute', right: '-15px', bottom: '-15px', fontSize: '6rem', color: '#F59E0B', opacity: 0.05, transform: 'rotate(-10deg)' }}></i>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-books"></i></div>
               <span style={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Published Archives</span>
             </div>
             <div>
               <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '2.2rem', fontWeight: 800, color: '#0F172A' }}>342</h3>
               <p style={{ margin: 0, color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>Across 5 departments</p>
             </div>
          </div>
          <div style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #16A34A', position: 'relative', overflow: 'hidden' }}>
             <i className="fas fa-plus-circle" style={{ position: 'absolute', right: '-15px', bottom: '-15px', fontSize: '6rem', color: '#16A34A', opacity: 0.05, transform: 'rotate(-10deg)' }}></i>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-chart-line"></i></div>
               <span style={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>New Additions</span>
             </div>
             <div>
               <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '2.2rem', fontWeight: 800, color: '#0F172A' }}>18</h3>
               <p style={{ margin: 0, color: '#16A34A', fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-arrow-trend-up" style={{ marginRight: '0.3rem' }}></i> +4 from last month</p>
             </div>
          </div>
        </div>

        {/* Department Analytics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {LIBRARY_DEPARTMENT_SUMMARY.map((department) => (
            <div key={department.department} style={{ background: 'white', borderRadius: '1rem', padding: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ background: '#F8FAFC', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #E2E8F0' }}>{department.department}</span>
                <strong style={{ color: '#0F172A', fontSize: '1.2rem', fontWeight: 800 }}>{department.count}</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(department.count, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #003A8F, #3B82F6)', borderRadius: '3px' }}></div>
              </div>
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Published Projects</span>
            </div>
          ))}
        </div>

        {/* Featured Discoveries Grid */}
        <section style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><i className="fas fa-bolt"></i></div>
              Featured Discoveries
            </h3>
            <Link href="/library/repository" style={{ textDecoration: 'none', background: '#F8FAFC', color: '#003A8F', padding: '0.6rem 1.2rem', borderRadius: '0.6rem', fontWeight: 600, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#EFF6FF'} onMouseOut={(e) => e.currentTarget.style.background = '#F8FAFC'}>
              Explore Collection <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {featuredProjects.map((project) => (
              <Link href={`/library/project-details?id=${project.id}`} key={project.id} style={{ textDecoration: 'none', background: '#F8FAFC', borderRadius: '1.2rem', padding: '1.5rem', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 58, 143, 0.1)'; e.currentTarget.style.borderColor = '#93C5FD' }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ background: 'white', color: '#003A8F', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>{project.department}</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <i className={`fas ${getProjectIcon(project.type)}`} aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.4 }}>{project.title}</h4>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>{project.authors.join(', ')}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}><i className="fas fa-calendar" style={{ marginRight: '0.4rem' }}></i> {project.year}</span>
                  <span style={{ color: '#003A8F', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>View Details <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }}></i></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recently Indexed Archives (Table) */}
        <section style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', overflow: 'hidden', borderTop: '4px solid #003A8F' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Recently Indexed Archives</h3>
          </div>
          <div className="table-scroll" style={{ padding: '0 1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Research Title</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Authors</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>Year</th>
                  <th style={{ padding: '1.2rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {LIBRARY_RECENT_STUDIES.map((study, i) => (
                  <tr key={study.projectId} style={{ borderBottom: i === LIBRARY_RECENT_STUDIES.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => window.location.href = `/library/project-details?id=${study.projectId}`}>
                    <td style={{ padding: '1.2rem 1rem', color: '#0F172A', fontWeight: 700, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{study.title}</td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <span style={{ background: '#EFF6FF', color: '#003A8F', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #BFDBFE' }}>{study.department}</span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem', color: '#475569', fontSize: '0.95rem' }}>{study.authors}</td>
                    <td style={{ padding: '1.2rem 1rem', color: '#64748B', fontWeight: 600 }}>{study.year}</td>
                    <td style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.background = '#FEF2F2' }} onMouseOut={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white' }} title="Download PDF" onClick={(e) => e.stopPropagation()}>
                          <i className="fas fa-file-pdf"></i>
                        </button>
                        <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.color = '#003A8F'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.background = '#EFF6FF' }} onMouseOut={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white' }} title="Cite" onClick={(e) => e.stopPropagation()}>
                          <i className="fas fa-quote-right"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </LibraryShell>
  );
}
