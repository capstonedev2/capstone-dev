'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';
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

  const workspaceMode: WorkspaceMode = getWorkspaceModeFromPathname(pathname);
  const basePath = getWorkspaceBasePath(workspaceMode);
  const dashboardPath = getWorkspaceDashboardPath(workspaceMode);
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

  return (
    <div
      className={`adviser-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}${sidebarOpen ? ' is-sidebar-open' : ''}`}
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
    >
      {/* ─── Top Navbar ─── */}
      <header className="adviser-global-navbar">
        <div className="adviser-global-navbar-main">
          <button
            aria-label={toggleLabel}
            className="icon-btn adviser-shell-toggle"
            type="button"
            onClick={toggleSidebar}
          >
            <i
              aria-hidden="true"
              className={`fas ${isMobile ? (sidebarOpen ? 'fa-xmark' : 'fa-bars') : sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}
            />
          </button>

          <PortalShellBrand
            className="adviser-shell-brand"
            href={dashboardPath}
            icon="fa-user-graduate"
            title="Thesis Track"
          />
        </div>

        <div className="adviser-global-navbar-actions">
          <AdviserShellActions 
            basePath={basePath}
            fullName={data.profile.fullName}
            notificationCount={data.profile.notificationCount}
            notificationItems={notificationPreviewItems}
            workspaceMode={workspaceMode}
            onSwitchWorkspace={switchWorkspace}
          />
        </div>
      </header>

      {/* ─── Sidebar ─── */}
      <aside className={`adviser-global-sidebar sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{meta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>{meta.pageCopy}</p>
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
        className={`adviser-global-backdrop sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        type="button"
        onClick={() => setSidebarOpen(false)}
      />

      {/* ─── Main content ─── */}
      <main className="adviser-global-main">
        <div className="adviser-global-content">{children}</div>
      </main>
    </div>
  );
}
