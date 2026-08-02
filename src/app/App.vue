<script setup>
const productName = 'Subscription Lifecycle Supervisor';
</script>

<template>
  <main
    class="app-shell"
    aria-labelledby="app-title"
  >
    <section class="intro-panel">
      <p class="eyebrow">
        Local-first
      </p>
      <h1 id="app-title">
        {{ productName }}
      </h1>
      <p class="lead">
        Acompanhe ciclos de assinatura sem login, backend ou sincronizacao
        remota.
      </p>
    </section>

    <section
      class="dashboard-panel"
      aria-labelledby="dashboard-title"
    >
      <div>
        <p class="section-label">
          Painel
        </p>
        <h2 id="dashboard-title">
          Nenhuma assinatura cadastrada
        </h2>
      </div>
      <p class="dashboard-copy">
        A base tecnica esta pronta para receber contratos, calculos e dados
        locais nos proximos incrementos.
      </p>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  color: #f5f5f4;
  background:
    radial-gradient(circle at top left, rgb(20 184 166 / 20%), transparent 32rem),
    #0c0a09;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

:global(button),
:global(input),
:global(textarea),
:global(select) {
  font: inherit;
}

.app-shell {
  display: grid;
  min-height: 100vh;
  align-content: center;
  gap: 1rem;
  width: min(100% - 2rem, 960px);
  margin: 0 auto;
  padding: 4rem 0;
}

.intro-panel,
.dashboard-panel {
  border: 1px solid rgb(245 245 244 / 10%);
  border-radius: 8px;
  background: rgb(28 25 23 / 82%);
  box-shadow: 0 24px 70px rgb(0 0 0 / 28%);
}

.intro-panel {
  padding: clamp(2rem, 5vw, 4rem);
}

.eyebrow,
.section-label {
  margin: 0 0 0.75rem;
  color: #2dd4bf;
  font-size: 0.78rem;
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
  max-width: 12ch;
  margin: 0;
  color: #ffffff;
  font-size: clamp(2.4rem, 4.5rem, 4.5rem);
  line-height: 0.95;
  letter-spacing: 0;
}

.lead {
  max-width: 38rem;
  margin: 1.5rem 0 0;
  color: #d6d3d1;
  font-size: 1.1rem;
  line-height: 1.7;
}

.dashboard-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
}

h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.35rem;
  line-height: 1.2;
  letter-spacing: 0;
}

.dashboard-copy {
  margin: 0;
  color: #a8a29e;
  line-height: 1.6;
}

@media (max-width: 700px) {
  .app-shell {
    align-content: start;
    padding: 1rem 0;
  }

  .dashboard-panel {
    grid-template-columns: 1fr;
  }
}
</style>
