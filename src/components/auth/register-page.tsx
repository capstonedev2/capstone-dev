'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';
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
  getSelectClass
} from './auth-ui';
import { LogoIcon } from '@/components/branding/logo-icon';
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

export function RegisterPage() {
  const router = useRouter();
  const { branding } = useBranding();
  const registerBranding = branding.auth.register;
  const institutionInitials = branding.institutionName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const registerBackgroundStyle = branding.assets.loginBackground ? {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.34), rgba(0, 58, 143, 0.18)), url("${branding.assets.loginBackground.replace(/"/g, '\\"')}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
  } satisfies CSSProperties : undefined;
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

  return (
    <main className={authUi.page} style={registerBackgroundStyle}>
      <div className={authUi.pageWash} aria-hidden="true" />
      <div className={authUi.pagePattern} aria-hidden="true" />
      <div className={authUi.topStripe} aria-hidden="true" />

      {/* Floating 3D Depth Elements Removed */}

      <Link href="/" className={authUi.backLink}>
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to Home
      </Link>

      <section className={authUi.shell} aria-labelledby="register-title">
        <div className="w-full max-w-[620px] overflow-hidden bg-transparent">

          <div className="flex min-w-0 flex-col justify-center px-4 py-3 sm:px-6 sm:py-4">
            <div className="mb-4 border-b border-white/20 pb-4">
              <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                <div className="flex min-w-[180px] items-center gap-2.5 drop-shadow-md">
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
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-extrabold text-white backdrop-blur-sm">
                      {institutionInitials || 'S'}
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
              <div className="w-full max-w-[620px] rounded-[24px] border border-white/50 bg-white/[0.30] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_24px_48px_-12px_rgba(0,0,0,0.22)] backdrop-blur-[18px] sm:p-7 lg:p-8">
                <div className="mb-6 flex flex-col items-center text-center">
                  <span className="mb-2 inline-flex items-center gap-2 rounded-xl border border-[#003A8F]/10 bg-white px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[#003A8F] shadow-sm">
                    <i className="fas fa-user-plus" aria-hidden="true" />
                    {registerBranding.pill}
                  </span>
                  <h2 className="sr-only" id="register-title">
                    {registerBranding.title}
                  </h2>
                </div>

                {statusMessage ? (
                  <div className={getMessageClass('success')} role="status" aria-live="polite">
                    {statusMessage}
                  </div>
                ) : null}

                <form className="space-y-3.5" aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
                  <div className="rounded-xl border border-white/45 bg-white/[0.18] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-md sm:p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#0F5DB8] drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]">
                      <i className="fas fa-user" aria-hidden="true" />
                      Personal details
                    </div>
                    <div className={authUi.formRow}>
                      <div className={authUi.formGroup}>
                        <label className={authUi.label} htmlFor="firstName">
                          First Name
                        </label>
                        <input
                          id="firstName"
                          className={cx(getInputClass(Boolean(fieldErrors.firstName)), 'text-sm')}
                          type="text"
                          placeholder="Juan"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(event) => {
                            setFirstName(event.target.value);
                            setError('');
                            clearFieldError('firstName');
                          }}
                          aria-describedby={fieldErrors.firstName ? 'register-first-name-error' : undefined}
                          aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
                          disabled={isSubmitting}
                          required
                        />
                        {fieldErrors.firstName ? (
                          <span className={authUi.fieldError} id="register-first-name-error">
                            {fieldErrors.firstName}
                          </span>
                        ) : null}
                      </div>

                      <div className={authUi.formGroup}>
                        <label className={authUi.label} htmlFor="lastName">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          className={cx(getInputClass(Boolean(fieldErrors.lastName)), 'text-sm')}
                          type="text"
                          placeholder="Dela Cruz"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(event) => {
                            setLastName(event.target.value);
                            setError('');
                            clearFieldError('lastName');
                          }}
                          aria-describedby={fieldErrors.lastName ? 'register-last-name-error' : undefined}
                          aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
                          disabled={isSubmitting}
                          required
                        />
                        {fieldErrors.lastName ? (
                          <span className={authUi.fieldError} id="register-last-name-error">
                            {fieldErrors.lastName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/45 bg-white/[0.18] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-md sm:p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#0F5DB8] drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]">
                      <i className="fas fa-building-columns" aria-hidden="true" />
                      Academic details
                    </div>
                    <div className="grid gap-2.5">
                      <div className={authUi.formRow}>
                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor="studentId">
                            Student ID
                          </label>
                          <input
                            id="studentId"
                            className={cx(getInputClass(Boolean(fieldErrors.studentId)), 'text-sm')}
                            type="text"
                            placeholder="2026-XXXX"
                            value={studentId}
                            onChange={(event) => {
                              setStudentId(event.target.value);
                              setError('');
                              clearFieldError('studentId');
                            }}
                            aria-describedby={fieldErrors.studentId ? 'register-student-id-error' : undefined}
                            aria-invalid={fieldErrors.studentId ? 'true' : 'false'}
                            disabled={isSubmitting}
                            required
                          />
                          {fieldErrors.studentId ? (
                            <span className={authUi.fieldError} id="register-student-id-error">
                              {fieldErrors.studentId}
                            </span>
                          ) : null}
                        </div>

                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor="email">
                            Email Address
                          </label>
                          <input
                            id="email"
                            className={cx(getInputClass(Boolean(fieldErrors.email)), 'text-sm')}
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
                            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                            aria-invalid={fieldErrors.email ? 'true' : 'false'}
                            disabled={isSubmitting}
                            readOnly={isGoogleRegistration}
                            required
                          />
                          {fieldErrors.email ? (
                            <span className={authUi.fieldError} id="register-email-error">
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
                          <label className={authUi.label} htmlFor="department">
                            Department / Program
                          </label>
                          <div className={authUi.selectWrap}>
                            <select
                              id="department"
                              className={cx(getSelectClass(Boolean(fieldErrors.department)), 'text-sm')}
                              value={department}
                              onChange={(event) => {
                                setDepartment(event.target.value);
                                setError('');
                                clearFieldError('department');
                              }}
                              aria-describedby={fieldErrors.department ? 'register-department-error' : undefined}
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
                            <span className={authUi.fieldError} id="register-department-error">
                              {fieldErrors.department}
                            </span>
                          ) : null}
                        </div>

                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor="yearLevel">
                            Year Level
                          </label>
                          <div className={authUi.selectWrap}>
                            <select
                              id="yearLevel"
                              className={cx(getSelectClass(Boolean(fieldErrors.yearLevel)), 'text-sm')}
                              value={yearLevel}
                              onChange={(event) => {
                                setYearLevel(event.target.value);
                                setError('');
                                clearFieldError('yearLevel');
                              }}
                              aria-describedby={fieldErrors.yearLevel ? 'register-year-level-error' : undefined}
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
                            <span className={authUi.fieldError} id="register-year-level-error">
                              {fieldErrors.yearLevel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isGoogleRegistration ? (
                    <div className="rounded-md border border-[#003A8F]/15 bg-[#003A8F]/8 px-3 py-1.5 text-sm font-semibold leading-5 text-slate-700">
                      <span className={authUi.noteStrong}>Google sign-in enabled.</span> Your verified Google account will be linked after you complete the required student details.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/45 bg-white/[0.18] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-md sm:p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#0F5DB8] drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]">
                        <i className="fas fa-lock" aria-hidden="true" />
                        Account security
                      </div>
                      <div className={authUi.formRow}>
                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor="password">
                            Password
                          </label>
                          <div className={authUi.passwordField}>
                            <input
                              id="password"
                              className={cx(getPasswordInputClass(Boolean(fieldErrors.password)), 'text-sm')}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              autoComplete="new-password"
                              value={password}
                              onChange={(event) => {
                                setPassword(event.target.value);
                                setError('');
                                clearFieldError('password');
                              }}
                              aria-describedby={fieldErrors.password ? 'register-password-error' : 'register-password-help'}
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
                            >
                              <i
                                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                          {fieldErrors.password ? (
                            <span className={authUi.fieldError} id="register-password-error">
                              {fieldErrors.password}
                            </span>
                          ) : (
                            <span className={authUi.helperText} id="register-password-help">
                              Use at least 6 characters.
                            </span>
                          )}
                        </div>

                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor="confirmPassword">
                            Confirm Password
                          </label>
                          <div className={authUi.passwordField}>
                            <input
                              id="confirmPassword"
                              className={cx(getPasswordInputClass(Boolean(fieldErrors.confirmPassword)), 'text-sm')}
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm password"
                              autoComplete="new-password"
                              value={confirmPassword}
                              onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                setError('');
                                clearFieldError('confirmPassword');
                              }}
                              aria-describedby={
                                fieldErrors.confirmPassword ? 'register-confirm-password-error' : undefined
                              }
                              aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                              disabled={isSubmitting}
                              required
                            />
                            <button
                              type="button"
                              className={cx(authUi.passwordToggle, 'right-2')}
                              onClick={() => setShowConfirmPassword((current) => !current)}
                              aria-controls="confirmPassword"
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
                            <span className={authUi.fieldError} id="register-confirm-password-error">
                              {fieldErrors.confirmPassword}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border border-[#003A8F]/15 bg-[#003A8F]/8 px-3 py-1.5 text-sm font-semibold leading-5 text-slate-700">
                    <span className={authUi.noteStrong}>{registerBranding.academicNote}</span> {registerBranding.staffNote}
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

                <div className="mt-1.5 text-center">
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {registerBranding.alternatePrompt}{' '}
                    <Link
                      href="/login"
                      className={authUi.bookLink}
                    >
                      <i className="fas fa-arrow-left" aria-hidden="true" />
                      {registerBranding.alternateLinkLabel}
                    </Link>
                  </p>
                </div>
                <div className="mt-3 border-t border-white/70 pt-3 text-center text-xs font-bold text-slate-700">
                  <i className="fas fa-shield-halved mr-2 text-slate-700" aria-hidden="true" />
                  Secure registration for ThesisTrack users only.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
