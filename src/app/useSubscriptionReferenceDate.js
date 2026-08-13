import { onMounted, onUnmounted, ref } from 'vue';

export function useSubscriptionReferenceDate(
  subscriptionsStore,
  { loadSubscriptions } = {},
) {
  const currentDate = ref(new Date());
  let currentDateTimer = null;

  syncCurrentDate();

  onMounted(() => {
    updateCurrentDate();
    currentDateTimer = setInterval(updateCurrentDate, 60 * 1000);
    currentDateTimer?.unref?.();

    if (!subscriptionsStore.isLoaded && !subscriptionsStore.isLoading) {
      loadSubscriptions?.();
    }
  });

  onUnmounted(() => {
    if (currentDateTimer !== null) {
      clearInterval(currentDateTimer);
    }
  });

  function updateCurrentDate() {
    currentDate.value = new Date();
    syncCurrentDate();
  }

  function syncCurrentDate() {
    if (typeof subscriptionsStore.setReferenceDate === 'function') {
      subscriptionsStore.setReferenceDate(currentDate.value);
    }
  }

  return {
    currentDate,
  };
}
