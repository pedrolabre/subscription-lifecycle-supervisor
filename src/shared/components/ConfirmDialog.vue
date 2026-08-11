<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import BaseButton from './BaseButton.vue';

const props = defineProps({
  cancelLabel: {
    type: String,
    default: 'Cancelar',
  },
  confirmLabel: {
    type: String,
    default: 'Confirmar',
  },
  message: {
    type: String,
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: 'archive',
    validator: (value) => ['archive', 'end', 'danger'].includes(value),
  },
});

const emit = defineEmits(['cancel', 'confirm']);

const dialogRef = ref(null);
const confirmButtonRef = ref(null);
let restoreFocusElement = null;
let hasLockedBodyScroll = false;
let previousBodyOverflow = '';

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      openDialog();
    } else {
      closeDialog();
    }
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  closeDialog();
});

async function openDialog() {
  restoreFocusElement = document.activeElement;
  lockBodyScroll();
  window.addEventListener('keydown', handleKeydown);

  await nextTick();
  confirmButtonRef.value?.$el?.focus?.() ?? dialogRef.value?.focus?.();
}

function closeDialog() {
  unlockBodyScroll();
  window.removeEventListener('keydown', handleKeydown);

  const target = restoreFocusElement;
  restoreFocusElement = null;

  nextTick(() => {
    if (target && typeof target.focus === 'function' && target.isConnected) {
      target.focus({ preventScroll: true });
    }
  });
}

function handleKeydown(event) {
  if (!props.open) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    emit('cancel');
  }
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

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <div
    v-if="open"
    class="confirm-dialog-backdrop"
    data-test="confirm-dialog-backdrop"
    @click.self="handleCancel"
  >
    <div
      ref="dialogRef"
      class="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="title ? 'confirm-dialog-title' : undefined"
      :aria-describedby="message ? 'confirm-dialog-message' : undefined"
      tabindex="-1"
    >
      <h3
        id="confirm-dialog-title"
        class="confirm-dialog__title"
      >
        {{ title }}
      </h3>
      <p
        id="confirm-dialog-message"
        class="confirm-dialog__message"
      >
        {{ message }}
      </p>

      <div class="confirm-dialog__actions">
        <BaseButton
          data-test="cancel-confirm-dialog"
          type="button"
          variant="secondary"
          @click="handleCancel"
        >
          {{ cancelLabel }}
        </BaseButton>
        <BaseButton
          ref="confirmButtonRef"
          class="confirm-dialog__confirm-btn"
          :class="`confirm-dialog__confirm-btn--${tone}`"
          data-test="submit-confirm-dialog"
          type="button"
          variant="secondary"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-dialog-backdrop {
  position: fixed;
  z-index: 1100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--surface-overlay);
}

.confirm-dialog {
  width: min(24rem, 100%);
  padding: var(--space-5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
  box-shadow: var(--shadow-raised);
}

.confirm-dialog__title {
  margin: 0 0 var(--space-2);
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  line-height: var(--line-tight);
}

.confirm-dialog__message {
  margin: 0 0 var(--space-5);
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  line-height: var(--line-normal);
  overflow-wrap: anywhere;
}

.confirm-dialog__actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: flex-end;
}

.confirm-dialog__confirm-btn--end,
.confirm-dialog__confirm-btn--danger {
  border-color: var(--status-ended-border);
  color: var(--status-ended);
  background: var(--status-ended-surface);
}

.confirm-dialog__confirm-btn--end:hover:not(:disabled),
.confirm-dialog__confirm-btn--danger:hover:not(:disabled) {
  border-color: var(--status-ended);
  color: var(--text-primary);
  background: var(--status-ended);
}
</style>
