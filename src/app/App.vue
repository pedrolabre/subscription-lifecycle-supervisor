<script setup>
const productName = 'Subscription Lifecycle Supervisor';

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
        <span class="app-local-badge">Dados locais</span>
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
          aria-label="Area da lista de assinaturas"
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
            class="list-row-slot"
            aria-hidden="true"
          />
          <div
            class="list-row-slot"
            aria-hidden="true"
          />
          <div
            class="list-row-slot"
            aria-hidden="true"
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

.list-row-slot {
  min-height: 4.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.list-row-slot:last-child {
  border-bottom: 0;
}

.list-row-slot::before,
.list-row-slot::after {
  display: block;
  height: 1px;
  content: "";
  background: var(--border-subtle);
}

.list-row-slot::before {
  width: 42%;
  margin-left: var(--space-4);
}

.list-row-slot::after {
  width: 34%;
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

  .list-row-slot {
    grid-template-columns: 1fr;
  }
}
</style>
