'use client';

import { useState } from 'react';
import {
  ProgramHeadButton,
  ProgramHeadModal,
  ProgramHeadStatCard,
  ProgramHeadStatusBadge
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';

const REQUIREMENTS = [
  { req: 'Student Thesis Outputs', category: 'Student Outputs', status: 'Complete' as const, evidence: '42/42 projects', due: 'Completed', icon: 'fa-graduation-cap' },
  { req: 'Faculty Publications', category: 'Faculty Research', status: 'Complete' as const, evidence: '15 publications', due: 'Completed', icon: 'fa-book' },
  { req: 'Industry MOAs', category: 'Industry Linkages', status: 'In Progress' as const, evidence: '8/12 MOAs', due: 'Mar 30, 2024', icon: 'fa-handshake' },
  { req: 'Community Projects', category: 'Community Engagement', status: 'In Progress' as const, evidence: '4/6 projects', due: 'Mar 15, 2024', icon: 'fa-users' },
  { req: 'Technology Transfer Records', category: 'Industry Impact', status: 'Complete' as const, evidence: '5 deployments', due: 'Completed', icon: 'fa-satellite-dish' }
];

const DOCUMENTS = [
  { name: 'Student_Theses_2023-2024.pdf', size: '12.4 MB', type: 'PDF', icon: 'fa-file-pdf', color: '#dc2626' },
  { name: 'Faculty_Publications_List.pdf', size: '3.2 MB', type: 'PDF', icon: 'fa-file-pdf', color: '#dc2626' },
  { name: 'Industry_Partners_Report.docx', size: '5.8 MB', type: 'DOCX', icon: 'fa-file-word', color: '#2563eb' },
  { name: 'Tech_Transfer_Impact.xlsx', size: '2.1 MB', type: 'XLSX', icon: 'fa-file-excel', color: '#16a34a' }
];

const TIMELINE = [
  { label: 'Self-Assessment', date: 'Dec 2023', state: 'done' as const, icon: 'fa-clipboard-check' },
  { label: 'Document Preparation', date: 'Jan 2024', state: 'done' as const, icon: 'fa-folder-open' },
  { label: 'Evidence Collection', date: 'Feb-Mar 2024', state: 'current' as const, icon: 'fa-search' },
  { label: 'Site Visit', date: 'Apr 2024', state: 'pending' as const, icon: 'fa-building' },
  { label: 'Final Evaluation', date: 'May 2024', state: 'pending' as const, icon: 'fa-award' }
];

export function ProgramHeadEvidence() {
  const [reportOpen, setReportOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = categoryFilter === 'All' ? REQUIREMENTS : REQUIREMENTS.filter(r => r.category === categoryFilter);
  const completePct = Math.round((REQUIREMENTS.filter(r => r.status === 'Complete').length / REQUIREMENTS.length) * 100);

  return (
    <ProgramHeadShell activeNav="evidence" title="Accreditation & Evidence Management" description="Prepare documentation for program accreditation and quality assurance" notificationCount={2}>
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Academic Year</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" defaultValue="AY 2023-2024">
              <option>AY 2023-2024</option><option>AY 2022-2023</option><option>AY 2021-2022</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Evidence Type</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">All Evidence Types</option>
              <option value="Student Outputs">Student Outputs</option>
              <option value="Faculty Research">Faculty Research</option>
              <option value="Industry Linkages">Industry Linkages</option>
              <option value="Community Engagement">Community Engagement</option>
            </select>
          </div>
          <button onClick={() => setReportOpen(true)} className="h-11 px-6 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <i className="fas fa-file-alt"></i> Accreditation Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Accreditation Readiness" value="94%" note="Target: 100% by May 2024" icon="fas fa-shield-alt">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: '94%' }} />
          </div>
        </ProgramHeadStatCard>
        <ProgramHeadStatCard title="Evidence Complete" value="42/45" note="93.3% completion" icon="fas fa-check-double" />
        <ProgramHeadStatCard title="Student Publications" value="8" note="+3 from last year" icon="fas fa-newspaper" />
        <ProgramHeadStatCard title="Industry Partners" value="12" note="Active MOAs" icon="fas fa-handshake" />
      </div>

      {/* Requirements Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-tasks text-[#003a8f]"></i> Accreditation Requirements</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">{completePct}% of requirements are complete.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#003a8f] rounded-full" style={{ width: `${completePct}%` }} />
            </div>
            <span className="text-sm font-extrabold text-[#003a8f]">{completePct}%</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Requirement</th>
                <th className="px-6 py-4 border-b border-slate-100">Category</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100">Evidence</th>
                <th className="px-6 py-4 border-b border-slate-100">Due Date</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(row => (
                <tr key={row.req} className="group transition-all duration-200 hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shadow-sm ${row.status === 'Complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <i className={`fas ${row.icon}`}></i>
                      </div>
                      <span className="font-bold text-sm text-slate-800">{row.req}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-[#003a8f] text-xs font-bold border border-blue-100">{row.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${row.status === 'Complete' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Complete' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-medium text-slate-700">{row.evidence}</span></td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${row.due === 'Completed' ? 'font-bold text-emerald-600' : 'text-slate-600'}`}>{row.due}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className={`opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 h-8 px-4 rounded-lg text-xs font-bold hover:-translate-y-0.5 hover:shadow-md shadow-sm flex items-center gap-1.5 ml-auto ${row.status === 'Complete' ? 'bg-[#003a8f] text-white' : 'bg-amber-500 text-white'}`}>
                      <i className={`fas ${row.status === 'Complete' ? 'fa-eye' : 'fa-cloud-upload-alt'} text-[10px]`}></i>
                      {row.status === 'Complete' ? 'View' : 'Upload'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-folder-open text-amber-500"></i> Evidence Repository</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">{DOCUMENTS.length} documents uploaded.</p>
          </div>
          <div className="p-6 space-y-3">
            {DOCUMENTS.map(doc => (
              <div key={doc.name} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white group cursor-pointer">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: doc.color }}>
                  <i className={`fas ${doc.icon} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 m-0 truncate group-hover:text-[#003a8f] transition-colors">{doc.name}</p>
                  <span className="text-[11px] text-slate-400">{doc.size} · {doc.type}</span>
                </div>
                <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-[#003a8f] hover:text-white transition-all opacity-0 group-hover:opacity-100">
                  <i className="fas fa-download text-xs"></i>
                </button>
              </div>
            ))}
            <button className="w-full py-3 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-[#003a8f] hover:text-[#003a8f] hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> Upload New Document
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-stream text-[#003a8f]"></i> Accreditation Timeline</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Track preparation milestones.</p>
          </div>
          <div className="p-6">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>
              <div className="space-y-6">
                {TIMELINE.map((step, i) => (
                  <div key={i} className="relative flex items-start gap-5 pl-2">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm ring-4 ring-white ${
                      step.state === 'done' ? 'bg-emerald-500 text-white' :
                      step.state === 'current' ? 'bg-[#003a8f] text-white animate-pulse' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      <i className={`fas ${step.state === 'done' ? 'fa-check' : step.icon} text-xs`}></i>
                    </div>
                    <div className="flex-1 pb-1">
                      <p className={`text-sm font-bold m-0 ${step.state === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>{step.label}</p>
                      <span className={`text-xs ${step.state === 'current' ? 'font-bold text-[#003a8f]' : 'text-slate-500'}`}>{step.date}</span>
                      {step.state === 'current' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#003a8f] text-[10px] font-bold ring-1 ring-[#003a8f]/10">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ProgramHeadModal open={reportOpen} title="Generate Accreditation Report" onClose={() => setReportOpen(false)}>
        <div className="ph-form-field">
          <label htmlFor="ph-evidence-report-type">Report Type</label>
          <select className="ph-select" id="ph-evidence-report-type" defaultValue="Self-Assessment Report">
            <option>Self-Assessment Report</option><option>Evidence Portfolio</option><option>Compliance Report</option><option>Program Performance Summary</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label htmlFor="ph-evidence-body">Accreditation Body</label>
          <select className="ph-select" id="ph-evidence-body" defaultValue="CHED">
            <option>CHED</option><option>PACUCOA</option><option>ABET</option><option>International Accreditation</option>
          </select>
        </div>
        <div className="ph-form-field">
          <label>Include Appendices</label>
          <div className="ph-checkbox-list">
            <label><input defaultChecked type="checkbox" /> Student works</label>
            <label><input defaultChecked type="checkbox" /> Faculty CVs</label>
            <label><input defaultChecked type="checkbox" /> Industry letters</label>
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
