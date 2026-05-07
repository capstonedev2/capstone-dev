'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getRoleRedirectPath,
  persistAuthenticatedUser
} from '@/lib/client-auth';
import {
  authUi,
  getMessageClass
} from './auth-ui';

type AuthMeResponse = {
  success?: boolean;
  user?: Parameters<typeof persistAuthenticatedUser>[0];
  message?: string;
};

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/api/')) {
    return '';
  }

  return value;
}

export function AuthSyncPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

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
          router.replace(getSafeRedirectPath(searchParams.get('redirect')) || getRoleRedirectPath(payload.user.role));
        }
      } catch (syncError) {
        if (!cancelled) {
          setError(
            syncError instanceof Error && syncError.message
              ? syncError.message
              : 'Unable to complete Google sign in.'
          );
        }
      }
    }

    void syncSession();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className={authUi.page}>
      <div className={authUi.pageWash} aria-hidden="true" />
      <div className={authUi.pagePattern} aria-hidden="true" />
      <div className={authUi.topStripe} aria-hidden="true" />

      <section className={authUi.shell} aria-labelledby="google-sync-title">
        <div className={authUi.authFrame}>
          <div className={authUi.formColumn}>
            <div className={authUi.card}>
              <div className={authUi.cardStripe} aria-hidden="true" />
              <div className={authUi.header}>
                <span className={authUi.headerPill}>
                  <i className="fab fa-google" aria-hidden="true" />
                  Google Sign In
                </span>
                <h1 className={authUi.headerTitle} id="google-sync-title">
                  Completing sign in
                </h1>
                <p className={authUi.headerTextLeft}>
                  Please wait while ThesisTrack prepares your workspace.
                </p>
              </div>

              {error ? (
                <div className={getMessageClass('error')} role="alert" aria-live="polite">
                  {error}
                </div>
              ) : (
                <div className={authUi.compactNote} role="status" aria-live="polite">
                  <span className={authUi.spinner} aria-hidden="true" /> Syncing your account...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
