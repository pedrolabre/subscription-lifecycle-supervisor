import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import {
  createSubscriptionsStore,
  SUBSCRIPTIONS_STORE_ERROR_CODES,
  SUBSCRIPTIONS_STORE_STATUS,
} from './index.js';
import { createSubscriptionsRepository } from '../../infrastructure/subscriptions/index.js';

describe('subscriptions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads subscriptions and updates loading flags', async () => {
    const deferred = createDeferred();
    const useStore = createTestStore({
      repository: {
        list: vi.fn(() => deferred.promise),
      },
    });
    const store = useStore();
    const loadPromise = store.load();

    expect(store.isLoading).toBe(true);
    expect(store.isLoaded).toBe(false);
    expect(store.error).toBeNull();
    expect(store.loadError).toBeNull();
    expect(store.mutationError).toBeNull();
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.LOADING);

    deferred.resolve([
      subscription({
        id: 'sub_spotify',
        serviceName: 'Spotify Premium',
      }),
    ]);

    await expect(loadPromise).resolves.toHaveLength(1);
    expect(store.isLoading).toBe(false);
    expect(store.isLoaded).toBe(true);
    expect(store.hasSubscriptions).toBe(true);
    expect(store.isEmpty).toBe(false);
    expect(store.hasError).toBe(false);
    expect(store.canRetry).toBe(false);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.LOADED);
    expect(store.subscriptions).toEqual([
      expect.objectContaining({
        id: 'sub_spotify',
        serviceName: 'Spotify Premium',
      }),
    ]);
  });

  it('loads an empty database as a loaded empty state', async () => {
    const useStore = createTestStore({
      repository: {
        list: vi.fn().mockResolvedValue([]),
      },
    });
    const store = useStore();

    await expect(store.load()).resolves.toEqual([]);

    expect(store.subscriptions).toEqual([]);
    expect(store.isLoaded).toBe(true);
    expect(store.hasSubscriptions).toBe(false);
    expect(store.isEmpty).toBe(true);
    expect(store.hasError).toBe(false);
    expect(store.error).toBeNull();
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.EMPTY);
  });

  it('keeps load failures recoverable', async () => {
    const cause = Object.assign(new Error('Falha local de leitura.'), {
      code: 'local_read_failed',
      details: {
        operation: 'list',
      },
    });
    const useStore = createTestStore({
      repository: {
        list: vi.fn().mockRejectedValue(cause),
      },
    });
    const store = useStore();

    await expect(store.load()).rejects.toThrow('Falha local de leitura.');

    expect(store.isLoading).toBe(false);
    expect(store.isLoaded).toBe(false);
    expect(store.loadError).toEqual({
      code: 'local_read_failed',
      message: 'Falha local de leitura.',
      details: {
        operation: 'list',
      },
    });
    expect(store.mutationError).toBeNull();
    expect(store.error).toEqual(store.loadError);
    expect(store.hasError).toBe(true);
    expect(store.canRetry).toBe(true);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.ERROR);

    store.clearError();

    expect(store.error).toBeNull();
    expect(store.loadError).toBeNull();
    expect(store.mutationError).toBeNull();
    expect(store.hasError).toBe(false);
    expect(store.canRetry).toBe(false);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.IDLE);
  });

  it('retries a failed read using the same repository', async () => {
    const cause = Object.assign(new Error('Falha local de leitura.'), {
      code: 'local_read_failed',
    });
    const repository = {
      list: vi.fn()
        .mockRejectedValueOnce(cause)
        .mockResolvedValueOnce([
          subscription({
            id: 'sub_google',
            serviceName: 'Google One',
          }),
        ]),
    };
    const store = createTestStore({ repository })();

    await expect(store.load()).rejects.toThrow('Falha local de leitura.');
    expect(store.canRetry).toBe(true);

    await expect(store.reload()).resolves.toHaveLength(1);

    expect(repository.list).toHaveBeenCalledTimes(2);
    expect(store.subscriptions).toEqual([
      expect.objectContaining({
        id: 'sub_google',
        serviceName: 'Google One',
      }),
    ]);
    expect(store.loadError).toBeNull();
    expect(store.hasError).toBe(false);
    expect(store.canRetry).toBe(false);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.LOADED);
  });

  it('preserves loaded subscriptions when a reload fails', async () => {
    const loadedSubscription = subscription({
      id: 'sub_spotify',
      serviceName: 'Spotify Premium',
    });
    const cause = Object.assign(new Error('IndexedDB indisponivel.'), {
      code: 'local_read_failed',
    });
    const repository = {
      list: vi.fn()
        .mockResolvedValueOnce([loadedSubscription])
        .mockRejectedValueOnce(cause),
    };
    const store = createTestStore({ repository })();

    await store.load();
    await expect(store.reload()).rejects.toThrow('IndexedDB indisponivel.');

    expect(store.subscriptions).toEqual([loadedSubscription]);
    expect(store.isLoaded).toBe(true);
    expect(store.hasSubscriptions).toBe(true);
    expect(store.loadError).toEqual({
      code: 'local_read_failed',
      message: 'IndexedDB indisponivel.',
      details: {},
    });
    expect(store.canRetry).toBe(true);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.LOADED);
  });

  it('uses a default recoverable error shape for unknown failures', async () => {
    const useStore = createTestStore({
      repository: {
        create: vi.fn().mockRejectedValue('offline'),
      },
    });
    const store = useStore();

    await expect(store.create(subscription())).rejects.toBe('offline');

    expect(store.loadError).toBeNull();
    expect(store.mutationError).toEqual({
      code: SUBSCRIPTIONS_STORE_ERROR_CODES.UNKNOWN,
      message: 'Nao foi possivel atualizar as assinaturas locais.',
      details: {},
    });
    expect(store.error).toEqual(store.mutationError);
    expect(store.hasError).toBe(true);
    expect(store.canRetry).toBe(false);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.ERROR);

    store.clearError();

    expect(store.error).toBeNull();
    expect(store.hasError).toBe(false);
  });

  it('preserves loaded subscriptions when a mutation fails', async () => {
    const loadedSubscription = subscription({
      id: 'sub_spotify',
      serviceName: 'Spotify Premium',
      price: 29.9,
    });
    const cause = Object.assign(new Error('Falha local de escrita.'), {
      code: 'local_write_failed',
      details: {
        operation: 'update',
      },
    });
    const useStore = createTestStore({
      repository: {
        update: vi.fn().mockRejectedValue(cause),
      },
    });
    const store = useStore();

    store.subscriptions = [loadedSubscription];
    store.isLoaded = true;

    await expect(store.update('sub_spotify', { price: 35.5 })).rejects.toThrow(
      'Falha local de escrita.',
    );

    expect(store.subscriptions).toEqual([loadedSubscription]);
    expect(store.loadError).toBeNull();
    expect(store.mutationError).toEqual({
      code: 'local_write_failed',
      message: 'Falha local de escrita.',
      details: {
        operation: 'update',
      },
    });
    expect(store.hasError).toBe(true);
    expect(store.canRetry).toBe(false);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.LOADED);
  });

  it('creates, updates, archives and ends subscriptions through the repository', async () => {
    const initial = subscription({
      id: 'sub_spotify',
      serviceName: 'Spotify',
      price: 29.9,
    });
    const created = subscription({
      id: 'sub_google',
      serviceName: 'Google One',
      billingCycle: BILLING_CYCLES.YEARLY,
      price: 120,
      renewalDate: '2027-08-01',
    });
    const updated = subscription({
      ...initial,
      serviceName: 'Spotify Duo',
      price: 35.5,
    });
    const archived = subscription({
      ...updated,
      status: SUBSCRIPTION_STATUS.ARCHIVED,
    });
    const ended = subscription({
      ...created,
      status: SUBSCRIPTION_STATUS.ENDED,
    });
    const repository = {
      create: vi.fn().mockResolvedValue(created),
      update: vi.fn().mockResolvedValue(updated),
      archive: vi.fn().mockResolvedValue(archived),
      end: vi.fn().mockResolvedValue(ended),
    };
    const store = createTestStore({ repository })();

    store.subscriptions = [initial];

    await expect(store.create({ serviceName: 'Google One' })).resolves.toBe(
      created,
    );
    await expect(store.update('sub_spotify', { price: 35.5 })).resolves.toBe(
      updated,
    );
    await expect(store.archive('sub_spotify')).resolves.toBe(archived);
    await expect(store.end('sub_google')).resolves.toBe(ended);

    expect(repository.create).toHaveBeenCalledWith({ serviceName: 'Google One' });
    expect(repository.update).toHaveBeenCalledWith('sub_spotify', {
      price: 35.5,
    });
    expect(repository.archive).toHaveBeenCalledWith('sub_spotify');
    expect(repository.end).toHaveBeenCalledWith('sub_google');
    expect(store.subscriptions).toEqual([archived, ended]);
    expect(store.error).toBeNull();
  });

  it('derives totals, counters, active subscriptions and trial alerts', () => {
    const store = createTestStore({
      summaryOptions: {
        referenceDate: '2026-08-03',
      },
    })();

    store.subscriptions = [
      subscription({
        id: 'sub_spotify',
        serviceName: 'Spotify Premium',
        price: 29.9,
      }),
      subscription({
        id: 'sub_google',
        serviceName: 'Google One',
        billingCycle: BILLING_CYCLES.YEARLY,
        price: 120,
        renewalDate: '2027-08-01',
      }),
      subscription({
        id: 'sub_figma',
        serviceName: 'Figma',
        serviceId: 'figma',
        status: SUBSCRIPTION_STATUS.TRIAL,
        type: SUBSCRIPTION_TYPES.FREE,
        billingCycle: BILLING_CYCLES.NONE,
        price: 0,
        renewalDate: null,
        trialEndDate: '2026-08-07',
      }),
      subscription({
        id: 'sub_archived',
        serviceName: 'Netflix',
        status: SUBSCRIPTION_STATUS.ARCHIVED,
        price: 59.9,
      }),
      subscription({
        id: 'sub_ended',
        serviceName: 'Amazon Prime',
        status: SUBSCRIPTION_STATUS.ENDED,
        price: 19.9,
      }),
    ];

    expect(store.totalCount).toBe(5);
    expect(store.activeCount).toBe(2);
    expect(store.trialCount).toBe(1);
    expect(store.endedCount).toBe(1);
    expect(store.archivedCount).toBe(1);
    expect(store.activeSubscriptionsCount).toBe(3);
    expect(store.monthlyTotal).toBe(39.9);
    expect(store.yearlyProjection).toBe(478.8);
    expect(store.activeSubscriptions.map((item) => item.id)).toEqual([
      'sub_spotify',
      'sub_google',
      'sub_figma',
    ]);
    expect(store.trialAlerts).toEqual([
      expect.objectContaining({
        id: 'sub_figma',
        serviceId: 'figma',
        daysUntilTrialEnd: 4,
        isTrialEndingSoon: true,
      }),
    ]);
  });

  it('keeps the MVP lifecycle consistent through repository-backed local state', async () => {
    const table = createSubscriptionsTable();
    const repository = createSubscriptionsRepository({
      table,
      createId: createIdSequence([
        'sub_spotify',
        'sub_trial',
        'sub_education',
      ]),
      now: createNowSequence([
        '2026-08-03T12:00:00.000Z',
        '2026-08-03T12:01:00.000Z',
        '2026-08-03T12:02:00.000Z',
        '2026-08-03T12:03:00.000Z',
        '2026-08-03T12:04:00.000Z',
        '2026-08-03T12:05:00.000Z',
      ]),
    });
    const store = createTestStore({
      repository,
      summaryOptions: {
        referenceDate: '2026-08-03',
      },
    })();

    await expect(store.load()).resolves.toEqual([]);

    expect(store.isEmpty).toBe(true);
    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.EMPTY);

    await store.create({
      serviceName: 'Spotify',
      serviceId: 'spotify',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: '29,90',
      startDate: '2026-08-01',
      renewalDate: '2026-09-01',
      brandColor: '#1db954',
      category: 'music',
      icon: '/assets/logos/spotify.svg',
    });
    await store.create({
      serviceName: 'Servico Livre Trial',
      status: SUBSCRIPTION_STATUS.TRIAL,
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
      trialEndDate: '2026-08-07',
    });
    await store.create({
      serviceName: 'GitHub Student',
      serviceId: 'github-pro',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
      brandColor: '#24292f',
      category: 'development',
      icon: '/assets/logos/github.svg',
    });

    expect(store.status).toBe(SUBSCRIPTIONS_STORE_STATUS.LOADED);
    expect(store.monthlyTotal).toBe(29.9);
    expect(store.yearlyProjection).toBe(358.8);
    expect(store.trialAlerts).toEqual([
      expect.objectContaining({
        id: 'sub_trial',
        serviceId: null,
        serviceName: 'Servico Livre Trial',
        isTrialEndingSoon: true,
      }),
    ]);

    await store.update('sub_spotify', {
      serviceName: 'Google One',
      serviceId: 'google-one',
      brandColor: '#4285f4',
      category: 'cloud',
      icon: '/assets/logos/google-one.svg',
      price: '35,50',
      renewalDate: '2026-10-01',
    });
    await store.archive('sub_spotify');
    await store.end('sub_trial');

    expect(store.monthlyTotal).toBe(0);
    expect(store.activeCount).toBe(1);
    expect(store.archivedCount).toBe(1);
    expect(store.endedCount).toBe(1);
    expect(store.trialCount).toBe(0);
    expect(store.summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sub_spotify',
          serviceId: 'google-one',
          serviceName: 'Google One',
          status: SUBSCRIPTION_STATUS.ARCHIVED,
        }),
        expect.objectContaining({
          id: 'sub_trial',
          serviceName: 'Servico Livre Trial',
          status: SUBSCRIPTION_STATUS.ENDED,
        }),
        expect.objectContaining({
          id: 'sub_education',
          serviceId: 'github-pro',
          serviceName: 'GitHub Student',
          status: SUBSCRIPTION_STATUS.ACTIVE,
        }),
      ]),
    );

    setActivePinia(createPinia());

    const reloadedStore = createTestStore({
      repository,
      summaryOptions: {
        referenceDate: '2026-08-03',
      },
    })();

    await reloadedStore.load();

    expect(reloadedStore.subscriptions).toHaveLength(3);
    expect(reloadedStore.monthlyTotal).toBe(0);
    expect(reloadedStore.summary.items).toEqual(store.summary.items);
  });
});

function createTestStore(options = {}) {
  return createSubscriptionsStore({
    storeId: `subscriptions-test-${crypto.randomUUID()}`,
    repository: createRepositoryStub(options.repository),
    summaryOptions: options.summaryOptions,
  });
}

function createRepositoryStub(overrides = {}) {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn((payload) => Promise.resolve(payload)),
    update: vi.fn((id, changes) =>
      Promise.resolve({
        id,
        ...changes,
      }),
    ),
    archive: vi.fn((id) =>
      Promise.resolve({
        id,
        status: SUBSCRIPTION_STATUS.ARCHIVED,
      }),
    ),
    end: vi.fn((id) =>
      Promise.resolve({
        id,
        status: SUBSCRIPTION_STATUS.ENDED,
      }),
    ),
    ...overrides,
  };
}

function subscription(overrides = {}) {
  return {
    id: 'sub_1',
    serviceName: 'Spotify',
    serviceId: null,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    type: SUBSCRIPTION_TYPES.PAID,
    billingCycle: BILLING_CYCLES.MONTHLY,
    price: 29.9,
    startDate: '2026-08-01',
    renewalDate: '2026-09-01',
    trialEndDate: null,
    icon: null,
    brandColor: null,
    category: null,
    createdAt: '2026-08-03T12:00:00.000Z',
    updatedAt: '2026-08-03T12:00:00.000Z',
    ...overrides,
  };
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

function createIdSequence(ids) {
  let index = 0;

  return () => ids[index++] ?? `sub_${index}`;
}

function createNowSequence(values) {
  let index = 0;

  return () => values[index++] ?? values.at(-1);
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
  };
}

function cloneRecord(record) {
  return { ...record };
}
