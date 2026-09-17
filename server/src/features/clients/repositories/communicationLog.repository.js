const CommunicationLog = require('../models/CommunicationLog.model');

const communicationLogRepository = {
  create(firmId, data) {
    return CommunicationLog.create({ ...data, firmId });
  },

  listForClient(firmId, clientId, { limit = 100 } = {}) {
    return CommunicationLog.find({ firmId, clientId, isDeleted: false })
      .sort({ occurredAt: -1 })
      .limit(limit)
      .populate('performedBy', 'name email avatarUrl');
  },
};

module.exports = communicationLogRepository;
