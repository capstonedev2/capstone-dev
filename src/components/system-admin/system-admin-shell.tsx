'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, logout } from '@/lib/mock/auth';
import { PortalShellActionMenus } from '@/components/shared/portal-shell-action-menus';
import { PortalShellBrand } from '@/components/shared/portal-shell-brand';
import { useBranding } from '@/components/branding/branding-provider';
import { useShellSidebar } from '@/components/shared/use-shell-sidebar';

const SYSTEM_ADMIN_NAV_ITEMS = [
  { key: 'dashboard', href: '/system-admin/dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { key: 'users', href: '/system-admin/users', label: 'User Management', icon: 'fa-users-gear' },
  { key: 'roles', href: '/system-admin/roles', label: 'Roles & Permissions', icon: 'fa-shield-halved' },
  { key: 'branding', href: '/system-admin/branding', label: 'Theme & Branding', icon: 'fa-palette' },
  { key: 'settings', href: '/system-admin/settings', label: 'System Settings', icon: 'fa-sliders' },
  { key: 'logs', href: '/system-admin/logs', label: 'Logs & Security', icon: 'fa-file-shield' },
  { key: 'backups', href: '/system-admin/backups', label: 'Backup & Restore', icon: 'fa-database' },
  { key: 'maintenance', href: '/system-admin/maintenance', label: 'Maintenance Mode', icon: 'fa-screwdriver-wrench' }
] as const;

export type SystemAdminNavKey = (typeof SYSTEM_ADMIN_NAV_ITEMS)[number]['key'];

const BRANDING_SUBMENU_ITEMS = [
  { key: 'overview', href: '/system-admin/branding?section=overview', label: 'Brand Overview', icon: 'fa-building-columns' },
  { key: 'logos', href: '/system-admin/branding?section=logos', label: 'Logo Management', icon: 'fa-image' },
  { key: 'colors', href: '/system-admin/branding?section=colors', label: 'Color Theme', icon: 'fa-droplet' },
  { key: 'auth', href: '/system-admin/branding?section=auth', label: 'Login & Register', icon: 'fa-right-to-bracket' },
  { key: 'landing', href: '/system-admin/branding?section=landing', label: 'Landing Page', icon: 'fa-globe' },
  { key: 'backup', href: '/system-admin/branding?section=backup', label: 'Backup & Restore Branding', icon: 'fa-file-export' }
] as const;

function getActiveBrandingSection(value: string | null): (typeof BRANDING_SUBMENU_ITEMS)[number]['key'] {
  const matchedItem = BRANDING_SUBMENU_ITEMS.find((item) => item.key === value);

  return matchedItem?.key ?? 'overview';
}

type SystemAdminShellProps = {
  activeNav: SystemAdminNavKey;
  title: string;
  description: string;
  children: ReactNode;
  notificationCount?: number;
};

export function SystemAdminShell({
  activeNav,
  title,
  description,
  children,
  notificationCount = 2
}: SystemAdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { branding } = useBranding();
  const shellBranding = branding.shell;
  const [displayName, setDisplayName] = useState('System Administrator');
  const [displayEmail, setDisplayEmail] = useState('system.admin@university.edu.ph');
  const currentNavItem = SYSTEM_ADMIN_NAV_ITEMS.find((item) => item.key === activeNav);
  const activeBrandingSection = getActiveBrandingSection(searchParams.get('section'));
  const isBrandingPath = pathname.startsWith('/system-admin/branding');
  const [brandingMenuOpen, setBrandingMenuOpen] = useState(activeNav === 'branding' || isBrandingPath);
  const {
    closeSidebar,
    sidebarCollapsed,
    sidebarOpen,
    toggleIconClass,
    toggleLabel,
    toggleSidebar
  } = useShellSidebar({
    mobileBreakpoint: 900,
    storageKey: 'system-admin-sidebar-collapsed'
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

  useEffect(() => {
    if (activeNav === 'branding' || isBrandingPath) {
      setBrandingMenuOpen(true);
    }
  }, [activeNav, isBrandingPath]);

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
                <i className="fas fa-server"></i>
              </span>
              <div className="admin-sidebar-copy">
                <span className="admin-sidebar-kicker">{shellBranding.sidebarKicker}</span>
                <h2>{shellBranding.sidebarTitle}</h2>
                <p>{shellBranding.sidebarDescription}</p>
              </div>
            </div>
            <div className="user-badge">
              <i className="fas fa-lock"></i>
              <span>{shellBranding.sidebarBadge}</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {SYSTEM_ADMIN_NAV_ITEMS.map((item) => {
              if (item.key === 'branding') {
                return (
                  <div
                    key={item.key}
                    className={`sidebar-nav-dropdown${brandingMenuOpen ? ' is-open' : ''}${activeNav === 'branding' ? ' is-active' : ''}`}
                  >
                    <button
                      aria-controls="system-admin-branding-submenu"
                      aria-expanded={brandingMenuOpen}
                      className={activeNav === 'branding' ? 'active' : ''}
                      title={sidebarCollapsed ? item.label : undefined}
                      type="button"
                      onClick={() => setBrandingMenuOpen((current) => !current)}
                    >
                      <i className={`fas ${item.icon}`}></i>
                      <span>{item.label}</span>
                      <i className="fas fa-chevron-down sidebar-nav-chevron" aria-hidden="true"></i>
                    </button>
                    <div
                      id="system-admin-branding-submenu"
                      className="sidebar-submenu"
                      aria-label="Theme and Branding sections"
                    >
                      {BRANDING_SUBMENU_ITEMS.map((subItem) => (
                        <Link
                          key={subItem.key}
                          className={activeBrandingSection === subItem.key ? 'active' : ''}
                          href={subItem.href}
                          title={sidebarCollapsed ? subItem.label : undefined}
                          onClick={closeSidebar}
                        >
                          <i className={`fas ${subItem.icon}`}></i>
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.key}
                  className={item.key === activeNav ? 'active' : ''}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
                href="/system-admin/dashboard"
                icon="fa-server"
                subtitle={shellBranding.navbarSubtitle}
                title={shellBranding.navbarTitle}
              />
            </div>
            <div className="user-area">
              <PortalShellActionMenus
                notificationHref="/system-admin/logs"
                notificationCount={notificationCount}
                notificationTitle="System Admin Alerts"
                notificationDescription="Security, configuration, and maintenance events that need technical review."
                notificationItems={[
                  {
                    id: 'maintenance-window',
                    title: 'Maintenance window pending',
                    message: 'A scheduled patch window is waiting for activation.',
                    href: '/system-admin/maintenance',
                    icon: 'fa-screwdriver-wrench',
                    meta: 'Maintenance',
                    tone: 'warning',
                    actionLabel: 'Review'
                  },
                  {
                    id: 'backup-complete',
                    title: 'Backup completed',
                    message: 'The latest database backup finished successfully.',
                    href: '/system-admin/backups',
                    icon: 'fa-database',
                    meta: 'Backup',
                    tone: 'success',
                    actionLabel: 'Open',
                    unread: false
                  }
                ]}
                profileName={displayName}
                profileSubtitle="System Administrator"
                profileDetail={displayEmail}
                profileBadges={[
                  { label: 'Super Admin', icon: 'fa-lock', tone: 'primary' },
                  { label: 'Technical Manager', icon: 'fa-server' }
                ]}
                profileActions={[
                  { label: 'Logs & Security', icon: 'fa-file-shield', href: '/system-admin/logs' },
                  { label: 'System Settings', icon: 'fa-sliders', href: '/system-admin/settings' },
                  { label: 'Sign Out', icon: 'fa-right-from-bracket', danger: true, onClick: handleLogout }
                ]}
              />
            </div>
          </header>
          <header className="shell-page-header" aria-labelledby="system-admin-page-title">
            <div className="page-title">
              <div className="page-title-context">
                <span className="page-kicker">System Administrator</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>{currentNavItem?.label ?? title}</span>
                </span>
              </div>
              <h1 id="system-admin-page-title">{title}</h1>
              <p>{description}</p>
            </div>
          </header>
          {children}
        </main>
      </div>
    </>
  );
}
