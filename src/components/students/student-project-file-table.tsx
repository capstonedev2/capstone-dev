import { FileItem } from '@/components/students/student-project-file-item';
import type { PortalRole, ProjectFileRecord, ProjectFileSortOption } from '@/components/students/student-project-files.shared';
import {
  PROJECT_FILE_FILTER_OPTIONS,
  PROJECT_FILE_PAGE_SIZE_OPTIONS,
  PROJECT_FILE_SORT_OPTIONS
} from '@/components/students/student-project-files.shared';

type FileTableProps = {
  files: ProjectFileRecord[];
  totalCount: number;
  currentUserRole: PortalRole;
  currentUserId: string;
  categoryFilter: string;
  searchTerm: string;
  sortBy: ProjectFileSortOption;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  errorMessage: string | null;
  onCategoryFilterChange: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onSortByChange: (value: ProjectFileSortOption) => void;
  onPageSizeChange: (value: number) => void;
  onPageChange: (value: number) => void;
  onView: (file: ProjectFileRecord) => void;
  onDownload: (file: ProjectFileRecord) => void;
  onDelete: (file: ProjectFileRecord) => void;
  onApprove: (file: ProjectFileRecord) => void;
  onViewHistory: (file: ProjectFileRecord) => void;
  onOpenUpload: () => void;
};

export function FileTable({
  files,
  totalCount,
  currentUserRole,
  currentUserId,
  categoryFilter,
  searchTerm,
  sortBy,
  pageSize,
  currentPage,
  totalPages,
  isLoading,
  errorMessage,
  onCategoryFilterChange,
  onSearchTermChange,
  onSortByChange,
  onPageSizeChange,
  onPageChange,
  onView,
  onDownload,
  onDelete,
  onApprove,
  onViewHistory,
  onOpenUpload
}: FileTableProps) {
  const itemStart = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const itemEnd = totalCount ? Math.min(currentPage * pageSize, totalCount) : 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const activeFilterLabel = PROJECT_FILE_FILTER_OPTIONS.find((option) => option.key === categoryFilter)?.label || 'Filter';

  return (
    <div className="project-files-table-block">
      <div className="toolbar-grid project-files-toolbar">
        <div className="form-field project-files-search-field">
          <div className="project-files-search-control">
            <i className="fas fa-magnifying-glass" aria-hidden="true" />
            <input
              id="project-files-search"
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search files..."
            />
          </div>
        </div>

        <div className="form-field project-files-filter-control">
          <label htmlFor="project-files-filter">Filter</label>
          <i className="fas fa-filter" aria-hidden="true" />
          <select
            id="project-files-filter"
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            aria-label="Filter project files"
          >
            {PROJECT_FILE_FILTER_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <span>{categoryFilter === 'all' ? 'Filter' : activeFilterLabel}</span>
        </div>

        <div className="form-field project-files-hidden-filter">
          <label htmlFor="project-files-sort">Sort By</label>
          <select
            id="project-files-sort"
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as ProjectFileSortOption)}
          >
            {PROJECT_FILE_SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="form-field project-files-hidden-filter">
          <label htmlFor="project-files-page-size">Rows Per Page</label>
          <select
            id="project-files-page-size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PROJECT_FILE_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} rows</option>
            ))}
          </select>
        </div>
      </div>

      <div className="project-files-table-summary">
        <div>
          <strong>{totalCount}</strong>
          <span>Tracked file record{totalCount === 1 ? '' : 's'}</span>
        </div>
        <small>{totalCount ? 'Use search, filters, and page controls to focus on the records that need attention.' : 'Real uploaded documents will appear here after they are saved to private storage.'}</small>
      </div>

      {errorMessage ? (
        <div className="project-files-state is-danger">
          <i className="fas fa-circle-exclamation" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="project-files-skeleton-table" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="project-files-skeleton-row">
              <div className="project-files-skeleton-block is-title" />
              <div className="project-files-skeleton-block" />
              <div className="project-files-skeleton-block" />
              <div className="project-files-skeleton-block" />
            </div>
          ))}
        </div>
      ) : files.length ? (
        <>
          <div className="table-shell project-files-table-shell">
            <table className="data-table project-files-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Adviser Status</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                    onView={onView}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onApprove={onApprove}
                    onViewHistory={onViewHistory}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="project-files-pagination">
            <div className="project-files-pagination-copy">
              <span>Showing {itemStart} to {itemEnd} of {totalCount} file{totalCount === 1 ? '' : 's'}</span>
            </div>

            <div className="project-files-pagination-controls">
              <button className="table-btn" type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </button>

              <div className="project-files-page-number-list" aria-label="Pagination">
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`project-files-page-number ${pageNumber === currentPage ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button className="table-btn" type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state project-files-empty-state">
          <span className="empty-state-icon"><i className="fas fa-file-shield" aria-hidden="true" /></span>
          <strong>No private project files yet</strong>
          <p>Upload your first thesis or capstone document to begin secure tracking, adviser review, and version history.</p>
          <button className="btn btn-primary project-files-empty-action" type="button" onClick={onOpenUpload}>
            <i className="fas fa-file-arrow-up" aria-hidden="true" /> Upload Document
          </button>
        </div>
      )}
    </div>
  );
}
