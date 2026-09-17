const mongoose = require('mongoose');
const auditPlugin = require('../../../models/plugins/auditPlugin');

const documentFolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    parentFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentFolder',
      default: null,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

documentFolderSchema.plugin(auditPlugin, { compoundFirmIndex: false });
documentFolderSchema.index({ firmId: 1, parentFolderId: 1 });

module.exports = mongoose.model('DocumentFolder', documentFolderSchema);
