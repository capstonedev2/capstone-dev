'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PARTNER_TECHNOLOGIES, getImpactStars, type PartnerDepartment } from '@/components/partner/partner-data';
import {
  PartnerButton,
  PartnerDepartmentBadge,
  PartnerModal
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

const ITEMS_PER_PAGE = 6;

export function PartnerProject() {
  const [departmentFilter, setDepartmentFilter] = useState<'all' | PartnerDepartment>('all');
  const [sortBy, setSortBy] = useState('Sort by: Latest');
  const [search, setSearch] = useState('');
  const [selectedTechnologyId, setSelectedTechnologyId] = useState('');
  const [viewMode, setViewMode] = useState<'scholar' | 'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);

  const technologies = useMemo(() => {
    const filtered = PARTNER_TECHNOLOGIES.filter((technology) => {
      const matchesDepartment =
        departmentFilter === 'all' || technology.department === departmentFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        technology.title.toLowerCase().includes(term) ||
        technology.summary.toLowerCase().includes(term) ||
        technology.abstract.toLowerCase().includes(term) ||
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

  const totalPages = Math.max(1, Math.ceil(technologies.length / ITEMS_PER_PAGE));
  const paginatedTechnologies = technologies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const selectedTechnology = PARTNER_TECHNOLOGIES.find((technology) => technology.id === selectedTechnologyId);

  return (
    <PartnerShell
      activeNav="project"
      title="Technology Repository"
      description="Discover, analyze, and request innovative solutions ready for industry adoption"
      notificationCount={2}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem', position: 'relative' }}>
        
        {/* Subtle Background Glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '300px', background: 'radial-gradient(ellipse at top, rgba(0, 58, 143, 0.05), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1, marginTop: '-0.5rem' }}>
          <div>
             <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Available Technologies</h2>
             <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>{technologies.length} projects ready for technology transfer</p>
          </div>
        </div>

        {/* Modern Filter Bar */}
        <section style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid #E2E8F0', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            
            <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Repository</label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
                  <input
                    placeholder="Search by keyword, technology, or application..."
                    type="text"
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', color: '#0F172A', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</label>
                <select value={departmentFilter} onChange={(event) => { setDepartmentFilter(event.target.value as 'all' | PartnerDepartment); setCurrentPage(1); }} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', color: '#0F172A', fontSize: '0.95rem', cursor: 'pointer' }}>
                  <option value="all">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="MET">MET</option>
                  <option value="TCM">TCM</option>
                  <option value="ESM">ESM</option>
                  <option value="NAME">NAME</option>
                </select>
              </div>

              <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort Options</label>
                <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setCurrentPage(1); }} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', color: '#0F172A', fontSize: '0.95rem', cursor: 'pointer' }}>
                  <option>Sort by: Latest</option>
                  <option>Most Popular</option>
                  <option>Highest Impact</option>
                  <option>Technology Readiness</option>
                </select>
              </div>
            </div>

            {/* View Toggles (Apple Segmented Control Style) */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.4rem', borderRadius: '1rem', border: '1px solid #E2E8F0', position: 'relative' }}>
              <button onClick={() => setViewMode('scholar')} style={{ flex: 1, padding: '0.7rem 1.2rem', border: 'none', background: viewMode === 'scholar' ? 'white' : 'transparent', borderRadius: '0.6rem', fontWeight: 700, color: viewMode === 'scholar' ? '#003A8F' : '#64748B', cursor: 'pointer', boxShadow: viewMode === 'scholar' ? '0 4px 10px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-grip-lines"></i> Scholar
              </button>
              <button onClick={() => setViewMode('cards')} style={{ flex: 1, padding: '0.7rem 1.2rem', border: 'none', background: viewMode === 'cards' ? 'white' : 'transparent', borderRadius: '0.6rem', fontWeight: 700, color: viewMode === 'cards' ? '#003A8F' : '#64748B', cursor: 'pointer', boxShadow: viewMode === 'cards' ? '0 4px 10px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-table-cells-large"></i> Cards
              </button>
              <button onClick={() => setViewMode('table')} style={{ flex: 1, padding: '0.7rem 1.2rem', border: 'none', background: viewMode === 'table' ? 'white' : 'transparent', borderRadius: '0.6rem', fontWeight: 700, color: viewMode === 'table' ? '#003A8F' : '#64748B', cursor: 'pointer', boxShadow: viewMode === 'table' ? '0 4px 10px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-table-list"></i> Table
              </button>
            </div>

          </div>
        </section>

        {/* Results Container */}
        {technologies.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'white', borderRadius: '1.2rem', border: '1px dashed #CBD5E1' }}>
             <i className="fas fa-search" style={{ fontSize: '3rem', color: '#94A3B8', marginBottom: '1rem' }}></i>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F172A' }}>No technologies found</h3>
             <p style={{ color: '#64748B', margin: 0 }}>Try adjusting your filters or search terms.</p>
          </div>
        ) : viewMode === 'scholar' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', zIndex: 1 }}>
            {paginatedTechnologies.map((technology) => (
              <article key={technology.id} style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.03)', display: 'flex', gap: '1.8rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 15px 35px rgba(15, 23, 42, 0.08)'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(15, 23, 42, 0.03)'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003A8F', fontSize: '2rem', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 8px rgba(0,0,0,0.04)' }}>
                  <i className={`fas ${technology.icon}`} />
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/partner/details?id=${technology.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ margin: '0 0 0.4rem 0', color: '#0F172A', fontSize: '1.3rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#003A8F'} onMouseOut={(e) => e.currentTarget.style.color = '#0F172A'}>{technology.title}</h3>
                  </Link>
                  <div style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#334155' }}>{technology.developers}</strong> 
                    <span style={{ color: '#CBD5E1' }}>•</span> {technology.department} 
                    <span style={{ color: '#CBD5E1' }}>•</span> {technology.trl}
                  </div>
                  <p style={{ margin: '0 0 1.5rem 0', color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>{technology.abstract}</p>
                  
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(246, 190, 0, 0.15)', color: '#92400E', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>{technology.department}</span>
                    <span style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#15803D', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 600 }}>{technology.readinessPercent}% Ready</span>
                    <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 600 }}>{technology.industries[0]}</span>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/partner/details?id=${technology.id}`} style={{ textDecoration: 'none', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '0.5rem 1.2rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseOver={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#0F172A'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                        Read Study <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
                      </Link>
                      <button onClick={() => setSelectedTechnologyId(technology.id)} style={{ background: 'linear-gradient(135deg, #003A8F, #1E40AF)', border: 'none', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(0, 58, 143, 0.2)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                        Adopt <i className="fas fa-handshake"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : viewMode === 'cards' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', zIndex: 1 }}>
            {paginatedTechnologies.map((technology) => (
              <article key={technology.id} style={{ borderTop: '4px solid #003A8F', borderRadius: '1.5rem', padding: '1.8rem', background: 'white', boxShadow: '0 10px 25px rgba(0, 58, 143, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 58, 143, 0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 58, 143, 0.05)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003A8F', fontSize: '1.6rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 8px rgba(0,0,0,0.04)' }}>
                    <i aria-hidden="true" className={`fas ${technology.icon}`} />
                  </div>
                  <PartnerDepartmentBadge>{technology.department}</PartnerDepartmentBadge>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#111827', margin: '0 0 0.5rem 0', fontWeight: 800 }}>{technology.title}</h3>
                  <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{technology.summary}</p>
                </div>
                
                <div style={{ background: '#F8FAFC', padding: '1.2rem', borderRadius: '12px', border: '1px solid #F1F5F9', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    <span>Readiness: {technology.trl}</span>
                    <span style={{ color: '#003A8F' }}>{technology.readinessPercent}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${technology.readinessPercent}%`, background: 'linear-gradient(90deg, #003A8F, #2563EB)', height: '100%' }}></div>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: '#334155', minWidth: '70px' }}>Impact:</strong> 
                      <span style={{ color: '#F6BE00' }}>{getImpactStars(technology.impactRating)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setSelectedTechnologyId(technology.id)} style={{ flex: 1, padding: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderRadius: '0.6rem', fontWeight: 600, background: 'linear-gradient(135deg, #003A8F, #1E40AF)', color: 'white', border: 'none', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 4px 10px rgba(0, 58, 143, 0.2)' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 58, 143, 0.3)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 58, 143, 0.2)'}>
                    <i className="fas fa-handshake"></i> Adopt
                  </button>
                  <Link href={`/partner/details?id=${technology.id}`} style={{ flex: 1, padding: '0.7rem', textAlign: 'center', border: '1px solid #E5E7EB', color: '#475569', borderRadius: '0.6rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none', transition: 'background 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.03)', border: '1px solid #E2E8F0', overflow: 'hidden', zIndex: 1 }}>
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700 }}>Technology / Project</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700 }}>Readiness</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700 }}>Department</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTechnologies.map((technology, i) => (
                    <tr key={technology.id} style={{ borderBottom: i === paginatedTechnologies.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <i className={`fas ${technology.icon}`} style={{ color: '#003A8F', fontSize: '1.2rem' }}></i>
                          <div>
                            <Link href={`/partner/details?id=${technology.id}`} style={{ color: '#0F172A', display: 'block', fontWeight: 700, textDecoration: 'none' }}>{technology.title}</Link>
                            <span style={{ color: '#64748B', fontSize: '0.85rem' }}>{technology.industries.slice(0, 2).join(', ')}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                           <span style={{ color: '#0F172A', fontWeight: 700, minWidth: '40px' }}>{technology.readinessPercent}%</span>
                           <div style={{ width: '100px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                             <div style={{ width: `${technology.readinessPercent}%`, background: 'linear-gradient(90deg, #003A8F, #2563EB)', height: '100%' }}></div>
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <PartnerDepartmentBadge>{technology.department}</PartnerDepartmentBadge>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                           <Link href={`/partner/details?id=${technology.id}`} style={{ background: 'transparent', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                             View
                           </Link>
                           <button onClick={() => setSelectedTechnologyId(technology.id)} style={{ background: 'transparent', color: '#003A8F', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: '1px solid #003A8F', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                             Adopt
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Dynamic Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', zIndex: 1 }}>
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} style={{ padding: '0 1rem', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: currentPage === 1 ? '#CBD5E1' : '#475569', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
               <i className="fas fa-chevron-left" style={{ marginRight: '0.5rem', fontSize: '0.8rem' }}></i> Prev
             </button>
             {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
               <button key={page} onClick={() => setCurrentPage(page)} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: page === currentPage ? 'none' : '1px solid #E2E8F0', background: page === currentPage ? '#003A8F' : 'white', color: page === currentPage ? 'white' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: page === currentPage ? '0 4px 10px rgba(0,58,143,0.2)' : 'none', transition: 'all 0.2s' }}>
                 {page}
               </button>
             ))}
             <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} style={{ padding: '0 1rem', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: currentPage === totalPages ? '#CBD5E1' : '#475569', fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
               Next <i className="fas fa-chevron-right" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}></i>
             </button>
          </div>
        )}
      </div>

      <PartnerModal
        open={Boolean(selectedTechnology)}
        title="Request Adoption"
        narrow
        onClose={() => setSelectedTechnologyId('')}
        footer={
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setSelectedTechnologyId('')} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600 }}>Cancel</button>
            {selectedTechnology ? (
              <Link className="btn btn-primary" href={`/partner/request?id=${selectedTechnology.id}`} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #003A8F, #1E40AF)', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', textDecoration: 'none' }}>
                Open Request Form <i className="fas fa-arrow-right"></i>
              </Link>
            ) : null}
          </div>
        }
      >
        <div style={{ padding: '1.5rem 0' }}>
          <p style={{ margin: '0 0 1rem 0', color: '#475569', lineHeight: 1.6 }}>
            You are initiating a formal adoption request for the <strong>{selectedTechnology?.title}</strong> technology. 
          </p>
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
               <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>Department</span>
               <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>{selectedTechnology?.department}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
               <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>Current TRL</span>
               <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>{selectedTechnology?.trl}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>Readiness Score</span>
               <strong style={{ color: '#16A34A', fontSize: '0.85rem' }}>{selectedTechnology?.readinessPercent}%</strong>
            </div>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
            Proceeding will open the Adoption Request form where you can outline your implementation strategy and budget allocation.
          </p>
        </div>
      </PartnerModal>
    </PartnerShell>
  );
}
