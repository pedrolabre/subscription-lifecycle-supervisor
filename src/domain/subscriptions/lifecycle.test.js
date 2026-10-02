import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
  TEMPORAL_STATUS,
} from './constants.js';
import {
  calculateNextCycle,
  canConvertTrial,
  canRenewSubscription,
  createTrialConversionPayload,
  evaluateTemporalStatus,
  isRenewalDueToday,
  isRenewalOverdue,
  isTrialExpired,
} from './lifecycle.js';

describe('domain subscription lifecycle', () => {
  const referenceDate = '2026-08-15';

  describe('isTrialExpired', () => {
    it('returns true when trial subscription has trialEndDate in the past', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.TRIAL,
        trialEndDate: '2026-08-14',
      };

      expect(isTrialExpired(sub, referenceDate)).toBe(true);
    });

    it('returns false when trial ends today or in the future', () => {
      expect(
        isTrialExpired(
          { status: SUBSCRIPTION_STATUS.TRIAL, trialEndDate: '2026-08-15' },
          referenceDate,
        ),
      ).toBe(false);

      expect(
        isTrialExpired(
          { status: SUBSCRIPTION_STATUS.TRIAL, trialEndDate: '2026-08-20' },
          referenceDate,
        ),
      ).toBe(false);
    });

    it('returns false for non-trial subscriptions even with past trialEndDate', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        trialEndDate: '2026-08-01',
      };

      expect(isTrialExpired(sub, referenceDate)).toBe(false);
    });
  });

  describe('isRenewalOverdue and isRenewalDueToday', () => {
    it('identifies overdue active subscriptions', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        renewalDate: '2026-08-10',
      };

      expect(isRenewalOverdue(sub, referenceDate)).toBe(true);
      expect(isRenewalDueToday(sub, referenceDate)).toBe(false);
    });

    it('identifies renewals due today', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        renewalDate: '2026-08-15',
      };

      expect(isRenewalOverdue(sub, referenceDate)).toBe(false);
      expect(isRenewalDueToday(sub, referenceDate)).toBe(true);
    });

    it('returns false for future renewals or inactive statuses', () => {
      const futureSub = {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        renewalDate: '2026-08-25',
      };

      expect(isRenewalOverdue(futureSub, referenceDate)).toBe(false);
      expect(isRenewalDueToday(futureSub, referenceDate)).toBe(false);

      const endedSub = {
        status: SUBSCRIPTION_STATUS.ENDED,
        renewalDate: '2026-08-10',
      };

      expect(isRenewalOverdue(endedSub, referenceDate)).toBe(false);
    });
  });

  describe('evaluateTemporalStatus', () => {
    it('returns TRIAL_EXPIRED for expired trials', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.TRIAL,
        trialEndDate: '2026-08-10',
      };

      expect(evaluateTemporalStatus(sub, referenceDate)).toBe(
        TEMPORAL_STATUS.TRIAL_EXPIRED,
      );
    });

    it('returns RENEWAL_OVERDUE for overdue renewals', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        renewalDate: '2026-08-10',
      };

      expect(evaluateTemporalStatus(sub, referenceDate)).toBe(
        TEMPORAL_STATUS.RENEWAL_OVERDUE,
      );
    });

    it('returns RENEWAL_DUE_TODAY for renewals on the reference date', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        renewalDate: '2026-08-15',
      };

      expect(evaluateTemporalStatus(sub, referenceDate)).toBe(
        TEMPORAL_STATUS.RENEWAL_DUE_TODAY,
      );
    });

    it('returns null for healthy future subscriptions or ended subscriptions', () => {
      const sub = {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        renewalDate: '2026-09-01',
      };

      expect(evaluateTemporalStatus(sub, referenceDate)).toBeNull();
    });
  });

  describe('canRenewSubscription and canConvertTrial', () => {
    it('allows renewal only for active subscriptions with recurring cycles and renewalDate', () => {
      expect(
        canRenewSubscription({
          id: 'sub_1',
          status: SUBSCRIPTION_STATUS.ACTIVE,
          billingCycle: BILLING_CYCLES.MONTHLY,
          renewalDate: '2026-08-15',
        }),
      ).toBe(true);

      expect(
        canRenewSubscription({
          id: 'sub_1',
          status: SUBSCRIPTION_STATUS.ACTIVE,
          billingCycle: BILLING_CYCLES.LIFETIME,
          renewalDate: '2026-08-15',
        }),
      ).toBe(false);

      expect(
        canRenewSubscription({
          id: 'sub_1',
          status: SUBSCRIPTION_STATUS.ARCHIVED,
          billingCycle: BILLING_CYCLES.MONTHLY,
          renewalDate: '2026-08-15',
        }),
      ).toBe(false);
    });

    it('allows conversion only for trial subscriptions', () => {
      expect(canConvertTrial({ id: 'sub_trial', status: SUBSCRIPTION_STATUS.TRIAL })).toBe(true);
      expect(canConvertTrial({ id: 'sub_active', status: SUBSCRIPTION_STATUS.ACTIVE })).toBe(false);
    });
  });

  describe('calculateNextCycle', () => {
    it('advances monthly cycle and generates history audit record', () => {
      const sub = {
        id: 'sub_spotify',
        serviceName: 'Spotify',
        status: SUBSCRIPTION_STATUS.ACTIVE,
        billingCycle: BILLING_CYCLES.MONTHLY,
        price: 29.9,
        renewalDate: '2026-08-15',
      };

      const result = calculateNextCycle(sub, new Date('2026-08-15T12:00:00.000Z'));

      expect(result.nextRenewalDate).toBe('2026-09-15');
      expect(result.historyRecord).toEqual({
        subscriptionId: 'sub_spotify',
        paidAt: '2026-08-15T12:00:00.000Z',
        billingCycle: BILLING_CYCLES.MONTHLY,
        amountCents: 2990,
      });
    });

    it('throws error when attempting to renew an invalid subscription', () => {
      expect(() =>
        calculateNextCycle({
          id: 'sub_none',
          status: SUBSCRIPTION_STATUS.ENDED,
        }),
      ).toThrow('Assinatura nao elegivel para renovacao de ciclo.');
    });
  });

  describe('createTrialConversionPayload', () => {
    it('creates an active paid subscription payload from a trial', () => {
      const trialSub = {
        id: 'sub_trial_1',
        serviceName: 'Notion',
        status: SUBSCRIPTION_STATUS.TRIAL,
        type: SUBSCRIPTION_TYPES.FREE,
        billingCycle: BILLING_CYCLES.NONE,
        price: 0,
        startDate: '2026-08-01',
        trialEndDate: '2026-08-15',
        cancellationUrl: 'https://www.notion.so/settings',
      };

      const payload = createTrialConversionPayload(trialSub, {
        billingCycle: BILLING_CYCLES.MONTHLY,
        price: 50,
        referenceDate: '2026-08-15',
        renewalDate: '2026-09-15',
      });

      expect(payload).toEqual({
        id: 'sub_trial_1',
        serviceName: 'Notion',
        status: SUBSCRIPTION_STATUS.ACTIVE,
        type: SUBSCRIPTION_TYPES.PAID,
        billingCycle: BILLING_CYCLES.MONTHLY,
        price: 50,
        startDate: '2026-08-01',
        renewalDate: '2026-09-15',
        trialEndDate: null,
        cancellationUrl: 'https://www.notion.so/settings',
      });
    });
  });
});
