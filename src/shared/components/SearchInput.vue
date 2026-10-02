<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps({
  ariaLabel: {
    type: String,
    default: 'Buscar assinaturas',
  },
  clearLabel: {
    type: String,
    default: 'Limpar busca',
  },
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: "Buscar por nome, categoria ou apelido (pressione '/')...",
  },
});

const emit = defineEmits(['update:modelValue', 'clear']);

const inputRef = ref(null);

function handleInput(event) {
  emit('update:modelValue', event.target.value);
}

function handleClear() {
  emit('update:modelValue', '');
  emit('clear');
  inputRef.value?.focus();
}

function handleGlobalKeyDown(event) {
  if (event.key === '/' || event.code === 'Slash') {
    const activeEl = document.activeElement;
    const isAlreadyEditing =
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable);

    const isModalOpen = Boolean(document.querySelector('[role="dialog"]'));

    if (!isAlreadyEditing && !isModalOpen) {
      event.preventDefault();
      inputRef.value?.focus();
      inputRef.value?.select?.();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});
</script>

<template>
  <div class="search-input-wrapper">
    <span
      class="search-input__icon"
      aria-hidden="true"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle
          cx="11"
          cy="11"
          r="8"
        />
        <line
          x1="21"
          y1="21"
          x2="16.65"
          y2="16.65"
        />
      </svg>
    </span>

    <input
      ref="inputRef"
      :value="modelValue"
      type="search"
      class="search-input__control"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      data-test="search-input"
      autocomplete="off"
      spellcheck="false"
      @input="handleInput"
      @keydown.esc="handleClear"
    >

    <button
      v-if="modelValue"
      type="button"
      class="search-input__clear"
      :aria-label="clearLabel"
      data-test="clear-search-button"
      @click="handleClear"
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <line
          x1="18"
          y1="6"
          x2="6"
          y2="18"
        />
        <line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
        />
      </svg>
    </button>

    <kbd
      v-else
      class="search-input__shortcut"
      aria-hidden="true"
      title="Atalho: /"
    >/</kbd>
  </div>
</template>

<style scoped>
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.search-input__icon {
  position: absolute;
  left: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input__control {
  width: 100%;
  min-height: var(--control-height-md);
  padding: 0 var(--space-7) 0 2rem;
  border: 1px solid var(--border-control);
  border-radius: var(--radius-sm);
  background: var(--surface-inset);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.search-input__control::-webkit-search-cancel-button {
  display: none;
}

.search-input__control:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: var(--focus-ring);
}

.search-input__clear {
  position: absolute;
  right: var(--space-2);
  display: flex;
  min-height: 1.375rem;
  width: 1.375rem;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.search-input__clear:hover {
  border-color: var(--border-subtle);
  background: var(--surface-control);
  color: var(--text-primary);
}

.search-input__shortcut {
  position: absolute;
  right: var(--space-2);
  display: inline-flex;
  min-width: 1.125rem;
  height: 1.125rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  background: var(--surface-control);
  color: var(--text-muted);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
</style>
