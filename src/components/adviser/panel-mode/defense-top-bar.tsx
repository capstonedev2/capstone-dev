'use client';

import Link from 'next/link';
import { formatTime, timerBg, timerColor } from './live-defense-logic';

type Props = {
  title: string;
  group: string;
  timer: number;
  totalTime: number;
  timerActive: boolean;
  isChair: boolean;
  groupIndex: number;
  totalGroups: number;
  room: string;
  time: string;
  presentCount: number;
  totalMembers: number;
  sessionStarted: boolean;
};

export function DefenseTopBar({
  title,
  group,
  timer,
  totalTime,
  timerActive,
  isChair,
  groupIndex,
  totalGroups,
  room,
  time,
  presentCount,
  totalMembers,
  sessionStarted
}: Props) {
  const pct = Math.min(100, Math.max(0, ((totalTime - timer) / totalTime) * 100));
  const statusLabel = timer === 0 ? 'Ended' : timerActive ? 'Live' : sessionStarted ? 'Paused' : 'Ready';
  const statusClass =
    timer === 0
      ? 'bg-rose-500 shadow-[0_0_10px_rgba(243,110,142,0.8)]'
      : timerActive
        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse'
        : sessionStarted
          ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
          : 'bg-[#f6be00] shadow-[0_0_10px_rgba(246,190,0,0.8)]';

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 shadow-[0_4px_30px_rgba(15,43,89,0.06)] backdrop-blur-2xl">
      <div className="flex min-h-20 flex-col gap-4 px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between relative">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/adviser/panel-mode/dashboard"
            className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-white bg-white/80 text-[#536982] shadow-[0_2px_10px_rgba(15,43,89,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:text-[#003a8f] hover:shadow-[0_8px_20px_rgba(15,43,89,0.08)]"
            aria-label="Exit live defense"
            title="Exit"
          >
            <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#003a8f] to-[#082a67] text-white shadow-[0_8px_20px_rgba(0,58,143,0.2)] sm:flex relative overflow-hidden">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
            <i className={`fas fa-tower-broadcast relative z-10 ${timerActive ? 'animate-pulse text-[#f6be00]' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/50 bg-blue-50/80 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-widest text-[#003a8f] shadow-sm backdrop-blur-sm">
                <span className={`h-1.5 w-1.5 rounded-full ${statusClass}`} />
                {statusLabel}
              </span>
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">
                Group {groupIndex + 1} of {totalGroups}
              </span>
            </div>
            <h1 className="truncate text-[1.1rem] font-black tracking-tight text-[#102033] sm:text-[1.25rem]">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] font-bold tracking-wide text-[#536982]">
              <span className="inline-flex items-center gap-1.5"><i className="fas fa-users text-[#003a8f]/60" /> {group}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              <span className="inline-flex items-center gap-1.5"><i className="fas fa-clock text-[#003a8f]/60" /> {time}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              <span className="inline-flex items-center gap-1.5"><i className="fas fa-location-dot text-[#003a8f]/60" /> {room}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 lg:justify-end">
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex flex-col justify-center rounded-[1rem] border border-white bg-white/60 px-4 py-2 shadow-[0_2px_10px_rgba(15,43,89,0.03)] backdrop-blur-sm transition-colors hover:border-blue-100">
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Role</p>
              <p className="mt-0.5 text-[0.8rem] font-black text-[#102033]">
                {isChair ? 'Panel Chair' : 'Panel Member'}
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-[1rem] border border-white bg-white/60 px-4 py-2 shadow-[0_2px_10px_rgba(15,43,89,0.03)] backdrop-blur-sm transition-colors hover:border-blue-100">
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Attendance</p>
              <p className="mt-0.5 text-[0.8rem] font-black text-[#102033]">
                {presentCount}/{totalMembers} <span className="text-[#536982] font-semibold">present</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
