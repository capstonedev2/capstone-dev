'use client';

import { useEffect, useMemo, useState } from 'react';
import { type DocumentFileSummary } from '@/components/documents/document-file-controls';
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
  compareSubmissionReviewOrder,
  getAdviserReviewQueueFiles,
  getApprovedThisWeekCount,
  getSubmissionMilestoneOptions,
  getSubmissionTypeOptions,
  toAdviserSubmissionRecord,
  type AdviserSubmissionRecord,
  type SubmissionMilestone,
  type SubmissionSortOption,
  type SubmissionStatus,
  type SubmissionType
} from '@/components/adviser/adviser-mode/data/submission-workspace-data';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

type ReviewPatchStatus = 'accepted' | 'approved' | 'needs_revision';

export function AdviserSubmissions({ data: _data }: { data: AdviserDashboardData }) {
  const [typeFilter, setTypeFilter] = useState<SubmissionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<SubmissionMilestone | 'all'>('all');
  const [sortBy, setSortBy] = useState<SubmissionSortOption>('deadline');
  const [searchValue, setSearchValue] = useState('');
  const [studentDocuments, setStudentDocuments] = useState<DocumentFileSummary[]>([]);
  const [studentDocumentError, setStudentDocumentError] = useState<string | null>(null);
  const [isLoadingStudentDocuments, setIsLoadingStudentDocuments] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const submissions = useMemo<AdviserSubmissionRecord[]>(
    () => studentDocuments.map((file, index) => toAdviserSubmissionRecord(file, index)),
    [studentDocuments]
  );

  const typeOptions = useMemo(() => getSubmissionTypeOptions(submissions), [submissions]);
  const milestoneOptions = useMemo(() => getSubmissionMilestoneOptions(submissions), [submissions]);
  const hasActiveFilters =
    typeFilter !== 'all' || statusFilter !== 'all' || milestoneFilter !== 'all' || searchValue.trim().length > 0 || sortBy !== 'deadline';

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setMilestoneFilter('all');
    setSortBy('deadline');
    setSearchValue('');
  };

  useEffect(() => {
    let cancelled = false;

    const loadStudentDocuments = async () => {
      setIsLoadingStudentDocuments(true);
      setStudentDocumentError(null);

      try {
        const response = await fetch(`/api/document-files?bucketName=${DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS}&limit=50`, {
          cache: 'no-store'
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load student thesis documents.');
        }

        if (!cancelled) {
          setStudentDocuments(getAdviserReviewQueueFiles(payload?.files || []));
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

  function getSubmissionRecipients(submission: AdviserSubmissionRecord, file?: DocumentFileSummary | null) {
    const groupMembers = file?.groupMembers || submission.groupMembers || [];

    return Array.from(new Set([
      ...groupMembers
        .map((member) => member.userId)
        .filter((userId): userId is string => Boolean(userId)),
      ...(file?.uploadedBy || submission.uploadedBy ? [file?.uploadedBy || submission.uploadedBy || ''] : [])
    ].filter(Boolean)));
  }

  async function sendSubmissionNotification({
    submission,
    file,
    title,
    message,
    type,
    entityType = 'uploaded_file'
  }: {
    submission: AdviserSubmissionRecord;
    file?: DocumentFileSummary | null;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
    entityType?: string;
  }) {
    const recipientIds = getSubmissionRecipients(submission, file);

    if (!recipientIds.length) {
      console.warn('Skipping submission notification because no student recipient IDs were found.', {
        submissionId: submission.id
      });
      return;
    }

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notifications: recipientIds.map((userId) => ({
          userId,
          title,
          message,
          type,
          entityType,
          entityId: submission.id
        }))
      })
    });
  }

  async function openSignedStudentDocument(submission: AdviserSubmissionRecord) {
    try {
      const response = await fetch(`/api/document-files/${submission.id}/signed-url`, { method: 'POST' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to open the document.');
      }

      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setStudentDocumentError(error instanceof Error ? error.message : 'Unable to open the document.');
    }
  }

  function downloadSubmissionDocument(submission: AdviserSubmissionRecord) {
    window.open(`/api/document-files/${submission.id}/download`, '_blank', 'noopener,noreferrer');
  }

  async function updateSubmissionReviewStatus(
    submission: AdviserSubmissionRecord,
    status: ReviewPatchStatus,
    notes: string
  ) {
    if (isSubmittingReview) {
      return;
    }

    setStudentDocumentError(null);
    setIsSubmittingReview(true);

    try {
      const response = await fetch(`/api/document-files/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update the review status.');
      }

      setStudentDocuments((current) => current.map((file) => (
        file.id === submission.id ? { ...file, ...payload.file } : file
      )));

      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setStudentDocumentError(error instanceof Error ? error.message : 'Unable to update the review status.');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function sendReminder(submission: AdviserSubmissionRecord) {
    try {
      await sendSubmissionNotification({
        submission,
        title: 'Submission Reminder',
        message: `Reminder from your adviser: please check "${submission.submissionTitle}" and the latest review instructions.`,
        type: 'info'
      });
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setStudentDocumentError(error instanceof Error ? error.message : 'Unable to send reminder.');
    }
  }

  function approveSubmission(submission: AdviserSubmissionRecord) {
    const confirmed = window.confirm(
      'Approve this submission and notify the student? If the document still needs changes, choose Request Revision instead.'
    );

    if (!confirmed) {
      return;
    }

    void updateSubmissionReviewStatus(
      submission,
      'approved',
      'Approved by adviser. The student can now view the adviser remarks and approval status.'
    );
  }

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const statusPriority: Record<SubmissionStatus, number> = {
      'needs-revision': 0,
      'pending-review': 1,
      'under-review': 2,
      approved: 3
    };

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
          submission.submittedBy,
          submission.reviewFocus,
          submission.nextAction,
          submission.commentCategories.join(' ')
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesType && matchesStatus && matchesMilestone && matchesSearch;
    }).sort((left, right) => {
      if (sortBy === 'submitted') {
        return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      }

      if (sortBy === 'status') {
        return statusPriority[left.status] - statusPriority[right.status] || compareSubmissionReviewOrder(left, right);
      }

      if (sortBy === 'version') {
        return right.currentVersionNumber - left.currentVersionNumber || compareSubmissionReviewOrder(left, right);
      }

      return compareSubmissionReviewOrder(left, right) || statusPriority[left.status] - statusPriority[right.status];
    });
  }, [milestoneFilter, searchValue, sortBy, statusFilter, submissions, typeFilter]);

  const openReviewCount = useMemo(
    () => submissions.filter((submission) => submission.status !== 'approved').length,
    [submissions]
  );
  const needsRevisionCount = useMemo(
    () => submissions.filter((submission) => submission.status === 'needs-revision').length,
    [submissions]
  );
  const underReviewCount = useMemo(
    () => submissions.filter((submission) => submission.status === 'under-review').length,
    [submissions]
  );
  const pendingReviewCount = useMemo(
    () => submissions.filter((submission) => submission.status === 'pending-review').length,
    [submissions]
  );
  const approvedThisWeekCount = useMemo(() => getApprovedThisWeekCount(submissions), [submissions]);
  const awaitingResubmissionCount = needsRevisionCount;
  const nextDueSubmission = useMemo(
    () =>
      [...submissions]
        .filter((submission) => submission.status !== 'approved' && submission.deadline)
        .sort(compareSubmissionReviewOrder)[0] ?? null,
    [submissions]
  );

  const summaryMetrics = useMemo<SubmissionSummaryMetric[]>(
    () => [
      {
        id: 'pending-review',
        label: 'Pending Reviews',
        value: pendingReviewCount,
        helperText: 'Waiting for first adviser review.',
        icon: 'fa-clock',
        tone: 'orange'
      },
      {
        id: 'under-review',
        label: 'Under Review',
        value: underReviewCount,
        helperText: 'Currently inside the adviser review flow.',
        icon: 'fa-pen-to-square',
        tone: 'orange'
      },
      {
        id: 'needs-revision',
        label: 'Needs Revision',
        value: needsRevisionCount,
        helperText: 'Revision requested with resubmission unlocked.',
        icon: 'fa-rotate-left',
        tone: 'red'
      },
      {
        id: 'approved-this-week',
        label: 'Approved This Week',
        value: approvedThisWeekCount,
        helperText: 'Student notified with final adviser remarks.',
        icon: 'fa-circle-check',
        tone: 'green'
      },
      {
        id: 'awaiting-resubmission',
        label: 'Awaiting Resubmission',
        value: awaitingResubmissionCount,
        helperText: 'Waiting for students to upload a new version.',
        icon: 'fa-users-gear',
        tone: 'purple'
      }
    ],
    [approvedThisWeekCount, awaitingResubmissionCount, needsRevisionCount, pendingReviewCount, underReviewCount]
  );

  return (
    <div className="adviser-submissions-page">
      <div className="page-body px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1700px] space-y-6">
          <SubmissionFocusPanel
            openReviewCount={openReviewCount}
            needsRevisionCount={needsRevisionCount}
            approvedThisWeekCount={approvedThisWeekCount}
            awaitingResubmissionCount={awaitingResubmissionCount}
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
            onSortChange={setSortBy}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            resultCount={filteredSubmissions.length}
            searchValue={searchValue}
            sortBy={sortBy}
            statusFilter={statusFilter}
            statusOptions={SUBMISSION_STATUS_FILTER_OPTIONS}
            totalCount={submissions.length}
            typeFilter={typeFilter}
            typeOptions={typeOptions}
          />

          <SubmissionList
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoadingStudentDocuments}
            onApproveNotify={approveSubmission}
            onClearFilters={clearFilters}
            onDownloadSubmission={downloadSubmissionDocument}
            onRequestRevision={(submission) => updateSubmissionReviewStatus(
              submission,
              'needs_revision',
              submission.comments.length
                ? ''
                : 'Revision requested. Please address adviser feedback and upload a new version.'
            )}
            onSendReminder={sendReminder}
            onStartReview={(submission) => updateSubmissionReviewStatus(
              submission,
              'accepted',
              ''
            )}
            onViewSubmission={openSignedStudentDocument}
            submissions={filteredSubmissions}
            totalSubmissions={submissions.length}
          />
        </div>
      </div>
    </div>
  );
}
