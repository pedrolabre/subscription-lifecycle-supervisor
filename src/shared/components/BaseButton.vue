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
  max-width: 100%;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--control-height-md);
  padding: 0 var(--space-5);
  line-height: var(--line-tight);
  overflow-wrap: anywhere;
  text-align: center;
  white-space: normal;
}

.base-button--primary {
  border-color: transparent;
  color: var(--primary-text);
  background: var(--primary);
}

.base-button--primary:hover:not(:disabled) {
  border-color: transparent;
  background: var(--primary-hover);
}

.base-button--secondary {
  border-color: var(--border-control-strong);
  background: var(--surface-control);
}

.base-button--secondary:hover:not(:disabled) {
  border-color: var(--border-control-strong);
  background: var(--surface-control-hover);
}
</style>
