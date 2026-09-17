const { ValidationResult } = require('../../../utils/validationHelpers');

const ENTRY_TYPES = ['debit', 'credit', 'opening_balance', 'adjustment'];

function validateCreateEntry(body) {
  const result = new ValidationResult(body)
    .requireObjectId('clientId')
    .requireEnum('entryType', ENTRY_TYPES)
    .requireNumber('amount', { min: 0.01 })
    .requireString('description', { min: 2, max: 500 });

  if (body.entryType === 'adjustment' && body.direction !== undefined) {
    result.requireEnum('direction', ['increase', 'decrease']);
  }
  return result.build();
}

module.exports = { validateCreateEntry, ENTRY_TYPES };
