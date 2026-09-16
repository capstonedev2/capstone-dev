'use client';

import Link from 'next/link';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { logoutWithApi } from '@/lib/client-auth';
import type { StudentDashboardData } from '@/lib/services/student-workspace';
import { STUDENT_NAV_ITEMS } from '@/components/students/student-navigation';
import {
  fetchAcademicActivities,
  formatIsoDateLabel,
  isImageFileByName,
  type ApiAcademicActivity
} from '@/components/students/student-academic-activity.shared';
import { AcademicActivityDetailModal } from '@/components/students/student-academic-activity-detail';

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

function getStatusTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();
  if (['approved', 'completed', 'resolved', 'confirmed', 'in use', 'enhanced', 'incorporated', 'in development', 'recognized'].includes(normalized)) {
    return 'success';
  }
  if (['pending review', 'pending', 'upcoming', 'under review', 'submitted', 'for evaluation', 'proposed', 'pilot deployment planning', 'ongoing', 'planned'].includes(normalized)) {
    return 'warning';
  }
  if (['needs revision', 'returned for revision', 'not transferable', 'needs clarification', 'danger'].includes(normalized)) {
    return 'danger';
  }
  return 'neutral';
}

function getScopeTone(scope: string): BadgeTone {
  if (scope === 'International') return 'success';
  if (scope === 'National' || scope === 'Regional') return 'warning';
  return 'neutral';
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  return (
    <span className={`ui-badge is-${tone}`}>
      {icon && <i className={`fas ${icon}`} aria-hidden="true" />}
      {label}
    </span>
  );
}

type AcademicActivityRecord = StudentDashboardData['presentations'][number] & {
  activityStatus?: string;
  relatedMilestone?: string;
  participantsOrBeneficiary?: string;
  addToTimeline?: boolean;
  markAsAchievement?: boolean;
  evidenceFiles?: Array<{
    name: string;
    type: string;
  }>;
  // Real, downloadable links to the evidence files attached via Document
  // Submissions — undefined for the brief local echo shown right after save,
  // populated once the list is refetched from the server.
  evidenceLinks?: Array<{
    id: string;
    fileName: string;
    url: string;
    previewUrl: string;
  }>;
  canDelete?: boolean;
  // The full record, for the detail modal — the fields above are just a
  // compatibility shape for the existing display helpers.
  raw: ApiAcademicActivity;
};

type AcademicActivityTab = 'events' | 'evidence' | 'recognitions';

// Adapts the real API shape back onto the record shape the existing display
// helpers (getEvidenceFileLabel, getRecognitionMeta, etc.) already expect, so
// none of that rendering code needed to change — only where the data comes
// from did.
function mapApiActivityToRecord(activity: ApiAcademicActivity, currentUserId: string): AcademicActivityRecord {
  const imageFiles = activity.files.filter((file) => isImageFileByName(file.fileName, file.fileType));
  const certificateFile = activity.files.find((file) => !isImageFileByName(file.fileName, file.fileType));

  return {
    id: activity.id,
    user_id: currentUserId,
    project_id: activity.projectId,
    status: 'active',
    created_at: activity.createdAt,
    updated_at: activity.createdAt,
    eventName: activity.eventName,
    eventType: activity.activityType,
    date: activity.eventDate || activity.createdAt,
    dateLabel: formatIsoDateLabel(activity.eventDate || activity.createdAt),
    venue: activity.venue || '',
    description: activity.description || '',
    achievement: activity.achievement || '',
    scope: activity.scope,
    certificateFile: certificateFile?.fileName || '',
    photoCount: imageFiles.length,
    activityStatus: activity.status,
    relatedMilestone: activity.relatedMilestone || '',
    participantsOrBeneficiary: activity.participantsOrBeneficiary || '',
    addToTimeline: activity.addToTimeline,
    markAsAchievement: activity.markAsAchievement,
    evidenceFiles: activity.files.map((file) => ({ name: file.fileName, type: file.fileType })),
    evidenceLinks: activity.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      url: file.url,
      previewUrl: file.previewUrl
    })),
    raw: activity
  };
}

const OVERVIEW_PILL_STYLES: Record<BadgeTone, string> = {
  neutral: 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)]',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-blue-200 bg-blue-50 text-brand',
  accent: 'border-yellow-200 bg-yellow-50 text-amber-700'
};

function getEvidenceFileLabel(activity: AcademicActivityRecord) {
  return activity.certificateFile || `${activity.eventName} Evidence`;
}

function getEvidenceFileType(activity: AcademicActivityRecord) {
  if (activity.certificateFile) {
    const extension = activity.certificateFile.split('.').pop()?.toUpperCase();

    return extension ? `${extension} file` : 'Certificate file';
  }

  return activity.photoCount > 0 ? 'Image evidence' : 'Evidence record';
}

function getEvidenceNote(activity: AcademicActivityRecord) {
  if (activity.description) {
    return activity.description;
  }

  return activity.certificateFile
    ? `${activity.photoCount} photo${activity.photoCount === 1 ? '' : 's'} attached`
    : `${activity.photoCount} photo${activity.photoCount === 1 ? '' : 's'} recorded`;
}

function getRecognitionMeta(activity: AcademicActivityRecord) {
  const meta = [activity.eventName, activity.venue || activity.participantsOrBeneficiary, activity.relatedMilestone].filter(Boolean);

  return meta.length ? meta.join(' • ') : 'Recognition recorded';
}

function getEvidenceStatusLabel(activity: AcademicActivityRecord) {
  const normalized = activity.activityStatus?.toLowerCase() || '';

  if (['approved', 'completed', 'recognized', 'submitted', 'confirmed'].some((status) => normalized.includes(status))) {
    return 'Approved';
  }

  return 'Pending';
}

function getRecognitionSummary(activity: AcademicActivityRecord) {
  const meta = [activity.eventName, activity.venue || activity.participantsOrBeneficiary, activity.relatedMilestone].filter(Boolean);

  return meta.length ? meta.join(' / ') : 'Recognition recorded';
}

function InfoPill({
  label,
  tone = 'neutral',
  icon
}: {
  label: string;
  tone?: BadgeTone;
  icon?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] ${OVERVIEW_PILL_STYLES[tone]}`}
    >
      {icon ? <i className={`fas ${icon} text-[10px]`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function MetaStat({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

export function StudentProjectOverview({ data }: { data: StudentDashboardData }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { project, group } = data;
  const [activeAcademicActivityTab, setActiveAcademicActivityTab] = useState<AcademicActivityTab>('events');
  const [presentations, setPresentations] = useState<AcademicActivityRecord[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ApiAcademicActivity | null>(null);

  const loadAcademicActivities = async () => {
    if (!project.project_id) {
      setIsLoadingActivities(false);
      return;
    }

    setIsLoadingActivities(true);

    try {
      const activities = await fetchAcademicActivities(project.project_id);
      setPresentations(activities.map((activity) => mapApiActivityToRecord(activity, data.profile.user_id)));
    } catch {
      // Non-critical: the log simply stays empty if this fails.
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadAcademicActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.project_id]);

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

  const summary = useMemo(() => {
    const unreadFeedback = data.feedback.filter((item) => item.unread).length;
    const unreadNotifications = data.notifications.filter((item) => !item.read).length;
    return { unreadFeedback, unreadNotifications };
  }, [data]);

  const latestEvent = presentations[0] || null;
  const latestRecognition = presentations.find((item) => item.achievement) || null;
  const latestEvidence = presentations.find((item) => item.certificateFile || item.photoCount > 0) || null;
  const presentationPhotoCount = presentations.reduce((sum, item) => sum + item.photoCount, 0);
  const recognizedEvents = presentations.filter((item) => item.achievement).length;
  const certificateCount = presentations.filter((item) => item.certificateFile).length;
  const eventRecords = presentations;
  const recentEvents = eventRecords;
  const evidenceRecords = presentations.filter((item) => item.certificateFile || item.photoCount > 0);
  const recognitionRecords = presentations.filter((item) => item.achievement);
  const scopes = {
    Local: presentations.filter((item) => item.scope === 'Local').length,
    Regional: presentations.filter((item) => item.scope === 'Regional').length,
    National: presentations.filter((item) => item.scope === 'National').length,
    International: presentations.filter((item) => item.scope === 'International').length
  };
  const highestScope = ['International', 'National', 'Regional', 'Local'].find((label) => scopes[label as keyof typeof scopes] > 0) || 'No events yet';

  const details = [
    { label: 'Project Code', value: project.projectCode },
    { label: 'Group Name', value: project.groupName },
    { label: 'Team Leader', value: group.leaderName },
    { label: 'Adviser', value: project.adviser },
    { label: 'Program', value: project.program },
    { label: 'Department', value: project.department },
    { label: 'Academic Year', value: project.academicYear },
    { label: 'Project Status', value: project.status },
    { label: 'Repository Status', value: project.repositoryStatus }
  ];

  const progressOrbStyle = {
    ['--progress' as string]: String(project.progressPercentage)
  } as CSSProperties;

  const isLeader = data.profile.groupRole.includes('Leader');
  const projectStatusTone = getStatusTone(project.status);

  return (
    <>
    <div className="project-overview-page">
      <button className={`sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`} type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />

      <header className="top-nav project-overview-header">
          <div className="top-nav-leading">
            <div className="page-title project-overview-header-copy">
              <div className="page-title-context project-overview-header-context">
                <span className="page-kicker">Student Workspace</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>Project Overview</span>
                </span>
              </div>
              <h1>Project Overview</h1>
              <p className="project-overview-header-description">Review the full project profile, academic details, implementation notes, assigned faculty, and presentation record.</p>
            </div>
          </div>
        </header><div className="page-body">
          <section className="hero-card project-overview-summary-card">
            <div className="hero-card-main project-overview-summary-main">
              <div className="project-overview-summary-heading">
                <div>
                  <span className="section-kicker">Project Summary</span>
                  <div className="project-overview-summary-title flex items-center flex-wrap gap-3 mb-2">
                    {projectStatusTone !== 'success' ? (
                      <>
                        <h2 className="text-xl font-medium text-[var(--muted)] italic flex items-center">
                          <i className="fas fa-lock text-sm mr-2 opacity-60"></i>
                          Project title pending approval
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                          <i className="fas fa-clock"></i>
                          Pending Approval
                        </span>
                      </>
                    ) : (
                      <h2 className="text-2xl font-bold text-[#003A8F]">{project.title}</h2>
                    )}
                    <Badge label={project.status} tone={projectStatusTone} />
                  </div>
                  {projectStatusTone !== 'success' ? (
                    <p className="project-overview-summary-copy text-sm text-[var(--muted)] max-w-2xl">Your project title will appear here once the concept proposal has been officially approved.</p>
                  ) : (
                    <p className="project-overview-summary-copy text-sm text-[var(--muted)] max-w-2xl">{project.description}</p>
                  )}
                </div>
              </div>
              <div className="chip-row project-overview-summary-tags">
                <Badge label={`Leader: ${group.leaderName}`} tone="warning" icon="fa-crown" />
                <Badge label={`${group.memberCount} Members`} tone="neutral" icon="fa-users" />
                {project.keywords?.map((keyword) => (
                  <Badge key={keyword} label={keyword} tone="neutral" />
                ))}
              </div>
              <div className={`workspace-note project-overview-summary-note ${isLeader ? 'is-leader' : 'is-member'}`}>
                <strong>You are viewing the shared project record for your entire capstone group.</strong>
                <p>This project page is shared by the full group. Official project-level edits are coordinated by the group leader.</p>
              </div>
              <div className="hero-actions project-overview-summary-actions">
                <button className="btn btn-primary" type="button" onClick={() => alert('Modal placeholder')}>
                  <i className="fas fa-up-right-from-square" aria-hidden="true" /> View Full Information
                </button>
                <Link prefetch={false} className="btn btn-secondary" href="/students/milestones">
                  <i className="fas fa-timeline" aria-hidden="true" /> Open Milestones
                </Link>
              </div>
            </div>
            <div className="hero-card-side project-overview-summary-side flex flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] w-full text-left">Progress</span>
                <div className="progress-orb my-2" style={progressOrbStyle}>
                  <strong>{project.progressPercentage}%</strong>
                  <span>Progress</span>
                </div>
                {project.progressPercentage === 0 && (
                  <p className="text-xs text-[var(--muted)] max-w-[200px] leading-relaxed">No milestone progress yet. Start by opening milestones.</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3.5 pt-4 border-t border-[var(--border)] w-full">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--muted)]">Current milestone</span>
                  <strong className="text-[var(--text)] text-right">{project.currentMilestone || 'Not started'}</strong>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--muted)]">Upcoming deadline</span>
                  <strong className="text-[var(--text)] text-right">{project.upcomingDeadline || 'Not set'}</strong>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--muted)]">Repository status</span>
                  <strong className="text-[var(--text)] text-right">{project.repositoryStatus || 'Pending'}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="content-grid project-overview-info-grid">
            <article className="surface-card project-overview-section-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Project Details</span>
                  <h3>Academic and implementation information</h3>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-2">
                {details.map((item) => {
                  const isPending = !item.value || item.value === 'Not assigned' || item.value === 'Pending' || item.value === 'None';
                  return (
                    <div key={item.label} className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 shadow-sm transition-colors hover:border-[var(--border)]">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{item.label}</span>
                      <strong className={`text-sm ${isPending ? 'text-[var(--text-meta)] font-medium italic' : 'text-[var(--text)] font-semibold'}`}>{isPending ? 'Not available' : item.value}</strong>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="surface-card project-overview-section-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Project Team</span>
                  <h3>Student group and faculty panel</h3>
                </div>
              </div>

              <div className="member-roster">
                {group.members.map((member) => (
                  <article key={member.id} className={`member-card project-overview-member-card ${member.isLeader ? 'is-leader' : ''} ${member.isCurrent ? 'is-current' : ''}`}>
                    <span className="member-avatar flex items-center justify-center overflow-hidden">
                      {member.profileImage ? (
                        <img src={member.profileImage} alt={member.fullName} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(member.fullName)
                      )}
                    </span>
                    <div className="member-copy">
                      <div className="member-copy-head">
                        <div className="project-overview-member-identity">
                          <strong>{member.fullName}</strong>
                          <div className="project-overview-member-meta">
                            <span>{member.studentId}</span>
                            <span>{member.email}</span>
                          </div>
                        </div>
                        <div className="chip-row project-overview-member-badges">
                          {member.isLeader ? <Badge label="Team Leader" tone="warning" icon="fa-crown" /> : <Badge label="Member" tone="neutral" icon="fa-user" />}
                          {member.isCurrent ? <Badge label="You" tone="success" icon="fa-user-check" /> : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="stack-list">
                <article className="stack-card project-overview-panel-card rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5">
                  <div className="stack-card-head flex items-center justify-between mb-2">
                    <strong className="text-sm font-semibold text-[var(--text)]">Adviser</strong>
                    <Badge 
                      label={project.adviser && project.adviser !== 'Not assigned' ? 'Assigned' : 'Pending Assignment'} 
                      tone={project.adviser && project.adviser !== 'Not assigned' ? 'success' : 'warning'} 
                    />
                  </div>
                  <p className="text-sm text-[var(--muted)]">{project.adviser && project.adviser !== 'Not assigned' ? project.adviser : 'No adviser assigned yet.'}</p>
                </article>
              </div>
            </article>
          </section>

          <section className="surface-card project-overview-abstract-card">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Abstract</span>
                <h3>Brief project summary</h3>
              </div>
            </div>
            <div className="project-overview-abstract-copy">
              <p className="reading-copy">{project.abstract || 'No abstract provided.'}</p>
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm" aria-label="Academic activities and supporting evidence">
            <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="section-kicker">Presentations and Achievements</span>
                  <h2 className="text-xl font-semibold text-[var(--text)]">Academic activities and supporting evidence</h2>
                  <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
                    Track presentations, supporting files, and recognitions in one cleaner section built for thesis monitoring and accreditation support.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Latest activity</span>
                      <p className="text-sm leading-6 text-[var(--text)]">
                        {latestEvent
                          ? `Latest activity logged: ${latestEvent.eventName} on ${latestEvent.dateLabel}.${latestEvidence ? ` Latest evidence: ${getEvidenceFileLabel(latestEvidence)}.` : ''}`
                          : 'No academic activities recorded yet.'}
                      </p>
                    </div>
                    {latestEvent ? (
                      <div className="flex flex-wrap gap-2">
                        <InfoPill label={latestEvent.eventType} tone="info" icon="fa-presentation-screen" />
                        <InfoPill label={latestEvent.scope} tone={getScopeTone(latestEvent.scope)} icon="fa-globe" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link prefetch={false}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] shadow-sm transition duration-200 hover:border-blue-200 hover:text-brand"
                  href="/students/faculty-feedback"
                >
                  <i className="fas fa-comments" aria-hidden="true" />
                  Review Feedback
                  {summary.unreadFeedback ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {summary.unreadFeedback}
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Events</span>
                <strong className="mt-2 block text-2xl font-semibold text-[var(--text)]">{presentations.length}</strong>
                <p className="mt-1 text-xs text-[var(--muted)]">Recorded academic activities</p>
              </article>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Certificates</span>
                <strong className="mt-2 block text-2xl font-semibold text-[var(--text)]">{certificateCount}</strong>
                <p className="mt-1 text-xs text-[var(--muted)]">Attached certificate files</p>
              </article>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Evidence Photos</span>
                <strong className="mt-2 block text-2xl font-semibold text-[var(--text)]">{presentationPhotoCount}</strong>
                <p className="mt-1 text-xs text-[var(--muted)]">Photos linked to activities</p>
              </article>
              <article className="rounded-xl border border-yellow-100 bg-yellow-50/80 p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Recognitions</span>
                <strong className="mt-2 block text-2xl font-semibold text-[var(--text)]">{recognizedEvents}</strong>
                <p className="mt-1 text-xs text-[var(--muted)]">Awards and distinctions logged</p>
              </article>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Highest Scope</span>
                <strong className="mt-2 block text-lg font-semibold text-[var(--text)]">{highestScope}</strong>
                <p className="mt-1 text-xs text-[var(--muted)]">Most advanced activity reach</p>
              </article>
            </div>

            <div className="border-b border-[var(--border)]">
              <div className="flex gap-6 overflow-x-auto">
                {[
                  { key: 'events' as const, label: 'Events', count: eventRecords.length },
                  { key: 'evidence' as const, label: 'Evidence', count: evidenceRecords.length },
                  { key: 'recognitions' as const, label: 'Recognitions', count: recognitionRecords.length }
                ].map((tab) => {
                  const isActive = activeAcademicActivityTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition ${
                        isActive ? 'border-brand text-brand' : 'border-transparent text-[var(--text-meta)] hover:text-[var(--muted)]'
                      }`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveAcademicActivityTab(tab.key)}
                    >
                      <span>{tab.label}</span>
                      <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-blue-50 text-brand' : 'bg-[var(--surface-alt)] text-[var(--muted)]'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {activeAcademicActivityTab === 'events' ? (
                eventRecords.length ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {eventRecords.map((activity) => (
                      <article
                        key={`event-tab-${activity.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedActivity(activity.raw)}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedActivity(activity.raw); }}
                        className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 shadow-sm transition duration-200 hover:border-blue-200 hover:bg-[var(--surface)]"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <h3 className="text-base font-semibold text-[var(--text)]">{activity.eventName}</h3>
                            <p className="text-sm leading-6 text-[var(--muted)]">
                              {activity.description || 'No event description provided yet.'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <InfoPill label={activity.eventType} tone="info" icon="fa-presentation-screen" />
                            <InfoPill label={activity.scope} tone={getScopeTone(activity.scope)} icon="fa-globe" />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-calendar-day text-xs text-[var(--text-meta)]" aria-hidden="true" />
                            {activity.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-location-dot text-xs text-[var(--text-meta)]" aria-hidden="true" />
                            {activity.venue || 'To be announced'}
                          </span>
                          {activity.activityStatus ? (
                            <span className="inline-flex items-center gap-2">
                              <i className="fas fa-circle-check text-xs text-[var(--text-meta)]" aria-hidden="true" />
                              {activity.activityStatus}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 py-6 text-left">
                    <strong className="block text-sm font-semibold text-[var(--text)]">No academic activities yet</strong>
                    <p className="mt-1 text-sm text-[var(--muted)]">Presentations, exhibits, and workshops logged from Document Submissions will appear here.</p>
                  </div>
                )
              ) : null}

              {activeAcademicActivityTab === 'evidence' ? (
                evidenceRecords.length ? (
                  <div className="space-y-3">
                    {evidenceRecords.map((activity) => (
                      <article
                        key={`evidence-tab-${activity.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedActivity(activity.raw)}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedActivity(activity.raw); }}
                        className="cursor-pointer flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition duration-200 hover:border-blue-200 hover:bg-[var(--surface-alt)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-brand">
                            <i className={`fas ${activity.certificateFile ? 'fa-file-lines' : 'fa-images'}`} aria-hidden="true" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h3 className="truncate text-sm font-semibold text-[var(--text)]">{getEvidenceFileLabel(activity)}</h3>
                            <p className="text-sm text-[var(--muted)]">{activity.eventName}</p>
                            <p className="text-sm leading-6 text-[var(--muted)]">{getEvidenceNote(activity)}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm text-[var(--muted)] sm:min-w-[220px]">
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-calendar-day text-xs text-[var(--text-meta)]" aria-hidden="true" />
                            {activity.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-camera text-xs text-[var(--text-meta)]" aria-hidden="true" />
                            {activity.photoCount} photo{activity.photoCount === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <InfoPill
                            label={activity.certificateFile ? 'Certificate' : 'Photo evidence'}
                            tone={activity.certificateFile ? 'info' : 'neutral'}
                            icon={activity.certificateFile ? 'fa-file-circle-check' : 'fa-camera'}
                          />
                          <InfoPill
                            label={getEvidenceStatusLabel(activity)}
                            tone={getEvidenceStatusLabel(activity) === 'Approved' ? 'success' : 'warning'}
                            icon="fa-circle-check"
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 py-6 text-left">
                    <strong className="block text-sm font-semibold text-[var(--text)]">Upload your first evidence</strong>
                    <p className="mt-1 text-sm text-[var(--muted)]">Certificates and photo evidence uploaded from Document Submissions will appear here.</p>
                  </div>
                )
              ) : null}

              {activeAcademicActivityTab === 'recognitions' ? (
                recognitionRecords.length ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {recognitionRecords.map((activity) => (
                      <article
                        key={`recognition-tab-${activity.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedActivity(activity.raw)}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedActivity(activity.raw); }}
                        className="cursor-pointer rounded-xl border border-yellow-100 bg-gradient-to-br from-yellow-50 via-white to-blue-50 p-5 shadow-sm transition duration-200 hover:border-amber-200"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Recognition</span>
                            <h3 className="text-base font-semibold text-[var(--text)]">{activity.achievement}</h3>
                            <p className="text-sm leading-6 text-[var(--muted)]">{getRecognitionSummary(activity)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <InfoPill label="Achievement" tone="accent" icon="fa-award" />
                            <InfoPill label={activity.scope} tone={getScopeTone(activity.scope)} icon="fa-globe" />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-calendar-day text-xs text-[var(--text-meta)]" aria-hidden="true" />
                            {activity.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-presentation-screen text-xs text-[var(--text-meta)]" aria-hidden="true" />
                            {activity.eventName}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-location-dot text-xs text-[var(--text-meta)]" aria-hidden="true" />
                            {activity.venue || 'Venue to be announced'}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 py-10 text-center">
                    <strong className="block text-base text-[var(--text)]">No recognitions recorded yet.</strong>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Awards and distinctions will appear here after the group logs a recognized or awarded academic activity.
                    </p>
                  </div>
                )
              ) : null}
            </div>


          </section>
        </div>

      </div>

      <AcademicActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </>
  );
}
