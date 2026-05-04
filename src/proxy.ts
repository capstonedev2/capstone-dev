import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'thesistrack_session';

type NormalizedRole =
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

const ROUTE_POLICIES: Array<{
  prefix: string;
  roles: NormalizedRole[];
}> = [
  { prefix: '/system-admin', roles: ['system_admin'] },
  { prefix: '/admin', roles: ['research_head', 'admin'] },
  { prefix: '/program-head', roles: ['program_head'] },
  { prefix: '/students', roles: ['student'] },
  { prefix: '/adviser', roles: ['adviser', 'panel'] },
  { prefix: '/library', roles: ['library'] },
  { prefix: '/tech-transfer', roles: ['tech_transfer'] },
  { prefix: '/partner', roles: ['partner'] }
];

function withSecurityHeaders(response: NextResponse, request?: NextRequest) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'X-Frame-Options',
    request?.nextUrl.searchParams.get('brandingPreview') === '1' ? 'SAMEORIGIN' : 'DENY'
  );

  return response;
}

function normalizeRole(value: unknown): NormalizedRole | null {
  const role = String(value ?? '').trim().toLowerCase();

  switch (role) {
    case 'admin':
    case 'system_admin':
    case 'research_head':
    case 'student':
    case 'adviser':
    case 'panel':
    case 'program_head':
    case 'partner':
    case 'tech_transfer':
    case 'library':
      return role;
    default:
      return null;
  }
}

function getRoleRedirectPath(role: NormalizedRole) {
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

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeJwtPayload(value: string) {
  const payload = new TextDecoder().decode(base64UrlToBytes(value));
  return JSON.parse(payload) as {
    role?: unknown;
    exp?: number;
  };
}

async function getVerifiedRole(token: string | undefined) {
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      {
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['verify']
    );
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(encodedSignature),
      encoder.encode(`${encodedHeader}.${encodedPayload}`)
    );

    if (!isValid) {
      return null;
    }

    const payload = decodeJwtPayload(encodedPayload);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return normalizeRole(payload.role);
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/')) {
    return withSecurityHeaders(NextResponse.next(), request);
  }

  const policy = ROUTE_POLICIES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));

  if (!policy) {
    return withSecurityHeaders(NextResponse.next(), request);
  }

  const role = await getVerifiedRole(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (!role) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)), request);
  }

  if (!policy.roles.includes(role)) {
    return withSecurityHeaders(NextResponse.redirect(new URL(getRoleRedirectPath(role), request.url)), request);
  }

  return withSecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/system-admin/:path*',
    '/program-head/:path*',
    '/students/:path*',
    '/adviser/:path*',
    '/library/:path*',
    '/tech-transfer/:path*',
    '/partner/:path*'
  ]
};
