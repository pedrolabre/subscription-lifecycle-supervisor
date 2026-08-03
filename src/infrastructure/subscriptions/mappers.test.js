import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import { toSubscriptionDomain, toSubscriptionRecord } from './index.js';

describe('subscription persistence mappers', () => {
  it('maps a domain subscription to a persisted record', () => {
    const record = toSubscriptionRecord(
      {
        id: ' sub_1 ',
        serviceName: ' Spotify Premium ',
        serviceId: ' spotify ',
        status: ' ACTIVE ',
        type: ' PAID ',
        billingCycle: ' MONTHLY ',
        price: '29,90',
        startDate: '2026-08-01T10:30:00.000Z',
        renewalDate: new Date('2026-09-01T00:00:00.000Z'),
        trialEndDate: '',
        icon: ' /assets/logos/spotify.svg ',
        brandColor: '1DB954',
        category: ' music ',
      },
      {
        createdAt: '2026-08-03T12:00:00.000Z',
        updatedAt: '2026-08-03T12:30:00.000Z',
      },
    );

    expect(record).toEqual({
      id: 'sub_1',
      serviceName: 'Spotify Premium',
      serviceId: 'spotify',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: 29.9,
      startDate: '2026-08-01',
      renewalDate: '2026-09-01',
      trialEndDate: null,
      icon: '/assets/logos/spotify.svg',
      brandColor: '#1db954',
      category: 'music',
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T12:30:00.000Z',
    });
  });

  it('maps a persisted record back to the domain-facing shape', () => {
    const domainSubscription = toSubscriptionDomain({
      id: 'sub_2',
      serviceName: 'GitHub Student',
      serviceId: 'github-pro',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
      renewalDate: null,
      trialEndDate: null,
      icon: '/assets/logos/github.svg',
      brandColor: '#24292f',
      category: 'development',
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: new Date('2026-08-03T12:30:00.000Z'),
      persistedOnly: true,
    });

    expect(domainSubscription).toEqual({
      id: 'sub_2',
      serviceName: 'GitHub Student',
      serviceId: 'github-pro',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
      renewalDate: null,
      trialEndDate: null,
      icon: '/assets/logos/github.svg',
      brandColor: '#24292f',
      category: 'development',
      createdAt: '2026-08-03T12:00:00.000Z',
      updatedAt: '2026-08-03T12:30:00.000Z',
    });
  });
});
