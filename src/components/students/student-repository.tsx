'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import {
  LIBRARY_DOCUMENTS,
  LIBRARY_PROJECTS,
  type LibraryDepartment,
  type LibraryDocument,
  type LibraryProject,
  type LibraryProjectType,
  getDepartmentLabel,
  getProjectIcon
} from '@/components/library/library-data';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type RepositoryModalIntent = 'details' | 'download';
type RepositoryViewMode = 'scholar' | 'cards' | 'table';

const ITEMS_PER_PAGE = 6;

function matchesSearch(project: LibraryProject, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return (
    project.title.toLowerCase().includes(query) ||
    project.authors.join(' ').toLowerCase().includes(query) ||
    project.keywords.join(' ').toLowerCase().includes(query) ||
    project.abstract.toLowerCase().includes(query)
  );
}

function formatViewCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatAuthorLine(project: LibraryProject) {
  return project.authorsShort || project.authors.join(', ');
}

function formatStudyCitation(project: LibraryProject) {
  return `${formatAuthorLine(project)} - ${getDepartmentLabel(project.department)} - ${project.year} - Adviser: ${project.adviser}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildStudyDownloadContent(project: LibraryProject, documents: LibraryDocument[]) {
  const lines = [
    `Title: ${project.detailTitle || project.title}`,
    `Authors: ${project.authors.join(', ')}`,
    `Department: ${getDepartmentLabel(project.department)}`,
    `Year: ${project.year}`,
    `Project Type: ${project.type}`,
    `Adviser: ${project.adviser}`,
    `Views: ${formatViewCount(project.views)}`,
    '',
    'Abstract:',
    project.abstract,
    '',
    `Keywords: ${project.keywords.join(', ')}`
  ];

  if (project.technologies?.length) {
    lines.push('', `Technologies: ${project.technologies.join(', ')}`);
  }

  if (project.achievements?.length) {
    lines.push('', 'Achievements:');
    project.achievements.forEach((item) => lines.push(`- ${item}`));
  }

  if (project.transfer) {
    lines.push('', `Partner: ${project.transfer.partner}`, `Transfer Status: ${project.transfer.status}`, `Impact: ${project.transfer.impact}`);
  }

  if (documents.length) {
    lines.push('', 'Repository Documents:');
    documents.forEach((document) => lines.push(`- ${document.fileName} (${document.type}, ${document.size}, ${document.dateLabel})`));
  }

  return lines.join('\n');
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  return (
    <span className={`ui-badge is-${tone}`}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export function StudentRepository({ data: _data }: { data: StudentDashboardData }) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<'all' | LibraryDepartment>('all');
  const [year, setYear] = useState<'all' | string>('all');
  const [projectType, setProjectType] = useState<'all' | LibraryProjectType>('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<RepositoryViewMode>('scholar');
  const [currentPage, setCurrentPage] = useState(1);
  const [savedProjectIds, setSavedProjectIds] = useState<number[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [modalIntent, setModalIntent] = useState<RepositoryModalIntent>('details');

  const availableYears = useMemo(
    () => Array.from(new Set(LIBRARY_PROJECTS.map((project) => String(project.year)))).sort((left, right) => Number(right) - Number(left)),
    []
  );

  const documentsByProjectId = useMemo(
    () =>
      LIBRARY_DOCUMENTS.reduce<Record<number, LibraryDocument[]>>((accumulator, document) => {
        accumulator[document.projectId] = [...(accumulator[document.projectId] || []), document];
        return accumulator;
      }, {}),
    []
  );

  const filteredProjects = useMemo(
    () =>
      LIBRARY_PROJECTS.filter((project) => {
        if (department !== 'all' && project.department !== department) return false;
        if (year !== 'all' && String(project.year) !== year) return false;
        if (projectType !== 'all' && project.type !== projectType) return false;
        if (savedOnly && !savedProjectIds.includes(project.id)) return false;
        return matchesSearch(project, search);
      }),
    [department, projectType, savedOnly, savedProjectIds, search, year]
  );

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProjects = filteredProjects.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  useEffect(() => {
    document.body.classList.toggle('is-modal-open', Boolean(activeProjectId));
    return () => document.body.classList.remove('is-modal-open');
  }, [activeProjectId]);

  const totalStudies = LIBRARY_PROJECTS.length;
  const departmentCount = new Set(LIBRARY_PROJECTS.map((project) => project.department)).size;
  const newestYear = Math.max(...LIBRARY_PROJECTS.map((project) => project.year));
  const activeProject = LIBRARY_PROJECTS.find((project) => project.id === activeProjectId) || null;
  const activeProjectDocuments = activeProject ? documentsByProjectId[activeProject.id] || [] : [];
  const relatedProjects = activeProject?.relatedStudyIds
    ?.map((id) => LIBRARY_PROJECTS.find((project) => project.id === id) || null)
    .filter((project): project is LibraryProject => Boolean(project)) || [];

  const resetFilters = () => {
    setSearch('');
    setDepartment('all');
    setYear('all');
    setProjectType('all');
    setSavedOnly(false);
    setCurrentPage(1);
  };

  const toggleSaved = (projectId: number) => {
    setSavedProjectIds((current) => (current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]));
  };

  const openProjectModal = (projectId: number, intent: RepositoryModalIntent = 'details') => {
    setActiveProjectId(projectId);
    setModalIntent(intent);
  };

  const closeProjectModal = () => {
    setActiveProjectId(null);
    setModalIntent('details');
  };

  const downloadStudySummary = (project: LibraryProject) => {
    const content = buildStudyDownloadContent(project, documentsByProjectId[project.id] || []);
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugify(project.detailTitle || project.title)}-study-summary.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="student-repository-page">
      <header className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <div className="page-title-context">
              <span className="page-kicker">Student Workspace</span>
              <span className="page-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>Archive & Repository</span>
              </span>
            </div>
            <h1>Archive & Repository</h1>
            <p>Search prior studies, compare related work, and open a study modal before viewing details or downloading a summary record.</p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <section className="surface-card student-repository-overview-card">
          <div className="student-repository-overview-copy">
            <span className="section-kicker">Previous Studies</span>
            <h2>Search completed research in a reading-focused repository layout</h2>
            <p>Browse published projects in a scholar-style list, compare abstracts quickly, and open one study at a time when you need the full context.</p>

            <div className="workspace-note is-member">
              <strong>Repository access stays read-only for students.</strong>
              <p>Use the filters below to narrow the archive, compare related studies, and review the full record inside the modal before downloading.</p>
            </div>

            <div className="row-actions student-repository-overview-actions">
              <Link prefetch={false} className="btn btn-secondary" href="/students/project-overview">
                <i className="fas fa-folder-open" aria-hidden="true" /> Back to Project Overview
              </Link>
            </div>
          </div>

          <div className="student-repository-summary-grid">
            <article className="student-repository-summary-card"><span>Available Studies</span><strong>{totalStudies}</strong><small>Published capstone and thesis projects ready for browsing</small></article>
            <article className="student-repository-summary-card"><span>Departments</span><strong>{departmentCount}</strong><small>Academic areas represented in the repository collection</small></article>
            <article className="student-repository-summary-card"><span>Latest Cohort</span><strong>{newestYear}</strong><small>Most recent year currently available in the archive</small></article>
            <article className="student-repository-summary-card"><span>Saved Studies</span><strong>{savedProjectIds.length}</strong><small>Bookmarks you add while reviewing related studies in this session</small></article>
          </div>
        </section>

        <section className="content-grid student-repository-main-grid">
          <article className="surface-card student-repository-results-card">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Browse Repository</span>
                <h3>Repository results</h3>
                <p>Filter by department, year, project type, or keywords, then switch between scholar, card, or table view.</p>
              </div>
              <div className="student-repository-results-head-controls">
                <div className="chip-row student-repository-results-head-badges">
                  <Badge label={`${filteredProjects.length} result${filteredProjects.length === 1 ? '' : 's'}`} tone="info" />
                  <Badge label={`${savedProjectIds.length} saved`} tone={savedProjectIds.length ? 'warning' : 'neutral'} />
                </div>
                <div className="student-repository-view-toggle" role="tablist" aria-label="Repository view mode">
                  <button
                    aria-pressed={viewMode === 'scholar'}
                    className={`table-btn student-repository-view-toggle-btn ${viewMode === 'scholar' ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setViewMode('scholar')}
                  >
                    <i className="fas fa-grip-lines" aria-hidden="true" /> Scholar
                  </button>
                  <button
                    aria-pressed={viewMode === 'cards'}
                    className={`table-btn student-repository-view-toggle-btn ${viewMode === 'cards' ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setViewMode('cards')}
                  >
                    <i className="fas fa-table-cells-large" aria-hidden="true" /> Cards
                  </button>
                  <button
                    aria-pressed={viewMode === 'table'}
                    className={`table-btn student-repository-view-toggle-btn ${viewMode === 'table' ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setViewMode('table')}
                  >
                    <i className="fas fa-table-list" aria-hidden="true" /> Table
                  </button>
                </div>
              </div>
            </div>

            <div className="student-repository-toolbar">
              <div className="form-field student-repository-search-field">
                <label htmlFor="student-repository-search">Search</label>
                <div className="student-repository-search-input-wrap">
                  <i className="fas fa-magnifying-glass" aria-hidden="true" />
                  <input id="student-repository-search" type="text" placeholder="Search by title, author, keyword, or abstract" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="student-repository-department">Department</label>
                <select id="student-repository-department" value={department} onChange={(event) => { setDepartment(event.target.value as 'all' | LibraryDepartment); setCurrentPage(1); }}>
                  <option value="all">All Departments</option>
                  <option value="IT">{getDepartmentLabel('IT')}</option>
                  <option value="MET">{getDepartmentLabel('MET')}</option>
                  <option value="TCM">{getDepartmentLabel('TCM')}</option>
                  <option value="ESM">{getDepartmentLabel('ESM')}</option>
                  <option value="NAME">{getDepartmentLabel('NAME')}</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="student-repository-year">Year</label>
                <select id="student-repository-year" value={year} onChange={(event) => { setYear(event.target.value); setCurrentPage(1); }}>
                  <option value="all">All Years</option>
                  {availableYears.map((yearOption) => <option key={yearOption} value={yearOption}>{yearOption}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="student-repository-type">Project Type</label>
                <select id="student-repository-type" value={projectType} onChange={(event) => { setProjectType(event.target.value as 'all' | LibraryProjectType); setCurrentPage(1); }}>
                  <option value="all">All Types</option>
                  <option value="Web-Based">Web-Based</option>
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="IoT System">IoT System</option>
                  <option value="AI/ML System">AI/ML System</option>
                </select>
              </div>

              <div className="student-repository-toolbar-actions">
                <button
                  aria-pressed={savedOnly}
                  className={`btn btn-secondary student-repository-saved-toggle ${savedOnly ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => { setSavedOnly((current) => !current); setCurrentPage(1); }}
                >
                  <i className="fas fa-bookmark" aria-hidden="true" /> Saved only
                </button>
                <button className="btn btn-secondary student-repository-reset-btn" type="button" onClick={resetFilters}>
                  <i className="fas fa-rotate-left" aria-hidden="true" /> Reset Filters
                </button>
              </div>
            </div>

            {!filteredProjects.length ? (
              <div className="empty-state student-repository-empty-state">
                <span className="empty-state-icon"><i className={`fas ${savedOnly ? 'fa-bookmark' : 'fa-search'}`} aria-hidden="true" /></span>
                <strong>{savedOnly ? (savedProjectIds.length ? 'No saved studies match your filters' : 'No saved studies yet') : 'No previous study matches your filters'}</strong>
                <p>{savedOnly ? (savedProjectIds.length ? 'Try broadening the filters or turn off Saved only to continue browsing the full repository.' : 'Save studies first, then switch on Saved only to review your shortlist in one place.') : 'Clear or adjust the filters to browse the available capstone repository again.'}</p>
                <button className="btn btn-secondary" type="button" onClick={resetFilters}>
                  <i className="fas fa-rotate-left" aria-hidden="true" /> Reset Filters
                </button>
              </div>
            ) : viewMode === 'scholar' ? (
              <div className="student-repository-scholar-list">
                {paginatedProjects.map((project) => {
                  const isSaved = savedProjectIds.includes(project.id);
                  const documentCount = (documentsByProjectId[project.id] || []).length;

                  return (
                    <article key={project.id} className="student-repository-scholar-item">
                      <div className="student-repository-scholar-head">
                        <span className="student-repository-study-icon"><i className={`fas ${getProjectIcon(project.type)}`} aria-hidden="true" /></span>
                        <div className="student-repository-scholar-copy">
                          <button className="student-repository-scholar-title" type="button" onClick={() => openProjectModal(project.id, 'details')}>
                            {project.detailTitle || project.title}
                          </button>
                          <p className="student-repository-scholar-citation">{formatStudyCitation(project)}</p>
                          <p className="student-repository-scholar-summary">{project.abstract}</p>
                        </div>
                        <button aria-label={isSaved ? 'Remove from saved studies' : 'Save study'} className={`table-btn student-repository-save-btn ${isSaved ? 'is-saved' : ''}`} type="button" onClick={() => toggleSaved(project.id)}>
                          <i className="fas fa-bookmark" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="student-repository-study-badges">
                        <Badge label={project.type} tone="neutral" />
                        <Badge label={`${project.year}`} tone="success" />
                        {project.statusLabel ? <Badge label={project.statusLabel} tone="info" /> : null}
                        {isSaved ? <Badge label="Saved" tone="warning" icon="fa-bookmark" /> : null}
                      </div>

                      <div className="student-repository-scholar-meta">
                        <span><i className="fas fa-eye" aria-hidden="true" /> {formatViewCount(project.views)} views</span>
                        <span><i className="fas fa-folder-open" aria-hidden="true" /> {documentCount} repository file{documentCount === 1 ? '' : 's'}</span>
                        <span><i className="fas fa-building-columns" aria-hidden="true" /> {getDepartmentLabel(project.department)}</span>
                      </div>

                      <div className="student-repository-keyword-row">
                        {project.keywords.slice(0, 5).map((keyword) => <span key={keyword}>{keyword}</span>)}
                      </div>

                      <div className="student-repository-scholar-actions">
                        <button className="student-repository-scholar-action" type="button" onClick={() => openProjectModal(project.id, 'details')}>
                          <i className="fas fa-book-open" aria-hidden="true" /> View details
                        </button>
                        <button className="student-repository-scholar-action" type="button" onClick={() => openProjectModal(project.id, 'download')}>
                          <i className="fas fa-download" aria-hidden="true" /> Download
                        </button>
                        <button className="student-repository-scholar-action" type="button" onClick={() => toggleSaved(project.id)}>
                          <i className="fas fa-bookmark" aria-hidden="true" /> {isSaved ? 'Unsave' : 'Save'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : viewMode === 'cards' ? (
              <div className="student-repository-card-grid">
                {paginatedProjects.map((project) => {
                  const isSaved = savedProjectIds.includes(project.id);
                  const documentCount = (documentsByProjectId[project.id] || []).length;

                  return (
                    <article key={project.id} className="surface-card student-repository-card">
                      <div className="student-repository-card-head">
                        <span className="student-repository-study-icon"><i className={`fas ${getProjectIcon(project.type)}`} aria-hidden="true" /></span>
                        <button aria-label={isSaved ? 'Remove from saved studies' : 'Save study'} className={`table-btn student-repository-save-btn ${isSaved ? 'is-saved' : ''}`} type="button" onClick={() => toggleSaved(project.id)}>
                          <i className="fas fa-bookmark" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="student-repository-card-copy">
                        <button className="student-repository-card-title" type="button" onClick={() => openProjectModal(project.id, 'details')}>
                          {project.detailTitle || project.title}
                        </button>
                        <p className="student-repository-scholar-citation">{formatStudyCitation(project)}</p>
                        <p className="student-repository-card-summary">{project.abstract}</p>
                      </div>

                      <div className="student-repository-study-badges">
                        <Badge label={project.type} tone="neutral" />
                        <Badge label={`${project.year}`} tone="success" />
                        {project.statusLabel ? <Badge label={project.statusLabel} tone="info" /> : null}
                        {isSaved ? <Badge label="Saved" tone="warning" icon="fa-bookmark" /> : null}
                      </div>

                      <div className="student-repository-scholar-meta student-repository-card-meta">
                        <span><i className="fas fa-eye" aria-hidden="true" /> {formatViewCount(project.views)} views</span>
                        <span><i className="fas fa-folder-open" aria-hidden="true" /> {documentCount} file{documentCount === 1 ? '' : 's'}</span>
                      </div>

                      <div className="student-repository-keyword-row">
                        {project.keywords.slice(0, 4).map((keyword) => <span key={keyword}>{keyword}</span>)}
                      </div>

                      <div className="row-actions student-repository-card-actions">
                        <button className="table-btn" type="button" onClick={() => openProjectModal(project.id, 'details')}>
                          <i className="fas fa-book-open" aria-hidden="true" /> Details
                        </button>
                        <button className="table-btn" type="button" onClick={() => openProjectModal(project.id, 'download')}>
                          <i className="fas fa-download" aria-hidden="true" /> Download
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="table-shell student-repository-table-shell">
                <table className="data-table student-repository-table">
                  <thead>
                    <tr>
                      <th>Study</th>
                      <th>Department</th>
                      <th>Type</th>
                      <th>Year</th>
                      <th>Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.map((project) => {
                      const isSaved = savedProjectIds.includes(project.id);
                      const documentCount = (documentsByProjectId[project.id] || []).length;

                      return (
                        <tr key={project.id}>
                          <td>
                            <div className="table-title-cell student-repository-table-title-cell">
                              <span className="student-repository-study-icon"><i className={`fas ${getProjectIcon(project.type)}`} aria-hidden="true" /></span>
                              <div className="student-repository-table-title-copy">
                                <button className="student-repository-table-title" type="button" onClick={() => openProjectModal(project.id, 'details')}>
                                  {project.detailTitle || project.title}
                                </button>
                                <small>{formatAuthorLine(project)}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{getDepartmentLabel(project.department)}</strong>
                            <small>{project.department}</small>
                          </td>
                          <td>
                            <strong>{project.type}</strong>
                            <small>{project.statusLabel || 'Published study'}</small>
                          </td>
                          <td>
                            <strong>{project.year}</strong>
                            <small>{project.adviser}</small>
                          </td>
                          <td>
                            <div className="student-repository-table-metrics">
                              <span>{formatViewCount(project.views)} views</span>
                              <span>{documentCount} file{documentCount === 1 ? '' : 's'}</span>
                              {isSaved ? <span>Saved</span> : null}
                            </div>
                          </td>
                          <td>
                            <div className="row-actions student-repository-table-actions">
                              <button className="table-btn" type="button" onClick={() => openProjectModal(project.id, 'details')}>
                                Details
                              </button>
                              <button className="table-btn" type="button" onClick={() => openProjectModal(project.id, 'download')}>
                                Download
                              </button>
                              <button className={`table-btn ${isSaved ? 'is-danger' : ''}`} type="button" onClick={() => toggleSaved(project.id)}>
                                {isSaved ? 'Unsave' : 'Save'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredProjects.length ? (
              <div className="student-repository-pagination">
                <button className="btn btn-secondary" type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                  <i className="fas fa-arrow-left" aria-hidden="true" /> Previous
                </button>
                <div className="student-repository-pagination-pages">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button key={pageNumber} className={`table-btn ${pageNumber === safeCurrentPage ? 'is-active' : ''}`} type="button" onClick={() => setCurrentPage(pageNumber)}>
                      {pageNumber}
                    </button>
                  ))}
                </div>
                <button className="btn btn-secondary" type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                  Next <i className="fas fa-arrow-right" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </article>
        </section>
      </div>

      {activeProject && typeof document !== 'undefined' ? createPortal(
        <div className="modal-shell is-open" style={{ zIndex: 9999 }}>
          <button className="modal-backdrop" type="button" aria-label="Close study details" onClick={closeProjectModal} />
          <div className="modal-card student-repository-modal-card" role="dialog" aria-modal="true" aria-labelledby="student-repository-modal-title">
            <button className="modal-close" type="button" aria-label="Close study details" onClick={closeProjectModal}>
              <i className="fas fa-xmark" aria-hidden="true" />
            </button>
            <div className="modal-content student-repository-modal-content">
              <div className="card-heading student-repository-modal-head">
                <div>
                  <span className="section-kicker">{modalIntent === 'download' ? 'Download Study' : 'Study Details'}</span>
                  <h3 id="student-repository-modal-title">{activeProject.detailTitle || activeProject.title}</h3>
                  <p>{modalIntent === 'download' ? 'Review the study details before downloading its repository summary.' : 'Review the study overview, repository records, and related work before using it in your capstone review.'}</p>
                </div>
                <div className="chip-row">
                  <Badge label={activeProject.type} tone="neutral" />
                  <Badge label={`${activeProject.year}`} tone="success" />
                  {savedProjectIds.includes(activeProject.id) ? <Badge label="Saved" tone="warning" icon="fa-bookmark" /> : null}
                </div>
              </div>

              <div className="student-repository-modal-citation">
                <strong>{formatAuthorLine(activeProject)}</strong>
                <span>{getDepartmentLabel(activeProject.department)} - Adviser: {activeProject.adviser}</span>
              </div>

              <div className="student-repository-modal-summary">
                <article><span>Department</span><strong>{getDepartmentLabel(activeProject.department)}</strong><small>{activeProject.department}</small></article>
                <article><span>Views</span><strong>{formatViewCount(activeProject.views)}</strong><small>Repository reads</small></article>
                <article><span>Project Type</span><strong>{activeProject.type}</strong><small>Study classification</small></article>
                <article><span>Repository Files</span><strong>{activeProjectDocuments.length}</strong><small>Available study records</small></article>
              </div>

              <section className="student-repository-modal-section">
                <h4>Abstract</h4>
                <p>{activeProject.abstract}</p>
              </section>

              <section className="student-repository-modal-section">
                <h4>Keywords</h4>
                <div className="student-repository-keyword-row">
                  {activeProject.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
                </div>
              </section>

              {activeProject.technologies?.length ? (
                <section className="student-repository-modal-section">
                  <h4>Technologies Used</h4>
                  <div className="student-repository-keyword-row">
                    {activeProject.technologies.map((technology) => <span key={technology}>{technology}</span>)}
                  </div>
                </section>
              ) : null}

              {activeProject.achievements?.length ? (
                <section className="student-repository-modal-section">
                  <h4>Achievements</h4>
                  <div className="student-repository-modal-list">
                    {activeProject.achievements.map((achievement) => (
                      <div key={achievement} className="student-repository-modal-list-item">
                        <i className="fas fa-award" aria-hidden="true" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {activeProject.transfer ? (
                <section className="student-repository-modal-section">
                  <h4>Deployment and Transfer</h4>
                  <div className="student-repository-modal-summary">
                    <article><span>Partner</span><strong>{activeProject.transfer.partner}</strong><small>Receiving organization</small></article>
                    <article><span>Status</span><strong>{activeProject.transfer.status}</strong><small>Current transfer stage</small></article>
                    <article className="is-wide"><span>Impact</span><strong>{activeProject.transfer.impact}</strong><small>Reported implementation outcome</small></article>
                  </div>
                </section>
              ) : null}

              <section className="student-repository-modal-section">
                <h4>Repository Documents</h4>
                {activeProjectDocuments.length ? (
                  <div className="student-repository-modal-doc-list">
                    {activeProjectDocuments.map((document) => (
                      <div key={document.id} className="student-repository-modal-doc-item">
                        <div>
                          <strong>{document.fileName}</strong>
                          <small>{document.type} - {document.size} - {document.dateLabel}</small>
                        </div>
                        <span>{document.categoryLabel}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="reading-copy">No repository files are listed for this study yet.</p>
                )}
              </section>

              {relatedProjects.length ? (
                <section className="student-repository-modal-section">
                  <h4>Related Studies</h4>
                  <div className="student-repository-modal-related-list">
                    {relatedProjects.map((project) => (
                      <button key={project.id} className="student-repository-modal-related-btn" type="button" onClick={() => openProjectModal(project.id, 'details')}>
                        <strong>{project.title}</strong>
                        <small>{project.year} - {getDepartmentLabel(project.department)}</small>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="row-actions student-repository-modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => toggleSaved(activeProject.id)}>
                  <i className="fas fa-bookmark" aria-hidden="true" /> {savedProjectIds.includes(activeProject.id) ? 'Unsave Study' : 'Save Study'}
                </button>
                <button className="btn btn-primary" type="button" onClick={() => downloadStudySummary(activeProject)}>
                  <i className="fas fa-download" aria-hidden="true" /> Download Study Summary
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
