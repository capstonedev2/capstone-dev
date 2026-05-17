'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';
import { PortalShellActionMenus } from '@/components/shared/portal-shell-action-menus';
import { useShellSidebar } from '@/components/shared/use-shell-sidebar';

const ADMIN_NAV_ITEMS = [
  { key: 'dashboard', href: '/admin/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
  { key: 'projects', href: '/admin/projects', label: 'Project Inventory', icon: 'fa-boxes' },
  { key: 'approvals', href: '/admin/approvals', label: 'Approvals & Monitoring', icon: 'fa-list-check' },
  { key: 'technology-transfer', href: '/admin/technology-transfer', label: 'Technology Transfer', icon: 'fa-handshake-angle' },
  { key: 'reports', href: '/admin/reports', label: 'Reports', icon: 'fa-chart-bar' },
  { key: 'final-repository-approval', href: '/admin/final-repository-approval', label: 'Final Repository Approval', icon: 'fa-clipboard-check' },
  { key: 'repository', href: '/admin/repository', label: 'Documents Repository', icon: 'fa-folder' },
  { key: 'announcements', href: '/admin/announcements', label: 'Announcements', icon: 'fa-bullhorn' }
] as const;

export type AdminNavKey = (typeof ADMIN_NAV_ITEMS)[number]['key'];
type AdminShellActiveNav = AdminNavKey | 'notifications' | 'settings';

type AdminShellProps = {
  activeNav: AdminShellActiveNav;
  title: string;
  description: string;
  children: ReactNode;
  notificationCount?: number;
  actions?: ReactNode;
};

export function AdminShell({
  activeNav,
  title,
  description,
  children,
  notificationCount = 4,
  actions
}: AdminShellProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('School Research Head');
  const [displayEmail, setDisplayEmail] = useState('research.head@university.edu.ph');
  const currentNavItem = ADMIN_NAV_ITEMS.find((item) => item.key === activeNav);
  const {
    closeSidebar,
    sidebarCollapsed,
    sidebarOpen,
    toggleIconClass,
    toggleLabel,
    toggleSidebar
  } = useShellSidebar({
    mobileBreakpoint: 900,
    storageKey: 'admin-sidebar-collapsed'
  });

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser?.name) {
      setDisplayName(storedUser.name);
    }

    if (storedUser?.email) {
      setDisplayEmail(storedUser.email);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeSidebar]);

  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh();
  };

  const defaultActions = (
    <PortalShellActionMenus
      notificationHref="/admin/notifications"
      notificationCount={notificationCount}
      notificationTitle="Research Head Notifications"
      notificationDescription="Approvals, repository releases, and access changes that need research office attention."
      notificationItems={[
        {
          id: 'admin-approvals',
          title: 'Approval queue updated',
          message: 'New project records are waiting for review and release.',
          href: '/admin/notifications',
          icon: 'fa-circle-check',
          meta: 'Notifications Center',
          tone: 'warning',
          actionLabel: 'Review queue'
        },
        {
          id: 'admin-repository',
          title: 'Repository release completed',
          message: 'A document batch is now available in the institutional repository.',
          href: '/admin/repository',
          icon: 'fa-folder-open',
          meta: 'Documents Repository',
          tone: 'success',
          actionLabel: 'Open repository',
          unread: false
        }
      ]}
      profileName={displayName}
      profileSubtitle="Research Head"
      profileDetail={displayEmail}
      profileBadges={[
        { label: 'Research Oversight', icon: 'fa-building-columns', tone: 'primary' },
        { label: 'Research Head Office', icon: 'fa-id-badge' }
      ]}
      profileActions={[
        { label: 'Sign Out', icon: 'fa-right-from-bracket', danger: true, onClick: handleLogout }
      ]}
    />
  );

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
            <i aria-hidden="true" className={`fas ${toggleIconClass}`} />
          </button>
          <div className="student-navbar-title" aria-label="Current page">
            <span className="student-navbar-title-kicker">ThesisTrack</span>
            <strong>{currentNavItem?.label ?? title}</strong>
          </div>
        </div>
        <div className="student-global-navbar-actions">
          {actions ?? defaultActions}
        </div>
      </header>

      <aside className={`student-global-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">Research Head</span>
            <div className="brand-mark system-brand-mark" aria-label="ThesisTrack">
              <img
                alt="ThesisTrack logo"
                className="system-brand-logo"
                src="/System%20Logo/logo-transparent.png"
              />
              <span className="system-brand-name">
                <span>Thesis</span>
                <strong>Track</strong>
              </span>
              <span className="system-brand-subtitle">Higher Education Institutions</span>
            </div>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className="fas fa-building-columns" />
            <span>Research Head Office</span>
          </span>
        </div>

        <nav className="student-role-sidebar-nav" aria-label="Admin workspace navigation">
          <div className="sidebar-nav-group">
            <span className="sidebar-nav-heading">Research Management</span>
            <div className="sidebar-nav-links">
              {ADMIN_NAV_ITEMS.map((item) => (
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
          <header className="top-nav" aria-labelledby="admin-page-title">
            <div className="top-nav-leading">
              <div className="page-title">
                <div className="page-title-context">
                  <span className="page-kicker">Research Head</span>
                  <span className="page-breadcrumb" aria-hidden="true">
                    <i className="fas fa-angle-right" />
                    <span>{currentNavItem?.label ?? title}</span>
                  </span>
                </div>
                <h1 id="admin-page-title">{title}</h1>
                <p>{description}</p>
              </div>
            </div>
          </header>
          <div className="page-body">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
