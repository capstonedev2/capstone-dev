import Link from 'next/link';
import {
  LIBRARY_DEPARTMENT_SUMMARY,
  LIBRARY_PROJECTS,
  LIBRARY_RECENT_STUDIES,
  getProjectIcon
} from '@/components/library/library-data';
import { LibraryDepartmentBadge, LibraryStatCard } from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

function getTopProject() {
  return [...LIBRARY_PROJECTS].sort((left, right) => right.views - left.views)[0] ?? LIBRARY_PROJECTS[0];
}

export function LibraryDashboard() {
  const featuredProjects = LIBRARY_PROJECTS.slice(0, 3);
  const topProject = getTopProject();

  return (
    <LibraryShell
      activeNav="dashboard"
      title="Thesis & Capstone Repository"
      description="Access completed research projects from all departments"
    >
      <section className="library-section-card">
        <div className="library-section-body">
          <form action="/library/browse" className="library-search-hero">
            <input
              aria-label="Search repository"
              name="search"
              placeholder="Search by title, author, or keyword..."
              type="text"
            />
            <button className="library-btn is-primary" type="submit">
              <i className="fas fa-search" aria-hidden="true" />
              Search Repository
            </button>
          </form>
        </div>
      </section>

      <div className="library-stat-grid">
        <LibraryStatCard title="Published Projects" value="342">
          <p>Across 5 departments</p>
        </LibraryStatCard>
        <LibraryStatCard title="New This Month" value="18">
          <p>+4 from last month</p>
        </LibraryStatCard>
        <LibraryStatCard title="Most Viewed" value={topProject.title}>
          <p>{topProject.views.toLocaleString()} views</p>
        </LibraryStatCard>
        <LibraryStatCard title="Available Downloads" value="342">
          <p>Full manuscripts</p>
        </LibraryStatCard>
      </div>

      <div className="library-stat-grid">
        {LIBRARY_DEPARTMENT_SUMMARY.map((department) => (
          <LibraryStatCard
            key={department.department}
            title={department.label}
            value={department.count}
          >
            <p>
              <LibraryDepartmentBadge>{department.department}</LibraryDepartmentBadge>{' '}
              Published Projects
            </p>
            <div className="library-progress-track">
              <div
                className="library-progress-fill"
                style={{ width: `${Math.min(department.count, 100)}%` }}
              />
            </div>
          </LibraryStatCard>
        ))}
      </div>

      <section className="library-section-card">
        <div className="library-section-head">
          <h3>Featured Research Projects</h3>
          <Link className="library-btn is-outline is-small" href="/library/browse">
            View All
          </Link>
        </div>
        <div className="library-section-body">
          <div className="library-feature-grid">
            {featuredProjects.map((project) => (
              <article className="library-feature-card is-left" key={project.id}>
                <div className="library-feature-top">
                  <span className="library-feature-icon">
                    <i className={`fas ${getProjectIcon(project.type)}`} aria-hidden="true" />
                  </span>
                  <LibraryDepartmentBadge>{project.department}</LibraryDepartmentBadge>
                </div>
                <h3>{project.title}</h3>
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
        </div>
      </section>

      <section className="library-section-card">
        <div className="library-section-head">
          <h3>Recently Added Studies</h3>
        </div>
        <div className="library-section-body">
          <div className="library-table-wrap">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Authors</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {LIBRARY_RECENT_STUDIES.map((study) => (
                  <tr key={study.projectId}>
                    <td>{study.title}</td>
                    <td>
                      <LibraryDepartmentBadge>{study.department}</LibraryDepartmentBadge>
                    </td>
                    <td>{study.authors}</td>
                    <td>{study.year}</td>
                    <td className="is-actions">
                      <Link
                        className="library-btn is-outline is-small"
                        href={`/library/project-details?id=${study.projectId}`}
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
    </LibraryShell>
  );
}
