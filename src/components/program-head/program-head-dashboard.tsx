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
  const [searchQuery, setSearchQuery] = useState('');
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
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) ||
        p.adviser.toLowerCase().includes(q)
      );
    }
    
    return projects;
  }, [itProjects, statusFilter, adviserFilter, categoryFilter, searchQuery]);

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
      title="Program Head Dashboard"
      description="IT Department | Monitoring and accreditation"
      notificationCount={3}
    >
      {/* Organic Asymmetric Hero & Metrics Section */}
      <div className="relative overflow-hidden bg-[var(--surface)] backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] border border-[var(--border)] transition-all duration-300">
        {/* Organic Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-10">
          <div className="flex-1 max-w-2xl flex flex-col justify-center">
            <div className="mb-5 flex flex-col gap-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Department Operations Center</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#0F3DDE] tracking-tight mb-2 flex items-center gap-2">
                Department Overview
              </h1>
              <p className="text-sm text-[var(--muted)] font-medium max-w-2xl mt-0.5">
                Monitor active project progress, evaluate technology transfer readiness, and manage student performance across the entire IT department in real-time.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button className="group relative overflow-hidden px-5 py-2.5 bg-[#0F3DDE] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center">
                <i className="fas fa-file-signature mr-2 group-hover:rotate-12 transition-transform"></i> Endorse Transfers
              </button>
              <button className="group relative overflow-hidden px-5 py-2.5 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text)] font-bold text-sm rounded-xl hover:bg-slate-50 active:scale-95 transition-all duration-300 flex items-center">
                <i className="fas fa-calendar-alt mr-2 text-[var(--muted)]"></i> View Schedule
              </button>
            </div>
          </div>
          
          {/* Integrated Telemetry - NO BOXES */}
          <div className="xl:w-[480px] shrink-0 flex flex-col justify-center relative py-4">
            {/* Subtle left divider to separate from text */}
            <div className="hidden xl:block absolute left-[-3rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--border)] to-transparent"></div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-12">
              {/* Metric 1 */}
              <div className="relative group">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-folder-open text-[var(--text-meta)] text-sm group-hover:text-[#0F3DDE] transition-colors"></i>
                  <span className="text-[10px] font-bold text-[var(--text-meta)] uppercase tracking-widest group-hover:text-[var(--text)] transition-colors">Tracked Projects</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-extrabold text-[#0F3DDE] tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform origin-left">{itAnalytics.totalProjects}</div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 mb-1">+12%</span>
                    <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">vs Last Cycle</span>
                  </div>
                </div>
              </div>
              
              {/* Metric 2 */}
              <div className="relative group">
                {/* Internal Vertical Divider */}
                <div className="absolute -left-4 top-2 bottom-2 w-px bg-[var(--border)] hidden sm:block"></div>
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-chart-line text-[var(--text-meta)] text-sm group-hover:text-[#0F3DDE] transition-colors"></i>
                  <span className="text-[10px] font-bold text-[var(--text-meta)] uppercase tracking-widest group-hover:text-[var(--text)] transition-colors">Completion Rate</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-5xl font-extrabold text-[#0F3DDE] tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform origin-left">{itAnalytics.completionRate}</div>
                  <span className="text-2xl font-extrabold text-[var(--muted)]">%</span>
                </div>
              </div>
            </div>

            {/* Subtle horizontal divider */}
            <div className="w-full h-px bg-gradient-to-r from-[var(--border)] via-[var(--border)] to-transparent my-8 relative">
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--muted)]"></div>
            </div>

            {/* Metric 3 - Intervention (Alert Style, no box) */}
            <div className="relative group cursor-pointer">
               {/* Hover Glow */}
               <div className="absolute -inset-6 bg-rose-50/0 group-hover:bg-rose-50 rounded-[2rem] transition-colors blur-xl pointer-events-none"></div>
               
               <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse ring-2 ring-rose-200"></div>
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Immediate Attention</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-extrabold text-[var(--text)] tracking-tighter drop-shadow-sm">
                        {itAnalytics.interventionQueue.length}
                      </div>
                      <span className="text-sm font-bold text-rose-600 uppercase tracking-widest">Projects At Risk</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] group-hover:text-[#0F3DDE] group-hover:border-[#0F3DDE]/30 group-hover:bg-blue-50 transition-all group-hover:translate-x-2 shadow-sm bg-[var(--surface-alt)]">
                    <i className="fas fa-arrow-right"></i>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Top Section: Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Project Distribution */}
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Analytics</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Project Distribution
              </h3>
            </div>
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
                      formatter={(value: any, name: any) => [`${value} projects`, name]}
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
                  <span className="text-3xl font-bold text-[var(--text)] tracking-tight drop-shadow-sm">{filteredAnalytics.totalProjects}</span>
                  <span className="text-[10px] uppercase font-bold text-[#0F3DDE] tracking-widest bg-blue-50/80 px-2 py-0.5 rounded-full mt-1 ring-1 ring-blue-100/50">Total</span>
                </div>
              )}
            </div>
            
            <div className="mt-5 space-y-3 px-2">
              {filteredAnalytics.statusDistribution.map(item => (
                <div key={item.name} className="flex items-center gap-3 group/item p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-white shadow-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-slate-600 flex-1 group-hover/item:text-[var(--text)] transition-colors">{item.name}</span>
                  <span className="text-sm font-bold text-[var(--text)]">{item.value}</span>
                  <span className="text-xs font-bold text-[var(--muted)] w-10 text-right bg-slate-100/50 px-1.5 py-0.5 rounded-md group-hover/item:bg-slate-200/50 transition-colors">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Adviser Workload */}
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Analytics</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Adviser Workload
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#0F3DDE] uppercase tracking-widest bg-blue-50 ring-1 ring-inset ring-[var(--border)] px-2 py-1 rounded-md shadow-sm">{itAnalytics.adviserWorkload.length} Active</span>
          </div>
          <div className="p-5 flex-grow overflow-y-auto max-h-[350px] space-y-3 relative z-10 custom-scrollbar pr-2">
            {itAnalytics.adviserWorkload.map(load => (
              <div key={load.adviser} className="flex items-center gap-4 group/item p-2.5 rounded-xl hover:bg-slate-50 hover:ring-1 hover:ring-[var(--border)] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-100 flex items-center justify-center text-sm font-bold text-[#0F3DDE] shadow-sm group-hover/item:scale-105 transition-transform">
                  {load.adviser.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover/item:text-[var(--text)] transition-colors">{load.adviser}</p>
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

        {/* Top Performing Adviser */}
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Performance</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Top Performing Adviser
              </h3>
            </div>
            <button className="text-sm font-bold text-[#0F3DDE] hover:text-[#0F3DDE]/80 transition-colors">View All</button>
          </div>
          <div className="p-6 flex flex-col items-center text-center relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0F3DDE] to-[#4A72FF] text-white flex items-center justify-center font-bold text-3xl shadow-[0_8px_20px_rgba(15,61,222,0.3)] mb-4 ring-4 ring-[#0F3DDE]/10 group-hover:scale-110 transition-transform duration-500">
              {topAdviser.name.split(' ').map((name) => name[0]).join('')}
            </div>
            <h4 className="text-xl font-bold text-[var(--text)] mb-1">{topAdviser.name}</h4>
            <p className="text-sm text-[var(--muted)] font-medium mb-6">Overall Score: <span className="font-bold text-[#0F3DDE] text-lg">{topAdviser.overallScore}%</span></p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-[var(--surface-alt)] rounded-xl p-4 ring-1 ring-inset ring-[var(--border)] hover:bg-[#0F3DDE]/5 transition-colors">
                <i className="fas fa-project-diagram text-[#0F3DDE] text-xl mb-2"></i>
                <span className="block text-2xl font-bold text-[var(--text)]">{topAdviser.projectsSupervised}</span>
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.15em]">Projects</span>
              </div>
              <div className="bg-[var(--surface-alt)] rounded-xl p-4 ring-1 ring-inset ring-[var(--border)] hover:bg-purple-500/5 transition-colors">
                <i className="fas fa-rocket text-purple-600 text-xl mb-2"></i>
                <span className="block text-2xl font-bold text-[var(--text)]">{topAdviser.techTransferCount}</span>
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.15em]">Transfers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accreditation Readiness */}
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden p-6">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/80"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg ring-1 ring-amber-500/20">
                <i className="fas fa-certificate"></i>
              </div>
              <div>
                <h3 className="font-bold text-[var(--text)] text-lg">Accreditation Readiness</h3>
                <p className="text-xs text-[var(--muted)] font-medium">Cycle: AY 2025-2026</p>
              </div>
            </div>
            <span className="text-xl font-extrabold text-[var(--text)]">{itAnalytics.evidenceReadiness}%</span>
          </div>
          
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${itAnalytics.evidenceReadiness}%` }}></div>
          </div>
          
          <p className="text-sm text-[var(--muted)] mb-6 font-medium relative z-10">
            <strong className="text-[var(--text)]">{itAnalytics.evidenceTotal} files</strong> uploaded. Need {itAnalytics.totalProjects * 6 - itAnalytics.evidenceTotal} more documents for full compliance.
          </p>
          
          <div className="flex gap-3 relative z-10">
            <button className="flex-1 py-2.5 px-4 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 hover:-translate-y-0.5 transition-all shadow-sm shadow-amber-500/20">
              <i className="fas fa-cloud-upload-alt mr-2"></i> Upload Evidence
            </button>
            <button className="py-2.5 px-4 bg-[var(--surface)] border border-amber-200 text-amber-700 font-bold text-sm rounded-xl hover:bg-amber-50 hover:-translate-y-0.5 transition-all shadow-sm">
              <i className="fas fa-bell"></i>
            </button>
          </div>
        </div>

        {/* Intervention Queue */}
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Intervention</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Intervention Queue
              </h3>
            </div>
            {itAnalytics.interventionQueue.length > 0 && (
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest bg-rose-50 ring-1 ring-inset ring-rose-200/50 px-2 py-1 rounded-md shadow-sm">{itAnalytics.interventionQueue.length} Pending</span>
            )}
          </div>
          <div className="p-5 flex-grow overflow-y-auto max-h-[350px] space-y-3 relative z-10 custom-scrollbar pr-2">
            {itAnalytics.interventionQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--muted)]">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl mb-4 ring-1 ring-emerald-200/50 shadow-sm">
                  <i className="fas fa-check-double"></i>
                </div>
                <p className="font-bold text-emerald-700 text-sm uppercase tracking-widest mb-1">All Clear</p>
                <p className="text-xs font-medium max-w-[200px]">No urgent interventions required for any tracked projects.</p>
              </div>
            ) : (
              itAnalytics.interventionQueue.slice(0, 4).map(item => (
                <div key={item.project.code} className="group/item relative overflow-hidden bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-xl p-4 shadow-sm hover:ring-[#0F3DDE]/40 hover:shadow-md transition-all duration-300">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent group-hover/item:via-[#0F3DDE]/50 transition-colors"></div>
                  
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-bold text-[var(--muted)] font-mono tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-[var(--border)]">{item.project.code}</span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md tracking-wider shadow-sm ring-1 ring-inset ${
                      item.priority === 'Critical' ? 'bg-rose-50 text-rose-700 ring-rose-200/50' : 
                      item.priority === 'High' ? 'bg-amber-50 text-amber-700 ring-amber-200/50' : 'bg-blue-50 text-blue-700 ring-[var(--border)]'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[var(--text)] line-clamp-1 mb-1.5 group-hover/item:text-[#0F3DDE] transition-colors">{item.project.title}</p>
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

        {/* Recent Activity */}
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden flex-grow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-[var(--border)] relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Recent Activity</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Latest Updates
              </h3>
            </div>
          </div>
          <div className="p-6 flex-grow overflow-hidden relative z-10">
            <div className="absolute left-8 top-8 bottom-6 w-px bg-[var(--border)]"></div>
            
            <div className="relative pl-12 mb-6 group/item">
              <div className="absolute left-0 w-6 h-6 rounded-full bg-[#0F3DDE]/10 ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] text-[#0F3DDE] shadow-sm group-hover/item:scale-110 transition-transform">
                <i className="fas fa-check"></i>
              </div>
              <p className="text-sm font-bold text-[var(--text)] mb-0.5 group-hover/item:text-[#0F3DDE] transition-colors">Project Proposal Approved</p>
              <p className="text-xs text-[var(--muted)] font-medium">"AI-Powered Learning System" approved by Dr. Cruz.</p>
              <span className="text-[10px] font-bold text-[var(--muted)] mt-1 block opacity-70">2 HOURS AGO</span>
            </div>
            
            <div className="relative pl-12 mb-6 group/item">
              <div className="absolute left-0 w-6 h-6 rounded-full bg-purple-500/10 ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] text-purple-600 shadow-sm group-hover/item:scale-110 transition-transform">
                <i className="fas fa-file-upload"></i>
              </div>
              <p className="text-sm font-bold text-[var(--text)] mb-0.5 group-hover/item:text-purple-600 transition-colors">Evidence Uploaded</p>
              <p className="text-xs text-[var(--muted)] font-medium">Chapter 3 documentation mapped to IT-2026-04.</p>
              <span className="text-[10px] font-bold text-[var(--muted)] mt-1 block opacity-70">5 HOURS AGO</span>
            </div>
            
            <div className="relative pl-12 group/item">
              <div className="absolute left-0 w-6 h-6 rounded-full bg-amber-500/10 ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] text-amber-600 shadow-sm group-hover/item:scale-110 transition-transform">
                <i className="fas fa-exclamation"></i>
              </div>
              <p className="text-sm font-bold text-[var(--text)] mb-0.5 group-hover/item:text-amber-600 transition-colors">Milestone Alert</p>
              <p className="text-xs text-[var(--muted)] font-medium">"IoT Campus Monitoring" marked as behind schedule.</p>
              <span className="text-[10px] font-bold text-[var(--muted)] mt-1 block opacity-70">1 DAY AGO</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Full Width Data Directory */}
      <div className="mb-8 w-full">
        <div className="bg-[var(--surface)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[var(--border)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-alt)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F3DDE]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-[var(--text)] text-xl tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F3DDE]/10 to-[#0F3DDE]/5 text-[#0F3DDE] flex items-center justify-center text-sm shadow-sm ring-1 ring-[#0F3DDE]/20">
                  <i className="fas fa-desktop"></i>
                </div> 
                Project Monitoring Directory
              </h3>
              <p className="text-sm text-[var(--muted)] font-medium mt-2 pl-[52px]">Detailed progress and status for <strong className="text-[var(--text)]">{filteredProjects.length}</strong> tracked projects.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)] relative z-10">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Academic Year</label>
              <div className="relative">
                <select className="w-full h-11 pl-4 pr-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:ring-slate-300 appearance-none shadow-inner" defaultValue="AY 2025-2026">
                  <option>AY 2025-2026</option>
                  <option>AY 2024-2025</option>
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
              </div>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Status</label>
              <div className="relative">
                <select
                  className="w-full h-11 pl-4 pr-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:ring-slate-300 appearance-none shadow-inner"
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
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Adviser</label>
              <div className="relative">
                <select
                  className="w-full h-11 pl-4 pr-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:ring-slate-300 appearance-none shadow-inner"
                  value={adviserFilter}
                  onChange={(e) => setAdviserFilter(e.target.value)}
                >
                  <option value="All Advisers">All Advisers</option>
                  {itAdvisers.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
              </div>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Category</label>
              <div className="relative">
                <select
                  className="w-full h-11 pl-4 pr-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none cursor-pointer transition-all hover:bg-slate-50 hover:ring-slate-300 appearance-none shadow-inner"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All Categories">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
              </div>
            </div>

            <div className="flex-[2] min-w-[200px] group">
              <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 pl-1">Search Directory</label>
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm group-focus-within:text-[#0F3DDE] transition-colors"></i>
                <input
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-sm font-medium text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] focus:bg-[var(--surface)] outline-none placeholder:text-[var(--muted)] hover:bg-slate-50 hover:ring-slate-300 transition-all shadow-inner"
                  placeholder="Search projects, advisers, categories..."
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
                onClick={() => { setStatusFilter('All Status'); setAdviserFilter('All Advisers'); setCategoryFilter('All Categories'); setSearchQuery(''); }}
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
                  <th className="px-6 py-5 border-b border-[var(--border)]">Project Title</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Adviser</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Students</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Status</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Risk</th>
                  <th className="px-6 py-5 border-b border-[var(--border)] w-44">Progress</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Tech Transfer</th>
                  <th className="px-6 py-5 border-b border-[var(--border)] text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center">
                      <div className="w-20 h-20 bg-[var(--surface-alt)] rounded-3xl flex items-center justify-center mx-auto mb-5 ring-1 ring-[var(--border)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <i className="fas fa-search text-3xl text-[var(--muted)] opacity-50"></i>
                      </div>
                      <p className="font-bold text-[var(--text)] text-lg m-0">No projects found</p>
                      <p className="text-[var(--muted)] font-medium text-sm mt-2">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(project => (
                    <tr key={project.code} className="group transition-all duration-200 hover:bg-[var(--surface-alt)]">
                      <td className="px-6 py-5 align-top">
                        <p className="font-extrabold text-[var(--text)] m-0 group-hover:text-[#0F3DDE] transition-colors line-clamp-2 leading-snug">{project.title}</p>
                        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mt-2 inline-block">{project.code}</span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F3DDE]/10 to-[#0F3DDE]/5 text-[#0F3DDE] flex items-center justify-center text-[10px] font-bold shadow-sm ring-1 ring-[var(--border)] shrink-0">
                            {project.adviser.split(' ').map((name: string) => name[0]).join('')}
                          </div>
                          <span className="text-sm font-bold text-[var(--text)] whitespace-nowrap">{project.adviser}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex -space-x-2">
                          {project.students.slice(0, 3).map((_: any, index: number) => (
                            <div key={index} className="w-8 h-8 rounded-full bg-[var(--surface-alt)] ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] font-bold text-[var(--muted)] shadow-sm transition-transform hover:scale-110 hover:z-10">
                              <i className="fas fa-user"></i>
                            </div>
                          ))}
                          {project.students.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-[var(--surface-alt)] ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] font-bold text-[var(--muted)] shadow-sm z-10">
                              +{project.students.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${
                          project.status === 'Active' ? 'bg-[#0F3DDE]/5 text-[#0F3DDE] ring-1 ring-inset ring-[var(--border)]' :
                          project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20' :
                          project.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20' :
                          'bg-[var(--surface-alt)] text-[var(--muted)] ring-1 ring-inset ring-[var(--border)]'
                        }`}>
                          {project.status === 'Completed' && <i className="fas fa-check text-[10px]"></i>}
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          project.riskLevel === 'On Track' ? 'text-emerald-500 bg-emerald-500/10' :
                          project.riskLevel === 'At Risk' ? 'text-amber-500 bg-amber-500/10' : 'text-rose-500 bg-rose-500/10'
                        }`}>
                          <i className={`fas ${
                            project.riskLevel === 'On Track' ? 'fa-check-circle' :
                            project.riskLevel === 'At Risk' ? 'fa-exclamation-triangle' : 'fa-times-circle'
                          }`}></i> {project.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-[var(--surface-alt)] rounded-full overflow-hidden shadow-inner ring-1 ring-inset ring-[var(--border)]">
                            <div className={`h-full rounded-full transition-all duration-1000 ${
                              project.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#0F3DDE] to-[#4A72FF]'
                            }`} style={{ width: `${project.progress}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-[var(--text)]">{project.progress}%</span>
                        </div>
                        <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mt-2 truncate max-w-[120px]" title={project.currentStage}>{project.currentStage}</span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        {project.transferStatus === 'Ready for Transfer' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ring-emerald-500/20 shadow-sm">
                            <i className="fas fa-rocket"></i> Ready
                          </span>
                        ) : project.transferStatus === 'Deployed' || project.transferStatus === 'In Use' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ring-purple-500/20 shadow-sm">
                            <i className="fas fa-box-open"></i> {project.transferStatus}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider">{project.transferStatus}</span>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top text-center relative">
                        <button 
                          className="w-8 h-8 rounded-xl text-[var(--muted)] hover:text-[#0F3DDE] hover:bg-[#0F3DDE]/10 transition-colors flex items-center justify-center"
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
