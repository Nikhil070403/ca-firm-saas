const mongoose = require('mongoose');

// Role hierarchy: superadmin (platform owner — can edit anyone, including
// other admins) > admin (the CA who owns this firm — can edit any of their
// own employees and clients, not other admins/superadmin) > employee (staff
// — scoped to clients assigned to them, read-only on teammates) > client
// (the firm's customer — never gets the 'accounts' service, enforced in
// rbac.middleware + user.service regardless of allowedServices).
// 'user' is a legacy alias kept only so pre-existing accounts keep working;
// it is never offered as a choice in the UI — treat it as == employee.
const ROLES = ['superadmin', 'admin', 'employee', 'user', 'client'];
const SERVICES = ['crm', 'khata', 'accounts'];

const userSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'employee', index: true },
    // Which workspaces this member may open. Admins bypass this list and
    // always see all three; it only constrains non-admin roles.
    allowedServices: {
      type: [{ type: String, enum: SERVICES }],
      default: ['crm', 'khata'],
    },
    // For role==='client' only: which Client business record this login
    // represents. The Client Portal is hard-scoped to this id server-side —
    // an unlinked client account can log in but sees nothing until an
    // admin links it from Team > Edit.
    linkedClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, default: null },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    // Brute-force protection: 5 wrong passwords locks the account for 15
    // minutes. Reset to 0/null on any successful login.
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    // TOTP-based 2FA. `secret`/`pendingSecret`/`backupCodeHashes` are
    // select:false — the only code paths that ever need them explicitly
    // .select() this path, so a normal findById can never leak them.
    // `pendingSecret` holds the freshly-generated secret between /2fa/setup
    // and /2fa/enable — it only becomes the real `secret` once the user
    // proves they scanned it by submitting a valid code back.
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null, select: false },
      pendingSecret: { type: String, default: null, select: false },
      backupCodeHashes: { type: [String], default: [], select: false },
      confirmedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

userSchema.index({ firmId: 1, role: 1 });

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return candidate === this.passwordHash;
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    firmId: this.firmId,
    name: this.name,
    email: this.email,
    role: this.role,
    allowedServices: this.allowedServices,
    linkedClientId: this.linkedClientId,
    departmentId: this.departmentId,
    phone: this.phone,
    avatarUrl: this.avatarUrl,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    twoFactorEnabled: !!this.twoFactor?.enabled,
  };
};

userSchema.statics.ROLES = ROLES;
userSchema.statics.SERVICES = SERVICES;

module.exports = mongoose.model('User', userSchema);
