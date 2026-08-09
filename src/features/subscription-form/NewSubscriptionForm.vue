<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_FIELD_LIMITS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
  validateSubscriptionPayload,
} from '../../domain/subscriptions/index.js';
import {
  createFreeformService,
  findServiceById,
  findServiceByName,
  getServiceCatalog,
  normalizeServiceText,
  searchServices,
} from '../../domain/services/index.js';
import { BaseButton } from '../../shared/components/index.js';

const ACCESS_KINDS = Object.freeze({
  PAID: 'paid',
  FREE: 'free',
  EDUCATIONAL: 'educational',
  TRIAL: 'trial',
});

const FORM_MODES = Object.freeze({
  CREATE: 'create',
  EDIT: 'edit',
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

const serviceCatalog = getServiceCatalog();

const props = defineProps({
  creationError: {
    type: Object,
    default: null,
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
const selectedServiceId = ref('');
const hasClearedCatalogSelection = ref(false);
const errorSummaryRef = ref(null);
const serviceNameInput = ref(null);
const startDateInput = ref(null);
const priceInput = ref(null);
const billingCycleSelect = ref(null);
const renewalDateInput = ref(null);
const trialEndDateInput = ref(null);

const fieldFocusTargets = {
  billingCycle: billingCycleSelect,
  price: priceInput,
  renewalDate: renewalDateInput,
  serviceName: serviceNameInput,
  startDate: startDateInput,
  trialEndDate: trialEndDateInput,
};

const isEditing = computed(
  () => props.mode === FORM_MODES.EDIT && isRecord(props.subscription),
);
const isPaidAccess = computed(() => form.accessKind === ACCESS_KINDS.PAID);
const isTrialAccess = computed(() => form.accessKind === ACCESS_KINDS.TRIAL);
const requiresRenewalDate = computed(
  () =>
    isPaidAccess.value &&
    [BILLING_CYCLES.MONTHLY, BILLING_CYCLES.YEARLY].includes(
      form.billingCycle,
    ),
);

const resolvedSubmissionError = computed(
  () => props.submissionError ?? props.creationError,
);

const externalFieldErrors = computed(() =>
  createFieldErrorMap(resolveCreationErrors(resolvedSubmissionError.value)),
);

const fieldErrors = computed(() => ({
  ...localFieldErrors.value,
  ...externalFieldErrors.value,
}));

const formError = computed(
  () =>
    localFormError.value || normalizeErrorMessage(resolvedSubmissionError.value),
);

const formEyebrow = computed(() =>
  isEditing.value ? 'Edicao local' : 'Cadastro local',
);

const formTitle = computed(() =>
  isEditing.value ? 'Editar assinatura' : 'Nova assinatura',
);

const formDescribedBy = computed(() =>
  formError.value ? 'subscription-form-error-summary' : undefined,
);

const submitButtonText = computed(() => {
  if (props.isSubmitting) {
    return isEditing.value ? 'Salvando edicao' : 'Salvando';
  }

  return isEditing.value ? 'Salvar edicao' : 'Salvar assinatura';
});

const selectedCatalogService = computed(() =>
  findServiceById(selectedServiceId.value),
);

const hasSelectedCatalogService = computed(() =>
  Boolean(selectedCatalogService.value),
);

const serviceSearchResults = computed(() =>
  searchServices(form.serviceName, { limit: 5 }),
);

watch(
  () => [props.mode, props.subscription],
  () => {
    resetForm();
  },
  { immediate: true },
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

watch(
  () => form.serviceName,
  (value) => {
    const selectedService = selectedCatalogService.value;

    if (!selectedService) {
      return;
    }

    const matchingService = findServiceByName(value);

    if (matchingService?.id !== selectedService.id) {
      selectedServiceId.value = '';
      hasClearedCatalogSelection.value = true;
    }
  },
);

onMounted(() => {
  nextTick(() => {
    serviceNameInput.value?.focus();
  });
});

function submitForm() {
  if (props.isSubmitting) {
    return;
  }

  const validation = validateSubscriptionPayload(createSubscriptionPayload());

  if (!validation.isValid) {
    localFieldErrors.value = createFieldErrorMap(validation.errors);
    localFormError.value = 'Revise os campos destacados.';
    focusFirstInvalidField(validation.errors);
    return;
  }

  localFieldErrors.value = {};
  localFormError.value = '';
  emit('submit', validation.value);
}

function emitCancel() {
  emit('cancel');
}

function focusFirstInvalidField(errors) {
  const firstInvalidField = errors
    .map((error) => normalizeText(error?.field))
    .find((field) => Boolean(fieldFocusTargets[field]?.value));

  nextTick(() => {
    const target = firstInvalidField
      ? fieldFocusTargets[firstInvalidField]?.value
      : null;

    (target ?? errorSummaryRef.value)?.focus?.();
  });
}

function createSubscriptionPayload() {
  const basePayload = {
    ...createHiddenPayload(),
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
      status: resolvePayloadStatus(),
      trialEndDate: form.trialEndDate,
      type: SUBSCRIPTION_TYPES.FREE,
    };
  }

  return {
    ...basePayload,
    billingCycle: form.billingCycle,
    price: form.price,
    renewalDate: requiresRenewalDate.value ? form.renewalDate : null,
    status: resolvePayloadStatus(),
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
    status: resolvePayloadStatus(),
    trialEndDate: null,
    type,
  };
}

function createHiddenPayload() {
  const catalogService = selectedCatalogService.value;

  if (catalogService) {
    return createServiceMetadataPayload(catalogService);
  }

  return createServiceMetadataPayload(
    createFreeformService(form.serviceName, createPreservedFreeformOptions()),
  );
}

function createServiceMetadataPayload(service) {
  return {
    brandColor: service.color ?? null,
    category: service.category ?? null,
    icon: service.iconPath ?? null,
    serviceId: service.id ?? null,
  };
}

function createPreservedFreeformOptions() {
  if (
    !isEditing.value ||
    hasClearedCatalogSelection.value ||
    !hasUnchangedServiceName()
  ) {
    return {};
  }

  return {
    category: props.subscription?.category,
    color: props.subscription?.brandColor,
    iconPath: props.subscription?.icon,
  };
}

function resolvePayloadStatus() {
  if (form.accessKind === ACCESS_KINDS.TRIAL) {
    return SUBSCRIPTION_STATUS.TRIAL;
  }

  if (isEditing.value) {
    const currentStatus = normalizeText(props.subscription?.status);

    if (
      currentStatus === SUBSCRIPTION_STATUS.ARCHIVED ||
      currentStatus === SUBSCRIPTION_STATUS.ENDED
    ) {
      return currentStatus;
    }
  }

  return SUBSCRIPTION_STATUS.ACTIVE;
}

function resetForm() {
  const subscription = isEditing.value ? props.subscription : null;

  form.accessKind = resolveAccessKind(subscription);
  form.billingCycle = resolveBillingCycle(subscription);
  form.price = formatEditablePrice(subscription?.price);
  form.renewalDate = normalizeText(subscription?.renewalDate);
  form.serviceName = normalizeText(subscription?.serviceName);
  form.startDate = normalizeText(subscription?.startDate);
  form.trialEndDate = normalizeText(subscription?.trialEndDate);
  selectedServiceId.value = resolveInitialServiceId(subscription);
  hasClearedCatalogSelection.value = false;
  localFieldErrors.value = {};
  localFormError.value = '';
}

function selectCatalogServiceId(serviceId) {
  const service = findServiceById(serviceId);

  if (!service) {
    clearCatalogSelection();
    return;
  }

  selectCatalogService(service);
}

function selectCatalogService(service) {
  if (!isRecord(service)) {
    return;
  }

  selectedServiceId.value = service.id;
  hasClearedCatalogSelection.value = false;
  form.serviceName = service.name;
}

function clearCatalogSelection() {
  selectedServiceId.value = '';
  hasClearedCatalogSelection.value = true;
}

function resolveAccessKind(subscription) {
  if (!isRecord(subscription)) {
    return ACCESS_KINDS.PAID;
  }

  if (subscription.status === SUBSCRIPTION_STATUS.TRIAL) {
    return ACCESS_KINDS.TRIAL;
  }

  if (subscription.type === SUBSCRIPTION_TYPES.FREE) {
    return ACCESS_KINDS.FREE;
  }

  if (subscription.type === SUBSCRIPTION_TYPES.EDUCATIONAL) {
    return ACCESS_KINDS.EDUCATIONAL;
  }

  return ACCESS_KINDS.PAID;
}

function resolveBillingCycle(subscription) {
  if (
    isRecord(subscription) &&
    paidBillingOptions.some((option) => option.value === subscription.billingCycle)
  ) {
    return subscription.billingCycle;
  }

  return BILLING_CYCLES.MONTHLY;
}

function resolveInitialServiceId(subscription) {
  const service = findServiceById(subscription?.serviceId);

  if (!service || !hasCatalogMetadata(subscription, service)) {
    return '';
  }

  return service.id;
}

function isSelectedService(service) {
  return service?.id === selectedServiceId.value;
}

function hasUnchangedServiceName() {
  return (
    normalizeServiceText(form.serviceName) ===
    normalizeServiceText(props.subscription?.serviceName)
  );
}

function hasCatalogMetadata(subscription, service) {
  return (
    normalizeText(subscription?.brandColor).toLowerCase() === service.color ||
    normalizeText(subscription?.category) === service.category ||
    normalizeText(subscription?.icon) === service.iconPath
  );
}

function formatEditablePrice(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const price = Number(value);

  return Number.isFinite(price) ? String(price).replace('.', ',') : '';
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

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
      aria-labelledby="new-subscription-title"
      :aria-busy="isSubmitting"
      :aria-describedby="formDescribedBy"
      @submit.prevent="submitForm"
    >
      <div class="subscription-form__header">
        <p class="subscription-form__eyebrow">
          {{ formEyebrow }}
        </p>
        <h2 id="new-subscription-title">
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
        <div class="subscription-form__field subscription-form__field--service">
          <label for="subscription-service-name">
            Servico
          </label>
          <input
            id="subscription-service-name"
            ref="serviceNameInput"
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

          <div class="subscription-form__catalog-row">
            <label class="subscription-form__catalog-select">
              <span>Catalogo</span>
              <select
                id="subscription-service-catalog"
                data-test="service-catalog-select"
                :value="selectedServiceId"
                @change="selectCatalogServiceId($event.target.value)"
              >
                <option value="">
                  Nome livre
                </option>
                <option
                  v-for="service in serviceCatalog"
                  :key="service.id"
                  :value="service.id"
                >
                  {{ service.name }}
                </option>
              </select>
            </label>

            <BaseButton
              v-if="hasSelectedCatalogService"
              class="subscription-form__catalog-clear"
              data-test="clear-service-selection"
              type="button"
              variant="secondary"
              :aria-label="`Limpar selecao de ${selectedCatalogService.name}`"
              :disabled="isSubmitting"
              @click="clearCatalogSelection"
            >
              Limpar
            </BaseButton>
          </div>

          <ul
            v-if="serviceSearchResults.length"
            class="subscription-form__catalog-suggestions"
            aria-label="Servicos encontrados"
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
                :aria-label="`Usar ${service.name} do catalogo local`"
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

        <label class="subscription-form__field">
          <span>Inicio</span>
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
          class="subscription-form__field"
        >
          <span>Valor</span>
          <input
            ref="priceInput"
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
          class="subscription-form__field"
        >
          <span>Renovacao</span>
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
          class="subscription-form__field"
        >
          <span>Fim do trial</span>
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
.subscription-form__field > label:first-child,
.subscription-form__catalog-select > span:first-child,
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

.subscription-form__kind-option:focus-within {
  outline: var(--focus-outline);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-ring);
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

.subscription-form__kind-option span {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: center;
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

.subscription-form__field--service {
  grid-column: 1 / -1;
}

.subscription-form__field input[aria-invalid="true"],
.subscription-form__field select[aria-invalid="true"] {
  border-color: var(--border-danger);
}

.subscription-form__catalog-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: end;
}

.subscription-form__catalog-select {
  display: grid;
  min-width: 0;
  gap: var(--space-2);
}

.subscription-form__catalog-clear {
  min-height: var(--control-height-md);
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
  border-color: var(--status-info-border);
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
}

@media (max-width: 700px) {
  .subscription-form {
    padding: var(--space-4);
  }

  .subscription-form__kind-options,
  .subscription-form__grid,
  .subscription-form__catalog-row {
    grid-template-columns: 1fr;
  }

  .subscription-form__actions,
  .subscription-form__actions .base-button,
  .subscription-form__catalog-clear {
    width: 100%;
  }
}
</style>
