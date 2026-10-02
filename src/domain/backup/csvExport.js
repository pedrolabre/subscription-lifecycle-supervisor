import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
} from '../subscriptions/constants.js';

const CSV_HEADERS_PT_BR = [
  'ID',
  'Nome do Serviço',
  'Status',
  'Tipo',
  'Ciclo de Cobrança',
  'Preço',
  'Data de Início',
  'Próxima Renovação',
  'Fim do Trial',
  'Categoria',
];

const CSV_HEADERS_EN_US = [
  'ID',
  'Service Name',
  'Status',
  'Type',
  'Billing Cycle',
  'Price',
  'Start Date',
  'Renewal Date',
  'Trial End Date',
  'Category',
];

const STATUS_LABELS = {
  'pt-BR': {
    [SUBSCRIPTION_STATUS.ACTIVE]: 'Ativa',
    [SUBSCRIPTION_STATUS.TRIAL]: 'Trial',
    [SUBSCRIPTION_STATUS.ENDED]: 'Encerrada',
    [SUBSCRIPTION_STATUS.ARCHIVED]: 'Arquivada',
  },
  'en-US': {
    [SUBSCRIPTION_STATUS.ACTIVE]: 'Active',
    [SUBSCRIPTION_STATUS.TRIAL]: 'Trial',
    [SUBSCRIPTION_STATUS.ENDED]: 'Ended',
    [SUBSCRIPTION_STATUS.ARCHIVED]: 'Archived',
  },
};

const TYPE_LABELS = {
  'pt-BR': {
    [SUBSCRIPTION_TYPES.PAID]: 'Paga',
    [SUBSCRIPTION_TYPES.FREE]: 'Gratuita',
    [SUBSCRIPTION_TYPES.EDUCATIONAL]: 'Educacional',
  },
  'en-US': {
    [SUBSCRIPTION_TYPES.PAID]: 'Paid',
    [SUBSCRIPTION_TYPES.FREE]: 'Free',
    [SUBSCRIPTION_TYPES.EDUCATIONAL]: 'Educational',
  },
};

const CYCLE_LABELS = {
  'pt-BR': {
    [BILLING_CYCLES.MONTHLY]: 'Mensal',
    [BILLING_CYCLES.YEARLY]: 'Anual',
    [BILLING_CYCLES.LIFETIME]: 'Vitalício',
    [BILLING_CYCLES.NONE]: 'Sem cobrança',
  },
  'en-US': {
    [BILLING_CYCLES.MONTHLY]: 'Monthly',
    [BILLING_CYCLES.YEARLY]: 'Yearly',
    [BILLING_CYCLES.LIFETIME]: 'Lifetime',
    [BILLING_CYCLES.NONE]: 'None',
  },
};

/**
 * Gera string CSV tabular a partir de lista de assinaturas com UTF-8 BOM.
 *
 * @param {Array<object>} subscriptions - Lista de assinaturas.
 * @param {object} [options={}] - Opcoes (locale: 'pt-BR' | 'en-US').
 * @returns {string} String CSV formatada com UTF-8 BOM.
 */
export function generateSubscriptionsCsv(subscriptions = [], options = {}) {
  const locale = options.locale === 'en-US' ? 'en-US' : 'pt-BR';
  const headers = locale === 'en-US' ? CSV_HEADERS_EN_US : CSV_HEADERS_PT_BR;
  const statusMap = STATUS_LABELS[locale];
  const typeMap = TYPE_LABELS[locale];
  const cycleMap = CYCLE_LABELS[locale];

  const rows = [headers.map(escapeCsvValue).join(',')];

  if (Array.isArray(subscriptions)) {
    for (const sub of subscriptions) {
      if (!sub) continue;
      const statusText = statusMap[sub.status] || sub.status || '';
      const typeText = typeMap[sub.type] || sub.type || '';
      const cycleText = cycleMap[sub.billingCycle] || sub.billingCycle || '';
      const priceText = Number.isFinite(sub.price) ? sub.price.toFixed(2) : '0.00';

      const row = [
        escapeCsvValue(sub.id || ''),
        escapeCsvValue(sub.serviceName || ''),
        escapeCsvValue(statusText),
        escapeCsvValue(typeText),
        escapeCsvValue(cycleText),
        escapeCsvValue(priceText),
        escapeCsvValue(sub.startDate || ''),
        escapeCsvValue(sub.renewalDate || ''),
        escapeCsvValue(sub.trialEndDate || ''),
        escapeCsvValue(sub.category || ''),
      ];

      rows.push(row.join(','));
    }
  }

  // Prefixado com \uFEFF (UTF-8 BOM) para compatibilidade nativa no Excel/Sheets
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Escapa valores para células CSV conforme padrão RFC 4180.
 *
 * @param {any} value - Valor a ser formatado.
 * @returns {string} Valor tratado para CSV.
 */
export function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
