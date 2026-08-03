import {
  BILLING_CYCLES,
  BILLING_CYCLE_VALUES,
} from '../subscriptions/constants.js';
import { SERVICE_CATALOG } from './catalog.js';
import {
  normalizeServiceCategory,
  normalizeServiceColor,
  normalizeServiceDisplayName,
  normalizeServiceIconPath,
  normalizeServiceId,
  normalizeServiceText,
} from './normalization.js';

const serviceById = new Map(
  SERVICE_CATALOG.map((service) => [service.id, service]),
);

const serviceBySearchKey = createSearchIndex(SERVICE_CATALOG);

export function getServiceCatalog() {
  return SERVICE_CATALOG;
}

export function findServiceById(id) {
  return serviceById.get(normalizeServiceId(id)) ?? null;
}

export function findServiceByName(name) {
  const searchKey = normalizeServiceText(name);

  if (!searchKey) {
    return null;
  }

  return serviceBySearchKey.get(searchKey) ?? null;
}

export function findService(query) {
  return findServiceById(query) ?? findServiceByName(query);
}

export function searchServices(query, options = {}) {
  const searchKey = normalizeServiceText(query);
  const limit = normalizeSearchLimit(options.limit);

  if (!searchKey) {
    return [];
  }

  return SERVICE_CATALOG.filter((service) =>
    getServiceSearchKeys(service).some(
      (key) =>
        key === searchKey ||
        key.startsWith(searchKey) ||
        key.includes(searchKey),
    ),
  ).slice(0, limit);
}

export function createFreeformService(name, options = {}) {
  const displayName = normalizeServiceDisplayName(name);

  return Object.freeze({
    id: null,
    name: displayName || 'Servico sem nome',
    category: normalizeServiceCategory(options.category),
    color: normalizeServiceColor(options.color),
    iconPath: normalizeServiceIconPath(options.iconPath),
    aliases: Object.freeze([]),
    defaultBillingCycle: normalizeDefaultBillingCycle(options.defaultBillingCycle),
    isCustom: true,
  });
}

export function resolveService(query, options = {}) {
  return findService(query) ?? createFreeformService(query, options);
}

function createSearchIndex(catalog) {
  const index = new Map();

  for (const service of catalog) {
    for (const key of getServiceSearchKeys(service)) {
      if (key && !index.has(key)) {
        index.set(key, service);
      }
    }
  }

  return index;
}

function getServiceSearchKeys(service) {
  return [service.id, service.name, ...service.aliases].map(normalizeServiceText);
}

function normalizeSearchLimit(value) {
  const limit = Number(value);

  if (!Number.isInteger(limit) || limit <= 0) {
    return SERVICE_CATALOG.length;
  }

  return limit;
}

function normalizeDefaultBillingCycle(value) {
  const billingCycle = normalizeServiceText(value);

  return BILLING_CYCLE_VALUES.includes(billingCycle)
    ? billingCycle
    : BILLING_CYCLES.NONE;
}
