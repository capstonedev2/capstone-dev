'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { ChartResponsiveContainer } from '@/components/shared/chart-responsive-container';
import {
  PROGRAM_HEAD_ADVISERS,
  PROGRAM_HEAD_PROJECTS,
  getProgramHeadAnalytics,
  getStatusTone
} from '@/components/program-head/program-head-data';
import {
  ProgramHeadButton,
  ProgramHeadCardSection,
  ProgramHeadModal,
  ProgramHeadStatCard,
  ProgramHeadStatusBadge
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';

export function ProgramHeadDashboard() {
  const [exportOpen, setExportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [adviserFilter, setAdviserFilter] = useState('All Advisers');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const itProjects = useMemo(() => PROGRAM_HEAD_PROJECTS.filter((project) => project.department === 'IT'), []);
  const itAnalytics = useMemo(() => getProgramHeadAnalytics(itProjects), [itProjects]);

  const itAdvisers = useMemo(() => {
    const all = itProjects.map((project) => project.adviser);
    return Array.from(new Set(all)).sort();
  }, [itProjects]);

  const categories = useMemo(() => {
    const all = itProjects.map((project) => project.category);
    return Array.from(new Set(all)).sort();
  }, [itProjects]);

  const filteredProjects = useMemo(() => {
    let projects = itProjects;
    if (statusFilter !== 'All Status') projects = projects.filter((project) => project.status === statusFilter);
    if (adviserFilter !== 'All Advisers') projects = projects.filter((project) => project.adviser === adviserFilter);
    if (categoryFilter !== 'All Categories') projects = projects.filter((project) => project.category === categoryFilter);
    return projects;
  }, [itProjects, statusFilter, adviserFilter, categoryFilter]);

  const filteredAnalytics = useMemo(() => getProgramHeadAnalytics(filteredProjects), [filteredProjects]);
  const statusChartData = filteredAnalytics.statusDistribution.filter((item) => item.value > 0);
  const topAdviser = useMemo(() => {
    return [...PROGRAM_HEAD_ADVISERS]
      .filter((adviser) => adviser.department === 'IT')
      .sort((a, b) => b.overallScore - a.overallScore)[0] ?? PROGRAM_HEAD_ADVISERS[0];
  }, []);

  return (
    <ProgramHeadShell
      activeNav="dashboard"
      title="Department Chair Dashboard"
      description="IT Department | Monitoring and accreditation"
      notificationCount={3}
    >
      {/* Dashboard Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#081B4B] to-[#0F3DDE] rounded-3xl p-8 mb-8 shadow-[0_8px_30px_rgba(15,61,222,0.15)] text-white">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--surface)] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Department Operations Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Department Overview
            </h1>
            <p className="text-sm text-blue-100/80 font-medium max-w-xl leading-relaxed">
              Monitor active project progress, evaluate technology transfer readiness, and manage student performance across the entire IT department.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button className="group relative overflow-hidden px-5 py-2.5 bg-[var(--surface)] backdrop-blur-md ring-1 ring-[var(--border)] text-white font-bold rounded-xl hover:bg-[var(--surface)] transition-all duration-300 flex items-center">
              <i className="fas fa-calendar-alt mr-2.5 group-hover:scale-110 transition-transform"></i> View Schedule
            </button>
            <button className="group relative overflow-hidden px-6 py-2.5 bg-[var(--surface)] text-[#0F3DDE] font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center">
              <i className="fas fa-file-signature mr-2.5 group-hover:scale-110 transition-transform"></i> Endorse Transfers
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="group relative bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F3DDE] to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F3DDE]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="relative flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 text-[#0F3DDE] flex items-center justify-center text-xl shadow-sm ring-1 ring-blue-100/50 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-folder-open"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200/50 px-2 py-1 rounded-md shadow-sm">
              <i className="fas fa-arrow-up"></i> 12%
            </span>
          </div>
          <h3 className="relative text-[var(--muted)] font-extrabold text-[11px] uppercase tracking-[0.15em] mb-1">Tracked Projects</h3>
          <div className="relative flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text)] tracking-tight">{itAnalytics.totalProjects}</span>
            <span className="text-sm font-bold text-[var(--muted)]">Total</span>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-[#081B4B] w-3/4 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--muted)]">{itAnalytics.activeProjects} active</span>
          </div>
        </div>

        <div className="group relative bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F3DDE] to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F3DDE]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="relative flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 text-[#0F3DDE] flex items-center justify-center text-xl shadow-sm ring-1 ring-blue-100/50 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-chart-line"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-50 ring-1 ring-inset ring-[var(--border)] px-2 py-1 rounded-md shadow-sm">
              <i className="fas fa-arrow-up"></i> 5%
            </span>
          </div>
          <h3 className="relative text-[var(--muted)] font-extrabold text-[11px] uppercase tracking-[0.15em] mb-1">Completion Rate</h3>
          <div className="relative flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text)] tracking-tight">{itAnalytics.completionRate}%</span>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-[#081B4B] rounded-full transition-all duration-1000 relative overflow-hidden" style={{ width: `${itAnalytics.completionRate}%` }}>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2.5s_infinite]"></div>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--muted)]">{itAnalytics.completedProjects} done</span>
          </div>
        </div>

        <div className="group relative bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F3DDE] to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F3DDE]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="relative flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 text-[#0F3DDE] flex items-center justify-center text-xl shadow-sm ring-1 ring-blue-100/50 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-tasks"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-50 ring-1 ring-inset ring-[var(--border)] px-2 py-1 rounded-md shadow-sm">
              <i className="fas fa-minus"></i> 0%
            </span>
          </div>
          <h3 className="relative text-[var(--muted)] font-extrabold text-[11px] uppercase tracking-[0.15em] mb-1">Intervention Queue</h3>
          <div className="relative flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text)] tracking-tight">{itAnalytics.interventionQueue.length}</span>
            <span className="text-sm font-bold text-[var(--muted)]">Items</span>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-[#081B4B] rounded-full w-1/3 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2.2s_infinite]"></div>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--muted)]">{itAnalytics.behindScheduleProjects} urgent</span>
          </div>
        </div>

        <div className="group relative bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F3DDE] to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F3DDE]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="relative flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 text-[#0F3DDE] flex items-center justify-center text-xl shadow-sm ring-1 ring-blue-100/50 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-shield-alt"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-50 ring-1 ring-inset ring-[var(--border)] px-2 py-1 rounded-md shadow-sm">
              <i className="fas fa-arrow-up"></i> 8%
            </span>
          </div>
          <h3 className="relative text-[var(--muted)] font-extrabold text-[11px] uppercase tracking-[0.15em] mb-1">Evidence Readiness</h3>
          <div className="relative flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text)] tracking-tight">{itAnalytics.evidenceReadiness}%</span>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-[#081B4B] rounded-full transition-all duration-1000 relative overflow-hidden" style={{ width: `${itAnalytics.evidenceReadiness}%` }}>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2.8s_infinite]"></div>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--muted)]">{itAnalytics.evidenceTotal} files</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[var(--border)] p-3 mb-8 flex flex-wrap items-center gap-3 sticky top-0 z-10">
        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"></i>
          <select className="w-full h-11 pl-10 pr-8 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] appearance-none focus:ring-2 focus:ring-[#0F3DDE] focus:border-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300" defaultValue="AY 2025-2026">
            <option>AY 2025-2026</option>
            <option>AY 2024-2025</option>
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
        </div>

        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"></i>
          <select 
            className="w-full h-11 pl-10 pr-8 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] appearance-none focus:ring-2 focus:ring-[#0F3DDE] focus:border-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="On Hold">On Hold</option>
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
        </div>

        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-chalkboard-teacher absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"></i>
          <select 
            className="w-full h-11 pl-10 pr-8 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] appearance-none focus:ring-2 focus:ring-[#0F3DDE] focus:border-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300"
            value={adviserFilter}
            onChange={(e) => setAdviserFilter(e.target.value)}
          >
            <option value="All Advisers">All Advisers</option>
            {itAdvisers.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
        </div>
        
        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-tags absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"></i>
          <select 
            className="w-full h-11 pl-10 pr-8 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] appearance-none focus:ring-2 focus:ring-[#0F3DDE] focus:border-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All Categories">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
        </div>

        <button 
          onClick={() => setExportOpen(true)}
          className="h-11 px-6 bg-[var(--surface)] ring-1 ring-[var(--border)] text-[var(--text)] rounded-xl text-sm font-bold hover:bg-slate-50 hover:ring-slate-300 transition-all shadow-sm whitespace-nowrap ml-auto group"
        >
          <i className="fas fa-file-export mr-2 text-[#0F3DDE] group-hover:scale-110 transition-transform"></i> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center relative z-10">
            <h3 className="font-black text-[var(--text)] text-base flex items-center gap-2">
              <i className="fas fa-chart-pie text-[#0F3DDE]/70"></i> Project Distribution
            </h3>
            <button className="w-8 h-8 rounded-full hover:bg-slate-100 text-[var(--muted)] hover:text-[#0F3DDE] transition-colors flex items-center justify-center"><i className="fas fa-ellipsis-h"></i></button>
          </div>
          <div className="p-5 flex-grow flex flex-col relative z-10">
            <div className="relative h-48 w-full">
              {statusChartData.length > 0 ? (
                <ChartResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}40)` }} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                      formatter={(value, name) => [`${value} projects`, name]}
                      itemStyle={{ fontWeight: '900', color: '#081B4B' }}
                    />
                  </PieChart>
                </ChartResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-sm font-medium text-[var(--muted)] bg-[var(--surface-alt)] rounded-xl border border-dashed border-[var(--border)]">
                  <i className="fas fa-chart-pie text-2xl mb-2 text-slate-300"></i>
                  No data available
                </div>
              )}
              {statusChartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-[var(--surface)] rounded-full blur-[2px] scale-50 opacity-50"></div>
              )}
              {statusChartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-[var(--text)] tracking-tight drop-shadow-sm">{filteredAnalytics.totalProjects}</span>
                  <span className="text-[10px] uppercase font-bold text-[#0F3DDE] tracking-widest bg-blue-50/80 px-2 py-0.5 rounded-full mt-1 ring-1 ring-blue-100/50">Total</span>
                </div>
              )}
            </div>
            
            <div className="mt-5 space-y-3 px-2">
              {filteredAnalytics.statusDistribution.map(item => (
                <div key={item.name} className="flex items-center gap-3 group/item p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-white shadow-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-slate-600 flex-1 group-hover/item:text-[var(--text)] transition-colors">{item.name}</span>
                  <span className="text-sm font-black text-[var(--text)]">{item.value}</span>
                  <span className="text-xs font-bold text-[var(--muted)] w-10 text-right bg-slate-100/50 px-1.5 py-0.5 rounded-md group-hover/item:bg-slate-200/50 transition-colors">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center relative z-10">
            <h3 className="font-black text-[var(--text)] text-base flex items-center gap-2">
              <i className="fas fa-users-cog text-[#0F3DDE]/70"></i> Adviser Workload
            </h3>
            <span className="text-[10px] font-black text-[#0F3DDE] uppercase tracking-widest bg-blue-50 ring-1 ring-inset ring-[var(--border)] px-2 py-1 rounded-md shadow-sm">{itAnalytics.adviserWorkload.length} Active</span>
          </div>
          <div className="p-5 flex-grow overflow-y-auto max-h-[350px] space-y-3 relative z-10 custom-scrollbar pr-2">
            {itAnalytics.adviserWorkload.map(load => (
              <div key={load.adviser} className="flex items-center gap-4 group/item p-2.5 rounded-xl hover:bg-slate-50 hover:ring-1 hover:ring-[var(--border)] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-100 flex items-center justify-center text-sm font-black text-[#0F3DDE] shadow-sm group-hover/item:scale-105 transition-transform">
                  {load.adviser.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-black text-slate-800 truncate group-hover/item:text-[var(--text)] transition-colors">{load.adviser}</p>
                    <span className="text-[10px] font-bold text-[var(--muted)] bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{load.projects} PRJ</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 shadow-inner rounded-full overflow-hidden flex ring-1 ring-inset ring-[var(--border)]">
                    <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-blue-500" style={{ width: `${(load.active / Math.max(1, load.projects)) * 100}%` }}></div>
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${(load.completed / Math.max(1, load.projects)) * 100}%` }}></div>
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400" style={{ width: `${(load.riskLoad / Math.max(1, load.projects)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center relative z-10">
            <h3 className="font-black text-[var(--text)] text-base flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-amber-500/80"></i> Intervention Queue
            </h3>
            {itAnalytics.interventionQueue.length > 0 && (
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest bg-rose-50 ring-1 ring-inset ring-rose-200/50 px-2 py-1 rounded-md shadow-sm">{itAnalytics.interventionQueue.length} Pending</span>
            )}
          </div>
          <div className="p-5 flex-grow overflow-y-auto max-h-[350px] space-y-3 relative z-10 custom-scrollbar pr-2">
            {itAnalytics.interventionQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--muted)]">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl mb-4 ring-1 ring-emerald-200/50 shadow-sm">
                  <i className="fas fa-check-double"></i>
                </div>
                <p className="font-black text-emerald-700 text-sm uppercase tracking-widest mb-1">All Clear</p>
                <p className="text-xs font-medium max-w-[200px]">No urgent interventions required for any tracked projects.</p>
              </div>
            ) : (
              itAnalytics.interventionQueue.slice(0, 4).map(item => (
                <div key={item.project.code} className="group/item relative overflow-hidden bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-xl p-4 shadow-sm hover:ring-[#0F3DDE]/40 hover:shadow-md transition-all duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent group-hover/item:via-[#0F3DDE]/50 transition-colors"></div>
                  
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-black text-[var(--muted)] font-mono tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-[var(--border)]">{item.project.code}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-wider shadow-sm ring-1 ring-inset ${
                      item.priority === 'Critical' ? 'bg-rose-50 text-rose-700 ring-rose-200/50' : 
                      item.priority === 'High' ? 'bg-amber-50 text-amber-700 ring-amber-200/50' : 'bg-blue-50 text-blue-700 ring-[var(--border)]'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-black text-[var(--text)] line-clamp-1 mb-1.5 group-hover/item:text-[#0F3DDE] transition-colors">{item.project.title}</p>
                  <p className="text-xs font-bold text-[var(--muted)] mb-3 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[8px] text-[var(--muted)]"><i className="fas fa-user-tie"></i></span>
                    {item.project.adviser}
                  </p>
                  
                  <div className="bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg p-2.5 text-[11px] font-bold text-slate-600 flex justify-between items-center group-hover/item:bg-blue-50/30 group-hover/item:text-[#0F3DDE] transition-colors">
                    <span className="truncate pr-4"><i className="fas fa-bolt mr-1.5 opacity-50"></i> {item.action}</span>
                    <i className="fas fa-arrow-right text-slate-300 group-hover/item:text-[#0F3DDE] group-hover/item:translate-x-0.5 transition-all"></i>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[var(--border)] mb-8 overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)]">
          <div>
            <h3 className="font-black text-[var(--text)] text-lg tracking-tight">Project Monitoring Directory</h3>
            <p className="text-sm text-[var(--muted)] font-medium mt-1">Detailed progress and status for <strong className="text-[var(--text)]">{filteredProjects.length}</strong> tracked projects.</p>
          </div>
          <div className="relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[#0F3DDE] transition-colors"></i>
            <input type="text" placeholder="Search projects..." className="h-11 pl-11 pr-4 bg-[var(--surface-alt)] ring-1 ring-[var(--border)] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none w-full sm:w-72 transition-all shadow-inner" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 text-[var(--muted)] text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)]">Project Title</th>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)]">Adviser</th>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)]">Students</th>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)]">Status</th>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)]">Risk</th>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)] w-32">Progress</th>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)]">Tech Transfer</th>
                <th className="px-5 py-4 font-bold border-b border-[var(--border)] text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-slate-100">
                      <i className="fas fa-search text-2xl text-slate-300"></i>
                    </div>
                    <p className="font-bold text-[var(--text)] text-base">No projects found</p>
                    <p className="text-[var(--muted)] text-sm mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project.code} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 align-top">
                      <p className="font-extrabold text-slate-800 m-0 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">{project.title}</p>
                      <span className="text-[11px] font-black text-[var(--muted)] uppercase tracking-widest mt-2 inline-block">{project.code}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black shadow-sm ring-1 ring-[var(--border)] shrink-0">
                          {project.adviser.split(' ').map((name) => name[0]).join('')}
                        </div>
                        <span className="text-sm font-bold text-[var(--text)] whitespace-nowrap">{project.adviser}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex -space-x-2">
                        {project.students.slice(0, 3).map((_, index) => (
                          <div key={index} className="w-8 h-8 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-[var(--muted)] shadow-sm transition-transform hover:scale-110 hover:z-10">
                            <i className="fas fa-user"></i>
                          </div>
                        ))}
                        {project.students.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-50 ring-2 ring-white flex items-center justify-center text-[10px] font-black text-[var(--muted)] shadow-sm z-10">
                            +{project.students.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm ${
                        project.status === 'Active' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-[var(--border)]' :
                        project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/50' :
                        project.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/50' :
                        'bg-slate-50 text-slate-600 ring-1 ring-inset ring-[var(--border)]'
                      }`}>
                        {project.status === 'Completed' && <i className="fas fa-check text-[10px]"></i>}
                        {project.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        project.riskLevel === 'On Track' ? 'text-emerald-600 bg-emerald-50/50' :
                        project.riskLevel === 'At Risk' ? 'text-amber-600 bg-amber-50/50' : 'text-rose-600 bg-rose-50/50'
                      }`}>
                        <i className={`fas ${
                          project.riskLevel === 'On Track' ? 'fa-check-circle' :
                          project.riskLevel === 'At Risk' ? 'fa-exclamation-triangle' : 'fa-times-circle'
                        }`}></i> {project.riskLevel}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-1000 ${
                            project.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#0F3DDE] to-[#4A72FF]'
                          }`} style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-[var(--text)]">{project.progress}%</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mt-2 truncate max-w-[120px]" title={project.currentStage}>{project.currentStage}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {project.transferStatus === 'Ready for Transfer' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-wider ring-1 ring-inset ring-emerald-200/50 shadow-sm">
                          <i className="fas fa-rocket"></i> Ready
                        </span>
                      ) : project.transferStatus === 'Deployed' || project.transferStatus === 'In Use' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-[11px] font-black uppercase tracking-wider ring-1 ring-inset ring-purple-200/50 shadow-sm">
                          <i className="fas fa-box-open"></i> {project.transferStatus}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider">{project.transferStatus}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-center relative">
                      <button 
                        className="w-8 h-8 rounded-xl text-[var(--muted)] hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        onClick={() => setActionMenuOpen(actionMenuOpen === project.code ? null : project.code)}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      
                      {actionMenuOpen === project.code && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)}></div>
                          <div className="absolute right-8 top-10 w-56 bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] shadow-[0_12px_40px_rgba(15,23,42,0.12)] rounded-xl z-20 p-1.5 text-left overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <button className="w-full px-3 py-2 text-[13px] text-[var(--text)] hover:bg-slate-50 hover:text-[#0F3DDE] rounded-lg flex items-center gap-2.5 font-bold transition-colors">
                              <div className="w-5 flex justify-center"><i className="fas fa-eye text-[var(--muted)]"></i></div> View Project
                            </button>
                            <button className="w-full px-3 py-2 text-[13px] text-[var(--text)] hover:bg-slate-50 hover:text-[#0F3DDE] rounded-lg flex items-center gap-2.5 font-bold transition-colors">
                              <div className="w-5 flex justify-center"><i className="fas fa-chart-line text-[var(--muted)]"></i></div> Monitor Progress
                            </button>
                            <button className="w-full px-3 py-2 text-[13px] text-[var(--text)] hover:bg-slate-50 hover:text-[#0F3DDE] rounded-lg flex items-center gap-2.5 font-bold transition-colors">
                              <div className="w-5 flex justify-center"><i className="fas fa-file-alt text-[var(--muted)]"></i></div> Generate Report
                            </button>
                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                            <button className="w-full px-3 py-2 text-[13px] text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-2.5 font-bold transition-colors">
                              <div className="w-5 flex justify-center"><i className="fas fa-user-edit text-amber-500"></i></div> Assign Adviser
                            </button>
                            <button className="w-full px-3 py-2 text-[13px] text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 font-bold transition-colors">
                              <div className="w-5 flex justify-center"><i className="fas fa-archive text-rose-500"></i></div> Archive Project
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="font-extrabold text-[var(--text)] text-base">Top Performing Adviser</h3>
            <button className="text-sm font-bold text-[#0F3DDE] hover:text-[var(--text)]">View All</button>
          </div>
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0F3DDE] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-3xl shadow-lg mb-4 ring-4 ring-blue-50">
              {topAdviser.name.split(' ').map((name) => name[0]).join('')}
            </div>
            <h4 className="text-xl font-extrabold text-slate-800 mb-1">{topAdviser.name}</h4>
            <p className="text-sm text-[var(--muted)] font-medium mb-6">Overall Score: <span className="font-bold text-[#0F3DDE] text-lg">{topAdviser.overallScore}%</span></p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 rounded-xl p-4 border border-[var(--border)]">
                <i className="fas fa-project-diagram text-[#0F3DDE] text-xl mb-2"></i>
                <span className="block text-2xl font-extrabold text-slate-800">{topAdviser.projectsSupervised}</span>
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Projects</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-[var(--border)]">
                <i className="fas fa-rocket text-[#8B5CF6] text-xl mb-2"></i>
                <span className="block text-2xl font-extrabold text-slate-800">{topAdviser.techTransferCount}</span>
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Transfers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg">
                  <i className="fas fa-certificate"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Accreditation Readiness</h3>
                  <p className="text-xs text-[var(--muted)] font-medium">Cycle: AY 2025-2026</p>
                </div>
              </div>
              <span className="text-xl font-extrabold text-[var(--text)]">{itAnalytics.evidenceReadiness}%</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${itAnalytics.evidenceReadiness}%` }}></div>
            </div>
            
            <p className="text-sm text-slate-600 mb-5">
              <strong className="text-slate-800">{itAnalytics.evidenceTotal} files</strong> uploaded. Need {itAnalytics.totalProjects * 6 - itAnalytics.evidenceTotal} more documents for full compliance.
            </p>
            
            <div className="flex gap-3">
              <button className="flex-1 py-2 px-4 bg-amber-500 text-white font-bold text-sm rounded-lg hover:bg-amber-600 transition-colors shadow-sm">
                <i className="fas fa-cloud-upload-alt mr-2"></i> Upload Evidence
              </button>
              <button className="py-2 px-4 bg-[var(--surface)] border border-amber-200 text-amber-700 font-bold text-sm rounded-lg hover:bg-amber-50 transition-colors">
                <i className="fas fa-bell"></i>
              </button>
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col flex-grow">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-extrabold text-[var(--text)] text-sm">Recent Activity</h3>
            </div>
            <div className="p-4 flex-grow overflow-hidden relative">
              <div className="absolute left-6 top-6 bottom-4 w-px bg-slate-100"></div>
              
              <div className="relative pl-10 mb-4">
                <div className="absolute left-0 w-5 h-5 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[8px] text-[#0F3DDE] shadow-sm">
                  <i className="fas fa-check"></i>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">Project Proposal Approved</p>
                <p className="text-xs text-[var(--muted)]">"AI-Powered Learning System" approved by Dr. Cruz.</p>
                <span className="text-[10px] font-bold text-[var(--muted)] mt-1 block">2 HOURS AGO</span>
              </div>
              
              <div className="relative pl-10 mb-4">
                <div className="absolute left-0 w-5 h-5 rounded-full bg-purple-50 border-2 border-white flex items-center justify-center text-[8px] text-[#8B5CF6] shadow-sm">
                  <i className="fas fa-file-upload"></i>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">Evidence Uploaded</p>
                <p className="text-xs text-[var(--muted)]">Chapter 3 documentation mapped to IT-2026-04.</p>
                <span className="text-[10px] font-bold text-[var(--muted)] mt-1 block">5 HOURS AGO</span>
              </div>
              
              <div className="relative pl-10">
                <div className="absolute left-0 w-5 h-5 rounded-full bg-amber-50 border-2 border-white flex items-center justify-center text-[8px] text-amber-500 shadow-sm">
                  <i className="fas fa-exclamation"></i>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">Milestone Alert</p>
                <p className="text-xs text-[var(--muted)]">"IoT Campus Monitoring" marked as behind schedule.</p>
                <span className="text-[10px] font-bold text-[var(--muted)] mt-1 block">1 DAY AGO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProgramHeadModal open={exportOpen} title="Export Department Report" onClose={() => setExportOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text)] mb-1.5" htmlFor="ph-dashboard-report">Report Type</label>
            <select className="w-full h-11 px-4 bg-slate-50 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] outline-none" id="ph-dashboard-report" defaultValue="Department dashboard summary">
              <option>Department dashboard summary</option>
              <option>IT project inventory</option>
              <option>Accreditation readiness overview</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)] mb-1.5" htmlFor="ph-dashboard-format">Format</label>
            <select className="w-full h-11 px-4 bg-slate-50 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] outline-none" id="ph-dashboard-format" defaultValue="PDF Document">
              <option>PDF Document</option>
              <option>Excel Spreadsheet</option>
              <option>CSV Data</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)] mb-2">Include Sections</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer"><input defaultChecked type="checkbox" className="w-4 h-4 text-[#0F3DDE] rounded border-slate-300 focus:ring-[#0F3DDE]" /> <span className="text-sm text-slate-600">KPI summary</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input defaultChecked type="checkbox" className="w-4 h-4 text-[#0F3DDE] rounded border-slate-300 focus:ring-[#0F3DDE]" /> <span className="text-sm text-slate-600">Project status chart</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input defaultChecked type="checkbox" className="w-4 h-4 text-[#0F3DDE] rounded border-slate-300 focus:ring-[#0F3DDE]" /> <span className="text-sm text-slate-600">Adviser overview</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input defaultChecked type="checkbox" className="w-4 h-4 text-[#0F3DDE] rounded border-slate-300 focus:ring-[#0F3DDE]" /> <span className="text-sm text-slate-600">Risk intervention queue</span></label>
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-3 justify-end">
          <button onClick={() => setExportOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={() => setExportOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#0F3DDE] hover:bg-[#0c31b3] shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5">Generate Report</button>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
