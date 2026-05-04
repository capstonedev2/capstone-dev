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

  const itProjects = useMemo(() => PROGRAM_HEAD_PROJECTS.filter((project) => project.department === 'IT'), []);
  const itAnalytics = useMemo(() => getProgramHeadAnalytics(itProjects), [itProjects]);

  const itAdvisers = useMemo(() => {
    const all = itProjects.map((project) => project.adviser);
    return Array.from(new Set(all)).sort();
  }, [itProjects]);

  const filteredProjects = useMemo(() => {
    let projects = itProjects;

    if (statusFilter !== 'All Status') {
      projects = projects.filter((project) => project.status === statusFilter);
    }

    if (adviserFilter !== 'All Advisers') {
      projects = projects.filter((project) => project.adviser === adviserFilter);
    }

    return projects;
  }, [itProjects, statusFilter, adviserFilter]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Tracked Projects (IT)" value={itAnalytics.totalProjects} note={`${itAnalytics.activeProjects} active groups`} icon="fas fa-folder-open" />
        <ProgramHeadStatCard title="Completion Rate" value={`${itAnalytics.completionRate}%`} note={`${itAnalytics.completedProjects} completed projects`} icon="fas fa-chart-line">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${itAnalytics.completionRate}%` }} />
          </div>
        </ProgramHeadStatCard>
        <ProgramHeadStatCard title="Intervention Queue" value={itAnalytics.interventionQueue.length} note={`${itAnalytics.behindScheduleProjects} urgent follow-ups`} icon="fas fa-tasks" />
        <ProgramHeadStatCard title="Evidence Readiness" value={`${itAnalytics.evidenceReadiness}%`} note={`${itAnalytics.evidenceTotal} evidence files tracked`} icon="fas fa-shield-alt" />
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <select className="flex-1 min-w-[200px] h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#003a8f]/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors" defaultValue="AY 2023-2024">
          <option>AY 2023-2024</option>
          <option>AY 2022-2023</option>
        </select>
        <select
          className="flex-1 min-w-[200px] h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#003a8f]/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="On Hold">On Hold</option>
        </select>
        <select
          className="flex-1 min-w-[200px] h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#003a8f]/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          value={adviserFilter}
          onChange={(event) => setAdviserFilter(event.target.value)}
        >
          <option value="All Advisers">All Advisers</option>
          {itAdvisers.map((adviser) => (
            <option key={adviser} value={adviser}>{adviser}</option>
          ))}
        </select>
        <button
          onClick={() => setExportOpen(true)}
          className="h-11 px-6 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 hover:bg-[#002c6b] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <i aria-hidden="true" className="fas fa-download" />
          Export Report
        </button>
      </div>

      <ProgramHeadCardSection
        title="Project Distribution by Status"
        description={`${filteredAnalytics.totalProjects} projects shown after current filters.`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Selected Scope</span>
                <strong className="mt-1 block text-sm font-extrabold text-slate-800">
                  {statusFilter === 'All Status' ? 'All IT Statuses' : statusFilter}
                </strong>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#003a8f] shadow-sm">
                <i className="fas fa-chart-pie" />
              </span>
            </div>

            <div className="relative mx-auto mt-3 h-52 max-w-[260px] min-w-0">
            {statusChartData.length > 0 ? (
              <ChartResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value, name) => [`${value} projects`, name]}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ChartResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
                No project data for selected filters.
              </div>
            )}
              {statusChartData.length > 0 ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="block text-3xl font-extrabold leading-none text-slate-800">{filteredAnalytics.totalProjects}</span>
                    <span className="mt-1 block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Projects</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
                <span className="block text-base font-extrabold text-[#003a8f]">{filteredAnalytics.activeProjects}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active</span>
              </div>
              <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
                <span className="block text-base font-extrabold text-emerald-600">{filteredAnalytics.completedProjects}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Done</span>
              </div>
              <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
                <span className="block text-base font-extrabold text-amber-600">{filteredAnalytics.pendingProjects}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAnalytics.statusDistribution.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                    <div>
                      <strong className="block text-sm font-extrabold text-slate-800">{item.name}</strong>
                      <span className="text-xs font-semibold text-slate-400">{item.pct}% of selected projects</span>
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold leading-none" style={{ color: item.color }}>{item.value}</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProgramHeadCardSection>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <ProgramHeadCardSection
          title="Risk & Intervention Queue"
          description="Priority items for chair review, adviser follow-up, or transfer endorsement."
        >
          <div className="space-y-3">
            {itAnalytics.interventionQueue.length === 0 ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                No intervention items are currently queued.
              </div>
            ) : (
              itAnalytics.interventionQueue.slice(0, 4).map((item) => (
                <div key={item.project.code} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-sm font-extrabold text-slate-800">{item.project.title}</p>
                      <p className="m-0 mt-1 text-xs font-semibold text-slate-500">{item.project.code} - {item.project.adviser}</p>
                    </div>
                    <ProgramHeadStatusBadge tone={getStatusTone(item.project.riskLevel)}>{item.priority}</ProgramHeadStatusBadge>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <p className="m-0 text-sm text-slate-600">{item.action}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                      <i className="fas fa-clock text-[10px]" /> {item.dueLabel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ProgramHeadCardSection>

        <ProgramHeadCardSection
          title="Adviser Load & Coverage"
          description="Shows workload pressure, risk load, and transfer-ready supervision."
        >
          <div className="space-y-3">
            {itAnalytics.adviserWorkload.map((load) => (
              <div key={load.adviser} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-xs font-bold text-white shadow-md">
                      {load.adviser.split(' ').map((name) => name[0]).join('')}
                    </div>
                    <div>
                      <p className="m-0 text-sm font-extrabold text-slate-800">{load.adviser}</p>
                      <span className="text-xs font-semibold text-slate-400">{load.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="block text-xl font-extrabold text-[#003a8f]">{load.avgProgress}%</strong>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg progress</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 px-2 py-2">
                    <span className="block text-base font-extrabold text-slate-800">{load.projects}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projects</span>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2 py-2">
                    <span className="block text-base font-extrabold text-amber-700">{load.riskLoad}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Risks</span>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2 py-2">
                    <span className="block text-base font-extrabold text-emerald-700">{load.transferReady}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Transfer</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ProgramHeadCardSection>
      </div>

      <ProgramHeadCardSection title="IT Department Projects" description="Filtered project list with risk, progress, and transfer tracking.">
        <div className="ph-table-wrap mt-2 overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
          <table className="ph-table w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Project Title</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Adviser</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Students</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Status</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Risk</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 w-48">Progress</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200">Tech Transfer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <i className="fas fa-search text-4xl text-slate-200 mb-3 block"></i>
                    <p className="text-slate-500 font-medium m-0">No projects found matching the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.code} className="hover:bg-blue-50/50 transition-colors duration-200 group cursor-pointer">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 m-0 group-hover:text-[#003a8f] transition-colors">{project.title}</p>
                      <span className="text-xs text-slate-500 font-mono mt-1 block">{project.code}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {project.adviser.split(' ').map((name) => name[0]).join('')}
                        </div>
                        {project.adviser}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex -space-x-2">
                        {project.students.slice(0, 3).map((_, index) => (
                          <div key={index} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-500">
                            <i className="fas fa-user text-[10px]"></i>
                          </div>
                        ))}
                        {project.students.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-600">
                            +{project.students.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ProgramHeadStatusBadge tone={getStatusTone(project.status)}>
                        {project.status}
                      </ProgramHeadStatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <ProgramHeadStatusBadge tone={getStatusTone(project.riskLevel)}>
                        {project.riskLevel}
                      </ProgramHeadStatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#003a8f] rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-8">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {project.transferStatus === 'Ready for Transfer' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                          <i aria-hidden="true" className="fas fa-check-circle" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">
                          <i aria-hidden="true" className="fas fa-clock text-slate-400" /> {project.transferStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ProgramHeadCardSection>

      <div className="ph-split-grid">
        <ProgramHeadCardSection title="Top Performing Adviser" className="group">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#003a8f] to-amber-400 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {topAdviser.name.split(' ').map((name) => name[0]).join('')}
            </div>
            <div>
              <p className="text-lg font-bold m-0 text-slate-800">{topAdviser.name}</p>
              <p className="text-sm text-slate-500 m-0">Overall Score: <span className="font-bold text-[#003a8f]">{topAdviser.overallScore}%</span></p>
            </div>
          </div>

          <div className="space-y-3 mt-4 border-t pt-4 border-slate-100">
            <div className="flex justify-between items-center text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg">
              <span className="flex items-center gap-2"><i className="fas fa-project-diagram text-slate-400"></i> Projects Supervised</span>
              <strong className="text-slate-800">{topAdviser.projectsSupervised}</strong>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg">
              <span className="flex items-center gap-2"><i className="fas fa-rocket text-slate-400"></i> Tech Transfer Count</span>
              <strong className="text-slate-800">{topAdviser.techTransferCount}</strong>
            </div>
          </div>

          <button className="mt-5 w-full py-2.5 text-sm font-bold text-[#003a8f] bg-blue-50 hover:bg-[#003a8f] hover:text-white rounded-lg transition-all duration-300 shadow-sm opacity-90 group-hover:opacity-100">
            View Full Portfolio <i className="fas fa-arrow-right ml-1 text-xs"></i>
          </button>
        </ProgramHeadCardSection>

        <ProgramHeadCardSection title="Accreditation Documents">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl shadow-sm border border-amber-100">
              <i className="fas fa-file-signature text-2xl"></i>
            </div>
            <div>
              <p className="font-bold text-slate-800 m-0 text-base">{itAnalytics.evidenceReadiness}% Evidence Readiness</p>
              <p className="text-sm text-slate-500 mt-1">{itAnalytics.evidenceTotal} files mapped to the current IT evidence cycle</p>
            </div>
          </div>

          <div className="mt-5 p-4 border border-amber-200 bg-amber-50/80 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <p className="text-sm font-bold text-amber-800 m-0 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-amber-500"></i> Pending Action Required
            </p>
            <p className="text-sm text-amber-700 mt-1.5 mb-4 leading-relaxed">
              Validate partner letters for {itAnalytics.transferPipelineCount} transfer pipeline projects.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setExportOpen(true)}
                className="flex-1 py-2 px-3 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <i className="fas fa-cloud-upload-alt mr-1.5"></i> Upload File
              </button>
              <button className="flex-1 py-2 px-3 bg-white border border-amber-300 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 hover:-translate-y-0.5 transition-all shadow-sm">
                <i className="fas fa-bell mr-1.5"></i> Send Reminder
              </button>
            </div>
          </div>
        </ProgramHeadCardSection>
      </div>

      <ProgramHeadModal open={exportOpen} title="Export Department Report" onClose={() => setExportOpen(false)}>
        <div className="ph-form-field">
          <label htmlFor="ph-dashboard-report">Report Type</label>
          <select className="ph-select" id="ph-dashboard-report" defaultValue="Department dashboard summary">
            <option>Department dashboard summary</option>
            <option>IT project inventory</option>
            <option>Accreditation readiness overview</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label htmlFor="ph-dashboard-format">Format</label>
          <select className="ph-select" id="ph-dashboard-format" defaultValue="PDF Document">
            <option>PDF Document</option>
            <option>Excel Spreadsheet</option>
            <option>CSV Data</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label>Include</label>
          <div className="ph-checkbox-list">
            <label><input defaultChecked type="checkbox" /> KPI summary</label>
            <label><input defaultChecked type="checkbox" /> Project status chart</label>
            <label><input defaultChecked type="checkbox" /> Adviser overview</label>
            <label><input defaultChecked type="checkbox" /> Risk intervention queue</label>
          </div>
        </div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setExportOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={() => setExportOpen(false)}>
            Generate
          </ProgramHeadButton>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
