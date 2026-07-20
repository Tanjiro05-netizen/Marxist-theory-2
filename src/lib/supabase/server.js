import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { assertSupabaseConfig, supabaseAnonKey, supabaseUrl } from './config.js';

export function createClient() {
  assertSupabaseConfig();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (_error) {
          // Server Components cannot write cookies; middleware refreshes sessions.
        }
      },
    },
  });
}
