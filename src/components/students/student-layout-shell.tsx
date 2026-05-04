'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { logout } from '@/lib/mock/auth';
import type { StudentDashboardData } from '@/lib/mock/student-dashboard';
import { STUDENT_NAV_ITEMS, STUDENT_NAV_SECTIONS } from '@/components/students/student-navigation';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';

const SIDEBAR_STORAGE_KEY = 'studentShellSidebarCollapsed';
const AUTH_USER_STORAGE_KEY = 'capstoneAuthUser';
const PROFILE_DRAFT_STORAGE_KEY = 'capstoneStudentProfileDraft';
const FULL_WORKSPACE_DEMO_STUDENT_IDS = new Set([2, 8, 9, 10, 11]);
const FULL_WORKSPACE_DEMO_STUDENT_EMAILS = new Set([
  'maria.santos@university.edu.ph',
  'rafael.dizon@university.edu.ph',
  'bianca.navarro@university.edu.ph',
  'cedric.alvarez@university.edu.ph',
  'isabela.cortez@university.edu.ph'
]);

type StoredAuthUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

type StoredProfileDraft = {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  email?: string;
  department?: string;
  yearLevel?: string;
};

type LimitedStudentProfile = {
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  yearLevel: string;
};

type StudentWorkspaceAccess = {
  isLimited: boolean;
  profile: LimitedStudentProfile | null;
};

const limitedStudentRouteLabels = [
  { href: '/students/project-overview', label: 'Project Overview' },
  { href: '/students/project-files', label: 'Project Files' },
  { href: '/students/progress-reports', label: 'Progress Reports' },
  { href: '/students/faculty-feedback', label: 'Faculty Feedback' },
  { href: '/students/milestones', label: 'Milestones' },
  { href: '/students/schedule', label: 'Schedule' },
  { href: '/students/title-submission', label: 'Title Submission' },
  { href: '/students/technology-transfer', label: 'Technology Transfer' },
  { href: '/students/upload-documents', label: 'Document Uploads' },
  { href: '/students/presentations-achievements', label: 'Presentations and Achievements' },
  { href: '/students/timeline', label: 'Timeline' },
  { href: '/students/notifications', label: 'Notifications' },
  { href: '/students/history', label: 'History' }
] as const;

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function readStoredJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : null;
  } catch {
    return null;
  }
}

function getFirstName(value: string) {
  return value.split(' ').filter(Boolean)[0] || 'Student';
}

function buildLimitedStudentProfile(
  data: StudentDashboardData,
  storedUser: StoredAuthUser,
  draft: StoredProfileDraft | null
): LimitedStudentProfile {
  const draftName = normalizeText(`${draft?.firstName || ''} ${draft?.lastName || ''}`);
  const fullName = normalizeText(storedUser.name) || draftName || data.profile.fullName;

  return {
    fullName,
    email: normalizeText(storedUser.email) || normalizeText(draft?.email) || data.profile.email,
    studentId: normalizeText(draft?.studentId) || 'Pending student ID',
    department: normalizeText(draft?.department) || 'Pending department',
    yearLevel: normalizeText(draft?.yearLevel) || 'Pending year level'
  };
}

function getInitialWorkspaceAccess(data: StudentDashboardData): StudentWorkspaceAccess {
  const storedUser = readStoredJson<StoredAuthUser>(AUTH_USER_STORAGE_KEY);

  if (!storedUser || storedUser.role !== 'student') {
    return { isLimited: false, profile: null };
  }

  const normalizedEmail = normalizeText(storedUser.email).toLowerCase();
  const hasFullDemoWorkspace =
    (typeof storedUser.id === 'number' && FULL_WORKSPACE_DEMO_STUDENT_IDS.has(storedUser.id)) ||
    FULL_WORKSPACE_DEMO_STUDENT_EMAILS.has(normalizedEmail);

  if (hasFullDemoWorkspace) {
    return { isLimited: false, profile: null };
  }

  const draft = readStoredJson<StoredProfileDraft>(PROFILE_DRAFT_STORAGE_KEY);

  return {
    isLimited: true,
    profile: buildLimitedStudentProfile(data, storedUser, draft)
  };
}

function isLimitedStudentAllowedRoute(pathname: string) {
  return (
    matchesRoute(pathname, '/students/dashboard') ||
    matchesRoute(pathname, '/students/repository') ||
    matchesRoute(pathname, '/students/profile')
  );
}

function getLimitedRouteLabel(pathname: string) {
  return limitedStudentRouteLabels.find((item) => matchesRoute(pathname, item.href))?.label || 'Project Workspace';
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getShortName(value: string) {
  const parts = value.split(' ').filter(Boolean);
  return parts.slice(0, 2).join(' ') || value;
}

function matchesRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type StudentLayoutShellProps = {
  children: React.ReactNode;
  data: StudentDashboardData;
};

type StudentNotification = StudentDashboardData['notifications'][number];

function sortNotifications(items: StudentNotification[]) {
  return [...items].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
}

function getNotificationAction(notification: StudentNotification) {
  if (notification.route) {
    return {
      href: notification.route,
      label: notification.actionLabel || 'View detail'
    };
  }

  const fallbackActionByType: Record<string, { href: string; label: string }> = {
    approval: { href: '/students/project-files', label: 'Open project files' },
    deadline: { href: '/students/project-files', label: 'Open project files' },
    feedback: { href: '/students/faculty-feedback', label: 'Open feedback' },
    general: { href: '/students/dashboard', label: 'Open dashboard' },
    profile: { href: '/students/profile', label: 'Open profile' },
    schedule: { href: '/students/schedule', label: 'Check schedule' },
    transfer: { href: '/students/project-overview', label: 'Open project overview' }
  };

  return fallbackActionByType[notification.type] || fallbackActionByType.general;
}

function getNotificationTypeMeta(type: StudentNotification['type']) {
  switch (type) {
    case 'feedback':
      return { icon: 'fa-comments', tone: 'feedback', label: 'Feedback' };
    case 'deadline':
      return { icon: 'fa-hourglass-half', tone: 'deadline', label: 'Deadline' };
    case 'approval':
      return { icon: 'fa-circle-check', tone: 'approval', label: 'Approval' };
    case 'schedule':
      return { icon: 'fa-calendar-check', tone: 'schedule', label: 'Schedule' };
    case 'transfer':
      return { icon: 'fa-diagram-project', tone: 'general', label: 'Project Update' };
    case 'profile':
      return { icon: 'fa-user-gear', tone: 'general', label: 'Profile' };
    default:
      return { icon: 'fa-bell', tone: 'general', label: 'General' };
  }
}

type LimitedWorkspaceSetupState = {
  accountActivated: boolean;
  profileCompleted: boolean;
  groupAssigned: boolean;
  adviserAssigned: boolean;
  workspaceUnlocked: boolean;
};

type LimitedWorkspaceSetupStep = {
  key: string;
  label: string;
  description: string;
  done: boolean;
  icon: string;
};

type LimitedWorkspaceStatusItem = {
  label: string;
  value: string;
  helper: string;
  tone: 'success' | 'info' | 'warning' | 'neutral';
};

function hasProfileValue(value: string) {
  const normalized = normalizeText(value).toLowerCase();
  return Boolean(normalized && !normalized.startsWith('pending '));
}

function getLimitedWorkspaceSetupState(profile: LimitedStudentProfile): LimitedWorkspaceSetupState {
  const profileCompleted =
    hasProfileValue(profile.studentId) && hasProfileValue(profile.department) && hasProfileValue(profile.yearLevel);

  return {
    accountActivated: true,
    profileCompleted,
    groupAssigned: false,
    adviserAssigned: false,
    workspaceUnlocked: false
  };
}

function getLimitedWorkspaceSetupSteps(setupState: LimitedWorkspaceSetupState): LimitedWorkspaceSetupStep[] {
  return [
    {
      key: 'account',
      label: 'Account Activated',
      description: 'Your student sign-in is ready and your portal access is live.',
      done: setupState.accountActivated,
      icon: 'fa-circle-check'
    },
    {
      key: 'profile',
      label: 'Profile Completed',
      description: 'Your student ID, department, and year level should be confirmed.',
      done: setupState.profileCompleted,
      icon: 'fa-id-card'
    },
    {
      key: 'group',
      label: 'Group Assigned',
      description: 'Your official capstone group appears here after assignment.',
      done: setupState.groupAssigned,
      icon: 'fa-people-group'
    },
    {
      key: 'adviser',
      label: 'Adviser Assigned',
      description: 'Your adviser becomes visible once supervision is assigned.',
      done: setupState.adviserAssigned,
      icon: 'fa-user-tie'
    },
    {
      key: 'workspace',
      label: 'Workspace Unlocked',
      description: 'Project tools open automatically when your assignment is complete.',
      done: setupState.workspaceUnlocked,
      icon: 'fa-unlock-keyhole'
    }
  ];
}

function getLimitedWorkspaceStatusItems(setupState: LimitedWorkspaceSetupState): LimitedWorkspaceStatusItem[] {
  return [
    {
      label: 'Account',
      value: 'Activated',
      helper: 'You can sign in and use the open student tools now.',
      tone: 'success'
    },
    {
      label: 'Profile',
      value: setupState.profileCompleted ? 'Ready for review' : 'Needs completion',
      helper: setupState.profileCompleted
        ? 'Your registration details are already in place.'
        : 'Review your saved details before assignment.',
      tone: setupState.profileCompleted ? 'info' : 'warning'
    },
    {
      label: 'Group',
      value: 'Not assigned yet',
      helper: 'The research office will attach your official group record here.',
      tone: 'warning'
    },
    {
      label: 'Adviser',
      value: 'Pending assignment',
      helper: 'Adviser details will appear as soon as they are assigned.',
      tone: 'warning'
    },
    {
      label: 'Project',
      value: 'No active project yet',
      helper: 'A project title and workspace will appear after assignment.',
      tone: 'neutral'
    }
  ];
}

function LimitedStudentWorkspaceHome({ profile }: { profile: LimitedStudentProfile }) {
  const setupState = getLimitedWorkspaceSetupState(profile);
  const setupSteps = getLimitedWorkspaceSetupSteps(setupState);
  const completedSteps = setupSteps.filter((step) => step.done).length;
  const progressPercent = Math.round((completedSteps / setupSteps.length) * 100);
  const statusItems = getLimitedWorkspaceStatusItems(setupState);
  const nextSteps = [
    {
      title: 'Review your profile',
      description: 'Confirm your student ID, department, and year level so the assignment can match your record.',
      href: '/students/profile',
      action: 'Review Profile',
      icon: 'fa-user'
    },
    {
      title: 'Browse the repository',
      description: 'Read completed studies and sample outputs while you wait for your capstone workspace.',
      href: '/students/repository',
      action: 'Browse Repository',
      icon: 'fa-book'
    },
    {
      title: 'Prepare your capstone details',
      description: 'Keep your project ideas, notes, and references ready for the moment your workspace opens.',
      icon: 'fa-lightbulb'
    },
    {
      title: 'Watch for assignment updates',
      description: 'Once your group and adviser are assigned, the student workspace can unlock without extra setup.',
      icon: 'fa-bell'
    }
  ];
  const lockedFeatures = [
    {
      label: 'Project workspace',
      description: 'Overview, project title, group role, and live capstone record.'
    },
    {
      label: 'Milestones',
      description: 'Timeline checkpoints, review dates, and completion tracking.'
    },
    {
      label: 'File submissions',
      description: 'Document uploads, revision history, and approved repository files.'
    },
    {
      label: 'Adviser feedback',
      description: 'Faculty comments, review notes, and formal guidance.'
    }
  ];

  return (
    <section className="student-limited-workspace-page space-y-5">
      <div className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <span className="page-breadcrumb" aria-hidden="true">
              <i className="fas fa-user-graduate" /> Student Portal
            </span>
            <h1>Welcome, {getFirstName(profile.fullName)}</h1>
            <p>Your student account is active. Project tools unlock after your group, adviser, and project record are assigned.</p>
          </div>
        </div>
      </div>

      <section className="hero-card !mb-0 !grid !gap-5">
        <div className="hero-card-main space-y-5">
          <div className="chip-row flex flex-wrap gap-2">
            <span className="ui-badge is-warning">
              <i className="fas fa-hourglass-half" aria-hidden="true" /> Pending assignment
            </span>
            <span className="ui-badge is-neutral">
              <i className="fas fa-id-card" aria-hidden="true" /> {profile.studentId}
            </span>
            <span className="ui-badge is-info">
              <i className="fas fa-list-check" aria-hidden="true" /> {completedSteps}/{setupSteps.length} steps ready
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="max-w-3xl">Your capstone workspace is being prepared</h2>
            <p className="max-w-3xl">
              Your account is active, but project tools stay locked until your official group and adviser are assigned.
              Once those assignments are added, your workspace can unlock and your project pages can populate
              automatically.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Workspace status</span>
              <p className="mt-2 text-lg font-semibold text-white">Pending assignment</p>
              <p className="mt-1 text-sm text-slate-200">Project tools unlock after group and adviser assignment.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Available now</span>
              <p className="mt-2 text-lg font-semibold text-white">Profile and repository</p>
              <p className="mt-1 text-sm text-slate-200">You can still confirm your details and explore completed studies.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:col-span-2 xl:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Unlock trigger</span>
              <p className="mt-2 text-lg font-semibold text-white">Assignment record posted</p>
              <p className="mt-1 text-sm text-slate-200">Group, adviser, and active project details feed the workspace.</p>
            </div>
          </div>

          <div className="hero-actions !mt-0 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/students/repository">
              <i className="fas fa-book" aria-hidden="true" /> Browse Repository
            </Link>
            <Link className="btn btn-secondary" href="/students/profile">
              <i className="fas fa-user" aria-hidden="true" /> Review Profile
            </Link>
          </div>
        </div>

        <div className="hero-card-side">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Status overview</span>
                <h3 className="mt-2 text-xl font-semibold text-white">Assignment summary</h3>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                {progressPercent}% ready
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {statusItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-slate-950/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-100">{item.label}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        item.tone === 'success'
                          ? 'bg-emerald-400/15 text-emerald-100'
                          : item.tone === 'info'
                            ? 'bg-sky-400/15 text-sky-100'
                            : item.tone === 'warning'
                              ? 'bg-amber-300/15 text-amber-100'
                              : 'bg-white/10 text-slate-100'
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200">{item.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3">
              <p className="text-sm font-semibold text-white">No active project yet</p>
              <p className="mt-1 text-sm text-slate-200">
                Group name, adviser, project title, and workspace activity appear here after assignment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Setup progress</span>
                <h3>Pre-assignment checklist</h3>
              </div>
              <span className="ui-badge is-info">{completedSteps} of {setupSteps.length} complete</span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--student-primary,#0f4c81)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3">
              {setupSteps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                    step.done ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                      step.done ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                    }`}
                  >
                    <i className={`fas ${step.done ? 'fa-check' : step.icon}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Step {index + 1}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.done ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm font-semibold ${step.done ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {step.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Next steps</span>
                <h3>What you can do now</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {nextSteps.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--student-primary,#0f4c81)] shadow-sm">
                      <i className={`fas ${item.icon}`} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                      {item.href ? (
                        <Link className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--student-primary,#0f4c81)]" href={item.href}>
                          {item.action}
                          <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <i className="fas fa-clock text-xs" aria-hidden="true" />
                          Waiting for assignment
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Available now</span>
                <h3>Open student features</h3>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Review Profile</p>
                    <p className="mt-1 text-sm text-slate-500">Check the student record saved during registration.</p>
                  </div>
                  <span className="ui-badge is-success">Available</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Browse Repository</p>
                    <p className="mt-1 text-sm text-slate-500">Explore completed research and academic references.</p>
                  </div>
                  <span className="ui-badge is-success">Available</span>
                </div>
              </div>
            </div>
          </article>

          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Locked until assignment</span>
                <h3>Features waiting for your workspace</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {lockedFeatures.map((feature) => (
                <div key={feature.label} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{feature.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
                    </div>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                      <i className="fas fa-lock" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4">
              <p className="text-sm font-semibold text-amber-900">Intentional pre-assignment state</p>
              <p className="mt-1 text-sm text-amber-800">
                This dashboard stays lightweight until real assignment data is available, so it can connect cleanly to
                group, adviser, and project records later.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function LimitedStudentProfileView({ profile }: { profile: LimitedStudentProfile }) {
  const setupState = getLimitedWorkspaceSetupState(profile);
  const setupSteps = getLimitedWorkspaceSetupSteps(setupState);
  const statusItems = getLimitedWorkspaceStatusItems(setupState);
  const completedSteps = setupSteps.filter((step) => step.done).length;
  const progressPercent = Math.round((completedSteps / setupSteps.length) * 100);
  const profileItems = [
    { label: 'Full name', value: profile.fullName },
    { label: 'Email', value: profile.email },
    { label: 'Student ID', value: profile.studentId },
    { label: 'Department', value: profile.department },
    { label: 'Year level', value: profile.yearLevel },
    { label: 'Workspace status', value: 'Awaiting group and adviser assignment' }
  ];
  const profileReadiness = [
    {
      label: 'Student ID',
      value: profile.studentId,
      done: hasProfileValue(profile.studentId)
    },
    {
      label: 'Department',
      value: profile.department,
      done: hasProfileValue(profile.department)
    },
    {
      label: 'Year level',
      value: profile.yearLevel,
      done: hasProfileValue(profile.yearLevel)
    },
    {
      label: 'Assignment',
      value: 'Pending assignment',
      done: false
    }
  ];
  const nextMilestones = [
    'Your group record is linked to this student profile.',
    'Your adviser is assigned and appears in the student shell.',
    'Project pages unlock for workspace activity, milestones, and file submissions.'
  ];

  return (
    <section className="student-limited-workspace-page space-y-5">
      <div className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <span className="page-breadcrumb" aria-hidden="true">
              <i className="fas fa-user" /> Profile
            </span>
            <h1>Student Profile</h1>
            <p>Review the account details that will be used when your capstone assignment is posted.</p>
          </div>
        </div>
      </div>

      <section className="hero-card !mb-0 !grid !gap-5">
        <div className="hero-card-main space-y-5">
          <div className="chip-row flex flex-wrap gap-2">
            <span className="ui-badge is-warning">
              <i className="fas fa-hourglass-half" aria-hidden="true" /> Pending assignment
            </span>
            <span className="ui-badge is-info">
              <i className="fas fa-address-card" aria-hidden="true" /> Profile on file
            </span>
            <span className="ui-badge is-neutral">
              <i className="fas fa-list-check" aria-hidden="true" /> {completedSteps}/{setupSteps.length} setup steps ready
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="max-w-3xl">Your student record is ready for assignment</h2>
            <p className="max-w-3xl">
              These profile details support your future group, adviser, and workspace assignment. Once the assignment is
              posted, this profile can connect directly to your capstone records without extra setup.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Student ID</span>
              <p className="mt-2 text-lg font-semibold text-white">{profile.studentId}</p>
              <p className="mt-1 text-sm text-slate-200">Used to match your official student record.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Department</span>
              <p className="mt-2 text-lg font-semibold text-white">{profile.department}</p>
              <p className="mt-1 text-sm text-slate-200">Helps route your profile to the right academic workspace.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:col-span-2 xl:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Year level</span>
              <p className="mt-2 text-lg font-semibold text-white">{profile.yearLevel}</p>
              <p className="mt-1 text-sm text-slate-200">Stored as part of your registration profile.</p>
            </div>
          </div>

          <div className="hero-actions !mt-0 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/students/dashboard">
              <i className="fas fa-gauge-high" aria-hidden="true" /> Back to Dashboard
            </Link>
            <Link className="btn btn-secondary" href="/students/repository">
              <i className="fas fa-book" aria-hidden="true" /> Browse Repository
            </Link>
          </div>
        </div>

        <div className="hero-card-side">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Profile status</span>
                <h3 className="mt-2 text-xl font-semibold text-white">Assignment readiness</h3>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                {progressPercent}% ready
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {statusItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-slate-950/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-100">{item.label}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        item.tone === 'success'
                          ? 'bg-emerald-400/15 text-emerald-100'
                          : item.tone === 'info'
                            ? 'bg-sky-400/15 text-sky-100'
                            : item.tone === 'warning'
                              ? 'bg-amber-300/15 text-amber-100'
                              : 'bg-white/10 text-slate-100'
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200">{item.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3">
              <p className="text-sm font-semibold text-white">Waiting for assignment</p>
              <p className="mt-1 text-sm text-slate-200">
                Group role, adviser, project code, and workspace details appear here after official assignment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Registration details</span>
                <h3>{profile.fullName}</h3>
              </div>
              <span className={`ui-badge ${setupState.profileCompleted ? 'is-info' : 'is-warning'}`}>
                {setupState.profileCompleted ? 'Profile ready' : 'Review needed'}
              </span>
            </div>

            <div className="detail-grid">
              {profileItems.map((item) => (
                <div key={item.label} className="detail-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Setup progress</span>
                <h3>Pre-assignment checklist</h3>
              </div>
              <span className="ui-badge is-info">{completedSteps} of {setupSteps.length} complete</span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--student-primary,#0f4c81)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3">
              {setupSteps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                    step.done ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                      step.done ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                    }`}
                  >
                    <i className={`fas ${step.done ? 'fa-check' : step.icon}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Step {index + 1}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.done ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm font-semibold ${step.done ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {step.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Profile readiness</span>
                <h3>What is already in place</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {profileReadiness.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-4 py-4 ${
                    item.done ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${item.done ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {item.label}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.done ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card !p-5">
            <div className="card-heading">
              <div>
                <span className="section-kicker">What happens next</span>
                <h3>After this profile is assigned</h3>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {nextMilestones.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--student-primary,#0f4c81)] shadow-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4">
              <p className="text-sm font-semibold text-amber-900">Backend-ready profile state</p>
              <p className="mt-1 text-sm text-amber-800">
                This screen is structured so real group, adviser, and project assignment data can replace the current
                pending state without changing the layout.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function LimitedStudentLockedFeature({
  featureLabel,
  profile
}: {
  featureLabel: string;
  profile: LimitedStudentProfile;
}) {
  return (
    <section className="student-limited-workspace-page">
      <div className="top-nav">
        <div className="top-nav-leading">
          <div className="page-title">
            <span className="page-breadcrumb" aria-hidden="true">
              <i className="fas fa-lock" /> Limited Access
            </span>
            <h1>{featureLabel} is locked</h1>
            <p>This feature needs an assigned group, adviser, and project record.</p>
          </div>
        </div>
      </div>

      <section className="hero-card">
        <div className="hero-card-main">
          <span className="ui-badge is-warning">
            <i className="fas fa-hourglass-half" aria-hidden="true" /> Awaiting assignment
          </span>
          <h2>Project tools are not available yet</h2>
          <p>
            {profile.fullName} can use the available student features while the project workspace is being prepared.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/students/dashboard">
              <i className="fas fa-gauge-high" aria-hidden="true" /> Back to dashboard
            </Link>
            <Link className="btn btn-secondary" href="/students/repository">
              <i className="fas fa-book" aria-hidden="true" /> Browse repository
            </Link>
          </div>
        </div>

        <div className="hero-card-side">
          <div className="empty-state">
            <span className="empty-state-icon">
              <i className="fas fa-user-lock" aria-hidden="true" />
            </span>
            <h3>Assignment required</h3>
            <p>Ask the research office to assign your group and adviser when your capstone record is ready.</p>
          </div>
        </div>
      </section>
    </section>
  );
}

export function StudentLayoutShell({ children, data }: StudentLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const [workspaceAccess, setWorkspaceAccess] = useState<StudentWorkspaceAccess>(() => getInitialWorkspaceAccess(data));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [layoutDebug, setLayoutDebug] = useState('Fetching...');
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (storedValue === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 1100px)');

    const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const nextIsMobile = event.matches;
      setIsMobile(nextIsMobile);

      if (!nextIsMobile) {
        setSidebarOpen(false);
      }
    };

    handleMediaChange(mediaQuery);

    const listener = (event: MediaQueryListEvent) => {
      handleMediaChange(event);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationMenuOpen(false);
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

  useEffect(() => {
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function checkRealGroupAccess() {
      try {
        let realStudentName = '';
        
        // 1. Try real API auth
        const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (authRes.ok) {
          const authData = await authRes.json();
          const user = authData.data?.user;
          if (user) {
            realStudentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
          }
        }
        
        // 2. Fallback to mock local storage
        if (!realStudentName) {
          const storedUser = readStoredJson<StoredAuthUser>(AUTH_USER_STORAGE_KEY);
          if (storedUser && storedUser.name) {
            realStudentName = storedUser.name;
          } else {
            setLayoutDebug('Auth failed: No real or mock session found.');
            return;
          }
        }

        const res = await fetch(`/api/groups?studentName=${encodeURIComponent(realStudentName)}`, { cache: 'no-store' });
        if (res.ok) {
          const groups = await res.json();
          setLayoutDebug(`Fetched groups for ${realStudentName}: found ${groups.length}`);
          if (groups.length > 0) {
            setWorkspaceAccess(prev => ({ ...prev, isLimited: false }));
          }
        } else {
          setLayoutDebug(`Fetch failed with status ${res.status}`);
        }
      } catch (e: any) {
        setLayoutDebug(`Fetch threw error: ${e.message}`);
        console.error('Failed to check real group access', e);
      } finally {
        setIsCheckingAccess(false);
      }
    }
    
    checkRealGroupAccess();
  }, []);

  const [dbProfile, setDbProfile] = useState<{ fullName: string; email: string; studentId: string; groupRole: string | null; projectCode: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDbProfile() {
      try {
        const response = await fetch('/api/profile', { credentials: 'same-origin' });
        if (!response.ok) return;

        const result = await response.json();
        if (cancelled || !result?.success || !result.user) return;

        const u = result.user;
        const userName = u.name || u.displayName || '';

        // Check real group assignment
        let groupRole: string | null = null;
        let projectCode: string | null = null;

        if (userName) {
          try {
            const groupRes = await fetch(`/api/groups?studentName=${encodeURIComponent(userName)}`, { cache: 'no-store' });
            if (groupRes.ok) {
              const groups = await groupRes.json();
              if (Array.isArray(groups) && groups.length > 0) {
                const group = groups[0];
                groupRole = group.leader === userName ? 'Group Leader' : 'Member';
                projectCode = group.code || group.projectTitle || null;
              }
            }
          } catch {
            // Group check failed — leave as null
          }
        }

        if (!cancelled) {
          setDbProfile({
            fullName: userName,
            email: u.email || '',
            studentId: u.studentId || '',
            groupRole,
            projectCode
          });
        }
      } catch {
        // Silently fall back to mock data
      }
    }

    loadDbProfile();
    return () => { cancelled = true; };
  }, []);

  const isLimitedWorkspace = isCheckingAccess ? false : workspaceAccess.isLimited;
  const limitedProfile = workspaceAccess.profile;
  const shellProfile = {
    fullName: dbProfile?.fullName || limitedProfile?.fullName || data.profile.fullName,
    email: dbProfile?.email || limitedProfile?.email || data.profile.email,
    studentId: dbProfile?.studentId || limitedProfile?.studentId || data.profile.studentId,
    groupRole: dbProfile !== null
      ? (dbProfile.groupRole || 'Not assigned')
      : (isLimitedWorkspace ? 'Awaiting Assignment' : data.profile.groupRole),
    projectCode: dbProfile !== null
      ? (dbProfile.projectCode || 'No active project')
      : (isLimitedWorkspace ? 'No active project' : data.project.projectCode)
  };
  const shellNotifications = isLimitedWorkspace ? [] : data.notifications;
  const unreadNotificationsCount = shellNotifications.filter((item) => !item.read).length;
  const highPriorityNotificationsCount = shellNotifications.filter((item) => !item.read && item.priority === 'high').length;
  const unreadFeedbackCount = isLimitedWorkspace ? 0 : data.feedback.filter((item) => item.unread).length;
  const recentNotifications = useMemo(
    () => sortNotifications(shellNotifications || []).slice(0, 4),
    [shellNotifications]
  );
  const navigationSections = useMemo(
    () =>
      STUDENT_NAV_SECTIONS.map((section) => ({
        ...section,
        items: STUDENT_NAV_ITEMS.filter((item) => {
          if (item.section !== section.key) {
            return false;
          }

          if (!isLimitedWorkspace) {
            return true;
          }

          return item.key === 'dashboard' || item.key === 'repository';
        })
      })).filter((section) => section.items.length),
    [isLimitedWorkspace]
  );
  const limitedMainContent =
    isLimitedWorkspace && limitedProfile
      ? matchesRoute(pathname, '/students/dashboard')
        ? <LimitedStudentWorkspaceHome profile={limitedProfile} />
        : !isLimitedStudentAllowedRoute(pathname)
            ? <LimitedStudentLockedFeature featureLabel={getLimitedRouteLabel(pathname)} profile={limitedProfile} />
            : null
      : null;

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
  };

  const toggleLabel = isMobile
    ? sidebarOpen
      ? 'Close sidebar'
      : 'Open sidebar'
    : sidebarCollapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar';

  return (
    <div
      className={`student-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}${sidebarOpen ? ' is-sidebar-open' : ''}`}
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
    >
      <header className="student-global-navbar">
        <div className="student-global-navbar-main">
          <button
            aria-label={toggleLabel}
            className="icon-btn student-shell-toggle"
            type="button"
            onClick={toggleSidebar}
          >
            <i
              aria-hidden="true"
              className={`fas ${isMobile ? (sidebarOpen ? 'fa-xmark' : 'fa-bars') : sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}
            />
          </button>

          <PortalShellBrand
            className="student-shell-brand"
            href="/students/dashboard"
            icon="fa-graduation-cap"
            title="Thesis Track"
          />
        </div>

        <div className="student-global-navbar-actions">
          <div className="notification-menu-shell" ref={notificationMenuRef}>
            <button
              aria-expanded={notificationMenuOpen ? 'true' : 'false'}
              aria-haspopup="menu"
              aria-label="Open notifications"
              className={`notification-trigger${notificationMenuOpen ? ' is-active' : ''}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setProfileMenuOpen(false);
                setNotificationMenuOpen((current) => !current);
              }}
            >
              <span className="notification-trigger-icon" aria-hidden="true">
                <i className="fas fa-bell" />
              </span>
              <span className="notification-trigger-copy">
                <strong>Notifications</strong>
                <small>{unreadNotificationsCount ? `${unreadNotificationsCount} unread` : 'All caught up'}</small>
              </span>
              {unreadNotificationsCount ? <span className="notification-trigger-count">{unreadNotificationsCount}</span> : null}
            </button>

            <div className={`notification-menu ${notificationMenuOpen ? 'is-open' : ''}`}>
              <div className="notification-menu-hero">
                <div className="notification-menu-hero-copy">
                  <span className="notification-menu-kicker">Inbox</span>
                  <strong>Notifications</strong>
                  <small>Latest feedback, schedule updates, deadlines, and approvals for your workspace.</small>
                </div>
                <Link className="notification-menu-view-all" href={isLimitedWorkspace ? '/students/dashboard' : '/students/notifications'}>
                  {isLimitedWorkspace ? 'View setup' : 'Open center'}
                </Link>
              </div>

              <div className="notification-menu-summary">
                <span className="notification-menu-summary-pill is-primary">
                  <i aria-hidden="true" className="fas fa-envelope-open-text" />
                  {unreadNotificationsCount ? `${unreadNotificationsCount} unread` : '0 unread'}
                </span>
                <span className={`notification-menu-summary-pill${highPriorityNotificationsCount ? ' is-danger' : ''}`}>
                  <i aria-hidden="true" className="fas fa-bolt" />
                  {highPriorityNotificationsCount ? `${highPriorityNotificationsCount} urgent` : 'No urgent items'}
                </span>
              </div>

              {recentNotifications.length ? (
                <div className="notification-menu-list" role="menu">
                  {recentNotifications.map((notification) => {
                    const action = getNotificationAction(notification);
                    const meta = getNotificationTypeMeta(notification.type);

                    return (
                      <Link
                        key={notification.id}
                        className={`notification-menu-item${notification.read ? '' : ' is-unread'}`}
                        href={action.href}
                      >
                        <span className={`notification-menu-item-icon is-${meta.tone}`}>
                          <i aria-hidden="true" className={`fas ${meta.icon}`} />
                        </span>
                        <span className="notification-menu-item-copy">
                          <span className="notification-menu-item-head">
                            <strong>{notification.title}</strong>
                            {!notification.read ? <span className="notification-menu-item-dot" aria-hidden="true" /> : null}
                          </span>
                          <small>{notification.message}</small>
                          <span className="notification-menu-item-footer">
                            <span className="notification-menu-item-meta">
                              <span>{notification.dateLabel}</span>
                              <span className={`notification-menu-item-badge${notification.priority === 'high' ? ' is-danger' : ''}`}>
                                {notification.priority === 'high' ? 'High priority' : meta.label}
                              </span>
                            </span>
                            <span className="notification-menu-item-cta">
                              {action.label}
                              <i aria-hidden="true" className="fas fa-arrow-right" />
                            </span>
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="notification-menu-empty">
                  <strong>{isLimitedWorkspace ? 'No project notifications yet' : 'All caught up'}</strong>
                  <p>
                    {isLimitedWorkspace
                      ? 'Feedback, deadlines, and approvals begin after your group and adviser are assigned.'
                      : 'No notification is waiting right now.'}
                  </p>
                </div>
              )}

              <div className="notification-menu-footer">
                <Link className="notification-menu-footer-link" href={isLimitedWorkspace ? '/students/dashboard' : '/students/notifications'}>
                  {isLimitedWorkspace ? 'Back to dashboard' : 'See all notifications'}
                  <i aria-hidden="true" className="fas fa-arrow-up-right-from-square" />
                </Link>
              </div>
            </div>
          </div>

          <div className="profile-menu-shell" ref={profileMenuRef}>
            <div className={`profile-menu ${profileMenuOpen ? 'is-open' : ''}`}>
              <button
                aria-expanded={profileMenuOpen ? 'true' : 'false'}
                aria-haspopup="menu"
                className="profile-pill profile-nav-btn student-global-profile"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setNotificationMenuOpen(false);
                  setProfileMenuOpen((current) => !current);
                }}
              >
                <span className="profile-nav-btn-avatar">{getInitials(shellProfile.fullName)}</span>
                <span className="profile-nav-btn-copy">
                  <strong>{getShortName(shellProfile.fullName)}</strong>
                  <small>{shellProfile.groupRole}</small>
                </span>
                <i aria-hidden="true" className="fas fa-chevron-down profile-nav-btn-chevron" />
              </button>

              <div className="profile-dropdown" role="menu" aria-label="User menu">
                <div className="profile-dropdown-header">
                  <strong>{shellProfile.fullName}</strong>
                  <span>{shellProfile.email}</span>
                </div>

                <div className="profile-dropdown-section">
                  <span className="profile-dropdown-label">Workspace</span>
                  <div className="student-profile-dropdown-pills">
                    <span className="student-profile-dropdown-pill is-primary">
                      <i aria-hidden="true" className="fas fa-user-graduate" />
                      {shellProfile.groupRole}
                    </span>
                    <span className="student-profile-dropdown-pill">
                      <i aria-hidden="true" className="fas fa-id-card" />
                      {shellProfile.studentId}
                    </span>
                    <span className="student-profile-dropdown-pill">
                      <i aria-hidden="true" className="fas fa-folder-open" />
                      {shellProfile.projectCode}
                    </span>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <Link className="profile-dropdown-link" href="/students/profile" onClick={() => setProfileMenuOpen(false)}>
                  <i aria-hidden="true" className="fas fa-user" /> My Profile
                </Link>

                <Link className="profile-dropdown-link" href="/students/history" onClick={() => setProfileMenuOpen(false)}>
                  <i aria-hidden="true" className="fas fa-clock-rotate-left" /> History
                </Link>

                <Link className="profile-dropdown-link" href="/students/settings" onClick={() => setProfileMenuOpen(false)}>
                  <i aria-hidden="true" className="fas fa-cog" /> Settings
                </Link>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-dropdown-link is-danger"
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                >
                  <i aria-hidden="true" className="fas fa-right-from-bracket" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <aside className={`student-global-sidebar sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">Student Portal</span>
            <div className="brand-mark">
              <i aria-hidden="true" className="fas fa-graduation-cap" />
              <span>Student</span>
              <strong>Workspace</strong>
            </div>
            <p>
              {isLimitedWorkspace
                ? 'Profile and repository access are available while project assignment is pending.'
                : 'Milestones, submissions, and project planning organized in one consistent academic workspace.'}
            </p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className="fas fa-id-card" />
            <span>{shellProfile.projectCode}</span>
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Student workspace navigation">
          {navigationSections.map((section) => (
            <div key={section.key} className="sidebar-nav-group">
              <span className="sidebar-nav-heading">{section.label}</span>
              <div className="sidebar-nav-links">
                {section.items.map((item) => {
                  const isActive = matchesRoute(pathname, item.href);
                  const count = item.key === 'faculty-feedback' ? unreadFeedbackCount : 0;

                  return (
                    <Link
                      key={item.key}
                      aria-current={isActive ? 'page' : undefined}
                      className={`sidebar-link ${isActive ? 'is-active' : ''}`}
                      href={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="sidebar-link-icon">
                        <i aria-hidden="true" className={`fas ${item.icon}`} />
                      </span>
                      <span className="sidebar-link-label">{item.label}</span>
                      {count ? <span className="nav-count is-pending">{count}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <button
        aria-label="Close sidebar"
        className={`student-global-backdrop sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        type="button"
        onClick={() => setSidebarOpen(false)}
      />

      <main className="student-global-main">
        <div className="student-global-content">
          {isCheckingAccess ? (
            <div className="flex min-h-[80vh] items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <i className="fas fa-circle-notch fa-spin text-4xl text-[var(--student-primary,#0f4c81)]" />
                <p className="font-semibold animate-pulse text-gray-500">Loading workspace...</p>
              </div>
            </div>
          ) : (
            limitedMainContent || children
          )}
        </div>
      </main>
    </div>
  );
}
