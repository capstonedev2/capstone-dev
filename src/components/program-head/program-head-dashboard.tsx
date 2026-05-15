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
      <div className="flex justify-end gap-3 mb-8">
        <button className="px-5 py-2.5 bg-white border border-slate-200 text-[#081B4B] font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
          <i className="fas fa-calendar-alt mr-2 text-[#0F3DDE]"></i> View Schedule
        </button>
        <button className="px-5 py-2.5 bg-[#0F3DDE] text-white font-bold rounded-xl shadow-md shadow-blue-900/20 hover:bg-[#0c31b3] hover:-translate-y-0.5 transition-all">
          <i className="fas fa-file-signature mr-2"></i> Endorse Transfers
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0F3DDE] flex items-center justify-center text-xl">
              <i className="fas fa-folder-open"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <i className="fas fa-arrow-up"></i> 12%
            </span>
          </div>
          <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Tracked Projects</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#081B4B]">{itAnalytics.totalProjects}</span>
            <span className="text-sm font-semibold text-slate-400">Total</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#0F3DDE] w-3/4 rounded-full"></div>
            </div>
            <span className="text-xs font-bold text-slate-500">{itAnalytics.activeProjects} active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              <i className="fas fa-chart-line"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <i className="fas fa-arrow-up"></i> 5%
            </span>
          </div>
          <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Completion Rate</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#081B4B]">{itAnalytics.completionRate}%</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${itAnalytics.completionRate}%` }}></div>
            </div>
            <span className="text-xs font-bold text-slate-500">{itAnalytics.completedProjects} done</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl">
              <i className="fas fa-tasks"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              <i className="fas fa-minus"></i> 0%
            </span>
          </div>
          <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Intervention Queue</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#081B4B]">{itAnalytics.interventionQueue.length}</span>
            <span className="text-sm font-semibold text-slate-400">Items</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-1/3"></div>
            </div>
            <span className="text-xs font-bold text-slate-500">{itAnalytics.behindScheduleProjects} urgent</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center text-xl">
              <i className="fas fa-shield-alt"></i>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <i className="fas fa-arrow-up"></i> 8%
            </span>
          </div>
          <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Evidence Readiness</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#081B4B]">{itAnalytics.evidenceReadiness}%</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#8B5CF6] rounded-full transition-all duration-1000" style={{ width: `${itAnalytics.evidenceReadiness}%` }}></div>
            </div>
            <span className="text-xs font-bold text-slate-500">{itAnalytics.evidenceTotal} files</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-3 mb-8 flex flex-wrap items-center gap-3 sticky top-0 z-10">
        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <select className="w-full h-10 pl-10 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-[#0F3DDE] focus:border-[#0F3DDE] outline-none cursor-pointer transition-colors" defaultValue="AY 2025-2026">
            <option>AY 2025-2026</option>
            <option>AY 2024-2025</option>
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
        </div>

        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <select 
            className="w-full h-10 pl-10 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-[#0F3DDE] outline-none cursor-pointer transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="On Hold">On Hold</option>
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
        </div>

        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-chalkboard-teacher absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <select 
            className="w-full h-10 pl-10 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-[#0F3DDE] outline-none cursor-pointer transition-colors"
            value={adviserFilter}
            onChange={(e) => setAdviserFilter(e.target.value)}
          >
            <option value="All Advisers">All Advisers</option>
            {itAdvisers.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
        </div>
        
        <div className="relative min-w-[160px] flex-1">
          <i className="fas fa-tags absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <select 
            className="w-full h-10 pl-10 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-[#0F3DDE] outline-none cursor-pointer transition-colors"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All Categories">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
        </div>

        <button 
          onClick={() => setExportOpen(true)}
          className="h-10 px-5 bg-white border border-slate-200 text-[#081B4B] rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors whitespace-nowrap ml-auto"
        >
          <i className="fas fa-file-export mr-2 text-[#0F3DDE]"></i> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-[#081B4B] text-base">Project Distribution</h3>
            <button className="text-slate-400 hover:text-[#0F3DDE]"><i className="fas fa-ellipsis-h"></i></button>
          </div>
          <div className="p-5 flex-grow flex flex-col">
            <div className="relative h-48 w-full">
              {statusChartData.length > 0 ? (
                <ChartResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value, name) => [`${value} projects`, name]}
                      itemStyle={{ fontWeight: 'bold', color: '#081B4B' }}
                    />
                  </PieChart>
                </ChartResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No data available
                </div>
              )}
              {statusChartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-[#081B4B]">{filteredAnalytics.totalProjects}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 space-y-3">
              {filteredAnalytics.statusDistribution.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-semibold text-slate-700 flex-1">{item.name}</span>
                  <span className="text-sm font-bold text-[#081B4B]">{item.value}</span>
                  <span className="text-xs font-medium text-slate-400 w-8 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-[#081B4B] text-base">Adviser Workload</h3>
            <span className="text-xs font-bold text-[#0F3DDE] bg-blue-50 px-2 py-1 rounded-md">{itAnalytics.adviserWorkload.length} Active</span>
          </div>
          <div className="p-5 flex-grow overflow-y-auto max-h-[340px] space-y-4">
            {itAnalytics.adviserWorkload.map(load => (
              <div key={load.adviser} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-[#081B4B]">
                  {load.adviser.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{load.adviser}</p>
                    <span className="text-xs font-bold text-slate-500">{load.projects} projects</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#0F3DDE]" style={{ width: `${(load.active / Math.max(1, load.projects)) * 100}%` }}></div>
                    <div className="h-full bg-emerald-500" style={{ width: `${(load.completed / Math.max(1, load.projects)) * 100}%` }}></div>
                    <div className="h-full bg-amber-500" style={{ width: `${(load.riskLoad / Math.max(1, load.projects)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-[#081B4B] text-base">Intervention Queue</h3>
            {itAnalytics.interventionQueue.length > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">{itAnalytics.interventionQueue.length} Pending</span>
            )}
          </div>
          <div className="p-5 flex-grow overflow-y-auto max-h-[340px] space-y-3">
            {itAnalytics.interventionQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-xl mb-3">
                  <i className="fas fa-check-double"></i>
                </div>
                <p className="font-bold text-emerald-700 text-sm">All Clear</p>
                <p className="text-xs">No urgent interventions required.</p>
              </div>
            ) : (
              itAnalytics.interventionQueue.slice(0, 4).map(item => (
                <div key={item.project.code} className="border border-slate-100 rounded-xl p-3 bg-slate-50 hover:bg-white hover:border-[#0F3DDE]/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 font-mono">{item.project.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      item.priority === 'Critical' ? 'bg-red-100 text-red-700' : 
                      item.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{item.project.title}</p>
                  <p className="text-xs text-slate-500 mb-2"><i className="fas fa-user-tie mr-1"></i> {item.project.adviser}</p>
                  <div className="bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-600 flex justify-between items-center">
                    <span className="truncate">{item.action}</span>
                    <i className="fas fa-arrow-right text-slate-300"></i>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm mb-8 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-[#081B4B] text-lg">Project Monitoring Directory</h3>
            <p className="text-sm text-slate-500 font-medium">Detailed progress and status for {filteredProjects.length} tracked projects.</p>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Search projects..." className="h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white outline-none w-full sm:w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Project Title</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Adviser</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Students</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Status</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Risk</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 w-32">Progress</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Tech Transfer</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <i className="fas fa-folder-open text-3xl mb-3 text-slate-300 block"></i>
                    No projects found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project.code} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-slate-800 m-0 group-hover:text-[#0F3DDE] transition-colors line-clamp-2 leading-snug">{project.title}</p>
                      <span className="text-xs text-slate-500 font-mono mt-1.5 inline-block bg-slate-100 px-1.5 py-0.5 rounded">{project.code}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-[#0F3DDE] flex items-center justify-center text-[10px] font-bold border border-blue-100 shrink-0">
                          {project.adviser.split(' ').map((name) => name[0]).join('')}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{project.adviser}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex -space-x-2">
                        {project.students.slice(0, 3).map((_, index) => (
                          <div key={index} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                            <i className="fas fa-user"></i>
                          </div>
                        ))}
                        {project.students.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm z-10">
                            +{project.students.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        project.status === 'Active' ? 'bg-blue-50 text-[#0F3DDE] border border-blue-100' :
                        project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        project.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {project.status === 'Completed' && <i className="fas fa-check"></i>}
                        {project.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                        project.riskLevel === 'On Track' ? 'text-emerald-600' :
                        project.riskLevel === 'At Risk' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        <i className={`fas ${
                          project.riskLevel === 'On Track' ? 'fa-check-circle' :
                          project.riskLevel === 'At Risk' ? 'fa-exclamation-triangle' : 'fa-times-circle'
                        }`}></i> {project.riskLevel}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0F3DDE] rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{project.currentStage}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {project.transferStatus === 'Ready for Transfer' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                          <i className="fas fa-rocket"></i> Ready
                        </span>
                      ) : project.transferStatus === 'Deployed' || project.transferStatus === 'In Use' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-bold border border-[#8B5CF6]/20">
                          <i className="fas fa-box-open"></i> {project.transferStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">{project.transferStatus}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-center relative">
                      <button 
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#0F3DDE] hover:bg-blue-50 transition-colors flex items-center justify-center"
                        onClick={() => setActionMenuOpen(actionMenuOpen === project.code ? null : project.code)}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      
                      {actionMenuOpen === project.code && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)}></div>
                          <div className="absolute right-8 top-10 w-48 bg-white border border-slate-200 shadow-lg rounded-xl z-20 py-1 text-left overflow-hidden animate-in fade-in zoom-in duration-100">
                            <button className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0F3DDE] flex items-center gap-2 font-medium">
                              <i className="fas fa-eye w-4"></i> View Project
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0F3DDE] flex items-center gap-2 font-medium">
                              <i className="fas fa-chart-line w-4"></i> Monitor Progress
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0F3DDE] flex items-center gap-2 font-medium">
                              <i className="fas fa-file-alt w-4"></i> Generate Report
                            </button>
                            <div className="h-px bg-slate-100 my-1"></div>
                            <button className="w-full px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 font-medium">
                              <i className="fas fa-user-edit w-4"></i> Assign Adviser
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                              <i className="fas fa-archive w-4"></i> Archive Project
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
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-[#081B4B] text-base">Top Performing Adviser</h3>
            <button className="text-sm font-bold text-[#0F3DDE] hover:text-[#081B4B]">View All</button>
          </div>
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0F3DDE] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-3xl shadow-lg mb-4 ring-4 ring-blue-50">
              {topAdviser.name.split(' ').map((name) => name[0]).join('')}
            </div>
            <h4 className="text-xl font-extrabold text-slate-800 mb-1">{topAdviser.name}</h4>
            <p className="text-sm text-slate-500 font-medium mb-6">Overall Score: <span className="font-bold text-[#0F3DDE] text-lg">{topAdviser.overallScore}%</span></p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <i className="fas fa-project-diagram text-[#0F3DDE] text-xl mb-2"></i>
                <span className="block text-2xl font-extrabold text-slate-800">{topAdviser.projectsSupervised}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projects</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <i className="fas fa-rocket text-[#8B5CF6] text-xl mb-2"></i>
                <span className="block text-2xl font-extrabold text-slate-800">{topAdviser.techTransferCount}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transfers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg">
                  <i className="fas fa-certificate"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Accreditation Readiness</h3>
                  <p className="text-xs text-slate-500 font-medium">Cycle: AY 2025-2026</p>
                </div>
              </div>
              <span className="text-xl font-extrabold text-[#081B4B]">{itAnalytics.evidenceReadiness}%</span>
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
              <button className="py-2 px-4 bg-white border border-amber-200 text-amber-700 font-bold text-sm rounded-lg hover:bg-amber-50 transition-colors">
                <i className="fas fa-bell"></i>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col flex-grow">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-extrabold text-[#081B4B] text-sm">Recent Activity</h3>
            </div>
            <div className="p-4 flex-grow overflow-hidden relative">
              <div className="absolute left-6 top-6 bottom-4 w-px bg-slate-100"></div>
              
              <div className="relative pl-10 mb-4">
                <div className="absolute left-0 w-5 h-5 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[8px] text-[#0F3DDE] shadow-sm">
                  <i className="fas fa-check"></i>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">Project Proposal Approved</p>
                <p className="text-xs text-slate-500">"AI-Powered Learning System" approved by Dr. Cruz.</p>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">2 HOURS AGO</span>
              </div>
              
              <div className="relative pl-10 mb-4">
                <div className="absolute left-0 w-5 h-5 rounded-full bg-purple-50 border-2 border-white flex items-center justify-center text-[8px] text-[#8B5CF6] shadow-sm">
                  <i className="fas fa-file-upload"></i>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">Evidence Uploaded</p>
                <p className="text-xs text-slate-500">Chapter 3 documentation mapped to IT-2026-04.</p>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">5 HOURS AGO</span>
              </div>
              
              <div className="relative pl-10">
                <div className="absolute left-0 w-5 h-5 rounded-full bg-amber-50 border-2 border-white flex items-center justify-center text-[8px] text-amber-500 shadow-sm">
                  <i className="fas fa-exclamation"></i>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">Milestone Alert</p>
                <p className="text-xs text-slate-500">"IoT Campus Monitoring" marked as behind schedule.</p>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">1 DAY AGO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProgramHeadModal open={exportOpen} title="Export Department Report" onClose={() => setExportOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="ph-dashboard-report">Report Type</label>
            <select className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#0F3DDE] outline-none" id="ph-dashboard-report" defaultValue="Department dashboard summary">
              <option>Department dashboard summary</option>
              <option>IT project inventory</option>
              <option>Accreditation readiness overview</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="ph-dashboard-format">Format</label>
            <select className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#0F3DDE] outline-none" id="ph-dashboard-format" defaultValue="PDF Document">
              <option>PDF Document</option>
              <option>Excel Spreadsheet</option>
              <option>CSV Data</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Include Sections</label>
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
