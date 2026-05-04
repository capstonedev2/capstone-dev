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
  const isSubmitting = activeAction !== null;
  const loginBackgroundStyle = branding.assets.loginBackground ? {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.54), rgba(0, 58, 143, 0.32)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
  } satisfies CSSProperties : undefined;

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
    router.prefetch('/register');
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
    setResetEmail((current) => current || (identifier.includes('@') ? identifier.trim() : ''));
    setResetPasswordValue('');
    setResetConfirmPassword('');
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setResetError('');
    setResetFieldErrors({});
    setForgotPasswordOpen(true);
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

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError('');

    const validationErrors = validateResetFields();

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
      <div className={authUi.pageWash} aria-hidden="true" />
      <div className={authUi.pagePattern} aria-hidden="true" />
      <div className={authUi.topStripe} aria-hidden="true" />

      {/* Floating 3D Depth Elements Removed */}

      <Link href="/" className={authUi.backLink}>
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to Home
      </Link>

      <section className={authUi.shell} aria-labelledby="login-title">
        <div className={authUi.authFrame}>


          <div className={authUi.formColumn}>
            <div className={authUi.mobileBrand} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LogoIcon style={{ height: '84px', width: 'auto', marginBottom: '0.85rem' }} />
              <h1 className={authUi.brandTitle}>
                {branding.systemName.trim().toLowerCase() === 'thesis track' ? (
                  <>
                    Thesis<span className={authUi.brandAccent}>Track</span>
                  </>
                ) : (
                  branding.systemName
                )}
              </h1>
              <p className={authUi.brandSubtitle}>
                {branding.tagline}
              </p>
            </div>

            <div className={authUi.container}>
              <div className={authUi.card}>
                <div className={authUi.cardStripe} aria-hidden="true" />
                <div className={authUi.header}>
                  <span className={authUi.headerPill}>
                    <i className="fas fa-right-to-bracket" aria-hidden="true" />
                    Account Access
                  </span>
                  <h2 className={authUi.headerTitle} id="login-title">
                    Welcome back
                  </h2>

                </div>

                <form className={authUi.form} aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
              <div className={authUi.formGroup}>
                <label className={authUi.label} htmlFor="identifier">
                  Student ID / Email
                </label>
                <input
                  id="identifier"
                  className={getInputClass(Boolean(fieldErrors.identifier))}
                  type="text"
                  placeholder="e.g. 2021-00123 or user@university.edu.ph"
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
                {fieldErrors.identifier ? (
                  <span className={authUi.fieldError} id="login-identifier-error">
                    {fieldErrors.identifier}
                  </span>
                ) : null}
              </div>

              <div className={authUi.formGroup}>
                <label className={authUi.label} htmlFor="password">
                  Password
                </label>
                <div className={authUi.passwordField}>
                  <input
                    id="password"
                    className={getPasswordInputClass(Boolean(fieldErrors.password))}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
                    className={authUi.passwordToggle}
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

              <div className={authUi.formOptions}>
                <label className={authUi.checkbox}>
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
                  'Sign in'
                )}
              </button>
                </form>

                <div className={authUi.footer}>
                  <p className={authUi.footerText}>
                    New student account?{' '}
                    <Link
                      href="/register"
                      className={authUi.bookLink}
                    >
                      Register here
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </p>
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
                  <i className="fas fa-key" />
                </span>
                <div>
                  <h3 className={authUi.modalTitle} id="forgot-password-title">
                    Reset Password
                  </h3>
                  <p className={authUi.modalText}>
                    Confirm your account email and choose a new password for your ThesisTrack account.
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

            <form onSubmit={handleResetSubmit} noValidate>
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
                      Updating password...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
