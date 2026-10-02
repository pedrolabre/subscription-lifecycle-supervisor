import { SUBSCRIPTION_STATUS } from '../../domain/subscriptions/constants.js';

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

export function isDateOverdue(targetDate, referenceDate = new Date()) {
  const remaining = calculateDaysRemaining(targetDate, referenceDate);

  return remaining !== null && remaining < 0;
}

export function isDateDueToday(targetDate, referenceDate = new Date()) {
  const remaining = calculateDaysRemaining(targetDate, referenceDate);

  return remaining === 0;
}

export function calculateNextRenewalDate(
  baseDate,
  billingCycle,
  referenceDate = new Date(),
  options = {},
) {
  const baseIso =
    typeof baseDate === 'string' && isIsoDate(baseDate)
      ? baseDate
      : baseDate instanceof Date && !Number.isNaN(baseDate.getTime())
        ? getIsoDateFromReference(baseDate)
        : null;

  if (!baseIso) {
    return null;
  }

  if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
    return baseIso;
  }

  const [baseYear, baseMonth, baseDay] = baseIso.split('-').map(Number);
  const targetDay = baseDay;

  let currentYear = baseYear;
  let currentMonth = baseMonth;
  let currentDay = baseDay;

  function advanceOneCycle() {
    if (billingCycle === 'yearly') {
      currentYear += 1;
    } else {
      currentMonth += 1;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear += 1;
      }
    }

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    currentDay = Math.min(targetDay, daysInMonth);
  }

  advanceOneCycle();
  let currentIso = formatIsoDate(currentYear, currentMonth, currentDay);

  const shouldCatchUp =
    options.catchUp !== false &&
    referenceDate !== null &&
    referenceDate !== undefined;

  if (shouldCatchUp) {
    const refIso = getIsoDateFromReference(referenceDate);

    if (refIso) {
      let safetyCounter = 0;

      while (currentIso <= refIso && safetyCounter < 1200) {
        advanceOneCycle();
        currentIso = formatIsoDate(currentYear, currentMonth, currentDay);
        safetyCounter += 1;
      }
    }
  }

  return currentIso;
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
    const isoDate = [
      value.getFullYear(),
      padDatePart(value.getMonth() + 1),
      padDatePart(value.getDate()),
    ].join('-');

    return parseIsoDate(isoDate)?.getTime() ?? null;
  }

  return null;
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
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

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatIsoDate(year, month, day) {
  return [
    String(year).padStart(4, '0'),
    padDatePart(month),
    padDatePart(day),
  ].join('-');
}

function getIsoDateFromReference(value) {
  if (typeof value === 'string') {
    return isIsoDate(value) ? value : null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [
      value.getFullYear(),
      padDatePart(value.getMonth() + 1),
      padDatePart(value.getDate()),
    ].join('-');
  }

  return null;
}
