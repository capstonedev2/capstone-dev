'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { PROGRAM_HEAD_ADVISERS, getStatusTone } from '@/components/program-head/program-head-data';
import { ChartResponsiveContainer } from '@/components/shared/chart-responsive-container';
import {
  ProgramHeadButton,
  ProgramHeadDrawer,
  ProgramHeadModal,
  ProgramHeadStatCard,
  ProgramHeadStatusBadge
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';

export function ProgramHeadPerformance() {
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [selectedAdviser, setSelectedAdviser] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState('All');

  const filtered = useMemo(() => {
    if (deptFilter === 'All') return PROGRAM_HEAD_ADVISERS;
    return PROGRAM_HEAD_ADVISERS.filter(a => a.department === deptFilter);
  }, [deptFilter]);

  const avgScore = Math.round(filtered.reduce((s, a) => s + a.overallScore, 0) / (filtered.length || 1));
  const topPerformer = [...filtered].sort((a, b) => b.overallScore - a.overallScore)[0];
  const needsImprovement = filtered.filter(a => a.overallScore < 80).length;

  const chartData = useMemo(() =>
    [...filtered].sort((a, b) => b.overallScore - a.overallScore).map(a => ({
      name: a.name.split(' ').slice(-1)[0],
      score: a.overallScore,
      color: a.overallScore >= 90 ? '#16a34a' : a.overallScore >= 80 ? '#003a8f' : '#f59e0b'
    })), [filtered]);

  const adviser = selectedAdviser ? PROGRAM_HEAD_ADVISERS.find(a => a.name === selectedAdviser) : null;

  return (
    <ProgramHeadShell activeNav="performance" title="Adviser Performance Dashboard" description="Evaluate faculty adviser performance metrics" notificationCount={3}>
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Department</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="All">All Departments</option>
              <option value="IT">IT</option><option value="MET">MET</option><option value="TCM">TCM</option><option value="ESM">ESM</option><option value="NAME">NAME</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Period</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" defaultValue="AY 2023-2024">
              <option>AY 2023-2024</option><option>AY 2022-2023</option>
            </select>
          </div>
          <button onClick={() => setEvaluationOpen(true)} className="h-11 px-6 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <i className="fas fa-star"></i> Conduct Evaluation
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Total Advisers" value={filtered.length} note={`${deptFilter === 'All' ? 'All departments' : deptFilter}`} icon="fas fa-chalkboard-teacher" />
        <ProgramHeadStatCard title="Average Performance" value={`${avgScore}%`} note="Department average" icon="fas fa-chart-line">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className={`h-full rounded-full ${avgScore >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${avgScore}%` }} />
          </div>
        </ProgramHeadStatCard>
        <ProgramHeadStatCard title="Top Performer" value={topPerformer?.name.split(' ').slice(-1)[0] || '—'} note={topPerformer ? `${topPerformer.overallScore}% rating` : ''} icon="fas fa-trophy" />
        <ProgramHeadStatCard title="Needs Improvement" value={needsImprovement} note="Below 80%" icon="fas fa-exclamation-triangle" />
      </div>

      {/* Chart + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-chart-bar text-[#003a8f]"></i> Performance Scores</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Overall scores ranked by adviser.</p>
          </div>
          <div className="p-6 h-72 min-w-0">
            <ChartResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} width={70} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => [`${v ?? 0}%`, 'Score']} />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={18}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ChartResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Top Performers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-medal text-amber-500"></i> Top Performers</h3>
            </div>
            <div className="p-6 space-y-3">
              {[...filtered].sort((a, b) => b.overallScore - a.overallScore).slice(0, 4).map((a, i) => (
                <div key={a.name} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onClick={() => setSelectedAdviser(a.name)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-sm ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'}`}>{i + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {a.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 m-0">{a.name}</p>
                    <span className="text-[11px] text-slate-400">{a.department} · {a.projectsSupervised} projects</span>
                  </div>
                  <span className={`text-lg font-extrabold ${a.overallScore >= 90 ? 'text-emerald-600' : 'text-[#003a8f]'}`}>{a.overallScore}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Development */}
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-amber-100 bg-amber-50/50">
              <h3 className="text-lg font-bold text-amber-800 m-0 flex items-center gap-2"><i className="fas fa-lightbulb text-amber-500"></i> Areas for Development</h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { name: 'Prof. Jose Lopez', note: 'Improve student feedback response time', icon: 'fa-comment-dots' },
                { name: 'General', note: 'Increase technology transfer participation', icon: 'fa-rocket' },
                { name: 'Department Goal', note: '90% average performance by 2025', icon: 'fa-bullseye' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mt-0.5"><i className={`fas ${item.icon} text-sm`}></i></div>
                  <div>
                    <strong className="text-sm text-slate-800">{item.name}</strong>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adviser Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2"><i className="fas fa-table text-[#003a8f]"></i> Performance Metrics</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">{filtered.length} advisers displayed.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Adviser</th>
                <th className="px-6 py-4 border-b border-slate-100">Department</th>
                <th className="px-6 py-4 border-b border-slate-100">Projects</th>
                <th className="px-6 py-4 border-b border-slate-100">Completion</th>
                <th className="px-6 py-4 border-b border-slate-100">Satisfaction</th>
                <th className="px-6 py-4 border-b border-slate-100">Transfer</th>
                <th className="px-6 py-4 border-b border-slate-100">Score</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(adviser => (
                <tr key={adviser.name} className="group transition-all duration-200 hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#003a8f] to-[#1a1851] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                        {adviser.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-slate-800 block group-hover:text-[#003a8f] transition-colors">{adviser.name}</strong>
                        <span className="text-[11px] text-slate-400">{adviser.projectsSupervised} projects supervised</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100">{adviser.department}</span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-bold text-slate-700">{adviser.projectsSupervised}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#003a8f] rounded-full" style={{ width: `${adviser.completionRate}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{adviser.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600">{adviser.satisfaction}</span></td>
                  <td className="px-6 py-4"><span className="text-sm font-bold text-slate-700">{adviser.techTransferCount}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                      adviser.overallScore >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${adviser.overallScore >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {adviser.overallScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedAdviser(adviser.name)} className={`opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 h-8 px-4 rounded-lg text-xs font-bold hover:-translate-y-0.5 hover:shadow-md shadow-sm flex items-center gap-1.5 ml-auto ${
                      adviser.overallScore >= 85 ? 'bg-[#003a8f] text-white' : 'bg-amber-500 text-white'
                    }`}>
                      <i className={`fas ${adviser.overallScore >= 85 ? 'fa-eye' : 'fa-clipboard-check'} text-[10px]`}></i>
                      {adviser.overallScore >= 85 ? 'View' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adviser Detail Drawer */}
      <ProgramHeadDrawer maxWidth={560} open={Boolean(adviser)} title="Adviser Profile" onClose={() => setSelectedAdviser(null)}>
        {adviser ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#003a8f] to-amber-400 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                {adviser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-800">{adviser.name}</h3>
                <span className="text-sm text-slate-500">{adviser.department} Department</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Projects', adviser.projectsSupervised],
                ['Completion', `${adviser.completionRate}%`],
                ['Satisfaction', adviser.satisfaction],
                ['Tech Transfer', adviser.techTransferCount]
              ].map(([l, v]) => (
                <div key={l as string} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{l}</span>
                  <span className="text-lg font-extrabold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Overall Score</span>
                <span className={`text-2xl font-extrabold ${adviser.overallScore >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{adviser.overallScore}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${adviser.overallScore >= 85 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`} style={{ width: `${adviser.overallScore}%` }} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all" onClick={() => setSelectedAdviser(null)}>Close</button>
              <button className="flex-1 py-3 bg-[#003a8f] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#002c6b] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-file-pdf"></i> Full Report
              </button>
            </div>
          </div>
        ) : null}
      </ProgramHeadDrawer>

      {/* Evaluation Modal */}
      <ProgramHeadModal open={evaluationOpen} title="Adviser Evaluation Form" onClose={() => setEvaluationOpen(false)}>
        <div className="ph-form-field">
          <label htmlFor="ph-eval-adviser">Adviser</label>
          <select className="ph-select" id="ph-eval-adviser" defaultValue={PROGRAM_HEAD_ADVISERS[0]?.name}>
            {PROGRAM_HEAD_ADVISERS.map(a => <option key={a.name}>{a.name}</option>)}
          </select>
        </div>
        <div className="ph-form-field">
          <label htmlFor="ph-eval-period">Evaluation Period</label>
          <select className="ph-select" id="ph-eval-period" defaultValue="First Semester 2023-2024">
            <option>First Semester 2023-2024</option><option>Second Semester 2023-2024</option>
          </select>
        </div>
        <div className="ph-form-field"><label htmlFor="ph-eval-mentorship">Student Mentorship (30%)</label><input className="ph-range" defaultValue={85} id="ph-eval-mentorship" max={100} min={0} type="range" /></div>
        <div className="ph-form-field"><label htmlFor="ph-eval-completion">Project Completion (30%)</label><input className="ph-range" defaultValue={88} id="ph-eval-completion" max={100} min={0} type="range" /></div>
        <div className="ph-form-field"><label htmlFor="ph-eval-output">Research Output (20%)</label><input className="ph-range" defaultValue={82} id="ph-eval-output" max={100} min={0} type="range" /></div>
        <div className="ph-form-field"><label htmlFor="ph-eval-engagement">Industry Engagement (20%)</label><input className="ph-range" defaultValue={75} id="ph-eval-engagement" max={100} min={0} type="range" /></div>
        <div className="ph-form-field"><label htmlFor="ph-eval-comments">Comments</label><textarea className="ph-textarea" id="ph-eval-comments" rows={3} /></div>
        <div className="ph-modal-actions">
          <ProgramHeadButton onClick={() => setEvaluationOpen(false)}>Cancel</ProgramHeadButton>
          <ProgramHeadButton variant="primary" onClick={() => setEvaluationOpen(false)}>Submit Evaluation</ProgramHeadButton>
        </div>
      </ProgramHeadModal>
    </ProgramHeadShell>
  );
}
