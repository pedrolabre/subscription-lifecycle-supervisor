<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  SUBSCRIPTIONS_STORE_STATUS,
  useSubscriptionsStore,
} from '../stores/subscriptions/index.js';
import { SUBSCRIPTION_STATUS } from '../domain/subscriptions/index.js';
import { formatCurrency } from '../core/money/index.js';
import {
  AppLogo,
  BaseButton,
  ConfirmDialog,
  LocaleToggle,
  StatePanel,
  StatusBadge,
  SummaryMetric,
  ThemeToggle,
  UndoToast,
} from '../shared/components/index.js';
import { useLocale } from '../shared/i18n/index.js';
import { SubscriptionCard } from '../features/subscription-card/index.js';
import {
  NewSubscriptionForm,
  SubscriptionFormDialog,
} from '../features/subscription-form/index.js';

const { formatNumber, locale, t, tc } = useLocale();
const productName = computed(() => t('app.productName'));
const subscriptionsStore = useSubscriptionsStore();
const isSubscriptionFormOpen = ref(false);
const editingSubscription = ref(null);
const isSubmittingSubscription = ref(false);
const isRunningLifecycleAction = ref(false);
const subscriptionFormError = ref(null);
const subscriptionActionError = ref(null);
const currentDate = ref(new Date());
let currentDateTimer = null;

syncCurrentDate();

const storeStatusMessageKeys = {
  [SUBSCRIPTIONS_STORE_STATUS.IDLE]: 'storeStatus.idle',
  [SUBSCRIPTIONS_STORE_STATUS.LOADING]: 'storeStatus.loading',
  [SUBSCRIPTIONS_STORE_STATUS.EMPTY]: 'storeStatus.empty',
  [SUBSCRIPTIONS_STORE_STATUS.ERROR]: 'storeStatus.error',
  [SUBSCRIPTIONS_STORE_STATUS.LOADED]: 'storeStatus.loaded',
};

const storeStatusLabel = computed(
  () =>
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

const trialAlertSummary = computed(
  () => tc('summary.trialAlertSummary', trialAlertCount.value),
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

const subscriptionFormMode = computed(() =>
  editingSubscription.value ? 'edit' : 'create',
);

const subscriptionDialogEyebrow = computed(() =>
  editingSubscription.value ? t('dialog.editEyebrow') : t('dialog.createEyebrow'),
);

const subscriptionDialogTitle = computed(() =>
  editingSubscription.value ? t('dialog.editTitle') : t('dialog.createTitle'),
);

const subscriptionFormKey = computed(
  () =>
    `${subscriptionFormMode.value}-${
      resolveSubscriptionId(editingSubscription.value) || 'new'
    }`,
);

const subscriptionActionErrorMessage = computed(
  () =>
    subscriptionActionError.value?.message ??
    t('errors.updateSubscription'),
);

const areCardActionsDisabled = computed(
  () =>
    isSubscriptionFormOpen.value ||
    isSubmittingSubscription.value ||
    isRunningLifecycleAction.value,
);

onMounted(() => {
  updateCurrentDate();
  currentDateTimer = setInterval(updateCurrentDate, 60 * 1000);
  currentDateTimer?.unref?.();

  if (!subscriptionsStore.isLoaded && !subscriptionsStore.isLoading) {
    loadSubscriptions();
  }
});

onUnmounted(() => {
  if (currentDateTimer !== null) {
    clearInterval(currentDateTimer);
  }
});

function updateCurrentDate() {
  currentDate.value = new Date();
  syncCurrentDate();
}

function syncCurrentDate() {
  if (typeof subscriptionsStore.setReferenceDate === 'function') {
    subscriptionsStore.setReferenceDate(currentDate.value);
  }
}

function loadSubscriptions() {
  return subscriptionsStore.load().catch(() => undefined);
}

function retrySubscriptionsLoad() {
  return subscriptionsStore.reload().catch(() => undefined);
}

function openSubscriptionForm() {
  editingSubscription.value = null;
  isSubscriptionFormOpen.value = true;
  clearSubscriptionFormError();
  clearSubscriptionActionError();
}

function openEditSubscriptionForm(subscription) {
  const subscriptionId = resolveSubscriptionId(subscription);

  if (!subscriptionId) {
    subscriptionActionError.value = createLocalMutationError(
      t('errors.missingSubscriptionIdForEdit'),
    );
    return;
  }

  editingSubscription.value =
    resolvePersistedSubscription(subscriptionId) ?? subscription;
  isSubscriptionFormOpen.value = true;
  clearSubscriptionFormError();
  clearSubscriptionActionError();
}

function closeSubscriptionForm() {
  isSubscriptionFormOpen.value = false;
  editingSubscription.value = null;
  clearSubscriptionFormError();
}

function clearSubscriptionFormError() {
  subscriptionFormError.value = null;
}

function clearSubscriptionActionError() {
  subscriptionActionError.value = null;
}

async function submitSubscription(payload) {
  isSubmittingSubscription.value = true;
  clearSubscriptionFormError();
  clearSubscriptionActionError();

  try {
    if (editingSubscription.value) {
      const subscriptionId = resolveSubscriptionId(editingSubscription.value);

      if (!subscriptionId) {
        throw createLocalMutationError(
          t('errors.missingSubscriptionIdForEdit'),
        );
      }

      await subscriptionsStore.update(subscriptionId, payload);
    } else {
      await subscriptionsStore.create(payload);
    }

    closeSubscriptionForm();
  } catch (cause) {
    subscriptionFormError.value =
      subscriptionsStore.mutationError ??
      normalizeMutationError(
        cause,
        t('errors.saveSubscription'),
      );
  } finally {
    isSubmittingSubscription.value = false;
  }
}

const confirmDialogState = ref({
  open: false,
  title: '',
  message: '',
  confirmLabel: '',
  tone: 'archive',
  targetSubscription: null,
  action: null,
});

const toastState = ref({
  visible: false,
  message: '',
  actionLabel: '',
  subscriptionId: null,
  previousStatus: null,
});

function requestArchiveSubscription(subscription) {
  const name = normalizeSubscriptionName(subscription) || t('card.fallbackName');
  const isArchived = subscription?.status === SUBSCRIPTION_STATUS.ARCHIVED;

  if (isArchived) {
    confirmDialogState.value = {
      open: true,
      title: t('confirmDialog.unarchiveTitle'),
      message: t('confirmDialog.unarchiveMessage', { name }),
      confirmLabel: t('confirmDialog.unarchiveConfirm'),
      tone: 'archive',
      targetSubscription: subscription,
      action: 'unarchive',
    };
    return;
  }

  confirmDialogState.value = {
    open: true,
    title: t('confirmDialog.archiveTitle'),
    message: t('confirmDialog.archiveMessage', { name }),
    confirmLabel: t('confirmDialog.archiveConfirm'),
    tone: 'archive',
    targetSubscription: subscription,
    action: 'archive',
  };
}

function requestEndSubscription(subscription) {
  const name = normalizeSubscriptionName(subscription) || t('card.fallbackName');

  confirmDialogState.value = {
    open: true,
    title: t('confirmDialog.endTitle'),
    message: t('confirmDialog.endMessage', { name }),
    confirmLabel: t('confirmDialog.endConfirm'),
    tone: 'end',
    targetSubscription: subscription,
    action: 'end',
  };
}

function closeConfirmDialog() {
  confirmDialogState.value.open = false;
}

async function handleConfirmedAction() {
  const { action, targetSubscription } = confirmDialogState.value;
  closeConfirmDialog();

  if (!targetSubscription) {
    return;
  }

  const subscriptionId = resolveSubscriptionId(targetSubscription);
  const name = normalizeSubscriptionName(targetSubscription) || t('card.fallbackName');
  const previousStatus = String(targetSubscription.status || 'active');

  if (action === 'archive') {
    await archiveSubscription(targetSubscription);

    toastState.value = {
      visible: true,
      message: t('toast.archived', { name }),
      actionLabel: t('toast.undo'),
      subscriptionId,
      previousStatus,
    };
  } else if (action === 'unarchive') {
    await subscriptionsStore.update(subscriptionId, {
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });

    toastState.value = {
      visible: true,
      message: t('toast.unarchived', { name }),
      actionLabel: '',
      subscriptionId: null,
      previousStatus: null,
    };
  } else if (action === 'end') {
    await endSubscription(targetSubscription);

    toastState.value = {
      visible: true,
      message: t('toast.ended', { name }),
      actionLabel: '',
      subscriptionId: null,
      previousStatus: null,
    };
  }
}

async function handleUndoToastAction() {
  const { subscriptionId, previousStatus } = toastState.value;
  toastState.value.visible = false;

  if (!subscriptionId) {
    return;
  }

  try {
    const targetStatus =
      previousStatus && previousStatus !== 'archived'
        ? previousStatus
        : 'active';

    await subscriptionsStore.update(subscriptionId, {
      status: targetStatus,
    });

    toastState.value = {
      visible: true,
      message: t('toast.undone'),
      actionLabel: '',
      subscriptionId: null,
      previousStatus: null,
    };
  } catch (cause) {
    subscriptionActionError.value =
      subscriptionsStore.mutationError ??
      normalizeMutationError(cause, t('errors.updateSubscription'));
  }
}

function dismissToast() {
  toastState.value.visible = false;
}

async function archiveSubscription(subscription) {
  await runLifecycleMutation(
    subscription,
    'archive',
    t('errors.archiveSubscription'),
  );
}

async function endSubscription(subscription) {
  await runLifecycleMutation(
    subscription,
    'end',
    t('errors.endSubscription'),
  );
}

async function runLifecycleMutation(subscription, action, fallbackMessage) {
  if (isRunningLifecycleAction.value) {
    return;
  }

  const subscriptionId = resolveSubscriptionId(subscription);

  if (!subscriptionId) {
    subscriptionActionError.value = createLocalMutationError(
      t('errors.missingSubscriptionId'),
    );
    return;
  }

  isRunningLifecycleAction.value = true;
  clearSubscriptionActionError();
  clearSubscriptionFormError();

  try {
    await subscriptionsStore[action](subscriptionId);
  } catch (cause) {
    subscriptionActionError.value =
      subscriptionsStore.mutationError ??
      normalizeMutationError(cause, fallbackMessage);
  } finally {
    isRunningLifecycleAction.value = false;
  }
}

function getSubscriptionKey(subscription, index) {
  return (
    subscription.id ??
    `${subscription.serviceName ?? 'subscription'}-${index}`
  );
}

function formatCount(value) {
  return formatNumber(normalizeCount(value));
}

function normalizeCount(value) {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function normalizeSubscriptionName(subscription) {
  const name = subscription?.serviceName ?? subscription?.service?.name;

  return typeof name === 'string' && name.trim() ? name.trim() : '';
}

function formatNameList(names) {
  return new Intl.ListFormat(locale.value, {
    style: 'long',
    type: 'conjunction',
  }).format(names);
}

function resolveSubscriptionId(subscription) {
  const id = subscription?.id;

  return typeof id === 'string' && id.trim() ? id.trim() : '';
}

function resolvePersistedSubscription(subscriptionId) {
  const subscriptions = Array.isArray(subscriptionsStore.subscriptions)
    ? subscriptionsStore.subscriptions
    : [];

  return (
    subscriptions.find(
      (subscription) => resolveSubscriptionId(subscription) === subscriptionId,
    ) ?? null
  );
}

function normalizeMutationError(cause, fallbackMessage) {
  if (cause && typeof cause === 'object') {
    return cause;
  }

  return createLocalMutationError(fallbackMessage);
}

function createLocalMutationError(message) {
  return {
    message,
    details: {},
  };
}
</script>

<template>
  <div
    class="app-shell"
    aria-labelledby="app-title"
  >
    <header
      class="app-header"
      aria-labelledby="app-title"
    >
      <div class="app-identity">
        <AppLogo class="app-identity-logo" />
        <h1 id="app-title">
          {{ productName }}
        </h1>
      </div>

      <div
        class="app-header-actions"
        :aria-label="t('app.headerActionsLabel')"
      >
        <div class="app-preference-controls">
          <ThemeToggle />
          <LocaleToggle />
        </div>

        <StatusBadge
          class="app-header-status"
          tone="info"
        >
          {{ storeStatusLabel }}
        </StatusBadge>
        <BaseButton
          class="app-primary-action"
          data-test="open-subscription-form"
          type="button"
          variant="primary"
          aria-controls="subscription-form-dialog"
          aria-haspopup="dialog"
          :aria-expanded="isSubscriptionFormOpen"
          :disabled="isLoadingState || isSubmittingSubscription"
          @click="openSubscriptionForm"
        >
          {{ t('app.primaryAction') }}
        </BaseButton>
      </div>
    </header>

    <main
      class="app-main"
      :aria-label="t('app.dashboardLabel')"
    >
      <div class="dashboard-grid">
        <section
          class="app-summary-region"
          aria-labelledby="summary-title"
        >
          <div class="section-heading">
            <p class="section-label">
              {{ t('summary.eyebrow') }}
            </p>
            <h2 id="summary-title">
              {{ t('summary.title') }}
            </h2>
          </div>

          <dl class="summary-grid">
            <SummaryMetric
              v-for="item in summaryMetrics"
              :key="item.label"
              :detail="item.detail"
              :label="item.label"
              :value="item.value"
            />
          </dl>

          <div
            v-if="hasTrialAlerts"
            class="trial-summary-alert"
            role="status"
            aria-live="polite"
          >
            <StatusBadge tone="trial">
              Trial
            </StatusBadge>
            <div class="trial-summary-alert__copy">
              <p class="trial-summary-alert__title">
                {{ trialAlertSummary }}
              </p>
              <p class="trial-summary-alert__detail">
                {{ trialAlertDetail }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="app-list-region"
          aria-labelledby="subscriptions-title"
        >
          <div class="section-heading">
            <p class="section-label">
              {{ t('summary.subscriptionsEyebrow') }}
            </p>
            <h2 id="subscriptions-title">
              {{ t('summary.subscriptionsTitle') }}
            </h2>
          </div>

          <p
            v-if="subscriptionActionError"
            class="subscription-action-error"
            role="alert"
          >
            {{ subscriptionActionErrorMessage }}
          </p>

          <div
            class="subscriptions-list-shell"
            :aria-busy="isLoadingState"
            :aria-label="t('aria.subscriptionsListArea')"
            aria-live="polite"
          >
            <div
              v-if="isLoadingState"
              class="loading-state subscription-card-grid"
              role="status"
              :aria-label="t('states.loadingSubscriptions')"
            >
              <span class="sr-only">
                {{ t('states.loadingSubscriptions') }}
              </span>
              <article
                v-for="cardIndex in 4"
                :key="cardIndex"
                class="subscription-card-skeleton"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
                <span />
              </article>
            </div>

            <StatePanel
              v-else-if="isErrorState"
              :action-label="
                subscriptionsStore.canRetry ? t('buttons.retry') : ''
              "
              :description="errorMessage"
              :eyebrow="t('states.errorEyebrow')"
              role="alert"
              :title="t('states.errorTitle')"
              tone="error"
              @action="retrySubscriptionsLoad"
            />

            <StatePanel
              v-else-if="isEmptyState"
              :description="t('states.emptyDescription')"
              :eyebrow="t('states.emptyEyebrow')"
              :title="t('states.emptyTitle')"
              tone="empty"
            />

            <div
              v-else-if="isLoadedState"
              class="subscription-card-grid"
              role="list"
              :aria-label="subscriptionsListLabel"
            >
              <SubscriptionCard
                v-for="(subscription, index) in subscriptionCards"
                :key="getSubscriptionKey(subscription, index)"
                :actions-disabled="areCardActionsDisabled"
                :reference-date="currentDate"
                :subscription="subscription"
                @archive="requestArchiveSubscription"
                @edit="openEditSubscriptionForm"
                @end="requestEndSubscription"
              />
            </div>

            <StatePanel
              v-else
              :description="t('states.emptyDescription')"
              :eyebrow="t('states.emptyEyebrow')"
              :title="t('states.emptyTitle')"
              tone="empty"
            />
          </div>
        </section>
      </div>

      <SubscriptionFormDialog
        :eyebrow="subscriptionDialogEyebrow"
        :open="isSubscriptionFormOpen"
        title-id="new-subscription-title"
        :title="subscriptionDialogTitle"
        @close="closeSubscriptionForm"
      >
        <NewSubscriptionForm
          v-if="isSubscriptionFormOpen"
          :key="subscriptionFormKey"
          embedded
          :is-submitting="isSubmittingSubscription"
          :mode="subscriptionFormMode"
          :show-header="false"
          :submission-error="subscriptionFormError"
          :subscription="editingSubscription"
          title-id="new-subscription-title"
          @cancel="closeSubscriptionForm"
          @change="clearSubscriptionFormError"
          @submit="submitSubscription"
        />
      </SubscriptionFormDialog>

      <ConfirmDialog
        :cancel-label="t('confirmDialog.cancel')"
        :confirm-label="confirmDialogState.confirmLabel"
        :message="confirmDialogState.message"
        :open="confirmDialogState.open"
        :title="confirmDialogState.title"
        :tone="confirmDialogState.tone"
        @cancel="closeConfirmDialog"
        @confirm="handleConfirmedAction"
      />

      <UndoToast
        :action-label="toastState.actionLabel"
        :message="toastState.message"
        :visible="toastState.visible"
        @action="handleUndoToastAction"
        @dismiss="dismissToast"
      />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  width: min(calc(100% - 20px), var(--content-width));
  min-height: 100vh;
  grid-template-rows: auto 1fr;
  margin: 0 auto;
  padding-bottom: 0.875rem;
}

.app-header {
  display: flex;
  min-height: 4.25rem;
  gap: 0.875rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.app-identity {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: min(100%, 22rem);
}

.app-identity-logo {
  height: 3.5rem;
  width: auto;
  flex-shrink: 0;
}

.app-context,
.section-label {
  margin: 0;
  color: var(--text-accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.app-header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.app-header-actions > * {
  max-width: 100%;
}

.app-preference-controls {
  display: flex;
  flex: 0 0 auto;
  gap: var(--space-2);
  align-items: center;
}

.app-header-status {
  min-width: 0;
  border-color: var(--border-subtle);
  color: var(--text-muted);
  background: transparent;
  font-weight: 500;
}

h1,
h2 {
  overflow-wrap: anywhere;
}

h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-tight);
  letter-spacing: 0;
}

.app-main {
  display: grid;
  align-content: start;
  gap: var(--space-5);
  min-width: 0;
  padding-top: 1.25rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 0.875rem;
  align-items: start;
  min-width: 0;
}

.app-summary-region,
.app-list-region {
  display: grid;
  min-width: 0;
  gap: var(--space-3);
}

.section-heading {
  display: grid;
  gap: var(--space-2);
}

h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-tight);
  letter-spacing: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.4375rem;
  margin: 0;
}

.trial-summary-alert {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  border: 1px solid var(--status-trial-border);
  border-radius: var(--radius-lg);
  background: var(--status-trial-surface);
}

.trial-summary-alert__copy {
  display: grid;
  min-width: 0;
  gap: var(--space-1);
}

.trial-summary-alert__title,
.trial-summary-alert__detail {
  margin: 0;
}

.trial-summary-alert__title {
  color: var(--text-primary);
  font-weight: 700;
}

.trial-summary-alert__detail {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  overflow-wrap: anywhere;
}

.subscription-action-error {
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--status-ended-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: var(--status-ended-surface);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.subscriptions-list-shell {
  min-width: 0;
  overflow: visible;
}

.subscription-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  min-width: 0;
}

.subscription-card-skeleton {
  display: grid;
  min-height: 11.125rem;
  gap: var(--space-3);
  align-content: start;
  padding: 0.625rem 0.75rem 0.5625rem 0.875rem;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(
      135deg,
      var(--skeleton-brand-surface),
      var(--surface-base) 45%,
      var(--surface-base) 100%
    );
}

.subscription-card-skeleton span {
  display: block;
  height: 0.625rem;
  background:
    linear-gradient(
      90deg,
      var(--skeleton-shimmer-start),
      var(--skeleton-shimmer-mid),
      var(--skeleton-shimmer-start)
    );
}

.subscription-card-skeleton span:first-child {
  width: 1.875rem;
  height: 1.875rem;
}

.subscription-card-skeleton span:nth-child(2) {
  width: min(100%, 9rem);
  height: 0.875rem;
  margin-top: var(--space-2);
}

.subscription-card-skeleton span:nth-child(3) {
  width: min(100%, 6rem);
}

.subscription-card-skeleton span:nth-child(4) {
  align-self: end;
  width: 100%;
  margin-top: auto;
}

.subscriptions-list-shell :deep(.state-panel) {
  min-height: 17.1875rem;
  border: 1px solid var(--border-subtle);
}

@media (max-width: 1150px) {
  .subscription-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 850px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-grid :deep(.summary-metric:last-child) {
    grid-column: 1 / -1;
  }

  .subscription-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .subscriptions-list-shell :deep(.state-panel) {
    min-height: 11.25rem;
  }
}

@media (max-width: 700px) {
  .app-shell {
    width: min(calc(100% - 24px), var(--content-width));
  }

  .app-header {
    flex-wrap: wrap;
    align-items: stretch;
    padding: 1.125rem 0;
  }

  .app-header-actions,
  .app-primary-action {
    width: 100%;
  }

  .app-header-actions {
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: flex-start;
  }

  .app-header-status {
    flex: 1 1 8rem;
    justify-content: center;
  }

  .app-primary-action {
    flex: 1 1 100%;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid :deep(.summary-metric:last-child) {
    grid-column: auto;
  }
}

@media (max-width: 540px) {
  .subscription-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
