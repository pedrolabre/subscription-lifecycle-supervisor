import {
  BILLING_CYCLES,
  BILLING_CYCLE_VALUES,
  PAID_BILLING_CYCLE_VALUES,
  RECURRING_BILLING_CYCLE_VALUES,
  SUBSCRIPTION_ERROR_CODES,
  SUBSCRIPTION_ERROR_MESSAGES,
  SUBSCRIPTION_FIELD_LIMITS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_VALUES,
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_TYPE_VALUES,
} from './constants.js';
import { normalizeSubscriptionPayload } from './normalization.js';

export function validateSubscriptionPayload(payload) {
  const normalized = normalizeSubscriptionPayload(payload);
  const errors = [];

  if (!isRecord(payload)) {
    addError(errors, 'payload', SUBSCRIPTION_ERROR_CODES.PAYLOAD_INVALID);

    return {
      isValid: false,
      value: normalized,
      errors,
    };
  }

  validateServiceName(normalized, errors);
  validateEnums(normalized, errors);
  validatePrice(normalized, errors);
  validateDates(normalized, errors);
  validateBrandColor(normalized, errors);

  return {
    isValid: errors.length === 0,
    value: normalized,
    errors,
  };
}

export function getSubscriptionValidationErrors(payload) {
  return validateSubscriptionPayload(payload).errors;
}

function validateServiceName(subscription, errors) {
  if (!subscription.serviceName) {
    addError(
      errors,
      'serviceName',
      SUBSCRIPTION_ERROR_CODES.SERVICE_NAME_REQUIRED,
    );

    return;
  }

  if (
    subscription.serviceName.length >
    SUBSCRIPTION_FIELD_LIMITS.serviceNameMaxLength
  ) {
    addError(
      errors,
      'serviceName',
      SUBSCRIPTION_ERROR_CODES.SERVICE_NAME_TOO_LONG,
    );
  }
}

function validateEnums(subscription, errors) {
  const hasValidType = SUBSCRIPTION_TYPE_VALUES.includes(subscription.type);
  const hasValidBillingCycle = BILLING_CYCLE_VALUES.includes(
    subscription.billingCycle,
  );

  if (!SUBSCRIPTION_STATUS_VALUES.includes(subscription.status)) {
    addError(errors, 'status', SUBSCRIPTION_ERROR_CODES.STATUS_INVALID);
  }

  if (!hasValidType) {
    addError(errors, 'type', SUBSCRIPTION_ERROR_CODES.TYPE_INVALID);
  }

  if (!hasValidBillingCycle) {
    addError(
      errors,
      'billingCycle',
      SUBSCRIPTION_ERROR_CODES.BILLING_CYCLE_INVALID,
    );
  }

  if (!hasValidType || !hasValidBillingCycle) {
    return;
  }

  if (
    subscription.type === SUBSCRIPTION_TYPES.PAID &&
    !PAID_BILLING_CYCLE_VALUES.includes(subscription.billingCycle)
  ) {
    addError(
      errors,
      'billingCycle',
      SUBSCRIPTION_ERROR_CODES.PAID_BILLING_CYCLE_REQUIRED,
    );
  }

  if (
    subscription.type !== SUBSCRIPTION_TYPES.PAID &&
    subscription.billingCycle !== BILLING_CYCLES.NONE
  ) {
    addError(
      errors,
      'billingCycle',
      SUBSCRIPTION_ERROR_CODES.NON_PAID_BILLING_CYCLE_INVALID,
    );
  }
}

function validatePrice(subscription, errors) {
  if (!Number.isFinite(subscription.price)) {
    addError(errors, 'price', SUBSCRIPTION_ERROR_CODES.PRICE_INVALID);

    return;
  }

  if (subscription.price < 0) {
    addError(errors, 'price', SUBSCRIPTION_ERROR_CODES.PRICE_NEGATIVE);
  }

  if (
    SUBSCRIPTION_TYPE_VALUES.includes(subscription.type) &&
    subscription.type !== SUBSCRIPTION_TYPES.PAID &&
    subscription.price !== 0
  ) {
    addError(errors, 'price', SUBSCRIPTION_ERROR_CODES.NON_PAID_PRICE_INVALID);
  }
}

function validateDates(subscription, errors) {
  if (!subscription.startDate) {
    addError(errors, 'startDate', SUBSCRIPTION_ERROR_CODES.START_DATE_REQUIRED);
  } else if (!isIsoDate(subscription.startDate)) {
    addError(errors, 'startDate', SUBSCRIPTION_ERROR_CODES.START_DATE_INVALID);
  }

  if (subscription.renewalDate && !isIsoDate(subscription.renewalDate)) {
    addError(
      errors,
      'renewalDate',
      SUBSCRIPTION_ERROR_CODES.RENEWAL_DATE_INVALID,
    );
  }

  if (
    subscription.type === SUBSCRIPTION_TYPES.PAID &&
    RECURRING_BILLING_CYCLE_VALUES.includes(subscription.billingCycle) &&
    !subscription.renewalDate
  ) {
    addError(
      errors,
      'renewalDate',
      SUBSCRIPTION_ERROR_CODES.RENEWAL_DATE_REQUIRED,
    );
  }

  if (subscription.trialEndDate && !isIsoDate(subscription.trialEndDate)) {
    addError(
      errors,
      'trialEndDate',
      SUBSCRIPTION_ERROR_CODES.TRIAL_END_DATE_INVALID,
    );
  }

  if (
    subscription.status === SUBSCRIPTION_STATUS.TRIAL &&
    !subscription.trialEndDate
  ) {
    addError(
      errors,
      'trialEndDate',
      SUBSCRIPTION_ERROR_CODES.TRIAL_END_DATE_REQUIRED,
    );
  }


}

function validateBrandColor(subscription, errors) {
  if (
    subscription.brandColor &&
    !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(subscription.brandColor)
  ) {
    addError(
      errors,
      'brandColor',
      SUBSCRIPTION_ERROR_CODES.BRAND_COLOR_INVALID,
    );
  }
}

function addError(errors, field, code) {
  errors.push({
    field,
    code,
    message: SUBSCRIPTION_ERROR_MESSAGES[code],
  });
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
