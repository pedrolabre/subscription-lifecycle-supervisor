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
  justify-content: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--status-info-border);
  border-radius: var(--radius-sm);
  color: var(--status-info-text);
  background: var(--status-info-surface);
  font-size: var(--font-size-md);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.status-badge--active {
  border-color: var(--status-active-border);
  color: var(--text-primary);
  background: var(--status-active-surface);
}

.status-badge--archived {
  border-color: var(--status-archived-border);
  color: var(--text-primary);
  background: var(--status-archived-surface);
}

.status-badge--ended {
  border-color: var(--status-ended-border);
  color: var(--text-primary);
  background: var(--status-ended-surface);
}

.status-badge--trial {
  border-color: var(--status-trial-border);
  color: var(--text-primary);
  background: var(--status-trial-surface);
}
</style>
