const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, trim: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMode: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'],
      default: 'bank_transfer',
    },
    paymentReference: { type: String, default: null },
    receivedDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

receiptSchema.plugin(auditPlugin);
receiptSchema.index({ firmId: 1, receiptNumber: 1 }, { unique: true });

module.exports = mongoose.model('Receipt', receiptSchema);
