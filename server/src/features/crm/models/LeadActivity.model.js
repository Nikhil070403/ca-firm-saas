const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * Single collection for follow-ups, notes, meetings, calls and email logs
 * against a Lead — `type` distinguishes them so the CRM timeline can render
 * one feed instead of joining five collections.
 */
const leadActivitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['note', 'call', 'meeting', 'email', 'follow_up', 'status_change'],
      required: true,
    },
    summary: { type: String, required: true, trim: true },
    details: { type: String, default: '' },
    scheduledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

leadActivitySchema.plugin(auditPlugin, { compoundFirmIndex: false });
leadActivitySchema.index({ firmId: 1, leadId: 1, createdAt: -1 });

module.exports = mongoose.model('LeadActivity', leadActivitySchema);
