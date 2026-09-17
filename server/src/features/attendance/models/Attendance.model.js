const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * One row per user per calendar day. `date` is a plain 'YYYY-MM-DD' string
 * (not a Date) so day-boundary queries/uniqueness never have to fight
 * timezone conversion — check-in/out timestamps still carry the real Date.
 */
const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
  },
  { timestamps: true }
);

attendanceSchema.plugin(auditPlugin, { compoundFirmIndex: false });
attendanceSchema.index({ firmId: 1, userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ firmId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
