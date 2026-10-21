import { cookies, headers } from 'next/headers';
import {
  DEV_ADMIN_PROFILE,
  DEV_ADMIN_USER,
  DEV_AUTH_COOKIE_KEY,
  isLocalDevelopmentHost,
} from './auth.js';
import { createClient } from './supabase/server.js';

const getHostname = () => {
  const host = headers().get('host') || '';
  return host.split(':')[0];
};

const loadProfile = async (supabase, user) => {
  if (!user) return null;

  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!error && data) return data;
  } catch (_error) {
    // Fall back to the SECURITY DEFINER role helper below.
  }

  try {
    const { data: role, error } = await supabase.rpc('get_user_role');
    if (!error && role) return { id: user.id, role };
  } catch (_error) {
    return null;
  }

  return null;
};

export async function getServerAuthState() {
  const cookieStore = cookies();
  const isLocalDevAdmin =
    isLocalDevelopmentHost(getHostname()) &&
    cookieStore.get(DEV_AUTH_COOKIE_KEY)?.value === 'true';

  if (isLocalDevAdmin) {
    return { user: DEV_ADMIN_USER, profile: DEV_ADMIN_PROFILE };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await loadProfile(supabase, user);

  return { user, profile };
}
