import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  SUBSCRIPTION_STATUS,
  summarizeSubscriptions,
} from '../../domain/subscriptions/index.js';
import { subscriptionsRepository } from '../../infrastructure/subscriptions/index.js';

export const SUBSCRIPTIONS_STORE_ID = 'subscriptions';

export const SUBSCRIPTIONS_STORE_ERROR_CODES = Object.freeze({
  UNKNOWN: 'subscriptions_store_unknown_error',
});

export const SUBSCRIPTIONS_STORE_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  EMPTY: 'empty',
  LOADED: 'loaded',
  ERROR: 'error',
});

export function createSubscriptionsStore(options = {}) {
  const storeId = options.storeId ?? SUBSCRIPTIONS_STORE_ID;
  const repository = options.repository ?? subscriptionsRepository;
  const summaryOptions = options.summaryOptions;

  return defineStore(storeId, () => {
    const subscriptions = ref([]);
    const isLoading = ref(false);
    const isLoaded = ref(false);
    const loadError = ref(null);
    const mutationError = ref(null);

    const summary = computed(() =>
      summarizeSubscriptions(subscriptions.value, resolveSummaryOptions(summaryOptions)),
    );

    const activeSubscriptions = computed(() =>
      summary.value.items.filter((subscription) =>
        [
          SUBSCRIPTION_STATUS.ACTIVE,
          SUBSCRIPTION_STATUS.TRIAL,
        ].includes(subscription.status),
      ),
    );
    const trialAlerts = computed(() => summary.value.trialAlerts);
    const monthlyTotal = computed(() => summary.value.monthlyTotal);
    const yearlyProjection = computed(() => summary.value.yearlyProjection);
    const totalCount = computed(() => summary.value.totalCount);
    const activeCount = computed(() => summary.value.activeCount);
    const trialCount = computed(() => summary.value.trialCount);
    const endedCount = computed(() => summary.value.endedCount);
    const archivedCount = computed(() => summary.value.archivedCount);
    const activeSubscriptionsCount = computed(
      () => activeSubscriptions.value.length,
    );
    const invalidCount = computed(() => summary.value.invalidCount);
    const hasSubscriptions = computed(() => subscriptions.value.length > 0);
    const hasError = computed(() =>
      Boolean(loadError.value || mutationError.value),
    );
    const error = computed(() => loadError.value ?? mutationError.value);
    const isEmpty = computed(
      () => isLoaded.value && !isLoading.value && !hasSubscriptions.value,
    );
    const canRetry = computed(
      () => Boolean(loadError.value) && !isLoading.value,
    );
    const status = computed(() =>
      resolveRecoverableStatus({
        isLoading: isLoading.value,
        isLoaded: isLoaded.value,
        hasSubscriptions: hasSubscriptions.value,
        hasError: hasError.value,
      }),
    );

    async function load() {
      isLoading.value = true;
      clearError();

      try {
        subscriptions.value = await repository.list();
        isLoaded.value = true;

        return subscriptions.value;
      } catch (cause) {
        loadError.value = createStoreError(cause);
        throw cause;
      } finally {
        isLoading.value = false;
      }
    }

    async function create(payload) {
      return runMutation(async () => {
        const created = await repository.create(payload);

        upsertSubscription(created);

        return created;
      });
    }

    async function update(id, changes) {
      return runMutation(async () => {
        const updated = await repository.update(id, changes);

        upsertSubscription(updated);

        return updated;
      });
    }

    async function archive(id) {
      return runMutation(async () => {
        const archived = await repository.archive(id);

        upsertSubscription(archived);

        return archived;
      });
    }

    async function end(id) {
      return runMutation(async () => {
        const ended = await repository.end(id);

        upsertSubscription(ended);

        return ended;
      });
    }

    function reload() {
      return load();
    }

    function clearError() {
      loadError.value = null;
      mutationError.value = null;
    }

    async function runMutation(operation) {
      clearError();

      try {
        return await operation();
      } catch (cause) {
        mutationError.value = createStoreError(cause);
        throw cause;
      }
    }

    function upsertSubscription(subscription) {
      const index = subscriptions.value.findIndex(
        (item) => item.id === subscription.id,
      );

      if (index === -1) {
        subscriptions.value = [...subscriptions.value, subscription];
        return;
      }

      subscriptions.value = subscriptions.value.map((item, itemIndex) =>
        itemIndex === index ? subscription : item,
      );
    }

    return {
      subscriptions,
      isLoading,
      isLoaded,
      error,
      loadError,
      mutationError,
      hasSubscriptions,
      isEmpty,
      hasError,
      canRetry,
      status,
      summary,
      activeSubscriptions,
      trialAlerts,
      monthlyTotal,
      yearlyProjection,
      totalCount,
      activeCount,
      trialCount,
      endedCount,
      archivedCount,
      activeSubscriptionsCount,
      invalidCount,
      load,
      create,
      update,
      archive,
      end,
      reload,
      clearError,
    };
  });
}

export const useSubscriptionsStore = createSubscriptionsStore();

function resolveSummaryOptions(summaryOptions) {
  if (typeof summaryOptions === 'function') {
    return summaryOptions();
  }

  return summaryOptions ?? {};
}

function resolveRecoverableStatus({
  isLoading,
  isLoaded,
  hasSubscriptions,
  hasError,
}) {
  if (isLoading) {
    return SUBSCRIPTIONS_STORE_STATUS.LOADING;
  }

  if (isLoaded && hasSubscriptions) {
    return SUBSCRIPTIONS_STORE_STATUS.LOADED;
  }

  if (isLoaded) {
    return SUBSCRIPTIONS_STORE_STATUS.EMPTY;
  }

  if (hasError) {
    return SUBSCRIPTIONS_STORE_STATUS.ERROR;
  }

  return SUBSCRIPTIONS_STORE_STATUS.IDLE;
}

function createStoreError(cause) {
  return Object.freeze({
    code: normalizeErrorCode(cause),
    message: normalizeErrorMessage(cause),
    details: normalizeErrorDetails(cause),
  });
}

function normalizeErrorCode(cause) {
  const code = cause?.code;

  return typeof code === 'string' && code.trim()
    ? code
    : SUBSCRIPTIONS_STORE_ERROR_CODES.UNKNOWN;
}

function normalizeErrorMessage(cause) {
  const message = cause?.message;

  return typeof message === 'string' && message.trim()
    ? message
    : 'Nao foi possivel atualizar as assinaturas locais.';
}

function normalizeErrorDetails(cause) {
  const details = cause?.details;

  if (details && typeof details === 'object' && !Array.isArray(details)) {
    return Object.freeze({ ...details });
  }

  return Object.freeze({});
}
