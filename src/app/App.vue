<script setup>
import { computed, onMounted } from 'vue';
import {
  SUBSCRIPTIONS_STORE_STATUS,
  useSubscriptionsStore,
} from '../stores/subscriptions/index.js';

const productName = 'Subscription Lifecycle Supervisor';
const subscriptionsStore = useSubscriptionsStore();

const summaryItems = [
  {
    label: 'Mensal',
    value: '--',
    detail: 'Custo normalizado',
  },
  {
    label: 'Anual',
    value: '--',
    detail: 'Projecao',
  },
  {
    label: 'Ativas',
    value: '--',
    detail: 'Assinaturas',
  },
];

const listColumns = ['Servico', 'Renovacao', 'Status'];

const storeStatusLabels = {
  [SUBSCRIPTIONS_STORE_STATUS.IDLE]: 'Preparando leitura local',
  [SUBSCRIPTIONS_STORE_STATUS.LOADING]: 'Carregando dados locais',
  [SUBSCRIPTIONS_STORE_STATUS.EMPTY]: 'Nenhuma assinatura',
  [SUBSCRIPTIONS_STORE_STATUS.ERROR]: 'Leitura local indisponivel',
  [SUBSCRIPTIONS_STORE_STATUS.LOADED]: 'Dados carregados',
};

const subscriptionStatusLabels = {
  active: 'Ativa',
  trial: 'Trial',
  ended: 'Encerrada',
  archived: 'Arquivada',
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

const isErrorState = computed(
  () =>
    subscriptionsStore.status === SUBSCRIPTIONS_STORE_STATUS.ERROR ||
    (subscriptionsStore.hasError && !subscriptionsStore.hasSubscriptions),
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

const subscriptionRows = computed(() =>
  subscriptionsStore.subscriptions.map((subscription) => ({
    id: subscription.id ?? subscription.serviceName,
    serviceName: normalizeText(subscription.serviceName, 'Assinatura local'),
    renewalLabel: resolveRenewalLabel(subscription),
    statusLabel:
      subscriptionStatusLabels[subscription.status] ??
      normalizeText(subscription.status, 'Status local'),
  })),
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

function resolveRenewalLabel(subscription) {
  if (hasText(subscription.trialEndDate)) {
    return `Trial ate ${formatLocalDate(subscription.trialEndDate)}`;
  }

  if (hasText(subscription.renewalDate)) {
    return `Renova em ${formatLocalDate(subscription.renewalDate)}`;
  }

  return 'Sem data local';
}

function formatLocalDate(value) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function normalizeText(value, fallback) {
  return hasText(value) ? value.trim() : fallback;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
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
        <span class="app-local-badge">{{ storeStatusLabel }}</span>
        <button
          class="app-primary-action"
          type="button"
        >
          Nova assinatura
        </button>
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
          <div
            v-for="item in summaryItems"
            :key="item.label"
            class="summary-item"
          >
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
            <span>{{ item.detail }}</span>
          </div>
        </dl>
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

          <div
            v-else-if="isErrorState"
            class="state-panel state-panel--error"
            role="alert"
          >
            <p class="state-eyebrow">
              Leitura local
            </p>
            <h3>Nao foi possivel carregar as assinaturas</h3>
            <p>{{ errorMessage }}</p>
            <button
              v-if="subscriptionsStore.canRetry"
              class="state-action"
              type="button"
              @click="retrySubscriptionsLoad"
            >
              Tentar novamente
            </button>
          </div>

          <div
            v-else-if="isEmptyState"
            class="state-panel state-panel--empty"
          >
            <p class="state-eyebrow">
              Lista local
            </p>
            <h3>Nenhuma assinatura salva</h3>
            <p>
              Sua lista local ainda nao tem assinaturas. Os dados aparecerao
              aqui depois do primeiro cadastro.
            </p>
          </div>

          <div
            v-else-if="isLoadedState"
            class="loaded-state"
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
              class="loaded-list"
              role="list"
              aria-label="Assinaturas carregadas"
            >
              <div
                v-for="subscription in subscriptionRows"
                :key="subscription.id"
                class="loaded-row"
                role="listitem"
              >
                <span>{{ subscription.serviceName }}</span>
                <span>{{ subscription.renewalLabel }}</span>
                <span>{{ subscription.statusLabel }}</span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="state-panel state-panel--empty"
          >
            <p class="state-eyebrow">
              Lista local
            </p>
            <h3>Nenhuma assinatura salva</h3>
            <p>
              Sua lista local ainda nao tem assinaturas. Os dados aparecerao
              aqui depois do primeiro cadastro.
            </p>
          </div>
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

.app-local-badge {
  display: inline-flex;
  min-height: var(--control-height-sm);
  align-items: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--status-info-border);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
  background: var(--status-info-surface);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.app-primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-color: var(--status-active-border);
  color: var(--text-inverse);
  background: var(--status-active);
}

.app-primary-action:hover:not(:disabled) {
  border-color: var(--text-accent);
  background: var(--text-accent);
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.summary-item {
  display: grid;
  min-height: 8rem;
  align-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
}

.summary-item dt,
.summary-item span,
.list-columns {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.summary-item dt,
.list-columns {
  font-weight: 700;
}

.summary-item dd {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-2xl);
  font-weight: 800;
  line-height: var(--line-tight);
  overflow-wrap: anywhere;
}

.subscriptions-list-shell {
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
}

.list-columns,
.list-row-slot,
.loaded-row {
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

.list-row-slot,
.loaded-row {
  min-height: 4.75rem;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.list-row-slot:last-child,
.loaded-row:last-child {
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

.state-panel {
  display: grid;
  min-height: 18rem;
  place-items: center;
  align-content: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-5);
  text-align: center;
}

.state-panel h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  line-height: var(--line-tight);
  letter-spacing: 0;
}

.state-panel p {
  max-width: 34rem;
  margin: 0;
  color: var(--text-secondary);
}

.state-panel .state-eyebrow {
  color: var(--text-accent);
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.state-panel--error {
  background: var(--status-ended-surface);
}

.state-panel--error .state-eyebrow {
  color: var(--status-ended);
}

.state-action {
  margin-top: var(--space-2);
  border-color: var(--status-info-border);
  background: var(--surface-control);
}

.loaded-list {
  display: grid;
}

.loaded-row {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.loaded-row span:first-child {
  color: var(--text-primary);
  font-weight: 800;
}

.loaded-row span:last-child {
  display: inline-flex;
  width: fit-content;
  min-height: var(--control-height-sm);
  align-items: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--status-info-border);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
  background: var(--status-info-surface);
  font-weight: 800;
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

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .list-columns {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  }

  .list-columns span:nth-child(2) {
    display: none;
  }

  .list-row-slot,
  .loaded-row {
    grid-template-columns: 1fr;
    align-content: center;
  }
}
</style>
