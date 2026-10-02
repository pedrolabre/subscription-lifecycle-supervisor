import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import {
  DEFAULT_TRIAL_WARNING_WINDOW_DAYS,
  calculateDaysRemaining,
  calculateNextRenewalDate,
  getTrialEndingSoonSubscriptions,
  isDateDueToday,
  isDateOverdue,
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

  it('evaluates whether a date is overdue or due today', () => {
    const today = '2026-08-15';

    expect(isDateOverdue('2026-08-14', today)).toBe(true);
    expect(isDateOverdue('2026-08-15', today)).toBe(false);
    expect(isDateOverdue('2026-08-16', today)).toBe(false);
    expect(isDateOverdue('invalid', today)).toBe(false);

    expect(isDateDueToday('2026-08-15', today)).toBe(true);
    expect(isDateDueToday('2026-08-14', today)).toBe(false);
    expect(isDateDueToday('2026-08-16', today)).toBe(false);
  });

  it('calculates the next monthly renewal date deterministically', () => {
    const today = '2026-08-15';

    expect(calculateNextRenewalDate('2026-08-15', BILLING_CYCLES.MONTHLY, today)).toBe('2026-09-15');
    expect(calculateNextRenewalDate('2026-12-10', BILLING_CYCLES.MONTHLY, today)).toBe('2027-01-10');
  });

  it('adjusts month-end dates correctly for February and shorter months', () => {
    // 31 de janeiro em ano comum -> 28 de fevereiro
    expect(calculateNextRenewalDate('2026-01-31', BILLING_CYCLES.MONTHLY, '2026-01-31')).toBe('2026-02-28');
    // 31 de janeiro em ano bissexto -> 29 de fevereiro
    expect(calculateNextRenewalDate('2024-01-31', BILLING_CYCLES.MONTHLY, '2024-01-31')).toBe('2024-02-29');
    // 31 de março -> 30 de abril
    expect(calculateNextRenewalDate('2026-03-31', BILLING_CYCLES.MONTHLY, '2026-03-31')).toBe('2026-04-30');
    // Preserva dia 31 após fevereiro
    expect(calculateNextRenewalDate('2026-01-31', BILLING_CYCLES.MONTHLY, '2026-02-28')).toBe('2026-03-31');
  });

  it('catches up overdue renewals to the next future cycle', () => {
    const today = '2026-08-15';

    // 3 meses em atraso (maio -> setembro)
    expect(calculateNextRenewalDate('2026-05-15', BILLING_CYCLES.MONTHLY, today)).toBe('2026-09-15');

    // Assinatura anual com 2 anos em atraso
    expect(calculateNextRenewalDate('2024-03-10', BILLING_CYCLES.YEARLY, today)).toBe('2027-03-10');
  });

  it('handles yearly renewals and leap year preservation', () => {
    // 29 de fevereiro em ano bissexto para ano comum
    expect(calculateNextRenewalDate('2024-02-29', BILLING_CYCLES.YEARLY, '2024-02-29')).toBe('2025-02-28');
    // Ano regular
    expect(calculateNextRenewalDate('2026-06-01', BILLING_CYCLES.YEARLY, '2026-06-01')).toBe('2027-06-01');
  });

  it('returns original base date for non-recurring cycles or invalid inputs', () => {
    expect(calculateNextRenewalDate('2026-08-15', BILLING_CYCLES.LIFETIME, '2026-08-15')).toBe('2026-08-15');
    expect(calculateNextRenewalDate('2026-08-15', BILLING_CYCLES.NONE, '2026-08-15')).toBe('2026-08-15');
    expect(calculateNextRenewalDate('invalid-date', BILLING_CYCLES.MONTHLY, '2026-08-15')).toBeNull();
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
