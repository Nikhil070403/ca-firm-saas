const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * A reusable workflow definition — "apply" it to a client to instantly
 * create a Task pre-populated with this checklist, instead of building the
 * same GST-filing/onboarding checklist from scratch every month.
 */
const taskTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    defaultPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    checklistItems: { type: [{ type: String, trim: true }], default: [] },
  },
  { timestamps: true }
);

taskTemplateSchema.plugin(auditPlugin, { compoundFirmIndex: false });
taskTemplateSchema.index({ firmId: 1, isDeleted: 1, name: 1 });

module.exports = mongoose.model('TaskTemplate', taskTemplateSchema);
