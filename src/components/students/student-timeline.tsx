'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { logout } from '@/lib/mock/auth';
import type { StudentDashboardData } from '@/lib/mock/student-dashboard';
import { STUDENT_NAV_ITEMS } from '@/components/students/student-navigation';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';
type RoadmapStatus = 'completed' | 'ongoing' | 'pending';

type RoadmapStage = {
  id: string;
  title: string;
  summary: string;
  dateLabel: string;
  status: RoadmapStatus;
  route: string;
  actionLabel: string;
  evidenceCount: number;
  evidenceLabel: string;
};

const MILESTONE_BLUEPRINT = [
  {
    title: 'Concept',
    summary: 'Define the research topic, identify the problem scope, and draft initial ideas for the capstone study.',
    dateLabel: 'Completed during concept phase',
    route: '/students/title-submission',
    actionLabel: 'Open Title Submission'
  },
  {
    title: 'Proposal',
    summary: 'Submit the formal project proposal for adviser and panel evaluation and approval.',
    dateLabel: 'Target set by adviser review',
    route: '/students/project-files',
    actionLabel: 'Open Project Files'
  },
  {
    title: 'Development',
    summary: 'Build the system, conduct testing, and track chapter submissions and milestone progress.',
    dateLabel: 'Current development window',
    route: '/students/project-overview',
    actionLabel: 'View Project'
  },
  {
    title: 'Mock Defense',
    summary: 'Present a practice defense to gather early feedback, identify gaps, and refine the study.',
    dateLabel: 'Awaiting mock defense schedule',
    route: '/students/schedule',
    actionLabel: 'Open Schedule'
  },
  {
    title: 'Final Defense',
    summary: 'Defend the completed project before the panel and submit final revisions.',
    dateLabel: 'To be scheduled',
    route: '/students/faculty-feedback',
    actionLabel: 'View Feedback'
  },
  {
    title: 'Completion',
    summary: 'Finalize deliverables, upload evidence, and publish to the repository.',
    dateLabel: 'Final endorsement target',
    route: '/students/project-overview',
    actionLabel: 'Open Project Overview'
  }
] as const;

const STAGE_KEYWORDS = {
  concept: ['title', 'concept'],
  proposal: ['proposal'],
  development: ['chapter-1', 'chapter-2', 'chapter-3', 'system-files'],
  mockDefense: ['mock', 'practice', 'dry-run'],
  finalDefense: ['presentation', 'defense', 'symposium'],
  completion: ['approved']
} as const;

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function normalizeMilestoneStatus(status?: string): RoadmapStatus {
  const normalized = status?.toLowerCase() || '';

  if (normalized.includes('completed') || normalized.includes('approved')) {
    return 'completed';
  }

  if (normalized.includes('ongoing') || normalized.includes('active') || normalized.includes('current')) {
    return 'ongoing';
  }

  return 'pending';
}

function getStatusTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();
  if (['approved', 'completed', 'resolved'].includes(normalized)) return 'success';
  if (['pending review', 'pending', 'under review', 'revised', 'ongoing'].includes(normalized)) return 'warning';
  if (['needs revision', 'danger'].includes(normalized)) return 'danger';
  return 'neutral';
}

function formatRoadmapStatus(status: RoadmapStatus) {
  if (status === 'completed') return 'Completed';
  if (status === 'ongoing') return 'Ongoing';
  return 'Pending';
}

function formatEvidenceLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getStageEvidenceMeta(title: string, data: StudentDashboardData) {
  switch (title) {
    case 'Concept': {
      const count = Math.max(
        data.titleRegistration.submissions?.length
          ? data.titleRegistration.submissions.reduce(
              (total, submission) => total + submission.revisionHistory.length,
              0
            )
          : data.titleRegistration.revisionHistory.length,
        1
      );
      return {
        evidenceCount: count,
        evidenceLabel: formatEvidenceLabel(count, 'concept log', 'concept logs')
      };
    }
    case 'Proposal': {
      const count = data.documents.filter((item) => item.category === 'proposal').length;
      return {
        evidenceCount: count,
        evidenceLabel: formatEvidenceLabel(count, 'proposal file', 'proposal files')
      };
    }
    case 'Development': {
      const devKeywords = STAGE_KEYWORDS.development;
      const count = data.documents.filter((item) => devKeywords.includes(item.category as (typeof devKeywords)[number])).length + data.progressReports.length;
      return {
        evidenceCount: count,
        evidenceLabel: formatEvidenceLabel(count, 'development record', 'development records')
      };
    }
    case 'Mock Defense': {
      const count = data.schedules.filter((item) => {
        const haystack = [item.title, item.type, item.description].join(' ').toLowerCase();
        return STAGE_KEYWORDS.mockDefense.some((keyword) => haystack.includes(keyword));
      }).length;
      return {
        evidenceCount: count,
        evidenceLabel: formatEvidenceLabel(count, 'mock defense activity', 'mock defense activities')
      };
    }
    case 'Final Defense': {
      const count = data.documents.filter((item) => item.category === 'presentation-files').length + data.presentations.length;
      return {
        evidenceCount: count,
        evidenceLabel: formatEvidenceLabel(count, 'defense record', 'defense records')
      };
    }
    case 'Completion': {
      const count = data.documents.filter((item) => item.reviewStatus.toLowerCase() === 'approved').length;
      return {
        evidenceCount: count,
        evidenceLabel: formatEvidenceLabel(count, 'approved copy', 'approved copies')
      };
    }
    default:
      return {
        evidenceCount: 0,
        evidenceLabel: '0 linked records'
      };
  }
}

function buildRoadmapStages(data: StudentDashboardData): RoadmapStage[] {
  const milestoneMap = new Map(
    data.milestones.map((item) => [item.title.toLowerCase(), item])
  );

  return MILESTONE_BLUEPRINT.map((stage, index) => {
    const existingStage = milestoneMap.get(stage.title.toLowerCase());
    const evidenceMeta = getStageEvidenceMeta(stage.title, data);

    return {
      id: existingStage?.id || `roadmap-stage-${index + 1}`,
      title: stage.title,
      summary: existingStage?.summary || stage.summary,
      dateLabel: existingStage?.dateLabel || stage.dateLabel,
      status: normalizeMilestoneStatus(existingStage?.status),
      route: existingStage?.route || stage.route,
      actionLabel: existingStage?.actionLabel || stage.actionLabel,
      evidenceCount: evidenceMeta.evidenceCount,
      evidenceLabel: evidenceMeta.evidenceLabel
    };
  });
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  return (
    <span className={`ui-badge is-${tone}`}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export function StudentTimeline({ data }: { data: StudentDashboardData }) {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadNotificationsCount = data.notifications.filter((item) => !item.read).length;
  const unreadFeedbackCount = data.feedback.filter((item) => item.unread).length;

  const roadmapStages = useMemo(() => buildRoadmapStages(data), [data]);
  const completedMilestones = roadmapStages.filter((item) => item.status === 'completed');
  const ongoingMilestone = roadmapStages.find((item) => item.status === 'ongoing') || null;
  const pendingMilestones = roadmapStages.filter((item) => item.status === 'pending');
  const currentStage = ongoingMilestone || completedMilestones[completedMilestones.length - 1] || roadmapStages[0] || null;
  const nextMilestone = pendingMilestones[0] || null;
  const spotlightStage = ongoingMilestone || currentStage || nextMilestone;

  const relatedPages = [
    {
      href: '/students/project-overview',
      label: 'Project Overview',
      copy: 'Review the full project scope, summary, and current implementation status.',
      icon: 'fa-folder-open'
    },
    {
      href: '/students/project-files',
      label: 'Project Files',
      copy: 'Open manuscript, prototype, and supporting document submissions.',
      icon: 'fa-file-lines'
    },
    {
      href: '/students/schedule',
      label: 'Schedule',
      copy: 'Check defense windows, consultations, and milestone-related deadlines.',
      icon: 'fa-calendar-check'
    },
    {
      href: '/students/faculty-feedback',
      label: 'Faculty Feedback',
      copy: 'Review adviser and panel comments tied to the current academic stage.',
      icon: 'fa-comments'
    }
  ];

  const summaryCards = [
    {
      label: 'Current Stage',
      value: currentStage ? currentStage.title : 'Not set',
      helper: currentStage ? formatRoadmapStatus(currentStage.status) : 'No milestone status yet'
    },
    {
      label: 'Progress',
      value: `${data.project.progressPercentage}%`,
      helper: `${completedMilestones.length} of ${roadmapStages.length} stages completed`
    },
    {
      label: 'Completed',
      value: `${completedMilestones.length}`,
      helper: 'Milestones finished and logged'
    },
    {
      label: 'Pending',
      value: `${pendingMilestones.length}`,
      helper: ongoingMilestone ? 'Stages still queued after the active phase' : 'Stages waiting to start'
    },
    {
      label: 'Next Milestone',
      value: nextMilestone ? nextMilestone.title : 'Final stage reached',
      helper: nextMilestone ? nextMilestone.evidenceLabel : 'No pending milestone remaining'
    },
    {
      label: 'Target Date',
      value: nextMilestone ? nextMilestone.dateLabel : data.project.upcomingDeadline,
      helper: nextMilestone ? 'Upcoming academic target' : 'Current project deadline reference'
    }
  ];

  return (
    <div className="student-milestones-page">
      <button className={`sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`} type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />

      <header className="top-nav student-milestones-header">
          <div className="top-nav-leading">
            <div className="page-title student-milestones-header-copy">
              <div className="page-title-context student-milestones-header-context">
                <span className="page-kicker">Student Workspace</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>Milestones</span>
                </span>
              </div>
              <h1>Project Milestones</h1>
              <p className="student-milestones-header-description">Track milestone progress, active academic stages, and upcoming capstone targets in one clearer roadmap view.</p>
            </div>
          </div>
        </header><div className="page-body">
          <section className="page-strip student-milestones-hero">
            <div className="page-strip-main student-milestones-hero-main">
              <span className="section-kicker">Academic Progression</span>
              <h2>Clear visibility into every capstone milestone</h2>
              <p>This page focuses on academic stage progression, milestone readiness, and where the project stands in the formal capstone journey.</p>
              <div className="workspace-note is-member">
                <strong>Milestones track project stages, not file inventory.</strong>
                <p>{currentStage ? `The project is currently centered on ${currentStage.title}. Use Schedule for exact dates and Project Files for submission records.` : 'Milestone stages will appear here as the project roadmap advances.'}</p>
              </div>

              <div className="student-milestones-summary-grid">
                {summaryCards.map((item, index) => (
                  <article key={item.label} className={`student-milestones-summary-card ${index < 2 ? 'is-highlighted' : ''}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.helper}</small>
                  </article>
                ))}
              </div>
            </div>

            <article className="student-milestones-spotlight">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Current Stage Spotlight</span>
                  <h3>{spotlightStage ? spotlightStage.title : 'No active stage yet'}</h3>
                </div>
                <Badge
                  label={spotlightStage ? formatRoadmapStatus(spotlightStage.status) : 'Not Available'}
                  tone={spotlightStage ? getStatusTone(spotlightStage.status) : 'neutral'}
                  icon="fa-flag-checkered"
                />
              </div>

              <p>{spotlightStage ? spotlightStage.summary : 'The current milestone will appear once the project roadmap is initialized.'}</p>

              <div className="detail-grid student-milestones-spotlight-grid">
                <div className="detail-item">
                  <span>Status</span>
                  <strong>{spotlightStage ? formatRoadmapStatus(spotlightStage.status) : 'Not Available'}</strong>
                </div>
                <div className="detail-item">
                  <span>Progress</span>
                  <strong>{data.project.progressPercentage}%</strong>
                </div>
                <div className="detail-item">
                  <span>Next Stage</span>
                  <strong>{nextMilestone ? nextMilestone.title : 'Final stage reached'}</strong>
                </div>
                <div className="detail-item">
                  <span>Target Date</span>
                  <strong>{spotlightStage ? spotlightStage.dateLabel : 'No date available'}</strong>
                </div>
              </div>

              <div className="student-milestones-progress">
                <div className="student-milestones-progress-head">
                  <span>Overall project progress</span>
                  <strong>{data.project.progressPercentage}%</strong>
                </div>
                <div className="student-milestones-progress-bar">
                  <span style={{ width: `${data.project.progressPercentage}%` }} />
                </div>
              </div>

              <div className="row-actions student-milestones-spotlight-actions">
                <Link className="btn btn-primary" href="/students/schedule"><i className="fas fa-calendar-check" aria-hidden="true" /> Open Schedule</Link>
                <Link className="btn btn-secondary" href="/students/project-overview"><i className="fas fa-folder-open" aria-hidden="true" /> View Project</Link>
                <Link className="btn btn-ghost" href="/students/faculty-feedback"><i className="fas fa-comments" aria-hidden="true" /> View Feedback</Link>
              </div>
            </article>
          </section>

          <section className="surface-card student-milestones-roadmap-card">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Milestone Roadmap</span>
                <h3>Academic stages from concept to completion</h3>
                <p>Each stage shows the academic focus, target date, current status, and related evidence or activity count where available.</p>
              </div>
              <Badge label={`${completedMilestones.length} of ${roadmapStages.length} completed`} tone="warning" icon="fa-chart-line" />
            </div>

            <div className="timeline-list student-milestones-roadmap-list">
              {roadmapStages.map((item, index) => (
                <article key={item.id} className={`timeline-item is-${item.status}`}>
                  <div className="timeline-point" />
                  <div className="timeline-content">
                    <div className="timeline-step-meta">
                      <span className="timeline-step-label">{`Stage ${index + 1}`}</span>
                      <span className="timeline-date">{item.dateLabel}</span>
                    </div>

                    <div className="timeline-head">
                      <div className="student-milestones-roadmap-copy">
                        <strong>{item.title}</strong>
                        <p>{item.summary}</p>
                      </div>
                      <div className="chip-row student-milestones-roadmap-badges">
                        <Badge label={formatRoadmapStatus(item.status)} tone={getStatusTone(item.status)} />
                        <span className="ui-badge is-neutral">{item.evidenceLabel}</span>
                      </div>
                    </div>

                    <div className="student-milestones-roadmap-foot">
                      <span>{item.evidenceCount > 0 ? `${item.evidenceLabel} connected to this stage.` : 'Evidence and related activity counts will appear here as this milestone develops.'}</span>
                      <Link className="timeline-link" href={item.route}>{item.actionLabel}</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="content-grid two-thirds student-milestones-group-grid">
            <div className="stack-section">
              <article className="surface-card">
                <div className="card-heading">
                  <div>
                    <span className="section-kicker">Completed Milestones</span>
                    <h3>Finished academic stages</h3>
                  </div>
                  <Badge label={`${completedMilestones.length}`} tone="success" icon="fa-circle-check" />
                </div>

                <div className="stack-list student-milestones-cluster-list">
                  {completedMilestones.map((item) => (
                    <article key={item.id} className="stack-card student-milestones-cluster-item is-completed">
                      <div className="stack-card-head">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.dateLabel}</small>
                        </div>
                        <div className="chip-row">
                          <Badge label="Completed" tone="success" />
                          <span className="ui-badge is-neutral">{item.evidenceLabel}</span>
                        </div>
                      </div>
                      <p>{item.summary}</p>
                    </article>
                  ))}
                </div>
              </article>

              <article className="surface-card">
                <div className="card-heading">
                  <div>
                    <span className="section-kicker">Pending Milestones</span>
                    <h3>Upcoming academic stages</h3>
                  </div>
                  <Badge label={`${pendingMilestones.length}`} tone="warning" icon="fa-hourglass-half" />
                </div>

                <div className="stack-list student-milestones-cluster-list">
                  {pendingMilestones.map((item) => (
                    <article key={item.id} className="stack-card student-milestones-cluster-item is-pending">
                      <div className="stack-card-head">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.dateLabel}</small>
                        </div>
                        <div className="chip-row">
                          <Badge label="Pending" tone="warning" />
                          <span className="ui-badge is-neutral">{item.evidenceLabel}</span>
                        </div>
                      </div>
                      <p>{item.summary}</p>
                    </article>
                  ))}
                </div>
              </article>
            </div>

            <div className="stack-section">
              <article className="surface-card student-milestones-ongoing-card">
                <div className="card-heading">
                  <div>
                    <span className="section-kicker">Ongoing Milestone</span>
                    <h3>{ongoingMilestone ? ongoingMilestone.title : 'No ongoing stage at the moment'}</h3>
                  </div>
                  <Badge label={ongoingMilestone ? 'Active Stage' : 'Waiting'} tone={ongoingMilestone ? 'warning' : 'neutral'} icon="fa-spinner" />
                </div>

                <p>{ongoingMilestone ? ongoingMilestone.summary : 'Once a stage becomes active, it will appear here with a clearer project focus and linked actions.'}</p>

                <div className="detail-grid student-milestones-ongoing-details">
                  <div className="detail-item">
                    <span>Status</span>
                    <strong>{ongoingMilestone ? formatRoadmapStatus(ongoingMilestone.status) : 'Pending activation'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Target date</span>
                    <strong>{ongoingMilestone ? ongoingMilestone.dateLabel : (nextMilestone ? nextMilestone.dateLabel : 'To be scheduled')}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Evidence / activity</span>
                    <strong>{ongoingMilestone ? ongoingMilestone.evidenceLabel : 'No linked record yet'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Related page</span>
                    <strong>{ongoingMilestone ? ongoingMilestone.actionLabel : 'Open Schedule'}</strong>
                  </div>
                </div>

                {ongoingMilestone ? (
                  <Link className="timeline-link" href={ongoingMilestone.route}>{ongoingMilestone.actionLabel}</Link>
                ) : null}
              </article>

              <article className="surface-card">
                <div className="card-heading">
                  <div>
                    <span className="section-kicker">Linked Actions</span>
                    <h3>Related student pages</h3>
                  </div>
                </div>

                <div className="stack-list student-milestones-link-list">
                  {relatedPages.map((item) => (
                    <Link key={item.href} href={item.href} className="stack-card student-milestones-link-card">
                      <div className="student-milestones-link-icon">
                        <i className={`fas ${item.icon}`} aria-hidden="true" />
                      </div>
                      <div className="student-milestones-link-copy">
                        <strong>{item.label}</strong>
                        <small>{item.copy}</small>
                      </div>
                      <span className="student-milestones-link-arrow">Open</span>
                    </Link>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
  );
}
