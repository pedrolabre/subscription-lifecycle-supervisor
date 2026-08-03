<script setup>
import { computed, ref, watch } from 'vue';
import { calculateDaysRemaining, isTrialEndingSoon } from '../../core/dates/index.js';
import { formatCurrency } from '../../core/money/index.js';
import { SERVICE_BRAND_FALLBACK } from '../../domain/services/index.js';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import { StatusBadge } from '../../shared/components/index.js';

const props = defineProps({
  referenceDate: {
    type: [Date, String],
    default: () => new Date(),
  },
  subscription: {
    type: Object,
    required: true,
  },
});

const logoFailed = ref(false);

const statusLabels = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'Ativa',
  [SUBSCRIPTION_STATUS.TRIAL]: 'Trial',
  [SUBSCRIPTION_STATUS.ENDED]: 'Encerrada',
  [SUBSCRIPTION_STATUS.ARCHIVED]: 'Arquivada',
};

const statusTones = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'active',
  [SUBSCRIPTION_STATUS.TRIAL]: 'trial',
  [SUBSCRIPTION_STATUS.ENDED]: 'ended',
  [SUBSCRIPTION_STATUS.ARCHIVED]: 'archived',
};

const typeLabels = {
  [SUBSCRIPTION_TYPES.FREE]: 'Gratuita',
  [SUBSCRIPTION_TYPES.EDUCATIONAL]: 'Educacional',
};

const cycleLabels = {
  [BILLING_CYCLES.MONTHLY]: '/ mes',
  [BILLING_CYCLES.YEARLY]: '/ ano',
  [BILLING_CYCLES.LIFETIME]: 'vitalicio',
};

const displayName = computed(() =>
  normalizeText(
    props.subscription.serviceName ?? props.subscription.service?.name,
    'Assinatura local',
  ),
);

const statusLabel = computed(
  () =>
    statusLabels[props.subscription.status] ??
    normalizeText(props.subscription.status, 'Status local'),
);

const statusTone = computed(
  () => statusTones[props.subscription.status] ?? 'info',
);

const brandColor = computed(() =>
  normalizeBrandColor(
    props.subscription.brandColor ?? props.subscription.service?.color,
  ),
);

const cardStyle = computed(() => ({
  '--subscription-brand-color': brandColor.value,
}));

const logoUrl = computed(() =>
  normalizeText(
    props.subscription.icon ?? props.subscription.service?.iconPath,
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
    return 'Sem cobranca';
  }

  const price = Number(props.subscription.price);

  return Number.isFinite(price) && price > 0
    ? formatCurrency(price)
    : 'Sem valor local';
});

const priceCycle = computed(() => {
  if (isPaidSubscription.value) {
    return cycleLabels[props.subscription.billingCycle] ?? 'ciclo local';
  }

  return typeLabels[props.subscription.type] ?? 'Controle local';
});

const relevantDate = computed(() => {
  if (
    props.subscription.status === SUBSCRIPTION_STATUS.TRIAL &&
    hasText(props.subscription.trialEndDate)
  ) {
    return createDateDetail('Fim do trial', props.subscription.trialEndDate);
  }

  if (hasText(props.subscription.renewalDate)) {
    return createDateDetail('Renovacao', props.subscription.renewalDate);
  }

  if (hasText(props.subscription.trialEndDate)) {
    return createDateDetail('Fim do trial', props.subscription.trialEndDate);
  }

  if (hasText(props.subscription.startDate)) {
    return createDateDetail('Inicio', props.subscription.startDate);
  }

  return {
    detail: '',
    label: 'Data',
    value: 'Sem data local',
  };
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

watch(logoUrl, () => {
  logoFailed.value = false;
});

function handleLogoError() {
  logoFailed.value = true;
}

function createDateDetail(label, value) {
  return {
    detail: formatDaysDetail(
      calculateDaysRemaining(value, props.referenceDate),
    ),
    label,
    value: formatLocalDate(value),
  };
}

function formatDaysDetail(days) {
  if (days === null) {
    return '';
  }

  if (days === 0) {
    return 'hoje';
  }

  const absoluteDays = Math.abs(days);
  const unit = absoluteDays === 1 ? 'dia' : 'dias';

  return days > 0
    ? `em ${absoluteDays} ${unit}`
    : `${absoluteDays} ${unit} atras`;
}

function formatLocalDate(value) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return normalizeText(value, 'Sem data local');
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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
</script>

<template>
  <article
    class="subscription-card"
    :class="{ 'subscription-card--trial-warning': isTrialWarning }"
    :style="cardStyle"
    role="listitem"
    :aria-label="`${displayName}, ${statusLabel}`"
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
          :alt="`${displayName} logo`"
          @error="handleLogoError"
        >
        <span
          v-else
          class="subscription-card__brand-fallback"
        >
          {{ brandInitial }}
        </span>
      </div>

      <StatusBadge :tone="statusTone">
        {{ statusLabel }}
      </StatusBadge>
    </div>

    <div class="subscription-card__body">
      <div class="subscription-card__title-group">
        <p
          v-if="isTrialWarning"
          class="subscription-card__warning"
        >
          Trial perto do fim
        </p>
        <h3 class="subscription-card__title">
          {{ displayName }}
        </h3>
      </div>

      <div class="subscription-card__price">
        <span class="subscription-card__price-value">
          {{ priceValue }}
        </span>
        <span class="subscription-card__price-cycle">
          {{ priceCycle }}
        </span>
      </div>
    </div>

    <footer class="subscription-card__footer">
      <span class="subscription-card__date-label">
        {{ relevantDate.label }}
      </span>
      <span class="subscription-card__date-value">
        {{ relevantDate.value }}
      </span>
      <span
        v-if="relevantDate.detail"
        class="subscription-card__date-detail"
      >
        {{ relevantDate.detail }}
      </span>
    </footer>
  </article>
</template>

<style scoped>
.subscription-card {
  position: relative;
  display: grid;
  min-height: 13.5rem;
  gap: var(--space-5);
  overflow: hidden;
  padding: var(--space-5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--subscription-brand-color) 18%, transparent),
      transparent 42%
    ),
    var(--surface-raised);
  box-shadow: var(--shadow-soft);
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
      145deg,
      color-mix(in srgb, var(--status-trial) 20%, transparent),
      transparent 46%
    ),
    var(--surface-raised);
}

.subscription-card__brand,
.subscription-card__body,
.subscription-card__footer {
  position: relative;
}

.subscription-card__brand {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.subscription-card__mark {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  overflow: hidden;
  border: 1px solid color-mix(
    in srgb,
    var(--subscription-brand-color) 54%,
    var(--border-subtle)
  );
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: color-mix(
    in srgb,
    var(--subscription-brand-color) 20%,
    var(--surface-elevated)
  );
}

.subscription-card__logo {
  width: 1.8rem;
  height: 1.8rem;
  object-fit: contain;
}

.subscription-card__brand-fallback {
  font-size: var(--font-size-lg);
  font-weight: 900;
}

.subscription-card__body {
  display: grid;
  gap: var(--space-4);
  align-content: start;
}

.subscription-card__title-group {
  display: grid;
  gap: var(--space-2);
}

.subscription-card__warning {
  width: fit-content;
  margin: 0;
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
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-tight);
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.subscription-card__price {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: baseline;
}

.subscription-card__price-value {
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: 900;
}

.subscription-card__price-cycle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 800;
}

.subscription-card__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2) var(--space-3);
  align-self: end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.subscription-card__date-label,
.subscription-card__date-detail {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.subscription-card__date-value {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 900;
  text-align: right;
}

.subscription-card__date-detail {
  grid-column: 1 / -1;
  color: var(--text-secondary);
  text-transform: none;
}

@media (max-width: 520px) {
  .subscription-card {
    min-height: 12.5rem;
    padding: var(--space-4);
  }

  .subscription-card__footer {
    grid-template-columns: 1fr;
  }

  .subscription-card__date-value {
    text-align: left;
  }
}
</style>
