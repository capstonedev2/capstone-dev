'use client';

import Link from 'next/link';
import { type CSSProperties, useMemo } from 'react';
import { SystemAdminShell } from '@/components/system-admin/system-admin-shell';
import {
  ActionLink,
  AdminPage,
  EmptyState,
  IconTile,
  type IconTone,
  KpiCard,
  SectionCard,
  TextLink
} from '@/components/system-admin/ui';
import {
  getSystemAdminDashboardMock,
  type DashboardActivity,
  type DashboardAttentionItem,
  type DashboardRoleGroup
} from '@/mocks/system-admin/dashboard';
import styles from './system-admin-dashboard.module.css';

const numberFormat = new Intl.NumberFormat('en-US');
const formatCount = (value: number) => numberFormat.format(value);
const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);
const todayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const ROLE_GROUPS: Record<DashboardRoleGroup, { label: string; icon: string }> = {
  students: { label: 'Students', icon: 'fa-user-graduate' },
  advisers_panelists: { label: 'Advisers and panelists', icon: 'fa-chalkboard-user' },
  program_heads: { label: 'Program heads', icon: 'fa-user-tie' },
  partners: { label: 'Partners', icon: 'fa-handshake' },
  other_staff: { label: 'Other staff', icon: 'fa-id-card-clip' }
};

const QUICK_ACTIONS = [
  { href: '/system-admin/users', icon: 'fa-users-gear', label: 'User management', hint: 'Create, suspend, restore' },
  { href: '/system-admin/roles', icon: 'fa-shield-halved', label: 'Roles & permissions', hint: 'Who can do what' },
  { href: '/system-admin/settings', icon: 'fa-sliders', label: 'System settings', hint: 'Academic year, policies' },
  { href: '/system-admin/logs', icon: 'fa-file-shield', label: 'Logs & security', hint: 'Audit trail, sign-ins' },
  { href: '/system-admin/backups', icon: 'fa-database', label: 'Backup & restore', hint: 'Snapshots and exports' },
  { href: '/system-admin/maintenance', icon: 'fa-screwdriver-wrench', label: 'Maintenance mode', hint: 'Take the portal offline' }
] as const;

/** Today → "10:42 AM", yesterday → "Yesterday", otherwise "Sep 21". */
function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (dayDiff === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  if (dayDiff === 1) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function describeActivity(activity: DashboardActivity) {
  switch (activity.type) {
    case 'account_created':
      return { icon: 'fa-user-plus', tone: 'primary' as IconTone, text: `Staff account created for ${activity.subjectName} (${activity.subjectRole})` };
    case 'account_suspended':
      return {
        icon: 'fa-ban',
        tone: 'error' as IconTone,
        text: `${activity.subjectName} suspended for ${activity.durationDays} ${plural(activity.durationDays, 'day', 'days')}`
      };
    case 'account_restored':
      return { icon: 'fa-rotate-left', tone: 'success' as IconTone, text: `${activity.subjectName} restored` };
    case 'branding_updated':
      return { icon: 'fa-palette', tone: 'accent' as IconTone, text: `Branding ${activity.area} updated` };
  }
}

function describeAttention(item: DashboardAttentionItem) {
  switch (item.kind) {
    case 'suspensions_ending':
      return {
        icon: 'fa-hourglass-half',
        text: `${item.count} ${plural(item.count, 'suspension ends', 'suspensions end')} this week`,
        action: 'Review',
        actionLabel: 'Review suspensions ending this week'
      };
    case 'temporary_passwords':
      return {
        icon: 'fa-key',
        text: `${item.count} staff haven't changed their temporary password`,
        action: 'View',
        actionLabel: 'View staff with temporary passwords'
      };
    case 'new_registrations':
      return {
        icon: 'fa-user-plus',
        text: `${item.count} new student ${plural(item.count, 'registration', 'registrations')} today`,
        action: 'View',
        actionLabel: "View today's new student registrations"
      };
  }
}

export function SystemAdminDashboard() {
  // Mock data for now; see PLACEHOLDERS.md for the future data source of each section.
  const data = useMemo(() => getSystemAdminDashboardMock(), []);
  const today = useMemo(() => todayFormat.format(new Date()), []);
  const { kpis, usersByRole, recentActivity, needsAttention, portalStatus } = data;

  const activeShare = kpis.totalUsers ? Math.round((kpis.activeAccounts / kpis.totalUsers) * 100) : 0;
  const roleTotal = usersByRole.reduce((sum, role) => sum + role.count, 0);
  // Largest group first, so the bars read as a ranking.
  const rolesBySize = [...usersByRole].sort((a, b) => b.count - a.count);
  const registrationOpen = portalStatus.studentRegistration === 'open';

  return (
    <SystemAdminShell
      activeNav="dashboard"
      title="Dashboard"
      description="Accounts, access, and portal status at a glance."
    >
      <AdminPage>
        <section className={styles.banner} aria-label="Portal status">
          <div className={styles.bannerLead}>
            <span className={`${styles.liveBadge} ${portalStatus.maintenanceMode ? styles.liveBadgeOff : ''}`}>
              <span className={styles.liveDot} aria-hidden="true" />
              {portalStatus.maintenanceMode ? 'Maintenance mode is on' : 'Portal is live'}
            </span>
            <span className={styles.bannerDate}>{today}</span>
          </div>

          <dl className={styles.bannerStats}>
            <div className={styles.bannerStat}>
              <dt>
                <i className="fas fa-calendar-days" aria-hidden="true" />
                Academic year
              </dt>
              <dd>{portalStatus.academicYear}</dd>
            </div>
            <div className={styles.bannerStat}>
              <dt>
                <i className="fas fa-user-graduate" aria-hidden="true" />
                Student registration
              </dt>
              <dd className={registrationOpen ? styles.statGood : styles.statMuted}>{registrationOpen ? 'Open' : 'Closed'}</dd>
            </div>
            <div className={styles.bannerStat}>
              <dt>
                <i className="fas fa-screwdriver-wrench" aria-hidden="true" />
                Maintenance
              </dt>
              <dd className={portalStatus.maintenanceMode ? styles.statBad : styles.statGood}>
                {portalStatus.maintenanceMode ? 'On' : 'Off'}
              </dd>
            </div>
            <div className={styles.bannerStat}>
              <dt>
                <i className="fas fa-palette" aria-hidden="true" />
                Branding updated
              </dt>
              <dd>
                <time dateTime={portalStatus.lastBrandingUpdate}>{formatWhen(portalStatus.lastBrandingUpdate)}</time>
              </dd>
            </div>
          </dl>

          <div className={styles.bannerActions}>
            <ActionLink href="/system-admin/branding" icon="fa-palette">
              Branding
            </ActionLink>
            <ActionLink href="/system-admin/users" icon="fa-user-plus" variant="primary">
              Create staff account
            </ActionLink>
          </div>
        </section>

        <section className={styles.kpiGrid} aria-label="Account summary">
          <KpiCard
            label="Total users"
            icon="fa-users"
            value={formatCount(kpis.totalUsers)}
            helper={`+${formatCount(kpis.newUsersThisWeek)} this week`}
            helperIcon="fa-arrow-trend-up"
            helperTone="success"
          />
          <KpiCard
            label="Active accounts"
            icon="fa-user-check"
            iconTone="success"
            value={formatCount(kpis.activeAccounts)}
            meter={activeShare}
            helper={`${activeShare}% of all users`}
          />
          <KpiCard
            label="Suspended"
            icon="fa-user-slash"
            iconTone="error"
            accent="accent"
            value={formatCount(kpis.suspendedAccounts)}
            valueTone="error"
            helper={`${formatCount(kpis.suspensionsExpiringThisWeek)} expire this week`}
            helperIcon="fa-hourglass-half"
          />
          <KpiCard
            label="Staff accounts"
            icon="fa-id-badge"
            iconTone="accent"
            accent="accent"
            value={formatCount(kpis.staffAccounts)}
            helper="Issued by admin"
            helperIcon="fa-lock"
          />
        </section>

        <div className={styles.split}>
          <SectionCard
            title="Users by role"
            titleId="sa-users-by-role"
            icon="fa-chart-simple"
            description={`${formatCount(roleTotal)} accounts across ${usersByRole.length} role groups`}
            action={
              <TextLink href="/system-admin/users" label="Open user management" arrow>
                Manage
              </TextLink>
            }
          >
            <ul className={styles.list}>
              {rolesBySize.map((role) => {
                const { label, icon } = ROLE_GROUPS[role.group];
                const share = roleTotal ? (role.count / roleTotal) * 100 : 0;
                // Keep very small non-zero groups visible as a sliver; the count shows the real number.
                const width = role.count > 0 ? Math.max(share, 0.75) : 0;
                const shareLabel = share > 0 && share < 1 ? '<1%' : `${Math.round(share)}%`;

                return (
                  <li key={role.group} className={styles.roleRow} title={`${label}: ${formatCount(role.count)} (${shareLabel})`}>
                    <IconTile icon={icon} />
                    <div className={styles.roleBody}>
                      <div className={styles.roleRowHead}>
                        <span className={styles.roleLabel}>{label}</span>
                        <span className={styles.roleFigures}>
                          <span className={styles.roleCount}>{formatCount(role.count)}</span>
                          <span className={styles.roleShare}>{shareLabel}</span>
                        </span>
                      </div>
                      <div className={styles.barTrack} aria-hidden="true">
                        <div className={styles.barFill} style={{ '--share': `${width.toFixed(1)}%` } as CSSProperties} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard
            title="Needs attention"
            titleId="sa-needs-attention"
            icon="fa-bell"
            iconTone="accent"
            accent="accent"
            description={
              needsAttention.length
                ? `${needsAttention.length} ${plural(needsAttention.length, 'item', 'items')} to review`
                : 'All clear'
            }
          >
            {needsAttention.length ? (
              <ul className={styles.attentionList}>
                {needsAttention.map((item) => {
                  const { icon, text, action, actionLabel } = describeAttention(item);
                  const isWarning = item.tone === 'warning';

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        aria-label={`${text}. ${actionLabel}`}
                        className={`${styles.attentionItem} ${isWarning ? styles.attentionWarning : ''}`}
                      >
                        <IconTile icon={icon} tone={isWarning ? 'accent' : 'primary'} />
                        <span className={styles.attentionText}>
                          {text}
                          {isWarning ? <span className={styles.attentionTag}>Action needed</span> : null}
                        </span>
                        <span className={styles.attentionAction} aria-hidden="true">
                          {action}
                          <i className="fas fa-arrow-right" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon="fa-circle-check" message="Nothing needs attention right now" />
            )}
          </SectionCard>
        </div>

        <div className={styles.split}>
          <SectionCard
            title="Recent account activity"
            titleId="sa-recent-activity"
            icon="fa-clock-rotate-left"
            description="Latest changes made by administrators"
            action={
              <TextLink href="/system-admin/logs" label="View all account activity" arrow>
                View all
              </TextLink>
            }
          >
            {recentActivity.length ? (
              <ol className={styles.timeline}>
                {recentActivity.map((activity) => {
                  const { icon, tone, text } = describeActivity(activity);

                  return (
                    <li key={activity.id} className={styles.timelineItem}>
                      <IconTile icon={icon} tone={tone} />
                      <span className={styles.rowText}>{text}</span>
                      <time className={styles.rowMeta} dateTime={activity.occurredAt}>
                        {formatWhen(activity.occurredAt)}
                      </time>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState icon="fa-clock-rotate-left" message="No recent activity" />
            )}
          </SectionCard>

          <SectionCard
            title="Quick actions"
            titleId="sa-quick-actions"
            icon="fa-bolt"
            iconTone="accent"
            accent="accent"
            description="Jump to an admin tool"
          >
            <ul className={styles.quickGrid}>
              {QUICK_ACTIONS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.quickLink}>
                    <IconTile icon={item.icon} />
                    <span className={styles.quickCopy}>
                      <span className={styles.quickLabel}>{item.label}</span>
                      <span className={styles.quickHint}>{item.hint}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </AdminPage>
    </SystemAdminShell>
  );
}
