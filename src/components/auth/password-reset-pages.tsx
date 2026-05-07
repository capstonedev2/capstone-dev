'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState
} from 'react';
import { useBranding } from '@/components/branding/branding-provider';
import { LogoIcon } from '@/components/branding/logo-icon';
import {
  authUi,
  cx,
  getInputClass,
  getMessageClass,
  getPasswordInputClass
} from './auth-ui';

type ResetApiResponse = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

type ResetShellProps = {
  titleId: string;
  icon: string;
  label: string;
  title: string;
  description: string;
  children: ReactNode;
};

type ForgotPasswordErrors = Partial<Record<'email', string>>;
type VerifyResetCodeErrors = Partial<Record<'email' | 'code', string>>;
type ResetPasswordErrors = Partial<Record<'password' | 'confirmPassword', string>>;

const RESET_EMAIL_STORAGE_KEY = 'thesistrackPasswordResetEmail';
const RESET_NOTICE_STORAGE_KEY = 'thesistrackPasswordResetNotice';
const PASSWORD_RESET_MESSAGE = 'If an account exists for this email, a reset code has been sent.';
const PASSWORD_RESET_SUCCESS_MESSAGE =
  'Password updated successfully. You can now sign in with your new password.';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function postResetRequest(url: string, payload: Record<string, unknown>): Promise<ResetApiResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const result = (await response.json()) as ResetApiResponse;

    if (!response.ok || !result.success) {
      return {
        success: false,
        message: result.message || 'Unable to complete the request. Please try again.',
        fieldErrors: result.fieldErrors
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : 'Unable to reach the server. Please try again.'
    };
  }
}

function getStoredResetEmail() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const storedEmail = window.sessionStorage.getItem(RESET_EMAIL_STORAGE_KEY);

    if (storedEmail) {
      return storedEmail;
    }

    const draft = JSON.parse(window.localStorage.getItem('capstoneStudentProfileDraft') || 'null');
    return typeof draft?.email === 'string' ? draft.email : '';
  } catch {
    return '';
  }
}

function storeResetEmail(email: string) {
  try {
    window.sessionStorage.setItem(RESET_EMAIL_STORAGE_KEY, email);
  } catch {
    // Ignore storage issues; the next page also lets the user re-enter the email.
  }
}

function PasswordResetShell({
  titleId,
  icon,
  label,
  title,
  description,
  children
}: ResetShellProps) {
  const { branding } = useBranding();
  const loginBackgroundStyle = branding.assets.loginBackground
    ? ({
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.54), rgba(0, 58, 143, 0.32)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      } satisfies CSSProperties)
    : undefined;

  return (
    <main className={authUi.page} style={loginBackgroundStyle}>
      <div className={authUi.pageWash} aria-hidden="true" />
      <div className={authUi.pagePattern} aria-hidden="true" />
      <div className={authUi.topStripe} aria-hidden="true" />

      <Link href="/login" className={authUi.backLink}>
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to Login
      </Link>

      <section className={authUi.shell} aria-labelledby={titleId}>
        <div className={authUi.authFrame}>
          <div className={authUi.formColumn}>
            <div
              className={authUi.mobileBrand}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <LogoIcon style={{ width: 'auto', marginBottom: '0.25rem' }} className="h-12 sm:h-[68px]" />
              <h1 className={authUi.brandTitle}>
                {branding.systemName.trim().toLowerCase() === 'thesis track' ? (
                  <>
                    Thesis<span className={authUi.brandAccent}>Track</span>
                  </>
                ) : (
                  branding.systemName
                )}
              </h1>
              <p className={authUi.brandSubtitle}>{branding.tagline}</p>
            </div>

            <div className={authUi.container}>
              <div className={authUi.card}>
                <div className={authUi.cardStripe} aria-hidden="true" />
                <div className={authUi.header}>
                  <span className={authUi.headerPill}>
                    <i className={icon} aria-hidden="true" />
                    {label}
                  </span>
                  <h2 className={authUi.headerTitle} id={titleId}>
                    {title}
                  </h2>
                  <p className={authUi.headerTextLeft}>{description}</p>
                </div>

                {children}

                <div className={authUi.footer}>
                  <p className={authUi.footerText}>
                    Remember your password?{' '}
                    <Link href="/login" className={authUi.bookLink}>
                      Back to Login
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordErrors>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(getStoredResetEmail());
    router.prefetch('/verify-reset-code');
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      setFieldErrors({
        email: 'Enter a valid email address.'
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const result = await postResetRequest('/api/auth/forgot-password', {
      email: normalizedEmail
    });

    setIsSubmitting(false);

    if (!result.success) {
      setFieldErrors((result.fieldErrors as ForgotPasswordErrors | undefined) || {});
      setError(result.message || 'Unable to send a reset code.');
      return;
    }

    storeResetEmail(normalizedEmail);

    try {
      window.sessionStorage.setItem(RESET_NOTICE_STORAGE_KEY, result.message || PASSWORD_RESET_MESSAGE);
    } catch {
      // The verification page can continue without this notice.
    }

    router.push('/verify-reset-code');
  };

  return (
    <PasswordResetShell
      titleId="forgot-password-title"
      icon="fas fa-envelope"
      label="Password Recovery"
      title="Forgot password"
      description="Enter your account email and we will send a 6-digit reset code."
    >
      <form className={authUi.form} aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
        <div className={authUi.formGroup}>
          <label className={authUi.label} htmlFor="resetEmail">
            Email Address
          </label>
          <input
            id="resetEmail"
            className={getInputClass(Boolean(fieldErrors.email))}
            type="email"
            placeholder="user@university.edu.ph"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
              setFieldErrors({});
            }}
            aria-describedby={fieldErrors.email ? 'forgot-password-email-error' : undefined}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.email ? (
            <span className={authUi.fieldError} id="forgot-password-email-error">
              {fieldErrors.email}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className={getMessageClass('error')} role="alert" aria-live="polite">
            {error}
          </div>
        ) : null}

        <button type="submit" className={authUi.submitButton} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className={authUi.spinner} aria-hidden="true" />
              Sending code...
            </>
          ) : (
            'Send reset code'
          )}
        </button>
      </form>
    </PasswordResetShell>
  );
}

export function VerifyResetCodePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<VerifyResetCodeErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(getStoredResetEmail());

    try {
      const notice = window.sessionStorage.getItem(RESET_NOTICE_STORAGE_KEY);

      if (notice) {
        setStatusMessage(notice);
        window.sessionStorage.removeItem(RESET_NOTICE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage issues.
    }

    router.prefetch('/reset-password');
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    const nextErrors: VerifyResetCodeErrors = {};

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      nextErrors.code = 'Enter the 6-digit reset code.';
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const result = await postResetRequest('/api/auth/verify-reset-code', {
      email: normalizedEmail,
      code: normalizedCode
    });

    setIsSubmitting(false);

    if (!result.success) {
      setFieldErrors((result.fieldErrors as VerifyResetCodeErrors | undefined) || {});
      setError(result.message || 'Unable to verify the reset code.');
      return;
    }

    storeResetEmail(normalizedEmail);
    router.push('/reset-password');
  };

  return (
    <PasswordResetShell
      titleId="verify-reset-code-title"
      icon="fas fa-key"
      label="Verification"
      title="Verify reset code"
      description="Enter the code sent to your email before it expires."
    >
      <form className={authUi.form} aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
        <div className={authUi.formGroup}>
          <label className={authUi.label} htmlFor="verifyEmail">
            Email Address
          </label>
          <input
            id="verifyEmail"
            className={getInputClass(Boolean(fieldErrors.email))}
            type="email"
            placeholder="user@university.edu.ph"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
              setStatusMessage('');
              setFieldErrors((current) => ({ ...current, email: undefined }));
            }}
            aria-describedby={fieldErrors.email ? 'verify-email-error' : undefined}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.email ? (
            <span className={authUi.fieldError} id="verify-email-error">
              {fieldErrors.email}
            </span>
          ) : null}
        </div>

        <div className={authUi.formGroup}>
          <label className={authUi.label} htmlFor="resetCode">
            Reset Code
          </label>
          <input
            id="resetCode"
            className={getInputClass(Boolean(fieldErrors.code))}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
              setError('');
              setStatusMessage('');
              setFieldErrors((current) => ({ ...current, code: undefined }));
            }}
            aria-describedby={fieldErrors.code ? 'verify-code-error' : undefined}
            aria-invalid={fieldErrors.code ? 'true' : 'false'}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.code ? (
            <span className={authUi.fieldError} id="verify-code-error">
              {fieldErrors.code}
            </span>
          ) : null}
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

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button type="submit" className={authUi.submitButton} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className={authUi.spinner} aria-hidden="true" />
                Verifying...
              </>
            ) : (
              'Verify code'
            )}
          </button>
          <Link
            href="/forgot-password"
            className={cx(authUi.secondaryButton, 'h-10 rounded-xl sm:h-12 sm:rounded-2xl')}
          >
            Send new code
          </Link>
        </div>
      </form>
    </PasswordResetShell>
  );
}

export function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    router.prefetch('/login');
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const nextErrors: ResetPasswordErrors = {};

    if (!password) {
      nextErrors.password = 'Please enter a new password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const result = await postResetRequest('/api/auth/reset-password', {
      password,
      confirmPassword
    });

    setIsSubmitting(false);

    if (!result.success) {
      setFieldErrors((result.fieldErrors as ResetPasswordErrors | undefined) || {});
      setError(result.message || 'Unable to reset your password.');
      return;
    }

    try {
      window.sessionStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
      window.sessionStorage.setItem(RESET_NOTICE_STORAGE_KEY, PASSWORD_RESET_SUCCESS_MESSAGE);
    } catch {
      // Ignore storage issues.
    }

    router.push('/login?reset=success');
  };

  return (
    <PasswordResetShell
      titleId="reset-password-title"
      icon="fas fa-lock"
      label="New Password"
      title="Reset password"
      description="Choose a new password for your ThesisTrack account."
    >
      <form className={authUi.form} aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
        <div className={authUi.formGroup}>
          <label className={authUi.label} htmlFor="newPassword">
            New Password
          </label>
          <div className={authUi.passwordField}>
            <input
              id="newPassword"
              className={getPasswordInputClass(Boolean(fieldErrors.password))}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter a new password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              aria-describedby={fieldErrors.password ? 'reset-password-error' : 'reset-password-help'}
              aria-invalid={fieldErrors.password ? 'true' : 'false'}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              className={authUi.passwordToggle}
              onClick={() => setShowPassword((current) => !current)}
              aria-controls="newPassword"
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isSubmitting}
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
            </button>
          </div>
          {fieldErrors.password ? (
            <span className={authUi.fieldError} id="reset-password-error">
              {fieldErrors.password}
            </span>
          ) : (
            <span className={authUi.helperText} id="reset-password-help">
              Use at least 8 characters.
            </span>
          )}
        </div>

        <div className={authUi.formGroup}>
          <label className={authUi.label} htmlFor="confirmNewPassword">
            Confirm Password
          </label>
          <div className={authUi.passwordField}>
            <input
              id="confirmNewPassword"
              className={getPasswordInputClass(Boolean(fieldErrors.confirmPassword))}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError('');
                setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
              }}
              aria-describedby={
                fieldErrors.confirmPassword ? 'reset-confirm-password-error' : undefined
              }
              aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              className={authUi.passwordToggle}
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-controls="confirmNewPassword"
              aria-pressed={showConfirmPassword}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              disabled={isSubmitting}
            >
              <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
            </button>
          </div>
          {fieldErrors.confirmPassword ? (
            <span className={authUi.fieldError} id="reset-confirm-password-error">
              {fieldErrors.confirmPassword}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className={getMessageClass('error')} role="alert" aria-live="polite">
            {error}
          </div>
        ) : null}

        <button type="submit" className={authUi.submitButton} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className={authUi.spinner} aria-hidden="true" />
              Updating password...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>
    </PasswordResetShell>
  );
}
