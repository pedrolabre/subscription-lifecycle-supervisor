import { describe, expect, it } from 'vitest';
import {
  createDefaultSettings,
  createSubscriptionLifecycleDatabase,
  DATABASE_NAME,
  DATABASE_SCHEMA,
  DB_STORES,
  INITIAL_DATABASE_VERSION,
  seedDefaultSettings,
  SETTINGS_KEY,
} from './index.js';

describe('database schema', () => {
  it('declares the initial IndexedDB stores', () => {
    expect(DATABASE_NAME).toBe('SubscriptionLifecycleSupervisorDB');
    expect(INITIAL_DATABASE_VERSION).toBe(1);
    expect(DATABASE_SCHEMA).toEqual({
      subscriptions:
        'id, serviceName, serviceId, status, type, renewalDate, trialEndDate, updatedAt',
      servicesCatalog: 'id, name, category',
      settings: 'key',
    });
  });

  it('configures a Dexie database instance without opening it', () => {
    const db = createSubscriptionLifecycleDatabase({
      name: 'SubscriptionLifecycleSupervisorTestDB',
    });

    expect(db.name).toBe('SubscriptionLifecycleSupervisorTestDB');
    expect(db.verno).toBe(INITIAL_DATABASE_VERSION);
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      DB_STORES.SERVICES_CATALOG,
      DB_STORES.SETTINGS,
      DB_STORES.SUBSCRIPTIONS,
    ]);
    expect(readTableSchema(db, DB_STORES.SUBSCRIPTIONS)).toEqual({
      primaryKey: 'id',
      indexes: [
        'serviceName',
        'serviceId',
        'status',
        'type',
        'renewalDate',
        'trialEndDate',
        'updatedAt',
      ],
    });
    expect(readTableSchema(db, DB_STORES.SERVICES_CATALOG)).toEqual({
      primaryKey: 'id',
      indexes: ['name', 'category'],
    });
    expect(readTableSchema(db, DB_STORES.SETTINGS)).toEqual({
      primaryKey: 'key',
      indexes: [],
    });

    db.close();
  });
});

describe('settings seed', () => {
  it('creates the default settings payload with a stable key', () => {
    const settings = createDefaultSettings({
      now: '2026-08-03T12:00:00.000Z',
    });

    expect(settings).toEqual({
      key: SETTINGS_KEY,
      theme: 'system',
      currency: 'BRL',
      locale: 'pt-BR',
      catalogSeedVersion: 1,
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T12:00:00.000Z',
    });
  });

  it('seeds settings only when the record is missing', async () => {
    const settingsTable = createSettingsTable();
    const db = { settings: settingsTable };

    const firstSeed = await seedDefaultSettings(db, {
      now: '2026-08-03T12:00:00.000Z',
    });
    const secondSeed = await seedDefaultSettings(db, {
      now: '2027-01-01T12:00:00.000Z',
    });

    expect(firstSeed).toEqual(secondSeed);
    expect(settingsTable.records()).toEqual([firstSeed]);
  });
});

function createSettingsTable() {
  const records = new Map();

  return {
    async get(key) {
      return records.get(key);
    },
    async add(record) {
      records.set(record.key, record);

      return record.key;
    },
    records() {
      return [...records.values()];
    },
  };
}

function readTableSchema(db, tableName) {
  const schema = db.table(tableName).schema;

  return {
    primaryKey: schema.primKey.src,
    indexes: schema.indexes.map((index) => index.src),
  };
}
