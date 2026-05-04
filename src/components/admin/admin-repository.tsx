'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const FOLDERS = [
  { key: 'Proposals', count: 156, icon: 'fa-folder' },
  { key: 'Manuscripts', count: 342, icon: 'fa-file-lines' },
  { key: 'Presentations', count: 156, icon: 'fa-laptop' },
  { key: 'MOAs', count: 48, icon: 'fa-file-signature' },
  { key: 'Certificates', count: 89, icon: 'fa-award' }
];

const DOCUMENTS = [
  { id: 'doc-1', name: 'AI_Learning_System_Proposal.pdf', type: 'Proposal', department: 'IT', project: 'AI-Powered Learning System', uploadedBy: 'Maria Santos', date: 'Jan 15, 2024', size: '2.4 MB', action: 'Download' },
  { id: 'doc-2', name: 'Smart_Energy_Chapter1.docx', type: 'Manuscript', department: 'MET', project: 'Smart Energy Monitor', uploadedBy: 'John Reyes', date: 'Jan 28, 2024', size: '1.8 MB', action: 'Download' },
  { id: 'doc-3', name: 'Defense_Presentation_IT.pptx', type: 'Presentation', department: 'IT', project: 'AI-Powered Learning System', uploadedBy: 'Dr. Cruz', date: 'Feb 1, 2024', size: '5.2 MB', action: 'Download' },
  { id: 'doc-4', name: 'MOA_TechCorp_Signed.pdf', type: 'MOA', department: 'IT', project: 'AI Inventory System', uploadedBy: 'Research Head', date: 'Jan 10, 2024', size: '1.2 MB', action: 'Download' },
  { id: 'doc-5', name: 'Research_Certificate_IT.jpg', type: 'Certificate', department: 'IT', project: 'Research Ethics Training', uploadedBy: 'Maria Santos', date: 'Dec 15, 2023', size: '0.8 MB', action: 'View' }
];

export function AdminRepository() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('All Document Types');
  const [query, setQuery] = useState('');

  const filteredDocuments = useMemo(
    () =>
      DOCUMENTS.filter((document) => {
        const matchesDepartment = departmentFilter === 'All Departments' || document.department === departmentFilter;
        const matchesType = documentTypeFilter === 'All Document Types' || document.type === documentTypeFilter;
        const matchesQuery =
          document.name.toLowerCase().includes(query.toLowerCase()) ||
          document.project.toLowerCase().includes(query.toLowerCase());

        return matchesDepartment && matchesType && matchesQuery;
      }),
    [departmentFilter, documentTypeFilter, query]
  );

  return (
    <AdminShell
      activeNav="repository"
      title="Documents Repository"
      description="View uploaded thesis, capstone, MOA, presentation, and evidence documents for research oversight."
    >
      <div className="admin-page-stack">
        <div className="admin-toolbar compact">
            <div className="span-2">
              <select className="admin-toolbar-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option>All Departments</option>
                <option>IT</option>
                <option>MET</option>
                <option>TCM</option>
                <option>ESM</option>
                <option>NAME</option>
              </select>
            </div>
            <div className="span-2">
              <select className="admin-toolbar-select" value={documentTypeFilter} onChange={(event) => setDocumentTypeFilter(event.target.value)}>
                <option>All Document Types</option>
                <option>Proposal</option>
                <option>Manuscript</option>
                <option>Presentation</option>
                <option>MOA</option>
                <option>Certificate</option>
              </select>
            </div>
            <div className="span-2">
              <input
                className="admin-toolbar-input"
                placeholder="Search documents..."
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="span-3 admin-toolbar-actions">
              <button className="btn btn-outline" type="button">
                <i className="fas fa-file-pdf"></i>
                Export PDF
              </button>
              <button className="btn btn-outline" type="button">
                <i className="fas fa-file-excel"></i>
                Export Excel
              </button>
            </div>
          </div>

          <section className="admin-grid-4">
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Total Documents</span>
              <strong className="admin-kpi-value">1,247</strong>
              <span className="admin-kpi-meta">12.4 GB Storage</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Manuscripts</span>
              <strong className="admin-kpi-value">342</strong>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">MOAs</span>
              <strong className="admin-kpi-value">48</strong>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Presentations</span>
              <strong className="admin-kpi-value">156</strong>
            </article>
          </section>

          <section className="admin-folder-grid">
            {FOLDERS.map((folder) => (
              <article key={folder.key} className="admin-folder-card">
                <i className={`fas ${folder.icon}`}></i>
                <strong>{folder.key}</strong>
                <span className="admin-note">{folder.count} documents</span>
              </article>
            ))}
          </section>

          <section className="table-container">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Project</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr key={document.id}>
                      <td>{document.name}</td>
                      <td>{document.type}</td>
                      <td>
                        <span className="dept-badge">{document.department}</span>
                      </td>
                      <td>{document.project}</td>
                      <td>{document.uploadedBy}</td>
                      <td>{document.date}</td>
                      <td>{document.size}</td>
                      <td>
                        <div className="admin-action-row">
                          <button className="btn btn-outline small" type="button">
                            {document.action}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="admin-action-row" style={{ justifyContent: 'flex-end' }}>
            <div className="admin-pagination">
              <button className="active" type="button">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">Next</button>
            </div>
          </div>
      </div>
    </AdminShell>
  );
}
