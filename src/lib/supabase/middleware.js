import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { assertSupabaseConfig, supabaseAnonKey, supabaseUrl } from './config.js';

export async function createMiddlewareClient(request) {
  assertSupabaseConfig();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  /* Fast path: getSession() reads and reassembles the auth cookies locally —
     no network round-trip. It returns null for expired sessions, in which
     case we fall back to getUser(), which re-validates and refreshes tokens
     server-side. Data access itself is protected by RLS; the middleware
     only makes routing decisions, so an unverified-but-unexpired local
     session is safe to route on. */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return { supabase, user: session.user, response };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response };
}
