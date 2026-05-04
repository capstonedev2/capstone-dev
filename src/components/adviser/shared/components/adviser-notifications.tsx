'use client';

import Link from 'next/link';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export function AdviserNotifications({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const meta = WORKSPACE_META[workspaceMode];
  const items = workspaceMode === 'adviser' ? data.adviserActivity : data.panelActivity;

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
              workspaceMode={workspaceMode}
              onSwitchWorkspace={switchWorkspace}
            />
          }
        />

        <div className="table-container" style={{ marginTop: '1.5rem', background: '#fff', padding: '1.5rem', borderRadius: '8px' }}>
          <div className="activity-feed">
            {items.map(item => (
              <div key={item.id} className="activity-item">
                <div className="activity-icon"><i className={`fas ${item.icon}`}></i></div>
                <div className="activity-content">
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                  <div className="activity-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
