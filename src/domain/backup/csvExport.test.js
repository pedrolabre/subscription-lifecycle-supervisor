import { describe, expect, it } from 'vitest';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../subscriptions/constants.js';
import { escapeCsvValue, generateSubscriptionsCsv } from './csvExport.js';

describe('subscriptions CSV export', () => {
  const sampleSubscriptions = [
    {
      id: 'sub-1',
      serviceName: 'Spotify "Family", Duo',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.PAID,
      billingCycle: BILLING_CYCLES.MONTHLY,
      price: 34.9,
      startDate: '2026-01-01',
      renewalDate: '2026-09-01',
      trialEndDate: null,
      category: 'music',
    },
    {
      id: 'sub-2',
      serviceName: 'Figma Free',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-02-01',
      renewalDate: null,
      trialEndDate: null,
      category: 'design',
    },
    {
      id: 'sub-3',
      serviceName: 'Canva Pro Trial',
      status: SUBSCRIPTION_STATUS.TRIAL,
      type: SUBSCRIPTION_TYPES.FREE,
      billingCycle: BILLING_CYCLES.NONE,
      price: 0,
      startDate: '2026-08-01',
      renewalDate: null,
      trialEndDate: '2026-08-15',
      category: 'design',
    },
  ];

  it('generates CSV with UTF-8 BOM character at the very beginning', () => {
    const csv = generateSubscriptionsCsv(sampleSubscriptions);

    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('exports headers and records in Portuguese (pt-BR) by default', () => {
    const csv = generateSubscriptionsCsv(sampleSubscriptions, { locale: 'pt-BR' });
    const lines = csv.replace('\uFEFF', '').split('\r\n');

    expect(lines[0]).toBe(
      'ID,Nome do Serviço,Status,Tipo,Ciclo de Cobrança,Preço,Data de Início,Próxima Renovação,Fim do Trial,Categoria',
    );
    // Line 1: 'Spotify "Family", Duo' should be properly escaped with double quotes
    expect(lines[1]).toContain('"Spotify ""Family"", Duo"');
    expect(lines[1]).toContain('Ativa');
    expect(lines[1]).toContain('Paga');
    expect(lines[1]).toContain('Mensal');
    expect(lines[1]).toContain('34.90');

    // Line 3: Trial
    expect(lines[3]).toContain('Trial');
    expect(lines[3]).toContain('2026-08-15');
  });

  it('exports headers and records in English (en-US) when requested', () => {
    const csv = generateSubscriptionsCsv(sampleSubscriptions, { locale: 'en-US' });
    const lines = csv.replace('\uFEFF', '').split('\r\n');

    expect(lines[0]).toBe(
      'ID,Service Name,Status,Type,Billing Cycle,Price,Start Date,Renewal Date,Trial End Date,Category',
    );
    expect(lines[1]).toContain('Active');
    expect(lines[1]).toContain('Paid');
    expect(lines[1]).toContain('Monthly');
  });

  it('escapes special characters correctly according to RFC 4180', () => {
    expect(escapeCsvValue('Simple Text')).toBe('Simple Text');
    expect(escapeCsvValue('Contains, comma')).toBe('"Contains, comma"');
    expect(escapeCsvValue('Contains "quotes"')).toBe('"Contains ""quotes"""');
    expect(escapeCsvValue('Line1\nLine2')).toBe('"Line1\nLine2"');
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(undefined)).toBe('');
  });

  it('handles empty subscription lists gracefully', () => {
    const csv = generateSubscriptionsCsv([]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Nome do Serviço');
  });
});
