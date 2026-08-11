import { computed, ref } from 'vue';

export const THEME_VALUES = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
});

const STORAGE_KEY = 'subscription-lifecycle-supervisor:theme';
const THEME_CLASSES = Object.freeze(['theme-dark', 'theme-light']);
const theme = ref(THEME_VALUES.DARK);

export function initializeTheme() {
  theme.value = readStoredTheme() ?? THEME_VALUES.DARK;
  applyTheme(theme.value);

  return theme.value;
}

export function useTheme() {
  initializeTheme();

  const isLightTheme = computed(() => theme.value === THEME_VALUES.LIGHT);

  return {
    isLightTheme,
    setTheme,
    theme,
    toggleTheme,
  };
}

export function setTheme(value) {
  const nextTheme = normalizeTheme(value);

  if (!nextTheme) {
    return;
  }

  theme.value = nextTheme;
  writeStoredTheme(nextTheme);
  applyTheme(nextTheme);
}

export function toggleTheme() {
  setTheme(
    theme.value === THEME_VALUES.LIGHT ? THEME_VALUES.DARK : THEME_VALUES.LIGHT,
  );
}

function applyTheme(value) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  root.classList.remove(...THEME_CLASSES);
  root.classList.add(`theme-${value}`);
  root.dataset.theme = value;
  root.style.colorScheme = value;
}

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredTheme(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Preference persistence is best-effort.
  }
}

function normalizeTheme(value) {
  return Object.values(THEME_VALUES).includes(value) ? value : null;
}
