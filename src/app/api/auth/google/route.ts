import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRequiredEnv } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // We want to redirect back to our custom callback
    const callbackUrl = new URL('/api/auth/google/callback', request.url).toString();
    
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
      throw error;
    }

    if (data.url) {
      return NextResponse.redirect(data.url);
    }
    
    throw new Error('Failed to generate Google authorization URL');
  } catch (error: any) {
    console.error('Google OAuth initialization error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Authentication configuration error' },
      { status: 500 }
    );
  }
}
