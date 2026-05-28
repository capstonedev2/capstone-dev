import { NextResponse, type NextRequest } from 'next/server';
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthState,
  getCanonicalGoogleOAuthStartUrl,
  isGoogleOAuthConfigError,
  setGoogleOAuthStateCookie
} from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const canonicalStartUrl = getCanonicalGoogleOAuthStartUrl(request);

    if (canonicalStartUrl) {
      return NextResponse.redirect(canonicalStartUrl);
    }

    const state = createGoogleOAuthState();
    const response = NextResponse.redirect(buildGoogleAuthorizationUrl(request, state));

    setGoogleOAuthStateCookie(response, state);

    return response;
  } catch (error) {
    if (isGoogleOAuthConfigError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: error.message
        },
        { status: 500 }
      );
    }

    throw error;
  }
}
