export const SETTINGS_KEY = 'app';
export const SETTINGS_CATALOG_SEED_VERSION = 1;

export const DEFAULT_SETTINGS_VALUES = Object.freeze({
  theme: 'system',
  currency: 'BRL',
  locale: 'pt-BR',
  catalogSeedVersion: SETTINGS_CATALOG_SEED_VERSION,
});

export function createDefaultSettings(options = {}) {
  const timestamp = toIsoTimestamp(options.now);

  return Object.freeze({
    key: SETTINGS_KEY,
    ...DEFAULT_SETTINGS_VALUES,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function seedDefaultSettings(db, options = {}) {
  const existingSettings = await db.settings.get(SETTINGS_KEY);

  if (existingSettings) {
    return existingSettings;
  }

  const settings = createDefaultSettings(options);

  await db.settings.add(settings);

  return settings;
}

function toIsoTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}
