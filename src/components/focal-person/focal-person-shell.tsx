'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { requestLogout } from '@/components/auth/logout-flow';
import { PortalShellActionMenus, type PortalNotificationItem } from '@/components/shared/portal-shell-action-menus';
import { useShellSidebar } from '@/components/shared/use-shell-sidebar';
import { AdminPage, EmptyState, PageHeader } from '@/components/system-admin/ui';
import { getStoredUser } from '@/lib/mock/auth';
import { termForDate, termLabel, schoolYearLabel } from '@/lib/focal-person/terms';
import type { FocalDepartment, FocalNotification } from '@/lib/focal-person/types';
import { useFocalNotifications, useFocalWorkspace } from './use-focal-workspace';
import styles from './focal-person.module.css';

type FocalNavKey = 'dashboard' | 'research-groups' | 'defense-schedules' | 'reports';

const NAV_ITEMS: { key: FocalNavKey; href: string; label: string; icon: string }[] = [
  { key: 'dashboard', href: '/focal-person/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
  { key: 'research-groups', href: '/focal-person/research-groups', label: 'Research Groups', icon: 'fa-users' },
  { key: 'defense-schedules', href: '/focal-person/defense-schedules', label: 'Defense Schedules', icon: 'fa-calendar-days' },
  { key: 'reports', href: '/focal-person/reports', label: 'Reports', icon: 'fa-file-lines' }
];

/** Two-tone page title per page; `description` replaces the default department line when set. */
const PAGE_TITLES: Record<FocalNavKey, { title: string; accent: string; description?: string }> = {
  dashboard: { title: 'Department', accent: 'Dashboard' },
  'research-groups': { title: 'Research', accent: 'Groups', description: 'Monitor research groups and project progress within your department.' },
  'defense-schedules': { title: 'Defense', accent: 'Schedules', description: 'View scheduled defenses within your department.' },
  reports: { title: 'Department', accent: 'Reports' }
};

const NOTIFICATION_STYLE: Record<string, { icon: string; tone: PortalNotificationItem['tone'] }> = {
  success: { icon: 'fa-circle-check', tone: 'success' },
  warning: { icon: 'fa-triangle-exclamation', tone: 'warning' },
  error: { icon: 'fa-circle-exclamation', tone: 'danger' },
  info: { icon: 'fa-bell', tone: 'info' }
};

function toNotificationItem(notification: FocalNotification): PortalNotificationItem {
  const style = NOTIFICATION_STYLE[notification.type] ?? NOTIFICATION_STYLE.info;
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    href: '/focal-person/dashboard',
    icon: style.icon,
    tone: style.tone,
    meta: new Date(notification.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    unread: notification.status === 'UNREAD'
  };
}

type FocalPersonShellProps = {
  activeNav: FocalNavKey;
  /** Rendered once the focal person's department is known. */
  children: (department: FocalDepartment) => ReactNode;
};

/**
 * Workspace shell for Research Focal Person accounts. The department comes from the account
 * (User.department, set by the System Admin) and is decided by the server on every request.
 */
export function FocalPersonShell({ activeNav, children }: FocalPersonShellProps) {
  const { loading, department, problem, message } = useFocalWorkspace();
  const { unreadCount, notifications } = useFocalNotifications();
  const [displayName, setDisplayName] = useState('Research Focal Person');
  const [displayEmail, setDisplayEmail] = useState('');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { closeSidebar, sidebarCollapsed, sidebarOpen, toggleIconClass, toggleLabel, toggleSidebar } = useShellSidebar({
    mobileBreakpoint: 1100,
    storageKey: 'focal-person-sidebar-collapsed'
  });

  useEffect(() => {
    const user = getStoredUser();
    if (user?.name) setDisplayName(user.name);
    if (user?.email) setDisplayEmail(user.email);
    if (user?.id != null) setUserId(String(user.id));
  }, []);

  const current = NAV_ITEMS.find((item) => item.key === activeNav);
  const pageTitle = PAGE_TITLES[activeNav];
  const term = useMemo(() => {
    const today = termForDate(new Date());
    return termLabel(today.semester, schoolYearLabel(today.startYear));
  }, []);
  const notificationItems = useMemo(() => notifications.map(toNotificationItem), [notifications]);

  return (
    <div
      className={`student-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}${sidebarOpen ? ' is-sidebar-open' : ''}`}
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
    >
      <header className="student-global-navbar">
        <div className="student-global-navbar-main">
          <button aria-label={toggleLabel} className="icon-btn student-shell-toggle" type="button" onClick={toggleSidebar}>
            <i aria-hidden="true" className={`fas ${toggleIconClass}`} />
          </button>
          <div className="student-navbar-title" aria-label="Current page">
            <span className="student-navbar-title-kicker">Research Focal Person</span>
            <strong>{current?.label}</strong>
          </div>
        </div>
        <div className="student-global-navbar-actions">
          <PortalShellActionMenus
            notificationHref="/focal-person/dashboard"
            notificationCount={unreadCount}
            notificationTitle="Department research alerts"
            notificationDescription="Submissions, defense schedules, and defense results in your department."
            notificationItems={notificationItems}
            notificationMarkAllReadEnabled
            notificationUserId={userId}
            notificationEmptyTitle="No alerts yet"
            notificationEmptyMessage="You'll be notified here when a group in your department submits work or has a defense scheduled."
            profileName={displayName}
            profileSubtitle={department ? `${department.shortName} research focal person` : 'Research Focal Person'}
            profileDetail={displayEmail}
            profileActions={[{ label: 'Sign Out', icon: 'fa-right-from-bracket', danger: true, onClick: requestLogout }]}
          />
        </div>
      </header>

      <aside className={`student-global-sidebar sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">Research Focal Person</span>
            <div className="brand-mark system-brand-mark" aria-label="ThesisTrack">
              <img alt="ThesisTrack logo" className="system-brand-logo" src="/System%20Logo/logo-transparent.png" />
              <span className="system-brand-name">
                <span>Thesis</span>
                <strong>Track</strong>
              </span>
              <span className="system-brand-subtitle">Higher Education Institutions</span>
            </div>
          </div>
          {department ? (
            <span className="user-badge">
              <i aria-hidden="true" className="fas fa-user-tag" />
              <span>{department.shortName}</span>
            </span>
          ) : null}
        </div>

        <nav className="student-role-sidebar-nav" aria-label="Focal person navigation">
          <div className="sidebar-nav-group">
            <span className="sidebar-nav-heading">Department</span>
            <div className="sidebar-nav-links">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  aria-current={item.key === activeNav ? 'page' : undefined}
                  className={`sidebar-link ${item.key === activeNav ? 'is-active' : ''}`}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={closeSidebar}
                >
                  <span className="sidebar-link-icon">
                    <i aria-hidden="true" className={`fas ${item.icon}`} />
                  </span>
                  <span className="sidebar-link-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      <button
        aria-label="Close sidebar"
        className={`student-global-backdrop sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        type="button"
        onClick={closeSidebar}
      />

      <main className="student-global-main">
        <div className="student-global-content">
          <div className="page-body">
            <AdminPage>
              {loading ? (
                <div className={styles.loading} role="status">
                  <span className={styles.spinner} aria-hidden="true" />
                  Loading your department…
                </div>
              ) : department ? (
                <>
                  <PageHeader
                    kicker={`${department.shortName} research focal person`}
                    title={pageTitle.title}
                    titleAccent={pageTitle.accent}
                    description={
                      pageTitle.description
                        ? `${pageTitle.description} ${department.name} · ${term}`
                        : `${department.name} · ${term} · Read-only monitoring`
                    }
                  />
                  {children(department)}
                </>
              ) : (
                <div className={styles.noAccess}>
                  <EmptyState
                    icon={problem === 'no_department' ? 'fa-building-circle-exclamation' : 'fa-triangle-exclamation'}
                    message={
                      problem === 'no_department'
                        ? "Your account isn't linked to a department yet. Ask the System Administrator to set your department (e.g. BSIT) in User Management."
                        : message || 'Could not load your department.'
                    }
                  />
                </div>
              )}
            </AdminPage>
          </div>
        </div>
      </main>
    </div>
  );
}
