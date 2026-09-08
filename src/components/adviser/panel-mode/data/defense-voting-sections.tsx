'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DEFENSE_VOTING_STATUS_FILTER_OPTIONS,
  artifactTone,
  formatScheduleDate,
  getInitials,
  getVotingStatusMeta,
  type DefenseVotingRecord,
  type DefenseVotingStatusFilter
} from './defense-voting-data';

type DefenseVotingFiltersProps = {
  statusFilter: DefenseVotingStatusFilter;
  searchValue: string;
  onStatusChange: (value: DefenseVotingStatusFilter) => void;
  onSearchChange: (value: string) => void;
};

export function DefenseVotingFilters({ statusFilter, searchValue, onStatusChange, onSearchChange }: DefenseVotingFiltersProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-6 shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-blue-500 to-cyan-400 opacity-20" />
      <div className="grid gap-3 sm:grid-cols-[minmax(190px,1fr)_minmax(280px,1.6fr)]">
        <select
          className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 text-xs font-bold text-[var(--text)] shadow-sm outline-none transition-all hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10 appearance-none cursor-pointer"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value as DefenseVotingStatusFilter)}
        >
          {DEFENSE_VOTING_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--muted)]">
            <i className="fas fa-search text-sm" />
          </span>
          <input
            className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] pl-11 pr-4 text-sm font-bold text-[var(--text)] shadow-sm outline-none transition-all placeholder:font-medium placeholder:text-[var(--muted)] hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10"
            placeholder="Search project or group"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}

export function DefenseVotingList({
  records,
  onViewDetails
}: {
  records: DefenseVotingRecord[];
  onViewDetails: (record: DefenseVotingRecord) => void;
}) {
  const awaitingCount = records.filter((record) => record.votingStatus === 'awaiting-vote').length;
  const decidedCount = records.filter((record) => ['passed', 'needs-redefense', 'tie'].includes(record.votingStatus)).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 text-brand ring-1 ring-brand/20 shadow-sm">
            <i className="fas fa-check-to-slot text-lg" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--text)]">Assigned Defenses</h2>
            <p className="mt-1 text-sm font-medium text-[var(--muted)]">
              Open a defense to review the group and cast your Approve/Reject vote.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            <i className="fas fa-list-check text-[10px] opacity-50" />
            {records.length} defense{records.length === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-inset ring-amber-100">
            <i className="fas fa-hourglass-half text-[10px]" />
            {awaitingCount} awaiting your vote
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <i className="fas fa-check text-[10px]" />
            {decidedCount} decided
          </span>
        </div>
      </div>

      {records.length ? (
        <div className="space-y-4">
          {records.map((record) => (
            <DefenseVotingCard key={record.id} record={record} onViewDetails={onViewDetails} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

export function DefenseVotingCard({
  record,
  onViewDetails
}: {
  record: DefenseVotingRecord;
  onViewDetails: (record: DefenseVotingRecord) => void;
}) {
  const statusMeta = getVotingStatusMeta(record.votingStatus);
  const buttonLabel = record.myVote === 'pending' ? 'Review & Vote' : 'View Result';

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-brand to-blue-400 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)_220px] xl:items-stretch">
        <div className="min-w-0 pl-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-brand-dark">
              {record.scheduleType}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-sm ${statusMeta.badgeClassName}`}>
              <i className={`fas ${statusMeta.icon} text-[10px]`} />
              {statusMeta.label}
            </span>
            {record.isChair && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                <i className="fas fa-user-shield text-[10px]" /> You&apos;re Chair
              </span>
            )}
          </div>

          <h3 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[var(--text)] transition-colors group-hover:text-brand">
            {record.projectTitle}
          </h3>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-blue-700 ring-1 ring-inset ring-blue-100">
              <i className="fas fa-users-rectangle opacity-70" /> {record.groupCode}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-calendar-day opacity-60" />
              {formatScheduleDate(record.date)} &bull; {record.time}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-location-dot opacity-60" />
              {record.room}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/80">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <i className="fas fa-user-group text-blue-500" /> Panel Votes
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {record.panelists.map((panelist) => (
              <span
                key={panelist.id}
                title={`${panelist.name} — ${panelist.voteStatus === 'pending' ? 'Pending' : panelist.voteStatus === 'yes' ? 'Approved' : 'Rejected'}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ${
                  panelist.voteStatus === 'yes'
                    ? 'bg-emerald-500 text-white'
                    : panelist.voteStatus === 'no'
                      ? 'bg-rose-500 text-white'
                      : panelist.isMe
                        ? 'bg-brand text-white'
                        : 'bg-slate-200 text-slate-500'
                }`}
              >
                {getInitials(panelist.name)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">{record.panelists.length} panelist{record.panelists.length === 1 ? '' : 's'} assigned</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand">
              <i className="fas fa-route" /> Your Status
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
              {record.isMyAdvisee
                ? "You're this group's adviser — voting is disabled."
                : record.myVote === 'pending'
                  ? 'You have not cast your vote yet.'
                  : record.myVote === 'yes'
                    ? 'You approved this defense.'
                    : 'You voted for re-defense.'}
            </p>
          </div>
          <button
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-white shadow-md shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lg"
            type="button"
            onClick={() => onViewDetails(record)}
          >
            <i className="fas fa-up-right-from-square text-xs" /> {record.isMyAdvisee ? 'View Details' : buttonLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-50 to-blue-50/40 px-6 py-16 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)] border border-slate-100/50">
      <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-brand/10 to-brand/5 text-brand shadow-sm">
        <i className="fas fa-check-to-slot text-2xl" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-[var(--text-dark)]">No defenses match this view</h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-light)]">
        You have no assigned defense schedules matching the current filters. You&apos;ll be notified when the Program Head assigns you to a panel.
      </p>
    </div>
  );
}

type DefenseVoteDrawerProps = {
  record: DefenseVotingRecord | null;
  remarksDraft: string;
  onRemarksChange: (value: string) => void;
  onClose: () => void;
  onCastVote: (record: DefenseVotingRecord, vote: 'yes' | 'no') => Promise<void> | void;
  onChairDecision: (record: DefenseVotingRecord, decision: 'redefense' | 'new_title', remarks: string) => Promise<void> | void;
  isSubmitting: boolean;
};

export function DefenseVoteDrawer({ record, remarksDraft, onRemarksChange, onClose, onCastVote, onChairDecision, isSubmitting }: DefenseVoteDrawerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [pendingVote, setPendingVote] = useState<'yes' | 'no' | null>(null);
  const [pendingChairDecision, setPendingChairDecision] = useState<'redefense' | 'new_title' | null>(null);
  const [chairRemarks, setChairRemarks] = useState('');

  useEffect(() => setIsMounted(true), []);
  useEffect(() => setPendingVote(null), [record?.id]);
  useEffect(() => {
    setPendingChairDecision(null);
    setChairRemarks('');
  }, [record?.id]);
  useEffect(() => {
    document.body.style.overflow = record ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [record]);
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!record || !isMounted) return null;

  const hasVoted = record.myVote !== 'pending';
  const yesCount = record.panelists.filter((p) => p.voteStatus === 'yes').length;
  const noCount = record.panelists.filter((p) => p.voteStatus === 'no').length;
  const totalVoted = yesCount + noCount;
  const allVoted = totalVoted === record.panelists.length;
  const majority = yesCount > noCount ? 'passed' : noCount > yesCount ? 'not-passed' : null;
  const statusMeta = getVotingStatusMeta(record.votingStatus);

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        aria-label="Defense vote modal"
        aria-modal="true"
        role="dialog"
        className="flex max-h-full w-full max-w-[880px] flex-col overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-white/60"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="relative shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand">
                <i className="fas fa-gavel opacity-70" /> {record.scheduleType}
              </p>
              <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900 leading-tight">{record.projectTitle}</h2>
            </div>
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none"
              type="button"
              onClick={onClose}
            >
              <i className="fas fa-xmark text-lg" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200/60">
              <i className="fas fa-users-rectangle text-[10px]" /> {record.groupCode}
            </span>
            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200/80">
              {formatScheduleDate(record.date)} &bull; {record.time} &bull; {record.room}
            </span>
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ring-1 ring-inset ring-current/20 ${statusMeta.badgeClassName}`}>
              {statusMeta.label}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-4 py-5 sm:px-8 sm:py-6 custom-scrollbar">
          {record.isMyAdvisee ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-300 bg-white text-2xl text-amber-700">
                <i className="fas fa-user-lock" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Adviser Conflict</h3>
              <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-600">
                You are the adviser for this group. Policy prevents you from voting on your own advisees.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Group Members</p>
                <div className="space-y-1.5">
                  {record.students.map((student) => (
                    <div key={student} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                        {getInitials(student)}
                      </span>
                      <span className="truncate text-sm font-bold text-slate-800">{student}</span>
                      {student === record.leader && (
                        <span className="ml-auto shrink-0 text-[0.6rem] font-black uppercase tracking-widest text-brand-dark">
                          <i className="fas fa-crown mr-1 text-brand-accent" />Leader
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Defense Packet</p>
                <div className="flex flex-wrap gap-2">
                  {record.artifacts.map((artifact) => (
                    <span key={artifact.label} className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${artifactTone(artifact.status)}`}>
                      {artifact.label}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <label className="mb-2.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand">
                  <i className="fas fa-comment-dots" />
                  Panel Remarks <span className="font-bold normal-case tracking-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  disabled={hasVoted}
                  value={remarksDraft}
                  onChange={(event) => onRemarksChange(event.target.value)}
                  placeholder="Notes for the record, required revisions, or feedback for the presenters..."
                  className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </section>

              {!hasVoted && (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Does this presentation pass?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingVote('yes')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3.5 text-[0.85rem] font-black transition-all ${
                        pendingVote === 'yes'
                          ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-500 ring-offset-2'
                          : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                      }`}
                    >
                      <i className="fas fa-thumbs-up" />
                      Approve (Pass)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingVote('no')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3.5 text-[0.85rem] font-black transition-all ${
                        pendingVote === 'no'
                          ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-500 ring-offset-2'
                          : 'border border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600'
                      }`}
                    >
                      <i className="fas fa-thumbs-down" />
                      Reject (Re-Defense)
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!pendingVote || isSubmitting}
                    onClick={() => pendingVote && onCastVote(record, pendingVote)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <i className={`fas ${isSubmitting ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'}`} />
                    {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                  </button>
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Panel Vote Summary</p>
                  <span className="text-[0.65rem] font-black text-slate-500">{totalVoted}/{record.panelists.length} voted</span>
                </div>

                <div className="mb-4 space-y-2">
                  {record.panelists.map((panelist) => {
                    const canSeeVote = record.isChair || panelist.isMe;
                    return (
                      <div key={panelist.id} className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors ${panelist.isMe ? 'bg-brand/5 ring-1 ring-brand/10' : ''}`}>
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-black ${panelist.isMe ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {getInitials(panelist.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-[0.75rem] font-bold text-slate-900">{panelist.name}</span>
                          {panelist.isMe && <span className="text-[0.55rem] font-black uppercase tracking-wider text-brand">You</span>}
                        </div>
                        {canSeeVote ? (
                          <span className={`flex h-7 items-center justify-center rounded-md px-3 text-[0.65rem] font-black ${
                            panelist.voteStatus === 'yes' ? 'bg-emerald-100 text-emerald-700' : panelist.voteStatus === 'no' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {panelist.voteStatus === 'yes' ? <><i className="fas fa-thumbs-up mr-1" />Yes</> : panelist.voteStatus === 'no' ? <><i className="fas fa-thumbs-down mr-1" />No</> : 'Pending'}
                          </span>
                        ) : (
                          <span className={`flex h-7 items-center justify-center rounded-md px-3 text-[0.65rem] font-black ${panelist.voteStatus !== 'pending' ? 'bg-brand/10 text-brand' : 'bg-slate-200 text-slate-400'}`}>
                            {panelist.voteStatus !== 'pending' ? <><i className="fas fa-check-circle mr-1" />Voted</> : 'Pending'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                    {totalVoted > 0 && (
                      <>
                        <div className="h-full float-left bg-emerald-500 transition-all duration-300" style={{ width: `${(yesCount / record.panelists.length) * 100}%` }} />
                        <div className="h-full float-right bg-rose-500 transition-all duration-300" style={{ width: `${(noCount / record.panelists.length) * 100}%` }} />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[0.7rem] font-black">
                  <span className="text-emerald-600"><i className="fas fa-thumbs-up mr-1" />{yesCount} Yes</span>
                  <span className="text-rose-600"><i className="fas fa-thumbs-down mr-1" />{noCount} No</span>
                </div>

                {allVoted && majority && (
                  <div className={`mt-4 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-[0.85rem] font-black ${
                    majority === 'passed' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700'
                  }`}>
                    <i className={`fas ${majority === 'passed' ? 'fa-trophy' : 'fa-rotate-left'}`} />
                    {majority === 'passed' ? 'Verdict: PASSED — Stage Complete' : 'Verdict: NOT PASSED — Re-Defense'}
                  </div>
                )}
                {allVoted && !majority && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-3 text-[0.85rem] font-black text-amber-700">
                    <i className="fas fa-scale-balanced" />
                    Verdict: TIE — Chair Decides
                  </div>
                )}
                {!allVoted && (
                  <p className="mt-3 text-center text-[0.65rem] font-bold text-amber-600">
                    <i className="fas fa-triangle-exclamation mr-1" />
                    Waiting on the remaining panelists to vote.
                  </p>
                )}
              </section>

              {allVoted && majority !== 'passed' && (
                record.chairDecision ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Chair Decision</p>
                    <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-black ${
                      record.chairDecision === 'REDEFENSE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <i className={`fas ${record.chairDecision === 'REDEFENSE' ? 'fa-rotate-left' : 'fa-file-circle-exclamation'}`} />
                      {record.chairDecision === 'REDEFENSE' ? 'Redefense — Revise & Continue' : 'Requires New Title'}
                    </div>
                    {record.chairDecisionRemarks && (
                      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{record.chairDecisionRemarks}</p>
                    )}
                  </section>
                ) : record.isChair ? (
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Chair Decision — What happens next?</p>
                    <p className="mb-4 text-xs font-medium leading-relaxed text-slate-500">
                      The panel did not pass this defense. Record whether the student should revise and re-attempt this same title, or must submit an entirely new one.
                    </p>
                    <div className="mb-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingChairDecision('redefense')}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-[0.8rem] font-black transition-all ${
                          pendingChairDecision === 'redefense'
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
                            : 'border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        <i className="fas fa-rotate-left" />
                        Redefense
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingChairDecision('new_title')}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-[0.8rem] font-black transition-all ${
                          pendingChairDecision === 'new_title'
                            ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-600 ring-offset-2'
                            : 'border border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600'
                        }`}
                      >
                        <i className="fas fa-file-circle-exclamation" />
                        Requires New Title
                      </button>
                    </div>
                    <textarea
                      value={chairRemarks}
                      onChange={(event) => setChairRemarks(event.target.value)}
                      placeholder="Explain the panel's decision for the student..."
                      className="mb-4 h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
                    />
                    <button
                      type="button"
                      disabled={!pendingChairDecision || isSubmitting}
                      onClick={() => pendingChairDecision && onChairDecision(record, pendingChairDecision, chairRemarks)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <i className={`fas ${isSubmitting ? 'fa-circle-notch animate-spin' : 'fa-gavel'}`} />
                      {isSubmitting ? 'Recording...' : 'Record Decision'}
                    </button>
                  </section>
                ) : (
                  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                    <p className="text-xs font-bold text-amber-700">
                      <i className="fas fa-hourglass-half mr-1.5" />
                      Waiting on the panel chair to decide: redefense or new title.
                    </p>
                  </section>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
