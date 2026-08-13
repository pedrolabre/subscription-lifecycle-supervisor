export function getSubscriptionKey(subscription, index) {
  return (
    subscription?.id ??
    `${subscription?.serviceName ?? 'subscription'}-${index}`
  );
}

export function normalizeCount(value) {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

export function normalizeSubscriptionName(subscription) {
  const name = subscription?.serviceName ?? subscription?.service?.name;

  return typeof name === 'string' && name.trim() ? name.trim() : '';
}

export function resolveSubscriptionId(subscription) {
  const id = subscription?.id;

  return typeof id === 'string' && id.trim() ? id.trim() : '';
}

export function normalizeMutationError(cause, fallbackMessage) {
  if (cause && typeof cause === 'object') {
    return cause;
  }

  return createLocalMutationError(fallbackMessage);
}

export function createLocalMutationError(message) {
  return {
    message,
    details: {},
  };
}
