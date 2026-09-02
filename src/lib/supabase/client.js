'use client';

import { createBrowserClient } from '@supabase/ssr';
import { assertSupabaseConfig, supabaseAnonKey, supabaseUrl } from './config.js';

let browserClient;

export function createClient() {
  assertSupabaseConfig();

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
