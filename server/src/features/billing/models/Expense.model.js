const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['office', 'travel', 'software', 'salary', 'rent', 'utilities', 'professional_fees', 'other'],
      default: 'other',
    },
    amount: { type: Number, required: true, min: 0.01 },
    // Splits the expense into the Cash Book vs Bank Book in Khata.
    paymentMode: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'],
      default: 'cash',
    },
    expenseDate: { type: Date, required: true, default: Date.now },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiptDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    notes: { type: String, default: '' },
    // Same shape/rules as Document.approvalStatus — 'not_required' unless
    // the submitter flags it, admin/superadmin-only to decide either way.
    approvalStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

expenseSchema.plugin(auditPlugin);
expenseSchema.index({ firmId: 1, category: 1, expenseDate: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
