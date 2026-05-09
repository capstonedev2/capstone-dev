'use client';

import Link from 'next/link';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import type { PortalNotificationItem } from '@/components/shared/portal-shell-action-menus';

export type AdviserNotificationRecord = {
  id: string;
  status: string;
  created_at: string;
  icon: string;
  title: string;
  text: string;
  time: string;
  href: string;
  meta: string;
  entityType?: string | null;
  tone: PortalNotificationItem['tone'];
};

export function AdviserNotifications({
  data,
  notifications
}: {
  data: AdviserDashboardData;
  notifications?: AdviserNotificationRecord[];
}) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const meta = WORKSPACE_META[workspaceMode];
  const fallbackItems = workspaceMode === 'adviser' ? data.adviserActivity : data.panelActivity;
  const items = notifications ?? fallbackItems;
  const notificationPreviewItems: PortalNotificationItem[] | undefined = notifications?.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.text,
    href: item.href,
    icon: item.icon,
    meta: item.meta,
    tone: item.tone,
    unread: item.status !== 'read',
    actionLabel: 'Open'
  }));

  const markNotificationRead = (notificationId: string) => {
    void fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, action: 'read' }),
      keepalive: true
    }).finally(() => {
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    });
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{meta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>System alerts and activity logs.</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${meta.badgeIcon}`} />
            <span>{meta.badgeLabel}</span>
          </span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link key={item.href} href={item.href} className={isNavItemActive(pathname, item.href) ? 'active' : ''}>
              <i className={`fas ${item.icon}`}></i> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <AdviserPageHeader
          title="Notifications"
          description="System alerts and activity logs."
          actions={
            <AdviserShellActions
              basePath={basePath}
              fullName={data.profile.fullName}
              notificationCount={data.profile.notificationCount}
              notificationItems={notificationPreviewItems}
              workspaceMode={workspaceMode}
              onSwitchWorkspace={switchWorkspace}
            />
          }
        />

        <div className="table-container" style={{ marginTop: '1.5rem', background: '#fff', padding: '1.5rem', borderRadius: '8px' }}>
          <div className="activity-feed">
            {items.length ? (
              items.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon"><i className={`fas ${item.icon}`}></i></div>
                  <div className="activity-content">
                    {'href' in item ? (
                      <h4>
                        <Link href={item.href} onClick={() => markNotificationRead(item.id)}>{item.title}</Link>
                      </h4>
                    ) : (
                      <h4>{item.title}</h4>
                    )}
                    <p>{item.text}</p>
                    <div className="activity-time">{item.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i aria-hidden="true" className="fas fa-bell-slash" />
                <h3>No notifications yet</h3>
                <p>New student uploads and review alerts will appear here once they are created.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
