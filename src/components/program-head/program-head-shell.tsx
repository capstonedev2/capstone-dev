'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import {
  PROGRAM_HEAD_NAV_ITEMS,
  type ProgramHeadNavKey
} from '@/components/program-head/program-head-data';
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
            <strong>{title}</strong>
          </div>
        </div>

        <div className="student-global-navbar-actions">
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

      <aside className={`student-global-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">Program Head Portal</span>
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
            <span>{departmentLabel}</span>
          </span>
        </div>

        <nav className="student-role-sidebar-nav" aria-label="Program head navigation">
          <div className="sidebar-nav-group">
            <span className="sidebar-nav-heading">Academic Unit</span>
            <div className="sidebar-nav-links">
              {PROGRAM_HEAD_NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  aria-current={item.key === activeNav ? 'page' : undefined}
                  className={`sidebar-link ${item.key === activeNav ? 'is-active' : ''}`}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
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
          <header className="top-nav" aria-labelledby="ph-page-title">
            <div className="top-nav-leading">
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
