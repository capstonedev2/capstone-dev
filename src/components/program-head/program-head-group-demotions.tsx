'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ProgramHeadButton,
  ProgramHeadDrawer,
  ProgramHeadStatCard,
  ProgramHeadStatusBadge
} from '@/components/program-head/program-head-primitives';
import { ProgramHeadShell } from '@/components/program-head/program-head-shell';
import type { ProgramHeadStatusTone } from '@/components/program-head/program-head-data';

type DemotionRequest = {
  id: string;
  groupId: string;
  groupCode: string;
  groupTitle: string;
  department: string;
  progress: number;
  projectId: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
};

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;

function statusTone(status: DemotionRequest['status']): ProgramHeadStatusTone {
  if (status === 'PENDING') return 'pending';
  if (status === 'APPROVED') return 'danger';
  return 'muted';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(
    new Date(value)
  );
}

export function ProgramHeadGroupDemotions() {
  const [requests, setRequests] = useState<DemotionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('PENDING');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadRequests() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch('/api/groups/demotion-requests', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load demotion requests.');
      }

      setRequests(payload?.requests ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load demotion requests.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(
    () => (statusFilter === 'ALL' ? requests : requests.filter((item) => item.status === statusFilter)),
    [requests, statusFilter]
  );

  const selected = requests.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setReviewNotes('');
  }, [selectedId]);

  const pendingCount = requests.filter((item) => item.status === 'PENDING').length;
  const approvedCount = requests.filter((item) => item.status === 'APPROVED').length;
  const rejectedCount = requests.filter((item) => item.status === 'REJECTED').length;

  async function submitDecision(decision: 'approve' | 'reject') {
    if (!selected) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/groups/demotion-requests/${selected.id}/${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to record your decision.');
      }

      setSelectedId(null);
      await loadRequests();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to record your decision.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProgramHeadShell
      activeNav="group-demotions"
      title="Demotion Requests"
      description="Review advisers' requests to reset a group and require a new title before it takes effect."
      notificationCount={pendingCount}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ProgramHeadStatCard title="Awaiting Your Review" value={pendingCount} icon="fas fa-hourglass-half" />
        <ProgramHeadStatCard title="Approved" value={approvedCount} icon="fas fa-rotate-left" />
        <ProgramHeadStatCard title="Declined" value={rejectedCount} icon="fas fa-ban" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              statusFilter === filter
                ? 'bg-[#0F3DDE] text-white shadow-md'
                : 'bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--border)] hover:bg-[var(--surface-alt)]'
            }`}
          >
            {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loadError ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <i className="fas fa-circle-exclamation mr-2" />
          {loadError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-[var(--surface)] shadow-[0_4px_20px_rgb(0,0,0,0.03)] ring-1 ring-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-left text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
              <th className="px-5 py-3.5">Group</th>
              <th className="px-5 py-3.5">Requested By</th>
              <th className="px-5 py-3.5">Reason</th>
              <th className="px-5 py-3.5">Requested</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-[var(--muted)]">
                  Loading demotion requests...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-[var(--muted)]">
                  No requests match this filter.
                </td>
              </tr>
            ) : (
              filteredRequests.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-alt)]/60">
                  <td className="px-5 py-4">
                    <p className="font-bold text-[var(--text)]">{item.groupCode}</p>
                    <p className="text-xs text-[var(--muted)]">{item.groupTitle}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[var(--text)]">{item.requestedBy}</td>
                  <td className="px-5 py-4 max-w-[280px] truncate text-[var(--muted)]" title={item.reason}>
                    {item.reason}
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">{formatDate(item.requestedAt)}</td>
                  <td className="px-5 py-4">
                    <ProgramHeadStatusBadge tone={statusTone(item.status)}>{item.status}</ProgramHeadStatusBadge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ProgramHeadButton variant="outline" onClick={() => setSelectedId(item.id)}>
                      Review
                    </ProgramHeadButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProgramHeadDrawer open={Boolean(selected)} title="Demotion Request" onClose={() => setSelectedId(null)} maxWidth={560}>
        {selected ? (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Group</p>
              <p className="mt-1 text-lg font-bold text-[var(--text)]">{selected.groupCode}</p>
              <p className="text-sm text-[var(--muted)]">{selected.groupTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Department</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selected.department}</p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Progress at Request</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selected.progress}%</p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Requested By</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selected.requestedBy}</p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Requested At</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{formatDate(selected.requestedAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Reason</p>
              <p className="mt-1 rounded-xl bg-[var(--surface-alt)] p-4 text-sm font-medium leading-relaxed text-[var(--text)]">
                {selected.reason}
              </p>
            </div>

            {selected.status === 'PENDING' ? (
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
                  Review Notes <span className="normal-case font-semibold">(optional)</span>
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Add context for the adviser and student..."
                  className="mt-2 h-24 w-full resize-none rounded-xl bg-[var(--surface-alt)] p-4 text-sm font-medium text-[var(--text)] outline-none ring-1 ring-[var(--border)] focus:ring-2 focus:ring-[#0F3DDE]"
                />
                <div className="mt-4 flex gap-3">
                  <ProgramHeadButton variant="danger" onClick={() => submitDecision('approve')} disabled={isSubmitting}>
                    <i className="fas fa-rotate-left mr-2" />
                    Approve Reset
                  </ProgramHeadButton>
                  <ProgramHeadButton variant="outline" onClick={() => submitDecision('reject')} disabled={isSubmitting}>
                    Decline
                  </ProgramHeadButton>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
                  Reviewed by {selected.reviewedBy} on {selected.reviewedAt ? formatDate(selected.reviewedAt) : '—'}
                </p>
                {selected.reviewNotes ? (
                  <p className="mt-2 rounded-xl bg-[var(--surface-alt)] p-4 text-sm font-medium leading-relaxed text-[var(--text)]">
                    {selected.reviewNotes}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </ProgramHeadDrawer>
    </ProgramHeadShell>
  );
}
