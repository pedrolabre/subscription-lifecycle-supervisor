import { BILLING_CYCLES } from '../subscriptions/constants.js';
import { SERVICE_CATEGORIES } from './constants.js';

const catalogItems = [
  {
    id: 'spotify',
    name: 'Spotify',
    category: SERVICE_CATEGORIES.MUSIC,
    color: '#1db954',
    iconPath: 'https://cdn.simpleicons.org/spotify/1DB954',
    aliases: ['spotify premium', 'spotify individual'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#e50914',
    iconPath: 'https://cdn.simpleicons.org/netflix/E50914',
    aliases: ['netflix standard', 'netflix premium'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#00a8e1',
    iconPath: 'https://cdn.simpleicons.org/primevideo/00A8E1',
    aliases: ['prime video', 'prime', 'amazon prime video'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#113ccf',
    iconPath: 'https://cdn.simpleicons.org/disneyplus/113CCF',
    aliases: ['disney plus', 'star plus', 'disney premium'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: SERVICE_CATEGORIES.VIDEO,
    color: '#ff0033',
    iconPath: 'https://cdn.simpleicons.org/youtube/FF0033',
    aliases: ['youtube music', 'youtube sem anuncios', 'yt premium'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'apple-one',
    name: 'Apple One',
    category: SERVICE_CATEGORIES.PRODUCTIVITY,
    color: '#6e6e73',
    iconPath: 'https://cdn.simpleicons.org/apple/6E6E73',
    aliases: ['apple services', 'apple subscription'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'icloud-plus',
    name: 'iCloud+',
    category: SERVICE_CATEGORIES.CLOUD,
    color: '#147efb',
    iconPath: 'https://cdn.simpleicons.org/icloud/147EFB',
    aliases: ['icloud', 'icloud plus', 'apple icloud'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'google-one',
    name: 'Google One',
    category: SERVICE_CATEGORIES.CLOUD,
    color: '#4285f4',
    iconPath: 'https://cdn.simpleicons.org/google/4285F4',
    aliases: ['google storage', 'google drive storage', 'google cloud storage'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'github-pro',
    name: 'GitHub Pro',
    category: SERVICE_CATEGORIES.DEVELOPMENT,
    color: '#24292f',
    iconPath: 'https://cdn.simpleicons.org/github/24292F',
    aliases: ['github', 'github student', 'github copilot'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'figma',
    name: 'Figma',
    category: SERVICE_CATEGORIES.DESIGN,
    color: '#f24e1e',
    iconPath: 'https://cdn.simpleicons.org/figma/F24E1E',
    aliases: ['figma professional', 'figma design'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'notion',
    name: 'Notion',
    category: SERVICE_CATEGORIES.PRODUCTIVITY,
    color: '#191919',
    iconPath: 'https://cdn.simpleicons.org/notion/191919',
    aliases: ['notion plus', 'notion ai'],
    defaultBillingCycle: BILLING_CYCLES.MONTHLY,
  },
  {
    id: 'canva',
    name: 'Canva',
    category: SERVICE_CATEGORIES.DESIGN,
    color: '#00c4cc',
    iconPath: 'https://cdn.simpleicons.org/canva/00C4CC',
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
