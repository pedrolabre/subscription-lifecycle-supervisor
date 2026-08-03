import { describe, expect, it } from 'vitest';
import {
  SERVICE_BRAND_FALLBACK,
  SERVICE_CATEGORIES,
} from '../services/index.js';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_ERROR_CODES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
  summarizeSubscriptions,
} from './index.js';

describe('subscription domain summary integration', () => {
  it('derives totals, status counters and trial alerts together', () => {
    const summary = summarizeSubscriptions(createSubscriptions(), {
      referenceDate: '2026-08-01',
    });

    expect(summary.totalCount).toBe(9);
    expect(summary.invalidCount).toBe(0);
    expect(summary.monthlyTotal).toBe(39.9);
    expect(summary.yearlyProjection).toBe(478.8);
    expect(summary.countsByStatus).toEqual({
      [SUBSCRIPTION_STATUS.ACTIVE]: 5,
      [SUBSCRIPTION_STATUS.TRIAL]: 2,
      [SUBSCRIPTION_STATUS.ENDED]: 1,
      [SUBSCRIPTION_STATUS.ARCHIVED]: 1,
    });
    expect(summary.activeCount).toBe(5);
    expect(summary.trialCount).toBe(2);
    expect(summary.endedCount).toBe(1);
    expect(summary.archivedCount).toBe(1);

    expect(summary.trialAlerts).toHaveLength(1);
    expect(summary.trialAlerts[0]).toMatchObject({
      serviceName: 'Figma',
      serviceId: 'figma',
      daysUntilTrialEnd: 4,
      monthlyCost: 0,
      isTrialEndingSoon: true,
    });
  });

  it('resolves known catalog services and freeform fallback identity', () => {
    const summary = summarizeSubscriptions(createSubscriptions(), {
      referenceDate: '2026-08-01',
    });
    const spotify = summary.items.find(
      (item) => item.serviceName === 'Spotify Premium',
    );
    const github = summary.items.find(
      (item) => item.serviceName === 'GitHub Student',
    );
    const custom = summary.items.find(
      (item) => item.serviceName === 'Servico de bairro',
    );

    expect(spotify).toMatchObject({
      serviceId: 'spotify',
      category: SERVICE_CATEGORIES.MUSIC,
      brandColor: '#1db954',
      icon: '/assets/logos/spotify.svg',
      monthlyCost: 29.9,
    });
    expect(github).toMatchObject({
      serviceId: 'github-pro',
      category: SERVICE_CATEGORIES.DEVELOPMENT,
      brandColor: '#24292f',
      icon: '/assets/logos/github.svg',
      monthlyCost: 0,
    });
    expect(custom).toMatchObject({
      serviceId: null,
      category: SERVICE_CATEGORIES.OTHER,
      brandColor: SERVICE_BRAND_FALLBACK.color,
      icon: SERVICE_BRAND_FALLBACK.iconPath,
      monthlyCost: 0,
      service: {
        id: null,
        name: 'Servico de bairro',
        isCustom: true,
      },
    });
  });

  it('keeps non-billable records out of costs without dropping counters', () => {
    const summary = summarizeSubscriptions(createSubscriptions(), {
      referenceDate: '2026-08-01',
    });

    expect(
      summary.items
        .filter((item) =>
          [
            'Canva',
            'GitHub Student',
            'Servico de bairro',
            'Apple One',
            'Netflix',
            'Amazon Prime',
          ].includes(item.serviceName),
        )
        .every((item) => item.monthlyCost === 0),
    ).toBe(true);
    expect(summary.totalCount).toBe(9);
    expect(summary.monthlyTotal).toBe(39.9);
  });

  it('ignores invalid records and exposes their contract errors', () => {
    const summary = summarizeSubscriptions(
      [
        paidSubscription(),
        null,
        paidSubscription({
          serviceName: '',
          price: -10,
          startDate: '2026-02-30',
        }),
      ],
      { referenceDate: '2026-08-01' },
    );

    expect(summary.totalCount).toBe(1);
    expect(summary.invalidCount).toBe(2);
    expect(summary.monthlyTotal).toBe(29.9);
    expect(summary.invalidSubscriptions[0]).toMatchObject({
      index: 1,
      errors: [
        expect.objectContaining({
          code: SUBSCRIPTION_ERROR_CODES.PAYLOAD_INVALID,
        }),
      ],
    });
    expect(summary.invalidSubscriptions[1].errors.map((error) => error.code))
      .toEqual(
        expect.arrayContaining([
          SUBSCRIPTION_ERROR_CODES.SERVICE_NAME_REQUIRED,
          SUBSCRIPTION_ERROR_CODES.PRICE_NEGATIVE,
          SUBSCRIPTION_ERROR_CODES.START_DATE_INVALID,
        ]),
      );
  });
});

function createSubscriptions() {
  return [
    paidSubscription({
      serviceName: 'Spotify Premium',
      serviceId: 'spotify',
      price: 29.9,
    }),
    paidSubscription({
      serviceName: 'GitHub Student',
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      renewalDate: null,
    }),
    paidSubscription({
      serviceName: 'Google One',
      price: 120,
      billingCycle: BILLING_CYCLES.YEARLY,
      renewalDate: '2027-08-01',
    }),
    trialSubscription({
      serviceName: 'Figma',
      serviceId: 'figma',
      trialEndDate: '2026-08-05',
    }),
    trialSubscription({
      serviceName: 'Canva',
      serviceId: 'canva',
      trialEndDate: '2026-08-15',
    }),
    paidSubscription({
      serviceName: 'Servico de bairro',
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      renewalDate: null,
    }),
    paidSubscription({
      serviceName: 'Apple One',
      billingCycle: BILLING_CYCLES.LIFETIME,
      price: 500,
      renewalDate: null,
    }),
    paidSubscription({
      serviceName: 'Netflix',
      status: SUBSCRIPTION_STATUS.ENDED,
      price: 59.9,
    }),
    paidSubscription({
      serviceName: 'Amazon Prime',
      status: SUBSCRIPTION_STATUS.ARCHIVED,
      price: 199,
      billingCycle: BILLING_CYCLES.YEARLY,
      renewalDate: '2027-08-01',
    }),
  ];
}

function paidSubscription(overrides = {}) {
  return {
    serviceName: 'Spotify Premium',
    status: SUBSCRIPTION_STATUS.ACTIVE,
    type: SUBSCRIPTION_TYPES.PAID,
    billingCycle: BILLING_CYCLES.MONTHLY,
    price: 29.9,
    startDate: '2026-08-01',
    renewalDate: '2026-09-01',
    ...overrides,
  };
}

function trialSubscription(overrides = {}) {
  return {
    serviceName: 'Trial',
    status: SUBSCRIPTION_STATUS.TRIAL,
    type: SUBSCRIPTION_TYPES.FREE,
    billingCycle: BILLING_CYCLES.NONE,
    price: 0,
    startDate: '2026-08-01',
    trialEndDate: '2026-08-08',
    ...overrides,
  };
}
