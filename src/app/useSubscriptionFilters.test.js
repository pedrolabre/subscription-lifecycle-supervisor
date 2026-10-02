import { ref } from 'vue';
import { describe, expect, it } from 'vitest';
import {
  FILTER_STATUS_TABS,
  matchesSearchQuery,
  resolveSubscriptionCategory,
  SORT_OPTIONS,
  sortSubscriptions,
  useSubscriptionFilters,
} from './useSubscriptionFilters.js';

describe('useSubscriptionFilters', () => {
  const sampleSubscriptions = [
    {
      id: 'sub_spotify',
      serviceName: 'Spotify',
      serviceId: 'spotify',
      category: 'music',
      status: 'active',
      price: 29.9,
      renewalDate: '2026-09-01',
    },
    {
      id: 'sub_netflix',
      serviceName: 'Netflix',
      serviceId: 'netflix',
      category: 'video',
      status: 'active',
      price: 55.9,
      renewalDate: '2026-08-15',
    },
    {
      id: 'sub_openai',
      serviceName: 'OpenAI',
      serviceId: null,
      status: 'active',
      price: 120.0,
      renewalDate: '2026-09-10',
    },
    {
      id: 'sub_figma',
      serviceName: 'Figma Pro',
      serviceId: 'figma',
      category: 'design',
      status: 'trial',
      price: 0,
      renewalDate: null,
      trialEndDate: '2026-08-20',
    },
    {
      id: 'sub_ended',
      serviceName: 'Duolingo',
      serviceId: 'duolingo',
      category: 'education',
      status: 'ended',
      price: 14.9,
      renewalDate: '2026-07-01',
    },
    {
      id: 'sub_archived',
      serviceName: 'Xbox Game Pass',
      serviceId: 'xbox-game-pass',
      category: 'gaming',
      status: 'archived',
      price: 49.9,
      renewalDate: '2026-07-15',
    },
  ];

  describe('resolveSubscriptionCategory', () => {
    it('uses subscription category if present', () => {
      expect(resolveSubscriptionCategory({ category: 'streaming' })).toBe('streaming');
    });

    it('infers category from catalog serviceId or serviceName', () => {
      expect(resolveSubscriptionCategory({ serviceId: 'spotify' })).toBe('music');
      expect(resolveSubscriptionCategory({ serviceName: 'Netflix' })).toBe('video');
    });

    it('falls back to other when unknown', () => {
      expect(resolveSubscriptionCategory({ serviceName: 'Custom Unknown' })).toBe('other');
    });
  });

  describe('matchesSearchQuery', () => {
    it('returns true for empty or whitespace query', () => {
      expect(matchesSearchQuery(sampleSubscriptions[0], '')).toBe(true);
      expect(matchesSearchQuery(sampleSubscriptions[0], '   ')).toBe(true);
    });

    it('matches by serviceName ignoring case and accents', () => {
      expect(matchesSearchQuery({ serviceName: 'Você Sabia' }, 'voce')).toBe(true);
      expect(matchesSearchQuery(sampleSubscriptions[0], 'spot')).toBe(true);
      expect(matchesSearchQuery(sampleSubscriptions[0], 'SPOTIFY')).toBe(true);
    });

    it('matches by category', () => {
      expect(matchesSearchQuery(sampleSubscriptions[0], 'music')).toBe(true);
      expect(matchesSearchQuery(sampleSubscriptions[1], 'video')).toBe(true);
    });

    it('matches ChatGPT alias when registered as OpenAI', () => {
      // In catalog, ChatGPT has alias 'openai' and 'chat gpt'
      expect(matchesSearchQuery({ serviceName: 'OpenAI' }, 'gpt')).toBe(true);
      expect(matchesSearchQuery({ serviceName: 'ChatGPT' }, 'openai')).toBe(true);
    });

    it('returns false when no field matches', () => {
      expect(matchesSearchQuery(sampleSubscriptions[0], 'nonexistent_xyz')).toBe(false);
    });
  });

  describe('sortSubscriptions', () => {
    it('sorts by renewal date ascending (chronological)', () => {
      const sorted = sortSubscriptions(sampleSubscriptions, SORT_OPTIONS.RENEWAL_ASC);
      const names = sorted.map((s) => s.serviceName);

      expect(names).toEqual([
        'Duolingo', // 2026-07-01
        'Xbox Game Pass', // 2026-07-15
        'Netflix', // 2026-08-15
        'Figma Pro', // 2026-08-20 (trialEndDate)
        'Spotify', // 2026-09-01
        'OpenAI', // 2026-09-10
      ]);
    });

    it('sorts by price descending', () => {
      const sorted = sortSubscriptions(sampleSubscriptions, SORT_OPTIONS.PRICE_DESC);
      expect(sorted[0].price).toBe(120.0);
      expect(sorted[sorted.length - 1].price).toBe(0);
    });

    it('sorts by price ascending', () => {
      const sorted = sortSubscriptions(sampleSubscriptions, SORT_OPTIONS.PRICE_ASC);
      expect(sorted[0].price).toBe(0);
      expect(sorted[sorted.length - 1].price).toBe(120.0);
    });

    it('sorts by name ascending alphabetically', () => {
      const sorted = sortSubscriptions(sampleSubscriptions, SORT_OPTIONS.NAME_ASC);
      const names = sorted.map((s) => s.serviceName);
      expect(names).toEqual([
        'Duolingo',
        'Figma Pro',
        'Netflix',
        'OpenAI',
        'Spotify',
        'Xbox Game Pass',
      ]);
    });
  });

  describe('useSubscriptionFilters composable', () => {
    it('initializes with default status tabs and all subscriptions', () => {
      const subs = ref(sampleSubscriptions);
      const filters = useSubscriptionFilters({
        subscriptions: subs,
        t: (k) => k,
      });

      expect(filters.activeTab.value).toBe(FILTER_STATUS_TABS.ALL);
      expect(filters.filteredSubscriptions.value.length).toBe(6);
      expect(filters.hasActiveFilters.value).toBe(false);
      expect(filters.isFilteredEmpty.value).toBe(false);

      expect(filters.statusTabs.value).toEqual([
        { id: FILTER_STATUS_TABS.ALL, label: 'filters.tabs.all', count: 6 },
        { id: FILTER_STATUS_TABS.ACTIVE, label: 'filters.tabs.active', count: 3 },
        { id: FILTER_STATUS_TABS.TRIAL, label: 'filters.tabs.trial', count: 1 },
        { id: FILTER_STATUS_TABS.INACTIVE, label: 'filters.tabs.inactive', count: 2 },
      ]);
    });

    it('filters by status tab', () => {
      const subs = ref(sampleSubscriptions);
      const filters = useSubscriptionFilters({ subscriptions: subs });

      filters.activeTab.value = FILTER_STATUS_TABS.ACTIVE;
      expect(filters.filteredSubscriptions.value.length).toBe(3);
      expect(filters.filteredSubscriptions.value.every((s) => s.status === 'active')).toBe(true);

      filters.activeTab.value = FILTER_STATUS_TABS.TRIAL;
      expect(filters.filteredSubscriptions.value.length).toBe(1);
      expect(filters.filteredSubscriptions.value[0].serviceName).toBe('Figma Pro');

      filters.activeTab.value = FILTER_STATUS_TABS.INACTIVE;
      expect(filters.filteredSubscriptions.value.length).toBe(2);
      expect(filters.filteredSubscriptions.value.map((s) => s.serviceName)).toEqual([
        'Duolingo',
        'Xbox Game Pass',
      ]);
    });

    it('filters by search query reactively', () => {
      const subs = ref(sampleSubscriptions);
      const filters = useSubscriptionFilters({ subscriptions: subs });

      filters.searchQuery.value = 'netflix';
      expect(filters.filteredSubscriptions.value.length).toBe(1);
      expect(filters.filteredSubscriptions.value[0].serviceName).toBe('Netflix');
      expect(filters.hasActiveFilters.value).toBe(true);

      filters.searchQuery.value = 'xyz_nothing';
      expect(filters.filteredSubscriptions.value.length).toBe(0);
      expect(filters.isFilteredEmpty.value).toBe(true);

      filters.clearSearch();
      expect(filters.searchQuery.value).toBe('');
      expect(filters.filteredSubscriptions.value.length).toBe(6);
      expect(filters.isFilteredEmpty.value).toBe(false);
    });

    it('filters by category chips and resets category when switching tabs if category is absent', () => {
      const subs = ref(sampleSubscriptions);
      const filters = useSubscriptionFilters({ subscriptions: subs });

      filters.selectedCategory.value = 'gaming';
      expect(filters.filteredSubscriptions.value.length).toBe(1);
      expect(filters.filteredSubscriptions.value[0].serviceName).toBe('Xbox Game Pass');

      // Switch to active tab where 'gaming' does not exist
      filters.activeTab.value = FILTER_STATUS_TABS.ACTIVE;
      expect(filters.selectedCategory.value).toBe('all');
      expect(filters.filteredSubscriptions.value.length).toBe(3);
    });

    it('resets all filters to initial state with resetFilters', () => {
      const subs = ref(sampleSubscriptions);
      const filters = useSubscriptionFilters({ subscriptions: subs });

      filters.activeTab.value = FILTER_STATUS_TABS.ACTIVE;
      filters.searchQuery.value = 'spotify';
      filters.selectedCategory.value = 'music';
      filters.sortBy.value = SORT_OPTIONS.PRICE_DESC;

      expect(filters.hasActiveFilters.value).toBe(true);

      filters.resetFilters();

      expect(filters.activeTab.value).toBe(FILTER_STATUS_TABS.ALL);
      expect(filters.searchQuery.value).toBe('');
      expect(filters.selectedCategory.value).toBe('all');
      expect(filters.sortBy.value).toBe(SORT_OPTIONS.RENEWAL_ASC);
      expect(filters.hasActiveFilters.value).toBe(false);
    });
  });
});
