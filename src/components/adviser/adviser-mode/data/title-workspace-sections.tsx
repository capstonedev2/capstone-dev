import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { PremiumAnimatedButton } from '@/components/ui/premium-animated-button';
import type { DocumentFileSummary } from '@/components/documents/document-file-controls';
import { formatFileSizeLabel, getDocumentCategoryStage, getProjectFileCategoryLabel } from '@/components/students/student-project-files.shared';

export type TitleSummaryMetric = {
  id: string;
  label: string;
  value: number;
  helperText: string;
  icon: string;
  iconClassName: string;
};

type TitleFiltersProps = {
  statusFilter: TitleStatus | 'all' | 'active';
  academicYearFilter: string;
  searchValue: string;
  sortBy: TitleSortOption;
  academicYearOptions: string[];
  statusOptions: ReadonlyArray<{ value: TitleStatus | 'all' | 'active'; label: string }>;
  sortOptions: ReadonlyArray<{ value: TitleSortOption; label: string }>;
  onStatusChange: (value: TitleStatus | 'all' | 'active') => void;
  onAcademicYearChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: TitleSortOption) => void;
};

type GroupReviewListProps = {
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
  onApprove: (record: AdviserTitleRecord) => Promise<void> | void;
  onRequestRevision: (record: AdviserTitleRecord) => Promise<void> | void;
  onReject: (record: AdviserTitleRecord) => Promise<void> | void;
};

export type EvidenceReviewDrawerProps = {
  record: AdviserTitleRecord | null;
  onClose: () => void;
  // No "rejected" option here — the underlying MilestoneCheckpointStatus/ReviewStatus
  // enums have no distinct rejected value, so it would silently save as needs_revision
  // anyway (see the mapping in syncCheckpointReview). Only offer decisions the checkpoint
  // model can actually represent.
  onReviewEvidence: (
    record: AdviserTitleRecord,
    decision: 'approved' | 'needs_revision',
    remarks: string,
    checkpointKey: DefenseApplicationStageKey
  ) => Promise<void> | void;
};

export type DefenseApplicationStageKey =
  | 'concept-defense-application'
  | 'proposal-defense-application'
  | 'final-defense-application';

const DEFENSE_APPLICATION_STAGES: Array<{
  checkpointKey: DefenseApplicationStageKey;
  stageLabel: string;
  reviewField: 'evidenceReview' | 'proposalEvidenceReview' | 'finalEvidenceReview';
  alwaysShow: boolean;
}> = [
  { checkpointKey: 'concept-defense-application', stageLabel: 'Concept', reviewField: 'evidenceReview', alwaysShow: true },
  { checkpointKey: 'proposal-defense-application', stageLabel: 'Proposal', reviewField: 'proposalEvidenceReview', alwaysShow: false },
  { checkpointKey: 'final-defense-application', stageLabel: 'Final', reviewField: 'finalEvidenceReview', alwaysShow: false }
];

// A group's title can be fully decided while a later-stage evidence round (e.g.
// Proposal or Final defense application evidence) is still awaiting the adviser —
// so "is this group still actionable" can't be judged from record.status alone.
// Shared by the card (badge count) and the list (default pending-only filter) so
// they can't drift apart.
export function getGroupPendingStageCount(record: AdviserTitleRecord) {
  return DEFENSE_APPLICATION_STAGES.filter((stage) => {
    const evidenceReview = record[stage.reviewField];
    const status = evidenceReview?.status;
    const hasFileForStage = (evidenceReview?.files?.length ?? 0) > 0;
    // A stage with nothing uploaded yet isn't "awaiting" the adviser — it's
    // waiting on the student, so it shouldn't inflate this count.
    return hasFileForStage && (status === 'SUBMITTED' || status === 'IN_REVIEW' || !status);
  }).length;
}

type TitleUploadedFile = AdviserTitleRecord['uploadedFiles'][number];

const GENERATED_PREVIEW_ID = 'generated';
const OFFICE_FILE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
const IMAGE_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const COMPLIANCE_EVIDENCE_CATEGORIES: Record<string, string> = {
  'concept-defense-application': 'Concept',
  'proposal-defense-application': 'Proposal',
  'final-defense-application': 'Final'
};

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
      className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 text-xs font-bold text-[var(--text)] shadow-sm outline-none transition-all hover:border-slate-300 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 appearance-none cursor-pointer"
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
  if (IMAGE_FILE_EXTENSIONS.includes(extension)) return 'fa-file-image';

  return 'fa-file-lines';
}

function isTitleOfficeFile(file: TitleUploadedFile) {
  const extension = getTitleFileExtension(file.name, file.fileType);

  return OFFICE_FILE_EXTENSIONS.includes(extension);
}

function isTitleImageFile(file: TitleUploadedFile) {
  const extension = getTitleFileExtension(file.name, file.fileType);

  return IMAGE_FILE_EXTENSIONS.includes(extension);
}

// Flags the photo evidence of a signed Application for Oral Defense of Thesis
// (any stage) so the adviser drawer can label it distinctly from the concept
// paper / chapters / manuscript instead of listing it as a generic "attachment".
function isComplianceEvidenceFile(file: TitleUploadedFile) {
  return Boolean(file.documentCategory && COMPLIANCE_EVIDENCE_CATEGORIES[file.documentCategory]);
}

function getComplianceEvidenceStageLabel(file: TitleUploadedFile) {
  return file.documentCategory ? COMPLIANCE_EVIDENCE_CATEGORIES[file.documentCategory] || '' : '';
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

function getEvidenceReviewMeta(status?: string) {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100', icon: 'fa-circle-check' };
    case 'NEEDS_REVISION':
      return { label: 'Needs Revision', className: 'bg-amber-50 text-amber-700 ring-amber-100', icon: 'fa-rotate-left' };
    case 'REJECTED':
      return { label: 'Rejected', className: 'bg-rose-50 text-rose-700 ring-rose-100', icon: 'fa-ban' };
    case 'SUBMITTED':
    case 'IN_REVIEW':
      return { label: 'Pending Review', className: 'bg-blue-50 text-blue-700 ring-blue-100', icon: 'fa-hourglass-half' };
    default:
      return { label: 'Not Uploaded Yet', className: 'bg-slate-100 text-slate-600 ring-slate-200', icon: 'fa-circle-exclamation' };
  }
}

function formatEvidenceUploadedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
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
          className="group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/10"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--color-info)] opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-meta)]">{metric.label}</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--text)] transition-colors group-hover:text-[var(--primary)]">
                {metric.value}
              </p>
            </div>
            <span
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm ring-1 ring-inset ring-current/10 transition-transform duration-300 group-hover:scale-110 ${metric.iconClassName}`}
            >
              <i className={`fas ${metric.icon}`} />
            </span>
          </div>
          <p className="mt-4 text-xs font-medium leading-[1.6] text-[var(--muted)]">{metric.helperText}</p>
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
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-6 shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-blue-500 to-cyan-400 opacity-20" />
      <div className="grid gap-3 xl:grid-cols-[minmax(150px,1fr)_minmax(190px,1fr)_minmax(170px,1fr)_minmax(320px,1.6fr)]">
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
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--muted)]">
            <i className="fas fa-search text-sm" />
          </span>
          <input
            className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] pl-11 pr-4 text-sm font-bold text-[var(--text)] shadow-sm outline-none transition-all placeholder:font-medium placeholder:text-[var(--muted)] hover:border-slate-300 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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

export function GroupReviewList({
  titles,
  onViewDetails,
  onViewApproved,
  hasPendingTitles
}: GroupReviewListProps) {
  const pendingCount = titles.filter((record) => record.status === 'pending').length;
  const completedCount = titles.filter((record) => ['approved', 'needs-revision', 'rejected'].includes(record.status)).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex items-start gap-4">
          <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 text-[var(--primary)] ring-1 ring-[var(--primary)]/20 shadow-sm">
            <i className="fas fa-file-signature text-lg" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--text)]">Group Review Queue</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            <i className="fas fa-list-check text-[10px] opacity-50" />
            {titles.length} group{titles.length === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning)]/10 px-3 py-1.5 text-amber-700 ring-1 ring-inset ring-[var(--color-warning)]/25">
            <i className="fas fa-clock text-[10px]" />
            {pendingCount} pending
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success)]/10 px-3 py-1.5 text-emerald-700 ring-1 ring-inset ring-[var(--color-success)]/25">
            <i className="fas fa-check text-[10px]" />
            {completedCount} processed
          </span>
        </div>
      </div>

      {titles.length ? (
        <div className="space-y-4">
          {titles.map((record) => (
            <GroupReviewCard
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

function GroupReviewCard({
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
    <article
      className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 cursor-pointer"
      onClick={() => onViewDetails(record)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[var(--primary)] to-[var(--color-info)] opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)_260px] xl:items-stretch">
        <div className="min-w-0 pl-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)] ring-1 ring-inset ring-[var(--border)] shadow-sm">
              <i className="fas fa-layer-group text-[10px]" /> {record.department}
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
          </div>

          <h3
            className="mt-4 overflow-hidden text-2xl font-extrabold leading-tight tracking-tight text-[var(--text)] transition-colors group-hover:text-[var(--primary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={record.title}
          >
            {record.title}
          </h3>

          <p
            className="mt-3 max-w-4xl overflow-hidden text-sm font-medium leading-relaxed text-[var(--muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={record.description}
          >
            {record.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)]/8 px-3 py-2 text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/15">
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

          {record.keywords.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {record.keywords.slice(0, 4).map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full bg-[var(--primary)]/5 px-2.5 py-1 text-[11px] font-bold text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/15"
                >
                  #{keyword}
                </span>
              ))}
              {record.keywords.length > 4 ? (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
                  +{record.keywords.length - 4} more
                </span>
              ) : null}
            </div>
          ) : null}
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

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--primary)]/15 bg-gradient-to-br from-[var(--primary)]/5 via-white to-white p-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--primary)]">
              <i className="fas fa-route" /> Next Step
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{reviewStage.helper}</p>
            <p
              className="mt-3 overflow-hidden text-sm italic leading-6 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              title={record.adviserAction}
            >
              "{record.adviserAction}"
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-white shadow-md shadow-[var(--primary)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--hover)] hover:shadow-lg ${
                record.status === 'pending' ? 'ring-2 ring-[var(--primary)]/25 ring-offset-2' : ''
              }`}
              type="button"
              onClick={() => onViewDetails(record)}
            >
              <i className="fas fa-up-right-from-square text-xs" /> {previewButtonLabel}
            </button>
          </div>
        </div>
      </div>

    </article>
  );
}

// Split out from the Group Review Queue above for the same reason Other
// Pending Documents is its own section: bundling a group's title status and
// its Oral Defense Application evidence into one card made it unclear which
// status/badge belonged to which thing, especially once evidence gets a new
// pending round after the title itself is already decided. Only shows
// groups with at least one stage still awaiting an adviser decision.
export function EvidenceQueueList({
  titles,
  isLoading,
  onReviewEvidence
}: {
  titles: AdviserTitleRecord[];
  isLoading: boolean;
  onReviewEvidence: (record: AdviserTitleRecord) => void;
}) {
  const pendingTitles = titles.filter((record) => getGroupPendingStageCount(record) > 0);

  if (isLoading || !pendingTitles.length) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-4 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl p-6 shadow-sm">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-600 ring-1 ring-amber-500/20 shadow-sm">
          <i className="fas fa-file-signature text-lg" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--text)]">Evidence Review Queue</h2>
        </div>
      </div>

      <div className="space-y-4">
        {pendingTitles.map((record) => (
          <EvidenceQueueCard key={record.id} record={record} onReviewEvidence={onReviewEvidence} />
        ))}
      </div>
    </section>
  );
}

function EvidenceQueueCard({
  record,
  onReviewEvidence
}: {
  record: AdviserTitleRecord;
  onReviewEvidence: (record: AdviserTitleRecord) => void;
}) {
  const visibleStages = DEFENSE_APPLICATION_STAGES.filter((stage) => {
    if (stage.alwaysShow) return true;

    const evidenceReview = record[stage.reviewField];
    const hasFile = (evidenceReview?.files?.length ?? 0) > 0;

    return hasFile || (evidenceReview ? evidenceReview.status !== 'PENDING' : false);
  });

  const evidenceFileCount = visibleStages.reduce(
    (total, stage) => total + (record[stage.reviewField]?.files?.length ?? 0),
    0
  );

  // Same rule as before: only fall back to the checkpoint's prior feedback
  // when that stage's current status is itself a decision — a fresh
  // unreviewed round has no decision yet, so showing older leftover feedback
  // next to it would misleadingly suggest the adviser already looked at it.
  const noteStage = visibleStages.find((stage) => {
    const review = record[stage.reviewField];
    if (!review) return false;
    if (review.uploaderNote) return true;
    return Boolean(review.feedback) && review.status !== 'SUBMITTED' && review.status !== 'IN_REVIEW';
  });
  const noteReview = noteStage ? record[noteStage.reviewField] : null;
  const noteText = noteReview?.uploaderNote || noteReview?.feedback || null;
  const noteLabel = noteReview?.uploaderNote ? "Student's note" : 'Adviser feedback';

  const pendingStageCount = getGroupPendingStageCount(record);

  return (
    <article
      className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-lg cursor-pointer"
      onClick={() => onReviewEvidence(record)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-500 to-amber-300 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.45fr)_260px] xl:items-stretch">
        <div className="min-w-0 pl-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)] ring-1 ring-inset ring-[var(--border)] shadow-sm">
              <i className="fas fa-layer-group text-[10px]" /> {record.department}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning)]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-[var(--color-warning)]/25 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              {pendingStageCount} stage{pendingStageCount === 1 ? '' : 's'} pending
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[var(--text)]" title={record.title}>
            {record.title}
          </h3>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)]/8 px-3 py-2 text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/15">
              <i className="fas fa-users-rectangle opacity-70" /> {record.groupId}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-user-group opacity-60" />
              {record.membersCount} members
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {visibleStages.map((stage) => {
              const meta = getEvidenceReviewMeta(record[stage.reviewField]?.status);
              return (
                <span
                  key={stage.checkpointKey}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black ring-1 ring-inset ${meta.className}`}
                >
                  <i className={`fas ${meta.icon} text-[10px]`} aria-hidden="true" />
                  {stage.stageLabel}: {meta.label}
                </span>
              );
            })}
          </div>

          <p className="mt-3 text-xs font-bold text-slate-500">
            {evidenceFileCount ? `${evidenceFileCount} file${evidenceFileCount === 1 ? '' : 's'}` : 'No file yet'}
          </p>

          {noteText ? (
            <p
              className="mt-2 max-w-2xl overflow-hidden text-sm italic leading-6 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              title={noteText}
            >
              <span className="not-italic font-bold text-slate-600">{noteLabel}: </span>"{noteText}"
            </p>
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-3 rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 via-white to-white p-4">
          <button
            className="relative inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-4 text-sm font-black text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--accent)]/25"
            type="button"
            onClick={() => onReviewEvidence(record)}
          >
            <i className="fas fa-file-signature text-xs" /> Review Evidence
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1.5 text-[11px] font-black text-white">
              {pendingStageCount}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

export type OtherDocumentsGroup = {
  projectId: string;
  projectTitle: string;
  groupLabel: string;
  groupMembers: Array<{ userId?: string; name: string; role: string; isLeader: boolean }>;
  files: DocumentFileSummary[];
};

// Deliberately its own section, separate from the Group Review Queue above —
// a group's pending chapters/manuscripts/etc. often belong to a different
// stage (e.g. Proposal) than the title card's own Concept-stage evidence, so
// bundling them into the same per-group card was misleading about what stage
// each thing actually belongs to.
export function OtherDocumentsQueueList({
  groups,
  isLoading,
  savingFileId,
  onDecide
}: {
  groups: OtherDocumentsGroup[];
  isLoading: boolean;
  savingFileId: string | null;
  onDecide: (file: DocumentFileSummary, decision: 'approved' | 'needs_revision', remarks: string) => void;
}) {
  if (isLoading || !groups.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <OtherDocumentsQueueCard key={group.projectId} group={group} savingFileId={savingFileId} onDecide={onDecide} />
      ))}
    </div>
  );
}

function OtherDocumentsQueueCard({
  group,
  savingFileId,
  onDecide
}: {
  group: OtherDocumentsGroup;
  savingFileId: string | null;
  onDecide: (file: DocumentFileSummary, decision: 'approved' | 'needs_revision', remarks: string) => void;
}) {
  const [reviewingDocument, setReviewingDocument] = useState<DocumentFileSummary | null>(null);
  const firstFile = group.files[0] || null;
  // Files in this group can span more than one stage/category (e.g. a Proposal
  // chapter and a System Files upload both pending at once) — surface each
  // distinct one as its own badge so the adviser knows what they're looking at
  // without opening every file. Category (e.g. "System Files") and stage (e.g.
  // "Development") aren't the same thing — a category badge alone doesn't tell
  // an adviser which workflow stage it belongs to, so both are shown.
  const categoryLabels = Array.from(new Set(group.files.map((file) => getProjectFileCategoryLabel(file.documentCategory))));
  const stageLabels = Array.from(new Set(group.files.map((file) => getDocumentCategoryStage(file.documentCategory))));

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[var(--primary)] to-[var(--color-info)] opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)_260px] xl:items-stretch">
        <div className="min-w-0 pl-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {stageLabels.map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/8 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/20 shadow-sm">
                <i className="fas fa-route text-[10px]" /> {label} Stage
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-sm bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Pending
            </span>
          </div>

          <h3
            className="mt-4 overflow-hidden text-2xl font-extrabold leading-tight tracking-tight text-[var(--text)] transition-colors group-hover:text-[var(--primary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={group.projectTitle}
          >
            {group.projectTitle}
          </h3>

          <p className="mt-3 max-w-4xl text-sm font-medium leading-relaxed text-[var(--muted)]">
            {categoryLabels.length === 1
              ? `${categoryLabels[0]} document${group.files.length === 1 ? '' : 's'} awaiting your review.`
              : `Documents awaiting your review across ${categoryLabels.length} categories: ${categoryLabels.join(', ')}.`}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)]/8 px-3 py-2 text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/15">
              <i className="fas fa-users-rectangle opacity-70" /> {group.groupLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-inset ring-slate-200">
              <i className="fas fa-file-lines opacity-60" />
              {group.files.length} file{group.files.length === 1 ? '' : 's'}
            </span>
          </div>

          {group.groupMembers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {group.groupMembers.slice(0, 4).map((member, idx) => (
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
              {group.groupMembers.length > 4 ? (
                <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
                  +{group.groupMembers.length - 4} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/80">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <i className="fas fa-file-lines text-blue-500" /> Files Pending
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{group.files.length}</span>
              <span className="inline-flex rounded-lg bg-[var(--color-warning)]/10 px-2.5 py-1 text-xs font-black text-amber-700 ring-1 ring-inset ring-[var(--color-warning)]/25">
                Awaiting Review
              </span>
            </div>
            <p className="mt-2 truncate text-xs font-bold text-slate-500" title={firstFile?.fileName}>
              {firstFile ? firstFile.fileName : 'No file'}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--primary)]/15 bg-gradient-to-br from-[var(--primary)]/5 via-white to-white p-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--primary)]">
              <i className="fas fa-route" /> Next Step
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
              Open each file to preview and decide.
            </p>
            <p className="mt-3 text-sm italic leading-6 text-slate-500">
              {group.files.length} file{group.files.length === 1 ? '' : 's'} awaiting your review.
            </p>
          </div>
          {firstFile ? (
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-white shadow-md shadow-[var(--primary)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--hover)] hover:shadow-lg disabled:opacity-50"
              type="button"
              disabled={savingFileId === firstFile.id}
              onClick={() => setReviewingDocument(firstFile)}
            >
              <i className={`fas ${savingFileId === firstFile.id ? 'fa-spinner fa-spin' : 'fa-eye'} text-xs`} /> Review Documents
            </button>
          ) : null}
        </div>
      </div>

      {reviewingDocument ? (
        <OtherDocumentReviewModal
          file={reviewingDocument}
          isSaving={savingFileId === reviewingDocument.id}
          onClose={() => setReviewingDocument(null)}
          onDecide={(decision, remarks) => {
            onDecide(reviewingDocument, decision, remarks);
            setReviewingDocument(null);
          }}
        />
      ) : null}
    </article>
  );
}

function OtherDocumentReviewModal({
  file,
  isSaving,
  onClose,
  onDecide
}: {
  file: DocumentFileSummary;
  isSaving: boolean;
  onClose: () => void;
  onDecide: (decision: 'approved' | 'needs_revision', remarks: string) => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.removeProperty('overflow'); };
  }, []);

  // Office files (doc/docx/ppt/pptx/xls/xlsx) can't render natively in an
  // iframe — pointed at the raw file, the browser just downloads it instead
  // of showing it. Same fix as the Title drawer's preview: fetch a signed URL
  // and hand it to Google's viewer for those types.
  useEffect(() => {
    let cancelled = false;

    const loadSignedUrl = async () => {
      try {
        const response = await fetch(`/api/document-files/${file.id}/signed-url`, { method: 'POST' });
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
    };

    loadSignedUrl();

    return () => {
      cancelled = true;
    };
  }, [file.id]);

  if (!isMounted) {
    return null;
  }

  const isOfficeFile = OFFICE_FILE_EXTENSIONS.includes(getTitleFileExtension(file.fileName, file.fileType));
  const previewUrl = signedUrl
    ? isOfficeFile
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`
      : signedUrl
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        aria-label="Document review modal"
        aria-modal="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-[1560px] flex-col overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-white/60"
      >
        <header className="relative shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                <i className="fas fa-file-lines opacity-70" /> Document Review
              </p>
              <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900 leading-tight" title={file.fileName}>{file.fileName}</h2>
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
              {getProjectFileCategoryLabel(file.documentCategory)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200/60">
              <i className="fas fa-hard-drive text-[10px]" aria-hidden="true" />
              {formatFileSizeLabel(file.fileSize || 0)}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-4 py-4 sm:px-6 sm:py-6 custom-scrollbar">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0 space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-700">
                      {getTitleFileExtension(file.fileName, file.fileType).toUpperCase()} Preview
                    </p>
                    <h2 className="mt-1 truncate text-lg font-black text-slate-950">Document Preview</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                      href={previewUrl || `/api/document-files/${file.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fas fa-up-right-from-square text-[10px]" aria-hidden="true" />
                      Open
                    </a>
                    <a
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                      href={`/api/document-files/${file.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fas fa-download text-[10px]" aria-hidden="true" />
                      Download
                    </a>
                  </div>
                </div>

                <div className="bg-slate-100 p-3 sm:p-4">
                  {previewError ? (
                    <div className="flex h-[min(70vh,780px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-center">
                      <i className="fas fa-triangle-exclamation text-2xl text-amber-500" aria-hidden="true" />
                      <p className="text-sm font-bold text-slate-600">{previewError}</p>
                      <p className="text-xs text-slate-400">Use Download instead.</p>
                    </div>
                  ) : previewUrl ? (
                    <iframe
                      className="h-[min(70vh,780px)] w-full rounded-xl border border-slate-200 bg-white"
                      src={previewUrl}
                      title={`${file.fileName} preview`}
                    />
                  ) : (
                    <div className="flex h-[min(70vh,780px)] w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white">
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
                    <i className="fas fa-clipboard-check" /> Document Decision
                  </p>
                  <h3 className="mt-1 text-lg font-black">Ready for Decision</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-blue-100">
                    Review the document, then approve it or send it back for revision.
                  </p>
                </div>

                <div className="p-5">
                  <label className="block">
                    <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-blue-700">
                      <i className="fas fa-comment-dots" /> Adviser Remarks
                    </span>
                    <textarea
                      className="mt-3 min-h-[130px] w-full rounded-xl border border-blue-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Add notes for approval or revision..."
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                    />
                  </label>

                  <div className="mt-4 grid gap-3">
                    <button
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-lg focus:outline-none disabled:opacity-50"
                      type="button"
                      disabled={isSaving}
                      onClick={() => onDecide('approved', remarks)}
                    >
                      <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-check'}`} /> Approve
                    </button>
                    <button
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-6 text-sm font-black text-amber-700 shadow-sm ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 hover:ring-amber-300 focus:outline-none disabled:opacity-50"
                      type="button"
                      disabled={isSaving}
                      onClick={() => onDecide('needs_revision', remarks)}
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
  // Evidence photos now live only in the separate EvidenceReviewDrawer, so this drawer's
  // file preview/attached-documents lists stay scoped to the title proposal's own files.
  const uploadedFiles = (record?.uploadedFiles ?? []).filter((file) => !isComplianceEvidenceFile(file));
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
                    <h2 className="mt-1 truncate text-lg font-black text-slate-950">
                      {selectedUploadedFile && isComplianceEvidenceFile(selectedUploadedFile)
                        ? `Oral Defense Application Evidence (${getComplianceEvidenceStageLabel(selectedUploadedFile)})`
                        : 'Proposal Preview'}
                    </h2>
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
                        {isComplianceEvidenceFile(file) ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">
                            Evidence
                          </span>
                        ) : null}
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
                        ) : isTitleImageFile(selectedUploadedFile) ? (
                          <div className="flex h-[clamp(620px,76vh,960px)] w-full items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-950/90 p-3">
                            <img
                              src={selectedPreviewUrl || selectedUploadedFile.previewUrl || selectedUploadedFile.url}
                              alt={`${selectedUploadedFile.name} preview`}
                              className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                            />
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
                            <p className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-800">
                              {file.name}
                              {isComplianceEvidenceFile(file) ? (
                                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">
                                  {getComplianceEvidenceStageLabel(file)} Defense Application Evidence
                                </span>
                              ) : null}
                            </p>
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
                <PremiumAnimatedButton
                  className={`rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm ${
                    confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    confirmAction === 'revise' ? 'bg-amber-600 hover:bg-amber-700' :
                    'bg-rose-600 hover:bg-rose-700'
                  }`}
                  onPress={async () => {
                    if (confirmAction === 'approve') await onApprove(record);
                    if (confirmAction === 'revise') await onRequestRevision(record);
                    if (confirmAction === 'reject') await onReject(record);
                    await new Promise(r => setTimeout(r, 600)); // Minimum animation time
                    setConfirmAction(null);
                  }}
                >
                  Confirm Decision
                </PremiumAnimatedButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Fully separate from TitleDetailsDrawer/its "Open Preview" button — a title decision and
// an evidence decision are independent checkpoints on the backend (see applyDecision vs
// applyEvidenceDecision in adviser-title-approval.tsx), and this drawer keeps that true in
// the UI too: approving a title here can never also affect evidence status, because there's
// no shared approve action or shared state between the two anymore.
export function EvidenceReviewDrawer({ record, onClose, onReviewEvidence }: EvidenceReviewDrawerProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (record) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [!!record]);

  const [evidenceRemarksDrafts, setEvidenceRemarksDrafts] = useState<Record<string, string>>({});
  const [submittingEvidenceKey, setSubmittingEvidenceKey] = useState<DefenseApplicationStageKey | null>(null);
  // Which photo is currently shown per stage, when a stage has more than one uploaded file.
  const [evidenceSlideIndex, setEvidenceSlideIndex] = useState<Record<string, number>>({});
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  // A native window.confirm() can silently return false (or never appear at all) in some
  // embedded/webview browser contexts, which made Approve/Reject look like they did nothing.
  // This in-app confirm (same pattern as TitleDetailsDrawer's) doesn't depend on the browser's
  // own dialog implementation.
  const [confirmEvidenceAction, setConfirmEvidenceAction] = useState<{
    checkpointKey: DefenseApplicationStageKey;
    decision: 'approved' | 'needs_revision';
    stageLabel: string;
  } | null>(null);

  // A group can have multiple evidence stages pending at once, so a single decision
  // shouldn't close the drawer out from under the adviser if other stages still need
  // review. This flag is set right after a successful decision, and the effect below
  // closes the drawer once the record (re-derived from fresh parent state) shows no
  // pending stages left.
  const justDecidedRef = useRef(false);
  useEffect(() => {
    if (record && justDecidedRef.current && getGroupPendingStageCount(record) === 0) {
      justDecidedRef.current = false;
      onClose();
    }
  }, [record, onClose]);

  const submitEvidenceDecision = async (
    checkpointKey: DefenseApplicationStageKey,
    decision: 'approved' | 'needs_revision'
  ) => {
    if (!record || submittingEvidenceKey) {
      return;
    }

    setEvidenceError(null);
    setSubmittingEvidenceKey(checkpointKey);

    try {
      await onReviewEvidence(record, decision, evidenceRemarksDrafts[checkpointKey] || '', checkpointKey);
      setEvidenceRemarksDrafts((current) => ({ ...current, [checkpointKey]: '' }));
      justDecidedRef.current = true;
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : 'Unable to update the evidence review.');
    } finally {
      setSubmittingEvidenceKey(null);
    }
  };

  if (!record || !isMounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        aria-label="Oral defense application evidence modal"
        aria-modal="true"
        className="relative flex flex-col max-h-full w-full max-w-[900px] overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-white/60 transition-all scale-100"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="relative shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-600">
                <i className="fas fa-file-signature opacity-70" /> Oral Defense Application Evidence
              </p>
              <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900 leading-tight">{record.title}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {record.groupId} · Reviewed independently from the title decision
              </p>
            </div>
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none"
              type="button"
              onClick={onClose}
            >
              <i className="fas fa-xmark text-lg" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-4 py-4 sm:px-6 sm:py-6 custom-scrollbar space-y-5">
          {evidenceError && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-800 shadow-sm">
              <i className="fas fa-circle-exclamation mt-0.5 shrink-0" aria-hidden="true" />
              <p>{evidenceError}</p>
            </div>
          )}

          {DEFENSE_APPLICATION_STAGES.map((stage) => {
            const evidenceReview = record[stage.reviewField];
            // Sourced from the checkpoint's latest submission (evidenceReview.files),
            // not a category-wide filter over every file ever uploaded — otherwise a
            // resubmission after "Needs Revision" would pile up next to the old,
            // already-superseded photo instead of replacing it in this carousel.
            const evidenceFiles = evidenceReview?.files ?? [];
            const slideIndex = Math.min(evidenceSlideIndex[stage.checkpointKey] ?? 0, Math.max(evidenceFiles.length - 1, 0));
            const evidenceFile = evidenceFiles[slideIndex] ?? null;
            // ensureProjectMilestoneWorkflow pre-creates every stage's checkpoint row up
            // front, so evidenceReview exists (status PENDING) even for a stage the group
            // hasn't reached yet — checking the file/status is what actually tells us
            // whether there's real activity to show.
            const hasStageActivity = evidenceFiles.length > 0 || (evidenceReview ? evidenceReview.status !== 'PENDING' : false);
            // Once a stage is already decided there's nothing left to act on here — it
            // already has a read-only home on Document Submissions (see
            // toAdviserSubmissionRecordsFromEvidence in submission-workspace-data.ts),
            // so this drawer (which exists to collect pending decisions) doesn't need
            // to keep showing it too. This also removes the chance of an accidental
            // re-decision flipping an approved stage back to Needs Revision, which now
            // deletes its stored photo (see defense-application-evidence/route.ts).
            const isDecided = evidenceReview
              ? ['APPROVED', 'COMPLETED', 'REJECTED'].includes(evidenceReview.status)
              : false;

            // Proposal/Final cards only appear once there's something to review — no point
            // cluttering the drawer with a card for a stage the group hasn't reached yet
            // (Concept's card otherwise always shows). A decided stage never shows here
            // regardless of alwaysShow.
            if (isDecided || (!stage.alwaysShow && !hasStageActivity)) {
              return null;
            }

            const remarksValue = evidenceRemarksDrafts[stage.checkpointKey] || '';
            const isSubmitting = submittingEvidenceKey === stage.checkpointKey;

            return (
              <section
                key={stage.checkpointKey}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                      <i className="fas fa-file-signature" /> {stage.stageLabel} Stage
                    </p>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ring-1 ring-inset ${getEvidenceReviewMeta(evidenceReview?.status).className}`}>
                      <i className={`fas ${getEvidenceReviewMeta(evidenceReview?.status).icon}`} aria-hidden="true" />
                      {getEvidenceReviewMeta(evidenceReview?.status).label}
                    </span>
                  </div>

                  {evidenceFile ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <div className="relative">
                        {isTitleImageFile(evidenceFile) ? (
                          <img
                            src={evidenceFile.previewUrl || evidenceFile.url}
                            alt={`${stage.stageLabel} evidence ${slideIndex + 1} of ${evidenceFiles.length}`}
                            className="max-h-[420px] w-full bg-slate-950/5 object-contain"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-4">
                            <i className={`fas ${getTitleFileIcon(evidenceFile)} text-2xl text-blue-600`} aria-hidden="true" />
                            <span className="truncate text-sm font-bold text-slate-800">{evidenceFile.name}</span>
                          </div>
                        )}

                        {evidenceFiles.length > 1 && (
                          <>
                            <button
                              type="button"
                              aria-label="Previous evidence photo"
                              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white shadow-sm transition hover:bg-slate-900/80"
                              onClick={() =>
                                setEvidenceSlideIndex((current) => ({
                                  ...current,
                                  [stage.checkpointKey]: (slideIndex - 1 + evidenceFiles.length) % evidenceFiles.length
                                }))
                              }
                            >
                              <i className="fas fa-chevron-left text-xs" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label="Next evidence photo"
                              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white shadow-sm transition hover:bg-slate-900/80"
                              onClick={() =>
                                setEvidenceSlideIndex((current) => ({
                                  ...current,
                                  [stage.checkpointKey]: (slideIndex + 1) % evidenceFiles.length
                                }))
                              }
                            >
                              <i className="fas fa-chevron-right text-xs" aria-hidden="true" />
                            </button>
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-bold text-white">
                              {slideIndex + 1} / {evidenceFiles.length}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2.5">
                        <span className="truncate text-xs font-bold text-slate-500">
                          {evidenceFile.name}
                          {evidenceFile.uploadedAt ? (
                            <span className="font-medium text-slate-400"> · {formatEvidenceUploadedAt(evidenceFile.uploadedAt)}</span>
                          ) : null}
                        </span>
                        <div className="flex shrink-0 gap-2">
                          <a
                            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                            href={evidenceFile.previewUrl || evidenceFile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-up-right-from-square text-[10px]" aria-hidden="true" /> Open
                          </a>
                          <a
                            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                            href={evidenceFile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-download text-[10px]" aria-hidden="true" /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {evidenceReview?.uploaderNote ? (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm font-medium text-slate-700">
                      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-blue-700">
                        <i className="fas fa-comment" aria-hidden="true" /> Student&apos;s Note
                      </p>
                      <p className="mt-1.5">{evidenceReview.uploaderNote}</p>
                    </div>
                  ) : null}

                  {evidenceReview?.feedback ? (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-100">
                      <strong className="text-slate-900">
                        {evidenceReview.feedbackBy || 'Adviser'}:
                      </strong>{' '}
                      {evidenceReview.feedback}
                    </div>
                  ) : null}

                  {evidenceReview && isDecided ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500 ring-1 ring-inset ring-slate-100">
                      <i className="fas fa-circle-check text-emerald-500" aria-hidden="true" />
                      Decision recorded for this stage. Re-review happens only after the group resubmits.
                    </div>
                  ) : evidenceReview ? (
                    <>
                      <label className="mt-4 block">
                        <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                          <i className="fas fa-comment-dots" /> Evidence Remarks
                        </span>
                        <textarea
                          className="mt-3 min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Add notes about the signatures or clearance..."
                          value={remarksValue}
                          onChange={(event) => setEvidenceRemarksDrafts((current) => ({ ...current, [stage.checkpointKey]: event.target.value }))}
                        />
                      </label>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setConfirmEvidenceAction({ checkpointKey: stage.checkpointKey, decision: 'approved', stageLabel: stage.stageLabel })}
                        >
                          <i className="fas fa-check" /> Approve
                        </button>
                        <button
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 text-xs font-black text-amber-700 shadow-sm ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 disabled:opacity-60"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setConfirmEvidenceAction({ checkpointKey: stage.checkpointKey, decision: 'needs_revision', stageLabel: stage.stageLabel })}
                        >
                          <i className="fas fa-rotate-left" /> Revise
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 rounded-xl bg-amber-50/70 p-3 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-100">
                      Waiting for the group to upload the signed application photo from Document Submissions.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {confirmEvidenceAction && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  confirmEvidenceAction.decision === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <i className={`fas ${
                    confirmEvidenceAction.decision === 'approved' ? 'fa-check' : 'fa-rotate-left'
                  } text-xl`} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {confirmEvidenceAction.decision === 'approved' ? 'Approve Evidence' : 'Request Revision'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {confirmEvidenceAction.decision === 'approved'
                      ? `Approve the ${confirmEvidenceAction.stageLabel.toLowerCase()} stage's oral defense application evidence?`
                      : `Send the ${confirmEvidenceAction.stageLabel.toLowerCase()} stage's evidence back for revision?`}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  onClick={() => setConfirmEvidenceAction(null)}
                >
                  Cancel
                </button>
                <PremiumAnimatedButton
                  className={`rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm ${
                    confirmEvidenceAction.decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                  onPress={async () => {
                    const { checkpointKey, decision } = confirmEvidenceAction;
                    await submitEvidenceDecision(checkpointKey, decision);
                    await new Promise((resolve) => setTimeout(resolve, 600));
                    setConfirmEvidenceAction(null);
                  }}
                >
                  Confirm Decision
                </PremiumAnimatedButton>
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
