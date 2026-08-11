import { computed, ref } from 'vue';
import { DEFAULT_LOCALE, LOCALE_VALUES, messages } from './messages.js';

const STORAGE_KEY = 'subscription-lifecycle-supervisor:locale';

const locale = ref(DEFAULT_LOCALE);

export function initializeLocale() {
  locale.value = readStoredLocale() ?? DEFAULT_LOCALE;
  applyLocale(locale.value);

  return locale.value;
}

export function useLocale() {
  initializeLocale();

  const isEnglish = computed(() => locale.value === 'en-US');

  return {
    formatDate,
    formatNumber,
    formatRelativeDays,
    isEnglish,
    locale,
    setLocale,
    t,
    tc,
    toggleLocale,
    translateValidationError,
  };
}

export function setLocale(value) {
  const nextLocale = normalizeLocale(value);

  if (!nextLocale) {
    return;
  }

  locale.value = nextLocale;
  writeStoredLocale(nextLocale);
  applyLocale(nextLocale);
}

export function toggleLocale() {
  setLocale(locale.value === 'pt-BR' ? 'en-US' : 'pt-BR');
}

export function t(path, params = {}) {
  const value = resolveMessage(path);

  if (typeof value !== 'string') {
    return path;
  }

  return interpolate(value, params);
}

export function tc(path, count, params = {}) {
  const value = resolveMessage(path);

  if (!isRecord(value)) {
    return t(path, {
      count: formatNumber(count),
      ...params,
    });
  }

  const numericCount = normalizeCount(count);
  const template = numericCount === 1 ? value.one : value.other;

  return interpolate(template ?? '', {
    count: formatNumber(numericCount),
    ...params,
  });
}

export function formatNumber(value) {
  return new Intl.NumberFormat(locale.value).format(normalizeCount(value));
}

export function formatDate(value, fallback = t('card.noLocalDate')) {
  if (!hasText(value)) {
    return fallback;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return normalizeText(value, fallback);
  }

  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeDays(days) {
  if (days === null || days === undefined) {
    return '';
  }

  const numericDays = Number(days);

  if (!Number.isFinite(numericDays)) {
    return '';
  }

  if (numericDays === 0) {
    return t('dates.relative.today');
  }

  const absoluteDays = Math.abs(Math.trunc(numericDays));

  return numericDays > 0
    ? tc('dates.relative.futureDays', absoluteDays)
    : tc('dates.relative.pastDays', absoluteDays);
}

export function translateValidationError(error) {
  const code = normalizeText(error?.code);

  if (code && hasMessage(`validationErrors.${code}`)) {
    return t(`validationErrors.${code}`);
  }

  return normalizeText(error?.message);
}

function applyLocale(value) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = value;
}

function readStoredLocale() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredLocale(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Preference persistence is best-effort.
  }
}

function normalizeLocale(value) {
  return LOCALE_VALUES.includes(value) ? value : null;
}

function resolveMessage(path) {
  return path.split('.').reduce((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[segment];
  }, messages[locale.value] ?? messages[DEFAULT_LOCALE]);
}

function hasMessage(path) {
  return typeof resolveMessage(path) === 'string';
}

function interpolate(template, params) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match,
  );
}

function normalizeCount(value) {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
