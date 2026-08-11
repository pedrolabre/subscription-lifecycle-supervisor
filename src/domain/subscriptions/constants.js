export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'active',
  TRIAL: 'trial',
  ENDED: 'ended',
  ARCHIVED: 'archived',
});

export const SUBSCRIPTION_TYPES = Object.freeze({
  PAID: 'paid',
  FREE: 'free',
  EDUCATIONAL: 'educational',
});

export const BILLING_CYCLES = Object.freeze({
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
  NONE: 'none',
});

export const SUBSCRIPTION_STATUS_VALUES = Object.freeze(
  Object.values(SUBSCRIPTION_STATUS),
);

export const SUBSCRIPTION_TYPE_VALUES = Object.freeze(
  Object.values(SUBSCRIPTION_TYPES),
);

export const BILLING_CYCLE_VALUES = Object.freeze(Object.values(BILLING_CYCLES));

export const PAID_BILLING_CYCLE_VALUES = Object.freeze([
  BILLING_CYCLES.MONTHLY,
  BILLING_CYCLES.YEARLY,
  BILLING_CYCLES.LIFETIME,
]);

export const RECURRING_BILLING_CYCLE_VALUES = Object.freeze([
  BILLING_CYCLES.MONTHLY,
  BILLING_CYCLES.YEARLY,
]);

export const SUBSCRIPTION_FIELD_LIMITS = Object.freeze({
  serviceNameMaxLength: 40,
});

export const SUBSCRIPTION_ERROR_CODES = Object.freeze({
  PAYLOAD_INVALID: 'payload_invalid',
  SERVICE_NAME_REQUIRED: 'service_name_required',
  SERVICE_NAME_TOO_LONG: 'service_name_too_long',
  STATUS_INVALID: 'status_invalid',
  TYPE_INVALID: 'type_invalid',
  BILLING_CYCLE_INVALID: 'billing_cycle_invalid',
  PAID_BILLING_CYCLE_REQUIRED: 'paid_billing_cycle_required',
  NON_PAID_BILLING_CYCLE_INVALID: 'non_paid_billing_cycle_invalid',
  PRICE_INVALID: 'price_invalid',
  PRICE_NEGATIVE: 'price_negative',
  NON_PAID_PRICE_INVALID: 'non_paid_price_invalid',
  START_DATE_REQUIRED: 'start_date_required',
  START_DATE_INVALID: 'start_date_invalid',
  RENEWAL_DATE_REQUIRED: 'renewal_date_required',
  RENEWAL_DATE_INVALID: 'renewal_date_invalid',
  TRIAL_END_DATE_REQUIRED: 'trial_end_date_required',
  TRIAL_END_DATE_INVALID: 'trial_end_date_invalid',
  EDUCATIONAL_END_DATE_REQUIRED: 'educational_end_date_required',
  BRAND_COLOR_INVALID: 'brand_color_invalid',
});

export const SUBSCRIPTION_ERROR_MESSAGES = Object.freeze({
  [SUBSCRIPTION_ERROR_CODES.PAYLOAD_INVALID]:
    'Payload de assinatura invalido.',
  [SUBSCRIPTION_ERROR_CODES.SERVICE_NAME_REQUIRED]:
    'Informe o nome do servico.',
  [SUBSCRIPTION_ERROR_CODES.SERVICE_NAME_TOO_LONG]:
    'O nome do servico deve ter no maximo 40 caracteres.',
  [SUBSCRIPTION_ERROR_CODES.STATUS_INVALID]:
    'Status de assinatura invalido.',
  [SUBSCRIPTION_ERROR_CODES.TYPE_INVALID]: 'Tipo de assinatura invalido.',
  [SUBSCRIPTION_ERROR_CODES.BILLING_CYCLE_INVALID]:
    'Ciclo de cobranca invalido.',
  [SUBSCRIPTION_ERROR_CODES.PAID_BILLING_CYCLE_REQUIRED]:
    'Assinaturas pagas devem usar ciclo mensal, anual ou vitalicio.',
  [SUBSCRIPTION_ERROR_CODES.NON_PAID_BILLING_CYCLE_INVALID]:
    'Assinaturas gratuitas ou educacionais devem usar ciclo sem cobranca.',
  [SUBSCRIPTION_ERROR_CODES.PRICE_INVALID]:
    'O valor da assinatura deve ser numerico.',
  [SUBSCRIPTION_ERROR_CODES.PRICE_NEGATIVE]:
    'O valor da assinatura nao pode ser negativo.',
  [SUBSCRIPTION_ERROR_CODES.NON_PAID_PRICE_INVALID]:
    'Assinaturas gratuitas ou educacionais devem ter valor zero.',
  [SUBSCRIPTION_ERROR_CODES.START_DATE_REQUIRED]:
    'Informe a data de inicio da assinatura.',
  [SUBSCRIPTION_ERROR_CODES.START_DATE_INVALID]:
    'A data de inicio deve estar no formato YYYY-MM-DD.',
  [SUBSCRIPTION_ERROR_CODES.RENEWAL_DATE_REQUIRED]:
    'Informe a data de renovacao da assinatura.',
  [SUBSCRIPTION_ERROR_CODES.RENEWAL_DATE_INVALID]:
    'A data de renovacao deve estar no formato YYYY-MM-DD.',
  [SUBSCRIPTION_ERROR_CODES.TRIAL_END_DATE_REQUIRED]:
    'Informe a data de fim do trial.',
  [SUBSCRIPTION_ERROR_CODES.TRIAL_END_DATE_INVALID]:
    'A data de fim do trial deve estar no formato YYYY-MM-DD.',
  [SUBSCRIPTION_ERROR_CODES.EDUCATIONAL_END_DATE_REQUIRED]:
    'Informe a data de termino do acesso educacional.',
  [SUBSCRIPTION_ERROR_CODES.BRAND_COLOR_INVALID]:
    'A cor da marca deve ser hexadecimal.',
});

