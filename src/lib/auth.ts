import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { type NextResponse } from 'next/server';
import { UserRole, type User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  PASSWORD_MIN_LENGTH,
  getRequiredEnv,
  normalizeText
} from '@/lib/utils';

export const AUTH_COOKIE_NAME = 'thesistrack_session';
const AUTH_TOKEN_EXPIRES_IN = '7d';
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;

export type AuthRole =
  | 'admin'
  | 'system_admin'
  | 'research_head'
  | 'student'
  | 'adviser'
  | 'panel'
  | 'program_head'
  | 'partner'
  | 'tech_transfer'
  | 'library';

export type PublicUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'firstName'
  | 'lastName'
  | 'studentId'
  | 'department'
  | 'yearLevel'
  | 'role'
  | 'contactNumber'
  | 'address'
  | 'birthDate'
  | 'profileImage'
  | 'section'
  | 'accountSummary'
  | 'office'
  | 'displayName'
  | 'isSuspended'
  | 'suspendedAt'
  | 'createdAt'
  | 'updatedAt'
>;

type AuthTokenPayload = JwtPayload & {
  sub: string;
  role: UserRole;
};

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  lastName: true,
  studentId: true,
  department: true,
  yearLevel: true,
  role: true,
  contactNumber: true,
  address: true,
  birthDate: true,
  profileImage: true,
  section: true,
  accountSummary: true,
  office: true,
  displayName: true,
  isSuspended: true,
  suspendedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

const apiRoleByDbRole: Record<UserRole, AuthRole> = {
  [UserRole.ADMIN]: 'admin',
  [UserRole.SYSTEM_ADMIN]: 'system_admin',
  [UserRole.RESEARCH_HEAD]: 'research_head',
  [UserRole.STUDENT]: 'student',
  [UserRole.ADVISER]: 'adviser',
  [UserRole.PANEL]: 'panel',
  [UserRole.PROGRAM_HEAD]: 'program_head',
  [UserRole.PARTNER]: 'partner',
  [UserRole.TECH_TRANSFER]: 'tech_transfer',
  [UserRole.LIBRARY]: 'library'
};

export function toApiRole(role: UserRole): AuthRole {
  return apiRoleByDbRole[role];
}

export function parseUserRole(value: unknown, fallback: UserRole = UserRole.STUDENT): UserRole {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  switch (normalized) {
    case 'system_admin':
    case 'system administrator':
    case 'system-administrator':
    case 'super_admin':
    case 'super admin':
      return UserRole.SYSTEM_ADMIN;
    case 'research_head':
    case 'research head':
    case 'research-head':
      return UserRole.RESEARCH_HEAD;
    case 'admin':
      return UserRole.ADMIN;
    case 'student':
      return UserRole.STUDENT;
    case 'adviser':
      return UserRole.ADVISER;
    case 'panel':
      return UserRole.PANEL;
    case 'program_head':
      return UserRole.PROGRAM_HEAD;
    case 'partner':
      return UserRole.PARTNER;
    case 'tech_transfer':
      return UserRole.TECH_TRANSFER;
    case 'library':
      return UserRole.LIBRARY;
    default:
      throw new HttpError('Selected role is not supported.', 400, {
        role: 'Choose a valid user role.'
      });
  }
}

export function toPublicUser(user: PublicUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    studentId: user.studentId,
    department: user.department,
    yearLevel: user.yearLevel,
    role: toApiRole(user.role),
    contactNumber: user.contactNumber,
    address: user.address,
    birthDate: user.birthDate,
    profileImage: user.profileImage,
    section: user.section,
    accountSummary: user.accountSummary,
    office: user.office,
    displayName: user.displayName,
    isSuspended: user.isSuspended,
    suspendedAt: user.suspendedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function validatePassword(value: string) {
  if (value.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`, 400, {
      password: `Use at least ${PASSWORD_MIN_LENGTH} characters.`
    });
  }
}

export function buildDisplayName({
  name,
  firstName,
  lastName,
  email
}: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
}) {
  return normalizeText(name) || normalizeText(`${firstName || ''} ${lastName || ''}`) || email;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function isAccountSuspended(user: Pick<PublicUser, 'isSuspended'> | null | undefined) {
  return Boolean(user?.isSuspended);
}

function getJwtSecret() {
  return getRequiredEnv('JWT_SECRET');
}

export function ensureAuthConfig() {
  try {
    getJwtSecret();
  } catch {
    throw new HttpError('Authentication is not configured on the server.', 500);
  }
}

export function signAuthToken(user: Pick<PublicUser, 'id' | 'role'>) {
  return jwt.sign(
    {
      role: user.role
    },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: AUTH_TOKEN_EXPIRES_IN
    }
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (typeof decoded === 'string' || !decoded.sub) {
      return null;
    }

    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}

function getCookieFromHeader(cookieHeader: string, name: string) {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getAuthTokenFromRequest(request: Request) {
  const authorizationHeader = request.headers.get('authorization');

  if (authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    return authorizationHeader.slice(7).trim();
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const token = getCookieFromHeader(cookieHeader, AUTH_COOKIE_NAME);
  return token ? decodeURIComponent(token) : null;
}

async function getAuthTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function getAuthenticatedUser(request?: Request) {
  const token = request ? getAuthTokenFromRequest(request) : await getAuthTokenFromCookies();

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);

  if (!payload?.sub) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: publicUserSelect
  }).then((user) => (isAccountSuspended(user) ? null : user));
}

export async function requireAuthenticatedUser(request: Request, allowedRoles?: UserRole[]) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new HttpError('Authentication is required.', 401);
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    throw new HttpError('You do not have permission to access this resource.', 403);
  }

  return user;
}

export function createPasswordResetToken() {
  const token = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt
  };
}

export function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
