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
    window.localStorage.clear();
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
    document.documentElement.lang = '';
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
    expect(wrapper.get('[data-test="open-subscription-form"]').text()).toBe(
      'Nova assinatura',
    );
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Carregando assinaturas locais',
    );
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe(
      'Carregando assinaturas locais',
    );
    expect(wrapper.text()).toContain('Preparando leitura local');
    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it('defaults to dark mode and persists light mode without clearing the open form', async () => {
    const wrapper = mountApp(
      createStore({
        isEmpty: true,
        isLoaded: true,
        status: storeStatus.EMPTY,
      }),
    );

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(wrapper.get('[data-test="theme-toggle"]').attributes('aria-label')).toBe(
      'Alternar para modo claro',
    );

    await wrapper.get('[data-test="open-subscription-form"]').trigger('click');
    await wrapper.get('[data-test="service-name"]').setValue('Netflix');
    await wrapper.get('[data-test="theme-toggle"]').trigger('click');

    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(window.localStorage.getItem('subscription-lifecycle-supervisor:theme')).toBe(
      'light',
    );
    expect(wrapper.get('[data-test="service-name"]').element.value).toBe(
      'Netflix',
    );
  });

  it('switches to English, persists the preference and keeps form state intact', async () => {
    const wrapper = mountApp(
      createStore({
        isEmpty: true,
        isLoaded: true,
        status: storeStatus.EMPTY,
      }),
    );

    expect(wrapper.get('[data-test="locale-toggle"]').text()).toBe('EN');
    expect(wrapper.get('[data-test="locale-toggle"]').attributes('aria-label')).toBe(
      'Alternar idioma para ingles',
    );

    await wrapper.get('[data-test="open-subscription-form"]').trigger('click');
    await wrapper.get('[data-test="service-name"]').setValue('Figma Trial');
    await wrapper.get('[data-test="locale-toggle"]').trigger('click');

    expect(document.documentElement.lang).toBe('en-US');
    expect(window.localStorage.getItem('subscription-lifecycle-supervisor:locale')).toBe(
      'en-US',
    );
    expect(wrapper.get('[data-test="locale-toggle"]').text()).toBe('PT');
    expect(wrapper.get('[data-test="open-subscription-form"]').text()).toBe(
      'New subscription',
    );
    expect(wrapper.get('#new-subscription-title').text()).toBe(
      'New subscription',
    );
    expect(wrapper.get('[data-test="service-name"]').element.value).toBe(
      'Figma Trial',
    );
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
    expect(wrapper.get('[role="list"]').attributes('aria-label')).toBe(
      '1 assinatura carregada',
    );
    expect(wrapper.get('[role="list"]').text()).toContain('Spotify Premium');
    expect(wrapper.get('[role="list"]').text()).toContain('29,90');
    expect(wrapper.get('[role="list"]').text()).toContain('/ mes');
    expect(wrapper.get('[role="list"]').text()).toContain('Renovacao');
    expect(wrapper.get('[role="list"]').text()).toContain('01/09/2026');
    expect(wrapper.get('[role="list"]').text()).toContain('Ativa');
    expect(wrapper.find('.subscription-card').exists()).toBe(true);
  });

  it('opens and cancels the new subscription form in an accessible modal', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const wrapper = mountApp(
      createStore({
        isEmpty: true,
        isLoaded: true,
        status: storeStatus.EMPTY,
      }),
      { attachTo: host },
    );

    expect(wrapper.find('#new-subscription-form').exists()).toBe(false);

    const openButton = wrapper.get('[data-test="open-subscription-form"]');

    openButton.element.focus();
    await openButton.trigger('click');
    await flushPromises();

    expect(wrapper.get('#new-subscription-title').text()).toBe(
      'Nova assinatura',
    );
    expect(wrapper.find('#new-subscription-form').exists()).toBe(true);
    expect(wrapper.get('[role="dialog"]').attributes()).toEqual(
      expect.objectContaining({
        'aria-labelledby': 'new-subscription-title',
        'aria-modal': 'true',
      }),
    );
    expect(document.activeElement).toBe(
      wrapper.get('[data-test="service-name"]').element,
    );

    await wrapper.get('[data-test="cancel-subscription-form"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('#new-subscription-form').exists()).toBe(false);
    expect(document.activeElement).toBe(openButton.element);

    wrapper.unmount();
    host.remove();
  });

  it('closes the subscription modal by close button, escape and backdrop', async () => {
    const wrapper = mountApp(
      createStore({
        isEmpty: true,
        isLoaded: true,
        status: storeStatus.EMPTY,
      }),
    );
    const openButton = wrapper.get('[data-test="open-subscription-form"]');

    await openButton.trigger('click');
    await flushPromises();
    await wrapper
      .get('[data-test="close-subscription-form-dialog"]')
      .trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await openButton.trigger('click');
    await flushPromises();
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        key: 'Escape',
      }),
    );
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await openButton.trigger('click');
    await flushPromises();
    await wrapper.get('[data-test="subscription-form-backdrop"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
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
    await wrapper.get('[data-test="service-catalog-select"]').setValue('spotify');
    await wrapper.get('[data-test="start-date"]').setValue('2026-08-01');
    await wrapper.get('[data-test="price"]').setValue('29,90');
    await wrapper.get('[data-test="renewal-date"]').setValue('2026-09-01');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        billingCycle: 'monthly',
        brandColor: '#1db954',
        category: 'music',
        icon: '/assets/logos/spotify.svg',
        price: 29.9,
        renewalDate: '2026-09-01',
        serviceId: 'spotify',
        serviceName: 'Spotify',
        startDate: '2026-08-01',
        status: 'active',
        type: 'paid',
      }),
    );
    expect(wrapper.find('#new-subscription-form').exists()).toBe(false);
    expect(wrapper.get('.summary-grid').text()).toContain('29,90');
    expect(wrapper.get('[role="list"]').text()).toContain('Spotify');
    expect(wrapper.get('[role="list"]').text()).toContain('29,90');
  });

  it('edits a persisted subscription through the store', async () => {
    const initial = createSubscription({
      id: 'sub_spotify',
      price: 29.9,
      serviceName: 'Spotify Premium',
    });
    const store = createStore({
      activeCount: 1,
      hasSubscriptions: true,
      isLoaded: true,
      monthlyTotal: 29.9,
      status: storeStatus.LOADED,
      subscriptions: [initial],
      summary: {
        items: [initial],
      },
      yearlyProjection: 358.8,
    });
    store.update = vi.fn(async (id, payload) => {
      const updated = createSubscription({
        ...payload,
        id,
      });

      store.monthlyTotal = 35.5;
      store.subscriptions = [updated];
      store.summary = {
        items: [updated],
      };
      store.yearlyProjection = 426;

      return updated;
    });
    const wrapper = mountApp(store);

    await wrapper.get('[data-test="edit-subscription"]').trigger('click');

    expect(wrapper.get('#new-subscription-title').text()).toBe(
      'Editar assinatura',
    );

    await wrapper
      .get('[data-test="service-catalog-select"]')
      .setValue('google-one');
    await wrapper.get('[data-test="price"]').setValue('35,50');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(store.update).toHaveBeenCalledWith(
      'sub_spotify',
      expect.objectContaining({
        billingCycle: 'monthly',
        brandColor: '#4285f4',
        category: 'cloud',
        icon: '/assets/logos/google-one.svg',
        price: 35.5,
        renewalDate: '2026-09-01',
        serviceId: 'google-one',
        serviceName: 'Google One',
        status: 'active',
        type: 'paid',
      }),
    );
    expect(wrapper.find('#new-subscription-form').exists()).toBe(false);
    expect(wrapper.get('.summary-grid').text()).toContain('35,50');
    expect(wrapper.get('[role="list"]').text()).toContain('Google One');
  });

  it('edits the persisted store record instead of summary-only catalog metadata', async () => {
    const persistedFreeform = createSubscription({
      brandColor: null,
      category: null,
      icon: null,
      id: 'sub_spotify_freeform',
      serviceId: null,
      serviceName: 'Spotify Premium',
    });
    const enrichedSummaryItem = createSubscription({
      ...persistedFreeform,
      brandColor: '#1db954',
      category: 'music',
      icon: '/assets/logos/spotify.svg',
      serviceId: 'spotify',
    });
    const store = createStore({
      activeCount: 1,
      hasSubscriptions: true,
      isLoaded: true,
      monthlyTotal: 29.9,
      status: storeStatus.LOADED,
      subscriptions: [persistedFreeform],
      summary: {
        items: [enrichedSummaryItem],
      },
      yearlyProjection: 358.8,
    });
    store.update = vi.fn(async (id, payload) => {
      const updated = createSubscription({
        ...payload,
        id,
      });

      store.subscriptions = [updated];
      store.summary = {
        items: [updated],
      };

      return updated;
    });
    const wrapper = mountApp(store);

    expect(wrapper.get('[role="list"]').text()).toContain('Spotify Premium');

    await wrapper.get('[data-test="edit-subscription"]').trigger('click');

    expect(wrapper.get('[data-test="service-catalog-select"]').element.value).toBe(
      '',
    );

    await wrapper.get('[data-test="price"]').setValue('35,50');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(store.update).toHaveBeenCalledWith(
      'sub_spotify_freeform',
      expect.objectContaining({
        brandColor: '#64748b',
        category: 'other',
        icon: '/assets/logos/service-fallback.svg',
        price: 35.5,
        serviceId: null,
        serviceName: 'Spotify Premium',
      }),
    );
  });

  it('archives a persisted subscription and refreshes totals from the store', async () => {
    const initial = createSubscription({
      id: 'sub_spotify',
      price: 29.9,
      serviceName: 'Spotify Premium',
    });
    const archived = createSubscription({
      ...initial,
      status: 'archived',
    });
    const store = createStore({
      activeCount: 1,
      hasSubscriptions: true,
      isLoaded: true,
      monthlyTotal: 29.9,
      status: storeStatus.LOADED,
      subscriptions: [initial],
      summary: {
        items: [initial],
      },
      yearlyProjection: 358.8,
    });
    store.archive = vi.fn(async () => {
      store.activeCount = 0;
      store.archivedCount = 1;
      store.monthlyTotal = 0;
      store.subscriptions = [archived];
      store.summary = {
        items: [archived],
      };
      store.yearlyProjection = 0;

      return archived;
    });
    const wrapper = mountApp(store);

    await wrapper.get('[data-test="archive-subscription"]').trigger('click');
    await flushPromises();

    expect(store.archive).toHaveBeenCalledWith('sub_spotify');
    expect(wrapper.get('.summary-grid').text()).toContain('0,00');
    expect(wrapper.get('.summary-grid').text()).toContain('1 arquivada');
    expect(wrapper.get('[role="list"]').text()).toContain('Arquivada');
  });

  it('ends a persisted subscription and keeps the loaded list visible', async () => {
    const initial = createSubscription({
      id: 'sub_figma',
      price: 0,
      renewalDate: null,
      serviceName: 'Figma Trial',
      status: 'trial',
      trialEndDate: '2026-08-07',
      type: 'free',
    });
    const ended = createSubscription({
      ...initial,
      status: 'ended',
    });
    const store = createStore({
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      subscriptions: [initial],
      summary: {
        items: [initial],
      },
      trialCount: 1,
    });
    store.end = vi.fn(async () => {
      store.endedCount = 1;
      store.subscriptions = [ended];
      store.summary = {
        items: [ended],
      };
      store.trialCount = 0;

      return ended;
    });
    const wrapper = mountApp(store);

    await wrapper.get('[data-test="end-subscription"]').trigger('click');
    await flushPromises();

    expect(store.end).toHaveBeenCalledWith('sub_figma');
    expect(wrapper.get('.summary-grid').text()).toContain('Encerradas');
    expect(wrapper.get('.summary-grid').text()).toContain('1');
    expect(wrapper.get('[role="list"]').text()).toContain('Encerrada');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('shows lifecycle mutation errors without replacing the loaded state', async () => {
    const initial = createSubscription({
      id: 'sub_spotify',
      serviceName: 'Spotify Premium',
    });
    const store = createStore({
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      subscriptions: [initial],
      summary: {
        items: [initial],
      },
    });
    store.archive = vi.fn(async () => {
      const cause = Object.assign(new Error('Falha local ao arquivar.'), {
        details: {},
      });

      store.mutationError = cause;
      throw cause;
    });
    const wrapper = mountApp(store);

    await wrapper.get('[data-test="archive-subscription"]').trigger('click');
    await flushPromises();

    expect(store.archive).toHaveBeenCalledWith('sub_spotify');
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Falha local ao arquivar.',
    );
    expect(wrapper.get('[role="list"]').text()).toContain('Spotify Premium');
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

function mountApp(store, options = {}) {
  useSubscriptionsStoreMock.mockReturnValue(store);

  return mount(App, options);
}

function createStore(overrides = {}) {
  return reactive({
    canRetry: false,
    error: null,
    activeCount: 0,
    archivedCount: 0,
    archive: vi.fn().mockResolvedValue(null),
    endedCount: 0,
    end: vi.fn().mockResolvedValue(null),
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
    update: vi.fn().mockResolvedValue(null),
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
