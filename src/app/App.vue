<script setup>
import { computed } from 'vue';
import { useSubscriptionsStore } from '../stores/subscriptions/index.js';
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
import { getSubscriptionKey } from './subscriptionViewUtils.js';
import { useSubscriptionDashboard } from './useSubscriptionDashboard.js';
import { useSubscriptionReferenceDate } from './useSubscriptionReferenceDate.js';
import { useSubscriptionWorkflow } from './useSubscriptionWorkflow.js';

const { formatNumber, locale, t, tc } = useLocale();
const productName = computed(() => t('app.productName'));
const subscriptionsStore = useSubscriptionsStore();

const { currentDate } = useSubscriptionReferenceDate(subscriptionsStore, {
  loadSubscriptions,
});

const {
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
} = useSubscriptionDashboard({
  formatNumber,
  locale,
  subscriptionsStore,
  t,
  tc,
});

const {
  areCardActionsDisabled,
  clearSubscriptionFormError,
  closeConfirmDialog,
  closeSubscriptionForm,
  confirmDialogState,
  dismissToast,
  editingSubscription,
  handleConfirmedAction,
  handleUndoToastAction,
  isSubmittingSubscription,
  isSubscriptionFormOpen,
  openEditSubscriptionForm,
  openSubscriptionForm,
  requestArchiveSubscription,
  requestEndSubscription,
  submitSubscription,
  subscriptionActionError,
  subscriptionActionErrorMessage,
  subscriptionDialogEyebrow,
  subscriptionDialogTitle,
  subscriptionFormError,
  subscriptionFormKey,
  subscriptionFormMode,
  toastState,
} = useSubscriptionWorkflow({
  subscriptionsStore,
  t,
});

function loadSubscriptions() {
  return subscriptionsStore.load().catch(() => undefined);
}

function retrySubscriptionsLoad() {
  return subscriptionsStore.reload().catch(() => undefined);
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
