export function normalizeSubscriptionPayload(payload = {}, options = {}) {
  const source = isRecord(payload) ? payload : {};
  const locale = options?.locale ?? 'pt-BR';

  return {
    id: normalizeOptionalText(source.id),
    serviceName: normalizeRequiredText(source.serviceName),
    serviceId: normalizeOptionalText(source.serviceId),
    status: normalizeEnumText(source.status),
    type: normalizeEnumText(source.type),
    billingCycle: normalizeEnumText(source.billingCycle),
    price: normalizeSubscriptionPrice(source.price, locale),
    startDate: normalizeRequiredDate(source.startDate),
    renewalDate: normalizeOptionalDate(source.renewalDate),
    trialEndDate: normalizeOptionalDate(source.trialEndDate),
    icon: normalizeOptionalText(source.icon),
    brandColor: normalizeBrandColor(source.brandColor),
    category: normalizeOptionalText(source.category),
    cancellationUrl: normalizeOptionalText(source.cancellationUrl),
  };
}

export function normalizeSubscriptionPrice(value, locale = 'pt-BR') {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value).trim();

  if (!text) {
    return 0;
  }

  let cleaned = text;

  if (locale === 'en-US') {
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  const parsed = Number(cleaned);

  return parsed;
}

export function normalizeSubscriptionDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }

  const text = normalizeRequiredText(value);

  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    return text.slice(0, 10);
  }

  return text;
}

function normalizeRequiredText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeOptionalText(value) {
  const text = normalizeRequiredText(value);

  return text || null;
}

function normalizeEnumText(value) {
  return normalizeRequiredText(value).toLowerCase();
}

function normalizeRequiredDate(value) {
  return normalizeSubscriptionDate(value);
}

function normalizeOptionalDate(value) {
  const date = normalizeSubscriptionDate(value);

  return date || null;
}

function normalizeBrandColor(value) {
  const color = normalizeRequiredText(value).toLowerCase();

  if (!color) {
    return null;
  }

  return color.startsWith('#') ? color : `#${color}`;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
