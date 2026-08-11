import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  BILLING_CYCLE_VALUES,
  SUBSCRIPTION_ERROR_CODES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_VALUES,
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_TYPE_VALUES,
  normalizeSubscriptionPayload,
  normalizeSubscriptionPrice,
  validateSubscriptionPayload,
} from './index.js';

describe('subscription domain contract', () => {
  it('exposes stable status, type and billing cycle values', () => {
    expect(SUBSCRIPTION_STATUS_VALUES).toEqual([
      'active',
      'trial',
      'ended',
      'archived',
    ]);
    expect(SUBSCRIPTION_TYPE_VALUES).toEqual([
      'paid',
      'free',
      'educational',
    ]);
    expect(BILLING_CYCLE_VALUES).toEqual([
      'monthly',
      'yearly',
      'lifetime',
      'none',
    ]);
  });

  it('normalizes form-like payload values', () => {
    const normalized = normalizeSubscriptionPayload({
      id: ' sub_1 ',
      serviceName: ' Spotify ',
      serviceId: ' spotify ',
      status: ' ACTIVE ',
      type: ' PAID ',
      billingCycle: ' MONTHLY ',
      price: '29,90',
      startDate: '2026-08-01T10:30:00.000Z',
      renewalDate: new Date('2026-09-01T00:00:00.000Z'),
      trialEndDate: '',
      icon: ' /logos/spotify.svg ',
      brandColor: '1DB954',
      category: ' music ',
    });

    expect(normalized).toEqual({
      id: 'sub_1',
      serviceName: 'Spotify',
      serviceId: 'spotify',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: 29.9,
      startDate: '2026-08-01',
      renewalDate: '2026-09-01',
      trialEndDate: null,
      icon: '/logos/spotify.svg',
      brandColor: '#1db954',
      category: 'music',
    });
  });

  it('normalizes price strings from pt-BR and decimal formats', () => {
    expect(normalizeSubscriptionPrice('1.234,56')).toBe(1234.56);
    expect(normalizeSubscriptionPrice('29,90')).toBe(29.9);
    expect(normalizeSubscriptionPrice('1000')).toBe(1000);
    expect(normalizeSubscriptionPrice('29.90')).toBe(29.9);
  });

  it('accepts a valid recurring paid subscription', () => {
    const result = validateSubscriptionPayload({
      serviceName: 'Netflix',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: 39.9,
      startDate: '2026-08-01',
      renewalDate: '2026-09-01',
      brandColor: '#e50914',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.value.serviceName).toBe('Netflix');
  });

  it('accepts a free or educational subscription without billing', () => {
    const freeResult = validateSubscriptionPayload({
      serviceName: 'Canva Free',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
      price: '',
      startDate: '2026-08-01',
    });
    const educationalResult = validateSubscriptionPayload({
      serviceName: 'GitHub Student',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.EDUCATIONAL,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
    });

    expect(freeResult.isValid).toBe(true);
    expect(educationalResult.isValid).toBe(true);
  });

  it('requires the fields and enums that define the contract', () => {
    const result = validateSubscriptionPayload({
      serviceName: '   ',
      status: 'paused',
      type: 'enterprise',
      billingCycle: 'weekly',
      price: 'abc',
      startDate: '',
    });

    expect(getErrorCodes(result)).toEqual(
      expect.arrayContaining([
        SUBSCRIPTION_ERROR_CODES.SERVICE_NAME_REQUIRED,
        SUBSCRIPTION_ERROR_CODES.STATUS_INVALID,
        SUBSCRIPTION_ERROR_CODES.TYPE_INVALID,
        SUBSCRIPTION_ERROR_CODES.BILLING_CYCLE_INVALID,
        SUBSCRIPTION_ERROR_CODES.PRICE_INVALID,
        SUBSCRIPTION_ERROR_CODES.START_DATE_REQUIRED,
      ]),
    );
  });

  it('rejects non-object payloads', () => {
    const result = validateSubscriptionPayload(null);

    expect(result.isValid).toBe(false);
    expect(getErrorCodes(result)).toEqual([
      SUBSCRIPTION_ERROR_CODES.PAYLOAD_INVALID,
    ]);
  });

  it('rejects paid subscriptions without paid billing or non-negative price', () => {
    const result = validateSubscriptionPayload({
      serviceName: 'Paid without cycle',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.NONE,
      price: -1,
      startDate: '2026-08-01',
    });

    expect(getErrorCodes(result)).toEqual(
      expect.arrayContaining([
        SUBSCRIPTION_ERROR_CODES.PAID_BILLING_CYCLE_REQUIRED,
        SUBSCRIPTION_ERROR_CODES.PRICE_NEGATIVE,
      ]),
    );
  });

  it('rejects inconsistent billing, price, date and brand color values', () => {
    const result = validateSubscriptionPayload({
      serviceName: 'Free with charges',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: 10,
      startDate: '2026-02-30',
      renewalDate: '2026-13-01',
      brandColor: 'not-a-color',
    });

    expect(getErrorCodes(result)).toEqual(
      expect.arrayContaining([
        SUBSCRIPTION_ERROR_CODES.NON_PAID_BILLING_CYCLE_INVALID,
        SUBSCRIPTION_ERROR_CODES.NON_PAID_PRICE_INVALID,
        SUBSCRIPTION_ERROR_CODES.START_DATE_INVALID,
        SUBSCRIPTION_ERROR_CODES.RENEWAL_DATE_INVALID,
        SUBSCRIPTION_ERROR_CODES.BRAND_COLOR_INVALID,
      ]),
    );
  });

  it('requires renewal dates for recurring paid subscriptions', () => {
    const result = validateSubscriptionPayload({
      serviceName: 'Apple One',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.YEARLY,
      price: 299.9,
      startDate: '2026-08-01',
    });

    expect(getErrorCodes(result)).toContain(
      SUBSCRIPTION_ERROR_CODES.RENEWAL_DATE_REQUIRED,
    );
  });

  it('requires trial end dates for trial subscriptions', () => {
    const result = validateSubscriptionPayload({
      serviceName: 'Figma Trial',
      status: SUBSCRIPTION_STATUS.TRIAL,
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
    });

    expect(getErrorCodes(result)).toContain(
      SUBSCRIPTION_ERROR_CODES.TRIAL_END_DATE_REQUIRED,
    );
  });
});

function getErrorCodes(result) {
  return result.errors.map((error) => error.code);
}
