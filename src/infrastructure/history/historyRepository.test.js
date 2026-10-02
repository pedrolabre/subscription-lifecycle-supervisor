import { describe, expect, it } from 'vitest';
import {
  createHistoryRepository,
  HISTORY_REPOSITORY_ERROR_CODES,
  HistoryRepositoryError,
} from './historyRepository.js';

describe('historyRepository', () => {
  it('adds a billing history record with generated ID and normalized fields', async () => {
    const table = createMockHistoryTable();
    const repository = createHistoryRepository({ table });

    const created = await repository.add({
      subscriptionId: 'sub_spotify',
      billingCycle: 'monthly',
      amountCents: 2990,
      paidAt: '2026-08-15T10:00:00.000Z',
    });

    expect(created).toMatchObject({
      id: 1,
      subscriptionId: 'sub_spotify',
      billingCycle: 'monthly',
      amountCents: 2990,
      paidAt: '2026-08-15T10:00:00.000Z',
    });

    expect(await repository.count()).toBe(1);
  });

  it('throws HistoryRepositoryError when subscriptionId is missing', async () => {
    const table = createMockHistoryTable();
    const repository = createHistoryRepository({ table });

    await expect(repository.add({ amountCents: 1000 })).rejects.toThrow(
      HistoryRepositoryError,
    );
    await expect(repository.add({ amountCents: 1000 })).rejects.toMatchObject({
      code: HISTORY_REPOSITORY_ERROR_CODES.INVALID_ENTRY,
    });
  });

  it('lists history entries filtered by subscriptionId', async () => {
    const table = createMockHistoryTable();
    const repository = createHistoryRepository({ table });

    await repository.add({
      subscriptionId: 'sub_spotify',
      amountCents: 2990,
      paidAt: '2026-07-15T10:00:00.000Z',
    });
    await repository.add({
      subscriptionId: 'sub_netflix',
      amountCents: 4590,
      paidAt: '2026-08-01T10:00:00.000Z',
    });
    await repository.add({
      subscriptionId: 'sub_spotify',
      amountCents: 2990,
      paidAt: '2026-08-15T10:00:00.000Z',
    });

    const spotifyHistory = await repository.listBySubscriptionId('sub_spotify');

    expect(spotifyHistory).toHaveLength(2);
    expect(spotifyHistory[0].paidAt).toBe('2026-08-15T10:00:00.000Z');
    expect(spotifyHistory[1].paidAt).toBe('2026-07-15T10:00:00.000Z');

    expect(await repository.listBySubscriptionId('unknown')).toEqual([]);
  });

  it('supports listing all, counting, bulk add and clearing', async () => {
    const table = createMockHistoryTable();
    const repository = createHistoryRepository({ table });

    await repository.bulkAdd([
      { subscriptionId: 'sub_1', amountCents: 1000, paidAt: '2026-06-01T00:00:00.000Z' },
      { subscriptionId: 'sub_2', amountCents: 2000, paidAt: '2026-07-01T00:00:00.000Z' },
    ]);

    expect(await repository.count()).toBe(2);

    const all = await repository.listAll();
    expect(all).toHaveLength(2);
    expect(all[0].subscriptionId).toBe('sub_2'); // mais recente primeiro

    await repository.clear();
    expect(await repository.count()).toBe(0);
  });
});

function createMockHistoryTable() {
  const records = [];
  let autoIncrementId = 1;

  return {
    async add(record) {
      const id = autoIncrementId++;
      const saved = { id, ...record };
      records.push(saved);
      return id;
    },
    async bulkAdd(newRecords) {
      for (const rec of newRecords) {
        const id = autoIncrementId++;
        records.push({ id, ...rec });
      }
    },
    async toArray() {
      return records.map((r) => ({ ...r }));
    },
    async count() {
      return records.length;
    },
    async clear() {
      records.length = 0;
    },
    where(fieldName) {
      return {
        equals(value) {
          return {
            async toArray() {
              return records
                .filter((r) => String(r[fieldName]) === String(value))
                .map((r) => ({ ...r }));
            },
          };
        },
      };
    },
  };
}
