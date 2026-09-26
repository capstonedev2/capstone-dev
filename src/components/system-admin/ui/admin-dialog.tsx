'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './admin-dialog.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

type AdminDialogProps = {
  open: boolean;
  titleId: string;
  title: string;
  description?: ReactNode;
  /** While true, Escape / backdrop / close button are disabled. */
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  tone?: 'default' | 'danger';
  /** 'lg' for forms with two columns (e.g. account forms). */
  size?: 'md' | 'lg';
};

/**
 * Accessible modal for admin-style pages: focus moves in (honoring [data-autofocus]) and is trapped,
 * Escape and the backdrop close it unless `busy`, and focus returns to the opener afterwards.
 */
export function AdminDialog({
  open,
  titleId,
  title,
  description,
  busy = false,
  onClose,
  children,
  footer,
  tone = 'default',
  size = 'md'
}: AdminDialogProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy);
  const onCloseRef = useRef(onClose);
  busyRef.current = busy;
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busyRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={styles.dialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busyRef.current) onClose();
      }}
    >
      <div ref={panelRef} className={`${styles.dialog} ${size === 'lg' ? styles.dialogLarge : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy}>
        <div className={`${styles.dialogHead} ${tone === 'danger' ? styles.dialogHeadDanger : ''}`}>
          <div>
            <h2 className={styles.dialogTitle} id={titleId}>
              {title}
            </h2>
            {description ? <p className={styles.dialogDescription}>{description}</p> : null}
          </div>
          <button type="button" className={styles.dialogClose} onClick={onClose} disabled={busy} aria-label="Close dialog">
            <i className="fas fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className={styles.dialogBody}>{children}</div>
        <div className={styles.dialogFooter}>{footer}</div>
      </div>
    </div>,
    document.body
  );
}
