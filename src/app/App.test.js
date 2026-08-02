import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('renders the product shell', () => {
    const wrapper = mount(App);

    expect(wrapper.text()).toContain('Subscription Lifecycle Supervisor');
    expect(wrapper.text()).toContain('Nenhuma assinatura cadastrada');
  });
});
