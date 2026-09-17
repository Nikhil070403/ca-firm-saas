const { ValidationResult, isArray, isNonEmptyString, isNumber } = require('../../../utils/validationHelpers');

function validateLineItems(result) {
  const { lineItems } = result.value;
  if (!isArray(lineItems) || lineItems.length === 0) {
    result.errors.push('lineItems must be a non-empty array');
    return;
  }
  lineItems.forEach((item, idx) => {
    if (!isNonEmptyString(item?.description)) result.errors.push(`lineItems[${idx}].description is required`);
    if (!isNumber(item?.quantity) || item.quantity <= 0) result.errors.push(`lineItems[${idx}].quantity must be > 0`);
    if (!isNumber(item?.rate) || item.rate < 0) result.errors.push(`lineItems[${idx}].rate must be >= 0`);
  });
}

function validateCreateInvoice(body) {
  const result = new ValidationResult(body)
    .requireObjectId('clientId')
    .check(body.dueDate && !Number.isNaN(Date.parse(body.dueDate)), 'dueDate must be a valid date');
  validateLineItems(result);
  return result.build();
}

function validateUpdateInvoiceStatus(body) {
  return new ValidationResult(body)
    .requireEnum('status', ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'])
    .build();
}

module.exports = { validateCreateInvoice, validateUpdateInvoiceStatus };
