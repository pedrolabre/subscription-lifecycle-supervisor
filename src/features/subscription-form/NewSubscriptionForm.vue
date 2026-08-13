<script setup>
import { SUBSCRIPTION_FIELD_LIMITS } from '../../domain/subscriptions/index.js';
import { BaseButton } from '../../shared/components/index.js';
import { useLocale } from '../../shared/i18n/index.js';
import { useSubscriptionForm } from './useSubscriptionForm.js';

const props = defineProps({
  creationError: {
    type: Object,
    default: null,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value),
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  submissionError: {
    type: Object,
    default: null,
  },
  subscription: {
    type: Object,
    default: null,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  titleId: {
    type: String,
    default: 'new-subscription-title',
  },
});

const emit = defineEmits(['cancel', 'change', 'submit']);

const { locale, t, translateValidationError } = useLocale();

const {
  accessKindOptions,
  billingCycleSelect,
  clearCatalogSelection,
  emitCancel,
  errorSummaryRef,
  fieldErrors,
  form,
  formDescribedBy,
  formError,
  formTitle,
  hasSelectedCatalogService,
  isEducationalAccess,
  isPaidAccess,
  isSelectedService,
  isTrialAccess,
  paidBillingOptions,
  priceInput,
  renewalDateInput,
  requiresRenewalDate,
  selectedCatalogService,
  selectedServiceId,
  selectCatalogService,
  selectCatalogServiceId,
  serviceCatalog,
  serviceNameInput,
  serviceSearchResults,
  startDateInput,
  submitButtonText,
  submitForm,
  trialEndDateInput,
} = useSubscriptionForm({
  emit,
  locale,
  props,
  t,
  translateValidationError,
});

</script>

<template>
  <section
    id="new-subscription-form"
    class="subscription-form-panel"
    :class="{ 'subscription-form-panel--embedded': embedded }"
    :aria-labelledby="titleId"
  >
    <form
      class="subscription-form"
      novalidate
      :aria-labelledby="titleId"
      :aria-busy="isSubmitting"
      :aria-describedby="formDescribedBy"
      @submit.prevent="submitForm"
    >
      <div
        v-if="showHeader"
        class="subscription-form__header"
      >
        <h2 :id="titleId">
          {{ formTitle }}
        </h2>
      </div>

      <p
        v-if="formError"
        id="subscription-form-error-summary"
        ref="errorSummaryRef"
        class="subscription-form__error-summary"
        role="alert"
        tabindex="-1"
      >
        {{ formError }}
      </p>

      <fieldset class="subscription-form__group subscription-form__group--kind">
        <legend>{{ t('form.fields.type') }}</legend>
        <div class="subscription-form__kind-options">
          <label
            v-for="option in accessKindOptions"
            :key="option.value"
            class="subscription-form__kind-option"
            :class="{
              'subscription-form__kind-option--selected':
                form.accessKind === option.value,
            }"
          >
            <input
              v-model="form.accessKind"
              class="subscription-form__kind-input"
              type="radio"
              name="subscription-access-kind"
              :value="option.value"
              :data-test="`kind-${option.value}`"
            >
            <span>{{ option.label }}</span>
          </label>
        </div>
      </fieldset>

      <div class="subscription-form__grid">
        <div class="subscription-form__field subscription-form__field--service">
          <label for="subscription-service-name">
            {{ t('form.fields.serviceName') }}
          </label>
          <input
            id="subscription-service-name"
            ref="serviceNameInput"
            v-model="form.serviceName"
            data-test="service-name"
            type="text"
            autocomplete="off"
            data-dialog-autofocus
            :maxlength="SUBSCRIPTION_FIELD_LIMITS.serviceNameMaxLength"
            :aria-invalid="Boolean(fieldErrors.serviceName)"
            :aria-describedby="
              fieldErrors.serviceName ? 'service-name-error' : undefined
            "
            :placeholder="t('form.catalog.freeform')"
          >
          <span
            v-if="fieldErrors.serviceName"
            id="service-name-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.serviceName }}
          </span>

          <ul
            v-if="serviceSearchResults.length"
            class="subscription-form__catalog-suggestions"
            :aria-label="t('form.catalog.suggestionsLabel')"
          >
            <li
              v-for="service in serviceSearchResults"
              :key="service.id"
              class="subscription-form__catalog-suggestion-item"
            >
              <button
                class="subscription-form__catalog-suggestion"
                :class="{
                  'subscription-form__catalog-suggestion--selected':
                    isSelectedService(service),
                }"
                :aria-label="t('form.catalog.useService', { service: service.name })"
                :aria-pressed="isSelectedService(service)"
                data-test="service-catalog-suggestion"
                type="button"
                @click="selectCatalogService(service)"
              >
                <span
                  class="subscription-form__catalog-swatch"
                  :style="{ '--service-swatch-color': service.color }"
                  aria-hidden="true"
                />
                <span>{{ service.name }}</span>
              </button>
            </li>
          </ul>
        </div>

        <div class="subscription-form__field subscription-form__field--catalog">
          <label for="subscription-service-catalog">
            {{ t('form.fields.catalog') }}
          </label>
          <div class="subscription-form__catalog-controls">
            <select
              id="subscription-service-catalog"
              data-test="service-catalog-select"
              :value="selectedServiceId"
              @change="selectCatalogServiceId($event.target.value)"
            >
              <option value="">
                {{ t('form.catalog.freeform') }}
              </option>
              <option
                v-for="service in serviceCatalog"
                :key="service.id"
                :value="service.id"
              >
                {{ service.name }}
              </option>
            </select>

            <BaseButton
              v-if="hasSelectedCatalogService"
              class="subscription-form__catalog-clear"
              data-test="clear-service-selection"
              type="button"
              variant="secondary"
              :aria-label="
                t('form.catalog.clearSelection', {
                  service: selectedCatalogService.name,
                })
              "
              :disabled="isSubmitting"
              @click="clearCatalogSelection"
            >
              {{ t('buttons.clear') }}
            </BaseButton>
          </div>
        </div>

        <label class="subscription-form__field subscription-form__field--start">
          <span>{{ t('form.fields.startDate') }}</span>
          <input
            ref="startDateInput"
            v-model="form.startDate"
            data-test="start-date"
            type="date"
            :aria-invalid="Boolean(fieldErrors.startDate)"
            :aria-describedby="
              fieldErrors.startDate ? 'start-date-error' : undefined
            "
          >
          <span
            v-if="fieldErrors.startDate"
            id="start-date-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.startDate }}
          </span>
        </label>

        <label
          v-if="isPaidAccess"
          class="subscription-form__field subscription-form__field--value"
        >
          <span>{{ t('form.fields.price') }}</span>
          <input
            ref="priceInput"
            v-model="form.price"
            data-test="price"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="Boolean(fieldErrors.price)"
            :aria-describedby="fieldErrors.price ? 'price-error' : undefined"
            :placeholder="t('form.pricePlaceholder')"
          >
          <span
            v-if="fieldErrors.price"
            id="price-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.price }}
          </span>
        </label>

        <label
          v-if="isPaidAccess"
          class="subscription-form__field subscription-form__field--cycle"
        >
          <span>{{ t('form.fields.billingCycle') }}</span>
          <select
            ref="billingCycleSelect"
            v-model="form.billingCycle"
            data-test="billing-cycle"
            :aria-invalid="Boolean(fieldErrors.billingCycle)"
            :aria-describedby="
              fieldErrors.billingCycle ? 'billing-cycle-error' : undefined
            "
          >
            <option
              v-for="option in paidBillingOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <span
            v-if="fieldErrors.billingCycle"
            id="billing-cycle-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.billingCycle }}
          </span>
        </label>

        <label
          v-if="requiresRenewalDate"
          class="subscription-form__field subscription-form__field--renewal"
        >
          <span>{{ t('form.fields.renewalDate') }}</span>
          <input
            ref="renewalDateInput"
            v-model="form.renewalDate"
            data-test="renewal-date"
            type="date"
            :aria-invalid="Boolean(fieldErrors.renewalDate)"
            :aria-describedby="
              fieldErrors.renewalDate ? 'renewal-date-error' : undefined
            "
          >
          <span
            v-if="fieldErrors.renewalDate"
            id="renewal-date-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.renewalDate }}
          </span>
        </label>

        <label
          v-if="isTrialAccess"
          class="subscription-form__field subscription-form__field--trial-end"
        >
          <span>{{ t('form.fields.trialEndDate') }}</span>
          <input
            ref="trialEndDateInput"
            v-model="form.trialEndDate"
            data-test="trial-end-date"
            type="date"
            :aria-invalid="Boolean(fieldErrors.trialEndDate)"
            :aria-describedby="
              fieldErrors.trialEndDate ? 'trial-end-date-error' : undefined
            "
          >
          <span
            v-if="fieldErrors.trialEndDate"
            id="trial-end-date-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.trialEndDate }}
          </span>
        </label>

        <label
          v-if="isEducationalAccess"
          class="subscription-form__field subscription-form__field--educational-end"
        >
          <span>{{ t('form.fields.educationalEndDate') }}</span>
          <input
            ref="trialEndDateInput"
            v-model="form.trialEndDate"
            data-test="educational-end-date"
            type="date"
            :aria-invalid="Boolean(fieldErrors.trialEndDate)"
            :aria-describedby="
              fieldErrors.trialEndDate ? 'trial-end-date-error' : undefined
            "
          >
          <span
            v-if="fieldErrors.trialEndDate"
            id="trial-end-date-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.trialEndDate }}
          </span>
        </label>
      </div>

      <div class="subscription-form__actions">
        <BaseButton
          data-test="cancel-subscription-form"
          type="button"
          variant="secondary"
          :disabled="isSubmitting"
          @click="emitCancel"
        >
          {{ t('buttons.cancel') }}
        </BaseButton>
        <BaseButton
          data-test="save-subscription-form"
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
        >
          {{ submitButtonText }}
        </BaseButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.subscription-form-panel {
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-base);
}

.subscription-form-panel--embedded {
  overflow: visible;
  border: 0;
  background: transparent;
}

.subscription-form {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.subscription-form-panel--embedded .subscription-form {
  padding: 0;
}

.subscription-form__header {
  display: grid;
  gap: var(--space-2);
}

.subscription-form__group legend,
.subscription-form__field > label:first-child,
.subscription-form__field > span:first-child {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.subscription-form__eyebrow,
.subscription-form__header h2,
.subscription-form__error-summary,
.subscription-form__group {
  margin: 0;
}

.subscription-form__header h2 {
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-tight);
  letter-spacing: 0;
}

.subscription-form__error-summary {
  padding: var(--space-3);
  border: 1px solid var(--status-ended-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: var(--status-ended-surface);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.subscription-form__group {
  min-width: 0;
  padding: 0;
  border: 0;
}

.subscription-form__group legend {
  margin-bottom: var(--space-2);
}

.subscription-form__kind-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.375rem;
}

.subscription-form__kind-option {
  position: relative;
  display: grid;
  min-height: var(--control-height-lg);
  place-items: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--border-control);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background: var(--surface-control);
  font-weight: 800;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

.subscription-form__kind-option:hover {
  border-color: var(--border-strong);
  background: var(--surface-control-hover);
}

.subscription-form__kind-option:focus-within {
  outline: var(--focus-outline);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-ring);
}

.subscription-form__kind-option--selected {
  border-color: var(--border-focus);
  color: var(--text-primary);
  background: var(--status-active-surface);
}

.subscription-form__kind-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.subscription-form__kind-option span {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: center;
}

.subscription-form__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.625rem 0.75rem;
}

.subscription-form__field {
  display: grid;
  min-width: 0;
  gap: var(--space-2);
}

.subscription-form__field--service,
.subscription-form__field--catalog {
  grid-column: span 6;
}

.subscription-form__field--start,
.subscription-form__field--value,
.subscription-form__field--cycle,
.subscription-form__field--renewal,
.subscription-form__field--trial-end,
.subscription-form__field--educational-end {
  grid-column: span 3;
}

.subscription-form__field input[aria-invalid="true"],
.subscription-form__field select[aria-invalid="true"] {
  border-color: var(--border-danger);
}

.subscription-form__catalog-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);
}

.subscription-form__catalog-clear {
  min-height: var(--control-height-md);
  padding: 0 var(--space-3);
}

.subscription-form__catalog-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.subscription-form__catalog-suggestion-item {
  display: flex;
  max-width: 100%;
  min-width: 0;
}

.subscription-form__catalog-suggestion {
  display: inline-flex;
  min-height: var(--control-height-sm);
  max-width: 100%;
  min-width: 0;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 1px solid var(--status-info-border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  background: var(--status-info-surface);
  font-size: var(--font-size-sm);
  line-height: var(--line-tight);
  overflow-wrap: anywhere;
  text-align: left;
  white-space: normal;
}

.subscription-form__catalog-suggestion--selected {
  border-color: var(--status-active-border);
  color: var(--text-primary);
  background: var(--status-active-surface);
}

.subscription-form__catalog-swatch {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  flex: 0 0 auto;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--service-swatch-color, var(--text-accent));
}

.subscription-form__field-error {
  color: var(--status-ended);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.subscription-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-1);
}

@media (max-width: 700px) and (min-width: 641px) {
  .subscription-form__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .subscription-form__field--service,
  .subscription-form__field--catalog {
    grid-column: span 2;
  }

  .subscription-form__field--start,
  .subscription-form__field--value,
  .subscription-form__field--cycle,
  .subscription-form__field--renewal,
  .subscription-form__field--trial-end {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .subscription-form {
    padding: var(--space-4);
  }

  .subscription-form-panel--embedded .subscription-form {
    padding: 0;
  }

  .subscription-form__grid,
  .subscription-form__catalog-controls {
    grid-template-columns: 1fr;
  }

  .subscription-form__kind-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .subscription-form__field--service,
  .subscription-form__field--catalog,
  .subscription-form__field--start,
  .subscription-form__field--value,
  .subscription-form__field--cycle,
  .subscription-form__field--renewal,
  .subscription-form__field--trial-end {
    grid-column: auto;
  }

  .subscription-form__catalog-clear {
    width: 100%;
  }
}
</style>
