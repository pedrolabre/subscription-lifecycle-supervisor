import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
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
    const wrapper = mountForm();

    await submitForm(wrapper);

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Revise os campos destacados.',
    );
    expect(wrapper.text()).toContain('Informe o nome do servico.');
    expect(wrapper.text()).toContain('Informe a data de inicio da assinatura.');
    expect(wrapper.text()).toContain('Informe a data de renovacao da assinatura.');
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
    expect(wrapper.text()).toContain('Informe o nome do servico.');
  });

  it('hydrates edit mode and emits an update payload with hidden metadata', async () => {
    const wrapper = mountForm({
      mode: 'edit',
      subscription: createSubscription({
        brandColor: '#1db954',
        category: 'music',
        icon: '/assets/logos/spotify.svg',
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

    await wrapper.get('[data-test="service-name"]').setValue('Spotify Duo');
    await wrapper.get('[data-test="price"]').setValue('35,50');
    await submitForm(wrapper);

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        brandColor: '#1db954',
        billingCycle: BILLING_CYCLES.MONTHLY,
        category: 'music',
        icon: '/assets/logos/spotify.svg',
        price: 35.5,
        renewalDate: '2026-09-01',
        serviceId: 'spotify',
        serviceName: 'Spotify Duo',
        status: SUBSCRIPTION_STATUS.ACTIVE,
        type: SUBSCRIPTION_TYPES.PAID,
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

function mountForm(props = {}) {
  return mount(NewSubscriptionForm, {
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
