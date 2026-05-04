'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const INVENTORY_RECORDS = [
  {
    id: 'CAP-IT-2025-014',
    title: 'AI-Powered Learning Management System with Predictive Analytics',
    department: 'IT',
    program: 'BSIT',
    adviser: 'Dr. Ricardo Cruz',
    year: '2025',
    status: 'Active',
    statusClass: 'status-info',
    milestone: 'Final technical review',
    progressValue: 78,
    delayed: false,
    keywords: 'AI, Education, Predictive Analytics',
    partner: 'CDO Learning Resource Center',
    transferStatus: 'Under Review',
    transferStatusClass: 'status-review',
    similarity: '12% match',
    documents: [
      { name: 'CAP-IT-2025-014-Manuscript.pdf', type: 'Manuscript', uploadedBy: 'Maria Santos', uploadedAt: 'Jan 15, 2025' },
      { name: 'Predictive-Analytics-Dataset.xlsx', type: 'Dataset', uploadedBy: 'Dr. Ricardo Cruz', uploadedAt: 'Jan 18, 2025' },
      { name: 'Final-Defense-Presentation.pptx', type: 'Presentation', uploadedBy: 'Research Group', uploadedAt: 'Jan 22, 2025' }
    ]
  },
  {
    id: 'CAP-MET-2025-021',
    title: 'Smart Solar Energy Monitoring System',
    department: 'MET',
    program: 'BSMET',
    adviser: 'Prof. Maria Ramos',
    year: '2025',
    status: 'Pending Review',
    statusClass: 'status-pending',
    milestone: 'Pilot testing validation',
    progressValue: 60,
    delayed: true,
    keywords: 'Solar, IoT, Energy Efficiency',
    partner: 'GreenEnergy PH',
    transferStatus: 'Matched',
    transferStatusClass: 'status-success',
    similarity: '8% match',
    documents: [
      { name: 'Pilot-Test-Checklist.pdf', type: 'Evidence', uploadedBy: 'Prof. Maria Ramos', uploadedAt: 'Jan 28, 2025' },
      { name: 'Solar-Monitoring-Chapter4.docx', type: 'Manuscript', uploadedBy: 'John Reyes', uploadedAt: 'Feb 2, 2025' }
    ]
  },
  {
    id: 'CAP-TCM-2025-008',
    title: 'Herbal Medicine Knowledge Portal',
    department: 'TCM',
    program: 'BSTCM',
    adviser: 'Dr. Anna Reyes',
    year: '2025',
    status: 'At Risk',
    statusClass: 'status-critical',
    milestone: 'Chapter 1-3 revision',
    progressValue: 42,
    delayed: true,
    keywords: 'Knowledge Management, Herbal Medicine, Repository',
    partner: '',
    transferStatus: 'Not Tagged',
    transferStatusClass: 'status-neutral',
    similarity: '19% match',
    documents: [
      { name: 'Revision-Memo.pdf', type: 'Review Note', uploadedBy: 'Dr. Anna Reyes', uploadedAt: 'Feb 4, 2025' },
      { name: 'Chapter-1-3-Draft.docx', type: 'Manuscript', uploadedBy: 'Research Group', uploadedAt: 'Feb 7, 2025' }
    ]
  },
  {
    id: 'CAP-ESM-2025-017',
    title: 'Sustainable Agriculture IoT System',
    department: 'ESM',
    program: 'BSESM',
    adviser: 'Prof. Jose Lopez',
    year: '2025',
    status: 'Active',
    statusClass: 'status-info',
    milestone: 'Implementation',
    progressValue: 82,
    delayed: false,
    keywords: 'Agriculture, IoT, Sustainability',
    partner: 'Lumbia Farmers Cooperative',
    transferStatus: 'Deployed',
    transferStatusClass: 'status-approved',
    similarity: '10% match',
    documents: [
      { name: 'Deployment-Photos.zip', type: 'Evidence', uploadedBy: 'Prof. Jose Lopez', uploadedAt: 'Feb 11, 2025' },
      { name: 'Utilization-Report.pdf', type: 'Impact Report', uploadedBy: 'Tech Transfer Officer', uploadedAt: 'Feb 13, 2025' }
    ]
  },
  {
    id: 'CAP-NAME-2024-011',
    title: 'Marine Pollution Detection Drone',
    department: 'NAME',
    program: 'BSNAME',
    adviser: 'Dr. Elena Aquino',
    year: '2024',
    status: 'Completed',
    statusClass: 'status-approved',
    milestone: 'Output archived',
    progressValue: 96,
    delayed: false,
    keywords: 'Drone, Marine, Pollution Detection',
    partner: 'OceanTech Inc.',
    transferStatus: 'In Use',
    transferStatusClass: 'status-info',
    similarity: '6% match',
    documents: [
      { name: 'Signed-MOA-OceanTech.pdf', type: 'MOA', uploadedBy: 'Research Head Office', uploadedAt: 'Dec 6, 2024' },
      { name: 'Post-Adoption-Feedback.pdf', type: 'Partner Feedback', uploadedBy: 'OceanTech Inc.', uploadedAt: 'Jan 10, 2025' }
    ]
  }
];

const DEPARTMENT_OPTIONS = ['All Departments', 'IT', 'MET', 'TCM', 'ESM', 'NAME'];
const YEAR_OPTIONS = ['All Years', '2025', '2024'];
const STATUS_OPTIONS = ['All Statuses', 'Active', 'Pending Review', 'At Risk', 'Completed'];

type InventoryRecord = (typeof INVENTORY_RECORDS)[number];

export function AdminProjects() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [adviserFilter, setAdviserFilter] = useState('All Advisers');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [academicYear, setAcademicYear] = useState('All Years');
  const [query, setQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const adviserOptions = useMemo(
    () => ['All Advisers', ...Array.from(new Set(INVENTORY_RECORDS.map((record) => record.adviser))).sort()],
    []
  );

  const filteredRecords = useMemo(
    () =>
      INVENTORY_RECORDS.filter((record) => {
        const normalizedQuery = query.trim().toLowerCase();
        const matchesDepartment = departmentFilter === 'All Departments' || record.department === departmentFilter;
        const matchesAdviser = adviserFilter === 'All Advisers' || record.adviser === adviserFilter;
        const matchesStatus = statusFilter === 'All Statuses' || record.status === statusFilter;
        const matchesYear = academicYear === 'All Years' || record.year === academicYear;
        const matchesQuery =
          !normalizedQuery ||
          record.title.toLowerCase().includes(normalizedQuery) ||
          record.keywords.toLowerCase().includes(normalizedQuery) ||
          record.adviser.toLowerCase().includes(normalizedQuery) ||
          record.id.toLowerCase().includes(normalizedQuery);

        return matchesDepartment && matchesAdviser && matchesStatus && matchesYear && matchesQuery;
      }),
    [academicYear, adviserFilter, departmentFilter, query, statusFilter]
  );

  const selectedRecord = INVENTORY_RECORDS.find((record) => record.id === selectedRecordId) ?? null;
  const activeProjects = INVENTORY_RECORDS.filter((record) => record.status === 'Active').length;
  const atRiskProjects = INVENTORY_RECORDS.filter((record) => record.delayed || record.status === 'At Risk').length;
  const documentCount = INVENTORY_RECORDS.reduce((sum, record) => sum + record.documents.length, 0);
  const transferTagged = INVENTORY_RECORDS.filter((record) => record.transferStatus !== 'Not Tagged').length;

  return (
    <>
      <AdminShell
        activeNav="projects"
        title="Project Inventory"
        description="View all thesis and capstone projects, monitor progress, and inspect uploaded research documents."
      >
        <div className="admin-page-stack">
          <section className="admin-grid-4">
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Inventory Records</span>
              <strong className="admin-kpi-value">{INVENTORY_RECORDS.length}</strong>
              <span className="admin-kpi-meta">All thesis and capstone records in this oversight view.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Active Projects</span>
              <strong className="admin-kpi-value">{activeProjects}</strong>
              <span className="admin-kpi-meta">Projects still moving through milestone review.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">At Risk / Delayed</span>
              <strong className="admin-kpi-value">{atRiskProjects}</strong>
              <span className="admin-kpi-meta">Records requiring Research Head follow-up.</span>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Uploaded Documents</span>
              <strong className="admin-kpi-value">{documentCount}</strong>
              <span className="admin-kpi-meta">{transferTagged} projects tagged for transfer review.</span>
            </article>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-body">
              <div className="admin-toolbar compact">
                <div className="span-3 admin-toolbar-field">
                  <label>Search</label>
                  <input
                    className="admin-toolbar-input"
                    placeholder="Search title, adviser, code, or keywords..."
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <div className="span-2 admin-toolbar-field">
                  <label>Department</label>
                  <select className="admin-toolbar-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                    {DEPARTMENT_OPTIONS.map((department) => <option key={department}>{department}</option>)}
                  </select>
                </div>
                <div className="span-2 admin-toolbar-field">
                  <label>Adviser</label>
                  <select className="admin-toolbar-select" value={adviserFilter} onChange={(event) => setAdviserFilter(event.target.value)}>
                    {adviserOptions.map((adviser) => <option key={adviser}>{adviser}</option>)}
                  </select>
                </div>
                <div className="span-2 admin-toolbar-field">
                  <label>Status</label>
                  <select className="admin-toolbar-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="span-1 admin-toolbar-field">
                  <label>Year</label>
                  <select className="admin-toolbar-select" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
                    {YEAR_OPTIONS.map((year) => <option key={year}>{year}</option>)}
                  </select>
                </div>
                <div className="span-2 admin-toolbar-actions">
                  <button className="btn btn-outline" type="button">
                    <i className="fas fa-file-pdf"></i>
                    PDF
                  </button>
                  <button className="btn btn-outline" type="button">
                    <i className="fas fa-file-excel"></i>
                    Excel
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Inventory Directory</h3>
                <p>Search and filter by department, adviser, status, and academic year. Open a project to view details and uploaded files.</p>
              </div>
              <span className="status-badge status-info">{filteredRecords.length} shown</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Project</th>
                    <th>Department</th>
                    <th>Adviser</th>
                    <th>Status</th>
                    <th>Milestone Progress</th>
                    <th>Transfer</th>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>
                        <span className="table-title">{record.title}</span>
                        <span className="table-subtitle">{record.keywords}</span>
                      </td>
                      <td><span className="dept-badge">{record.department}</span></td>
                      <td>{record.adviser}</td>
                      <td>
                        <span className={`status-badge ${record.statusClass}`}>{record.status}</span>
                        {record.delayed ? <span className="table-subtitle">Delayed milestone</span> : null}
                      </td>
                      <td>
                        <div className="admin-metric-row">
                          <span>{record.milestone}</span>
                          <div className="admin-progress-track">
                            <div className="admin-progress-bar" style={{ width: `${record.progressValue}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`status-badge ${record.transferStatusClass}`}>{record.transferStatus}</span></td>
                      <td>{record.documents.length} files</td>
                      <td>
                        <button className="btn btn-outline small" type="button" onClick={() => setSelectedRecordId(record.id)}>
                          <i className="fas fa-folder-open"></i>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredRecords.length ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="admin-empty-state">No projects match the current filters.</div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </AdminShell>

      {selectedRecord ? (
        <ProjectDetailsModal record={selectedRecord} onClose={() => setSelectedRecordId(null)} />
      ) : null}
    </>
  );
}

function ProjectDetailsModal({
  record,
  onClose
}: {
  record: InventoryRecord;
  onClose: () => void;
}) {
  return (
    <div className="modal show" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>Project Details</h3>
            <p>{record.id} | {record.department} | AY {record.year}</p>
          </div>
          <button className="close-modal" type="button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="admin-page-stack">
            <section>
              <span className={`status-badge ${record.statusClass}`}>{record.status}</span>
              <h2 style={{ marginTop: '0.8rem', fontSize: '1.45rem', fontWeight: 800 }}>{record.title}</h2>
              <p className="admin-note" style={{ marginTop: '0.45rem' }}>{record.keywords}</p>
            </section>

            <div className="admin-profile-detail-grid">
              {[
                ['Department', record.department],
                ['Program', record.program],
                ['Adviser', record.adviser],
                ['Academic Year', record.year],
                ['Partner', record.partner || 'Not yet matched'],
                ['Similarity', record.similarity]
              ].map(([label, value]) => (
                <div key={label} className="admin-profile-detail-item">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Milestone Progress</h3>
                  <p>{record.milestone}</p>
                </div>
                <span className={`status-badge ${record.delayed ? 'status-critical' : 'status-approved'}`}>
                  {record.delayed ? 'Delayed / At Risk' : 'On Track'}
                </span>
              </div>
              <div className="admin-section-body">
                <div className="admin-progress-track">
                  <div className="admin-progress-bar" style={{ width: `${record.progressValue}%` }}></div>
                </div>
                <span className="admin-note">{record.progressValue}% completed</span>
              </div>
            </section>

            <section className="admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h3>Uploaded Files and Documents</h3>
                  <p>Research Head can view the files attached to the project record.</p>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Type</th>
                      <th>Uploaded By</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.documents.map((document) => (
                      <tr key={document.name}>
                        <td>{document.name}</td>
                        <td>{document.type}</td>
                        <td>{document.uploadedBy}</td>
                        <td>{document.uploadedAt}</td>
                        <td>
                          <button className="btn btn-outline small" type="button">
                            <i className="fas fa-eye"></i>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
