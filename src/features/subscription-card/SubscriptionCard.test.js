import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import SubscriptionCard from './SubscriptionCard.vue';

const referenceDate = new Date('2026-08-03T00:00:00.000Z');

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

  it('disables unavailable or globally blocked actions', () => {
    const archivedWrapper = mountCard({
      status: SUBSCRIPTION_STATUS.ARCHIVED,
    });
    const endedWrapper = mountCard({
      status: SUBSCRIPTION_STATUS.ENDED,
    });
    const blockedWrapper = mountCard({}, { actionsDisabled: true });

    expect(
      archivedWrapper.get('[data-test="archive-subscription"]').attributes(
        'disabled',
      ),
    ).toBeDefined();
    expect(
      archivedWrapper.get('[data-test="archive-subscription"]').attributes(
        'aria-label',
      ),
    ).toBe('Local Subscription ja esta arquivada');
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
