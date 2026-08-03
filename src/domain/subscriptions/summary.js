import {
  calculateAnnualProjection,
  calculateNormalizedMonthlyCost,
  calculateNormalizedMonthlyTotal,
} from '../../core/money/index.js';
import {
  calculateDaysRemaining,
  isTrialEndingSoon,
} from '../../core/dates/index.js';
import {
  createFreeformService,
  findServiceById,
  findServiceByName,
} from '../services/index.js';
import { SUBSCRIPTION_STATUS } from './constants.js';
import { validateSubscriptionPayload } from './validation.js';

export function summarizeSubscriptions(subscriptions = [], options = {}) {
  const results = normalizeSubscriptionList(subscriptions).map(
    (subscription, index) => ({
      index,
      result: validateSubscriptionPayload(subscription),
    }),
  );
  const validSubscriptions = results
    .filter(({ result }) => result.isValid)
    .map(({ result }) => result.value);
  const invalidSubscriptions = results
    .filter(({ result }) => !result.isValid)
    .map(({ index, result }) =>
      Object.freeze({
        index,
        value: result.value,
        errors: Object.freeze([...result.errors]),
      }),
    );
  const items = validSubscriptions.map((subscription) =>
    createSummaryItem(subscription, options),
  );
  const countsByStatus = countSubscriptionsByStatus(validSubscriptions);
  const monthlyTotal = calculateNormalizedMonthlyTotal(validSubscriptions);

  return Object.freeze({
    totalCount: validSubscriptions.length,
    invalidCount: invalidSubscriptions.length,
    activeCount: countsByStatus[SUBSCRIPTION_STATUS.ACTIVE],
    trialCount: countsByStatus[SUBSCRIPTION_STATUS.TRIAL],
    endedCount: countsByStatus[SUBSCRIPTION_STATUS.ENDED],
    archivedCount: countsByStatus[SUBSCRIPTION_STATUS.ARCHIVED],
    countsByStatus,
    monthlyTotal,
    yearlyProjection: calculateAnnualProjection(validSubscriptions),
    trialAlerts: Object.freeze(
      items.filter((item) => item.isTrialEndingSoon),
    ),
    items: Object.freeze(items),
    invalidSubscriptions: Object.freeze(invalidSubscriptions),
  });
}

function createSummaryItem(subscription, options) {
  const service = resolveSubscriptionService(subscription);
  const trialOptions = createTrialOptions(options);

  return Object.freeze({
    ...subscription,
    service,
    serviceId: subscription.serviceId ?? service.id,
    category: subscription.category ?? service.category,
    brandColor: subscription.brandColor ?? service.color,
    icon: subscription.icon ?? service.iconPath,
    monthlyCost: calculateNormalizedMonthlyCost(subscription),
    daysUntilRenewal: calculateDaysRemaining(
      subscription.renewalDate,
      options.referenceDate,
    ),
    daysUntilTrialEnd: calculateDaysRemaining(
      subscription.trialEndDate,
      options.referenceDate,
    ),
    isTrialEndingSoon: isTrialEndingSoon(subscription, trialOptions),
  });
}

function resolveSubscriptionService(subscription) {
  return (
    findServiceById(subscription.serviceId) ??
    findServiceByName(subscription.serviceName) ??
    createFreeformService(subscription.serviceName, {
      category: subscription.category,
      color: subscription.brandColor,
      iconPath: subscription.icon,
    })
  );
}

function countSubscriptionsByStatus(subscriptions) {
  const counts = createEmptyStatusCounts();

  for (const subscription of subscriptions) {
    counts[subscription.status] += 1;
  }

  return Object.freeze(counts);
}

function createEmptyStatusCounts() {
  return {
    [SUBSCRIPTION_STATUS.ACTIVE]: 0,
    [SUBSCRIPTION_STATUS.TRIAL]: 0,
    [SUBSCRIPTION_STATUS.ENDED]: 0,
    [SUBSCRIPTION_STATUS.ARCHIVED]: 0,
  };
}

function createTrialOptions(options) {
  return {
    referenceDate: options.referenceDate,
    windowDays: options.trialWarningWindowDays ?? options.windowDays,
  };
}

function normalizeSubscriptionList(subscriptions) {
  return Array.isArray(subscriptions) ? subscriptions : [];
}
