<script setup>
defineProps({
  tone: {
    type: String,
    default: 'info',
    validator: (value) =>
      ['active', 'archived', 'ended', 'info', 'trial'].includes(value),
  },
});
</script>

<template>
  <span
    class="status-badge"
    :class="`status-badge--${tone}`"
  >
    <slot />
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  width: fit-content;
  min-height: var(--control-height-sm);
  align-items: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--status-info-border);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
  background: var(--status-info-surface);
  font-size: var(--font-size-sm);
  font-weight: 800;
}

.status-badge--active {
  border-color: var(--status-active-border);
  background: var(--status-active-surface);
}

.status-badge--archived {
  border-color: var(--status-archived-border);
  background: var(--status-archived-surface);
}

.status-badge--ended {
  border-color: var(--status-ended-border);
  background: var(--status-ended-surface);
}

.status-badge--trial {
  border-color: var(--status-trial-border);
  background: var(--status-trial-surface);
}
</style>
