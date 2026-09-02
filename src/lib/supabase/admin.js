import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { assertSupabaseConfig, supabaseUrl } from './config.js';

let adminClient;

export const createAdminClient = () => {
  assertSupabaseConfig();

  const serviceRoleKey = `${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`.trim();
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for secure manuscript intake.');
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
};
