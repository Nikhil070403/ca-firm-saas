const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const Client = require('../../clients/models/Client.model');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');
const { signPurposeToken } = require('../../../utils/jwt');
const { sendMail } = require('../../../config/mailer');
const { passwordResetEmail } = require('../../../utils/emailTemplates');
const { canManageTargetRole, assignableRoles } = require('../../../middlewares/rbac.middleware');
const authRepository = require('../../auth/repositories/auth.repository');

// Clients never get the Accounts workspace — enforced here so it can never
// be reintroduced by an admin toggling allowedServices, whatever the UI does.
function sanitizeAllowedServices(role, allowedServices) {
  if (!Array.isArray(allowedServices)) return allowedServices;
  if (role === 'client') return allowedServices.filter((s) => s !== 'accounts');
  return allowedServices;
}

// `linkedClientId` only means anything for role==='client' (it's what scopes
// the Client Portal) — clear it for every other role so a role change away
// from client can't leave a stale link lying around, and confirm the id
// actually names a client in this firm before accepting it.
async function resolveLinkedClientId(firmId, role, linkedClientId) {
  if (role !== 'client') return null;
  if (!linkedClientId) return null;
  const client = await Client.findOne({ _id: linkedClientId, firmId, isDeleted: false }).select('_id');
  if (!client) throw AppError.badRequest('linkedClientId does not match a client in this firm');
  return client._id;
}

async function listUsers(firmId, query) {
  const { page, limit, skip, sort, searchClause } = parseListQuery(query, {
    searchableFields: ['name', 'email'],
    allowedFilters: ['role', 'isActive'],
  });
  const filter = { ...(query.role ? { role: query.role } : {}), ...(searchClause || {}) };
  const { items, total } = await userRepository.paginate(firmId, { filter, sort, skip, limit });
  return { items: items.map((u) => u.toSafeJSON()), page, limit, total };
}

async function createUser(firmId, actor, data) {
  if (!assignableRoles(actor.role).includes(data.role)) {
    throw AppError.forbidden(`You are not allowed to create a ${data.role} account`);
  }

  const existing = await userRepository.findByEmailInFirm(firmId, data.email);
  if (existing) throw AppError.conflict('A user with this email already exists in your firm');

  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = tempPassword;

  const linkedClientId = await resolveLinkedClientId(firmId, data.role, data.linkedClientId);

  const user = await userRepository.create(firmId, {
    name: data.name,
    email: data.email,
    role: data.role,
    allowedServices: sanitizeAllowedServices(data.role, data.allowedServices),
    linkedClientId,
    phone: data.phone,
    passwordHash,
    createdBy: actor.id,
  });

  // Invited users never see the random temp password — they set their own
  // via the same link/flow as "forgot password", which also verifies their
  // email (see auth.service.resetPassword).
  const token = signPurposeToken({ userId: user._id.toString() }, 'password_reset', '48h');
  const { subject, html } = passwordResetEmail(data.name, token);
  await sendMail({ to: data.email, subject, html });

  return user.toSafeJSON();
}

async function getUser(firmId, id) {
  const user = await userRepository.findById(firmId, id);
  if (!user) throw AppError.notFound('User not found');
  return user.toSafeJSON();
}

const UPDATABLE_FIELDS = ['name', 'email', 'role', 'phone', 'avatarUrl', 'allowedServices', 'linkedClientId', 'departmentId'];

/**
 * Shared guard for update/deactivate/delete: superadmin manages anyone,
 * admin manages employees/clients only (never another admin, never
 * themselves-into-a-higher-role), everyone else has no path here at all
 * (they lack user:update/user:delete already, this is the finer same-firm
 * rule on top of that).
 */
async function assertCanManage(firmId, actor, targetId) {
  const target = await userRepository.findById(firmId, targetId);
  if (!target) throw AppError.notFound('User not found');
  if (!canManageTargetRole(actor.role, target.role)) {
    throw AppError.forbidden('You do not have permission to manage this account');
  }
  return target;
}

async function updateUser(firmId, id, actor, rawUpdates) {
  const target = await assertCanManage(firmId, actor, id);

  // Whitelist, never blacklist: a PATCH body must not be able to touch
  // passwordHash, isEmailVerified or any other sensitive field.
  const updates = Object.fromEntries(
    Object.entries(rawUpdates).filter(([key]) => UPDATABLE_FIELDS.includes(key))
  );

  // Password reset by an admin. Deliberately OUTSIDE the whitelist — the raw
  // value is consumed here (stored as-is in this demo build) and the reset is
  // already gated by assertCanManage above, so an admin can set a new
  // password only for accounts they manage (their employees/clients; a
  // superadmin for anyone). Every session of the target is revoked so the
  // old password can't live on in an open tab somewhere.
  const passwordChanged = typeof rawUpdates.password === 'string' && rawUpdates.password.length > 0;
  if (passwordChanged) {
    updates.passwordHash = rawUpdates.password;
  }

  if (updates.role && updates.role !== target.role) {
    if (!assignableRoles(actor.role).includes(updates.role)) {
      throw AppError.forbidden(`You are not allowed to assign the ${updates.role} role`);
    }
  }

  const effectiveRole = updates.role || target.role;
  if (updates.allowedServices) {
    updates.allowedServices = sanitizeAllowedServices(effectiveRole, updates.allowedServices);
  }
  if ('linkedClientId' in updates || (updates.role && updates.role !== 'client')) {
    updates.linkedClientId = await resolveLinkedClientId(firmId, effectiveRole, updates.linkedClientId ?? target.linkedClientId);
  }

  if (updates.email) {
    updates.email = updates.email.toLowerCase();
    const existing = await userRepository.findByEmailAnywhere(updates.email);
    if (existing && existing._id.toString() !== id.toString()) {
      throw AppError.conflict('Another account already uses this email');
    }
    // A changed address hasn't been verified — reset the flag (login is not
    // blocked by verification, so this never locks anyone out).
    if (target.email !== updates.email) updates.isEmailVerified = false;
  }

  const user = await userRepository.updateById(firmId, id, updates, { updatedBy: actor.id });
  if (!user) throw AppError.notFound('User not found');

  if (passwordChanged) {
    await authRepository.revokeAllUserRefreshTokens(user._id);
  }

  return user.toSafeJSON();
}

async function setActiveStatus(firmId, id, actor, isActive) {
  await assertCanManage(firmId, actor, id);
  const user = await userRepository.updateById(firmId, id, { isActive }, { updatedBy: actor.id });
  if (!user) throw AppError.notFound('User not found');
  return user.toSafeJSON();
}

async function deleteUser(firmId, id, actor) {
  await assertCanManage(firmId, actor, id);
  const user = await userRepository.softDelete(firmId, id, { deletedBy: actor.id });
  if (!user) throw AppError.notFound('User not found');
  return user.toSafeJSON();
}

module.exports = { listUsers, createUser, getUser, updateUser, setActiveStatus, deleteUser };
