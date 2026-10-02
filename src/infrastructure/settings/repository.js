import { database, DB_STORES } from '../db/index.js';
import {
  createDefaultSettings,
  SETTINGS_KEY,
} from '../db/settingsSeed.js';

export const SETTINGS_REPOSITORY_ERROR_CODES = Object.freeze({
  DATABASE_ERROR: 'settings_database_error',
  INVALID_PAYLOAD: 'settings_invalid_payload',
});

export class SettingsRepositoryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SettingsRepositoryError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function createSettingsRepository(options = {}) {
  const table = resolveSettingsTable(options);
  const now = options.now ?? (() => new Date());

  async function getSettings() {
    try {
      const record = await table.get(SETTINGS_KEY);

      if (!record) {
        return createDefaultSettings({ now: resolveIsoDate(now) });
      }

      return Object.freeze({ ...record });
    } catch (cause) {
      if (cause instanceof SettingsRepositoryError) {
        throw cause;
      }

      throw new SettingsRepositoryError(
        SETTINGS_REPOSITORY_ERROR_CODES.DATABASE_ERROR,
        'Erro ao consultar preferências no banco de dados local.',
        { cause },
      );
    }
  }

  async function updateSettings(updates = {}) {
    if (!updates || typeof updates !== 'object') {
      throw new SettingsRepositoryError(
        SETTINGS_REPOSITORY_ERROR_CODES.INVALID_PAYLOAD,
        'Objeto de atualização de preferências inválido.',
        { updates },
      );
    }

    try {
      const current = (await table.get(SETTINGS_KEY)) ?? createDefaultSettings({ now: resolveIsoDate(now) });
      const timestamp = resolveIsoDate(now);

      const updated = {
        ...current,
        ...normalizeSettingsUpdates(updates),
        key: SETTINGS_KEY,
        updatedAt: timestamp,
      };

      await table.put(updated);

      return Object.freeze({ ...updated });
    } catch (cause) {
      if (cause instanceof SettingsRepositoryError) {
        throw cause;
      }

      throw new SettingsRepositoryError(
        SETTINGS_REPOSITORY_ERROR_CODES.DATABASE_ERROR,
        'Erro ao salvar preferências no banco de dados local.',
        { cause },
      );
    }
  }

  async function saveSettings(payload = {}) {
    return updateSettings(payload);
  }

  async function resetSettings() {
    try {
      const defaults = createDefaultSettings({ now: resolveIsoDate(now) });

      await table.put(defaults);

      return Object.freeze({ ...defaults });
    } catch (cause) {
      throw new SettingsRepositoryError(
        SETTINGS_REPOSITORY_ERROR_CODES.DATABASE_ERROR,
        'Erro ao redefinir preferências locais.',
        { cause },
      );
    }
  }

  return {
    getSettings,
    resetSettings,
    saveSettings,
    updateSettings,
  };
}

export const settingsRepository = createSettingsRepository();

function resolveSettingsTable(options) {
  if (options.table) {
    return options.table;
  }

  const db = options.database ?? database;

  return db[DB_STORES.SETTINGS] ?? db.table(DB_STORES.SETTINGS);
}

function resolveIsoDate(nowSource) {
  const date = typeof nowSource === 'function' ? nowSource() : nowSource;

  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.toISOString();
  }

  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function normalizeSettingsUpdates(updates) {
  const result = {};

  if (typeof updates.theme === 'string' && updates.theme.trim()) {
    const theme = updates.theme.trim().toLowerCase();
    if (['dark', 'light', 'system'].includes(theme)) {
      result.theme = theme;
    }
  }

  if (typeof updates.locale === 'string' && updates.locale.trim()) {
    const locale = updates.locale.trim();
    if (['pt-BR', 'en-US'].includes(locale)) {
      result.locale = locale;
    }
  }

  if (typeof updates.currency === 'string' && updates.currency.trim()) {
    result.currency = updates.currency.trim().toUpperCase();
  }

  if (Number.isFinite(updates.catalogSeedVersion)) {
    result.catalogSeedVersion = updates.catalogSeedVersion;
  }

  return result;
}
