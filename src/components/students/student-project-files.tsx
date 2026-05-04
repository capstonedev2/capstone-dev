'use client';

import Link from 'next/link';
import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { StudentDashboardData } from '@/lib/mock/student-dashboard';
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
  getProjectFileTagFromStatus,
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

function shiftTimestamp(value: string, dayOffset: number, hourOffset = 0) {
  const timestamp = new Date(value);
  timestamp.setDate(timestamp.getDate() + dayOffset);
  timestamp.setHours(timestamp.getHours() + hourOffset);
  return timestamp.toISOString();
}

function getInitialHistoryNote(category: string) {
  return `Initial ${getProjectFileCategoryLabel(category).toLowerCase()} file uploaded for adviser review.`;
}

function getRevisionHistoryNote(category: string) {
  return `Updated ${getProjectFileCategoryLabel(category).toLowerCase()} package submitted after revision comments.`;
}

function getApprovedHistoryNote(category: string) {
  return `${getProjectFileCategoryLabel(category)} copy approved and archived as an official repository document.`;
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

function buildProjectFileHistory(
  document: StudentDashboardData['documents'][number],
  adviserName: string
): ProjectFileHistoryEntry[] {
  const normalizedStatus = normalizeProjectFileStatus(document.reviewStatus);
  const initialUploadedAt = normalizedStatus === 'pending' ? document.created_at : shiftTimestamp(document.created_at, -8, -1);
  const initialEntry: ProjectFileHistoryEntry = {
    id: `${document.id}-history-v1-0`,
    versionMajor: 1,
    versionMinor: 0,
    status: 'pending',
    uploadedBy: document.uploadedBy,
    uploadedAt: initialUploadedAt,
    versionNotes: getInitialHistoryNote(document.category)
  };

  if (normalizedStatus === 'pending') {
    return [initialEntry];
  }

  const revisionUploadedAt = normalizedStatus === 'revision' ? document.created_at : shiftTimestamp(document.created_at, -3, -2);
  const revisionReviewedAt = shiftTimestamp(revisionUploadedAt, 1, 4);
  const revisionEntry: ProjectFileHistoryEntry = {
    id: `${document.id}-history-v1-1`,
    versionMajor: 1,
    versionMinor: 1,
    status: 'revision',
    uploadedBy: document.uploadedBy,
    uploadedAt: revisionUploadedAt,
    versionNotes: getRevisionHistoryNote(document.category),
    reviewedBy: adviserName,
    reviewedAt: revisionReviewedAt
  };

  if (normalizedStatus === 'revision') {
    return [initialEntry, revisionEntry];
  }

  const approvedEntry: ProjectFileHistoryEntry = {
    id: `${document.id}-history-v1-2`,
    versionMajor: 1,
    versionMinor: 2,
    status: 'approved',
    uploadedBy: document.uploadedBy,
    uploadedAt: document.created_at,
    versionNotes: getApprovedHistoryNote(document.category),
    reviewedBy: adviserName,
    reviewedAt: document.updated_at
  };

  return [initialEntry, revisionEntry, approvedEntry];
}

function buildProjectFileRecords(data: StudentDashboardData): ProjectFileRecord[] {
  const adviserName = data.project.adviser || data.profile.adviser || 'Assigned Adviser';

  return sortProjectFiles(
    data.documents.map((document) => {
      const history = buildProjectFileHistory(document, adviserName);
      const latestEntry = history[history.length - 1];

      return {
        id: document.id,
        projectId: document.project_id,
        category: document.category,
        fileName: document.fileName,
        fileUrl: '#',
        versionMajor: latestEntry.versionMajor,
        versionMinor: latestEntry.versionMinor,
        status: latestEntry.status,
        tag: getProjectFileTagFromStatus(latestEntry.status),
        versionNotes: latestEntry.versionNotes,
        uploadedBy: latestEntry.uploadedBy,
        uploadedAt: latestEntry.uploadedAt,
        reviewedBy: latestEntry.reviewedBy,
        reviewedAt: latestEntry.reviewedAt,
        isFinal: latestEntry.status === 'approved',
        isRepositoryCopy: latestEntry.status === 'approved',
        fileType: document.fileType,
        sizeLabel: document.sizeLabel,
        uploadedById: document.user_id,
        history
      };
    }),
    'newest'
  );
}

export function StudentProjectFiles({ data }: { data: StudentDashboardData }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSectionRef = useRef<HTMLElement | null>(null);
  const trackerSectionRef = useRef<HTMLElement | null>(null);
  const repositorySectionRef = useRef<HTMLElement | null>(null);
  const createdObjectUrlsRef = useRef(new Set<string>());
  const initialFiles = useMemo(() => buildProjectFileRecords(data), [data]);
  const currentUserRole = useMemo(() => resolveUserRole(data.profile.groupRole), [data.profile.groupRole]);
  const currentUserId = data.profile.user_id;
  const adviserName = data.project.adviser || data.profile.adviser || 'Assigned Adviser';

  const [files, setFiles] = useState<ProjectFileRecord[]>(initialFiles);
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

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

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
    const timer = window.setTimeout(() => setIsLoadingFiles(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

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
    updateUploadDraft('file', file);
    updateUploadDraft('uploadedAt', new Date().toISOString());
  };

  const openUploadSection = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openTrackerSection = () => {
    trackerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openRepositorySection = () => {
    repositorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const handleUploadSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);
    setPageError(null);

    if (!uploadDraft.file) {
      setUploadError('Select a file before submitting it to the project workspace.');
      return;
    }

    const selectedFile = uploadDraft.file;
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
    const fileUrl = URL.createObjectURL(selectedFile);

    createdObjectUrlsRef.current.add(fileUrl);
    setIsUploading(true);

    const nextRecord: ProjectFileRecord = {
      id: `local-file-${Date.now()}`,
      projectId: data.project.project_id,
      category: uploadDraft.category,
      fileName: selectedFile.name,
      fileUrl,
      versionMajor: nextVersion.versionMajor,
      versionMinor: nextVersion.versionMinor,
      status: 'pending',
      tag: uploadDraft.tag,
      versionNotes,
      uploadedBy: data.profile.fullName,
      uploadedAt,
      isFinal: false,
      isRepositoryCopy: false,
      fileType: selectedFile.type || selectedFile.name.split('.').pop() || 'File',
      sizeLabel: formatFileSizeLabel(selectedFile.size),
      uploadedById: currentUserId,
      history: [...(previousLatestFile?.history || []), nextHistoryEntry]
    };

    window.setTimeout(() => {
      setFiles((current) => [nextRecord, ...current]);
      setCurrentPage(1);
      setIsUploading(false);
      setToast({
        tone: 'success',
        message: `${selectedFile.name} uploaded as ${getProjectFileVersionLabel(nextRecord)}.`
      });
      resetUploadDraft();
    }, 850);
  };

  const handleViewFile = (file: ProjectFileRecord) => {
    if (file.fileUrl.startsWith('blob:')) {
      window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setToast({
      tone: 'warning',
      message: 'Preview becomes available once this file is saved to the shared project record.'
    });
  };

  const handleDownloadFile = (file: ProjectFileRecord) => {
    if (file.fileUrl.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setToast({
      tone: 'warning',
      message: 'Download becomes available once this file is saved to the shared project record.'
    });
  };

  const handleDeleteFile = (file: ProjectFileRecord) => {
    setPageError(null);
    setFiles((current) => current.filter((item) => item.id !== file.id));
    setHistoryFile((current) => (current?.id === file.id ? null : current));

    if (file.fileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(file.fileUrl);
      createdObjectUrlsRef.current.delete(file.fileUrl);
    }

    setToast({
      tone: 'success',
      message: `${file.fileName} removed from the active project tracker.`
    });
  };

  const handleApproveFile = (file: ProjectFileRecord) => {
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
  };

  const handleViewHistory = (file: ProjectFileRecord) => {
    setHistoryFile(file);
  };

  const needsAttentionCount = pendingReviewCount + revisionCount;
  const heroStats = [
    {
      id: 'tracked',
      label: 'Tracked files',
      value: `${trackedFilesCount}`,
      note: latestFile
        ? `${getProjectFileVersionLabel(latestFile)} uploaded ${formatProjectFileDateTime(latestFile.uploadedAt)}`
        : 'Start the workspace by uploading the first project document.'
    },
    {
      id: 'attention',
      label: 'Needs attention',
      value: needsAttentionCount ? `${needsAttentionCount}` : 'Clear',
      note: needsAttentionCount
        ? `${revisionCount} revision request${revisionCount === 1 ? '' : 's'} and ${pendingReviewCount} pending review file${pendingReviewCount === 1 ? '' : 's'}`
        : 'No file is currently flagged for revision or waiting on review.'
    },
    {
      id: 'repository',
      label: 'Approved copies',
      value: `${approvedRepositoryCount}`,
      note: latestApprovedFile
        ? `${latestApprovedFile.fileName} is the latest verified repository file.`
        : 'Approved files will appear here after adviser confirmation.'
    },
    {
      id: 'next-version',
      label: 'Next version',
      value: nextVersionLabel,
      note: `Prepared for ${getProjectFileCategoryLabel(uploadDraft.category)} uploads.`
    }
  ];
  const uploadSnapshot = [
    {
      id: 'selected-file',
      label: 'Selected file',
      value: uploadDraft.file?.name ?? 'No file selected yet',
      note: uploadDraft.file
        ? `${formatFileSizeLabel(uploadDraft.file.size)} | ${uploadDraft.file.type || 'Unknown file type'}`
        : 'Choose a file to generate the next tracked version.'
    },
    {
      id: 'category',
      label: 'Category',
      value: getProjectFileCategoryLabel(uploadDraft.category),
      note: 'Documents stay grouped by type for faster adviser review.'
    },
    {
      id: 'submission-tag',
      label: 'Submission tag',
      value: uploadDraft.tag,
      note: 'Use Draft, Revision, or Final to clarify the current intent.'
    }
  ];
  const repositoryPulse = [
    {
      id: 'latest-approved',
      label: 'Latest approved copy',
      value: latestApprovedFile?.fileName ?? 'Awaiting first approval',
      note: latestApprovedFile
        ? `${latestApprovedFile.reviewedBy || adviserName} | ${formatProjectFileDateTime(latestApprovedFile.reviewedAt || latestApprovedFile.uploadedAt)}`
        : 'A verified file will appear here once your adviser approves it.'
    },
    {
      id: 'filter-view',
      label: 'Tracker view',
      value: activeFilterLabel,
      note: hasActiveTableFilters
        ? 'You are viewing a filtered set of file records.'
        : 'The tracker currently shows the full project record.'
    },
    {
      id: 'role',
      label: 'Workspace role',
      value: currentUserRole === 'student' ? 'Student contributor' : currentUserRole,
      note: 'Students upload working copies, advisers approve, and admins preserve final records.'
    }
  ];
  const toastIcon = toast?.tone === 'success'
    ? 'fa-circle-check'
    : toast?.tone === 'danger'
      ? 'fa-circle-exclamation'
      : 'fa-circle-info';

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
              <p>Keep drafts, revisions, and approved project documents organized in one working record for your group.</p>
            </div>
          </div>
        </header>

        <div className="page-body project-files-page-body">
          <section className="dashboard-hero project-files-hero">
            <article className="dashboard-hero-main project-files-hero-main">
              <div className="student-dashboard-overview-top">
                <span className="section-kicker">File Workspace</span>
                <div className="chip-row">
                  <span className={`ui-badge is-${needsAttentionCount ? 'warning' : 'success'}`}>
                    <i className={`fas ${needsAttentionCount ? 'fa-triangle-exclamation' : 'fa-circle-check'}`} aria-hidden="true" />
                    {needsAttentionCount ? `${needsAttentionCount} need attention` : 'Tracker clear'}
                  </span>
                  <span className="project-files-version-badge">Next {nextVersionLabel}</span>
                </div>
              </div>

              <div className="project-files-hero-copy">
                <h2>Version control for every project document from draft to approved copy</h2>
                <p>
                  Keep manuscript chapters, system packages, presentations, and evidence in one
                  structured workspace so your group and adviser always see the latest file story.
                </p>
              </div>

              <div className="dashboard-callout-grid project-files-hero-stats">
                {heroStats.map((item) => (
                  <article key={item.id} className="dashboard-callout project-files-hero-stat">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>

              <div className="dashboard-action-grid project-files-hero-actions">
                <button className="dashboard-action-card project-files-action-card" type="button" onClick={openUploadSection}>
                  <span className="dashboard-action-icon">
                    <i className="fas fa-file-arrow-up" aria-hidden="true" />
                  </span>
                  <div className="project-files-action-copy">
                    <span className="project-files-action-meta">Next {nextVersionLabel}</span>
                    <strong>Upload New File</strong>
                    <small>Start a new tracked submission without leaving the project-files page.</small>
                  </div>
                </button>

                <button className="dashboard-action-card project-files-action-card" type="button" onClick={() => {
                  updateUploadDraft('category', 'presentation-files');
                  openUploadSection();
                }}>
                  <span className="dashboard-action-icon" style={{ backgroundColor: 'rgba(246,190,0,0.2)', color: 'var(--primary-dark)' }}>
                    <i className="fas fa-file-powerpoint" aria-hidden="true" />
                  </span>
                  <div className="project-files-action-copy">
                    <span className="project-files-action-meta" style={{ color: 'var(--primary-dark)' }}>Live Defense</span>
                    <strong>Upload Presentation</strong>
                    <small>Upload your final slide deck for the panelists to view during defense.</small>
                  </div>
                </button>

                <button className="dashboard-action-card project-files-action-card" type="button" onClick={openTrackerSection}>
                  <span className="dashboard-action-icon">
                    <i className="fas fa-layer-group" aria-hidden="true" />
                  </span>
                  <div className="project-files-action-copy">
                    <span className="project-files-action-meta">{totalCount} visible</span>
                    <strong>Open File Tracker</strong>
                    <small>Jump to the filtered records table and review current file activity.</small>
                  </div>
                </button>

                <button className="dashboard-action-card project-files-action-card" type="button" onClick={openRepositorySection}>
                  <span className="dashboard-action-icon">
                    <i className="fas fa-lock" aria-hidden="true" />
                  </span>
                  <div className="project-files-action-copy">
                    <span className="project-files-action-meta">{approvedRepositoryCount} approved</span>
                    <strong>Open Repository</strong>
                    <small>Review final approved copies prepared for archive handoff and download.</small>
                  </div>
                </button>

                <Link className="dashboard-action-card project-files-action-card" href="/students/faculty-feedback">
                  <span className="dashboard-action-icon">
                    <i className="fas fa-comments" aria-hidden="true" />
                  </span>
                  <div className="project-files-action-copy">
                    <span className="project-files-action-meta">
                      {revisionCount ? `${revisionCount} revision request${revisionCount === 1 ? '' : 's'}` : 'Feedback clear'}
                    </span>
                    <strong>Review Feedback</strong>
                    <small>Cross-check adviser comments before uploading another working version.</small>
                  </div>
                </Link>
              </div>
            </article>

            <div className="dashboard-hero-side">
              <article className="dashboard-brief-card project-files-brief-card">
                <div className="card-heading">
                  <div>
                    <span className="section-kicker">Upload Snapshot</span>
                    <h3>Current submission setup</h3>
                  </div>
                  <span className={`ui-badge is-${uploadDraft.file ? 'info' : 'neutral'}`}>
                    <i className={`fas ${uploadDraft.file ? getProjectFileTypeIcon(uploadDraft.file.name, uploadDraft.file.type) : 'fa-cloud-arrow-up'}`} aria-hidden="true" />
                    {uploadDraft.file ? 'Ready to tag' : 'Waiting for file'}
                  </span>
                </div>

                <div className="detail-grid project-files-snapshot-grid">
                  {uploadSnapshot.map((item) => (
                    <article key={item.id} className="detail-item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.note}</small>
                    </article>
                  ))}
                </div>

                <div className="workspace-note is-member">
                  <strong>Use version notes to explain what changed before each adviser review.</strong>
                  <p>
                    {latestFile
                      ? `Latest tracked file: ${latestFile.fileName} ${getProjectFileVersionLabel(latestFile)} uploaded on ${formatProjectFileDateTime(latestFile.uploadedAt)}.`
                      : 'Upload your first file to start the project record and keep future revisions easier to review.'}
                  </p>
                </div>
              </article>

              <article className="dashboard-brief-card project-files-brief-card">
                <div className="card-heading">
                  <div>
                    <span className="section-kicker">Repository Pulse</span>
                    <h3>Review posture and archive state</h3>
                  </div>
                  <span className={`ui-badge is-${approvedRepositoryCount ? 'success' : 'warning'}`}>
                    <i className="fas fa-box-archive" aria-hidden="true" />
                    {approvedRepositoryCount ? 'Archive building' : 'Awaiting approvals'}
                  </span>
                </div>

                <div className="detail-grid project-files-snapshot-grid">
                  {repositoryPulse.map((item) => (
                    <article key={item.id} className="detail-item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.note}</small>
                    </article>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="content-grid two-thirds project-files-main-grid">
            <article ref={trackerSectionRef} className="surface-card project-files-panel-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">File Tracker</span>
                  <h3>Recent file records</h3>
                  <p>Find files quickly, focus on one category, and see which records still need action.</p>
                </div>
                <span className="ui-badge is-warning"><i className="fas fa-layer-group" aria-hidden="true" /> {totalCount} visible</span>
              </div>

              <div className="project-files-tracker-insights">
                <article className="project-files-tracker-insight">
                  <span>Latest activity</span>
                  <strong>{latestFile ? latestFile.fileName : 'No uploads yet'}</strong>
                  <p>{latestFile ? `${getProjectFileVersionLabel(latestFile)} uploaded ${formatProjectFileDateTime(latestFile.uploadedAt)}` : 'Start by adding your first working file.'}</p>
                </article>
                <article className="project-files-tracker-insight">
                  <span>Needs attention</span>
                  <strong>{revisionCount ? `${revisionCount} file${revisionCount === 1 ? '' : 's'} need revision` : 'No revision requests'}</strong>
                  <p>{revisionCount ? 'Review adviser comments and upload an updated version with clear notes.' : 'Current records are either pending review or already approved.'}</p>
                </article>
                <article className="project-files-tracker-insight">
                  <span>Repository readiness</span>
                  <strong>{latestApprovedFile ? latestApprovedFile.fileName : 'No approved copy yet'}</strong>
                  <p>{latestApprovedFile ? `Latest approved by ${latestApprovedFile.reviewedBy || adviserName} on ${formatProjectFileDateTime(latestApprovedFile.reviewedAt || latestApprovedFile.uploadedAt)}.` : 'Approved files will move into the repository section once verified.'}</p>
                </article>
              </div>

              <div className="project-files-filter-shell">
                <div className="project-files-filter-pills" aria-label="Quick category filters">
                  {quickFilterOptions.map((option) => {
                    const isActive = option.key === categoryFilter;
                    const count = quickFilterCounts[option.key] || 0;

                    return (
                      <button
                        key={option.key}
                        aria-pressed={isActive}
                        className={`project-files-filter-pill ${isActive ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => setCategoryFilter(option.key)}
                      >
                        <span>{option.label}</span>
                        <strong>{count}</strong>
                      </button>
                    );
                  })}
                </div>

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
                  <h3>Submit a new file</h3>
                  <p>Complete each step so your adviser can quickly understand the file, its version, and what changed.</p>
                </div>
                <span className="ui-badge is-info"><i className="fas fa-file-code" aria-hidden="true" /> Next {nextVersionLabel}</span>
              </div>

              <form className="portal-form project-files-upload-form" onSubmit={handleUploadSubmit}>
                <div className="project-files-upload-workflow">
                  <section className="project-files-step-card">
                    <div className="project-files-step-head">
                      <span className="project-files-step-number">Step 1</span>
                      <div>
                        <strong>Upload file</strong>
                        <small>Select a document or drag it into the drop area.</small>
                      </div>
                    </div>

                    <div
                      className={`dropzone project-files-dropzone ${isDragOver ? 'is-dragover' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <i className={`fas ${uploadDraft.file ? getProjectFileTypeIcon(uploadDraft.file.name, uploadDraft.file.type) : 'fa-cloud-arrow-up'}`} aria-hidden="true" />
                      <strong>{uploadDraft.file ? uploadDraft.file.name : 'Drop a project file here'}</strong>
                      <span>{uploadDraft.file ? 'The selected file is ready for metadata tagging and version tracking.' : 'Supports proposal files, chapters, system packages, presentations, certificates, and supporting evidence.'}</span>
                      <small>{uploadDraft.file ? `${formatFileSizeLabel(uploadDraft.file.size)} | ${uploadDraft.file.type || 'Unknown file type'}` : 'Drag and drop or browse from your device without leaving this page.'}</small>

                      <div className="row-actions">
                        <button className="table-btn" type="button" onClick={handleBrowseFile}>
                          <i className="fas fa-folder-open" aria-hidden="true" /> Browse File
                        </button>
                        {uploadDraft.file ? (
                          <button className="table-btn is-danger" type="button" onClick={clearSelectedFile}>
                            <i className="fas fa-trash-can" aria-hidden="true" /> Remove
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      className="project-files-hidden-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileInputChange}
                    />
                  </section>

                  <section className="project-files-step-card">
                    <div className="project-files-step-head">
                      <span className="project-files-step-number">Step 2</span>
                      <div>
                        <strong>Choose category</strong>
                        <small>Choose the document type so the submission stays easy to find later.</small>
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="project-file-category">Category</label>
                      <select
                        id="project-file-category"
                        value={uploadDraft.category}
                        onChange={(event) => updateUploadDraft('category', event.target.value)}
                        disabled={isUploading}
                      >
                        {PROJECT_FILE_CATEGORY_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </section>

                  <section className="project-files-step-card">
                    <div className="project-files-step-head">
                      <span className="project-files-step-number">Step 3</span>
                      <div>
                        <strong>Add details</strong>
                        <small>Summarize what changed so reviewers can focus on the right update.</small>
                      </div>
                    </div>

                    <div className="form-grid project-files-upload-grid">
                      <div className="form-field">
                        <label htmlFor="project-file-tag">Tag</label>
                        <select
                          id="project-file-tag"
                          value={uploadDraft.tag}
                          onChange={(event) => updateUploadDraft('tag', event.target.value as ProjectFileUploadState['tag'])}
                          disabled={isUploading}
                        >
                          {PROJECT_FILE_TAG_OPTIONS.map((tag) => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field full">
                        <label htmlFor="project-file-version-notes">Version Notes</label>
                        <textarea
                          id="project-file-version-notes"
                          value={uploadDraft.versionNotes}
                          onChange={(event) => updateUploadDraft('versionNotes', event.target.value)}
                          placeholder="Summarize what changed in this version, why it was uploaded, or what the adviser should review."
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="project-files-step-card project-files-submit-card">
                    <div className="project-files-step-head">
                      <span className="project-files-step-number">Step 4</span>
                      <div>
                        <strong>Submit to tracker</strong>
                        <small>Confirm the version label and submit the file for review.</small>
                      </div>
                    </div>

                    <div className="project-files-upload-preview">
                      <div className="project-files-upload-preview-head">
                        <div>
                          <strong>Upload summary</strong>
                          <small>Version will be automatically generated.</small>
                        </div>
                        <span className="project-files-version-badge">{nextVersionLabel}</span>
                      </div>

                      <div className="project-files-upload-preview-grid">
                        <div>
                          <span>Selected File</span>
                          <strong>{uploadDraft.file?.name || 'No file selected yet'}</strong>
                          <small>{uploadDraft.file ? formatFileSizeLabel(uploadDraft.file.size) : 'Choose a file to preview its metadata.'}</small>
                        </div>
                        <div>
                          <span>Category</span>
                          <strong>{getProjectFileCategoryLabel(uploadDraft.category)}</strong>
                          <small>Saved under the right file type for easier review later.</small>
                        </div>
                        <div>
                          <span>Submission Tag</span>
                          <strong>{uploadDraft.tag}</strong>
                          <small>Status will start as Pending Review after upload.</small>
                        </div>
                      </div>
                    </div>

                    {uploadError ? (
                      <div className="project-files-state is-danger">
                        <i className="fas fa-circle-exclamation" aria-hidden="true" />
                        <span>{uploadError}</span>
                      </div>
                    ) : null}

                    {isUploading ? (
                      <div className="project-files-state">
                        <span className="project-files-spinner" aria-hidden="true" />
                        <span>Uploading...</span>
                      </div>
                    ) : null}

                    <div className="row-actions project-files-upload-actions">
                      <button className="btn btn-secondary" type="button" onClick={resetUploadDraft} disabled={isUploading}>
                        <i className="fas fa-rotate-left" aria-hidden="true" /> Reset Form
                      </button>
                      <button className="btn btn-primary project-files-upload-button" type="submit" disabled={isUploading}>
                        <i className="fas fa-file-arrow-up" aria-hidden="true" /> Submit File
                      </button>
                    </div>
                  </section>
                </div>

                <div className="project-files-role-panel">
                  <article className="project-files-role-card">
                    <strong>Student</strong>
                    <p>Submit files, review version history, and replace working copies before approval.</p>
                  </article>
                  <article className="project-files-role-card">
                    <strong>Adviser</strong>
                    <p>Check updates, request revisions, and approve final copies for the repository.</p>
                  </article>
                  <article className="project-files-role-card">
                    <strong>Admin</strong>
                    <p>Keep approved records available for long-term storage and final archive needs.</p>
                  </article>
                </div>
              </form>
            </article>
          </section>

          <section ref={repositorySectionRef} className="surface-card project-files-panel-card project-files-repository-section">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Approved Repository</span>
                <h3>Approved repository copies</h3>
                <p>Keep final, verified documents ready for download, reference, and final archive handoff.</p>
              </div>
              <span className="ui-badge is-success"><i className="fas fa-lock" aria-hidden="true" /> {repositoryFiles.length} Approved</span>
            </div>

            {repositoryFiles.length ? (
              <div className="project-files-repository-grid">
                {repositoryFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                    onView={handleViewFile}
                    onDownload={handleDownloadFile}
                    onDelete={handleDeleteFile}
                    onApprove={handleApproveFile}
                    onViewHistory={handleViewHistory}
                    variant="repository"
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state project-files-empty-state">
                <span className="empty-state-icon"><i className="fas fa-lock" aria-hidden="true" /></span>
                <strong>No approved repository copies yet</strong>
                <p>Approved files will appear here after adviser confirmation marks them as official final copies.</p>
              </div>
            )}
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
