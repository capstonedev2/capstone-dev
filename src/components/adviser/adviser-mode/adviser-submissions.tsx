'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { type DocumentFileSummary } from '@/components/documents/document-file-controls';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import { DOCUMENT_STORAGE_BUCKETS } from '@/lib/storage/upload-config';
import {
  FiltersBar,
  SubmissionFocusPanel,
  SubmissionList,
  SummaryCards,
  type SubmissionSummaryMetric
} from '@/components/adviser/adviser-mode/data/submission-workspace-sections';
import {
  SUBMISSION_STATUS_FILTER_OPTIONS,
  getApprovedThisWeekCount,
  getSubmissionMilestoneOptions,
  getSubmissionTypeOptions,
  type AdviserSubmissionRecord,
  type SubmissionMilestone,
  type SubmissionStatus,
  type SubmissionType
} from '@/components/adviser/adviser-mode/data/submission-workspace-data';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export function AdviserSubmissions({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [typeFilter, setTypeFilter] = useState<SubmissionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<SubmissionMilestone | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [studentDocuments, setStudentDocuments] = useState<DocumentFileSummary[]>([]);
  const [studentDocumentError, setStudentDocumentError] = useState<string | null>(null);
  const [isLoadingStudentDocuments, setIsLoadingStudentDocuments] = useState(true);
  const [reviewSubmission, setReviewSubmission] = useState<AdviserSubmissionRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const adviserMeta = WORKSPACE_META[workspaceMode];

  const submissions = useMemo<AdviserSubmissionRecord[]>(() => {
    const mapSubmissionStatus = (status?: string | null): SubmissionStatus => {
      switch (String(status || '').toUpperCase()) {
        case 'UNDER_REVIEW':
          return 'under-review';
        case 'APPROVED':
          return 'approved';
        case 'NEEDS_REVISION':
          return 'needs-revision';
        default:
          return 'pending-review';
      }
    };

    const categoryToType = (category: string): SubmissionType => {
      const normalized = category.toLowerCase();

      if (normalized.includes('final') || normalized.includes('repository')) {
        return 'Final';
      }

      if (normalized.includes('chapter')) {
        return 'Chapter';
      }

      return 'Proposal';
    };

    const categoryToMilestone = (category: string): SubmissionMilestone => {
      const normalized = category.toLowerCase();

      if (normalized.includes('chapter 3')) return 'Chapter 3 Review';
      if (normalized.includes('chapter')) return 'Chapter 1 Review';
      if (normalized.includes('final') || normalized.includes('repository')) return 'Final Manuscript Check';

      return 'Proposal Screening';
    };

    return studentDocuments.map((file, index) => {
      const submittedAt = new Date(file.createdAt);
      const deadline = new Date(submittedAt);
      deadline.setDate(deadline.getDate() + 7);

      const type = categoryToType(file.documentCategory);
      const milestone = categoryToMilestone(file.documentCategory);

      return {
        id: file.id,
        groupId: file.groupCode || file.groupTitle || 'Assigned Project',
        projectTitle: file.projectTitle || file.groupTitle || 'Student thesis project',
        submissionTitle: file.fileName,
        type,
        milestone,
        status: mapSubmissionStatus(file.submissionStatus),
        version: `v${file.submissionVersion || index + 1}`,
        submittedAt: submittedAt.toISOString(),
        deadline: deadline.toISOString(),
        submittedBy: file.uploadedByName || 'Project Member',
        groupMembers: file.groupMembers || [],
        latestReviewComment: file.latestReviewComment || null,
        reviewedAt: file.reviewedAt ? new Date(file.reviewedAt).toISOString() : null,
        reviewFocus: `${file.uploadedByName || 'A student'} from ${file.groupCode || file.groupTitle || 'your assigned group'} submitted this ${file.documentCategory || 'document'} for adviser review.`,
        nextAction: file.submissionStatus === 'APPROVED'
          ? 'This submission has been approved and the student has been notified.'
          : file.submissionStatus === 'NEEDS_REVISION'
            ? 'Revision notes were sent to the student. Wait for the next uploaded version.'
            : file.submissionStatus === 'UNDER_REVIEW'
              ? 'Continue reviewing, approve it, or send revision notes to the student.'
              : 'Start the review, then send notes, approve, or request revision.',
        fileUrl: `/api/document-files/${file.id}/download`,
        department: 'IT'
      };
    });
  }, [studentDocuments]);

  const typeOptions = useMemo(() => getSubmissionTypeOptions(submissions), [submissions]);
  const milestoneOptions = useMemo(() => getSubmissionMilestoneOptions(submissions), [submissions]);
  const hasActiveFilters =
    typeFilter !== 'all' || statusFilter !== 'all' || milestoneFilter !== 'all' || searchValue.trim().length > 0;

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setMilestoneFilter('all');
    setSearchValue('');
  };

  useEffect(() => {
    let cancelled = false;

    const loadStudentDocuments = async () => {
      setIsLoadingStudentDocuments(true);
      setStudentDocumentError(null);

      try {
        const response = await fetch(`/api/document-files?bucketName=${DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS}`, {
          cache: 'no-store'
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load student thesis documents.');
        }

        if (!cancelled) {
          setStudentDocuments(payload?.files || []);
        }
      } catch (error) {
        if (!cancelled) {
          setStudentDocumentError(error instanceof Error ? error.message : 'Unable to load student thesis documents.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStudentDocuments(false);
        }
      }
    };

    loadStudentDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  async function openSignedStudentDocument(file: DocumentFileSummary) {
    try {
      const response = await fetch(`/api/document-files/${file.id}/signed-url`, { method: 'POST' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to open the document.');
      }

      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setStudentDocumentError(error instanceof Error ? error.message : 'Unable to open the document.');
    }
  }

  function downloadStudentDocument(file: DocumentFileSummary) {
    window.open(`/api/document-files/${file.id}/download`, '_blank', 'noopener,noreferrer');
  }

  function openSubmissionDocument(submission: AdviserSubmissionRecord) {
    const file = studentDocuments.find((documentFile) => documentFile.id === submission.id);

    if (file) {
      void openSignedStudentDocument(file);
    }
  }

  function downloadSubmissionDocument(submission: AdviserSubmissionRecord) {
    const file = studentDocuments.find((documentFile) => documentFile.id === submission.id);

    if (file) {
      downloadStudentDocument(file);
    }
  }

  function openReviewPanel(submission: AdviserSubmissionRecord) {
    setReviewSubmission(submission);
    setReviewNotes(submission.latestReviewComment?.body || '');
    setStudentDocumentError(null);
  }

  async function updateSubmissionReviewStatus(
    submission: AdviserSubmissionRecord,
    status: 'accepted' | 'still_reviewing' | 'approved' | 'needs_revision',
    notes = ''
  ) {
    setStudentDocumentError(null);
    setIsSubmittingReview(true);

    try {
      const response = await fetch(`/api/document-files/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update the review status.');
      }

      setStudentDocuments((current) => current.map((file) => (
        file.id === submission.id ? { ...file, ...payload.file } : file
      )));
      setReviewSubmission(null);
      setReviewNotes('');
      
      if (status === 'approved' || status === 'needs_revision') {
        try {
          const studentIds = (submission.groupMembers?.length ?? 0) > 0 
            ? submission.groupMembers!.map((m: any) => m.user_id || m.id) 
            : ['user-student-001']; // fallback for mock
            
          const notifTitle = status === 'approved' ? 'Title Approved' : 'Revision Requested';
          const notifTone = status === 'approved' ? 'success' : 'danger';
          const notifBaseMessage = status === 'approved' 
            ? `Congrats! Your title "${submission.submissionTitle}" has been approved by the panel.`
            : `Your title "${submission.submissionTitle}" requires revisions based on panel feedback.`;
            
          const notifMessage = notes.trim() ? `${notifBaseMessage} Evaluation Notes: "${notes}"` : notifBaseMessage;

          await Promise.all(studentIds.map((sId: string) => 
            fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: sId,
                title: notifTitle,
                message: notifMessage,
                type: notifTone,
                entityType: 'title',
                entityId: submission.id
              })
            })
          ));
        } catch (e) {
          console.error('Failed to send evaluation notification', e);
        }
      }
      
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setStudentDocumentError(error instanceof Error ? error.message : 'Unable to update the review status.');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesType = typeFilter === 'all' || submission.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesMilestone = milestoneFilter === 'all' || submission.milestone === milestoneFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          submission.groupId,
          submission.projectTitle,
          submission.submissionTitle,
          submission.reviewFocus,
          submission.nextAction
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesType && matchesStatus && matchesMilestone && matchesSearch;
    }).sort((left, right) => {
      const statusPriority: Record<SubmissionStatus, number> = {
        'needs-revision': 0,
        'pending-review': 1,
        'under-review': 2,
        approved: 3
      };

      return statusPriority[left.status] - statusPriority[right.status] || new Date(left.deadline).getTime() - new Date(right.deadline).getTime();
    });
  }, [milestoneFilter, searchValue, statusFilter, submissions, typeFilter]);

  const activeReviewCount = useMemo(
    () => submissions.filter((submission) => submission.status !== 'approved').length,
    [submissions]
  );
  const nextDueSubmission = useMemo(
    () =>
      [...submissions]
        .filter((submission) => submission.status !== 'approved')
        .sort((left, right) => new Date(left.deadline).getTime() - new Date(right.deadline).getTime())[0] ?? null,
    [submissions]
  );
  const completionRate = Math.round(
    (submissions.filter((submission) => submission.status === 'approved').length / Math.max(1, submissions.length)) * 100
  );

  const summaryMetrics = useMemo<SubmissionSummaryMetric[]>(
    () => [
      {
        id: 'pending-review',
        label: 'Pending Review',
        value: submissions.filter((submission) => submission.status === 'pending-review').length,
        helperText: 'Student thesis files waiting for a first-pass adviser decision.',
        icon: 'fa-clock',
        iconClassName: 'bg-amber-50 text-amber-600'
      },
      {
        id: 'under-review',
        label: 'Still Reviewing',
        value: submissions.filter((submission) => submission.status === 'under-review').length,
        helperText: 'Documents currently in your adviser review flow.',
        icon: 'fa-magnifying-glass',
        iconClassName: 'bg-blue-50 text-blue-600'
      },
      {
        id: 'approved-this-week',
        label: 'Approved This Week',
        value: getApprovedThisWeekCount(submissions),
        helperText: 'Documents cleared for the next milestone this week.',
        icon: 'fa-circle-check',
        iconClassName: 'bg-emerald-50 text-emerald-600'
      },
      {
        id: 'needs-revision',
        label: 'Needs Revision',
        value: submissions.filter((submission) => submission.status === 'needs-revision').length,
        helperText: 'Files returned to students for another pass.',
        icon: 'fa-rotate-left',
        iconClassName: 'bg-rose-50 text-rose-600'
      }
    ],
    [submissions]
  );

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{adviserMeta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>Review submitted chapters, proposals, and final documents from your assigned student projects.</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${adviserMeta.badgeIcon}`} />
            <span>{adviserMeta.badgeLabel}</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link
              key={item.href}
              className={isNavItemActive(pathname, item.href) ? 'active' : ''}
              href={item.href}
            >
              <i className={`fas ${item.icon}`} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <AdviserPageHeader
          description="Review submitted chapters, proposals, and final documents from your assigned student projects."
          title="Submissions"
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
          <SubmissionFocusPanel
            activeReviewCount={activeReviewCount}
            completionRate={completionRate}
            nextDueSubmission={nextDueSubmission}
            isLoading={isLoadingStudentDocuments}
          />

          <SummaryCards metrics={summaryMetrics} isLoading={isLoadingStudentDocuments} />

          {studentDocumentError ? (
            <div className="project-files-state is-danger">
              <i className="fas fa-circle-exclamation" aria-hidden="true" />
              <span>{studentDocumentError}</span>
            </div>
          ) : null}

          <FiltersBar
            hasActiveFilters={hasActiveFilters}
            milestoneFilter={milestoneFilter}
            milestoneOptions={milestoneOptions}
            onClearFilters={clearFilters}
            onMilestoneChange={setMilestoneFilter}
            onSearchChange={setSearchValue}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            resultCount={filteredSubmissions.length}
            searchValue={searchValue}
            statusFilter={statusFilter}
            statusOptions={SUBMISSION_STATUS_FILTER_OPTIONS}
            totalCount={submissions.length}
            typeFilter={typeFilter}
            typeOptions={typeOptions}
          />

          <SubmissionList
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onDownloadSubmission={downloadSubmissionDocument}
            onReviewSubmission={openReviewPanel}
            onViewSubmission={openSubmissionDocument}
            submissions={filteredSubmissions}
            totalSubmissions={submissions.length}
          />
        </div>
      </main>

      {reviewSubmission ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section className="adviser-review-modal w-full max-w-2xl overflow-hidden rounded-[1.75rem] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#003A8F]">Adviser Review</span>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{reviewSubmission.submissionTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">{reviewSubmission.groupId} · Submitted by {reviewSubmission.submittedBy || 'Project Member'}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setReviewSubmission(null)}
                  aria-label="Close review panel"
                >
                  <i className="fas fa-xmark" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-bold text-[var(--primary)] shadow-sm transition hover:bg-[rgba(0,58,143,0.04)]"
                  onClick={() => openSubmissionDocument(reviewSubmission)}
                >
                  <i className="fas fa-eye text-xs" aria-hidden="true" />
                  View File
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[rgba(0,58,143,0.14)] bg-white px-4 text-sm font-bold text-[var(--primary)] shadow-sm transition hover:bg-[rgba(0,58,143,0.04)]"
                  onClick={() => downloadSubmissionDocument(reviewSubmission)}
                >
                  <i className="fas fa-download text-xs" aria-hidden="true" />
                  Download
                </button>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Review notes or suggested revisions</span>
                <textarea
                  className="min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,58,143,0.10)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Write adviser notes, suggestions, corrections, or approval remarks for the student..."
                  disabled={reviewSubmission.status === 'approved'}
                />
              </label>

              {reviewSubmission.status === 'approved' ? (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  <i className="fas fa-circle-check text-emerald-600" aria-hidden="true" />
                  <strong>Approved</strong>
                  <span className="opacity-80">— This submission has already been approved and cannot be modified.</span>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#003A8F] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#002C6B] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmittingReview}
                    onClick={() => updateSubmissionReviewStatus(reviewSubmission, 'still_reviewing', reviewNotes)}
                  >
                    <i className="fas fa-magnifying-glass text-xs" aria-hidden="true" />
                    Still Reviewing
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmittingReview || !reviewNotes.trim()}
                    onClick={() => updateSubmissionReviewStatus(reviewSubmission, 'needs_revision', reviewNotes)}
                  >
                    <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
                    Request Revision
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmittingReview}
                    onClick={() => updateSubmissionReviewStatus(reviewSubmission, 'approved', reviewNotes)}
                  >
                    <i className="fas fa-circle-check text-xs" aria-hidden="true" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
