import { describe, expect, it } from 'vitest';
import {
  createSettingsRepository,
  SETTINGS_REPOSITORY_ERROR_CODES,
  SettingsRepositoryError,
} from './repository.js';

describe('settingsRepository', () => {
  it('returns default settings when table has no saved record', async () => {
    const table = createMockSettingsTable();
    const repository = createSettingsRepository({
      table,
      now: () => new Date('2026-10-04T12:00:00.000Z'),
    });

    const settings = await repository.getSettings();

    expect(settings).toMatchObject({
      key: 'app',
      theme: 'system',
      currency: 'BRL',
      locale: 'pt-BR',
      catalogSeedVersion: 1,
      createdAt: '2026-10-04T12:00:00.000Z',
      updatedAt: '2026-10-04T12:00:00.000Z',
    });
  });

  it('updates partial settings and preserves unedited fields with updated timestamp', async () => {
    const table = createMockSettingsTable();
    const repository = createSettingsRepository({
      table,
      now: () => new Date('2026-10-04T14:30:00.000Z'),
    });

    const updated = await repository.updateSettings({
      theme: 'light',
      currency: 'USD',
    });

    expect(updated).toMatchObject({
      key: 'app',
      theme: 'light',
      currency: 'USD',
      locale: 'pt-BR',
      updatedAt: '2026-10-04T14:30:00.000Z',
    });

    const fetched = await repository.getSettings();
    expect(fetched.theme).toBe('light');
    expect(fetched.currency).toBe('USD');
    expect(fetched.locale).toBe('pt-BR');
  });

  it('updates locale correctly and ignores invalid themes', async () => {
    const table = createMockSettingsTable();
    const repository = createSettingsRepository({ table });

    const updated = await repository.updateSettings({
      locale: 'en-US',
      theme: 'neon-cyberpunk', // tema inválido deve ser ignorado
    });

    expect(updated.locale).toBe('en-US');
    expect(updated.theme).toBe('system');
  });

  it('throws SettingsRepositoryError when payload is null or not an object', async () => {
    const table = createMockSettingsTable();
    const repository = createSettingsRepository({ table });

    await expect(repository.updateSettings(null)).rejects.toThrow(
      SettingsRepositoryError,
    );
    await expect(repository.updateSettings(null)).rejects.toMatchObject({
      code: SETTINGS_REPOSITORY_ERROR_CODES.INVALID_PAYLOAD,
    });
  });

  it('resets settings to default values', async () => {
    const table = createMockSettingsTable();
    const repository = createSettingsRepository({
      table,
      now: () => new Date('2026-10-04T15:00:00.000Z'),
    });

    await repository.updateSettings({
      theme: 'light',
      locale: 'en-US',
      currency: 'EUR',
    });

    const reset = await repository.resetSettings();

    expect(reset).toMatchObject({
      key: 'app',
      theme: 'system',
      currency: 'BRL',
      locale: 'pt-BR',
    });

    const fetched = await repository.getSettings();
    expect(fetched.currency).toBe('BRL');
    expect(fetched.theme).toBe('system');
  });

  it('wraps database failures in SettingsRepositoryError with DATABASE_ERROR code', async () => {
    const table = {
      async get() {
        throw new Error('Disk quota exceeded');
      },
      async put() {
        throw new Error('Database locked');
      },
    };
    const repository = createSettingsRepository({ table });

    await expect(repository.getSettings()).rejects.toThrow(
      SettingsRepositoryError,
    );
    await expect(repository.getSettings()).rejects.toMatchObject({
      code: SETTINGS_REPOSITORY_ERROR_CODES.DATABASE_ERROR,
    });

    await expect(repository.updateSettings({ theme: 'light' })).rejects.toThrow(
      SettingsRepositoryError,
    );
    await expect(repository.updateSettings({ theme: 'light' })).rejects.toMatchObject({
      code: SETTINGS_REPOSITORY_ERROR_CODES.DATABASE_ERROR,
    });
  });
});

function createMockSettingsTable() {
  const store = new Map();

  return {
    async get(key) {
      return store.get(key) ? { ...store.get(key) } : undefined;
    },
    async put(record) {
      store.set(record.key, { ...record });
      return record.key;
    },
    async delete(key) {
      store.delete(key);
    },
  };
}
