import { createClient } from '@/lib/supabase/server';
import { handleApiError, successResponse } from '@/lib/utils';
import { clearAuthCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = successResponse({ message: 'Logged out successfully.' });
    clearAuthCookie(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
