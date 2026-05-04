'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import {
  PROGRAM_HEAD_NAV_ITEMS,
  type ProgramHeadNavKey
} from '@/components/program-head/program-head-data';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';
import { PortalShellActionMenus } from '@/components/shared/portal-shell-action-menus';
import { useShellSidebar } from '@/components/shared/use-shell-sidebar';

type ProgramHeadShellProps = {
  activeNav: ProgramHeadNavKey;
  title: string;
  description: string;
  departmentLabel?: string;
  notificationCount?: number;
  children: ReactNode;
};

export function ProgramHeadShell({
  activeNav,
  title,
  description,
  departmentLabel = 'IT Department',
  notificationCount = 3,
  children
}: ProgramHeadShellProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Dr. Anna Dimagiba');
  const [displayEmail, setDisplayEmail] = useState('program.head@university.edu.ph');
  const {
    closeSidebar,
    sidebarCollapsed,
    sidebarOpen,
    toggleIconClass,
    toggleLabel,
    toggleSidebar
  } = useShellSidebar({
    mobileBreakpoint: 900,
    storageKey: 'program-head-sidebar-collapsed'
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
                <i className="fas fa-user-tie"></i>
              </span>
              <div className="admin-sidebar-copy">
                <span className="admin-sidebar-kicker">Academic Unit</span>
                <h2>Department Chair</h2>
                <p>Program oversight, evaluations, and transfer readiness</p>
              </div>
            </div>
            <div className="user-badge">
              <i className="fas fa-building-columns"></i>
              <span>{departmentLabel}</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {PROGRAM_HEAD_NAV_ITEMS.map((item) => (
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
                href="/program-head/dashboard"
                icon="fa-user-tie"
                title="Thesis Track"
              />
            </div>
            <div className="user-area">
              <PortalShellActionMenus
                notificationHref="/program-head/notifications"
                notificationCount={notificationCount}
                notificationTitle="Program Head Notifications"
                notificationDescription="Department oversight, evaluation progress, and transfer readiness updates."
                notificationItems={[
                  {
                    id: 'program-projects',
                    title: 'Project oversight review needed',
                    message: 'A program project requires department-level verification.',
                    href: '/program-head/projects',
                    icon: 'fa-diagram-project',
                    meta: 'Projects',
                    tone: 'warning',
                    actionLabel: 'Open projects'
                  },
                  {
                    id: 'program-performance',
                    title: 'Performance snapshot refreshed',
                    message: 'Program metrics were updated with the latest submission and evaluation data.',
                    href: '/program-head/performance',
                    icon: 'fa-chart-line',
                    meta: 'Performance',
                    tone: 'info',
                    actionLabel: 'Review metrics'
                  },
                  {
                    id: 'program-transfer',
                    title: 'Transfer report completed',
                    message: 'A transfer readiness review was finalized for this cycle.',
                    href: '/program-head/transfer',
                    icon: 'fa-arrow-up-right-dots',
                    meta: 'Transfer',
                    tone: 'success',
                    actionLabel: 'Open transfer',
                    unread: false
                  }
                ]}
                profileName={displayName}
                profileSubtitle="Department Chair"
                profileDetail={displayEmail}
                profileBadges={[
                  { label: 'Program Head', icon: 'fa-user-tie', tone: 'primary' },
                  { label: departmentLabel, icon: 'fa-building-columns' }
                ]}
                profileActions={[
                  { label: 'Sign Out', icon: 'fa-right-from-bracket', danger: true, onClick: handleLogout }
                ]}
              />
            </div>
          </header>
          
          <header className="shell-page-header" aria-labelledby="ph-page-title">
            <div className="page-title">
              <div className="page-title-context">
                <span className="page-kicker">Program Head Portal</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>{title}</span>
                </span>
              </div>
              <h1 id="ph-page-title">{title}</h1>
              <p>{description}</p>
            </div>
          </header>
          
          {children}
        </main>
      </div>
    </>
  );
}
