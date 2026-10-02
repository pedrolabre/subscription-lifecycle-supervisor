import { database, DB_STORES } from '../db/index.js';

export const HISTORY_REPOSITORY_ERROR_CODES = Object.freeze({
  INVALID_ENTRY: 'history_invalid_entry',
});

export class HistoryRepositoryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HistoryRepositoryError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function createHistoryRepository(options = {}) {
  const table = resolveHistoryTable(options);

  async function add(entry) {
    const record = normalizeHistoryRecord(entry);

    if (!record.subscriptionId) {
      throw new HistoryRepositoryError(
        HISTORY_REPOSITORY_ERROR_CODES.INVALID_ENTRY,
        'Registro de histórico sem identificador de assinatura.',
        { entry },
      );
    }

    const generatedId = await table.add(record);

    return Object.freeze({
      id: generatedId,
      ...record,
    });
  }

  async function listBySubscriptionId(subscriptionId) {
    const normalizedId = normalizeId(subscriptionId);

    if (!normalizedId) {
      return [];
    }

    const records = await table
      .where('subscriptionId')
      .equals(normalizedId)
      .toArray();

    return records
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
      .map((record) => Object.freeze({ ...record }));
  }

  async function listAll() {
    const records = await table.toArray();

    return records
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
      .map((record) => Object.freeze({ ...record }));
  }

  async function count() {
    return table.count();
  }

  async function clear() {
    await table.clear();
  }

  async function bulkAdd(entries = []) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }

    const records = entries.map(normalizeHistoryRecord);

    await table.bulkAdd(records);

    return records.map((record) => Object.freeze({ ...record }));
  }

  return {
    add,
    bulkAdd,
    clear,
    count,
    listAll,
    listBySubscriptionId,
  };
}

export const historyRepository = createHistoryRepository();

function resolveHistoryTable(options) {
  if (options.table) {
    return options.table;
  }

  const db = options.database ?? database;

  return db[DB_STORES.BILLING_HISTORY] ?? db.table(DB_STORES.BILLING_HISTORY);
}

function normalizeId(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function normalizeHistoryRecord(entry) {
  const source = entry && typeof entry === 'object' ? entry : {};

  const subscriptionId = normalizeId(source.subscriptionId);
  const paidAt = source.paidAt ? new Date(source.paidAt).toISOString() : new Date().toISOString();
  const billingCycle = typeof source.billingCycle === 'string' ? source.billingCycle.trim().toLowerCase() : 'monthly';
  const amountCents = Number.isFinite(Number(source.amountCents))
    ? Math.round(Number(source.amountCents))
    : Math.round(Number(source.price || 0) * 100);

  return {
    subscriptionId,
    paidAt,
    billingCycle,
    amountCents,
  };
}
