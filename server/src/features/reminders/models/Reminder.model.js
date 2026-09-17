const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

const REMINDER_CATEGORIES = [
  'gst_return', 'it_return', 'tds', 'roc_filing', 'audit', 'renewal', 'license', 'custom',
];

const RECURRENCE_TYPES = ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

const reminderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: REMINDER_CATEGORIES, default: 'custom' },
    description: { type: String, default: '' },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    dueDate: { type: Date, required: true, index: true },
    recurrence: { type: String, enum: RECURRENCE_TYPES, default: 'none' },
    // For recurring reminders, each occurrence is its own document generated
    // by the cron job in jobs/generateRecurringReminders.job.js; this links
    // an occurrence back to the template that spawned it.
    recurrenceParentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      default: null,
    },
    channels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'completed', 'dismissed', 'overdue'],
      default: 'pending',
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reminderSchema.plugin(auditPlugin);
reminderSchema.index({ firmId: 1, dueDate: 1, status: 1 });

reminderSchema.statics.CATEGORIES = REMINDER_CATEGORIES;
reminderSchema.statics.RECURRENCE_TYPES = RECURRENCE_TYPES;

module.exports = mongoose.model('Reminder', reminderSchema);
