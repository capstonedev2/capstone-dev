'use client';

import { useState } from 'react';
import {
  LIBRARY_DOCUMENT_CATEGORY_COUNTS,
  LIBRARY_DOCUMENTS,
  type LibraryDepartment,
  type LibraryDocument,
  type LibraryDocumentType
} from '@/components/library/library-data';
import {
  LibraryDepartmentBadge,
  LibraryModal,
  LibraryStatCard
} from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

function getDocumentIcon(type: LibraryDocumentType) {
  switch (type) {
    case 'Presentation':
      return 'fa-file-powerpoint';
    case 'Certificate':
      return 'fa-award';
    case 'Technical Report':
      return 'fa-file-lines';
    case 'Supporting Data':
      return 'fa-database';
    case 'Manuscript':
    default:
      return 'fa-file-pdf';
  }
}

export function LibraryRepository() {
  const initialDocument = LIBRARY_DOCUMENTS[0] ?? null;
  const [department, setDepartment] = useState<'all' | LibraryDepartment>('all');
  const [documentType, setDocumentType] = useState<'all' | LibraryDocumentType>('all');
  const [search, setSearch] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<LibraryDocument | null>(initialDocument);

  const filteredDocuments = LIBRARY_DOCUMENTS.filter((document) => {
    if (department !== 'all' && document.department !== department) {
      return false;
    }

    if (documentType !== 'all' && document.type !== documentType) {
      return false;
    }

    if (!search.trim()) {
      return true;
    }

    const query = search.trim().toLowerCase();

    return (
      document.fileName.toLowerCase().includes(query) ||
      document.projectTitle.toLowerCase().includes(query)
    );
  });

  const previewDocument = selectedDocument ?? filteredDocuments[0] ?? initialDocument;

  return (
    <LibraryShell
      activeNav="repository"
      title="Document Repository"
      description="Access full manuscripts, presentations, and supporting documents"
    >
      <section className="library-section-card">
        <div className="library-section-body">
          <div className="library-filter-bar">
            <div className="library-filter-field">
              <label htmlFor="library-repo-department">Department</label>
              <select
                id="library-repo-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value as 'all' | LibraryDepartment)}
              >
                <option value="all">All Departments</option>
                <option value="IT">IT</option>
                <option value="MET">MET</option>
                <option value="TCM">TCM</option>
                <option value="ESM">ESM</option>
                <option value="NAME">NAME</option>
              </select>
            </div>
            <div className="library-filter-field">
              <label htmlFor="library-repo-type">Document Type</label>
              <select
                id="library-repo-type"
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value as 'all' | LibraryDocumentType)
                }
              >
                <option value="all">All Documents</option>
                <option value="Manuscript">Full Manuscripts</option>
                <option value="Presentation">Presentations</option>
                <option value="Certificate">Certificates</option>
                <option value="Technical Report">Technical Reports</option>
                <option value="Supporting Data">Supporting Data</option>
              </select>
            </div>
            <div className="library-filter-field">
              <label htmlFor="library-repo-search">Search</label>
              <input
                id="library-repo-search"
                placeholder="Search documents..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="library-stat-grid">
        <LibraryStatCard title="Total Documents" value="342" />
        <LibraryStatCard title="Manuscripts" value="342" />
        <LibraryStatCard title="Presentations" value="156" />
        <LibraryStatCard title="Certificates" value="89" />
      </div>

      <section className="library-split-card">
        <div>
          <h3>Document Categories</h3>
          <div className="library-doc-category-list">
            {LIBRARY_DOCUMENT_CATEGORY_COUNTS.map((category) => (
              <p key={category.label}>
                <i className="fas fa-folder" aria-hidden="true" /> {category.label} ({category.count})
              </p>
            ))}
          </div>
        </div>

        <div>
          <h3>Document Viewer</h3>
          <button
            className="library-document-preview library-reset-button"
            type="button"
            onClick={() => setSelectedDocument(previewDocument)}
          >
            <i
              className={`fas ${getDocumentIcon(previewDocument.type)}`}
              aria-hidden="true"
              style={{ color: 'var(--library-danger)', fontSize: '4rem' }}
            />
            <strong>{previewDocument.fileName}</strong>
            <p>{previewDocument.projectTitle}</p>
            <p>
              <small>Click "View" in the list below to preview this document.</small>
            </p>
          </button>
        </div>
      </section>

      <section className="library-section-card">
        <div className="library-section-head">
          <h3>Recent Documents</h3>
        </div>
        <div className="library-section-body">
          <div className="library-table-wrap">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Project</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>{document.fileName}</td>
                    <td>{document.projectTitle}</td>
                    <td>
                      <LibraryDepartmentBadge>{document.department}</LibraryDepartmentBadge>
                    </td>
                    <td>{document.type}</td>
                    <td>{document.size}</td>
                    <td>{document.dateLabel}</td>
                    <td className="is-actions">
                      <div className="library-card-actions">
                        <button
                          className="library-btn is-primary is-small"
                          type="button"
                          onClick={() => setSelectedDocument(document)}
                        >
                          View
                        </button>
                        <button className="library-btn is-outline is-small" type="button">
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <LibraryModal
        maxWidth={900}
        open={selectedDocument !== null}
        title="Document Viewer"
        onClose={() => setSelectedDocument(null)}
      >
        {previewDocument ? (
          <div className="library-document-preview">
            <i
              className={`fas ${getDocumentIcon(previewDocument.type)}`}
              aria-hidden="true"
              style={{ color: 'var(--library-danger)', fontSize: '4.5rem' }}
            />
            <strong>{previewDocument.fileName}</strong>
            <p>{previewDocument.size}</p>
            <div className="library-progress-track">
              <div className="library-progress-fill" style={{ width: '100%' }} />
            </div>
            <button className="library-btn is-primary" type="button">
              Download Full Document
            </button>
          </div>
        ) : null}
      </LibraryModal>
    </LibraryShell>
  );
}
