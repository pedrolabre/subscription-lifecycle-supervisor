<script setup>
import { BaseButton, StatusBadge } from '../../shared/components/index.js';
import { useLocale } from '../../shared/i18n/index.js';
import { useSubscriptionCardViewModel } from './useSubscriptionCardViewModel.js';

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
const {
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
} = useSubscriptionCardViewModel({
  formatDate,
  formatRelativeDays,
  locale,
  props,
  t,
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
