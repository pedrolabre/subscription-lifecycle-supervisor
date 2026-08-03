import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/constants.js';

const BILLABLE_STATUSES = Object.freeze([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIAL,
]);

export function toCents(value) {
  const amount = normalizeMoneyAmount(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round((amount + Number.EPSILON) * 100);
}

export function centsToAmount(cents) {
  const amountInCents = Number(cents);

  if (!Number.isFinite(amountInCents)) {
    return 0;
  }

  return Number((Math.round(amountInCents) / 100).toFixed(2));
}

export function roundToCents(value) {
  return centsToAmount(toCents(value));
}

export function formatCurrency(value, options = {}) {
  const { locale = 'pt-BR', currency = 'BRL' } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundToCents(value));
}

export function calculateNormalizedMonthlyCost(subscription) {
  return centsToAmount(calculateNormalizedMonthlyCostInCents(subscription));
}

export function calculateNormalizedMonthlyTotal(subscriptions = []) {
  return centsToAmount(calculateNormalizedMonthlyTotalInCents(subscriptions));
}

export function calculateAnnualProjection(subscriptions = []) {
  return centsToAmount(calculateNormalizedMonthlyTotalInCents(subscriptions) * 12);
}

export function calculateAnnualProjectionFromMonthlyTotal(monthlyTotal) {
  return centsToAmount(toCents(monthlyTotal) * 12);
}

function calculateNormalizedMonthlyTotalInCents(subscriptions) {
  if (!Array.isArray(subscriptions)) {
    return 0;
  }

  return subscriptions.reduce(
    (total, subscription) =>
      total + calculateNormalizedMonthlyCostInCents(subscription),
    0,
  );
}

function calculateNormalizedMonthlyCostInCents(subscription) {
  if (!isRecurringPaidSubscription(subscription)) {
    return 0;
  }

  const priceInCents = toCents(subscription.price);

  if (subscription.billingCycle === BILLING_CYCLES.MONTHLY) {
    return priceInCents;
  }

  if (subscription.billingCycle === BILLING_CYCLES.YEARLY) {
    return Math.round(priceInCents / 12);
  }

  return 0;
}

function isRecurringPaidSubscription(subscription) {
  return (
    isRecord(subscription) &&
    BILLABLE_STATUSES.includes(subscription.status) &&
    subscription.type === SUBSCRIPTION_TYPES.PAID &&
    (subscription.billingCycle === BILLING_CYCLES.MONTHLY ||
      subscription.billingCycle === BILLING_CYCLES.YEARLY)
  );
}

function normalizeMoneyAmount(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'string') {
    const text = value.trim();

    return text ? Number(text.replace(',', '.')) : 0;
  }

  return Number(value);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
