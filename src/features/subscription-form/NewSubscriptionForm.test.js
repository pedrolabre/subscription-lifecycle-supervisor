import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import {
  SERVICE_BRAND_FALLBACK,
  SERVICE_CATEGORIES,
} from '../../domain/services/index.js';
import NewSubscriptionForm from './NewSubscriptionForm.vue';

describe('NewSubscriptionForm', () => {
  it('emits a normalized recurring paid subscription payload', async () => {
    const wrapper = mountForm();

    await fillSharedFields(wrapper, {
      serviceName: ' Spotify Premium ',
      startDate: '2026-08-01',
    });
    await wrapper.get('[data-test="price"]').setValue('29,90');
    await wrapper
      .get('[data-test="billing-cycle"]')
      .setValue(BILLING_CYCLES.MONTHLY);
    await wrapper.get('[data-test="renewal-date"]').setValue('2026-09-01');

    await submitForm(wrapper);

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        billingCycle: BILLING_CYCLES.MONTHLY,
        price: 29.9,
        renewalDate: '2026-09-01',
        serviceName: 'Spotify Premium',
        startDate: '2026-08-01',
        status: SUBSCRIPTION_STATUS.ACTIVE,
        trialEndDate: null,
        type: SUBSCRIPTION_TYPES.PAID,
      }),
    );
  });

  it('selects a known catalog service and emits its persisted metadata', async () => {
    const wrapper = mountForm();

    await wrapper.get('[data-test="service-catalog-select"]').setValue('spotify');
    await wrapper.get('[data-test="start-date"]').setValue('2026-08-01');
    await wrapper.get('[data-test="price"]').setValue('29,90');
    await wrapper.get('[data-test="renewal-date"]').setValue('2026-09-01');
    await submitForm(wrapper);

    expect(wrapper.get('[data-test="service-name"]').element.value).toBe(
      'Spotify',
    );
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        brandColor: '#1db954',
        category: SERVICE_CATEGORIES.MUSIC,
        icon: 'https://cdn.simpleicons.org/spotify/1DB954',
        serviceId: 'spotify',
        serviceName: 'Spotify',
      }),
    );
  });

  it('uses local search suggestions by alias without losing filled fields', async () => {
    const wrapper = mountForm();

    await wrapper.get('[data-test="service-name"]').setValue('prime video');
    await wrapper.get('[data-test="start-date"]').setValue('2026-08-01');
    await wrapper.get('[data-test="price"]').setValue('19,90');
    await wrapper.get('[data-test="renewal-date"]').setValue('2026-09-01');

    const amazonPrimeSuggestion = wrapper
      .findAll('[data-test="service-catalog-suggestion"]')
      .find((suggestion) => suggestion.text().includes('Amazon Prime'));

    expect(amazonPrimeSuggestion).toBeDefined();
    expect(
      wrapper.get('.subscription-form__catalog-suggestions').element.tagName,
    ).toBe('UL');
    expect(amazonPrimeSuggestion.attributes('aria-label')).toBe(
      'Usar Amazon Prime do catalogo local',
    );

    await amazonPrimeSuggestion.trigger('click');
    await submitForm(wrapper);

    expect(wrapper.get('[data-test="service-name"]').element.value).toBe(
      'Amazon Prime',
    );
    expect(wrapper.get('[data-test="price"]').element.value).toBe('19,90');
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        brandColor: '#00a8e1',
        category: SERVICE_CATEGORIES.VIDEO,
        icon: 'https://cdn.simpleicons.org/primevideo/00A8E1',
        price: 19.9,
        renewalDate: '2026-09-01',
        serviceId: 'amazon-prime',
        serviceName: 'Amazon Prime',
        startDate: '2026-08-01',
      }),
    );
  });

  it('uses no-billing payloads for free and educational subscriptions', async () => {
    const freeWrapper = mountForm();

    await freeWrapper.get('[data-test="kind-free"]').setValue(true);
    await fillSharedFields(freeWrapper, {
      serviceName: 'Canva Free',
      startDate: '2026-08-01',
    });

    expect(freeWrapper.find('[data-test="price"]').exists()).toBe(false);
    expect(freeWrapper.find('[data-test="billing-cycle"]').exists()).toBe(false);
    expect(freeWrapper.find('[data-test="renewal-date"]').exists()).toBe(false);

    await submitForm(freeWrapper);

    expect(freeWrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      renewalDate: null,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      trialEndDate: null,
      type: SUBSCRIPTION_TYPES.FREE,
    });

    const educationalWrapper = mountForm();

    await educationalWrapper
      .get('[data-test="kind-educational"]')
      .setValue(true);
    await fillSharedFields(educationalWrapper, {
      serviceName: 'GitHub Student',
      startDate: '2026-08-01',
    });
    await submitForm(educationalWrapper);

    expect(educationalWrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
    });
  });

  it('shows trial fields and emits a trial subscription payload', async () => {
    const wrapper = mountForm();

    await wrapper.get('[data-test="kind-trial"]').setValue(true);
    await fillSharedFields(wrapper, {
      serviceName: 'Figma Trial',
      startDate: '2026-08-01',
    });
    await wrapper.get('[data-test="trial-end-date"]').setValue('2026-08-07');

    expect(wrapper.find('[data-test="price"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="trial-end-date"]').exists()).toBe(true);

    await submitForm(wrapper);

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        billingCycle: BILLING_CYCLES.NONE,
        price: 0,
        renewalDate: null,
        serviceName: 'Figma Trial',
        status: SUBSCRIPTION_STATUS.TRIAL,
        trialEndDate: '2026-08-07',
        type: SUBSCRIPTION_TYPES.FREE,
      }),
    );
  });

  it('uses domain validation messages before emitting submit', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const wrapper = mountForm({}, { attachTo: host });

    await submitForm(wrapper);
    await nextTick();

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Revise os campos destacados.',
    );
    expect(wrapper.get('form').attributes('aria-describedby')).toBe(
      'subscription-form-error-summary',
    );
    expect(wrapper.get('[data-test="service-name"]').attributes()).toEqual(
      expect.objectContaining({
        'aria-describedby': 'service-name-error',
        'aria-invalid': 'true',
      }),
    );
    expect(wrapper.text()).toContain('Informe o nome do servico.');
    expect(wrapper.text()).toContain('Informe a data de inicio da assinatura.');
    expect(wrapper.text()).toContain('Informe a data de renovacao da assinatura.');
    expect(document.activeElement).toBe(
      wrapper.get('[data-test="service-name"]').element,
    );

    wrapper.unmount();
    host.remove();
  });

  it('emits cancel without changing the form payload', async () => {
    const wrapper = mountForm();

    await wrapper.get('[data-test="cancel-subscription-form"]').trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('renders creation errors returned by the store layer', () => {
    const wrapper = mountForm({
      creationError: {
        message: 'Assinatura local invalida.',
        details: {
          errors: [
            {
              field: 'serviceName',
              message: 'Informe o nome do servico.',
            },
          ],
        },
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Assinatura local invalida.',
    );
    expect(wrapper.get('form').attributes('aria-describedby')).toBe(
      'subscription-form-error-summary',
    );
    expect(wrapper.text()).toContain('Informe o nome do servico.');
  });

  it('hydrates edit mode and emits an update payload with hidden metadata', async () => {
    const wrapper = mountForm({
      mode: 'edit',
      subscription: createSubscription({
        brandColor: '#1db954',
        category: 'music',
        icon: 'https://cdn.simpleicons.org/spotify/1DB954',
        serviceId: 'spotify',
        serviceName: 'Spotify Premium',
      }),
    });

    expect(wrapper.get('#new-subscription-title').text()).toBe(
      'Editar assinatura',
    );
    expect(wrapper.get('[data-test="service-name"]').element.value).toBe(
      'Spotify Premium',
    );
    expect(wrapper.get('[data-test="price"]').element.value).toBe('29,9');
    expect(wrapper.get('[data-test="service-catalog-select"]').element.value).toBe(
      'spotify',
    );

    await wrapper.get('[data-test="price"]').setValue('35,50');
    await submitForm(wrapper);

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        brandColor: '#1db954',
        billingCycle: BILLING_CYCLES.MONTHLY,
        category: 'music',
        icon: 'https://cdn.simpleicons.org/spotify/1DB954',
        price: 35.5,
        renewalDate: '2026-09-01',
        serviceId: 'spotify',
        serviceName: 'Spotify Premium',
        status: SUBSCRIPTION_STATUS.ACTIVE,
        type: SUBSCRIPTION_TYPES.PAID,
      }),
    );
  });

  it('clears catalog selection and keeps essential edited fields as freeform', async () => {
    const wrapper = mountForm({
      mode: 'edit',
      subscription: createSubscription({
        brandColor: '#1db954',
        category: SERVICE_CATEGORIES.MUSIC,
        icon: 'https://cdn.simpleicons.org/spotify/1DB954',
        serviceId: 'spotify',
        serviceName: 'Spotify Premium',
      }),
    });

    await wrapper.get('[data-test="clear-service-selection"]').trigger('click');
    await wrapper.get('[data-test="service-name"]').setValue('Minha assinatura');
    await wrapper.get('[data-test="price"]').setValue('35,50');
    await submitForm(wrapper);

    expect(wrapper.get('[data-test="service-catalog-select"]').element.value).toBe(
      '',
    );
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        brandColor: SERVICE_BRAND_FALLBACK.color,
        category: SERVICE_CATEGORIES.OTHER,
        icon: SERVICE_BRAND_FALLBACK.iconPath,
        price: 35.5,
        renewalDate: '2026-09-01',
        serviceId: null,
        serviceName: 'Minha assinatura',
        startDate: '2026-08-01',
      }),
    );
  });

  it('keeps archived or ended lifecycle status when editing details', async () => {
    const wrapper = mountForm({
      mode: 'edit',
      subscription: createSubscription({
        status: SUBSCRIPTION_STATUS.ARCHIVED,
      }),
    });

    await wrapper.get('[data-test="service-name"]').setValue('Spotify Family');
    await submitForm(wrapper);

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        serviceName: 'Spotify Family',
        status: SUBSCRIPTION_STATUS.ARCHIVED,
      }),
    );
  });
});

function mountForm(props = {}, options = {}) {
  return mount(NewSubscriptionForm, {
    ...options,
    props,
  });
}

async function fillSharedFields(wrapper, values) {
  await wrapper.get('[data-test="service-name"]').setValue(values.serviceName);
  await wrapper.get('[data-test="start-date"]').setValue(values.startDate);
}

function submitForm(wrapper) {
  return wrapper.get('form').trigger('submit');
}

function createSubscription(overrides = {}) {
  return {
    billingCycle: BILLING_CYCLES.MONTHLY,
    brandColor: null,
    category: null,
    icon: null,
    id: 'sub_spotify',
    price: 29.9,
    renewalDate: '2026-09-01',
    serviceId: null,
    serviceName: 'Spotify Premium',
    startDate: '2026-08-01',
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndDate: null,
    type: SUBSCRIPTION_TYPES.PAID,
    ...overrides,
  };
}
