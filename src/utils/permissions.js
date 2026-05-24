const ALL_PERMISSIONS = [
  'families:view',
  'families:edit',
  'families:delete',
  'users:manage',
  'dashboard:view',
];

const ROLE_PERMISSIONS = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: ['families:view', 'families:edit', 'dashboard:view'],
  assistant: ['families:view', 'dashboard:view'],
};

const ADMIN_ROLES = ['admin', 'superadmin'];

const getEffectivePermissions = (user) => {
  if (!user) return [];
  if (ADMIN_ROLES.includes(user.role)) {
    return [...ALL_PERMISSIONS];
  }
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  const custom = Array.isArray(user.permissions) ? user.permissions : [];
  return [...new Set([...rolePerms, ...custom])];
};

const hasPermission = (user, permission) => {
  const perms = getEffectivePermissions(user);
  return perms.includes(permission);
};

const isAdminRole = (role) => ADMIN_ROLES.includes(role);

module.exports = {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  ADMIN_ROLES,
  getEffectivePermissions,
  hasPermission,
  isAdminRole,
};
