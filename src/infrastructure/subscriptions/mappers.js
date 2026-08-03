import { normalizeSubscriptionPayload } from '../../domain/subscriptions/index.js';

export function toSubscriptionRecord(subscription, metadata = {}) {
  const normalized = normalizeSubscriptionPayload(subscription);

  return Object.freeze({
    id: normalizeOptionalText(metadata.id ?? normalized.id),
    serviceName: normalized.serviceName,
    serviceId: normalized.serviceId,
    status: normalized.status,
    type: normalized.type,
    billingCycle: normalized.billingCycle,
    price: normalized.price,
    startDate: normalized.startDate,
    renewalDate: normalized.renewalDate,
    trialEndDate: normalized.trialEndDate,
    icon: normalized.icon,
    brandColor: normalized.brandColor,
    category: normalized.category,
    createdAt: normalizeOptionalTimestamp(
      metadata.createdAt ?? subscription?.createdAt,
    ),
    updatedAt: normalizeOptionalTimestamp(
      metadata.updatedAt ?? subscription?.updatedAt,
    ),
  });
}

export function toSubscriptionDomain(record) {
  const normalized = normalizeSubscriptionPayload(record);

  return Object.freeze({
    ...normalized,
    createdAt: normalizeOptionalTimestamp(record?.createdAt),
    updatedAt: normalizeOptionalTimestamp(record?.updatedAt),
  });
}

export function normalizeSubscriptionTimestamp(value) {
  return normalizeOptionalTimestamp(value);
}

function normalizeOptionalText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

function normalizeOptionalTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}
