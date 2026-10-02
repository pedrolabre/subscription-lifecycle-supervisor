import Dexie from 'dexie';
import {
  CURRENT_DATABASE_VERSION,
  DATABASE_NAME,
  DATABASE_SCHEMA,
  DATABASE_SCHEMA_V2,
  INITIAL_DATABASE_VERSION,
} from './schema.js';
import { seedDefaultSettings } from './settingsSeed.js';

export function createSubscriptionLifecycleDatabase(options = {}) {
  const db = new Dexie(options.name ?? DATABASE_NAME);

  db.version(INITIAL_DATABASE_VERSION).stores(DATABASE_SCHEMA);
  db.version(CURRENT_DATABASE_VERSION).stores(DATABASE_SCHEMA_V2);
  db.on('populate', () => seedDefaultSettings(db, options.seedOptions));

  return db;
}

export const database = createSubscriptionLifecycleDatabase();
