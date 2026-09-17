const Message = require('../models/Message.model');

const messageRepository = {
  create(firmId, data) {
    return Message.create({ ...data, firmId });
  },

  // Fetches newest-first (so `limit` caps at the most recent N), caller
  // reverses to chronological order for display.
  listForClient(firmId, clientId, { limit = 50 } = {}) {
    return Message.find({ firmId, clientId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'name avatarUrl role');
  },

  countUnread(firmId, clientId, senderRole) {
    return Message.countDocuments({ firmId, clientId, senderRole, readAt: null, isDeleted: false });
  },

  markReadForSender(firmId, clientId, senderRole) {
    return Message.updateMany({ firmId, clientId, senderRole, readAt: null }, { readAt: new Date() });
  },
};

module.exports = messageRepository;
