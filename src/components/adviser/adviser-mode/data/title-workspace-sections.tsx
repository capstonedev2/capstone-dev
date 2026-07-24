import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type {
  AdviserTitleRecord,
  SimilarTitleRecord,
  TitleSortOption,
  TitleStatus
} from '@/components/adviser/adviser-mode/data/title-workspace-data';
import {
  formatMemberPreview,
  formatTitleDate,
  getSimilarityMeta,
  getTitleStatusMeta
} from '@/components/adviser/adviser-mode/data/title-workspace-data';
import {
  createTitleSubmissionDocumentHtml,
  downloadTitleSubmissionDocument,
  openTitleSubmissionDocument,
  type TitleSubmissionDocumentData
} from '@/lib/title-submission-document';

export type TitleSummaryMetric = {
  id: string;
  label: string;
  value: number;
  helperText: string;
  icon: string;
  iconClassName: string;
};

type TitleFiltersProps = {
  statusFilter: TitleStatus | 'all';
  academicYearFilter: string;
  searchValue: string;
  sortBy: TitleSortOption;
  academicYearOptions: string[];
  statusOptions: ReadonlyArray<{ value: TitleStatus | 'all'; label: string }>;
  sortOptions: ReadonlyArray<{ value: TitleSortOption; label: string }>;
  onStatusChange: (value: TitleStatus | 'all') => void;
  onAcademicYearChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: TitleSortOption) => void;
};

type TitleListProps = {
  titles: AdviserTitleRecord[];
  onViewDetails: (record: AdviserTitleRecord) => void;
  onViewApproved: () => void;
  hasPendingTitles: boolean;
};

type TitleDetailsDrawerProps = {
  record: AdviserTitleRecord | null;
  remarksDraft: string;
  onRemarksChange: (value: string) => void;
  onClose: () => void;
  onApprove: (record: AdviserTitleRecord) => void;
  onRequestRevision: (record: AdviserTitleRecord) => void;
  onReject: (record: AdviserTitleRecord) => void;
};

type TitleUploadedFile = AdviserTitleRecord['uploadedFiles'][number];

const GENERATED_PREVIEW_ID = 'generated';
const OFFICE_FILE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

function WorkspaceSelect<TValue extends string>({
  value,
  onChange,
  children
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  children: ReactNode;
}) {
  return (
    <select
      className="min-h-12 rounded-2xl border border-[rgba(226,232,240,0.92)] bg-white px-4 text-sm font-medium text-[var(--text-dark)] shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
      value={value}
      onChange={(event) => onChange(event.target.value as TValue)}
    >
      {children}
    </select>
  );
}

function getTitleFileExtension(fileName: string, fileType?: string | null) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension && extension !== fileName.toLowerCase()) {
    return extension;
  }

  if (fileType?.includes('pdf')) return 'pdf';
  if (fileType?.includes('word')) return 'docx';
  if (fileType?.includes('presentation')) return 'pptx';
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return 'xlsx';

  return 'file';
}

function getTitleFileIcon(file: TitleUploadedFile) {
  const extension = getTitleFileExtension(file.name, file.fileType);

  if (extension === 'pdf') return 'fa-file-pdf';
  if (['doc', 'docx'].includes(extension)) return 'fa-file-word';
  if (['ppt', 'pptx'].includes(extension)) return 'fa-file-powerpoint';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'fa-file-excel';

  return 'fa-file-lines';
}

function isTitleOfficeFile(file: TitleUploadedFile) {
  const extension = getTitleFileExtension(file.name, file.fileType);

  return OFFICE_FILE_EXTENSIONS.includes(extension);
}

function getTitleFilePreviewUrl(file: TitleUploadedFile, signedUrl?: string) {
  if (signedUrl && isTitleOfficeFile(file)) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`;
  }

  return file.previewUrl || file.url.replace('/download', '/preview');
}

function formatTitleFileSize(size?: number | null) {
  if (!size) {
    return 'Size unavailable';
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function getTitleReviewStage(record: AdviserTitleRecord) {
  if (record.status === 'approved') {
    return {
      icon: 'fa-circle-check',
      label: 'Approved',
      helper: 'Title cleared for the group project record.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800'
    };
  }

  if (record.status === 'needs-revision') {
    return {
      icon: 'fa-rotate-left',
      label: 'Revision requested',
      helper: 'Waiting for the group to submit a corrected proposal.',
      className: 'border-blue-200 bg-blue-50 text-blue-800'
    };
  }

  if (record.status === 'rejected') {
    return {
      icon: 'fa-ban',
      label: 'Rejected',
      helper: 'Proposal was declined and should be replaced.',
      className: 'border-rose-200 bg-rose-50 text-rose-800'
    };
  }

  if (record.status === 'draft') {
    return {
      icon: 'fa-file',
      label: 'Draft',
      helper: 'Not yet submitted to adviser review.',
      className: 'border-slate-200 bg-slate-50 text-slate-700'
    };
  }

  return {
    icon: 'fa-magnifying-glass',
    label: 'Needs adviser decision',
    helper: 'Open preview to approve, revise, or reject.',
    className: 'border-amber-200 bg-amber-50 text-amber-800'
  };
}

function getTitleDecisionPanelCopy(status: TitleStatus) {
  if (status === 'approved') {
    return {
      title: 'Decision Recorded',
      description: 'The title is approved. You can still revise the decision if the record needs correction.',
      note: 'Students see the approved state and the title becomes available in their project tracker.'
    };
  }

  if (status === 'needs-revision') {
    return {
      title: 'Revision Requested',
      description: 'The proposal has been returned. Add or adjust remarks before updating the decision.',
      note: 'Students see the revision state and can prepare a corrected title package.'
    };
  }

  if (status === 'rejected') {
    return {
      title: 'Title Rejected',
      description: 'The proposal was declined. Use this panel if the decision needs to be changed.',
      note: 'Students see the rejected state and should submit another proposal.'
    };
  }

  return {
    title: 'Ready for Decision',
    description: 'Review the title, similarity, members, and attached proposal before recording a decision.',
    note: 'This action updates the student timeline and sends a title review notification.'
  };
}

function createAdviserTitleDocumentData(record: AdviserTitleRecord): TitleSubmissionDocumentData {
  const statusMeta = getTitleStatusMeta(record.status);
  const similarityMeta = getSimilarityMeta(record.similarityScore, record.similarTitles);

  return {
    documentId: record.id,
    groupId: record.groupId,
    department: record.department,
    academicYear: record.academicYear,
    adviser: 'Assigned adviser',
    proposedTitle: record.title,
    description: record.description,
    background: record.description,
    statementOfProblem:
      'The title is under adviser review to verify scope clarity, similarity risk, and alignment with the intended capstone direction.',
    objectives: [
      'Validate the clarity and scope of the proposed title.',
      'Check title similarity against existing records.',
      'Confirm whether the title is ready for approval, revision, or rejection.'
    ],
    category: `${record.department} Capstone Title Proposal`,
    keywords: record.keywords,
    groupMembers: record.memberPreview,
    status: statusMeta.label,
    submittedAt: record.submittedAt,
    updatedAt: record.submittedAt,
    latestReviewer: 'Adviser Review Queue',
    latestAction: record.adviserAction,
    validationStatus: similarityMeta.label,
    validationNote: similarityMeta.helperClass.includes('rose')
      ? 'Related titles need adviser attention before approval.'
      : 'Similarity result is available for adviser validation.',
    similarityScore: record.similarityScore,
    similarTitles: record.similarTitles.map((item) => ({
      title: item.title,
      similarityScore: item.similarityScore,
      label: `${item.similarityScore}% similarity`
    })),
    attachments: record.uploadedFiles.map((file) => ({
      fileName: file.name,
      fileType: getTitleFileExtension(file.name, file.fileType).toUpperCase(),
      sizeLabel: formatTitleFileSize(file.size),
      status: 'Attached to title proposal'
    })),
    remarks: record.adviserAction
  };
}

export function TitleSummaryCards({ metrics }: { metrics: TitleSummaryMetric[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className="group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,58,143,0.10)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[#1E40AF] to-[#F6BE00]" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">{metric.label}</p>
              <p className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[var(--primary)] transition-colors group-hover:text-[#002C6B]">
                {metric.value}
              </p>
            </div>
            <span
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm transition-transform duration-300 group-hover:scale-110 ${metric.iconClassName}`}
            >
              <i className={`fas ${metric.icon}`} />
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-[1.6] text-[var(--text-light)]">{metric.helperText}</p>
        </article>
      ))}
    </div>
  );
}

export function TitleFilters({
  statusFilter,
  academicYearFilter,
  searchValue,
  sortBy,
  academicYearOptions,
  statusOptions,
  sortOptions,
  onStatusChange,
  onAcademicYearChange,
  onSearchChange,
  onSortChange
}: TitleFiltersProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[var(--primary)] via-[#1E40AF] to-[#F6BE00]" />
      <div className="grid gap-3 xl:grid-cols-[minmax(170px,1fr)_minmax(150px,1fr)_minmax(190px,1fr)_minmax(170px,1fr)_minmax(320px,1.6fr)]">
        <div className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[rgba(0,58,143,0.07)] to-[rgba(0,58,143,0.03)] px-4 text-sm font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
          <i className="fas fa-lock text-xs opacity-60" />
          IT Department
        </div>

        <WorkspaceSelect value={statusFilter} onChange={onStatusChange}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect value={academicYearFilter} onChange={onAcademicYearChange}>
          <option value="all">All Academic Years</option>
          {academicYearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </WorkspaceSelect>

        <WorkspaceSelect value={sortBy} onChange={onSortChange}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </WorkspaceSelect>

        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--text-light)]">
            <i className="fas fa-search text-sm" />
          </span>
          <input
            className="min-h-12 w-full rounded-2xl border border-[rgba(226,232,240,0.92)] bg-white pl-11 pr-4 text-sm text-[var(--text-dark)] shadow-sm outline-none transition placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
            placeholder="Search title or group"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}

export function TitleList({
  titles,
  onViewDetails,
  onViewApproved,
  hasPendingTitles
}: TitleListProps) {
  const pendingCount = titles.filter((record) => record.status === 'pending').length;
  const completedCount = titles.filter((record) => ['approved', 'needs-revision', 'rejected'].includes(record.status)).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(0,58,143,0.06)] text-[var(--primary)] ring-1 ring-inset ring-blue-100">
            <i className="fas fa-file-signature" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--text-dark)]">Title Review Queue</h2>
            <p className="mt-0.5 text-sm text-[var(--text-light)]">
              Scan proposed titles here, then open preview to record approval, revision, or rejection.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            <i className="fas fa-list-check text-[10px] opacity-50" />
            {titles.length} title record{titles.length === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-inset ring-amber-100">
            <i className="fas fa-clock text-[10px]" />
            {pendingCount} pending
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <i className="fas fa-check text-[10px]" />
            {completedCount} processed
          </span>
        </div>
      </div>

      {titles.length ? (
        <div className="space-y-4">
          {titles.map((record) => (
            <TitleCard
              key={record.id}
              record={record}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      ) : (
        <EmptyState hasPendingTitles={hasPendingTitles} onViewApproved={onViewApproved} />
      )}
    </section>
  );
}

export function TitleDetailsDrawer({
  record,
  remarksDraft,
  onRemarksChange,
  onClose,
  onApprove,
  onRequestRevision,
  onReject
}: TitleDetailsDrawerProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (record) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [!!record]);

  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(GENERATED_PREVIEW_ID);
  const [signedPreviewUrls, setSignedPreviewUrls] = useState<Record<string, string>>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'revise' | 'reject' | null>(null);
  const uploadedFiles = record?.uploadedFiles ?? [];
  const firstUploadedFileId = uploadedFiles[0]?.id;
  const documentData = useMemo(() => (record ? createAdviserTitleDocumentData(record) : null), [record]);
  const generatedPreviewHtml = useMemo(
    () => (documentData ? createTitleSubmissionDocumentHtml(documentData) : ''),
    [documentData]
  );
  const selectedUploadedFile = uploadedFiles.find((file) => file.id === selectedPreviewId) || null;
  const selectedSignedUrl = selectedUploadedFile ? signedPreviewUrls[selectedUploadedFile.id] : '';
  const selectedFileIsOffice = selectedUploadedFile ? isTitleOfficeFile(selectedUploadedFile) : false;

  useEffect(() => {
    if (firstUploadedFileId) {
      setSelectedPreviewId(firstUploadedFileId);
    }
  }, [record?.id, firstUploadedFileId]);

  useEffect(() => {
    if (!selectedUploadedFile || !selectedFileIsOffice) {
      setPreviewError(null);
      return;
    }

    if (selectedSignedUrl) {
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setPreviewError(null);

    const loadSignedPreviewUrl = async () => {
      try {
        const response = await fetch(`/api/document-files/${selectedUploadedFile.id}/signed-url`, {
          method: 'POST'
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.signedUrl) {
          throw new Error(payload?.message || payload?.error || 'Unable to prepare document preview.');
        }

        if (!cancelled) {
          setSignedPreviewUrls((current) => ({
            ...current,
            [selectedUploadedFile.id]: payload.signedUrl
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : 'Unable to prepare document preview.');
        }
      }
    };

    loadSignedPreviewUrl();

    return () => {
      cancelled = true;
    };
  }, [selectedUploadedFile?.id, selectedFileIsOffice, selectedSignedUrl]);

  if (!record || !documentData || !isMounted) {
    return null;
  }

  const statusMeta = getTitleStatusMeta(record.status);
  const decisionPanelCopy = getTitleDecisionPanelCopy(record.status);
  const selectedPreviewTitle = selectedUploadedFile?.name || 'No file selected';
  const selectedPreviewUrl = selectedUploadedFile
    ? getTitleFilePreviewUrl(selectedUploadedFile, selectedSignedUrl)
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        aria-label="Title details modal"
        aria-modal="true"
        className="adviser-title-details-modal flex flex-col max-h-full w-full max-w-[1560px] overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-white/60 transition-all scale-100"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        {/* Header - Sticky */}
        <header className="relative shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                <i className="fas fa-file-signature opacity-70" /> Title Proposal Details
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 leading-tight">{record.title}</h2>
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
            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200/80">
              IT
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200/60">
              <i className="fas fa-users-rectangle text-[10px]" aria-hidden="true" />
              {record.groupId}
            </span>
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ring-1 ring-inset ring-current/20 ${statusMeta.badgeClassName}`}>
              {statusMeta.label}
            </span>
            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200/60">
              {record.academicYear}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <i className="fas fa-percent text-[10px]" aria-hidden="true" />
              {record.similarityScore}% similarity
            </span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-4 py-4 sm:px-6 sm:py-6 custom-scrollbar">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0 space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-700">
                      {selectedUploadedFile
                        ? `${getTitleFileExtension(selectedUploadedFile.name, selectedUploadedFile.fileType).toUpperCase()} Preview`
                        : 'File Preview'}
                    </p>
                    <h2 className="mt-1 truncate text-lg font-black text-slate-950">Proposal Preview</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">

                    {uploadedFiles.map((file) => (
                      <button
                        key={file.id}
                        className={`inline-flex min-h-9 max-w-[220px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                          selectedPreviewId === file.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50'
                        }`}
                        title={file.name}
                        type="button"
                        onClick={() => setSelectedPreviewId(file.id)}
                      >
                        <i className={`fas ${getTitleFileIcon(file)} text-[10px]`} aria-hidden="true" />
                        <span className="truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-100 p-3 sm:p-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                          <i
                            className={`fas ${
                              selectedUploadedFile ? getTitleFileIcon(selectedUploadedFile) : 'fa-file-lines'
                            } text-sm`}
                            aria-hidden="true"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{selectedPreviewTitle}</p>
                          <p className="text-xs font-bold text-slate-500">
                            {selectedUploadedFile
                              ? `${getTitleFileExtension(selectedUploadedFile.name, selectedUploadedFile.fileType).toUpperCase()} live preview`
                              : 'No file available'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedUploadedFile ? (
                          <>
                            <a
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                              href={selectedPreviewUrl || selectedUploadedFile.previewUrl || selectedUploadedFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="fas fa-up-right-from-square text-[10px]" aria-hidden="true" />
                              Open
                            </a>
                            <a
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                              href={selectedUploadedFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="fas fa-download text-[10px]" aria-hidden="true" />
                              Download
                            </a>
                          </>
                        ) : (
                          <>
                            <button
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-400 cursor-not-allowed"
                              type="button"
                              disabled
                            >
                              <i className="fas fa-up-right-from-square text-[10px]" aria-hidden="true" />
                              Open
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-3 sm:p-4">
                      {selectedUploadedFile ? (
                        selectedFileIsOffice && !selectedSignedUrl ? (
                          <div className="flex h-[clamp(620px,76vh,960px)] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 text-center">
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                              <i className={`fas ${previewError ? 'fa-circle-exclamation' : 'fa-spinner fa-spin'} text-sm`} aria-hidden="true" />
                            </span>
                            <p className="mt-4 text-sm font-black text-slate-800">
                              {previewError ? 'Preview unavailable for this file.' : 'Preparing document preview...'}
                            </p>
                            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                              {previewError || 'Office documents need a temporary viewer link before they can render inside the modal. (Note: Google Docs viewer cannot render local/localhost files. Please download the file instead if testing locally).'}
                            </p>
                            {previewError ? (
                              <a
                                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
                                href={selectedUploadedFile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i className="fas fa-up-right-from-square text-xs" aria-hidden="true" />
                                Open File
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <iframe
                            className="block h-[clamp(620px,76vh,960px)] w-full rounded-xl border border-slate-200 bg-white"
                            src={selectedPreviewUrl || selectedUploadedFile.previewUrl || selectedUploadedFile.url}
                            title={`${selectedUploadedFile.name} preview`}
                          />
                        )
                      ) : (
                        <div className="flex h-[clamp(620px,76vh,960px)] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <i className="fas fa-file-excel text-sm" aria-hidden="true" />
                          </span>
                          <p className="mt-4 text-sm font-black text-slate-700">
                            No file available for preview.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                  <i className="fas fa-circle-info" /> Title Details
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DrawerMeta icon="fa-users-rectangle" label="Group ID" value={record.groupId} />
                  <DrawerMeta icon="fa-user-group" label="Members" value={`${record.membersCount} members`} />
                  <DrawerMeta icon="fa-calendar-day" label="Submitted" value={formatTitleDate(record.submittedAt)} />
                  <DrawerMeta icon="fa-spinner" label="Current Status" value={statusMeta.label} />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-[1.15rem] bg-slate-50/90 p-4">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                      <i className="fas fa-align-left" aria-hidden="true" /> Project Description
                    </p>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-700">{record.description}</p>
                  </div>
                  <div className="rounded-[1.15rem] bg-slate-50/90 p-4">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                      <i className="fas fa-tags" aria-hidden="true" /> Keywords
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record.keywords.length ? (
                        record.keywords.map((keyword) => (
                          <span key={keyword} className="inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200">
                            #{keyword}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm font-medium text-slate-500">No keywords recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                  <i className="fas fa-paperclip" /> Attached Documents
                </p>
                {uploadedFiles.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-blue-300 hover:bg-blue-50 group">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                            <i className={`fas ${getTitleFileIcon(file)}`} aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-800">{file.name}</p>
                            <p className="text-xs font-medium text-slate-500">{formatTitleFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex shrink-0 items-center gap-2">
                          <button
                            className="flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                            type="button"
                            onClick={() => setSelectedPreviewId(file.id)}
                          >
                            Preview
                          </button>
                          <a 
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-9 items-center justify-center rounded-lg bg-white px-3 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[1.25rem] bg-blue-50/50 p-4 ring-1 ring-inset ring-blue-100/50">
                    <p className="text-sm font-medium leading-relaxed text-slate-600">
                      No physical files were uploaded.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-5 self-start xl:sticky xl:top-0">
              <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-blue-100">
                        <i className="fas fa-clipboard-check" /> Title Decision
                      </p>
                      <h3 className="mt-1 text-lg font-black">{decisionPanelCopy.title}</h3>
                    </div>
                    <span className="inline-flex shrink-0 rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-inset ring-white/20">
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-blue-100">{decisionPanelCopy.description}</p>
                </div>

                <div className="p-5">
                  <div className="rounded-2xl bg-blue-50/70 p-4 text-sm font-semibold leading-6 text-blue-900 ring-1 ring-inset ring-blue-100">
                    <i className="fas fa-circle-info mr-2 text-blue-600" aria-hidden="true" />
                    {decisionPanelCopy.note}
                  </div>

                  <label className="mt-4 block">
                    <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-blue-700">
                      <i className="fas fa-comment-dots" /> Adviser Remarks
                    </span>
                    <textarea
                      className="mt-3 min-h-[130px] w-full rounded-xl border border-blue-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Add notes for approval, revision, or rejection..."
                      value={remarksDraft}
                      onChange={(event) => onRemarksChange(event.target.value)}
                    />
                  </label>

                  <div className="mt-4 grid gap-3">
                    <button
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-lg focus:outline-none"
                      type="button"
                      onClick={() => setConfirmAction('approve')}
                    >
                      <i className="fas fa-check" /> Approve Title
                    </button>
                    <button
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-6 text-sm font-black text-amber-700 shadow-sm ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 hover:ring-amber-300 focus:outline-none"
                      type="button"
                      onClick={() => setConfirmAction('revise')}
                    >
                      <i className="fas fa-rotate-left" /> Request Revision
                    </button>
                    <button
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 transition hover:bg-rose-50 hover:ring-rose-300 focus:outline-none"
                      type="button"
                      onClick={() => setConfirmAction('reject')}
                    >
                      <i className="fas fa-ban" /> Reject
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Review Checks</p>
                    <ul className="mt-3 space-y-2.5 text-sm font-semibold text-slate-700">
                      {[
                        'Title wording is clear and specific',
                        'Scope fits the group and department',
                        'Similarity result is acceptable',
                        'Remarks explain the decision'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] text-blue-700 ring-1 ring-inset ring-blue-100">
                            <i className="fas fa-check" aria-hidden="true" />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <SimilarityIndicator compact score={record.similarityScore} similarTitles={record.similarTitles} />

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                    <i className="fas fa-users" /> Group Information
                  </p>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600 ring-1 ring-inset ring-slate-200">
                    {record.membersCount} members
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {record.groupMembers && record.groupMembers.length > 0 ? (
                    record.groupMembers.map((member, idx) => (
                      <span 
                        key={idx} 
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ring-1 ring-inset shadow-sm ${
                          member.isLeader 
                            ? 'bg-amber-50 text-amber-700 ring-amber-200/80' 
                            : 'bg-slate-50 text-slate-700 ring-slate-200/80'
                        }`}
                      >
                        {member.isLeader ? (
                          <i className="fas fa-crown text-amber-500" />
                        ) : (
                          <i className="fas fa-user text-slate-400" />
                        )}
                        {member.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">
                      {formatMemberPreview(record.memberPreview, 5)}
                    </p>
                  )}
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  Assigned IT group under the {record.academicYear} academic year.
                </p>
              </section>
            </aside>
          </div>
        </div>

        {confirmAction && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  confirmAction === 'approve' ? 'bg-emerald-100 text-emerald-600' :
                  confirmAction === 'revise' ? 'bg-amber-100 text-amber-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                  <i className={`fas ${
                    confirmAction === 'approve' ? 'fa-check' :
                    confirmAction === 'revise' ? 'fa-rotate-left' :
                    'fa-ban'
                  } text-xl`} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {confirmAction === 'approve' ? 'Approve Title' :
                     confirmAction === 'revise' ? 'Request Revision' :
                     'Reject Title'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {confirmAction === 'approve' ? 'Are you sure you want to approve this title submission? This action will formally record the approval and notify the students.' :
                     confirmAction === 'revise' ? 'Are you sure you want to request revisions for this title? The students will need to revise and resubmit.' :
                     'Are you sure you want to reject this title submission? This is a permanent rejection.'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm ${
                    confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    confirmAction === 'revise' ? 'bg-amber-600 hover:bg-amber-700' :
                    'bg-rose-600 hover:bg-rose-700'
                  }`}
                  onClick={() => {
                    if (confirmAction === 'approve') onApprove(record);
                    if (confirmAction === 'revise') onRequestRevision(record);
                    if (confirmAction === 'reject') onReject(record);
                    setConfirmAction(null);
                  }}
                >
                  Confirm Decision
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function SimilarityIndicator({
  score,
  similarTitles,
  compact = false
}: {
  score: number;
  similarTitles: SimilarTitleRecord[];
  compact?: boolean;
}) {
  const similarityMeta = getSimilarityMeta(score, similarTitles);

  return (
    <section className={`rounded-[1.5rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] ring-1 ring-inset ring-slate-200/80 ${compact ? 'bg-gradient-to-br from-white to-slate-50/50 p-5' : 'bg-white p-5'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <i className="fas fa-percent text-[10px]" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Similarity</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{score}%</span>
            <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${similarityMeta.toneClass} ring-current/20`}>
              {similarityMeta.label}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className={`text-sm font-bold ${similarityMeta.helperClass}`}>
          {similarTitles.length
            ? `${similarTitles.length} related title${similarTitles.length === 1 ? '' : 's'} found`
            : 'No related IT titles found'}
        </p>
        {similarTitles.length ? (
          similarTitles.slice(0, compact ? 1 : 2).map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm transition hover:border-slate-300">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Similar title match
              </p>
              <p className="mt-1 text-sm font-bold leading-tight text-slate-800">{item.title}</p>
              <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-slate-500">
                <i className="fas fa-bolt text-amber-500" /> Match: <span className="text-slate-700">{item.similarityScore}%</span>
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-500 text-center">
            No strongly related archived titles are listed for this proposal.
          </div>
        )}
      </div>
    </section>
  );
}

export function TitleCard({
  record,
  onViewDetails
}: {
  record: AdviserTitleRecord;
  onViewDetails: (record: AdviserTitleRecord) => void;
}) {
  const statusMeta = getTitleStatusMeta(record.status);
  const similarityMeta = getSimilarityMeta(record.similarityScore, record.similarTitles);
  const fileCount = record.uploadedFiles?.length ?? 0;
  const previewButtonLabel = record.status === 'pending' ? 'Preview & Decide' : 'Open Preview';
  const reviewStage = getTitleReviewStage(record);
  const firstFile = record.uploadedFiles[0] || null;

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-blue-600" />

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)_260px] xl:items-stretch">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-layer-group text-[10px] text-slate-400" /> IT
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-sm ${statusMeta.badgeClassName}`}>
              {record.status === 'pending' ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
              ) : null}
              {statusMeta.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${reviewStage.className}`}>
              <i className={`fas ${reviewStage.icon} text-[10px]`} aria-hidden="true" />
              {reviewStage.label}
            </span>
          </div>

          <h3
            className="mt-4 text-[1.35rem] font-black leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-blue-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={record.title}
          >
            {record.title}
          </h3>

          <p
            className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={record.description}
          >
            {record.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-blue-700 ring-1 ring-inset ring-blue-100">
              <i className="fas fa-users-rectangle opacity-70" /> {record.groupId}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-user-group opacity-60" />
              {record.membersCount} members
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-calendar-day opacity-60" />
              {formatTitleDate(record.submittedAt)}
            </span>
          </div>

          {record.groupMembers && record.groupMembers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {record.groupMembers.slice(0, 4).map((member, idx) => (
                <span 
                  key={idx} 
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1 ring-inset shadow-sm ${
                    member.isLeader 
                      ? 'bg-amber-50 text-amber-700 ring-amber-200/80' 
                      : 'bg-white text-slate-600 ring-slate-200/80'
                  }`}
                >
                  <i className={`fas ${member.isLeader ? 'fa-crown text-amber-500' : 'fa-user text-slate-400'} text-[10px]`} />
                  {member.name}
                </span>
              ))}
              {record.groupMembers.length > 4 ? (
                <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
                  +{record.groupMembers.length - 4} more
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-slate-500">{formatMemberPreview(record.memberPreview)}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/80">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <i className="fas fa-percent text-emerald-500" /> Similarity
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{record.similarityScore}%</span>
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black ring-1 ring-inset ${similarityMeta.toneClass} ring-current/20`}>
                {similarityMeta.label}
              </span>
            </div>
            <p className={`mt-2 text-xs font-bold ${similarityMeta.helperClass}`}>
              {record.similarTitles.length
                ? `${record.similarTitles.length} related title${record.similarTitles.length === 1 ? '' : 's'} found`
                : 'No related IT titles found'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/80">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <i className="fas fa-paperclip text-blue-500" /> Proposal File
            </p>
            <p className="mt-3 truncate text-sm font-black text-slate-900" title={firstFile?.name || undefined}>
              {firstFile?.name || 'No proposal file'}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {fileCount ? `${fileCount} attached file${fileCount === 1 ? '' : 's'}` : 'No uploaded file'}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-700">
              <i className="fas fa-route" /> Next Step
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{reviewStage.helper}</p>
            <p
              className="mt-3 text-sm italic leading-6 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              title={record.adviserAction}
            >
              "{record.adviserAction}"
            </p>
          </div>
          <button
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
            type="button"
            onClick={() => onViewDetails(record)}
          >
            <i className="fas fa-up-right-from-square text-xs" /> {previewButtonLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({
  hasPendingTitles,
  onViewApproved
}: {
  hasPendingTitles: boolean;
  onViewApproved: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-50 to-blue-50/40 px-6 py-16 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)] border border-slate-100/50">
      <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-[rgba(0,58,143,0.08)] to-[rgba(0,58,143,0.03)] text-[var(--primary)] shadow-sm">
        <i className="fas fa-file-signature text-2xl" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-[var(--text-dark)]">
        {hasPendingTitles ? 'No matching titles' : 'No pending titles'}
      </h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-light)]">
        {hasPendingTitles
          ? 'Adjust the filters or search terms above to bring title records back into view.'
          : 'All submitted IT project titles have already been reviewed and processed.'}
      </p>
      {!hasPendingTitles ? (
        <button
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-[var(--primary)] shadow-sm ring-1 ring-inset ring-[rgba(0,58,143,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50"
          type="button"
          onClick={onViewApproved}
        >
          <i className="fas fa-folder-open text-xs" />
          View Approved Titles
        </button>
      ) : null}
    </div>
  );
}

function DrawerMeta({
  icon,
  label,
  value
}: {
  icon?: string;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.15rem] bg-slate-50/90 p-4">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
        {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--text-dark)]">{value}</p>
    </article>
  );
}
