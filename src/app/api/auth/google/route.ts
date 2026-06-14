import { NextResponse, type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let redirectUrl = '';

  try {
    const supabase = await createClient();
    
    // We want to redirect back to our custom callback
    const callbackUrl = new URL('/api/auth/google/callback', request.url).toString();
    console.log('[OAuth] Initiating with redirect URL:', callbackUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('[OAuth] Supabase signInWithOAuth error:', error);
      throw error;
    }

    if (data.url) {
      console.log('[OAuth] Redirect URL generated successfully.');
      redirectUrl = data.url;
    } else {
      throw new Error('Failed to generate Google authorization URL');
    }
  } catch (error: any) {
    console.error('[OAuth] Route initialization error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Authentication configuration error' },
      { status: 500 }
    );
  }

  // Perform redirect outside of try/catch so Next.js handles the NEXT_REDIRECT error properly
  // This is required for Next.js to properly preserve cookies set by Supabase (e.g. PKCE verifier)
  if (redirectUrl) {
    redirect(redirectUrl);
  }
}
