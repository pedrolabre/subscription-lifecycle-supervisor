import { computed, ref, watch } from 'vue';
import { calculateDaysRemaining } from '../../core/dates/index.js';
import { formatCurrency, toCents, centsToAmount } from '../../core/money/index.js';
import { SUBSCRIPTION_STATUS } from '../../domain/subscriptions/constants.js';
import {
  getNotificationPermission,
  getNotificationPreference,
  NOTIFICATION_PERMISSIONS,
  requestNotificationPermission,
  scheduleLocalSubscriptionAlerts,
  setNotificationPreference,
} from '../../infrastructure/notifications/index.js';

export function useUpcomingTimeline(props, { formatDate, locale, t, tc }) {
  const failedIcons = ref(new Set());
  const permission = ref(getNotificationPermission(props.target));
  const isEnabled = ref(getNotificationPreference(props.storage));

  watch(
    () => props.target,
    () => {
      permission.value = getNotificationPermission(props.target);
    },
  );

  watch(
    () => props.storage,
    () => {
      isEnabled.value = getNotificationPreference(props.storage);
    },
  );

  function handleImageError(id) {
    if (id) {
      failedIcons.value.add(id);
    }
  }

  const upcomingItems = computed(() => {
    const list = Array.isArray(props.subscriptions) ? props.subscriptions : [];
    const items = [];

    for (const subscription of list) {
      if (!subscription || typeof subscription !== 'object') {
        continue;
      }

      const isTrial = subscription.status === SUBSCRIPTION_STATUS.TRIAL;
      const isActive = subscription.status === SUBSCRIPTION_STATUS.ACTIVE;

      if (!isTrial && !isActive) {
        continue;
      }

      const targetDate = isTrial
        ? subscription.trialEndDate
        : subscription.renewalDate;

      if (!targetDate) {
        continue;
      }

      const daysRemaining = calculateDaysRemaining(targetDate, props.referenceDate);

      if (daysRemaining === null || daysRemaining < 0 || daysRemaining > 30) {
        continue;
      }

      const name = subscription.serviceName || t('card.fallbackName');
      const isPaid = subscription.type === 'paid';
      const formattedPrice = isPaid
        ? formatCurrency(subscription.price, { locale: locale.value })
        : t('card.noCharge');

      let badgeText;
      let badgeClass = 'timeline-badge--normal';

      if (daysRemaining === 0) {
        badgeText = t('timeline.badgeToday');
        badgeClass = 'timeline-badge--imminent';
      } else if (daysRemaining === 1) {
        badgeText = t('timeline.badgeTomorrow');
        badgeClass = 'timeline-badge--imminent';
      } else {
        badgeText = t('timeline.badgeInDays', { days: daysRemaining });
        if (isTrial) {
          badgeClass = 'timeline-badge--trial';
        }
      }

      items.push({
        id: subscription.id || `${name}-${targetDate}`,
        name,
        targetDate,
        daysRemaining,
        isTrial,
        formattedDate: formatDate(targetDate),
        price: typeof subscription.price === 'number' ? subscription.price : 0,
        isPaid,
        formattedPrice,
        icon: subscription.icon,
        brandColor: subscription.brandColor || null,
        badgeText,
        badgeClass,
      });
    }

    return items.sort((a, b) => {
      if (a.daysRemaining !== b.daysRemaining) {
        return a.daysRemaining - b.daysRemaining;
      }
      return a.name.localeCompare(b.name);
    });
  });

  const upcomingCount = computed(() => upcomingItems.value.length);

  const totalUpcomingCents = computed(() => {
    return upcomingItems.value.reduce((acc, item) => {
      if (item.isPaid && item.price > 0) {
        return acc + toCents(item.price);
      }
      return acc;
    }, 0);
  });

  const formattedTotalUpcoming = computed(() => {
    return formatCurrency(centsToAmount(totalUpcomingCents.value), {
      locale: locale.value,
    });
  });

  const upcomingCountLabel = computed(() => {
    return tc('timeline.upcomingCount', upcomingCount.value);
  });

  const totalUpcomingLabel = computed(() => {
    return t('timeline.totalUpcoming', { total: formattedTotalUpcoming.value });
  });

  const isNotificationsActive = computed(() => {
    return isEnabled.value && permission.value === NOTIFICATION_PERMISSIONS.GRANTED;
  });

  const isNotificationsBlocked = computed(() => {
    return permission.value === NOTIFICATION_PERMISSIONS.DENIED;
  });

  const isNotificationsUnsupported = computed(() => {
    return permission.value === NOTIFICATION_PERMISSIONS.UNSUPPORTED;
  });

  const isNotificationsButtonDisabled = computed(() => {
    return isNotificationsBlocked.value || isNotificationsUnsupported.value;
  });

  const notificationsButtonLabel = computed(() => {
    if (isNotificationsUnsupported.value) {
      return t('timeline.notificationsUnsupported');
    }
    if (isNotificationsBlocked.value) {
      return t('timeline.notificationsDenied');
    }
    if (isNotificationsActive.value) {
      return t('timeline.notificationsActive');
    }
    return t('timeline.notificationsEnable');
  });

  const notificationsAriaLabel = computed(() => {
    return `${t('timeline.notificationsTitle')}: ${notificationsButtonLabel.value}`;
  });

  async function handleToggleNotifications() {
    if (isNotificationsButtonDisabled.value) {
      return;
    }

    if (isEnabled.value) {
      setNotificationPreference(false, props.storage);
      isEnabled.value = false;
      return;
    }

    if (permission.value === NOTIFICATION_PERMISSIONS.DEFAULT) {
      const requested = await requestNotificationPermission(props.target);
      permission.value = requested;

      if (requested === NOTIFICATION_PERMISSIONS.GRANTED) {
        setNotificationPreference(true, props.storage);
        isEnabled.value = true;
        scheduleLocalSubscriptionAlerts(props.subscriptions, {
          referenceDate: props.referenceDate,
          target: props.target,
          storage: props.storage,
          enabled: true,
        });
      }
      return;
    }

    if (permission.value === NOTIFICATION_PERMISSIONS.GRANTED) {
      setNotificationPreference(true, props.storage);
      isEnabled.value = true;
      scheduleLocalSubscriptionAlerts(props.subscriptions, {
        referenceDate: props.referenceDate,
        target: props.target,
        storage: props.storage,
        enabled: true,
      });
    }
  }

  return {
    failedIcons,
    formattedTotalUpcoming,
    handleImageError,
    handleToggleNotifications,
    isNotificationsActive,
    isNotificationsBlocked,
    isNotificationsButtonDisabled,
    isNotificationsUnsupported,
    notificationsAriaLabel,
    notificationsButtonLabel,
    totalUpcomingCents,
    totalUpcomingLabel,
    upcomingCount,
    upcomingCountLabel,
    upcomingItems,
  };
}
