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

        <div className="mx-auto max-w-[1600px] mt-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-dark)] flex items-center gap-2">
                <i className="fas fa-list-ul text-[var(--primary)] opacity-80" /> Recent Activity
              </h2>
              <p className="text-sm text-[var(--text-light)] mt-1">Review alerts and track latest student submissions.</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/10 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {items.filter(i => i.status !== 'read').length} Unread
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {items.length ? (
              items.map(item => (
                <article 
                  key={item.id} 
                  className={`group relative flex flex-col sm:flex-row gap-5 rounded-[1.25rem] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgb(0,58,143,0.08)] ${
                    item.status === 'read' 
                      ? 'border border-slate-200/60 shadow-sm' 
                      : 'border-blue-100 ring-1 ring-blue-50 shadow-[0_8px_30px_rgb(59,130,246,0.08)]'
                  }`}
                >
                  {item.status !== 'read' && (
                     <div className="absolute top-5 right-5 h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                  )}
                  
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${
                    item.tone === 'success' ? 'bg-emerald-50 text-emerald-600' :
                    item.tone === 'danger' ? 'bg-rose-50 text-rose-600' :
                    item.tone === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-[rgba(0,58,143,0.06)] text-[var(--primary)]'
                  }`}>
                    <i className={`fas ${item.icon} text-lg`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 pr-4 sm:pr-8">
                        <h4 className={`text-base font-bold transition-colors ${item.status === 'read' ? 'text-slate-700 group-hover:text-[var(--primary)]' : 'text-slate-900 group-hover:text-blue-700'}`}>
                          {'href' in item && item.href ? (
                             <Link href={item.href} onClick={() => markNotificationRead(item.id)} className="focus:outline-none before:absolute before:inset-0 before:z-10 before:rounded-[1.25rem]">
                               {item.title}
                             </Link>
                          ) : (
                             item.title
                          )}
                        </h4>
                        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5 w-fit">
                          <i className="fas fa-clock opacity-50" /> {item.time}
                        </span>
                     </div>
                     
                     <p className={`text-sm leading-relaxed ${item.status === 'read' ? 'text-slate-500' : 'text-slate-600'}`}>
                       {item.text}
                     </p>
                     
                     {item.meta && (
                       <div className="mt-4 flex flex-wrap items-center gap-2">
                         <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/50">
                           <i className="fas fa-layer-group opacity-50" />
                           {item.meta}
                         </span>
                       </div>
                     )}
                  </div>
                </article>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/50 px-6 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 mb-6 text-[var(--primary)] opacity-80">
                  <i aria-hidden="true" className="fas fa-bell-slash text-3xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No notifications yet</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-sm">
                  New student uploads, title submissions, and administrative review alerts will appear here once they are created.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
