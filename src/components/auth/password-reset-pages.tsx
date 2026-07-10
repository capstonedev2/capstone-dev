'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from 'react';
import { useBranding } from '@/components/branding/branding-provider';
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
  description: ReactNode;
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
  const isVideoBackground = branding.assets.loginBackground?.match(/\.(mp4|webm)$/i) || branding.assets.loginBackground?.includes('/video/upload/');

  const loginBackgroundStyle = branding.assets.loginBackground && !isVideoBackground
    ? ({
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.34), rgba(0, 58, 143, 0.18)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      } satisfies CSSProperties)
    : undefined;

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

      <Link href="/login" className={authUi.backLink}>
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to Login
      </Link>

      <section className={authUi.shell} aria-labelledby={titleId}>
        <div className="w-full max-w-[560px] overflow-hidden bg-transparent">
          <div className="flex min-w-0 flex-col justify-center px-4 py-5 sm:py-7">
            <div className="w-full flex justify-center relative">
              {/* Decorative background glow behind the modal */}
              <div className="absolute top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#003A8F]/20 to-[#f6be00]/10 blur-[80px] pointer-events-none" />
              
              <div className="relative w-full max-w-[500px] rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-[0_30px_60px_-15px_rgba(0,10,40,0.3)] sm:p-12">
                <div className="mb-10 flex flex-col items-center text-center">
                  <div className="mb-6 relative group inline-flex items-center justify-center h-16 w-16 rounded-[1.25rem] border border-slate-100 bg-slate-50 shadow-[0_8px_20px_rgba(0,58,143,0.08)] ring-4 ring-slate-50/50">
                    <div className="absolute inset-0 rounded-[1.25rem] bg-[#003A8F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <i className={cx(icon, "text-2xl text-[#003A8F] drop-shadow-sm transition-transform duration-500 group-hover:scale-110")} aria-hidden="true" />
                  </div>
                  <span className="mb-3 inline-flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.15em] text-[#003A8F]">
                    {label}
                  </span>
                  <h2 className="m-0 text-3xl font-extrabold leading-tight tracking-tight text-slate-800" id={titleId}>
                    {title}
                  </h2>
                  <p className="mt-3 max-w-sm text-[0.95rem] font-semibold leading-relaxed text-slate-800 drop-shadow-sm">{description}</p>
                </div>

                {children}

                <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                  <p className="text-sm font-semibold leading-6 text-slate-700">
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
  const [codeDigits, setCodeDigits] = useState<string[]>(() => Array(6).fill(''));
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<VerifyResetCodeErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const maskEmail = (emailStr: string) => {
    if (!emailStr || !emailStr.includes('@')) return emailStr;
    const [local, domain] = emailStr.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    // Show first 2 characters, then asterisks for the rest of the local part
    return `${local.slice(0, 2)}••••••@${domain}`;
  };

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

  const updateCodeDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);

    setCodeDigits((current) => {
      const nextDigits = [...current];
      nextDigits[index] = digit;
      setCode(nextDigits.join(''));
      return nextDigits;
    });
    setError('');
    setStatusMessage('');
    setFieldErrors((current) => ({ ...current, code: undefined }));

    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <PasswordResetShell
      titleId="verify-reset-code-title"
      icon="fas fa-key"
      label="Verification"
      title="Verify reset code"
      description={
        <>
          We sent a secure code to <strong className="text-[#003A8F] font-extrabold">{maskEmail(email) || 'your email address'}</strong>.
          <br className="hidden sm:block" /> Please enter it below before it expires.
        </>
      }
    >
      <form className={authUi.form} aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
        <div className={authUi.formGroup}>
          <label className={authUi.label} id="reset-code-label">
            Reset Code
          </label>
          <div
            className="grid grid-cols-6 gap-2 sm:gap-3"
            role="group"
            aria-labelledby="reset-code-label"
            aria-describedby={fieldErrors.code ? 'verify-code-error' : undefined}
          >
            {Array.from({ length: 6 }).map((_, index) => {
              const hasValue = Boolean(codeDigits[index]);
              return (
                <input
                  key={index}
                  ref={(element) => {
                    codeInputRefs.current[index] = element;
                  }}
                  className={cx(
                    "h-14 sm:h-16 min-w-0 rounded-2xl border-2 text-center text-3xl font-black shadow-sm outline-none transition-all duration-300 ease-out focus:outline-none disabled:opacity-50",
                    hasValue 
                      ? "border-[#003A8F]/30 bg-white text-[#003A8F] shadow-[0_8px_20px_rgba(0,58,143,0.15)] scale-105" 
                      : "border-slate-200 bg-slate-50 text-slate-900 focus:-translate-y-1 focus:scale-105 focus:border-[#003A8F] focus:bg-white focus:text-[#003A8F] focus:shadow-[0_12px_30px_rgba(0,58,143,0.2)] focus:ring-4 focus:ring-[#003A8F]/20"
                  )}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={codeDigits[index] || ''}
                  onChange={(event) => updateCodeDigit(index, event.target.value)}
                  onKeyDown={(event) => handleCodeKeyDown(index, event.key)}
                  aria-label={`Reset code digit ${index + 1}`}
                  aria-invalid={fieldErrors.code ? 'true' : 'false'}
                  disabled={isSubmitting}
                  required
                />
              );
            })}
          </div>
          {fieldErrors.code ? (
            <span className={authUi.fieldError} id="verify-code-error">
              {fieldErrors.code}
            </span>
          ) : null}
          {fieldErrors.email ? (
            <span className={authUi.fieldError}>
              Request a new reset code before continuing.
            </span>
          ) : null}

          {timeLeft <= 0 && (
            <div className="mt-4 flex justify-center items-center gap-2 text-[0.9rem] font-semibold transition-all animate-in fade-in slide-in-from-top-2">
              <i className="fas fa-exclamation-circle text-red-500" aria-hidden="true" />
              <span className="text-red-500">Code has expired. Request a new one.</span>
            </div>
          )}
        </div>

        {error ? (
          <div className={getMessageClass('error')} role="alert" aria-live="polite">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 mt-6">
          <button type="submit" className="group relative overflow-hidden flex items-center justify-center gap-2 rounded-2xl h-14 text-base font-extrabold bg-gradient-to-r from-[#003A8F] to-[#0052cc] text-white shadow-[0_10px_30px_rgba(0,58,143,0.3)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,58,143,0.4)] transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_30px_rgba(0,58,143,0.3)] disabled:cursor-not-allowed" disabled={isSubmitting || timeLeft <= 0}>
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
              <div className="relative h-full w-8 bg-white/20" />
            </div>
            {isSubmitting ? (
              <>
                <span className={authUi.spinner} aria-hidden="true" />
                Verifying...
              </>
            ) : (
              'Verify code'
            )}
          </button>
          {timeLeft > 0 ? (
            <button
              type="button"
              disabled
              className="group flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-[0.95rem] font-extrabold text-slate-500 shadow-sm transition-all duration-300 cursor-not-allowed opacity-70"
            >
              Resend code in {formatTime(timeLeft)}
            </button>
          ) : (
            <Link
              href="/forgot-password"
              className="group flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-[0.95rem] font-extrabold text-[#003A8F] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(0,58,143,0.10)] active:scale-[0.98] animate-in zoom-in-95"
            >
              Send new code
            </Link>
          )}
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
