/**
 * Mirrors server/src/middlewares/rbac.middleware.js — kept in sync by hand.
 * Role hierarchy: superadmin (platform owner, manages everyone including
 * other admins) > admin (the CA who owns this firm's panel, manages their
 * employees and clients) > employee (staff, scoped to assigned clients) >
 * client (the firm's customer — never gets Accounts, enforced server-side
 * too so this isn't just a hidden menu).
 */
export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin (CA)',
  employee: 'Employee',
  user: 'Employee', // legacy alias, pre-existing accounts only
  client: 'Client',
};

export function isAdminRole(role) {
  return role === 'admin' || role === 'superadmin';
}

export function isSuperAdmin(role) {
  return role === 'superadmin';
}

/** Whether `actorRole` is allowed to edit/deactivate/delete an account with `targetRole`. */
export function canManageTargetRole(actorRole, targetRole) {
  if (actorRole === 'superadmin') return true;
  if (actorRole === 'admin') return targetRole === 'employee' || targetRole === 'client' || targetRole === 'user';
  return false;
}

/** Roles an actor is allowed to assign when inviting or editing a member. */
export function assignableRoles(actorRole) {
  if (actorRole === 'superadmin') return ['superadmin', 'admin', 'employee', 'client'];
  if (actorRole === 'admin') return ['employee', 'client'];
  return [];
}

/**
 * Where a freshly-logged-in (or already-authenticated-but-navigating-to-/)
 * user lands. Clients skip the CRM/Khata/Accounts service launcher entirely
 * and go straight into their own Client Portal.
 */
export function homePathForUser(user) {
  return user?.role === 'client' ? '/portal' : '/services';
}
