import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProgramHeadStatusTone } from '@/components/program-head/program-head-data';

type ProgramHeadCardSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ProgramHeadStatCardProps = {
  title: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: string;
  children?: ReactNode;
  className?: string;
};

type ProgramHeadModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
};

export function ProgramHeadCardSection({
  title,
  description,
  action,
  children,
  className
}: ProgramHeadCardSectionProps) {
  return (
    <section className={`ph-card-section${className ? ` ${className}` : ''}`}>
      <div className="ph-card-header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="ph-card-body">{children}</div>
    </section>
  );
}

export function ProgramHeadStatCard({
  title,
  value,
  note,
  icon,
  children,
  className
}: ProgramHeadStatCardProps) {
  return (
    <article className={`relative overflow-hidden rounded-2xl bg-[var(--surface)] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] ring-1 ring-[var(--border)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(15,61,222,0.08)] hover:-translate-y-1 group ${className || ''}`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F3DDE] to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
      
      <div className="flex justify-between items-start relative z-10 mb-4">
        <h3 className="text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-widest">{title}</h3>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] ring-1 ring-[var(--border)] text-[#0F3DDE] flex items-center justify-center text-lg shadow-sm transition-transform duration-300 group-hover:scale-110">
            <i className={icon}></i>
          </div>
        )}
      </div>
      
      <h2 className="relative z-10 text-3xl font-extrabold text-[var(--text)] mb-1 tracking-tight">{value}</h2>
      
      {note && (
        <p className="relative z-10 text-xs font-semibold text-[var(--muted)] mt-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> {note}
        </p>
      )}
      
      {children && <div className="relative z-10 mt-5">{children}</div>}
    </article>
  );
}

export function ProgramHeadDepartmentBadge({ children }: { children: ReactNode }) {
  return <span className="ph-dept-badge">{children}</span>;
}

export function ProgramHeadStatusBadge({
  children,
  tone = 'approved'
}: {
  children: ReactNode;
  tone?: ProgramHeadStatusTone;
}) {
  return <span className={`ph-status-badge is-${tone}`}>{children}</span>;
}

export function ProgramHeadButton({
  children,
  type = 'button',
  variant = 'outline',
  className,
  onClick
}: {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'outline' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={`ph-btn is-${variant}${className ? ` ${className}` : ''}`}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ProgramHeadModal({
  open,
  title,
  onClose,
  children,
  maxWidth = 720
}: ProgramHeadModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="ph-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="ph-modal-card" style={{ maxWidth }}>
        <div className="ph-modal-head">
          <h3>{title}</h3>
          <button aria-label="Close modal" className="ph-icon-btn" type="button" onClick={onClose}>
            <i aria-hidden="true" className="fas fa-times" />
          </button>
        </div>
        <div className="ph-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function ProgramHeadDrawer({
  open,
  title,
  onClose,
  children,
  maxWidth = 600
}: ProgramHeadModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0B1120]/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-3xl bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.2)] ring-1 ring-[var(--border)]"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-alt)] px-8 py-6">
          <h3 className="m-0 text-xl font-bold text-[var(--text)]">{title}</h3>
          <button aria-label="Close panel" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted)] shadow-sm ring-1 ring-[var(--border)] transition-all hover:bg-red-50 hover:text-red-500 hover:ring-red-200 dark:hover:bg-red-500/20 dark:hover:ring-red-500/30" type="button" onClick={onClose}>
            <i aria-hidden="true" className="fas fa-times" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
