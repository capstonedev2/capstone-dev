'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LIBRARY_PROJECTS, getProjectIcon } from '@/components/library/library-data';
import { LibraryDepartmentBadge, LibraryStatCard } from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

export function LibrarySaved() {
  const [savedProjectIds, setSavedProjectIds] = useState<number[]>(
    LIBRARY_PROJECTS.filter((project) => project.savedByDefault).map((project) => project.id)
  );

  const savedProjects = LIBRARY_PROJECTS.filter((project) => savedProjectIds.includes(project.id));

  return (
    <LibraryShell
      activeNav="saved"
      title="Saved Projects"
      description="Your bookmarked research projects"
    >
      <div className="library-stat-grid">
        <LibraryStatCard title="Saved Projects" value={savedProjects.length} />
        <LibraryStatCard title="Last Saved" value="Feb 12, 2024" />
        <LibraryStatCard title="Collections" value="2">
          <div className="library-card-actions">
            <button className="library-btn is-outline is-small" type="button">
              Manage
            </button>
          </div>
        </LibraryStatCard>
      </div>

      {savedProjects.length ? (
        <div className="library-feature-grid">
          {savedProjects.map((project) => (
            <article className="library-feature-card is-left" key={project.id}>
              <div className="library-feature-top">
                <span className="library-feature-icon">
                  <i className={`fas ${getProjectIcon(project.type)}`} aria-hidden="true" />
                </span>
                <button
                  className="library-btn is-outline is-small"
                  type="button"
                  onClick={() =>
                    setSavedProjectIds((current) => current.filter((id) => id !== project.id))
                  }
                >
                  <i className="fas fa-trash" aria-hidden="true" />
                  Remove
                </button>
              </div>
              <h3>{project.title}</h3>
              <LibraryDepartmentBadge>{project.department}</LibraryDepartmentBadge>
              <p>{project.authors.join(', ')}</p>
              <p>
                <small>
                  Adviser: {project.adviser} | {project.year}
                </small>
              </p>
              <div className="library-card-actions">
                <Link
                  className="library-btn is-outline is-small"
                  href={`/library/project-details?id=${project.id}`}
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="library-empty-state">
          <span className="library-empty-state-icon">
            <i className="fas fa-bookmark" aria-hidden="true" />
          </span>
          <strong>No saved projects yet</strong>
          <p>Browse the repository and save projects you want to revisit later.</p>
          <Link className="library-btn is-primary" href="/library/browse">
            Browse Projects
          </Link>
        </div>
      )}
    </LibraryShell>
  );
}
