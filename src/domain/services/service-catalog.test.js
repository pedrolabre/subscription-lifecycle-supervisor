import { describe, expect, it } from 'vitest';
import { BILLING_CYCLES } from '../subscriptions/index.js';
import {
  SERVICE_BRAND_FALLBACK,
  SERVICE_CATALOG,
  SERVICE_CATEGORIES,
  createFreeformService,
  findService,
  findServiceById,
  findServiceByName,
  getServiceCatalog,
  normalizeServiceText,
  resolveService,
  searchServices,
} from './index.js';

describe('service catalog domain', () => {
  it('exposes a small immutable catalog of known services', () => {
    const catalog = getServiceCatalog();
    const spotify = findServiceById('spotify');

    expect(catalog).toBe(SERVICE_CATALOG);
    expect(catalog).toHaveLength(12);
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(spotify)).toBe(true);
    expect(Object.isFrozen(spotify.aliases)).toBe(true);
    expect(spotify).toMatchObject({
      id: 'spotify',
      name: 'Spotify',
      category: SERVICE_CATEGORIES.MUSIC,
      color: '#1db954',
      iconPath: 'https://cdn.simpleicons.org/spotify/1DB954',
      defaultBillingCycle: BILLING_CYCLES.MONTHLY,
    });
  });

  it('looks up services by normalized id', () => {
    expect(findServiceById(' GITHUB-PRO ')?.name).toBe('GitHub Pro');
    expect(findServiceById('unknown-service')).toBeNull();
  });

  it('looks up services by name and aliases', () => {
    expect(findServiceByName(' youtube premium ')?.id).toBe('youtube-premium');
    expect(findService('Spotify Premium')?.id).toBe('spotify');
    expect(findService('youtube sem anuncios')?.id).toBe('youtube-premium');
  });

  it('normalizes text for case, accents, punctuation and spacing', () => {
    expect(normalizeServiceText('  YouTube   Premium!!! ')).toBe(
      'youtube premium',
    );
    expect(normalizeServiceText('GitHub-Pro')).toBe('github pro');
    expect(normalizeServiceText('Servi\u00e7o com acento')).toBe(
      'servico com acento',
    );
  });

  it('searches locally by partial name or alias without network data', () => {
    const premiumResults = searchServices('premium').map(
      (service) => service.id,
    );
    const storageResults = searchServices('storage', { limit: 1 }).map(
      (service) => service.id,
    );

    expect(premiumResults).toEqual(
      expect.arrayContaining(['spotify', 'netflix', 'youtube-premium']),
    );
    expect(storageResults).toEqual(['google-one']);
  });

  it('creates a freeform fallback service for unknown names', () => {
    const service = createFreeformService('  Minha assinatura  ', {
      color: 'ff00aa',
    });

    expect(service).toEqual({
      id: null,
      name: 'Minha assinatura',
      category: SERVICE_CATEGORIES.OTHER,
      color: '#ff00aa',
      iconPath: SERVICE_BRAND_FALLBACK.iconPath,
      aliases: [],
      defaultBillingCycle: BILLING_CYCLES.NONE,
      isCustom: true,
    });
    expect(Object.isFrozen(service)).toBe(true);
    expect(Object.isFrozen(service.aliases)).toBe(true);
  });

  it('resolves known aliases before falling back to a custom service', () => {
    const knownService = resolveService('prime video');
    const customService = resolveService('Servico de bairro');

    expect(knownService.id).toBe('amazon-prime');
    expect(customService).toMatchObject({
      id: null,
      name: 'Servico de bairro',
      category: SERVICE_CATEGORIES.OTHER,
      color: SERVICE_BRAND_FALLBACK.color,
      iconPath: SERVICE_BRAND_FALLBACK.iconPath,
      isCustom: true,
    });
  });
});
