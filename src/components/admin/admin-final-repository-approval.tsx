'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

type AdviserReviewStatus = 'APPROVED' | 'NEEDS_REVISION' | 'UNDER_REVIEW' | null;

type RepositoryApprovalRecord = {
  projectId: string;
  projectTitle: string;
  department: string | null;
  submittedBy: string | null;
  adviserName: string | null;
  adviserReviewStatus: AdviserReviewStatus;
  lastActivityAt: string;
  fileCount: number;
  totalFileSize: string;
  isPublished: boolean;
  publishedAt: string | null;
};

type QueueTab = 'ready' | 'published';

const QUEUE_TABS: Array<{ key: QueueTab; label: string; icon: string }> = [
  { key: 'ready', label: 'Ready for Approval', icon: 'fa-clock' },
  { key: 'published', label: 'Published to Repository', icon: 'fa-circle-check' }
];

const ADVISER_REVIEW_LABEL: Record<string, string> = {
  APPROVED: 'Approved',
  NEEDS_REVISION: 'Needs Revision',
  UNDER_REVIEW: 'Under Review'
};

const ADVISER_REVIEW_CLASS: Record<string, string> = {
  APPROVED: 'status-approved',
  NEEDS_REVISION: 'status-critical',
  UNDER_REVIEW: 'status-pending'
};

export function AdminFinalRepositoryApproval() {
  const [records, setRecords] = useState<RepositoryApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QueueTab>('ready');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [query, setQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RepositoryApprovalRecord | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const getApiErrorMessage = async (response: Response) => {
    try {
      const payload = await response.json();
      return payload?.message || 'Repository publication failed.';
    } catch {
      return 'Repository publication failed.';
    }
  };

  async function loadRecords() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch('/api/admin/repository-approvals');
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to load repository approval records.');
      }

      setRecords(payload.records);
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const matchesTab = activeTab === 'ready' ? !record.isPublished : record.isPublished;
        const matchesDept = departmentFilter === 'All Departments' || record.department === departmentFilter;
        const matchesQuery =
          !query ||
          record.projectTitle.toLowerCase().includes(query.toLowerCase()) ||
          (record.submittedBy || '').toLowerCase().includes(query.toLowerCase());

        return matchesTab && matchesDept && matchesQuery;
      }),
    [activeTab, departmentFilter, query, records]
  );

  const readyCount = records.filter((record) => !record.isPublished).length;
  const publishedCount = records.filter((record) => record.isPublished).length;

  const handleApprove = async (record: RepositoryApprovalRecord) => {
    setPublishingId(record.projectId);

    try {
      const response = await fetch('/api/repository/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: record.projectId })
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      setSelectedRecord(null);
      showToast(`"${record.projectTitle}" approved and moved to the Official Institutional Repository.`, 'success');
      await loadRecords();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Repository publication failed.', 'warning');
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <>
      <AdminShell
        activeNav="final-repository-approval"
        title="Final Repository Approval"
        description="Review and approve completed thesis and capstone projects before they become official repository records."
      >
        <div className="admin-page-stack">

          {/* Summary Cards */}
          <section className="fra-summary-grid">
            <article className="fra-summary-card fra-summary-pending">
              <div className="fra-summary-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="fra-summary-body">
                <span className="fra-summary-label">Ready for Approval</span>
                <strong className="fra-summary-value">{readyCount}</strong>
                <span className="fra-summary-meta">Eligible projects not yet in the repository</span>
              </div>
            </article>
            <article className="fra-summary-card fra-summary-approved">
              <div className="fra-summary-icon">
                <i className="fas fa-circle-check"></i>
              </div>
              <div className="fra-summary-body">
                <span className="fra-summary-label">Published to Repository</span>
                <strong className="fra-summary-value">{publishedCount}</strong>
                <span className="fra-summary-meta">Official institutional repository records</span>
              </div>
            </article>
          </section>

          {/* Workflow Banner */}
          <section className="fra-workflow-banner">
            <div className="fra-workflow-icon">
              <i className="fas fa-route"></i>
            </div>
            <div className="fra-workflow-body">
              <strong>Approval Workflow</strong>
              <p>
                A project becomes eligible once it reaches Approved, Defense Scheduled, Completed, or Archived status. <strong>Research Head approves</strong> it here, which publishes the record to the Official Repository.
              </p>
            </div>
          </section>

          {/* Status Tabs */}
          <section className="fra-tabs-bar">
            {QUEUE_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`fra-tab${activeTab === tab.key ? ' is-active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span>{tab.label}</span>
                <span className="fra-tab-count">{tab.key === 'ready' ? readyCount : publishedCount}</span>
              </button>
            ))}
          </section>

          {/* Filters & Search */}
          <section className="fra-filter-bar">
            <div className="fra-filter-search">
              <i className="fas fa-magnifying-glass"></i>
              <input
                className="fra-filter-input"
                placeholder="Search by project title or student..."
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="fra-filter-field">
              <select
                className="fra-filter-select"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option>All Departments</option>
                <option>IT</option>
                <option>MET</option>
                <option>TCM</option>
                <option>ESM</option>
                <option>NAME</option>
              </select>
            </div>
            <div className="fra-filter-meta">
              <span className="admin-inline-badge">
                <i className="fas fa-filter"></i>
                {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} shown
              </span>
            </div>
          </section>

          {/* Review Queue Table */}
          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>
                  <i className={`fas ${activeTab === 'ready' ? 'fa-clock' : 'fa-circle-check'}`} style={{ marginRight: '0.5rem', opacity: 0.7 }}></i>
                  Review Queue — {activeTab === 'ready' ? 'Ready for Approval' : 'Published to Repository'}
                </h3>
              </div>
              <span className="status-badge status-info">
                {filteredRecords.length} {filteredRecords.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {loadError ? (
              <div className="fra-empty-state">
                <i className="fas fa-triangle-exclamation"></i>
                <p>{loadError}</p>
              </div>
            ) : isLoading ? (
              <div className="fra-empty-state">
                <i className="fas fa-circle-notch fa-spin"></i>
                <p>Loading records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="fra-record-list">
                {filteredRecords.map((record) => (
                  <article key={record.projectId} className={`fra-record-card${record.isPublished ? ' is-published' : ''}`}>
                    <div className="fra-record-head">
                      <div className="fra-record-heading">
                        <div className="fra-record-icon">
                          <i className={`fas ${record.isPublished ? 'fa-box-archive' : 'fa-hourglass-half'}`}></i>
                        </div>
                        <div className="fra-record-titles">
                          <strong className="fra-record-title">{record.projectTitle}</strong>
                          <div className="fra-record-subtitle">
                            <span className="dept-badge">{record.department || 'No department'}</span>
                            <span>{record.fileCount} files &middot; {record.totalFileSize}</span>
                          </div>
                        </div>
                      </div>
                      <div className="fra-record-badges">
                        {record.adviserReviewStatus ? (
                          <span className={`status-badge ${ADVISER_REVIEW_CLASS[record.adviserReviewStatus]}`}>
                            {ADVISER_REVIEW_LABEL[record.adviserReviewStatus]}
                          </span>
                        ) : (
                          <span className="status-badge status-pending">No submission on record</span>
                        )}
                      </div>
                    </div>

                    <div className="fra-record-body">
                      <div className="fra-record-field">
                        <span>Submitted By</span>
                        <strong>{record.submittedBy || 'Not on record'}</strong>
                      </div>
                      <div className="fra-record-field">
                        <span>Adviser</span>
                        <strong>{record.adviserName || 'Not assigned'}</strong>
                      </div>
                      <div className="fra-record-field">
                        <span>Last Activity</span>
                        <strong>{new Date(record.lastActivityAt).toLocaleDateString()}</strong>
                      </div>
                    </div>

                    <div className="fra-record-footer">
                      <span className="fra-record-footer-meta">
                        <i className={`fas ${record.isPublished ? 'fa-circle-check' : 'fa-route'}`}></i>
                        {record.isPublished
                          ? `Published${record.publishedAt ? ` ${new Date(record.publishedAt).toLocaleDateString()}` : ''}`
                          : 'Awaiting Research Head approval'}
                      </span>
                      <div className="fra-action-group">
                        <button
                          className="btn btn-outline small"
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <i className="fas fa-eye"></i>
                          Review
                        </button>
                        {!record.isPublished && (
                          <button
                            className="btn btn-primary small"
                            type="button"
                            disabled={publishingId === record.projectId}
                            onClick={() => handleApprove(record)}
                          >
                            <i className="fas fa-circle-check"></i>
                            {publishingId === record.projectId ? 'Publishing...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="fra-empty-state">
                <i className="fas fa-box-archive"></i>
                <strong>No records</strong>
                <p>There are no records in this queue matching your current filters.</p>
              </div>
            )}
          </section>
        </div>
      </AdminShell>

      {/* Review Detail Modal */}
      {selectedRecord ? (
        <div
          className="modal show"
          onClick={(event) => event.target === event.currentTarget && setSelectedRecord(null)}
        >
          <div className="modal-content fra-review-modal">
            <div className="modal-header">
              <div>
                <h3>
                  <i className="fas fa-clipboard-check" style={{ marginRight: '0.5rem' }}></i>
                  Submission Review
                </h3>
              </div>
              <button
                className="close-modal"
                type="button"
                onClick={() => setSelectedRecord(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="fra-review-layout">
                <section className="fra-review-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div className={`fra-record-icon${selectedRecord.isPublished ? ' is-published' : ''}`}>
                      <i className={`fas ${selectedRecord.isPublished ? 'fa-box-archive' : 'fa-hourglass-half'}`}></i>
                    </div>
                    <div>
                      <span className={`status-badge ${selectedRecord.isPublished ? 'status-approved' : 'status-pending'}`}>
                        {selectedRecord.isPublished ? 'Published to Repository' : 'Ready for Approval'}
                      </span>
                      <h2 className="fra-review-title" style={{ marginTop: '0.4rem' }}>{selectedRecord.projectTitle}</h2>
                    </div>
                  </div>
                </section>

                <section className="fra-review-details">
                  {[
                    ['Department', selectedRecord.department || 'Not on record'],
                    ['Submitted By', selectedRecord.submittedBy || 'Not on record'],
                    ['Adviser', selectedRecord.adviserName || 'Not assigned'],
                    ['Last Activity', new Date(selectedRecord.lastActivityAt).toLocaleDateString()],
                    ['Files', `${selectedRecord.fileCount} files (${selectedRecord.totalFileSize})`]
                  ].map(([label, value]) => (
                    <div key={label} className="fra-review-detail-item">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </section>

                <section className="fra-approval-chain">
                  <strong className="fra-chain-title">Approval Chain</strong>
                  <div className="fra-chain-steps">
                    <div className="fra-chain-step is-complete">
                      <div className="fra-chain-icon"><i className="fas fa-user-graduate"></i></div>
                      <div>
                        <strong>Student Submission</strong>
                        <span>{selectedRecord.submittedBy || 'Not on record'}</span>
                      </div>
                    </div>
                    <div className={`fra-chain-step ${selectedRecord.adviserReviewStatus === 'APPROVED' ? 'is-complete' : selectedRecord.adviserReviewStatus === 'NEEDS_REVISION' ? 'is-returned' : 'is-pending'}`}>
                      <div className="fra-chain-icon"><i className="fas fa-chalkboard-user"></i></div>
                      <div>
                        <strong>Adviser Review</strong>
                        <span>
                          {selectedRecord.adviserName || 'Not assigned'} —{' '}
                          {selectedRecord.adviserReviewStatus ? ADVISER_REVIEW_LABEL[selectedRecord.adviserReviewStatus] : 'No submission on record'}
                        </span>
                      </div>
                    </div>
                    <div className={`fra-chain-step ${selectedRecord.isPublished ? 'is-complete' : 'is-current'}`}>
                      <div className="fra-chain-icon"><i className="fas fa-building-columns"></i></div>
                      <div>
                        <strong>Research Head Approval</strong>
                        <span>
                          {selectedRecord.isPublished
                            ? `Approved — published${selectedRecord.publishedAt ? ` on ${new Date(selectedRecord.publishedAt).toLocaleDateString()}` : ''}`
                            : 'Awaiting approval'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
              {!selectedRecord.isPublished && (
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={publishingId === selectedRecord.projectId}
                  onClick={() => handleApprove(selectedRecord)}
                >
                  <i className="fas fa-circle-check"></i>
                  {publishingId === selectedRecord.projectId ? 'Publishing...' : 'Approve to Repository'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast Notification */}
      {toast ? (
        <div className={`fra-toast fra-toast-${toast.type}`} role="status">
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'warning' ? 'triangle-exclamation' : 'info-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      ) : null}
    </>
  );
}
