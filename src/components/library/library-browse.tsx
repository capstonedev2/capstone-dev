'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LIBRARY_PROJECTS,
  type LibraryDepartment,
  type LibraryProject,
  type LibraryProjectType,
  getProjectIcon
} from '@/components/library/library-data';
import { LibraryDepartmentBadge } from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

const ITEMS_PER_PAGE = 6;

function matchesSearch(project: LibraryProject, search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return (
    project.title.toLowerCase().includes(query) ||
    project.authors.join(' ').toLowerCase().includes(query) ||
    project.keywords.join(' ').toLowerCase().includes(query)
  );
}

export function LibraryBrowse() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [department, setDepartment] = useState<'all' | LibraryDepartment>('all');
  const [year, setYear] = useState<'all' | string>('all');
  const [projectType, setProjectType] = useState<'all' | LibraryProjectType>('all');
  const [view, setView] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [savedProjectIds, setSavedProjectIds] = useState<number[]>(
    LIBRARY_PROJECTS.filter((project) => project.savedByDefault).map((project) => project.id)
  );

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setCurrentPage(1);
  }, [searchParams]);

  const filteredProjects = LIBRARY_PROJECTS.filter((project) => {
    if (department !== 'all' && project.department !== department) {
      return false;
    }

    if (year !== 'all' && String(project.year) !== year) {
      return false;
    }

    if (projectType !== 'all' && project.type !== projectType) {
      return false;
    }

    return matchesSearch(project, search);
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProjects = filteredProjects.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  function toggleSaved(projectId: number) {
    setSavedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId]
    );
  }

  return (
    <LibraryShell
      activeNav="browse"
      title="Browse Repository"
      description="Search and discover completed research projects"
    >
      <section className="library-section-card">
        <div className="library-section-body">
          <div className="library-filter-bar">
            <div className="library-filter-field">
              <label htmlFor="library-search">Search</label>
              <input
                id="library-search"
                placeholder="Search by title, author, or keyword..."
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="library-filter-field">
              <label htmlFor="library-department">Department</label>
              <select
                id="library-department"
                value={department}
                onChange={(event) => {
                  setDepartment(event.target.value as 'all' | LibraryDepartment);
                  setCurrentPage(1);
                }}
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
              <label htmlFor="library-year">Year</label>
              <select
                id="library-year"
                value={year}
                onChange={(event) => {
                  setYear(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>

            <div className="library-filter-field">
              <label htmlFor="library-type">Project Type</label>
              <select
                id="library-type"
                value={projectType}
                onChange={(event) => {
                  setProjectType(event.target.value as 'all' | LibraryProjectType);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Types</option>
                <option value="Web-Based">Web-Based</option>
                <option value="Mobile Application">Mobile Application</option>
                <option value="IoT System">IoT System</option>
                <option value="AI/ML System">AI/ML System</option>
              </select>
            </div>

            <div className="library-filter-field">
              <label>View</label>
              <div className="library-card-actions">
                <button
                  className={`library-btn ${view === 'card' ? 'is-primary' : 'is-outline'} is-small`}
                  type="button"
                  onClick={() => setView('card')}
                >
                  <i className="fas fa-th-large" aria-hidden="true" />
                  Card
                </button>
                <button
                  className={`library-btn ${view === 'table' ? 'is-primary' : 'is-outline'} is-small`}
                  type="button"
                  onClick={() => setView('table')}
                >
                  <i className="fas fa-list" aria-hidden="true" />
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!filteredProjects.length ? (
        <div className="library-empty-state">
          <span className="library-empty-state-icon">
            <i className="fas fa-search" aria-hidden="true" />
          </span>
          <strong>No projects found</strong>
          <p>Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      ) : view === 'card' ? (
        <div className="library-feature-grid">
          {paginatedProjects.map((project) => {
            const isSaved = savedProjectIds.includes(project.id);

            return (
              <article className="library-feature-card is-left" key={project.id}>
                <div className="library-feature-top">
                  <span className="library-feature-icon">
                    <i className={`fas ${getProjectIcon(project.type)}`} aria-hidden="true" />
                  </span>
                  <button
                    aria-label={isSaved ? 'Remove from saved projects' : 'Save project'}
                    className="library-btn is-outline is-small"
                    type="button"
                    onClick={() => toggleSaved(project.id)}
                  >
                    <i className="fas fa-bookmark" aria-hidden="true" />
                  </button>
                </div>
                <h3>{project.title}</h3>
                <LibraryDepartmentBadge>{project.department}</LibraryDepartmentBadge>
                <p>
                  <strong>Authors:</strong> {project.authors.join(', ')}
                </p>
                <p>
                  <small>
                    Adviser: {project.adviser} | {project.year}
                  </small>
                </p>
                <p>
                  <small>Type: {project.type}</small>
                </p>
                <div className="library-card-actions">
                  <Link
                    className="library-btn is-outline is-small"
                    href={`/library/project-details?id=${project.id}`}
                  >
                    View Details
                  </Link>
                  {isSaved ? <span className="library-note">Saved</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="library-section-card">
          <div className="library-section-body">
            <div className="library-table-wrap">
              <table className="library-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Authors</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Adviser</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <strong>{project.title}</strong>
                      </td>
                      <td>{project.authors.join(', ')}</td>
                      <td>
                        <LibraryDepartmentBadge>{project.department}</LibraryDepartmentBadge>
                      </td>
                      <td>{project.year}</td>
                      <td>{project.adviser}</td>
                      <td className="is-actions">
                        <Link
                          className="library-btn is-outline is-small"
                          href={`/library/project-details?id=${project.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {filteredProjects.length ? (
        <div className="library-pagination">
          <button
            disabled={safeCurrentPage === 1}
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              className={pageNumber === safeCurrentPage ? 'is-active' : ''}
              key={pageNumber}
              type="button"
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            disabled={safeCurrentPage === totalPages}
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </LibraryShell>
  );
}
