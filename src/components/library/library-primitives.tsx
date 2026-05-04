import type { ReactNode } from 'react';

type LibraryCardSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

type LibraryStatCardProps = {
  title: string;
  value: ReactNode;
  children?: ReactNode;
  className?: string;
};

type LibraryBadgeProps = {
  children: ReactNode;
  tone?: 'default' | 'approved' | 'warning';
};

type LibraryModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
};

export function LibraryCardSection({
  title,
  action,
  children,
  className
}: LibraryCardSectionProps) {
  return (
    <section className={`library-section-card${className ? ` ${className}` : ''}`}>
      <div className="library-section-head">
        <h3>{title}</h3>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="library-section-body">{children}</div>
    </section>
  );
}

export function LibraryStatCard({
  title,
  value,
  children,
  className
}: LibraryStatCardProps) {
  return (
    <article className={`library-stat-card${className ? ` ${className}` : ''}`}>
      <h3>{title}</h3>
      <h2>{value}</h2>
      {children}
    </article>
  );
}

export function LibraryDepartmentBadge({ children }: { children: ReactNode }) {
  return <span className="library-dept-badge">{children}</span>;
}

export function LibraryStatusBadge({
  children,
  tone = 'approved'
}: LibraryBadgeProps) {
  return <span className={`library-status-badge is-${tone}`}>{children}</span>;
}

export function LibraryTag({ children }: { children: ReactNode }) {
  return <span className="library-tag">{children}</span>;
}

export function LibraryModal({
  open,
  title,
  onClose,
  children,
  maxWidth = 720
}: LibraryModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="library-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="library-modal-card" style={{ maxWidth }}>
        <div className="library-modal-head">
          <h3>{title}</h3>
          <button className="library-icon-btn" type="button" onClick={onClose}>
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>
        <div className="library-modal-body">{children}</div>
      </div>
    </div>
  );
}
