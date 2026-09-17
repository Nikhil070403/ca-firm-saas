const { ValidationResult } = require('../../../utils/validationHelpers');

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

function validateUpdateFirm(body) {
  const result = new ValidationResult(body);
  if (body.name !== undefined) result.requireString('name', { min: 2, max: 200 });
  if (body.email !== undefined) result.requireEmail('email');
  if (body.gstNumber !== undefined) result.optionalString('gstNumber', { max: 20 });
  if (body.panNumber !== undefined) result.optionalString('panNumber', { max: 20 });
  if (body.logoUrl !== undefined && body.logoUrl !== null) result.optionalString('logoUrl', { max: 1000 });
  if (body.primaryColor !== undefined && body.primaryColor !== null) {
    result.check(HEX_COLOR_RE.test(body.primaryColor), 'primaryColor must be a hex color like #1E3A8A');
  }
  return result.build();
}

function validateEmailTemplate(body) {
  return new ValidationResult(body)
    .requireString('subject', { min: 2, max: 200 })
    .requireString('bodyHtml', { min: 2, max: 20000 })
    .build();
}

module.exports = { validateUpdateFirm, validateEmailTemplate };
