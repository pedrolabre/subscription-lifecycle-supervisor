import { computed } from 'vue';
import { formatCurrency } from '../core/money/index.js';
import { SUBSCRIPTIONS_STORE_STATUS } from '../stores/subscriptions/index.js';
import {
  normalizeCount,
  normalizeSubscriptionName,
} from './subscriptionViewUtils.js';

const storeStatusMessageKeys = {
  [SUBSCRIPTIONS_STORE_STATUS.IDLE]: 'storeStatus.idle',
  [SUBSCRIPTIONS_STORE_STATUS.LOADING]: 'storeStatus.loading',
  [SUBSCRIPTIONS_STORE_STATUS.EMPTY]: 'storeStatus.empty',
  [SUBSCRIPTIONS_STORE_STATUS.ERROR]: 'storeStatus.error',
  [SUBSCRIPTIONS_STORE_STATUS.LOADED]: 'storeStatus.loaded',
};

export function useSubscriptionDashboard({
  formatNumber,
  locale,
  subscriptionsStore,
  t,
  tc,
}) {
  const storeStatusLabel = computed(() =>
    t(
      storeStatusMessageKeys[subscriptionsStore.status] ??
        storeStatusMessageKeys[SUBSCRIPTIONS_STORE_STATUS.IDLE],
    ),
  );

  const isLoadingState = computed(() =>
    [
      SUBSCRIPTIONS_STORE_STATUS.IDLE,
      SUBSCRIPTIONS_STORE_STATUS.LOADING,
    ].includes(subscriptionsStore.status),
  );

  const hasLoadError = computed(() => Boolean(subscriptionsStore.loadError));

  const isErrorState = computed(
    () =>
      hasLoadError.value &&
      (subscriptionsStore.status === SUBSCRIPTIONS_STORE_STATUS.ERROR ||
        !subscriptionsStore.hasSubscriptions),
  );

  const isEmptyState = computed(
    () =>
      subscriptionsStore.status === SUBSCRIPTIONS_STORE_STATUS.EMPTY ||
      subscriptionsStore.isEmpty,
  );

  const isLoadedState = computed(
    () =>
      subscriptionsStore.status === SUBSCRIPTIONS_STORE_STATUS.LOADED ||
      (subscriptionsStore.isLoaded && subscriptionsStore.hasSubscriptions),
  );

  const errorMessage = computed(
    () =>
      subscriptionsStore.loadError?.message ??
      subscriptionsStore.error?.message ??
      t('errors.loadSubscriptions'),
  );

  const trialAlerts = computed(() =>
    Array.isArray(subscriptionsStore.trialAlerts)
      ? subscriptionsStore.trialAlerts
      : [],
  );

  const trialAlertCount = computed(() => trialAlerts.value.length);

  const hasTrialAlerts = computed(() => trialAlertCount.value > 0);

  const trialAlertSummary = computed(() =>
    tc('summary.trialAlertSummary', trialAlertCount.value),
  );

  const trialAlertDetail = computed(() => {
    const names = trialAlerts.value
      .map((subscription) => normalizeSubscriptionName(subscription))
      .filter(Boolean);

    if (names.length === 0) {
      return t('summary.trialAlertDetailFallback');
    }

    if (names.length <= 2) {
      return formatNameList(names);
    }

    return t('summary.trialMoreNames', {
      count: formatCount(names.length - 2),
      names: formatNameList(names.slice(0, 2)),
    });
  });

  const summaryMetrics = computed(() => [
    {
      label: t('summary.monthly.label'),
      value: formatCurrency(subscriptionsStore.monthlyTotal, {
        locale: locale.value,
      }),
      detail: t('summary.monthly.detail'),
    },
    {
      label: t('summary.yearly.label'),
      value: formatCurrency(subscriptionsStore.yearlyProjection, {
        locale: locale.value,
      }),
      detail: t('summary.yearly.detail'),
    },
    {
      label: t('summary.active.label'),
      value: formatCount(subscriptionsStore.activeCount),
      detail: t('summary.active.detail'),
    },
    {
      label: t('summary.trials.label'),
      value: formatCount(subscriptionsStore.trialCount),
      detail: tc('summary.trialAlertsDetail', trialAlertCount.value),
    },
    {
      label: t('summary.ended.label'),
      value: formatCount(subscriptionsStore.endedCount),
      detail: tc('summary.archivedDetail', subscriptionsStore.archivedCount),
    },
  ]);

  const subscriptionCards = computed(() => {
    const summaryItems = subscriptionsStore.summary?.items;

    return Array.isArray(summaryItems) && summaryItems.length > 0
      ? summaryItems
      : subscriptionsStore.subscriptions;
  });

  const subscriptionsListLabel = computed(() => {
    const count = subscriptionCards.value.length;

    return tc('summary.listCount', count);
  });

  function formatCount(value) {
    return formatNumber(normalizeCount(value));
  }

  function formatNameList(names) {
    return new Intl.ListFormat(locale.value, {
      style: 'long',
      type: 'conjunction',
    }).format(names);
  }

  return {
    errorMessage,
    hasTrialAlerts,
    isEmptyState,
    isErrorState,
    isLoadedState,
    isLoadingState,
    storeStatusLabel,
    subscriptionCards,
    subscriptionsListLabel,
    summaryMetrics,
    trialAlertDetail,
    trialAlertSummary,
  };
}
