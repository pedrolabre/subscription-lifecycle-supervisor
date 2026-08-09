import { describe, expect, it } from 'vitest';
import {
  pwaIconPaths,
  pwaManifest,
  pwaPluginOptions,
  pwaWorkbox,
} from './config.js';

describe('pwa configuration', () => {
  it('defines an installable local-first manifest', () => {
    expect(pwaManifest).toEqual(
      expect.objectContaining({
        name: 'Subscription Lifecycle Supervisor',
        short_name: 'Supervisor',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        theme_color: '#0b0d0c',
        background_color: '#0b0d0c',
      }),
    );
    expect(pwaManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: pwaIconPaths.icon192,
          sizes: '192x192',
          type: 'image/png',
        }),
        expect.objectContaining({
          src: pwaIconPaths.icon512,
          sizes: '512x512',
          type: 'image/png',
        }),
        expect.objectContaining({
          src: pwaIconPaths.maskable512,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        }),
      ]),
    );
  });

  it('keeps service worker generation focused on the app shell', () => {
    expect(pwaPluginOptions).toEqual(
      expect.objectContaining({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: pwaManifest,
        workbox: pwaWorkbox,
      }),
    );
    expect(pwaPluginOptions.includeAssets).toEqual(['icons/app-icon.svg']);
    expect(pwaWorkbox).toEqual(
      expect.objectContaining({
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
      }),
    );
    expect(pwaWorkbox.globPatterns).toContain('**/*.{js,css,html}');
  });
});
