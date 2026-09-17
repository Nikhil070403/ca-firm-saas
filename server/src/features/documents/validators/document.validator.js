const { ValidationResult } = require('../../../utils/validationHelpers');

const OWNER_TYPES = ['client', 'task', 'invoice', 'expense', 'firm'];

function validateUploadMeta(body) {
  const result = new ValidationResult(body)
    .requireEnum('ownerType', OWNER_TYPES)
    .requireObjectId('ownerId');
  if (body.folderId !== undefined) result.optionalObjectId('folderId');
  return result.build();
}

function validateCreateFolder(body) {
  const result = new ValidationResult(body).requireString('name', { min: 1, max: 150 });
  if (body.parentFolderId !== undefined) result.optionalObjectId('parentFolderId');
  if (body.clientId !== undefined) result.optionalObjectId('clientId');
  return result.build();
}

function validateReview(body) {
  const result = new ValidationResult(body).requireEnum('decision', ['approved', 'rejected']);
  if (body.reason !== undefined) result.optionalString('reason', { max: 500 });
  return result.build();
}

module.exports = { validateUploadMeta, validateCreateFolder, validateReview, OWNER_TYPES };
