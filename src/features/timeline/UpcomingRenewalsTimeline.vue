<script setup>
import { useLocale } from '../../shared/i18n/index.js';
import { useUpcomingTimeline } from './useUpcomingTimeline.js';

const props = defineProps({
  subscriptions: {
    type: Array,
    default: () => [],
  },
  referenceDate: {
    type: [String, Date],
    default: () => new Date(),
  },
  target: {
    type: Object,
    default: undefined,
  },
  storage: {
    type: Object,
    default: undefined,
  },
});

const { formatDate, locale, t, tc } = useLocale();

const {
  failedIcons,
  handleImageError,
  handleToggleNotifications,
  isNotificationsActive,
  isNotificationsBlocked,
  isNotificationsButtonDisabled,
  notificationsAriaLabel,
  notificationsButtonLabel,
  totalUpcomingLabel,
  upcomingCount,
  upcomingCountLabel,
  upcomingItems,
} = useUpcomingTimeline(props, { formatDate, locale, t, tc });
</script>

<template>
  <section
    class="upcoming-timeline"
    aria-labelledby="timeline-title"
    data-test="upcoming-timeline"
  >
    <div class="timeline-header">
      <div class="timeline-heading">
        <p class="section-label">
          {{ t('timeline.eyebrow') }}
        </p>
        <h3
          id="timeline-title"
          class="timeline-title"
        >
          {{ t('timeline.title') }}
        </h3>
      </div>

      <button
        type="button"
        class="notifications-toggle-btn"
        :class="{
          'notifications-toggle-btn--active': isNotificationsActive,
          'notifications-toggle-btn--blocked': isNotificationsBlocked,
        }"
        :disabled="isNotificationsButtonDisabled"
        :aria-label="notificationsAriaLabel"
        :title="t('timeline.notificationsTooltip')"
        data-test="toggle-notifications-button"
        @click="handleToggleNotifications"
      >
        <span
          class="notifications-indicator"
          :class="{
            'notifications-indicator--active': isNotificationsActive,
            'notifications-indicator--blocked': isNotificationsBlocked,
          }"
          aria-hidden="true"
        />
        <span class="notifications-label">{{ notificationsButtonLabel }}</span>
      </button>
    </div>

    <div
      v-if="upcomingCount > 0"
      class="timeline-meta"
      data-test="timeline-meta"
    >
      <span
        class="timeline-count"
        data-test="timeline-count"
      >{{ upcomingCountLabel }}</span>
      <span
        class="timeline-total"
        data-test="timeline-total"
      >{{ totalUpcomingLabel }}</span>
    </div>

    <ol
      v-if="upcomingItems.length > 0"
      class="timeline-list"
      :aria-label="t('timeline.title')"
      data-test="timeline-list"
    >
      <li
        v-for="item in upcomingItems"
        :key="item.id"
        class="timeline-item"
        data-test="timeline-item"
      >
        <div
          class="timeline-item__avatar"
          :style="{
            backgroundColor: item.brandColor || 'var(--surface-elevated)',
          }"
        >
          <img
            v-if="item.icon && !failedIcons.has(item.id)"
            :src="item.icon"
            :alt="item.name"
            class="timeline-item__icon"
            loading="lazy"
            @error="handleImageError(item.id)"
          >
          <span
            v-else
            class="timeline-item__initial"
            aria-hidden="true"
          >
            {{ item.name.charAt(0).toUpperCase() }}
          </span>
        </div>

        <div class="timeline-item__details">
          <div class="timeline-item__row">
            <span class="timeline-item__name">{{ item.name }}</span>
            <span
              class="timeline-badge"
              :class="item.badgeClass"
              data-test="timeline-badge"
            >
              {{ item.badgeText }}
            </span>
          </div>

          <div class="timeline-item__row timeline-item__subtext">
            <time
              class="timeline-item__date"
              :datetime="item.targetDate"
            >
              {{ item.formattedDate }}
            </time>
            <span class="timeline-item__price">{{ item.formattedPrice }}</span>
          </div>
        </div>
      </li>
    </ol>

    <div
      v-else
      class="timeline-empty"
      data-test="timeline-empty"
    >
      <p class="timeline-empty__message">
        {{ t('timeline.empty') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.upcoming-timeline {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.timeline-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.timeline-heading {
  display: grid;
  gap: 2px;
}

.timeline-title {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  line-height: var(--line-tight);
}

.notifications-toggle-btn {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  padding: 4px 8px;
  border: 1px solid var(--border-control);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: var(--surface-control);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.notifications-toggle-btn:hover:not(:disabled) {
  border-color: var(--border-focus);
  color: var(--text-primary);
  background: var(--surface-control-hover);
}

.notifications-toggle-btn--active {
  border-color: var(--status-active-border);
  color: var(--text-accent);
  background: var(--surface-control-active);
}

.notifications-toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notifications-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}

.notifications-indicator--active {
  background: var(--primary);
  box-shadow: 0 0 6px var(--primary);
}

.notifications-indicator--blocked {
  background: var(--status-ended);
}

.timeline-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--surface-base);
  font-size: var(--font-size-xs);
}

.timeline-count {
  color: var(--text-muted);
  font-weight: 500;
}

.timeline-total {
  color: var(--text-accent);
  font-weight: 700;
}

.timeline-list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-item {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-base);
  transition: border-color 0.15s ease;
}

.timeline-item:hover {
  border-color: var(--border-strong);
}

.timeline-item__avatar {
  display: flex;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.timeline-item__icon {
  width: 1.25rem;
  height: 1.25rem;
  object-fit: contain;
}

.timeline-item__initial {
  color: var(--text-primary);
  font-size: var(--font-size-md);
  font-weight: 700;
}

.timeline-item__details {
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  gap: 2px;
}

.timeline-item__row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.timeline-item__name {
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-badge {
  display: inline-flex;
  padding: 1px 5px;
  border: 1px solid var(--border-control);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.timeline-badge--normal {
  border-color: var(--border-subtle);
  color: var(--text-muted);
  background: var(--surface-elevated);
}

.timeline-badge--imminent {
  border-color: var(--status-trial-border);
  color: var(--status-trial);
  background: var(--status-trial-surface);
}

.timeline-badge--trial {
  border-color: var(--status-trial-border);
  color: var(--status-trial);
  background: var(--status-trial-surface);
}

.timeline-item__subtext {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
}

.timeline-item__date {
  color: var(--text-muted);
}

.timeline-item__price {
  color: var(--text-secondary);
  font-weight: 600;
}

.timeline-empty {
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-align: center;
  font-size: var(--font-size-xs);
}

.timeline-empty__message {
  margin: 0;
}
</style>
