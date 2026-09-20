'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import { DOCUMENT_STORAGE_BUCKETS } from '@/lib/storage/upload-config';
import { FileItem } from '@/components/students/student-project-file-item';
import { FileTable } from '@/components/students/student-project-file-table';
import type {
  PortalRole,
  ProjectFileHistoryEntry,
  ProjectFileRecord,
  ProjectFileSortOption
} from '@/components/students/student-project-files.shared';
import {
  PROJECT_FILE_FILTER_OPTIONS,
  compareProjectFileVersions,
  formatFileSizeLabel,
  formatProjectFileDateTime,
  formatProjectFileStatus,
  getProjectFileCategoryLabel,
  getProjectFileTone,
  getProjectFileVersionLabel,
  hasCompletedConceptStage,
  markSupersededProjectFiles,
  matchesProjectFileFilter,
  normalizeProjectFileStatus,
  sortProjectFiles
} from '@/components/students/student-project-files.shared';

type ToastTone = 'success' | 'danger' | 'warning';

type ToastState = {
  tone: ToastTone;
  message: string;
} | null;

function resolveUserRole(groupRole?: string): PortalRole {
  const normalized = groupRole?.toLowerCase() || '';

  if (normalized.includes('admin')) {
    return 'admin';
  }

  if (normalized.includes('adviser') || normalized.includes('faculty')) {
    return 'adviser';
  }

  return 'student';
}

// Oral Defense Application Evidence is typically a multi-photo batch — each
// photo is its own uploaded_files/Submission row on the backend (so the
// adviser can review a whole round together), but showing one tracker row
// per photo is just noise for the student. Roll every photo under a given
// evidence category into a single row; the individual files are still
// reachable from that row's Version History drawer.
const DEFENSE_EVIDENCE_CATEGORIES = new Set([
  'concept-defense-application',
  'proposal-defense-application',
  'final-defense-application'
]);

function groupEvidenceFiles(records: ProjectFileRecord[]): ProjectFileRecord[] {
  const grouped: ProjectFileRecord[] = [];
  const byCategory = new Map<string, ProjectFileRecord[]>();

  for (const record of records) {
    if (!DEFENSE_EVIDENCE_CATEGORIES.has(record.category)) {
      grouped.push(record);
      continue;
    }

    const bucket = byCategory.get(record.category) || [];
    bucket.push(record);
    byCategory.set(record.category, bucket);
  }

  for (const items of byCategory.values()) {
    if (items.length === 1) {
      grouped.push(items[0]);
      continue;
    }

    const sorted = [...items].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    const latest = sorted[0];

    grouped.push({
      ...latest,
      fileName: `${items.length} Evidence Files`,
      history: sorted.map((item, index): ProjectFileHistoryEntry => ({
        id: item.id,
        versionMajor: 1,
        versionMinor: sorted.length - index,
        status: item.status,
        uploadedBy: item.uploadedBy,
        uploadedAt: item.uploadedAt,
        versionNotes: item.fileName,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt,
        fileUrl: item.fileUrl,
        fileName: item.fileName
      }))
    });
  }

  return grouped;
}

function getFileStatusFromSubmission(file: any) {
  return normalizeProjectFileStatus(String(file.submissionStatus || 'pending'));
}

function parseReviewCommentBody(body?: string | null) {
  const trimmedBody = String(body || '').trim();
  const match = trimmedBody.match(/^Area:\s*(.+?)\n\n([\s\S]*)$/i);

  if (!match) {
    return {
      area: '',
      text: trimmedBody
    };
  }

  return {
    area: match[1]?.trim() || '',
    text: match[2]?.trim() || ''
  };
}

function getReviewCommentsFromSubmission(file: any) {
  const comments = Array.isArray(file.reviewComments) ? file.reviewComments : [];

  if (comments.length) {
    return comments;
  }

  return file.latestReviewComment ? [file.latestReviewComment] : [];
}

function getStatusNoteFromSubmission(file: any) {
  const reviewComments = getReviewCommentsFromSubmission(file);
  const reviewComment = parseReviewCommentBody(reviewComments[0]?.body);

  if (reviewComment.text) {
    const prefix = reviewComments.length > 1
      ? `${reviewComments.length} adviser comments are available for this version.\n\n`
      : '';

    return `${prefix}${reviewComment.area ? `Area: ${reviewComment.area}\n\n` : ''}${reviewComment.text}`;
  }

  if (file.submissionStatus === 'UNDER_REVIEW') {
    return 'Under Adviser Review. Your adviser is currently reviewing your submission.';
  }

  if (file.submissionStatus === 'APPROVED') {
    return 'Approved by Adviser. Your submission has been approved and adviser remarks are available.';
  }

  if (file.submissionStatus === 'NEEDS_REVISION') {
    return 'Revision requested by adviser. Review the comments and upload a revised version.';
  }

  return `Secure private document stored in ${file.bucketName}.`;
}

async function getApiErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    return payload?.message || 'Request failed. Please try again.';
  } catch {
    return 'Request failed. Please try again.';
  }
}

function GroupAssignmentRequired({ hasPendingInvite }: { hasPendingInvite?: boolean }) {
  return (
    <div className="student-project-files-page">
      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Project Files</span>
              </span>
            </div>
            <h1>Project Files</h1>
            <p>Keep drafts, revisions, and approved project documents organized in one workspace.</p>
          </div>
        </div>
      </header>

      <div className="page-body p-8 sm:p-12 lg:p-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm p-12 sm:p-16 text-center shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 -z-10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 -z-10"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 -z-10"></div>

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-[var(--muted)] shadow-inner mb-8 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ring-4 ring-white">
            <i className={`fas ${hasPendingInvite ? 'fa-envelope-open-text text-blue-500' : 'fa-users-slash'} text-4xl`} aria-hidden="true" />
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">
            {hasPendingInvite ? 'Action Required: Group Invitation' : 'Group Assignment Required'}
          </h3>
          <p className="mx-auto mt-5 max-w-lg text-base font-medium text-[var(--muted)] leading-relaxed">
            {hasPendingInvite 
              ? 'You have a pending group invitation. You must accept the assignment before you can access the project files repository.'
              : 'You must be assigned to a project group before you can access the project files repository and begin uploading chapters or documents. Please contact your coordinator.'}
          </p>
          {hasPendingInvite && (
            <div className="mt-8">
              <Link prefetch={false} href="/students/notifications" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5">
                <i className="fas fa-bell" aria-hidden="true" /> Review Invitation
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TitleApprovalRequired() {
  return (
    <div className="student-project-files-page">
      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Project Files</span>
              </span>
            </div>
            <h1>Project Files</h1>
            <p>Keep drafts, revisions, and approved project documents organized in one workspace.</p>
          </div>
        </div>
      </header>

      <div className="page-body p-8 sm:p-12 lg:p-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-indigo-200/80 bg-[var(--surface)] backdrop-blur-sm p-12 sm:p-16 text-center shadow-xl shadow-indigo-200/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 -z-10"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 -z-10"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 -z-10"></div>

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600 shadow-inner mb-8 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ring-4 ring-white">
            <i className="fas fa-lock text-4xl" aria-hidden="true" />
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Stage 1 Required</h3>
          <p className="mx-auto mt-5 max-w-lg text-base font-medium text-[var(--muted)] leading-relaxed">
            Complete Stage 1: Concept Proposal in the <strong className="text-indigo-700">Title Submission</strong> workspace before accessing the project files repository. Once Stage 1 is marked complete, your group can begin uploading chapters, revisions, and project documents.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProjectFilesHeroStats({ stats }: { stats: { id: string, label: string, value: string, icon: string, tone: string }[] }) {
  return (
    <section className="dashboard-hero project-files-hero">
      <article className="dashboard-hero-main project-files-hero-main">
        <div className="dashboard-callout-grid project-files-hero-stats">
          {stats.map((item) => (
            <article key={item.id} className={`dashboard-callout project-files-hero-stat is-${item.tone}`}>
              <span className="project-files-stat-icon"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export function StudentProjectFiles({ data }: { data: StudentDashboardData }) {
  const trackerSectionRef = useRef<HTMLElement | null>(null);
  const createdObjectUrlsRef = useRef(new Set<string>());
  const currentUserRole = useMemo(() => resolveUserRole(data.profile.groupRole), [data.profile.groupRole]);
  const currentUserId = data.profile.user_id;
  const adviserName = data.project.adviser || data.profile.adviser || 'Assigned Adviser';
  const isGroupLeader = Boolean(data.profile.groupRole && data.profile.groupRole.toLowerCase().includes('leader'));

  const [files, setFiles] = useState<ProjectFileRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<ProjectFileSortOption>('newest');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [historyFile, setHistoryFile] = useState<ProjectFileRecord | null>(null);

  const isConceptStageComplete = useMemo(() => hasCompletedConceptStage(data), [data]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHistoryFile(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('is-modal-open', Boolean(historyFile));

    return () => {
      document.body.classList.remove('is-modal-open');
    };
  }, [historyFile]);



  useEffect(() => {
    let cancelled = false;

    const loadStoredDocuments = async () => {
      try {
        const response = await fetch(`/api/document-files?bucketName=${DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS}&page=1&limit=50`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          if (!cancelled) setIsLoadingFiles(false);
          return;
        }

        const payload = await response.json();
        const storedFiles: ProjectFileRecord[] = (payload.files || []).map((file: any) => ({
          id: file.id,
          projectId: file.projectId || data.project.project_id,
          category: file.documentCategory || 'proposal',
          fileName: file.fileName,
          fileUrl: `/api/document-files/${file.id}/download`,
          versionMajor: 1,
          versionMinor: 0,
          status: getFileStatusFromSubmission(file),
          tag: getFileStatusFromSubmission(file) === 'approved' ? 'Final' : getFileStatusFromSubmission(file) === 'pending' ? 'Draft' : 'Revision',
          versionNotes: getStatusNoteFromSubmission(file),
          uploadedBy: file.uploadedByName || (file.uploadedBy === currentUserId ? data.profile.fullName : 'Project Member'),
          uploadedAt: file.createdAt,
          reviewedAt: file.reviewedAt || undefined,
          reviewedBy: file.reviewedAt ? adviserName : undefined,
          rejectionReason: file.rejectionReason || null, latestReviewComment: file.latestReviewComment || null,
          reviewComments: file.reviewComments || [],
          isFinal: file.bucketName === DOCUMENT_STORAGE_BUCKETS.FINAL_REPOSITORY || getFileStatusFromSubmission(file) === 'approved',
          isRepositoryCopy: file.bucketName === DOCUMENT_STORAGE_BUCKETS.FINAL_REPOSITORY || getFileStatusFromSubmission(file) === 'approved',
          fileType: file.fileType,
          sizeLabel: formatFileSizeLabel(file.fileSize || 0),
          uploadedById: file.uploadedBy,
          history: [
            {
              id: `${file.id}-history`,
              versionMajor: 1,
              versionMinor: 0,
              status: getFileStatusFromSubmission(file),
              uploadedBy: file.uploadedByName || (file.uploadedBy === currentUserId ? data.profile.fullName : 'Project Member'),
              uploadedAt: file.createdAt,
              versionNotes: getStatusNoteFromSubmission(file),
              reviewedBy: file.reviewedAt ? adviserName : undefined,
              reviewedAt: file.reviewedAt || undefined
            }
          ]
        }));

        if (!cancelled) {
          setFiles((current) => {
            const localPendingFiles = current.filter((file) => file.fileUrl.startsWith('blob:'));
            return sortProjectFiles([...groupEvidenceFiles(storedFiles), ...localPendingFiles], 'newest');
          });
          setIsLoadingFiles(false);
        }
      } catch {
        if (!cancelled) setIsLoadingFiles(false);
        // Keep the workspace usable; real uploads will appear after the API is available.
      }
    };

    loadStoredDocuments();

    return () => {
      cancelled = true;
    };
  }, [adviserName, currentUserId, data.profile.fullName, data.project.project_id]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    createdObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdObjectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchTerm, sortBy, pageSize]);

  const trackedFilesCount = files.length;
  const pendingReviewCount = files.filter((item) => item.status === 'pending').length;
  const revisionCount = files.filter((item) => item.status === 'revision').length;
  const approvedRepositoryCount = files.filter((item) => item.isRepositoryCopy).length;
  const activeFilterLabel = PROJECT_FILE_FILTER_OPTIONS.find((item) => item.key === categoryFilter)?.label || 'Filtered Files';
  const quickFilterOptions = useMemo(
    () => PROJECT_FILE_FILTER_OPTIONS.filter((item) => ['all', 'chapters', 'system-files', 'presentation-files', 'supporting-documents', 'concept-defense-application', 'award-recognition', 'activity-evidence'].includes(item.key)),
    []
  );
  const quickFilterCounts = useMemo(
    () => Object.fromEntries(quickFilterOptions.map((item) => [item.key, files.filter((file) => matchesProjectFileFilter(file, item.key)).length])),
    [files, quickFilterOptions]
  );
  const hasActiveTableFilters = categoryFilter !== 'all' || sortBy !== 'newest' || searchTerm.trim().length > 0 || pageSize !== 5;

  const annotatedFiles = useMemo(() => markSupersededProjectFiles(files), [files]);

  const filteredFiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortProjectFiles(
      annotatedFiles.filter((file) => {
        if (!matchesProjectFileFilter(file, categoryFilter)) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          file.fileName,
          getProjectFileCategoryLabel(file.category),
          file.versionNotes,
          file.uploadedBy,
          file.sizeLabel,
          formatProjectFileStatus(file.status),
          getProjectFileVersionLabel(file),
          file.tag
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      }),
      sortBy
    );
  }, [annotatedFiles, categoryFilter, searchTerm, sortBy]);

  const totalCount = filteredFiles.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const historyEntries = useMemo(() => {
    if (!historyFile) {
      return [];
    }

    return [...historyFile.history].sort((left, right) => {
      const versionDelta = compareProjectFileVersions(right, left);

      if (versionDelta !== 0) {
        return versionDelta;
      }

      return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
    });
  }, [historyFile]);

  const openTrackerSection = useCallback(() => {
    trackerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);


  const resetTrackerControls = () => {
    setCategoryFilter('all');
    setSearchTerm('');
    setSortBy('newest');
    setPageSize(5);
    setCurrentPage(1);
  };

  const handleViewFile = useCallback(async (file: ProjectFileRecord) => {
    if (file.fileUrl.startsWith('blob:')) {
      window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const response = await fetch(`/api/document-files/${file.id}/signed-url`, { method: 'POST' });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      const payload = await response.json();
      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setToast({
        tone: 'warning',
        message: error instanceof Error ? error.message : 'Preview is not available for this file.'
      });
    }
  }, []);

  const handleDownloadFile = useCallback((file: ProjectFileRecord) => {
    if (file.fileUrl.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    window.open(`/api/document-files/${file.id}/download`, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDeleteFile = useCallback(async (file: ProjectFileRecord) => {
    setPageError(null);

    if (file.fileUrl.startsWith('blob:')) {
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setHistoryFile((current) => (current?.id === file.id ? null : current));
      URL.revokeObjectURL(file.fileUrl);
      createdObjectUrlsRef.current.delete(file.fileUrl);
      setToast({
        tone: 'success',
        message: `${file.fileName} removed from the active project tracker.`
      });
      return;
    }

    try {
      const response = await fetch(`/api/document-files/${file.id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));
      setHistoryFile((current) => (current?.id === file.id ? null : current));
      setToast({
        tone: 'success',
        message: `${file.fileName} deleted from private storage.`
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to delete the document.');
    }
  }, []);

  const handleApproveFile = useCallback((file: ProjectFileRecord) => {
    const reviewedAt = new Date().toISOString();
    const nextVersionMinor = file.versionMinor + 1;
    const approvalNotes = `${getProjectFileCategoryLabel(file.category)} approved by ${adviserName} and stored as the final repository copy.`;

    setFiles((current) => current.map((item) => {
      if (item.id !== file.id) {
        return item;
      }

      return {
        ...item,
        versionMinor: nextVersionMinor,
        status: 'approved',
        tag: 'Final',
        versionNotes: approvalNotes,
        uploadedAt: reviewedAt,
        reviewedBy: adviserName,
        reviewedAt,
        isFinal: true,
        isRepositoryCopy: true,
        history: [
          ...item.history,
          {
            id: `${item.id}-approved-${Date.now()}`,
            versionMajor: item.versionMajor,
            versionMinor: nextVersionMinor,
            status: 'approved',
            uploadedBy: item.uploadedBy,
            uploadedAt: reviewedAt,
            versionNotes: approvalNotes,
            reviewedBy: adviserName,
            reviewedAt
          }
        ]
      };
    }));

    setToast({
      tone: 'success',
      message: `${file.fileName} approved and added to the official repository section.`
    });
  }, [adviserName]);

  const handleViewHistory = useCallback((file: ProjectFileRecord) => {
    setHistoryFile(file);
  }, []);

  const needsAttentionCount = pendingReviewCount + revisionCount;
  const hasProjectFiles = trackedFilesCount > 0;
  const heroStats = [
    {
      id: 'tracked',
      label: 'Tracked Files',
      value: `${trackedFilesCount}`,
      icon: 'fa-folder-open',
      tone: 'primary'
    },
    {
      id: 'attention',
      label: 'Needs Attention',
      value: needsAttentionCount ? `${needsAttentionCount}` : 'Clear',
      icon: 'fa-circle-exclamation',
      tone: 'warning'
    },
    {
      id: 'repository',
      label: 'Approved Copies',
      value: `${approvedRepositoryCount}`,
      icon: 'fa-circle-check',
      tone: 'success'
    }
  ];
  const toastIcon = toast?.tone === 'success'
    ? 'fa-circle-check'
    : toast?.tone === 'danger'
      ? 'fa-circle-exclamation'
      : 'fa-circle-info';

  if (!data.group?.id) {
    return <GroupAssignmentRequired hasPendingInvite={!!data.profile.pendingGroupInviteId} />;
  }

  // Project Files workspace stays visible, but uploads open only after Stage 1: Concept is complete.

  return (
    <>
      <div className="student-project-files-page">
        <header className="top-nav">
          <div className="top-nav-leading">
            <div className="page-title">
              <div className="page-title-context">
                <span className="page-kicker">Student Workspace</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>Project Files</span>
                </span>
              </div>
              <h1>Project Files</h1>
            </div>
          </div>
          <div className="project-files-header-actions">
            <Link
              className="btn btn-primary project-files-upload-button"
              href="/students/submit"
              title="Submit a document from the Submit Documents page"
            >
              <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
              Submit Documents
            </Link>
          </div>
        </header>

        <div className="page-body project-files-page-body">
          <ProjectFilesHeroStats stats={heroStats} />

          <section className="project-files-main-grid">
            <article ref={trackerSectionRef} className="surface-card project-files-panel-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">File Tracker</span>
                  <h3>All Project Documents</h3>
                </div>
              </div>
              <div className="project-files-filter-shell">
                <div className="project-files-filter-meta">
                  <div>
                    <strong>{activeFilterLabel}</strong>
                    <span>{searchTerm.trim() ? `Showing ${totalCount} matching record${totalCount === 1 ? '' : 's'} for "${searchTerm.trim()}".` : `Showing ${totalCount} matching record${totalCount === 1 ? '' : 's'} in this view.`}</span>
                  </div>
                  {hasActiveTableFilters ? (
                    <button className="table-btn project-files-filter-reset" type="button" onClick={resetTrackerControls}>
                      <i className="fas fa-rotate-left" aria-hidden="true" /> Clear Filters
                    </button>
                  ) : null}
                </div>
              </div>

              <FileTable
                files={paginatedFiles}
                totalCount={totalCount}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                categoryFilter={categoryFilter}
                searchTerm={searchTerm}
                sortBy={sortBy}
                pageSize={pageSize}
                currentPage={currentPage}
                totalPages={totalPages}
                isLoading={isLoadingFiles}
                errorMessage={pageError}
                onCategoryFilterChange={setCategoryFilter}
                onSearchTermChange={setSearchTerm}
                onSortByChange={setSortBy}
                onPageSizeChange={setPageSize}
                onPageChange={setCurrentPage}
                onView={handleViewFile}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                onApprove={handleApproveFile}
                onViewHistory={handleViewHistory}
              />
            </article>

          </section>


        </div>

        <div className={`modal-shell ${historyFile ? 'is-open' : ''}`}>
          <button className="modal-backdrop" type="button" aria-label="Close version history" onClick={() => setHistoryFile(null)} />
          {historyFile ? (
            <div className="modal-card project-files-history-modal-card" role="dialog" aria-modal="true" aria-labelledby="project-file-history-title">
              <button className="modal-close" type="button" aria-label="Close version history" onClick={() => setHistoryFile(null)}>
                <i className="fas fa-xmark" aria-hidden="true" />
              </button>
              <div className="modal-content project-files-history-modal-content">
                <div className="card-heading project-files-history-modal-head">
                  <div>
                    <span className="section-kicker">Version History</span>
                    <h3 id="project-file-history-title">{historyFile.fileName}</h3>
                    <p>Review earlier uploads, revision notes, and approval checkpoints for this file record.</p>
                  </div>
                  <div className="chip-row">
                    <span className="project-files-version-badge">{getProjectFileVersionLabel(historyFile)}</span>
                    <span className={`ui-badge is-${getProjectFileTone(historyFile.status)}`}>{formatProjectFileStatus(historyFile.status)}</span>
                  </div>
                </div>

                <div className="project-files-history-summary">
                  <article>
                    <span>Category</span>
                    <strong>{getProjectFileCategoryLabel(historyFile.category)}</strong>
                    <small>Filed under {getProjectFileCategoryLabel(historyFile.category)} for this project record.</small>
                  </article>
                  <article>
                    <span>Current Upload</span>
                    <strong>{formatProjectFileDateTime(historyFile.uploadedAt)}</strong>
                    <small>{historyFile.uploadedBy}</small>
                  </article>
                  <article>
                    <span>Repository State</span>
                    <strong>{historyFile.isRepositoryCopy ? 'Final Approved Version' : 'Active Working Copy'}</strong>
                    <small>{historyFile.reviewedBy ? `Verified by ${historyFile.reviewedBy}` : 'Awaiting adviser confirmation'}</small>
                  </article>
                </div>

                {historyFile.reviewComments?.length ? (
                  <section className="mt-5 rounded-[1.25rem] border border-blue-100 bg-blue-50/40 p-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="section-kicker">Adviser Feedback</span>
                        <h4 className="mt-1 text-lg font-extrabold text-[var(--text)]">Revision Comments</h4>
                      </div>
                      <span className="w-fit rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
                        {historyFile.reviewComments.length} comment{historyFile.reviewComments.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {historyFile.reviewComments.map((comment, index) => {
                        const parsedComment = parseReviewCommentBody(comment.body);

                        return (
                          <article key={comment.id} className="rounded-2xl border border-blue-100 bg-[var(--surface)] p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#003A8F] text-xs font-black text-white">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--muted)]">
                                  <span>{comment.authorName || adviserName}</span>
                                  <span aria-hidden="true">|</span>
                                  <span>{formatProjectFileDateTime(String(comment.createdAt))}</span>
                                </div>
                                {parsedComment.area ? (
                                  <p className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
                                    <i className="fas fa-location-dot mr-2 text-[10px]" aria-hidden="true" />
                                    {parsedComment.area}
                                  </p>
                                ) : null}
                                <p className="mt-3 text-sm leading-6 text-[var(--text)]">{parsedComment.text}</p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                <div className="project-files-history-list">
                  {historyEntries.map((entry) => (
                    <article key={entry.id} className="project-files-history-item">
                      <div className="project-files-history-item-head">
                        <div>
                          <strong>{entry.fileName || `v${entry.versionMajor}.${entry.versionMinor}`}</strong>
                          <span className={`ui-badge is-${getProjectFileTone(entry.status)}`}>{formatProjectFileStatus(entry.status)}</span>
                        </div>
                        <small>{formatProjectFileDateTime(entry.uploadedAt)}</small>
                      </div>

                      {entry.fileName ? null : <p>{entry.versionNotes}</p>}

                      <div className="project-files-history-meta">
                        <span><i className="fas fa-user" aria-hidden="true" /> {entry.uploadedBy}</span>
                        {entry.reviewedBy ? <span><i className="fas fa-user-check" aria-hidden="true" /> {entry.reviewedBy}</span> : null}
                        {entry.reviewedAt ? <span><i className="fas fa-calendar-check" aria-hidden="true" /> {formatProjectFileDateTime(entry.reviewedAt)}</span> : null}
                        {entry.fileUrl ? (
                          <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#003A8F] hover:underline">
                            <i className="fas fa-download" aria-hidden="true" /> Download
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {toast ? (
        <div className="toast-stack" aria-live="polite">
          <div className={`toast-item is-${toast.tone}`}>
            <i className={`fas ${toastIcon}`} aria-hidden="true" />
            <span>{toast.message}</span>
          </div>
        </div>
      ) : null}

    </>
  );
}
