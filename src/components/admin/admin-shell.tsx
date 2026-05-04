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
  { key: 'users', href: '/admin/users', label: 'User Monitoring', icon: 'fa-users-viewfinder' },
  { key: 'projects', href: '/admin/projects', label: 'Project Inventory', icon: 'fa-boxes' },
  { key: 'approvals', href: '/admin/approvals', label: 'Approvals & Monitoring', icon: 'fa-list-check' },
  { key: 'technology-transfer', href: '/admin/technology-transfer', label: 'Technology Transfer', icon: 'fa-handshake-angle' },
  { key: 'reports', href: '/admin/reports', label: 'Reports', icon: 'fa-chart-bar' },
  { key: 'repository', href: '/admin/repository', label: 'Documents Repository', icon: 'fa-folder' },
  { key: 'announcements', href: '/admin/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
  { key: 'settings', href: '/admin/settings', label: 'Roles & Access', icon: 'fa-shield-halved' },
  { key: 'profile', href: '/admin/profile', label: 'My Profile', icon: 'fa-id-badge' },
  { key: 'notifications', href: '/admin/notifications', label: 'Notifications', icon: 'fa-bell' }
] as const;

export type AdminNavKey = (typeof ADMIN_NAV_ITEMS)[number]['key'];

type AdminShellProps = {
  activeNav: AdminNavKey;
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
        { label: 'My Profile', icon: 'fa-id-badge', href: '/admin/profile' },
        { label: 'Roles & Access', icon: 'fa-shield-halved', href: '/admin/settings' },
        { label: 'Sign Out', icon: 'fa-right-from-bracket', danger: true, onClick: handleLogout }
      ]}
    />
  );

  return (
    <>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={closeSidebar}
      ></div>
      <div className={`dashboard-wrapper${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
        <aside className="sidebar" style={{ transform: sidebarOpen ? 'translateX(0)' : '' }}>
          <div className="sidebar-header">
            <div className="admin-sidebar-context">
              <span aria-hidden="true" className="admin-sidebar-emblem">
                <i className="fas fa-building-columns"></i>
              </span>
              <div className="admin-sidebar-copy">
                <span className="admin-sidebar-kicker">Research Oversight</span>
                <h2>Research Head</h2>
                <p>Institutional oversight and thesis operations</p>
              </div>
            </div>
            <div className="user-badge">
              <i className="fas fa-building-columns"></i>
              <span>Research Head Office</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {ADMIN_NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                className={item.key === activeNav ? 'active' : ''}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <header className="top-nav">
            <div className="top-nav-main">
              <button
                aria-label={toggleLabel}
                className="mobile-menu-btn"
                type="button"
                onClick={toggleSidebar}
              >
                <i className={`fas ${toggleIconClass}`}></i>
              </button>
              <PortalShellBrand
                className="shell-top-brand"
                href="/admin/dashboard"
                icon="fa-building-columns"
                title="Thesis Track"
              />
            </div>
            <div className="user-area">{actions ?? defaultActions}</div>
          </header>
          <header className="shell-page-header" aria-labelledby="admin-page-title">
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
          </header>
          {children}
        </main>
      </div>
    </>
  );
}
