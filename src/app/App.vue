<script setup>
import { computed, onMounted, ref } from 'vue';
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
import { NewSubscriptionForm } from '../features/subscription-form/index.js';

const productName = 'Subscription Lifecycle Supervisor';
const subscriptionsStore = useSubscriptionsStore();
const isSubscriptionFormOpen = ref(false);
const editingSubscription = ref(null);
const isSubmittingSubscription = ref(false);
const isRunningLifecycleAction = ref(false);
const subscriptionFormError = ref(null);
const subscriptionActionError = ref(null);

const listColumns = ['Servico', 'Valor', 'Data'];

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
  if (!subscriptionsStore.isLoaded && !subscriptionsStore.isLoading) {
    loadSubscriptions();
  }
});

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
          aria-controls="new-subscription-form"
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

      <NewSubscriptionForm
        v-if="isSubscriptionFormOpen"
        :key="subscriptionFormKey"
        :is-submitting="isSubmittingSubscription"
        :mode="subscriptionFormMode"
        :submission-error="subscriptionFormError"
        :subscription="editingSubscription"
        @cancel="closeSubscriptionForm"
        @change="clearSubscriptionFormError"
        @submit="submitSubscription"
      />

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
            class="loading-state"
            role="status"
            aria-label="Carregando assinaturas locais"
          >
            <div class="list-columns">
              <span
                v-for="column in listColumns"
                :key="column"
              >
                {{ column }}
              </span>
            </div>

            <div
              v-for="rowIndex in 3"
              :key="rowIndex"
              class="list-row-slot is-loading"
            >
              <span />
              <span />
              <span />
            </div>
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
            class="loaded-state"
          >
            <div
              class="subscription-card-grid"
              role="list"
              :aria-label="subscriptionsListLabel"
            >
              <SubscriptionCard
                v-for="(subscription, index) in subscriptionCards"
                :key="getSubscriptionKey(subscription, index)"
                :actions-disabled="areCardActionsDisabled"
                :subscription="subscription"
                @archive="archiveSubscription"
                @edit="openEditSubscriptionForm"
                @end="endSubscription"
              />
            </div>
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
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr;
  gap: var(--space-5);
}

.app-header,
.app-main {
  width: min(100% - var(--space-6), 1120px);
  margin: 0 auto;
}

.app-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) 0 var(--space-4);
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
  flex-wrap: wrap;
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
  gap: var(--space-7);
  padding: var(--space-2) 0 var(--space-8);
}

.app-summary-region,
.app-list-region {
  display: grid;
  gap: var(--space-4);
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: var(--space-3);
  margin: 0;
}

.trial-summary-alert {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
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
  font-weight: 900;
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

.list-columns {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.list-columns {
  font-weight: 700;
}

.subscriptions-list-shell {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
}

.list-columns,
.list-row-slot {
  display: grid;
  grid-template-columns:
    minmax(9rem, 1.4fr) minmax(7rem, 0.85fr) minmax(6rem, 0.6fr);
  gap: var(--space-3);
  align-items: center;
}

.list-columns {
  min-height: 3rem;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.list-columns span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.list-row-slot {
  min-height: 4.75rem;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.list-row-slot:last-child {
  border-bottom: 0;
}

.list-row-slot span {
  display: block;
  height: 0.75rem;
  border-radius: var(--radius-pill);
  background:
    linear-gradient(
      90deg,
      rgb(245 242 232 / 8%),
      rgb(245 242 232 / 16%),
      rgb(245 242 232 / 8%)
    );
}

.list-row-slot span:nth-child(1) {
  width: min(100%, 13rem);
}

.list-row-slot span:nth-child(2) {
  width: min(100%, 9rem);
}

.list-row-slot span:nth-child(3) {
  width: min(100%, 6rem);
}

.subscription-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16.5rem), 1fr));
  gap: var(--space-4);
  min-width: 0;
  padding: var(--space-4);
}

@media (max-width: 700px) {
  .app-header,
  .app-main {
    width: min(100% - var(--space-4), 960px);
  }

  .app-header,
  .app-header-actions {
    align-items: stretch;
  }

  .app-header-actions,
  .app-primary-action {
    width: 100%;
  }

  .app-primary-action {
    justify-content: center;
  }

  .list-columns {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  }

  .list-columns span:nth-child(2) {
    display: none;
  }

  .list-row-slot {
    grid-template-columns: 1fr;
    align-content: center;
  }
}
</style>
