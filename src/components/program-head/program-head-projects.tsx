'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { PROGRAM_HEAD_PROJECTS, getStatusTone } from '@/components/program-head/program-head-data';
import { ChartResponsiveContainer } from '@/components/shared/chart-responsive-container';
import {
  ProgramHeadButton,
  ProgramHeadDrawer,
  ProgramHeadModal,
  ProgramHeadStatCard,
  ProgramHeadStatusBadge
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';



export function ProgramHeadProjects() {
  const [selectedCode, setSelectedCode] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [adviserFilter, setAdviserFilter] = useState('All Advisers');
  const [searchQuery, setSearchQuery] = useState('');

  const advisers = useMemo(() => {
    const all = PROGRAM_HEAD_PROJECTS.map(p => p.adviser);
    return Array.from(new Set(all)).sort();
  }, []);

  const filteredProjects = useMemo(() => {
    let projects = [...PROGRAM_HEAD_PROJECTS];
    if (statusFilter !== 'All Statuses') {
      projects = projects.filter(p => p.status === statusFilter);
    }
    if (adviserFilter !== 'All Advisers') {
      projects = projects.filter(p => p.adviser === adviserFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.adviser.toLowerCase().includes(q) ||
        p.students.some(s => s.toLowerCase().includes(q))
      );
    }
    return projects;
  }, [statusFilter, adviserFilter, searchQuery]);

  const selectedProject = useMemo(
    () => PROGRAM_HEAD_PROJECTS.find((project) => project.code === selectedCode),
    [selectedCode]
  );

  const activeCount = filteredProjects.filter(p => p.status === 'Active').length;
  const completedCount = filteredProjects.filter(p => p.status === 'Completed').length;
  const transferReady = filteredProjects.filter(p => p.transferStatus === 'Ready for Transfer').length;

  const categoryChart = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'AI/ML Projects': '#0F3DDE',
      'IoT Systems': '#16a34a',
      'Web Applications': '#7c3aed',
      'Mobile Apps': '#f59e0b'
    };

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#64748b'
    })).sort((a, b) => b.value - a.value);
  }, [filteredProjects]);

  return (
    <ProgramHeadShell
      activeNav="projects"
      title="Project Overview"
      description="IT Department - complete project portfolio"
      notificationCount={3}
    >
      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        
        {/* Left Column: Stat Cards (Spans 5 cols) */}
        <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProgramHeadStatCard title="Total Projects (IT)" value={filteredProjects.length} note={filteredProjects.length === PROGRAM_HEAD_PROJECTS.length ? "All projects shown" : "Filtered results"} icon="fas fa-folder-open" className="h-full" />
          <ProgramHeadStatCard title="Active Projects" value={activeCount} note={filteredProjects.length > 0 ? `${Math.round((activeCount / filteredProjects.length) * 100)}% of selection` : "0%"} icon="fas fa-bolt" className="h-full" />
          <ProgramHeadStatCard title="Completed" value={completedCount} note={filteredProjects.length > 0 ? `${Math.round((completedCount / filteredProjects.length) * 100)}% completion rate` : "0%"} icon="fas fa-check-double" className="h-full" />
          <ProgramHeadStatCard title="Tech Transfer Ready" value={transferReady} note="Available for adoption" icon="fas fa-rocket" className="h-full" />
        </div>

        {/* Right Column: Category Distribution (Spans 7 cols) */}
        <div className="xl:col-span-7 bg-[var(--surface)] backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[var(--border)] overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)]">
            <div>
              <h3 className="text-lg font-bold text-[var(--text)] m-0 tracking-tight flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50/80 text-[#0F3DDE] flex items-center justify-center text-xs shadow-sm ring-1 ring-[#0F3DDE]/10"><i className="fas fa-chart-pie"></i></div> Project Distribution by Category
              </h3>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-5/12 h-48 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-[var(--text)]">{filteredProjects.length}</span>
                <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1">Total</span>
              </div>
              <ChartResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                  >
                    {categoryChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ fontWeight: '900', color: '#0f172a', fontSize: '12px' }}
                    formatter={(value, name) => [`${value} projects`, name]}
                  />
                </PieChart>
              </ChartResponsiveContainer>
            </div>
            <div className="w-full sm:w-7/12 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[14rem] custom-scrollbar pr-1">
              {categoryChart.map((item) => (
                <div
                  key={item.name}
                  className="group relative flex flex-col justify-between p-4 rounded-xl bg-[var(--surface-alt)] backdrop-blur-xl ring-1 ring-[var(--border)] hover:shadow-[0_10px_20px_rgba(15,61,222,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 left-0 w-full h-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10" style={{ backgroundImage: `linear-gradient(to right, ${item.color}, transparent)` }}></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 z-0" style={{ backgroundImage: `radial-gradient(circle at top right, ${item.color}, transparent 70%)` }}></div>
                  
                  <div className="relative flex items-center justify-between mb-2 z-10">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm ring-1 ring-[var(--border)] group-hover:scale-110 transition-transform duration-300 bg-[var(--surface)]" style={{ color: item.color }}>
                        <i className="fas fa-layer-group text-xs"></i>
                      </span>
                      <strong className="text-[var(--text)] text-xs font-bold group-hover:text-[#0F3DDE] transition-colors">{item.name}</strong>
                    </div>
                  </div>
                  
                  <div className="relative flex items-end justify-between z-10 mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-2xl tracking-tight" style={{ color: item.color }}>{item.value}</span>
                      <span className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest bg-[var(--surface)] ring-1 ring-[var(--border)] px-1 py-0.5 rounded">projects</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[var(--border)] overflow-hidden mb-8">
        <div className="relative overflow-hidden px-8 py-7 border-b border-[var(--border)] bg-[var(--surface-alt)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F3DDE]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="relative flex items-center justify-between z-10">
            <div>
              <h3 className="text-xl font-bold text-[var(--text)] m-0 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F3DDE]/10 to-[#0F3DDE]/5 text-[#0F3DDE] flex items-center justify-center text-sm shadow-sm ring-1 ring-[#0F3DDE]/20">
                  <i className="fas fa-list-alt"></i>
                </div> 
                IT Department Projects
              </h3>
              <p className="text-sm text-[var(--muted)] font-medium m-0 mt-2 pl-[52px]">
                <strong className="text-[var(--text)]">{filteredProjects.length}</strong> projects match the current filters.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4 px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)] relative z-10">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Academic Year</label>
            <div className="relative">
              <select className="w-full h-11 pl-4 pr-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:ring-slate-300 appearance-none shadow-inner" defaultValue="AY 2023-2024">
                <option>AY 2023-2024</option>
                <option>AY 2022-2023</option>
                <option>AY 2021-2022</option>
                <option>All Years</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
            </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Status</label>
            <div className="relative">
              <select
                className="w-full h-11 pl-4 pr-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:ring-slate-300 appearance-none shadow-inner"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
            </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Adviser</label>
            <div className="relative">
              <select
                className="w-full h-11 pl-4 pr-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:ring-slate-300 appearance-none shadow-inner"
                value={adviserFilter}
                onChange={(e) => setAdviserFilter(e.target.value)}
              >
                <option value="All Advisers">All Advisers</option>
                {advisers.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
            </div>
          </div>
          <div className="flex-[2] min-w-[220px] group">
            <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Search</label>
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <input
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-medium text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none placeholder:text-[var(--muted)] hover:bg-slate-50 hover:ring-slate-300 transition-all shadow-inner"
                placeholder="Search projects, codes, advisers..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              className="h-11 px-5 rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] hover:bg-slate-50 hover:ring-slate-300 transition-all shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center gap-2 group"
              type="button"
              onClick={() => { setStatusFilter('All Statuses'); setAdviserFilter('All Advisers'); setSearchQuery(''); }}
            >
              <i className="fas fa-undo text-xs text-[var(--muted)] group-hover:-rotate-180 transition-transform duration-500"></i> Reset
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="group relative overflow-hidden h-11 px-6 bg-gradient-to-b from-[#0F3DDE] to-[#081B4B] text-white rounded-xl text-sm font-bold shadow-[0_8px_20px_rgba(15,61,222,0.25)] hover:shadow-[0_12px_25px_rgba(15,61,222,0.35)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              <i className="fas fa-download group-hover:scale-110 transition-transform"></i> Export Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead className="bg-[var(--surface-alt)] text-[var(--muted)] text-[10px] uppercase tracking-[0.15em] font-bold">
              <tr>
                <th className="px-6 py-5 border-b border-[var(--border)]">Code</th>
                <th className="px-6 py-5 border-b border-[var(--border)]">Project Title</th>
                <th className="px-6 py-5 border-b border-[var(--border)]">Adviser</th>
                <th className="px-6 py-5 border-b border-[var(--border)]">Students</th>
                <th className="px-6 py-5 border-b border-[var(--border)]">Status</th>
                <th className="px-6 py-5 border-b border-[var(--border)] w-44">Progress</th>
                <th className="px-6 py-5 border-b border-[var(--border)]">Start Date</th>
                <th className="px-6 py-5 border-b border-[var(--border)]">Transfer</th>
                <th className="px-6 py-5 border-b border-[var(--border)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-24 text-center">
                    <div className="w-20 h-20 bg-[var(--surface-alt)] rounded-3xl flex items-center justify-center mx-auto mb-5 ring-1 ring-[var(--border)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <i className="fas fa-search text-3xl text-[var(--muted)] opacity-50"></i>
                    </div>
                    <p className="font-bold text-[var(--text)] text-lg m-0">No projects found</p>
                    <p className="text-[var(--muted)] font-medium text-sm mt-2">Try adjusting your filters or search query.</p>
                    <button
                      className="mt-8 px-6 py-3 rounded-xl bg-[var(--surface)] text-sm font-bold text-[var(--text)] hover:text-[#0F3DDE] ring-1 ring-inset ring-[var(--border)] hover:ring-[#0F3DDE]/30 hover:shadow-[0_4px_20px_rgba(15,61,222,0.1)] hover:-translate-y-0.5 transition-all duration-300"
                      onClick={() => { setStatusFilter('All Statuses'); setAdviserFilter('All Advisers'); setSearchQuery(''); }}
                    >
                      <i className="fas fa-undo text-xs mr-2 opacity-70"></i> Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.code} className="group transition-all duration-200 hover:bg-[var(--surface-alt)] cursor-pointer" onClick={() => setSelectedCode(project.code)}>
                    <td className="px-6 py-5 align-top">
                      <code className="text-[11px] font-mono font-bold text-[#0F3DDE] bg-[#0F3DDE]/10 ring-1 ring-inset ring-[#0F3DDE]/20 px-2 py-1 rounded-md tracking-wide shadow-sm">{project.code}</code>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="font-bold text-[var(--text)] m-0 text-sm group-hover:text-[#0F3DDE] transition-colors line-clamp-2 leading-snug">{project.title}</p>
                      <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mt-2 block">{project.category}</span>
                    </td>
                    <td className="px-6 py-5 align-top text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-alt)] text-[var(--text)] flex items-center justify-center text-[10px] font-bold shadow-sm ring-1 ring-[var(--border)] shrink-0">
                          {project.adviser.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-bold text-[var(--text)] whitespace-nowrap">{project.adviser}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex -space-x-2">
                        {project.students.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-[var(--surface-alt)] ring-2 ring-[var(--surface)] shadow-sm flex items-center justify-center text-xs font-bold text-[var(--muted)] transition-transform hover:scale-110 hover:z-10">
                            <i className="fas fa-user text-[10px]"></i>
                          </div>
                        ))}
                        {project.students.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-alt)] ring-2 ring-[var(--surface)] shadow-sm flex items-center justify-center text-[10px] font-bold text-[var(--text)] z-10">
                            +{project.students.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <ProgramHeadStatusBadge tone={getStatusTone(project.status)}>
                        {project.status}
                      </ProgramHeadStatusBadge>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-2 bg-[var(--border)] rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${project.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`}
                            style={{ width: `${project.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[var(--text)] w-8">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="text-xs font-bold text-[var(--muted)] bg-[var(--surface-alt)] px-2 py-1 rounded-md ring-1 ring-[var(--border)]">{project.startLabel}</span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {project.transferStatus === 'Ready for Transfer' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ring-emerald-500/20 shadow-sm whitespace-nowrap">
                          <i className="fas fa-rocket"></i> Ready
                        </span>
                      ) : project.transferStatus === 'Deployed' || project.transferStatus === 'In Use' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ring-purple-500/20 shadow-sm whitespace-nowrap">
                          <i className="fas fa-box-open"></i> {project.transferStatus}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface-alt)] text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ring-[var(--border)] shadow-sm whitespace-nowrap">
                          <i className="fas fa-clock text-[var(--muted)]"></i> {project.transferStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 h-9 px-4 rounded-xl bg-[#0F3DDE]/10 text-[#0F3DDE] text-[11px] font-bold uppercase tracking-widest hover:bg-[#0F3DDE] hover:text-white shadow-sm ring-1 ring-blue-200/50 flex items-center gap-2 ml-auto"
                        onClick={() => setSelectedCode(project.code)}
                      >
                        <i className="fas fa-arrow-right"></i> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Details Drawer */}
      <ProgramHeadDrawer
        maxWidth={640}
        open={Boolean(selectedProject)}
        title="Project Details"
        onClose={() => setSelectedCode('')}
      >
        {selectedProject ? (
          <div className="space-y-6">
            {/* Project Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F3DDE] to-[#081B4B] text-white flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-project-diagram"></i>
              </div>
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-800">{selectedProject.title}</h3>
                <code className="text-sm font-mono text-[#0F3DDE] bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">{selectedProject.code}</code>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Adviser</span>
                <span className="text-sm font-bold text-slate-700">{selectedProject.adviser}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Status</span>
                <ProgramHeadStatusBadge tone={getStatusTone(selectedProject.status)}>
                  {selectedProject.status}
                </ProgramHeadStatusBadge>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Category</span>
                <span className="text-sm font-bold text-slate-700">{selectedProject.category}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Transfer</span>
                <span className="text-sm font-bold text-slate-700">{selectedProject.transferStatus}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-lg font-extrabold text-[#0F3DDE]">{selectedProject.progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-[#4A72FF] rounded-full transition-all duration-1000 ease-out" style={{ width: `${selectedProject.progress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2 m-0">Current Stage: {selectedProject.currentStage}</p>
            </div>

            {/* Students */}
            <div>
              <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Team Members</span>
              <div className="space-y-2">
                {selectedProject.students.map((student, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0F3DDE] to-[#081B4B] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {student.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{student}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Partner & Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Partner</span>
                <span className="text-sm font-bold text-slate-700">{selectedProject.partner}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{selectedProject.partnerLocation}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Start Date</span>
                <span className="text-sm font-bold text-slate-700">{selectedProject.startLabel}</span>
                <span className="block text-xs text-slate-500 mt-0.5">Last updated: {selectedProject.lastUpdate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all" onClick={() => setSelectedCode('')}>
                Close
              </button>
              <button className="flex-1 py-3 bg-[#0F3DDE] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#0c31b3] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-file-pdf"></i> Generate Report
              </button>
            </div>
          </div>
        ) : null}
      </ProgramHeadDrawer>

      {/* Export Modal */}
      <ProgramHeadModal open={exportOpen} title="Export Project Report" onClose={() => setExportOpen(false)}>
        <div className="ph-form-field">
          <label htmlFor="ph-project-report-type">Report Type</label>
          <select className="ph-select" id="ph-project-report-type" defaultValue="Complete Project Inventory">
            <option>Complete Project Inventory</option>
            <option>Active Projects Summary</option>
            <option>Completed Projects Report</option>
            <option>Tech Transfer Ready Projects</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label htmlFor="ph-project-report-format">Format</label>
          <select className="ph-select" id="ph-project-report-format" defaultValue="PDF Document">
            <option>PDF Document</option>
            <option>Excel Spreadsheet</option>
            <option>CSV Data</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label>Include</label>
          <div className="ph-checkbox-list">
            <label><input defaultChecked type="checkbox" /> Project details</label>
            <label><input defaultChecked type="checkbox" /> Adviser information</label>
            <label><input type="checkbox" /> Student lists</label>
            <label><input type="checkbox" /> Progress data</label>
          </div>
        </div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setExportOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={() => setExportOpen(false)}>
            Export
          </ProgramHeadButton>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
