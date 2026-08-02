import { BILLING_CYCLES } from '../subscriptions/constants.js';
import { SERVICE_CATEGORIES } from './constants.js';

const catalogItems = [
  {
    id: 'spotify',
    name: 'Spotify',
    category: SERVICE_CATEGORIES.MUSIC,
    color: '#1db954',
    iconPath: '/assets/logos/spotify.svg',
    aliases: ['spotify premium', 'spotify individual'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#e50914',
    iconPath: '/assets/logos/netflix.svg',
    aliases: ['netflix standard', 'netflix premium'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#00a8e1',
    iconPath: '/assets/logos/amazon-prime.svg',
    aliases: ['prime video', 'prime', 'amazon prime video'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#113ccf',
    iconPath: '/assets/logos/disney-plus.svg',
    aliases: ['disney plus', 'star plus', 'disney premium'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#ff0033',
    iconPath: '/assets/logos/youtube-premium.svg',
    aliases: ['youtube music', 'youtube sem anuncios', 'yt premium'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'apple-one',
    name: 'Apple One',
    category: SERVICE_CATEGORIES.PRODUCTIVITY,
    color: '#6e6e73',
    iconPath: '/assets/logos/apple-one.svg',
    aliases: ['apple services', 'apple subscription'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'icloud-plus',
    name: 'iCloud+',
    category: SERVICE_CATEGORIES.CLOUD,
    color: '#147efb',
    iconPath: '/assets/logos/icloud-plus.svg',
    aliases: ['icloud', 'icloud plus', 'apple icloud'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'google-one',
    name: 'Google One',
    category: SERVICE_CATEGORIES.CLOUD,
    color: '#4285f4',
    iconPath: '/assets/logos/google-one.svg',
    aliases: ['google storage', 'google drive storage', 'google cloud storage'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'github-pro',
    name: 'GitHub Pro',
    category: SERVICE_CATEGORIES.DEVELOPMENT,
    color: '#24292f',
    iconPath: '/assets/logos/github.svg',
    aliases: ['github', 'github student', 'github copilot'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'figma',
    name: 'Figma',
    category: SERVICE_CATEGORIES.DESIGN,
    color: '#f24e1e',
    iconPath: '/assets/logos/figma.svg',
    aliases: ['figma professional', 'figma design'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'notion',
    name: 'Notion',
    category: SERVICE_CATEGORIES.PRODUCTIVITY,
    color: '#191919',
    iconPath: '/assets/logos/notion.svg',
    aliases: ['notion plus', 'notion ai'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'canva',
    name: 'Canva',
    category: SERVICE_CATEGORIES.DESIGN,
    color: '#00c4cc',
    iconPath: '/assets/logos/canva.svg',
    aliases: ['canva pro', 'canva teams'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
];

export const SERVICE_CATALOG = deepFreezeCatalog(catalogItems);

function deepFreezeCatalog(items) {
  return Object.freeze(
    items.map((item) =>
      Object.freeze({
        ...item,
        aliases: Object.freeze([...item.aliases]),
      }),
    ),
  );
}
