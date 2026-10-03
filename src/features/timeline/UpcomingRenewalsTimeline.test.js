import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOTIFICATIONS_STORAGE_KEY,
  resetDispatchedNotificationTags,
} from '../../infrastructure/notifications/index.js';
import UpcomingRenewalsTimeline from './UpcomingRenewalsTimeline.vue';

describe('UpcomingRenewalsTimeline', () => {
  const referenceDate = new Date('2026-08-09T12:00:00.000Z');

  beforeEach(() => {
    resetDispatchedNotificationTags();
  });

  function createMockStorage(initial = {}) {
    const store = { ...initial };
    return {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => {
        store[k] = String(v);
      },
    };
  }

  function createMockTarget(permission = 'granted', requestResult = 'granted') {
    class MockNotification {
      static permission = permission;
      static requestPermission = vi.fn().mockResolvedValue(requestResult);
      constructor(title, options) {
        this.title = title;
        this.options = options;
      }
    }
    return { Notification: MockNotification };
  }

  it('renders empty message when no renewals are due in the next 30 days', () => {
    const wrapper = mount(UpcomingRenewalsTimeline, {
      props: {
        subscriptions: [],
        referenceDate,
      },
    });

    expect(wrapper.find('[data-test="upcoming-timeline"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="timeline-empty"]').text()).toContain(
      'Nenhum vencimento nos proximos 30 dias',
    );
    expect(wrapper.find('[data-test="timeline-list"]').exists()).toBe(false);
  });

  it('filters out past subscriptions and subscriptions beyond 30 days', () => {
    const subscriptions = [
      {
        id: 'sub-past',
        serviceName: 'Past Sub',
        status: 'active',
        renewalDate: '2026-08-01', // passado (-8 dias)
        price: 20,
        type: 'paid',
      },
      {
        id: 'sub-far',
        serviceName: 'Far Future',
        status: 'active',
        renewalDate: '2026-09-15', // 37 dias
        price: 50,
        type: 'paid',
      },
      {
        id: 'sub-valid',
        serviceName: 'Spotify',
        status: 'active',
        renewalDate: '2026-08-19', // 10 dias
        price: 29.9,
        type: 'paid',
      },
    ];

    const wrapper = mount(UpcomingRenewalsTimeline, {
      props: {
        subscriptions,
        referenceDate,
      },
    });

    const items = wrapper.findAll('[data-test="timeline-item"]');
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain('Spotify');
    expect(items[0].text()).toContain('em 10d');
  });

  it('sorts renewals chronologically and displays appropriate badges and totals', () => {
    const subscriptions = [
      {
        id: 'sub-15d',
        serviceName: 'GitHub Copilot',
        status: 'active',
        renewalDate: '2026-08-24', // 15 dias
        price: 50,
        type: 'paid',
      },
      {
        id: 'sub-today',
        serviceName: 'Google One',
        status: 'active',
        renewalDate: '2026-08-09', // Hoje
        price: 35.5,
        type: 'paid',
      },
      {
        id: 'sub-tomorrow',
        serviceName: 'Figma Trial',
        status: 'trial',
        trialEndDate: '2026-08-10', // Amanhã
        price: 0,
        type: 'free',
      },
    ];

    const wrapper = mount(UpcomingRenewalsTimeline, {
      props: {
        subscriptions,
        referenceDate,
      },
    });

    const items = wrapper.findAll('[data-test="timeline-item"]');
    expect(items).toHaveLength(3);

    // 1o item: Hoje (Google One)
    expect(items[0].text()).toContain('Google One');
    expect(items[0].text()).toContain('Hoje');
    expect(items[0].text()).toContain('35,50');

    // 2o item: Amanhã (Figma Trial)
    expect(items[1].text()).toContain('Figma Trial');
    expect(items[1].text()).toContain('Amanha');
    expect(items[1].text()).toContain('Sem cobranca');

    // 3o item: em 15d (GitHub Copilot)
    expect(items[2].text()).toContain('GitHub Copilot');
    expect(items[2].text()).toContain('em 15d');
    expect(items[2].text()).toContain('50,00');

    // Metadados do topo
    expect(wrapper.find('[data-test="timeline-count"]').text()).toContain('3 vencimentos');
    // Total a vencer soma pagos: 35.50 + 50.00 = 85.50
    expect(wrapper.find('[data-test="timeline-total"]').text()).toContain('85,50');
  });

  it('handles notification toggle button activation and deactivation', async () => {
    const mockStorage = createMockStorage();
    const mockTarget = createMockTarget('granted');

    const wrapper = mount(UpcomingRenewalsTimeline, {
      props: {
        subscriptions: [
          {
            id: 'sub-1',
            serviceName: 'Spotify',
            status: 'active',
            renewalDate: '2026-08-10',
            price: 29.9,
            type: 'paid',
          },
        ],
        referenceDate,
        storage: mockStorage,
        target: mockTarget,
      },
    });

    const toggleButton = wrapper.find('[data-test="toggle-notifications-button"]');
    expect(toggleButton.exists()).toBe(true);
    expect(toggleButton.text()).toContain('Ativar alertas');

    // Clica para ativar
    await toggleButton.trigger('click');
    expect(mockStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe('true');
    expect(toggleButton.text()).toContain('Alertas ativos');
    expect(toggleButton.classes()).toContain('notifications-toggle-btn--active');

    // Clica para desativar
    await toggleButton.trigger('click');
    expect(mockStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe('false');
    expect(toggleButton.text()).toContain('Ativar alertas');
    expect(toggleButton.classes()).not.toContain('notifications-toggle-btn--active');
  });

  it('requests permission if default when toggle is clicked', async () => {
    const mockStorage = createMockStorage();
    const mockTarget = createMockTarget('default', 'granted');

    const wrapper = mount(UpcomingRenewalsTimeline, {
      props: {
        subscriptions: [],
        referenceDate,
        storage: mockStorage,
        target: mockTarget,
      },
    });

    const toggleButton = wrapper.find('[data-test="toggle-notifications-button"]');
    await toggleButton.trigger('click');

    expect(mockTarget.Notification.requestPermission).toHaveBeenCalled();
    expect(mockStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe('true');
    expect(toggleButton.text()).toContain('Alertas ativos');
  });

  it('disables button when notifications are blocked or unsupported', () => {
    const mockTargetBlocked = createMockTarget('denied');

    const wrapperBlocked = mount(UpcomingRenewalsTimeline, {
      props: {
        subscriptions: [],
        referenceDate,
        target: mockTargetBlocked,
      },
    });

    const buttonBlocked = wrapperBlocked.find('[data-test="toggle-notifications-button"]');
    expect(buttonBlocked.attributes('disabled')).toBeDefined();
    expect(buttonBlocked.text()).toContain('Bloqueado');

    const wrapperUnsupported = mount(UpcomingRenewalsTimeline, {
      props: {
        subscriptions: [],
        referenceDate,
        target: {},
      },
    });

    const buttonUnsupported = wrapperUnsupported.find('[data-test="toggle-notifications-button"]');
    expect(buttonUnsupported.attributes('disabled')).toBeDefined();
    expect(buttonUnsupported.text()).toContain('Nao suportado');
  });
});
