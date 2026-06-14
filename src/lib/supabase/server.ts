import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log('[Supabase Server] Setting cookie:', name);
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.error('[Supabase Server] Failed to set cookies:', error);
            // This can happen if setAll is called from a Server Component
            // (e.g. during a render). It can be safely ignored as long as
            // the middleware is correctly updating the session.
          }
        },
      },
    }
  );
}
