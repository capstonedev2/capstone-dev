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

import type { CSSProperties } from 'react';
import { useBranding } from '@/components/branding/branding-provider';
import { LogoIcon } from '@/components/branding/logo-icon';
import { cx } from './auth-ui';

export function AuthSyncPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { branding } = useBranding();
  const [error, setError] = useState('');

  const isVideoBackground = branding.assets.loginBackground?.match(/\.(mp4|webm)$/i) || branding.assets.loginBackground?.includes('/video/upload/');

  const loginBackgroundStyle = branding.assets.loginBackground && !isVideoBackground ? {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.34), rgba(0, 58, 143, 0.18)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
  } satisfies CSSProperties : (isVideoBackground ? { backgroundColor: 'transparent' } : undefined);

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
    <main className={cx(authUi.page, "!h-[100dvh] !overflow-hidden")} style={loginBackgroundStyle}>
      {isVideoBackground && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            src={branding.assets.loginBackground}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -10 }}
          />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.45)', zIndex: -9 }} />
        </>
      )}
      <div className={authUi.pageWash} aria-hidden="true" />
      <div className={authUi.pagePattern} aria-hidden="true" />

      <section className={cx(authUi.shell, "!min-h-0 !h-full !py-2 sm:!py-4 flex items-center justify-center")} aria-labelledby="google-sync-title">
        <div className="w-full max-w-[440px] overflow-hidden bg-transparent transform scale-[0.95] sm:scale-100 origin-center flex flex-col items-center">
          
          <div className="flex items-center gap-3 drop-shadow-lg mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2.5 shadow-xl relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#003A8F]/10 to-transparent pointer-events-none" />
              <LogoIcon style={{ width: 'auto' }} className="h-full" />
            </div>
            <div>
              <h1 className="m-0 text-2xl font-extrabold leading-none text-white drop-shadow-md tracking-tight">
                {branding.systemName.trim().toLowerCase() === 'thesis track' ? (
                  <>
                    <span className="text-[#003A8F] drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]">Thesis</span>
                    <span className="text-[#F6BE00]">Track</span>
                  </>
                ) : (
                  branding.systemName
                )}
              </h1>
              <p className="mt-1 text-xs font-semibold leading-3 text-slate-200 drop-shadow">
                {branding.tagline}
              </p>
            </div>
          </div>

          <div className="w-full rounded-[28px] border border-white/50 bg-white/[0.60] p-8 sm:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_24px_48px_-12px_rgba(0,0,0,0.25)] backdrop-blur-[24px] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#003A8F]/40 to-transparent" />
            
            <span className="mb-6 inline-flex items-center justify-center h-16 w-16 rounded-[1.25rem] bg-gradient-to-br from-white to-slate-50 border border-slate-100 shadow-[0_8px_20px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 text-[#4285F4]">
              <i className="fa-brands fa-google text-3xl" aria-hidden="true" />
            </span>
            
            <h2 className="m-0 text-2xl font-black leading-tight tracking-[-0.02em] text-slate-800 mb-2" id="google-sync-title">
              Completing Sign In
            </h2>
            <p className="text-[0.95rem] text-slate-600 font-medium leading-[1.6] mb-8">
              Please wait while ThesisTrack securely verifies your identity and prepares your workspace.
            </p>

            {error ? (
              <div className="w-full bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl p-4 text-sm font-medium text-red-700 shadow-sm flex items-start gap-3 text-left">
                <i className="fas fa-circle-exclamation mt-0.5 text-red-500 text-base" aria-hidden="true" />
                <span className="flex-1">{error}</span>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                  <span>Syncing Account</span>
                  <span className="text-[#003A8F] animate-pulse">Processing...</span>
                </div>
                <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full w-full bg-gradient-to-r from-[#003A8F] via-[#418bff] to-[#f6be00] rounded-full origin-left animate-[loadingBar_2s_ease-in-out_infinite]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loadingBar {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: left; }
          50.1% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
      `}} />
    </main>
  );
}
