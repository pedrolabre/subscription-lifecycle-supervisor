import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../subscriptions/constants.js';
import {
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  createBackupPayload,
  serializeBackupToJson,
  validateBackupPayload,
} from './serializer.js';

describe('backup serializer & schema guard', () => {
  const sampleSubscriptions = [
    {
      id: 'sub-spotify',
      serviceName: 'Spotify Premium',
      serviceId: 'spotify',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: 29.9,
      startDate: '2026-01-10',
      renewalDate: '2026-08-10',
      brandColor: '#1db954',
      category: 'streaming',
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'sub-prime',
      serviceName: 'Amazon Prime',
      serviceId: 'amazon-prime',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.YEARLY,
      price: 199.0,
      startDate: '2025-08-01',
      renewalDate: '2026-08-01',
      brandColor: '#00a8e1',
      category: 'streaming',
      createdAt: '2025-08-01T10:00:00.000Z',
      updatedAt: '2025-08-01T10:00:00.000Z',
    },
    {
      id: 'sub-figma',
      serviceName: 'Figma Trial',
      serviceId: 'figma',
      status: SUBSCRIPTION_STATUS.TRIAL,
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
      renewalDate: null,
      trialEndDate: '2026-08-15',
      brandColor: '#f24e1e',
      category: 'design',
    },
  ];

  it('creates valid v1.0.0 backup payload with metadata and settings', () => {
    const fixedDate = new Date('2026-08-05T12:00:00.000Z');
    const payload = createBackupPayload(
      sampleSubscriptions,
      { theme: 'light', locale: 'en-US', currency: 'USD' },
      { now: () => fixedDate },
    );

    expect(payload).toMatchObject({
      schemaVersion: BACKUP_SCHEMA_VERSION,
      app: BACKUP_APP_ID,
      exportedAt: '2026-08-05T12:00:00.000Z',
      meta: {
        totalSubscriptions: 3,
        activeCount: 2,
        monthlyTotalCents: 4648, // 29.90 (2990) + 199/12 (1658) = 4648
      },
      settings: {
        theme: 'light',
        locale: 'en-US',
        currency: 'USD',
      },
    });

    expect(payload.subscriptions).toHaveLength(3);
    expect(payload.subscriptions[0].id).toBe('sub-spotify');
  });

  it('serializes payload to formatted JSON and deserializes back safely', () => {
    const payload = createBackupPayload(sampleSubscriptions);
    const jsonString = serializeBackupToJson(payload);

    expect(typeof jsonString).toBe('string');
    expect(jsonString).toContain(`"schemaVersion": "${BACKUP_SCHEMA_VERSION}"`);
    expect(jsonString).toContain(`"app": "${BACKUP_APP_ID}"`);

    const result = validateBackupPayload(jsonString);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data.subscriptions).toHaveLength(3);
  });

  it('rejects malformed non-JSON strings', () => {
    const result = validateBackupPayload('{ corrupt-json-content: 123 ');

    expect(result.isValid).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors[0]).toContain('não é um JSON válido');
  });

  it('rejects objects that are not from this app or have wrong schema version', () => {
    const foreignApp = {
      app: 'other-finance-app',
      schemaVersion: '1.0.0',
      subscriptions: [],
    };
    const invalidVersion = {
      app: BACKUP_APP_ID,
      schemaVersion: '2.5.0',
      subscriptions: [],
    };

    const res1 = validateBackupPayload(foreignApp);
    expect(res1.isValid).toBe(false);
    expect(res1.errors.some((e) => e.includes('identificador de aplicativo'))).toBe(true);

    const res2 = validateBackupPayload(invalidVersion);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.some((e) => e.includes('Versão do schema incompatível'))).toBe(true);
  });

  it('rejects payloads where subscriptions is not an array', () => {
    const result = validateBackupPayload({
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      subscriptions: 'invalid-string',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('deve conter uma lista "subscriptions"'))).toBe(true);
  });

  it('rejects payloads containing invalid subscription items with descriptive errors', () => {
    const badPayload = {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      subscriptions: [
        {
          id: 'sub-valid',
          serviceName: 'Netflix',
          status: 'active',
          type: 'paid',
          billingCycle: 'monthly',
          price: 55.9,
          startDate: '2026-01-01',
          renewalDate: '2026-09-01',
        },
        {
          id: '',
          serviceName: '',
          status: 'unknown_status',
          type: 'paid',
          billingCycle: 'monthly',
          price: -50,
          startDate: 'invalid-date',
        },
      ],
    };

    const result = validateBackupPayload(badPayload);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('identificador ("id") ausente'))).toBe(true);
  });
});
