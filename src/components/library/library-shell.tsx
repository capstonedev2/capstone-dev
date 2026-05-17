'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import {
  LIBRARY_NAV_ITEMS,
  type LibraryNavKey
} from '@/components/library/library-data';
import { PortalShellActionMenus } from '@/components/shared/portal-shell-action-menus';
import { useShellSidebar } from '@/components/shared/use-shell-sidebar';

type LibraryShellProps = {
  activeNav: LibraryNavKey;
  title: string;
  description: string;
  notificationCount?: number;
  children: ReactNode;
};

export function LibraryShell({
  activeNav,
  title,
  description,
  notificationCount = 2,
  children
}: LibraryShellProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Sarah Rivera');
  const [displayEmail, setDisplayEmail] = useState('library@university.edu.ph');
  const {
    closeSidebar,
    sidebarCollapsed,
    sidebarOpen,
    toggleIconClass,
    toggleLabel,
    toggleSidebar
  } = useShellSidebar({
    mobileBreakpoint: 960,
    storageKey: 'library-sidebar-collapsed'
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
            <i className={`fas ${toggleIconClass}`} aria-hidden="true" />
          </button>

          <div className="student-navbar-title" aria-label="Current page">
            <span className="student-navbar-title-kicker">ThesisTrack</span>
            <strong>{title}</strong>
          </div>
        </div>

        <div className="student-global-navbar-actions">
            <PortalShellActionMenus
              notificationHref="/library/notifications"
              notificationCount={notificationCount}
              notificationTitle="Library Notifications"
              notificationDescription="Repository updates, saved alerts, and archive activity for the digital library workspace."
              notificationItems={[
                {
                  id: 'library-repository',
                  title: 'Repository update posted',
                  message: 'A new repository release is ready for catalog review.',
                  href: '/library/repository',
                  icon: 'fa-book-open',
                  meta: 'Repository',
                  tone: 'info',
                  actionLabel: 'Open repository'
                },
                {
                  id: 'library-saved',
                  title: 'Saved collection changed',
                  message: 'A saved research collection has new matching entries.',
                  href: '/library/saved',
                  icon: 'fa-bookmark',
                  meta: 'Saved Collections',
                  tone: 'warning',
                  actionLabel: 'Open saved'
                },
                {
                  id: 'library-profile',
                  title: 'Profile updated',
                  message: 'Your library access details were refreshed in the system.',
                  href: '/library/profile',
                  icon: 'fa-user',
                  meta: 'Profile',
                  tone: 'success',
                  actionLabel: 'Review profile',
                  unread: false
                }
              ]}
              profileName={displayName}
              profileSubtitle="E-Library Access"
              profileDetail={displayEmail}
              profileBadges={[
                { label: 'Library Workspace', icon: 'fa-book-open', tone: 'primary' },
                { label: 'Digital Archive', icon: 'fa-folder-open' }
              ]}
              profileActions={[
                { label: 'Profile', icon: 'fa-user', href: '/library/profile' },
                {
                  label: 'Sign Out',
                  icon: 'fa-right-from-bracket',
                  danger: true,
                  onClick: () => {
                    logout();
                    router.push('/login');
                  }
                }
              ]}
            />
        </div>
      </header>

      <aside className={`student-global-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">Repository</span>
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
            <i className="fas fa-book-open" aria-hidden="true" />
            <span>E-Library Access</span>
          </span>
        </div>

        <nav className="student-role-sidebar-nav" aria-label="Library navigation">
          <div className="sidebar-nav-group">
            <span className="sidebar-nav-heading">Digital Library</span>
            <div className="sidebar-nav-links">
              {LIBRARY_NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  aria-current={item.key === activeNav ? 'page' : undefined}
                  className={`sidebar-link ${item.key === activeNav ? 'is-active' : ''}`}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="sidebar-link-icon">
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
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
          <header className="top-nav" aria-labelledby="library-page-title">
            <div className="top-nav-leading">
              <div className="page-title">
                <div className="page-title-context">
                  <span className="page-kicker">E-Library</span>
                  <span className="page-breadcrumb" aria-hidden="true">
                    <i className="fas fa-angle-right" />
                    <span>{title}</span>
                  </span>
                </div>
                <h1 id="library-page-title">{title}</h1>
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
