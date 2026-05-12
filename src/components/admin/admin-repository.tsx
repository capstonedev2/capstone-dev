'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

type RepositoryDocument = {
  id: string;
  name: string;
  type: string;
  department: string;
  project: string;
  status: 'Approved' | 'Archived';
  uploadedBy: string;
  date: string;
  size: string;
};

const REPOSITORY_CATEGORIES = [
  { key: 'Proposals', count: 156, icon: 'fa-scroll', color: '#003A8F' },
  { key: 'Manuscripts', count: 342, icon: 'fa-book', color: '#1E40AF' },
  { key: 'Presentations', count: 156, icon: 'fa-presentation-screen', color: '#0369a1' },
  { key: 'MOAs', count: 48, icon: 'fa-file-signature', color: '#047857' },
  { key: 'Certificates', count: 89, icon: 'fa-award', color: '#F6BE00' }
];

const REPOSITORY_STATS = [
  { label: 'Total Documents', value: '1,247', icon: 'fa-files', description: 'All approved institutional records' },
  { label: 'Pending Review', value: '14', icon: 'fa-clock', description: 'Awaiting final repository approval' },
  { label: 'Approved', value: '1,089', icon: 'fa-circle-check', description: 'Verified and released documents' },
  { label: 'Archived', value: '144', icon: 'fa-box-archive', description: 'Permanently stored records' },
  { label: 'Storage Used', value: '12.4 GB', icon: 'fa-hard-drive', description: 'Total institutional storage' }
];

const APPROVED_DOCUMENTS: RepositoryDocument[] = [
  {
    id: 'DOC-2026-001',
    name: 'AI_Learning_System_Final_Manuscript.pdf',
    type: 'Manuscript',
    department: 'IT',
    project: 'AI-Powered Learning System',
    status: 'Approved',
    uploadedBy: 'Maria Santos',
    date: 'May 8, 2026',
    size: '4.2 MB'
  },
  {
    id: 'DOC-2026-002',
    name: 'Smart_Energy_Monitor_Proposal.pdf',
    type: 'Proposal',
    department: 'MET',
    project: 'Smart Energy Monitor',
    status: 'Approved',
    uploadedBy: 'John Reyes',
    date: 'May 7, 2026',
    size: '2.1 MB'
  },
  {
    id: 'DOC-2026-003',
    name: 'Defense_Presentation_IT_ALS.pptx',
    type: 'Presentation',
    department: 'IT',
    project: 'AI-Powered Learning System',
    status: 'Approved',
    uploadedBy: 'Dr. Ricardo Cruz',
    date: 'May 5, 2026',
    size: '5.8 MB'
  },
  {
    id: 'DOC-2026-004',
    name: 'MOA_TechCorp_Signed_2026.pdf',
    type: 'MOA',
    department: 'IT',
    project: 'AI Inventory System',
    status: 'Archived',
    uploadedBy: 'Carlos Mendoza',
    date: 'Apr 28, 2026',
    size: '1.2 MB'
  },
  {
    id: 'DOC-2026-005',
    name: 'Research_Ethics_Certificate_IT.pdf',
    type: 'Certificate',
    department: 'IT',
    project: 'AI-Powered Learning System',
    status: 'Approved',
    uploadedBy: 'Maria Santos',
    date: 'Apr 22, 2026',
    size: '0.8 MB'
  },
  {
    id: 'DOC-2026-006',
    name: 'Marine_Pollution_Detector_Manuscript.pdf',
    type: 'Manuscript',
    department: 'NAME',
    project: 'Marine Pollution Detector',
    status: 'Archived',
    uploadedBy: 'Elena Aquino',
    date: 'Apr 15, 2026',
    size: '6.4 MB'
  },
  {
    id: 'DOC-2026-007',
    name: 'Sustainable_Agri_IoT_Full_Package.zip',
    type: 'Manuscript',
    department: 'ESM',
    project: 'Sustainable Agriculture IoT',
    status: 'Approved',
    uploadedBy: 'Carlos Mendoza',
    date: 'May 9, 2026',
    size: '22.1 MB'
  },
  {
    id: 'DOC-2026-008',
    name: 'MOA_OceanTech_Partnership.pdf',
    type: 'MOA',
    department: 'NAME',
    project: 'Marine Pollution Detector',
    status: 'Archived',
    uploadedBy: 'Elena Aquino',
    date: 'Mar 20, 2026',
    size: '1.5 MB'
  }
];

export function AdminRepository() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const filteredDocuments = useMemo(
    () =>
      APPROVED_DOCUMENTS.filter((document) => {
        const matchesDepartment = departmentFilter === 'All Departments' || document.department === departmentFilter;
        const matchesType = documentTypeFilter === 'All Types' || document.type === documentTypeFilter;
        const matchesCategory = !activeCategory || document.type === activeCategory.replace(/s$/, '').replace(/MOA/, 'MOA');
        const matchesQuery =
          !query ||
          document.name.toLowerCase().includes(query.toLowerCase()) ||
          document.project.toLowerCase().includes(query.toLowerCase()) ||
          document.uploadedBy.toLowerCase().includes(query.toLowerCase());

        return matchesDepartment && matchesType && matchesCategory && matchesQuery;
      }),
    [departmentFilter, documentTypeFilter, activeCategory, query]
  );

  return (
    <>
      <AdminShell
        activeNav="repository"
        title="Official Institutional Repository"
        description="Approved thesis, capstone, MOA, presentation, and evidence files archived in the institutional repository. Only Research Head-approved documents appear here."
      >
        <div className="admin-page-stack">

          {/* Repository Hero */}
          <section className="repo-hero">
            <div className="repo-hero-icon">
              <i className="fas fa-landmark"></i>
            </div>
            <div className="repo-hero-body">
              <strong>Official Institutional Repository</strong>
              <p>
                This repository contains only Research Head-approved documents. Files are automatically
                archived here after completing the full approval workflow:
                Student → Adviser → Department Chair → Research Head.
              </p>
            </div>
            <div className="repo-hero-actions">
              <button className="btn btn-outline" type="button" onClick={() => showToast('Repository analytics loading...', 'info')}>
                <i className="fas fa-chart-pie"></i>
                Analytics
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setImportModalOpen(true)}>
                <i className="fas fa-file-import"></i>
                Import Legacy
              </button>
            </div>
          </section>

          {/* Repository Statistics */}
          <section className="repo-stats-grid">
            {REPOSITORY_STATS.map((stat) => (
              <article key={stat.label} className="repo-stat-card">
                <div className="repo-stat-icon">
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <div className="repo-stat-body">
                  <span className="repo-stat-label">{stat.label}</span>
                  <strong className="repo-stat-value">{stat.value}</strong>
                  <span className="repo-stat-description">{stat.description}</span>
                </div>
              </article>
            ))}
          </section>

          {/* Repository Category Cards */}
          <section className="repo-category-strip">
            <div className="repo-category-header">
              <div>
                <h3>Repository Categories</h3>
                <p>Browse approved documents by category. Click a category to filter the records below.</p>
              </div>
              {activeCategory && (
                <button className="btn btn-outline small" type="button" onClick={() => setActiveCategory(null)}>
                  <i className="fas fa-xmark"></i>
                  Clear filter
                </button>
              )}
            </div>
            <div className="repo-category-grid">
              {REPOSITORY_CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  className={`repo-category-card${activeCategory === category.key ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === category.key ? null : category.key)}
                >
                  <div className="repo-category-icon" style={{ color: category.color }}>
                    <i className={`fas ${category.icon}`}></i>
                  </div>
                  <strong>{category.key}</strong>
                  <span className="repo-category-count">{category.count} documents</span>
                </button>
              ))}
            </div>
          </section>

          {/* Filter Controls */}
          <section className="repo-filter-bar">
            <div className="repo-filter-search">
              <i className="fas fa-magnifying-glass"></i>
              <input
                className="repo-filter-input"
                placeholder="Search by document name, project, or uploader..."
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              className="repo-filter-select"
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
            <select
              className="repo-filter-select"
              value={documentTypeFilter}
              onChange={(event) => setDocumentTypeFilter(event.target.value)}
            >
              <option>All Types</option>
              <option>Proposal</option>
              <option>Manuscript</option>
              <option>Presentation</option>
              <option>MOA</option>
              <option>Certificate</option>
            </select>
            <select
              className="repo-filter-select"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            >
              <option>All Dates</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Semester</option>
              <option>This Year</option>
            </select>
            <div className="repo-filter-actions">
              <button className="btn btn-outline small" type="button" onClick={() => showToast('PDF export started.', 'success')}>
                <i className="fas fa-file-pdf"></i>
                Export PDF
              </button>
              <button className="btn btn-outline small" type="button" onClick={() => showToast('Excel export started.', 'success')}>
                <i className="fas fa-file-excel"></i>
                Export Excel
              </button>
            </div>
          </section>

          {/* Official Repository Records Table */}
          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>
                  <i className="fas fa-landmark" style={{ marginRight: '0.5rem', opacity: 0.7 }}></i>
                  Official Repository Records
                </h3>
                <p>Research Head-approved documents from the full thesis and capstone approval workflow.</p>
              </div>
              <span className="status-badge status-approved">
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
              </span>
            </div>
            {filteredDocuments.length > 0 ? (
              <div className="table-scroll">
                <table className="repo-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Type</th>
                      <th>Department</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Uploaded By</th>
                      <th>Date</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <div className="repo-doc-cell">
                            <i className="fas fa-file-lines repo-doc-icon"></i>
                            <div>
                              <strong className="repo-doc-name">{document.name}</strong>
                              <span className="repo-doc-id">{document.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="repo-type-pill">{document.type}</span>
                        </td>
                        <td><span className="dept-badge">{document.department}</span></td>
                        <td><span className="table-title">{document.project}</span></td>
                        <td>
                          <span className={`status-badge ${document.status === 'Approved' ? 'status-approved' : 'status-neutral'}`}>
                            {document.status}
                          </span>
                        </td>
                        <td>{document.uploadedBy}</td>
                        <td>{document.date}</td>
                        <td>{document.size}</td>
                        <td>
                          <div className="repo-action-group">
                            <button className="btn btn-outline small" type="button" title="View">
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="btn btn-outline small" type="button" title="Download">
                              <i className="fas fa-download"></i>
                            </button>
                            <button className="btn btn-outline small" type="button" title="More options">
                              <i className="fas fa-ellipsis-vertical"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="repo-empty-state">
                <i className="fas fa-folder-open"></i>
                <strong>No documents found</strong>
                <p>No approved repository records match your current search or filter criteria.</p>
              </div>
            )}
          </section>

          {/* Pagination */}
          <div className="repo-pagination-row">
            <span className="repo-pagination-info">
              Showing {filteredDocuments.length} of {APPROVED_DOCUMENTS.length} approved documents
            </span>
            <div className="admin-pagination">
              <button className="active" type="button">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">Next</button>
            </div>
          </div>
        </div>
      </AdminShell>

      {/* Import Legacy Modal */}
      {importModalOpen ? (
        <div
          className="modal show"
          onClick={(event) => event.target === event.currentTarget && setImportModalOpen(false)}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3><i className="fas fa-file-import" style={{ marginRight: '0.5rem' }}></i> Manual Import / Import Legacy File</h3>
                <p>Import old thesis records, migrated files, backlog records, or files submitted outside the system.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setImportModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="repo-import-notice">
                <i className="fas fa-shield-halved"></i>
                <div>
                  <strong>Admin only</strong>
                  <p>Use only for legacy records and special authorized cases. Normal documents flow through the student → adviser → department → Research Head approval workflow.</p>
                </div>
              </div>
              <div className="admin-form-grid" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Document Title</label>
                  <input placeholder="Enter document title" />
                </div>
                <div className="form-group">
                  <label>Document Type</label>
                  <select defaultValue="">
                    <option value="" disabled>Select type</option>
                    <option>Proposal</option>
                    <option>Manuscript</option>
                    <option>Presentation</option>
                    <option>MOA</option>
                    <option>Certificate</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select defaultValue="">
                    <option value="" disabled>Select department</option>
                    <option>IT</option>
                    <option>MET</option>
                    <option>TCM</option>
                    <option>ESM</option>
                    <option>NAME</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Project Name</label>
                  <input placeholder="Associated project" />
                </div>
                <div className="form-group">
                  <label>Original Date</label>
                  <input type="date" />
                </div>
                <div className="form-group">
                  <label>Import Reason</label>
                  <select defaultValue="">
                    <option value="" disabled>Select reason</option>
                    <option>Legacy thesis record</option>
                    <option>Migrated file</option>
                    <option>Backlog record</option>
                    <option>Special authorized case</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>File Upload</label>
                <div className="repo-import-dropzone">
                  <i className="fas fa-cloud-arrow-up"></i>
                  <p>Drag and drop files here, or click to browse</p>
                  <span>PDF, DOCX, PPTX, ZIP up to 50MB</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setImportModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={() => { setImportModalOpen(false); showToast('Legacy file imported successfully.', 'success'); }}>
                <i className="fas fa-file-import"></i>
                Import to Repository
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <div className="fra-toast fra-toast-success" role="status">
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'info-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      ) : null}
    </>
  );
}
