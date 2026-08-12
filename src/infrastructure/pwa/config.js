const APP_NAME = 'Subscription Lifecycle Supervisor';
const APP_DESCRIPTION =
  'Painel local-first para acompanhar assinaturas, planos gratuitos e trials.';

export const pwaIconPaths = {
  svg: '/assets/logos/logo.svg',
  icon192: '/icons/pwa-icon-192.png',
  icon512: '/icons/pwa-icon-512.png',
  maskable512: '/icons/pwa-maskable-512.png',
};

export const pwaManifest = {
  id: '/',
  name: APP_NAME,
  short_name: 'Supervisor',
  description: APP_DESCRIPTION,
  lang: 'pt-BR',
  dir: 'ltr',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  background_color: '#0b0d0c',
  theme_color: '#0b0d0c',
  categories: ['finance', 'productivity', 'utilities'],
  icons: [
    {
      src: pwaIconPaths.icon192,
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: pwaIconPaths.icon512,
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: pwaIconPaths.maskable512,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

export const pwaWorkbox = {
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  globPatterns: ['**/*.{js,css,html}'],
  navigateFallback: 'index.html',
  navigateFallbackDenylist: [/^\/assets\//, /^\/icons\//],
};

export const pwaPluginOptions = {
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  includeAssets: [pwaIconPaths.svg.slice(1)],
  manifest: pwaManifest,
  workbox: pwaWorkbox,
};
