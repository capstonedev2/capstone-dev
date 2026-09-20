'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
