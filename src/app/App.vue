<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  SUBSCRIPTIONS_STORE_STATUS,
  useSubscriptionsStore,
} from '../stores/subscriptions/index.js';
import { formatCurrency } from '../core/money/index.js';
import {
  BaseButton,
  StatePanel,
  StatusBadge,
  SummaryMetric,
} from '../shared/components/index.js';
import { SubscriptionCard } from '../features/subscription-card/index.js';
import {
  NewSubscriptionForm,
  SubscriptionFormDialog,
} from '../features/subscription-form/index.js';

const productName = 'Subscription Lifecycle Supervisor';
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

const storeStatusLabels = {
  [SUBSCRIPTIONS_STORE_STATUS.IDLE]: 'Preparando leitura local',
  [SUBSCRIPTIONS_STORE_STATUS.LOADING]: 'Carregando dados locais',
  [SUBSCRIPTIONS_STORE_STATUS.EMPTY]: 'Nenhuma assinatura',
  [SUBSCRIPTIONS_STORE_STATUS.ERROR]: 'Leitura local indisponivel',
  [SUBSCRIPTIONS_STORE_STATUS.LOADED]: 'Dados carregados',
};

const storeStatusLabel = computed(
  () =>
    storeStatusLabels[subscriptionsStore.status] ??
    storeStatusLabels[SUBSCRIPTIONS_STORE_STATUS.IDLE],
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
    'Nao foi possivel ler as assinaturas locais.',
);

const trialAlerts = computed(() =>
  Array.isArray(subscriptionsStore.trialAlerts)
    ? subscriptionsStore.trialAlerts
    : [],
);

const trialAlertCount = computed(() => trialAlerts.value.length);

const hasTrialAlerts = computed(() => trialAlertCount.value > 0);

const trialAlertSummary = computed(
  () =>
    `${formatCount(trialAlertCount.value)} ${
      trialAlertCount.value === 1
        ? 'trial perto do vencimento'
        : 'trials perto do vencimento'
    }`,
);

const trialAlertDetail = computed(() => {
  const names = trialAlerts.value
    .map((subscription) => normalizeSubscriptionName(subscription))
    .filter(Boolean);

  if (names.length === 0) {
    return 'Revise os acessos temporarios.';
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return names.join(' e ');
  }

  return `${names.slice(0, 2).join(', ')} e mais ${names.length - 2}`;
});

const summaryMetrics = computed(() => [
  {
    label: 'Mensal',
    value: formatCurrency(subscriptionsStore.monthlyTotal),
    detail: 'Custo normalizado',
  },
  {
    label: 'Anual',
    value: formatCurrency(subscriptionsStore.yearlyProjection),
    detail: 'Projecao recorrente',
  },
  {
    label: 'Ativas',
    value: formatCount(subscriptionsStore.activeCount),
    detail: 'Status ativo',
  },
  {
    label: 'Trials',
    value: formatCount(subscriptionsStore.trialCount),
    detail: formatCountDetail(
      trialAlertCount.value,
      'alerta perto do fim',
      'alertas perto do fim',
    ),
  },
  {
    label: 'Encerradas',
    value: formatCount(subscriptionsStore.endedCount),
    detail: formatCountDetail(
      subscriptionsStore.archivedCount,
      'arquivada',
      'arquivadas',
    ),
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

  return `${formatCount(count)} ${
    count === 1 ? 'assinatura carregada' : 'assinaturas carregadas'
  }`;
});

const subscriptionFormMode = computed(() =>
  editingSubscription.value ? 'edit' : 'create',
);

const subscriptionDialogEyebrow = computed(() =>
  editingSubscription.value ? 'Edicao local' : 'Cadastro local',
);

const subscriptionDialogTitle = computed(() =>
  editingSubscription.value ? 'Editar assinatura' : 'Nova assinatura',
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
    'Nao foi possivel atualizar a assinatura local.',
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
      'Assinatura local sem identificador para edicao.',
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
          'Assinatura local sem identificador para edicao.',
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
        'Nao foi possivel salvar a assinatura local.',
      );
  } finally {
    isSubmittingSubscription.value = false;
  }
}

async function archiveSubscription(subscription) {
  await runLifecycleMutation(
    subscription,
    'archive',
    'Nao foi possivel arquivar a assinatura local.',
  );
}

async function endSubscription(subscription) {
  await runLifecycleMutation(
    subscription,
    'end',
    'Nao foi possivel encerrar a assinatura local.',
  );
}

async function runLifecycleMutation(subscription, action, fallbackMessage) {
  if (isRunningLifecycleAction.value) {
    return;
  }

  const subscriptionId = resolveSubscriptionId(subscription);

  if (!subscriptionId) {
    subscriptionActionError.value = createLocalMutationError(
      'Assinatura local sem identificador.',
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
  return String(normalizeCount(value));
}

function formatCountDetail(value, singular, plural) {
  const count = normalizeCount(value);

  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

function normalizeCount(value) {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function normalizeSubscriptionName(subscription) {
  const name = subscription?.serviceName ?? subscription?.service?.name;

  return typeof name === 'string' && name.trim() ? name.trim() : '';
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
        <p class="app-context">
          Painel local
        </p>
        <h1 id="app-title">
          {{ productName }}
        </h1>
      </div>

      <div
        class="app-header-actions"
        aria-label="Acao principal"
      >
        <StatusBadge tone="info">
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
          Nova assinatura
        </BaseButton>
      </div>
    </header>

    <main
      class="app-main"
      aria-label="Painel de assinaturas"
    >
      <div class="dashboard-grid">
        <section
          class="app-summary-region"
          aria-labelledby="summary-title"
        >
          <div class="section-heading">
            <p class="section-label">
              Resumo
            </p>
            <h2 id="summary-title">
              Ciclo atual
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
              Assinaturas
            </p>
            <h2 id="subscriptions-title">
              Lista local
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
            aria-label="Area da lista de assinaturas"
            aria-live="polite"
          >
            <div
              v-if="isLoadingState"
              class="loading-state subscription-card-grid"
              role="status"
              aria-label="Carregando assinaturas locais"
            >
              <span class="sr-only">
                Carregando assinaturas locais
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
                subscriptionsStore.canRetry ? 'Tentar novamente' : ''
              "
              :description="errorMessage"
              eyebrow="Leitura local"
              role="alert"
              title="Nao foi possivel carregar as assinaturas"
              tone="error"
              @action="retrySubscriptionsLoad"
            />

            <StatePanel
              v-else-if="isEmptyState"
              description="Sua lista local ainda nao tem assinaturas. Os dados aparecerao aqui depois do primeiro cadastro."
              eyebrow="Lista local"
              title="Nenhuma assinatura salva"
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
                @archive="archiveSubscription"
                @edit="openEditSubscriptionForm"
                @end="endSubscription"
              />
            </div>

            <StatePanel
              v-else
              description="Sua lista local ainda nao tem assinaturas. Os dados aparecerao aqui depois do primeiro cadastro."
              eyebrow="Lista local"
              title="Nenhuma assinatura salva"
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
  display: grid;
  gap: var(--space-2);
  min-width: min(100%, 22rem);
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
      rgb(117 242 218 / 12%),
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
      rgb(245 242 230 / 8%),
      rgb(245 242 230 / 16%),
      rgb(245 242 230 / 8%)
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

  .app-primary-action {
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
