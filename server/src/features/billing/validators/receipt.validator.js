const { ValidationResult } = require('../../../utils/validationHelpers');

const PAYMENT_MODES = ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'];

function validateCreateReceipt(body) {
  const result = new ValidationResult(body)
    .requireObjectId('clientId')
    .requireNumber('amount', { min: 0.01 });

  if (body.invoiceId !== undefined) result.optionalObjectId('invoiceId');
  if (body.paymentMode !== undefined) result.requireEnum('paymentMode', PAYMENT_MODES);
  return result.build();
}

module.exports = { validateCreateReceipt, PAYMENT_MODES };
