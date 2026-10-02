import {
  calculateNextRenewalDate,
  isDateDueToday,
  isDateOverdue,
  isIsoDate,
} from '../../core/dates/index.js';
import { toCents } from '../../core/money/index.js';
import {
  BILLING_CYCLES,
  RECURRING_BILLING_CYCLE_VALUES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
  TEMPORAL_STATUS,
} from './constants.js';

export function isTrialExpired(subscription, referenceDate = new Date()) {
  if (!isRecord(subscription) || subscription.status !== SUBSCRIPTION_STATUS.TRIAL) {
    return false;
  }

  if (!subscription.trialEndDate) {
    return false;
  }

  return isDateOverdue(subscription.trialEndDate, referenceDate);
}

export function isRenewalOverdue(subscription, referenceDate = new Date()) {
  if (!isRecord(subscription) || subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    return false;
  }

  if (!subscription.renewalDate) {
    return false;
  }

  return isDateOverdue(subscription.renewalDate, referenceDate);
}

export function isRenewalDueToday(subscription, referenceDate = new Date()) {
  if (!isRecord(subscription) || subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    return false;
  }

  if (!subscription.renewalDate) {
    return false;
  }

  return isDateDueToday(subscription.renewalDate, referenceDate);
}

export function evaluateTemporalStatus(subscription, referenceDate = new Date()) {
  if (!isRecord(subscription)) {
    return null;
  }

  if (isTrialExpired(subscription, referenceDate)) {
    return TEMPORAL_STATUS.TRIAL_EXPIRED;
  }

  if (isRenewalOverdue(subscription, referenceDate)) {
    return TEMPORAL_STATUS.RENEWAL_OVERDUE;
  }

  if (isRenewalDueToday(subscription, referenceDate)) {
    return TEMPORAL_STATUS.RENEWAL_DUE_TODAY;
  }

  return null;
}

export function canRenewSubscription(subscription) {
  if (!isRecord(subscription) || !subscription.id) {
    return false;
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    return false;
  }

  if (!RECURRING_BILLING_CYCLE_VALUES.includes(subscription.billingCycle)) {
    return false;
  }

  return Boolean(subscription.renewalDate && isIsoDate(subscription.renewalDate));
}

export function canConvertTrial(subscription) {
  if (!isRecord(subscription) || !subscription.id) {
    return false;
  }

  return subscription.status === SUBSCRIPTION_STATUS.TRIAL;
}

export function calculateNextCycle(subscription, referenceDate = new Date()) {
  if (!canRenewSubscription(subscription)) {
    throw new Error('Assinatura nao elegivel para renovacao de ciclo.');
  }

  const nextRenewalDate = calculateNextRenewalDate(
    subscription.renewalDate,
    subscription.billingCycle,
    referenceDate,
  );

  const price = Number(subscription.price) || 0;
  const amountCents = toCents(price);

  const paidAt = (
    referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
      ? referenceDate
      : new Date()
  ).toISOString();

  const historyRecord = Object.freeze({
    subscriptionId: String(subscription.id).trim(),
    paidAt,
    billingCycle: subscription.billingCycle,
    amountCents,
  });

  return Object.freeze({
    nextRenewalDate,
    historyRecord,
  });
}

export function createTrialConversionPayload(subscription, options = {}) {
  if (!isRecord(subscription)) {
    throw new Error('Assinatura de trial invalida para conversao.');
  }

  const billingCycle = options.billingCycle ?? BILLING_CYCLES.MONTHLY;
  const price = Number(options.price ?? 0);
  const startDate = options.startDate ?? subscription.startDate;
  const referenceDate = options.referenceDate ?? new Date();
  const renewalDate =
    options.renewalDate ??
    calculateNextRenewalDate(startDate, billingCycle, referenceDate);

  return {
    ...subscription,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    type: SUBSCRIPTION_TYPES.PAID,
    billingCycle,
    price,
    startDate,
    renewalDate,
    trialEndDate: null,
    cancellationUrl:
      options.cancellationUrl ?? subscription.cancellationUrl ?? null,
  };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
