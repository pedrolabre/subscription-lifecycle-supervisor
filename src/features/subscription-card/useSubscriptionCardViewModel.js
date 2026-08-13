import { computed, ref, watch } from 'vue';
import { calculateDaysRemaining, isTrialEndingSoon } from '../../core/dates/index.js';
import { formatCurrency } from '../../core/money/index.js';
import { SERVICE_BRAND_FALLBACK, findService } from '../../domain/services/index.js';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';

const statusMessageKeys = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'subscriptionStatus.active',
  [SUBSCRIPTION_STATUS.TRIAL]: 'subscriptionStatus.trial',
  [SUBSCRIPTION_STATUS.ENDED]: 'subscriptionStatus.ended',
  [SUBSCRIPTION_STATUS.ARCHIVED]: 'subscriptionStatus.archived',
};

const statusTones = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'active',
  [SUBSCRIPTION_STATUS.TRIAL]: 'trial',
  [SUBSCRIPTION_STATUS.ENDED]: 'ended',
  [SUBSCRIPTION_STATUS.ARCHIVED]: 'archived',
};

const typeMessageKeys = {
  [SUBSCRIPTION_TYPES.FREE]: 'subscriptionTypes.free',
  [SUBSCRIPTION_TYPES.EDUCATIONAL]: 'subscriptionTypes.educational',
};

const cycleMessageKeys = {
  [BILLING_CYCLES.MONTHLY]: 'card.cycleMonthly',
  [BILLING_CYCLES.YEARLY]: 'card.cycleYearly',
  [BILLING_CYCLES.LIFETIME]: 'card.cycleLifetime',
};

export function useSubscriptionCardViewModel({
  formatDate,
  formatRelativeDays,
  locale,
  props,
  t,
}) {
  const logoFailed = ref(false);

  const matchedCatalogService = computed(() =>
    findService(props.subscription.serviceId || props.subscription.serviceName),
  );

  const displayName = computed(() =>
    normalizeText(
      props.subscription.serviceName ?? props.subscription.service?.name,
      t('card.fallbackName'),
    ),
  );

  const statusLabel = computed(
    () =>
      (statusMessageKeys[props.subscription.status]
        ? t(statusMessageKeys[props.subscription.status])
        : null) ??
      normalizeText(props.subscription.status, t('card.fallbackStatus')),
  );

  const statusTone = computed(
    () => statusTones[props.subscription.status] ?? 'info',
  );

  const brandColor = computed(() =>
    normalizeBrandColor(
      props.subscription.brandColor ??
        props.subscription.service?.color ??
        matchedCatalogService.value?.color,
    ),
  );

  const cardStyle = computed(() => ({
    '--subscription-brand-color': brandColor.value,
  }));

  const logoUrl = computed(() =>
    normalizeText(
      props.subscription.icon ??
        props.subscription.service?.iconPath ??
        matchedCatalogService.value?.iconPath,
      '',
    ),
  );

  const canShowLogo = computed(
    () => Boolean(logoUrl.value) && !logoFailed.value,
  );

  const brandInitial = computed(() => {
    const match = displayName.value.match(/[a-z0-9]/i);

    return (match?.[0] ?? 'S').toUpperCase();
  });

  const isPaidSubscription = computed(
    () => props.subscription.type === SUBSCRIPTION_TYPES.PAID,
  );

  const priceValue = computed(() => {
    if (!isPaidSubscription.value) {
      return t('card.noCharge');
    }

    const price = Number(props.subscription.price);

    return Number.isFinite(price) && price > 0
      ? formatCurrency(price, { locale: locale.value })
      : t('card.noLocalValue');
  });

  const priceCycle = computed(() => {
    if (isPaidSubscription.value) {
      return cycleMessageKeys[props.subscription.billingCycle]
        ? t(cycleMessageKeys[props.subscription.billingCycle])
        : t('card.cycleFallback');
    }

    return typeMessageKeys[props.subscription.type]
      ? t(typeMessageKeys[props.subscription.type])
      : t('card.priceFallback');
  });

  const relevantDate = computed(() => {
    if (
      props.subscription.status === SUBSCRIPTION_STATUS.TRIAL &&
      hasText(props.subscription.trialEndDate)
    ) {
      return createDateDetail(
        t('dates.labels.trialEnd'),
        props.subscription.trialEndDate,
      );
    }

    if (
      props.subscription.type === SUBSCRIPTION_TYPES.EDUCATIONAL &&
      hasText(props.subscription.trialEndDate)
    ) {
      return createDateDetail(
        t('dates.labels.educationalEnd'),
        props.subscription.trialEndDate,
      );
    }

    if (hasText(props.subscription.renewalDate)) {
      return createDateDetail(
        t('dates.labels.renewal'),
        props.subscription.renewalDate,
      );
    }

    if (hasText(props.subscription.trialEndDate)) {
      return createDateDetail(
        t('dates.labels.trialEnd'),
        props.subscription.trialEndDate,
      );
    }

    if (hasText(props.subscription.startDate)) {
      return createDateDetail(
        t('dates.labels.start'),
        props.subscription.startDate,
      );
    }

    return {
      detail: '',
      label: t('card.dateFallback'),
      value: t('card.noLocalDate'),
    };
  });

  const relativeLabelText = computed(() => {
    const detail = relevantDate.value.detail;

    if (!detail) {
      return relevantDate.value.label;
    }

    if (
      props.subscription.status === SUBSCRIPTION_STATUS.TRIAL &&
      hasText(props.subscription.trialEndDate)
    ) {
      return `${t('dates.labels.trialEnd')} ${detail}`;
    }

    if (
      props.subscription.type === SUBSCRIPTION_TYPES.EDUCATIONAL &&
      hasText(props.subscription.trialEndDate)
    ) {
      return `${t('dates.labels.educationalEnd')} ${detail}`;
    }

    if (hasText(props.subscription.renewalDate)) {
      return `${t('dates.labels.renewal')} ${detail}`;
    }

    if (hasText(props.subscription.startDate)) {
      return `${t('dates.labels.start')} ${detail}`;
    }

    return `${relevantDate.value.label} ${detail}`;
  });

  const isTrialWarning = computed(() => {
    if (typeof props.subscription.isTrialEndingSoon === 'boolean') {
      return props.subscription.isTrialEndingSoon;
    }

    return isTrialEndingSoon(props.subscription, {
      referenceDate: props.referenceDate,
    });
  });

  const subscriptionId = computed(() =>
    normalizeText(props.subscription.id, ''),
  );

  const hasSubscriptionId = computed(() => Boolean(subscriptionId.value));

  const cardBaseId = computed(
    () =>
      `subscription-card-${createSafeId(
        subscriptionId.value || displayName.value,
      )}`,
  );

  const cardTitleId = computed(() => `${cardBaseId.value}-title`);
  const cardStatusId = computed(() => `${cardBaseId.value}-status`);
  const cardPriceId = computed(() => `${cardBaseId.value}-price`);
  const cardDateId = computed(() => `${cardBaseId.value}-date`);
  const cardWarningId = computed(() => `${cardBaseId.value}-warning`);

  const cardDescriptionIds = computed(() =>
    [
      isTrialWarning.value ? cardWarningId.value : '',
      cardPriceId.value,
      cardDateId.value,
    ]
      .filter(Boolean)
      .join(' '),
  );

  const isArchived = computed(
    () => props.subscription.status === SUBSCRIPTION_STATUS.ARCHIVED,
  );

  const canArchive = computed(() => hasSubscriptionId.value);

  const canEnd = computed(
    () =>
      hasSubscriptionId.value &&
      props.subscription.status !== SUBSCRIPTION_STATUS.ENDED,
  );

  const editActionLabel = computed(() =>
    hasSubscriptionId.value
      ? t('card.actionEdit', { name: displayName.value })
      : t('card.actionEditUnavailable', { name: displayName.value }),
  );

  const archiveButtonText = computed(() =>
    isArchived.value ? t('buttons.unarchive') : t('buttons.archive'),
  );

  const archiveActionLabel = computed(() => {
    if (!hasSubscriptionId.value) {
      return t('card.actionArchiveUnavailable', { name: displayName.value });
    }

    return isArchived.value
      ? t('card.actionUnarchive', { name: displayName.value })
      : t('card.actionArchive', { name: displayName.value });
  });

  const endActionLabel = computed(() =>
    canEnd.value
      ? t('card.actionEnd', { name: displayName.value })
      : t('card.actionEndUnavailable', { name: displayName.value }),
  );

  watch(logoUrl, () => {
    logoFailed.value = false;
  });

  function handleLogoError() {
    logoFailed.value = true;
  }

  function createDateDetail(label, value) {
    return {
      detail: formatRelativeDays(
        calculateDaysRemaining(value, props.referenceDate),
      ),
      label,
      value: formatDate(value),
    };
  }

  return {
    archiveActionLabel,
    archiveButtonText,
    brandInitial,
    canArchive,
    canEnd,
    canShowLogo,
    cardDateId,
    cardDescriptionIds,
    cardPriceId,
    cardStatusId,
    cardStyle,
    cardTitleId,
    cardWarningId,
    displayName,
    editActionLabel,
    endActionLabel,
    handleLogoError,
    hasSubscriptionId,
    isTrialWarning,
    logoUrl,
    priceCycle,
    priceValue,
    relativeLabelText,
    relevantDate,
    statusLabel,
    statusTone,
  };
}

function normalizeText(value, fallback) {
  return hasText(value) ? String(value).trim() : fallback;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeBrandColor(value) {
  const color = normalizeText(value, '').toLowerCase();
  const colorWithHash = color.startsWith('#') ? color : `#${color}`;

  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(colorWithHash)
    ? colorWithHash
    : SERVICE_BRAND_FALLBACK.color;
}

function createSafeId(value) {
  return (
    normalizeText(value, 'local')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'local'
  );
}
