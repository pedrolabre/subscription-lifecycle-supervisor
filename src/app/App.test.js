import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import '../features/subscription-form/NewSubscriptionForm.vue';
import '../features/backup-dialog/BackupDialog.vue';

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
    await flushPromises();
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
    await flushPromises();
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

  it('opens and closes the backup dialog from the header', async () => {
    const wrapper = mountApp(
      createStore({
        isEmpty: true,
        isLoaded: true,
        status: storeStatus.EMPTY,
      }),
    );
    await flushPromises();
    const backupButton = wrapper.get('[data-test="open-backup-dialog"]');
    expect(backupButton.text()).toBe('Backup');

    await backupButton.trigger('click');
    await flushPromises();

    expect(wrapper.find('#backup-dialog').exists()).toBe(true);

    await wrapper.get('[data-test="close-backup-dialog"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('#backup-dialog').exists()).toBe(false);
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
    await flushPromises();
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
        icon: 'https://cdn.simpleicons.org/spotify/1DB954',
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
    await flushPromises();

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
        icon: 'https://cdn.simpleicons.org/google/4285F4',
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
    await flushPromises();

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
    await wrapper.get('[data-test="submit-confirm-dialog"]').trigger('click');
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
    await wrapper.get('[data-test="submit-confirm-dialog"]').trigger('click');
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
    await wrapper.get('[data-test="submit-confirm-dialog"]').trigger('click');
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
    await flushPromises();
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

  it('allows undoing an archived subscription via the toast notification banner', async () => {
    const initial = createSubscription({
      id: 'sub_spotify',
      price: 29.9,
      serviceName: 'Spotify Premium',
      status: 'active',
    });
    const store = createStore({
      activeCount: 1,
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      subscriptions: [initial],
      summary: {
        items: [initial],
      },
    });
    store.archive = vi.fn(async () => {
      initial.status = 'archived';

      return initial;
    });
    store.update = vi.fn(async (id, changes) => {
      initial.status = changes.status;

      return initial;
    });
    const wrapper = mountApp(store);

    await wrapper.get('[data-test="archive-subscription"]').trigger('click');
    await flushPromises();
    await wrapper.get('[data-test="submit-confirm-dialog"]').trigger('click');
    await flushPromises();

    expect(store.archive).toHaveBeenCalledWith('sub_spotify');
    expect(wrapper.find('[data-test="undo-toast"]').exists()).toBe(true);

    await wrapper.get('[data-test="undo-toast-action"]').trigger('click');
    await flushPromises();

    expect(store.update).toHaveBeenCalledWith('sub_spotify', {
      status: 'active',
    });
  });

  it('renews an active subscription with one click and triggers store.renewSubscription', async () => {
    const initial = createSubscription({
      id: 'sub_netflix',
      serviceName: 'Netflix',
      renewalDate: '2026-09-01',
      status: 'active',
      type: 'paid',
    });
    const store = createStore({
      isLoaded: true,
      status: storeStatus.LOADED,
      subscriptions: [initial],
      summary: {
        items: [initial],
      },
    });
    store.renewSubscription = vi.fn().mockResolvedValue(initial);
    const wrapper = mountApp(store);

    const renewButton = wrapper.get('[data-test="renew-subscription"]');
    expect(renewButton.exists()).toBe(true);
    await renewButton.trigger('click');
    await flushPromises();

    expect(store.renewSubscription).toHaveBeenCalledWith('sub_netflix');
    expect(wrapper.find('[role="status"]').text()).toContain(
      'Ciclo de "Netflix" renovado',
    );
  });

  it('opens conversion form when clicking make paid on an expired trial assistant', async () => {
    const expiredTrial = createSubscription({
      id: 'sub_prime',
      serviceName: 'Prime Video',
      status: 'trial',
      type: 'trial',
      trialEndDate: '2026-08-01',
      renewalDate: '2026-08-01',
    });
    const store = createStore({
      isLoaded: true,
      status: storeStatus.LOADED,
      subscriptions: [expiredTrial],
      summary: {
        items: [expiredTrial],
      },
    });
    const wrapper = mountApp(store);

    const convertButton = wrapper.get(
      '[data-test="convert-trial-subscription"]',
    );
    expect(convertButton.exists()).toBe(true);
    expect(convertButton.text()).toBe('Tornar Paga');

    await convertButton.trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.get('#new-subscription-title').text()).toBe(
      'Editar assinatura',
    );
    expect(wrapper.get('[data-test="service-name"]').element.value).toBe(
      'Prime Video',
    );
  });

  it('filters dashboard cards by status tab with reactive counter updates without altering summary metrics', async () => {
    const store = createStore({
      activeCount: 1,
      archivedCount: 1,
      endedCount: 0,
      hasSubscriptions: true,
      isLoaded: true,
      monthlyTotal: 29.9,
      status: storeStatus.LOADED,
      summary: {
        items: [
          createSubscription({
            id: 'sub_1',
            price: 29.9,
            serviceName: 'Spotify',
            status: 'active',
          }),
          createSubscription({
            id: 'sub_2',
            price: 0,
            serviceName: 'Figma Pro',
            status: 'trial',
            trialEndDate: '2026-08-20',
          }),
          createSubscription({
            id: 'sub_3',
            price: 19.9,
            serviceName: 'Old Service',
            status: 'archived',
          }),
        ],
      },
      trialCount: 1,
      yearlyProjection: 358.8,
    });
    const wrapper = mountApp(store);

    expect(wrapper.get('[data-test="filter-tab-all"]').text()).toContain('3');
    expect(wrapper.get('[data-test="filter-tab-active"]').text()).toContain('1');
    expect(wrapper.get('[data-test="filter-tab-trial"]').text()).toContain('1');
    expect(wrapper.get('[data-test="filter-tab-inactive"]').text()).toContain('1');

    // Click active tab
    await wrapper.get('[data-test="filter-tab-active"]').trigger('click');
    expect(wrapper.findAll('.subscription-card')).toHaveLength(1);
    expect(wrapper.find('.subscription-card').text()).toContain('Spotify');

    // Summary metrics still show real monthly total of 29,90
    expect(wrapper.get('.summary-grid').text()).toContain('29,90');

    // Click trial tab
    await wrapper.get('[data-test="filter-tab-trial"]').trigger('click');
    expect(wrapper.findAll('.subscription-card')).toHaveLength(1);
    expect(wrapper.find('.subscription-card').text()).toContain('Figma Pro');

    // Click inactive tab
    await wrapper.get('[data-test="filter-tab-inactive"]').trigger('click');
    expect(wrapper.findAll('.subscription-card')).toHaveLength(1);
    expect(wrapper.find('.subscription-card').text()).toContain('Old Service');

    // Return to all
    await wrapper.get('[data-test="filter-tab-all"]').trigger('click');
    expect(wrapper.findAll('.subscription-card')).toHaveLength(3);
  });

  it('filters dashboard cards by search query and matches catalog aliases like gpt for ChatGPT', async () => {
    const store = createStore({
      activeCount: 2,
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      summary: {
        items: [
          createSubscription({
            id: 'sub_1',
            price: 120,
            serviceName: 'OpenAI',
            status: 'active',
          }),
          createSubscription({
            id: 'sub_2',
            price: 29.9,
            serviceName: 'Spotify',
            status: 'active',
          }),
        ],
      },
    });
    const wrapper = mountApp(store);

    const searchInput = wrapper.get('[data-test="search-input"]');
    await searchInput.setValue('gpt');

    expect(wrapper.findAll('.subscription-card')).toHaveLength(1);
    expect(wrapper.find('.subscription-card').text()).toContain('OpenAI');

    await searchInput.setValue('spot');
    expect(wrapper.findAll('.subscription-card')).toHaveLength(1);
    expect(wrapper.find('.subscription-card').text()).toContain('Spotify');
  });

  it('renders friendly empty state panel when search returns no results and clears search on button click', async () => {
    const store = createStore({
      activeCount: 1,
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      summary: {
        items: [
          createSubscription({
            id: 'sub_1',
            serviceName: 'Spotify',
            status: 'active',
          }),
        ],
      },
    });
    const wrapper = mountApp(store);

    const searchInput = wrapper.get('[data-test="search-input"]');
    await searchInput.setValue('termo_inexistente_xyz');

    expect(wrapper.findAll('.subscription-card')).toHaveLength(0);
    expect(wrapper.text()).toContain('Nenhum resultado encontrado');
    expect(wrapper.text()).toContain('Limpar filtros');

    await wrapper.get('.state-panel__action').trigger('click');

    expect(wrapper.findAll('.subscription-card')).toHaveLength(1);
    expect(wrapper.find('.subscription-card').text()).toContain('Spotify');
  });

  it('sorts dashboard cards by highest value, lowest value and name', async () => {
    const store = createStore({
      activeCount: 3,
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      summary: {
        items: [
          createSubscription({
            id: 'sub_1',
            price: 10,
            serviceName: 'Zapier',
            status: 'active',
          }),
          createSubscription({
            id: 'sub_2',
            price: 100,
            serviceName: 'Adobe',
            status: 'active',
          }),
          createSubscription({
            id: 'sub_3',
            price: 50,
            serviceName: 'Midjourney',
            status: 'active',
          }),
        ],
      },
    });
    const wrapper = mountApp(store);

    const sortSelect = wrapper.get('[data-test="sort-select"]');

    // Sort by Highest Value (PRICE_DESC)
    await sortSelect.setValue('price_desc');
    let cards = wrapper.findAll('.subscription-card');
    expect(cards[0].text()).toContain('Adobe');
    expect(cards[1].text()).toContain('Midjourney');
    expect(cards[2].text()).toContain('Zapier');

    // Sort by Lowest Value (PRICE_ASC)
    await sortSelect.setValue('price_asc');
    cards = wrapper.findAll('.subscription-card');
    expect(cards[0].text()).toContain('Zapier');
    expect(cards[1].text()).toContain('Midjourney');
    expect(cards[2].text()).toContain('Adobe');

    // Sort by Name (NAME_ASC)
    await sortSelect.setValue('name_asc');
    cards = wrapper.findAll('.subscription-card');
    expect(cards[0].text()).toContain('Adobe');
    expect(cards[1].text()).toContain('Midjourney');
    expect(cards[2].text()).toContain('Zapier');
  });

  it('filters dashboard cards by category chips', async () => {
    const store = createStore({
      activeCount: 2,
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      summary: {
        items: [
          createSubscription({
            category: 'music',
            id: 'sub_1',
            serviceName: 'Spotify',
            status: 'active',
          }),
          createSubscription({
            category: 'video',
            id: 'sub_2',
            serviceName: 'Netflix',
            status: 'active',
          }),
        ],
      },
    });
    const wrapper = mountApp(store);

    expect(wrapper.find('[data-test="category-chip-music"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="category-chip-video"]').exists()).toBe(true);

    await wrapper.get('[data-test="category-chip-music"]').trigger('click');
    expect(wrapper.findAll('.subscription-card')).toHaveLength(1);
    expect(wrapper.find('.subscription-card').text()).toContain('Spotify');

    await wrapper.get('[data-test="category-chip-all"]').trigger('click');
    expect(wrapper.findAll('.subscription-card')).toHaveLength(2);
  });

  it('renders upcoming renewals timeline and notification controls in the summary region', () => {
    const store = createStore({
      hasSubscriptions: true,
      isLoaded: true,
      status: storeStatus.LOADED,
      subscriptions: [
        createSubscription({
          id: 'sub_timeline',
          serviceName: 'Figma Pro',
          renewalDate: '2026-08-15',
          price: 45.0,
        }),
      ],
      summary: {
        items: [
          createSubscription({
            id: 'sub_timeline',
            serviceName: 'Figma Pro',
            renewalDate: '2026-08-15',
            price: 45.0,
          }),
        ],
      },
    });
    const wrapper = mountApp(store);

    expect(wrapper.find('[data-test="upcoming-timeline"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="toggle-notifications-button"]').exists()).toBe(true);
    expect(wrapper.find('.app-summary-region').text()).toContain('Proximos 30 dias');
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
    convertTrialToPaid: vi.fn().mockResolvedValue(null),
    endedCount: 0,
    end: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(null),
    getBillingHistory: vi.fn().mockResolvedValue([]),
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
    renewSubscription: vi.fn().mockResolvedValue(null),
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
