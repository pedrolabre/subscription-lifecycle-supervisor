import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaPluginOptions } from './src/infrastructure/pwa/config.js';

export default defineConfig({
  plugins: [vue(), VitePWA(pwaPluginOptions)],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
