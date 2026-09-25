'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useBranding } from '@/components/branding/branding-provider';
import { LogoIcon } from '@/components/branding/logo-icon';
import { authUi, cx } from './auth-ui';
import { LoginForm } from './login-form';

export function LoginPage() {
  const { branding } = useBranding();
  const isVideoBackground = branding.assets.loginBackground?.match(/\.(mp4|webm)$/i) || branding.assets.loginBackground?.includes('/video/upload/');

  const loginBackgroundStyle = branding.assets.loginBackground && !isVideoBackground ? {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.34), rgba(0, 58, 143, 0.18)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
  } satisfies CSSProperties : (isVideoBackground ? { backgroundColor: 'transparent' } : undefined);

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

      {/* Floating 3D Depth Elements Removed */}

      <Link href="/" className={authUi.backLink}>
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to Home
      </Link>

      <section className={cx(authUi.shell, "!min-h-0 !h-full !py-2 sm:!py-4")} aria-labelledby="login-title">
        <div className="w-full max-w-[520px] overflow-hidden bg-transparent transform scale-[0.95] sm:scale-100 origin-center">

          <div className="flex min-w-0 flex-col justify-center px-4 py-2 sm:py-4">
            <div className="mb-4 border-b border-white/20 pb-4">
              <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
                <div className="flex min-w-[180px] items-center gap-2 drop-shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                    <LogoIcon style={{ width: 'auto' }} className="h-7" />
                  </div>
                  <div>
                    <h1 className="m-0 text-lg font-extrabold leading-none text-white drop-shadow">
                      {branding.systemName.trim().toLowerCase() === 'thesis track' ? (
                        <>
                          <span className="text-[#003A8F] drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]">Thesis</span>
                          <span className="text-[#F6BE00]">Track</span>
                        </>
                      ) : (
                        branding.systemName
                      )}
                    </h1>
                    <p className="mt-0.5 whitespace-nowrap text-[0.6rem] font-medium leading-3 text-slate-200 drop-shadow">
                      {branding.tagline}
                    </p>
                  </div>
                </div>

                <div className="hidden h-11 w-px bg-white/20 sm:block" aria-hidden="true" />

                <div className="flex items-center gap-2.5 drop-shadow-md">
                  {branding.assets.institutionLogo ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm">
                      <img
                        alt={`${branding.institutionName} logo`}
                        className="h-full w-full rounded-full object-contain"
                        src={branding.assets.institutionLogo}
                      />
                    </span>
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-sm backdrop-blur">
                      <i className="fas fa-building-columns text-sm" aria-hidden="true" />
                    </span>
                  )}
                  <div>
                    <strong className="block max-w-[240px] sm:max-w-[300px] text-balance text-xs font-extrabold leading-tight text-white drop-shadow">
                      {branding.institutionName}
                    </strong>
                    <span className="mt-0.5 block max-w-[240px] text-[0.62rem] font-medium leading-4 text-slate-200 drop-shadow">
                      {branding.institutionTagline}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex justify-center">
              <LoginForm variant="page" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
