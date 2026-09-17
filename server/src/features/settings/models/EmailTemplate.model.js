const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
    key: {
      type: String,
      enum: ['welcome', 'password_reset', 'email_verification', 'reminder_due', 'invoice_issued', 'task_assigned'],
      required: true,
    },
    subject: { type: String, required: true },
    // Body supports {{placeholders}} resolved by the mailer service at send time.
    bodyHtml: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

emailTemplateSchema.index({ firmId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
