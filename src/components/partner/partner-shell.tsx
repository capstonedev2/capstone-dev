'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import { PARTNER_NAV_ITEMS, type PartnerNavKey } from '@/components/partner/partner-data';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';
import { PortalShellActionMenus } from '@/components/shared/portal-shell-action-menus';
import { useShellSidebar } from '@/components/shared/use-shell-sidebar';

export function PartnerShell({
  activeNav,
  title,
  description,
  badgeLabel = 'TechCorp Inc.',
  notificationCount = 3,
  children
}: {
  activeNav: PartnerNavKey;
  title: string;
  description: string;
  badgeLabel?: string;
  notificationCount?: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('TechCorp Partner Liaison');
  const [displayEmail, setDisplayEmail] = useState('partner@techcorp.inc');
  const {
    closeSidebar,
    sidebarCollapsed,
    sidebarOpen,
    toggleIconClass,
    toggleLabel,
    toggleSidebar
  } = useShellSidebar({
    mobileBreakpoint: 1080,
    storageKey: 'partner-sidebar-collapsed'
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
    <div className={`partner-app${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <button
        aria-label="Close navigation"
        className={`portal-sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        type="button"
        onClick={closeSidebar}
      />

      <div className="dashboard-wrapper">
        <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="sidebar-header">
            <div className="portal-sidebar-context">
              <span aria-hidden="true" className="portal-sidebar-emblem">
                <i className="fas fa-handshake"></i>
              </span>
              <div className="portal-sidebar-copy">
                <span className="portal-sidebar-kicker">Partner Desk</span>
                <h2>Industry Partner</h2>
                <p>Collaboration requests and implementation tracking</p>
              </div>
            </div>
            <div className="user-badge">
              <i aria-hidden="true" className="fas fa-building" />
              <span>{badgeLabel}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {PARTNER_NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                className={item.key === activeNav ? 'active' : undefined}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <i aria-hidden="true" className={`fas ${item.icon}`} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <div className="top-nav">
            <div className="top-nav-main">
              <button
                aria-label={toggleLabel}
                className="portal-mobile-nav"
                type="button"
                onClick={toggleSidebar}
              >
                <i aria-hidden="true" className={`fas ${toggleIconClass}`} />
              </button>
              <PortalShellBrand
                className="shell-top-brand"
                href="/partner/dashboard"
                icon="fa-handshake"
                title="Thesis Track"
              />
            </div>

            <div className="user-area">
              <PortalShellActionMenus
                notificationHref="/partner/notifications"
                notificationCount={notificationCount}
                notificationTitle="Partner Notifications"
                notificationDescription="Updates on collaboration requests, implementation follow-ups, and review feedback."
                notificationItems={[
                  {
                    id: 'partner-request',
                    title: 'Collaboration request advanced',
                    message: 'A submitted collaboration request moved to the next review stage.',
                    href: '/partner/requests',
                    icon: 'fa-list-check',
                    meta: 'My Requests',
                    tone: 'warning',
                    actionLabel: 'Open requests'
                  },
                  {
                    id: 'partner-project',
                    title: 'Project details updated',
                    message: 'A project implementation note was posted for partner review.',
                    href: '/partner/project',
                    icon: 'fa-diagram-project',
                    meta: 'Project Workspace',
                    tone: 'info',
                    actionLabel: 'View details'
                  },
                  {
                    id: 'partner-feedback',
                    title: 'Feedback archived',
                    message: 'One feedback thread was marked complete and stored for reference.',
                    href: '/partner/feedback',
                    icon: 'fa-comments',
                    meta: 'Feedback',
                    tone: 'success',
                    actionLabel: 'Open feedback',
                    unread: false
                  }
                ]}
                profileName={displayName}
                profileSubtitle={badgeLabel}
                profileDetail={displayEmail}
                profileBadges={[
                  { label: 'Partner Workspace', icon: 'fa-handshake', tone: 'primary' },
                  { label: badgeLabel, icon: 'fa-building' }
                ]}
                profileActions={[
                  { label: 'Profile', icon: 'fa-user', href: '/partner/profile' },
                  { label: 'My Requests', icon: 'fa-list', href: '/partner/requests' },
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
          </div>
          <div className="shell-page-header">
            <div className="page-title">
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
