const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isEmail = (v) => isNonEmptyString(v) && EMAIL_RE.test(v);
const isObjectId = (v) => isNonEmptyString(v) && OBJECT_ID_RE.test(v);
const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v);
const isPositiveNumber = (v) => isNumber(v) && v >= 0;
const isOneOf = (v, options) => options.includes(v);
const isDateString = (v) => isNonEmptyString(v) && !Number.isNaN(Date.parse(v));
const isArray = (v) => Array.isArray(v);

/**
 * Small helper to build a validator function's { isValid, errors, value }
 * result without every module reimplementing the accumulation logic.
 */
class ValidationResult {
  constructor(value) {
    this.errors = [];
    this.value = value;
  }

  check(condition, message) {
    if (!condition) this.errors.push(message);
    return this;
  }

  requireString(field, { min = 1, max = 500 } = {}) {
    const v = this.value[field];
    if (!isNonEmptyString(v) || v.trim().length < min || v.trim().length > max) {
      this.errors.push(`${field} must be a string between ${min} and ${max} characters`);
    }
    return this;
  }

  optionalString(field, { max = 2000 } = {}) {
    const v = this.value[field];
    if (v !== undefined && v !== null && (typeof v !== 'string' || v.length > max)) {
      this.errors.push(`${field} must be a string up to ${max} characters`);
    }
    return this;
  }

  requireEnum(field, options) {
    const v = this.value[field];
    if (!isOneOf(v, options)) {
      this.errors.push(`${field} must be one of: ${options.join(', ')}`);
    }
    return this;
  }

  requireObjectId(field) {
    if (!isObjectId(this.value[field])) {
      this.errors.push(`${field} must be a valid id`);
    }
    return this;
  }

  optionalObjectId(field) {
    const v = this.value[field];
    if (v !== undefined && v !== null && v !== '' && !isObjectId(v)) {
      this.errors.push(`${field} must be a valid id`);
    }
    return this;
  }

  requireNumber(field, { min = -Infinity, max = Infinity } = {}) {
    const v = this.value[field];
    if (!isNumber(v) || v < min || v > max) {
      this.errors.push(`${field} must be a number between ${min} and ${max}`);
    }
    return this;
  }

  requireEmail(field) {
    if (!isEmail(this.value[field])) {
      this.errors.push(`${field} must be a valid email`);
    }
    return this;
  }

  build() {
    return { isValid: this.errors.length === 0, errors: this.errors, value: this.value };
  }
}

module.exports = {
  isNonEmptyString,
  isEmail,
  isObjectId,
  isNumber,
  isPositiveNumber,
  isOneOf,
  isDateString,
  isArray,
  ValidationResult,
};
