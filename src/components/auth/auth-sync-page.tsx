'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRoleRedirectPath, persistAuthenticatedUser } from '@/lib/client-auth';
import { AuthModalBrand } from './auth-modal-brand';
import { authUi, cx } from './auth-ui';
import styles from './auth-sync.module.css';

type AuthMeResponse = {
  success?: boolean;
  user?: Parameters<typeof persistAuthenticatedUser>[0];
  message?: string;
};

type SyncStatus = 'verifying' | 'redirecting' | 'error';

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/api/')) {
    return '';
  }

  return value;
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function StepRow({ state, label }: { state: 'done' | 'active' | 'pending'; label: string }) {
  return (
    <li className="flex items-center gap-3 text-[0.9375rem]">
      <span
        className={cx(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
          state === 'done' && 'bg-emerald-50 text-emerald-600',
          state === 'active' && 'bg-[#003A8F]/10 text-[#003A8F]',
          state === 'pending' && 'bg-slate-100 text-slate-400'
        )}
        aria-hidden="true"
      >
        {state === 'done' ? (
          <i className="fas fa-check" />
        ) : state === 'active' ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#003A8F]/25 border-t-[#003A8F] motion-reduce:animate-none" />
        ) : (
          <i className="fas fa-circle text-[0.4rem]" />
        )}
      </span>
      <span className={cx('font-semibold', state === 'pending' ? 'text-slate-400' : 'text-slate-700')}>
        {label}
        <span className="sr-only">{state === 'done' ? ' (done)' : state === 'active' ? ' (in progress)' : ' (waiting)'}</span>
      </span>
    </li>
  );
}

/**
 * Google sign-in hand-off (/auth/sync): shown over the landing page in the same card style as the auth
 * modal while the server session is confirmed and the user is sent to their dashboard. It can't be
 * dismissed while working; on failure it offers a retry and a way back to the login modal.
 */
export function AuthSyncPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SyncStatus>('verifying');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'same-origin'
        });
        const payload = response.headers.get('content-type')?.includes('application/json')
          ? ((await response.json()) as AuthMeResponse)
          : null;

        if (!response.ok || !payload?.success || !payload.user) {
          throw new Error(payload?.message || 'Unable to complete Google sign in.');
        }

        persistAuthenticatedUser(payload.user);

        if (!cancelled) {
          setStatus('redirecting');
          router.replace(getSafeRedirectPath(searchParams.get('redirect')) || getRoleRedirectPath(payload.user.role));
        }
      } catch (syncError) {
        if (!cancelled) {
          setError(
            syncError instanceof Error && syncError.message
              ? syncError.message
              : 'Unable to complete Google sign in.'
          );
          setStatus('error');
        }
      }
    }

    void syncSession();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  // Lock the page behind the card; move focus to the first action if something went wrong.
  useEffect(() => {
    if (!mounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (status === 'error') {
      retryRef.current?.focus();
    }
  }, [status]);

  if (!mounted) {
    return null;
  }

  const isError = status === 'error';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        className="w-full rounded-t-[20px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:max-w-[440px] sm:rounded-[20px]"
        role={isError ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="google-sync-title"
        aria-describedby="google-sync-text"
        aria-busy={!isError}
      >
        <div className="px-6 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <AuthModalBrand />

          <div className="mb-6 flex flex-col items-center text-center">
            <span
              className={cx(
                'mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_6px_16px_rgba(15,43,89,0.1)] ring-1',
                isError ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-white ring-slate-100'
              )}
            >
              {isError ? <i className="fas fa-triangle-exclamation text-xl" aria-hidden="true" /> : <GoogleMark className="h-7 w-7" />}
            </span>
            <h2 className="m-0 font-serif text-[1.75rem] font-bold leading-tight text-[#102033]" id="google-sync-title">
              {isError ? "We couldn't sign you in" : 'Completing sign in'}
            </h2>
            <p className="mt-2 max-w-sm text-base leading-7 text-slate-600" id="google-sync-text" aria-live="polite">
              {isError
                ? error
                : status === 'redirecting'
                  ? 'You’re signed in. Opening your workspace…'
                  : 'Securely confirming your Google account. This only takes a moment.'}
            </p>
          </div>

          {isError ? (
            <div className="grid gap-3">
              <button
                ref={retryRef}
                type="button"
                className={authUi.submitButton}
                onClick={() => {
                  window.location.href = '/api/auth/google';
                }}
              >
                <GoogleMark className="h-4 w-4 rounded-sm bg-white p-[1px]" />
                Try Google again
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-slate-200 sm:h-12"
                onClick={() => router.replace('/login')}
              >
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <ol className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <StepRow state={status === 'verifying' ? 'active' : 'done'} label="Verifying your Google account" />
                <StepRow state={status === 'redirecting' ? 'active' : 'pending'} label="Opening your workspace" />
              </ol>
              <div className={styles.track} aria-hidden="true">
                <span className={styles.bar} />
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-[0.8125rem] font-semibold text-slate-500">
                <i className="fas fa-shield-halved text-[#003A8F]" aria-hidden="true" />
                Secure sign-in via Google
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
