import { NextResponse } from 'next/server';
import {
  DEV_ADMIN_PROFILE,
  DEV_AUTH_COOKIE_KEY,
  isLocalDevelopmentHost,
} from './lib/auth.js';
import { getRouteAccessDecision, isAdminPath, isProtectedPath } from './lib/route-access.js';
import { createMiddlewareClient } from './lib/supabase/middleware.js';

const redirectTo = (request, pathname) => NextResponse.redirect(new URL(pathname, request.url));

/* Per-instance profile cache. The middleware runs on every navigation and
   prefetch; without this, each one pays a profiles query (plus RPC
   fallback). 60s staleness on role/invite changes is the trade — actual
   data protection is enforced by RLS, this only gates routing. */
const PROFILE_CACHE_TTL_MS = 60_000;
const profileCache = new Map(); // userId -> { profile, expiresAt }

const loadProfileForRouteAccess = async (supabase, user) => {
  if (!user) return null;

  const cached = profileCache.get(user.id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.profile;
  }

  let profile = null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) profile = data;
  } catch (_error) {
    // Fall through to the SECURITY DEFINER role helper below.
  }

  if (!profile) {
    try {
      const { data: role, error } = await supabase.rpc('get_user_role');
      if (!error && role) profile = { id: user.id, role };
    } catch (_error) {
      // No usable profile signal; route-access will deny admin-only paths.
    }
  }

  if (profile) {
    profileCache.set(user.id, { profile, expiresAt: Date.now() + PROFILE_CACHE_TTL_MS });
  }
  return profile;
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host')?.split(':')[0] || '';
  const hasDevAdminCookie =
    isLocalDevelopmentHost(host) && request.cookies.get(DEV_AUTH_COOKIE_KEY)?.value === 'true';

  if (!isProtectedPath(pathname) && !isAdminPath(pathname)) {
    return NextResponse.next();
  }

  let user = null;
  let profile = hasDevAdminCookie ? DEV_ADMIN_PROFILE : null;
  let response = NextResponse.next({ request });

  if (!hasDevAdminCookie) {
    const middlewareClient = await createMiddlewareClient(request);
    user = middlewareClient.user;
    response = middlewareClient.response;

    if (user) {
      profile = await loadProfileForRouteAccess(middlewareClient.supabase, user);
    }
  }

  const decision = getRouteAccessDecision(pathname, {
    user,
    profile,
    isDevAdmin: hasDevAdminCookie,
  });

  return decision.allowed ? response : redirectTo(request, decision.redirectTo);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|site.webmanifest|robots.txt|service-worker.js|.*\\..*).*)',
  ],
};
