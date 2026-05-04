'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import {
  getRoleRedirectPath,
  persistAuthenticatedUser,
  registerWithApi
} from '@/lib/client-auth';
import {
  authUi,
  getInputClass,
  getMessageClass,
  getPasswordInputClass,
  getSelectClass
} from './auth-ui';
import { LogoIcon } from '@/components/branding/logo-icon';

const departmentOptions = [
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
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem('capstoneStudentProfileDraft') || 'null');

      if (!draft) {
        return;
      }

      setFirstName(String(draft.firstName || ''));
      setLastName(String(draft.lastName || ''));
      setStudentId(String(draft.studentId || ''));
      setEmail(String(draft.email || ''));
      setDepartment(String(draft.department || ''));
      setYearLevel(String(draft.yearLevel || ''));
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

    if (!normalizedPassword) {
      nextErrors.password = 'Please enter a password.';
    } else if (normalizedPassword.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!normalizedConfirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (normalizedPassword !== normalizedConfirmPassword) {
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
      role: 'student'
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
    <main className={authUi.page}>
      <div className={authUi.pageWash} aria-hidden="true" />
      <div className={authUi.pagePattern} aria-hidden="true" />
      <div className={authUi.topStripe} aria-hidden="true" />

      {/* Floating 3D Depth Elements Removed */}

      <Link href="/" className={authUi.backLink}>
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to Home
      </Link>

      <section className={authUi.shell} aria-labelledby="register-title">
        <div className={authUi.authFrameWide}>


          <div className={authUi.formColumn}>
            <div className={authUi.mobileBrand} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LogoIcon style={{ height: '84px', width: 'auto', marginBottom: '0.85rem' }} />
              <h1 className={authUi.brandTitle}>
                Thesis<span className={authUi.brandAccent}>Track</span>
              </h1>
              <p className={authUi.brandSubtitle}>
                Create your student workspace for thesis submissions, repository access, and academic project tracking.
              </p>
            </div>

            <div className={authUi.containerWide}>
              <div className={authUi.card}>
                <div className={authUi.cardStripe} aria-hidden="true" />
                <div className={authUi.header}>
                  <span className={authUi.headerPill}>
                    <i className="fas fa-user-plus" aria-hidden="true" />
                    Student Account Setup
                  </span>
                  <h2 className={authUi.headerTitle} id="register-title">
                    Student Registration
                  </h2>
                  <p className={authUi.headerTextLeft}>
                    Use your official academic details so the research office can prepare your ThesisTrack workspace.
                  </p>
                </div>

                <form className="space-y-5" aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
                  <div className={authUi.fieldset}>
                    <div className={authUi.fieldsetTitle}>
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
                          className={getInputClass(Boolean(fieldErrors.firstName))}
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
                          className={getInputClass(Boolean(fieldErrors.lastName))}
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

                  <div className={authUi.fieldset}>
                    <div className={authUi.fieldsetTitle}>
                      <i className="fas fa-building-columns" aria-hidden="true" />
                      Academic details
                    </div>
                    <div className="grid gap-4">
                      <div className={authUi.formRow}>
                        <div className={authUi.formGroup}>
                          <label className={authUi.label} htmlFor="studentId">
                            Student ID
                          </label>
                          <input
                            id="studentId"
                            className={getInputClass(Boolean(fieldErrors.studentId))}
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
                            className={getInputClass(Boolean(fieldErrors.email))}
                            type="email"
                            placeholder="student@university.edu.ph"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setError('');
                              clearFieldError('email');
                            }}
                            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                            aria-invalid={fieldErrors.email ? 'true' : 'false'}
                            disabled={isSubmitting}
                            required
                          />
                          {fieldErrors.email ? (
                            <span className={authUi.fieldError} id="register-email-error">
                              {fieldErrors.email}
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
                              className={getSelectClass(Boolean(fieldErrors.department))}
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
                              {departmentOptions.map((option) => (
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
                              className={getSelectClass(Boolean(fieldErrors.yearLevel))}
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

                  <div className={authUi.fieldset}>
                    <div className={authUi.fieldsetTitle}>
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
                            className={getPasswordInputClass(Boolean(fieldErrors.password))}
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
                            className={authUi.passwordToggle}
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
                            className={getPasswordInputClass(Boolean(fieldErrors.confirmPassword))}
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
                            className={authUi.passwordToggle}
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

                  <div className={authUi.compactNote}>
                    <span className={authUi.noteStrong}>Student access only.</span> Faculty, staff, and office accounts are issued by the school.
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
                        Creating account...
                      </>
                    ) : (
                      'Register Student Account'
                    )}
                  </button>
                </form>

                <div className={authUi.footer}>
                  <p className={authUi.footerText}>
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className={authUi.bookLink}
                    >
                      <i className="fas fa-arrow-left" aria-hidden="true" />
                      Sign in here
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
