<script setup>
import { computed } from 'vue';
import { useLocale } from '../i18n/index.js';

const { isEnglish, t, toggleLocale } = useLocale();

const ariaLabel = computed(() =>
  isEnglish.value ? t('locale.switchToPortuguese') : t('locale.switchToEnglish'),
);

const title = computed(() => ariaLabel.value);

const targetShortLabel = computed(() => (isEnglish.value ? 'PT' : 'EN'));
</script>

<template>
  <button
    class="locale-toggle"
    data-test="locale-toggle"
    type="button"
    :aria-label="ariaLabel"
    :title="title"
    @click="toggleLocale"
  >
    {{ targetShortLabel }}
  </button>
</template>

<style scoped>
.locale-toggle {
  display: inline-flex;
  width: 2.375rem;
  min-width: 2.375rem;
  height: var(--control-height-md);
  min-height: var(--control-height-md);
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-2);
  border-color: var(--border-control-strong);
  color: var(--text-primary);
  background: var(--surface-control);
  font-size: var(--font-size-sm);
  font-weight: 800;
  line-height: 1;
}

.locale-toggle:hover:not(:disabled) {
  background: var(--surface-control-hover);
}
</style>
