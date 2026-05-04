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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Cluster</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" defaultValue="BSIT Cluster A">
              <option>BSIT Cluster A</option><option>All Program Clusters</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Transfer Status</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Ready for Transfer">Ready for Transfer</option>
              <option value="Proposed">Proposed</option>
              <option value="Deployed">Deployed</option>
              <option value="In Use">In Use</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Beneficiary</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" defaultValue="All">
              <option value="All">All Types</option><option>School</option><option>LGU</option><option>SME</option><option>Community</option>
            </select>
          </div>
          <button onClick={() => setImpactOpen(true)} className="h-11 px-6 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <i className="fas fa-chart-line"></i> Impact Report
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-chart-pie text-[#003a8f]"></i> Transfer Pipeline</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Distribution of projects by transfer stage.</p>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-full min-w-0 h-56">
              <ChartResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ChartResponsiveContainer>
            </div>
            <div className="w-full grid grid-cols-2 gap-2">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                  <span className="ml-auto font-extrabold text-sm" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Oversight Checklist + Footprint */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-clipboard-check text-emerald-500"></i> Oversight Checklist</h3>
            </div>
            <div className="p-6 space-y-4">
              {OVERSIGHT_CHECKLIST.map(item => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shadow-sm ${item.pct === 100 ? 'bg-emerald-50 text-emerald-600' : item.pct >= 75 ? 'bg-blue-50 text-[#003a8f]' : 'bg-amber-50 text-amber-600'}`}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="font-extrabold text-slate-800">{item.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.pct === 100 ? 'bg-emerald-500' : item.pct >= 75 ? 'bg-[#003a8f]' : 'bg-amber-500'}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-map-marked-alt text-[#003a8f]"></i> Implementation Footprint</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {FOOTPRINT.map(f => (
                <div key={f.label} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: f.color }}>
                    <i className={`fas ${f.icon}`}></i>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{f.label}</span>
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
