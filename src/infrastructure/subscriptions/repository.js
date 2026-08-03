import {
  SUBSCRIPTION_STATUS,
  validateSubscriptionPayload,
} from '../../domain/subscriptions/index.js';
import { database, DB_STORES } from '../db/index.js';
import {
  normalizeSubscriptionTimestamp,
  toSubscriptionDomain,
  toSubscriptionRecord,
} from './mappers.js';

export const SUBSCRIPTION_REPOSITORY_ERROR_CODES = Object.freeze({
  NOT_FOUND: 'subscription_not_found',
  VALIDATION_FAILED: 'subscription_validation_failed',
});

export class SubscriptionRepositoryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SubscriptionRepositoryError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function createSubscriptionsRepository(options = {}) {
  const table = resolveSubscriptionsTable(options);
  const createId = options.createId ?? createSubscriptionId;
  const now = options.now ?? (() => new Date());

  async function list() {
    const records = await table.toArray();

    return records.map(toSubscriptionDomain);
  }

  async function getById(id) {
    const normalizedId = normalizeId(id);

    if (!normalizedId) {
      return null;
    }

    const record = await table.get(normalizedId);

    return record ? toSubscriptionDomain(record) : null;
  }

  async function create(payload) {
    const validation = validateForWrite(payload);
    const id = normalizeId(validation.value.id) || normalizeId(createId());

    if (!id) {
      throw new SubscriptionRepositoryError(
        SUBSCRIPTION_REPOSITORY_ERROR_CODES.VALIDATION_FAILED,
        'Assinatura local sem identificador.',
        {
          value: validation.value,
          errors: [
            {
              field: 'id',
              code: 'subscription_id_required',
              message: 'Assinatura local precisa de identificador.',
            },
          ],
        },
      );
    }

    const timestamp = createTimestamp(now);
    const record = toSubscriptionRecord(
      {
        ...validation.value,
        id,
      },
      {
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    );

    await table.add(record);

    return toSubscriptionDomain(record);
  }

  async function update(id, changes) {
    const existingRecord = await getExistingRecord(id);
    const currentSubscription = toSubscriptionDomain(existingRecord);
    const validation = validateForWrite({
      ...currentSubscription,
      ...changes,
      id: currentSubscription.id,
    });
    const timestamp = createTimestamp(now);
    const nextRecord = {
      ...existingRecord,
      ...toSubscriptionRecord(
        {
          ...validation.value,
          id: currentSubscription.id,
        },
        {
          createdAt: existingRecord.createdAt,
          updatedAt: timestamp,
        },
      ),
    };

    await table.put(nextRecord);

    return toSubscriptionDomain(nextRecord);
  }

  function archive(id) {
    return update(id, {
      status: SUBSCRIPTION_STATUS.ARCHIVED,
    });
  }

  function end(id) {
    return update(id, {
      status: SUBSCRIPTION_STATUS.ENDED,
    });
  }

  async function getExistingRecord(id) {
    const normalizedId = normalizeId(id);
    const record = normalizedId ? await table.get(normalizedId) : null;

    if (!record) {
      throw new SubscriptionRepositoryError(
        SUBSCRIPTION_REPOSITORY_ERROR_CODES.NOT_FOUND,
        'Assinatura local nao encontrada.',
        { id: normalizedId || null },
      );
    }

    return record;
  }

  return Object.freeze({
    list,
    getById,
    create,
    update,
    archive,
    end,
  });
}

export const subscriptionsRepository = createSubscriptionsRepository();

function validateForWrite(payload) {
  const result = validateSubscriptionPayload(payload);

  if (result.isValid) {
    return result;
  }

  throw new SubscriptionRepositoryError(
    SUBSCRIPTION_REPOSITORY_ERROR_CODES.VALIDATION_FAILED,
    'Assinatura local invalida.',
    {
      value: result.value,
      errors: result.errors,
    },
  );
}

function resolveSubscriptionsTable(options) {
  return (
    options.table ??
    options.db?.[DB_STORES.SUBSCRIPTIONS] ??
    database[DB_STORES.SUBSCRIPTIONS]
  );
}

function createSubscriptionId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `sub_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );
}

function createTimestamp(now) {
  const value = typeof now === 'function' ? now() : now;

  return normalizeSubscriptionTimestamp(value) ?? new Date().toISOString();
}

function normalizeId(id) {
  if (id === null || id === undefined) {
    return '';
  }

  return String(id).trim();
}
