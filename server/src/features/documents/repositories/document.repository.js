const BaseRepository = require('../../../repositories/BaseRepository');
const Document = require('../models/Document.model');
const DocumentFolder = require('../models/DocumentFolder.model');

class DocumentRepository extends BaseRepository {
  constructor() {
    super(Document);
  }

  listForOwner(firmId, ownerType, ownerId) {
    return this.model.find(this.scoped(firmId, { ownerType, ownerId })).sort({ createdAt: -1 });
  }
}

class DocumentFolderRepository extends BaseRepository {
  constructor() {
    super(DocumentFolder);
  }

  listChildren(firmId, parentFolderId) {
    return this.model.find(this.scoped(firmId, { parentFolderId: parentFolderId || null })).sort({ name: 1 });
  }
}

module.exports = {
  documentRepository: new DocumentRepository(),
  documentFolderRepository: new DocumentFolderRepository(),
};
