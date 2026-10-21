export const DEV_ADMIN_USER = { id: 'dev-admin', email: 'admin@localhost', role: 'authenticated' };
export const DEV_ADMIN_PROFILE = { id: 'dev-admin', username: 'DevAdmin', role: 'admin', is_admin: true };
export const DEV_ADMIN_PASSWORD = 'admin123';
export const DEV_AUTH_STORAGE_KEY = 'marxist_dev_auth';
export const DEV_AUTH_COOKIE_KEY = 'marxist_dev_auth';

export const normalizeRoleToken = (value) => `${value || ''}`.trim().toLowerCase();

const truthyRoleFlag = (value) =>
  value === true || ['true', '1', 'yes'].includes(normalizeRoleToken(value));

const roleValues = (value) => {
  if (Array.isArray(value)) return value.map(normalizeRoleToken);
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(normalizeRoleToken);
  }
  return [normalizeRoleToken(value)];
};

const hasRoleToken = (value, roleName) => roleValues(value).includes(normalizeRoleToken(roleName));

export const isAdminProfile = (profile) =>
  truthyRoleFlag(profile?.is_admin) ||
  hasRoleToken(profile?.role, 'admin') ||
  hasRoleToken(profile?.roles, 'admin') ||
  hasRoleToken(profile?.app_role, 'admin');

export const isAdminUser = (user) => {
  const metadata = user?.app_metadata || {};

  return (
    truthyRoleFlag(metadata.is_admin) ||
    hasRoleToken(metadata.role, 'admin') ||
    hasRoleToken(metadata.roles, 'admin') ||
    hasRoleToken(metadata.app_role, 'admin')
  );
};

export const hasEditorialRoleInProfile = (profile, roleName) => {
  const normalizedTarget = normalizeRoleToken(roleName);
  if (!normalizedTarget) return false;

  const editorialRoles = Array.isArray(profile?.editorial_roles) ? profile.editorial_roles : [];
  const matchesEditorialArray = editorialRoles.some(
    (role) => normalizeRoleToken(role) === normalizedTarget
  );
  const matchesLegacyRole = normalizeRoleToken(profile?.role) === normalizedTarget;

  return matchesEditorialArray || matchesLegacyRole;
};

export const canProfileManagePolitics = (profile) =>
  isAdminProfile(profile) || hasEditorialRoleInProfile(profile, 'News');

export const canProfileManageStudy = (profile) =>
  isAdminProfile(profile) || hasEditorialRoleInProfile(profile, 'Teacher');

export const isLocalDevelopmentHost = (hostname) => {
  const currentHostname =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  const normalizedHostname = `${currentHostname || ''}`.trim().toLowerCase();

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '0.0.0.0' ||
    normalizedHostname === '::1' ||
    normalizedHostname === '[::1]' ||
    normalizedHostname.endsWith('.localhost')
  );
};
