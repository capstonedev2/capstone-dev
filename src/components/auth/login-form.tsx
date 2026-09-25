'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { useBranding } from '@/components/branding/branding-provider';
import { LogoIcon } from '@/components/branding/logo-icon';
import {
  getRoleRedirectPath,
  loginWithApi,
  persistAuthenticatedUser
} from '@/lib/client-auth';
import {
  authUi,
  cx,
  getInputClass,
  getMessageClass,
  getPasswordInputClass,
  shouldOpenAuthModal
} from './auth-ui';

type LoginFieldErrors = Partial<Record<'identifier' | 'password', string>>;

const resetEmailStorageKey = 'thesistrackPasswordResetEmail';
const resetNoticeStorageKey = 'thesistrackPasswordResetNotice';
const resetSuccessMessage = 'Password updated successfully. You can now sign in with your new password.';
const googleLoginMessages: Record<string, string> = {
  cancelled: 'Google sign in was cancelled.',
  invalid_request: 'Google sign in could not be verified. Please try again.',
  account_mismatch: 'This Google account is linked to a different ThesisTrack account.',
  suspended: 'This account has been suspended. Contact your administrator for assistance.',
  error: 'Unable to complete Google sign in. Please try again.'
};

// The page variant sits on the glass card over the campus photo; the modal variant sits on
// plain white, where the glass input/button styles would be nearly invisible.
const pageAltButtonClass =
  'group relative inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/70 bg-white/80 px-5 text-sm font-bold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-[14px] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-slate-200 disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0 sm:h-12';
const modalAltButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-slate-200 disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0';

type LoginFormProps = {
  variant: 'page' | 'modal';
  /** Reports sign-in progress so the modal can refuse to close mid-request. */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  /** Modal only: "Register here" switches the modal to its register view instead of navigating. */
  onSwitchToRegister?: () => void;
};

export function LoginForm({ variant, onSubmittingChange, onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const { branding } = useBranding();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeAction, setActiveAction] = useState<'login' | null>(null);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [resetEmail, setResetEmail] = useState('');
  const isSubmitting = activeAction !== null;
  const isModal = variant === 'modal';
  const loginBranding = branding.auth.login;
  // Keep the page's original ids; prefix the modal's so labels never collide with another form.
  const identifierId = isModal ? 'login-modal-identifier' : 'identifier';
  const passwordId = isModal ? 'login-modal-password' : 'password';
  const titleId = isModal ? 'login-modal-title' : 'login-title';
  const identifierErrorId = isModal ? 'login-modal-identifier-error' : 'login-identifier-error';
  const passwordErrorId = isModal ? 'login-modal-password-error' : 'login-password-error';

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  useEffect(() => {
    try {
      const remembered = localStorage.getItem('capstoneRememberedIdentifier');
      const draft = JSON.parse(localStorage.getItem('capstoneStudentProfileDraft') || 'null');

      if (remembered) {
        setIdentifier(remembered);
        setRememberMe(true);
      } else if (draft?.studentId) {
        setIdentifier(String(draft.studentId));
      }

      if (draft?.email) {
        setResetEmail(String(draft.email));
      }
    } catch {
      // Ignore storage parsing issues.
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const resetNotice = sessionStorage.getItem(resetNoticeStorageKey);

      if (params.get('reset') === 'success') {
        setStatusMessage(resetNotice || resetSuccessMessage);
      }

      const googleStatus = params.get('google');

      if (googleStatus && googleLoginMessages[googleStatus]) {
        setError(googleLoginMessages[googleStatus]);
      }

      if (resetNotice) {
        sessionStorage.removeItem(resetNoticeStorageKey);
      }
    } catch {
      // Ignore URL or storage parsing issues.
    }
  }, []);

  useEffect(() => {
    router.prefetch('/register');
    router.prefetch('/forgot-password');
  }, [router]);

  const clearLoginFieldError = (field: keyof LoginFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateLoginFields = (): LoginFieldErrors => {
    const nextErrors: LoginFieldErrors = {};
    const normalizedIdentifier = identifier.trim();
    const normalizedPassword = password.trim();

    if (!normalizedIdentifier) {
      nextErrors.identifier = 'Please enter your Student ID or email address.';
    }

    if (!normalizedPassword) {
      nextErrors.password = 'Please enter your password.';
    }

    return nextErrors;
  };

  const openForgotPassword = () => {
    const emailCandidate = identifier.includes('@') ? identifier.trim().toLowerCase() : resetEmail.trim().toLowerCase();

    if (emailCandidate) {
      try {
        sessionStorage.setItem(resetEmailStorageKey, emailCandidate);
      } catch {
        // The forgot-password page can continue without a prefilled email.
      }
    }

    router.push('/forgot-password');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    const validationErrors = validateLoginFields();

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setActiveAction('login');

    const result = await loginWithApi({
      identifier: identifier.trim(),
      password
    });

    if (!result.success) {
      setFieldErrors((result.fieldErrors as LoginFieldErrors | undefined) || {});
      setError(result.message || 'Unable to sign in.');
      setActiveAction(null);
      return;
    }

    persistAuthenticatedUser(result.user);

    try {
      sessionStorage.setItem('capstoneAuthRememberMe', rememberMe ? 'true' : 'false');

      if (rememberMe) {
        localStorage.setItem('capstoneRememberedIdentifier', identifier.trim());
      } else {
        localStorage.removeItem('capstoneRememberedIdentifier');
      }
    } catch {
      // Ignore storage issues.
    }

    // Full reload on purpose: activeAction stays 'login', so the modal stays locked open until the page changes.
    window.location.href = getRoleRedirectPath(result.user.role);
  };

  const form = (
                <form className="space-y-3.5" aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
              <div className={authUi.formGroup}>
                <label className={authUi.label} htmlFor={identifierId}>
                  {loginBranding.identifierLabel}
                </label>
                <div className="relative">
                  <i className="fas fa-user pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm text-[#003A8F]" aria-hidden="true" />
                  <input
                    id={identifierId}
                    className={cx(getInputClass(Boolean(fieldErrors.identifier)), '!pl-11 text-sm', isModal && !fieldErrors.identifier && authUi.modalField)}
                    type="text"
                    placeholder={loginBranding.identifierPlaceholder}
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => {
                      setIdentifier(event.target.value);
                      setError('');
                      setStatusMessage('');
                      clearLoginFieldError('identifier');
                    }}
                    aria-describedby={fieldErrors.identifier ? identifierErrorId : undefined}
                    aria-invalid={fieldErrors.identifier ? 'true' : 'false'}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {fieldErrors.identifier ? (
                  <span className={authUi.fieldError} id={identifierErrorId}>
                    {fieldErrors.identifier}
                  </span>
                ) : null}
              </div>

              <div className={authUi.formGroup}>
                <label className={authUi.label} htmlFor={passwordId}>
                  {loginBranding.passwordLabel}
                </label>
                <div className={authUi.passwordField}>
                  <i className="fas fa-lock pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm text-[#003A8F]" aria-hidden="true" />
                  <input
                    id={passwordId}
                    className={cx(getPasswordInputClass(Boolean(fieldErrors.password)), '!pl-11 text-sm', isModal && !fieldErrors.password && authUi.modalField)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={loginBranding.passwordPlaceholder}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                      setStatusMessage('');
                      clearLoginFieldError('password');
                    }}
                    aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                    aria-invalid={fieldErrors.password ? 'true' : 'false'}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className={cx(authUi.passwordToggle, 'right-2', isModal && authUi.modalToggle)}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-controls={passwordId}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i
                      className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {fieldErrors.password ? (
                  <span className={authUi.fieldError} id={passwordErrorId}>
                    {fieldErrors.password}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-nowrap items-center justify-between gap-2 text-xs">
                <label className="inline-flex items-center gap-2 font-bold text-slate-800">
                  <input
                    className={authUi.checkboxInput}
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className={authUi.forgotLink}
                  onClick={openForgotPassword}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>

              {statusMessage ? (
                <div className={getMessageClass('success')} role="status" aria-live="polite">
                  {statusMessage}
                </div>
              ) : null}

              {error ? (
                <div className={getMessageClass('error')} role="alert" aria-live="polite">
                  {error}
                </div>
              ) : null}

              <button type="submit" className={authUi.submitButton} disabled={isSubmitting}>
                {activeAction === 'login' ? (
                  <>
                    <span className={authUi.spinner} aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  loginBranding.submitLabel
                )}
              </button>

              <div className="relative flex items-center py-1.5">
                <div className={cx('grow border-t', isModal ? 'border-slate-200' : 'border-white/70')}></div>
                <span className={cx('mx-4 shrink-0 text-xs font-extrabold uppercase tracking-wider', isModal ? 'text-slate-500' : 'text-slate-700')}>Or continue with</span>
                <div className={cx('grow border-t', isModal ? 'border-slate-200' : 'border-white/70')}></div>
              </div>

              <button
                type="button"
                className={isModal ? modalAltButtonClass : pageAltButtonClass}
                disabled={isSubmitting}
                onClick={() => {
                  window.location.href = '/api/auth/google';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loginBranding.googleLabel}
              </button>

              {isModal ? null : (
              <button
                type="button"
                className={pageAltButtonClass}
                disabled={isSubmitting}
                onClick={() => router.push('/repository')}
              >
                <i className="fas fa-user-group text-slate-500" aria-hidden="true" />
                Continue as Guest
              </button>
              )}
                </form>
  );

  const registerPrompt = (
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {loginBranding.alternatePrompt}{' '}
                    <Link
                      href="/register"
                      className={authUi.bookLink}
                      onClick={(event) => {
                        // Inside the modal, switch views instead of navigating; new-tab clicks still reach /register.
                        if (onSwitchToRegister && shouldOpenAuthModal(event)) {
                          event.preventDefault();
                          onSwitchToRegister();
                        }
                      }}
                    >
                      {loginBranding.alternateLinkLabel}
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </p>
  );

  if (isModal) {
    return (
      <div className="px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_6px_16px_rgba(15,43,89,0.1)] ring-1 ring-slate-100">
            <LogoIcon style={{ width: 'auto' }} className="h-8" />
          </div>
          <h2 className="m-0 font-serif text-[1.75rem] font-bold leading-tight text-[#102033]" id={titleId}>
            {loginBranding.title}
          </h2>
        </div>

        {form}

        <div className="mt-4 text-center">
          {registerPrompt}
          <button
            type="button"
            className="mt-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-slate-500 underline-offset-2 transition hover:text-[#003A8F] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => router.push('/repository')}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  return (
              <div className="w-full max-w-[500px] rounded-[24px] border border-white/50 bg-white/[0.30] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_24px_48px_-12px_rgba(0,0,0,0.22)] backdrop-blur-[18px] sm:p-7">
                <div className="mb-5 flex flex-col items-center text-center">
                  <span className="mb-2 inline-flex items-center gap-2 rounded-xl border border-[#003A8F]/10 bg-white px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[#003A8F] shadow-sm">
                    <i className="fas fa-right-to-bracket" aria-hidden="true" />
                    {loginBranding.pill}
                  </span>
                  <h2 className="m-0 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-slate-800" id={titleId}>
                    {loginBranding.title}
                  </h2>
                </div>

                {form}

                <div className="mt-2 text-center">
                  {registerPrompt}
                </div>

                <div className="mt-3 border-t border-white/70 pt-3 text-center text-xs font-bold text-slate-700">
                  <i className="fas fa-shield-halved mr-2 text-slate-700" aria-hidden="true" />
                  Secure access for ThesisTrack users only.
                </div>
              </div>
  );
}
