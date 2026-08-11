<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { BaseButton } from '../../shared/components/index.js';
import { useLocale } from '../../shared/i18n/index.js';

const props = defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  titleId: {
    type: String,
    default: 'subscription-form-dialog-title',
  },
});

const emit = defineEmits(['close']);

const { t } = useLocale();
const dialogRef = ref(null);
let restoreFocusElement = null;
let previousBodyOverflow = '';
let hasLockedBodyScroll = false;

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      openDialog();
      return;
    }

    closeDialog();
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  closeDialog();
});

async function openDialog() {
  restoreFocusElement = getActiveElement();
  lockBodyScroll();
  window.addEventListener('keydown', handleDocumentKeydown);

  await nextTick();
  focusInitialElement();
}

function closeDialog() {
  unlockBodyScroll();
  window.removeEventListener('keydown', handleDocumentKeydown);

  const target = restoreFocusElement;
  restoreFocusElement = null;

  nextTick(() => {
    if (isFocusableElement(target) && target.isConnected) {
      target.focus({ preventScroll: true });
    }
  });
}

function requestClose() {
  emit('close');
}

function handleDocumentKeydown(event) {
  if (!props.open) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    requestClose();
    return;
  }

  if (event.key === 'Tab') {
    trapFocus(event);
  }
}

function trapFocus(event) {
  const dialog = dialogRef.value;

  if (!dialog) {
    return;
  }

  const focusableElements = getFocusableElements();

  if (focusableElements.length === 0) {
    event.preventDefault();
    dialog.focus({ preventScroll: true });
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = getActiveElement();

  if (event.shiftKey) {
    if (!dialog.contains(activeElement) || activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus({ preventScroll: true });
    }

    return;
  }

  if (activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus({ preventScroll: true });
  }
}

function focusInitialElement() {
  const dialog = dialogRef.value;

  if (!dialog) {
    return;
  }

  const preferredElement = dialog.querySelector('[data-dialog-autofocus]');
  const target = preferredElement ?? getFocusableElements()[0] ?? dialog;

  target.focus({ preventScroll: true });
}

function getFocusableElements() {
  const dialog = dialogRef.value;

  if (!dialog) {
    return [];
  }

  return Array.from(dialog.querySelectorAll(focusableSelector)).filter(
    (element) =>
      isFocusableElement(element) &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true',
  );
}

function getActiveElement() {
  return typeof document === 'undefined' ? null : document.activeElement;
}

function lockBodyScroll() {
  if (typeof document === 'undefined' || hasLockedBodyScroll) {
    return;
  }

  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  hasLockedBodyScroll = true;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined' || !hasLockedBodyScroll) {
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  hasLockedBodyScroll = false;
}

function isFocusableElement(value) {
  return (
    typeof HTMLElement !== 'undefined' &&
    value instanceof HTMLElement &&
    typeof value.focus === 'function'
  );
}
</script>

<template>
  <div
    v-if="open"
    class="subscription-form-dialog-backdrop"
    data-test="subscription-form-backdrop"
    @click.self="requestClose"
  >
    <section
      id="subscription-form-dialog"
      ref="dialogRef"
      class="subscription-form-dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <div class="subscription-form-dialog__header">
        <div class="subscription-form-dialog__heading">
          <h2 :id="titleId">
            {{ title }}
          </h2>
        </div>

        <BaseButton
          class="subscription-form-dialog__close"
          data-test="close-subscription-form-dialog"
          type="button"
          variant="secondary"
          :aria-label="t('dialog.close')"
          @click="requestClose"
        >
          <span aria-hidden="true">x</span>
        </BaseButton>
      </div>

      <slot />
    </section>
  </div>
</template>

<style scoped>
.subscription-form-dialog-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: var(--surface-overlay);
}

.subscription-form-dialog {
  width: min(47.5rem, 100%);
  max-height: calc(100vh - 2.5rem);
  padding: var(--space-5);
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
  box-shadow: var(--shadow-raised);
}

.subscription-form-dialog__header {
  display: flex;
  gap: var(--space-5);
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.875rem;
}

.subscription-form-dialog__heading {
  display: grid;
  min-width: 0;
  gap: var(--space-2);
}

.subscription-form-dialog__eyebrow {
  margin: 0;
  color: var(--text-accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.subscription-form-dialog h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-tight);
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.subscription-form-dialog__close {
  width: 1.875rem;
  min-width: 1.875rem;
  height: 1.875rem;
  min-height: 1.875rem;
  padding: 0;
  flex: 0 0 auto;
  font-size: var(--font-size-lg);
  line-height: 1;
}

@media (max-width: 640px) {
  .subscription-form-dialog-backdrop {
    padding: var(--space-4);
  }

  .subscription-form-dialog {
    max-height: calc(100vh - 1.5rem);
  }
}
</style>
