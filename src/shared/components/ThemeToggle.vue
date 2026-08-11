<script setup>
import { computed } from 'vue';
import { useLocale } from '../i18n/index.js';
import { useTheme } from '../theme/index.js';

const { isLightTheme, toggleTheme } = useTheme();
const { t } = useLocale();

const ariaLabel = computed(() =>
  isLightTheme.value ? t('theme.switchToDark') : t('theme.switchToLight'),
);

const title = computed(() =>
  isLightTheme.value ? t('theme.lightTitle') : t('theme.darkTitle'),
);
</script>

<template>
  <button
    class="theme-toggle"
    data-test="theme-toggle"
    type="button"
    :aria-label="ariaLabel"
    :title="title"
    @click="toggleTheme"
  >
    <svg
      v-if="isLightTheme"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-grid;
  width: var(--control-height-md);
  min-width: var(--control-height-md);
  height: var(--control-height-md);
  min-height: var(--control-height-md);
  place-items: center;
  padding: 0;
  border-color: var(--border-control-strong);
  color: var(--text-primary);
  background: var(--surface-control);
}

.theme-toggle:hover:not(:disabled) {
  background: var(--surface-control-hover);
}

.theme-toggle svg {
  width: 0.9375rem;
  height: 0.9375rem;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  pointer-events: none;
}
</style>
