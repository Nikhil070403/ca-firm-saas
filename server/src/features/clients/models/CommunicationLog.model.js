const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * Unified communication timeline entry for a client — calls, emails,
 * meetings, WhatsApp messages and internal notes all live in one collection
 * so the client profile can render a single chronological feed instead of
 * joining several sources.
 */
const communicationLogSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'whatsapp', 'note'],
      required: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound', null],
      default: null,
    },
    summary: { type: String, required: true, trim: true },
    details: { type: String, default: '' },
    occurredAt: { type: Date, required: true, default: Date.now },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

communicationLogSchema.plugin(auditPlugin, { compoundFirmIndex: false });
communicationLogSchema.index({ firmId: 1, clientId: 1, occurredAt: -1 });

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);
