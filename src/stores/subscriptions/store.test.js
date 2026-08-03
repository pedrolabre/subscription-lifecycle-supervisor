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
} from './index.js';

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

    deferred.resolve([
      subscription({
        id: 'sub_spotify',
        serviceName: 'Spotify Premium',
      }),
    ]);

    await expect(loadPromise).resolves.toHaveLength(1);
    expect(store.isLoading).toBe(false);
    expect(store.isLoaded).toBe(true);
    expect(store.subscriptions).toEqual([
      expect.objectContaining({
        id: 'sub_spotify',
        serviceName: 'Spotify Premium',
      }),
    ]);
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
    expect(store.error).toEqual({
      code: 'local_read_failed',
      message: 'Falha local de leitura.',
      details: {
        operation: 'list',
      },
    });

    store.clearError();

    expect(store.error).toBeNull();
  });

  it('uses a default recoverable error shape for unknown failures', async () => {
    const useStore = createTestStore({
      repository: {
        create: vi.fn().mockRejectedValue('offline'),
      },
    });
    const store = useStore();

    await expect(store.create(subscription())).rejects.toBe('offline');

    expect(store.error).toEqual({
      code: SUBSCRIPTIONS_STORE_ERROR_CODES.UNKNOWN,
      message: 'Nao foi possivel atualizar as assinaturas locais.',
      details: {},
    });
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
