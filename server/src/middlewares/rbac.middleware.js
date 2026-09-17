const AppError = require('../utils/AppError');

/**
 * Capability-based, not role-name-based: route code asks `authorize('client:delete')`,
 * never `if (role === 'admin')`. Adding a role or changing what a role can do
 * only means editing ROLE_CAPABILITIES below — no route file changes.
 *
 * Role hierarchy: superadmin (platform owner) and admin (the CA who owns the
 * firm) both get every capability — see `canManageTargetRole` below for the
 * distinction between them, which is about *who they can edit*, not what
 * modules they can use. employee is staff: full day-to-day CRUD, no deletes,
 * no settings/user management, and (enforced in client.service /
 * lead.service) only sees records assigned to them.
 *
 * client is the firm's CUSTOMER, not staff — they get almost NO general
 * capabilities at all. Their only sanctioned window into the firm's data is
 * the Client Portal (`features/portal/`), which reads the service layer
 * directly (bypassing `authorize()` entirely) and hard-scopes every query to
 * their own `linkedClientId`. If clients kept `client:read`/`lead:read`/etc.
 * here, a client's access token could call `GET /clients` or `GET /leads`
 * directly and see the WHOLE firm's client list — exactly what the portal
 * exists to prevent. Keep this list minimal on purpose.
 */
const CAPABILITIES = [
  'client:read', 'client:create', 'client:update', 'client:delete',
  'lead:read', 'lead:create', 'lead:update', 'lead:delete',
  'ledger:read', 'ledger:create', 'ledger:update', 'ledger:delete',
  'reminder:read', 'reminder:create', 'reminder:update', 'reminder:delete',
  'task:read', 'task:create', 'task:update', 'task:delete',
  'invoice:read', 'invoice:create', 'invoice:update', 'invoice:delete',
  'expense:read', 'expense:create', 'expense:update', 'expense:delete',
  'document:read', 'document:create', 'document:update', 'document:delete',
  'report:read', 'report:export',
  'settings:read', 'settings:update',
  'user:read', 'user:create', 'user:update', 'user:delete',
  'dashboard:read',
];

const STAFF_CAPABILITIES = CAPABILITIES.filter(
  (cap) => !cap.endsWith(':delete') && !cap.startsWith('settings:') && !cap.startsWith('user:')
).concat(['user:read']);

// Clients get almost nothing at the general API layer — their sanctioned
// data path is the Client Portal (features/portal/), which reads services
// directly and hard-scopes to their own linkedClientId. Granting client:read,
// lead:read, ledger:read, task:read, document:read etc. here would let a
// client's token call GET /clients or GET /leads directly and see every
// record in the firm, not just their own. 'user:read' is kept only so a
// client can resolve a teammate/staff-contact reference (e.g. UserLink)
// if the UI ever surfaces one; it carries no client/firm data.
const CLIENT_CAPABILITIES = ['user:read'];

const ROLE_CAPABILITIES = {
  superadmin: ['*'],
  admin: ['*'],
  employee: STAFF_CAPABILITIES,
  user: STAFF_CAPABILITIES, // legacy alias for pre-existing accounts
  client: CLIENT_CAPABILITIES,
};

function can(role, capability) {
  const granted = ROLE_CAPABILITIES[role];
  if (!granted) return false;
  return granted.includes('*') || granted.includes(capability);
}

/**
 * Who may edit a given target account. superadmin manages everyone. admin
 * manages employees and clients but not other admins/superadmins (or
 * themselves via this path — role escalation is never allowed here).
 * Everyone else has no user-management rights at all (enforced already by
 * lacking user:update/user:delete, this is the finer-grained same-firm rule
 * on top of that).
 */
function canManageTargetRole(actorRole, targetRole) {
  if (actorRole === 'superadmin') return true;
  if (actorRole === 'admin') return targetRole === 'employee' || targetRole === 'client' || targetRole === 'user';
  return false;
}

/** Mirrors client/src/constants/roles.js isAdminRole() — partner-level actions
 * (document approval, team management, firm settings) gate on this, not on
 * any single capability, since neither role needs a *new* capability to
 * unlock them. */
function isAdminRole(role) {
  return role === 'admin' || role === 'superadmin';
}

/** Roles an actor is allowed to assign to a new or edited account. */
function assignableRoles(actorRole) {
  if (actorRole === 'superadmin') return ['superadmin', 'admin', 'employee', 'client'];
  if (actorRole === 'admin') return ['employee', 'client'];
  return [];
}

/** Route guard for the (rare) actions gated on admin/superadmin ROLE rather
 * than a capability — e.g. document approval, where employee already holds
 * document:update for everyday edits but partner sign-off is a different,
 * stricter gate. */
function requireAdminRole(req, res, next) {
  if (!req.user) return next(AppError.unauthorized());
  if (!isAdminRole(req.user.role)) return next(AppError.forbidden('This action requires an admin or superadmin account'));
  next();
}

function authorize(...requiredCapabilities) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user) return next(AppError.unauthorized());
    const hasAll = requiredCapabilities.every((cap) => can(req.user.role, cap));
    if (!hasAll) return next(AppError.forbidden('You do not have permission to perform this action'));
    next();
  };
}

module.exports = {
  authorize, requireAdminRole, can, canManageTargetRole, assignableRoles, isAdminRole, CAPABILITIES, ROLE_CAPABILITIES,
};
