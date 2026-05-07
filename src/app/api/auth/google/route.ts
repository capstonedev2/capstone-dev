import { NextResponse, type NextRequest } from 'next/server';
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthState,
  getCanonicalGoogleOAuthStartUrl,
  setGoogleOAuthStateCookie
} from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const canonicalStartUrl = getCanonicalGoogleOAuthStartUrl(request);

  if (canonicalStartUrl) {
    return NextResponse.redirect(canonicalStartUrl);
  }

  const state = createGoogleOAuthState();
  const response = NextResponse.redirect(buildGoogleAuthorizationUrl(request, state));

  setGoogleOAuthStateCookie(response, state);

  return response;
}
