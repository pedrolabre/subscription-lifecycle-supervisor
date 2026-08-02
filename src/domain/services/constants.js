export const SERVICE_CATEGORIES = Object.freeze({
  VIDEO: 'video',
  MUSIC: 'music',
  DEVELOPMENT: 'development',
  PRODUCTIVITY: 'productivity',
  DESIGN: 'design',
  CLOUD: 'cloud',
  EDUCATION: 'education',
  GAMING: 'gaming',
  OTHER: 'other',
});

export const SERVICE_CATEGORY_VALUES = Object.freeze(
  Object.values(SERVICE_CATEGORIES),
);

export const SERVICE_BRAND_FALLBACK = Object.freeze({
  color: '#64748b',
  iconPath: '/assets/logos/service-fallback.svg',
});
