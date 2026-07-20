import { NextResponse } from 'next/server';
import {
  DEV_ADMIN_PROFILE,
  DEV_AUTH_COOKIE_KEY,
  isLocalDevelopmentHost,
} from './src/lib/auth.js';
import { getRouteAccessDecision, isAdminPath, isProtectedPath } from './src/lib/route-access.js';
import { createMiddlewareClient } from './src/lib/supabase/middleware.js';

const redirectTo = (request, pathname) => NextResponse.redirect(new URL(pathname, request.url));

const loadProfileForRouteAccess = async (supabase, user) => {
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) return data;
  } catch (_error) {
    // Fall through to the SECURITY DEFINER role helper below.
  }

  try {
    const { data: role, error } = await supabase.rpc('get_user_role');
    if (!error && role) return { id: user.id, role };
  } catch (_error) {
    // No usable profile signal; route-access will deny admin-only paths.
  }

  return null;
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
