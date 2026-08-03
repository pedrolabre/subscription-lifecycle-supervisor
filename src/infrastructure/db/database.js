import Dexie from 'dexie';
import {
  DATABASE_NAME,
  DATABASE_SCHEMA,
  INITIAL_DATABASE_VERSION,
} from './schema.js';
import { seedDefaultSettings } from './settingsSeed.js';

export function createSubscriptionLifecycleDatabase(options = {}) {
  const db = new Dexie(options.name ?? DATABASE_NAME);

  db.version(INITIAL_DATABASE_VERSION).stores(DATABASE_SCHEMA);
  db.on('populate', () => seedDefaultSettings(db, options.seedOptions));

  return db;
}

export const database = createSubscriptionLifecycleDatabase();
