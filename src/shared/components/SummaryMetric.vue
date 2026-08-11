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
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "label value"
    "detail value";
  min-height: 0;
  align-items: center;
  gap: 1px var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-base);
}

.summary-metric dt,
.summary-metric span {
  min-width: 0;
  font-size: var(--font-size-sm);
  overflow-wrap: anywhere;
}

.summary-metric dt {
  grid-area: label;
  color: var(--text-secondary);
  font-weight: 600;
}

.summary-metric dd {
  grid-area: value;
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  font-weight: 700;
  line-height: var(--line-tight);
  overflow-wrap: anywhere;
  text-align: right;
}

.summary-metric span {
  grid-area: detail;
  color: var(--text-muted);
}
</style>
