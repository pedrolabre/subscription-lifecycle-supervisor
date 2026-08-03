import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('renders the operational product shell', () => {
    const wrapper = mount(App);

    expect(wrapper.text()).toContain('Subscription Lifecycle Supervisor');
    expect(wrapper.find('header[aria-labelledby="app-title"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('main[aria-label="Painel de assinaturas"]').exists(),
    ).toBe(true);
    expect(wrapper.get('#summary-title').text()).toBe('Ciclo atual');
    expect(wrapper.get('#subscriptions-title').text()).toBe('Lista local');
    expect(wrapper.get('button[type="button"]').text()).toBe('Nova assinatura');
  });
});
