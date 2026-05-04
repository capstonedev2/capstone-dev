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

const CATEGORY_CHART = [
  { name: 'AI/ML Projects', value: 12, color: '#003a8f' },
  { name: 'IoT Systems', value: 8, color: '#16a34a' },
  { name: 'Web Applications', value: 14, color: '#7c3aed' },
  { name: 'Mobile Apps', value: 8, color: '#f59e0b' }
];

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

  const activeCount = PROGRAM_HEAD_PROJECTS.filter(p => p.status === 'Active').length;
  const completedCount = PROGRAM_HEAD_PROJECTS.filter(p => p.status === 'Completed').length;
  const transferReady = PROGRAM_HEAD_PROJECTS.filter(p => p.transferStatus === 'Ready for Transfer').length;

  return (
    <ProgramHeadShell
      activeNav="projects"
      title="Project Overview"
      description="IT Department - complete project portfolio"
      notificationCount={3}
    >
      {/* Premium Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Academic Year</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#003a8f]/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors" defaultValue="AY 2023-2024">
              <option>AY 2023-2024</option>
              <option>AY 2022-2023</option>
              <option>AY 2021-2022</option>
              <option>All Years</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Status</label>
            <select
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#003a8f]/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Adviser</label>
            <select
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#003a8f]/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              value={adviserFilter}
              onChange={(e) => setAdviserFilter(e.target.value)}
            >
              <option value="All Advisers">All Advisers</option>
              {advisers.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[220px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Search</label>
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border-none text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#003a8f]/20 outline-none placeholder:text-slate-400 hover:bg-slate-100 transition-colors"
                placeholder="Search projects, codes, advisers..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              className="h-11 px-4 rounded-xl bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2"
              type="button"
              onClick={() => { setStatusFilter('All Statuses'); setAdviserFilter('All Advisers'); setSearchQuery(''); }}
            >
              <i className="fas fa-undo text-xs"></i> Reset
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="h-11 px-6 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 hover:bg-[#002c6b] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <i className="fas fa-download"></i> Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Total Projects (IT)" value={PROGRAM_HEAD_PROJECTS.length} note={`${filteredProjects.length} shown`} icon="fas fa-folder-open" />
        <ProgramHeadStatCard title="Active Projects" value={activeCount} note={`${Math.round((activeCount / PROGRAM_HEAD_PROJECTS.length) * 100)}% of total`} icon="fas fa-bolt" />
        <ProgramHeadStatCard title="Completed" value={completedCount} note={`${Math.round((completedCount / PROGRAM_HEAD_PROJECTS.length) * 100)}% completion rate`} icon="fas fa-check-double" />
        <ProgramHeadStatCard title="Tech Transfer Ready" value={transferReady} note="Available for adoption" icon="fas fa-rocket" />
      </div>

      {/* Category Distribution with Donut Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
              <i className="fas fa-chart-pie text-[#003a8f]"></i> Project Distribution by Category
            </h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Breakdown of all IT department projects.</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full min-w-0 md:w-1/2 h-64">
              <ChartResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_CHART}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {CATEGORY_CHART.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '13px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ChartResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              {CATEGORY_CHART.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-white group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                    <strong className="text-slate-700 text-sm">{item.name}</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-xl" style={{ color: item.color }}>{item.value}</span>
                    <span className="text-xs text-slate-400 font-medium">projects</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
              <i className="fas fa-list-alt text-[#003a8f]"></i> IT Department Projects — Detailed View
            </h3>
            <p className="text-sm text-slate-500 m-0 mt-1">{filteredProjects.length} projects match the current filters.</p>
          </div>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#003a8f] text-xs font-bold ring-1 ring-[#003a8f]/10">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Code</th>
                <th className="px-6 py-4 border-b border-slate-100">Project Title</th>
                <th className="px-6 py-4 border-b border-slate-100">Adviser</th>
                <th className="px-6 py-4 border-b border-slate-100">Students</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 w-40">Progress</th>
                <th className="px-6 py-4 border-b border-slate-100">Start</th>
                <th className="px-6 py-4 border-b border-slate-100">Transfer</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <i className="fas fa-search text-4xl text-slate-200 mb-3 block"></i>
                    <p className="text-slate-500 font-medium m-0">No projects found matching the selected filters.</p>
                    <button
                      className="mt-4 px-4 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
                      onClick={() => { setStatusFilter('All Statuses'); setAdviserFilter('All Advisers'); setSearchQuery(''); }}
                    >
                      <i className="fas fa-undo text-xs mr-1.5"></i> Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.code} className="group transition-all duration-200 hover:bg-blue-50/30 cursor-pointer" onClick={() => setSelectedCode(project.code)}>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono font-bold text-[#003a8f] bg-blue-50 px-2 py-1 rounded-md">{project.code}</code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 m-0 text-sm group-hover:text-[#003a8f] transition-colors">{project.title}</p>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">{project.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                          {project.adviser.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-700">{project.adviser}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {project.students.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-500">
                            <i className="fas fa-user text-[9px]"></i>
                          </div>
                        ))}
                        {project.students.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-600">
                            +{project.students.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ProgramHeadStatusBadge tone={getStatusTone(project.status)}>
                        {project.status}
                      </ProgramHeadStatusBadge>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{project.startLabel}</span>
                    </td>
                    <td className="px-6 py-4">
                      {project.transferStatus === 'Ready for Transfer' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                          <i className="fas fa-check-circle"></i> Ready
                        </span>
                      ) : project.transferStatus === 'Deployed' || project.transferStatus === 'In Use' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                          <i className="fas fa-external-link-alt"></i> {project.transferStatus}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">
                          <i className="fas fa-clock text-slate-400"></i> {project.transferStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 h-8 px-4 rounded-lg bg-[#003a8f] text-white text-xs font-bold hover:-translate-y-0.5 hover:shadow-md shadow-sm flex items-center gap-1.5 ml-auto"
                        onClick={() => setSelectedCode(project.code)}
                      >
                        <i className="fas fa-eye text-[10px]"></i> View
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
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-project-diagram"></i>
              </div>
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-800">{selectedProject.title}</h3>
                <code className="text-sm font-mono text-[#003a8f] bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">{selectedProject.code}</code>
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
                <span className="text-lg font-extrabold text-[#003a8f]">{selectedProject.progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#003a8f] to-blue-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${selectedProject.progress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2 m-0">Current Stage: {selectedProject.currentStage}</p>
            </div>

            {/* Students */}
            <div>
              <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Team Members</span>
              <div className="space-y-2">
                {selectedProject.students.map((student, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center text-xs font-bold shadow-sm">
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
              <button className="flex-1 py-3 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
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
