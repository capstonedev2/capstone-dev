'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import {
  TECH_TRANSFER_NAV_ITEMS,
  type TechTransferNavKey
} from '@/components/tech-transfer/tech-transfer-data';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';
import { PortalShellActionMenus } from '@/components/shared/portal-shell-action-menus';
import { useShellSidebar } from '@/components/shared/use-shell-sidebar';

export function TechTransferShell({
  activeNav,
  title,
  description,
  badgeLabel = 'TTO Admin',
  notificationCount = 3,
  children
}: {
  activeNav: TechTransferNavKey;
  title: string;
  description: string;
  badgeLabel?: string;
  notificationCount?: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Mark Rivera');
  const [displayEmail, setDisplayEmail] = useState('mark.rivera@university.edu.ph');
  const {
    closeSidebar,
    sidebarCollapsed,
    sidebarOpen,
    toggleIconClass,
    toggleLabel,
    toggleSidebar
  } = useShellSidebar({
    mobileBreakpoint: 1080,
    storageKey: 'tech-transfer-sidebar-collapsed'
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
    <div className={`tt-app${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
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
                <i className="fas fa-lightbulb"></i>
              </span>
              <div className="portal-sidebar-copy">
                <span className="portal-sidebar-kicker">Transfer Office</span>
                <h2>Technology Transfer</h2>
                <p>Commercialization, matching, and deployment workflows</p>
              </div>
            </div>
            <div className="user-badge">
              <i aria-hidden="true" className="fas fa-building-columns" />
              <span>{badgeLabel}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {TECH_TRANSFER_NAV_ITEMS.map((item) => (
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
                href="/tech-transfer/dashboard"
                icon="fa-lightbulb"
                title="Thesis Track"
              />
            </div>

            <div className="user-area">
              <PortalShellActionMenus
                notificationHref="/tech-transfer/notifications"
                notificationCount={notificationCount}
                notificationTitle="Technology Transfer Notifications"
                notificationDescription="Commercialization, matching, and deployment updates across the transfer office pipeline."
                notificationItems={[
                  {
                    id: 'tt-matching',
                    title: 'Industry match updated',
                    message: 'A project matching record needs transfer office review.',
                    href: '/tech-transfer/matching',
                    icon: 'fa-people-arrows',
                    meta: 'Matching',
                    tone: 'warning',
                    actionLabel: 'Open matching'
                  },
                  {
                    id: 'tt-projects',
                    title: 'Project transfer status changed',
                    message: 'A research project moved to the next transfer readiness stage.',
                    href: '/tech-transfer/projects',
                    icon: 'fa-diagram-project',
                    meta: 'Projects',
                    tone: 'info',
                    actionLabel: 'Open projects'
                  },
                  {
                    id: 'tt-deployment',
                    title: 'Deployment record closed',
                    message: 'One deployment update was finalized and archived.',
                    href: '/tech-transfer/deployment',
                    icon: 'fa-rocket',
                    meta: 'Deployment',
                    tone: 'success',
                    actionLabel: 'View deployment',
                    unread: false
                  }
                ]}
                profileName={displayName}
                profileSubtitle={badgeLabel}
                profileDetail={displayEmail}
                profileBadges={[
                  { label: 'Transfer Office', icon: 'fa-lightbulb', tone: 'primary' },
                  { label: badgeLabel, icon: 'fa-building-columns' }
                ]}
                profileActions={[
                  { label: 'Profile', icon: 'fa-user', href: '/tech-transfer/profile' },
                  { label: 'Reports', icon: 'fa-chart-bar', href: '/tech-transfer/reports' },
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
