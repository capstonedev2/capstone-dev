'use client';

import { useRef, useState } from 'react';
import { scoreTone } from './live-defense-logic';

export type RubricItem = {
  id: string;
  label: string;
  desc: string;
  weight: number;
  anchor: string;
};

type Props = {
  projectTitle: string;
  groupRubric: RubricItem[];
  individualRubric: RubricItem[];
  scores: Record<string, number>;
  setScore: (id: string, val: number) => void;
  individualScores: Record<string, number>;
  setIndividualScore: (name: string, val: number) => void;
  attendance: Record<string, boolean>;
  evaluationNeeds: string[];
  members: string[];
  notes: Record<string, string>;
  setNote: (id: string, val: string) => void;
  overallFeedback: string;
  setOverallFeedback: (v: string) => void;
  submitted: boolean;
  onSubmit: () => void;
  isChair: boolean;
  isMyAdvisee?: boolean;
  focusMode: boolean;
  onNextGroup?: () => void;
  canGoNext: boolean;
  panelistVotes: Record<string, 'yes' | 'no'>;
  setPanelistVote: (name: string, vote: 'yes' | 'no') => void;
  panelistNames: string[];
  currentPanelistName: string;
};

export function DefenseEvalPanel({
  scores,
  setScore,
  individualScores,
  setIndividualScore,
  attendance,
  evaluationNeeds,
  members,
  notes,
  setNote,
  overallFeedback,
  setOverallFeedback,
  submitted,
  onSubmit,
  isChair,
  isMyAdvisee,
  focusMode,
  onNextGroup,
  canGoNext,
  panelistVotes,
  setPanelistVote,
  panelistNames,
  currentPanelistName,
  groupRubric,
  individualRubric,
  projectTitle
}: Props) {
  const [tab, setTab] = useState<'group' | 'individual'>('group');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  
  const MAX_SCORE = groupRubric.reduce((a, c) => a + c.weight, 0);
  const MAX_INDIVIDUAL_SCORE = individualRubric.reduce((a, c) => a + c.weight, 0);
  const total = Object.values(scores).reduce((a, c) => a + c, 0);
  const scored = groupRubric.filter((r) => scores[r.id] > 0).length;
  const progressPct = groupRubric.length > 0 ? (scored / groupRubric.length) * 100 : 0;
  const groupComplete = scored === groupRubric.length;
  const presentMembers = members.filter((member) => attendance[member] !== false);
  const individualScored = presentMembers.filter((member) => individualScores[member] > 0).length;
  const individualAverage =
    individualScored > 0
      ? (presentMembers.reduce((sum, member) => sum + (individualScores[member] || 0), 0) / individualScored).toFixed(1)
      : '-';
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const panelWidth = 'w-full flex-1';

  const handleScore = (id: string, val: number) => {
    if (submitted) return;
    setScore(id, val);
  };

  if (isMyAdvisee) {
    return (
      <aside className={`${panelWidth} flex min-h-0 shrink-0 flex-col bg-white xl:h-auto`}>
        <div className="border-b border-slate-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evaluation</p>
          <h3 className="mt-1 flex items-center gap-2 text-base font-black text-slate-950">
            <i className="fas fa-shield-halved text-brand" />
            Conflict Check
          </h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-2xl text-amber-700">
            <i className="fas fa-user-lock" />
          </div>
          <h3 className="text-lg font-black text-slate-950">Adviser Conflict</h3>
          <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-slate-500">
            You are the adviser for this group. Policy prevents scoring your own advisees.
          </p>
          {isChair && onNextGroup && (
            <button
              type="button"
              onClick={onNextGroup}
              disabled={!canGoNext}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Skip & Load Next
              <i className="fas fa-arrow-right" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${panelWidth} flex min-h-0 shrink-0 flex-col bg-white/80 backdrop-blur-2xl shadow-[-10px_0_30px_rgba(0,58,143,0.05)] xl:h-auto`}>
      <div className="shrink-0 border-b border-slate-200/50 p-6 bg-gradient-to-b from-white/90 to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-[#003a8f]/60 mb-1">Panel Scoring</p>
            <h3 className="flex items-center gap-2.5 text-lg font-black text-[#102033] tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#003a8f] to-[#082a67] shadow-md">
                <i className="fas fa-clipboard-check text-white text-sm" />
              </span>
              Evaluation
            </h3>
          </div>
          <div className="text-right flex flex-col items-end justify-center">
            <span className={`text-[2rem] leading-none font-black tabular-nums tracking-tighter ${scoreTone(total, MAX_SCORE)}`}>{total}</span>
            <span className="text-[0.65rem] font-black text-slate-400 tracking-widest uppercase mt-1">out of {MAX_SCORE}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white bg-white/60 p-3.5 shadow-[0_2px_10px_rgba(0,58,143,0.03)] backdrop-blur-sm">
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Rubric Progress</p>
            <p className="mt-1 text-base font-black text-[#102033]">
              {scored}<span className="text-slate-400 font-bold text-sm">/{groupRubric.length} criteria</span>
            </p>
          </div>
          <div className="rounded-xl border border-white bg-white/60 p-3.5 shadow-[0_2px_10px_rgba(0,58,143,0.03)] backdrop-blur-sm">
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Individual Avg</p>
            <p className="mt-1 text-base font-black text-[#102033]">
              {individualAverage}
              <span className="text-slate-400 font-bold text-sm">/5 pts</span>
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/60 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-[#003a8f] to-[#f6be00] transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[0.7rem] font-black text-[#003a8f] tracking-wider w-8 text-right">{Math.round(progressPct)}%</span>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100/60 p-1 backdrop-blur-sm border border-slate-200/50">
          <button
            type="button"
            onClick={() => setTab('group')}
            className={`rounded-lg py-2.5 text-[0.7rem] font-black uppercase tracking-widest transition-all duration-300 ${
              tab === 'group' ? 'bg-white text-[#003a8f] shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <i className="fas fa-users mr-2" />
            Group
          </button>
          <button
            type="button"
            onClick={() => setTab('individual')}
            className={`rounded-lg py-2.5 text-[0.7rem] font-black uppercase tracking-widest transition-all duration-300 ${
              tab === 'individual' ? 'bg-white text-[#003a8f] shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <i className="fas fa-user-check mr-2" />
            Individual
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {tab === 'group' ? (
          <div className="space-y-4">
            {groupRubric.map((criteria) => {
              const score = scores[criteria.id] || 0;
              const isComplete = score > 0;

              return (
                <div
                  key={criteria.id}
                  ref={(el) => {
                    sectionRefs.current[criteria.id] = el;
                  }}
                  className={`rounded-[1.25rem] border transition-all duration-300 ${
                    isComplete 
                      ? 'border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-transparent shadow-[0_4px_15px_rgba(16,185,129,0.04)]' 
                      : 'border-white bg-white/60 shadow-[0_4px_20px_rgba(0,58,143,0.03)] hover:border-[#003a8f]/20 hover:shadow-[0_6px_25px_rgba(0,58,143,0.06)]'
                  } ${submitted ? 'opacity-70 grayscale-[0.2]' : ''}`}
                >
                  <div className="flex w-full items-start justify-between gap-4 p-4 text-left">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[0.6rem] font-black uppercase tracking-widest ${isComplete ? 'text-emerald-600' : 'text-slate-400'}`}>{criteria.anchor}</p>
                      <h4 className="mt-1 text-sm font-black text-[#102033]">{criteria.label}</h4>
                      <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500">{criteria.desc}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`flex items-center justify-center min-w-[3.5rem] rounded-lg border ${isComplete ? 'border-emerald-200 bg-emerald-100/50 text-emerald-800' : 'border-white bg-white text-[#102033] shadow-sm'} px-2 py-1.5 tabular-nums`}>
                        <span className="text-base font-black leading-none">{score || '-'}</span>
                        <span className={`text-[0.65rem] font-bold ml-0.5 mt-1 ${isComplete ? 'text-emerald-600/70' : 'text-slate-400'}`}>/{criteria.weight}</span>
                      </span>
                    </div>
                  </div>

                    <div className="px-4 pb-4">
                        <div className="flex flex-col gap-3 rounded-xl border border-blue-100/60 bg-gradient-to-br from-blue-50/30 to-slate-50/30 p-4 shadow-[inset_0_2px_10px_rgba(0,58,143,0.02)]">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleScore(criteria.id, Math.max(0, score - 1))}
                              disabled={submitted || score <= 0}
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#003a8f] shadow-sm transition-all hover:bg-blue-50 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed border border-blue-100/50"
                            >
                              <i className="fas fa-minus" />
                            </button>
                            
                            <div className="flex-1 flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={criteria.weight}
                                value={score || ''}
                                placeholder="0"
                                disabled={submitted}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    handleScore(criteria.id, Math.min(criteria.weight, Math.max(0, val)));
                                  }
                                }}
                                className="w-20 h-12 rounded-xl border-2 border-blue-200 bg-white text-center text-xl font-black text-[#003a8f] shadow-sm transition-all focus:border-[#003a8f] focus:outline-none focus:ring-4 focus:ring-[#003a8f]/10 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-300 [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-sm font-bold text-slate-400">/ {criteria.weight}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleScore(criteria.id, Math.min(criteria.weight, score + 1))}
                              disabled={submitted || score >= criteria.weight}
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003a8f] to-[#082a67] text-white shadow-[0_4px_10px_rgba(0,58,143,0.2)] transition-all hover:shadow-[0_6px_15px_rgba(0,58,143,0.3)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <i className="fas fa-plus" />
                            </button>
                          </div>
                        </div>

                    {notes[criteria.id] === undefined ? (
                      <button
                        type="button"
                        disabled={submitted}
                        onClick={() => setNote(criteria.id, '')}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/50 px-3 py-2 text-[0.7rem] font-black text-slate-500 transition-all hover:border-[#003a8f]/40 hover:bg-[#003a8f]/5 hover:text-[#003a8f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <i className="fas fa-plus-circle" />
                        Add Private Note
                      </button>
                    ) : (
                      <div className="mt-4 relative group">
                        <textarea
                          disabled={submitted}
                          value={notes[criteria.id]}
                          onChange={(event) => setNote(criteria.id, event.target.value)}
                          placeholder="Private scoring note..."
                          className="h-24 w-full resize-none rounded-xl border border-[#f6be00]/40 bg-[#f6be00]/[0.03] p-3 text-sm font-semibold text-[#102033] outline-none transition-all focus:border-[#f6be00] focus:bg-white focus:ring-4 focus:ring-[#f6be00]/10 disabled:cursor-not-allowed"
                        />
                        <div className="absolute top-3 right-3 opacity-50 group-focus-within:opacity-100 transition-opacity">
                          <i className="fas fa-pen-to-square text-[#f6be00]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className={`pt-2 ${submitted ? 'opacity-70' : ''}`}>
              <label className="mb-2.5 flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-widest text-[#003a8f]">
                <i className="fas fa-comment-dots" />
                Overall Feedback
              </label>
              <textarea
                disabled={submitted}
                value={overallFeedback}
                onChange={(event) => setOverallFeedback(event.target.value)}
                placeholder="Defense outcome, required revisions, and formal remarks..."
                className="h-32 w-full resize-none rounded-[1.25rem] border border-white bg-white/60 p-4 text-sm font-semibold text-[#102033] shadow-[0_4px_20px_rgba(0,58,143,0.03)] outline-none transition-all focus:border-[#003a8f]/30 focus:bg-white focus:ring-4 focus:ring-[#003a8f]/5 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        ) : (
            <div className="rounded-xl border border-white bg-white/70 p-4 shadow-[0_2px_10px_rgba(0,58,143,0.03)] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Individual Readiness</p>
                  <p className="mt-1 text-base font-black text-[#102033]">
                    {individualScored}<span className="text-slate-400 font-bold text-sm">/{presentMembers.length} gradable</span>
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#003a8f] to-[#082a67] text-white shadow-md">
                  <i className="fas fa-user-check" />
                </div>
              </div>
            </div>

            {members.map((member) => {
              const isAbsent = attendance[member] === false;
              const totalMemberScore = individualRubric.reduce((acc, criteria) => acc + (individualScores[`${member}::${criteria.id}`] || 0), 0);
              const isComplete = totalMemberScore > 0;

              return (
                <div
                  key={member}
                  className={`rounded-[1.25rem] border p-4 transition-all duration-300 ${
                    isAbsent 
                      ? 'border-rose-200/60 bg-rose-50/50' 
                      : isComplete
                        ? 'border-[#003a8f]/20 bg-[#003a8f]/[0.02] shadow-sm'
                        : 'border-white bg-white/60 shadow-[0_4px_20px_rgba(0,58,143,0.03)] hover:border-[#003a8f]/20 hover:shadow-[0_6px_25px_rgba(0,58,143,0.06)]'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`block truncate text-base font-black tracking-tight ${isAbsent ? 'text-rose-700' : 'text-[#102033]'}`}>
                        {member}
                      </span>
                      {isAbsent && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-rose-100/80 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-widest text-rose-700">
                          <i className="fas fa-user-xmark" /> Absent
                        </span>
                      )}
                    </div>
                    {!isAbsent && (
                      <span className={`flex items-center justify-center min-w-[3.5rem] rounded-lg border ${isComplete ? 'border-[#003a8f]/30 bg-[#003a8f] text-white shadow-md' : 'border-white bg-white text-[#102033] shadow-sm'} px-2 py-1.5 tabular-nums`}>
                        <span className="text-base font-black leading-none">{totalMemberScore || '-'}</span>
                        <span className={`text-[0.65rem] font-bold ml-0.5 mt-1 ${isComplete ? 'text-blue-100' : 'text-slate-400'}`}>/{MAX_INDIVIDUAL_SCORE}</span>
                      </span>
                    )}
                  </div>

                  {!isAbsent && (
                    <div className="space-y-4">
                      {individualRubric.map((criteria) => {
                         const score = individualScores[`${member}::${criteria.id}`] || 0;
                         return (
                           <div key={criteria.id} className="rounded-xl border border-slate-200/60 bg-white/50 p-3">
                             <div className="flex justify-between items-center mb-3">
                               <div>
                                 <p className="text-xs font-bold text-[#102033]">{criteria.label}</p>
                                 <p className="text-[0.65rem] text-slate-500 mt-0.5">{criteria.desc}</p>
                               </div>
                               <span className="text-[0.65rem] font-black text-[#003a8f] ml-4 shrink-0">{score} / {criteria.weight}</span>
                             </div>
                             <div className="flex items-center gap-3">
                               <button
                                 type="button"
                                 onClick={() => setIndividualScore(`${member}::${criteria.id}`, Math.max(0, score - 1))}
                                 disabled={submitted || score <= 0}
                                 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#003a8f] shadow-sm transition-all hover:bg-blue-50 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed border border-blue-100/50"
                               >
                                 <i className="fas fa-minus text-xs" />
                               </button>
                               
                               <div className="flex-1 flex items-center justify-center gap-1.5">
                                 <input
                                   type="number"
                                   min="0"
                                   max={criteria.weight}
                                   value={score || ''}
                                   placeholder="0"
                                   disabled={submitted}
                                   onChange={(e) => {
                                     const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                     if (!isNaN(val)) {
                                       setIndividualScore(`${member}::${criteria.id}`, Math.min(criteria.weight, Math.max(0, val)));
                                     }
                                   }}
                                   className="w-16 h-9 rounded-lg border-2 border-blue-200 bg-white text-center text-sm font-black text-[#003a8f] shadow-sm transition-all focus:border-[#003a8f] focus:outline-none focus:ring-4 focus:ring-[#003a8f]/10 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-300 [&::-webkit-inner-spin-button]:appearance-none"
                                 />
                                 <span className="text-[0.65rem] font-bold text-slate-400">/ {criteria.weight}</span>
                               </div>

                               <button
                                 type="button"
                                 onClick={() => setIndividualScore(`${member}::${criteria.id}`, Math.min(criteria.weight, score + 1))}
                                 disabled={submitted || score >= criteria.weight}
                                 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#003a8f] to-[#082a67] text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                               >
                                 <i className="fas fa-plus text-xs" />
                               </button>
                             </div>
                           </div>
                         );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 p-4">
        {!submitted && (
          <div className="mb-4 rounded-[1rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Your Final Vote</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPanelistVote(currentPanelistName, 'yes')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-[0.85rem] font-black transition-all ${
                  panelistVotes[currentPanelistName] === 'yes'
                    ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-500 ring-offset-2'
                    : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                }`}
              >
                <i className="fas fa-thumbs-up" />
                Approve (Pass)
              </button>
              <button
                type="button"
                onClick={() => setPanelistVote(currentPanelistName, 'no')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-[0.85rem] font-black transition-all ${
                  panelistVotes[currentPanelistName] === 'no'
                    ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-500 ring-offset-2'
                    : 'border border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                <i className="fas fa-thumbs-down" />
                Reject (Re-Defense)
              </button>
            </div>
          </div>
        )}

        {submitted ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
                <i className="fas fa-check-circle" />
                Scores Submitted
              </div>
              <button 
                type="button" 
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-md bg-white border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100"
              >
                <i className="fas fa-print" /> Print Form
              </button>
            </div>

            {/* Per-Panelist Vote Status */}
            {(() => {
              const yesCount = Object.values(panelistVotes).filter((v) => v === 'yes').length;
              const noCount = Object.values(panelistVotes).filter((v) => v === 'no').length;
              const totalVoted = yesCount + noCount;
              const allVoted = totalVoted === panelistNames.length;
              const majority = yesCount > noCount ? 'defended' : noCount > yesCount ? 'not-defended' : null;

              return (
                <div className="rounded-[1rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Panel Vote Summary</p>
                    <span className="text-[0.65rem] font-black text-slate-500">{totalVoted}/{panelistNames.length} voted</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {panelistNames.map((name) => {
                      const vote = panelistVotes[name];
                      const isMe = name === currentPanelistName;
                      const canSeeVote = isChair || isMe;
                      return (
                        <div key={name} className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors ${isMe ? 'bg-blue-50/50 ring-1 ring-blue-100' : ''}`}>
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-black ${isMe ? 'bg-[#003a8f] text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-[0.75rem] font-bold text-[#102033]">{name}</span>
                            {isMe && <span className="text-[0.55rem] font-black text-[#003a8f] uppercase tracking-wider">You</span>}
                          </div>
                          <div className="flex gap-1">
                            {canSeeVote ? (
                              <span className={`flex h-7 items-center justify-center rounded-md px-3 text-[0.65rem] font-black ${
                                vote === 'yes'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : vote === 'no'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-100 text-slate-400'
                              }`}>
                                {vote === 'yes' ? <><i className="fas fa-thumbs-up mr-1" />Yes</> : vote === 'no' ? <><i className="fas fa-thumbs-down mr-1" />No</> : 'Pending'}
                              </span>
                            ) : (
                              <span className={`flex h-7 items-center justify-center rounded-md px-3 text-[0.65rem] font-black ${
                                vote ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {vote ? <><i className="fas fa-check-circle mr-1" />Voted</> : 'Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vote Tally */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                      {totalVoted > 0 && (
                        <>
                          <div className="h-full bg-emerald-500 float-left transition-all duration-300" style={{ width: `${(yesCount / panelistNames.length) * 100}%` }} />
                          <div className="h-full bg-rose-500 float-right transition-all duration-300" style={{ width: `${(noCount / panelistNames.length) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[0.7rem] font-black">
                    <span className="text-emerald-600"><i className="fas fa-thumbs-up mr-1" />{yesCount} Yes</span>
                    <span className="text-rose-600"><i className="fas fa-thumbs-down mr-1" />{noCount} No</span>
                  </div>

                  {/* Result */}
                  {allVoted && majority && (
                    <div className={`mt-4 flex items-center justify-center gap-2 rounded-[0.85rem] border-2 px-4 py-3 text-[0.85rem] font-black ${
                      majority === 'defended'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-rose-500 bg-rose-50 text-rose-700'
                    }`}>
                      <i className={`fas ${majority === 'defended' ? 'fa-trophy' : 'fa-rotate-left'}`} />
                      {majority === 'defended' ? 'Verdict: DEFENDED' : 'Verdict: NOT DEFENDED'}
                    </div>
                  )}
                  {allVoted && !majority && (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-[0.85rem] border-2 border-amber-500 bg-amber-50 px-4 py-3 text-[0.85rem] font-black text-amber-700">
                      <i className="fas fa-scale-balanced" />
                      Verdict: TIE — Chair Decides
                    </div>
                  )}
                  {!allVoted && (
                    <p className="mt-3 text-center text-[0.65rem] font-bold text-amber-600">
                      <i className="fas fa-triangle-exclamation mr-1" />
                      All panelists must vote before proceeding.
                    </p>
                  )}
                </div>
              );
            })()}

            {isChair && onNextGroup && (
              <button
                type="button"
                onClick={onNextGroup}
                disabled={!canGoNext || Object.keys(panelistVotes).length < panelistNames.length}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Group
                <i className="fas fa-arrow-right" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!groupComplete || !panelistVotes[currentPanelistName]}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <i className={`fas ${isChair ? 'fa-flag-checkered' : 'fa-paper-plane'}`} />
              {isChair ? 'End & Submit Session' : 'Submit Rating & Vote'}
            </button>
            <p className="text-center text-xs font-semibold text-slate-500">
              {groupComplete && panelistVotes[currentPanelistName] ? 'Ready for final submission.' : !panelistVotes[currentPanelistName] ? 'Please cast your final vote above.' : `${groupRubric.length - scored} rubric item${groupRubric.length - scored === 1 ? '' : 's'} remaining.`}
            </p>
          </div>
        )}
      </div>

      <div className="print-only bg-white text-black font-serif p-10 max-w-[800px] mx-auto">
        <div className="flex items-center gap-6 mb-12">
          {/* USTP Logo */}
          <div className="w-24 h-24 shrink-0 flex items-center justify-center">
            <img src="/System Logo/ustp-logo.png" alt="USTP Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex-1 text-center -ml-8">
            <h1 className="font-bold text-[1.1rem] uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>University of Science and Technology of Southern Philippines</h1>
            <p className="text-[0.85rem]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Alubijid | Cagayan de Oro | <span className="underline decoration-red-500 decoration-wavy">Claveria</span> | <span className="underline decoration-red-500 decoration-wavy">Panaon</span> | <span className="underline decoration-red-500 decoration-wavy">Oroquieta</span> | <span className="underline decoration-red-500 decoration-wavy">Panaon</span></p>
          </div>
        </div>

        <div className="flex justify-end mb-8 text-[0.95rem]">
          <div className="flex items-end">
            <span className="mr-2">Date:</span>
            <div className="w-48 border-b border-black font-semibold text-center">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <h2 className="text-center font-bold text-[1.3rem] mb-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>FINAL DEFENSE PRESENTATION</h2>
        <h3 className="text-center text-[1rem] mb-10" style={{ fontFamily: '"Times New Roman", Times, serif' }}>(Panel's Rating)</h3>

        <div className="mb-6 text-[0.95rem]">
          <div className="flex items-end mb-6">
            <span className="mr-2 whitespace-nowrap">Project Title:</span> 
            <div className="flex-1 border-b border-black font-semibold pb-0.5">{projectTitle}</div>
          </div>
          
          <div className="mb-6">
            <span className="mr-2">Degree:</span>
            <span className="font-bold">BS Information Technology</span>
          </div>

          <div className="mb-8">
            <div className="mb-2">Group Members:</div>
            <div className="w-80 pl-0">
              {members.map(m => (
                <div key={m} className="border-b border-black min-h-[1.5rem] font-semibold flex items-end pb-0.5">{m}</div>
              ))}
              {/* Pad with empty lines up to 4 */}
              {Array.from({ length: Math.max(0, 4 - members.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-black min-h-[1.5rem]" />
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 text-[0.8rem] leading-tight" style={{ fontFamily: '"Arial", sans-serif' }}>
          <p className="font-bold mb-1 text-[0.85rem]">Verdict:</p>
          <p className="mb-0.5">
            <span className="font-bold">APPROVED.</span> The Proponents/Researchers present an idea that potential to research based on
          </p>
          <p className="mb-0.5 ml-14">
            the solid evidence gather. <span className="font-bold">25 – 50 %</span>
          </p>
          <p className="mb-0.5">
            <span className="font-bold uppercase">Reoral.</span> The Proponents/Researchers failed to present a possible researchable or scholarly
          </p>
          <p className="ml-14">
            Research / Special Project. <span className="font-bold">Below 25%.</span>
          </p>
        </div>

        <table className="w-full border-collapse border border-black mb-8 text-[0.85rem]" style={{ fontFamily: '"Arial", sans-serif' }}>
          <thead>
            <tr>
              <th className="border border-black px-2 py-3 text-left font-normal w-[25%] align-top">Project Full blown<br/>Manuscript (20%)</th>
              <th className="border border-black px-2 py-3 text-left font-normal w-[20%] align-top">Project<br/>Output (20%)</th>
              <th className="border border-black px-2 py-3 text-left font-normal w-[20%] align-top">Oral<br/>Examination<br/>(10%)</th>
              <th className="border border-black px-2 py-3 text-left font-normal w-[15%] align-top">Total (50%)</th>
              <th className="border border-black px-2 py-3 text-left font-normal w-[20%] align-top">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-2 py-5 text-center font-bold text-[1rem]">
                {(() => {
                  const manuscriptTotal = groupRubric.filter(r => r.anchor.includes('Manuscript')).reduce((acc, r) => acc + (scores[r.id] || 0), 0);
                  const maxManuscript = groupRubric.filter(r => r.anchor.includes('Manuscript')).reduce((acc, r) => acc + r.weight, 0);
                  return maxManuscript > 0 ? ((manuscriptTotal / maxManuscript) * 20).toFixed(1) : '';
                })()}
              </td>
              <td className="border border-black px-2 py-5 text-center font-bold text-[1rem]">
                {(() => {
                  const outputTotal = groupRubric.filter(r => r.anchor.includes('Output')).reduce((acc, r) => acc + (scores[r.id] || 0), 0);
                  const maxOutput = groupRubric.filter(r => r.anchor.includes('Output')).reduce((acc, r) => acc + r.weight, 0);
                  return maxOutput > 0 ? ((outputTotal / maxOutput) * 20).toFixed(1) : '';
                })()}
              </td>
              <td className="border border-black px-2 py-5 text-center font-bold text-[1rem]">
                {(() => {
                  if (members.length === 0) return '';
                  const totalOralSum = members.reduce((sum, member) => {
                    const memberTotal = individualRubric.reduce((acc, r) => acc + (individualScores[`${member}::${r.id}`] || 0), 0);
                    return sum + memberTotal;
                  }, 0);
                  const maxOral = individualRubric.reduce((acc, r) => acc + r.weight, 0);
                  const avgOralPoints = totalOralSum / members.length;
                  return maxOral > 0 ? ((avgOralPoints / maxOral) * 10).toFixed(1) : '';
                })()}
              </td>
              <td className="border border-black px-2 py-5 text-center font-bold text-[1rem] bg-gray-200/60">
                {(() => {
                  const manuscriptTotal = groupRubric.filter(r => r.anchor.includes('Manuscript')).reduce((acc, r) => acc + (scores[r.id] || 0), 0);
                  const maxManuscript = groupRubric.filter(r => r.anchor.includes('Manuscript')).reduce((acc, r) => acc + r.weight, 0);
                  const mScore = maxManuscript > 0 ? (manuscriptTotal / maxManuscript) * 20 : 0;

                  const outputTotal = groupRubric.filter(r => r.anchor.includes('Output')).reduce((acc, r) => acc + (scores[r.id] || 0), 0);
                  const maxOutput = groupRubric.filter(r => r.anchor.includes('Output')).reduce((acc, r) => acc + r.weight, 0);
                  const oScore = maxOutput > 0 ? (outputTotal / maxOutput) * 20 : 0;

                  const totalOralSum = members.reduce((sum, member) => {
                    const memberTotal = individualRubric.reduce((acc, r) => acc + (individualScores[`${member}::${r.id}`] || 0), 0);
                    return sum + memberTotal;
                  }, 0);
                  const maxOral = individualRubric.reduce((acc, r) => acc + r.weight, 0);
                  const avgOralPoints = members.length > 0 ? totalOralSum / members.length : 0;
                  const indScore = maxOral > 0 ? (avgOralPoints / maxOral) * 10 : 0;

                  return (mScore + oScore + indScore).toFixed(1);
                })()}
              </td>
              <td className="border border-black px-2 py-5 text-center bg-gray-200/60"></td>
            </tr>
          </tbody>
        </table>

        <div className="mb-16 text-[0.95rem]">
          <p className="mb-2">Recommendations:</p>
          <div className="w-full min-h-[60px] whitespace-pre-wrap font-semibold">
            {overallFeedback}
          </div>
        </div>

        <div className="w-64">
          <div className="border-b border-black mb-1 font-semibold text-center pb-0.5">{currentPanelistName}</div>
          <p className="text-[0.8rem]">Panelist<br/>(Signature over Printed Name)</p>
        </div>
      </div>
    </aside>
  );
}
