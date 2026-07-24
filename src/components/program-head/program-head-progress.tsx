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
  const [riskFilter, setRiskFilter] = useState('All');
  const [adviserFilter, setAdviserFilter] = useState('All Advisers');
  const [selectedCode, setSelectedCode] = useState('');

  const departmentProjects = useMemo(() => {
    return PROGRAM_HEAD_PROJECTS.filter((project) => project.department === 'IT');
  }, []);

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
      tone: analytics.behindScheduleProjects > 0 ? 'ring-red-200 text-red-700 bg-red-50' : 'ring-emerald-200 text-emerald-700 bg-emerald-50'
    },
    {
      label: 'Transfer Ready',
      value: analytics.transferReadyCount,
      note: `${analytics.transferImplementedCount} already deployed or in use`,
      icon: 'fa-exchange-alt',
      tone: 'ring-violet-200 text-violet-700 bg-violet-50'
    },
    {
      label: 'Evidence Readiness',
      value: `${analytics.evidenceReadiness}%`,
      note: `${analytics.evidenceTotal} files attached`,
      icon: 'fa-folder-open',
      tone: 'ring-blue-200 text-blue-700 bg-blue-50'
    },
    {
      label: 'Students Covered',
      value: analytics.studentCount,
      note: 'Unique students in scope',
      icon: 'fa-user-graduate',
      tone: 'ring-slate-200 text-slate-700 bg-slate-50'
    }
  ];

  return (
    <ProgramHeadShell activeNav="progress" title="Progress Monitoring" description="Track project milestones and identify at-risk projects" notificationCount={3}>
      <div className="bg-[var(--surface)] backdrop-blur-xl rounded-[2.5rem] px-8 md:px-10 py-8 md:py-10 mb-8 shadow-[0_16px_36px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.7)] border border-[var(--border)] relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-10">
           <div className="flex-1 max-w-2xl flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Progress Monitoring</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#003A8F] tracking-tight mb-2 flex items-center gap-2">
                Portfolio Risk & Milestones
              </h1>
              <p className="text-sm text-[var(--muted)] font-medium max-w-2xl mt-0.5">
                Track project milestones, identify at-risk projects, and plan intervention strategies across the selected scope.
              </p>
           </div>

           <div className="xl:w-[480px] shrink-0 grid grid-cols-2 gap-4">
             {trackingTiles.map((tile) => (
                <div key={tile.label} className={`group bg-[var(--surface)] backdrop-blur-md ring-1 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${tile.tone.split(' ')[0]} ${tile.tone.split(' ')[1]}`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-20 ${tile.tone.split(' ')[2]}`}></div>
                  <div className="flex items-start justify-between gap-2 relative z-10 mb-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">{tile.label}</span>
                    <i className={`fas ${tile.icon} text-lg opacity-80`} />
                  </div>
                  <strong className="block text-2xl font-extrabold text-[var(--text)] relative z-10">{tile.value}</strong>
                  <p className="m-0 text-[10px] font-bold opacity-70 relative z-10 mt-1 line-clamp-1">{tile.note}</p>
                </div>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Projects in Scope" value={analytics.totalProjects} note={`${visibleAnalytics.totalProjects} shown after risk filter`} icon="fas fa-layer-group" />
        <ProgramHeadStatCard title="Portfolio Health" value={`${analytics.healthScore}%`} note={`${analytics.averageProgress}% average progress`} icon="fas fa-tachometer-alt">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1 ring-1 ring-inset ring-[var(--border)]">
            <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-blue-500 rounded-full transition-all duration-1000" style={{ width: `${analytics.healthScore}%` }} />
          </div>
        </ProgramHeadStatCard>
        <ProgramHeadStatCard title="Risk Exposure" value={`${analytics.riskExposureRate}%`} note={`${analytics.riskExposureCount} projects need action`} icon="fas fa-exclamation-circle" />
        <ProgramHeadStatCard title="Milestone Completion" value={`${analytics.stageTracking[analytics.stageTracking.length - 1]?.pct ?? 0}%`} note="Defense-ready progress" icon="fas fa-flag-checkered" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="px-6 py-5 border-b border-[var(--border)] relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Analytics</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Stage Completion
              </h3>
            </div>
          </div>
          <div className="p-6 h-72 min-w-0 relative z-10">
            <ChartResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.stageTracking} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 700, fill: 'var(--text)' }} width={80} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--surface-alt)' }} formatter={(value) => [`${value ?? 0}%`, 'Completion']} />
                <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={20}>
                  {analytics.stageTracking.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ChartResponsiveContainer>
          </div>
        </div>

        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="px-6 py-5 border-b border-[var(--border)] relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Actionable</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Intervention Route
              </h3>
            </div>
          </div>
          <div className="p-6 relative z-10 flex-1 flex flex-col">
            <div className="flex-1 space-y-3">
            {analytics.interventionQueue.length === 0 ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 text-center shadow-sm h-full flex flex-col justify-center">
                <i className="fas fa-check-circle text-2xl text-emerald-500 mb-3 block"></i>
                <h4 className="text-emerald-700 font-bold mb-1">All Clear</h4>
                <p className="text-xs text-emerald-600/80">No intervention items in this scope.</p>
              </div>
            ) : (
              analytics.interventionQueue.slice(0, 3).map((item) => (
                <button
                  key={item.project.code}
                  type="button"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/20"
                  onClick={() => setSelectedCode(item.project.code)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-sm font-extrabold text-[var(--text)]">{item.project.title}</p>
                      <p className="m-0 mt-1 text-xs font-semibold text-[var(--muted)]">{item.project.department} - {item.project.adviser}</p>
                    </div>
                    <ProgramHeadStatusBadge tone={getStatusTone(item.project.riskLevel)}>{item.priority}</ProgramHeadStatusBadge>
                  </div>
                  <p className="m-0 mt-3 text-sm text-[var(--text)] line-clamp-1">{item.action}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] px-3 py-1.5 text-[11px] font-bold text-[var(--muted)] shadow-sm">
                    <i className="fas fa-clock text-[10px] text-[#0F3DDE]" /> {item.dueLabel}
                  </span>
                </button>
              ))
            )}
            </div>
            {riskQueue.length > 0 && (
              <button className="w-full py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold shadow-sm hover:bg-red-100 hover:-translate-y-0.5 transition-all mt-4 flex items-center justify-center gap-2 shrink-0">
                <i className="fas fa-calendar-alt"></i> Schedule Department Meeting
              </button>
            )}
          </div>
        </div>

        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="px-6 py-5 border-b border-[var(--border)] relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Operational</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Milestone Achievement
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-5 relative z-10 flex-1 flex flex-col justify-center">
            {analytics.milestoneTracking.map((milestone) => (
              <div key={milestone.label}>
                <div className="flex justify-between text-sm mb-1.5 gap-3">
                  <span className="font-bold text-[var(--text)]">{milestone.label}</span>
                  <span className="font-extrabold text-[#003A8F] whitespace-nowrap">{milestone.done}/{milestone.total} <span className="text-[var(--muted)] font-medium">({milestone.pct}%)</span></span>
                </div>
                <div className="w-full h-2.5 bg-[var(--surface-alt)] rounded-full overflow-hidden ring-1 ring-inset ring-[var(--border)]">
                  <div className={`h-full rounded-full transition-all duration-1000 ${milestone.pct >= 80 ? 'bg-emerald-500' : milestone.pct >= 50 ? 'bg-[#003A8F]' : 'bg-amber-500'}`} style={{ width: `${milestone.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="group bg-[var(--surface)] backdrop-blur-xl ring-1 ring-[var(--border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="px-6 py-5 border-b border-[var(--border)] relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-meta)] uppercase tracking-widest">Distribution</span>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                 Risk Mix
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-4 relative z-10 flex-1 flex flex-col justify-center">
            {analytics.riskDistribution.map((risk) => (
              <div key={risk.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-[var(--text)]">{risk.name}</span>
                  <span className="font-extrabold text-[var(--text)]">{risk.value} <span className="text-[var(--muted)] font-medium">({risk.pct}%)</span></span>
                </div>
                <div className="w-full h-2.5 bg-[var(--surface-alt)] rounded-full overflow-hidden ring-1 ring-inset ring-[var(--border)]">
                  <div className="h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${risk.pct}%`, backgroundColor: risk.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 w-full">
        <div className="bg-[var(--surface)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[var(--border)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border)] flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[var(--surface-alt)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F3DDE]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="relative z-10 shrink-0">
              <h3 className="font-bold text-[var(--text)] text-xl tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F3DDE]/10 to-[#0F3DDE]/5 text-[#0F3DDE] flex items-center justify-center text-sm shadow-sm ring-1 ring-[#0F3DDE]/20">
                  <i className="fas fa-tasks"></i>
                </div> 
                Project Progress Status
              </h3>
              <p className="text-sm text-[var(--muted)] font-medium mt-2 pl-[52px]">Detailed milestone progress for <strong className="text-[var(--text)]">{progressRows.length}</strong> monitored projects.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 relative z-10 w-full xl:w-auto">
              <div className="flex-1 xl:flex-initial min-w-[140px] group">
                <div className="relative">
                  <i className="fas fa-shield-alt absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[#0F3DDE] transition-colors"></i>
                  <select 
                    className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)] text-xs font-bold text-[var(--text)] outline-none cursor-pointer hover:bg-slate-50 hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] transition-all appearance-none shadow-sm" 
                    value={riskFilter} 
                    onChange={(event) => setRiskFilter(event.target.value)}
                  >
                    <option value="All">All Risk Levels</option>
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Behind Schedule">Behind Schedule</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
                </div>
              </div>
              
              <div className="flex-1 xl:flex-initial min-w-[140px] group">
                <div className="relative">
                  <i className="fas fa-user-tie absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[#0F3DDE] transition-colors"></i>
                  <select 
                    className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)] text-xs font-bold text-[var(--text)] outline-none cursor-pointer hover:bg-slate-50 hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] transition-all appearance-none shadow-sm" 
                    value={adviserFilter} 
                    onChange={(event) => setAdviserFilter(event.target.value)}
                  >
                    <option>All Advisers</option>
                    {adviserOptions.map((adviser) => (
                      <option key={adviser}>{adviser}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] pointer-events-none"></i>
                </div>
              </div>
              
              <button 
                onClick={() => setRiskReportOpen(true)} 
                className="group relative overflow-hidden h-10 px-5 bg-[#0F3DDE] text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                <i className="fas fa-file-pdf group-hover:scale-110 transition-transform"></i> Risk Report
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead className="bg-[var(--surface-alt)] text-[var(--muted)] text-[10px] uppercase tracking-[0.15em] font-extrabold">
                <tr>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Project</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Dept</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Adviser</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Stage</th>
                  <th className="px-6 py-5 border-b border-[var(--border)] w-44">Progress</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Risk</th>
                  <th className="px-6 py-5 border-b border-[var(--border)]">Next Action</th>
                  <th className="px-6 py-5 border-b border-[var(--border)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {progressRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center">
                      <div className="w-20 h-20 bg-[var(--surface-alt)] rounded-3xl flex items-center justify-center mx-auto mb-5 ring-1 ring-[var(--border)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <i className="fas fa-search text-3xl text-[var(--muted)] opacity-50"></i>
                      </div>
                      <p className="font-extrabold text-[var(--text)] text-lg m-0">No projects found</p>
                      <p className="text-[var(--muted)] font-medium text-sm mt-2">Try adjusting your department or risk filters.</p>
                    </td>
                  </tr>
                ) : progressRows.map((project) => (
                  <tr key={project.code} className="group transition-all duration-200 hover:bg-[var(--surface-alt)]">
                    <td className="px-6 py-5 align-top">
                      <p className="font-bold text-[var(--text)] m-0 text-sm group-hover:text-[#0F3DDE] transition-colors line-clamp-2 leading-snug">{project.title}</p>
                      <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mt-2 inline-block">{project.code}</span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--surface-alt)] text-[var(--text)] text-[11px] font-bold border border-[var(--border)] shadow-sm">{project.department}</span>
                    </td>
                    <td className="px-6 py-5 align-top text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F3DDE]/10 to-[#0F3DDE]/5 text-[#0F3DDE] flex items-center justify-center text-[10px] font-extrabold shadow-sm ring-1 ring-[var(--border)] shrink-0">
                          {project.adviser.split(' ').map((name) => name[0]).join('')}
                        </div>
                        <span className="font-bold text-[var(--text)] whitespace-nowrap">{project.adviser}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="text-sm font-medium text-[var(--text)]">{project.currentStage}</span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[var(--surface-alt)] rounded-full overflow-hidden shadow-inner ring-1 ring-inset ring-[var(--border)]">
                          <div className={`h-full rounded-full transition-all duration-1000 ${project.riskLevel === 'On Track' ? 'bg-emerald-500' : project.riskLevel === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs font-extrabold text-[var(--text)]">{project.progress}%</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mt-2">UPDATED: {project.lastUpdate}</span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm ${
                        project.riskLevel === 'On Track' ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20' :
                        project.riskLevel === 'At Risk' ? 'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20' :
                        'bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          project.riskLevel === 'On Track' ? 'bg-emerald-500' : project.riskLevel === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>
                        {project.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top max-w-[260px]">
                      <p className="m-0 text-[11px] font-extrabold uppercase tracking-wider text-[#0F3DDE]">{getProgramHeadPriority(project)}</p>
                      <p className="m-0 mt-1 text-xs font-medium leading-relaxed text-[var(--muted)] line-clamp-2">{getProgramHeadRecommendedAction(project)}</p>
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      <button
                        onClick={() => setSelectedCode(project.code)}
                        className={`opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 h-9 px-4 rounded-xl text-xs font-bold hover:-translate-y-0.5 shadow-sm flex items-center gap-2 ml-auto ${
                          project.riskLevel === 'On Track' ? 'bg-[#0F3DDE]/10 text-[#0F3DDE] hover:bg-[#0F3DDE] hover:text-white ring-1 ring-[#0F3DDE]/20' :
                          project.riskLevel === 'At Risk' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                          'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <i className={`fas ${project.riskLevel === 'On Track' ? 'fa-eye' : project.riskLevel === 'At Risk' ? 'fa-hand-paper' : 'fa-exclamation-circle'}`}></i>
                        {project.riskLevel === 'On Track' ? 'View' : project.riskLevel === 'At Risk' ? 'Intervene' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProgramHeadDrawer maxWidth={640} open={Boolean(selectedProject)} title="Project Progress Details" onClose={() => setSelectedCode('')}>
        {selectedProject ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-white shadow-lg ${
                selectedProject.riskLevel === 'On Track' ? 'bg-emerald-500' : selectedProject.riskLevel === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'
              }`}><i className="fas fa-project-diagram"></i></div>
              <div>
                <h3 className="m-0 text-xl font-bold text-[var(--text)]">{selectedProject.title}</h3>
                <code className="text-sm font-mono text-[#0F3DDE] bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-blue-100">{selectedProject.code}</code>
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
                <div key={label} className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] shadow-sm">
                  <span className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-widest mb-1">{label}</span>
                  <span className="text-sm font-bold text-[var(--text)]">{value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-widest">Progress</span>
                <span className="text-lg font-extrabold text-[#0F3DDE]">{selectedProject.progress}%</span>
              </div>
              <div className="w-full h-3 bg-[var(--surface)] rounded-full overflow-hidden ring-1 ring-inset ring-[var(--border)]">
                <div className="h-full bg-gradient-to-r from-[#0F3DDE] to-blue-400 rounded-full" style={{ width: `${selectedProject.progress}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0F3DDE]">Recommended Action</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-blue-100 px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm">
                  <i className="fas fa-clock text-[10px] text-blue-500" /> {getProgramHeadDueLabel(selectedProject)}
                </span>
              </div>
              <p className="m-0 mt-3 text-sm font-semibold leading-relaxed text-[var(--text)]">{getProgramHeadRecommendedAction(selectedProject)}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-3 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text)] rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm" onClick={() => setSelectedCode('')}>Close</button>
              <button className="flex-1 py-3 bg-[#0F3DDE] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#0c31b3] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-file-pdf"></i> Generate Report
              </button>
            </div>
          </div>
        ) : null}
      </ProgramHeadDrawer>

      <ProgramHeadModal open={riskReportOpen} title="Generate Risk Assessment Report" onClose={() => setRiskReportOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text)] mb-1.5" htmlFor="ph-risk-level">Risk Level</label>
            <select className="w-full h-11 px-4 bg-slate-50 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text)] focus:ring-2 focus:ring-[#0F3DDE] outline-none" id="ph-risk-level" defaultValue={riskFilter === 'All' ? 'All Risk Levels' : riskFilter}>
              <option>All Risk Levels</option><option>On Track</option><option>At Risk</option><option>Behind Schedule</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)] mb-2">Include Recommendations</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer"><input defaultChecked type="checkbox" className="w-4 h-4 text-[#0F3DDE] rounded border-slate-300 focus:ring-[#0F3DDE]" /> <span className="text-sm text-slate-600">Include intervention recommendations</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input defaultChecked type="checkbox" className="w-4 h-4 text-[#0F3DDE] rounded border-slate-300 focus:ring-[#0F3DDE]" /> <span className="text-sm text-slate-600">Include adviser load summary</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input defaultChecked type="checkbox" className="w-4 h-4 text-[#0F3DDE] rounded border-slate-300 focus:ring-[#0F3DDE]" /> <span className="text-sm text-slate-600">Include milestone tracking table</span></label>
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-3 justify-end">
          <button onClick={() => setRiskReportOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={() => setRiskReportOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#0F3DDE] hover:bg-[#0c31b3] shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5">Generate Report</button>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
