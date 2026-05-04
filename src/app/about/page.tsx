import Link from 'next/link';

import { LandingFooter } from '@/components/public/landing-footer';
import { LandingNavigation } from '@/components/public/landing-navigation';
import { LandingRevealController } from '@/components/public/landing-reveal-controller';
import { PublicLayout } from '@/components/layouts/public-layout';
import { teamMembers } from '@/lib/landing/team-members';

import styles from '../page.module.css';

export const metadata = {
  title: 'About ThesisTrack | Thesis and Capstone Project Management System'
};

const heroMetrics = [
  { value: '9', label: 'Role-aware portals' },
  { value: '5', label: 'Academic programs' },
  { value: '1', label: 'Managed research record' }
];

const workflowStages = [
  {
    step: '01',
    icon: 'fas fa-pen-to-square',
    title: 'Register',
    owner: 'Students and program staff',
    description: 'Capture group profiles, title proposals, adviser assignment, and project metadata before work begins.',
    artifact: 'Title profile'
  },
  {
    step: '02',
    icon: 'fas fa-comments',
    title: 'Review',
    owner: 'Advisers and panelists',
    description: 'Route chapters, proposals, revisions, and presentation files to the right faculty reviewers.',
    artifact: 'Review trail'
  },
  {
    step: '03',
    icon: 'fas fa-calendar-check',
    title: 'Defend',
    owner: 'Program heads and panels',
    description: 'Coordinate schedules, assign panel chairs and members, then record defense evaluation outcomes.',
    artifact: 'Defense record'
  },
  {
    step: '04',
    icon: 'fas fa-box-archive',
    title: 'Archive',
    owner: 'Research, library, and transfer offices',
    description: 'Move completed outputs into repository, evidence, and technology transfer records for institutional use.',
    artifact: 'Repository entry'
  }
];

const roleWorkspaces = [
  {
    icon: 'fas fa-user-graduate',
    role: 'Students',
    focus: 'Submit and monitor',
    details: 'Register titles, upload documents, follow milestones, and view faculty feedback.'
  },
  {
    icon: 'fas fa-chalkboard-user',
    role: 'Advisers',
    focus: 'Guide and approve',
    details: 'Manage advised groups, review submissions, return comments, and monitor readiness.'
  },
  {
    icon: 'fas fa-user-check',
    role: 'Panelists',
    focus: 'Evaluate and decide',
    details: 'Review defense materials, score presentations, and record panel recommendations.'
  },
  {
    icon: 'fas fa-users-gear',
    role: 'Program Heads',
    focus: 'Coordinate operations',
    details: 'Track department progress, assign panels, schedule defenses, and review workload.'
  },
  {
    icon: 'fas fa-building-columns',
    role: 'Research Heads',
    focus: 'Oversee outcomes',
    details: 'Monitor research outputs, approve key records, and prepare institutional reports.'
  },
  {
    icon: 'fas fa-handshake',
    role: 'Partners and Transfer Staff',
    focus: 'Validate impact',
    details: 'Document adoption, deployment evidence, beneficiaries, and technology transfer status.'
  },
  {
    icon: 'fas fa-book-open-reader',
    role: 'E-Library Users',
    focus: 'Access approved work',
    details: 'Browse approved repository records based on institutional visibility rules.'
  },
  {
    icon: 'fas fa-shield-halved',
    role: 'System Admin',
    focus: 'Configure and secure',
    details: 'Manage accounts, branding, departments, access levels, and system settings.'
  }
];

const capabilityGroups = [
  {
    icon: 'fas fa-route',
    title: 'Academic Workflow',
    description: 'Connects title registration, milestone monitoring, submissions, defense, completion, and archiving.'
  },
  {
    icon: 'fas fa-clipboard-check',
    title: 'Evaluation Support',
    description: 'Keeps adviser feedback, panel roles, scoring, recommendations, and revision outcomes traceable.'
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Program Visibility',
    description: 'Turns department progress, adviser loads, delayed groups, and completion data into operational signals.'
  },
  {
    icon: 'fas fa-folder-tree',
    title: 'Institutional Records',
    description: 'Preserves approved outputs, evidence, repository entries, and technology transfer documentation.'
  }
];

const departments = [
  { code: 'IT', name: 'Information Technology', logo: '/department-logo/IT.png' },
  { code: 'MET', name: 'Manufacturing Engineering Technology', logo: '/department-logo/met.png' },
  { code: 'TCM', name: 'Technology Communication Management', logo: '/department-logo/tcm.png' },
  { code: 'ESM', name: 'Electromechanical Systems and Maintenance', logo: '/department-logo/esm.png' },
  { code: 'NAME', name: 'Naval Architecture and Marine Engineering', logo: '/department-logo/name.png' }
];

const operatingRules = [
  {
    icon: 'fas fa-id-badge',
    title: 'Account Control',
    text: 'Students can register through the portal, while faculty and staff access is issued by authorized school personnel.'
  },
  {
    icon: 'fas fa-lock',
    title: 'Access Boundaries',
    text: 'Repository and project visibility depend on role, approval status, privacy rules, and institutional policy.'
  },
  {
    icon: 'fas fa-file-circle-check',
    title: 'Data Reliability',
    text: 'Reports and dashboards depend on complete submissions, accurate user updates, and configured academic workflows.'
  }
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className={styles.landingPage}>
        <LandingNavigation />

        <main className={styles.main}>
          <section className={styles.aboutPageHero} id="about-thesistrack">
            <div className={styles.aboutHeroScene} aria-hidden="true">
              <div className={styles.aboutSceneChrome}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.aboutSceneGrid}>
                <div className={styles.aboutScenePanel}>
                  <span>Defense Queue</span>
                  <strong>12 scheduled</strong>
                  <i className="fas fa-calendar-check" />
                </div>
                <div className={styles.aboutScenePanel}>
                  <span>Review Progress</span>
                  <strong>84%</strong>
                  <i className="fas fa-chart-line" />
                </div>
                <div className={styles.aboutSceneWidePanel}>
                  <span>Capstone Lifecycle</span>
                  <div>
                    <b>Register</b>
                    <b>Review</b>
                    <b>Defend</b>
                    <b>Archive</b>
                  </div>
                </div>
                <div className={styles.aboutScenePanel}>
                  <span>Repository</span>
                  <strong>Ready</strong>
                  <i className="fas fa-box-archive" />
                </div>
              </div>
            </div>

            <div className={styles.container}>
              <div className={styles.aboutHeroContent} data-reveal="fade-up">
                <span className={styles.sectionKicker}>About the System</span>
                <h1>
                  <span>ThesisTrack</span> System Overview
                </h1>
                <p>
                  ThesisTrack is a role-based thesis and capstone management system for higher
                  education institutions. It gives students, faculty, program leaders, research
                  offices, library staff, and partners one coordinated place to manage academic
                  outputs from proposal to repository and technology transfer.
                </p>

                <div className={styles.teaserActions}>
                  <Link href="#system-model" className={styles.buttonPrimary}>
                    <span className={styles.buttonText}>View System Model</span>
                    <span className={styles.buttonIcon} aria-hidden="true">
                      <i className="fas fa-arrow-down" />
                    </span>
                  </Link>
                  <Link href="#role-workspaces" className={styles.buttonSecondary}>
                    <span className={styles.buttonText}>Explore User Roles</span>
                    <span className={styles.buttonIcon} aria-hidden="true">
                      <i className="fas fa-users" />
                    </span>
                  </Link>
                </div>
              </div>

              <div className={styles.aboutHeroMetrics} aria-label="System scope" data-reveal="fade-up">
                {heroMetrics.map(metric => (
                  <div key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="system-model" className={styles.systemModelSection}>
            <div className={styles.container}>
              <div className={styles.systemIntroGrid}>
                <div className={styles.sectionIntro} data-reveal="fade-up">
                  <span className={styles.sectionKicker}>System Model</span>
                  <h2>
                    Built around the actual <span>capstone lifecycle</span>
                  </h2>
                  <p>
                    The system follows the way academic research work moves in school:
                    registration, review, defense, repository, and transfer evidence. Each step
                    keeps ownership, deadlines, files, and decisions visible.
                  </p>
                </div>

                <aside className={styles.systemDefinitionPanel} data-reveal="fade-up">
                  <span>Primary Purpose</span>
                  <p>
                    Centralize thesis and capstone records so every stakeholder works from the
                    same project profile, review history, evaluation record, and institutional
                    archive.
                  </p>
                </aside>
              </div>

              <div className={styles.processGrid}>
                {workflowStages.map(stage => (
                  <article key={stage.title} className={styles.processCard} data-reveal="fade-up">
                    <div className={styles.processCardTop}>
                      <span>{stage.step}</span>
                      <i className={stage.icon} aria-hidden="true" />
                    </div>
                    <h3>{stage.title}</h3>
                    <strong>{stage.owner}</strong>
                    <p>{stage.description}</p>
                    <em>{stage.artifact}</em>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.capabilitySection}>
            <div className={styles.container}>
              <div className={styles.sectionIntro} data-reveal="fade-up">
                <span className={styles.sectionKicker}>Core Capabilities</span>
                <h2>
                  What the system <span>organizes</span>
                </h2>
                <p>
                  ThesisTrack is designed as an academic operations tool: quiet, structured,
                  auditable, and focused on the records people need to move work forward.
                </p>
              </div>

              <div className={styles.capabilityGrid}>
                {capabilityGroups.map(capability => (
                  <article key={capability.title} className={styles.capabilityCard} data-reveal="fade-up">
                    <span aria-hidden="true">
                      <i className={capability.icon} />
                    </span>
                    <div>
                      <h3>{capability.title}</h3>
                      <p>{capability.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="role-workspaces" className={styles.roleWorkspaceSection}>
            <div className={styles.container}>
              <div className={styles.roleWorkspaceHeader}>
                <div className={styles.sectionIntro} data-reveal="fade-up">
                  <span className={styles.sectionKicker}>User Workspaces</span>
                  <h2>
                    One system, <span>different responsibilities</span>
                  </h2>
                  <p>
                    Each portal removes unrelated tasks and presents the records, approvals,
                    files, and dashboards needed by that user group.
                  </p>
                </div>
              </div>

              <div className={styles.roleMatrix}>
                {roleWorkspaces.map(role => (
                  <article key={role.role} className={styles.roleCard} data-reveal="fade-up">
                    <span className={styles.roleIcon} aria-hidden="true">
                      <i className={role.icon} />
                    </span>
                    <div>
                      <h3>{role.role}</h3>
                      <strong>{role.focus}</strong>
                      <p>{role.details}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.departmentSystemSection}>
            <div className={styles.container}>
              <div className={styles.departmentSystemGrid}>
                <div className={styles.sectionIntro} data-reveal="fade-right">
                  <span className={styles.sectionKicker}>Academic Coverage</span>
                  <h2>
                    Designed for <span>multi-program coordination</span>
                  </h2>
                  <p>
                    Program-specific records stay organized while research leaders can still view
                    institutional progress across departments.
                  </p>
                </div>

                <div className={styles.departmentLogoGrid} data-reveal="fade-left">
                  {departments.map(department => (
                    <Link
                      key={department.code}
                      href={`/departments/${department.code}`}
                      className={styles.departmentLogoCard}
                    >
                      <img
                        src={department.logo}
                        alt={`${department.name} logo`}
                        loading="lazy"
                        decoding="async"
                      />
                      <div>
                        <strong>{department.code}</strong>
                        <span>{department.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.systemRulesSection}>
            <div className={styles.container}>
              <div className={styles.systemRulesBand} data-reveal="fade-up">
                <div className={styles.sectionIntro}>
                  <span className={styles.sectionKicker}>Controls and Boundaries</span>
                  <h2>
                    Reliable records need <span>clear rules</span>
                  </h2>
                </div>

                <div className={styles.systemRulesGrid}>
                  {operatingRules.map(rule => (
                    <article key={rule.title} className={styles.systemRuleCard}>
                      <i className={rule.icon} aria-hidden="true" />
                      <h3>{rule.title}</h3>
                      <p>{rule.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="capstone-team"
            aria-labelledby="capstone-team-title"
            className={styles.teamSection}
          >
            <div className={styles.container}>
              <div className={styles.teamIntro} data-reveal="fade-up">
                <span className={styles.sectionKicker}>Capstone Team</span>
                <h2 id="capstone-team-title">
                  Meet the <span>Developers</span>
                </h2>
                <p>
                  The people behind the Thesis and Capstone Project Inventory, Progress
                  Monitoring, and Technology Transfer Management System.
                </p>
              </div>

              <div className={styles.teamGrid}>
                {teamMembers.map((member, index) => (
                  <article
                    key={member.id}
                    className={styles.teamCard}
                    data-reveal="fade-up"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className={styles.teamCardAccent} aria-hidden="true" />
                    <div className={styles.teamImageFrame}>
                      <img
                        src={member.image}
                        alt={`${member.name} profile image`}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className={styles.teamCardInfo}>
                      <h3>{member.name}</h3>
                      <span className={styles.teamRoleBadge}>{member.role}</span>
                      <p>{member.shortBio}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.teamQuoteBand} data-reveal="fade-up">
                <i className="fas fa-quote-left" aria-hidden="true" />
                <p>
                  Built with dedication for better academic research management.
                </p>
              </div>
            </div>
          </section>
        </main>

        <LandingFooter />
        <LandingRevealController />
      </div>
    </PublicLayout>
  );
}
