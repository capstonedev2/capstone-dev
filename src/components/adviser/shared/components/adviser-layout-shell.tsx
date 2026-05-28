'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { ADVISER_NAV_ITEMS, ADVISER_NAV_SECTIONS } from '@/components/adviser/shared/config/adviser-navigation';
import {
  WORKSPACE_META,
  WORKSPACE_MODE_STORAGE_KEY,
  getWorkspaceBasePath,
  getWorkspaceDashboardPath,
  getWorkspaceModeFromPathname,
  isNavItemActive,
  type WorkspaceMode
} from '@/components/adviser/shared/config/dashboard-utils';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import type { AdviserNotificationRecord } from '@/components/adviser/shared/components/adviser-notifications';
import type { PortalNotificationItem } from '@/components/shared/portal-shell-action-menus';

const SIDEBAR_STORAGE_KEY = 'adviserShellSidebarCollapsed';
const STUDENT_THEME_STORAGE_KEY = 'studentWorkspaceTheme';

type ShellThemeMode = 'light' | 'dark' | 'system';

type AdviserLayoutShellProps = {
  children: React.ReactNode;
  data: AdviserDashboardData;
  notifications?: AdviserNotificationRecord[];
};

function toNotificationPreviewItems(
  notifications: AdviserNotificationRecord[] | undefined,
  basePath: string
): PortalNotificationItem[] | undefined {
  if (!notifications) {
    return undefined;
  }

  return notifications.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.text,
    href: item.entityType === 'uploaded_file'
      ? basePath.includes('/panel-mode')
        ? `${basePath}/evaluation-queue`
        : `${basePath}/submissions`
      : item.href.startsWith('/adviser/')
        ? item.href
        : `${basePath}/notifications`,
    icon: item.icon,
    meta: item.meta,
    tone: item.tone,
    unread: item.status !== 'read',
    actionLabel: 'Open'
  }));
}

export function AdviserLayoutShell({ children, data, notifications }: AdviserLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [themeMode, setThemeMode] = useState<ShellThemeMode>('light');

  const workspaceMode: WorkspaceMode = getWorkspaceModeFromPathname(pathname);
  const basePath = getWorkspaceBasePath(workspaceMode);
  const meta = WORKSPACE_META[workspaceMode];
  const notificationPreviewItems = toNotificationPreviewItems(notifications, basePath);

  function switchWorkspace(mode: WorkspaceMode) {
    if (mode === workspaceMode) return;
    try { window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, mode); } catch {}
    router.push(getWorkspaceDashboardPath(mode));
  }

  // Sidebar collapse persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);

  // Mobile breakpoint
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1100px)');
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) setSidebarOpen(false);
    };
    handle(mq);
    const listener = (e: MediaQueryListEvent) => handle(e);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
    mq.addListener(listener);
    return () => mq.removeListener(listener);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readTheme = () => {
      const storedTheme = window.localStorage.getItem(STUDENT_THEME_STORAGE_KEY);
      setThemeMode(storedTheme === 'dark' || storedTheme === 'system' ? storedTheme : 'light');
      document.documentElement.dataset.studentTheme = storedTheme === 'dark' || storedTheme === 'system' ? storedTheme : 'light';
    };

    readTheme();
    window.addEventListener('thesistrack:student-theme-changed', readTheme);
    window.addEventListener('storage', readTheme);

    return () => {
      window.removeEventListener('thesistrack:student-theme-changed', readTheme);
      window.removeEventListener('storage', readTheme);
    };
  }, []);

  const updateAdviserTheme = (nextTheme: ShellThemeMode) => {
    setThemeMode(nextTheme);

    if (typeof window === 'undefined') {
      return;
    }

    document.documentElement.dataset.studentTheme = nextTheme;
    window.localStorage.setItem(STUDENT_THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event('thesistrack:student-theme-changed'));
  };

  const navigationSections = useMemo(() => {
    const sections = ADVISER_NAV_SECTIONS[workspaceMode];
    const items = ADVISER_NAV_ITEMS[workspaceMode];
    return sections.map((section) => ({
      ...section,
      items: items.filter((item) => item.section === section.key)
    })).filter((section) => section.items.length);
  }, [workspaceMode]);

  const toggleSidebar = () => {
    if (isMobile) { setSidebarOpen((c) => !c); return; }
    setSidebarCollapsed((c) => !c);
  };

  const toggleLabel = isMobile
    ? sidebarOpen ? 'Close sidebar' : 'Open sidebar'
    : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const activeNavItem = ADVISER_NAV_ITEMS[workspaceMode].find((item) => isNavItemActive(pathname, item.href));
  const navbarTitle = activeNavItem?.key === 'dashboard'
    ? meta.pageTitle
    : activeNavItem?.label ?? meta.pageTitle;

  return (
    <div
      className={`student-shell adviser-shell adviser-workspace-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}${sidebarOpen ? ' is-sidebar-open' : ''}`}
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
      data-theme={themeMode}
    >
      {/* ─── Top Navbar ─── */}
      <header className="student-global-navbar adviser-global-navbar">
        <div className="student-global-navbar-main adviser-global-navbar-main">
          <button
            aria-label={toggleLabel}
            className="icon-btn student-shell-toggle adviser-shell-toggle"
            type="button"
            onClick={toggleSidebar}
          >
            <i
              aria-hidden="true"
              className={`fas ${isMobile ? (sidebarOpen ? 'fa-xmark' : 'fa-bars') : sidebarCollapsed ? 'fa-chevron-right' : 'fa-bars'}`}
            />
          </button>

          <div className="student-navbar-title adviser-navbar-title" aria-label="Current page">
            <span className="student-navbar-title-kicker adviser-navbar-title-kicker">ThesisTrack</span>
            <strong>{navbarTitle}</strong>
          </div>
        </div>

        <div className="student-global-navbar-actions adviser-global-navbar-actions">
          <AdviserShellActions 
            basePath={basePath}
            fullName={data.profile.fullName}
            notificationCount={data.profile.notificationCount}
            notificationItems={notificationPreviewItems}
            themeMode={themeMode}
            workspaceMode={workspaceMode}
            onToggleTheme={() => updateAdviserTheme(themeMode === 'dark' ? 'light' : 'dark')}
            onSwitchWorkspace={switchWorkspace}
          />
        </div>
      </header>

      {/* ─── Sidebar ─── */}
      <aside className={`student-global-sidebar adviser-global-sidebar sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">Adviser Portal</span>
            <div className="brand-mark system-brand-mark" aria-label="ThesisTrack">
              <img
                alt="ThesisTrack logo"
                className="system-brand-logo"
                src={themeMode === 'dark' ? '/System%20Logo/image.png' : '/System%20Logo/logo-transparent.png'}
                style={{ transform: themeMode === 'dark' ? 'scale(1.15)' : 'none' }}
              />
              <span className="system-brand-name">
                <span>Thesis</span>
                <strong>Track</strong>
              </span>
              <span className="system-brand-subtitle">Higher Education Institutions</span>
            </div>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${meta.badgeIcon}`} />
            <span>{meta.badgeLabel}</span>
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Adviser workspace navigation">
          {navigationSections.map((section) => (
            <div key={section.key} className="sidebar-nav-group">
              <span className="sidebar-nav-heading">{section.label}</span>
              <div className="sidebar-nav-links">
                {section.items.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href);
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
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* ─── Mobile backdrop ─── */}
      <button
        aria-label="Close sidebar"
        className={`student-global-backdrop adviser-global-backdrop sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        type="button"
        onClick={() => setSidebarOpen(false)}
      />

      {/* ─── Main content ─── */}
      <main className="student-global-main adviser-global-main">
        <div className="student-global-content adviser-global-content">{children}</div>
      </main>
    </div>
  );
}
