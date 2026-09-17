const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

const contactPersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

const clientSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true },
    firmType: {
      type: String,
      enum: ['individual', 'proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'huf', 'trust', 'other'],
      default: 'individual',
    },
    gstNumber: { type: String, trim: true, uppercase: true, default: null },
    panNumber: { type: String, trim: true, uppercase: true, default: null },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    contactPersons: [contactPersonSchema],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: '' },
    // Which statutory filings this client needs — the compliance cron reads
    // this to auto-generate ComplianceReturn rows each period.
    compliance: {
      gstFrequency: { type: String, enum: ['monthly', 'quarterly', null], default: null },
      itrForm: { type: String, enum: ['itr1', 'itr2', 'itr3', 'itr4', 'itr5', 'itr6', null], default: null },
      gstr9c: { type: Boolean, default: false },
      roc: { type: Boolean, default: false },
      audit: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

clientSchema.plugin(auditPlugin);

clientSchema.index({ firmId: 1, displayName: 'text', gstNumber: 'text', panNumber: 'text' });

module.exports = mongoose.model('Client', clientSchema);
