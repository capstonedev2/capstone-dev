export type PortalRole = 'student' | 'adviser' | 'admin';

export type ProjectFileStatus = 'approved' | 'pending' | 'revision';

export type ProjectFileTag = 'Draft' | 'Final' | 'Revision';

export type ProjectFileSortOption = 'newest' | 'oldest' | 'status';

export type ProjectFileCategoryOption = {
  key: string;
  label: string;
};

export type ProjectFileHistoryEntry = {
  id: string;
  versionMajor: number;
  versionMinor: number;
  status: ProjectFileStatus;
  uploadedBy: string;
  uploadedAt: string;
  versionNotes: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type ProjectFileRecord = {
  id: string;
  projectId: string;
  category: string;
  fileName: string;
  fileUrl: string;
  versionMajor: number;
  versionMinor: number;
  status: ProjectFileStatus;
  tag: ProjectFileTag;
  versionNotes: string;
  uploadedBy: string;
  uploadedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isFinal: boolean;
  isRepositoryCopy: boolean;
  fileType: string;
  sizeLabel: string;
  uploadedById?: string;
  history: ProjectFileHistoryEntry[];
};

export type ProjectFileUploadState = {
  file: File | null;
  category: string;
  versionNotes: string;
  status: ProjectFileStatus;
  uploadedBy: string;
  uploadedAt: string;
  tag: ProjectFileTag;
};

export const PROJECT_FILE_CATEGORY_OPTIONS: ProjectFileCategoryOption[] = [
  { key: 'proposal', label: 'Proposal' },
  { key: 'chapter-1', label: 'Chapter 1' },
  { key: 'chapter-2', label: 'Chapter 2' },
  { key: 'chapter-3', label: 'Chapter 3' },
  { key: 'chapter-4', label: 'Chapter 4' },
  { key: 'chapter-5', label: 'Chapter 5' },
  { key: 'system-files', label: 'System Files' },
  { key: 'presentation-files', label: 'Presentation' },
  { key: 'supporting-documents', label: 'Supporting Docs' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'final-manuscript', label: 'Final Manuscript' },
  { key: 'photos', label: 'Photos' }
];

export const PROJECT_FILE_FILTER_OPTIONS = [
  { key: 'all', label: 'All Project Files' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'chapters', label: 'Chapter 1-5' },
  { key: 'system-files', label: 'System Files' },
  { key: 'presentation-files', label: 'Presentation' },
  { key: 'supporting-documents', label: 'Supporting Docs' },
  { key: 'certificates', label: 'Certificates' }
];

export const PROJECT_FILE_SORT_OPTIONS: Array<{ key: ProjectFileSortOption; label: string }> = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'status', label: 'Status Priority' }
];

export const PROJECT_FILE_TAG_OPTIONS: ProjectFileTag[] = ['Draft', 'Revision', 'Final'];

export const PROJECT_FILE_PAGE_SIZE_OPTIONS = [5, 10, 20];

export function normalizeProjectFileStatus(value: string): ProjectFileStatus {
  const normalized = value.toLowerCase();

  if (normalized.includes('approved') || normalized.includes('official')) {
    return 'approved';
  }

  if (normalized.includes('revision')) {
    return 'revision';
  }

  return 'pending';
}

export function formatProjectFileStatus(status: ProjectFileStatus) {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'revision':
      return 'Needs Revision';
    default:
      return 'Pending Review';
  }
}

export function getProjectFileTone(status: ProjectFileStatus): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'revision':
      return 'danger';
    default:
      return 'warning';
  }
}

export function getProjectFileTagFromStatus(status: ProjectFileStatus): ProjectFileTag {
  switch (status) {
    case 'approved':
      return 'Final';
    case 'revision':
      return 'Revision';
    default:
      return 'Draft';
  }
}

export function getProjectFileCategoryLabel(category: string) {
  return PROJECT_FILE_CATEGORY_OPTIONS.find((item) => item.key === category)?.label
    || category
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
}

export function matchesProjectFileFilter(file: ProjectFileRecord, filter: string) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'chapters') {
    return file.category.startsWith('chapter-');
  }

  return file.category === filter;
}

export function compareProjectFileVersions(
  left: Pick<ProjectFileRecord, 'versionMajor' | 'versionMinor'>,
  right: Pick<ProjectFileRecord, 'versionMajor' | 'versionMinor'>
) {
  if (left.versionMajor !== right.versionMajor) {
    return left.versionMajor - right.versionMajor;
  }

  return left.versionMinor - right.versionMinor;
}

export function sortProjectFiles(files: ProjectFileRecord[], sortBy: ProjectFileSortOption) {
  const statusOrder: Record<ProjectFileStatus, number> = {
    revision: 0,
    pending: 1,
    approved: 2
  };

  return [...files].sort((left, right) => {
    if (sortBy === 'status') {
      const toneDelta = statusOrder[left.status] - statusOrder[right.status];
      if (toneDelta !== 0) {
        return toneDelta;
      }
    }

    const leftDate = new Date(left.uploadedAt).getTime();
    const rightDate = new Date(right.uploadedAt).getTime();

    if (sortBy === 'oldest') {
      return leftDate - rightDate;
    }

    return rightDate - leftDate;
  });
}

export function formatProjectFileDate(value?: string) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatProjectFileDateTime(value?: string) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatFileSizeLabel(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getProjectFileTypeIcon(fileName: string, fileType?: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || fileType?.toLowerCase() || '';

  if (extension.includes('pdf')) return 'fa-file-pdf';
  if (extension.includes('ppt')) return 'fa-file-powerpoint';
  if (extension.includes('doc')) return 'fa-file-word';
  if (extension.includes('zip') || extension.includes('rar')) return 'fa-file-zipper';
  if (extension.includes('png') || extension.includes('jpg') || extension.includes('jpeg') || extension.includes('webp')) return 'fa-file-image';
  return 'fa-file-lines';
}

export function formatProjectFileVersionLabel(versionMajor: number, versionMinor: number) {
  return `v${versionMajor}.${versionMinor}`;
}

export function getProjectFileVersionLabel(file: Pick<ProjectFileRecord, 'versionMajor' | 'versionMinor'>) {
  return formatProjectFileVersionLabel(file.versionMajor, file.versionMinor);
}

export function isProjectFileDeleteAllowed(file: ProjectFileRecord, role: PortalRole, currentUserId: string) {
  if (file.status === 'approved' || file.isRepositoryCopy) {
    return false;
  }

  if (role === 'admin') {
    return true;
  }

  if (role === 'adviser') {
    return false;
  }

  return file.uploadedById === currentUserId;
}

export function isProjectFileApproveAllowed(file: ProjectFileRecord, role: PortalRole) {
  return role === 'adviser' && file.status !== 'approved';
}

export function getNextProjectFileVersionParts(files: ProjectFileRecord[], category: string) {
  const categoryFiles = files.filter((item) => item.category === category);

  if (!categoryFiles.length) {
    return { versionMajor: 1, versionMinor: 0 };
  }

  const latestVersion = [...categoryFiles].sort((left, right) => compareProjectFileVersions(right, left))[0];

  return {
    versionMajor: latestVersion.versionMajor,
    versionMinor: latestVersion.versionMinor + 1
  };
}

export function getNextProjectFileVersion(files: ProjectFileRecord[], category: string) {
  const nextVersion = getNextProjectFileVersionParts(files, category);
  return formatProjectFileVersionLabel(nextVersion.versionMajor, nextVersion.versionMinor);
}
