const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * Running balance is computed and stored at write time (in the service
 * layer, inside a transaction) rather than derived on every read — ledgers
 * can have thousands of entries per client and recomputing on each GET
 * would not scale.
 */
const ledgerEntrySchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ['debit', 'credit', 'opening_balance', 'adjustment'],
      required: true,
    },
    // Only meaningful when entryType === 'adjustment' — needed to recompute
    // openingBalance for a date-ranged statement without re-walking every
    // prior entry in the ledger.
    direction: {
      type: String,
      enum: ['increase', 'decrease', null],
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
    runningBalance: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    reference: { type: String, default: null },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
      default: null,
    },
    entryDate: { type: Date, required: true, default: Date.now },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

ledgerEntrySchema.plugin(auditPlugin, { compoundFirmIndex: false });
ledgerEntrySchema.index({ firmId: 1, clientId: 1, entryDate: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
