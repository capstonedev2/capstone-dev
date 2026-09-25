'use client';

import { type CSSProperties, useMemo } from 'react';
import { SystemAdminShell } from '@/components/system-admin/system-admin-shell';
import {
  ActionLink,
  AdminPage,
  EmptyState,
  IconTile,
  type IconTone,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusPill,
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

const ROLE_GROUP_LABELS: Record<DashboardRoleGroup, string> = {
  students: 'Students',
  advisers_panelists: 'Advisers and panelists',
  program_heads: 'Program heads',
  partners: 'Partners',
  other_staff: 'Other staff'
};

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
        text: `${item.count} ${plural(item.count, 'suspension ends', 'suspensions end')} this week`,
        action: 'Review',
        actionLabel: 'Review suspensions ending this week'
      };
    case 'temporary_passwords':
      return {
        text: `${item.count} staff haven't changed their temporary password`,
        action: 'View',
        actionLabel: 'View staff with temporary passwords'
      };
    case 'new_registrations':
      return {
        text: `${item.count} new student ${plural(item.count, 'registration', 'registrations')} today`,
        action: 'View',
        actionLabel: "View today's new student registrations"
      };
  }
}

export function SystemAdminDashboard() {
  // Mock data for now; see PLACEHOLDERS.md for the future data source of each section.
  const data = useMemo(() => getSystemAdminDashboardMock(), []);
  const { kpis, usersByRole, recentActivity, needsAttention, portalStatus } = data;

  const activeShare = kpis.totalUsers ? Math.round((kpis.activeAccounts / kpis.totalUsers) * 100) : 0;
  const roleTotal = usersByRole.reduce((sum, role) => sum + role.count, 0);

  return (
    <SystemAdminShell
      activeNav="dashboard"
      title="Dashboard"
      description="Accounts, access, and portal status at a glance."
    >
      <AdminPage>
        <PageHeader
          kicker="System admin"
          title="Admin"
          titleAccent="Dashboard"
          description="Accounts, access, and portal status at a glance."
          actions={
            <>
              <ActionLink href="/system-admin/branding" icon="fa-palette">
                Branding
              </ActionLink>
              <ActionLink href="/system-admin/users" icon="fa-user-plus" variant="primary">
                Create staff account
              </ActionLink>
            </>
          }
        />

        <section className={styles.kpiGrid} aria-label="Account summary">
          <KpiCard
            label="Total users"
            icon="fa-users"
            value={formatCount(kpis.totalUsers)}
            helper={`+${formatCount(kpis.newUsersThisWeek)} this week`}
            helperTone="success"
          />
          <KpiCard
            label="Active accounts"
            icon="fa-user-check"
            value={formatCount(kpis.activeAccounts)}
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
          />
          <KpiCard
            label="Staff accounts"
            icon="fa-id-badge"
            iconTone="accent"
            accent="accent"
            value={formatCount(kpis.staffAccounts)}
            helper="Issued by admin"
          />
        </section>

        <div className={styles.twoCol}>
          <SectionCard title="Users by role" titleId="sa-users-by-role">
            <ul className={styles.list}>
              {usersByRole.map((role) => {
                const share = roleTotal ? (role.count / roleTotal) * 100 : 0;
                // Keep very small non-zero groups visible as a sliver; the count shows the real number.
                const width = role.count > 0 ? Math.max(share, 0.75) : 0;

                return (
                  <li key={role.group} className={styles.roleRow}>
                    <div className={styles.roleRowHead}>
                      <span>{ROLE_GROUP_LABELS[role.group]}</span>
                      <span className={styles.roleCount}>{formatCount(role.count)}</span>
                    </div>
                    <div className={styles.barTrack} aria-hidden="true">
                      <div
                        className={`${styles.barFill} ${role.group === 'partners' ? styles.barFillAccent : ''}`}
                        style={{ '--share': `${width.toFixed(1)}%` } as CSSProperties}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard
            title="Recent account activity"
            titleId="sa-recent-activity"
            accent="accent"
            action={<TextLink href="/system-admin/logs" label="View all account activity">View all</TextLink>}
          >
            {recentActivity.length ? (
              <ul className={styles.list}>
                {recentActivity.map((activity) => {
                  const { icon, tone, text } = describeActivity(activity);

                  return (
                    <li key={activity.id} className={styles.row}>
                      <IconTile icon={icon} tone={tone} />
                      <span className={styles.rowText}>{text}</span>
                      <time className={styles.rowMeta} dateTime={activity.occurredAt}>
                        {formatWhen(activity.occurredAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon="fa-clock-rotate-left" message="No recent activity" />
            )}
          </SectionCard>
        </div>

        <div className={styles.twoCol}>
          <SectionCard title="Needs attention" titleId="sa-needs-attention" accent="accent">
            {needsAttention.length ? (
              <ul className={styles.list}>
                {needsAttention.map((item) => {
                  const { text, action, actionLabel } = describeAttention(item);

                  return (
                    <li key={item.id} className={styles.row}>
                      <span
                        className={`${styles.dot} ${item.tone === 'warning' ? styles.dotWarning : styles.dotNeutral}`}
                        aria-hidden="true"
                      />
                      <span className={styles.rowText}>{text}</span>
                      <TextLink href={item.href} label={actionLabel}>
                        {action}
                      </TextLink>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon="fa-circle-check" message="Nothing needs attention right now" />
            )}
          </SectionCard>

          <SectionCard title="Portal status" titleId="sa-portal-status">
            <dl className={styles.statusList}>
              <div className={styles.statusRow}>
                <dt className={styles.statusLabel}>Maintenance mode</dt>
                <dd className={styles.statusValue}>
                  <StatusPill tone={portalStatus.maintenanceMode ? 'error' : 'success'}>
                    {portalStatus.maintenanceMode ? 'On' : 'Off'}
                  </StatusPill>
                </dd>
              </div>
              <div className={styles.statusRow}>
                <dt className={styles.statusLabel}>Academic year</dt>
                <dd className={styles.statusValue}>{portalStatus.academicYear}</dd>
              </div>
              <div className={styles.statusRow}>
                <dt className={styles.statusLabel}>Student registration</dt>
                <dd className={styles.statusValue}>{portalStatus.studentRegistration === 'open' ? 'Open' : 'Closed'}</dd>
              </div>
              <div className={styles.statusRow}>
                <dt className={styles.statusLabel}>Last branding update</dt>
                <dd className={styles.statusValue}>
                  <time dateTime={portalStatus.lastBrandingUpdate}>{formatWhen(portalStatus.lastBrandingUpdate)}</time>
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </AdminPage>
    </SystemAdminShell>
  );
}
