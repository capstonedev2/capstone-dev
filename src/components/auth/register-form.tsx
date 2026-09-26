'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  getRoleRedirectPath,
  persistAuthenticatedUser,
  registerWithApi
} from '@/lib/client-auth';
import {
  authUi,
  cx,
  getInputClass,
  getMessageClass,
  getPasswordInputClass,
  getSelectClass,
  shouldOpenAuthModal
} from './auth-ui';
import { AuthModalBrand } from './auth-modal-brand';
import { useBranding } from '@/components/branding/branding-provider';

const fallbackDepartmentOptions = [
  { value: '', label: 'Select Department' },
  { value: 'BSIT', label: 'BSIT - Information Technology' },
  { value: 'BSMET', label: 'BSMET - Manufacturing Eng. Tech.' },
  { value: 'BSTCM', label: 'BSTCM - Technology Communication Mgmt.' },
  { value: 'BSESM', label: 'BSESM - Energy Systems & Mgmt.' },
  { value: 'BSNAME', label: 'BSNAME - Naval Architecture & Marine Eng.' }
] as const;

const yearLevelOptions = [
  { value: '', label: 'Select Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' }
] as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const googleRegistrationMessage =
  'No ThesisTrack account was found for this Google account. Please register first. Complete your registration to continue using ThesisTrack with Google.';

function splitDisplayName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function calculatePasswordStrength(password: string): number {
  let score = 0;
  if (!password) return 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const passwordStrengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const passwordStrengthColors = ['text-slate-500', 'text-red-600', 'text-amber-600', 'text-amber-600', 'text-emerald-600'];

type RegisterFieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'studentId'
    | 'email'
    | 'department'
    | 'yearLevel'
    | 'password'
    | 'confirmPassword',
    string
  >
>;

const sectionClass = 'rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5';

type RegisterFormProps = {
  /** Reports account-creation progress so the modal can refuse to close mid-request. */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  /** Fires once the user has typed or selected anything, so the modal can confirm before discarding it. */
  onDirtyChange?: (isDirty: boolean) => void;
  /** "Sign in here" switches the modal to its login view instead of navigating. */
  onSwitchToLogin?: () => void;
};

export function RegisterForm({ onSubmittingChange, onDirtyChange, onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const { branding } = useBranding();
  const registerBranding = branding.auth.register;
  // Prefixed ids so they never collide with the login view's fields (both views live in the same dialog).
  const fieldId = (name: string) => `register-modal-${name}`;
  const messageId = (id: string) => id.replace(/^register-/, 'register-modal-');
  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...branding.departments
      .filter((departmentItem) => departmentItem.active)
      .map((departmentItem) => ({
        value: departmentItem.label.split(' - ')[0]?.trim() || departmentItem.id,
        label: departmentItem.label || `${departmentItem.shortName} - ${departmentItem.name}`
      }))
  ];
  const availableDepartmentOptions = departmentOptions.length > 1 ? departmentOptions : fallbackDepartmentOptions;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRegistration, setIsGoogleRegistration] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const passwordStrength = calculatePasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const personalSectionComplete = firstName.trim().length >= 2 && lastName.trim().length >= 2;
  const academicSectionComplete =
    studentId.trim().length > 0 && emailPattern.test(email.trim()) && Boolean(department) && Boolean(yearLevel);
  const securitySectionComplete =
    isGoogleRegistration || (password.trim().length >= 6 && passwordsMatch);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const errs = validateRegisterFields();
      setFieldErrors((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(touched).forEach((k) => {
          const key = k as keyof RegisterFieldErrors;
          if (errs[key] !== prev[key]) {
            if (errs[key]) next[key] = errs[key];
            else delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, studentId, email, department, yearLevel, password, confirmPassword, touched]);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem('capstoneStudentProfileDraft') || 'null');

      if (draft) {
        setFirstName(String(draft.firstName || ''));
        setLastName(String(draft.lastName || ''));
        setStudentId(String(draft.studentId || ''));
        setEmail(String(draft.email || ''));
        setDepartment(String(draft.department || ''));
        setYearLevel(String(draft.yearLevel || ''));
      }

      const params = new URLSearchParams(window.location.search);
      const provider = params.get('provider');

      // Google sign-up arrives as a redirect to /register?provider=google&..., which opens this view prefilled.
      if (provider === 'google') {
        const googleName = params.get('name') || '';
        const splitName = splitDisplayName(googleName);
        const googleFirstName = params.get('firstName') || splitName.firstName;
        const googleLastName = params.get('lastName') || splitName.lastName;
        const googleEmail = params.get('email') || '';

        setIsGoogleRegistration(true);
        setStatusMessage(googleRegistrationMessage);

        if (googleFirstName) {
          setFirstName(googleFirstName);
        }

        if (googleLastName) {
          setLastName(googleLastName);
        }

        if (googleEmail) {
          setEmail(googleEmail);
        }
      }
    } catch {
      // Ignore storage parsing issues.
    }
  }, []);

  useEffect(() => {
    router.prefetch('/login');
  }, [router]);

  const clearFieldError = (field: keyof RegisterFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateRegisterFields = (): RegisterFieldErrors => {
    const nextErrors: RegisterFieldErrors = {};
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedStudentId = studentId.trim();
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedFirstName) {
      nextErrors.firstName = 'Please enter your first name.';
    } else if (normalizedFirstName.length < 2) {
      nextErrors.firstName = 'First name must be at least 2 characters.';
    }

    if (!normalizedLastName) {
      nextErrors.lastName = 'Please enter your last name.';
    } else if (normalizedLastName.length < 2) {
      nextErrors.lastName = 'Last name must be at least 2 characters.';
    }

    if (!normalizedStudentId) {
      nextErrors.studentId = 'Please enter your student ID.';
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!emailPattern.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!department) {
      nextErrors.department = 'Please select your department.';
    }

    if (!yearLevel) {
      nextErrors.yearLevel = 'Please select your year level.';
    }

    if (!isGoogleRegistration && !normalizedPassword) {
      nextErrors.password = 'Please enter a password.';
    } else if (!isGoogleRegistration && normalizedPassword.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!isGoogleRegistration && !normalizedConfirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (!isGoogleRegistration && normalizedPassword !== normalizedConfirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const validationErrors = validateRegisterFields();

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedStudentId = studentId.trim();
    const trimmedEmail = email.trim();
    const trimmedDepartment = department.trim();
    const trimmedYearLevel = yearLevel.trim();

    const result = await registerWithApi({
      name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      studentId: trimmedStudentId,
      email: trimmedEmail,
      department: trimmedDepartment,
      yearLevel: trimmedYearLevel,
      password,
      confirmPassword,
      role: 'student',
      ...(isGoogleRegistration ? { provider: 'google' as const } : {})
    });

    if (!result.success) {
      setFieldErrors((result.fieldErrors as RegisterFieldErrors | undefined) || {});
      setError(result.message || 'Unable to create your account.');
      setIsSubmitting(false);
      return;
    }

    persistAuthenticatedUser(result.user);
    window.location.href = getRoleRedirectPath(result.user.role);
  };

  // Set on the first real keystroke/selection (not on draft prefill), via the form's onInput.
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => setIsDirty(true), []);

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const formFields = (
                <form className="space-y-2.5" aria-busy={isSubmitting} onSubmit={handleSubmit} onInput={markDirty} noValidate>
                  <div className={sectionClass}>
                    <div className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#0F5DB8] drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]">
                      <i className="fas fa-user" aria-hidden="true" />
                      Personal details
                      {personalSectionComplete ? (
                        <i className="fas fa-circle-check ml-auto text-emerald-500" aria-label="Section complete" />
                      ) : null}
                    </div>
                    <div className={authUi.formRow}>
                      <div className={authUi.formGroup}>
                        <label className={authUi.label} htmlFor={fieldId('firstName')}>
                          First Name
                        </label>
                        <input
                          id={fieldId('firstName')}
                          className={cx(getInputClass(Boolean(fieldErrors.firstName)), !fieldErrors.firstName && authUi.modalField)}
                          type="text"
                          placeholder="Juan"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(event) => {
                            setFirstName(event.target.value);
                            setError('');
                            clearFieldError('firstName');
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                          aria-describedby={fieldErrors.firstName ? messageId('register-first-name-error') : undefined}
                          aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
                          disabled={isSubmitting}
                          required
                        />
                        {fieldErrors.firstName ? (
                          <span className={authUi.fieldError} id={messageId('register-first-name-error')}>
                            {fieldErrors.firstName}
                          </span>
                        ) : null}
                      </div>

                      <div className={authUi.formGroup}>
                        <label className={authUi.label} htmlFor={fieldId('lastName')}>
                          Last Name
                        </label>
                        <input
                          id={fieldId('lastName')}
                          className={cx(getInputClass(Boolean(fieldErrors.lastName)), !fieldErrors.lastName && authUi.modalField)}
                          type="text"
                          placeholder="Dela Cruz"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(event) => {
                            setLastName(event.target.value);
                            setError('');
                            clearFieldError('lastName');
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                          aria-describedby={fieldErrors.lastName ? messageId('register-last-name-error') : undefined}
                          aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
                          disabled={isSubmitting}
                          required
                        />
                        {fieldErrors.lastName ? (
                          <span className={authUi.fieldError} id={messageId('register-last-name-error')}>
                            {fieldErrors.lastName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <div className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#0F5DB8] drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]">
                      <i className="fas fa-building-columns" aria-hidden="true" />
                      Academic details
                      {academicSectionComplete ? (
                        <i className="fas fa-circle-check ml-auto text-emerald-500" aria-label="Section complete" />
                      ) : null}
                    </div>
                    <div className="grid gap-2.5">
                      <div className={authUi.formRow}>
                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor={fieldId('studentId')}>
                            Student ID
                          </label>
                          <input
                            id={fieldId('studentId')}
                            className={cx(getInputClass(Boolean(fieldErrors.studentId)), !fieldErrors.studentId && authUi.modalField)}
                            type="text"
                            placeholder="2026-XXXX"
                            value={studentId}
                            onChange={(event) => {
                              setStudentId(event.target.value);
                              setError('');
                              clearFieldError('studentId');
                            }}
                            onBlur={() => setTouched((t) => ({ ...t, studentId: true }))}
                            aria-describedby={fieldErrors.studentId ? messageId('register-student-id-error') : undefined}
                            aria-invalid={fieldErrors.studentId ? 'true' : 'false'}
                            disabled={isSubmitting}
                            required
                          />
                          {fieldErrors.studentId ? (
                            <span className={authUi.fieldError} id={messageId('register-student-id-error')}>
                              {fieldErrors.studentId}
                            </span>
                          ) : null}
                        </div>

                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor={fieldId('email')}>
                            Email Address
                          </label>
                          <input
                            id={fieldId('email')}
                            className={cx(getInputClass(Boolean(fieldErrors.email)), !fieldErrors.email && authUi.modalField)}
                            type="email"
                            placeholder="student@university.edu.ph"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => {
                              if (isGoogleRegistration) {
                                return;
                              }

                              setEmail(event.target.value);
                              setError('');
                              clearFieldError('email');
                            }}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            aria-describedby={fieldErrors.email ? messageId('register-email-error') : undefined}
                            aria-invalid={fieldErrors.email ? 'true' : 'false'}
                            disabled={isSubmitting}
                            readOnly={isGoogleRegistration}
                            required
                          />
                          {fieldErrors.email ? (
                            <span className={authUi.fieldError} id={messageId('register-email-error')}>
                              {fieldErrors.email}
                            </span>
                          ) : isGoogleRegistration ? (
                            <span className={authUi.helperText}>
                              This email comes from your verified Google account.
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={authUi.formRow}>
                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor={fieldId('department')}>
                            Department / Program
                          </label>
                          <div className={authUi.selectWrap}>
                            <select
                              id={fieldId('department')}
                              className={cx(getSelectClass(Boolean(fieldErrors.department)), !fieldErrors.department && authUi.modalField)}
                              value={department}
                              onChange={(event) => {
                                setDepartment(event.target.value);
                                setError('');
                                clearFieldError('department');
                              }}
                              onBlur={() => setTouched((t) => ({ ...t, department: true }))}
                              aria-describedby={fieldErrors.department ? messageId('register-department-error') : undefined}
                              aria-invalid={fieldErrors.department ? 'true' : 'false'}
                              disabled={isSubmitting}
                              required
                            >
                              {availableDepartmentOptions.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <i className={`fas fa-chevron-down ${authUi.selectIcon}`} aria-hidden="true" />
                          </div>
                          {fieldErrors.department ? (
                            <span className={authUi.fieldError} id={messageId('register-department-error')}>
                              {fieldErrors.department}
                            </span>
                          ) : null}
                        </div>

                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor={fieldId('yearLevel')}>
                            Year Level
                          </label>
                          <div className={authUi.selectWrap}>
                            <select
                              id={fieldId('yearLevel')}
                              className={cx(getSelectClass(Boolean(fieldErrors.yearLevel)), !fieldErrors.yearLevel && authUi.modalField)}
                              value={yearLevel}
                              onChange={(event) => {
                                setYearLevel(event.target.value);
                                setError('');
                                clearFieldError('yearLevel');
                              }}
                              onBlur={() => setTouched((t) => ({ ...t, yearLevel: true }))}
                              aria-describedby={fieldErrors.yearLevel ? messageId('register-year-level-error') : undefined}
                              aria-invalid={fieldErrors.yearLevel ? 'true' : 'false'}
                              disabled={isSubmitting}
                              required
                            >
                              {yearLevelOptions.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <i className={`fas fa-chevron-down ${authUi.selectIcon}`} aria-hidden="true" />
                          </div>
                          {fieldErrors.yearLevel ? (
                            <span className={authUi.fieldError} id={messageId('register-year-level-error')}>
                              {fieldErrors.yearLevel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isGoogleRegistration ? (
                    <div className="rounded-xl border border-[#003A8F]/15 bg-[#EAF1FB] px-3 py-2 text-sm font-semibold leading-5 text-slate-700">
                      <span className="font-extrabold text-[#003A8F]">Google sign-in enabled.</span> Your verified Google account will be linked after you complete the required student details.
                    </div>
                  ) : (
                    <div className={sectionClass}>
                      <div className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#0F5DB8] drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]">
                        <i className="fas fa-lock" aria-hidden="true" />
                        Account security
                        {securitySectionComplete ? (
                          <i className="fas fa-circle-check ml-auto text-emerald-500" aria-label="Section complete" />
                        ) : null}
                      </div>
                      <div className={authUi.formRow}>
                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor={fieldId('password')}>
                            Password
                          </label>
                          <div className={authUi.passwordField}>
                            <input
                              id={fieldId('password')}
                              className={cx(getPasswordInputClass(Boolean(fieldErrors.password)), !fieldErrors.password && authUi.modalField)}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              autoComplete="new-password"
                              value={password}
                              onChange={(event) => {
                                setPassword(event.target.value);
                                setError('');
                                clearFieldError('password');
                              }}
                              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                              aria-describedby={fieldErrors.password ? messageId('register-password-error') : messageId('register-password-help')}
                              aria-invalid={fieldErrors.password ? 'true' : 'false'}
                              disabled={isSubmitting}
                              required
                            />
                            <button
                              type="button"
                              className={cx(authUi.passwordToggle, 'right-2', authUi.modalToggle)}
                              onClick={() => setShowPassword((current) => !current)}
                              aria-controls={fieldId('password')}
                              aria-pressed={showPassword}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              disabled={isSubmitting}
                            >
                              <i
                                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                          {fieldErrors.password ? (
                            <span className={authUi.fieldError} id={messageId('register-password-error')}>
                              {fieldErrors.password}
                            </span>
                          ) : (
                            <span className={authUi.helperText} id={messageId('register-password-help')}>
                              Use at least 6 characters.
                            </span>
                          )}
                          {!isGoogleRegistration && password.length > 0 && (
                            <div className="mt-2">
                              <div className="flex gap-1 h-1.5 w-full">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-full flex-1 rounded-full transition-colors ${
                                      passwordStrength >= level
                                        ? passwordStrength < 2
                                          ? 'bg-red-400'
                                          : passwordStrength < 3
                                          ? 'bg-amber-400'
                                          : 'bg-emerald-400'
                                        : 'bg-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span
                                className={cx('mt-1 block text-xs font-bold', passwordStrengthColors[passwordStrength])}
                                aria-live="polite"
                              >
                                {passwordStrengthLabels[passwordStrength]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor={fieldId('confirmPassword')}>
                            Confirm Password
                          </label>
                          <div className={authUi.passwordField}>
                            <input
                              id={fieldId('confirmPassword')}
                              className={cx(getPasswordInputClass(Boolean(fieldErrors.confirmPassword)), !fieldErrors.confirmPassword && authUi.modalField)}
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm password"
                              autoComplete="new-password"
                              value={confirmPassword}
                              onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                setError('');
                                clearFieldError('confirmPassword');
                              }}
                              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                              aria-describedby={
                                fieldErrors.confirmPassword ? messageId('register-confirm-password-error') : undefined
                              }
                              aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                              disabled={isSubmitting}
                              required
                            />
                            <button
                              type="button"
                              className={cx(authUi.passwordToggle, 'right-2', authUi.modalToggle)}
                              onClick={() => setShowConfirmPassword((current) => !current)}
                              aria-controls={fieldId('confirmPassword')}
                              aria-pressed={showConfirmPassword}
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                              disabled={isSubmitting}
                            >
                              <i
                                className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                          {fieldErrors.confirmPassword ? (
                            <span className={authUi.fieldError} id={messageId('register-confirm-password-error')}>
                              {fieldErrors.confirmPassword}
                            </span>
                          ) : passwordsMatch ? (
                            <span className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600" aria-live="polite">
                              <i className="fas fa-circle-check" aria-hidden="true" />
                              Passwords match
                            </span>
                          ) : passwordsMismatch ? (
                            <span className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-600" aria-live="polite">
                              <i className="fas fa-circle-exclamation" aria-hidden="true" />
                              Passwords do not match
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border border-slate-400/20 bg-black/5 px-3 py-1.5 text-sm font-semibold leading-5 text-slate-700">
                    <span className="font-extrabold text-slate-900">{registerBranding.academicNote}</span> {registerBranding.staffNote}
                  </div>

                  {error ? (
                    <div className={getMessageClass('error')} role="alert" aria-live="polite">
                      {error}
                    </div>
                  ) : null}

                  <button type="submit" className={cx(authUi.submitButton, 'text-sm')} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className={authUi.spinner} aria-hidden="true" />
                        Creating account...
                      </>
                    ) : (
                      isGoogleRegistration ? 'Complete Google Registration' : registerBranding.submitLabel
                    )}
                  </button>
                </form>
  );

  return (
    <div className="px-5 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
      <AuthModalBrand />
      <div className="mb-5 flex flex-col items-center text-center">
        <h2 className="m-0 font-serif text-[1.75rem] font-bold leading-tight text-[#102033]" id={messageId('register-title')}>
          {registerBranding.title}
        </h2>
      </div>

      {statusMessage ? (
        <div className={cx(getMessageClass('success'), 'mb-3')} role="status" aria-live="polite">
          {statusMessage}
        </div>
      ) : null}

      {formFields}

      <div className="mt-1 text-center">
        <p className="text-sm font-semibold leading-6 text-slate-700">
          {registerBranding.alternatePrompt}{' '}
          <Link
            href="/login"
            className={authUi.bookLink}
            onClick={(event) => {
              // Inside the modal, switch views instead of navigating; new-tab clicks still reach /login.
              if (onSwitchToLogin && shouldOpenAuthModal(event)) {
                event.preventDefault();
                onSwitchToLogin();
              }
            }}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" />
            {registerBranding.alternateLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
