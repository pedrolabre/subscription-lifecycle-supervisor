import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  BILLING_CYCLES,
  validateSubscriptionPayload,
} from '../../domain/subscriptions/index.js';
import {
  findServiceById,
  findServiceByName,
  searchServices,
} from '../../domain/services/index.js';
import {
  ACCESS_KINDS,
  FORM_MODES,
  accessKindValues,
  createFieldErrorMap,
  createSubscriptionFormState,
  createSubscriptionPayload,
  isRecord,
  normalizeErrorMessage,
  normalizeText,
  paidBillingValues,
  resolveCreationErrors,
  resolveSubscriptionFormState,
  serviceCatalog,
} from './subscriptionFormModel.js';

export function useSubscriptionForm({
  emit,
  locale,
  props,
  t,
  translateValidationError,
}) {
  const form = reactive(createSubscriptionFormState());

  const localValidationErrors = ref([]);
  const localFormErrorKey = ref('');
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
  const isEducationalAccess = computed(
    () => form.accessKind === ACCESS_KINDS.EDUCATIONAL,
  );
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
    createFieldErrorMap(
      resolveCreationErrors(resolvedSubmissionError.value),
      translateValidationError,
    ),
  );

  const fieldErrors = computed(() => ({
    ...createFieldErrorMap(localValidationErrors.value, translateValidationError),
    ...externalFieldErrors.value,
  }));

  const formError = computed(
    () =>
      (localFormErrorKey.value ? t(localFormErrorKey.value) : '') ||
      normalizeErrorMessage(resolvedSubmissionError.value),
  );

  const formTitle = computed(() =>
    isEditing.value ? t('dialog.editTitle') : t('dialog.createTitle'),
  );

  const formDescribedBy = computed(() =>
    formError.value ? 'subscription-form-error-summary' : undefined,
  );

  const submitButtonText = computed(() => {
    if (props.isSubmitting) {
      return isEditing.value
        ? t('form.submitEditBusy')
        : t('form.submitCreateBusy');
    }

    return isEditing.value ? t('form.submitEdit') : t('form.submitCreate');
  });

  const accessKindOptions = computed(() =>
    accessKindValues.map((value) => ({
      label: t(`form.accessKinds.${value}`),
      value,
    })),
  );

  const paidBillingOptions = computed(() =>
    paidBillingValues.map((value) => ({
      label: t(`billingCycles.${value}`),
      value,
    })),
  );

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
      localValidationErrors.value = [];
      localFormErrorKey.value = '';
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

    const validation = validateSubscriptionPayload(
      createSubscriptionPayload({
        form,
        hasClearedCatalogSelection: hasClearedCatalogSelection.value,
        isEditing: isEditing.value,
        requiresRenewalDate: requiresRenewalDate.value,
        selectedCatalogService: selectedCatalogService.value,
        subscription: props.subscription,
      }),
    );

    if (!validation.isValid) {
      localValidationErrors.value = validation.errors;
      localFormErrorKey.value = 'form.errors.fixHighlightedFields';
      focusFirstInvalidField(validation.errors);
      return;
    }

    localValidationErrors.value = [];
    localFormErrorKey.value = '';
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

  function resetForm() {
    const subscription = isEditing.value ? props.subscription : null;
    const nextState = resolveSubscriptionFormState({
      locale: locale.value,
      subscription,
    });

    Object.assign(form, nextState.form);
    selectedServiceId.value = nextState.selectedServiceId;
    hasClearedCatalogSelection.value = false;
    localValidationErrors.value = [];
    localFormErrorKey.value = '';
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

  function isSelectedService(service) {
    return service?.id === selectedServiceId.value;
  }

  return {
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
  };
}
