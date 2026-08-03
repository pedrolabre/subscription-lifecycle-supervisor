import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

const { storeStatus, useSubscriptionsStoreMock } = vi.hoisted(() => ({
  storeStatus: {
    IDLE: 'idle',
    LOADING: 'loading',
    EMPTY: 'empty',
    LOADED: 'loaded',
    ERROR: 'error',
  },
  useSubscriptionsStoreMock: vi.fn(),
}));

vi.mock('../stores/subscriptions/index.js', () => ({
  SUBSCRIPTIONS_STORE_STATUS: storeStatus,
  useSubscriptionsStore: useSubscriptionsStoreMock,
}));

describe('App', () => {
  beforeEach(() => {
    useSubscriptionsStoreMock.mockReset();
  });

  it('renders the operational product shell and starts local loading', () => {
    const store = createStore();
    const wrapper = mountApp(store);

    expect(wrapper.text()).toContain('Subscription Lifecycle Supervisor');
    expect(wrapper.find('header[aria-labelledby="app-title"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('main[aria-label="Painel de assinaturas"]').exists(),
    ).toBe(true);
    expect(wrapper.get('#summary-title').text()).toBe('Ciclo atual');
    expect(wrapper.get('#subscriptions-title').text()).toBe('Lista local');
    expect(wrapper.get('button[type="button"]').text()).toBe('Nova assinatura');
    expect(wrapper.get('[role="status"]').text()).toContain('Servico');
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe(
      'Carregando assinaturas locais',
    );
    expect(wrapper.text()).toContain('Preparando leitura local');
    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it('renders the empty subscriptions state after a successful empty load', () => {
    const wrapper = mountApp(
      createStore({
        isLoaded: true,
        isEmpty: true,
        status: storeStatus.EMPTY,
      }),
    );

    expect(wrapper.text()).toContain('Nenhuma assinatura');
    expect(wrapper.text()).toContain('Nenhuma assinatura salva');
    expect(wrapper.text()).toContain(
      'Sua lista local ainda nao tem assinaturas.',
    );
  });

  it('renders a recoverable local read error with retry', async () => {
    const reload = vi.fn().mockResolvedValue([]);
    const wrapper = mountApp(
      createStore({
        canRetry: true,
        error: {
          message: 'IndexedDB indisponivel.',
        },
        hasError: true,
        loadError: {
          message: 'IndexedDB indisponivel.',
        },
        reload,
        status: storeStatus.ERROR,
      }),
    );

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Nao foi possivel carregar as assinaturas',
    );
    expect(wrapper.text()).toContain('IndexedDB indisponivel.');

    await wrapper.get('.state-panel__action').trigger('click');

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('renders real dashboard totals and status counters from the store', () => {
    const wrapper = mountApp(
      createStore({
        activeCount: 2,
        archivedCount: 1,
        endedCount: 1,
        hasSubscriptions: true,
        isLoaded: true,
        monthlyTotal: 39.9,
        status: storeStatus.LOADED,
        subscriptions: [createSubscription()],
        summary: {
          items: [
            createSubscription({
              id: 'sub_spotify',
              price: 29.9,
              serviceName: 'Spotify Premium',
            }),
            createSubscription({
              billingCycle: 'yearly',
              id: 'sub_google',
              price: 120,
              renewalDate: '2027-08-01',
              serviceName: 'Google One',
            }),
            createSubscription({
              billingCycle: 'none',
              id: 'sub_figma',
              price: 0,
              renewalDate: null,
              serviceName: 'Figma Education',
              status: 'trial',
              trialEndDate: '2026-08-07',
              type: 'educational',
            }),
          ],
        },
        trialAlerts: [
          createSubscription({
            billingCycle: 'none',
            id: 'sub_figma',
            price: 0,
            renewalDate: null,
            serviceName: 'Figma Education',
            status: 'trial',
            trialEndDate: '2026-08-07',
            type: 'educational',
          }),
        ],
        trialCount: 1,
        yearlyProjection: 478.8,
      }),
    );
    const summary = wrapper.get('.summary-grid').text();

    expect(summary).toContain('Mensal');
    expect(summary).toContain('39,90');
    expect(summary).toContain('Anual');
    expect(summary).toContain('478,80');
    expect(summary).toContain('Ativas');
    expect(summary).toContain('Status ativo');
    expect(summary).toContain('Trials');
    expect(summary).toContain('1 alerta perto do fim');
    expect(summary).toContain('Encerradas');
    expect(summary).toContain('1 arquivada');
    expect(wrapper.text()).toContain('1 trial perto do vencimento');
    expect(wrapper.text()).toContain('Figma Education');
  });

  it('renders loaded local data with subscription cards', () => {
    const wrapper = mountApp(
      createStore({
        activeCount: 1,
        hasSubscriptions: true,
        isLoaded: true,
        monthlyTotal: 29.9,
        summary: {
          items: [
            createSubscription({
              brandColor: '#1db954',
              icon: '/assets/logos/spotify.svg',
              price: 29.9,
              renewalDate: '2026-09-01',
              serviceName: 'Spotify Premium',
            }),
          ],
        },
        status: storeStatus.LOADED,
        subscriptions: [createSubscription()],
        yearlyProjection: 358.8,
      }),
    );

    expect(wrapper.text()).toContain('Dados carregados');
    expect(wrapper.get('[role="list"]').text()).toContain('Spotify Premium');
    expect(wrapper.get('[role="list"]').text()).toContain('29,90');
    expect(wrapper.get('[role="list"]').text()).toContain('/ mes');
    expect(wrapper.get('[role="list"]').text()).toContain('Renovacao');
    expect(wrapper.get('[role="list"]').text()).toContain('01/09/2026');
    expect(wrapper.get('[role="list"]').text()).toContain('Ativa');
    expect(wrapper.find('.subscription-card').exists()).toBe(true);
  });

  it('opens and cancels the inline new subscription form', async () => {
    const wrapper = mountApp(
      createStore({
        isEmpty: true,
        isLoaded: true,
        status: storeStatus.EMPTY,
      }),
    );

    expect(wrapper.find('#new-subscription-form').exists()).toBe(false);

    await wrapper.get('[data-test="open-subscription-form"]').trigger('click');

    expect(wrapper.get('#new-subscription-title').text()).toBe(
      'Nova assinatura',
    );
    expect(wrapper.find('#new-subscription-form').exists()).toBe(true);

    await wrapper.get('[data-test="cancel-subscription-form"]').trigger('click');

    expect(wrapper.find('#new-subscription-form').exists()).toBe(false);
  });

  it('creates a paid subscription through the store and refreshes the loaded view', async () => {
    const store = createStore({
      isEmpty: true,
      isLoaded: true,
      status: storeStatus.EMPTY,
    });
    store.create = vi.fn(async (payload) => {
      const created = createSubscription({
        ...payload,
        id: 'sub_created',
      });

      store.activeCount = 1;
      store.hasSubscriptions = true;
      store.isEmpty = false;
      store.monthlyTotal = 29.9;
      store.status = storeStatus.LOADED;
      store.subscriptions = [created];
      store.summary = {
        items: [created],
      };
      store.yearlyProjection = 358.8;

      return created;
    });
    const wrapper = mountApp(store);

    await wrapper.get('[data-test="open-subscription-form"]').trigger('click');
    await wrapper.get('[data-test="service-name"]').setValue('Spotify Premium');
    await wrapper.get('[data-test="start-date"]').setValue('2026-08-01');
    await wrapper.get('[data-test="price"]').setValue('29,90');
    await wrapper.get('[data-test="renewal-date"]').setValue('2026-09-01');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        billingCycle: 'monthly',
        price: 29.9,
        renewalDate: '2026-09-01',
        serviceName: 'Spotify Premium',
        startDate: '2026-08-01',
        status: 'active',
        type: 'paid',
      }),
    );
    expect(wrapper.find('#new-subscription-form').exists()).toBe(false);
    expect(wrapper.get('.summary-grid').text()).toContain('29,90');
    expect(wrapper.get('[role="list"]').text()).toContain('Spotify Premium');
    expect(wrapper.get('[role="list"]').text()).toContain('29,90');
  });

  it('keeps the form open with creation errors when the store rejects', async () => {
    const store = createStore({
      isEmpty: true,
      isLoaded: true,
      status: storeStatus.EMPTY,
    });
    store.create = vi.fn(async () => {
      const cause = Object.assign(new Error('Assinatura local invalida.'), {
        details: {
          errors: [
            {
              field: 'serviceName',
              message: 'Informe o nome do servico.',
            },
          ],
        },
      });

      store.mutationError = cause;
      throw cause;
    });
    const wrapper = mountApp(store);

    await wrapper.get('[data-test="open-subscription-form"]').trigger('click');
    await wrapper.get('[data-test="service-name"]').setValue('Spotify Premium');
    await wrapper.get('[data-test="start-date"]').setValue('2026-08-01');
    await wrapper.get('[data-test="price"]').setValue('29,90');
    await wrapper.get('[data-test="renewal-date"]').setValue('2026-09-01');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(store.create).toHaveBeenCalledTimes(1);
    expect(wrapper.find('#new-subscription-form').exists()).toBe(true);
    expect(wrapper.get('#new-subscription-form').text()).toContain(
      'Assinatura local invalida.',
    );
    expect(wrapper.get('#new-subscription-form').text()).toContain(
      'Informe o nome do servico.',
    );
    expect(wrapper.find('[role="alert"]').text()).not.toContain(
      'Nao foi possivel carregar as assinaturas',
    );
  });
});

function mountApp(store) {
  useSubscriptionsStoreMock.mockReturnValue(store);

  return mount(App);
}

function createStore(overrides = {}) {
  return reactive({
    canRetry: false,
    error: null,
    activeCount: 0,
    archivedCount: 0,
    endedCount: 0,
    create: vi.fn().mockResolvedValue(null),
    hasError: false,
    hasSubscriptions: false,
    isEmpty: false,
    isLoaded: false,
    isLoading: false,
    load: vi.fn().mockResolvedValue([]),
    loadError: null,
    monthlyTotal: 0,
    mutationError: null,
    reload: vi.fn().mockResolvedValue([]),
    status: storeStatus.IDLE,
    subscriptions: [],
    summary: {
      items: [],
    },
    trialAlerts: [],
    trialCount: 0,
    yearlyProjection: 0,
    ...overrides,
  });
}

function createSubscription(overrides = {}) {
  return {
    billingCycle: 'monthly',
    brandColor: '#64748b',
    icon: null,
    id: 'sub_spotify',
    price: 19.9,
    renewalDate: '2026-09-01',
    serviceName: 'Spotify Premium',
    startDate: '2026-01-01',
    status: 'active',
    trialEndDate: null,
    type: 'paid',
    ...overrides,
  };
}
