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
  const filtered = useMemo(() => {
    return PROGRAM_HEAD_ADVISERS.filter(a => a.department === 'IT');
  }, []);

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
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 p-5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#0F3DDE]/5 to-[#081B4B]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="flex flex-wrap items-end gap-5 relative z-10">
          <div className="flex-1 min-w-[180px] group">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1 group-focus-within:text-[#0F3DDE] transition-colors">Period</label>
            <div className="relative">
              <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F3DDE] transition-colors"></i>
              <select className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white hover:ring-slate-300 focus:ring-2 focus:ring-[#0F3DDE] focus:bg-white transition-all appearance-none shadow-inner" defaultValue="AY 2023-2024">
                <option>AY 2023-2024</option><option>AY 2022-2023</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
          <button onClick={() => setEvaluationOpen(true)} className="group relative overflow-hidden h-12 px-7 bg-gradient-to-r from-[#0F3DDE] to-[#081B4B] text-white rounded-xl text-sm font-bold shadow-[0_8px_20px_rgba(15,61,222,0.25)] hover:shadow-[0_12px_25px_rgba(15,61,222,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <i className="fas fa-star group-hover:scale-110 transition-transform text-amber-400"></i> Conduct Evaluation
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgramHeadStatCard title="Total Advisers" value={filtered.length} note={`IT department`} icon="fas fa-chalkboard-teacher" />
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
        <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="px-6 py-5 border-b border-slate-100/80 relative z-10">
            <h3 className="text-lg font-bold text-[#081B4B] m-0 flex items-center gap-2"><i className="fas fa-chart-bar text-[#0F3DDE]/70"></i> Performance Scores</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 mt-1">Overall scores ranked by adviser.</p>
          </div>
          <div className="p-6 h-72 min-w-0 relative z-10">
            <ChartResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 700, fill: '#081B4B' }} width={70} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }} itemStyle={{ fontWeight: '900', color: '#081B4B' }} formatter={(v) => [`${v ?? 0}%`, 'Score']} cursor={{ fill: 'rgba(15, 61, 222, 0.04)' }} />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={20}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}40)` }} />)}
                </Bar>
              </BarChart>
            </ChartResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Top Performers */}
          <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.06)] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="px-6 py-5 border-b border-slate-100/80 relative z-10">
              <h3 className="text-lg font-bold text-[#081B4B] m-0 flex items-center gap-2"><i className="fas fa-medal text-amber-500"></i> Top Performers</h3>
            </div>
            <div className="p-6 space-y-3 relative z-10">
              {[...filtered].sort((a, b) => b.overallScore - a.overallScore).slice(0, 4).map((a, i) => (
                <div key={a.name} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100/80 bg-white hover:border-[#0F3DDE]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group/item relative overflow-hidden" onClick={() => setSelectedAdviser(a.name)}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0F3DDE]/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-sm relative z-10 ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/30' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30' : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-700/30' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F3DDE] to-[#081B4B] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white relative z-10 group-hover/item:scale-105 transition-transform duration-300">
                    {a.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm font-bold text-[#081B4B] m-0 group-hover/item:text-[#0F3DDE] transition-colors">{a.name}</p>
                    <span className="text-[11px] font-bold text-slate-400">{a.department} · {a.projectsSupervised} projects</span>
                  </div>
                  <span className={`text-lg font-bold relative z-10 ${a.overallScore >= 90 ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'text-[#0F3DDE]'}`}>{a.overallScore}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Development */}
          <div className="group bg-gradient-to-b from-amber-50/90 to-amber-50/50 backdrop-blur-xl ring-1 ring-amber-200/60 rounded-2xl shadow-[0_8px_30px_rgb(245,158,11,0.04)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="px-6 py-5 border-b border-amber-200/60 bg-amber-100/30 relative z-10">
              <h3 className="text-lg font-bold text-amber-900 m-0 flex items-center gap-2"><i className="fas fa-lightbulb text-amber-500"></i> Areas for Development</h3>
            </div>
            <div className="p-6 space-y-3 relative z-10">
              {[
                { name: 'Prof. Jose Lopez', note: 'Improve student feedback response time', icon: 'fa-comment-dots' },
                { name: 'General', note: 'Increase technology transfer participation', icon: 'fa-rocket' },
                { name: 'Department Goal', note: '90% average performance by 2025', icon: 'fa-bullseye' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-3.5 rounded-xl bg-white/80 border border-amber-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group/dev">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center mt-0.5 shadow-sm ring-1 ring-amber-200 group-hover/dev:scale-110 transition-transform duration-300"><i className={`fas ${item.icon} text-sm`}></i></div>
                  <div>
                    <strong className="text-sm font-bold text-amber-900">{item.name}</strong>
                    <p className="text-[11px] font-bold text-amber-700/70 m-0 mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adviser Table */}
      <div className="group bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(15,61,222,0.06)] transition-all duration-300 relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F3DDE]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100/80 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-[#081B4B] m-0 flex items-center gap-2"><i className="fas fa-table text-[#0F3DDE]/70"></i> Performance Metrics</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 mt-1">{filtered.length} advisers displayed.</p>
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
