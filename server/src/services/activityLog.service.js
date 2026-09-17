const ActivityLog = require('../models/ActivityLog.model');

/**
 * Cross-cutting — every feature service calls record() instead of writing
 * to ActivityLog directly, so entries stay consistent. Fire-and-forget:
 * failures here must never fail the calling operation, so callers should
 * not await this inside a transaction-critical path without a try/catch.
 */
async function record({ firmId, entityType, entityId, action, description, performedBy, metadata }) {
  return ActivityLog.create({ firmId, entityType, entityId, action, description, performedBy, metadata });
}

async function listForEntity(firmId, entityType, entityId, { limit = 50 } = {}) {
  return ActivityLog.find({ firmId, entityType, entityId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('performedBy', 'name email avatarUrl');
}

async function listRecentForFirm(firmId, { limit = 20 } = {}) {
  return ActivityLog.find({ firmId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('performedBy', 'name email avatarUrl');
}

module.exports = { record, listForEntity, listRecentForFirm };
