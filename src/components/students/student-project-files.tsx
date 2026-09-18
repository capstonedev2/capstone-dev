'use client';

import Link from 'next/link';
import { type ChangeEvent, type DragEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PremiumAnimatedButton } from '@/components/ui/premium-animated-button';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import {
  ACHIEVEMENT_DOCUMENT_CATEGORIES,
  CONCEPT_GATE_EXEMPT_DOCUMENT_CATEGORIES,
  DOCUMENT_FILE_ACCEPT,
  DOCUMENT_STORAGE_BUCKETS,
  UNRESTRICTED_FILE_TYPE_CATEGORIES,
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
  MAX_UPLOAD_FILES,
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
  hasCompletedConceptStage,
  markSupersededProjectFiles,
  matchesProjectFileFilter,
  normalizeProjectFileStatus,
  sortProjectFiles
} from '@/components/students/student-project-files.shared';
import {
  ACTIVITY_STATUS_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  createAcademicActivityForm,
  deleteAcademicActivity,
  fetchAcademicActivities,
  formatIsoDateLabel,
  saveAcademicActivity,
  type ApiAcademicActivity
} from '@/components/students/student-academic-activity.shared';
import { AcademicActivityDetailModal } from '@/components/students/student-academic-activity-detail';

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
    files: [],
    category: PROJECT_FILE_CATEGORY_OPTIONS[0]?.key || 'proposal',
    versionNotes: '',
    status: 'pending',
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    tag: 'Draft'
  };
}

function getInitialHistoryNote(category: string) {
  if (ACHIEVEMENT_DOCUMENT_CATEGORIES.has(category)) {
    return `${getProjectFileCategoryLabel(category)} evidence uploaded to this project.`;
  }

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
  const [defenseApplicationTemplate, setDefenseApplicationTemplate] = useState<{ fileName: string } | null>(null);

  // Academic activity log — the metadata (title, date, venue) that a bare
  // uploaded file doesn't carry. Logging happens here, next to the evidence
  // upload itself; Project Overview only ever displays the result.
  const [activities, setActivities] = useState<ApiAcademicActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState(() => createAcademicActivityForm(''));
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [activityFormError, setActivityFormError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ApiAcademicActivity | null>(null);
  // .student-shell has a backdrop-filter on it, which traps position:fixed
  // descendants to its own box instead of the real viewport — rendering the
  // "Log Activity" modal via a portal to document.body sidesteps that, so
  // the sidebar and top nav actually sit under the dimmed backdrop.
  const [isModalPortalMounted, setIsModalPortalMounted] = useState(false);

  useEffect(() => {
    setIsModalPortalMounted(true);
  }, []);

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

  // Two switchable groups instead of one long mixed dropdown: "Project
  // Documents" (chapters, proposal, etc. — fully sequence-locked behind Stage
  // 1, no exceptions) and "Academic Activities & Evidence" (awards, activity
  // evidence, and the oral defense application — none of these are tied to
  // thesis progression, so this tab is never locked). Keeping the oral defense
  // application out of the Project Documents tab avoids that tab looking
  // "partly open" while everything else in it is locked.
  const [uploadCategoryTab, setUploadCategoryTab] = useState<'documents' | 'activities'>(
    () => (hasCompletedConceptStage(data) ? 'documents' : 'activities')
  );

  // Already-uploaded files an activity can attach as evidence — sourced from
  // this page's own upload list rather than a second file picker.
  const activityEvidenceFiles = useMemo(
    () => files.filter((file) => file.category === 'award-recognition' || file.category === 'activity-evidence'),
    [files]
  );

  const documentTabCategoryOptions = useMemo(
    () => PROJECT_FILE_CATEGORY_OPTIONS.filter((option) => !CONCEPT_GATE_EXEMPT_DOCUMENT_CATEGORIES.has(option.key)),
    []
  );
  const activityTabCategoryOptions = useMemo(
    () => PROJECT_FILE_CATEGORY_OPTIONS.filter((option) => CONCEPT_GATE_EXEMPT_DOCUMENT_CATEGORIES.has(option.key)),
    []
  );

  // The Project Documents tab has nothing to offer until Stage 1 is complete
  // — the form for it doesn't render at all while locked (see below), so an
  // empty option list here is fine. Academic Activities is never locked.
  const visibleCategoryOptions = uploadCategoryTab === 'activities'
    ? activityTabCategoryOptions
    : documentTabCategoryOptions;
  const isUploadFormLocked = uploadCategoryTab === 'documents' && !isConceptStageComplete;

  const isUnrestrictedCategory = UNRESTRICTED_FILE_TYPE_CATEGORIES.has(uploadDraft.category);
  const fileTypeMode = isUnrestrictedCategory ? 'any' : false;

  useEffect(() => {
    if (!visibleCategoryOptions.some((option) => option.key === uploadDraft.category)) {
      setUploadDraft((current) => ({ ...current, category: visibleCategoryOptions[0]?.key || current.category }));
    }
  }, [visibleCategoryOptions, uploadDraft.category]);

  // A file's validity depends on the selected category (only some categories allow images),
  // but switching the Category dropdown doesn't itself go through handleSelectedFiles — so
  // without this, a file rejected under one category could leave a stale error banner shown
  // alongside a file that's actually valid under the newly-selected category (or vice versa).
  useEffect(() => {
    if (!uploadDraft.files.length) {
      return;
    }

    const stillValid = uploadDraft.files.filter((file) => {
      const typeError = validateFileType(file.name, file.type, fileTypeMode);
      const sizeError = validateFileSize(file.size, DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);
      return !typeError && !sizeError;
    });

    if (stillValid.length !== uploadDraft.files.length) {
      setUploadDraft((current) => ({ ...current, files: stillValid }));
      setUploadError(
        stillValid.length
          ? `${uploadDraft.files.length - stillValid.length} file(s) removed — not valid for the newly selected category.`
          : 'None of the selected files are valid for the newly selected category.'
      );
    } else {
      setUploadError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadDraft.category]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/concept-defense-application-template', { cache: 'no-store' })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (!cancelled) {
          setDefenseApplicationTemplate(payload?.template ?? null);
        }
      })
      .catch(() => {
        // Non-critical: the download link simply stays hidden if this fails.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadActivities = async () => {
    const projectId = data.project.project_id;

    if (!projectId) {
      setIsLoadingActivities(false);
      return;
    }

    setIsLoadingActivities(true);

    try {
      const list = await fetchAcademicActivities(projectId);
      setActivities(list);
    } catch {
      // Non-critical: the log simply stays empty if this fails.
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.project.project_id]);

  useEffect(() => {
    document.body.classList.toggle('is-modal-open', isActivityModalOpen);

    return () => {
      document.body.classList.remove('is-modal-open');
    };
  }, [isActivityModalOpen]);

  const openActivityModal = () => {
    setActivityForm(createAcademicActivityForm(data.project.currentMilestone || ''));
    setActivityFormError(null);
    setIsActivityModalOpen(true);
  };

  const closeActivityModal = () => {
    setIsActivityModalOpen(false);
  };

  const updateActivityForm = <Key extends keyof ReturnType<typeof createAcademicActivityForm>,>(
    field: Key,
    value: ReturnType<typeof createAcademicActivityForm>[Key]
  ) => {
    setActivityForm((current) => ({ ...current, [field]: value }));
  };

  const toggleActivityEvidenceFile = (fileId: string) => {
    setActivityForm((current) => ({
      ...current,
      selectedFileIds: current.selectedFileIds.includes(fileId)
        ? current.selectedFileIds.filter((id) => id !== fileId)
        : [...current.selectedFileIds, fileId]
    }));
  };

  const handleSaveActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activityForm.activityTitle.trim()) {
      setActivityFormError('Enter the academic activity title.');
      return;
    }

    const projectId = data.project.project_id;

    if (!projectId) {
      setActivityFormError('No assigned thesis project was found for your account.');
      return;
    }

    setIsSavingActivity(true);
    setActivityFormError(null);

    try {
      const saved = await saveAcademicActivity(projectId, activityForm);

      if (saved) {
        setActivities((current) => [saved, ...current]);
      } else {
        await loadActivities();
      }

      closeActivityModal();
    } catch (error) {
      setActivityFormError(error instanceof Error ? error.message : 'Unable to save the academic activity.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!window.confirm('Remove this academic activity? This only removes the log entry, not the uploaded evidence file.')) {
      return;
    }

    try {
      await deleteAcademicActivity(activityId);
      setActivities((current) => current.filter((item) => item.id !== activityId));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to remove this activity.');
    }
  };

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

  const resetUploadDraft = () => {
    setUploadDraft(createUploadDraft(data.profile.fullName));
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Project Documents and Academic Activities & Evidence are independent upload
  // contexts (one gated by Stage 1 completion, the other never gated) — without
  // this, files staged in one tab (e.g. 3 evidence photos) would silently carry
  // over if the student switched tabs before submitting, getting uploaded under
  // whatever category the other tab defaults to instead of the one they picked.
  const handleSwitchUploadTab = (tab: 'documents' | 'activities') => {
    setUploadCategoryTab(tab);
    resetUploadDraft();
  };

  const updateUploadDraft = <Key extends keyof ProjectFileUploadState,>(field: Key, value: ProjectFileUploadState[Key]) => {
    setUploadDraft((current) => ({
      ...current,
      [field]: value
    }));
  };

  // Handles both the browse input (one file at a time, no `multiple` attribute — the
  // native OS picker enforces that) and drag-and-drop, which can carry several files
  // in one gesture regardless of the input's own attribute. Files are staged (added to
  // uploadDraft.files, up to MAX_UPLOAD_FILES) rather than uploaded immediately; the
  // student can drop more before hitting Submit, mirroring the Evidence drawer's
  // multi-image carousel on the review side.
  const handleSelectedFiles = (fileList: FileList | File[] | null) => {
    const incoming = fileList ? Array.from(fileList) : [];

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!incoming.length) {
      return;
    }

    const invalidReasons: string[] = [];
    const validIncoming = incoming.filter((file) => {
      const typeError = validateFileType(file.name, file.type, fileTypeMode);
      const sizeError = validateFileSize(file.size, DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);
      const reason = typeError || sizeError;

      if (reason) {
        invalidReasons.push(`${file.name}: ${reason}`);
        return false;
      }

      return true;
    });

    setUploadDraft((current) => {
      const combined = [...current.files, ...validIncoming];
      const overflow = Math.max(0, combined.length - MAX_UPLOAD_FILES);
      const nextFiles = combined.slice(0, MAX_UPLOAD_FILES);

      const messages = [...invalidReasons];
      if (overflow > 0) {
        messages.push(`Only the first ${MAX_UPLOAD_FILES} files are kept — ${overflow} extra file(s) were not added.`);
      }
      setUploadError(messages.length ? messages.join(' ') : null);

      return { ...current, files: nextFiles, uploadedAt: new Date().toISOString() };
    });
  };

  const removeStagedFile = (index: number) => {
    setUploadDraft((current) => ({
      ...current,
      files: current.files.filter((_, fileIndex) => fileIndex !== index)
    }));
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
    handleSelectedFiles(event.target.files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    handleSelectedFiles(event.dataTransfer.files);
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

  const clearAllStagedFiles = () => {
    setUploadDraft((current) => ({ ...current, files: [] }));
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    setUploadError(null);
    setPageError(null);

    if (!uploadDraft.files.length) {
      setUploadError('Select at least one file before submitting it to the project workspace.');
      return;
    }

    // Achievement-log categories (Award/Recognition, Activity Evidence) have no
    // adviser review step, so there's no "still pending" round to block against.
    if (!ACHIEVEMENT_DOCUMENT_CATEGORIES.has(uploadDraft.category)) {
      const hasPendingRound = files.some(
        (file) => file.category === uploadDraft.category && (file.status === 'pending' || file.status === 'under_review')
      );

      if (hasPendingRound) {
        setUploadError('This category already has files awaiting your adviser’s review. Wait for a decision before submitting again.');
        return;
      }
    }

    const versionNotes = uploadDraft.versionNotes.trim() || getDefaultPendingNote(uploadDraft.category, uploadDraft.tag);
    setIsUploading(true);

    // Uploaded sequentially (not Promise.all) so each file's version number is computed
    // against a running list that already includes the ones uploaded earlier in this same
    // batch — a concurrent batch would have every file see the same "next version" and
    // collide, plus it's gentler on the upload API than firing up to 10 requests at once.
    let runningFiles = files;
    const uploadedRecords: ProjectFileRecord[] = [];
    const failures: Array<{ name: string; message: string }> = [];

    for (const selectedFile of uploadDraft.files) {
      const uploadedAt = new Date().toISOString();
      const nextVersion = getNextProjectFileVersionParts(runningFiles, uploadDraft.category);
      const previousLatestFile = [...runningFiles]
        .filter((item) => item.category === uploadDraft.category)
        .sort((left, right) => {
          const versionDelta = compareProjectFileVersions(right, left);

          if (versionDelta !== 0) {
            return versionDelta;
          }

          return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
        })[0];
      const nextHistoryEntry: ProjectFileHistoryEntry = {
        id: `history-${Date.now()}-${selectedFile.name}`,
        versionMajor: nextVersion.versionMajor,
        versionMinor: nextVersion.versionMinor,
        status: 'pending',
        uploadedBy: data.profile.fullName,
        uploadedAt,
        versionNotes
      };

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('bucketName', DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS);
        formData.append('projectId', data.project.project_id || data.project.id);
        formData.append('documentCategory', uploadDraft.category);
        if (uploadDraft.versionNotes.trim()) {
          formData.append('notes', uploadDraft.versionNotes.trim());
        }

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

        uploadedRecords.push(nextRecord);
        runningFiles = [nextRecord, ...runningFiles];
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to upload the document.';
        failures.push({ name: selectedFile.name, message });
      }
    }

    if (uploadedRecords.length) {
      setFiles((current) => [...uploadedRecords, ...current]);
      setCurrentPage(1);

      // Consume ALL one-time use permission tokens if used — once per batch, not per file.
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

      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    }

    if (failures.length) {
      const failureSummary = failures.map((failure) => `${failure.name}: ${failure.message}`).join(' ');
      setUploadError(
        uploadedRecords.length
          ? `${uploadedRecords.length} of ${uploadDraft.files.length} file(s) uploaded. Failed: ${failureSummary}`
          : failureSummary
      );
      setToast({
        tone: uploadedRecords.length ? 'warning' : 'danger',
        message: uploadedRecords.length
          ? `${uploadedRecords.length} of ${uploadDraft.files.length} file(s) uploaded — ${failures.length} failed.`
          : 'Upload failed.'
      });
      // Only clear the files that succeeded, so the ones that failed stay staged for retry.
      setUploadDraft((current) => ({
        ...current,
        files: current.files.filter((file) => failures.some((failure) => failure.name === file.name))
      }));
    } else {
      setToast({
        tone: 'success',
        message: uploadedRecords.length === 1
          ? `${uploadedRecords[0].fileName} uploaded securely as ${getProjectFileVersionLabel(uploadedRecords[0])}.`
          : `${uploadedRecords.length} files uploaded securely.`
      });
      resetUploadDraft();
    }

    setIsUploading(false);
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
              <p>Keep drafts, revisions, and approved project documents organized in one workspace.</p>
            </div>
          </div>
          <div className="project-files-header-actions">
            <button
              className="btn btn-primary project-files-upload-button"
              type="button"
              onClick={openUploadSection}
              title={!isConceptStageComplete ? "Award, activity evidence, and oral defense application uploads are open now; other project files open once Stage 1: Concept Proposal is complete." : "Upload New Version"}
            >
              <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
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

              {!isGroupLeader && currentUserRole === 'student' && !isUploadAllowed && !data.group?.allowMemberSubmission ? (
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
                <div className="project-files-upload-tabs flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Upload category group">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={uploadCategoryTab === 'documents'}
                    onClick={() => handleSwitchUploadTab('documents')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      uploadCategoryTab === 'documents'
                        ? 'bg-[#003A8F] text-white shadow-sm'
                        : 'bg-[var(--surface-alt)] text-[var(--muted)] hover:bg-blue-50 hover:text-[#003A8F]'
                    }`}
                  >
                    <i className="fas fa-file-lines" aria-hidden="true" />
                    Project Documents
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={uploadCategoryTab === 'activities'}
                    onClick={() => handleSwitchUploadTab('activities')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      uploadCategoryTab === 'activities'
                        ? 'bg-[#003A8F] text-white shadow-sm'
                        : 'bg-[var(--surface-alt)] text-[var(--muted)] hover:bg-blue-50 hover:text-[#003A8F]'
                    }`}
                  >
                    <i className="fas fa-award" aria-hidden="true" />
                    Academic Activities & Evidence
                  </button>
                </div>

                {uploadCategoryTab === 'activities' && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text)]">Academic Activity Log</h3>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          Log a presentation, seminar, or award and attach evidence uploaded below.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={openActivityModal}
                      >
                        <i className="fas fa-plus" aria-hidden="true" /> Log Activity
                      </button>
                    </div>

                    {isLoadingActivities ? (
                      <p className="text-sm text-[var(--muted)]">Loading activities...</p>
                    ) : activities.length ? (
                      <div className="flex flex-col gap-2">
                        {activities.map((activity) => (
                          <button
                            type="button"
                            key={activity.id}
                            onClick={() => setSelectedActivity(activity)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[var(--text)] truncate">
                                {activity.eventName}
                                {activity.markAsAchievement ? (
                                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">Achievement</span>
                                ) : null}
                              </p>
                              <p className="text-xs text-[var(--muted)]">
                                {activity.activityType} &middot; {formatIsoDateLabel(activity.eventDate || activity.createdAt)}
                                {activity.venue ? ` · ${activity.venue}` : ''}
                                {activity.files.length ? ` · ${activity.files.length} file${activity.files.length === 1 ? '' : 's'}` : ''}
                              </p>
                            </div>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteActivity(activity.id);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.stopPropagation();
                                  handleDeleteActivity(activity.id);
                                }
                              }}
                              className="shrink-0 h-8 w-8 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-meta)] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                              title="Remove activity"
                            >
                              <i className="fas fa-trash-can text-[11px]" aria-hidden="true" />
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted)]">No academic activities logged yet.</p>
                    )}
                  </div>
                )}

                {uploadCategoryTab === 'documents' && !isConceptStageComplete && (
                  <div className="project-files-locked-panel mb-6" aria-labelledby="project-files-upload-locked-title">
                    <div className="project-files-locked-icon" aria-hidden="true">
                      <i className="fas fa-file-shield" />
                    </div>

                    <div className="project-files-locked-copy">
                      <h4 id="project-files-upload-locked-title">Project documents open after Stage 1</h4>
                      <p className="project-files-locked-description">
                        Complete your Concept Proposal in Title Submission to unlock chapters, revisions, and other
                        project documents. Switch to the Academic Activities & Evidence tab to upload the oral
                        defense application evidence, log awards, or attach activity evidence any time.
                      </p>

                      <div className="project-files-locked-actions">
                        <Link prefetch={false} href="/students/title-submission">
                          <i className="fas fa-pen-to-square" aria-hidden="true" />
                          Continue Title Submission
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                {!isUploadFormLocked && (
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
                      onClick={!uploadDraft.files.length ? handleBrowseFile : undefined}
                      className={`group relative flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed py-14 transition-all duration-300 overflow-hidden cursor-pointer ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50/80 shadow-inner scale-[1.01]'
                          : uploadDraft.files.length
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : 'border-[var(--border-strong)] bg-[var(--surface-alt)] hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                      <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--surface)] shadow-md mb-6 transition-all duration-500 z-10 ${isDragOver ? 'scale-110 shadow-blue-200 shadow-lg' : uploadDraft.files.length ? 'scale-110 shadow-emerald-200 shadow-lg' : 'group-hover:scale-110 group-hover:shadow-blue-100 group-hover:shadow-lg rotate-3 group-hover:rotate-0'}`}>
                        <div className={`absolute inset-0 rounded-2xl ${uploadDraft.files.length ? 'bg-emerald-400/20' : 'bg-blue-400/20'} animate-ping opacity-0 group-hover:opacity-100 duration-1000`}></div>
                        <i className={`fas ${uploadDraft.files.length === 1 ? getProjectFileTypeIcon(uploadDraft.files[0].name, uploadDraft.files[0].type) : uploadDraft.files.length > 1 ? 'fa-layer-group' : 'fa-cloud-arrow-up'} text-3xl transition-colors duration-300 ${uploadDraft.files.length ? 'text-emerald-600' : isDragOver ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-600'}`} aria-hidden="true"></i>
                      </div>

                      <h4 className={`text-lg font-extrabold transition-colors z-10 ${uploadDraft.files.length ? 'text-emerald-800' : 'text-[var(--text)] group-hover:text-blue-700'}`}>
                        {uploadDraft.files.length === 1
                          ? uploadDraft.files[0].name
                          : uploadDraft.files.length > 1
                            ? `${uploadDraft.files.length} files selected`
                            : 'Drag and drop your files here'}
                      </h4>

                      <p className="mt-2 text-sm text-[var(--muted)] font-medium z-10 max-w-sm text-center">
                        {uploadDraft.files.length
                          ? `Ready for secure private storage and version tracking. Up to ${MAX_UPLOAD_FILES} files per batch.`
                          : `or click to browse from your computer — up to ${MAX_UPLOAD_FILES} files at once`}
                      </p>

                      {!uploadDraft.files.length && (
                        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-bold text-[var(--muted)] z-10">
                          {isUnrestrictedCategory ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] backdrop-blur-sm rounded-lg border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5">
                              <i className="fas fa-infinity text-emerald-500 text-sm"></i> Any file type
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] backdrop-blur-sm rounded-lg border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5 delay-75"><i className="fas fa-file-pdf text-rose-500 text-sm"></i> PDF</span>
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] backdrop-blur-sm rounded-lg border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5 delay-150"><i className="fas fa-file-word text-blue-600 text-sm"></i> DOC</span>
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] backdrop-blur-sm rounded-lg border border-[var(--border)] shadow-sm transition-transform group-hover:-translate-y-0.5 delay-200"><i className="fas fa-file-powerpoint text-amber-500 text-sm"></i> PPT</span>
                            </>
                          )}
                        </div>
                      )}

                      {uploadDraft.files.length > 0 && (
                        <div className="mt-8 flex items-center gap-3 z-10">
                          <button
                            className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--text)] shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-[var(--surface-alt)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            disabled={uploadDraft.files.length >= MAX_UPLOAD_FILES}
                            onClick={(e) => { e.stopPropagation(); handleBrowseFile(); }}
                          >
                            <i className="fas fa-folder-open text-blue-500" aria-hidden="true" /> Add More
                          </button>
                          <button className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 hover:bg-rose-100 transition-all" type="button" onClick={(e) => { e.stopPropagation(); clearAllStagedFiles(); }}>
                            <i className="fas fa-trash-can text-rose-500" aria-hidden="true" /> Remove All
                          </button>
                        </div>
                      )}
                    </div>

                    {uploadDraft.files.length > 1 && (
                      <ul className="mt-4 space-y-2">
                        {uploadDraft.files.map((file, index) => (
                          <li
                            key={`${file.name}-${file.lastModified}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm"
                          >
                            <span className="flex min-w-0 items-center gap-2.5 font-semibold text-[var(--text)]">
                              <i className={`fas ${getProjectFileTypeIcon(file.name, file.type)} text-blue-500 shrink-0`} aria-hidden="true" />
                              <span className="truncate">{file.name}</span>
                            </span>
                            <button
                              type="button"
                              className="shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                              onClick={() => removeStagedFile(index)}
                              aria-label={`Remove ${file.name}`}
                            >
                              <i className="fas fa-xmark" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <input
                      ref={fileInputRef}
                      className="hidden"
                      type="file"
                      multiple
                      accept={isUnrestrictedCategory ? undefined : DOCUMENT_FILE_ACCEPT}
                      onChange={handleFileInputChange}
                    />
                  </section>

                  <section className="project-files-upload-fields flex flex-col gap-6">
                    <div className={`grid grid-cols-1 gap-6 ${uploadCategoryTab === 'activities' ? '' : 'md:grid-cols-2'}`}>
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
                            {visibleCategoryOptions.map((option) => (
                              <option key={option.key} value={option.key}>{option.label}</option>
                            ))}
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-meta)] pointer-events-none" aria-hidden="true" />
                        </div>
                        {uploadDraft.category === 'concept-defense-application' ? (
                          defenseApplicationTemplate ? (
                            <a
                              href="/api/concept-defense-application-template/download"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                            >
                              <i className="fas fa-file-arrow-down" aria-hidden="true" />
                              Download the current blank form
                            </a>
                          ) : (
                            <p className="ml-1 text-[11px] text-[var(--text-meta)]">
                              No downloadable blank form has been posted yet &mdash; get the current version from your department.
                            </p>
                          )
                        ) : null}
                      </div>

                      {uploadCategoryTab === 'activities' ? null : (
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
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <label htmlFor="project-file-version-notes" className="text-sm font-bold text-[var(--text)] ml-1">
                        {uploadCategoryTab === 'activities' ? 'Notes' : 'Version Notes'}{' '}
                        <span className="text-[var(--text-meta)] font-medium text-[10px] uppercase tracking-wider ml-1 px-2 py-0.5 bg-[var(--surface-alt)] rounded-md">Optional</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute top-4 left-0 flex items-start pl-4 pointer-events-none text-[var(--text-meta)] group-focus-within:text-blue-600 transition-colors">
                          <i className="fas fa-comment-dots"></i>
                        </div>
                        <textarea
                          id="project-file-version-notes"
                          value={uploadDraft.versionNotes}
                          onChange={(event) => updateUploadDraft('versionNotes', event.target.value)}
                          placeholder={uploadCategoryTab === 'activities' ? 'Add any context for this evidence...' : 'Summarize what changed in this version...'}
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
                        disabled={isUploading || !uploadDraft.files.length}
                      >
                        <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[50%] transition-transform duration-1000 ease-in-out"></div>
                        <span className="relative z-10">
                          {isUploading
                            ? 'Uploading...'
                            : uploadDraft.files.length > 1
                              ? `Submit ${uploadDraft.files.length} Files to Adviser`
                              : 'Submit to Adviser'}
                        </span>
                        <i className={`fas fa-paper-plane relative z-10 transition-transform ${isUploading ? 'animate-bounce' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} aria-hidden="true" />
                      </PremiumAnimatedButton>
                    </div>
                  </section>
                </div>
                </form>
                </>
                )}
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

      {isModalPortalMounted ? createPortal(
      <div className={`modal-shell ${isActivityModalOpen ? 'is-open' : ''}`} aria-hidden={isActivityModalOpen ? 'false' : 'true'}>
        <button className="modal-backdrop" type="button" aria-label="Close log activity modal" onClick={closeActivityModal} />
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-activity-title"
          style={{ width: 'min(46rem, calc(100vw - 2rem))', overflow: 'hidden' }}
        >
          <button className="modal-close" type="button" aria-label="Close log activity modal" onClick={closeActivityModal}>
            <i className="fas fa-times" aria-hidden="true" />
          </button>
          <div className="modal-content" style={{ padding: 0 }}>
            <form onSubmit={handleSaveActivity} className="flex max-h-[calc(100vh-2rem)] flex-col">
              <div className="shrink-0 border-b border-[var(--border)] px-7 pt-7 pb-5">
                <span className="section-kicker">Academic Activities &amp; Evidence</span>
                <h3 id="log-activity-title" className="mt-1.5 text-xl font-black text-[var(--text)]">Log Academic Activity</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">Record what happened, then attach evidence you&apos;ve already uploaded on this page.</p>
              </div>

              <div className="flex-1 space-y-7 overflow-y-auto px-7 py-6">
                {activityFormError ? (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    <i className="fas fa-circle-exclamation mt-0.5" aria-hidden="true" />
                    <span>{activityFormError}</span>
                  </div>
                ) : null}

                <section>
                  <h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-meta)]">
                    <i className="fas fa-clipboard-list" aria-hidden="true" /> Activity Details
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="form-field">
                      <label htmlFor="activity-type">Activity Type</label>
                      <select
                        id="activity-type"
                        value={activityForm.activityType}
                        onChange={(event) => updateActivityForm('activityType', event.target.value)}
                      >
                        {ACTIVITY_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="activity-status">Status</label>
                      <select
                        id="activity-status"
                        value={activityForm.status}
                        onChange={(event) => updateActivityForm('status', event.target.value)}
                      >
                        {ACTIVITY_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field sm:col-span-2">
                      <label htmlFor="activity-title">Activity Title</label>
                      <input
                        id="activity-title"
                        type="text"
                        value={activityForm.activityTitle}
                        onChange={(event) => updateActivityForm('activityTitle', event.target.value)}
                        placeholder="Enter the academic activity title"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="activity-milestone">Related Milestone</label>
                      <select
                        id="activity-milestone"
                        value={activityForm.relatedMilestone}
                        onChange={(event) => updateActivityForm('relatedMilestone', event.target.value)}
                      >
                        <option value="">Not linked to a milestone</option>
                        {(data.milestones || []).map((milestone) => (
                          <option key={milestone.id} value={milestone.title}>{milestone.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="activity-date">Date</label>
                      <input
                        id="activity-date"
                        type="date"
                        value={activityForm.date}
                        onChange={(event) => updateActivityForm('date', event.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="activity-location">Location / Venue</label>
                      <input
                        id="activity-location"
                        type="text"
                        value={activityForm.location}
                        onChange={(event) => updateActivityForm('location', event.target.value)}
                        placeholder="University auditorium, partner site, online, etc."
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="activity-participants">Participants / Beneficiary</label>
                      <input
                        id="activity-participants"
                        type="text"
                        value={activityForm.participantsOrBeneficiary}
                        onChange={(event) => updateActivityForm('participantsOrBeneficiary', event.target.value)}
                        placeholder="Students, faculty panel, community partner, or beneficiary"
                      />
                    </div>

                    <div className="form-field sm:col-span-2">
                      <label htmlFor="activity-description">Description</label>
                      <textarea
                        id="activity-description"
                        value={activityForm.description}
                        onChange={(event) => updateActivityForm('description', event.target.value)}
                        placeholder="Summarize the activity, outcomes, and relevance to the project."
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-meta)]">
                    <i className="fas fa-paperclip" aria-hidden="true" /> Evidence
                  </h4>
                  {activityEvidenceFiles.length ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {activityEvidenceFiles.map((file) => {
                        const isSelected = activityForm.selectedFileIds.includes(file.id);
                        return (
                          <label
                            key={file.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                              isSelected
                                ? 'border-blue-400 bg-blue-50/60 ring-1 ring-blue-400/30'
                                : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-blue-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleActivityEvidenceFile(file.id)}
                              className="h-4 w-4 shrink-0 rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                            />
                            <i className="fas fa-file-lines shrink-0 text-[var(--text-meta)]" aria-hidden="true" />
                            <span className="min-w-0 truncate text-sm font-semibold text-[var(--text)]">{file.fileName}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                      Upload an Award/Recognition or Activity Evidence file above first, then attach it here.
                    </p>
                  )}
                </section>

                <section>
                  <h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-meta)]">
                    <i className="fas fa-sliders" aria-hidden="true" /> Additional Options
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition ${
                        activityForm.addToTimeline
                          ? 'border-blue-400 bg-blue-50/60'
                          : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={activityForm.addToTimeline}
                        onChange={(event) => updateActivityForm('addToTimeline', event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex flex-col gap-0.5">
                        <strong className="text-sm font-bold text-[var(--text)]">Add this activity to project timeline</strong>
                        <span className="text-xs text-[var(--muted)]">Keep the activity aligned with the related milestone record.</span>
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition ${
                        activityForm.markAsAchievement
                          ? 'border-amber-400 bg-amber-50/60'
                          : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-amber-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={activityForm.markAsAchievement}
                        onChange={(event) => updateActivityForm('markAsAchievement', event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] text-amber-600 focus:ring-amber-500"
                      />
                      <span className="flex flex-col gap-0.5">
                        <strong className="text-sm font-bold text-[var(--text)]">Mark as achievement / recognition</strong>
                        <span className="text-xs text-[var(--muted)]">Use this when the activity should also count as a recognition entry.</span>
                      </span>
                    </label>
                  </div>
                </section>
              </div>

              <div className="form-actions shrink-0 border-t border-[var(--border)] px-7 py-4">
                <button className="btn btn-secondary" type="button" onClick={closeActivityModal}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={isSavingActivity}>
                  <i className="fas fa-floppy-disk" aria-hidden="true" /> {isSavingActivity ? 'Saving...' : 'Save Academic Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
      ) : null}

      <AcademicActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onDelete={handleDeleteActivity}
      />
    </>
  );
}
