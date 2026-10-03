import { describe, expect, it, vi } from 'vitest';
import {
  NOTIFICATION_PERMISSIONS,
  NOTIFICATIONS_STORAGE_KEY,
} from '../../infrastructure/notifications/index.js';
import { useUpcomingTimeline } from './useUpcomingTimeline.js';

describe('useUpcomingTimeline', () => {
  const referenceDate = new Date('2026-08-09T12:00:00.000Z');

  const mockLocale = {
    locale: { value: 'pt-BR' },
    formatDate: (val) => val,
    t: (key, params = {}) => {
      if (key === 'card.fallbackName') return 'Assinatura';
      if (key === 'card.noCharge') return 'Sem cobrança';
      if (key === 'timeline.badgeToday') return 'Hoje';
      if (key === 'timeline.badgeTomorrow') return 'Amanhã';
      if (key === 'timeline.badgeInDays') return `em ${params.days}d`;
      if (key === 'timeline.totalUpcoming') return `Total: ${params.total}`;
      if (key === 'timeline.notificationsTitle') return 'Alertas locais';
      if (key === 'timeline.notificationsUnsupported') return 'Não suportado';
      if (key === 'timeline.notificationsDenied') return 'Bloqueado';
      if (key === 'timeline.notificationsActive') return 'Alertas ativos';
      if (key === 'timeline.notificationsEnable') return 'Ativar alertas';
      return key;
    },
    tc: (key, count) => `${count} vencimentos`,
  };

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

  it('filters, sorts and computes metrics for renewals within 30 days', () => {
    const props = {
      subscriptions: [
        {
          id: 'sub-past',
          serviceName: 'Passado',
          status: 'active',
          renewalDate: '2026-08-01',
          price: 10,
          type: 'paid',
        },
        {
          id: 'sub-far',
          serviceName: 'Longe',
          status: 'active',
          renewalDate: '2026-09-20',
          price: 20,
          type: 'paid',
        },
        {
          id: 'sub-today',
          serviceName: 'Spotify',
          status: 'active',
          renewalDate: '2026-08-09',
          price: 29.9,
          type: 'paid',
        },
        {
          id: 'sub-tomorrow',
          serviceName: 'Figma Trial',
          status: 'trial',
          trialEndDate: '2026-08-10',
          price: 0,
          type: 'free',
        },
      ],
      referenceDate,
    };

    const timeline = useUpcomingTimeline(props, mockLocale);

    expect(timeline.upcomingCount.value).toBe(2);
    expect(timeline.upcomingItems.value).toHaveLength(2);

    expect(timeline.upcomingItems.value[0].name).toBe('Spotify');
    expect(timeline.upcomingItems.value[0].badgeText).toBe('Hoje');
    expect(timeline.upcomingItems.value[0].badgeClass).toBe('timeline-badge--imminent');

    expect(timeline.upcomingItems.value[1].name).toBe('Figma Trial');
    expect(timeline.upcomingItems.value[1].badgeText).toBe('Amanhã');

    expect(timeline.totalUpcomingCents.value).toBe(2990);
    expect(timeline.upcomingCountLabel.value).toBe('2 vencimentos');
  });

  it('tracks image loading failures in failedIcons', () => {
    const props = { subscriptions: [], referenceDate };
    const timeline = useUpcomingTimeline(props, mockLocale);

    expect(timeline.failedIcons.value.has('sub-1')).toBe(false);
    timeline.handleImageError('sub-1');
    expect(timeline.failedIcons.value.has('sub-1')).toBe(true);
  });

  it('toggles notifications and persists preference', async () => {
    const storage = createMockStorage();
    const target = createMockTarget('granted');
    const props = {
      subscriptions: [],
      referenceDate,
      storage,
      target,
    };

    const timeline = useUpcomingTimeline(props, mockLocale);

    expect(timeline.isNotificationsActive.value).toBe(false);
    expect(timeline.notificationsButtonLabel.value).toBe('Ativar alertas');

    await timeline.handleToggleNotifications();
    expect(storage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe('true');
    expect(timeline.isNotificationsActive.value).toBe(true);
    expect(timeline.notificationsButtonLabel.value).toBe('Alertas ativos');

    await timeline.handleToggleNotifications();
    expect(storage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe('false');
    expect(timeline.isNotificationsActive.value).toBe(false);
  });

  it('requests permission if default and updates state', async () => {
    const storage = createMockStorage();
    const target = createMockTarget(NOTIFICATION_PERMISSIONS.DEFAULT, NOTIFICATION_PERMISSIONS.GRANTED);
    const props = {
      subscriptions: [],
      referenceDate,
      storage,
      target,
    };

    const timeline = useUpcomingTimeline(props, mockLocale);

    await timeline.handleToggleNotifications();
    expect(target.Notification.requestPermission).toHaveBeenCalled();
    expect(storage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe('true');
    expect(timeline.isNotificationsActive.value).toBe(true);
  });

  it('handles blocked and unsupported notification permissions', () => {
    const targetBlocked = createMockTarget(NOTIFICATION_PERMISSIONS.DENIED);
    const timelineBlocked = useUpcomingTimeline(
      { subscriptions: [], referenceDate, target: targetBlocked },
      mockLocale,
    );

    expect(timelineBlocked.isNotificationsBlocked.value).toBe(true);
    expect(timelineBlocked.isNotificationsButtonDisabled.value).toBe(true);
    expect(timelineBlocked.notificationsButtonLabel.value).toBe('Bloqueado');

    const timelineUnsupported = useUpcomingTimeline(
      { subscriptions: [], referenceDate, target: {} },
      mockLocale,
    );

    expect(timelineUnsupported.isNotificationsUnsupported.value).toBe(true);
    expect(timelineUnsupported.isNotificationsButtonDisabled.value).toBe(true);
    expect(timelineUnsupported.notificationsButtonLabel.value).toBe('Não suportado');
  });
});
