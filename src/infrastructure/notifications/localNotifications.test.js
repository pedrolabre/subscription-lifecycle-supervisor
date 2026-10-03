import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNotificationPermission,
  getNotificationPreference,
  isNotificationPermissionGranted,
  isNotificationSupported,
  NOTIFICATION_PERMISSIONS,
  NOTIFICATIONS_STORAGE_KEY,
  requestNotificationPermission,
  resetDispatchedNotificationTags,
  scheduleLocalSubscriptionAlerts,
  sendLocalNotification,
  setNotificationPreference,
} from './localNotifications.js';

describe('localNotifications', () => {
  beforeEach(() => {
    resetDispatchedNotificationTags();
  });

  describe('support and permission checks', () => {
    it('returns false for isNotificationSupported when target has no Notification', () => {
      expect(isNotificationSupported({})).toBe(false);
      expect(isNotificationSupported(null)).toBe(false);
    });

    it('returns true for isNotificationSupported when target has Notification', () => {
      const mockTarget = { Notification: class MockNotification {} };
      expect(isNotificationSupported(mockTarget)).toBe(true);
    });

    it('returns UNSUPPORTED when Notification is absent in getNotificationPermission', () => {
      expect(getNotificationPermission({})).toBe(NOTIFICATION_PERMISSIONS.UNSUPPORTED);
    });

    it('returns current permission value when Notification exists', () => {
      const mockTarget = {
        Notification: class MockNotification {
          static permission = 'granted';
        },
      };
      expect(getNotificationPermission(mockTarget)).toBe('granted');
      expect(isNotificationPermissionGranted(mockTarget)).toBe(true);
    });

    it('requests permission and returns result', async () => {
      const requestPermission = vi.fn().mockResolvedValue('granted');
      const mockTarget = {
        Notification: class MockNotification {
          static requestPermission = requestPermission;
        },
      };

      const result = await requestNotificationPermission(mockTarget);
      expect(result).toBe('granted');
      expect(requestPermission).toHaveBeenCalled();
    });

    it('returns denied if requestPermission throws', async () => {
      const mockTarget = {
        Notification: {
          requestPermission: vi.fn().mockRejectedValue(new Error('Permission denied')),
        },
      };

      const result = await requestNotificationPermission(mockTarget);
      expect(result).toBe(NOTIFICATION_PERMISSIONS.DENIED);
    });
  });

  describe('preference persistence in storage', () => {
    it('handles null storage gracefully', () => {
      expect(getNotificationPreference(null)).toBe(false);
      expect(setNotificationPreference(true, null)).toBe(false);
    });

    it('reads and writes notification preference', () => {
      const store = {};
      const mockStorage = {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => {
          store[k] = String(v);
        },
      };

      expect(getNotificationPreference(mockStorage)).toBe(false);
      setNotificationPreference(true, mockStorage);
      expect(getNotificationPreference(mockStorage)).toBe(true);
      expect(store[NOTIFICATIONS_STORAGE_KEY]).toBe('true');

      setNotificationPreference(false, mockStorage);
      expect(getNotificationPreference(mockStorage)).toBe(false);
      expect(store[NOTIFICATIONS_STORAGE_KEY]).toBe('false');
    });
  });

  describe('sendLocalNotification', () => {
    it('returns null if permission is not granted', () => {
      const mockTarget = {
        Notification: class MockNotification {
          static permission = 'denied';
        },
      };

      const result = sendLocalNotification('Test', {}, mockTarget);
      expect(result).toBeNull();
    });

    it('creates and returns notification instance when granted', () => {
      class MockNotification {
        static permission = 'granted';
        constructor(title, options) {
          this.title = title;
          this.options = options;
        }
      }

      const mockTarget = { Notification: MockNotification };
      const notification = sendLocalNotification('Aviso', { body: 'Mensagem' }, mockTarget);

      expect(notification).toBeInstanceOf(MockNotification);
      expect(notification.title).toBe('Aviso');
      expect(notification.options.body).toBe('Mensagem');
    });
  });

  describe('scheduleLocalSubscriptionAlerts', () => {
    const referenceDate = new Date('2026-08-09T12:00:00.000Z');

    function createMockTarget() {
      class MockNotification {
        static permission = 'granted';
        constructor(title, options) {
          this.title = title;
          this.options = options;
        }
      }
      return { Notification: MockNotification };
    }

    it('does not dispatch if enabled is false', () => {
      const mockTarget = createMockTarget();
      const subscriptions = [
        {
          id: 'sub-1',
          serviceName: 'Figma',
          status: 'trial',
          trialEndDate: '2026-08-10',
        },
      ];

      const dispatched = scheduleLocalSubscriptionAlerts(subscriptions, {
        enabled: false,
        referenceDate,
        target: mockTarget,
      });

      expect(dispatched).toEqual([]);
    });

    it('dispatches alert for trial ending within 3 days', () => {
      const mockTarget = createMockTarget();
      const onNotify = vi.fn();
      const subscriptions = [
        {
          id: 'sub-trial-1',
          serviceName: 'Notion Plus',
          status: 'trial',
          trialEndDate: '2026-08-11', // 2 dias restantes
        },
      ];

      const dispatched = scheduleLocalSubscriptionAlerts(subscriptions, {
        enabled: true,
        referenceDate,
        target: mockTarget,
        onNotify,
      });

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0].type).toBe('trial');
      expect(dispatched[0].title).toBe('Aviso de Trial - Notion Plus');
      expect(dispatched[0].body).toContain('em 2 dias');
      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it('dispatches alert for renewal due today or tomorrow', () => {
      const mockTarget = createMockTarget();
      const subscriptions = [
        {
          id: 'sub-renew-today',
          serviceName: 'Spotify',
          status: 'active',
          renewalDate: '2026-08-09', // hoje
          price: 29.9,
        },
        {
          id: 'sub-renew-tomorrow',
          serviceName: 'Netflix',
          status: 'active',
          renewalDate: '2026-08-10', // amanhã
          price: 55.9,
        },
        {
          id: 'sub-renew-far',
          serviceName: 'GitHub',
          status: 'active',
          renewalDate: '2026-08-25', // longe
          price: 20,
        },
      ];

      const dispatched = scheduleLocalSubscriptionAlerts(subscriptions, {
        enabled: true,
        referenceDate,
        target: mockTarget,
      });

      expect(dispatched).toHaveLength(2);
      expect(dispatched[0].title).toBe('Renovação Iminente - Spotify');
      expect(dispatched[0].body).toContain('hoje');
      expect(dispatched[0].body).toContain('R$ 29,90');
      expect(dispatched[1].title).toBe('Renovação Iminente - Netflix');
      expect(dispatched[1].body).toContain('amanhã');
    });

    it('deduplicates alerts and avoids sending identical tags twice in the same session', () => {
      const mockTarget = createMockTarget();
      const subscriptions = [
        {
          id: 'sub-1',
          serviceName: 'Figma',
          status: 'trial',
          trialEndDate: '2026-08-10',
        },
      ];

      const first = scheduleLocalSubscriptionAlerts(subscriptions, {
        enabled: true,
        referenceDate,
        target: mockTarget,
      });
      expect(first).toHaveLength(1);

      const second = scheduleLocalSubscriptionAlerts(subscriptions, {
        enabled: true,
        referenceDate,
        target: mockTarget,
      });
      expect(second).toHaveLength(0);
    });
  });
});
