<script setup>
import BaseButton from './BaseButton.vue';

defineProps({
  actionLabel: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: true,
  },
  eyebrow: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: 'empty',
    validator: (value) => ['empty', 'error'].includes(value),
  },
});

const emit = defineEmits(['action']);

function emitAction() {
  emit('action');
}
</script>

<template>
  <section
    class="state-panel"
    :class="`state-panel--${tone}`"
  >
    <p class="state-panel__eyebrow">
      {{ eyebrow }}
    </p>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <BaseButton
      v-if="actionLabel"
      class="state-panel__action"
      type="button"
      variant="secondary"
      @click="emitAction"
    >
      {{ actionLabel }}
    </BaseButton>
  </section>
</template>

<style scoped>
.state-panel {
  display: grid;
  min-height: 10.625rem;
  place-items: center;
  align-content: center;
  gap: var(--space-2);
  padding: var(--space-7) var(--space-5);
  background: var(--surface-base);
  text-align: center;
}

.state-panel h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: 700;
  line-height: var(--line-tight);
  letter-spacing: 0;
}

.state-panel p {
  max-width: 34rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  line-height: var(--line-normal);
}

.state-panel .state-panel__eyebrow {
  color: var(--text-accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.state-panel--error {
  border: 1px solid var(--status-ended-border);
  background: var(--status-ended-surface);
}

.state-panel--error .state-panel__eyebrow {
  color: var(--status-ended);
}

.state-panel__action {
  margin-top: var(--space-2);
}
</style>
