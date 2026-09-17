const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

/**
 * `ownerType`/`ownerId` make this a polymorphic attachment: a Document can
 * belong to a Client, Task, Invoice, or Expense without each of those
 * modules owning its own upload/version logic. Every module attaches files
 * by reference (documentId) instead.
 */
const documentVersionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    fileSizeBytes: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentFolder',
      default: null,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ['client', 'task', 'invoice', 'expense', 'firm'],
      required: true,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    tags: [{ type: String, trim: true }],
    currentVersion: { type: Number, default: 1 },
    versions: { type: [documentVersionSchema], required: true, validate: (v) => v.length > 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 'not_required' documents (the default) never show up in any approval
    // queue. Uploading a NEW version of an already-reviewed document resets
    // it back to 'pending' — a partner approving v1 should never be read as
    // approving whatever v2 turns out to contain.
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

documentSchema.plugin(auditPlugin);
documentSchema.index({ firmId: 1, ownerType: 1, ownerId: 1 });
documentSchema.index({ firmId: 1, name: 'text', tags: 'text' });

documentSchema.virtual('fileUrl').get(function fileUrl() {
  const version = this.versions.find((v) => v.versionNumber === this.currentVersion);
  return version ? version.fileUrl : null;
});

documentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);
