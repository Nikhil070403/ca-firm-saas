const { documentRepository, documentFolderRepository } = require('../repositories/document.repository');
const { uploadBuffer, destroyAsset } = require('../../../utils/cloudinaryUpload');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');
const { isAutomationEnabled } = require('../../../utils/firmAutomation');
const { notifyFirmAdmins } = require('../../../utils/notifyFirmAdmins');
const Client = require('../../clients/models/Client.model');
const notificationService = require('../../reminders/services/notification.service');

async function listDocuments(firmId, query) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['name', 'tags'],
    allowedFilters: ['ownerType', 'ownerId', 'folderId'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  const { items, total } = await documentRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: { path: 'uploadedBy', select: 'name avatarUrl' },
  });
  return { items, page, limit, total };
}

async function listForOwner(firmId, ownerType, ownerId) {
  return documentRepository.listForOwner(firmId, ownerType, ownerId);
}

async function uploadDocument(firmId, actorId, file, meta) {
  if (!file) throw AppError.badRequest('A file is required');

  const uploaded = await uploadBuffer(file.buffer, { folder: `ca-firm-saas/${firmId}` });
  const requiresApproval = meta.requiresApproval === 'true' || meta.requiresApproval === true;

  const document = await documentRepository.create(firmId, {
    name: meta.name || file.originalname,
    mimeType: file.mimetype,
    folderId: meta.folderId || null,
    ownerType: meta.ownerType,
    ownerId: meta.ownerId,
    tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    currentVersion: 1,
    versions: [{
      versionNumber: 1,
      fileUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      fileSizeBytes: uploaded.bytes,
      uploadedBy: actorId,
    }],
    uploadedBy: actorId,
    createdBy: actorId,
    approvalStatus: requiresApproval ? 'pending' : 'not_required',
  });

  // Automation: "Document uploaded -> notify assigned executive". Fires
  // fire-and-forget so an uploader is never blocked by a notification issue.
  if (document.ownerType === 'client') {
    notifyAssignedExecutive(firmId, document, actorId).catch(() => {});
  }
  if (requiresApproval) {
    notifyFirmAdmins(firmId, actorId, {
      title: 'Document awaiting your approval',
      message: `"${document.name}" was submitted for approval.`,
      link: '/accounts/documents',
      sourceId: document._id,
      sourceType: 'document',
    }).catch(() => {});
  }

  return document;
}

async function notifyAssignedExecutive(firmId, document, uploaderId) {
  if (!(await isAutomationEnabled(firmId, 'documentUploadNotify'))) return;
  const client = await Client.findOne({ _id: document.ownerId, firmId, isDeleted: false }).select('displayName assignedTo');
  if (!client?.assignedTo || client.assignedTo.toString() === uploaderId.toString()) return;

  await notificationService.notify({
    firmId,
    userId: client.assignedTo,
    type: 'system',
    title: `New document for ${client.displayName}`,
    message: `"${document.name}" was uploaded for ${client.displayName}.`,
    link: `/crm/clients/${client._id}`,
    sourceId: document._id,
    sourceType: 'document',
  });
}

async function uploadNewVersion(firmId, actorId, id, file) {
  const document = await documentRepository.findById(firmId, id);
  if (!document) throw AppError.notFound('Document not found');
  if (!file) throw AppError.badRequest('A file is required');

  const uploaded = await uploadBuffer(file.buffer, { folder: `ca-firm-saas/${firmId}` });
  const versionNumber = document.currentVersion + 1;

  document.versions.push({
    versionNumber,
    fileUrl: uploaded.secure_url,
    cloudinaryPublicId: uploaded.public_id,
    fileSizeBytes: uploaded.bytes,
    uploadedBy: actorId,
  });
  document.currentVersion = versionNumber;
  document.updatedBy = actorId;

  // A new version invalidates any prior sign-off — approving v1 is not
  // approving whatever v2 turns out to contain.
  const wasReviewed = document.approvalStatus === 'approved' || document.approvalStatus === 'rejected';
  if (wasReviewed) {
    document.approvalStatus = 'pending';
    document.approvedBy = null;
    document.approvedAt = null;
    document.rejectionReason = null;
  }

  await document.save();

  if (wasReviewed) {
    notifyFirmAdmins(firmId, actorId, {
      title: 'Document awaiting your approval',
      message: `"${document.name}" was submitted for approval.`,
      link: '/accounts/documents',
      sourceId: document._id,
      sourceType: 'document',
    }).catch(() => {});
  }

  return document;
}

async function reviewDocument(firmId, actorId, id, { decision, reason }) {
  const document = await documentRepository.findById(firmId, id);
  if (!document) throw AppError.notFound('Document not found');
  if (document.approvalStatus !== 'pending') {
    throw AppError.badRequest('This document is not awaiting approval');
  }

  document.approvalStatus = decision;
  document.approvedBy = actorId;
  document.approvedAt = new Date();
  document.rejectionReason = decision === 'rejected' ? (reason || null) : null;
  document.updatedBy = actorId;
  await document.save();

  notificationService.notify({
    firmId,
    userId: document.uploadedBy,
    type: 'system',
    title: decision === 'approved' ? 'Document approved' : 'Document rejected',
    message: decision === 'approved'
      ? `"${document.name}" was approved.`
      : `"${document.name}" was rejected${reason ? `: ${reason}` : '.'}`,
    link: '/accounts/documents',
    sourceId: document._id,
    sourceType: 'document',
  }).catch(() => {});

  return document;
}

async function deleteDocument(firmId, id, actorId) {
  const document = await documentRepository.findById(firmId, id);
  if (!document) throw AppError.notFound('Document not found');

  await Promise.all(
    document.versions.map((v) => destroyAsset(v.cloudinaryPublicId).catch(() => null))
  );
  return documentRepository.softDelete(firmId, id, { deletedBy: actorId });
}

async function createFolder(firmId, actorId, data) {
  return documentFolderRepository.create(firmId, { ...data, createdBy: actorId });
}

async function listFolders(firmId, parentFolderId) {
  return documentFolderRepository.listChildren(firmId, parentFolderId);
}

module.exports = {
  listDocuments,
  listForOwner,
  uploadDocument,
  uploadNewVersion,
  reviewDocument,
  deleteDocument,
  createFolder,
  listFolders,
};
