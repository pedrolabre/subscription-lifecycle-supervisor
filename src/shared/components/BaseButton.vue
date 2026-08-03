<script setup>
defineProps({
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value),
  },
  variant: {
    type: String,
    default: 'secondary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
});
</script>

<template>
  <button
    class="base-button"
    :class="`base-button--${variant}`"
    :type="type"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.base-button--primary {
  border-color: var(--status-active-border);
  color: var(--text-inverse);
  background: var(--status-active);
}

.base-button--primary:hover:not(:disabled) {
  border-color: var(--text-accent);
  background: var(--text-accent);
}

.base-button--secondary {
  border-color: var(--status-info-border);
  background: var(--surface-control);
}
</style>
