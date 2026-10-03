import {
  calculateDaysRemaining,
} from '../../core/dates/index.js';
import { SUBSCRIPTION_STATUS } from '../../domain/subscriptions/constants.js';

export const NOTIFICATION_PERMISSIONS = Object.freeze({
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default',
  UNSUPPORTED: 'unsupported',
});

export const NOTIFICATIONS_STORAGE_KEY =
  'subscription-lifecycle-supervisor:notifications-enabled';

const inMemoryDispatchedTags = new Set();

export function resolveGlobalTarget(target) {
  if (target !== undefined) {
    return target;
  }

  if (typeof window !== 'undefined') {
    return window;
  }

  return null;
}

export function resolveStorage(storage) {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

export function isNotificationSupported(target) {
  const globalTarget = resolveGlobalTarget(target);

  return Boolean(globalTarget && 'Notification' in globalTarget);
}

export function getNotificationPermission(target) {
  const globalTarget = resolveGlobalTarget(target);

  if (!isNotificationSupported(globalTarget)) {
    return NOTIFICATION_PERMISSIONS.UNSUPPORTED;
  }

  return globalTarget.Notification.permission ?? NOTIFICATION_PERMISSIONS.DEFAULT;
}

export async function requestNotificationPermission(target) {
  const globalTarget = resolveGlobalTarget(target);

  if (!isNotificationSupported(globalTarget)) {
    return NOTIFICATION_PERMISSIONS.UNSUPPORTED;
  }

  try {
    const result = await globalTarget.Notification.requestPermission();

    return result ?? NOTIFICATION_PERMISSIONS.DEFAULT;
  } catch {
    return NOTIFICATION_PERMISSIONS.DENIED;
  }
}

export function isNotificationPermissionGranted(target) {
  return getNotificationPermission(target) === NOTIFICATION_PERMISSIONS.GRANTED;
}

export function getNotificationPreference(storage) {
  const resolved = resolveStorage(storage);

  if (!resolved) {
    return false;
  }

  try {
    return resolved.getItem(NOTIFICATIONS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setNotificationPreference(enabled, storage) {
  const resolved = resolveStorage(storage);

  if (!resolved) {
    return false;
  }

  try {
    resolved.setItem(NOTIFICATIONS_STORAGE_KEY, enabled ? 'true' : 'false');
    return true;
  } catch {
    return false;
  }
}

export function sendLocalNotification(title, options = {}, target) {
  const globalTarget = resolveGlobalTarget(target);

  if (!isNotificationSupported(globalTarget)) {
    return null;
  }

  if (getNotificationPermission(globalTarget) !== NOTIFICATION_PERMISSIONS.GRANTED) {
    return null;
  }

  try {
    const NotificationConstructor = globalTarget.Notification;
    return new NotificationConstructor(title, options);
  } catch {
    return null;
  }
}

export function resetDispatchedNotificationTags() {
  inMemoryDispatchedTags.clear();
}

export function scheduleLocalSubscriptionAlerts(subscriptions = [], options = {}) {
  const globalTarget = resolveGlobalTarget(options.target);
  const resolvedStorage = resolveStorage(options.storage);
  const isEnabled =
    typeof options.enabled === 'boolean'
      ? options.enabled
      : getNotificationPreference(resolvedStorage);

  if (!isEnabled) {
    return [];
  }

  if (getNotificationPermission(globalTarget) !== NOTIFICATION_PERMISSIONS.GRANTED) {
    return [];
  }

  const referenceDate = options.referenceDate ?? new Date();
  const dispatchedTags = options.dispatchedTags ?? inMemoryDispatchedTags;
  const dispatched = [];

  const list = Array.isArray(subscriptions) ? subscriptions : [];

  for (const subscription of list) {
    if (!subscription || typeof subscription !== 'object') {
      continue;
    }

    const { id, serviceName, status, trialEndDate, renewalDate, price } = subscription;
    const name = serviceName || 'Assinatura';

    // 1. Alerta de Trial expirando em ate 3 dias
    if (status === SUBSCRIPTION_STATUS.TRIAL && trialEndDate) {
      const daysRemaining = calculateDaysRemaining(trialEndDate, referenceDate);

      if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3) {
        const tag = `trial-${id || name}-${trialEndDate}`;

        if (!dispatchedTags.has(tag)) {
          dispatchedTags.add(tag);

          const timeText =
            daysRemaining === 0
              ? 'hoje'
              : daysRemaining === 1
                ? 'amanhã'
                : `em ${daysRemaining} dias`;

          const title = `Aviso de Trial - ${name}`;
          const body = `O período de testes de ${name} expira ${timeText}. Revise para evitar cobranças indesejadas.`;

          const notification = sendLocalNotification(
            title,
            {
              body,
              tag,
              icon: subscription.icon || '/assets/logos/logo.svg',
            },
            globalTarget,
          );

          dispatched.push({
            subscriptionId: id,
            type: 'trial',
            tag,
            title,
            body,
            notification,
          });

          if (typeof options.onNotify === 'function') {
            options.onNotify({ subscription, type: 'trial', title, body });
          }
        }
      }
    }

    // 2. Alerta de Renovacao iminente (hoje ou amanha)
    if (status === SUBSCRIPTION_STATUS.ACTIVE && renewalDate) {
      const daysRemaining = calculateDaysRemaining(renewalDate, referenceDate);

      if (daysRemaining !== null && (daysRemaining === 0 || daysRemaining === 1)) {
        const tag = `renewal-${id || name}-${renewalDate}`;

        if (!dispatchedTags.has(tag)) {
          dispatchedTags.add(tag);

          const timeText = daysRemaining === 0 ? 'hoje' : 'amanhã';
          const priceText =
            typeof price === 'number' && price > 0
              ? ` no valor de R$ ${price.toFixed(2).replace('.', ',')}`
              : '';

          const title = `Renovação Iminente - ${name}`;
          const body = `A assinatura de ${name} renova ${timeText}${priceText}.`;

          const notification = sendLocalNotification(
            title,
            {
              body,
              tag,
              icon: subscription.icon || '/assets/logos/logo.svg',
            },
            globalTarget,
          );

          dispatched.push({
            subscriptionId: id,
            type: 'renewal',
            tag,
            title,
            body,
            notification,
          });

          if (typeof options.onNotify === 'function') {
            options.onNotify({ subscription, type: 'renewal', title, body });
          }
        }
      }
    }
  }

  return dispatched;
}
