'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import {
  LIBRARY_NAV_ITEMS,
  type LibraryNavKey
} from '@/components/library/library-data';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';
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
    <div className={`library-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <button
        aria-label="Close navigation"
        className={`library-sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        type="button"
        onClick={closeSidebar}
      />

      <aside className={`library-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="library-sidebar-header">
          <div className="library-sidebar-context">
            <span aria-hidden="true" className="library-sidebar-emblem">
              <i className="fas fa-book-open" />
            </span>
            <div className="library-sidebar-copy">
              <span className="library-sidebar-kicker">Repository</span>
              <h2>Library Access</h2>
              <p>Digital archive, saved collections, and document search</p>
            </div>
          </div>
          <div className="library-user-badge">
            <i className="fas fa-book-open" aria-hidden="true" />
            <span>E-Library Access</span>
          </div>
        </div>

        <nav className="library-sidebar-nav">
          {LIBRARY_NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              className={item.key === activeNav ? 'is-active' : ''}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <i className={`fas ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="library-main">
        <header className="library-top-nav">
          <div className="library-top-main">
            <button
              aria-label={toggleLabel}
              className="library-icon-btn library-mobile-nav"
              type="button"
              onClick={toggleSidebar}
            >
              <i className={`fas ${toggleIconClass}`} aria-hidden="true" />
            </button>
            <PortalShellBrand
              className="shell-top-brand"
              href="/library/dashboard"
              icon="fa-book-open"
              title="Thesis Track"
            />
          </div>

          <div className="library-top-actions">
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
        <div className="library-page-header">
          <div className="library-page-title">
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </div>

        <div className="library-page-content">{children}</div>
      </main>
    </div>
  );
}
