import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import SubscriptionCard from './SubscriptionCard.vue';

const referenceDate = '2026-08-03';

describe('SubscriptionCard', () => {
  it('renders status, value, cycle, renewal date and brand logo', () => {
    const wrapper = mountCard({
      brandColor: '#1db954',
      icon: '/assets/logos/spotify.svg',
      price: 29.9,
      renewalDate: '2026-09-01',
      serviceName: 'Spotify Premium',
    });

    expect(wrapper.text()).toContain('Spotify Premium');
    expect(wrapper.text()).toContain('Ativa');
    expect(wrapper.text()).toContain('29,90');
    expect(wrapper.text()).toContain('/ mes');
    expect(wrapper.text()).toContain('Renovacao');
    expect(wrapper.text()).toContain('01/09/2026');
    expect(wrapper.text()).toContain('em 29 dias');
    expect(wrapper.attributes('style')).toContain(
      '--subscription-brand-color: #1db954',
    );
    expect(wrapper.get('.subscription-card__logo').attributes('src')).toBe(
      '/assets/logos/spotify.svg',
    );
    expect(wrapper.get('.subscription-card__logo').attributes('alt')).toBe('');
    expect(wrapper.attributes('aria-labelledby')).toBe(
      'subscription-card-subscription-local-title subscription-card-subscription-local-status',
    );
    expect(wrapper.attributes('aria-describedby')).toContain(
      'subscription-card-subscription-local-price',
    );
    expect(
      wrapper.get('.subscription-card__actions').attributes('aria-label'),
    ).toBe('Acoes de Spotify Premium');
  });

  it('renders yearly paid subscriptions with the yearly cycle', () => {
    const wrapper = mountCard({
      billingCycle: BILLING_CYCLES.YEARLY,
      price: 238.8,
      renewalDate: '2027-01-10',
      serviceName: 'GitHub Pro',
    });

    expect(wrapper.text()).toContain('238,80');
    expect(wrapper.text()).toContain('/ ano');
  });

  it('renders a no-charge label for free subscriptions', () => {
    const wrapper = mountCard({
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      serviceName: 'Canva Free',
      type: SUBSCRIPTION_TYPES.FREE,
    });

    expect(wrapper.text()).toContain('Sem cobranca');
    expect(wrapper.text()).toContain('Gratuita');
  });

  it('uses brand color and text fallback when no usable logo is available', async () => {
    const wrapper = mountCard({
      brandColor: 'not-a-color',
      icon: '/assets/logos/missing.svg',
      serviceName: 'Local Tool',
    });

    await wrapper.get('.subscription-card__logo').trigger('error');

    expect(wrapper.text()).toContain('Local Tool');
    expect(wrapper.get('.subscription-card__brand-fallback').text()).toBe('L');
    expect(wrapper.attributes('style')).toContain(
      '--subscription-brand-color: #64748b',
    );
  });

  it('highlights trials ending soon using the existing date rule', () => {
    const wrapper = mountCard({
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      renewalDate: null,
      serviceName: 'Figma Education',
      status: SUBSCRIPTION_STATUS.TRIAL,
      trialEndDate: '2026-08-08',
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
    });

    expect(wrapper.classes()).toContain('subscription-card--trial-warning');
    expect(wrapper.text()).toContain('Trial perto do fim');
    expect(wrapper.text()).toContain('Fim do trial');
    expect(wrapper.text()).toContain('08/08/2026');
    expect(wrapper.text()).toContain('em 5 dias');
  });

  it('uses the enriched trial warning flag from the store when present', () => {
    const wrapper = mountCard({
      billingCycle: BILLING_CYCLES.NONE,
      isTrialEndingSoon: true,
      price: 0,
      renewalDate: null,
      serviceName: 'Design Trial',
      status: SUBSCRIPTION_STATUS.TRIAL,
      trialEndDate: '2026-09-20',
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
    });

    expect(wrapper.classes()).toContain('subscription-card--trial-warning');
    expect(wrapper.text()).toContain('Trial perto do fim');
  });

  it('emits card actions with the persisted subscription', async () => {
    const wrapper = mountCard({
      id: 'sub_spotify',
      serviceName: 'Spotify Premium',
    });

    await wrapper.get('[data-test="edit-subscription"]').trigger('click');
    await wrapper.get('[data-test="archive-subscription"]').trigger('click');
    await wrapper.get('[data-test="end-subscription"]').trigger('click');

    expect(wrapper.emitted('edit')?.[0]?.[0]).toMatchObject({
      id: 'sub_spotify',
      serviceName: 'Spotify Premium',
    });
    expect(wrapper.emitted('archive')?.[0]?.[0]).toMatchObject({
      id: 'sub_spotify',
    });
    expect(wrapper.emitted('end')?.[0]?.[0]).toMatchObject({
      id: 'sub_spotify',
    });
  });

  it('renders unarchive button for archived subscriptions and disables ended actions', () => {
    const archivedWrapper = mountCard({
      status: SUBSCRIPTION_STATUS.ARCHIVED,
    });
    const endedWrapper = mountCard({
      status: SUBSCRIPTION_STATUS.ENDED,
    });
    const blockedWrapper = mountCard({}, { actionsDisabled: true });

    expect(
      archivedWrapper.get('[data-test="archive-subscription"]').text(),
    ).toBe('Desarquivar');
    expect(
      archivedWrapper.get('[data-test="archive-subscription"]').attributes(
        'aria-label',
      ),
    ).toBe('Desarquivar Local Subscription');
    expect(
      archivedWrapper.get('[data-test="archive-subscription"]').attributes(
        'disabled',
      ),
    ).toBeUndefined();
    expect(
      endedWrapper.get('[data-test="end-subscription"]').attributes('disabled'),
    ).toBeDefined();
    expect(
      endedWrapper.get('[data-test="end-subscription"]').attributes(
        'aria-label',
      ),
    ).toBe('Local Subscription ja esta encerrada');
    expect(
      blockedWrapper.get('[data-test="edit-subscription"]').attributes(
        'disabled',
      ),
    ).toBeDefined();
  });

  it('renders 1-click renew button and emits renew event for active recurring subscriptions', async () => {
    const wrapper = mountCard({
      id: 'sub_netflix',
      serviceName: 'Netflix',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      billingCycle: BILLING_CYCLES.MONTHLY,
      renewalDate: '2026-08-15',
    });

    const renewBtn = wrapper.get('[data-test="renew-subscription"]');
    expect(renewBtn.text()).toBe('Renovar');
    expect(renewBtn.attributes('aria-label')).toBe('Renovar ciclo de Netflix');

    await renewBtn.trigger('click');
    expect(wrapper.emitted('renew')?.[0]?.[0]).toMatchObject({
      id: 'sub_netflix',
      serviceName: 'Netflix',
    });
  });

  it('renders guided assistant for expired trials and emits convert-trial action', async () => {
    const wrapper = mountCard({
      id: 'sub_trial_expired',
      serviceName: 'Figma Pro Trial',
      status: SUBSCRIPTION_STATUS.TRIAL,
      trialEndDate: '2026-08-01', // referenceDate is 2026-08-03, so it is expired
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
    });

    expect(wrapper.classes()).toContain('subscription-card--trial-expired');
    expect(wrapper.get('[data-test="trial-assistant"]')).toBeDefined();
    expect(wrapper.text()).toContain('Trial vencido');
    expect(wrapper.text()).toContain('Decisao necessaria');

    const convertBtn = wrapper.get('[data-test="convert-trial-subscription"]');
    expect(convertBtn.text()).toBe('Tornar Paga');
    await convertBtn.trigger('click');
    expect(wrapper.emitted('convert-trial')?.[0]?.[0]).toMatchObject({
      id: 'sub_trial_expired',
    });

    const endBtn = wrapper.get('[data-test="end-trial-subscription"]');
    expect(endBtn.text()).toBe('Encerrar');
    await endBtn.trigger('click');
    expect(wrapper.emitted('end')?.[0]?.[0]).toMatchObject({
      id: 'sub_trial_expired',
    });
  });

  it('renders safe cancellation link with target _blank and noopener noreferrer', () => {
    const wrapper = mountCard({
      cancellationUrl: 'https://www.spotify.com/account/overview/',
      serviceName: 'Spotify',
    });

    const link = wrapper.get('[data-test="cancellation-link"]');
    expect(link.attributes('href')).toBe('https://www.spotify.com/account/overview/');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(link.text()).toContain('Link de cancelamento');
  });
});

function mountCard(overrides = {}, props = {}) {
  return mount(SubscriptionCard, {
    props: {
      ...props,
      referenceDate,
      subscription: createSubscription(overrides),
    },
  });
}

function createSubscription(overrides = {}) {
  return {
    billingCycle: BILLING_CYCLES.MONTHLY,
    brandColor: '#64748b',
    icon: null,
    id: 'subscription-local',
    price: 19.9,
    renewalDate: '2026-09-01',
    serviceName: 'Local Subscription',
    startDate: '2026-01-01',
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndDate: null,
    type: SUBSCRIPTION_TYPES.PAID,
    ...overrides,
  };
}
