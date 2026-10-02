export const DATABASE_NAME = 'SubscriptionLifecycleSupervisorDB';
export const INITIAL_DATABASE_VERSION = 1;
export const CURRENT_DATABASE_VERSION = 2;

export const DB_STORES = Object.freeze({
  SUBSCRIPTIONS: 'subscriptions',
  SERVICES_CATALOG: 'servicesCatalog',
  SETTINGS: 'settings',
  BILLING_HISTORY: 'billingHistory',
});

export const DATABASE_SCHEMA = Object.freeze({
  [DB_STORES.SUBSCRIPTIONS]:
    'id, serviceName, serviceId, status, type, renewalDate, trialEndDate, updatedAt',
  [DB_STORES.SERVICES_CATALOG]: 'id, name, category',
  [DB_STORES.SETTINGS]: 'key',
});

export const DATABASE_SCHEMA_V2 = Object.freeze({
  ...DATABASE_SCHEMA,
  [DB_STORES.BILLING_HISTORY]: '++id, subscriptionId, paidAt, billingCycle, amountCents',
});
