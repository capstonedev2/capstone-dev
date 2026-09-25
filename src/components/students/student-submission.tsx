'use client';

import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import { PremiumAnimatedButton } from '@/components/ui/premium-animated-button';
import {
  ACHIEVEMENT_DOCUMENT_CATEGORIES,
  DOCUMENT_AND_IMAGE_FILE_ACCEPT,
  DOCUMENT_FILE_ACCEPT,
  DOCUMENT_STORAGE_BUCKETS,
  EVIDENCE_FILE_TYPE_CATEGORIES,
  validateFileSize,
  validateFileType
} from '@/lib/storage/upload-config';
import {
  MAX_UPLOAD_FILES,
  PROJECT_FILE_CATEGORY_OPTIONS,
  formatFileSizeLabel,
  getProjectFileTypeIcon,
  getSkippedEvidenceStageKey,
  hasCompletedConceptStage
} from '@/components/students/student-project-files.shared';

// Title is submitted on the dedicated Title Submission workspace, which has
// the similarity-check and multi-candidate compare/choose-favorite features
// this quick form can't safely duplicate — so it's deliberately not one of
// the categories offered here.
const SUBMISSION_CATEGORY_OPTIONS = PROJECT_FILE_CATEGORY_OPTIONS;

// Groups the flat category list into scannable clusters for the picker UI —
// purely a presentation grouping, doesn't change what's actually offered.
const CATEGORY_GROUPS: Array<{ id: string; label: string; icon: string; keys: string[] }> = [
  {
    id: 'thesis',
    label: 'Thesis Documents',
    icon: 'fa-file-lines',
    keys: ['proposal', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'system-files', 'presentation-files', 'supporting-documents', 'final-manuscript']
  },
  {
    id: 'evidence',
    label: 'Oral Defense Evidence',
    icon: 'fa-file-shield',
    keys: ['concept-defense-application', 'proposal-defense-application', 'final-defense-application']
  },
  {
    id: 'achievement',
    label: 'Achievements',
    icon: 'fa-award',
    keys: ['award-recognition', 'activity-evidence']
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'fa-ellipsis',
    keys: ['other']
  }
];

const OTHER_CATEGORY_KEY = 'other';

type NoticeState = { tone: 'success' | 'warning' | 'danger'; message: string } | null;

type ExistingFileSummary = {
  documentCategory: string;
  submissionStatus: string | null;
};

const PENDING_SUBMISSION_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW']);

function getFileIcon(fileName: string, fileType?: string) {
  return getProjectFileTypeIcon(fileName, fileType);
}

export function StudentSubmission({ data }: { data: StudentDashboardData }) {
  const isConceptStageComplete = useMemo(() => hasCompletedConceptStage(data), [data]);

  const [category, setCategory] = useState('concept-defense-application');
  const [existingFiles, setExistingFiles] = useState<ExistingFileSummary[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generic document fields
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [versionNotes, setVersionNotes] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/document-files?bucketName=${DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS}&page=1&limit=50`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const files: ExistingFileSummary[] = (payload.files || []).map((file: any) => ({
          documentCategory: file.documentCategory,
          submissionStatus: file.submissionStatus
        }));

        if (!cancelled) {
          setExistingFiles(files);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExisting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isOtherCategory = category === OTHER_CATEGORY_KEY;
  const isAchievementCategory = ACHIEVEMENT_DOCUMENT_CATEGORIES.has(category);
  const isEvidenceCategory = EVIDENCE_FILE_TYPE_CATEGORIES.has(category);
  const isCategoryLocked = !isAchievementCategory && category !== 'concept-defense-application' && !isConceptStageComplete;

  // A category already has a submission awaiting adviser review — resubmitting
  // now would create a confusing duplicate round instead of adding to the open
  // one (mirrors the same guard on the Document Tracker page). "Other" is exempt:
  // it's a catch-all for unrelated, independent items (a certificate, a consent
  // form, ...), so one pending "Other" file shouldn't block every future one.
  const hasPendingRoundForCategory = !isAchievementCategory && !isOtherCategory &&
    existingFiles.some(
      (file) => file.documentCategory === category && PENDING_SUBMISSION_STATUSES.has(String(file.submissionStatus || '').toUpperCase())
    );

  // Same lock/pending logic as above, but evaluated for an arbitrary category —
  // used to badge each option in the picker grid, not just the one currently selected.
  const isCategoryLockedFor = (key: string) =>
    !ACHIEVEMENT_DOCUMENT_CATEGORIES.has(key) && key !== 'concept-defense-application' && !isConceptStageComplete;

  const hasPendingRoundFor = (key: string) =>
    key !== OTHER_CATEGORY_KEY && !ACHIEVEMENT_DOCUMENT_CATEGORIES.has(key) &&
    existingFiles.some(
      (file) => file.documentCategory === key && PENDING_SUBMISSION_STATUSES.has(String(file.submissionStatus || '').toUpperCase())
    );

  // Non-blocking heads-up: the evidence categories are meant to go Concept → Proposal →
  // Final in order, but nothing stops a student from picking Final while Proposal is
  // still pending — this flags that instead of silently letting it through.
  const skippedEvidenceStageKey = getSkippedEvidenceStageKey(data, category);
  const skippedEvidenceStageLabel = skippedEvidenceStageKey
    ? SUBMISSION_CATEGORY_OPTIONS.find((option) => option.key === skippedEvidenceStageKey)?.label || skippedEvidenceStageKey
    : null;

  const resetDocumentForm = () => {
    setDocumentFiles([]);
    setVersionNotes('');
  };

  const handleFilesPicked = (fileList: FileList | File[] | null) => {
    const incoming = fileList ? Array.from(fileList) : [];

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!incoming.length) {
      return;
    }

    const invalidReasons: string[] = [];
    const validIncoming = incoming.filter((file) => {
      const typeError = validateFileType(file.name, file.type, isEvidenceCategory);
      const sizeError = validateFileSize(file.size, DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);
      const reason = typeError || sizeError;

      if (reason) {
        invalidReasons.push(`${file.name}: ${reason}`);
        return false;
      }

      return true;
    });

    if (invalidReasons.length) {
      setNotice({ tone: 'warning', message: invalidReasons.join(' ') });
    }

    setDocumentFiles((current) => [...current, ...validIncoming].slice(0, MAX_UPLOAD_FILES));
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFilesPicked(event.target.files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    handleFilesPicked(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const activeFiles = documentFiles;
  const removeStagedFile = (index: number) => {
    setDocumentFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmitDocuments = async () => {
    setNotice(null);

    if (!documentFiles.length) {
      setNotice({ tone: 'warning', message: 'Select at least one file before submitting it to the project workspace.' });
      return;
    }

    if (isOtherCategory && !versionNotes.trim()) {
      setNotice({ tone: 'warning', message: 'Please specify what you’re submitting before sending it to your adviser.' });
      return;
    }

    if (hasPendingRoundForCategory) {
      setNotice({ tone: 'warning', message: 'This category already has files awaiting your adviser’s review. Wait for a decision before submitting again.' });
      return;
    }

    setIsSubmitting(true);
    const failures: string[] = [];
    let successCount = 0;

    for (const file of documentFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucketName', DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);
        formData.append('projectId', data.project.project_id || data.project.id);
        formData.append('documentCategory', category);
        if (versionNotes.trim()) {
          formData.append('notes', versionNotes.trim());
        }

        const response = await fetch('/api/document-files', { method: 'POST', body: formData });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || `Unable to upload ${file.name}.`);
        }

        successCount += 1;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : `Unable to upload ${file.name}.`);
      }
    }

    if (successCount) {
      setExistingFiles((current) => [...current, { documentCategory: category, submissionStatus: 'SUBMITTED' }]);
    }

    if (failures.length) {
      setNotice({
        tone: successCount ? 'warning' : 'danger',
        message: successCount
          ? `${successCount} of ${documentFiles.length} file(s) uploaded. ${failures.join(' ')}`
          : failures.join(' ')
      });
    } else {
      const locksCategoryUntilReviewed = !isAchievementCategory && !isOtherCategory;
      const baseMessage = successCount === 1 ? `${documentFiles[0].name} uploaded securely.` : `${successCount} files uploaded securely.`;

      setNotice({
        tone: 'success',
        message: locksCategoryUntilReviewed
          ? `${baseMessage} Your adviser will review it before you can submit to this category again.`
          : baseMessage
      });
      resetDocumentForm();
    }

    setIsSubmitting(false);
  };

  if (!data.group?.id) {
    return (
      <div className="student-project-files-page">
        <header className="top-nav">
          <div className="top-nav-leading">
            <div className="page-title">
              <div className="page-title-context">
                <span className="page-kicker">Student Workspace</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>Submit Documents</span>
                </span>
              </div>
              <h1>Submit Documents</h1>
            </div>
          </div>
        </header>
        <div className="page-body p-8 sm:p-12">
          <div className="mx-auto max-w-xl rounded-[1.75rem] bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-100/50 p-12 text-center shadow-sm">
            <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-brand/10 to-brand/5 text-brand shadow-sm">
              <i className="fas fa-users-slash text-2xl" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-[var(--text-dark)]">Group Assignment Required</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-light)]">
              You must be assigned to a project group before you can submit a title or documents. Please contact your coordinator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedOptionLabel = SUBMISSION_CATEGORY_OPTIONS.find((option) => option.key === category)?.label || 'Not selected';
  const canSubmit = !isSubmitting && !isCategoryLocked && !hasPendingRoundForCategory && activeFiles.length > 0 &&
    (!isOtherCategory || versionNotes.trim().length > 0);

  return (
    <div className="student-project-files-page">
      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Submit Documents</span>
              </span>
            </div>
            <h1>Submit Documents</h1>
          </div>
        </div>
      </header>

      <div className="page-body p-6 sm:p-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              {/* Step 1 — category picker */}
              <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_36px_rgba(15,23,42,0.06)] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-black text-white">1</span>
                  <h3 className="text-lg font-extrabold text-[var(--text-dark)]">What are you submitting?</h3>
                </div>

                <div className="mt-6 space-y-5">
                  {CATEGORY_GROUPS.map((group) => (
                    <div key={group.id}>
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--text-meta)]">
                        <i className={`fas ${group.icon}`} aria-hidden="true" /> {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.keys.map((key) => {
                          const option = SUBMISSION_CATEGORY_OPTIONS.find((item) => item.key === key);
                          if (!option) return null;

                          const isActive = category === key;
                          const locked = isCategoryLockedFor(key);
                          const pending = hasPendingRoundFor(key);
                          const skipsAheadKey = !locked ? getSkippedEvidenceStageKey(data, key) : null;

                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => {
                                setCategory(key);
                                setNotice(null);
                              }}
                              title={
                                locked
                                  ? 'Opens once Stage 1: Concept Proposal is complete'
                                  : pending
                                    ? 'Awaiting adviser review'
                                    : skipsAheadKey
                                      ? 'An earlier oral defense evidence stage isn’t approved yet'
                                      : undefined
                              }
                              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isActive
                                  ? 'border-brand bg-brand text-white shadow-md shadow-brand/20'
                                  : locked
                                    ? 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-meta)]'
                                    : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)] hover:border-brand/50 hover:bg-brand/5'
                              }`}
                            >
                              {locked ? <i className="fas fa-lock text-[10px]" aria-hidden="true" /> : null}
                              {option.label}
                              {pending ? (
                                <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-label="Awaiting review" />
                              ) : !locked && skipsAheadKey ? (
                                <i className="fas fa-triangle-exclamation text-[11px] text-amber-500" aria-hidden="true" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {isOtherCategory && (
                  <div className="mt-6 border-t border-[var(--border)] pt-6">
                    <label htmlFor="other-specification" className="text-sm font-bold text-[var(--text)] ml-1">
                      What are you submitting? <span className="text-rose-500">*</span>
                    </label>
                    <p className="mt-1 ml-1 text-xs text-[var(--muted)]">
                      Explain how this relates to your current milestone
                      {data.project.currentMilestone && data.project.currentMilestone !== 'Not assigned' ? (
                        <> — <span className="font-bold text-brand">{data.project.currentMilestone}</span></>
                      ) : null}.
                    </p>
                    <textarea
                      id="other-specification"
                      value={versionNotes}
                      onChange={(event) => setVersionNotes(event.target.value)}
                      placeholder={
                        data.project.currentMilestone && data.project.currentMilestone !== 'Not assigned'
                          ? `e.g. A supporting document for ${data.project.currentMilestone}`
                          : 'e.g. A supporting document not covered by the other categories'
                      }
                      disabled={isSubmitting}
                      className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3 px-4 text-sm font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 min-h-[90px] resize-y"
                    />
                  </div>
                )}
              </article>

              {notice && (
                <div className={`flex items-center gap-3 rounded-xl border-l-4 p-4 shadow-sm ${
                  notice.tone === 'success'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : notice.tone === 'warning'
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-rose-500 bg-rose-50 text-rose-800'
                }`}>
                  <i className={`fas ${notice.tone === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} aria-hidden="true" />
                  <span className="text-sm font-bold">{notice.message}</span>
                </div>
              )}

              {notice ? null : isCategoryLocked ? (
                <div className="flex items-center gap-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  <i className="fas fa-lock" aria-hidden="true" />
                  This category opens once Stage 1: Concept Proposal is complete.
                </div>
              ) : !isLoadingExisting && hasPendingRoundForCategory ? (
                <div className="flex items-center gap-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  <i className="fas fa-clock" aria-hidden="true" />
                  This category already has a file awaiting your adviser&apos;s review. Wait for a decision before submitting again.
                </div>
              ) : !isLoadingExisting && skippedEvidenceStageLabel ? (
                <div className="flex items-center gap-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                  You&apos;re about to submit ahead of your current stage — {skippedEvidenceStageLabel} isn&apos;t approved yet. You can still submit, but it may get flagged during review.
                </div>
              ) : null}

              <>
                  {/* Step 2 — attach files */}
                  <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_36px_rgba(15,23,42,0.06)] p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-black text-white">2</span>
                      <h3 className="text-lg font-extrabold text-[var(--text-dark)]">Attach your file(s)</h3>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`group relative mt-6 flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed py-12 transition-all duration-300 cursor-pointer ${
                        isDragOver
                          ? 'border-brand bg-brand/5 shadow-inner scale-[1.01]'
                          : activeFiles.length
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : 'border-[var(--border-strong)] bg-[var(--surface-alt)] hover:border-brand/60 hover:bg-brand/5 hover:shadow-sm'
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                      <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface)] shadow-md mb-4 transition-transform duration-500 ${isDragOver || activeFiles.length ? 'scale-110' : 'group-hover:scale-110 rotate-3 group-hover:rotate-0'}`}>
                        <i className={`fas ${activeFiles.length ? 'fa-layer-group text-emerald-600' : 'fa-cloud-arrow-up text-brand'} text-2xl`} aria-hidden="true" />
                      </div>

                      <h4 className="relative z-10 text-base font-extrabold text-[var(--text)]">
                        {activeFiles.length ? `${activeFiles.length} file${activeFiles.length === 1 ? '' : 's'} selected` : 'Drag and drop your file(s) here'}
                      </h4>
                      <p className="relative z-10 mt-1 text-sm text-[var(--muted)]">
                        {activeFiles.length ? 'Click to add more, or submit below.' : `or click to browse — up to ${MAX_UPLOAD_FILES} files`}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept={isEvidenceCategory ? DOCUMENT_AND_IMAGE_FILE_ACCEPT : DOCUMENT_FILE_ACCEPT}
                        onChange={handleFileInputChange}
                      />
                    </div>

                    {activeFiles.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {activeFiles.map((file, index) => (
                          <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm shadow-sm">
                            <span className="flex min-w-0 items-center gap-2.5 font-semibold text-[var(--text)]">
                              <i className={`fas ${getFileIcon(file.name, file.type)} text-brand shrink-0`} aria-hidden="true" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-[var(--text-meta)] font-normal shrink-0">{formatFileSizeLabel(file.size)}</span>
                            </span>
                            <button type="button" className="shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50" onClick={() => removeStagedFile(index)} aria-label={`Remove ${file.name}`}>
                              <i className="fas fa-xmark" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>

                  {/* Step 3 — details + submit */}
                  <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_36px_rgba(15,23,42,0.06)] p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-black text-white">3</span>
                      <h3 className="text-lg font-extrabold text-[var(--text-dark)]">{isOtherCategory ? 'Ready to submit' : 'Version notes'}</h3>
                    </div>

                    {!isOtherCategory && (
                      <div className="mt-6">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="submission-notes" className="text-sm font-bold text-[var(--text)] ml-1">
                            Notes <span className="text-[10px] uppercase tracking-wider text-[var(--text-meta)] font-medium ml-1">Optional</span>
                          </label>
                          <textarea
                            id="submission-notes"
                            value={versionNotes}
                            onChange={(event) => setVersionNotes(event.target.value)}
                            placeholder="Summarize what this file contains or what changed..."
                            disabled={isSubmitting}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3 px-4 text-sm font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 min-h-[100px] resize-y"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-8 pt-6 border-t border-[var(--border)]">
                      <PremiumAnimatedButton
                        type="button"
                        onPress={handleSubmitDocuments}
                        disabled={isSubmitting || isCategoryLocked || hasPendingRoundForCategory || (isOtherCategory && !versionNotes.trim())}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-paper-plane" aria-hidden="true" />
                        Submit to Adviser
                      </PremiumAnimatedButton>
                    </div>
                  </article>
                </>
            </div>

            {/* Sidebar — live summary */}
            {/* top-24 (6rem) clears the fixed .student-global-navbar (height: 5rem)
                plus a little breathing room, so the sticky sidebar doesn't end up
                parked behind it once scrolled. */}
            <aside className="space-y-5 xl:sticky xl:top-24">
              <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-meta)]">Summary</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--muted)]">Submitting</span>
                    <strong className="truncate text-right text-[var(--text)]">{selectedOptionLabel}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--muted)]">Files attached</span>
                    <strong className={activeFiles.length ? 'text-emerald-600' : 'text-[var(--text)]'}>{activeFiles.length}</strong>
                  </div>
                </div>
                <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                  canSubmit ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-[var(--text-meta)]'
                }`}>
                  <i className={`fas ${canSubmit ? 'fa-circle-check' : 'fa-circle-info'}`} aria-hidden="true" />
                  {canSubmit ? 'Ready to submit' : 'Complete the steps to submit'}
                </div>
              </article>

              <article className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand">
                  <i className="fas fa-shield-halved" aria-hidden="true" /> Good to know
                </p>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--muted)]">
                  <li>Files stay private until your adviser reviews them.</li>
                  <li>Once submitted, wait for a decision before resubmitting the same category.</li>
                  <li>Up to {MAX_UPLOAD_FILES} files per submission.</li>
                </ul>
              </article>

              <Link
                href="/students/project-files"
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-brand/40 hover:text-brand"
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-folder-open text-brand" aria-hidden="true" />
                  Open the Document Tracker
                </span>
                <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
