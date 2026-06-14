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

const OVERSIGHT_CHECKLIST = [
  { label: 'Implemented location recorded', value: '7/8', pct: 87, icon: 'fa-map-marker-alt' },
  { label: 'Beneficiary organization tagged', value: '8/8', pct: 100, icon: 'fa-building' },
  { label: 'Adoption outside home program', value: '3/8', pct: 37, icon: 'fa-external-link-alt' },
  { label: 'Manuscript link present', value: '8/8', pct: 100, icon: 'fa-file-alt' }
];

const FOOTPRINT = [
  { label: '1 School', icon: 'fa-school', color: '#003a8f' },
  { label: '1 LGU Office', icon: 'fa-landmark', color: '#7c3aed' },
  { label: '2 SMEs', icon: 'fa-store', color: '#16a34a' },
  { label: '2 Community Sites', icon: 'fa-users', color: '#f59e0b' }
];

const EVIDENCE_ROWS = [
  { year: '2025-2026', project: 'AI-Powered Learning Management System', type: 'Presentation certificate, pilot photos', location: 'Regional Research Colloquium / Computer Lab', status: 'Verified', tone: 'approved' as const },
  { year: '2025-2026', project: 'Sustainable Agriculture IoT System', type: 'Deployment photos, utilization report', location: 'Lumbia community farm', status: 'Verified', tone: 'approved' as const },
  { year: '2024-2025', project: 'Marine Pollution Detection Drone', type: 'MOA, training attendance, impact report', location: 'Macajalar Bay', status: 'Archived', tone: 'in-use' as const }
];

const STAGE_CHART = [
  { name: 'Ready', value: 0, color: '#16a34a' },
  { name: 'Proposed', value: 0, color: '#f59e0b' },
  { name: 'Deployed', value: 0, color: '#003a8f' },
  { name: 'In Use', value: 0, color: '#7c3aed' }
];

export function ProgramHeadTransfer() {
  const [impactOpen, setImpactOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCode, setSelectedCode] = useState('');

  const transferProjects = useMemo(() => {
    let rows = PROGRAM_HEAD_PROJECTS.filter(p => ['Ready for Transfer', 'Proposed', 'Deployed', 'In Use'].includes(p.transferStatus));
    if (statusFilter !== 'All') rows = rows.filter(p => p.transferStatus === statusFilter);
    return rows;
  }, [statusFilter]);

  const selectedProject = useMemo(() => PROGRAM_HEAD_PROJECTS.find(p => p.code === selectedCode), [selectedCode]);

  // Build chart data dynamically
  const chartData = useMemo(() => {
    const all = PROGRAM_HEAD_PROJECTS.filter(p => ['Ready for Transfer', 'Proposed', 'Deployed', 'In Use'].includes(p.transferStatus));
    return STAGE_CHART.map(s => ({
      ...s,
      value: all.filter(p => (s.name === 'Ready' ? p.transferStatus === 'Ready for Transfer' : p.transferStatus === s.name)).length
    }));
  }, []);

  const readyCount = chartData.find(c => c.name === 'Ready')?.value || 0;
  const deployedCount = chartData.find(c => c.name === 'Deployed')?.value || 0;
  const inUseCount = chartData.find(c => c.name === 'In Use')?.value || 0;

  return (
    <ProgramHeadShell activeNav="transfer" title="Technology Transfer Summary" description="Track where studies were implemented, who benefited, and which outputs are ready for adoption." notificationCount={2}>
      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 p-5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#0F3DDE]/5 to-[#081B4B]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="flex flex-wrap items-end gap-5 relative z-10">
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Cluster</label>
            <div className="relative">
              <i className="fas fa-layer-group absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" defaultValue="BSIT Cluster A">
                <option>BSIT Cluster A</option><option>All Program Clusters</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Transfer Status</label>
            <div className="relative">
              <i className="fas fa-exchange-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Ready for Transfer">Ready for Transfer</option>
                <option value="Proposed">Proposed</option>
                <option value="Deployed">Deployed</option>
                <option value="In Use">In Use</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          <div className="flex-1 min-w-[160px] group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Beneficiary</label>
            <div className="relative">
              <i className="fas fa-hands-helping absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" defaultValue="All">
                <option value="All">All Types</option><option>School</option><option>LGU</option><option>SME</option><option>Community</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          <button onClick={() => setImpactOpen(true)} className="group relative overflow-hidden h-12 px-7 bg-gradient-to-r from-[#0F3DDE] to-[#081B4B] text-white rounded-xl text-sm font-black shadow-[0_8px_20px_rgba(15,61,222,0.25)] hover:shadow-[0_12px_25px_rgba(15,61,222,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <i className="fas fa-chart-line group-hover:scale-110 transition-transform"></i> Impact Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Transfer-Ready" value={readyCount} note="Tagged for partner matching" icon="fas fa-handshake" />
        <ProgramHeadStatCard title="Active Pilot Sites" value="5" note="Implementation evidence this AY" icon="fas fa-flask" />
        <ProgramHeadStatCard title="Deployed" value={deployedCount + inUseCount} note="Signed MOA or verified" icon="fas fa-satellite-dish" />
        <ProgramHeadStatCard title="Evidence Bundles" value="18" note="Accreditation and extension files" icon="fas fa-archive" />
      </div>

      {/* Pipeline Chart + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donut Chart */}
        <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-5 border-b border-slate-100/80 flex justify-between items-center relative z-10">
            <h3 className="font-black text-[#081B4B] text-base flex items-center gap-2">
              <i className="fas fa-chart-pie text-[#0F3DDE]/70"></i> Transfer Pipeline
            </h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Distribution</p>
          </div>
          <div className="p-6 flex flex-col items-center gap-6 relative z-10">
            <div className="w-full min-w-0 h-56 relative">
              <ChartResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={6} dataKey="value" stroke="none">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}40)` }} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }} itemStyle={{ fontWeight: '900', color: '#081B4B' }} />
                </PieChart>
              </ChartResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-white/20 rounded-full blur-[2px] scale-50 opacity-50"></div>
            </div>
            <div className="w-full grid grid-cols-2 gap-3">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 ring-1 ring-slate-100 group/item hover:bg-white hover:ring-slate-200 hover:shadow-sm transition-all duration-300">
                  <span className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-1 ring-white shadow-sm" style={{ backgroundColor: item.color }}></span>
                  <span className="text-xs font-bold text-slate-600 group-hover/item:text-[#081B4B] transition-colors">{item.name}</span>
                  <span className="ml-auto font-black text-base" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Oversight Checklist + Footprint */}
        <div className="space-y-6">
          <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="px-6 py-5 border-b border-slate-100/80 relative z-10">
              <h3 className="font-black text-[#081B4B] text-base flex items-center gap-2">
                <i className="fas fa-clipboard-check text-emerald-500/90"></i> Oversight Checklist
              </h3>
            </div>
            <div className="p-6 space-y-4 relative z-10">
              {OVERSIGHT_CHECKLIST.map(item => (
                <div key={item.label} className="flex items-center gap-4 group/list">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm ring-1 transition-transform duration-300 group-hover/list:scale-105 ${item.pct === 100 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 ring-emerald-200' : item.pct >= 75 ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-[#0F3DDE] ring-blue-200' : 'bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-600 ring-amber-200'}`}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-slate-700 group-hover/list:text-[#081B4B] transition-colors">{item.label}</span>
                      <span className="font-black text-[#081B4B]">{item.value}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 shadow-inner rounded-full overflow-hidden ring-1 ring-inset ring-slate-200/50">
                      <div className={`h-full rounded-full transition-all duration-1000 ${item.pct === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : item.pct >= 75 ? 'bg-gradient-to-r from-[#0F3DDE] to-blue-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="px-6 py-5 border-b border-slate-100/80 relative z-10">
              <h3 className="font-black text-[#081B4B] text-base flex items-center gap-2">
                <i className="fas fa-map-marked-alt text-[#0F3DDE]/90"></i> Implementation Footprint
              </h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 relative z-10">
              {FOOTPRINT.map(f => (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100/80 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#0F3DDE]/30 transition-all duration-300 group/card relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover/card:opacity-10 transition-opacity duration-300" style={{ backgroundImage: `radial-gradient(circle at top right, ${f.color}, transparent 70%)` }}></div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm relative z-10 group-hover/card:scale-105 transition-transform duration-300" style={{ backgroundColor: f.color }}>
                    <i className={`fas ${f.icon}`}></i>
                  </div>
                  <span className="text-sm font-bold text-[#081B4B] relative z-10">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-exchange-alt text-[#003a8f]"></i> Technology Transfer Pipeline</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">{transferProjects.length} projects in the pipeline.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Project</th>
                <th className="px-6 py-4 border-b border-slate-100">Cluster</th>
                <th className="px-6 py-4 border-b border-slate-100">Partner & Location</th>
                <th className="px-6 py-4 border-b border-slate-100">Stage</th>
                <th className="px-6 py-4 border-b border-slate-100">Beneficiaries</th>
                <th className="px-6 py-4 border-b border-slate-100">Evidence</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transferProjects.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <i className="fas fa-search text-4xl text-slate-200 mb-3 block"></i>
                  <p className="text-slate-500 font-medium m-0">No projects match the selected filter.</p>
                </td></tr>
              ) : transferProjects.map(project => (
                <tr key={project.code} className="group transition-all duration-200 hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 m-0 text-sm group-hover:text-[#003a8f] transition-colors">{project.title}</p>
                    <span className="text-[11px] text-slate-400">{project.department} · {project.typeLabel}</span>
                  </td>
                  <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-[#003a8f] text-xs font-bold border border-blue-100">{project.cluster}</span></td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700 block">{project.partner}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><i className="fas fa-map-marker-alt text-[9px]"></i> {project.partnerLocation}</span>
                  </td>
                  <td className="px-6 py-4"><ProgramHeadStatusBadge tone={getStatusTone(project.transferStatus)}>{project.transferStatus}</ProgramHeadStatusBadge></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600">{project.beneficiaries}</span></td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-xs font-bold border border-slate-100">
                      <i className="fas fa-paperclip text-[10px] text-slate-400"></i> {project.evidenceCount} files
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedCode(project.code)}
                      className={`opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 h-8 px-4 rounded-lg text-xs font-bold hover:-translate-y-0.5 hover:shadow-md shadow-sm flex items-center gap-1.5 ml-auto ${
                        project.transferStatus === 'Proposed' ? 'bg-amber-500 text-white' : 'bg-[#003a8f] text-white'
                      }`}
                    >
                      {project.transferStatus === 'Proposed' ? <><i className="fas fa-file-signature text-[10px]"></i> Finalize</> : <><i className="fas fa-eye text-[10px]"></i> Review</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-folder-open text-amber-500"></i> Evidence by Academic Year</h3>
          <p className="text-sm text-slate-500 m-0 mt-1">Proof of implementation, deployment, and partner feedback per year.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Year</th>
                <th className="px-6 py-4 border-b border-slate-100">Project</th>
                <th className="px-6 py-4 border-b border-slate-100">Evidence Type</th>
                <th className="px-6 py-4 border-b border-slate-100">Location / Event</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {EVIDENCE_ROWS.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-all">
                  <td className="px-6 py-4"><span className="text-sm font-bold text-[#003a8f]">{row.year}</span></td>
                  <td className="px-6 py-4"><span className="text-sm font-medium text-slate-700">{row.project}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600">{row.type}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600 flex items-center gap-1"><i className="fas fa-map-marker-alt text-[10px] text-slate-400"></i> {row.location}</span></td>
                  <td className="px-6 py-4"><ProgramHeadStatusBadge tone={row.tone}>{row.status}</ProgramHeadStatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Drawer */}
      <ProgramHeadDrawer maxWidth={600} open={Boolean(selectedProject)} title="Transfer Details" onClose={() => setSelectedCode('')}>
        {selectedProject ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center text-xl shadow-lg"><i className="fas fa-satellite-dish"></i></div>
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-800">{selectedProject.title}</h3>
                <code className="text-sm font-mono text-[#003a8f] bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">{selectedProject.code}</code>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['Partner', selectedProject.partner], ['Location', selectedProject.partnerLocation], ['Status', selectedProject.transferStatus], ['Beneficiaries', selectedProject.beneficiaries]].map(([l, v]) => (
                <div key={l} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{l}</span>
                  <span className="text-sm font-bold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all" onClick={() => setSelectedCode('')}>Close</button>
              <button className="flex-1 py-3 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-file-pdf"></i> Impact Report
              </button>
            </div>
          </div>
        ) : null}
      </ProgramHeadDrawer>

      {/* Impact Report Modal */}
      <ProgramHeadModal open={impactOpen} title="Generate Transfer Impact Report" onClose={() => setImpactOpen(false)}>
        <div className="ph-form-field">
          <label htmlFor="ph-transfer-year">Academic Year</label>
          <select className="ph-select" id="ph-transfer-year" defaultValue="AY 2025-2026">
            <option>AY 2025-2026</option><option>AY 2024-2025</option><option>All Years</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label>Include</label>
          <div className="ph-checkbox-list">
            <label><input defaultChecked type="checkbox" /> Beneficiary count</label>
            <label><input defaultChecked type="checkbox" /> Implementation location</label>
            <label><input defaultChecked type="checkbox" /> Adoption status</label>
            <label><input defaultChecked type="checkbox" /> Evidence summary</label>
          </div>
        </div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setImpactOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={() => setImpactOpen(false)}>Generate Report</ProgramHeadButton>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
