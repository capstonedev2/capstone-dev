import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/*
 * Refreshes the Supabase session once per request, before any route handler or Server Component runs.
 *
 * Without this, an expired session was refreshed inside whichever handler called getUser() first. When that
 * happened while rendering a Server Component, the rotated cookies could not be written (cookies are read-only
 * there), so the browser kept a refresh token Supabase had already retired and later requests failed with
 * "Invalid Refresh Token: Refresh Token Not Found". Refreshing here writes the new tokens onto both the
 * forwarded request and the response. If the refresh token is already dead, Supabase clears the session and
 * the cookie deletion reaches the browser, so the error stops repeating (the legacy JWT cookie still applies).
 */

// Supabase stores the session as sb-<project-ref>-auth-token, split into .0/.1 chunks when large.
const hasSupabaseSessionCookie = (request: NextRequest) =>
  request.cookies.getAll().some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'));

export async function proxy(request: NextRequest) {
  if (!hasSupabaseSessionCookie(request)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // Triggers the refresh when the access token has expired. Don't run code between creating the client
  // and this call, and return `response` as-is so the refreshed cookies are kept.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$).*)']
};
