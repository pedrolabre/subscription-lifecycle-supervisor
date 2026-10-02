<script setup>
defineProps({
  ariaLabel: {
    type: String,
    default: 'Filtro por status',
  },
  modelValue: {
    type: String,
    default: 'all',
  },
  tabs: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

function selectTab(id) {
  emit('update:modelValue', id);
}

function handleKeyDown(event, index, tabs) {
  let targetIndex = -1;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    targetIndex = (index + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    targetIndex = (index - 1 + tabs.length) % tabs.length;
  }

  if (targetIndex >= 0 && tabs[targetIndex]) {
    const nextTab = tabs[targetIndex];
    emit('update:modelValue', nextTab.id);
    const nextElement = document.getElementById(`filter-tab-${nextTab.id}`);
    nextElement?.focus();
  }
}
</script>

<template>
  <nav
    class="filter-tabs"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="(tab, index) in tabs"
      :id="`filter-tab-${tab.id}`"
      :key="tab.id"
      type="button"
      role="tab"
      class="filter-tab"
      :class="{ 'is-active': modelValue === tab.id }"
      :aria-selected="modelValue === tab.id"
      :tabindex="modelValue === tab.id ? 0 : -1"
      :data-test="`filter-tab-${tab.id}`"
      @click="selectTab(tab.id)"
      @keydown="handleKeyDown($event, index, tabs)"
    >
      <span class="filter-tab__label">{{ tab.label }}</span>
      <span
        class="filter-tab__count"
        aria-hidden="true"
      >{{ tab.count }}</span>
      <span class="sr-only">({{ tab.count }})</span>
    </button>
  </nav>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
}

.filter-tab {
  display: inline-flex;
  min-height: var(--control-height-sm);
  padding: 0 var(--space-3);
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-control);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

.filter-tab:hover {
  border-color: var(--border-strong);
  background: var(--surface-control-hover);
  color: var(--text-primary);
}

.filter-tab.is-active {
  border-color: var(--status-active-border);
  background: var(--status-active-surface);
  color: var(--text-accent);
}

.filter-tab__count {
  display: inline-flex;
  min-width: 1.125rem;
  padding: 0.0625rem 0.3125rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  background: rgb(255 255 255 / 8%);
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: 1;
}

.filter-tab.is-active .filter-tab__count {
  background: rgb(117 242 218 / 18%);
  color: var(--text-accent);
}

:root.theme-light .filter-tab__count {
  background: rgb(0 0 0 / 6%);
}

:root.theme-light .filter-tab.is-active .filter-tab__count {
  background: rgb(8 127 104 / 14%);
  color: var(--text-accent);
}
</style>
