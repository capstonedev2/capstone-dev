import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './system-admin-ui.module.css';
export { AdminDialog } from './admin-dialog';

/*
 * Shared building blocks for System Admin pages, themed like the public landing page.
 * Colors come from the Theme & Branding variables (and switch for the dark portal theme);
 * see system-admin-ui.module.css.
 */

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export type CardAccent = 'primary' | 'accent';
export type IconTone = 'primary' | 'accent' | 'error' | 'success';

const CARD_ACCENT_CLASS: Record<CardAccent, string> = {
  primary: styles.cardPrimary,
  accent: styles.cardAccent
};

const TILE_TONE_CLASS: Record<IconTone, string> = {
  primary: styles.tilePrimary,
  accent: styles.tileAccent,
  error: styles.tileError,
  success: styles.tileSuccess
};

/** Page wrapper: sets the admin theme tokens (light + dark) and the tinted page background. */
export function AdminPage({ children }: { children: ReactNode }) {
  return <div className={styles.adminPage}>{children}</div>;
}

export function PageHeader({
  kicker,
  title,
  titleAccent,
  description,
  actions
}: {
  /** Small pill badge above the title (landing-page "section kicker" style). */
  kicker?: string;
  /** Optional: a page can show only the header actions (no heading text). */
  title?: string;
  /** Second half of a two-tone title, shown in the accent color. */
  titleAccent?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      {kicker || title || description ? (
        <div className={styles.pageHeaderText}>
          {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
          {title ? (
            <h1 className={styles.pageTitle}>
              <span className={styles.pageTitleMain}>{title}</span>
              {titleAccent ? (
                <>
                  {' '}
                  <span className={styles.pageTitleAccent}>{titleAccent}</span>
                </>
              ) : null}
            </h1>
          ) : null}
          {description ? <p className={styles.pageDescription}>{description}</p> : null}
        </div>
      ) : null}
      {actions ? <div className={styles.pageHeaderActions}>{actions}</div> : null}
    </header>
  );
}

export function ActionLink({
  href,
  icon,
  variant = 'secondary',
  children
}: {
  href: string;
  icon?: string;
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(styles.actionLink, variant === 'primary' ? styles.actionPrimary : styles.actionSecondary)}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  label,
  arrow = false
}: {
  href: string;
  children: ReactNode;
  label?: string;
  /** Trailing arrow that nudges right on hover. */
  arrow?: boolean;
}) {
  return (
    <Link href={href} className={styles.textLink} aria-label={label}>
      {children}
      {arrow ? <i className={`fas fa-arrow-right ${styles.textLinkArrow}`} aria-hidden="true" /> : null}
    </Link>
  );
}

/** Tinted rounded-square icon (decorative). */
export function IconTile({ icon, tone = 'primary' }: { icon: string; tone?: IconTone }) {
  return (
    <span className={cx(styles.iconTile, TILE_TONE_CLASS[tone])} aria-hidden="true">
      <i className={`fas ${icon}`} />
    </span>
  );
}

export function KpiCard({
  label,
  value,
  helper,
  helperIcon,
  icon,
  iconTone = 'primary',
  accent = 'primary',
  valueTone = 'default',
  helperTone = 'default',
  meter
}: {
  label: string;
  value: string;
  helper?: string;
  /** Font Awesome icon shown before the helper text (e.g. a trend arrow). */
  helperIcon?: string;
  icon?: string;
  iconTone?: IconTone;
  accent?: CardAccent;
  valueTone?: 'default' | 'error';
  helperTone?: 'default' | 'success';
  /** Optional 0–100 share drawn as a thin bar; decorative, so the helper text should state the number. */
  meter?: number;
}) {
  return (
    <article className={cx(styles.card, CARD_ACCENT_CLASS[accent], styles.kpiCard)}>
      <div className={styles.kpiHead}>
        <span className={styles.kpiLabel}>{label}</span>
        {icon ? <IconTile icon={icon} tone={iconTone} /> : null}
      </div>
      <strong className={cx(styles.kpiValue, valueTone === 'error' && styles.kpiValueError)}>{value}</strong>
      {meter !== undefined ? (
        <span className={styles.kpiMeter} aria-hidden="true">
          <span className={styles.kpiMeterFill} style={{ width: `${Math.min(Math.max(meter, 0), 100)}%` }} />
        </span>
      ) : null}
      {helper ? (
        <span className={cx(styles.kpiHelper, helperTone === 'success' && styles.kpiHelperSuccess)}>
          {helperIcon ? <i className={`fas ${helperIcon}`} aria-hidden="true" /> : null}
          {helper}
        </span>
      ) : null}
    </article>
  );
}

export function SectionCard({
  title,
  description,
  icon,
  iconTone = 'primary',
  action,
  children,
  titleId,
  accent = 'primary'
}: {
  title: string;
  /** One short line under the title. */
  description?: string;
  icon?: string;
  iconTone?: IconTone;
  action?: ReactNode;
  children: ReactNode;
  titleId?: string;
  accent?: CardAccent;
}) {
  return (
    <section className={cx(styles.card, CARD_ACCENT_CLASS[accent], styles.sectionCard)} aria-labelledby={titleId}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionHeadText}>
          {icon ? <IconTile icon={icon} tone={iconTone} /> : null}
          <div className={styles.sectionHeadCopy}>
            <h2 className={styles.sectionTitle} id={titleId}>
              {title}
            </h2>
            {description ? <p className={styles.sectionDescription}>{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon = 'fa-inbox', message }: { icon?: string; message: string }) {
  return (
    <div className={styles.emptyState} role="status">
      <span className={styles.emptyStateIcon}>
        <i className={`fas ${icon}`} aria-hidden="true" />
      </span>
      {message}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: 'success' | 'error' | 'neutral'; children: ReactNode }) {
  const toneClass = tone === 'success' ? styles.statusPillSuccess : tone === 'error' ? styles.statusPillError : styles.statusPillNeutral;

  return <span className={cx(styles.statusPill, toneClass)}>{children}</span>;
}

/** Marks a page or panel that shows mock data, so demo numbers aren't mistaken for real ones. */
export function SampleDataBadge({ label = 'Sample data' }: { label?: string }) {
  return (
    <span className={styles.sampleBadge} title="These numbers are sample data, not live records.">
      <i className="fas fa-flask" aria-hidden="true" />
      {label}
    </span>
  );
}
