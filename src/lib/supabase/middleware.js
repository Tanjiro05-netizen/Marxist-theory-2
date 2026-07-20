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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response };
}
