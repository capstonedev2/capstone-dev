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
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className="flex min-h-[152px] flex-col justify-between rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-light)]">{metric.label}</p>
              <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--primary)]">
                {metric.value}
              </p>
            </div>
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base ${metric.iconClassName}`}
            >
              <i className={`fas ${metric.icon}`} />
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--text-light)]">{metric.helperText}</p>
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
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="grid gap-3 xl:grid-cols-[minmax(170px,1fr)_minmax(150px,1fr)_minmax(190px,1fr)_minmax(170px,1fr)_minmax(320px,1.6fr)]">
        <div className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[rgba(0,58,143,0.06)] px-4 text-sm font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.12)]">
          <i className="fas fa-lock text-xs" />
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">Title Review Queue</h2>
          <p className="text-sm text-[var(--text-light)]">
            Review proposed IT project titles, validate originality indicators, and record the next adviser decision.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--text-light)]">
          {titles.length} title record{titles.length === 1 ? '' : 's'}
        </p>
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
    <div className="fixed inset-0 z-[1300] flex justify-end bg-slate-950/30" onClick={onClose}>
      <aside
        aria-label="Title details"
        aria-modal="true"
        className="h-full w-full max-w-[540px] overflow-y-auto bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:px-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-light)]">Title Details</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--text-dark)]">{record.title}</h2>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
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

        <section className="mt-6 rounded-[1.35rem] bg-[rgba(0,58,143,0.06)] p-4 ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
            Title Submission Document
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-dark)]">
            Open the generated title submission document for adviser review or download a local copy.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
              type="button"
              onClick={() => openTitleSubmissionDocument(documentData)}
            >
              <i className="fas fa-file-lines" aria-hidden="true" />
              View Document
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-semibold text-[var(--primary)] transition hover:bg-[rgba(0,58,143,0.04)]"
              type="button"
              onClick={() => downloadTitleSubmissionDocument(documentData)}
            >
              <i className="fas fa-download" aria-hidden="true" />
              Download
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-[1.35rem] bg-slate-50/90 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Group Information</p>
          <p className="mt-3 text-sm font-semibold text-[var(--text-dark)]">
            {formatMemberPreview(record.memberPreview, 3)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-light)]">
            Assigned IT group under {record.academicYear}.
          </p>
        </section>

        <section className="mt-6 rounded-[1.35rem] bg-slate-50/90 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">Project Description</p>
          <p className="mt-3 text-sm leading-7 text-[var(--text-dark)]">{record.description}</p>
        </section>

        <section className="mt-6 rounded-[1.35rem] bg-slate-50/90 p-4">
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

        <section className="mt-6">
          <SimilarityIndicator score={record.similarityScore} similarTitles={record.similarTitles} />
        </section>

        <section className="mt-6 rounded-[1.35rem] bg-slate-50/90 p-4">
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
  const documentData = createAdviserTitleDocumentData(record);

  return (
    <article className="group rounded-[1.75rem] bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(280px,0.9fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[rgba(0,58,143,0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[rgba(0,58,143,0.10)]">
              IT
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
              {statusMeta.label}
            </span>
          </div>

          <h3
            className="mt-4 overflow-hidden text-xl font-bold tracking-[-0.03em] text-[var(--text-dark)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            title={record.title}
          >
            {record.title}
          </h3>
          <p className="mt-2 text-sm font-semibold text-[var(--primary)]">{record.groupId}</p>
          <p className="mt-1 text-sm text-[var(--text-light)]">
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
                className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.35rem] bg-[rgba(248,250,252,0.98)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
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
            </dl>
          </div>

          <SimilarityIndicator compact score={record.similarityScore} similarTitles={record.similarTitles} />
        </div>

        <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-inset ring-slate-200/70">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-light)]">
              Adviser Note / Action Needed
            </p>
            <p
              className="mt-3 overflow-hidden text-sm leading-7 text-[var(--text-dark)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]"
              title={record.adviserAction}
            >
              {record.adviserAction}
            </p>
          </div>

          <div className="mt-5 grid gap-2">
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
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              type="button"
              onClick={() => onReject(record)}
            >
              Reject
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={() => onViewDetails(record)}
            >
              View Details
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-semibold text-[var(--primary)] transition hover:bg-[rgba(0,58,143,0.04)]"
              type="button"
              onClick={() => openTitleSubmissionDocument(documentData)}
            >
              View Document
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={() => downloadTitleSubmissionDocument(documentData)}
            >
              Download Document
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
    <div className="rounded-[1.75rem] bg-white px-6 py-12 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[rgba(0,58,143,0.06)] text-[var(--primary)]">
        <i className="fas fa-file-signature text-xl" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[var(--text-dark)]">
        {hasPendingTitles ? 'No matching titles' : 'No pending titles'}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-light)]">
        {hasPendingTitles
          ? 'Adjust the filters or search terms to bring title records back into view.'
          : 'All submitted IT project titles have already been reviewed.'}
      </p>
      {!hasPendingTitles ? (
        <button
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-semibold text-[var(--primary)] transition hover:bg-[rgba(0,58,143,0.04)]"
          type="button"
          onClick={onViewApproved}
        >
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

