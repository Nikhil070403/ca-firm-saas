const mongoose = require('mongoose');

const firmSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    panNumber: { type: String, trim: true, uppercase: true },
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
    logoUrl: { type: String, default: null },
    // White-label accent — applied as the --color-primary CSS variable
    // across the whole shell (sidebar, buttons, links) once the branding
    // endpoint is fetched. Hex only, validated at the API boundary.
    primaryColor: { type: String, default: null },
    notificationPreferences: {
      emailReminders: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: true },
    },
    // Toggles read by the cron jobs and a few service-layer call sites
    // (utils/firmAutomation.js) before they act — turning a rule off here
    // genuinely stops the behavior, it isn't cosmetic.
    automationRules: {
      gstReminders: { type: Boolean, default: true },
      yearlyReminders: { type: Boolean, default: true },
      invoiceFollowUps: { type: Boolean, default: true },
      taskAssignmentNotify: { type: Boolean, default: true },
      documentUploadNotify: { type: Boolean, default: true },
    },
    financialYearStartMonth: { type: Number, default: 4, min: 1, max: 12 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Firm', firmSchema);
