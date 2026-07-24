import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PartnerStatusTone } from '@/components/partner/partner-data';

export function PartnerStatCard({
  title,
  value,
  note,
  children
}: {
  title: string;
  value: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="stat-card">
      <h3>{title}</h3>
      <h2>{value}</h2>
      {note ? <p>{note}</p> : null}
      {children}
    </article>
  );
}

export function PartnerDepartmentBadge({ children }: { children: ReactNode }) {
  return <span className="dept-badge">{children}</span>;
}

export function PartnerStatusBadge({
  children,
  tone
}: {
  children: ReactNode;
  tone: PartnerStatusTone;
}) {
  const statusClass =
    tone === 'approved'
      ? 'status-approved'
      : tone === 'pending'
        ? 'status-pending'
        : tone === 'warning'
          ? 'status-warning'
          : tone === 'danger'
            ? 'status-danger'
            : tone === 'completed'
              ? 'status-completed'
              : tone === 'deployed'
                ? 'status-deployed'
                : 'status-active';

  return <span className={`status-badge ${statusClass}`}>{children}</span>;
}

export function PartnerButton({
  children,
  variant = 'outline',
  small = false,
  type = 'button',
  onClick
}: {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'danger';
  small?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-outline';

  return (
    <button className={`btn ${variantClass}${small ? ' small' : ''}`} type={type} onClick={onClick}>
      {children}
    </button>
  );
}

export function PartnerModal({
  open,
  title,
  narrow = false,
  onClose,
  children,
  footer
}: {
  open: boolean;
  title: string;
  narrow?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '1.2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: narrow ? '480px' : '640px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A', fontWeight: 800 }}>{title}</h3>
          <button 
            aria-label="Close modal" 
            type="button" 
            onClick={onClose}
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', transition: 'background 0.2s', fontSize: '1.2rem' }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
          >
            <i aria-hidden="true" className="fas fa-times" />
          </button>
        </div>
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', maxHeight: '70vh' }}>
          {children}
        </div>
        {footer ? (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
