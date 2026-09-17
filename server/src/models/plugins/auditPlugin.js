const mongoose = require('mongoose');

/**
 * Shared fields every tenant-owned collection needs: firm scoping, soft delete,
 * and who-created/updated-it. Mongoose `timestamps: true` on the schema itself
 * covers createdAt/updatedAt, so this plugin only adds what that doesn't.
 */
function auditPlugin(schema, options = {}) {
  schema.add({
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  });

  if (options.compoundFirmIndex !== false) {
    schema.index({ firmId: 1, isDeleted: 1, createdAt: -1 });
  }
}

module.exports = auditPlugin;
