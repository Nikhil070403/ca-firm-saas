const mongoose = require('mongoose');

/**
 * Cross-cutting audit trail / timeline feed. Lives outside `features/`
 * (unlike module-owned models) because every module writes to it — CRM,
 * Clients, Billing, Tasks, Reminders all log here via the shared
 * `activityLogService.record()` helper (Phase 4), so it can't be owned by
 * any single feature without creating a circular dependency.
 */
const activityLogSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['lead', 'client', 'task', 'invoice', 'reminder', 'document', 'user'],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ firmId: 1, entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
