<script setup>
const productName = 'Subscription Lifecycle Supervisor';
</script>

<template>
  <main
    class="app-shell"
    aria-labelledby="app-title"
  >
    <header class="app-header">
      <h1 id="app-title">
        {{ productName }}
      </h1>
      <p class="app-context">
        Local-first
      </p>
    </header>

    <section
      class="app-state-panel"
      aria-labelledby="subscriptions-title"
    >
      <p class="section-label">
        Assinaturas
      </p>
      <h2 id="subscriptions-title">
        Nenhuma assinatura cadastrada
      </h2>
      <p>
        As assinaturas aparecerao aqui com custos, renovacoes e trials em um
        painel local.
      </p>
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr;
  align-content: start;
  gap: var(--space-6);
  width: min(100% - var(--space-6), 960px);
  margin: 0 auto;
  padding: var(--space-7) 0;
}

.app-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
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

h1,
h2,
p {
  overflow-wrap: anywhere;
}

h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-tight);
  letter-spacing: 0;
}

.app-state-panel {
  display: grid;
  align-self: start;
  gap: var(--space-3);
  max-width: 42rem;
  padding: var(--space-6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  box-shadow: var(--shadow-soft);
}

h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-2xl);
  line-height: var(--line-tight);
  letter-spacing: 0;
}

.app-state-panel p:last-child {
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--line-relaxed);
}

@media (max-width: 700px) {
  .app-shell {
    width: min(100% - var(--space-4), 960px);
    padding: var(--space-5) 0;
  }
}
</style>
