<script setup>
import { onBeforeUnmount, watch } from 'vue';
import BaseButton from './BaseButton.vue';

const props = defineProps({
  actionLabel: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 7000,
  },
  message: {
    type: String,
    required: true,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['action', 'dismiss']);

let timer = null;

watch(
  () => [props.visible, props.message],
  ([isVisible]) => {
    clearDismissTimer();

    if (isVisible && props.duration > 0) {
      timer = setTimeout(() => {
        emit('dismiss');
      }, props.duration);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearDismissTimer();
});

function clearDismissTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function handleAction() {
  clearDismissTimer();
  emit('action');
}

function handleDismiss() {
  clearDismissTimer();
  emit('dismiss');
}
</script>

<template>
  <Transition name="toast-fade">
    <div
      v-if="visible"
      class="undo-toast"
      role="status"
      aria-live="polite"
      data-test="undo-toast"
    >
      <span class="undo-toast__message">
        {{ message }}
      </span>

      <div class="undo-toast__actions">
        <BaseButton
          v-if="actionLabel"
          class="undo-toast__action-btn"
          data-test="undo-toast-action"
          type="button"
          variant="secondary"
          @click="handleAction"
        >
          {{ actionLabel }}
        </BaseButton>

        <button
          class="undo-toast__close"
          data-test="undo-toast-close"
          type="button"
          aria-label="Fechar"
          @click="handleDismiss"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.undo-toast {
  position: fixed;
  z-index: 1200;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  max-width: min(28rem, calc(100vw - 2rem));
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-raised);
}

.undo-toast__message {
  font-size: var(--font-size-md);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.undo-toast__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2);
}

.undo-toast__action-btn {
  min-height: 1.625rem;
  padding: 0 var(--space-3);
  border-color: var(--border-focus);
  color: var(--text-accent);
  background: var(--surface-control);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.undo-toast__action-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--text-primary);
  background: var(--surface-control-hover);
}

.undo-toast__close {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  min-height: 1.5rem;
  place-items: center;
  padding: 0;
  border: 0;
  color: var(--text-muted);
  background: transparent;
  font-size: var(--font-size-lg);
  cursor: pointer;
}

.undo-toast__close:hover {
  color: var(--text-primary);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard),
              transform var(--duration-fast) var(--ease-standard);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (max-width: 640px) {
  .undo-toast {
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}
</style>
