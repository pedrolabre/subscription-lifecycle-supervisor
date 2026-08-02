import {
  SERVICE_BRAND_FALLBACK,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_VALUES,
} from './constants.js';

export function normalizeServiceText(value) {
  return normalizeServiceDisplayName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeServiceDisplayName(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().replace(/\s+/g, ' ');
}

export function normalizeServiceId(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().toLowerCase();
}

export function normalizeServiceCategory(value) {
  const category = normalizeServiceText(value);

  return SERVICE_CATEGORY_VALUES.includes(category)
    ? category
    : SERVICE_CATEGORIES.OTHER;
}

export function normalizeServiceColor(value) {
  const color = normalizeServiceId(value);

  if (!color) {
    return SERVICE_BRAND_FALLBACK.color;
  }

  const colorWithHash = color.startsWith('#') ? color : `#${color}`;

  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(colorWithHash)
    ? colorWithHash
    : SERVICE_BRAND_FALLBACK.color;
}

export function normalizeServiceIconPath(value) {
  const iconPath = normalizeServiceDisplayName(value);

  return iconPath || SERVICE_BRAND_FALLBACK.iconPath;
}
