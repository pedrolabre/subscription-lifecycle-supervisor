import { ref } from 'vue';
import { validateBackupPayload } from '../../domain/backup/index.js';
import { useSubscriptionsStore } from '../../stores/subscriptions/index.js';
import { useLocale } from '../../shared/i18n/index.js';
import { useTheme } from '../../shared/theme/index.js';
import { formatCurrency } from '../../core/money/index.js';

export function useBackupDialog(options = {}) {
  const store = options.store ?? useSubscriptionsStore();
  const { locale, t } = options.i18n ?? useLocale();
  const { theme } = options.themeHelper ?? useTheme();

  const fileInputRef = ref(null);
  const selectedFileName = ref('');
  const previewData = ref(null);
  const validationErrors = ref([]);
  const importStrategy = ref('merge');
  const isRestoring = ref(false);
  const successMessage = ref('');
  const errorMessage = ref('');

  function triggerFileInput() {
    fileInputRef.value?.click();
  }

  async function handleFileChange(event) {
    const file = event.target?.files?.[0];

    if (!file) {
      return;
    }

    selectedFileName.value = file.name;
    successMessage.value = '';
    errorMessage.value = '';

    try {
      const content = await readFileAsText(file);
      processFileContent(content);
    } catch {
      validationErrors.value = [t('backup.import.invalidTitle')];
      previewData.value = null;
    }
  }

  function processFileContent(content) {
    const validation = validateBackupPayload(content);

    if (validation.isValid) {
      previewData.value = validation.data;
      validationErrors.value = [];
      errorMessage.value = '';
    } else {
      previewData.value = null;
      validationErrors.value = validation.errors;
    }
  }

  function clearFile() {
    selectedFileName.value = '';
    previewData.value = null;
    validationErrors.value = [];
    errorMessage.value = '';
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }

  function handleExportJson() {
    const payload = store.exportBackup({
      theme: theme.value,
      locale: locale.value,
    });
    const jsonText = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `subscriptions-backup-${dateStr}.json`;

    downloadBlob(jsonText, filename, 'application/json');
  }

  function handleExportCsv() {
    const csvText = store.exportCsv({
      locale: locale.value,
    });
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `subscriptions-${dateStr}.csv`;

    downloadBlob(csvText, filename, 'text/csv;charset=utf-8;');
  }

  async function handleRestore() {
    if (!previewData.value || isRestoring.value) {
      return;
    }

    isRestoring.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
      const result = await store.importBackup(previewData.value, importStrategy.value);
      successMessage.value = t('backup.import.successMessage', {
        count: result.count,
      });
      clearFile();
    } catch (err) {
      errorMessage.value = err?.message || t('backup.import.restoreError');
    } finally {
      isRestoring.value = false;
    }
  }

  return {
    fileInputRef,
    selectedFileName,
    previewData,
    validationErrors,
    importStrategy,
    isRestoring,
    successMessage,
    errorMessage,
    triggerFileInput,
    handleFileChange,
    processFileContent,
    clearFile,
    handleExportJson,
    handleExportCsv,
    handleRestore,
    formatCurrency: (value) => formatCurrency(value, { locale: locale.value }),
  };
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function downloadBlob(content, filename, mimeType) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
