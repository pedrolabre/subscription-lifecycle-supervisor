export const DATABASE_NAME = 'SubscriptionLifecycleSupervisorDB';
export const INITIAL_DATABASE_VERSION = 1;

export const DB_STORES = Object.freeze({
  SUBSCRIPTIONS: 'subscriptions',
  SERVICES_CATALOG: 'servicesCatalog',
  SETTINGS: 'settings',
});

export const DATABASE_SCHEMA = Object.freeze({
  [DB_STORES.SUBSCRIPTIONS]:
    'id, serviceName, serviceId, status, type, renewalDate, trialEndDate, updatedAt',
  [DB_STORES.SERVICES_CATALOG]: 'id, name, category',
  [DB_STORES.SETTINGS]: 'key',
});
