import Link from 'next/link';
import { memo, type ReactNode } from 'react';
import type {
  AttentionAlertItem,
  DashboardAction,
  DashboardMetric,
  DashboardTone,
  GroupProgressSnapshotItem,
  LiveUpdateItem,
  RecentSubmissionItem,
  WeeklyScheduleItem
} from '@/components/adviser/shared/config/dashboard-types';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

const toneBadgeStyles: Record<DashboardTone, string> = {
  primary: 'bg-[rgba(0,58,143,0.08)] text-[var(--primary)] ring-1 ring-[rgba(0,58,143,0.14)]',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
};

const toneIconStyles: Record<DashboardTone, string> = {
  primary: 'bg-[rgba(0,58,143,0.08)] text-[var(--primary)]',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  neutral: 'bg-slate-100 text-slate-600'
};

const timelineDotStyles: Record<DashboardTone, string> = {
  primary: 'bg-[var(--primary)]',
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-400'
};

const alertStyles = {
  urgent: 'border-l-[3px] border-l-[var(--danger)] bg-rose-50/70',
  warning: 'border-l-[3px] border-l-[var(--warning)] bg-amber-50/70',
  normal: 'border-l-[3px] border-l-[var(--primary)] bg-slate-50/85'
} as const;

const alertBadgeStyles = {
  urgent: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  warning: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  normal: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
} as const;

function SectionFrame({
  eyebrow,
  title,
  description,
  action,
  children
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="adviser-premium-section rounded-lg border border-slate-200/70 bg-white shadow-sm">
      <div className="adviser-premium-section-head flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <span className="adviser-section-eyebrow text-[11px] font-extrabold uppercase tracking-[0.18em] text-[rgba(0,58,143,0.68)]">
                {eyebrow}
              </span>
            ) : null}
            <h2 className="mt-1 text-lg font-bold tracking-[-0.03em] text-[var(--text-dark)]">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[var(--text-light)]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export const DashboardHeader = memo(function DashboardHeader({
  title,
  subtitle,
  workspaceLabel,
  profile,
  primaryAction,
  secondaryAction
}: {
  title: string;
  subtitle: string;
  workspaceLabel: string;
  profile?: {
    initials: string;
    name: string;
    role: string;
    department: string;
    helperText: string;
  };
  primaryAction: {
    href: string;
    label: string;
    icon: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
    icon: string;
  };
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.96))] px-6 py-6 shadow-sm sm:px-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="inline-flex min-h-[1.9rem] items-center rounded-full border border-[rgba(0,58,143,0.12)] bg-[rgba(0,58,143,0.06)] px-3 text-[var(--primary)]">
              {workspaceLabel}
            </span>
            <span className="flex items-center gap-2" aria-hidden="true">
              <i className="fas fa-angle-right" />
              <span>{title}</span>
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[var(--text-dark)] sm:text-[2rem]">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-light)] sm:text-[0.95rem]">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 xl:justify-end">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,58,143,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-dark)]"
            href={primaryAction.href}
            prefetch={false}
          >
            <i aria-hidden="true" className={`fas ${primaryAction.icon}`} />
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[var(--text-dark)] shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              href={secondaryAction.href}
              prefetch={false}
            >
              <i aria-hidden="true" className={`fas ${secondaryAction.icon}`} />
              {secondaryAction.label}
            </Link>
          ) : null}

          {profile ? <div className="flex min-w-[260px] items-center gap-3 rounded-2xl bg-slate-50/90 px-4 py-3 ring-1 ring-slate-200/80">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(0,58,143,0.08)] text-sm font-extrabold text-[var(--primary)]">
              {profile.initials}
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-sm font-semibold text-[var(--text-dark)]">{profile.name}</strong>
              <span className="block truncate text-xs text-[var(--text-light)]">{profile.role}</span>
              <small className="mt-1 block truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(0,58,143,0.68)]">
                {profile.department} - {profile.helperText}
              </small>
            </div>
          </div> : null}
        </div>
      </div>
    </section>
  );
});

export const SummaryCard = memo(function SummaryCard({ icon, label, value, helperText, trendLabel, tone = 'primary' }: DashboardMetric) {
  return (
    <article className={cx('adviser-kpi-card group rounded-lg border border-slate-200/70 bg-white p-5 shadow-sm', `adviser-kpi-card-${tone}`)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cx('adviser-kpi-icon inline-flex h-11 w-11 items-center justify-center rounded-lg text-base', toneIconStyles[tone])}>
          <i aria-hidden="true" className={`fas ${icon}`} />
        </span>
        {trendLabel ? (
          <span className={cx('adviser-status-chip inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold', toneBadgeStyles[tone])}>
            {trendLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <span className="block text-sm font-medium text-[var(--text-light)]">{label}</span>
        <strong className="mt-2 block text-3xl font-bold tracking-[-0.04em] text-[var(--text-dark)]">{value}</strong>
        <p className="mt-2 text-sm text-[var(--text-light)]">{helperText}</p>
      </div>
      <div className="adviser-kpi-sparkline" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </article>
  );
});

export const LiveSupervisionUpdates = memo(function LiveSupervisionUpdates({
  items,
  loading = false,
  emptyMessage = 'No supervision updates available right now.'
}: {
  items: LiveUpdateItem[];
  loading?: boolean;
  emptyMessage?: string;
}) {
  return (
    <SectionFrame
      eyebrow="Live Feed"
      title="Activity Feed"
      description="Recent submission, consultation, and milestone updates that may need adviser follow-up."
      action={
        <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Real-time ready
        </span>
      }
    >
      {loading ? (
        <div className="adviser-skeleton-stack flex min-h-[220px] items-center justify-center rounded-lg bg-slate-50 text-sm text-[var(--text-light)]">
          <span>Loading supervision feed...</span>
        </div>
      ) : items.length ? (
        <div aria-live="polite" className="adviser-live-timeline max-h-[30rem] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <article
              key={item.id}
              className="adviser-timeline-item rounded-lg border border-slate-200/70 bg-slate-50/80 p-4 transition hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className={cx('adviser-timeline-icon mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm', toneIconStyles[item.tone])}>
                  <i aria-hidden="true" className={`fas ${item.icon}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm font-semibold text-[var(--text-dark)]">{item.title}</strong>
                    {item.isNew ? (
                      <span className="inline-flex items-center rounded-full bg-[rgba(246,190,0,0.16)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--secondary-dark)]">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-light)]">{item.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-light)]">
                    <span className="font-semibold text-[var(--text-dark)]">{item.groupName}</span>
                    <span>-</span>
                    <span>{item.timestamp}</span>
                    <span className={cx('adviser-status-chip inline-flex items-center rounded-full px-2.5 py-1 font-semibold', toneBadgeStyles[item.tone])}>
                      {item.statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center rounded-lg bg-slate-50 text-sm text-[var(--text-light)]">
          {emptyMessage}
        </div>
      )}
    </SectionFrame>
  );
});

export const RecentSubmissions = memo(function RecentSubmissions({
  items,
  actionLabel,
  onAction,
  title = 'Recent Submissions',
  description = 'Latest items routed to your dashboard with review state and direct action access.',
  actionHref = '/adviser/adviser-mode/submissions',
  actionLinkLabel = 'Open full queue',
  emptyMessage = 'No submissions waiting for review.'
}: {
  items: RecentSubmissionItem[];
  actionLabel: string;
  onAction: (item: RecentSubmissionItem) => void;
  title?: string;
  description?: string;
  actionHref?: string;
  actionLinkLabel?: string;
  emptyMessage?: string;
}) {
  return (
    <SectionFrame
      eyebrow="Review Queue"
      title={title}
      description={description}
      action={
        <Link className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-[var(--primary)] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[var(--primary-dark)]" href={actionHref} prefetch={false}>
          {actionLinkLabel}
        </Link>
      }
    >
      {items.length ? (
        <div className="adviser-review-card-grid">
          {items.map((item, index) => (
            <article key={item.id} className={cx('adviser-review-card', `adviser-review-card-${item.tone}`)}>
              <div className="adviser-review-card-top">
                <span className="adviser-file-icon">
                  <i aria-hidden="true" className={item.submissionType.toLowerCase().includes('proposal') ? 'fas fa-file-signature' : 'fas fa-file-lines'} />
                </span>
                <div className="min-w-0">
                  <span className="adviser-review-kicker">{item.groupCode}</span>
                  <h3>{item.fileTitle}</h3>
                  <p>{item.groupName}</p>
                </div>
                <span className={cx('adviser-status-chip inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', toneBadgeStyles[item.tone])}>
                  {item.statusLabel}
                </span>
              </div>

              <div className="adviser-review-meta-grid">
                <span>
                  <small>Type</small>
                  <strong>{item.submissionType}</strong>
                </span>
                <span>
                  <small>Submitted</small>
                  <strong>{item.submittedDate}</strong>
                </span>
                <span>
                  <small>Revisions</small>
                  <strong>{item.revisionCount ?? index + 1}</strong>
                </span>
              </div>

              <div className="adviser-feedback-preview">
                <i aria-hidden="true" className="fas fa-comment-dots" />
                <span>{item.meta ?? 'Waiting for adviser feedback preview'}</span>
              </div>

              <div className="adviser-review-actions">
                <button className="is-primary" type="button" onClick={() => onAction(item)}>
                  <i aria-hidden="true" className="fas fa-check-double" />
                  {actionLabel === 'Review' ? 'Open Review' : actionLabel}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-slate-50 text-sm text-[var(--text-light)]">
          {emptyMessage}
        </div>
      )}
    </SectionFrame>
  );
});

export const AttentionAlerts = memo(function AttentionAlerts({
  items,
  emptyMessage = 'No urgent supervision issues need attention right now.'
}: {
  items: AttentionAlertItem[];
  emptyMessage?: string;
}) {
  return (
    <SectionFrame
      eyebrow="Attention Needed"
      title="Priority Attention"
      description="Groups and submissions that should be handled before routine monitoring."
    >
      {items.length ? (
        <div className="adviser-alert-stack space-y-3">
          {items.map((item) => (
            <article key={item.id} className={cx('adviser-alert-card rounded-lg px-4 py-4', `adviser-alert-${item.priority}`, alertStyles[item.priority])}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block text-sm font-semibold text-[var(--text-dark)]">{item.title}</strong>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-light)]">{item.description}</p>
                </div>
                <span className={cx('adviser-status-chip inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]', alertBadgeStyles[item.priority])}>
                  {item.priority}
                </span>
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-light)]">{item.meta}</div>
              <div className="adviser-intervention-hint">
                <i aria-hidden="true" className="fas fa-route" />
                <span>{item.priority === 'urgent' ? 'Schedule an intervention check-in today.' : item.priority === 'warning' ? 'Send a milestone reminder before the next consultation.' : 'Keep this item on the next review pass.'}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-slate-50 text-sm text-[var(--text-light)]">
          {emptyMessage}
        </div>
      )}
    </SectionFrame>
  );
});

export const QuickActions = memo(function QuickActions({ actions }: { actions: DashboardAction[] }) {
  return (
    <SectionFrame eyebrow="Quick Actions" title="Quick Actions" description="Open the main adviser workflows from one compact list.">
      <div className="adviser-quick-action-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((action) =>
          action.href ? (
            <Link
              key={action.id}
              className="adviser-quick-action group flex min-h-[84px] items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-4 transition hover:border-[rgba(0,58,143,0.18)] hover:bg-white hover:shadow-sm"
              href={action.href}
              prefetch={false}
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,58,143,0.08)] text-[var(--primary)]">
                <i aria-hidden="true" className={`fas ${action.icon}`} />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-[var(--text-dark)]">{action.label}</strong>
                <small className="mt-1 block text-xs leading-5 text-[var(--text-light)]">{action.helperText}</small>
              </span>
              <i aria-hidden="true" className="adviser-quick-action-arrow fas fa-chevron-right" />
            </Link>
          ) : (
            <button
              key={action.id}
              className="adviser-quick-action group flex min-h-[84px] items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-4 text-left transition hover:border-[rgba(0,58,143,0.18)] hover:bg-white hover:shadow-sm"
              type="button"
              onClick={action.onClick}
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,58,143,0.08)] text-[var(--primary)]">
                <i aria-hidden="true" className={`fas ${action.icon}`} />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-[var(--text-dark)]">{action.label}</strong>
                <small className="mt-1 block text-xs leading-5 text-[var(--text-light)]">{action.helperText}</small>
              </span>
              <i aria-hidden="true" className="adviser-quick-action-arrow fas fa-chevron-right" />
            </button>
          )
        )}
      </div>
    </SectionFrame>
  );
});

export const WeeklySchedule = memo(function WeeklySchedule({ items }: { items: WeeklyScheduleItem[] }) {
  return (
    <SectionFrame eyebrow="This Week" title="This Week's Schedule" description="Consultations and defenses arranged in a compact adviser timeline.">
      {items.length ? (
        <div className="adviser-schedule-timeline space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="adviser-schedule-row flex gap-4">
              <div className="adviser-schedule-date flex w-20 shrink-0 flex-col">
                <span className="text-sm font-semibold text-[var(--text-dark)]">{item.dateLabel}</span>
                <span className="text-xs text-[var(--text-light)]">{item.timeLabel}</span>
              </div>
              <div className="adviser-schedule-card relative flex-1 rounded-lg border border-slate-200/70 bg-slate-50/80 p-4">
                {index !== items.length - 1 ? <span className="absolute -bottom-4 left-[1.15rem] top-full w-px bg-slate-200" /> : null}
                <span className={cx('absolute left-4 top-4 h-2.5 w-2.5 rounded-full', timelineDotStyles[item.tone ?? 'primary'])} />
                <div className="pl-5">
                  <strong className="block text-sm font-semibold text-[var(--text-dark)]">{item.groupName}</strong>
                  <p className="mt-1 text-sm text-[var(--text-light)]">{item.eventType}</p>
                  {item.location ? <small className="mt-2 block text-xs text-[var(--text-light)]">{item.location}</small> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-slate-50 text-sm text-[var(--text-light)]">
          No schedule items this week.
        </div>
      )}
    </SectionFrame>
  );
});

export const GroupProgressSnapshot = memo(function GroupProgressSnapshot({ items, emptyMessage = 'No group progress records available.' }: { items: GroupProgressSnapshotItem[]; emptyMessage?: string }) {
  const averageProgress = items.length
    ? Math.round(items.reduce((total, item) => total + item.progress, 0) / items.length)
    : 0;
  const watchCount = items.filter((item) => item.progress < 60).length;
  const readyCount = items.filter((item) => item.progress >= 80).length;

  return (
    <SectionFrame
      eyebrow="Progress Snapshot"
      title="Group Progress Snapshot"
      description="Compact view of milestone status for the groups you need to watch most closely."
    >
      {items.length ? (
        <div className="adviser-progress-stack space-y-4">
          <div className="adviser-progress-summary-grid" aria-label="Progress milestone summary">
            <span>
              <strong>{averageProgress}%</strong>
              <small>Average</small>
            </span>
            <span>
              <strong>{watchCount}</strong>
              <small>Watchlist</small>
            </span>
            <span>
              <strong>{readyCount}</strong>
              <small>Ready</small>
            </span>
          </div>
          {items.map((item) => (
            <article key={item.id} className="adviser-progress-card rounded-lg border border-slate-200/70 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block text-sm font-semibold text-[var(--text-dark)]">{item.groupName}</strong>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-light)]">{item.projectTitle}</p>
                </div>
                <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', toneBadgeStyles[item.tone])}>
                  {item.statusLabel}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-light)]">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="adviser-progress-track mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="adviser-progress-fill h-2 rounded-full bg-[linear-gradient(90deg,var(--primary),var(--secondary))]"
                    style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-[var(--text-light)]">
                  <span className="font-medium text-[var(--text-dark)]">Current milestone:</span> {item.milestone}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-slate-50 text-sm text-[var(--text-light)]">
          {emptyMessage}
        </div>
      )}
    </SectionFrame>
  );
});
