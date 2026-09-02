'use client';

import Link from 'next/link';
import { type ChangeEvent, type DragEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PremiumAnimatedButton } from '@/components/ui/premium-animated-button';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import {
  DOCUMENT_FILE_ACCEPT,
  DOCUMENT_STORAGE_BUCKETS,
  validateFileSize,
  validateFileType
} from '@/lib/storage/upload-config';
import { FileItem } from '@/components/students/student-project-file-item';
import { FileTable } from '@/components/students/student-project-file-table';
import type {
  PortalRole,
  ProjectFileHistoryEntry,
  ProjectFileRecord,
  ProjectFileSortOption,
  ProjectFileUploadState
} from '@/components/students/student-project-files.shared';
import {
  PROJECT_FILE_CATEGORY_OPTIONS,
  PROJECT_FILE_FILTER_OPTIONS,
  PROJECT_FILE_TAG_OPTIONS,
  compareProjectFileVersions,
  formatFileSizeLabel,
  formatProjectFileDateTime,
  formatProjectFileStatus,
  getNextProjectFileVersion,
  getNextProjectFileVersionParts,
  getProjectFileCategoryLabel,
  getProjectFileTone,
  getProjectFileTypeIcon,
  getProjectFileVersionLabel,
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

function createUploadDraft(uploadedBy: string): ProjectFileUploadState {
  return {
    file: null,
    category: PROJECT_FILE_CATEGORY_OPTIONS[0]?.key || 'proposal',
    versionNotes: '',
    status: 'pending',
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    tag: 'Draft'
  };
}

function getInitialHistoryNote(category: string) {
  return `Initial ${getProjectFileCategoryLabel(category).toLowerCase()} file uploaded for adviser review.`;
}

function getRevisionHistoryNote(category: string) {
  return `Updated ${getProjectFileCategoryLabel(category).toLowerCase()} package submitted after revision comments.`;
}

function getDefaultPendingNote(category: string, tag: ProjectFileUploadState['tag']) {
  if (tag === 'Revision') {
    return getRevisionHistoryNote(category);
  }

  if (tag === 'Final') {
    return `Final ${getProjectFileCategoryLabel(category).toLowerCase()} submission uploaded and waiting for adviser confirmation.`;
  }

  return getInitialHistoryNote(category);
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

const PROJECT_FILE_UPLOAD_STEPS = [
  { id: 1, title: 'Upload File', text: 'Select your document' },
  { id: 2, title: 'Choose Category', text: 'Select document type' },
  { id: 3, title: 'Version Notes', text: 'Add version details' },
  { id: 4, title: 'Submit to Adviser', text: 'Send for review' }
];

const COMPLETED_STAGE_STATUSES = new Set(['approved', 'completed']);

function normalizeStatus(value: unknown) {
  return String(value || '').trim().replace(/[_-]+/g, ' ').toLowerCase();
}

function isCompletedStageStatus(value: unknown) {
  return COMPLETED_STAGE_STATUSES.has(normalizeStatus(value));
}

function hasCompletedConceptStage(data: StudentDashboardData) {
  const conceptMilestone = data.milestones.find((milestone) =>
    milestone.title.trim().toLowerCase().includes('concept')
  );

  const conceptCheckpoints = data.milestoneCheckpoints.filter((checkpoint) =>
    checkpoint.milestoneSequence === 1 ||
    checkpoint.milestoneTitle.trim().toLowerCase().includes('concept') ||
    checkpoint.key.startsWith('concept-')
  );
  const requiredConceptCheckpoints = conceptCheckpoints.filter((checkpoint) => checkpoint.required);

  if (requiredConceptCheckpoints.length > 0) {
    return requiredConceptCheckpoints.every((checkpoint) => isCompletedStageStatus(checkpoint.status));
  }

  return Boolean(conceptMilestone && isCompletedStageStatus(conceptMilestone.status));
}

function GroupAssignmentRequired() {
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
            <i className="fas fa-users-slash text-4xl" aria-hidden="true" />
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Group Assignment Required</h3>
          <p className="mx-auto mt-5 max-w-lg text-base font-medium text-[var(--muted)] leading-relaxed">
            You must be assigned to a project group before you can access the project files repository and begin uploading chapters or documents. Please contact your coordinator.
          </p>
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

function ProjectFilesHeroStats({ stats }: { stats: { id: string, label: string, value: string, icon: string, tone: string, note: string }[] }) {
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
                <small>{item.note}</small>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export function StudentProjectFiles({ data }: { data: StudentDashboardData }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSectionRef = useRef<HTMLElement | null>(null);
  const trackerSectionRef = useRef<HTMLElement | null>(null);
  const createdObjectUrlsRef = useRef(new Set<string>());
  const currentUserRole = useMemo(() => resolveUserRole(data.profile.groupRole), [data.profile.groupRole]);
  const currentUserId = data.profile.user_id;
  const adviserName = data.project.adviser || data.profile.adviser || 'Assigned Adviser';
  const isGroupLeader = Boolean(data.profile.groupRole && data.profile.groupRole.toLowerCase().includes('leader'));

  const [files, setFiles] = useState<ProjectFileRecord[]>([]);
  const [uploadDraft, setUploadDraft] = useState<ProjectFileUploadState>(() => createUploadDraft(data.profile.fullName));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<ProjectFileSortOption>('newest');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [historyFile, setHistoryFile] = useState<ProjectFileRecord | null>(null);

  // Background polling for specific member permission state via notifications
  const [isUploadAllowed, setIsUploadAllowed] = useState(false);
  const [permissionNotificationId, setPermissionNotificationId] = useState<string | null>(null);
  const [recentlyAllowed, setRecentlyAllowed] = useState<Set<string>>(new Set());
  const [permissionExpiresAt, setPermissionExpiresAt] = useState<number | null>(null);
  const [permissionCountdown, setPermissionCountdown] = useState('');
  const [leaderGrantDuration, setLeaderGrantDuration] = useState(3);
  const uploadAllowedRef = useRef(false);
  const permissionExpiresAtRef = useRef<number | null>(null);

  const PERMISSION_DURATION_OPTIONS = [
    { value: 1, label: '1 minute' },
    { value: 3, label: '3 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
  ];

  const isConceptStageComplete = useMemo(() => hasCompletedConceptStage(data), [data]);

  useEffect(() => {
    uploadAllowedRef.current = isUploadAllowed;
  }, [isUploadAllowed]);

  useEffect(() => {
    permissionExpiresAtRef.current = permissionExpiresAt;
  }, [permissionExpiresAt]);

  // Countdown timer for member permission expiry
  useEffect(() => {
    if (!permissionExpiresAt || !isUploadAllowed) {
      setPermissionCountdown('');
      return;
    }

    const tick = () => {
      const remaining = permissionExpiresAt - Date.now();
      if (remaining <= 0) {
        setIsUploadAllowed(false);
        setPermissionExpiresAt(null);
        setPermissionNotificationId(null);
        setPermissionCountdown('');
        setToast({ tone: 'warning', message: 'Upload permission expired. Request access again from your leader.' });
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setPermissionCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [permissionExpiresAt, isUploadAllowed]);

  useEffect(() => {
    if (isGroupLeader || !currentUserId) return; // Leaders always have permission, no need to poll

    let cancelled = false;
    let inFlightController: AbortController | null = null;

    const pollPersonalPermission = async () => {
      let controller: AbortController | null = null;
      try {
        inFlightController?.abort();
        controller = new AbortController();
        inFlightController = controller;
        const res = await fetch(
          `/api/notifications?userId=${encodeURIComponent(currentUserId)}&status=UNREAD&entityType=permission&entityId=${encodeURIComponent(data.group.id)}&limit=5`,
          { cache: 'no-store', signal: controller.signal }
        );
        if (res.ok) {
          const notifs = await res.json();
          if (cancelled) return;
          // Check if there are any 'Upload Permission Granted' notifications that are UNREAD
          const permissionNotifs = notifs.filter(
            (n: any) => n.status === 'UNREAD' && n.title === 'Upload Permission Granted' && n.entityType === 'permission' && n.entityId === data.group.id
          );

          if (permissionNotifs.length > 0) {
            const latestPerm = permissionNotifs[0];
            // Parse duration from the notification message (format: "...Duration: X minutes.")
            const durationMatch = latestPerm.message?.match(/Duration:\s*(\d+)\s*minute/);
            const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : 3;
            const grantedAt = new Date(latestPerm.createdAt).getTime();
            const expiresAt = grantedAt + durationMinutes * 60 * 1000;

            if (Date.now() >= expiresAt) {
              // Permission has expired — consume the notification
              try {
                await fetch('/api/notifications', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ notificationIds: permissionNotifs.map((n: any) => n.id), action: 'read' })
                });
              } catch { /* ignore */ }
              setIsUploadAllowed(false);
              setPermissionExpiresAt(null);
              setPermissionNotificationId(null);
              return;
            }

            if (!uploadAllowedRef.current || permissionExpiresAtRef.current !== expiresAt) {
              setToast({ tone: 'success', message: `Upload permission granted! You have ${durationMinutes} minute${durationMinutes === 1 ? '' : 's'} to upload.` });
              setIsUploadAllowed(true);
              setPermissionExpiresAt(expiresAt);
            }
            setPermissionNotificationId(permissionNotifs.map((n: any) => n.id).join(','));
          } else {
            if (uploadAllowedRef.current && !permissionExpiresAtRef.current) {
              setIsUploadAllowed(false);
            }
            setPermissionNotificationId(null);
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
        console.error('Failed to poll personal permissions', e);
      } finally {
        if (inFlightController === controller) {
          inFlightController = null;
        }
      }
    };

    const refreshPermission = () => {
      void pollPersonalPermission();
    };

    refreshPermission();
    window.addEventListener('focus', refreshPermission);
    window.addEventListener('thesistrack:notifications-updated', refreshPermission);

    return () => {
      cancelled = true;
      inFlightController?.abort();
      window.removeEventListener('focus', refreshPermission);
      window.removeEventListener('thesistrack:notifications-updated', refreshPermission);
    };
  }, [currentUserId, data.group.id, isGroupLeader]);

  const handleRequestPermission = async () => {
    const leader = data.group.members.find((m) => m.isLeader);
    if (!leader?.user_id) {
      setToast({ tone: 'danger', message: 'Could not identify the group leader.' });
      return;
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: leader.user_id,
          title: 'Upload Permission Request',
          message: `${data.profile.fullName} is requesting permission to upload project files.`,
          type: 'info',
          entityType: 'group',
          entityId: `${data.group.id}:${currentUserId}`
        })
      });

      if (res.ok) {
        setToast({ tone: 'success', message: 'Upload permission request sent to the group leader.' });
      } else {
        throw new Error('Failed to send request');
      }
    } catch (e) {
      setToast({ tone: 'danger', message: 'Failed to send upload request.' });
    }
  };

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
            return sortProjectFiles([...storedFiles, ...localPendingFiles], 'newest');
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

  const latestFile = useMemo(() => sortProjectFiles(files, 'newest')[0] || null, [files]);
  const trackedFilesCount = files.length;
  const pendingReviewCount = files.filter((item) => item.status === 'pending').length;
  const revisionCount = files.filter((item) => item.status === 'revision').length;
  const approvedRepositoryCount = files.filter((item) => item.isRepositoryCopy).length;
  const repositoryFiles = useMemo(
    () => sortProjectFiles(files.filter((item) => item.isRepositoryCopy), 'newest'),
    [files]
  );
  const nextVersionLabel = useMemo(
    () => getNextProjectFileVersion(files, uploadDraft.category),
    [files, uploadDraft.category]
  );
  const latestApprovedFile = repositoryFiles[0] || null;
  const activeFilterLabel = PROJECT_FILE_FILTER_OPTIONS.find((item) => item.key === categoryFilter)?.label || 'Filtered Files';
  const quickFilterOptions = useMemo(
    () => PROJECT_FILE_FILTER_OPTIONS.filter((item) => ['all', 'chapters', 'system-files', 'presentation-files', 'supporting-documents', 'certificates'].includes(item.key)),
    []
  );
  const quickFilterCounts = useMemo(
    () => Object.fromEntries(quickFilterOptions.map((item) => [item.key, files.filter((file) => matchesProjectFileFilter(file, item.key)).length])),
    [files, quickFilterOptions]
  );
  const hasActiveTableFilters = categoryFilter !== 'all' || sortBy !== 'newest' || searchTerm.trim().length > 0 || pageSize !== 5;

  const filteredFiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortProjectFiles(
      files.filter((file) => {
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
  }, [files, categoryFilter, searchTerm, sortBy]);

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

  const resetUploadDraft = () => {
    setUploadDraft(createUploadDraft(data.profile.fullName));
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateUploadDraft = <Key extends keyof ProjectFileUploadState,>(field: Key, value: ProjectFileUploadState[Key]) => {
    setUploadDraft((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSelectedFile = (file: File | null) => {
    setUploadError(null);

    if (file) {
      const typeError = validateFileType(file.name, file.type);
      const sizeError = validateFileSize(file.size, DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);

      if (typeError || sizeError) {
        setUploadError(typeError || sizeError || 'Selected file is not valid.');
        updateUploadDraft('file', null);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        return;
      }
    }

    updateUploadDraft('file', file);
    updateUploadDraft('uploadedAt', new Date().toISOString());
  };

  const openUploadSection = useCallback(() => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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

  const handleBrowseFile = () => {
    openUploadSection();
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(event.target.files?.[0] || null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    handleSelectedFile(event.dataTransfer.files?.[0] || null);
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

  const clearSelectedFile = () => {
    handleSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    setUploadError(null);
    setPageError(null);

    if (!uploadDraft.file) {
      setUploadError('Select a file before submitting it to the project workspace.');
      return;
    }

    const selectedFile = uploadDraft.file;
    const typeError = validateFileType(selectedFile.name, selectedFile.type);
    const sizeError = validateFileSize(selectedFile.size, DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);

    if (typeError || sizeError) {
      setUploadError(typeError || sizeError || 'Selected file is not valid.');
      return;
    }
    const uploadedAt = new Date().toISOString();
    const nextVersion = getNextProjectFileVersionParts(files, uploadDraft.category);
    const previousLatestFile = [...files]
      .filter((item) => item.category === uploadDraft.category)
      .sort((left, right) => {
        const versionDelta = compareProjectFileVersions(right, left);

        if (versionDelta !== 0) {
          return versionDelta;
        }

        return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
      })[0];
    const versionNotes = uploadDraft.versionNotes.trim() || getDefaultPendingNote(uploadDraft.category, uploadDraft.tag);
    const nextHistoryEntry: ProjectFileHistoryEntry = {
      id: `history-${Date.now()}`,
      versionMajor: nextVersion.versionMajor,
      versionMinor: nextVersion.versionMinor,
      status: 'pending',
      uploadedBy: data.profile.fullName,
      uploadedAt,
      versionNotes
    };
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bucketName', DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);
      formData.append('projectId', data.project.project_id || data.project.id);
      formData.append('documentCategory', uploadDraft.category);

      const response = await fetch('/api/document-files', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      const payload = await response.json();
      const uploadedFile = payload.file;
      const nextRecord: ProjectFileRecord = {
        id: uploadedFile.id,
        projectId: uploadedFile.projectId || data.project.project_id,
        category: uploadedFile.documentCategory || uploadDraft.category,
        fileName: uploadedFile.fileName || selectedFile.name,
        fileUrl: `/api/document-files/${uploadedFile.id}/download`,
        versionMajor: nextVersion.versionMajor,
        versionMinor: nextVersion.versionMinor,
        status: getFileStatusFromSubmission(uploadedFile),
        tag: uploadDraft.tag,
        versionNotes,
        uploadedBy: data.profile.fullName,
        uploadedAt: uploadedFile.createdAt || uploadedAt,
        rejectionReason: uploadedFile.rejectionReason || null,
        latestReviewComment: uploadedFile.latestReviewComment || null,
        reviewComments: uploadedFile.reviewComments || [],
        isFinal: false,
        isRepositoryCopy: false,
        fileType: uploadedFile.fileType || selectedFile.type || selectedFile.name.split('.').pop() || 'File',
        sizeLabel: formatFileSizeLabel(uploadedFile.fileSize || selectedFile.size),
        uploadedById: uploadedFile.uploadedBy || currentUserId,
        history: [...(previousLatestFile?.history || []), nextHistoryEntry]
      };

      setFiles((current) => [nextRecord, ...current]);
      setCurrentPage(1);

      // Consume ALL one-time use permission tokens if used
      if (!isGroupLeader && permissionNotificationId) {
        try {
          const tokenIds = permissionNotificationId.split(',').filter(Boolean);
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: tokenIds, action: 'read' })
          });
          setIsUploadAllowed(false);
          setPermissionExpiresAt(null);
          setPermissionNotificationId(null);
        } catch (e) {
          console.error('Failed to consume permission tokens', e);
        }
      }

      setToast({
        tone: 'success',
        message: `${selectedFile.name} uploaded securely as ${getProjectFileVersionLabel(nextRecord)}.`
      });
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
      resetUploadDraft();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload the document.';
      setUploadError(message);
      setToast({ tone: 'danger', message });
    } finally {
      setIsUploading(false);
    }
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
      tone: 'primary',
      note: latestFile
        ? `${getProjectFileVersionLabel(latestFile)} uploaded ${formatProjectFileDateTime(latestFile.uploadedAt)}`
        : 'Start the workspace by uploading the first project document.'
    },
    {
      id: 'attention',
      label: 'Needs Attention',
      value: needsAttentionCount ? `${needsAttentionCount}` : 'Clear',
      icon: 'fa-circle-exclamation',
      tone: 'warning',
      note: needsAttentionCount
        ? `${revisionCount} revision request${revisionCount === 1 ? '' : 's'} and ${pendingReviewCount} pending review file${pendingReviewCount === 1 ? '' : 's'}`
        : 'No file is currently flagged for revision or waiting on review.'
    },
    {
      id: 'repository',
      label: 'Approved Copies',
      value: `${approvedRepositoryCount}`,
      icon: 'fa-circle-check',
      tone: 'success',
      note: latestApprovedFile
        ? `${latestApprovedFile.fileName} is the latest verified repository file.`
        : 'Approved files will appear here after adviser confirmation.'
    },
    {
      id: 'next-version',
      label: 'Next Version',
      value: nextVersionLabel,
      icon: 'fa-file-circle-plus',
      tone: 'info',
      note: `Prepared for ${getProjectFileCategoryLabel(uploadDraft.category)} uploads.`
    }
  ];
  const toastIcon = toast?.tone === 'success'
    ? 'fa-circle-check'
    : toast?.tone === 'danger'
      ? 'fa-circle-exclamation'
      : 'fa-circle-info';

  if (!data.group?.id) {
    return <GroupAssignmentRequired />;
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
              <p>Keep drafts, revisions, and approved project documents organized in one workspace.</p>
            </div>
          </div>
          <div className="project-files-header-actions">
            <button 
              className={`btn btn-primary project-files-upload-button ${!isConceptStageComplete ? 'opacity-50 cursor-not-allowed' : ''}`} 
              type="button" 
              onClick={isConceptStageComplete ? openUploadSection : undefined}
              disabled={!isConceptStageComplete}
              title={!isConceptStageComplete ? "You can upload project files once Stage 1: Concept Proposal is completed." : "Upload New Version"}
            >
              {!isConceptStageComplete ? <i className="fas fa-lock" aria-hidden="true" /> : <i className="fas fa-cloud-arrow-up" aria-hidden="true" />} 
              Upload New Version
            </button>
          </div>
        </header>

        <div className="page-body project-files-page-body">
          <ProjectFilesHeroStats stats={heroStats} />

          <section className="content-grid two-thirds project-files-main-grid">
            <article ref={trackerSectionRef} className="surface-card project-files-panel-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">File Tracker</span>
                  <h3>File Tracker</h3>
                  <p>All your project documents and their versions.</p>
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
                onOpenUpload={openUploadSection}
              />
            </article>

            <article ref={uploadSectionRef} className="surface-card project-files-panel-card project-files-upload-panel">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Upload Workflow</span>
                  <h3>Upload New Version</h3>
                  <p>Complete each step so your adviser can quickly understand the file, its version, and what changed.</p>
                </div>
                <div className="flex items-center gap-4">
                  {isGroupLeader && data.group?.id && (
                    <div className="relative group/permissions">
                      <button type="button" className="flex items-center gap-2.5 rounded-xl border border-blue-200/60 bg-gradient-to-br from-indigo-50 to-blue-50 px-4 py-2 shadow-sm transition-all duration-300 hover:border-blue-300 hover:from-indigo-100 hover:to-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--surface)] shadow-sm border border-blue-100/50">
                          <i className="fas fa-user-lock text-blue-600 transition-transform duration-300 group-hover/permissions:scale-110" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-bold text-blue-900">Manage Permissions</span>
                        <i className="fas fa-chevron-down text-blue-500 text-[10px] ml-0.5 transition-transform duration-300 group-hover/permissions:rotate-180" aria-hidden="true" />
                      </button>

                      <div className="absolute right-0 top-full z-20 hidden w-64 flex-col pt-3 group-hover/permissions:flex animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Little triangle pointer */}
                        <div className="absolute right-6 top-1.5 h-3 w-3 rotate-45 border-l border-t border-[var(--border)] bg-[var(--surface)]" />

                        <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl shadow-blue-900/10 ring-1 ring-slate-900/5 backdrop-blur-xl">
                          <div className="px-3 pb-2 pt-1.5 border-b border-[var(--border)]/50 mb-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-meta)]">Grant Timed Upload</h4>
                          </div>

                          <div className="px-3 py-2 border-b border-[var(--border)]/50 mb-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-meta)] block mb-1.5">Time Limit</label>
                            <div className="flex gap-1">
                              {PERMISSION_DURATION_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setLeaderGrantDuration(opt.value); }}
                                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${
                                    leaderGrantDuration === opt.value
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'bg-[var(--surface-alt)] text-[var(--muted)] hover:bg-blue-50 hover:text-blue-600'
                                  }`}
                                >
                                  {opt.value}m
                                </button>
                              ))}
                            </div>
                          </div>

                          {data.group.members.filter(m => !m.isLeader).length ? (
                            data.group.members.filter(m => !m.isLeader).map(member => {
                              const isAllowed = recentlyAllowed.has(member.user_id);

                              return (
                                <button
                                  key={member.user_id}
                                  type="button"
                                  disabled={isAllowed}
                                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition group/item ${
                                    isAllowed
                                      ? 'bg-emerald-50 cursor-default'
                                      : 'hover:bg-[var(--surface-alt)] hover:text-blue-600'
                                  }`}
                                  onClick={async () => {
                                    if (!member.user_id || isAllowed) return;
                                    try {
                                      const res = await fetch('/api/notifications', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          userId: member.user_id,
                                          title: 'Upload Permission Granted',
                                          message: `Your leader has approved your request to upload files. Duration: ${leaderGrantDuration} minute${leaderGrantDuration === 1 ? '' : 's'}.`,
                                          type: 'success',
                                          entityType: 'permission',
                                          entityId: data.group.id
                                        })
                                      });
                                      if (res.ok) {
                                        setRecentlyAllowed(prev => new Set(prev).add(member.user_id));
                                        setToast({ tone: 'success', message: `Upload unlocked for ${member.fullName} for ${leaderGrantDuration} min.` });
                                      }
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                                      isAllowed
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-[var(--surface-alt)] text-[var(--muted)] group-hover/item:bg-blue-100 group-hover/item:text-blue-700'
                                    }`}>
                                      {isAllowed ? <i className="fas fa-check" aria-hidden="true" /> : member.fullName.charAt(0).toUpperCase()}
                                    </span>
                                    <span className={`text-sm font-semibold transition truncate ${
                                      isAllowed
                                        ? 'text-emerald-800'
                                        : 'text-[var(--text)] group-hover/item:text-blue-700'
                                    }`}>
                                      {member.fullName}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    isAllowed
                                      ? 'text-emerald-600'
                                      : 'text-[var(--text-meta)] group-hover/item:text-blue-600'
                                  }`}>
                                    {isAllowed ? `${leaderGrantDuration}m ✓` : 'Allow'}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-3 text-center text-xs text-[var(--muted)]">
                              No members available.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <span className="ui-badge is-info"><i className="fas fa-file-code" aria-hidden="true" /> Next {nextVersionLabel}</span>
                </div>
              </div>

              {isConceptStageComplete ? (
                <div className="project-files-upload-stepper" aria-label="Upload submission steps">
                  {PROJECT_FILE_UPLOAD_STEPS.map((step) => (
                    <div key={step.id} className="project-files-upload-step">
                      <span>{step.id}</span>
                      <div>
                        <strong>{step.title}</strong>
                        <small>{step.text}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {!isConceptStageComplete ? (
                <div className="project-files-locked-panel" aria-labelledby="project-files-upload-locked-title">
                  <div className="project-files-locked-icon" aria-hidden="true">
                    <i className="fas fa-file-shield" />
                  </div>

                  <div className="project-files-locked-copy">
                    <h4 id="project-files-upload-locked-title">Uploads open after Stage 1</h4>
                    <p className="project-files-locked-description">
                      Complete your Concept Proposal in Title Submission. When Stage 1 is marked complete, you can upload chapters, revisions, and project documents.
                    </p>

                    <div className="project-files-locked-actions">
                      <Link prefetch={false} href="/students/title-submission">
                        <i className="fas fa-pen-to-square" aria-hidden="true" />
                        Continue Title Submission
                      </Link>
                    </div>
                  </div>
                </div>
              ) : !isGroupLeader && currentUserRole === 'student' && !isUploadAllowed && !data.group?.allowMemberSubmission ? (
                <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50/50 p-8 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
                      <i className="fas fa-lock text-2xl" aria-hidden="true" />
                    </div>
                    <h4 className="mt-4 text-xl font-bold tracking-tight text-amber-900">Upload Restricted</h4>
                    <p className="mt-2 max-w-md text-sm text-amber-700">
                      Only the designated group leader is authorized to submit or upload files to the project workspace. If you need to upload a document, you must request permission from your group leader.
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md"
                    >
                      <i className="fas fa-paper-plane" aria-hidden="true" /> Request Upload Permission
                    </button>
                  </div>
                </div>
              ) : (
                <>
                {!isGroupLeader && permissionCountdown && (
                  <div className="rounded-[1.25rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm mb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm animate-pulse">
                          <i className="fas fa-stopwatch text-lg" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">Upload Window Active</p>
                          <p className="text-xs text-emerald-700">Upload your file before time runs out. Permission will auto-expire.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] border border-emerald-200 px-4 py-2 shadow-sm">
                          <i className="fas fa-clock text-emerald-600 text-sm" aria-hidden="true" />
                          <span className="text-lg font-black tabular-nums text-emerald-800 tracking-tight">{permissionCountdown}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <form className="portal-form project-files-upload-form" onSubmit={handleUploadSubmit}>
                <div className="project-files-upload-workflow">
                  <section className="project-files-upload-drop-panel mb-8">
                    <div
                      onClick={!uploadDraft.file ? handleBrowseFile : undefined}
                      className={`group relative flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed py-14 transition-all duration-300 overflow-hidden cursor-pointer ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50/80 shadow-inner scale-[1.01]'
                          : uploadDraft.file
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : 'border-[var(--border-strong)] bg-[var(--surface-alt)] hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                      <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--surface)] shadow-md mb-6 transition-all duration-500 z-10 ${isDragOver ? 'scale-110 shadow-blue-200 shadow-lg' : uploadDraft.file ? 'scale-110 shadow-emerald-200 shadow-lg' : 'group-hover:scale-110 group-hover:shadow-blue-100 group-hover:shadow-lg rotate-3 group-hover:rotate-0'}`}>
                        <div className={`absolute inset-0 rounded-2xl ${uploadDraft.file ? 'bg-emerald-400/20' : 'bg-blue-400/20'} animate-ping opacity-0 group-hover:opacity-100 duration-1000`}></div>
                        <i className={`fas ${uploadDraft.file ? getProjectFileTypeIcon(uploadDraft.file.name, uploadDraft.file.type) : 'fa-cloud-arrow-up'} text-3xl transition-colors duration-300 ${uploadDraft.file ? 'text-emerald-600' : isDragOver ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-600'}`} aria-hidden="true"></i>
                      </div>

                      <h4 className={`text-lg font-extrabold transition-colors z-10 ${uploadDraft.file ? 'text-emerald-800' : 'text-[var(--text)] group-hover:text-blue-700'}`}>
                        {uploadDraft.file ? uploadDraft.file.name : 'Drag and drop your file here'}
                      </h4>

                      <p className="mt-2 text-sm text-[var(--muted)] font-medium z-10 max-w-sm text-center">
                        {uploadDraft.file ? 'The selected file is ready for secure private storage and version tracking.' : 'or click to browse from your computer'}
                      </p>

                      {!uploadDraft.file && (
                        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-bold text-[var(--muted)] z-10">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] backdrop-blur-sm rounded-lg border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5"><i className="fas fa-file-pdf text-rose-500 text-sm"></i> PDF</span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] backdrop-blur-sm rounded-lg border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5 delay-75"><i className="fas fa-file-word text-blue-600 text-sm"></i> DOC</span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] backdrop-blur-sm rounded-lg border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5 delay-150"><i className="fas fa-file-powerpoint text-amber-500 text-sm"></i> PPT</span>
                        </div>
                      )}

                      {uploadDraft.file && (
                        <div className="mt-8 flex items-center gap-3 z-10">
                          <button className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--text)] shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-[var(--surface-alt)] transition-all" type="button" onClick={(e) => { e.stopPropagation(); handleBrowseFile(); }}>
                            <i className="fas fa-folder-open text-blue-500" aria-hidden="true" /> Change File
                          </button>
                          <button className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 hover:bg-rose-100 transition-all" type="button" onClick={(e) => { e.stopPropagation(); clearSelectedFile(); }}>
                            <i className="fas fa-trash-can text-rose-500" aria-hidden="true" /> Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      className="hidden"
                      type="file"
                      accept={DOCUMENT_FILE_ACCEPT}
                      onChange={handleFileInputChange}
                    />
                  </section>

                  <section className="project-files-upload-fields flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2.5">
                        <label htmlFor="project-file-category" className="text-sm font-bold text-[var(--text)] ml-1">Category <span className="text-rose-500">*</span></label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[var(--text-meta)] group-focus-within:text-blue-600 transition-colors">
                            <i className="fas fa-tags"></i>
                          </div>
                          <select
                            id="project-file-category"
                            value={uploadDraft.category}
                            onChange={(event) => updateUploadDraft('category', event.target.value)}
                            disabled={isUploading}
                            className="block w-full appearance-none rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3.5 pl-12 pr-10 text-[var(--text)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all focus:bg-[var(--surface)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:bg-[var(--surface-alt)] sm:text-sm font-bold outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {PROJECT_FILE_CATEGORY_OPTIONS.map((option) => (
                              <option key={option.key} value={option.key}>{option.label}</option>
                            ))}
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-meta)] pointer-events-none" aria-hidden="true" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <label htmlFor="project-file-tag" className="text-sm font-bold text-[var(--text)] ml-1">Tag / Version <span className="text-rose-500">*</span></label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[var(--text-meta)] group-focus-within:text-blue-600 transition-colors">
                            <i className="fas fa-code-branch"></i>
                          </div>
                          <select
                            id="project-file-tag"
                            value={uploadDraft.tag}
                            onChange={(event) => updateUploadDraft('tag', event.target.value as ProjectFileUploadState['tag'])}
                            disabled={isUploading}
                            className="block w-full appearance-none rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3.5 pl-12 pr-10 text-[var(--text)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all focus:bg-[var(--surface)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:bg-[var(--surface-alt)] sm:text-sm font-bold outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {PROJECT_FILE_TAG_OPTIONS.map((tag) => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-meta)] pointer-events-none" aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <label htmlFor="project-file-version-notes" className="text-sm font-bold text-[var(--text)] ml-1">Version Notes <span className="text-[var(--text-meta)] font-medium text-[10px] uppercase tracking-wider ml-1 px-2 py-0.5 bg-[var(--surface-alt)] rounded-md">Optional</span></label>
                      <div className="relative group">
                        <div className="absolute top-4 left-0 flex items-start pl-4 pointer-events-none text-[var(--text-meta)] group-focus-within:text-blue-600 transition-colors">
                          <i className="fas fa-comment-dots"></i>
                        </div>
                        <textarea
                          id="project-file-version-notes"
                          value={uploadDraft.versionNotes}
                          onChange={(event) => updateUploadDraft('versionNotes', event.target.value)}
                          placeholder="Summarize what changed in this version..."
                          disabled={isUploading}
                          className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-3.5 pl-12 pr-4 text-[var(--text)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-[var(--text-meta)] focus:bg-[var(--surface)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:bg-[var(--surface-alt)] sm:text-sm font-medium outline-none min-h-[120px] resize-y disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
                        />
                      </div>
                    </div>

                    {uploadError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-rose-800 shadow-sm">
                        <i className="fas fa-circle-exclamation text-rose-500 text-lg" aria-hidden="true" />
                        <span className="text-sm font-bold">{uploadError}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-4 pt-6 border-t border-[var(--border)]">
                      <button className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[var(--surface)] px-6 py-3.5 text-sm font-bold text-[var(--text)] shadow-sm ring-1 ring-inset ring-slate-200/80 hover:bg-[var(--surface-alt)] hover:text-[var(--text)] hover:ring-slate-300 transition-all disabled:opacity-50" type="button" onClick={resetUploadDraft} disabled={isUploading}>
                        <i className="fas fa-rotate-left text-[var(--text-meta)]" aria-hidden="true" /> Reset
                      </button>

                      <PremiumAnimatedButton
                        className="group relative flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                        type="button"
                        onPress={async () => {
                          await handleUploadSubmit();
                          await new Promise(r => setTimeout(r, 600)); // Minimum animation time
                        }}
                        disabled={isUploading || !uploadDraft.file}
                      >
                        <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[50%] transition-transform duration-1000 ease-in-out"></div>
                        <span className="relative z-10">{isUploading ? 'Uploading...' : 'Submit to Adviser'}</span>
                        <i className={`fas fa-paper-plane relative z-10 transition-transform ${isUploading ? 'animate-bounce' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} aria-hidden="true" />
                      </PremiumAnimatedButton>
                    </div>
                  </section>
                </div>
                </form>
                </>
              )}
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
                          <strong>{`v${entry.versionMajor}.${entry.versionMinor}`}</strong>
                          <span className={`ui-badge is-${getProjectFileTone(entry.status)}`}>{formatProjectFileStatus(entry.status)}</span>
                        </div>
                        <small>{formatProjectFileDateTime(entry.uploadedAt)}</small>
                      </div>

                      <p>{entry.versionNotes}</p>

                      <div className="project-files-history-meta">
                        <span><i className="fas fa-user" aria-hidden="true" /> {entry.uploadedBy}</span>
                        {entry.reviewedBy ? <span><i className="fas fa-user-check" aria-hidden="true" /> {entry.reviewedBy}</span> : null}
                        {entry.reviewedAt ? <span><i className="fas fa-calendar-check" aria-hidden="true" /> {formatProjectFileDateTime(entry.reviewedAt)}</span> : null}
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
