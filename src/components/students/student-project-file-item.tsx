import type { PortalRole, ProjectFileRecord } from '@/components/students/student-project-files.shared';
import {
  formatProjectFileDate,
  formatProjectFileAdviserStatus,
  formatProjectFileStatus,
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

export function FileItem({
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
        <span className={`ui-badge is-${statusTone}`}>{formatProjectFileStatus(file.status)}</span>
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
}
