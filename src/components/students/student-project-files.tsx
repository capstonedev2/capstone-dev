'use client';

import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { StudentDashboardData } from '@/lib/mock/student-dashboard';
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
  formatProjectFileAdviserStatus,
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

export function StudentProjectFiles({ data }: { data: StudentDashboardData }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSectionRef = useRef<HTMLElement | null>(null);
  const trackerSectionRef = useRef<HTMLElement | null>(null);
  const repositorySectionRef = useRef<HTMLElement | null>(null);
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

  const hasApprovedTitle = useMemo(() => {
    const isMainApproved = data.titleRegistration.registrationStatus.toLowerCase() === 'approved';
    const hasSubmissionApproved = (data.titleRegistration.submissions || []).some(
      (sub) => sub.registrationStatus.toLowerCase() === 'approved'
    );
    return isMainApproved || hasSubmissionApproved;
  }, [data.titleRegistration]);

  useEffect(() => {
    if (isGroupLeader) return; // Leaders always have permission, no need to poll

    const pollPersonalPermission = async () => {
      try {
        if (!currentUserId) return;
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUserId)}`, { cache: 'no-store' });
        if (res.ok) {
          const notifs = await res.json();
          // Check if there are any 'Upload Permission Granted' notifications that are UNREAD
          const permissionNotifs = notifs.filter(
            (n: any) => n.status === 'UNREAD' && n.title === 'Upload Permission Granted' && n.entityType === 'permission' && n.entityId === data.group.id
          );
          
          if (permissionNotifs.length > 0) {
            if (!isUploadAllowed) {
              setToast({ tone: 'success', message: 'Upload permission granted! You can now submit 1 file.' });
              setIsUploadAllowed(true);
            }
            setPermissionNotificationId(permissionNotifs.map((n: any) => n.id).join(','));
          } else {
            setIsUploadAllowed(false);
            setPermissionNotificationId(null);
          }
        }
      } catch (e) {
        console.error('Failed to poll personal permissions', e);
      }
    };

    // Initial check
    pollPersonalPermission();
    // Poll every 5 seconds
    const intervalId = setInterval(pollPersonalPermission, 5000);
    return () => clearInterval(intervalId);
  }, [currentUserId, data.group.id, isGroupLeader, isUploadAllowed]);

  const handleRequestPermission = async () => {
    console.log('[REQUEST PERM] Members:', JSON.stringify(data.group.members, null, 2));
    const leader = data.group.members.find((m) => m.isLeader);
    console.log('[REQUEST PERM] Found leader:', leader);
    if (!leader?.user_id) {
      setToast({ tone: 'danger', message: 'Could not identify the group leader.' });
      return;
    }
    console.log('[REQUEST PERM] Sending notification to leader user_id:', leader.user_id);

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
    const timer = window.setTimeout(() => setIsLoadingFiles(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStoredDocuments = async () => {
      try {
        const response = await fetch(`/api/document-files?bucketName=${DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
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
          versionNotes: `Secure private document stored in ${file.bucketName}.`,
          uploadedBy: file.uploadedByName || (file.uploadedBy === currentUserId ? data.profile.fullName : 'Project Member'),
          uploadedAt: file.createdAt,
          reviewedAt: file.reviewedAt || undefined,
          reviewedBy: file.reviewedAt ? adviserName : undefined,
          latestReviewComment: file.latestReviewComment || null,
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
              versionNotes: file.submissionStatus === 'UNDER_REVIEW'
                ? 'Accepted by adviser and still under review.'
                : file.submissionStatus === 'APPROVED'
                  ? 'Approved by adviser.'
                  : file.submissionStatus === 'NEEDS_REVISION'
                    ? 'Revision requested by adviser.'
                    : `Secure private document stored in ${file.bucketName}.`,
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
        }
      } catch {
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

  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        latestReviewComment: uploadedFile.latestReviewComment || null,
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
          const tokenIds = permissionNotificationId.split(',');
          await Promise.all(tokenIds.map(id => 
            fetch('/api/notifications', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notificationId: id, action: 'consume' })
            })
          ));
          setIsUploadAllowed(false);
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

  const handleViewFile = async (file: ProjectFileRecord) => {
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

    window.open(`/api/document-files/${file.id}/download`, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteFile = async (file: ProjectFileRecord) => {
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
  const latestReviewStatus = latestFile ? formatProjectFileAdviserStatus(latestFile.status) : 'Pending Review';
  const latestReviewTone = latestFile ? getProjectFileTone(latestFile.status) : 'warning';
  const latestReviewHelper = latestFile?.status === 'approved'
    ? 'Approved by adviser'
    : latestFile?.status === 'under_review'
      ? 'Accepted by adviser and still reviewing'
    : latestFile?.status === 'revision'
      ? 'Revision requested by adviser'
      : 'Waiting for adviser to review';
  const toastIcon = toast?.tone === 'success'
    ? 'fa-circle-check'
    : toast?.tone === 'danger'
      ? 'fa-circle-exclamation'
      : 'fa-circle-info';

  if (!data.group?.id) {
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

        <div className="page-body project-files-page-body p-6">
          <div className="mx-auto mt-12 max-w-2xl rounded-[1.25rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 shadow-sm">
              <i className="fas fa-users-slash text-3xl" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-800">Group Assignment Required</h3>
            <p className="mx-auto mt-4 max-w-lg text-slate-500 leading-relaxed">
              You must be assigned to a project group before you can access the project files repository and begin uploading chapters or documents. Please contact your coordinator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasApprovedTitle) {
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

        <div className="page-body project-files-page-body p-6">
          <div className="mx-auto mt-12 max-w-2xl rounded-[1.25rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 shadow-sm">
              <i className="fas fa-file-signature text-3xl" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-800">Title Approval Required</h3>
            <p className="mx-auto mt-4 max-w-lg text-slate-500 leading-relaxed">
              You must get your project title officially approved by your adviser in the Title Submission workspace before you can access the project files repository and begin uploading chapters or documents.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <button className="btn btn-primary project-files-upload-button" type="button" onClick={openUploadSection}>
              <i className="fas fa-cloud-arrow-up" aria-hidden="true" /> Upload New Version
            </button>
            <button className="btn btn-secondary" type="button" onClick={openRepositorySection}>
              <i className="fas fa-box-archive" aria-hidden="true" /> Open Repository
            </button>
          </div>
        </header>

        <div className="page-body project-files-page-body">
          <section className="dashboard-hero project-files-hero">
            <article className="dashboard-hero-main project-files-hero-main">
              <div className="dashboard-callout-grid project-files-hero-stats">
                {heroStats.map((item) => (
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

          <section className="content-grid two-thirds project-files-main-grid">
            <article ref={trackerSectionRef} className="surface-card project-files-panel-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">File Tracker</span>
                  <h3>File Tracker</h3>
                  <p>All your project documents and their versions.</p>
                </div>
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

              {!hasProjectFiles ? (
                <div className="project-files-onboarding-card">
                  <div className="project-files-onboarding-icon">
                    <i className="fas fa-file-shield" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="section-kicker">Secure Document Workflow</span>
                    <h4>No private project files yet</h4>
                    <p>
                      Your tracker is now connected to Supabase private storage. Upload a PDF, Word,
                      PowerPoint, or Excel document to create the first record visible to authorized reviewers.
                    </p>
                  </div>
                  <button className="btn btn-primary" type="button" onClick={openUploadSection}>
                    <i className="fas fa-file-arrow-up" aria-hidden="true" /> Upload Document
                  </button>
                </div>
              ) : null}

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
                  <h3>Upload New Version</h3>
                  <p>Complete each step so your adviser can quickly understand the file, its version, and what changed.</p>
                </div>
                <div className="flex items-center gap-4">
                  {isGroupLeader && data.group?.id && (
                    <div className="relative group/permissions">
                      <button type="button" className="flex items-center gap-2.5 rounded-xl border border-blue-200/60 bg-gradient-to-br from-indigo-50 to-blue-50 px-4 py-2 shadow-sm transition-all duration-300 hover:border-blue-300 hover:from-indigo-100 hover:to-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 shadow-sm border border-blue-100/50">
                          <i className="fas fa-user-lock text-blue-600 transition-transform duration-300 group-hover/permissions:scale-110" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-bold text-blue-900">Manage Permissions</span>
                        <i className="fas fa-chevron-down text-blue-500 text-[10px] ml-0.5 transition-transform duration-300 group-hover/permissions:rotate-180" aria-hidden="true" />
                      </button>

                      <div className="absolute right-0 top-full z-20 hidden w-64 flex-col pt-3 group-hover/permissions:flex animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Little triangle pointer */}
                        <div className="absolute right-6 top-1.5 h-3 w-3 rotate-45 border-l border-t border-slate-200/60 bg-white/95" />
                        
                        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 p-2 shadow-2xl shadow-blue-900/10 ring-1 ring-slate-900/5 backdrop-blur-xl">
                          <div className="px-3 pb-2 pt-1.5 border-b border-slate-100/50 mb-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grant 1-Time Upload</h4>
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
                                      : 'hover:bg-slate-50 hover:text-blue-600'
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
                                          message: 'Your leader has approved your request to upload files.',
                                          type: 'success',
                                          entityType: 'permission',
                                          entityId: data.group.id
                                        })
                                      });
                                      if (res.ok) {
                                        setRecentlyAllowed(prev => new Set(prev).add(member.user_id));
                                        setToast({ tone: 'success', message: `Upload unlocked for ${member.fullName}.` });
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
                                        : 'bg-slate-100 text-slate-600 group-hover/item:bg-blue-100 group-hover/item:text-blue-700'
                                    }`}>
                                      {isAllowed ? <i className="fas fa-check" aria-hidden="true" /> : member.fullName.charAt(0).toUpperCase()}
                                    </span>
                                    <span className={`text-sm font-semibold transition truncate ${
                                      isAllowed 
                                        ? 'text-emerald-800' 
                                        : 'text-slate-700 group-hover/item:text-blue-700'
                                    }`}>
                                      {member.fullName}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    isAllowed 
                                      ? 'text-emerald-600' 
                                      : 'text-slate-400 group-hover/item:text-blue-600'
                                  }`}>
                                    {isAllowed ? 'Allowed' : 'Allow'}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-3 text-center text-xs text-slate-500">
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
                <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50/50 p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
                    <i className="fas fa-lock text-2xl" aria-hidden="true" />
                  </div>
                  <h4 className="mt-4 text-xl font-bold tracking-tight text-amber-900">Upload Restricted</h4>
                  <p className="mx-auto mt-2 max-w-md text-sm text-amber-700">
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
              ) : (
                <form className="portal-form project-files-upload-form" onSubmit={handleUploadSubmit}>
                <div className="project-files-upload-workflow">
                  <section className="project-files-upload-drop-panel">
                    <div
                      className={`dropzone project-files-dropzone ${isDragOver ? 'is-dragover' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <i className={`fas ${uploadDraft.file ? getProjectFileTypeIcon(uploadDraft.file.name, uploadDraft.file.type) : 'fa-cloud-arrow-up'}`} aria-hidden="true" />
                      <strong>{uploadDraft.file ? uploadDraft.file.name : 'Drop a project file here'}</strong>
                      <span>{uploadDraft.file ? 'The selected file is ready for secure private storage and version tracking.' : 'Supports PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX.'}</span>
                      <small>{uploadDraft.file ? `${formatFileSizeLabel(uploadDraft.file.size)} | ${uploadDraft.file.type || 'Unknown file type'}` : 'Using thesis-documents private bucket. Limit: thesis-documents 50MB, evaluation-files 40MB, final-repository 50MB.'}</small>

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
                      accept={DOCUMENT_FILE_ACCEPT}
                      onChange={handleFileInputChange}
                    />
                  </section>

                  <section className="project-files-upload-fields">
                    <div className="form-field project-files-category-field">
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

                    <div className="form-field project-files-tag-field">
                      <label htmlFor="project-file-tag">Tag / Version</label>
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

                    <div className="form-field project-files-notes-field">
                      <label htmlFor="project-file-version-notes">Version Notes</label>
                      <textarea
                        id="project-file-version-notes"
                        value={uploadDraft.versionNotes}
                        onChange={(event) => updateUploadDraft('versionNotes', event.target.value)}
                        placeholder="Summarize what changed in this version..."
                        disabled={isUploading}
                      />
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
                        <i className="fas fa-rotate-left" aria-hidden="true" /> Reset
                      </button>
                      <button className="btn btn-primary project-files-upload-button" type="submit" disabled={isUploading}>
                        <i className="fas fa-paper-plane" aria-hidden="true" /> Submit to Adviser
                      </button>
                    </div>
                  </section>
                </div>
                </form>
              )}
            </article>

            <article className="surface-card project-files-panel-card project-files-review-status-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Adviser Review Status</span>
                  <h3>Adviser Review Status</h3>
                  <p>Track the current review status of your latest submission.</p>
                </div>
              </div>

              <div className={`project-files-review-status is-${latestReviewTone}`}>
                <span className="project-files-review-status-icon">
                  <i className={`fas ${latestFile?.status === 'approved' ? 'fa-circle-check' : latestFile?.status === 'revision' ? 'fa-rotate-left' : latestFile?.status === 'under_review' ? 'fa-magnifying-glass' : 'fa-clock'}`} aria-hidden="true" />
                </span>
                <div className="project-files-review-status-cell">
                  <span>Latest Submission</span>
                  <strong>{latestFile?.fileName || 'No submission yet'}</strong>
                  <small>{latestFile ? `${getProjectFileVersionLabel(latestFile)} | ${formatProjectFileDateTime(latestFile.uploadedAt)}` : 'Upload a document to send it to your adviser.'}</small>
                </div>
                <div className="project-files-review-status-cell">
                  <span>Status</span>
                  <strong>{latestFile ? latestReviewStatus : 'Pending Review'}</strong>
                  <small>{latestReviewHelper}</small>
                </div>
                <div className="project-files-review-status-cell">
                  <span>Assigned Adviser</span>
                  <strong>{adviserName}</strong>
                  <small>Research Adviser</small>
                </div>
                <button className="table-btn" type="button" onClick={latestFile ? () => handleViewHistory(latestFile) : openUploadSection}>
                  <i className="fas fa-circle-info" aria-hidden="true" /> View Details
                </button>
              </div>

              {latestFile?.latestReviewComment ? (
                <div className="mt-4 rounded-[1.25rem] border border-blue-100 bg-blue-50/70 p-4">
                  <span className="section-kicker">Latest Adviser Notes</span>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{latestFile.latestReviewComment.body}</p>
                  <small className="mt-3 block text-xs font-semibold text-slate-500">
                    {latestFile.latestReviewComment.authorName || adviserName} · {formatProjectFileDateTime(String(latestFile.latestReviewComment.createdAt))}
                  </small>
                </div>
              ) : null}
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
