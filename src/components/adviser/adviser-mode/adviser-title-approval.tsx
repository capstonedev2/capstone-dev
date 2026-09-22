'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive, getShortName, getToastIcon } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import {
  EvidenceQueueList,
  EvidenceReviewDrawer,
  GroupReviewList,
  OtherDocumentsQueueList,
  TitleDetailsDrawer,
  TitleFilters,
  TitleSummaryCards,
  type DefenseApplicationStageKey,
  type OtherDocumentsGroup,
  type TitleSummaryMetric
} from '@/components/adviser/adviser-mode/data/title-workspace-sections';
import {
  TITLE_SORT_OPTIONS,
  TITLE_STATUS_FILTER_OPTIONS,
  getAcademicYearOptions,
  getDefaultActionForStatus,
  sortTitleRecords,
  type AdviserTitleRecord,
  type TitleSortOption,
  type TitleStatus
} from '@/components/adviser/adviser-mode/data/title-workspace-data';
import { getAdviserReviewQueueFiles } from '@/components/adviser/adviser-mode/data/submission-workspace-data';
import type { DocumentFileSummary } from '@/components/documents/document-file-controls';
import { DOCUMENT_STORAGE_BUCKETS } from '@/lib/storage/upload-config';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

const EVIDENCE_REVIEW_FIELD_BY_CHECKPOINT_KEY: Record<DefenseApplicationStageKey, 'evidenceReview' | 'proposalEvidenceReview' | 'finalEvidenceReview'> = {
  'concept-defense-application': 'evidenceReview',
  'proposal-defense-application': 'proposalEvidenceReview',
  'final-defense-application': 'finalEvidenceReview'
};

// Student-saved "backup titles" (see /api/title-drafts) are auto-sent here for
// review the moment a student saves or edits one — independent of whether
// they're ever actually used. Approving one doesn't make it "the" project
// title; it just clears that specific idea, so a later replacement-title
// submission built from it can skip a second review cycle (see
// POST /api/title-submissions' isPreApprovedSubmission check).
type AdviserBackupTitleDraft = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  updatedAt: string;
  reviewStatus: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION' | 'IN_REVIEW' | 'NOT_REQUIRED';
  reviewFeedback: string | null;
  reviewedAt: string | null;
  isPriority: boolean;
  groupId: string;
  groupCode: string | null;
  groupTitle: string | null;
  groupMembers: Array<{ name: string; isLeader: boolean }>;
  updatedByName: string | null;
  files: Array<{ id: string; name: string; url: string; fileType: string; size: number | null }>;
};

const BACKUP_FILE_OFFICE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
const BACKUP_FILE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

function getBackupFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function getBackupFileIcon(fileName: string) {
  const extension = getBackupFileExtension(fileName);
  if (extension === 'pdf') return 'fa-file-pdf';
  if (['doc', 'docx'].includes(extension)) return 'fa-file-word';
  if (['xls', 'xlsx'].includes(extension)) return 'fa-file-excel';
  if (['ppt', 'pptx'].includes(extension)) return 'fa-file-powerpoint';
  if (BACKUP_FILE_IMAGE_EXTENSIONS.includes(extension)) return 'fa-file-image';
  return 'fa-file-lines';
}

// Combined preview + decision modal — same visual pattern as the real Title
// review's document modal (signed URL + Google Docs viewer for office
// formats), plus a decision aside like the real title/evidence review
// drawers. Supports switching between files when a backup has more than one;
// the decision itself always covers the whole backup, not a single file.
function BackupDecisionModal({
  draft,
  isSaving,
  onClose,
  onDecide
}: {
  draft: AdviserBackupTitleDraft;
  isSaving: boolean;
  onClose: () => void;
  onDecide: (draft: AdviserBackupTitleDraft, decision: 'approve' | 'needs_revision', feedback: string) => void;
}) {
  const files = draft.files || [];
  const [isMounted, setIsMounted] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(files[0]?.id ?? null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const activeFile = files.find((file) => file.id === activeFileId) ?? null;

  useEffect(() => setIsMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.removeProperty('overflow'); };
  }, []);

  useEffect(() => {
    if (!activeFile) {
      setSignedUrl(null);
      return;
    }

    let cancelled = false;
    setSignedUrl(null);
    setPreviewError(null);

    (async () => {
      try {
        const response = await fetch(`/api/title-drafts/files/${activeFile.id}/signed-url`, { method: 'POST' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || payload?.error || 'Unable to prepare document preview.');
        }

        if (!cancelled) {
          setSignedUrl(payload.signedUrl);
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : 'Unable to prepare document preview.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeFile]);

  if (!isMounted) {
    return null;
  }

  const extension = activeFile ? getBackupFileExtension(activeFile.name) : '';
  const isOfficeFile = BACKUP_FILE_OFFICE_EXTENSIONS.includes(extension);
  const isImageFile = BACKUP_FILE_IMAGE_EXTENSIONS.includes(extension);
  const previewUrl = signedUrl
    ? isOfficeFile
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`
      : signedUrl
    : null;
  const downloadHref = activeFile ? `/api/title-drafts/files/${activeFile.id}/download` : null;

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        aria-label="Backup title review"
        aria-modal="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-[1560px] flex-col overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-white/60"
      >
        <header className="relative shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]">
                <i className="fas fa-bookmark opacity-70" aria-hidden="true" /> Backup Title Review
              </p>
              <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900 leading-tight" title={draft.title}>
                &quot;{draft.title}&quot;
              </h2>
            </div>
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none"
              type="button"
              onClick={onClose}
            >
              <i className="fas fa-xmark text-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200/80">
              {draft.groupCode || draft.groupTitle || 'Group'}
            </span>
            {draft.updatedByName ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200/60">
                <i className="fas fa-user text-[10px]" aria-hidden="true" /> {draft.updatedByName}
              </span>
            ) : null}
            {draft.isPriority ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200/60">
                <i className="fas fa-star text-[10px]" aria-hidden="true" /> Student&apos;s Best Pick
              </span>
            ) : null}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-4 py-4 sm:px-6 sm:py-6 custom-scrollbar">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0 space-y-5">
              {draft.description || draft.keywords.length > 0 ? (
                <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--primary)]">Description</p>
                  {draft.description ? (
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{draft.description}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-slate-400">No description provided.</p>
                  )}
                  {draft.keywords.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {draft.keywords.map((keyword) => (
                        <span key={keyword} className="inline-flex items-center rounded-full bg-[var(--primary)]/5 px-2.5 py-1 text-[11px] font-bold text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/15">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--primary)]">
                      {extension ? extension.toUpperCase() : 'FILE'} Preview
                    </p>
                    <h3 className="mt-1 truncate text-lg font-black text-slate-950">
                      {activeFile ? activeFile.name : 'No files attached'}
                    </h3>
                  </div>
                  {activeFile ? (
                    <div className="flex items-center gap-2">
                      <a
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[var(--primary)] transition hover:bg-[var(--primary)]/5"
                        href={previewUrl || downloadHref || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="fas fa-up-right-from-square text-[10px]" aria-hidden="true" />
                        Open
                      </a>
                      <a
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[var(--primary)] transition hover:bg-[var(--primary)]/5"
                        href={downloadHref || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="fas fa-download text-[10px]" aria-hidden="true" />
                        Download
                      </a>
                    </div>
                  ) : null}
                </div>

                {files.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50/60 p-3">
                    {files.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => setActiveFileId(file.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                          file.id === activeFileId
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--primary)]/40'
                        }`}
                      >
                        <i className={`fas ${getBackupFileIcon(file.name)}`} aria-hidden="true" />
                        <span className="max-w-[140px] truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="bg-slate-100 p-3 sm:p-4">
                  {!activeFile ? (
                    <div className="flex h-[min(55vh,600px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-center">
                      <i className="fas fa-paperclip text-2xl text-slate-300" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-500">No files attached to this backup</p>
                    </div>
                  ) : previewError ? (
                    <div className="flex h-[min(55vh,600px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-center">
                      <i className="fas fa-triangle-exclamation text-2xl text-amber-500" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-600">{previewError}</p>
                      <p className="text-xs text-slate-400">Use Download instead.</p>
                    </div>
                  ) : previewUrl && isImageFile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt={activeFile.name}
                      className="mx-auto h-[min(55vh,600px)] w-full rounded-xl border border-slate-200 bg-white object-contain"
                    />
                  ) : previewUrl ? (
                    <iframe
                      className="h-[min(55vh,600px)] w-full rounded-xl border border-slate-200 bg-white"
                      src={previewUrl}
                      title={`${activeFile.name} preview`}
                    />
                  ) : (
                    <div className="flex h-[min(55vh,600px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white">
                      <i className="fas fa-spinner fa-spin text-2xl text-[var(--primary)]" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-500">Preparing preview...</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-5 self-start xl:sticky xl:top-0">
              <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-5 text-white">
                  <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-blue-100">
                    <i className="fas fa-clipboard-check" /> Backup Decision
                  </p>
                  <h3 className="mt-1 text-lg font-black">Ready for Decision</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-blue-100">
                    Approving doesn&apos;t make this the project title — it just clears this idea, so the student can use it instantly if a new title is ever required.
                  </p>
                </div>

                <div className="p-5">
                  <label className="block">
                    <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-blue-700">
                      <i className="fas fa-comment-dots" /> Feedback
                    </span>
                    <textarea
                      className="mt-3 min-h-[130px] w-full rounded-xl border border-blue-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Notes for the student (optional)..."
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                    />
                  </label>

                  <div className="mt-4 grid gap-3">
                    <button
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-lg focus:outline-none disabled:opacity-50"
                      type="button"
                      disabled={isSaving}
                      onClick={() => onDecide(draft, 'approve', feedback)}
                    >
                      <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-check'}`} /> Approve
                    </button>
                    <button
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-6 text-sm font-black text-amber-700 shadow-sm ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 hover:ring-amber-300 focus:outline-none disabled:opacity-50"
                      type="button"
                      disabled={isSaving}
                      onClick={() => onDecide(draft, 'needs_revision', feedback)}
                    >
                      <i className="fas fa-rotate-left" /> Request Revision
                    </button>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BackupTitleDraftsQueueList({
  drafts,
  isLoading,
  savingId,
  onDecide
}: {
  drafts: AdviserBackupTitleDraft[];
  isLoading: boolean;
  savingId: string | null;
  onDecide: (draft: AdviserBackupTitleDraft, decision: 'approve' | 'needs_revision', feedback: string) => void;
}) {
  if (isLoading || !drafts.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-4 p-6">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-600 ring-1 ring-amber-500/20 shadow-sm">
          <i className="fas fa-bookmark text-lg" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--text)]">Backup Titles Awaiting Review</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Students prepare these in advance as alternates. Approving one lets them use it instantly if a new title is ever required — no second review needed.
          </p>
        </div>
      </div>
      <div className="space-y-4 border-t border-[var(--border)] bg-[var(--surface-alt)]/40 p-6">
        {drafts.map((draft) => (
          <BackupTitleDraftCard key={draft.id} draft={draft} isSaving={savingId === draft.id} onDecide={onDecide} />
        ))}
      </div>
    </section>
  );
}

function BackupTitleDraftCard({
  draft,
  isSaving,
  onDecide
}: {
  draft: AdviserBackupTitleDraft;
  isSaving: boolean;
  onDecide: (draft: AdviserBackupTitleDraft, decision: 'approve' | 'needs_revision', feedback: string) => void;
}) {
  const [isDeciding, setIsDeciding] = useState(false);
  // Defensive against a stale/mid-refetch draft shape (e.g. right after a dev
  // HMR reload swaps in newer component code before the client's already-
  // fetched data has caught up) — these fields should always be present from
  // a fresh API response, but a hard crash here would take down the whole
  // queue over one bad row instead of just that row rendering emptier.
  const files = draft.files || [];
  const groupMembers = draft.groupMembers || [];
  const fileCount = files.length;
  const firstFile = files[0] || null;

  return (
    <article
      className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 cursor-pointer"
      onClick={() => setIsDeciding(true)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)_260px] xl:items-stretch">
        <div className="min-w-0 pl-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)] ring-1 ring-inset ring-[var(--border)] shadow-sm">
              <i className="fas fa-users-rectangle text-[10px]" aria-hidden="true" /> {draft.groupCode || draft.groupTitle || 'Group'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-800 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Awaiting Review
            </span>
            {draft.isPriority ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-300">
                <i className="fas fa-star text-[10px]" aria-hidden="true" /> Best Pick
              </span>
            ) : null}
          </div>

          <h3
            className="mt-4 overflow-hidden text-2xl font-extrabold leading-tight tracking-tight text-[var(--text)] transition-colors group-hover:text-[var(--primary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={draft.title}
          >
            &quot;{draft.title}&quot;
          </h3>

          {draft.description ? (
            <p
              className="mt-3 max-w-4xl overflow-hidden text-sm font-medium leading-relaxed text-[var(--muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              title={draft.description}
            >
              {draft.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-calendar-day opacity-60" aria-hidden="true" />
              {new Date(draft.updatedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </span>
          </div>

          {groupMembers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {groupMembers.slice(0, 4).map((member, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1 ring-inset shadow-sm ${
                    member.isLeader
                      ? 'bg-amber-50 text-amber-700 ring-amber-200/80'
                      : 'bg-white text-slate-600 ring-slate-200/80'
                  }`}
                >
                  <i className={`fas ${member.isLeader ? 'fa-crown text-amber-500' : 'fa-user text-slate-400'} text-[10px]`} aria-hidden="true" />
                  {member.name}
                </span>
              ))}
              {groupMembers.length > 4 ? (
                <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
                  +{groupMembers.length - 4} more
                </span>
              ) : null}
            </div>
          ) : draft.updatedByName ? (
            <p className="mt-3 text-sm font-medium text-slate-500">Last updated by {draft.updatedByName}</p>
          ) : null}

          {draft.keywords.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {draft.keywords.slice(0, 4).map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full bg-[var(--primary)]/5 px-2.5 py-1 text-[11px] font-bold text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/15"
                >
                  #{keyword}
                </span>
              ))}
              {draft.keywords.length > 4 ? (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
                  +{draft.keywords.length - 4} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/80">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <i className="fas fa-star text-amber-500" aria-hidden="true" /> Priority
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black ring-1 ring-inset ${
                  draft.isPriority ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
                }`}
              >
                {draft.isPriority ? "Student's Best Pick" : 'Alternate option'}
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">
              {draft.isPriority ? 'The student flagged this as their top choice.' : 'Not marked as the top choice.'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/80">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <i className="fas fa-paperclip text-blue-500" aria-hidden="true" /> Attached Files
            </p>
            <p className="mt-3 truncate text-sm font-black text-slate-900" title={firstFile?.name || undefined}>
              {firstFile?.name || 'No file attached'}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {fileCount ? `${fileCount} attached file${fileCount === 1 ? '' : 's'}` : 'No uploaded file'}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--primary)]/15 bg-gradient-to-br from-[var(--primary)]/5 via-white to-white p-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--primary)]">
              <i className="fas fa-route" aria-hidden="true" /> Next Step
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">Open preview to approve or request revision.</p>
          </div>
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-white shadow-md shadow-[var(--primary)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--hover)] hover:shadow-lg ring-2 ring-[var(--primary)]/25 ring-offset-2"
            type="button"
            onClick={() => setIsDeciding(true)}
          >
            <i className="fas fa-up-right-from-square text-xs" aria-hidden="true" /> Preview & Decide
          </button>
        </div>
      </div>

      {isDeciding ? (
        <BackupDecisionModal draft={draft} isSaving={isSaving} onClose={() => setIsDeciding(false)} onDecide={onDecide} />
      ) : null}
    </article>
  );
}

export function AdviserTitleApproval({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [titleRecords, setTitleRecords] = useState<AdviserTitleRecord[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TitleStatus | 'all' | 'active'>('active');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<TitleSortOption>('newest');
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [remarksDraft, setRemarksDraft] = useState('');
  const [selectedEvidenceTitleId, setSelectedEvidenceTitleId] = useState<string | null>(null);
  const [otherDocuments, setOtherDocuments] = useState<DocumentFileSummary[]>([]);
  const [isLoadingOtherDocuments, setIsLoadingOtherDocuments] = useState(true);
  const [savingOtherDocumentId, setSavingOtherDocumentId] = useState<string | null>(null);
  const [backupDrafts, setBackupDrafts] = useState<AdviserBackupTitleDraft[]>([]);
  const [isLoadingBackupDrafts, setIsLoadingBackupDrafts] = useState(true);
  const [savingBackupDraftId, setSavingBackupDraftId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const adviserMeta = WORKSPACE_META[workspaceMode];

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Date.now();
    setToast({ id, message, type });

    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }

  useEffect(() => {
    let cancelled = false;

    const loadTitles = async () => {
      setIsLoadingTitles(true);
      setTitleError(null);

      try {
        const response = await fetch('/api/title-submissions?limit=50', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load title submissions.');
        }

        if (!cancelled) {
          setTitleRecords(payload?.titles || []);
        }
      } catch (error) {
        if (!cancelled) {
          setTitleError(error instanceof Error ? error.message : 'Unable to load title submissions.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTitles(false);
        }
      }
    };

    loadTitles();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOtherDocuments = async () => {
      setIsLoadingOtherDocuments(true);

      try {
        const response = await fetch(
          `/api/document-files?bucketName=${DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS}&limit=100`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          return;
        }

        const payload = await response.json();

        if (!cancelled) {
          // getAdviserReviewQueueFiles() is shared with the Document Submissions
          // audit page, which intentionally shows every status — it doesn't filter
          // out already-decided files. This queue's whole purpose is "still
          // pending," so filter that in here too, otherwise a file approved from
          // this section would silently reappear the next time this page loads.
          const pendingOnly = getAdviserReviewQueueFiles(payload.files || []).filter((file) => {
            const status = String(file.submissionStatus || '').toUpperCase();
            return status === 'SUBMITTED' || status === 'UNDER_REVIEW';
          });
          setOtherDocuments(pendingOnly);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOtherDocuments(false);
        }
      }
    };

    loadOtherDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBackupDrafts = async () => {
      setIsLoadingBackupDrafts(true);

      try {
        const response = await fetch('/api/title-drafts/adviser', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (!cancelled) {
          // The endpoint returns every backup regardless of status (useful for
          // a future audit view) — this queue's whole purpose is "still needs
          // action," so only PENDING ones belong here.
          const pendingOnly = (payload.drafts || [])
            .filter((draft: AdviserBackupTitleDraft) => draft.reviewStatus === 'PENDING')
            .sort((a: AdviserBackupTitleDraft, b: AdviserBackupTitleDraft) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
          setBackupDrafts(pendingOnly);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBackupDrafts(false);
        }
      }
    };

    loadBackupDrafts();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyBackupDraftDecision = async (
    draft: AdviserBackupTitleDraft,
    decision: 'approve' | 'needs_revision',
    feedback: string
  ) => {
    setSavingBackupDraftId(draft.id);

    try {
      const response = await fetch('/api/title-drafts/adviser', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draft.id, decision, feedback: feedback.trim() })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update this backup title.');
      }

      // The queue's purpose is "still needs action" — a decided draft (whether
      // approved or sent back) drops out immediately rather than lingering here
      // until the next full reload.
      setBackupDrafts((current) => current.filter((item) => item.id !== draft.id));
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
      showToast(
        decision === 'approve' ? `Approved backup title "${draft.title}".` : `Requested revision for "${draft.title}".`,
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update this backup title.', 'error');
    } finally {
      setSavingBackupDraftId(null);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTitleId(null);
        setSelectedEvidenceTitleId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!selectedTitleId) {
      document.body.style.removeProperty('overflow');
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [selectedTitleId]);

  const otherDocumentGroups = useMemo<OtherDocumentsGroup[]>(() => {
    const groupsByProject = new Map<string, OtherDocumentsGroup>();

    otherDocuments.forEach((file) => {
      if (!file.projectId) {
        return;
      }

      const existing = groupsByProject.get(file.projectId);
      if (existing) {
        existing.files.push(file);
        return;
      }

      groupsByProject.set(file.projectId, {
        projectId: file.projectId,
        projectTitle: file.projectTitle || file.groupTitle || 'Untitled Project',
        groupLabel: file.groupCode || file.groupTitle || 'Assigned Project',
        groupMembers: file.groupMembers || [],
        files: [file]
      });
    });

    return Array.from(groupsByProject.values());
  }, [otherDocuments]);

  const applyOtherDocumentDecision = async (file: DocumentFileSummary, decision: 'approved' | 'needs_revision', remarks: string) => {
    const trimmedRemarks = remarks.trim();
    const notes = trimmedRemarks || (decision === 'approved'
      ? 'Approved by adviser. The student can now view the adviser remarks and approval status.'
      : 'Revision requested. Please address adviser feedback and upload a new version.');

    setSavingOtherDocumentId(file.id);

    try {
      const response = await fetch(`/api/document-files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, notes })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Unable to update the review status.');
      }

      setOtherDocuments((current) => current.filter((item) => item.id !== file.id));
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
      showToast(
        decision === 'approved'
          ? `Approved "${file.fileName}".`
          : `Revision requested for "${file.fileName}".`,
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update the review status.';
      setTitleError(message);
      showToast(message, 'error');
    } finally {
      setSavingOtherDocumentId(null);
    }
  };

  const academicYearOptions = useMemo(() => getAcademicYearOptions(titleRecords), [titleRecords]);

  const selectedRecord = useMemo(
    () => titleRecords.find((record) => record.id === selectedTitleId) ?? null,
    [selectedTitleId, titleRecords]
  );

  const selectedEvidenceRecord = useMemo(
    () => titleRecords.find((record) => record.id === selectedEvidenceTitleId) ?? null,
    [selectedEvidenceTitleId, titleRecords]
  );

  useEffect(() => {
    if (!selectedRecord) {
      setRemarksDraft('');
      return;
    }

    setRemarksDraft(selectedRecord.adviserAction);
  }, [selectedRecord]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    const filtered = titleRecords.filter((record) => {
      // Evidence pendingness used to also keep an otherwise-decided title
      // showing here, back when Evidence was bundled into this same card.
      // Now that Evidence Review Queue is its own section, this filter only
      // needs to reflect the title decision itself.
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? record.status === 'pending'
          : record.status === statusFilter;
      const matchesAcademicYear =
        academicYearFilter === 'all' || record.academicYear === academicYearFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          record.groupId,
          record.title,
          record.description,
          record.keywords.join(' '),
          record.memberPreview.join(' '),
          record.adviserAction
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesAcademicYear && matchesSearch;
    });

    return sortTitleRecords(filtered, sortBy);
  }, [academicYearFilter, searchValue, sortBy, statusFilter, titleRecords]);

  const hasPendingTitles = useMemo(
    () => titleRecords.some((record) => record.status === 'pending'),
    [titleRecords]
  );

  const summaryMetrics = useMemo<TitleSummaryMetric[]>(
    () => [
      {
        id: 'pending-titles',
        label: 'Pending Titles',
        value: titleRecords.filter((record) => record.status === 'pending').length,
        helperText: 'Title proposals still waiting for adviser validation and originality review.',
        icon: 'fa-hourglass-half',
        iconClassName: 'bg-amber-50 text-amber-600'
      },
      {
        id: 'approved-titles',
        label: 'Approved',
        value: titleRecords.filter((record) => record.status === 'approved').length,
        helperText: 'Titles already accepted for the current IT capstone cycle.',
        icon: 'fa-circle-check',
        iconClassName: 'bg-emerald-50 text-emerald-600'
      },
      {
        id: 'needs-revision',
        label: 'Needs Revision',
        value: titleRecords.filter((record) => record.status === 'needs-revision').length,
        helperText: 'Proposals returned for clearer wording, scope adjustment, or refinement.',
        icon: 'fa-rotate-left',
        iconClassName: 'bg-blue-50 text-blue-600'
      },
      {
        id: 'rejected-titles',
        label: 'Rejected',
        value: titleRecords.filter((record) => record.status === 'rejected').length,
        helperText: 'Titles declined due to originality issues or weak alignment with the study scope.',
        icon: 'fa-ban',
        iconClassName: 'bg-rose-50 text-rose-600'
      }
    ],
    [titleRecords]
  );

  const applyDecision = async (
    record: AdviserTitleRecord,
    nextStatus: TitleStatus,
    customRemarks?: string
  ) => {
    const trimmedRemarks = customRemarks?.trim() || '';
    const isPlaceholderRemark = trimmedRemarks.toLowerCase() === getDefaultActionForStatus('pending').toLowerCase();
    const nextRemarks = trimmedRemarks && !isPlaceholderRemark
      ? trimmedRemarks
      : getDefaultActionForStatus(nextStatus);

    try {
      const response = await fetch('/api/title-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          decision: nextStatus === 'needs-revision' ? 'needs_revision' : nextStatus,
          remarks: nextRemarks
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update the title decision.');
      }

      setTitleRecords((current) =>
        current.map((item) => (item.id === record.id ? payload.title : item))
      );

      if (selectedTitleId === record.id) {
        setSelectedTitleId(null);
        setRemarksDraft('');
      }
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setTitleError(error instanceof Error ? error.message : 'Unable to update the title decision.');
    }
  };

  const applyEvidenceDecision = async (
    record: AdviserTitleRecord,
    decision: 'approved' | 'needs_revision' | 'rejected',
    remarks: string,
    checkpointKey: DefenseApplicationStageKey
  ) => {
    const response = await fetch('/api/defense-application-evidence', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: record.id, decision, remarks: remarks.trim(), checkpointKey })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.message || 'Unable to update the evidence review.');
    }

    const reviewField = EVIDENCE_REVIEW_FIELD_BY_CHECKPOINT_KEY[checkpointKey];
    const nextStatus = payload?.checkpoint?.status || record[reviewField]?.status || 'SUBMITTED';

    setTitleRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? {
              ...item,
              [reviewField]: {
                status: nextStatus,
                feedback: remarks.trim() || item[reviewField]?.feedback || null,
                feedbackBy: remarks.trim() ? 'You' : item[reviewField]?.feedbackBy || null,
                uploaderNote: item[reviewField]?.uploaderNote || null,
                files: item[reviewField]?.files || []
              }
            }
          : item
      )
    );

    window.dispatchEvent(new Event('thesistrack:notifications-updated'));
  };

  return (
    <>
        <AdviserPageHeader
          title="Title & Evidence Approval"
          description="Decide on proposed capstone project titles and review Oral Defense Application evidence, plus other pending documents, from your assigned IT groups."
          actions={
            <AdviserShellActions
              basePath={basePath}
              fullName={data.profile.fullName}
              notificationCount={data.profile.notificationCount}
              workspaceMode={workspaceMode}
              onSwitchWorkspace={switchWorkspace}
            />
          }
        />

        <div className="mx-auto max-w-[1600px] space-y-6">
          <TitleSummaryCards metrics={summaryMetrics} />

          <TitleFilters
            academicYearFilter={academicYearFilter}
            academicYearOptions={academicYearOptions}
            onAcademicYearChange={setAcademicYearFilter}
            onSearchChange={setSearchValue}
            onSortChange={setSortBy}
            onStatusChange={setStatusFilter}
            searchValue={searchValue}
            sortBy={sortBy}
            sortOptions={TITLE_SORT_OPTIONS}
            statusFilter={statusFilter}
            statusOptions={TITLE_STATUS_FILTER_OPTIONS}
          />

          {titleError ? (
            <div className="project-files-state is-danger">
              <i className="fas fa-circle-exclamation" aria-hidden="true" />
              <span>{titleError}</span>
            </div>
          ) : null}

          {isLoadingTitles ? (
            <div className="project-files-state">
              <span className="project-files-spinner" aria-hidden="true" />
              <span>Loading title submissions...</span>
            </div>
          ) : (
            <GroupReviewList
              hasPendingTitles={hasPendingTitles}
              onViewApproved={() => {
                setStatusFilter('approved');
                setSearchValue('');
              }}
              onViewDetails={(record) => setSelectedTitleId(record.id)}
              titles={filteredRecords}
            />
          )}

          <EvidenceQueueList
            titles={titleRecords}
            isLoading={isLoadingTitles}
            onReviewEvidence={(record) => setSelectedEvidenceTitleId(record.id)}
          />

          <OtherDocumentsQueueList
            groups={otherDocumentGroups}
            isLoading={isLoadingOtherDocuments}
            savingFileId={savingOtherDocumentId}
            onDecide={applyOtherDocumentDecision}
          />

          <BackupTitleDraftsQueueList
            drafts={backupDrafts}
            isLoading={isLoadingBackupDrafts}
            savingId={savingBackupDraftId}
            onDecide={applyBackupDraftDecision}
          />
        </div>

        {selectedRecord ? (
          <TitleDetailsDrawer
            record={selectedRecord}
            remarksDraft={remarksDraft}
            onRemarksChange={setRemarksDraft}
            onClose={() => setSelectedTitleId(null)}
            onApprove={(r) => applyDecision(r, 'approved', remarksDraft)}
            onRequestRevision={(r) => applyDecision(r, 'needs-revision', remarksDraft)}
            onReject={(r) => applyDecision(r, 'rejected', remarksDraft)}
          />
        ) : null}

        {selectedEvidenceRecord ? (
          <EvidenceReviewDrawer
            record={selectedEvidenceRecord}
            onClose={() => setSelectedEvidenceTitleId(null)}
            onReviewEvidence={applyEvidenceDecision}
          />
        ) : null}

        {toast ? (
          <div className="notification">
            <i
              className={`fas ${getToastIcon(toast.type)}`}
              style={{
                color:
                  toast.type === 'success'
                    ? 'var(--success)'
                    : toast.type === 'error'
                      ? 'var(--danger)'
                      : 'var(--primary)'
              }}
            />
            <span>{toast.message}</span>
          </div>
        ) : null}
      </>
  );
}
