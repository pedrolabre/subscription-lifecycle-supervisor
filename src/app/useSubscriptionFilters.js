import { computed, ref, unref, watch } from 'vue';
import {
  findService,
  findServiceById,
  findServiceByName,
  searchServices,
} from '../domain/services/index.js';
import { normalizeServiceText } from '../domain/services/normalization.js';

export const FILTER_STATUS_TABS = Object.freeze({
  ALL: 'all',
  ACTIVE: 'active',
  TRIAL: 'trial',
  INACTIVE: 'inactive',
});

export const SORT_OPTIONS = Object.freeze({
  RENEWAL_ASC: 'renewal_asc',
  PRICE_DESC: 'price_desc',
  PRICE_ASC: 'price_asc',
  NAME_ASC: 'name_asc',
});

export function resolveSubscriptionCategory(subscription) {
  if (subscription?.category && typeof subscription.category === 'string') {
    return subscription.category.trim().toLowerCase();
  }

  const catalogService =
    (subscription?.serviceId
      ? findServiceById(subscription.serviceId)
      : null) ??
    findServiceByName(subscription?.serviceName) ??
    findService(subscription?.serviceName);

  if (catalogService?.category) {
    return catalogService.category;
  }

  return 'other';
}

export function matchesSearchQuery(subscription, query) {
  const normalizedQuery = normalizeServiceText(query);

  if (!normalizedQuery) {
    return true;
  }

  const nameText = normalizeServiceText(subscription?.serviceName);
  if (nameText.includes(normalizedQuery)) {
    return true;
  }

  const category = resolveSubscriptionCategory(subscription);
  const categoryText = normalizeServiceText(category);
  if (categoryText.includes(normalizedQuery)) {
    return true;
  }

  const catalogService =
    (subscription?.serviceId
      ? findServiceById(subscription.serviceId)
      : null) ??
    findServiceByName(subscription?.serviceName) ??
    findService(subscription?.serviceName);

  if (catalogService) {
    const catalogName = normalizeServiceText(catalogService.name);
    if (catalogName.includes(normalizedQuery)) {
      return true;
    }

    const catalogCat = normalizeServiceText(catalogService.category);
    if (catalogCat.includes(normalizedQuery)) {
      return true;
    }

    if (Array.isArray(catalogService.aliases)) {
      const aliasMatch = catalogService.aliases.some((alias) => {
        const normalizedAlias = normalizeServiceText(alias);
        return (
          normalizedAlias.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedAlias)
        );
      });

      if (aliasMatch) {
        return true;
      }
    }
  }

  const matchedServices = searchServices(normalizedQuery);
  if (matchedServices.length > 0) {
    const matchedIds = new Set(matchedServices.map((s) => s.id));
    if (subscription?.serviceId && matchedIds.has(subscription.serviceId)) {
      return true;
    }
    if (catalogService?.id && matchedIds.has(catalogService.id)) {
      return true;
    }
  }

  return false;
}

export function filterSubscriptionsByTab(subscriptions = [], activeTab = FILTER_STATUS_TABS.ALL) {
  if (!Array.isArray(subscriptions)) return [];

  switch (activeTab) {
    case FILTER_STATUS_TABS.ACTIVE:
      return subscriptions.filter((sub) => sub.status === 'active');
    case FILTER_STATUS_TABS.TRIAL:
      return subscriptions.filter((sub) => sub.status === 'trial');
    case FILTER_STATUS_TABS.INACTIVE:
      return subscriptions.filter(
        (sub) => sub.status === 'ended' || sub.status === 'archived',
      );
    case FILTER_STATUS_TABS.ALL:
    default:
      return [...subscriptions];
  }
}

export function filterSubscriptionsByCategory(subscriptions = [], category = 'all') {
  if (!Array.isArray(subscriptions)) return [];
  if (!category || category === 'all') return [...subscriptions];

  const targetCategory = category.trim().toLowerCase();
  return subscriptions.filter(
    (sub) => resolveSubscriptionCategory(sub) === targetCategory,
  );
}

export function sortSubscriptions(
  subscriptions = [],
  sortBy = SORT_OPTIONS.RENEWAL_ASC,
  locale = 'pt-BR',
) {
  if (!Array.isArray(subscriptions)) return [];

  const copy = [...subscriptions];

  switch (sortBy) {
    case SORT_OPTIONS.PRICE_DESC:
      return copy.sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (priceB !== priceA) return priceB - priceA;
        return (a.serviceName || '').localeCompare(b.serviceName || '');
      });

    case SORT_OPTIONS.PRICE_ASC:
      return copy.sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (priceA !== priceB) return priceA - priceB;
        return (a.serviceName || '').localeCompare(b.serviceName || '');
      });

    case SORT_OPTIONS.NAME_ASC:
      return copy.sort((a, b) =>
        (a.serviceName || '').localeCompare(
          b.serviceName || '',
          locale || undefined,
          { sensitivity: 'base' },
        ),
      );

    case SORT_OPTIONS.RENEWAL_ASC:
    default:
      return copy.sort((a, b) => {
        const dateA = a.renewalDate || a.trialEndDate || null;
        const dateB = b.renewalDate || b.trialEndDate || null;

        if (dateA && dateB) {
          const comp = dateA.localeCompare(dateB);
          if (comp !== 0) return comp;
        } else if (dateA && !dateB) {
          return -1;
        } else if (!dateA && dateB) {
          return 1;
        }

        return (a.serviceName || '').localeCompare(b.serviceName || '');
      });
  }
}

export function useSubscriptionFilters({
  locale = ref('pt-BR'),
  subscriptions = [],
  t = (key) => key,
}) {
  const activeTab = ref(FILTER_STATUS_TABS.ALL);
  const searchQuery = ref('');
  const selectedCategory = ref('all');
  const sortBy = ref(SORT_OPTIONS.RENEWAL_ASC);

  const rawList = computed(() => {
    const list = unref(subscriptions);
    return Array.isArray(list) ? list : [];
  });

  const tabFilteredList = computed(() =>
    filterSubscriptionsByTab(rawList.value, activeTab.value),
  );

  const statusTabs = computed(() => {
    const items = rawList.value;
    let active = 0;
    let trial = 0;
    let inactive = 0;

    for (const item of items) {
      if (item.status === 'active') active += 1;
      else if (item.status === 'trial') trial += 1;
      else if (item.status === 'ended' || item.status === 'archived') inactive += 1;
    }

    return [
      {
        id: FILTER_STATUS_TABS.ALL,
        label: t('filters.tabs.all'),
        count: items.length,
      },
      {
        id: FILTER_STATUS_TABS.ACTIVE,
        label: t('filters.tabs.active'),
        count: active,
      },
      {
        id: FILTER_STATUS_TABS.TRIAL,
        label: t('filters.tabs.trial'),
        count: trial,
      },
      {
        id: FILTER_STATUS_TABS.INACTIVE,
        label: t('filters.tabs.inactive'),
        count: inactive,
      },
    ];
  });

  const categoryChips = computed(() => {
    const items = tabFilteredList.value;
    const categoryCounts = new Map();

    for (const item of items) {
      const cat = resolveSubscriptionCategory(item);
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }

    const chips = [
      {
        id: 'all',
        label: t('filters.categories.all'),
        count: items.length,
      },
    ];

    const sortedCategories = Array.from(categoryCounts.entries()).sort(
      ([catA, countA], [catB, countB]) => {
        if (countB !== countA) return countB - countA;
        return catA.localeCompare(catB);
      },
    );

    for (const [cat, count] of sortedCategories) {
      chips.push({
        id: cat,
        label: t(`categories.${cat}`) || capitalize(cat),
        count,
      });
    }

    return chips;
  });

  watch(
    categoryChips,
    (chips) => {
      if (
        selectedCategory.value !== 'all' &&
        !chips.some((chip) => chip.id === selectedCategory.value)
      ) {
        selectedCategory.value = 'all';
      }
    },
    { flush: 'sync' },
  );

  const filteredSubscriptions = computed(() => {
    const tabFiltered = tabFilteredList.value;
    const categoryFiltered = filterSubscriptionsByCategory(
      tabFiltered,
      selectedCategory.value,
    );
    const searchFiltered = categoryFiltered.filter((sub) =>
      matchesSearchQuery(sub, searchQuery.value),
    );

    const currentLocale = unref(locale);
    return sortSubscriptions(searchFiltered, sortBy.value, currentLocale);
  });

  const hasActiveFilters = computed(
    () =>
      activeTab.value !== FILTER_STATUS_TABS.ALL ||
      selectedCategory.value !== 'all' ||
      searchQuery.value.trim() !== '' ||
      sortBy.value !== SORT_OPTIONS.RENEWAL_ASC,
  );

  const isFilteredEmpty = computed(
    () => rawList.value.length > 0 && filteredSubscriptions.value.length === 0,
  );

  function clearSearch() {
    searchQuery.value = '';
  }

  function resetFilters() {
    activeTab.value = FILTER_STATUS_TABS.ALL;
    selectedCategory.value = 'all';
    searchQuery.value = '';
    sortBy.value = SORT_OPTIONS.RENEWAL_ASC;
  }

  return {
    activeTab,
    categoryChips,
    clearSearch,
    filteredSubscriptions,
    hasActiveFilters,
    isFilteredEmpty,
    resetFilters,
    searchQuery,
    selectedCategory,
    sortBy,
    statusTabs,
  };
}

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
