<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { BaseButton, StatusBadge } from '../../shared/components/index.js';
import { useLocale } from '../../shared/i18n/index.js';
import { useBackupDialog } from './useBackupDialog.js';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
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

const {
  clearFile,
  errorMessage,
  fileInputRef,
  formatCurrency,
  handleExportCsv,
  handleExportJson,
  handleFileChange,
  handleRestore,
  importStrategy,
  isRestoring,
  previewData,
  selectedFileName,
  successMessage,
  triggerFileInput,
  validationErrors,
} = useBackupDialog();

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      openDialog();
      return;
    }

    closeDialog();
  },
  { immediate: true, flush: 'post' },
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
    class="backup-dialog-backdrop"
    data-test="backup-dialog-backdrop"
    @click.self="requestClose"
  >
    <section
      id="backup-dialog"
      ref="dialogRef"
      class="backup-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-dialog-title"
      aria-describedby="backup-dialog-desc"
      tabindex="-1"
    >
      <header class="backup-dialog__header">
        <div class="backup-dialog__heading">
          <p class="backup-dialog__eyebrow">
            {{ t('backup.dialog.eyebrow') }}
          </p>
          <h2 id="backup-dialog-title">
            {{ t('backup.dialog.title') }}
          </h2>
          <p
            id="backup-dialog-desc"
            class="sr-only"
          >
            {{ t('backup.export.description') }}
          </p>
        </div>

        <BaseButton
          class="backup-dialog__close"
          data-test="close-backup-dialog"
          type="button"
          variant="secondary"
          :aria-label="t('backup.dialog.close')"
          @click="requestClose"
        >
          <span aria-hidden="true">x</span>
        </BaseButton>
      </header>

      <!-- Feedback de sucesso -->
      <div
        v-if="successMessage"
        class="backup-feedback backup-feedback--success"
        role="status"
        aria-live="polite"
        data-test="backup-success-message"
      >
        <p>{{ successMessage }}</p>
      </div>

      <!-- Feedback de erro de restauracao -->
      <div
        v-if="errorMessage"
        class="backup-feedback backup-feedback--error"
        role="alert"
        data-test="backup-error-message"
      >
        <p>{{ errorMessage }}</p>
      </div>

      <div class="backup-dialog__body">
        <!-- Secao Exportar -->
        <section
          class="backup-section"
          aria-labelledby="export-section-title"
        >
          <div class="backup-section__header">
            <h3 id="export-section-title">
              {{ t('backup.export.title') }}
            </h3>
            <p class="backup-section__desc">
              {{ t('backup.export.description') }}
            </p>
          </div>

          <div class="backup-section__actions">
            <BaseButton
              data-test="export-json-button"
              data-dialog-autofocus
              type="button"
              variant="secondary"
              @click="handleExportJson"
            >
              {{ t('backup.export.downloadJson') }}
            </BaseButton>

            <BaseButton
              data-test="export-csv-button"
              type="button"
              variant="secondary"
              @click="handleExportCsv"
            >
              {{ t('backup.export.downloadCsv') }}
            </BaseButton>
          </div>
        </section>

        <hr class="backup-divider">

        <!-- Secao Importar -->
        <section
          class="backup-section"
          aria-labelledby="import-section-title"
        >
          <div class="backup-section__header">
            <h3 id="import-section-title">
              {{ t('backup.import.title') }}
            </h3>
            <p class="backup-section__desc">
              {{ t('backup.import.description') }}
            </p>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept=".json,application/json"
            class="sr-only"
            data-test="backup-file-input"
            @change="handleFileChange"
          >

          <!-- Area de selecao quando nenhum arquivo valido esta carregado -->
          <div
            v-if="!previewData"
            class="backup-upload-dropzone"
            data-test="backup-dropzone"
            @click="triggerFileInput"
          >
            <p class="backup-upload-prompt">
              {{ selectedFileName || t('backup.import.fileSelectPrompt') }}
            </p>
            <BaseButton
              type="button"
              variant="secondary"
              data-test="select-file-button"
              @click.stop="triggerFileInput"
            >
              {{ t('backup.import.fileSelectPrompt') }}
            </BaseButton>
          </div>

          <!-- Erros de validacao de schema -->
          <div
            v-if="validationErrors.length"
            class="backup-feedback backup-feedback--error"
            role="alert"
            data-test="backup-validation-errors"
          >
            <p class="backup-error-title">
              {{ t('backup.import.invalidTitle') }}
            </p>
            <ul>
              <li
                v-for="(err, index) in validationErrors"
                :key="index"
              >
                {{ err }}
              </li>
            </ul>
            <BaseButton
              type="button"
              variant="secondary"
              class="backup-reset-btn"
              data-test="clear-invalid-file"
              @click="clearFile"
            >
              {{ t('backup.import.cancelFile') }}
            </BaseButton>
          </div>

          <!-- Pre-visualizacao do arquivo valido -->
          <div
            v-if="previewData"
            class="backup-preview"
            data-test="backup-preview"
          >
            <div class="backup-preview__header">
              <span class="backup-preview__filename">{{ selectedFileName }}</span>
              <StatusBadge tone="active">
                v{{ previewData.schemaVersion }}
              </StatusBadge>
            </div>

            <dl class="backup-preview__metrics">
              <div class="backup-preview__metric">
                <dt>{{ t('backup.import.totalCount', { count: '' }).replace(': ', '') }}</dt>
                <dd>{{ previewData.meta.totalSubscriptions }}</dd>
              </div>
              <div class="backup-preview__metric">
                <dt>{{ t('backup.import.monthlyTotal', { total: '' }).replace(': ', '') }}</dt>
                <dd>{{ formatCurrency(previewData.meta.monthlyTotalCents / 100) }}</dd>
              </div>
            </dl>

            <fieldset class="backup-strategy-group">
              <legend class="backup-strategy-legend">
                {{ t('backup.import.strategyTitle') }}
              </legend>

              <label class="backup-strategy-option">
                <input
                  v-model="importStrategy"
                  type="radio"
                  name="import-strategy"
                  value="merge"
                  data-test="strategy-merge"
                >
                <span>{{ t('backup.import.strategyMerge') }}</span>
              </label>

              <label class="backup-strategy-option">
                <input
                  v-model="importStrategy"
                  type="radio"
                  name="import-strategy"
                  value="replace"
                  data-test="strategy-replace"
                >
                <span>{{ t('backup.import.strategyReplace') }}</span>
              </label>

              <p
                v-if="importStrategy === 'replace'"
                class="backup-replace-warning"
                role="status"
              >
                {{ t('backup.import.strategyReplaceWarning') }}
              </p>
            </fieldset>

            <div class="backup-preview__actions">
              <BaseButton
                type="button"
                variant="secondary"
                data-test="cancel-restore-button"
                @click="clearFile"
              >
                {{ t('backup.import.cancelFile') }}
              </BaseButton>

              <BaseButton
                type="button"
                variant="primary"
                data-test="confirm-restore-button"
                :disabled="isRestoring"
                @click="handleRestore"
              >
                {{ t('backup.import.confirmButton') }}
              </BaseButton>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.backup-dialog-backdrop {
  position: fixed;
  z-index: 1050;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: var(--surface-overlay);
}

.backup-dialog {
  width: min(38rem, 100%);
  max-height: calc(100vh - 2.5rem);
  padding: var(--space-5);
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
  box-shadow: var(--shadow-raised);
}

.backup-dialog__header {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.backup-dialog__heading {
  display: grid;
  gap: var(--space-1);
}

.backup-dialog__eyebrow {
  margin: 0;
  color: var(--text-accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.backup-dialog h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-tight);
}

.backup-dialog__close {
  width: 1.875rem;
  min-width: 1.875rem;
  height: 1.875rem;
  min-height: 1.875rem;
  padding: 0;
  flex: 0 0 auto;
  font-size: var(--font-size-lg);
  line-height: 1;
}

.backup-dialog__body {
  display: grid;
  gap: var(--space-4);
}

.backup-section {
  display: grid;
  gap: var(--space-3);
}

.backup-section__header {
  display: grid;
  gap: var(--space-1);
}

.backup-section h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-md);
  font-weight: 700;
}

.backup-section__desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.backup-section__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.backup-divider {
  margin: 0;
  border: 0;
  border-top: 1px solid var(--border-subtle);
}

.backup-upload-dropzone {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  cursor: pointer;
  border: 2px dashed var(--border-control);
  border-radius: var(--radius-md);
  background: var(--surface-control);
  text-align: center;
  transition: border-color 0.15s ease;
}

.backup-upload-dropzone:hover {
  border-color: var(--text-accent);
}

.backup-upload-prompt {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.backup-feedback {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.backup-feedback--success {
  border: 1px solid var(--status-active-border);
  color: var(--text-primary);
  background: var(--status-active-surface);
}

.backup-feedback--error {
  border: 1px solid var(--status-ended-border);
  color: var(--text-primary);
  background: var(--status-ended-surface);
}

.backup-feedback p {
  margin: 0;
}

.backup-feedback ul {
  margin: var(--space-2) 0 0;
  padding-left: 1.25rem;
}

.backup-feedback li {
  margin-bottom: var(--space-1);
}

.backup-error-title {
  font-weight: 700;
}

.backup-reset-btn {
  margin-top: var(--space-3);
}

.backup-preview {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-control);
}

.backup-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.backup-preview__filename {
  font-weight: 700;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.backup-preview__metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin: 0;
}

.backup-preview__metric dt {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
}

.backup-preview__metric dd {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--text-primary);
}

.backup-strategy-group {
  margin: 0;
  padding: 0;
  border: 0;
  display: grid;
  gap: var(--space-2);
}

.backup-strategy-legend {
  margin-bottom: var(--space-1);
  font-weight: 700;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.backup-strategy-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.backup-strategy-option input {
  margin-top: 0.2rem;
  accent-color: var(--primary);
}

.backup-replace-warning {
  margin: var(--space-1) 0 0;
  color: var(--status-ended);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.backup-preview__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
</style>
