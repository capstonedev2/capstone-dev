export const DOCUMENT_STORAGE_BUCKETS = {
  THESIS_DOCUMENTS: 'thesis-documents',
  EVALUATION_FILES: 'evaluation-files',
  FINAL_REPOSITORY: 'final-repository'
} as const;

export type DocumentStorageBucket =
  (typeof DOCUMENT_STORAGE_BUCKETS)[keyof typeof DOCUMENT_STORAGE_BUCKETS];

export const DOCUMENT_STORAGE_BUCKET_LIST = Object.values(DOCUMENT_STORAGE_BUCKETS);

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx'
] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

export const DOCUMENT_BUCKET_MAX_FILE_SIZE_BYTES: Record<DocumentStorageBucket, number> = {
  [DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS]: 50 * 1024 * 1024,
  [DOCUMENT_STORAGE_BUCKETS.EVALUATION_FILES]: 40 * 1024 * 1024,
  [DOCUMENT_STORAGE_BUCKETS.FINAL_REPOSITORY]: 50 * 1024 * 1024
};

export const DOCUMENT_UPLOAD_ERROR_MESSAGES = {
  invalidFileType: 'Invalid file type: Only PDF, DOC, DOCX, PPT, PPTX, XLS, and XLSX files are allowed.',
  emptyFile: 'The selected file is empty.',
  missingFile: 'Please attach a document file to upload.',
  invalidBucket: 'Selected document storage bucket is not supported.',
  maxFileSize: {
    [DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS]: 'File size must not exceed 50MB.',
    [DOCUMENT_STORAGE_BUCKETS.EVALUATION_FILES]: 'File size must not exceed 40MB.',
    [DOCUMENT_STORAGE_BUCKETS.FINAL_REPOSITORY]: 'File size must not exceed 50MB.'
  }
} as const;

export const DOCUMENT_FILE_ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS
  .map((extension) => `.${extension}`)
  .join(',');

export function isDocumentStorageBucket(value: string): value is DocumentStorageBucket {
  return DOCUMENT_STORAGE_BUCKET_LIST.includes(value as DocumentStorageBucket);
}

export function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.trim().toLowerCase() || '';
}

export function validateFileType(fileName: string, mimeType?: string) {
  const extension = getFileExtension(fileName);
  const hasAllowedExtension = ALLOWED_DOCUMENT_EXTENSIONS.includes(
    extension as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number]
  );
  const hasAllowedMimeType = Boolean(mimeType)
    && ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number]);

  if (!hasAllowedExtension || (mimeType && !hasAllowedMimeType)) {
    return DOCUMENT_UPLOAD_ERROR_MESSAGES.invalidFileType;
  }

  return null;
}

export function validateFileSize(size: number, bucketName: DocumentStorageBucket) {
  if (size <= 0) {
    return DOCUMENT_UPLOAD_ERROR_MESSAGES.emptyFile;
  }

  if (size > DOCUMENT_BUCKET_MAX_FILE_SIZE_BYTES[bucketName]) {
    return DOCUMENT_UPLOAD_ERROR_MESSAGES.maxFileSize[bucketName];
  }

  return null;
}
