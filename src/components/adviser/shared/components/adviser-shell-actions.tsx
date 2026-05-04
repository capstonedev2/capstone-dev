'use client';

import { useRouter } from 'next/navigation';
import { PortalShellActionMenus, type PortalNotificationItem } from '@/components/shared/portal-shell-action-menus';
import { getInitials, WORKSPACE_META, type WorkspaceMode } from '@/components/adviser/shared/config/dashboard-utils';
import { logout } from '@/lib/mock/auth';

type AdviserShellActionsProps = {
  basePath: string;
  fullName: string;
  notificationCount: number;
  workspaceMode: WorkspaceMode;
  onSwitchWorkspace: (mode: WorkspaceMode) => void;
};

function buildNotificationItems(basePath: string, workspaceMode: WorkspaceMode): PortalNotificationItem[] {
  if (workspaceMode === 'panel') {
    return [
      {
        id: 'panel-evaluation',
        title: 'Evaluation packet ready',
        message: 'A defense review packet is waiting for scoring and comments.',
        href: `${basePath}/evaluation-queue`,
        icon: 'fa-clipboard-check',
        meta: 'Evaluation Queue',
        tone: 'warning',
        actionLabel: 'Review now'
      },
      {
        id: 'panel-schedule',
        title: 'Defense schedule updated',
        message: 'One defense schedule was adjusted and needs confirmation.',
        href: `${basePath}/defense-schedule`,
        icon: 'fa-calendar-days',
        meta: 'Defense Schedule',
        tone: 'info',
        actionLabel: 'Open schedule'
      },
      {
        id: 'panel-history',
        title: 'Recent review archived',
        message: 'A completed review was moved into your panel history.',
        href: `${basePath}/review-history`,
        icon: 'fa-folder-open',
        meta: 'Review History',
        tone: 'success',
        actionLabel: 'Open history',
        unread: false
      }
    ];
  }

  return [
    {
      id: 'adviser-submission',
      title: 'Submission awaiting review',
      message: 'A group uploaded a new document set for adviser checking.',
      href: `${basePath}/submissions`,
      icon: 'fa-check-double',
      meta: 'Submissions',
      tone: 'warning',
      actionLabel: 'Review now'
    },
    {
      id: 'adviser-progress',
      title: 'Progress milestone needs attention',
      message: 'One supervised group is behind the current progress target.',
      href: `${basePath}/progress`,
      icon: 'fa-chart-line',
      meta: 'Progress Monitoring',
      tone: 'danger',
      actionLabel: 'Check progress'
    },
    {
      id: 'adviser-schedule',
      title: 'Consultation schedule confirmed',
      message: 'An upcoming consultation slot was confirmed for this week.',
      href: `${basePath}/schedule`,
      icon: 'fa-calendar',
      meta: 'Schedule',
      tone: 'info',
      actionLabel: 'View calendar',
      unread: false
    }
  ];
}

export function AdviserShellActions({
  basePath,
  fullName,
  notificationCount,
  workspaceMode,
  onSwitchWorkspace
}: AdviserShellActionsProps) {
  const router = useRouter();
  const workspaceMeta = WORKSPACE_META[workspaceMode];

  return (
    <PortalShellActionMenus
      notificationHref={`${basePath}/notifications`}
      notificationCount={notificationCount}
      notificationTitle="Workspace Notifications"
      notificationDescription="Latest reviews, schedule changes, and supervision updates for the current adviser workspace."
      notificationItems={buildNotificationItems(basePath, workspaceMode)}
      profileName={fullName}
      profileSubtitle={workspaceMeta.pillLabel}
      profileDetail={`${workspaceMeta.headerLabel} • ${getInitials(fullName) || 'AD'}`}
      profileBadges={[
        { label: workspaceMeta.pillLabel, icon: workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced', tone: 'primary' },
        { label: 'Notifications', icon: 'fa-bell' }
      ]}
      extraProfileSection={
        <>
          <span className="portal-shell-profile-dropdown-label">Workspace Mode</span>
          <div className="dashboard-mode-switch" aria-label="Switch dashboard mode">
            <button type="button" className={workspaceMode === 'adviser' ? 'active' : ''} onClick={() => onSwitchWorkspace('adviser')}>
              <i className="fas fa-chalkboard-user" /> Adviser
            </button>
            <button type="button" className={workspaceMode === 'panel' ? 'active' : ''} onClick={() => onSwitchWorkspace('panel')}>
              <i className="fas fa-scale-balanced" /> Panel
            </button>
          </div>
        </>
      }
      profileActions={[
        { label: 'My Profile', icon: 'fa-user', href: `${basePath}/profile` },
        { label: 'Notifications', icon: 'fa-bell', href: `${basePath}/notifications` },
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
  );
}
