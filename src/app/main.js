import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { initializeLocale } from '../shared/i18n/index.js';
import '../shared/styles/index.css';
import { initializeTheme } from '../shared/theme/index.js';

initializeTheme();
initializeLocale();

createApp(App).use(createPinia()).mount('#app');
