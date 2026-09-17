const clientRepository = require('../repositories/client.repository');
const communicationLogRepository = require('../repositories/communicationLog.repository');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');
const activityLogService = require('../../../services/activityLog.service');

// Employees (and the legacy 'user' alias) only ever see clients assigned to
// them — admins/superadmin see everything, clients don't list other clients
// at all in this UI. `actor` is optional throughout this module: internal
// callers (invoice/receipt/ledger services doing a trusted existence check)
// pass none and get the unscoped lookup they've always gotten.
function isScopedRole(role) {
  return role === 'employee' || role === 'user';
}

async function listClients(firmId, query, actor) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['displayName', 'email', 'gstNumber', 'panNumber'],
    allowedFilters: ['status', 'firmType', 'assignedTo'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  if (actor && isScopedRole(actor.role)) {
    filter.assignedTo = actor.id; // overrides any assignedTo the caller tried to pass
  }
  const { items, total } = await clientRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: { path: 'assignedTo', select: 'name email avatarUrl' },
  });
  return { items, page, limit, total };
}

async function createClient(firmId, actorId, data) {
  const client = await clientRepository.create(firmId, { ...data, createdBy: actorId });
  await activityLogService.record({
    firmId,
    entityType: 'client',
    entityId: client._id,
    action: 'created',
    description: `Client "${client.displayName}" was created`,
    performedBy: actorId,
  });
  return client;
}

async function getClient(firmId, id, actor) {
  const client = await clientRepository.findById(firmId, id, {
    populate: { path: 'assignedTo', select: 'name email avatarUrl' },
  });
  if (!client) throw AppError.notFound('Client not found');
  // 404, not 403 — an employee scoped away from this client shouldn't learn
  // it exists at all.
  if (actor && isScopedRole(actor.role) && client.assignedTo?._id?.toString() !== actor.id.toString()) {
    throw AppError.notFound('Client not found');
  }
  return client;
}

async function updateClient(firmId, id, actorId, updates) {
  const client = await clientRepository.updateById(firmId, id, updates, { updatedBy: actorId });
  if (!client) throw AppError.notFound('Client not found');
  await activityLogService.record({
    firmId,
    entityType: 'client',
    entityId: client._id,
    action: 'updated',
    description: `Client "${client.displayName}" was updated`,
    performedBy: actorId,
  });
  return client;
}

async function deleteClient(firmId, id, actorId) {
  const client = await clientRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!client) throw AppError.notFound('Client not found');
  await activityLogService.record({
    firmId,
    entityType: 'client',
    entityId: client._id,
    action: 'deleted',
    description: `Client "${client.displayName}" was deleted`,
    performedBy: actorId,
  });
  return client;
}

async function addContactPerson(firmId, id, contact) {
  const client = await clientRepository.addContactPerson(firmId, id, contact);
  if (!client) throw AppError.notFound('Client not found');
  return client;
}

async function removeContactPerson(firmId, id, contactId) {
  const client = await clientRepository.removeContactPerson(firmId, id, contactId);
  if (!client) throw AppError.notFound('Client not found');
  return client;
}

async function getTimeline(firmId, id) {
  await getClient(firmId, id);
  return activityLogService.listForEntity(firmId, 'client', id);
}

async function listCommunications(firmId, id) {
  await getClient(firmId, id);
  return communicationLogRepository.listForClient(firmId, id);
}

async function logCommunication(firmId, id, actorId, data) {
  const client = await getClient(firmId, id);
  const entry = await communicationLogRepository.create(firmId, { ...data, clientId: id, performedBy: actorId });
  await activityLogService.record({
    firmId,
    entityType: 'client',
    entityId: client._id,
    action: 'communication_logged',
    description: `${data.type.replace(/_/g, ' ')} logged: ${data.summary}`,
    performedBy: actorId,
  });
  return entry;
}

async function bulkAssign(firmId, ids, assignedTo) {
  return clientRepository.bulkUpdate(firmId, ids, { assignedTo: assignedTo || null });
}

module.exports = {
  listClients,
  createClient,
  getClient,
  updateClient,
  deleteClient,
  addContactPerson,
  removeContactPerson,
  getTimeline,
  listCommunications,
  logCommunication,
  bulkAssign,
};
