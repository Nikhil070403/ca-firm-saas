const { ValidationResult } = require('../../../utils/validationHelpers');

const CATEGORIES = ['office', 'travel', 'software', 'salary', 'rent', 'utilities', 'professional_fees', 'other'];
const PAYMENT_MODES = ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'];

function validateCreateExpense(body) {
  const result = new ValidationResult(body)
    .requireString('title', { min: 2, max: 200 })
    .requireNumber('amount', { min: 0.01 });

  if (body.category !== undefined) result.requireEnum('category', CATEGORIES);
  if (body.paymentMode !== undefined) result.requireEnum('paymentMode', PAYMENT_MODES);
  if (body.clientId !== undefined) result.optionalObjectId('clientId');
  return result.build();
}

function validateReviewExpense(body) {
  const result = new ValidationResult(body).requireEnum('decision', ['approved', 'rejected']);
  if (body.reason !== undefined) result.optionalString('reason', { max: 500 });
  return result.build();
}

module.exports = { validateCreateExpense, validateReviewExpense, CATEGORIES };
