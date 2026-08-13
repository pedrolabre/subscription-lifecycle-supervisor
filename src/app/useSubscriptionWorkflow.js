import { computed, ref } from 'vue';
import { SUBSCRIPTION_STATUS } from '../domain/subscriptions/index.js';
import {
  createLocalMutationError,
  normalizeMutationError,
  normalizeSubscriptionName,
  resolveSubscriptionId,
} from './subscriptionViewUtils.js';

export function useSubscriptionWorkflow({ subscriptionsStore, t }) {
  const isSubscriptionFormOpen = ref(false);
  const editingSubscription = ref(null);
  const isSubmittingSubscription = ref(false);
  const isRunningLifecycleAction = ref(false);
  const subscriptionFormError = ref(null);
  const subscriptionActionError = ref(null);
  const confirmDialogState = ref({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    tone: 'archive',
    targetSubscription: null,
    action: null,
  });
  const toastState = ref({
    visible: false,
    message: '',
    actionLabel: '',
    subscriptionId: null,
    previousStatus: null,
  });

  const subscriptionFormMode = computed(() =>
    editingSubscription.value ? 'edit' : 'create',
  );

  const subscriptionDialogEyebrow = computed(() =>
    editingSubscription.value
      ? t('dialog.editEyebrow')
      : t('dialog.createEyebrow'),
  );

  const subscriptionDialogTitle = computed(() =>
    editingSubscription.value ? t('dialog.editTitle') : t('dialog.createTitle'),
  );

  const subscriptionFormKey = computed(
    () =>
      `${subscriptionFormMode.value}-${
        resolveSubscriptionId(editingSubscription.value) || 'new'
      }`,
  );

  const subscriptionActionErrorMessage = computed(
    () =>
      subscriptionActionError.value?.message ??
      t('errors.updateSubscription'),
  );

  const areCardActionsDisabled = computed(
    () =>
      isSubscriptionFormOpen.value ||
      isSubmittingSubscription.value ||
      isRunningLifecycleAction.value,
  );

  function openSubscriptionForm() {
    editingSubscription.value = null;
    isSubscriptionFormOpen.value = true;
    clearSubscriptionFormError();
    clearSubscriptionActionError();
  }

  function openEditSubscriptionForm(subscription) {
    const subscriptionId = resolveSubscriptionId(subscription);

    if (!subscriptionId) {
      subscriptionActionError.value = createLocalMutationError(
        t('errors.missingSubscriptionIdForEdit'),
      );
      return;
    }

    editingSubscription.value =
      resolvePersistedSubscription(subscriptionId) ?? subscription;
    isSubscriptionFormOpen.value = true;
    clearSubscriptionFormError();
    clearSubscriptionActionError();
  }

  function closeSubscriptionForm() {
    isSubscriptionFormOpen.value = false;
    editingSubscription.value = null;
    clearSubscriptionFormError();
  }

  function clearSubscriptionFormError() {
    subscriptionFormError.value = null;
  }

  function clearSubscriptionActionError() {
    subscriptionActionError.value = null;
  }

  async function submitSubscription(payload) {
    isSubmittingSubscription.value = true;
    clearSubscriptionFormError();
    clearSubscriptionActionError();

    try {
      if (editingSubscription.value) {
        const subscriptionId = resolveSubscriptionId(editingSubscription.value);

        if (!subscriptionId) {
          throw createLocalMutationError(
            t('errors.missingSubscriptionIdForEdit'),
          );
        }

        await subscriptionsStore.update(subscriptionId, payload);
      } else {
        await subscriptionsStore.create(payload);
      }

      closeSubscriptionForm();
    } catch (cause) {
      subscriptionFormError.value =
        subscriptionsStore.mutationError ??
        normalizeMutationError(cause, t('errors.saveSubscription'));
    } finally {
      isSubmittingSubscription.value = false;
    }
  }

  function requestArchiveSubscription(subscription) {
    const name =
      normalizeSubscriptionName(subscription) || t('card.fallbackName');
    const isArchived = subscription?.status === SUBSCRIPTION_STATUS.ARCHIVED;

    if (isArchived) {
      confirmDialogState.value = {
        open: true,
        title: t('confirmDialog.unarchiveTitle'),
        message: t('confirmDialog.unarchiveMessage', { name }),
        confirmLabel: t('confirmDialog.unarchiveConfirm'),
        tone: 'archive',
        targetSubscription: subscription,
        action: 'unarchive',
      };
      return;
    }

    confirmDialogState.value = {
      open: true,
      title: t('confirmDialog.archiveTitle'),
      message: t('confirmDialog.archiveMessage', { name }),
      confirmLabel: t('confirmDialog.archiveConfirm'),
      tone: 'archive',
      targetSubscription: subscription,
      action: 'archive',
    };
  }

  function requestEndSubscription(subscription) {
    const name =
      normalizeSubscriptionName(subscription) || t('card.fallbackName');

    confirmDialogState.value = {
      open: true,
      title: t('confirmDialog.endTitle'),
      message: t('confirmDialog.endMessage', { name }),
      confirmLabel: t('confirmDialog.endConfirm'),
      tone: 'end',
      targetSubscription: subscription,
      action: 'end',
    };
  }

  function closeConfirmDialog() {
    confirmDialogState.value.open = false;
  }

  async function handleConfirmedAction() {
    const { action, targetSubscription } = confirmDialogState.value;
    closeConfirmDialog();

    if (!targetSubscription) {
      return;
    }

    const subscriptionId = resolveSubscriptionId(targetSubscription);
    const name =
      normalizeSubscriptionName(targetSubscription) || t('card.fallbackName');
    const previousStatus = String(targetSubscription.status || 'active');

    if (action === 'archive') {
      await archiveSubscription(targetSubscription);

      toastState.value = {
        visible: true,
        message: t('toast.archived', { name }),
        actionLabel: t('toast.undo'),
        subscriptionId,
        previousStatus,
      };
    } else if (action === 'unarchive') {
      await subscriptionsStore.update(subscriptionId, {
        status: SUBSCRIPTION_STATUS.ACTIVE,
      });

      toastState.value = {
        visible: true,
        message: t('toast.unarchived', { name }),
        actionLabel: '',
        subscriptionId: null,
        previousStatus: null,
      };
    } else if (action === 'end') {
      await endSubscription(targetSubscription);

      toastState.value = {
        visible: true,
        message: t('toast.ended', { name }),
        actionLabel: '',
        subscriptionId: null,
        previousStatus: null,
      };
    }
  }

  async function handleUndoToastAction() {
    const { subscriptionId, previousStatus } = toastState.value;
    toastState.value.visible = false;

    if (!subscriptionId) {
      return;
    }

    try {
      const targetStatus =
        previousStatus && previousStatus !== 'archived'
          ? previousStatus
          : 'active';

      await subscriptionsStore.update(subscriptionId, {
        status: targetStatus,
      });

      toastState.value = {
        visible: true,
        message: t('toast.undone'),
        actionLabel: '',
        subscriptionId: null,
        previousStatus: null,
      };
    } catch (cause) {
      subscriptionActionError.value =
        subscriptionsStore.mutationError ??
        normalizeMutationError(cause, t('errors.updateSubscription'));
    }
  }

  function dismissToast() {
    toastState.value.visible = false;
  }

  async function archiveSubscription(subscription) {
    await runLifecycleMutation(
      subscription,
      'archive',
      t('errors.archiveSubscription'),
    );
  }

  async function endSubscription(subscription) {
    await runLifecycleMutation(subscription, 'end', t('errors.endSubscription'));
  }

  async function runLifecycleMutation(subscription, action, fallbackMessage) {
    if (isRunningLifecycleAction.value) {
      return;
    }

    const subscriptionId = resolveSubscriptionId(subscription);

    if (!subscriptionId) {
      subscriptionActionError.value = createLocalMutationError(
        t('errors.missingSubscriptionId'),
      );
      return;
    }

    isRunningLifecycleAction.value = true;
    clearSubscriptionActionError();
    clearSubscriptionFormError();

    try {
      await subscriptionsStore[action](subscriptionId);
    } catch (cause) {
      subscriptionActionError.value =
        subscriptionsStore.mutationError ??
        normalizeMutationError(cause, fallbackMessage);
    } finally {
      isRunningLifecycleAction.value = false;
    }
  }

  function resolvePersistedSubscription(subscriptionId) {
    const subscriptions = Array.isArray(subscriptionsStore.subscriptions)
      ? subscriptionsStore.subscriptions
      : [];

    return (
      subscriptions.find(
        (subscription) =>
          resolveSubscriptionId(subscription) === subscriptionId,
      ) ?? null
    );
  }

  return {
    areCardActionsDisabled,
    clearSubscriptionFormError,
    closeConfirmDialog,
    closeSubscriptionForm,
    confirmDialogState,
    dismissToast,
    editingSubscription,
    handleConfirmedAction,
    handleUndoToastAction,
    isSubmittingSubscription,
    isSubscriptionFormOpen,
    openEditSubscriptionForm,
    openSubscriptionForm,
    requestArchiveSubscription,
    requestEndSubscription,
    submitSubscription,
    subscriptionActionError,
    subscriptionActionErrorMessage,
    subscriptionDialogEyebrow,
    subscriptionDialogTitle,
    subscriptionFormError,
    subscriptionFormKey,
    subscriptionFormMode,
    toastState,
  };
}
