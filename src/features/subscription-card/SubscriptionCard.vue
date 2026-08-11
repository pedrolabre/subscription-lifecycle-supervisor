<script setup>
import { computed, ref, watch } from 'vue';
import { calculateDaysRemaining, isTrialEndingSoon } from '../../core/dates/index.js';
import { formatCurrency } from '../../core/money/index.js';
import { SERVICE_BRAND_FALLBACK, findService } from '../../domain/services/index.js';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import { BaseButton, StatusBadge } from '../../shared/components/index.js';
import { useLocale } from '../../shared/i18n/index.js';

const props = defineProps({
  actionsDisabled: {
    type: Boolean,
    default: false,
  },
  referenceDate: {
    type: [Date, String],
    default: () => new Date(),
  },
  subscription: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['archive', 'edit', 'end']);

const { formatDate, formatRelativeDays, locale, t } = useLocale();
const logoFailed = ref(false);

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
      : null) ?? normalizeText(props.subscription.status, t('card.fallbackStatus')),
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

const canShowLogo = computed(() => Boolean(logoUrl.value) && !logoFailed.value);

const brandInitial = computed(() => {
  const match = displayName.value.match(/[a-z0-9]/i);

  return (match?.[0] ?? 'S').toUpperCase();
});

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
    return createDateDetail(t('dates.labels.start'), props.subscription.startDate);
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

const isPaidSubscription = computed(
  () => props.subscription.type === SUBSCRIPTION_TYPES.PAID,
);

const subscriptionId = computed(() => normalizeText(props.subscription.id, ''));

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

function emitEdit() {
  emit('edit', props.subscription);
}

function emitArchive() {
  emit('archive', props.subscription);
}

function emitEnd() {
  emit('end', props.subscription);
}

function handleLogoError() {
  logoFailed.value = true;
}

function createDateDetail(label, value) {
  return {
    detail: formatRelativeDays(calculateDaysRemaining(value, props.referenceDate)),
    label,
    value: formatDate(value),
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
</script>

<template>
  <article
    class="subscription-card"
    :class="{ 'subscription-card--trial-warning': isTrialWarning }"
    :style="cardStyle"
    role="listitem"
    :aria-labelledby="`${cardTitleId} ${cardStatusId}`"
    :aria-describedby="cardDescriptionIds"
  >
    <div class="subscription-card__brand">
      <div
        class="subscription-card__mark"
        aria-hidden="true"
      >
        <img
          v-if="canShowLogo"
          class="subscription-card__logo"
          :src="logoUrl"
          alt=""
          @error="handleLogoError"
        >
        <span
          v-else
          class="subscription-card__brand-fallback"
        >
          {{ brandInitial }}
        </span>
      </div>

      <StatusBadge
        :id="cardStatusId"
        :tone="statusTone"
      >
        {{ statusLabel }}
      </StatusBadge>
    </div>

    <div class="subscription-card__body">
      <div class="subscription-card__title-group">
        <p
          v-if="isTrialWarning"
          :id="cardWarningId"
          class="subscription-card__warning"
        >
          {{ t('card.trialEndingSoon') }}
        </p>
        <h3
          :id="cardTitleId"
          class="subscription-card__title"
        >
          {{ displayName }}
        </h3>
      </div>

      <div
        :id="cardPriceId"
        class="subscription-card__price"
      >
        <span class="subscription-card__price-value">
          {{ priceValue }}
        </span>
        <span class="subscription-card__price-cycle">
          {{ priceCycle }}
        </span>
      </div>
    </div>

    <div
      :id="cardDateId"
      class="subscription-card__footer"
    >
      <span class="subscription-card__date-relative">
        {{ relativeLabelText }}
      </span>
      <span class="subscription-card__date-value">
        {{ relevantDate.value }}
      </span>
    </div>

    <div
      class="subscription-card__actions"
      :aria-label="t('card.actionsLabel', { name: displayName })"
    >
      <BaseButton
        class="subscription-card__action"
        data-test="edit-subscription"
        type="button"
        variant="secondary"
        :aria-label="editActionLabel"
        :disabled="actionsDisabled || !hasSubscriptionId"
        @click="emitEdit"
      >
        {{ t('buttons.edit') }}
      </BaseButton>
      <BaseButton
        class="subscription-card__action"
        data-test="archive-subscription"
        type="button"
        variant="secondary"
        :aria-label="archiveActionLabel"
        :disabled="actionsDisabled || !canArchive"
        @click="emitArchive"
      >
        {{ archiveButtonText }}
      </BaseButton>
      <BaseButton
        class="subscription-card__action subscription-card__action--end"
        data-test="end-subscription"
        type="button"
        variant="secondary"
        :aria-label="endActionLabel"
        :disabled="actionsDisabled || !canEnd"
        @click="emitEnd"
      >
        {{ t('buttons.end') }}
      </BaseButton>
    </div>
  </article>
</template>

<style scoped>
.subscription-card {
  position: relative;
  display: flex;
  min-height: 11.125rem;
  flex-direction: column;
  overflow: hidden;
  padding: 0.625rem 0.75rem 0.5625rem 0.875rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(
      135deg,
      color-mix(
        in srgb,
        var(--subscription-brand-color) var(--subscription-card-brand-start),
        var(--surface-base)
      ) 0%,
      color-mix(
        in srgb,
        var(--subscription-brand-color) var(--subscription-card-brand-mid),
        var(--surface-base)
      ) 38%,
      var(--surface-base) 76%
    );
}

.subscription-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.25rem;
  background: var(--subscription-brand-color);
  content: "";
}

.subscription-card--trial-warning {
  border-color: var(--status-trial-border);
  background:
    linear-gradient(
      135deg,
      color-mix(
        in srgb,
        var(--status-trial) var(--subscription-card-trial-start),
        var(--surface-base)
      ) 0%,
      color-mix(
        in srgb,
        var(--subscription-brand-color) var(--subscription-card-brand-mid),
        var(--surface-base)
      ) 38%,
      var(--surface-base) 76%
    );
}

.subscription-card__brand,
.subscription-card__body,
.subscription-card__footer {
  position: relative;
}

.subscription-card__brand {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.subscription-card__mark {
  display: grid;
  width: 1.875rem;
  height: 1.875rem;
  place-items: center;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: transparent;
}

.subscription-card :deep(.status-badge) {
  min-height: 1.375rem;
  padding: 0 var(--space-2);
  border-color: color-mix(
    in srgb,
    var(--subscription-brand-color) 58%,
    var(--border-subtle)
  );
  background: color-mix(
    in srgb,
    var(--subscription-brand-color) 13%,
    transparent
  );
  font-size: var(--font-size-xs);
}

.subscription-card__logo {
  display: block;
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
}

.subscription-card__brand-fallback {
  display: grid;
  width: 1.875rem;
  height: 1.875rem;
  place-items: center;
  border: 1px solid color-mix(
    in srgb,
    var(--subscription-brand-color) 70%,
    var(--border-subtle)
  );
  background: color-mix(
    in srgb,
    var(--subscription-brand-color) 12%,
    transparent
  );
  font-size: var(--font-size-md);
  font-weight: 800;
}

.subscription-card__body {
  display: grid;
  gap: var(--space-1);
  align-content: start;
}

.subscription-card__title-group {
  display: grid;
  gap: var(--space-1);
}

.subscription-card__warning {
  width: fit-content;
  margin: var(--space-2) 0 0;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--status-trial-border);
  border-radius: var(--radius-pill);
  color: var(--status-trial);
  background: var(--status-trial-surface);
  font-size: var(--font-size-xs);
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.subscription-card__title {
  margin: 0.4375rem 0 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  line-height: var(--line-tight);
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.subscription-card__price {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: baseline;
  margin-top: var(--space-1);
}

.subscription-card__price-value {
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: 800;
}

.subscription-card__price-cycle {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.subscription-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-top: var(--space-2);
  margin: auto 0 0;
  border-top: 1px solid var(--border-subtle);
}

.subscription-card__date-relative {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subscription-card__date-value {
  color: var(--text-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  flex: 0 0 auto;
}

.subscription-card__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.3125rem;
  margin-top: 0.4375rem;
}

.subscription-card__action {
  width: 100%;
  min-height: 1.625rem;
  padding: 0 var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.subscription-card__action--end:hover:not(:disabled),
.subscription-card__action--end:focus-visible:not(:disabled) {
  border-color: var(--status-ended-border);
  color: var(--status-ended);
  background: var(--status-ended-surface);
}

@media (max-width: 520px) {
  .subscription-card {
    min-height: 10.75rem;
  }
}
</style>
