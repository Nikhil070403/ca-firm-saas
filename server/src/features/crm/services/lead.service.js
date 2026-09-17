const leadRepository = require('../repositories/lead.repository');
const leadActivityRepository = require('../repositories/leadActivity.repository');
const clientService = require('../../clients/services/client.service');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');
const activityLogService = require('../../../services/activityLog.service');

// Employees (and the legacy 'user' alias) only see leads assigned to them —
// mirrors the same scoping in clients/services/client.service.js.
function isScopedRole(role) {
  return role === 'employee' || role === 'user';
}

async function listLeads(firmId, query, actor) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['name', 'company', 'email', 'phone'],
    allowedFilters: ['status', 'source', 'assignedTo'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  if (actor && isScopedRole(actor.role)) {
    filter.assignedTo = actor.id;
  }
  const { items, total } = await leadRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: { path: 'assignedTo', select: 'name email avatarUrl' },
  });
  return { items, page, limit, total };
}

async function getPipelineSummary(firmId) {
  return leadRepository.countByStatus(firmId);
}

async function getSourceSummary(firmId) {
  return leadRepository.countBySource(firmId);
}

async function getOwnerSummary(firmId) {
  return leadRepository.countByOwner(firmId);
}

async function listUpcomingFollowUps(firmId) {
  return leadActivityRepository.listUpcoming(firmId);
}

async function completeFollowUp(firmId, activityId) {
  const activity = await leadActivityRepository.markCompleted(firmId, activityId);
  if (!activity) throw AppError.notFound('Follow-up not found');
  return activity;
}

async function createLead(firmId, actorId, data) {
  return leadRepository.create(firmId, { ...data, createdBy: actorId });
}

async function getLead(firmId, id, actor) {
  const lead = await leadRepository.findById(firmId, id, {
    populate: { path: 'assignedTo', select: 'name email avatarUrl' },
  });
  if (!lead) throw AppError.notFound('Lead not found');
  if (actor && isScopedRole(actor.role) && lead.assignedTo?._id?.toString() !== actor.id.toString()) {
    throw AppError.notFound('Lead not found');
  }
  return lead;
}

async function updateLead(firmId, id, actorId, updates) {
  const previous = await getLead(firmId, id);
  const lead = await leadRepository.updateById(firmId, id, updates, { updatedBy: actorId });
  if (!lead) throw AppError.notFound('Lead not found');

  if (updates.status && updates.status !== previous.status) {
    await leadActivityRepository.create(firmId, {
      leadId: id,
      type: 'status_change',
      summary: `Status changed from ${previous.status} to ${updates.status}`,
      performedBy: actorId,
    });
  }
  return lead;
}

async function deleteLead(firmId, id, actorId) {
  const lead = await leadRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!lead) throw AppError.notFound('Lead not found');
  return lead;
}

async function addActivity(firmId, leadId, actorId, data) {
  await getLead(firmId, leadId);
  return leadActivityRepository.create(firmId, { ...data, leadId, performedBy: actorId });
}

async function listActivities(firmId, leadId) {
  await getLead(firmId, leadId);
  return leadActivityRepository.listForLead(firmId, leadId);
}

async function convertToClient(firmId, leadId, actorId, clientOverrides = {}) {
  const lead = await getLead(firmId, leadId);
  if (lead.convertedClientId) throw AppError.conflict('Lead has already been converted');

  const client = await clientService.createClient(firmId, actorId, {
    displayName: clientOverrides.displayName || lead.name,
    email: clientOverrides.email || lead.email,
    phone: clientOverrides.phone || lead.phone,
    assignedTo: lead.assignedTo,
    leadId: lead._id,
  });

  await leadRepository.updateById(firmId, leadId, {
    status: 'won',
    convertedClientId: client._id,
    convertedAt: new Date(),
  });

  await activityLogService.record({
    firmId,
    entityType: 'lead',
    entityId: lead._id,
    action: 'converted',
    description: `Lead "${lead.name}" was converted to client "${client.displayName}"`,
    performedBy: actorId,
    metadata: { clientId: client._id },
  });

  return client;
}

async function bulkAssign(firmId, ids, assignedTo) {
  return leadRepository.bulkUpdate(firmId, ids, { assignedTo: assignedTo || null });
}

module.exports = {
  listLeads,
  getPipelineSummary,
  getSourceSummary,
  getOwnerSummary,
  listUpcomingFollowUps,
  completeFollowUp,
  createLead,
  getLead,
  updateLead,
  deleteLead,
  addActivity,
  listActivities,
  convertToClient,
  bulkAssign,
};
