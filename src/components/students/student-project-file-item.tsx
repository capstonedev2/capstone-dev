import { memo } from 'react';
import type { PortalRole, ProjectFileRecord, ProjectFileStatus } from '@/components/students/student-project-files.shared';
import {
  formatProjectFileDate,
  formatProjectFileAdviserStatus,
  getProjectFileCategoryLabel,
  getProjectFileTone,
  getProjectFileTypeIcon,
  getProjectFileVersionLabel,
  isProjectFileApproveAllowed,
  isProjectFileDeleteAllowed
} from '@/components/students/student-project-files.shared';

type FileItemProps = {
  file: ProjectFileRecord;
  currentUserRole: PortalRole;
  currentUserId: string;
  onView: (file: ProjectFileRecord) => void;
  onDownload: (file: ProjectFileRecord) => void;
  onDelete: (file: ProjectFileRecord) => void;
  onApprove: (file: ProjectFileRecord) => void;
  onViewHistory: (file: ProjectFileRecord) => void;
  variant?: 'row' | 'repository';
};

const FILE_PROGRESS_STEPS = [
  { key: 'uploaded', label: 'Uploaded', icon: 'fa-cloud-arrow-up' },
  { key: 'under_review', label: 'Under Adviser Review', icon: 'fa-magnifying-glass' },
  { key: 'decision', label: 'Decision', icon: 'fa-clipboard-check' },
  { key: 'approved', label: 'Approved by Adviser', icon: 'fa-circle-check' }
] as const;

function getFileProgressIndex(status: ProjectFileStatus): number {
  switch (status) {
    case 'approved': return 3;
    case 'revision': return 2;
    case 'under_review': return 1;
    case 'pending':
    default: return 0;
  }
}

function getFileProgressLabel(status: ProjectFileStatus, stepIndex: number): string {
  if (stepIndex === 2) {
    if (status === 'revision') return 'Needs Revision';
    if (status === 'approved') return 'Passed';
    return 'Decision';
  }
  return FILE_PROGRESS_STEPS[stepIndex]?.label || '';
}

function getFileProgressIcon(status: ProjectFileStatus, stepIndex: number): string {
  if (stepIndex === 2) {
    if (status === 'revision') return 'fa-rotate-left';
    if (status === 'approved') return 'fa-clipboard-check';
    return 'fa-clipboard-check';
  }
  return FILE_PROGRESS_STEPS[stepIndex]?.icon || 'fa-circle';
}

function MiniFileProgress({ status }: { status: ProjectFileStatus }) {
  const currentIndex = getFileProgressIndex(status);
  const isRevision = status === 'revision';

  return (
    <div className="flex items-center gap-0.5 w-full min-w-[180px]">
      {FILE_PROGRESS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isRevisionNode = isCurrent && isRevision && index === 2;
        const label = getFileProgressLabel(status, index);
        const icon = getFileProgressIcon(status, index);

        let dotColor = 'bg-slate-200 text-[var(--text-meta)] border-[var(--border)]';
        if (isCompleted) {
          if (isRevisionNode) {
            dotColor = 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200/50';
          } else if (status === 'under_review' && isCurrent) {
            dotColor = 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200/50';
          } else if (isCurrent) {
            dotColor = 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200/50';
          } else {
            dotColor = 'bg-blue-600 text-white border-blue-600';
          }
        }

        const lineColor = index < currentIndex ? (status === 'under_review' ? 'bg-orange-500' : 'bg-blue-500') : 'bg-slate-200';

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="relative group/step flex flex-col items-center">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${dotColor}`}>
                <i className={`fas ${icon} text-[8px] ${isCurrent ? 'animate-pulse' : ''}`} aria-hidden="true" />
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover/step:flex flex-col items-center z-30 pointer-events-none">
                <div className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-lg ${isRevisionNode ? 'bg-amber-600 text-white' : isCompleted ? 'bg-slate-800 text-white' : 'bg-slate-600 text-white'}`}>
                  {label}
                  {isCurrent && <span className="ml-1 opacity-75">•  Current</span>}
                </div>
                <div className={`w-2 h-2 rotate-45 -mt-1 ${isRevisionNode ? 'bg-amber-600' : isCompleted ? 'bg-slate-800' : 'bg-slate-600'}`} />
              </div>
            </div>
            {index < FILE_PROGRESS_STEPS.length - 1 && (
              <div className={`h-[2px] flex-1 min-w-[8px] rounded-full transition-all duration-500 ${lineColor}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const FileItem = memo(function FileItem({
  file,
  currentUserRole,
  currentUserId,
  onView,
  onDownload,
  onDelete,
  onApprove,
  onViewHistory,
  variant = 'row'
}: FileItemProps) {
  const categoryLabel = getProjectFileCategoryLabel(file.category);
  const statusTone = getProjectFileTone(file.status);
  const showDelete = isProjectFileDeleteAllowed(file, currentUserRole, currentUserId);
  const showApprove = isProjectFileApproveAllowed(file, currentUserRole);
  const versionLabel = getProjectFileVersionLabel(file);

  if (variant === 'repository') {
    return (
      <article className="project-files-repository-item">
        <div className="project-files-repository-head">
          <span className="project-files-repository-lock">
            <i className="fas fa-lock" aria-hidden="true" />
          </span>
          <div className="project-files-repository-copy">
            <strong>{file.fileName}</strong>
            <p className="project-files-repository-subcopy">
              <span>{categoryLabel}</span>
              <span>{file.sizeLabel}</span>
            </p>
          </div>
          <div className="chip-row project-files-repository-badges">
            <span className="ui-badge is-success">
              <i className="fas fa-circle-check" aria-hidden="true" /> Final Approved Version
            </span>
            <span className="project-files-version-badge">{versionLabel}</span>
          </div>
        </div>

        <div className="project-files-repository-meta">
          <span><i className="fas fa-user" aria-hidden="true" /> {file.uploadedBy}</span>
          <span><i className="fas fa-calendar-days" aria-hidden="true" /> Verified {formatProjectFileDate(file.reviewedAt || file.uploadedAt)}</span>
          {file.reviewedBy ? <span><i className="fas fa-user-check" aria-hidden="true" /> {file.reviewedBy}</span> : null}
        </div>

        <p className="project-files-repository-note">{file.versionNotes}</p>

        <div className="project-files-repository-actions">
          <button className="table-btn" type="button" onClick={() => onView(file)}>
            <i className="fas fa-eye" aria-hidden="true" /> View
          </button>
          <button className="table-btn" type="button" onClick={() => onViewHistory(file)}>
            <i className="fas fa-clock-rotate-left" aria-hidden="true" /> View History
          </button>
          <button className="table-btn" type="button" onClick={() => onDownload(file)}>
            <i className="fas fa-download" aria-hidden="true" /> Download
          </button>
        </div>
      </article>
    );
  }

  return (
    <tr className="project-files-table-row">
      <td>
        <div className="table-title-cell">
          <span className="table-file-icon">
            <i className={`fas ${getProjectFileTypeIcon(file.fileName, file.fileType)}`} aria-hidden="true" />
          </span>
          <div className="project-files-row-title">
            <strong>{file.fileName}</strong>
            {file.status === 'rejected' && file.rejectionReason ? (
              <p className="mt-1 text-xs font-bold text-red-600">
                <i className="fas fa-ban mr-1" aria-hidden="true" />
                {file.rejectionReason}
              </p>
            ) : file.reviewComments?.length ? (
              <small className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
                <i className="fas fa-comment-dots" aria-hidden="true" />
                {file.reviewComments.length} adviser comment{file.reviewComments.length === 1 ? '' : 's'}
              </small>
            ) : null}
          </div>
        </div>
      </td>
      <td>
        <span className="project-files-cell-label">{categoryLabel}</span>
      </td>
      <td>
        <span className="project-files-version-badge">{versionLabel}</span>
      </td>
      <td>
        <MiniFileProgress status={file.status} />
      </td>
      <td>
        <span className={`ui-badge is-${statusTone}`}>{formatProjectFileAdviserStatus(file.status)}</span>
      </td>
      <td>
        <div className="project-files-user-cell">
          <strong>{file.uploadedBy}</strong>
        </div>
      </td>
      <td>
        <div className="project-files-date-cell">
          <strong>{formatProjectFileDate(file.uploadedAt)}</strong>
          <small>{new Date(file.uploadedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
      </td>
      <td className="align-right">
        <div className="row-actions project-files-row-actions">
          <button className="table-btn project-files-icon-action" type="button" onClick={() => onView(file)} aria-label={`View ${file.fileName}`} title="View">
            <i className="fas fa-eye" aria-hidden="true" />
          </button>
          <button className="table-btn project-files-icon-action" type="button" onClick={() => onDownload(file)} aria-label={`Download ${file.fileName}`} title="Download">
            <i className="fas fa-download" aria-hidden="true" />
          </button>
          <button className="table-btn project-files-icon-action" type="button" onClick={() => onViewHistory(file)} aria-label={`View history for ${file.fileName}`} title="History">
            <i className="fas fa-clock-rotate-left" aria-hidden="true" />
          </button>
          {showApprove ? (
            <button className="table-btn project-files-icon-action" type="button" onClick={() => onApprove(file)} aria-label={`Approve ${file.fileName}`} title="Approve">
              <i className="fas fa-circle-check" aria-hidden="true" />
            </button>
          ) : null}
          {showDelete ? (
            <button className="table-btn project-files-icon-action is-danger" type="button" onClick={() => onDelete(file)} aria-label={`Delete ${file.fileName}`} title="Delete">
              <i className="fas fa-trash-can" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
});
