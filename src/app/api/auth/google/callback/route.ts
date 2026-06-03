import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isAccountSuspended,
  publicUserSelect,
  restoreExpiredSuspension,
  setAuthCookie,
  signAuthToken,
  toPublicUser
} from '@/lib/auth';
import {
  setGoogleRegistrationCookie,
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
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(getLoginRedirect(request, 'cancelled'));
  }

  if (!code) {
    return NextResponse.redirect(getLoginRedirect(request, 'invalid_request'));
  }

  try {
    const supabase = await createClient();
    
    // Exchange code for Supabase Session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError || !authData.user) {
      console.error('Supabase code exchange failed', authError);
      return NextResponse.redirect(getLoginRedirect(request, 'invalid_request'));
    }

    const supabaseUser = authData.user;
    const email = supabaseUser.email!;
    const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email;
    const firstName = supabaseUser.user_metadata?.first_name || '';
    const lastName = supabaseUser.user_metadata?.last_name || '';

    const profile = {
      email,
      name,
      firstName,
      lastName,
      sub: supabaseUser.id // Passing the Supabase ID to the register route!
    };

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleSub: supabaseUser.id },
          { supabaseId: supabaseUser.id },
          { email: email }
        ]
      },
      select: {
        ...publicUserSelect,
        googleSub: true,
        supabaseId: true
      }
    });

    if (!user) {
      // User doesn't exist locally. Redirect to register page
      const response = NextResponse.redirect(getRegisterRedirect(request, profile));
      setGoogleRegistrationCookie(response, profile);
      return response;
    }

    const authUser = await restoreExpiredSuspension(user);

    if (isAccountSuspended(authUser)) {
      return NextResponse.redirect(getLoginRedirect(request, 'suspended'));
    }

    // Auto-migrate: If they existed by email but lacked a supabaseId or googleSub, link them now!
    const linkedUser = (user.googleSub && user.supabaseId)
      ? authUser
      : await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            googleSub: supabaseUser.id,
            supabaseId: supabaseUser.id
          },
          select: {
            ...publicUserSelect,
            googleSub: true,
            supabaseId: true
          }
        });
        
    const publicUser = toPublicUser(linkedUser);
    const response = NextResponse.redirect(getSyncRedirect(request, publicUser.role));

    setAuthCookie(response, signAuthToken(linkedUser));

    return response;
  } catch (callbackError) {
    console.error('Google OAuth callback failed.', callbackError);
    return NextResponse.redirect(getLoginRedirect(request, 'error'));
  }
}
