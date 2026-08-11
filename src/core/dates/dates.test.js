import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import {
  DEFAULT_TRIAL_WARNING_WINDOW_DAYS,
  calculateDaysRemaining,
  getTrialEndingSoonSubscriptions,
  isIsoDate,
  isTrialEndingSoon,
  parseIsoDate,
} from './index.js';

describe('date helpers', () => {
  it('validates ISO dates in YYYY-MM-DD format', () => {
    expect(isIsoDate('2026-08-01')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-8-1')).toBe(false);
    expect(isIsoDate(new Date('2026-08-01T00:00:00.000Z'))).toBe(false);
  });

  it('parses ISO dates at UTC midnight', () => {
    expect(parseIsoDate('2026-08-01')?.toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
    expect(parseIsoDate('invalid')).toBeNull();
  });

  it('calculates days remaining for past dates, today and future dates', () => {
    const today = '2026-08-01';

    expect(calculateDaysRemaining('2026-07-31', today)).toBe(-1);
    expect(calculateDaysRemaining('2026-08-01', today)).toBe(0);
    expect(calculateDaysRemaining('2026-08-08', today)).toBe(7);
    expect(calculateDaysRemaining('2026-08-09', today)).toBe(8);
  });

  it('uses local Date components instead of UTC conversion for late-night references', () => {
    const originalTimezone = process.env.TZ;

    process.env.TZ = 'America/Sao_Paulo';

    try {
      const lateNightReference = new Date(2026, 7, 1, 23, 30);

      expect(lateNightReference.toISOString().slice(0, 10)).toBe('2026-08-02');
      expect(calculateDaysRemaining('2026-08-01', lateNightReference)).toBe(0);
    } finally {
      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
  });

  it('returns null when either date is invalid', () => {
    expect(calculateDaysRemaining('2026-02-30', '2026-08-01')).toBeNull();
    expect(calculateDaysRemaining('2026-08-01', 'not-a-date')).toBeNull();
  });

  it('detects trial subscriptions ending in the default 7 day window', () => {
    const referenceDate = '2026-08-01';

    expect(
      isTrialEndingSoon(trial({ trialEndDate: '2026-08-01' }), {
        referenceDate,
      }),
    ).toBe(true);
    expect(
      isTrialEndingSoon(trial({ trialEndDate: '2026-08-08' }), {
        referenceDate,
      }),
    ).toBe(true);
    expect(
      isTrialEndingSoon(trial({ trialEndDate: '2026-08-09' }), {
        referenceDate,
      }),
    ).toBe(false);
    expect(DEFAULT_TRIAL_WARNING_WINDOW_DAYS).toBe(7);
  });

  it('excludes past, invalid and non-trial subscriptions from trial alerts', () => {
    const referenceDate = '2026-08-01';

    expect(
      isTrialEndingSoon(trial({ trialEndDate: '2026-07-31' }), {
        referenceDate,
      }),
    ).toBe(false);
    expect(
      isTrialEndingSoon(trial({ trialEndDate: 'invalid' }), {
        referenceDate,
      }),
    ).toBe(false);
    expect(
      isTrialEndingSoon(
        trial({
          status: SUBSCRIPTION_STATUS.ACTIVE,
          trialEndDate: '2026-08-05',
        }),
        { referenceDate },
      ),
    ).toBe(false);
  });

  it('supports configurable trial warning windows and filtering', () => {
    const subscriptions = [
      trial({ serviceName: 'Hoje', trialEndDate: '2026-08-01' }),
      trial({ serviceName: 'Cinco dias', trialEndDate: '2026-08-06' }),
      trial({ serviceName: 'Oito dias', trialEndDate: '2026-08-09' }),
    ];
    const options = { referenceDate: '2026-08-01', windowDays: 5 };

    expect(getTrialEndingSoonSubscriptions(subscriptions, options)).toEqual([
      subscriptions[0],
      subscriptions[1],
    ]);
    expect(
      isTrialEndingSoon(subscriptions[2], {
        referenceDate: '2026-08-01',
        windowDays: 8,
      }),
    ).toBe(true);
  });
});

function trial(overrides = {}) {
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
