const mongoose = require('mongoose');

/**
 * One document per delivery attempt per channel per recipient, so we can
 * tell "reminder sent by email but WhatsApp channel isn't wired yet" apart
 * from "reminder never fired". In-app notifications (bell icon) are also
 * rows here with channel: 'in_app'.
 */
const notificationSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
    // Exactly one of userId (in-app/staff notifications) or clientId
    // (compliance/billing messages to the firm's clients) is set.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'whatsapp'],
      default: 'in_app',
    },
    type: {
      type: String,
      enum: [
        'reminder_due', 'task_assigned', 'task_comment', 'invoice_overdue',
        'lead_followup', 'system', 'compliance_reminder', 'compliance_filed',
        'tax_payable', 'invoice_followup',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: null },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    sourceType: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'read'],
      default: 'pending',
      index: true,
    },
    readAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ firmId: 1, userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
