import { NextResponse, type NextRequest } from 'next/server';
import {
  isAccountSuspended,
  publicUserSelect,
  setAuthCookie,
  signAuthToken,
  toPublicUser
} from '@/lib/auth';
import {
  clearGoogleOAuthStateCookie,
  exchangeGoogleCodeForTokens,
  getVerifiedGoogleProfile,
  setGoogleRegistrationCookie,
  validateGoogleOAuthState
} from '@/lib/google-oauth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function getLoginRedirect(request: NextRequest, reason?: string) {
  const url = new URL('/login', request.url);

  if (reason) {
    url.searchParams.set('google', reason);
  }

  return url;
}

function getRegisterRedirect(request: NextRequest, profile: {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
}) {
  const url = new URL('/register', request.url);

  url.searchParams.set('provider', 'google');
  url.searchParams.set('email', profile.email);
  url.searchParams.set('name', profile.name);

  if (profile.firstName) {
    url.searchParams.set('firstName', profile.firstName);
  }

  if (profile.lastName) {
    url.searchParams.set('lastName', profile.lastName);
  }

  return url;
}

function getRoleRedirectPath(role: ReturnType<typeof toPublicUser>['role']) {
  switch (role) {
    case 'system_admin':
      return '/system-admin/dashboard';
    case 'research_head':
    case 'admin':
      return '/admin/dashboard';
    case 'adviser':
      return '/adviser/adviser-mode/dashboard';
    case 'panel':
      return '/adviser/panel-mode/dashboard';
    case 'library':
      return '/library/dashboard';
    case 'partner':
      return '/partner/dashboard';
    case 'program_head':
      return '/program-head/dashboard';
    case 'tech_transfer':
      return '/tech-transfer/dashboard';
    case 'student':
    default:
      return '/students/dashboard';
  }
}

function getSyncRedirect(request: NextRequest, role: ReturnType<typeof toPublicUser>['role']) {
  const url = new URL('/auth/sync', request.url);
  url.searchParams.set('redirect', getRoleRedirectPath(role));
  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') || '';
  const state = request.nextUrl.searchParams.get('state') || '';
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    const response = NextResponse.redirect(getLoginRedirect(request, 'cancelled'));
    clearGoogleOAuthStateCookie(response);
    return response;
  }

  if (!code || !validateGoogleOAuthState(request, state)) {
    const response = NextResponse.redirect(getLoginRedirect(request, 'invalid_request'));
    clearGoogleOAuthStateCookie(response);
    return response;
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(request, code);
    const profile = await getVerifiedGoogleProfile(tokens.id_token);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            googleSub: profile.sub
          },
          {
            email: profile.email
          }
        ]
      },
      select: {
        ...publicUserSelect,
        googleSub: true
      }
    });

    if (!user) {
      const response = NextResponse.redirect(getRegisterRedirect(request, profile));
      clearGoogleOAuthStateCookie(response);
      setGoogleRegistrationCookie(response, profile);
      return response;
    }

    if (user.googleSub && user.googleSub !== profile.sub) {
      const response = NextResponse.redirect(getLoginRedirect(request, 'account_mismatch'));
      clearGoogleOAuthStateCookie(response);
      return response;
    }

    if (isAccountSuspended(user)) {
      const response = NextResponse.redirect(getLoginRedirect(request, 'suspended'));
      clearGoogleOAuthStateCookie(response);
      return response;
    }

    const linkedUser = user.googleSub
      ? user
      : await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            googleSub: profile.sub
          },
          select: {
            ...publicUserSelect,
            googleSub: true
          }
        });
    const publicUser = toPublicUser(linkedUser);
    const response = NextResponse.redirect(getSyncRedirect(request, publicUser.role));

    clearGoogleOAuthStateCookie(response);
    setAuthCookie(response, signAuthToken(linkedUser));

    return response;
  } catch (callbackError) {
    console.error('Google OAuth callback failed.', callbackError);
    const response = NextResponse.redirect(getLoginRedirect(request, 'error'));
    clearGoogleOAuthStateCookie(response);
    return response;
  }
}
