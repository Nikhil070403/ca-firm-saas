const User = require('../features/auth/models/User.model');
const notificationService = require('../features/reminders/services/notification.service');

// Fans a notification out to every admin/superadmin in the firm except the
// actor who triggered it. Used by approval workflows (documents, expenses)
// so a partner finds out the moment something needs their sign-off.
async function notifyFirmAdmins(firmId, excludeUserId, { title, message, link, sourceId, sourceType }) {
  const admins = await User.find({
    firmId,
    role: { $in: ['admin', 'superadmin'] },
    isActive: true,
    isDeleted: false,
    _id: { $ne: excludeUserId },
  }).select('_id');

  await Promise.all(admins.map((admin) => notificationService.notify({
    firmId,
    userId: admin._id,
    type: 'system',
    title,
    message,
    link,
    sourceId,
    sourceType,
  })));
}

module.exports = { notifyFirmAdmins };
