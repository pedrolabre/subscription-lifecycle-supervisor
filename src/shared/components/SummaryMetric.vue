<script setup>
defineProps({
  detail: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
});
</script>

<template>
  <div class="summary-metric">
    <dt>{{ label }}</dt>
    <dd>{{ value }}</dd>
    <span>{{ detail }}</span>
  </div>
</template>

<style scoped>
.summary-metric {
  display: grid;
  min-height: 8rem;
  align-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
}

.summary-metric dt,
.summary-metric span {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.summary-metric dt {
  font-weight: 700;
}

.summary-metric dd {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-2xl);
  font-weight: 800;
  line-height: var(--line-tight);
  overflow-wrap: anywhere;
}
</style>
