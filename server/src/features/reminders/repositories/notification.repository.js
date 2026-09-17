const Notification = require('../models/Notification.model');

const notificationRepository = {
  create(data) {
    return Notification.create(data);
  },

  listForUser(firmId, userId, { page = 1, limit = 20, unreadOnly = false, type = null } = {}) {
    const filter = { firmId, userId, channel: 'in_app' };
    if (unreadOnly) filter.status = { $ne: 'read' };
    if (type) filter.type = type;
    const skip = (page - 1) * limit;
    return Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, status: { $ne: 'read' } }),
    ]);
  },

  markRead(firmId, userId, id) {
    return Notification.findOneAndUpdate(
      { _id: id, firmId, userId },
      { status: 'read', readAt: new Date() },
      { new: true }
    );
  },

  markAllRead(firmId, userId) {
    return Notification.updateMany(
      { firmId, userId, status: { $ne: 'read' } },
      { status: 'read', readAt: new Date() }
    );
  },
};

module.exports = notificationRepository;
