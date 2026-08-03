import { mount } from '@vue/test-utils';
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

  it('renders loaded local data without final subscription cards', () => {
    const wrapper = mountApp(
      createStore({
        hasSubscriptions: true,
        isLoaded: true,
        status: storeStatus.LOADED,
        subscriptions: [
          {
            id: 'sub_spotify',
            renewalDate: '2026-09-01',
            serviceName: 'Spotify Premium',
            status: 'active',
            trialEndDate: null,
          },
        ],
      }),
    );

    expect(wrapper.text()).toContain('Dados carregados');
    expect(wrapper.get('[role="list"]').text()).toContain('Spotify Premium');
    expect(wrapper.get('[role="list"]').text()).toContain(
      'Renova em 01/09/2026',
    );
    expect(wrapper.get('[role="list"]').text()).toContain('Ativa');
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
    hasError: false,
    hasSubscriptions: false,
    isEmpty: false,
    isLoaded: false,
    isLoading: false,
    load: vi.fn().mockResolvedValue([]),
    loadError: null,
    reload: vi.fn().mockResolvedValue([]),
    status: storeStatus.IDLE,
    subscriptions: [],
    ...overrides,
  });
}
