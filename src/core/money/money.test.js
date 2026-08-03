import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../../domain/subscriptions/index.js';
import {
  calculateAnnualProjection,
  calculateAnnualProjectionFromMonthlyTotal,
  calculateNormalizedMonthlyCost,
  calculateNormalizedMonthlyTotal,
  centsToAmount,
  formatCurrency,
  roundToCents,
  toCents,
} from './index.js';

describe('money helpers', () => {
  it('rounds values to cents predictably', () => {
    expect(toCents(10.005)).toBe(1001);
    expect(centsToAmount(1001)).toBe(10.01);
    expect(roundToCents(12.994)).toBe(12.99);
    expect(roundToCents('29,90')).toBe(29.9);
  });

  it('formats currency with Intl.NumberFormat', () => {
    expect(formatCurrency(29.9)).toContain('R$');
    expect(formatCurrency(29.9)).toContain('29,90');
    expect(formatCurrency(29.9, { locale: 'en-US', currency: 'USD' })).toBe(
      '$29.90',
    );
  });

  it('normalizes monthly paid subscriptions into monthly totals', () => {
    const subscriptions = [
      subscription({
        price: 29.9,
        billingCycle: BILLING_CYCLES.MONTHLY,
      }),
      subscription({
        price: 299.9,
        billingCycle: BILLING_CYCLES.YEARLY,
      }),
    ];

    expect(calculateNormalizedMonthlyCost(subscriptions[0])).toBe(29.9);
    expect(calculateNormalizedMonthlyCost(subscriptions[1])).toBe(24.99);
    expect(calculateNormalizedMonthlyTotal(subscriptions)).toBe(54.89);
  });

  it('projects annual cost from the normalized monthly total', () => {
    const subscriptions = [
      subscription({
        price: 19.99,
        billingCycle: BILLING_CYCLES.MONTHLY,
      }),
      subscription({
        price: 119.99,
        billingCycle: BILLING_CYCLES.YEARLY,
      }),
    ];

    expect(calculateNormalizedMonthlyTotal(subscriptions)).toBe(29.99);
    expect(calculateAnnualProjection(subscriptions)).toBe(359.88);
    expect(calculateAnnualProjectionFromMonthlyTotal(29.99)).toBe(359.88);
  });

  it('ignores lifetime, free, educational, ended and archived subscriptions', () => {
    const subscriptions = [
      subscription({
        price: 500,
        billingCycle: BILLING_CYCLES.LIFETIME,
      }),
      subscription({
        type: SUBSCRIPTION_TYPES.FREE,
        price: 0,
        billingCycle: BILLING_CYCLES.NONE,
      }),
      subscription({
        type: SUBSCRIPTION_TYPES.EDUCATIONAL,
        price: 0,
        billingCycle: BILLING_CYCLES.NONE,
      }),
      subscription({
        status: SUBSCRIPTION_STATUS.ENDED,
        price: 29.9,
      }),
      subscription({
        status: SUBSCRIPTION_STATUS.ARCHIVED,
        price: 39.9,
      }),
    ];

    expect(calculateNormalizedMonthlyTotal(subscriptions)).toBe(0);
    expect(calculateAnnualProjection(subscriptions)).toBe(0);
  });

  it('keeps cent values stable when totals include fractional yearly months', () => {
    const subscriptions = [
      subscription({
        price: 19.995,
        billingCycle: BILLING_CYCLES.MONTHLY,
      }),
      subscription({
        price: 59.9,
        billingCycle: BILLING_CYCLES.YEARLY,
      }),
    ];

    expect(calculateNormalizedMonthlyCost(subscriptions[0])).toBe(20);
    expect(calculateNormalizedMonthlyCost(subscriptions[1])).toBe(4.99);
    expect(calculateNormalizedMonthlyTotal(subscriptions)).toBe(24.99);
  });
});

function subscription(overrides = {}) {
  return {
    serviceName: 'Servico',
    status: SUBSCRIPTION_STATUS.ACTIVE,
    type: SUBSCRIPTION_TYPES.PAID,
    billingCycle: BILLING_CYCLES.MONTHLY,
    price: 10,
    startDate: '2026-08-01',
    renewalDate: '2026-09-01',
    ...overrides,
  };
}
