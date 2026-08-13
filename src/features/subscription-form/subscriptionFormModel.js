import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import {
  createFreeformService,
  findServiceById,
  getServiceCatalog,
  normalizeServiceText,
} from '../../domain/services/index.js';

export const ACCESS_KINDS = Object.freeze({
  PAID: 'paid',
  FREE: 'free',
  EDUCATIONAL: 'educational',
  TRIAL: 'trial',
});

export const FORM_MODES = Object.freeze({
  CREATE: 'create',
  EDIT: 'edit',
});

export const accessKindValues = Object.freeze([
  ACCESS_KINDS.PAID,
  ACCESS_KINDS.FREE,
  ACCESS_KINDS.EDUCATIONAL,
  ACCESS_KINDS.TRIAL,
]);

export const paidBillingValues = Object.freeze([
  BILLING_CYCLES.MONTHLY,
  BILLING_CYCLES.YEARLY,
  BILLING_CYCLES.LIFETIME,
]);

export const serviceCatalog = getServiceCatalog();

export function createSubscriptionFormState() {
  return {
    accessKind: ACCESS_KINDS.PAID,
    billingCycle: BILLING_CYCLES.MONTHLY,
    price: '',
    renewalDate: '',
    serviceName: '',
    startDate: '',
    trialEndDate: '',
  };
}

export function resolveSubscriptionFormState({ locale, subscription }) {
  return {
    form: {
      accessKind: resolveAccessKind(subscription),
      billingCycle: resolveBillingCycle(subscription),
      price: formatEditablePrice(subscription?.price, locale),
      renewalDate: normalizeText(subscription?.renewalDate),
      serviceName: normalizeText(subscription?.serviceName),
      startDate: normalizeText(subscription?.startDate),
      trialEndDate: normalizeText(subscription?.trialEndDate),
    },
    selectedServiceId: resolveInitialServiceId(subscription),
  };
}

export function createSubscriptionPayload({
  form,
  hasClearedCatalogSelection,
  isEditing,
  requiresRenewalDate,
  selectedCatalogService,
  subscription,
}) {
  const basePayload = {
    ...createHiddenPayload({
      form,
      hasClearedCatalogSelection,
      isEditing,
      selectedCatalogService,
      subscription,
    }),
    serviceName: form.serviceName,
    startDate: form.startDate,
  };

  if (form.accessKind === ACCESS_KINDS.FREE) {
    return createNonPaidPayload(basePayload, SUBSCRIPTION_TYPES.FREE, {
      form,
      isEditing,
      subscription,
    });
  }

  if (form.accessKind === ACCESS_KINDS.EDUCATIONAL) {
    return {
      ...basePayload,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      renewalDate: null,
      status: resolvePayloadStatus({ form, isEditing, subscription }),
      trialEndDate: form.trialEndDate,
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
    };
  }

  if (form.accessKind === ACCESS_KINDS.TRIAL) {
    return {
      ...basePayload,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      renewalDate: null,
      status: resolvePayloadStatus({ form, isEditing, subscription }),
      trialEndDate: form.trialEndDate,
      type: SUBSCRIPTION_TYPES.FREE,
    };
  }

  return {
    ...basePayload,
    billingCycle: form.billingCycle,
    price: form.price,
    renewalDate: requiresRenewalDate ? form.renewalDate : null,
    status: resolvePayloadStatus({ form, isEditing, subscription }),
    trialEndDate: null,
    type: SUBSCRIPTION_TYPES.PAID,
  };
}

export function createFieldErrorMap(errors, translateValidationError) {
  return errors.reduce((result, error) => {
    const field = normalizeText(error?.field);
    const message = normalizeText(error?.message);
    const translatedMessage = translateValidationError(error);

    if (field && (translatedMessage || message) && !result[field]) {
      result[field] = translatedMessage || message;
    }

    return result;
  }, {});
}

export function resolveCreationErrors(error) {
  if (Array.isArray(error?.errors)) {
    return error.errors;
  }

  if (Array.isArray(error?.details?.errors)) {
    return error.details.errors;
  }

  return [];
}

export function normalizeErrorMessage(error) {
  return normalizeText(error?.message);
}

export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function createNonPaidPayload(basePayload, type, context) {
  return {
    ...basePayload,
    billingCycle: BILLING_CYCLES.NONE,
    price: 0,
    renewalDate: null,
    status: resolvePayloadStatus(context),
    trialEndDate: null,
    type,
  };
}

function createHiddenPayload({
  form,
  hasClearedCatalogSelection,
  isEditing,
  selectedCatalogService,
  subscription,
}) {
  if (selectedCatalogService) {
    return createServiceMetadataPayload(selectedCatalogService);
  }

  return createServiceMetadataPayload(
    createFreeformService(
      form.serviceName,
      createPreservedFreeformOptions({
        form,
        hasClearedCatalogSelection,
        isEditing,
        subscription,
      }),
    ),
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

function createPreservedFreeformOptions({
  form,
  hasClearedCatalogSelection,
  isEditing,
  subscription,
}) {
  if (
    !isEditing ||
    hasClearedCatalogSelection ||
    !hasUnchangedServiceName(form, subscription)
  ) {
    return {};
  }

  return {
    category: subscription?.category,
    color: subscription?.brandColor,
    iconPath: subscription?.icon,
  };
}

function resolvePayloadStatus({ form, isEditing, subscription }) {
  if (form.accessKind === ACCESS_KINDS.TRIAL) {
    return SUBSCRIPTION_STATUS.TRIAL;
  }

  if (isEditing) {
    const currentStatus = normalizeText(subscription?.status);

    if (
      currentStatus === SUBSCRIPTION_STATUS.ARCHIVED ||
      currentStatus === SUBSCRIPTION_STATUS.ENDED
    ) {
      return currentStatus;
    }
  }

  return SUBSCRIPTION_STATUS.ACTIVE;
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
    paidBillingValues.includes(subscription.billingCycle)
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

function hasUnchangedServiceName(form, subscription) {
  return (
    normalizeServiceText(form.serviceName) ===
    normalizeServiceText(subscription?.serviceName)
  );
}

function hasCatalogMetadata(subscription, service) {
  return (
    normalizeText(subscription?.brandColor).toLowerCase() === service.color ||
    normalizeText(subscription?.category) === service.category ||
    normalizeText(subscription?.icon) === service.iconPath
  );
}

function formatEditablePrice(value, locale) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const price = Number(value);
  const decimalSeparator = locale === 'en-US' ? '.' : ',';

  return Number.isFinite(price)
    ? String(price).replace('.', decimalSeparator)
    : '';
}
