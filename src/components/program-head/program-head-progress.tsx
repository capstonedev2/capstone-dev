'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { ChartResponsiveContainer } from '@/components/shared/chart-responsive-container';
import {
  PROGRAM_HEAD_DEPARTMENTS,
  PROGRAM_HEAD_PROJECTS,
  getProgramHeadAnalytics,
  getProgramHeadDueLabel,
  getProgramHeadPriority,
  getProgramHeadRecommendedAction,
  getStatusTone
} from '@/components/program-head/program-head-data';
import {
  ProgramHeadButton,
  ProgramHeadDrawer,
  ProgramHeadModal,
  ProgramHeadStatCard,
  ProgramHeadStatusBadge
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';

export function ProgramHeadProgress() {
  const [riskReportOpen, setRiskReportOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [riskFilter, setRiskFilter] = useState('All');
  const [adviserFilter, setAdviserFilter] = useState('All Advisers');
  const [selectedCode, setSelectedCode] = useState('');

  const departmentProjects = useMemo(() => {
    if (departmentFilter === 'All Departments') {
      return PROGRAM_HEAD_PROJECTS;
    }

    return PROGRAM_HEAD_PROJECTS.filter((project) => project.department === departmentFilter);
  }, [departmentFilter]);

  const adviserOptions = useMemo(() => {
    const advisers = departmentProjects.map((project) => project.adviser);
    return Array.from(new Set(advisers)).sort();
  }, [departmentProjects]);

  const scopedProjects = useMemo(() => {
    if (adviserFilter === 'All Advisers') {
      return departmentProjects;
    }

    return departmentProjects.filter((project) => project.adviser === adviserFilter);
  }, [departmentProjects, adviserFilter]);

  const progressRows = useMemo(() => {
    if (riskFilter === 'All') {
      return scopedProjects;
    }

    return scopedProjects.filter((project) => project.riskLevel === riskFilter);
  }, [riskFilter, scopedProjects]);

  const analytics = useMemo(() => getProgramHeadAnalytics(scopedProjects), [scopedProjects]);
  const visibleAnalytics = useMemo(() => getProgramHeadAnalytics(progressRows), [progressRows]);
  const riskQueue = analytics.interventionQueue.filter((item) => item.project.riskLevel !== 'On Track');
  const selectedProject = useMemo(() => PROGRAM_HEAD_PROJECTS.find((project) => project.code === selectedCode), [selectedCode]);

  const trackingTiles = [
    {
      label: 'Critical Reviews',
      value: analytics.behindScheduleProjects,
      note: '48-hour adviser escalation',
      icon: 'fa-exclamation-circle',
      tone: analytics.behindScheduleProjects > 0 ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'
    },
    {
      label: 'Transfer Ready',
      value: analytics.transferReadyCount,
      note: `${analytics.transferImplementedCount} already deployed or in use`,
      icon: 'fa-exchange-alt',
      tone: 'border-violet-100 bg-violet-50 text-violet-700'
    },
    {
      label: 'Evidence Readiness',
      value: `${analytics.evidenceReadiness}%`,
      note: `${analytics.evidenceTotal} files attached`,
      icon: 'fa-folder-open',
      tone: 'border-blue-100 bg-blue-50 text-blue-700'
    },
    {
      label: 'Students Covered',
      value: analytics.studentCount,
      note: 'Unique students in scope',
      icon: 'fa-user-graduate',
      tone: 'border-slate-100 bg-slate-50 text-slate-700'
    }
  ];

  return (
    <ProgramHeadShell activeNav="progress" title="Progress Monitoring" description="Track project milestones and identify at-risk projects" notificationCount={3}>
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 p-5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-amber-500/5 to-orange-400/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="flex flex-wrap items-end gap-5 relative z-10">
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Department</label>
            <div className="relative">
              <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select
                className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner"
                value={departmentFilter}
                onChange={(event) => {
                  setDepartmentFilter(event.target.value);
                  setAdviserFilter('All Advisers');
                }}
              >
                <option>All Departments</option>
                {PROGRAM_HEAD_DEPARTMENTS.map((department) => (
                  <option key={department.code} value={department.code}>{department.code}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Risk Level</label>
            <div className="relative">
              <i className="fas fa-shield-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select 
                className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" 
                value={riskFilter} 
                onChange={(event) => setRiskFilter(event.target.value)}
              >
                <option value="All">All Projects</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Behind Schedule">Behind Schedule</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Adviser</label>
            <div className="relative">
              <i className="fas fa-user-tie absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select 
                className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" 
                value={adviserFilter} 
                onChange={(event) => setAdviserFilter(event.target.value)}
              >
                <option>All Advisers</option>
                {adviserOptions.map((adviser) => (
                  <option key={adviser}>{adviser}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          
          <button 
            onClick={() => setRiskReportOpen(true)} 
            className="group relative overflow-hidden h-12 px-7 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl text-sm font-black shadow-[0_8px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_12px_25px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <i className="fas fa-exclamation-triangle group-hover:scale-110 transition-transform"></i> Risk Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Projects in Scope" value={analytics.totalProjects} note={`${visibleAnalytics.totalProjects} shown after risk filter`} icon="fas fa-layer-group" />
        <ProgramHeadStatCard title="Portfolio Health" value={`${analytics.healthScore}%`} note={`${analytics.averageProgress}% average progress`} icon="fas fa-tachometer-alt">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-[#003a8f] rounded-full transition-all duration-1000" style={{ width: `${analytics.healthScore}%` }} />
          </div>
        </ProgramHeadStatCard>
        <ProgramHeadStatCard title="Risk Exposure" value={`${analytics.riskExposureRate}%`} note={`${analytics.riskExposureCount} projects need action`} icon="fas fa-exclamation-circle" />
        <ProgramHeadStatCard title="Milestone Completion" value={`${analytics.stageTracking[analytics.stageTracking.length - 1]?.pct ?? 0}%`} note="Defense-ready progress" icon="fas fa-flag-checkered" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {trackingTiles.map((tile) => (
          <div key={tile.label} className={`rounded-2xl border p-4 shadow-sm ${tile.tone}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-widest opacity-70">{tile.label}</span>
                <strong className="mt-1 block text-2xl font-extrabold">{tile.value}</strong>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/75 shadow-sm">
                <i className={`fas ${tile.icon}`} />
              </div>
            </div>
            <p className="m-0 mt-3 text-xs font-semibold opacity-80">{tile.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-chart-bar text-[#003a8f]"></i> Stage Completion</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Completion by milestone threshold in the selected scope.</p>
          </div>
          <div className="p-6 h-72 min-w-0">
            <ChartResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.stageTracking} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} width={80} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`${value ?? 0}%`, 'Completion']} />
                <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={20}>
                  {analytics.stageTracking.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ChartResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-trophy text-amber-500"></i> Milestone Achievement</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Operational progress with counts behind every percentage.</p>
          </div>
          <div className="p-6 space-y-5">
            {analytics.milestoneTracking.map((milestone) => (
              <div key={milestone.label}>
                <div className="flex justify-between text-sm mb-1.5 gap-3">
                  <span className="font-bold text-slate-700">{milestone.label}</span>
                  <span className="font-extrabold text-[#003a8f] whitespace-nowrap">{milestone.done}/{milestone.total} <span className="text-slate-400 font-medium">({milestone.pct}%)</span></span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${milestone.pct >= 80 ? 'bg-green-500' : milestone.pct >= 50 ? 'bg-[#003a8f]' : 'bg-amber-500'}`} style={{ width: `${milestone.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-chart-pie text-[#003a8f]"></i> Risk Mix</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Risk count across the selected department and adviser.</p>
          </div>
          <div className="p-6 space-y-4">
            {analytics.riskDistribution.map((risk) => (
              <div key={risk.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-slate-700">{risk.name}</span>
                  <span className="font-extrabold text-slate-700">{risk.value} <span className="text-slate-400 font-medium">({risk.pct}%)</span></span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${risk.pct}%`, backgroundColor: risk.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-route text-[#003a8f]"></i> Intervention Route</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Next actions sorted by severity and lowest progress.</p>
          </div>
          <div className="p-6 space-y-3">
            {analytics.interventionQueue.length === 0 ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                No intervention items in this scope.
              </div>
            ) : (
              analytics.interventionQueue.slice(0, 4).map((item) => (
                <button
                  key={item.project.code}
                  type="button"
                  className="w-full rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                  onClick={() => setSelectedCode(item.project.code)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-sm font-extrabold text-slate-800">{item.project.title}</p>
                      <p className="m-0 mt-1 text-xs font-semibold text-slate-500">{item.project.department} - {item.project.adviser}</p>
                    </div>
                    <ProgramHeadStatusBadge tone={getStatusTone(item.project.riskLevel)}>{item.priority}</ProgramHeadStatusBadge>
                  </div>
                  <p className="m-0 mt-3 text-sm text-slate-600">{item.action}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                    <i className="fas fa-clock text-[10px]" /> {item.dueLabel}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-tasks text-[#003a8f]"></i> Project Progress Status</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">{progressRows.length} projects displayed.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Project</th>
                <th className="px-6 py-4 border-b border-slate-100">Dept</th>
                <th className="px-6 py-4 border-b border-slate-100">Adviser</th>
                <th className="px-6 py-4 border-b border-slate-100">Stage</th>
                <th className="px-6 py-4 border-b border-slate-100 w-40">Progress</th>
                <th className="px-6 py-4 border-b border-slate-100">Risk</th>
                <th className="px-6 py-4 border-b border-slate-100">Next Action</th>
                <th className="px-6 py-4 border-b border-slate-100">Updated</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {progressRows.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <i className="fas fa-search text-4xl text-slate-200 mb-3 block"></i>
                  <p className="text-slate-500 font-medium m-0">No projects match the selected filters.</p>
                </td></tr>
              ) : progressRows.map((project) => (
                <tr key={project.code} className="group transition-all duration-200 hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 m-0 text-sm group-hover:text-[#003a8f] transition-colors">{project.title}</p>
                    <code className="text-[11px] text-slate-400 font-mono">{project.code}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100">{project.department}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {project.adviser.split(' ').map((name) => name[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-700">{project.adviser}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600">{project.currentStage}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${project.riskLevel === 'On Track' ? 'bg-green-500' : project.riskLevel === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-8">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                      project.riskLevel === 'On Track' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      project.riskLevel === 'At Risk' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        project.riskLevel === 'On Track' ? 'bg-emerald-500' : project.riskLevel === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'
                      }`}></span>
                      {project.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[260px]">
                    <p className="m-0 text-xs font-extrabold uppercase tracking-wider text-[#003a8f]">{getProgramHeadPriority(project)}</p>
                    <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">{getProgramHeadRecommendedAction(project)}</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600">{project.lastUpdate}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedCode(project.code)}
                      className={`opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 h-8 px-4 rounded-lg text-xs font-bold hover:-translate-y-0.5 hover:shadow-md shadow-sm flex items-center gap-1.5 ml-auto ${
                        project.riskLevel === 'On Track' ? 'bg-[#003a8f] text-white' :
                        project.riskLevel === 'At Risk' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      }`}
                    >
                      <i className={`fas ${project.riskLevel === 'On Track' ? 'fa-eye' : project.riskLevel === 'At Risk' ? 'fa-hand-paper' : 'fa-exclamation-circle'} text-[10px]`}></i>
                      {project.riskLevel === 'On Track' ? 'View' : project.riskLevel === 'At Risk' ? 'Intervene' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {riskQueue.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
            <h3 className="text-lg font-bold text-red-800 m-0 flex items-center gap-2"><i className="fas fa-shield-alt text-red-500"></i> At-Risk Projects Summary</h3>
            <p className="text-sm text-red-600/70 m-0 mt-1">{riskQueue.length} projects require adviser or chair action.</p>
          </div>
          <div className="p-6 space-y-3">
            {riskQueue.map((item) => (
              <button
                key={item.project.code}
                type="button"
                onClick={() => setSelectedCode(item.project.code)}
                className="flex w-full flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-12 rounded-full ${item.project.riskLevel === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                  <div>
                    <strong className="text-sm text-slate-800">{item.project.title}</strong>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">{item.action}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      <i className="fas fa-clock text-[9px]" /> {item.dueLabel}
                    </span>
                  </div>
                </div>
                <ProgramHeadStatusBadge tone={getStatusTone(item.project.riskLevel)}>{item.project.riskLevel}</ProgramHeadStatusBadge>
              </button>
            ))}
            <button className="w-full py-3 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all mt-2 flex items-center justify-center gap-2">
              <i className="fas fa-calendar-alt"></i> Schedule Department Meeting
            </button>
          </div>
        </div>
      )}

      <ProgramHeadDrawer maxWidth={640} open={Boolean(selectedProject)} title="Project Progress Details" onClose={() => setSelectedCode('')}>
        {selectedProject ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-white shadow-lg ${
                selectedProject.riskLevel === 'On Track' ? 'bg-emerald-500' : selectedProject.riskLevel === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'
              }`}><i className="fas fa-project-diagram"></i></div>
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-800">{selectedProject.title}</h3>
                <code className="text-sm font-mono text-[#003a8f] bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">{selectedProject.code}</code>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Adviser', selectedProject.adviser],
                ['Department', selectedProject.department],
                ['Stage', selectedProject.currentStage],
                ['Risk Level', selectedProject.riskLevel],
                ['Transfer', selectedProject.transferStatus],
                ['Evidence Files', selectedProject.evidenceCount],
                ['Students', selectedProject.students.length],
                ['Last Update', selectedProject.lastUpdate]
              ].map(([label, value]) => (
                <div key={label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
                  <span className="text-sm font-bold text-slate-700">{value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-lg font-extrabold text-[#003a8f]">{selectedProject.progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#003a8f] to-blue-400 rounded-full" style={{ width: `${selectedProject.progress}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#003a8f]">Recommended Action</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
                  <i className="fas fa-clock text-[10px]" /> {getProgramHeadDueLabel(selectedProject)}
                </span>
              </div>
              <p className="m-0 mt-3 text-sm font-semibold leading-relaxed text-slate-700">{getProgramHeadRecommendedAction(selectedProject)}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all" onClick={() => setSelectedCode('')}>Close</button>
              <button className="flex-1 py-3 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-file-pdf"></i> Generate Report
              </button>
            </div>
          </div>
        ) : null}
      </ProgramHeadDrawer>

      <ProgramHeadModal open={riskReportOpen} title="Generate Risk Assessment Report" onClose={() => setRiskReportOpen(false)}>
        <div className="ph-form-field">
          <label htmlFor="ph-risk-department">Department</label>
          <select className="ph-select" id="ph-risk-department" defaultValue={departmentFilter}>
            <option>All Departments</option>
            {PROGRAM_HEAD_DEPARTMENTS.map((department) => (
              <option key={department.code} value={department.code}>{department.code}</option>
            ))}
          </select>
        </div>
        <div className="ph-form-field">
          <label htmlFor="ph-risk-level">Risk Level</label>
          <select className="ph-select" id="ph-risk-level" defaultValue={riskFilter === 'All' ? 'All Risk Levels' : riskFilter}>
            <option>All Risk Levels</option><option>On Track</option><option>At Risk</option><option>Behind Schedule</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label>Include Recommendations</label>
          <div className="ph-checkbox-list">
            <label><input defaultChecked type="checkbox" /> Include intervention recommendations</label>
            <label><input defaultChecked type="checkbox" /> Include adviser load summary</label>
            <label><input defaultChecked type="checkbox" /> Include milestone tracking table</label>
          </div>
        </div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setRiskReportOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={() => setRiskReportOpen(false)}>Generate Report</ProgramHeadButton>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
