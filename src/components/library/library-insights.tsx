import Link from 'next/link';
import {
  LIBRARY_DEPARTMENT_SUMMARY,
  LIBRARY_EMERGING_TOPICS,
  LIBRARY_KEYWORD_TRENDS,
  LIBRARY_RECOMMENDED_READING,
  LIBRARY_YEAR_COUNTS
} from '@/components/library/library-data';
import { LibraryDepartmentBadge, LibraryTag } from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

const RESEARCH_GAPS = [
  'Limited research on AI ethics in education',
  'Few studies on circular economy in ESM',
  'Need for more maritime AI applications'
] as const;

const SUGGESTED_TOPICS = [
  'Explainable AI for educational systems',
  'Blockchain for supply chain transparency',
  'Renewable energy integration with IoT'
] as const;

export function LibraryInsights() {
  return (
    <LibraryShell
      activeNav="insights"
      title="Research Insights & Trends"
      description="Explore research patterns and emerging topics"
    >
      <div className="library-card-grid">
        <section className="library-section-card">
          <div className="library-section-head">
            <h3>Projects by Department</h3>
          </div>
          <div className="library-section-body">
            <div className="library-chart-bars">
              {LIBRARY_DEPARTMENT_SUMMARY.map((item) => (
                <div className="library-chart-item" key={item.department}>
                  <div className="library-chart-label">{item.department}</div>
                  <div className="library-bar-track">
                    <div
                      className="library-bar-fill"
                      style={{ width: `${Math.min(item.count, 100)}%` }}
                    >
                      {item.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="library-section-card">
          <div className="library-section-head">
            <h3>Projects by Year</h3>
          </div>
          <div className="library-section-body">
            <div className="library-chart-bars">
              {LIBRARY_YEAR_COUNTS.map((item) => (
                <div className="library-chart-item" key={item.year}>
                  <div className="library-chart-label">{item.year}</div>
                  <div className="library-bar-track">
                    <div
                      className={`library-bar-fill${item.tone === 'success' ? ' is-success' : item.tone === 'muted' ? ' is-muted' : ''}`}
                      style={{ width: `${Math.min(item.count, 112) / 1.12}%` }}
                    >
                      {item.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="library-card-grid">
        <section className="library-section-card">
          <div className="library-section-head">
            <h3>Most Common Keywords</h3>
          </div>
          <div className="library-section-body">
            <div className="library-inline-tags">
              {LIBRARY_KEYWORD_TRENDS.map((keyword) => (
                <LibraryTag key={keyword.label}>
                  {keyword.label} ({keyword.count})
                </LibraryTag>
              ))}
            </div>
          </div>
        </section>

        <section className="library-section-card">
          <div className="library-section-head">
            <h3>Emerging Research Topics</h3>
          </div>
          <div className="library-section-body">
            <div className="library-detail-list">
              {LIBRARY_EMERGING_TOPICS.map((topic) => (
                <p key={topic.label}>
                  <strong>{topic.label}</strong> <span className="library-note">({topic.growth})</span>
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="library-section-card">
        <div className="library-section-head">
          <h3>Research Gaps & Recommendations</h3>
        </div>
        <div className="library-section-body">
          <div className="library-card-grid">
            <article className="library-feature-card is-left">
              <h4>Identified Gaps</h4>
              <div className="library-detail-list">
                {RESEARCH_GAPS.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>
            <article className="library-feature-card is-left">
              <h4>Suggested Topics</h4>
              <div className="library-detail-list">
                {SUGGESTED_TOPICS.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="library-section-card">
        <div className="library-section-head">
          <h3>Recommended Reading</h3>
        </div>
        <div className="library-section-body">
          <div className="library-feature-grid">
            {LIBRARY_RECOMMENDED_READING.map((item) => (
              <article className="library-feature-card is-left" key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <LibraryDepartmentBadge>{item.department}</LibraryDepartmentBadge>
                <div className="library-card-actions">
                  <Link
                    className="library-btn is-outline is-small"
                    href={`/library/project-details?id=${item.projectId}`}
                  >
                    View Study
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </LibraryShell>
  );
}
