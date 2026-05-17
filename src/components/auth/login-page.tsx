'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';
import { useBranding } from '@/components/branding/branding-provider';
import { LogoIcon } from '@/components/branding/logo-icon';
import {
  getRoleRedirectPath,
  loginWithApi,
  persistAuthenticatedUser
} from '@/lib/client-auth';
import { resetPassword } from '@/lib/mock/auth';
import {
  authUi,
  cx,
  getInputClass,
  getMessageClass,
  getPasswordInputClass
} from './auth-ui';

type LoginFieldErrors = Partial<Record<'identifier' | 'password', string>>;
type ResetFieldErrors = Partial<Record<'email' | 'password' | 'confirmPassword', string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

export function LoginPage() {
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
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetFieldErrors, setResetFieldErrors] = useState<ResetFieldErrors>({});
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const isSubmitting = activeAction !== null;
  const loginBranding = branding.auth.login;
  const institutionInitials = branding.institutionName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const isVideoBackground = branding.assets.loginBackground?.match(/\.(mp4|webm)$/i) || branding.assets.loginBackground?.includes('/video/upload/');

  const loginBackgroundStyle = branding.assets.loginBackground && !isVideoBackground ? {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.34), rgba(0, 58, 143, 0.18)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
  } satisfies CSSProperties : (isVideoBackground ? { backgroundColor: 'transparent' } : undefined);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem('capstoneStudentProfileDraft') || 'null');

      if (draft?.studentId) {
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

  const clearResetFieldError = (field: keyof ResetFieldErrors) => {
    setResetFieldErrors((current) => {
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

  const validateResetFields = (): ResetFieldErrors => {
    const nextErrors: ResetFieldErrors = {};
    const normalizedEmail = resetEmail.trim();
    const normalizedPassword = resetPasswordValue.trim();
    const normalizedConfirmPassword = resetConfirmPassword.trim();

    if (!normalizedEmail) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!emailPattern.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!normalizedPassword) {
      nextErrors.password = 'Please enter a new password.';
    } else if (normalizedPassword.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!normalizedConfirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (normalizedPassword !== normalizedConfirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  };

  const openForgotPasswordModal = () => {
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

  const closeForgotPasswordModal = (force = false) => {
    if (resetSubmitting && !force) {
      return;
    }

    setForgotPasswordOpen(false);
    setResetPasswordValue('');
    setResetConfirmPassword('');
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setResetError('');
    setResetFieldErrors({});
    setResetStep(1);
    setResetCode('');
    setResetCodeSent(false);
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
    } catch {
      // Ignore storage issues.
    }

    window.location.href = getRoleRedirectPath(result.user.role);
  };

  const handleSendCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError('');

    const normalizedEmail = resetEmail.trim();
    if (!normalizedEmail) {
      setResetFieldErrors({ email: 'Please enter your email address.' });
      return;
    } else if (!emailPattern.test(normalizedEmail)) {
      setResetFieldErrors({ email: 'Enter a valid email address.' });
      return;
    }

    setResetFieldErrors({});
    setResetSubmitting(true);

    // Mock API call to send code
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setResetSubmitting(false);
    setResetCodeSent(true);
    setResetStep(2);
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError('');

    const validationErrors = validateResetFields();
    
    if (!resetCode.trim()) {
      validationErrors.email = validationErrors.email || 'Please enter the verification code.';
      // We overload email error to show below the code input for now, or we can just set global error
      if (!validationErrors.email) {
        setResetError('Please enter the verification code.');
        return;
      }
    }

    if (Object.keys(validationErrors).length) {
      setResetFieldErrors(validationErrors);
      return;
    }

    setResetFieldErrors({});
    setResetSubmitting(true);

    const result = await resetPassword({
      email: resetEmail,
      password: resetPasswordValue,
      confirm_password: resetConfirmPassword
    });

    if (!result.success) {
      setResetFieldErrors((result.fieldErrors as ResetFieldErrors | undefined) || {});
      setResetError(result.message || 'Unable to reset your password.');
      setResetSubmitting(false);
      return;
    }

    // Keep studentId unchanged after password reset.
    setPassword('');
    setShowPassword(false);
    setStatusMessage(
      result.message || 'Password updated successfully. You can now sign in with your new password.'
    );
    setResetSubmitting(false);
    closeForgotPasswordModal(true);
  };

  return (
    <main className={authUi.page} style={loginBackgroundStyle}>
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
      <div className={authUi.topStripe} aria-hidden="true" />

      {/* Floating 3D Depth Elements Removed */}

      <Link href="/" className={authUi.backLink}>
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to Home
      </Link>

      <section className={authUi.shell} aria-labelledby="login-title">
        <div className="w-full max-w-[520px] overflow-hidden bg-transparent">

          <div className="flex min-w-0 flex-col justify-center px-4 py-5 sm:py-7">
            <div className="mb-6 border-b border-white/20 pb-6">
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
                    <strong className="block whitespace-nowrap text-xs font-extrabold leading-tight text-white drop-shadow">
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
              <div className="w-full max-w-[500px] rounded-[24px] border border-white/50 bg-white/[0.30] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_24px_48px_-12px_rgba(0,0,0,0.22)] backdrop-blur-[18px] sm:p-8">
                <div className="mb-8 flex flex-col items-center text-center">
                  <span className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[#003A8F]/10 bg-white px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[#003A8F] shadow-sm">
                    <i className="fas fa-right-to-bracket" aria-hidden="true" />
                    {loginBranding.pill}
                  </span>
                  <h2 className="m-0 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-slate-800" id="login-title">
                    {loginBranding.title}
                  </h2>
                </div>

                <form className="space-y-4" aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
              <div className={authUi.formGroup}>
                <label className={authUi.label} htmlFor="identifier">
                  {loginBranding.identifierLabel}
                </label>
                <div className="relative">
                  <i className="fas fa-user pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm text-[#003A8F]" aria-hidden="true" />
                  <input
                    id="identifier"
                    className={cx(getInputClass(Boolean(fieldErrors.identifier)), '!pl-11 text-sm')}
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
                    aria-describedby={fieldErrors.identifier ? 'login-identifier-error' : undefined}
                    aria-invalid={fieldErrors.identifier ? 'true' : 'false'}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {fieldErrors.identifier ? (
                  <span className={authUi.fieldError} id="login-identifier-error">
                    {fieldErrors.identifier}
                  </span>
                ) : null}
              </div>

              <div className={authUi.formGroup}>
                <label className={authUi.label} htmlFor="password">
                  {loginBranding.passwordLabel}
                </label>
                <div className={authUi.passwordField}>
                  <i className="fas fa-lock pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm text-[#003A8F]" aria-hidden="true" />
                  <input
                    id="password"
                    className={cx(getPasswordInputClass(Boolean(fieldErrors.password)), '!pl-11 text-sm')}
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
                    aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                    aria-invalid={fieldErrors.password ? 'true' : 'false'}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className={cx(authUi.passwordToggle, 'right-2')}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-controls="password"
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
                  <span className={authUi.fieldError} id="login-password-error">
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
                  onClick={openForgotPasswordModal}
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
                <div className="grow border-t border-white/70"></div>
                <span className="mx-4 shrink-0 text-xs font-extrabold uppercase tracking-wider text-slate-700">Or continue with</span>
                <div className="grow border-t border-white/70"></div>
              </div>

              <button
                type="button"
                className="group relative inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/70 bg-white/80 px-5 text-sm font-bold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-[14px] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-slate-200 disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0 sm:h-12"
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
                </form>

                <div className="mt-3 text-center">
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {loginBranding.alternatePrompt}{' '}
                    <Link
                      href="/register"
                      className={authUi.bookLink}
                    >
                      {loginBranding.alternateLinkLabel}
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </p>
                </div>
                <div className="mt-4 border-t border-white/70 pt-4 text-center text-xs font-bold text-slate-700">
                  <i className="fas fa-shield-halved mr-2 text-slate-700" aria-hidden="true" />
                  Secure access for ThesisTrack users only.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {forgotPasswordOpen ? (
        <div
          className={authUi.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeForgotPasswordModal();
            }
          }}
        >
          <div
            className={authUi.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <div className={authUi.modalHeader}>
              <div className={authUi.modalTitleRow}>
                <span className={authUi.modalIcon} aria-hidden="true">
                  <i className={resetStep === 1 ? "fas fa-envelope" : "fas fa-key"} />
                </span>
                <div>
                  <h3 className={authUi.modalTitle} id="forgot-password-title">
                    {resetStep === 1 ? 'Find Your Account' : 'Reset Password'}
                  </h3>
                  <p className={authUi.modalText}>
                    {resetStep === 1 
                      ? 'Enter your email address and we will send you a verification code.' 
                      : 'Enter the code sent to your email and choose a new password.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={authUi.modalClose}
                onClick={() => closeForgotPasswordModal()}
                disabled={resetSubmitting}
                aria-label="Close reset password dialog"
              >
                &times;
              </button>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleSendCodeSubmit} noValidate>
                <div className={authUi.modalBody}>
                  <div className={authUi.formGroup}>
                    <label className={authUi.label} htmlFor="resetEmail">
                      Email Address
                    </label>
                    <input
                      id="resetEmail"
                      className={getInputClass(Boolean(resetFieldErrors.email))}
                      type="email"
                      placeholder="user@university.edu.ph"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(event) => {
                        setResetEmail(event.target.value);
                        setResetError('');
                        clearResetFieldError('email');
                      }}
                      aria-describedby={resetFieldErrors.email ? 'reset-email-error' : undefined}
                      aria-invalid={resetFieldErrors.email ? 'true' : 'false'}
                      disabled={resetSubmitting}
                      required
                    />
                    {resetFieldErrors.email ? (
                      <span className={authUi.fieldError} id="reset-email-error">
                        {resetFieldErrors.email}
                      </span>
                    ) : null}
                  </div>
                  {resetError ? (
                    <div className={getMessageClass('error')} role="alert" aria-live="polite">
                      {resetError}
                    </div>
                  ) : null}
                </div>
                <div className={authUi.modalActions}>
                  <button
                    type="button"
                    className={cx(authUi.secondaryButton, authUi.modalActionButton)}
                    onClick={() => closeForgotPasswordModal()}
                    disabled={resetSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={cx(authUi.submitButton, authUi.modalActionButton)}
                    disabled={resetSubmitting}
                  >
                    {resetSubmitting ? (
                      <>
                        <span className={authUi.spinner} aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      'Send Code'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} noValidate>
                <div className={authUi.modalBody}>
                  <div className={authUi.formGroup}>
                    <label className={authUi.label} htmlFor="resetCode">
                      Verification Code
                    </label>
                    <input
                      id="resetCode"
                      className={getInputClass(false)}
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={resetCode}
                      onChange={(event) => {
                        setResetCode(event.target.value);
                        setResetError('');
                      }}
                      disabled={resetSubmitting}
                      required
                    />
                  </div>

                  <div className={authUi.formGroup}>
                    <label className={authUi.label} htmlFor="resetPassword">
                      New Password
                    </label>
                    <div className={authUi.passwordField}>
                      <input
                        id="resetPassword"
                        className={getPasswordInputClass(Boolean(resetFieldErrors.password))}
                        type={showResetPassword ? 'text' : 'password'}
                        placeholder="Enter a new password"
                        autoComplete="new-password"
                        value={resetPasswordValue}
                        onChange={(event) => {
                          setResetPasswordValue(event.target.value);
                          setResetError('');
                          clearResetFieldError('password');
                        }}
                        aria-describedby={resetFieldErrors.password ? 'reset-password-error' : 'reset-password-help'}
                        aria-invalid={resetFieldErrors.password ? 'true' : 'false'}
                        disabled={resetSubmitting}
                        required
                      />
                      <button
                        type="button"
                        className={authUi.passwordToggle}
                        onClick={() => setShowResetPassword((current) => !current)}
                        aria-controls="resetPassword"
                        aria-pressed={showResetPassword}
                        aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                        disabled={resetSubmitting}
                      >
                        <i
                          className={`fa-solid ${showResetPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    {resetFieldErrors.password ? (
                      <span className={authUi.fieldError} id="reset-password-error">
                        {resetFieldErrors.password}
                      </span>
                    ) : (
                      <span className={authUi.helperText} id="reset-password-help">
                        Use at least 6 characters.
                      </span>
                    )}
                  </div>

                  <div className={authUi.formGroup}>
                    <label className={authUi.label} htmlFor="resetConfirmPassword">
                      Confirm New Password
                    </label>
                    <div className={authUi.passwordField}>
                      <input
                        id="resetConfirmPassword"
                        className={getPasswordInputClass(Boolean(resetFieldErrors.confirmPassword))}
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        value={resetConfirmPassword}
                        onChange={(event) => {
                          setResetConfirmPassword(event.target.value);
                          setResetError('');
                          clearResetFieldError('confirmPassword');
                        }}
                        aria-describedby={
                          resetFieldErrors.confirmPassword ? 'reset-confirm-password-error' : undefined
                        }
                        aria-invalid={resetFieldErrors.confirmPassword ? 'true' : 'false'}
                        disabled={resetSubmitting}
                        required
                      />
                      <button
                        type="button"
                        className={authUi.passwordToggle}
                        onClick={() => setShowResetConfirmPassword((current) => !current)}
                        aria-controls="resetConfirmPassword"
                        aria-pressed={showResetConfirmPassword}
                        aria-label={showResetConfirmPassword ? 'Hide password' : 'Show password'}
                        disabled={resetSubmitting}
                      >
                        <i
                          className={`fa-solid ${showResetConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    {resetFieldErrors.confirmPassword ? (
                      <span className={authUi.fieldError} id="reset-confirm-password-error">
                        {resetFieldErrors.confirmPassword}
                      </span>
                    ) : null}
                  </div>

                  {resetError ? (
                    <div className={getMessageClass('error')} role="alert" aria-live="polite">
                      {resetError}
                    </div>
                  ) : null}
                </div>

                <div className={authUi.modalActions}>
                  <button
                    type="button"
                    className={cx(authUi.secondaryButton, authUi.modalActionButton)}
                    onClick={() => setResetStep(1)}
                    disabled={resetSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className={cx(authUi.submitButton, authUi.modalActionButton)}
                    disabled={resetSubmitting}
                  >
                    {resetSubmitting ? (
                      <>
                        <span className={authUi.spinner} aria-hidden="true" />
                        Updating password...
                      </>
                    ) : (
                      'Reset password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
