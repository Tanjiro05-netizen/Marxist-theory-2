import {
  canProfileManagePolitics,
  canProfileManageStudy,
  isAdminProfile,
  isAdminUser,
} from './auth.js';

const PROTECTED_PREFIXES = [
  '/theory',
  '/analysis',
  '/article',
  '/profile',
  '/directory',
  '/glossary',
  '/study',
  '/science-tech',
  '/politics',
  '/visualizations',
  '/knowledge',
];

export const isProtectedPath = (pathname) =>
  PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const isAdminPath = (pathname) => pathname === '/admin' || pathname.startsWith('/admin/');

export const getRouteAccessDecision = (pathname, { user, profile, isDevAdmin = false } = {}) => {
  const hasAdminAccess = isDevAdmin || isAdminProfile(profile) || isAdminUser(user);

  if (!isProtectedPath(pathname) && !isAdminPath(pathname)) {
    return { allowed: true, redirectTo: null };
  }

  if (!isDevAdmin && !user) {
    return { allowed: false, redirectTo: '/login' };
  }

  if (isAdminPath(pathname)) {
    if (pathname === '/admin/politics/upload') {
      return hasAdminAccess || canProfileManagePolitics(profile)
        ? { allowed: true, redirectTo: null }
        : { allowed: false, redirectTo: '/coming-soon' };
    }

    if (pathname === '/admin/study') {
      return hasAdminAccess || canProfileManageStudy(profile)
        ? { allowed: true, redirectTo: null }
        : { allowed: false, redirectTo: '/coming-soon' };
    }

    return hasAdminAccess
      ? { allowed: true, redirectTo: null }
      : { allowed: false, redirectTo: '/coming-soon' };
  }

  if (!hasAdminAccess && !profile?.has_invite_access) {
    return { allowed: false, redirectTo: '/pending-access' };
  }

  return { allowed: true, redirectTo: null };
};
