import type { ReactNode } from 'react';
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
  onApprove: (record: AdviserTitleRecord) => void;
  onRequestRevision: (record: AdviserTitleRecord) => void;
  onReject: (record: AdviserTitleRecord) => void;
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
  onApprove,
  onRequestRevision,
  onReject,
  onViewDetails,
  onViewApproved,
  hasPendingTitles
}: TitleListProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(0,58,143,0.06)] text-[var(--primary)]">
            <i className="fas fa-file-signature" />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Title Review Queue</h2>
            <p className="mt-0.5 text-sm text-[var(--text-light)]">
              Review proposed IT project titles, validate originality indicators, and record the next adviser decision.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            <i className="fas fa-list-check text-[10px] opacity-50" />
            {titles.length} title record{titles.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {titles.length ? (
        <div className="space-y-4">
          {titles.map((record) => (
            <TitleCard
              key={record.id}
              record={record}
              onApprove={onApprove}
              onReject={onReject}
              onRequestRevision={onRequestRevision}
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
  if (!record) {
    return null;
  }

  const statusMeta = getTitleStatusMeta(record.status);
  const documentData = createAdviserTitleDocumentData(record);

  return (
    <div className="fixed inset-0 z-[1300] flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <aside
        aria-label="Title details"
        aria-modal="true"
        className="h-full w-full max-w-[540px] overflow-y-auto bg-slate-50/95 backdrop-blur-3xl px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:px-6 ring-1 ring-white/20"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]/80">Title Details</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">{record.title}</h2>
          </div>
          <button
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/60 border border-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white"
            type="button"
            onClick={onClose}
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-[rgba(0,58,143,0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
            IT
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
            {statusMeta.label}
          </span>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {record.academicYear}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DrawerMeta label="Group ID" value={record.groupId} />
          <DrawerMeta label="Members" value={`${record.membersCount} members`} />
          <DrawerMeta label="Submitted" value={formatTitleDate(record.submittedAt)} />
          <DrawerMeta label="Current Status" value={statusMeta.label} />
        </div>

        <section className="mt-6 rounded-[1.35rem] bg-white/70 backdrop-blur shadow-sm border border-white/80 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)] mb-3">
            Attached Documents
          </p>
          {record.uploadedFiles && record.uploadedFiles.length > 0 ? (
            <div className="grid gap-3">
              {record.uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm hover:border-[var(--primary)] hover:shadow-md transition group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/5 text-[var(--primary)] transition group-hover:bg-[var(--primary)]/10">
                      <i className="fas fa-file-pdf" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                      <p className="text-xs font-medium text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <a 
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--primary-dark)] ml-2"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] bg-[rgba(0,58,143,0.04)] p-4 ring-1 ring-inset ring-[rgba(0,58,143,0.08)]">
              <p className="text-sm leading-6 text-[var(--text-dark)] font-medium">
                No physical files were uploaded. Open the generated summary document for review.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-dark)] hover:shadow"
                  type="button"
                  onClick={() => openTitleSubmissionDocument(documentData)}
                >
                  <i className="fas fa-file-lines" aria-hidden="true" />
                  View Generated Doc
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-semibold text-[var(--primary)] shadow-sm transition hover:bg-[rgba(0,58,143,0.04)]"
                  type="button"
                  onClick={() => downloadTitleSubmissionDocument(documentData)}
                >
                  <i className="fas fa-download" aria-hidden="true" />
                  Download
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[1.35rem] bg-white/70 backdrop-blur shadow-sm border border-white/80 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Group Information</p>
          <p className="mt-3 text-sm font-semibold text-[var(--text-dark)]">
            {formatMemberPreview(record.memberPreview, 3)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-light)]">
            Assigned IT group under {record.academicYear}.
          </p>
        </section>

        <section className="mt-5 rounded-[1.35rem] bg-white/70 backdrop-blur shadow-sm border border-white/80 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Project Description</p>
          <p className="mt-3 text-sm leading-7 text-[var(--text-dark)]">{record.description}</p>
        </section>

        <section className="mt-5 rounded-[1.35rem] bg-white/70 backdrop-blur shadow-sm border border-white/80 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Keywords</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {record.keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <SimilarityIndicator score={record.similarityScore} similarTitles={record.similarTitles} />
        </section>

        <section className="mt-5 rounded-[1.35rem] bg-white/70 backdrop-blur shadow-sm border border-white/80 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Adviser Remarks</p>
          <textarea
            className="mt-3 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[var(--text-dark)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)]"
            placeholder="Add a backend-ready adviser note for approval, revision, or rejection."
            value={remarksDraft}
            onChange={(event) => onRemarksChange(event.target.value)}
          />
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            type="button"
            onClick={() => onApprove(record)}
          >
            Approve
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-semibold text-[var(--primary)] transition hover:bg-[rgba(0,58,143,0.04)]"
            type="button"
            onClick={() => onRequestRevision(record)}
          >
            Request Revision
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 sm:col-span-2"
            type="button"
            onClick={() => onReject(record)}
          >
            Reject
          </button>
        </div>
      </aside>
    </div>
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
    <section className={`rounded-[1.35rem] ${compact ? 'bg-[rgba(248,250,252,0.98)] p-4' : 'bg-slate-50/90 p-4'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Similarity</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-[var(--text-dark)]">{score}%</span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${similarityMeta.toneClass}`}>
              {similarityMeta.label}
            </span>
          </div>
        </div>
        <p className={`text-sm font-semibold ${similarityMeta.helperClass}`}>
          {similarTitles.length
            ? `${similarTitles.length} related title${similarTitles.length === 1 ? '' : 's'} found`
            : 'No related IT titles found'}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {similarTitles.length ? (
          similarTitles.slice(0, compact ? 1 : 2).map((item) => (
            <article key={item.id} className="rounded-2xl bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
                Similar title found
              </p>
              <p className="text-sm font-semibold leading-6 text-[var(--text-dark)]">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--text-light)]">Closest match: {item.similarityScore}%</p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[var(--text-light)]">
            No strongly related archived titles are listed for this proposal.
          </div>
        )}
      </div>
    </section>
  );
}

function TitleCard({
  record,
  onApprove,
  onRequestRevision,
  onReject,
  onViewDetails
}: {
  record: AdviserTitleRecord;
  onApprove: (record: AdviserTitleRecord) => void;
  onRequestRevision: (record: AdviserTitleRecord) => void;
  onReject: (record: AdviserTitleRecord) => void;
  onViewDetails: (record: AdviserTitleRecord) => void;
}) {
  const statusMeta = getTitleStatusMeta(record.status);
  const fileCount = record.uploadedFiles?.length ?? 0;

  return (
    <article className="group relative rounded-[1.75rem] bg-white/80 backdrop-blur-sm p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] ring-1 ring-slate-100/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,58,143,0.10)] hover:ring-[var(--primary)]/20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-[1.75rem] bg-gradient-to-r from-[var(--primary)] via-[#1E40AF] to-[#F6BE00] opacity-60 transition-opacity group-hover:opacity-100" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(280px,0.9fr)] xl:items-start">
        {/* Left: Title & Group Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[rgba(0,58,143,0.07)] to-[rgba(0,58,143,0.03)] px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
              <i className="fas fa-layer-group text-[10px] opacity-60" />
              IT
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
              {record.status === 'pending' ? (
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" /></span>
              ) : null}
              {statusMeta.label}
            </span>
            {fileCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                <i className="fas fa-paperclip text-[10px]" />
                {fileCount} file{fileCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <h3
            className="mt-4 overflow-hidden text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)] transition-colors group-hover:text-[var(--primary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={record.title}
          >
            {record.title}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]">
            <i className="fas fa-users-rectangle text-xs opacity-70" />
            {record.groupId}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-light)]">
            <i className="fas fa-user-group text-[10px] opacity-50" />
            {record.membersCount} members | {formatMemberPreview(record.memberPreview)}
          </p>
          <p
            className="mt-4 overflow-hidden text-sm leading-7 text-[var(--text-dark)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
            title={record.description}
          >
            {record.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {record.keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Center: Submission Info & Similarity */}
        <div className="space-y-4">
          <div className="rounded-[1.35rem] bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 ring-1 ring-inset ring-slate-100">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
              <i className="fas fa-circle-info text-[10px]" />
              Submission Info
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-light)]">Submitted</dt>
                <dd className="font-semibold text-[var(--text-dark)]">{formatTitleDate(record.submittedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-light)]">Members</dt>
                <dd className="font-semibold text-[var(--text-dark)]">{record.membersCount} members</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-light)]">Academic Year</dt>
                <dd className="font-semibold text-[var(--text-dark)]">{record.academicYear}</dd>
              </div>
              {fileCount > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--text-light)]">Documents</dt>
                  <dd className="font-semibold text-emerald-700">{fileCount} attached</dd>
                </div>
              )}
            </dl>
          </div>

          <SimilarityIndicator compact score={record.similarityScore} similarTitles={record.similarTitles} />
        </div>

        {/* Right: Actions Panel */}
        <div className="rounded-[1.5rem] bg-gradient-to-b from-white to-slate-50/80 p-4 ring-1 ring-inset ring-slate-200/70 shadow-sm">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
              <i className="fas fa-clipboard-check text-[10px]" />
              Adviser Action
            </p>
            <p
              className="mt-3 overflow-hidden text-sm leading-7 text-[var(--text-dark)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
              title={record.adviserAction}
            >
              {record.adviserAction}
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--primary-dark)] hover:-translate-y-0.5 hover:shadow-md"
                type="button"
                onClick={() => onApprove(record)}
              >
                <i className="fas fa-check text-xs" /> Approve
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-semibold text-[var(--primary)] shadow-sm transition-all hover:bg-[rgba(0,58,143,0.04)] hover:-translate-y-0.5"
                type="button"
                onClick={() => onRequestRevision(record)}
              >
                <i className="fas fa-rotate-left text-xs" /> Revise
              </button>
            </div>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 shadow-sm transition-all hover:bg-rose-100 hover:-translate-y-0.5"
              type="button"
              onClick={() => onReject(record)}
            >
              <i className="fas fa-ban text-xs" /> Reject
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:from-slate-700 hover:to-slate-600 hover:-translate-y-0.5 hover:shadow-md"
              type="button"
              onClick={() => onViewDetails(record)}
            >
              <i className="fas fa-expand text-xs" /> View Full Details
            </button>
          </div>
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
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.15rem] bg-slate-50/90 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--text-dark)]">{value}</p>
    </article>
  );
}
