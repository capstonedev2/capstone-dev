'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { logout } from '@/lib/mock/auth';
import type { StudentDashboardData } from '@/lib/mock/student-dashboard';
import { STUDENT_NAV_ITEMS } from '@/components/students/student-navigation';

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
};

type AcademicActivityFormState = {
  activityType: string;
  activityTitle: string;
  relatedMilestone: string;
  date: string;
  location: string;
  description: string;
  status: string;
  participantsOrBeneficiary: string;
  addToTimeline: boolean;
  markAsAchievement: boolean;
  evidenceFiles: File[];
};

type AcademicActivityTab = 'events' | 'evidence' | 'recognitions';

const ACTIVITY_TYPE_OPTIONS = [
  'Presentation',
  'Research Colloquium',
  'Project Defense',
  'Academic Exhibit',
  'Workshop',
  'Seminar',
  'Community Extension'
];

const ACTIVITY_STATUS_OPTIONS = ['Planned', 'Ongoing', 'Completed', 'Submitted', 'Recognized'];

function createAcademicActivityForm(defaultMilestone: string): AcademicActivityFormState {
  return {
    activityType: 'Presentation',
    activityTitle: '',
    relatedMilestone: defaultMilestone,
    date: '',
    location: '',
    description: '',
    status: 'Completed',
    participantsOrBeneficiary: '',
    addToTimeline: true,
    markAsAchievement: false,
    evidenceFiles: []
  };
}

function formatActivityDateLabel(value: string) {
  if (!value) {
    return 'Date to be confirmed';
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function isImageEvidenceFile(file: File) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
}

const OVERVIEW_PILL_STYLES: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function StudentProjectOverview({ data }: { data: StudentDashboardData }) {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const { project, group } = data;
  const milestoneOptions = data.milestones || [];
  const defaultActivityMilestone = project.currentMilestone || milestoneOptions[0]?.title || '';
  const [isAcademicActivityModalOpen, setAcademicActivityModalOpen] = useState(false);
  const [activeAcademicActivityTab, setActiveAcademicActivityTab] = useState<AcademicActivityTab>('events');
  const [presentations, setPresentations] = useState<AcademicActivityRecord[]>(() => data.presentations || []);
  const [academicActivityForm, setAcademicActivityForm] = useState<AcademicActivityFormState>(() => createAcademicActivityForm(defaultActivityMilestone));

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
        setAcademicActivityModalOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('is-modal-open', isAcademicActivityModalOpen);

    return () => {
      document.body.classList.remove('is-modal-open');
    };
  }, [isAcademicActivityModalOpen]);

  const summary = useMemo(() => {
    const unreadFeedback = data.feedback.filter((item) => item.unread).length;
    const unreadNotifications = data.notifications.filter((item) => !item.read).length;
    return { unreadFeedback, unreadNotifications };
  }, [data]);

  const resetAcademicActivityForm = () => {
    setAcademicActivityForm(createAcademicActivityForm(defaultActivityMilestone));

    if (evidenceInputRef.current) {
      evidenceInputRef.current.value = '';
    }
  };

  const openAcademicActivityModal = () => {
    resetAcademicActivityForm();
    setAcademicActivityModalOpen(true);
  };

  const closeAcademicActivityModal = () => {
    setAcademicActivityModalOpen(false);
    resetAcademicActivityForm();
  };

  const updateAcademicActivityForm = <Key extends keyof AcademicActivityFormState,>(field: Key, value: AcademicActivityFormState[Key]) => {
    setAcademicActivityForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleEvidenceUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateAcademicActivityForm('evidenceFiles', Array.from(event.target.files || []));
  };

  const handleAcademicActivitySave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const now = new Date().toISOString();
    const evidenceFiles = academicActivityForm.evidenceFiles.map((file) => ({
      name: file.name,
      type: file.type
    }));
    const imageFiles = academicActivityForm.evidenceFiles.filter((file) => isImageEvidenceFile(file));
    const certificateFile = academicActivityForm.evidenceFiles.find((file) => !isImageEvidenceFile(file))?.name || '';
    const nextActivity: AcademicActivityRecord = {
      id: `pres-${Date.now()}`,
      user_id: data.profile.user_id,
      project_id: data.project.project_id,
      status: 'active',
      created_at: now,
      updated_at: now,
      eventName: academicActivityForm.activityTitle.trim(),
      eventType: academicActivityForm.activityType,
      date: academicActivityForm.date ? `${academicActivityForm.date}T00:00:00.000Z` : now,
      dateLabel: formatActivityDateLabel(academicActivityForm.date),
      venue: academicActivityForm.location.trim(),
      description: academicActivityForm.description.trim(),
      achievement: academicActivityForm.markAsAchievement ? 'Academic Achievement' : '',
      scope: 'Local',
      certificateFile,
      photoCount: imageFiles.length,
      activityStatus: academicActivityForm.status,
      relatedMilestone: academicActivityForm.relatedMilestone.trim(),
      participantsOrBeneficiary: academicActivityForm.participantsOrBeneficiary.trim(),
      addToTimeline: academicActivityForm.addToTimeline,
      markAsAchievement: academicActivityForm.markAsAchievement,
      evidenceFiles
    };

    setPresentations((current) => [nextActivity, ...current]);
    closeAcademicActivityModal();
  };

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
    { label: 'Category', value: project.category },
    { label: 'Project Status', value: project.status },
    { label: 'Pilot Testing Status', value: project.pilotTestingStatus },
    { label: 'Implementation Location', value: project.implementationLocation },
    { label: 'Repository Status', value: project.repositoryStatus }
  ];

  const progressOrbStyle = {
    ['--progress' as string]: String(project.progressPercentage)
  } as CSSProperties;

  const isLeader = data.profile.groupRole.includes('Leader');
  const projectStatusTone = getStatusTone(project.status);

  return (
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
                  <div className="project-overview-summary-title">
                    <h2>{project.title}</h2>
                    <Badge label={project.status} tone={projectStatusTone} />
                  </div>
                  <p className="project-overview-summary-copy">{project.description}</p>
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
                <Link className="btn btn-secondary" href="/students/milestones">
                  <i className="fas fa-timeline" aria-hidden="true" /> Open Milestones
                </Link>
              </div>
            </div>
            <div className="hero-card-side project-overview-summary-side">
              <div className="project-overview-progress-panel">
                <span className="section-kicker">Progress</span>
                <div className="progress-orb" style={progressOrbStyle}>
                  <strong>{project.progressPercentage}%</strong>
                  <span>Progress</span>
                </div>
                <div className="project-overview-progress-meta">
                  <span>Current milestone</span>
                  <strong>{project.currentMilestone}</strong>
                </div>
              </div>
              <div className="hero-facts project-overview-summary-facts">
                <div><span>Upcoming deadline</span><strong>{project.upcomingDeadline}</strong></div>
                <div><span>Repository status</span><strong>{project.repositoryStatus}</strong></div>
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
              <div className="detail-grid project-overview-detail-grid">
                {details.map((item) => (
                  <div key={item.label} className="detail-item project-overview-detail-item">
                    <span>{item.label}</span>
                    <strong>{item.value || 'Not available'}</strong>
                  </div>
                ))}
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
                    <span className="member-avatar">{getInitials(member.fullName)}</span>
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
                <article className="stack-card project-overview-panel-card">
                  <div className="stack-card-head">
                    <strong>Panel Members</strong>
                    <Badge label={`${project.panelMembers?.length || 0} assigned`} tone="warning" />
                  </div>
                  <p>{project.panelMembers?.join(', ') || 'No panel members assigned.'}</p>
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

          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Academic activities and supporting evidence">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="section-kicker">Presentations and Achievements</span>
                  <h2 className="text-xl font-semibold text-slate-900">Academic activities and supporting evidence</h2>
                  <p className="max-w-3xl text-sm leading-6 text-slate-500">
                    Track presentations, supporting files, and recognitions in one cleaner section built for thesis monitoring and accreditation support.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Latest activity</span>
                      <p className="text-sm leading-6 text-slate-700">
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
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-brand-dark"
                  type="button"
                  onClick={openAcademicActivityModal}
                >
                  <i className="fas fa-plus" aria-hidden="true" />
                  Add Academic Activity
                </button>
                <Link
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-blue-200 hover:text-brand"
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
              <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Events</span>
                <strong className="mt-2 block text-2xl font-semibold text-slate-800">{presentations.length}</strong>
                <p className="mt-1 text-xs text-slate-500">Recorded academic activities</p>
              </article>
              <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Certificates</span>
                <strong className="mt-2 block text-2xl font-semibold text-slate-800">{certificateCount}</strong>
                <p className="mt-1 text-xs text-slate-500">Attached certificate files</p>
              </article>
              <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Evidence Photos</span>
                <strong className="mt-2 block text-2xl font-semibold text-slate-800">{presentationPhotoCount}</strong>
                <p className="mt-1 text-xs text-slate-500">Photos linked to activities</p>
              </article>
              <article className="rounded-xl border border-yellow-100 bg-yellow-50/80 p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Recognitions</span>
                <strong className="mt-2 block text-2xl font-semibold text-slate-800">{recognizedEvents}</strong>
                <p className="mt-1 text-xs text-slate-500">Awards and distinctions logged</p>
              </article>
              <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Highest Scope</span>
                <strong className="mt-2 block text-lg font-semibold text-slate-800">{highestScope}</strong>
                <p className="mt-1 text-xs text-slate-500">Most advanced activity reach</p>
              </article>
            </div>

            <div className="border-b border-slate-200">
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
                        isActive ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveAcademicActivityTab(tab.key)}
                    >
                      <span>{tab.label}</span>
                      <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-blue-50 text-brand' : 'bg-slate-100 text-slate-500'}`}>
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
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm transition duration-200 hover:border-blue-200 hover:bg-white"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <h3 className="text-base font-semibold text-slate-800">{activity.eventName}</h3>
                            <p className="text-sm leading-6 text-slate-500">
                              {activity.description || 'No event description provided yet.'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <InfoPill label={activity.eventType} tone="info" icon="fa-presentation-screen" />
                            <InfoPill label={activity.scope} tone={getScopeTone(activity.scope)} icon="fa-globe" />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-calendar-day text-xs text-slate-400" aria-hidden="true" />
                            {activity.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-location-dot text-xs text-slate-400" aria-hidden="true" />
                            {activity.venue || 'To be announced'}
                          </span>
                          {activity.activityStatus ? (
                            <span className="inline-flex items-center gap-2">
                              <i className="fas fa-circle-check text-xs text-slate-400" aria-hidden="true" />
                              {activity.activityStatus}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                    <strong className="block text-base text-slate-800">No academic activities yet.</strong>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Start building the activity record by logging the first presentation, exhibit, or workshop.
                    </p>
                    <button
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-brand-dark"
                      type="button"
                      onClick={openAcademicActivityModal}
                    >
                      <i className="fas fa-plus" aria-hidden="true" />
                      Add Academic Activity
                    </button>
                  </div>
                )
              ) : null}

              {activeAcademicActivityTab === 'evidence' ? (
                evidenceRecords.length ? (
                  <div className="space-y-3">
                    {evidenceRecords.map((activity) => (
                      <article
                        key={`evidence-tab-${activity.id}`}
                        className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition duration-200 hover:border-blue-200 hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-brand">
                            <i className={`fas ${activity.certificateFile ? 'fa-file-lines' : 'fa-images'}`} aria-hidden="true" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h3 className="truncate text-sm font-semibold text-slate-800">{getEvidenceFileLabel(activity)}</h3>
                            <p className="text-sm text-slate-600">{activity.eventName}</p>
                            <p className="text-sm leading-6 text-slate-500">{getEvidenceNote(activity)}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-500 sm:min-w-[220px]">
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-calendar-day text-xs text-slate-400" aria-hidden="true" />
                            {activity.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-camera text-xs text-slate-400" aria-hidden="true" />
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
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                    <strong className="block text-base text-slate-800">Upload your first evidence.</strong>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Certificates and photo evidence will appear here once activities are logged with supporting files.
                    </p>
                    <button
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-brand-dark"
                      type="button"
                      onClick={openAcademicActivityModal}
                    >
                      <i className="fas fa-plus" aria-hidden="true" />
                      Add Academic Activity
                    </button>
                  </div>
                )
              ) : null}

              {activeAcademicActivityTab === 'recognitions' ? (
                recognitionRecords.length ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {recognitionRecords.map((activity) => (
                      <article
                        key={`recognition-tab-${activity.id}`}
                        className="rounded-xl border border-yellow-100 bg-gradient-to-br from-yellow-50 via-white to-blue-50 p-5 shadow-sm transition duration-200 hover:border-amber-200"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Recognition</span>
                            <h3 className="text-base font-semibold text-slate-800">{activity.achievement}</h3>
                            <p className="text-sm leading-6 text-slate-500">{getRecognitionSummary(activity)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <InfoPill label="Achievement" tone="accent" icon="fa-award" />
                            <InfoPill label={activity.scope} tone={getScopeTone(activity.scope)} icon="fa-globe" />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-calendar-day text-xs text-slate-400" aria-hidden="true" />
                            {activity.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-presentation-screen text-xs text-slate-400" aria-hidden="true" />
                            {activity.eventName}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <i className="fas fa-location-dot text-xs text-slate-400" aria-hidden="true" />
                            {activity.venue || 'Venue to be announced'}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                    <strong className="block text-base text-slate-800">No recognitions recorded yet.</strong>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Awards and distinctions will appear here after the group logs a recognized or awarded academic activity.
                    </p>
                    <button
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-brand shadow-sm transition duration-200 hover:border-blue-300 hover:bg-blue-100"
                      type="button"
                      onClick={openAcademicActivityModal}
                    >
                      <i className="fas fa-plus" aria-hidden="true" />
                      Add Academic Activity
                    </button>
                  </div>
                )
              ) : null}
            </div>

          <section className="hidden" aria-hidden="true">
            <article className="surface-card flex h-full flex-col gap-5 rounded-2xl border border-slate-200 !bg-white !p-6 shadow-soft transition duration-200 hover:border-slate-300 hover:shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Events</span>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-950">Presentation records</h3>
                    <p className="text-sm leading-6 text-slate-600">
                      Logged symposiums, defenses, and research showcases connected to the project record.
                    </p>
                  </div>
                </div>
                <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-3 text-base font-bold text-brand">
                  {presentations.length}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetaStat label="Total events" value={presentations.length} />
                <MetaStat label="Highest scope" value={highestScope} />
              </div>

              {recentEvents.length ? (
                <div className="space-y-3">
                  {recentEvents.map((activity) => (
                    <article
                      key={activity.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/75 p-4 transition duration-200 hover:border-blue-200 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-slate-950">{activity.eventName}</h4>
                          <p className="text-sm leading-6 text-slate-600">
                            {activity.description || 'No event description provided yet.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <InfoPill label={activity.eventType} tone="info" icon="fa-presentation-screen" />
                          <InfoPill label={activity.scope} tone={getScopeTone(activity.scope)} icon="fa-globe" />
                          {activity.activityStatus ? (
                            <InfoPill
                              label={activity.activityStatus}
                              tone={getStatusTone(activity.activityStatus)}
                              icon="fa-circle-check"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MetaStat label="Date" value={activity.dateLabel} />
                        <MetaStat label="Location" value={activity.venue || 'To be announced'} />
                        <MetaStat label="Scope" value={activity.scope} />
                        <MetaStat label="Event type" value={activity.eventType} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-600">
                  <strong className="block text-base text-slate-900">No academic activities recorded yet.</strong>
                  <p className="mt-2 leading-6">
                    Completed presentations and exhibits will appear here once the group adds the first academic activity.
                  </p>
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-brand transition duration-200 hover:border-blue-300 hover:bg-blue-100"
                    type="button"
                    onClick={openAcademicActivityModal}
                  >
                    <i className="fas fa-plus" aria-hidden="true" />
                    Add Academic Activity
                  </button>
                </div>
              )}
            </article>

            <article className="surface-card flex h-full flex-col gap-5 rounded-2xl border border-slate-200 !bg-white !p-6 shadow-soft transition duration-200 hover:border-slate-300 hover:shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Certificates / Evidence
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-950">Supporting proof</h3>
                    <p className="text-sm leading-6 text-slate-600">
                      Certificate attachments and photo evidence tied to recorded project activities.
                    </p>
                  </div>
                </div>
                <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-3 text-base font-bold text-brand">
                  {certificateCount + presentationPhotoCount}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetaStat label="Certificates" value={certificateCount} />
                <MetaStat label="Photos recorded" value={presentationPhotoCount} />
              </div>

              {evidenceRecords.length ? (
                <div className="space-y-3">
                  {evidenceRecords.map((activity) => (
                    <article
                      key={`${activity.id}-evidence`}
                      className="rounded-2xl border border-slate-200 bg-slate-50/75 p-4 transition duration-200 hover:border-blue-200 hover:bg-white"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-brand">
                            <i
                              className={`fas ${activity.certificateFile ? 'fa-file-lines' : 'fa-images'}`}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h4 className="truncate text-sm font-semibold text-slate-950">
                              {getEvidenceFileLabel(activity)}
                            </h4>
                            <p className="text-sm font-medium text-slate-700">{activity.eventName}</p>
                            <p className="text-sm leading-6 text-slate-600">{getEvidenceNote(activity)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <InfoPill
                            label={activity.certificateFile ? 'Certificate' : 'Photo evidence'}
                            tone={activity.certificateFile ? 'success' : 'info'}
                            icon={activity.certificateFile ? 'fa-file-circle-check' : 'fa-camera'}
                          />
                          <InfoPill label={getEvidenceFileType(activity)} tone="neutral" icon="fa-folder-open" />
                          {activity.activityStatus ? (
                            <InfoPill
                              label={activity.activityStatus}
                              tone={getStatusTone(activity.activityStatus)}
                              icon="fa-circle-check"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MetaStat label="Photo count" value={activity.photoCount} />
                        <MetaStat label="Date" value={activity.dateLabel} />
                        <MetaStat label="Associated event" value={activity.eventName} />
                        <MetaStat
                          label="Status"
                          value={activity.activityStatus || (activity.certificateFile ? 'Approved evidence' : 'Evidence recorded')}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-600">
                  <strong className="block text-base text-slate-900">No certificates uploaded yet</strong>
                  <p className="mt-2 leading-6">
                    Upload certificates or event photos so the record stays complete for adviser and panel review.
                  </p>
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-brand transition duration-200 hover:border-blue-300 hover:bg-blue-100"
                    type="button"
                    onClick={openAcademicActivityModal}
                  >
                    <i className="fas fa-plus" aria-hidden="true" />
                    Add Academic Activity
                  </button>
                </div>
              )}
            </article>

            <article className="surface-card project-overview-evidence-card">
              <div className="project-overview-evidence-head">
                <div>
                  <span className="section-kicker">Recognitions</span>
                  <h3>Awards and distinctions</h3>
                </div>
                <span className="project-overview-evidence-count">{recognizedEvents}</span>
              </div>
              <p>Recognitions help summarize the project’s academic visibility without expanding the page into a separate dashboard.</p>
              <div className="project-overview-evidence-metrics">
                <div>
                  <span>Recognitions</span>
                  <strong>{recognizedEvents}</strong>
                </div>
                <div>
                  <span>Latest scope</span>
                  <strong>{latestRecognition ? latestRecognition.scope : 'No awards yet'}</strong>
                </div>
              </div>
              {latestRecognition ? (
                <div className="project-overview-evidence-latest">
                  <small>Latest recognition</small>
                  <strong>{latestRecognition.achievement}</strong>
                  <p>{latestRecognition.dateLabel}</p>
                  <span className="project-overview-evidence-meta">{getRecognitionMeta(latestRecognition)}</span>
                  <div className="chip-row">
                    <Badge label="Achievement" tone="accent" />
                    <Badge label={latestRecognition.scope} tone={getScopeTone(latestRecognition.scope)} />
                    {latestRecognition.activityStatus ? <Badge label={latestRecognition.activityStatus} tone={getStatusTone(latestRecognition.activityStatus)} /> : null}
                  </div>
                </div>
              ) : (
                <div className="project-overview-evidence-empty">
                  <strong>No recognitions recorded yet</strong>
                  <p>Recognition entries will appear after the group logs an awarded or featured presentation event.</p>
                  <button className="project-overview-evidence-link page-strip-action" type="button" onClick={openAcademicActivityModal}>
                    Add Academic Activity
                  </button>
                </div>
              )}
            </article>
          </section>
          </section>
        </div>

        <div className={`modal-shell ${isAcademicActivityModalOpen ? 'is-open' : ''}`} aria-hidden={isAcademicActivityModalOpen ? 'false' : 'true'}>
          <button className="modal-backdrop" type="button" aria-label="Close add academic activity modal" onClick={closeAcademicActivityModal} />
          <div className="modal-card project-overview-modal-card" role="dialog" aria-modal="true" aria-labelledby="add-academic-activity-title">
            <button className="modal-close" type="button" aria-label="Close add academic activity modal" onClick={closeAcademicActivityModal}>
              <i className="fas fa-times" aria-hidden="true" />
            </button>
            <div className="modal-content project-overview-modal-content">
              <div className="project-overview-modal-head">
                <div className="project-overview-modal-copy">
                  <span className="section-kicker">Presentations and Achievements</span>
                  <h3 id="add-academic-activity-title">Add Academic Activity</h3>
                  <p>Log an academic activity without leaving Project Overview.</p>
                </div>
                <Badge label={`${presentations.length} total record${presentations.length === 1 ? '' : 's'}`} tone="neutral" />
              </div>

              <div className="project-overview-modal-summary">
                <i className="fas fa-circle-info" aria-hidden="true" />
                <span>This modal saves directly into the Presentations & Achievements section on this page and does not redirect to Project Files.</span>
              </div>

              <form className="project-overview-modal-form" onSubmit={handleAcademicActivitySave}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="academic-activity-type">Activity Type</label>
                    <select
                      id="academic-activity-type"
                      value={academicActivityForm.activityType}
                      onChange={(event) => updateAcademicActivityForm('activityType', event.target.value)}
                    >
                      {ACTIVITY_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="academic-activity-status">Status</label>
                    <select
                      id="academic-activity-status"
                      value={academicActivityForm.status}
                      onChange={(event) => updateAcademicActivityForm('status', event.target.value)}
                    >
                      {ACTIVITY_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field full">
                    <label htmlFor="academic-activity-title">Activity Title</label>
                    <input
                      id="academic-activity-title"
                      type="text"
                      value={academicActivityForm.activityTitle}
                      onChange={(event) => updateAcademicActivityForm('activityTitle', event.target.value)}
                      placeholder="Enter the academic activity title"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="academic-activity-milestone">Related Milestone</label>
                    <select
                      id="academic-activity-milestone"
                      value={academicActivityForm.relatedMilestone}
                      onChange={(event) => updateAcademicActivityForm('relatedMilestone', event.target.value)}
                    >
                      <option value="">Not linked to a milestone</option>
                      {milestoneOptions.map((milestone) => (
                        <option key={milestone.id} value={milestone.title}>{milestone.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="academic-activity-date">Date</label>
                    <input
                      id="academic-activity-date"
                      type="date"
                      value={academicActivityForm.date}
                      onChange={(event) => updateAcademicActivityForm('date', event.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="academic-activity-location">Location / Venue</label>
                    <input
                      id="academic-activity-location"
                      type="text"
                      value={academicActivityForm.location}
                      onChange={(event) => updateAcademicActivityForm('location', event.target.value)}
                      placeholder="University auditorium, partner site, online, etc."
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="academic-activity-participants">Participants / Beneficiary</label>
                    <input
                      id="academic-activity-participants"
                      type="text"
                      value={academicActivityForm.participantsOrBeneficiary}
                      onChange={(event) => updateAcademicActivityForm('participantsOrBeneficiary', event.target.value)}
                      placeholder="Students, faculty panel, community partner, or beneficiary"
                    />
                  </div>

                  <div className="form-field full">
                    <label htmlFor="academic-activity-description">Description</label>
                    <textarea
                      id="academic-activity-description"
                      value={academicActivityForm.description}
                      onChange={(event) => updateAcademicActivityForm('description', event.target.value)}
                      placeholder="Summarize the activity, outcomes, and relevance to the project."
                      required
                    />
                  </div>

                  <div className="form-field full project-overview-upload-field">
                    <label htmlFor="academic-activity-evidence">Evidence Upload</label>
                    <input
                      ref={evidenceInputRef}
                      id="academic-activity-evidence"
                      type="file"
                      multiple
                      onChange={handleEvidenceUploadChange}
                    />
                    <p className="project-overview-upload-hint">
                      Upload photos, certificates, or supporting proof. Image files are counted as photo evidence and the first non-image file is used as the main attachment.
                    </p>
                    {academicActivityForm.evidenceFiles.length ? (
                      <div className="project-overview-upload-list">
                        {academicActivityForm.evidenceFiles.map((file) => (
                          <div key={`${file.name}-${file.size}`} className="project-overview-upload-item">
                            <span>{file.name}</span>
                            <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="form-field full">
                    <span className="project-overview-form-label">Additional Options</span>
                    <div className="project-overview-checkbox-grid">
                      <label className="project-overview-checkbox">
                        <input
                          type="checkbox"
                          checked={academicActivityForm.addToTimeline}
                          onChange={(event) => updateAcademicActivityForm('addToTimeline', event.target.checked)}
                        />
                        <span>
                          <strong>Add this activity to project timeline</strong>
                          <span>Keep the activity aligned with the related milestone record.</span>
                        </span>
                      </label>

                      <label className="project-overview-checkbox">
                        <input
                          type="checkbox"
                          checked={academicActivityForm.markAsAchievement}
                          onChange={(event) => updateAcademicActivityForm('markAsAchievement', event.target.checked)}
                        />
                        <span>
                          <strong>Mark as achievement / recognition</strong>
                          <span>Use this when the activity should also count as a recognition entry.</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-actions project-overview-modal-actions">
                  <button className="btn btn-secondary" type="button" onClick={closeAcademicActivityModal}>Cancel</button>
                  <button className="btn btn-primary" type="submit">
                    <i className="fas fa-floppy-disk" aria-hidden="true" /> Save Academic Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  );
}
