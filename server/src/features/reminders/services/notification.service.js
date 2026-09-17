const notificationRepository = require('../repositories/notification.repository');
const { sendMail } = require('../../../config/mailer');

/**
 * Shared by every module that needs to notify a user (reminders, tasks,
 * invoices) — always creates the in_app row (feeds the bell icon), and
 * optionally sends an email in parallel when `email` is provided.
 */
async function notify({ firmId, userId, type, title, message, link, sourceId, sourceType, email }) {
  const inApp = await notificationRepository.create({
    firmId, userId, type, title, message, link, sourceId, sourceType, channel: 'in_app', status: 'sent', sentAt: new Date(),
  });

  if (email) {
    try {
      await sendMail({ to: email, subject: title, html: `<p>${message}</p>${link ? `<p><a href="${link}">View</a></p>` : ''}` });
      await notificationRepository.create({
        firmId, userId, type, title, message, link, sourceId, sourceType, channel: 'email', status: 'sent', sentAt: new Date(),
      });
    } catch (err) {
      await notificationRepository.create({
        firmId, userId, type, title, message, link, sourceId, sourceType, channel: 'email', status: 'failed', error: err.message,
      });
    }
  }

  return inApp;
}

async function listMine(firmId, userId, query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const [items, total, unreadCount] = await notificationRepository.listForUser(firmId, userId, {
    page,
    limit,
    unreadOnly: query.unreadOnly === 'true',
    type: query.type || null,
  });
  return { items, page, limit, total, unreadCount };
}

async function markRead(firmId, userId, id) {
  return notificationRepository.markRead(firmId, userId, id);
}

async function markAllRead(firmId, userId) {
  return notificationRepository.markAllRead(firmId, userId);
}

module.exports = { notify, listMine, markRead, markAllRead };
