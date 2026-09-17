const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * Line items snapshot description/rate at time of billing rather than
 * referencing a live "service" record — a later price change must never
 * retroactively alter an already-issued invoice.
 */
const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true, timestamps: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    lineItems: { type: [lineItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxTotal: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    notes: { type: String, default: '' },
    // Set once by the invoice follow-up cron (10 days after issue, if unpaid)
    // so the client is never nagged twice for the same invoice.
    followUpSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

invoiceSchema.plugin(auditPlugin);
invoiceSchema.index({ firmId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ firmId: 1, status: 1, dueDate: 1 });

invoiceSchema.virtual('outstandingAmount').get(function outstandingAmount() {
  return this.grandTotal - this.amountPaid;
});

invoiceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
