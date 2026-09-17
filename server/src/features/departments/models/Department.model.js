const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    headUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

departmentSchema.plugin(auditPlugin, { compoundFirmIndex: false });
departmentSchema.index({ firmId: 1, isDeleted: 1, name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
