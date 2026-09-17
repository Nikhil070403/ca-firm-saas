const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * One collection backs both sides of a client<->firm conversation.
 * `senderRole` is denormalized (rather than looked up from senderId's User
 * record on every render) so the thread UI can style "my message" vs
 * "their message" without an extra join, and so "unread" can be defined
 * simply as "unread messages sent by the OTHER role".
 */
const messageSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: { type: String, enum: ['staff', 'client'], required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.plugin(auditPlugin, { compoundFirmIndex: false });
messageSchema.index({ firmId: 1, clientId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
