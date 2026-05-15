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
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        aria-label="Title details modal"
        aria-modal="true"
        className="flex flex-col max-h-full w-full max-w-[700px] overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-white/60 transition-all scale-100"
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
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ring-1 ring-inset ring-current/20 ${statusMeta.badgeClassName}`}>
              {statusMeta.label}
            </span>
            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200/60">
              {record.academicYear}
            </span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 custom-scrollbar bg-slate-50/30">
          
          <div className="grid gap-4 sm:grid-cols-2">
            <DrawerMeta icon="fa-users-rectangle" label="Group ID" value={record.groupId} />
            <DrawerMeta icon="fa-user-group" label="Members" value={`${record.membersCount} members`} />
            <DrawerMeta icon="fa-calendar-day" label="Submitted" value={formatTitleDate(record.submittedAt)} />
            <DrawerMeta icon="fa-spinner" label="Current Status" value={statusMeta.label} />
          </div>

          <section className="mt-6 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200/60 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">
              <i className="fas fa-paperclip" /> Attached Documents
            </p>
            {record.uploadedFiles && record.uploadedFiles.length > 0 ? (
              <div className="grid gap-3">
                {record.uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-blue-300 hover:bg-blue-50 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        <i className="fas fa-file-pdf" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-800">{file.name}</p>
                        <p className="text-xs font-medium text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <a 
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-white px-4 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-600 hover:text-white hover:ring-blue-600 ml-2"
                    >
                      View File
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.25rem] bg-blue-50/50 p-4 ring-1 ring-inset ring-blue-100/50">
                <p className="text-sm font-medium leading-relaxed text-blue-900">
                  No physical files were uploaded. You can view or download the generated title summary document instead.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
                    type="button"
                    onClick={() => openTitleSubmissionDocument(documentData)}
                  >
                    <i className="fas fa-file-lines" aria-hidden="true" />
                    View Generated Doc
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50"
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

          <section className="mt-5 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200/60 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
               <i className="fas fa-users" /> Group Information
            </p>
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

          <section className="mt-5 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200/60 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
               <i className="fas fa-align-left" /> Project Description
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-700">{record.description}</p>
          </section>

          <section className="mt-5 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200/60 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
               <i className="fas fa-tags" /> Keywords
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {record.keywords.map((keyword) => (
                <span key={keyword} className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200">
                  #{keyword}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <SimilarityIndicator score={record.similarityScore} similarTitles={record.similarTitles} />
          </section>

          <section className="mt-5 rounded-[1.5rem] bg-blue-50/30 p-5 ring-1 ring-blue-100/50 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-blue-600">
               <i className="fas fa-comment-dots" /> Adviser Remarks
            </p>
            <textarea
              className="mt-4 min-h-[120px] w-full rounded-xl border border-blue-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="Add your backend-ready notes for approval, revision, or rejection..."
              value={remarksDraft}
              onChange={(event) => onRemarksChange(event.target.value)}
            />
          </section>
        </div>

        {/* Footer Actions - Sticky */}
        <footer className="shrink-0 border-t border-slate-100 bg-white/90 backdrop-blur px-6 py-5 sm:px-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 transition hover:bg-rose-50 hover:ring-rose-300 focus:outline-none"
                type="button"
                onClick={() => onReject(record)}
              >
                <i className="fas fa-ban" /> Reject
              </button>
              <button
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50 hover:ring-blue-300 focus:outline-none"
                type="button"
                onClick={() => onRequestRevision(record)}
              >
                <i className="fas fa-rotate-left" /> Request Revision
              </button>
            </div>
            <button
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-lg focus:outline-none"
              type="button"
              onClick={() => onApprove(record)}
            >
              <i className="fas fa-check" /> Approve Title
            </button>
          </div>
        </footer>
      </div>
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
    <article className="group relative rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/60 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgb(0,58,143,0.12)] hover:ring-[var(--primary)]/30 z-10 hover:z-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-[2rem] bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 opacity-80 transition-opacity group-hover:opacity-100" />
      
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr_1fr] xl:items-start pt-2">
        {/* Left: Title & Group Info */}
        <div className="min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold tracking-wide text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200/80">
              <i className="fas fa-layer-group text-[10px] text-slate-400" /> IT
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-inset ${statusMeta.badgeClassName} ring-current/20`}>
              {record.status === 'pending' && (
                <span className="relative flex h-2 w-2 mr-0.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" /></span>
              )}
              {statusMeta.label}
            </span>
            {fileCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200/80">
                <i className="fas fa-paperclip opacity-70" /> {fileCount} file{fileCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <h3
            className="mt-5 text-[1.4rem] font-extrabold leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-blue-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={record.title}
          >
            {record.title}
          </h3>
          
          <div className="mt-4 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
              <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100/50 shadow-sm">
                <i className="fas fa-users-rectangle opacity-70" /> {record.groupId}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <i className="fas fa-user-group opacity-60" />
                {record.membersCount} members
              </span>
            </div>

            {record.groupMembers && record.groupMembers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.groupMembers.map((member, idx) => (
                  <span 
                    key={idx} 
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ring-1 ring-inset shadow-sm ${
                      member.isLeader 
                        ? 'bg-amber-50 text-amber-700 ring-amber-200/80' 
                        : 'bg-white text-slate-600 ring-slate-200/80'
                    }`}
                  >
                    {member.isLeader ? (
                      <i className="fas fa-crown text-amber-500 text-[10px]" />
                    ) : (
                      <i className="fas fa-user text-slate-400 text-[10px]" />
                    )}
                    {member.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <span className="opacity-40">|</span> <span className="font-medium">{formatMemberPreview(record.memberPreview)}</span>
              </p>
            )}
          </div>

          <p
            className="mt-5 text-[0.95rem] leading-relaxed text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
            title={record.description}
          >
            {record.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {record.keywords.map((keyword) => (
              <span key={keyword} className="inline-flex rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200 shadow-sm">
                #{keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Center: Submission Info & Similarity */}
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-gradient-to-b from-slate-50/80 to-white p-5 ring-1 ring-inset ring-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <i className="fas fa-info text-[10px]" />
              </span>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Submission Info
              </p>
            </div>
            
            <dl className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 font-medium">Submitted</dt>
                <dd className="font-bold text-slate-800">{formatTitleDate(record.submittedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 font-medium">Members</dt>
                <dd className="font-bold text-slate-800">{record.membersCount} members</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 font-medium">Academic Year</dt>
                <dd className="font-bold text-slate-800">{record.academicYear}</dd>
              </div>
              {fileCount > 0 && (
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 border-dashed">
                  <dt className="text-slate-500 font-medium">Documents</dt>
                  <dd className="font-bold text-emerald-600">{fileCount} attached</dd>
                </div>
              )}
            </dl>
          </div>

          <SimilarityIndicator compact score={record.similarityScore} similarTitles={record.similarTitles} />
        </div>

        {/* Right: Actions Panel */}
        <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-50/50 via-white to-white p-5 ring-1 ring-inset ring-blue-100/60 shadow-[0_4px_20px_rgb(59,130,246,0.05)] h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100/50">
             <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
               <i className="fas fa-clipboard-check text-[10px]" />
             </span>
             <p className="text-xs font-extrabold uppercase tracking-widest text-blue-800">
               Adviser Action
             </p>
          </div>
          
          <div>
            <p
              className="text-[0.95rem] font-medium italic leading-relaxed text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
              title={record.adviserAction}
            >
              "{record.adviserAction}"
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-blue-700 transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md"
                type="button"
                onClick={() => onApprove(record)}
              >
                <i className="fas fa-check" /> Approve
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200 transition-all hover:bg-blue-50 hover:-translate-y-0.5 hover:ring-blue-300"
                type="button"
                onClick={() => onRequestRevision(record)}
              >
                <i className="fas fa-rotate-left" /> Revise
              </button>
            </div>
            
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 transition-all hover:bg-rose-100 hover:-translate-y-0.5 hover:ring-rose-300"
              type="button"
              onClick={() => onReject(record)}
            >
              <i className="fas fa-ban" /> Reject
            </button>
            
            <button
              className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/30"
              type="button"
              onClick={() => onViewDetails(record)}
            >
              <i className="fas fa-expand text-slate-300" /> View Full Details
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
