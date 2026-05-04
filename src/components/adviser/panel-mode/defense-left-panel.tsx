'use client';

import { getInitials } from './live-defense-logic';

type Panelist = { id: string; name: string; department: string; role: string; status: string; isMe: boolean };
type Props = {
  group: string;
  adviser: string;
  members: string[];
  leader: string;
  attendance: Record<string, boolean>;
  panelists: Panelist[];
  focusMode: boolean;
  room: string;
  program: string;
  time: string;
  isChair?: boolean;
  onToggleAttendance?: (name: string) => void;
};

export function DefenseLeftPanel({
  group,
  adviser,
  members,
  leader,
  attendance,
  panelists,
  focusMode,
  room,
  program,
  time,
  isChair,
  onToggleAttendance
}: Props) {
  if (focusMode) return null;

  const presentCount = members.filter((member) => attendance[member] !== false).length;
  const attendancePct = members.length ? (presentCount / members.length) * 100 : 0;

  return (
    <aside
      className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-r border-white/10 text-sm text-white shadow-[18px_0_38px_rgba(15,23,42,0.18)] xl:flex"
      style={{
        background:
          'linear-gradient(180deg, rgba(26, 24, 81, 0.98) 0%, rgba(0, 44, 107, 0.98) 72%, rgba(0, 58, 143, 0.98) 100%)'
      }}
    >
      <div className="border-b border-white/10 p-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-[rgba(246,190,0,0.22)] bg-[rgba(246,190,0,0.12)] text-brand-accent">
          <i className="fas fa-scale-balanced" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/60">{program}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{group}</h2>
        <div className="mt-4 space-y-2.5 text-xs font-semibold text-blue-100/70">
          <div className="flex items-center gap-2">
            <i className="fas fa-location-dot w-4 text-brand-accent" />
            <span>{room}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-clock w-4 text-brand-accent" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-user-tie w-4 text-brand-accent" />
            <span className="truncate">{adviser}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-200/70">Attendance</h3>
            <p className="mt-1 text-xs font-semibold text-blue-100/60">
              {presentCount} of {members.length} members present
            </p>
          </div>
          <span className="rounded-full border border-[rgba(246,190,0,0.28)] bg-[rgba(246,190,0,0.12)] px-2.5 py-1 text-xs font-black text-brand-accent">
            {Math.round(attendancePct)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand-accent transition-all" style={{ width: `${attendancePct}%` }} />
        </div>
      </div>

      <div className="flex-1 border-b border-white/10 p-5">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-200/70">Group Members</h3>
        <div className="space-y-2">
          {members.map((name) => {
            const isLeader = name === leader;
            const present = attendance[name] !== false;

            return (
              <button
                key={name}
                type="button"
                disabled={!isChair}
                onClick={() => onToggleAttendance?.(name)}
                className={`flex w-full items-center gap-3 rounded-[0.95rem] border p-2.5 text-left transition-colors ${
                  present
                    ? 'border-white/10 bg-white/[0.08] hover:bg-white/[0.12]'
                    : 'border-rose-300/30 bg-rose-500/10 hover:bg-rose-500/20'
                } ${isChair ? 'cursor-pointer' : 'cursor-default'}`}
                aria-pressed={present}
              >
                <div className="relative shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-[0.85rem] text-xs font-black ${
                      isLeader ? 'bg-brand-accent text-brand-dark' : 'bg-white/10 text-white'
                    }`}
                  >
                    {isLeader ? <i className="fas fa-crown text-[11px]" /> : getInitials(name)}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#002c6b] ${
                      present ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-bold ${present ? 'text-white' : 'text-rose-100'}`}>{name}</p>
                  <p className="text-xs font-semibold text-blue-100/55">
                    {isLeader ? 'Leader' : 'Member'} &bull; {present ? 'Present' : 'Absent'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-200/70">Panel</h3>
        <div className="space-y-2">
          {panelists.map((panelist) => (
            <div key={panelist.id} className="rounded-[0.95rem] border border-white/10 bg-white/[0.08] p-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] text-xs font-black ${
                    panelist.isMe ? 'bg-brand-accent text-brand-dark' : 'bg-white/10 text-blue-100'
                  }`}
                >
                  {panelist.isMe ? getInitials(panelist.name) : <i className="fas fa-chalkboard-user" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-white">
                    {panelist.name}
                    {panelist.isMe ? ' (You)' : ''}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-blue-100/55">{panelist.department}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                    panelist.role === 'Panel Chair'
                      ? 'bg-[rgba(246,190,0,0.14)] text-brand-accent'
                      : 'bg-white/10 text-blue-100/70'
                  }`}
                >
                  {panelist.role === 'Panel Chair' ? 'Chair' : 'Member'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {panelist.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
