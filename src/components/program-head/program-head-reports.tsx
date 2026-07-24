'use client';

import { useState } from 'react';
import {
  ProgramHeadButton,
  ProgramHeadModal,
  ProgramHeadStatCard
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';

const DEPT_DATA = [
  { name: 'IT', label: 'Information Technology', pct: 86, projects: 42, transfer: 8, trend: '+4.2%', color: '#003a8f' },
  { name: 'TCM', label: 'Technology Communication Management', pct: 82, projects: 19, transfer: 3, trend: '+2.8%', color: '#16a34a' },
  { name: 'NAME', label: 'Naval Architecture and Marine Engineering', pct: 79, projects: 32, transfer: 5, trend: '+2.1%', color: '#7c3aed' },
  { name: 'MET', label: 'Mechanical Engineering Technology', pct: 78, projects: 28, transfer: 4, trend: '+1.6%', color: '#f59e0b' },
  { name: 'ESM', label: 'Environmental and Safety Management', pct: 74, projects: 35, transfer: 2, trend: '+0.9%', color: '#ef4444' }
];

const PERFORMANCE_TARGET = 85;
const RANKED_DEPT_DATA = [...DEPT_DATA].sort((a, b) => b.pct - a.pct);
const TOP_DEPARTMENT = RANKED_DEPT_DATA[0];
const WATCHLIST_DEPARTMENT = RANKED_DEPT_DATA[RANKED_DEPT_DATA.length - 1];
const AVERAGE_DEPT_PERFORMANCE = Math.round(DEPT_DATA.reduce((sum, dept) => sum + dept.pct, 0) / DEPT_DATA.length);
const TOTAL_DEPT_PROJECTS = DEPT_DATA.reduce((sum, dept) => sum + dept.projects, 0);
const DEPARTMENTS_AT_TARGET = DEPT_DATA.filter((dept) => dept.pct >= PERFORMANCE_TARGET).length;

const STATS_TABLE = [
  { metric: 'Total Enrolled Students', y1: 0, y2: 0, y3: 0, change: '0%', up: false },
  { metric: 'Active Projects', y1: 112, y2: 134, y3: 156, change: '+16.4%', up: true },
  { metric: 'Completed Projects', y1: 78, y2: 95, y3: 124, change: '+30.5%', up: true },
  { metric: 'Technology Transfers', y1: 3, y2: 5, y3: 8, change: '+60%', up: true },
  { metric: 'Faculty Publications', y1: 12, y2: 18, y3: 24, change: '+33.3%', up: true }
];

const INSIGHTS = [
  { text: 'IT Department leads in project completion (86%).', icon: 'fa-trophy', color: '#f59e0b' },
  { text: 'Technology transfer increased by 60% this year.', icon: 'fa-rocket', color: '#16a34a' },
  { text: 'Student satisfaction data is pending.', icon: 'fa-star', color: '#7c3aed' },
  { text: '78% of graduates are employed within six months.', icon: 'fa-briefcase', color: '#003a8f' }
];

const RECOMMENDATIONS = [
  { text: 'Increase industry partnerships for the ESM department.', icon: 'fa-handshake' },
  { text: 'Develop a mentorship program for at-risk projects.', icon: 'fa-user-shield' },
  { text: 'Expand technology transfer initiatives across programs.', icon: 'fa-exchange-alt' },
  { text: 'Enhance faculty development in emerging technologies.', icon: 'fa-microchip' }
];

export function ProgramHeadReports() {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <ProgramHeadShell activeNav="reports" title="Reports & Analytics" description="Comprehensive program performance analysis" notificationCount={2}>
      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 p-5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#0F3DDE]/5 to-[#081B4B]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="flex flex-wrap items-end gap-5 relative z-10">
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Report Type</label>
            <div className="relative">
              <i className="fas fa-file-invoice absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" defaultValue="Annual">
                <option value="Annual">Annual Program Report</option><option>Department Performance</option><option>Student Success Metrics</option><option>Technology Transfer Analytics</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Period</label>
            <div className="relative">
              <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" defaultValue="AY 2023-2024">
                <option>AY 2023-2024</option><option>AY 2022-2023</option><option>AY 2021-2022</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          <button onClick={() => setReportOpen(true)} className="group relative overflow-hidden h-12 px-7 bg-gradient-to-r from-[#0F3DDE] to-[#081B4B] text-white rounded-xl text-sm font-bold shadow-[0_8px_20px_rgba(15,61,222,0.25)] hover:shadow-[0_12px_25px_rgba(15,61,222,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <i className="fas fa-chart-line group-hover:scale-110 transition-transform"></i> Generate Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Program Completion" value="86%" note="12% up from last year" icon="fas fa-chart-pie">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: '86%' }} />
          </div>
        </ProgramHeadStatCard>
        <ProgramHeadStatCard title="Student Retention" value="94%" note="Above university average" icon="fas fa-user-graduate" />
        <ProgramHeadStatCard title="Industry Placement" value="78%" note="Graduates employed" icon="fas fa-briefcase" />
        <ProgramHeadStatCard title="Research Output" value="24" note="Publications this year" icon="fas fa-book-open" />
      </div>

      {/* Department Performance */}
      <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-slate-100/80 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-[#081B4B] m-0 flex items-center gap-2"><i className="fas fa-chart-bar text-[#0F3DDE]/70"></i> Department Performance Comparison</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 mt-1">Completion rate, project load, and transfer output by department.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#0F3DDE]">
            <i className="fas fa-bullseye text-[11px]" /> Target {PERFORMANCE_TARGET}%
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 p-6 relative z-10">
          <div className="rounded-2xl bg-[#003a8f] p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-blue-100">Top Department</span>
                <h4 className="m-0 mt-2 text-2xl font-extrabold">{TOP_DEPARTMENT.name}</h4>
                <p className="m-0 mt-1 text-sm font-semibold text-blue-100">{TOP_DEPARTMENT.label}</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl">
                <i className="fas fa-trophy" />
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <span className="block text-5xl font-extrabold leading-none">{TOP_DEPARTMENT.pct}%</span>
                <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-blue-100">Completion</span>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#003a8f]">{TOP_DEPARTMENT.trend}</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/10 px-2 py-3">
                <span className="block text-lg font-extrabold">{TOP_DEPARTMENT.projects}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Projects</span>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-3">
                <span className="block text-lg font-extrabold">{TOP_DEPARTMENT.transfer}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Transfer</span>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-3">
                <span className="block text-lg font-extrabold">+{TOP_DEPARTMENT.pct - PERFORMANCE_TARGET}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Vs Target</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Average Completion</span>
                <strong className="mt-1 block text-2xl font-extrabold text-slate-800">{AVERAGE_DEPT_PERFORMANCE}%</strong>
                <p className="m-0 mt-2 text-xs font-semibold text-slate-500">{TOTAL_DEPT_PROJECTS} projects tracked</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-emerald-600">At Target</span>
                <strong className="mt-1 block text-2xl font-extrabold text-emerald-700">{DEPARTMENTS_AT_TARGET}/{DEPT_DATA.length}</strong>
                <p className="m-0 mt-2 text-xs font-semibold text-emerald-700">Departments at {PERFORMANCE_TARGET}%+</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-amber-600">Watchlist</span>
                <strong className="mt-1 block text-2xl font-extrabold text-amber-700">{WATCHLIST_DEPARTMENT.name}</strong>
                <p className="m-0 mt-2 text-xs font-semibold text-amber-700">{PERFORMANCE_TARGET - WATCHLIST_DEPARTMENT.pct} pts below target</p>
              </div>
            </div>

            <div className="space-y-3">
              {RANKED_DEPT_DATA.map((dept, index) => {
                const gap = dept.pct - PERFORMANCE_TARGET;
                const status = dept.pct >= PERFORMANCE_TARGET ? 'On target' : gap >= -5 ? 'Near target' : 'Needs support';
                const statusClass = dept.pct >= PERFORMANCE_TARGET
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : gap >= -5
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-red-50 text-red-700 border-red-100';

                return (
                  <div key={dept.name} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-sm" style={{ backgroundColor: dept.color }}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm font-extrabold text-slate-800">{dept.name}</strong>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${statusClass}`}>
                              {status}
                            </span>
                          </div>
                          <p className="m-0 mt-0.5 truncate text-xs font-semibold text-slate-400">{dept.label}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-extrabold leading-none" style={{ color: dept.color }}>{dept.pct}%</span>
                        <span className="text-[11px] font-bold text-slate-400">{dept.projects} projects</span>
                      </div>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${dept.pct}%`, backgroundColor: dept.color }} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1">
                        <i className="fas fa-arrow-up text-[10px] text-emerald-500" /> {dept.trend} annual change
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1">
                        <i className="fas fa-exchange-alt text-[10px] text-[#003a8f]" /> {dept.transfer} transfer outputs
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1">
                        <i className="fas fa-bullseye text-[10px] text-amber-500" /> {gap >= 0 ? '+' : ''}{gap} pts vs target
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Annual Stats Table */}
      <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="px-6 py-5 border-b border-slate-100/80 relative z-10">
          <h3 className="text-lg font-bold text-[#081B4B] m-0 flex items-center gap-2"><i className="fas fa-table text-[#0F3DDE]/70"></i> Annual Program Statistics</h3>
        </div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Metric</th>
                <th className="px-6 py-4 border-b border-slate-100">2021-2022</th>
                <th className="px-6 py-4 border-b border-slate-100">2022-2023</th>
                <th className="px-6 py-4 border-b border-slate-100">2023-2024</th>
                <th className="px-6 py-4 border-b border-slate-100">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {STATS_TABLE.map(row => (
                <tr key={row.metric} className="hover:bg-blue-50/30 transition-all">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.metric}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.y1.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.y2.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.y3.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                      <i className="fas fa-arrow-up text-[9px]"></i> {row.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="group bg-gradient-to-b from-amber-50/90 to-amber-50/50 backdrop-blur-xl ring-1 ring-amber-200/60 rounded-2xl shadow-[0_8px_30px_rgb(245,158,11,0.04)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="px-6 py-5 border-b border-amber-200/60 bg-amber-100/30 relative z-10">
            <h3 className="text-lg font-bold text-amber-900 m-0 flex items-center gap-2"><i className="fas fa-lightbulb text-amber-500"></i> Key Insights</h3>
          </div>
          <div className="p-6 space-y-3 relative z-10">
            {INSIGHTS.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/80 border border-amber-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group/item">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ring-1 ring-amber-200 group-hover/item:scale-110 transition-transform duration-300" style={{ backgroundColor: item.color }}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <span className="text-sm font-bold text-amber-900">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="group bg-gradient-to-b from-blue-50/90 to-blue-50/50 backdrop-blur-xl ring-1 ring-blue-200/60 rounded-2xl shadow-[0_8px_30px_rgb(15,61,222,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.08)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="px-6 py-5 border-b border-blue-200/60 bg-blue-100/30 relative z-10">
            <h3 className="text-lg font-bold text-[#081B4B] m-0 flex items-center gap-2"><i className="fas fa-clipboard-list text-[#0F3DDE]"></i> Recommendations</h3>
          </div>
          <div className="p-6 space-y-3 relative z-10">
            {RECOMMENDATIONS.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-3.5 rounded-xl bg-white/80 border border-blue-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group/item">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#0F3DDE] flex items-center justify-center mt-0.5 shadow-sm ring-1 ring-blue-200 group-hover/item:scale-110 transition-transform duration-300"><i className={`fas ${item.icon} text-sm`}></i></div>
                <span className="text-sm font-bold text-[#081B4B] pt-1">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ProgramHeadModal open={reportOpen} title="Generate Program Report" onClose={() => setReportOpen(false)}>
        <div className="ph-form-field"><label htmlFor="ph-report-title">Report Title</label><input className="ph-input" defaultValue="Annual Program Report 2023-2024" id="ph-report-title" /></div>
        <div className="ph-form-field"><label htmlFor="ph-report-format">Format</label>
          <select className="ph-select" id="ph-report-format" defaultValue="PDF Document"><option>PDF Document</option><option>PowerPoint Presentation</option><option>Excel Dashboard</option></select>
        </div>
        <div className="ph-form-field"><label>Sections to Include</label>
          <div className="ph-checkbox-list">
            <label><input defaultChecked type="checkbox" /> Executive summary</label>
            <label><input defaultChecked type="checkbox" /> Enrollment data</label>
            <label><input defaultChecked type="checkbox" /> Project performance</label>
            <label><input defaultChecked type="checkbox" /> Faculty metrics</label>
            <label><input defaultChecked type="checkbox" /> Technology transfer</label>
          </div>
        </div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setReportOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={() => setReportOpen(false)}>Generate</ProgramHeadButton>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
