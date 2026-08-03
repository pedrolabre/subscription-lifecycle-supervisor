import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_ERROR_CODES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import {
  createSubscriptionsRepository,
  SUBSCRIPTION_REPOSITORY_ERROR_CODES,
  toSubscriptionRecord,
} from './index.js';

describe('subscriptions repository', () => {
  it('lists and reads subscriptions through the injected table', async () => {
    const firstRecord = persistedSubscription({
      id: 'sub_1',
      serviceName: 'Spotify',
    });
    const secondRecord = persistedSubscription({
      id: 'sub_2',
      serviceName: 'Netflix',
      price: 39.9,
    });
    const repository = createSubscriptionsRepository({
      table: createSubscriptionsTable([firstRecord, secondRecord]),
    });

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'sub_1',
        serviceName: 'Spotify',
        createdAt: '2026-08-03T12:00:00.000Z',
      }),
      expect.objectContaining({
        id: 'sub_2',
        serviceName: 'Netflix',
        price: 39.9,
      }),
    ]);
    await expect(repository.getById(' sub_2 ')).resolves.toMatchObject({
      id: 'sub_2',
      serviceName: 'Netflix',
    });
    await expect(repository.getById('missing')).resolves.toBeNull();
  });

  it('creates a validated subscription with generated id and timestamps', async () => {
    const table = createSubscriptionsTable();
    const repository = createSubscriptionsRepository({
      table,
      createId: () => 'sub_created',
      now: () => '2026-08-03T14:00:00.000Z',
    });

    const created = await repository.create({
      serviceName: ' Spotify Premium ',
      serviceId: ' spotify ',
      status: ' ACTIVE ',
      type: ' PAID ',
      billingCycle: ' MONTHLY ',
      price: '29,90',
      startDate: '2026-08-01T10:30:00.000Z',
      renewalDate: '2026-09-01',
      brandColor: '1DB954',
    });

    expect(created).toMatchObject({
      id: 'sub_created',
      serviceName: 'Spotify Premium',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      price: 29.9,
      createdAt: '2026-08-03T14:00:00.000Z',
      updatedAt: '2026-08-03T14:00:00.000Z',
    });
    expect(table.records()).toEqual([
      expect.objectContaining({
        id: 'sub_created',
        serviceName: 'Spotify Premium',
        serviceId: 'spotify',
        brandColor: '#1db954',
        createdAt: '2026-08-03T14:00:00.000Z',
        updatedAt: '2026-08-03T14:00:00.000Z',
      }),
    ]);
  });

  it('updates subscriptions without dropping existing persisted data', async () => {
    const table = createSubscriptionsTable([
      {
        ...persistedSubscription({
          id: 'sub_1',
          serviceName: 'Spotify',
          icon: '/assets/logos/spotify.svg',
          category: 'music',
        }),
        localOnly: 'preserve-me',
      },
    ]);
    const repository = createSubscriptionsRepository({
      table,
      now: () => '2026-08-03T16:00:00.000Z',
    });

    const updated = await repository.update('sub_1', {
      id: 'ignored_id',
      serviceName: 'Spotify Duo',
      price: '35,50',
    });

    expect(updated).toMatchObject({
      id: 'sub_1',
      serviceName: 'Spotify Duo',
      price: 35.5,
      icon: '/assets/logos/spotify.svg',
      category: 'music',
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T16:00:00.000Z',
    });
    expect(table.records()[0]).toMatchObject({
      id: 'sub_1',
      localOnly: 'preserve-me',
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T16:00:00.000Z',
    });
  });

  it('archives and ends subscriptions while preserving their content', async () => {
    const table = createSubscriptionsTable([
      persistedSubscription({
        id: 'sub_archive',
        serviceName: 'Amazon Prime',
        billingCycle: BILLING_CYCLES.YEARLY,
        price: 199,
        renewalDate: '2027-08-01',
      }),
      persistedSubscription({
        id: 'sub_end',
        serviceName: 'Figma Trial',
        status: SUBSCRIPTION_STATUS.TRIAL,
        type: SUBSCRIPTION_TYPES.FREE,
        billingCycle: BILLING_CYCLES.NONE,
        price: 0,
        renewalDate: null,
        trialEndDate: '2026-08-10',
      }),
    ]);
    const repository = createSubscriptionsRepository({
      table,
      now: createNowSequence([
        '2026-08-03T17:00:00.000Z',
        '2026-08-03T18:00:00.000Z',
      ]),
    });

    const archived = await repository.archive('sub_archive');
    const ended = await repository.end('sub_end');

    expect(archived).toMatchObject({
      id: 'sub_archive',
      status: SUBSCRIPTION_STATUS.ARCHIVED,
      serviceName: 'Amazon Prime',
      renewalDate: '2027-08-01',
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T17:00:00.000Z',
    });
    expect(ended).toMatchObject({
      id: 'sub_end',
      status: SUBSCRIPTION_STATUS.ENDED,
      serviceName: 'Figma Trial',
      trialEndDate: '2026-08-10',
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T18:00:00.000Z',
    });
  });

  it('rejects invalid writes before touching the table', async () => {
    const table = createSubscriptionsTable();
    const repository = createSubscriptionsRepository({
      table,
      createId: () => 'sub_invalid',
    });

    await expect(
      repository.create({
        serviceName: '',
        status: SUBSCRIPTION_STATUS.ACTIVE,
        type: SUBSCRIPTION_TYPES.PAID,
        billingCycle: BILLING_CYCLES.MONTHLY,
        price: -10,
        startDate: '2026-08-01',
        renewalDate: '2026-09-01',
      }),
    ).rejects.toMatchObject({
      code: SUBSCRIPTION_REPOSITORY_ERROR_CODES.VALIDATION_FAILED,
      details: {
        errors: expect.arrayContaining([
          expect.objectContaining({
            code: SUBSCRIPTION_ERROR_CODES.SERVICE_NAME_REQUIRED,
          }),
          expect.objectContaining({
            code: SUBSCRIPTION_ERROR_CODES.PRICE_NEGATIVE,
          }),
        ]),
      },
    });
    expect(table.records()).toEqual([]);
  });

  it('raises a local not-found error for missing mutable records', async () => {
    const repository = createSubscriptionsRepository({
      table: createSubscriptionsTable(),
    });

    await expect(repository.update('missing', { price: 10 })).rejects.toMatchObject(
      {
        code: SUBSCRIPTION_REPOSITORY_ERROR_CODES.NOT_FOUND,
        details: {
          id: 'missing',
        },
      },
    );
  });
});

function persistedSubscription(overrides = {}) {
  return toSubscriptionRecord(
    {
      id: 'sub_1',
      serviceName: 'Spotify',
      serviceId: 'spotify',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: 29.9,
      startDate: '2026-08-01',
      renewalDate: '2026-09-01',
      trialEndDate: null,
      icon: null,
      brandColor: '#1db954',
      category: 'music',
      ...overrides,
    },
    {
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T12:30:00.000Z',
    },
  );
}

function createSubscriptionsTable(initialRecords = []) {
  const records = new Map();

  for (const record of initialRecords) {
    records.set(record.id, cloneRecord(record));
  }

  return {
    async toArray() {
      return [...records.values()].map(cloneRecord);
    },
    async get(id) {
      const record = records.get(id);

      return record ? cloneRecord(record) : undefined;
    },
    async add(record) {
      if (records.has(record.id)) {
        throw new Error(`Duplicate id: ${record.id}`);
      }

      records.set(record.id, cloneRecord(record));

      return record.id;
    },
    async put(record) {
      records.set(record.id, cloneRecord(record));

      return record.id;
    },
    records() {
      return [...records.values()].map(cloneRecord);
    },
  };
}

function createNowSequence(values) {
  let index = 0;

  return () => values[index++] ?? values.at(-1);
}

function cloneRecord(record) {
  return { ...record };
}
