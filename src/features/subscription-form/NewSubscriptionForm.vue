<script setup>
import { computed, reactive, ref, watch } from 'vue';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_FIELD_LIMITS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
  validateSubscriptionPayload,
} from '../../domain/subscriptions/index.js';
import { BaseButton } from '../../shared/components/index.js';

const ACCESS_KINDS = Object.freeze({
  PAID: 'paid',
  FREE: 'free',
  EDUCATIONAL: 'educational',
  TRIAL: 'trial',
});

const accessKindOptions = Object.freeze([
  {
    value: ACCESS_KINDS.PAID,
    label: 'Paga',
  },
  {
    value: ACCESS_KINDS.FREE,
    label: 'Gratuita',
  },
  {
    value: ACCESS_KINDS.EDUCATIONAL,
    label: 'Educacional',
  },
  {
    value: ACCESS_KINDS.TRIAL,
    label: 'Trial',
  },
]);

const paidBillingOptions = Object.freeze([
  {
    value: BILLING_CYCLES.MONTHLY,
    label: 'Mensal',
  },
  {
    value: BILLING_CYCLES.YEARLY,
    label: 'Anual',
  },
  {
    value: BILLING_CYCLES.LIFETIME,
    label: 'Vitalicio',
  },
]);

const props = defineProps({
  creationError: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['cancel', 'change', 'submit']);

const form = reactive({
  accessKind: ACCESS_KINDS.PAID,
  billingCycle: BILLING_CYCLES.MONTHLY,
  price: '',
  renewalDate: '',
  serviceName: '',
  startDate: '',
  trialEndDate: '',
});

const localFieldErrors = ref({});
const localFormError = ref('');

const isPaidAccess = computed(() => form.accessKind === ACCESS_KINDS.PAID);
const isTrialAccess = computed(() => form.accessKind === ACCESS_KINDS.TRIAL);
const requiresRenewalDate = computed(
  () =>
    isPaidAccess.value &&
    [BILLING_CYCLES.MONTHLY, BILLING_CYCLES.YEARLY].includes(
      form.billingCycle,
    ),
);

const externalFieldErrors = computed(() =>
  createFieldErrorMap(resolveCreationErrors(props.creationError)),
);

const fieldErrors = computed(() => ({
  ...localFieldErrors.value,
  ...externalFieldErrors.value,
}));

const formError = computed(
  () => localFormError.value || normalizeErrorMessage(props.creationError),
);

watch(
  form,
  () => {
    localFieldErrors.value = {};
    localFormError.value = '';
    emit('change');
  },
  { deep: true },
);

function submitForm() {
  if (props.isSubmitting) {
    return;
  }

  const validation = validateSubscriptionPayload(createSubscriptionPayload());

  if (!validation.isValid) {
    localFieldErrors.value = createFieldErrorMap(validation.errors);
    localFormError.value = 'Revise os campos destacados.';
    return;
  }

  localFieldErrors.value = {};
  localFormError.value = '';
  emit('submit', validation.value);
}

function emitCancel() {
  emit('cancel');
}

function createSubscriptionPayload() {
  const basePayload = {
    brandColor: null,
    category: null,
    icon: null,
    serviceId: null,
    serviceName: form.serviceName,
    startDate: form.startDate,
  };

  if (form.accessKind === ACCESS_KINDS.FREE) {
    return createNonPaidPayload(basePayload, SUBSCRIPTION_TYPES.FREE);
  }

  if (form.accessKind === ACCESS_KINDS.EDUCATIONAL) {
    return createNonPaidPayload(basePayload, SUBSCRIPTION_TYPES.EDUCATIONAL);
  }

  if (form.accessKind === ACCESS_KINDS.TRIAL) {
    return {
      ...basePayload,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      renewalDate: null,
      status: SUBSCRIPTION_STATUS.TRIAL,
      trialEndDate: form.trialEndDate,
      type: SUBSCRIPTION_TYPES.FREE,
    };
  }

  return {
    ...basePayload,
    billingCycle: form.billingCycle,
    price: form.price,
    renewalDate: requiresRenewalDate.value ? form.renewalDate : null,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndDate: null,
    type: SUBSCRIPTION_TYPES.PAID,
  };
}

function createNonPaidPayload(basePayload, type) {
  return {
    ...basePayload,
    billingCycle: BILLING_CYCLES.NONE,
    price: 0,
    renewalDate: null,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndDate: null,
    type,
  };
}

function createFieldErrorMap(errors) {
  return errors.reduce((result, error) => {
    const field = normalizeText(error?.field);
    const message = normalizeText(error?.message);

    if (field && message && !result[field]) {
      result[field] = message;
    }

    return result;
  }, {});
}

function resolveCreationErrors(error) {
  if (Array.isArray(error?.errors)) {
    return error.errors;
  }

  if (Array.isArray(error?.details?.errors)) {
    return error.details.errors;
  }

  return [];
}

function normalizeErrorMessage(error) {
  return normalizeText(error?.message);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}
</script>

<template>
  <section
    id="new-subscription-form"
    class="subscription-form-panel"
    aria-labelledby="new-subscription-title"
  >
    <form
      class="subscription-form"
      novalidate
      @submit.prevent="submitForm"
    >
      <div class="subscription-form__header">
        <p class="subscription-form__eyebrow">
          Cadastro local
        </p>
        <h2 id="new-subscription-title">
          Nova assinatura
        </h2>
      </div>

      <p
        v-if="formError"
        class="subscription-form__error-summary"
        role="alert"
      >
        {{ formError }}
      </p>

      <fieldset class="subscription-form__group subscription-form__group--kind">
        <legend>Tipo</legend>
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
        <label class="subscription-form__field">
          <span>Servico</span>
          <input
            v-model="form.serviceName"
            data-test="service-name"
            type="text"
            autocomplete="off"
            :maxlength="SUBSCRIPTION_FIELD_LIMITS.serviceNameMaxLength"
            :aria-invalid="Boolean(fieldErrors.serviceName)"
            :aria-describedby="
              fieldErrors.serviceName ? 'service-name-error' : undefined
            "
            placeholder="Nome livre"
          >
          <span
            v-if="fieldErrors.serviceName"
            id="service-name-error"
            class="subscription-form__field-error"
          >
            {{ fieldErrors.serviceName }}
          </span>
        </label>

        <label class="subscription-form__field">
          <span>Inicio</span>
          <input
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
          class="subscription-form__field"
        >
          <span>Valor</span>
          <input
            v-model="form.price"
            data-test="price"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="Boolean(fieldErrors.price)"
            :aria-describedby="fieldErrors.price ? 'price-error' : undefined"
            placeholder="0,00"
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
          class="subscription-form__field"
        >
          <span>Ciclo</span>
          <select
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
          class="subscription-form__field"
        >
          <span>Renovacao</span>
          <input
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
          class="subscription-form__field"
        >
          <span>Fim do trial</span>
          <input
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
      </div>

      <div class="subscription-form__actions">
        <BaseButton
          data-test="cancel-subscription-form"
          type="button"
          variant="secondary"
          :disabled="isSubmitting"
          @click="emitCancel"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          data-test="save-subscription-form"
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Salvando' : 'Salvar assinatura' }}
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

.subscription-form {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
}

.subscription-form__header {
  display: grid;
  gap: var(--space-2);
}

.subscription-form__eyebrow,
.subscription-form__group legend,
.subscription-form__field > span:first-child {
  color: var(--text-accent);
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
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
  gap: var(--space-2);
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

.subscription-form__kind-option--selected {
  border-color: var(--status-active-border);
  color: var(--text-primary);
  background: var(--status-active-surface);
}

.subscription-form__kind-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.subscription-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.subscription-form__field {
  display: grid;
  min-width: 0;
  gap: var(--space-2);
}

.subscription-form__field input[aria-invalid="true"],
.subscription-form__field select[aria-invalid="true"] {
  border-color: var(--border-danger);
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
}

@media (max-width: 700px) {
  .subscription-form {
    padding: var(--space-4);
  }

  .subscription-form__kind-options,
  .subscription-form__grid {
    grid-template-columns: 1fr;
  }

  .subscription-form__actions,
  .subscription-form__actions .base-button {
    width: 100%;
  }
}
</style>
