const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

// Pipeline stages plus telecalling outcomes (callback / no_answer /
// not_interested) so the CRM can offer per-status workboards.
const LEAD_STATUSES = [
  'new', 'contacted', 'callback', 'qualified', 'proposal', 'negotiation',
  'no_answer', 'not_interested', 'won', 'lost',
];

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    source: {
      type: String,
      enum: ['referral', 'website', 'social_media', 'walk_in', 'cold_call', 'advertisement', 'other'],
      default: 'other',
    },
    status: { type: String, enum: LEAD_STATUSES, default: 'new', index: true },
    pipelineStage: { type: Number, default: 0 },
    estimatedValue: { type: Number, default: 0, min: 0 },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    convertedClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    convertedAt: { type: Date, default: null },
    lostReason: { type: String, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

leadSchema.plugin(auditPlugin);

leadSchema.statics.STATUSES = LEAD_STATUSES;

module.exports = mongoose.model('Lead', leadSchema);
