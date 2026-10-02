<script setup>
defineProps({
  ariaLabel: {
    type: String,
    default: 'Filtro por categoria',
  },
  categories: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: String,
    default: 'all',
  },
});

const emit = defineEmits(['update:modelValue']);

function selectCategory(id) {
  emit('update:modelValue', id);
}
</script>

<template>
  <div
    class="category-chips-scroll"
    role="region"
    :aria-label="ariaLabel"
  >
    <div class="category-chips">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="category-chip"
        :class="{ 'is-active': modelValue === cat.id }"
        :aria-pressed="modelValue === cat.id"
        :data-test="`category-chip-${cat.id}`"
        @click="selectCategory(cat.id)"
      >
        <span class="category-chip__label">{{ cat.label }}</span>
        <span
          class="category-chip__count"
          aria-hidden="true"
        >{{ cat.count }}</span>
        <span class="sr-only">({{ cat.count }})</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-chips-scroll {
  display: flex;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
  padding-bottom: 2px;
}

.category-chips {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: nowrap;
}

.category-chip {
  display: inline-flex;
  min-height: 1.625rem;
  padding: 0 var(--space-3);
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-control);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

.category-chip:hover {
  border-color: var(--border-strong);
  background: var(--surface-control-hover);
  color: var(--text-primary);
}

.category-chip.is-active {
  border-color: var(--border-focus);
  background: var(--surface-control-active);
  color: var(--text-accent);
}

.category-chip__count {
  display: inline-flex;
  min-width: 1rem;
  padding: 0 0.25rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  background: rgb(255 255 255 / 8%);
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: 1.2;
}

.category-chip.is-active .category-chip__count {
  background: rgb(117 242 218 / 18%);
  color: var(--text-accent);
}

:root.theme-light .category-chip__count {
  background: rgb(0 0 0 / 6%);
}

:root.theme-light .category-chip.is-active .category-chip__count {
  background: rgb(8 127 104 / 14%);
  color: var(--text-accent);
}
</style>
