import {
  normalizeSubscriptionPayload,
  validateSubscriptionPayload,
} from '../subscriptions/index.js';
import { summarizeSubscriptions } from '../subscriptions/summary.js';
import { toCents } from '../../core/money/index.js';

export const BACKUP_SCHEMA_VERSION = '1.0.0';
export const BACKUP_APP_ID = 'subscription-lifecycle-supervisor';

/**
 * Cria o payload serializado de backup no formato canonico v1.0.0.
 *
 * @param {Array<object>} subscriptions - Lista de assinaturas de dominio.
 * @param {object} [settings={}] - Configuracoes de preferencia (tema, idioma, moeda).
 * @param {object} [options={}] - Opcoes adicionais (ex.: timestamp customizado de exportacao).
 * @returns {object} Payload canonico BackupPayloadV1.
 */
export function createBackupPayload(subscriptions = [], settings = {}, options = {}) {
  const summary = summarizeSubscriptions(subscriptions);
  const now = options.now ?? (() => new Date());
  const exportDate = typeof now === 'function' ? now() : now;
  const exportedAt = (exportDate instanceof Date ? exportDate : new Date(exportDate)).toISOString();

  const normalizedSettings = {
    theme: settings?.theme === 'light' ? 'light' : 'dark',
    locale: settings?.locale === 'en-US' ? 'en-US' : 'pt-BR',
    currency:
      typeof settings?.currency === 'string' && settings.currency.trim()
        ? settings.currency.trim()
        : 'BRL',
  };

  const normalizedSubscriptions = (Array.isArray(subscriptions) ? subscriptions : []).map(
    (item) => {
      const normalized = normalizeSubscriptionPayload(item);
      const id = item?.id ? String(item.id).trim() : normalized.id;

      return {
        ...normalized,
        id,
        createdAt: item?.createdAt ? String(item.createdAt) : undefined,
        updatedAt: item?.updatedAt ? String(item.updatedAt) : undefined,
      };
    },
  );

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    app: BACKUP_APP_ID,
    exportedAt,
    meta: {
      totalSubscriptions: summary.totalCount,
      activeCount: summary.activeCount,
      monthlyTotalCents: toCents(summary.monthlyTotal),
    },
    settings: normalizedSettings,
    subscriptions: normalizedSubscriptions,
  };
}

/**
 * Converte o payload de backup em string JSON formatada.
 *
 * @param {object} payload - Objeto de backup canonico.
 * @param {number} [indent=2] - Nivel de indentacao.
 * @returns {string} String JSON.
 */
export function serializeBackupToJson(payload, indent = 2) {
  return JSON.stringify(payload, null, indent);
}

/**
 * Valida rigorosamente um arquivo ou objeto de backup (Schema Guard).
 *
 * @param {string|object} rawPayload - JSON string ou objeto de backup.
 * @returns {{ isValid: boolean, data: object|null, errors: Array<string> }}
 */
export function validateBackupPayload(rawPayload) {
  let payload = rawPayload;

  if (typeof rawPayload === 'string') {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return {
        isValid: false,
        data: null,
        errors: ['O arquivo fornecido não é um JSON válido ou está corrompido.'],
      };
    }
  }

  const errors = [];

  if (!isRecord(payload)) {
    return {
      isValid: false,
      data: null,
      errors: ['O conteúdo do backup deve ser um objeto JSON válido.'],
    };
  }

  if (payload.app !== BACKUP_APP_ID) {
    errors.push(`Arquivo não reconhecido. Esperado identificador de aplicativo "${BACKUP_APP_ID}".`);
  }

  if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    errors.push(
      `Versão do schema incompatível. Esperado "${BACKUP_SCHEMA_VERSION}", encontrado "${payload.schemaVersion || 'desconhecido'}".`,
    );
  }

  if (!Array.isArray(payload.subscriptions)) {
    errors.push('O arquivo de backup deve conter uma lista "subscriptions".');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      data: null,
      errors,
    };
  }

  const sanitizedSubscriptions = [];

  payload.subscriptions.forEach((item, index) => {
    const itemPosition = index + 1;
    if (!isRecord(item)) {
      errors.push(`Assinatura #${itemPosition}: formato inválido (deve ser um objeto).`);
      return;
    }

    const serviceLabel = item.serviceName ? `"${item.serviceName}"` : `registro #${itemPosition}`;
    const id = item.id !== null && item.id !== undefined ? String(item.id).trim() : '';

    if (!id) {
      errors.push(`Assinatura ${serviceLabel}: identificador ("id") ausente ou vazio.`);
    }

    const validation = validateSubscriptionPayload(item);
    if (!validation.isValid) {
      const messages = validation.errors.map((err) => err.message).join('; ');
      errors.push(`Assinatura ${serviceLabel}: ${messages}.`);
    } else {
      sanitizedSubscriptions.push({
        ...validation.value,
        id,
        createdAt: item.createdAt ? String(item.createdAt) : undefined,
        updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
      });
    }
  });

  if (errors.length > 0) {
    return {
      isValid: false,
      data: null,
      errors,
    };
  }

  const sanitizedSettings = {
    theme: payload.settings?.theme === 'light' ? 'light' : 'dark',
    locale: payload.settings?.locale === 'en-US' ? 'en-US' : 'pt-BR',
    currency:
      typeof payload.settings?.currency === 'string' && payload.settings.currency.trim()
        ? payload.settings.currency.trim()
        : 'BRL',
  };

  const summary = summarizeSubscriptions(sanitizedSubscriptions);

  return {
    isValid: true,
    data: {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      app: BACKUP_APP_ID,
      exportedAt: payload.exportedAt || new Date().toISOString(),
      meta: {
        totalSubscriptions: sanitizedSubscriptions.length,
        activeCount: summary.activeCount,
        monthlyTotalCents: toCents(summary.monthlyTotal),
      },
      settings: sanitizedSettings,
      subscriptions: sanitizedSubscriptions,
    },
    errors: [],
  };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
