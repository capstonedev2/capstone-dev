'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

type SubmissionStatus = 'Pending' | 'Under Review' | 'Approved to Repository' | 'Returned' | 'Archived';

type RepositorySubmission = {
  id: string;
  projectTitle: string;
  department: string;
  submittedBy: string;
  adviserApproval: 'Approved' | 'Pending' | 'Returned';
  departmentVerification: 'Verified' | 'Pending' | 'Returned';
  dateSubmitted: string;
  status: SubmissionStatus;
  documentType: string;
  fileCount: number;
  totalSize: string;
  adviserName: string;
  notes: string;
};

const STATUS_TABS: SubmissionStatus[] = [
  'Pending',
  'Under Review',
  'Approved to Repository',
  'Returned',
  'Archived'
];

const STATUS_ICON_MAP: Record<SubmissionStatus, string> = {
  'Pending': 'fa-clock',
  'Under Review': 'fa-magnifying-glass',
  'Approved to Repository': 'fa-circle-check',
  'Returned': 'fa-rotate-left',
  'Archived': 'fa-box-archive'
};

const STATUS_CLASS_MAP: Record<SubmissionStatus, string> = {
  'Pending': 'status-pending',
  'Under Review': 'status-info',
  'Approved to Repository': 'status-approved',
  'Returned': 'status-review',
  'Archived': 'status-neutral'
};

const APPROVAL_CLASS_MAP: Record<string, string> = {
  'Approved': 'status-approved',
  'Verified': 'status-approved',
  'Pending': 'status-pending',
  'Returned': 'status-critical'
};

const INITIAL_SUBMISSIONS: RepositorySubmission[] = [
  {
    id: 'FRA-2026-001',
    projectTitle: 'AI-Powered Learning Management System',
    department: 'IT',
    submittedBy: 'Maria Santos',
    adviserApproval: 'Approved',
    departmentVerification: 'Verified',
    dateSubmitted: 'May 8, 2026',
    status: 'Pending',
    documentType: 'Final Manuscript',
    fileCount: 4,
    totalSize: '12.8 MB',
    adviserName: 'Dr. Ricardo Cruz',
    notes: 'All chapters completed. Similarity index 8%. Ready for final repository release.'
  },
  {
    id: 'FRA-2026-002',
    projectTitle: 'Smart Solar Energy Monitoring System',
    department: 'MET',
    submittedBy: 'John Reyes',
    adviserApproval: 'Approved',
    departmentVerification: 'Verified',
    dateSubmitted: 'May 7, 2026',
    status: 'Under Review',
    documentType: 'Final Manuscript',
    fileCount: 3,
    totalSize: '9.4 MB',
    adviserName: 'Prof. Maria Ramos',
    notes: 'Pending final verification of deployment evidence and utilization report.'
  },
  {
    id: 'FRA-2026-003',
    projectTitle: 'Herbal Medicine Knowledge Portal',
    department: 'TCM',
    submittedBy: 'Ana Garcia',
    adviserApproval: 'Approved',
    departmentVerification: 'Pending',
    dateSubmitted: 'May 6, 2026',
    status: 'Pending',
    documentType: 'Proposal + Manuscript',
    fileCount: 5,
    totalSize: '15.2 MB',
    adviserName: 'Dr. Anna Reyes',
    notes: 'Adviser approved, awaiting Department Chair verification before Research Head review.'
  },
  {
    id: 'FRA-2026-004',
    projectTitle: 'Sustainable Agriculture IoT System',
    department: 'ESM',
    submittedBy: 'Carlos Mendoza',
    adviserApproval: 'Approved',
    departmentVerification: 'Verified',
    dateSubmitted: 'May 5, 2026',
    status: 'Approved to Repository',
    documentType: 'Final Manuscript',
    fileCount: 6,
    totalSize: '22.1 MB',
    adviserName: 'Prof. Jose Lopez',
    notes: 'Approved and archived in the Official Institutional Repository on May 9, 2026.'
  },
  {
    id: 'FRA-2026-005',
    projectTitle: 'Marine Pollution Detection Buoy System',
    department: 'NAME',
    submittedBy: 'Elena Aquino',
    adviserApproval: 'Approved',
    departmentVerification: 'Verified',
    dateSubmitted: 'May 3, 2026',
    status: 'Archived',
    documentType: 'Full Package',
    fileCount: 8,
    totalSize: '34.5 MB',
    adviserName: 'Dr. Elena Aquino',
    notes: 'Complete package including MOA, presentation, manuscript, and certificates archived.'
  },
  {
    id: 'FRA-2026-006',
    projectTitle: 'Blockchain-Based Voting Platform',
    department: 'IT',
    submittedBy: 'Rico Pascual',
    adviserApproval: 'Approved',
    departmentVerification: 'Returned',
    dateSubmitted: 'May 2, 2026',
    status: 'Returned',
    documentType: 'Final Manuscript',
    fileCount: 2,
    totalSize: '6.7 MB',
    adviserName: 'Dr. Ricardo Cruz',
    notes: 'Department Chair returned: missing signed approval sheet and ethics clearance certificate.'
  },
  {
    id: 'FRA-2026-007',
    projectTitle: 'Smart Classroom Attendance Tracker',
    department: 'IT',
    submittedBy: 'Liza Tan',
    adviserApproval: 'Approved',
    departmentVerification: 'Verified',
    dateSubmitted: 'May 10, 2026',
    status: 'Under Review',
    documentType: 'Final Manuscript',
    fileCount: 3,
    totalSize: '8.9 MB',
    adviserName: 'Dr. Ricardo Cruz',
    notes: 'Research Head currently reviewing final chapters and similarity report.'
  }
];

export function AdminFinalRepositoryApproval() {
  const [submissions, setSubmissions] = useState<RepositorySubmission[]>(INITIAL_SUBMISSIONS);
  const [activeTab, setActiveTab] = useState<SubmissionStatus>('Pending');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [query, setQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<RepositorySubmission | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((submission) => {
        const matchesTab = submission.status === activeTab;
        const matchesDept = departmentFilter === 'All Departments' || submission.department === departmentFilter;
        const matchesQuery =
          !query ||
          submission.projectTitle.toLowerCase().includes(query.toLowerCase()) ||
          submission.submittedBy.toLowerCase().includes(query.toLowerCase()) ||
          submission.id.toLowerCase().includes(query.toLowerCase());

        return matchesTab && matchesDept && matchesQuery;
      }),
    [activeTab, departmentFilter, query, submissions]
  );

  const tabCounts = useMemo(() => {
    const counts: Record<SubmissionStatus, number> = {
      'Pending': 0,
      'Under Review': 0,
      'Approved to Repository': 0,
      'Returned': 0,
      'Archived': 0
    };

    for (const submission of submissions) {
      counts[submission.status]++;
    }

    return counts;
  }, [submissions]);

  const pendingCount = tabCounts['Pending'];
  const underReviewCount = tabCounts['Under Review'];
  const approvedCount = tabCounts['Approved to Repository'];
  const archivedCount = tabCounts['Archived'];

  const handleApprove = (submission: RepositorySubmission) => {
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id ? { ...item, status: 'Approved to Repository' as SubmissionStatus } : item
      )
    );
    setSelectedSubmission(null);
    showToast(
      `"${submission.projectTitle}" approved and moved to Official Institutional Repository.`,
      'success'
    );
  };

  const handleReturn = (submission: RepositorySubmission) => {
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id ? { ...item, status: 'Returned' as SubmissionStatus } : item
      )
    );
    setSelectedSubmission(null);
    showToast(`"${submission.projectTitle}" returned for revision.`, 'warning');
  };

  const handleStartReview = (submission: RepositorySubmission) => {
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id ? { ...item, status: 'Under Review' as SubmissionStatus } : item
      )
    );
    showToast(`Now reviewing "${submission.projectTitle}".`, 'info');
  };

  const handleArchive = (submission: RepositorySubmission) => {
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id ? { ...item, status: 'Archived' as SubmissionStatus } : item
      )
    );
    showToast(`"${submission.projectTitle}" archived successfully.`, 'success');
  };

  return (
    <>
      <AdminShell
        activeNav="final-repository-approval"
        title="Final Repository Approval"
        description="Review and approve completed thesis and capstone submissions before they become official repository records."
      >
        <div className="admin-page-stack">

          {/* Summary Cards */}
          <section className="fra-summary-grid">
            <article className="fra-summary-card fra-summary-pending">
              <div className="fra-summary-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="fra-summary-body">
                <span className="fra-summary-label">Pending Final Submissions</span>
                <strong className="fra-summary-value">{pendingCount}</strong>
                <span className="fra-summary-meta">Awaiting Research Head review</span>
              </div>
            </article>
            <article className="fra-summary-card fra-summary-review">
              <div className="fra-summary-icon">
                <i className="fas fa-magnifying-glass"></i>
              </div>
              <div className="fra-summary-body">
                <span className="fra-summary-label">For Verification</span>
                <strong className="fra-summary-value">{underReviewCount}</strong>
                <span className="fra-summary-meta">Currently under Research Head review</span>
              </div>
            </article>
            <article className="fra-summary-card fra-summary-approved">
              <div className="fra-summary-icon">
                <i className="fas fa-circle-check"></i>
              </div>
              <div className="fra-summary-body">
                <span className="fra-summary-label">Approved Today</span>
                <strong className="fra-summary-value">{approvedCount}</strong>
                <span className="fra-summary-meta">Moved to Official Repository</span>
              </div>
            </article>
            <article className="fra-summary-card fra-summary-archived">
              <div className="fra-summary-icon">
                <i className="fas fa-box-archive"></i>
              </div>
              <div className="fra-summary-body">
                <span className="fra-summary-label">Archived All Time</span>
                <strong className="fra-summary-value">{archivedCount}</strong>
                <span className="fra-summary-meta">Permanently stored records</span>
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
                Student uploads final documents → Adviser approves → Program Head / Department Chair verifies → <strong>Research Head approves</strong> → System automatically archives to Official Repository.
              </p>
            </div>
          </section>

          {/* Status Tabs */}
          <section className="fra-tabs-bar">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                className={`fra-tab${activeTab === tab ? ' is-active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab)}
              >
                <i className={`fas ${STATUS_ICON_MAP[tab]}`}></i>
                <span>{tab}</span>
                <span className="fra-tab-count">{tabCounts[tab]}</span>
              </button>
            ))}
          </section>

          {/* Filters & Search */}
          <section className="fra-filter-bar">
            <div className="fra-filter-search">
              <i className="fas fa-magnifying-glass"></i>
              <input
                className="fra-filter-input"
                placeholder="Search by project title, student, or ID..."
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
                {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'record' : 'records'} shown
              </span>
            </div>
          </section>

          {/* Review Queue Table */}
          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>
                  <i className={`fas ${STATUS_ICON_MAP[activeTab]}`} style={{ marginRight: '0.5rem', opacity: 0.7 }}></i>
                  Review Queue — {activeTab}
                </h3>
                <p>
                  {activeTab === 'Pending' && 'Submissions awaiting Research Head review. Adviser and department clearance must be complete.'}
                  {activeTab === 'Under Review' && 'Submissions currently being reviewed by the Research Head for final approval.'}
                  {activeTab === 'Approved to Repository' && 'Approved submissions that have been moved to the Official Institutional Repository.'}
                  {activeTab === 'Returned' && 'Submissions returned for revision with comments from the Research Head.'}
                  {activeTab === 'Archived' && 'Permanently archived repository records with full audit trail.'}
                </p>
              </div>
              <span className={`status-badge ${STATUS_CLASS_MAP[activeTab]}`}>
                {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {filteredSubmissions.length > 0 ? (
              <div className="table-scroll">
                <table className="fra-table">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Department</th>
                      <th>Submitted By</th>
                      <th>Adviser Approval</th>
                      <th>Dept. Verification</th>
                      <th>Date Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>
                          <div className="fra-project-cell">
                            <span className="fra-project-id">{submission.id}</span>
                            <strong className="fra-project-title">{submission.projectTitle}</strong>
                            <span className="fra-project-meta">
                              {submission.documentType} · {submission.fileCount} files · {submission.totalSize}
                            </span>
                          </div>
                        </td>
                        <td><span className="dept-badge">{submission.department}</span></td>
                        <td>
                          <div className="fra-person-cell">
                            <strong>{submission.submittedBy}</strong>
                            <span>Student</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${APPROVAL_CLASS_MAP[submission.adviserApproval]}`}>
                            {submission.adviserApproval}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${APPROVAL_CLASS_MAP[submission.departmentVerification]}`}>
                            {submission.departmentVerification}
                          </span>
                        </td>
                        <td>{submission.dateSubmitted}</td>
                        <td>
                          <div className="fra-action-group">
                            <button
                              className="btn btn-outline small"
                              type="button"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <i className="fas fa-eye"></i>
                              Review
                            </button>
                            {(submission.status === 'Pending' || submission.status === 'Under Review') &&
                              submission.adviserApproval === 'Approved' &&
                              submission.departmentVerification === 'Verified' && (
                              <button
                                className="btn btn-primary small"
                                type="button"
                                onClick={() => handleApprove(submission)}
                              >
                                <i className="fas fa-circle-check"></i>
                                Approve
                              </button>
                            )}
                            {submission.status === 'Pending' && (
                              <button
                                className="btn btn-outline small"
                                type="button"
                                onClick={() => handleStartReview(submission)}
                              >
                                <i className="fas fa-magnifying-glass"></i>
                                Start Review
                              </button>
                            )}
                            {submission.status === 'Approved to Repository' && (
                              <button
                                className="btn btn-outline small"
                                type="button"
                                onClick={() => handleArchive(submission)}
                              >
                                <i className="fas fa-box-archive"></i>
                                Archive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="fra-empty-state">
                <i className={`fas ${STATUS_ICON_MAP[activeTab]}`}></i>
                <strong>No {activeTab.toLowerCase()} submissions</strong>
                <p>There are no submissions with "{activeTab}" status matching your current filters.</p>
              </div>
            )}
          </section>
        </div>
      </AdminShell>

      {/* Review Detail Modal */}
      {selectedSubmission ? (
        <div
          className="modal show"
          onClick={(event) => event.target === event.currentTarget && setSelectedSubmission(null)}
        >
          <div className="modal-content fra-review-modal">
            <div className="modal-header">
              <div>
                <h3>
                  <i className="fas fa-clipboard-check" style={{ marginRight: '0.5rem' }}></i>
                  Submission Review
                </h3>
                <p>{selectedSubmission.id} · {selectedSubmission.documentType}</p>
              </div>
              <button
                className="close-modal"
                type="button"
                onClick={() => setSelectedSubmission(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="fra-review-layout">
                {/* Status & Project Info */}
                <section className="fra-review-section">
                  <span className={`status-badge ${STATUS_CLASS_MAP[selectedSubmission.status]}`}>
                    {selectedSubmission.status}
                  </span>
                  <h2 className="fra-review-title">{selectedSubmission.projectTitle}</h2>
                  <p className="fra-review-notes">{selectedSubmission.notes}</p>
                </section>

                {/* Detail Grid */}
                <section className="fra-review-details">
                  {[
                    ['Department', selectedSubmission.department],
                    ['Submitted By', selectedSubmission.submittedBy],
                    ['Adviser', selectedSubmission.adviserName],
                    ['Date Submitted', selectedSubmission.dateSubmitted],
                    ['Document Type', selectedSubmission.documentType],
                    ['Files', `${selectedSubmission.fileCount} files (${selectedSubmission.totalSize})`]
                  ].map(([label, value]) => (
                    <div key={label} className="fra-review-detail-item">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </section>

                {/* Approval Chain */}
                <section className="fra-approval-chain">
                  <strong className="fra-chain-title">Approval Chain</strong>
                  <div className="fra-chain-steps">
                    <div className="fra-chain-step is-complete">
                      <div className="fra-chain-icon"><i className="fas fa-user-graduate"></i></div>
                      <div>
                        <strong>Student Submission</strong>
                        <span>Uploaded by {selectedSubmission.submittedBy}</span>
                      </div>
                    </div>
                    <div className={`fra-chain-step ${selectedSubmission.adviserApproval === 'Approved' ? 'is-complete' : selectedSubmission.adviserApproval === 'Returned' ? 'is-returned' : 'is-pending'}`}>
                      <div className="fra-chain-icon"><i className="fas fa-chalkboard-user"></i></div>
                      <div>
                        <strong>Adviser Approval</strong>
                        <span>{selectedSubmission.adviserName} — {selectedSubmission.adviserApproval}</span>
                      </div>
                    </div>
                    <div className={`fra-chain-step ${selectedSubmission.departmentVerification === 'Verified' ? 'is-complete' : selectedSubmission.departmentVerification === 'Returned' ? 'is-returned' : 'is-pending'}`}>
                      <div className="fra-chain-icon"><i className="fas fa-user-tie"></i></div>
                      <div>
                        <strong>Department Verification</strong>
                        <span>Program Head / Chair — {selectedSubmission.departmentVerification}</span>
                      </div>
                    </div>
                    <div className={`fra-chain-step ${selectedSubmission.status === 'Approved to Repository' || selectedSubmission.status === 'Archived' ? 'is-complete' : selectedSubmission.status === 'Returned' ? 'is-returned' : 'is-current'}`}>
                      <div className="fra-chain-icon"><i className="fas fa-building-columns"></i></div>
                      <div>
                        <strong>Research Head Approval</strong>
                        <span>
                          {selectedSubmission.status === 'Approved to Repository' || selectedSubmission.status === 'Archived'
                            ? 'Approved — moved to repository'
                            : selectedSubmission.status === 'Returned'
                            ? 'Returned for revision'
                            : 'Awaiting approval'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* File Preview */}
                <section className="fra-files-preview">
                  <strong>Attached Documents ({selectedSubmission.fileCount})</strong>
                  <div className="fra-files-list">
                    {Array.from({ length: selectedSubmission.fileCount }, (_, index) => (
                      <div key={index} className="fra-file-item">
                        <i className="fas fa-file-pdf"></i>
                        <span>{selectedSubmission.projectTitle.replace(/\s+/g, '_')}_Part{index + 1}.pdf</span>
                        <button className="btn btn-outline small" type="button">
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
              {(selectedSubmission.status === 'Pending' || selectedSubmission.status === 'Under Review') && (
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => handleReturn(selectedSubmission)}
                >
                  <i className="fas fa-rotate-left"></i>
                  Return for Revision
                </button>
              )}
              {(selectedSubmission.status === 'Pending' || selectedSubmission.status === 'Under Review') &&
                selectedSubmission.adviserApproval === 'Approved' &&
                selectedSubmission.departmentVerification === 'Verified' && (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handleApprove(selectedSubmission)}
                >
                  <i className="fas fa-circle-check"></i>
                  Approve to Repository
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
