import { SUBSCRIPTION_STATUS } from '../../domain/subscriptions/index.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_TRIAL_WARNING_WINDOW_DAYS = 7;

export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function parseIsoDate(value) {
  if (!isIsoDate(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function calculateDaysRemaining(targetDate, referenceDate = new Date()) {
  const targetTimestamp = getUtcDateTimestamp(targetDate);
  const referenceTimestamp = getUtcDateTimestamp(referenceDate);

  if (targetTimestamp === null || referenceTimestamp === null) {
    return null;
  }

  return Math.round((targetTimestamp - referenceTimestamp) / DAY_IN_MS);
}

export function isTrialEndingSoon(subscription, options = {}) {
  if (!isRecord(subscription) || subscription.status !== SUBSCRIPTION_STATUS.TRIAL) {
    return false;
  }

  const daysRemaining = calculateDaysRemaining(
    subscription.trialEndDate,
    options.referenceDate,
  );
  const windowDays = normalizeWindowDays(options.windowDays);

  return daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= windowDays;
}

export function getTrialEndingSoonSubscriptions(subscriptions = [], options = {}) {
  if (!Array.isArray(subscriptions)) {
    return [];
  }

  return subscriptions.filter((subscription) =>
    isTrialEndingSoon(subscription, options),
  );
}

function getUtcDateTimestamp(value) {
  if (typeof value === 'string') {
    return parseIsoDate(value)?.getTime() ?? null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const isoDate = value.toISOString().slice(0, 10);

    return parseIsoDate(isoDate).getTime();
  }

  return null;
}

function normalizeWindowDays(value) {
  if (value === null || value === undefined) {
    return DEFAULT_TRIAL_WARNING_WINDOW_DAYS;
  }

  const days = Number(value);

  if (!Number.isFinite(days) || days < 0) {
    return DEFAULT_TRIAL_WARNING_WINDOW_DAYS;
  }

  return Math.floor(days);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
