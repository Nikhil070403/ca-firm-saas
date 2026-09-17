const messageRepository = require('../repositories/message.repository');
const AppError = require('../../../utils/AppError');
const notificationService = require('../../reminders/services/notification.service');
const Client = require('../../clients/models/Client.model');
const User = require('../../auth/models/User.model');

const MAX_BODY_LENGTH = 4000;

async function listThread(firmId, clientId, { limit = 50 } = {}) {
  const messages = await messageRepository.listForClient(firmId, clientId, { limit });
  return messages.reverse();
}

// "Unread" for a given viewer role means: unread messages sent by the OTHER
// role. A staff member's own unread count only ever counts client-authored
// messages, never their own.
async function unreadCount(firmId, clientId, forRole) {
  const senderRole = forRole === 'staff' ? 'client' : 'staff';
  return messageRepository.countUnread(firmId, clientId, senderRole);
}

async function sendMessage(firmId, clientId, senderId, senderRole, body) {
  if (!body || !body.trim()) throw AppError.badRequest('Message cannot be empty');
  const trimmed = body.trim().slice(0, MAX_BODY_LENGTH);

  const message = await messageRepository.create(firmId, { clientId, senderId, senderRole, body: trimmed });

  if (senderRole === 'staff') {
    const clientUser = await User.findOne({ firmId, linkedClientId: clientId, role: 'client', isDeleted: false }).select('_id');
    if (clientUser) {
      notificationService.notify({
        firmId,
        userId: clientUser._id,
        type: 'system',
        title: 'New message from your firm',
        message: trimmed.slice(0, 140),
        link: '/portal/messages',
        sourceId: message._id,
        sourceType: 'message',
      }).catch(() => {});
    }
  } else {
    const client = await Client.findOne({ _id: clientId, firmId, isDeleted: false }).select('displayName assignedTo');
    if (client?.assignedTo) {
      notificationService.notify({
        firmId,
        userId: client.assignedTo,
        type: 'system',
        title: `New message from ${client.displayName}`,
        message: trimmed.slice(0, 140),
        link: `/crm/clients/${clientId}`,
        sourceId: message._id,
        sourceType: 'message',
      }).catch(() => {});
    }
  }

  return message;
}

async function markRead(firmId, clientId, readerRole) {
  const otherRole = readerRole === 'staff' ? 'client' : 'staff';
  await messageRepository.markReadForSender(firmId, clientId, otherRole);
}

module.exports = { listThread, unreadCount, sendMessage, markRead };
