'use client';

import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import { PremiumAnimatedButton } from '@/components/ui/premium-animated-button';
import {
  ACHIEVEMENT_DOCUMENT_CATEGORIES,
  DOCUMENT_FILE_ACCEPT,
  DOCUMENT_STORAGE_BUCKETS,
  UNRESTRICTED_FILE_TYPE_CATEGORIES,
  validateFileSize,
  validateFileType
} from '@/lib/storage/upload-config';
import {
  MAX_UPLOAD_FILES,
  PROJECT_FILE_CATEGORY_OPTIONS,
  formatFileSizeLabel,
  getProjectFileTypeIcon,
  hasCompletedConceptStage
} from '@/components/students/student-project-files.shared';

const TITLE_CATEGORY_KEY = 'title-registration';

const SUBMISSION_CATEGORY_OPTIONS = [
  { key: TITLE_CATEGORY_KEY, label: 'Title Registration' },
  ...PROJECT_FILE_CATEGORY_OPTIONS
];

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

  const [category, setCategory] = useState(TITLE_CATEGORY_KEY);
  const [existingFiles, setExistingFiles] = useState<ExistingFileSummary[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Title fields
  const [titleText, setTitleText] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [titleFiles, setTitleFiles] = useState<File[]>([]);

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

  const isTitleCategory = category === TITLE_CATEGORY_KEY;
  const isAchievementCategory = ACHIEVEMENT_DOCUMENT_CATEGORIES.has(category);
  const isUnrestrictedCategory = UNRESTRICTED_FILE_TYPE_CATEGORIES.has(category);
  const isCategoryLocked = !isTitleCategory && !isAchievementCategory && category !== 'concept-defense-application' && !isConceptStageComplete;

  // A category already has a submission awaiting adviser review — resubmitting
  // now would create a confusing duplicate round instead of adding to the open
  // one (mirrors the same guard on the Document Tracker page).
  const hasPendingRoundForCategory = !isTitleCategory && !isAchievementCategory &&
    existingFiles.some(
      (file) => file.documentCategory === category && PENDING_SUBMISSION_STATUSES.has(String(file.submissionStatus || '').toUpperCase())
    );

  const resetTitleForm = () => {
    setTitleText('');
    setDescription('');
    setKeywordsInput('');
    setTitleFiles([]);
  };

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

    if (isTitleCategory) {
      setTitleFiles((current) => [...current, ...incoming].slice(0, MAX_UPLOAD_FILES));
      return;
    }

    const invalidReasons: string[] = [];
    const validIncoming = incoming.filter((file) => {
      const typeError = validateFileType(file.name, file.type, isUnrestrictedCategory ? 'any' : false);
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

  const activeFiles = isTitleCategory ? titleFiles : documentFiles;
  const removeStagedFile = (index: number) => {
    if (isTitleCategory) {
      setTitleFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    } else {
      setDocumentFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    }
  };

  const handleSubmitTitle = async () => {
    setNotice(null);

    const keywords = keywordsInput
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    if (!keywords.length) {
      setNotice({ tone: 'warning', message: 'Add at least one research type or technology keyword (comma-separated) before submitting.' });
      return;
    }

    if (!titleFiles.length) {
      setNotice({ tone: 'warning', message: 'Attach at least one title proposal document before submitting.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', titleText.trim() || titleFiles[0].name.replace(/\.[^/.]+$/, ''));
      formData.append('description', description.trim() || 'Title proposal document uploaded for adviser review.');
      formData.append('keywords', JSON.stringify(keywords));
      titleFiles.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/title-submissions', { method: 'POST', body: formData });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to submit the title proposal.');
      }

      setNotice({ tone: 'success', message: `"${payload.title?.proposedTitle || titleText}" was submitted to your adviser.` });
      resetTitleForm();
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setNotice({ tone: 'danger', message: error instanceof Error ? error.message : 'Unable to submit the title proposal.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDocuments = async () => {
    setNotice(null);

    if (!documentFiles.length) {
      setNotice({ tone: 'warning', message: 'Select at least one file before submitting it to the project workspace.' });
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
      setNotice({
        tone: 'success',
        message: successCount === 1 ? `${documentFiles[0].name} uploaded securely.` : `${successCount} files uploaded securely.`
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
            <p>Pick what you&apos;re submitting &mdash; your title, or any project document &mdash; from one place.</p>
          </div>
        </div>
      </header>

      <div className="page-body p-8 sm:p-12">
        <div className="mx-auto max-w-[1600px]">
          <article className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_36px_rgba(15,23,42,0.06)] p-6 sm:p-10">
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-brand-accent/10 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />

            <div className="relative flex items-start gap-4 border-b border-[var(--border)] pb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md">
                <i className="fas fa-paper-plane text-xl" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-brand">What are you submitting?</span>
                <h3 className="mt-0.5 text-xl font-extrabold text-[var(--text-dark)]">Choose a type, then attach your file(s)</h3>
              </div>
            </div>

            <div className="relative flex flex-col gap-2.5 mt-6 max-w-xl">
              <label htmlFor="submission-category" className="text-sm font-bold text-[var(--text)] ml-1">
                Submission type <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-brand/70 group-focus-within:text-brand transition-colors">
                  <i className="fas fa-tags" />
                </div>
                <select
                  id="submission-category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setNotice(null);
                  }}
                  disabled={isSubmitting}
                  className="block w-full appearance-none rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3.5 pl-12 pr-10 text-[var(--text)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all focus:bg-[var(--surface)] focus:border-brand focus:ring-4 focus:ring-brand/10 sm:text-sm font-bold outline-none disabled:opacity-60"
                >
                  {SUBMISSION_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-meta)] pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            {notice && (
              <div className={`relative mt-5 rounded-xl border-l-4 p-4 flex items-center gap-3 shadow-sm ${
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

            {isCategoryLocked ? (
              <div className="relative mt-5 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                This category opens once Stage 1: Concept Proposal is complete.
              </div>
            ) : !isLoadingExisting && hasPendingRoundForCategory ? (
              <div className="relative mt-5 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                This category already has a file awaiting your adviser&apos;s review. Wait for a decision before submitting again.
              </div>
            ) : null}

            <div className="relative mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <section>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed py-12 transition-all duration-300 cursor-pointer ${
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
                    accept={isTitleCategory || isUnrestrictedCategory ? undefined : DOCUMENT_FILE_ACCEPT}
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
              </section>

              {isTitleCategory ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="submission-title" className="text-sm font-bold text-[var(--text)] ml-1">Proposed title</label>
                    <input
                      id="submission-title"
                      type="text"
                      value={titleText}
                      onChange={(event) => setTitleText(event.target.value)}
                      placeholder="e.g. A Mobile-Based Inventory System for..."
                      disabled={isSubmitting}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3 px-4 text-sm font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="submission-description" className="text-sm font-bold text-[var(--text)] ml-1">Brief description</label>
                    <textarea
                      id="submission-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="What problem does this project solve?"
                      disabled={isSubmitting}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3 px-4 text-sm font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 min-h-[100px] resize-y"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="submission-keywords" className="text-sm font-bold text-[var(--text)] ml-1">
                      Research type / technology keywords <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="submission-keywords"
                      type="text"
                      value={keywordsInput}
                      onChange={(event) => setKeywordsInput(event.target.value)}
                      placeholder="e.g. Mobile App, Machine Learning, Inventory Management"
                      disabled={isSubmitting}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3 px-4 text-sm font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                    <span className="text-[11px] text-[var(--text-meta)] ml-1">Separate multiple keywords with commas.</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label htmlFor="submission-notes" className="text-sm font-bold text-[var(--text)] ml-1">
                    Version notes <span className="text-[10px] uppercase tracking-wider text-[var(--text-meta)] font-medium ml-1">Optional</span>
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
              )}
            </div>

            <div className="relative flex justify-end mt-8 pt-6 border-t border-[var(--border)]">
              <PremiumAnimatedButton
                type="button"
                onPress={isTitleCategory ? handleSubmitTitle : handleSubmitDocuments}
                disabled={isSubmitting || isCategoryLocked || (!isTitleCategory && hasPendingRoundForCategory)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-paper-plane" aria-hidden="true" />
                {isTitleCategory ? 'Submit Title Proposal' : 'Submit to Adviser'}
              </PremiumAnimatedButton>
            </div>
          </article>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Looking for the status of something you already submitted?{' '}
            <Link href="/students/project-files" className="font-bold text-brand hover:underline">Open the Document Tracker</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
