import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AppLogo from './AppLogo.vue';
import BaseButton from './BaseButton.vue';
import CategoryChips from './CategoryChips.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import FilterTabs from './FilterTabs.vue';
import SearchInput from './SearchInput.vue';
import StatePanel from './StatePanel.vue';
import StatusBadge from './StatusBadge.vue';
import SummaryMetric from './SummaryMetric.vue';
import UndoToast from './UndoToast.vue';

describe('shared visual primitives', () => {
  it('renders a primary button and keeps native click behavior', async () => {
    const onClick = vi.fn();
    const wrapper = mount(BaseButton, {
      attrs: {
        onClick,
      },
      props: {
        variant: 'primary',
      },
      slots: {
        default: 'Nova assinatura',
      },
    });

    expect(wrapper.get('button').classes()).toContain('base-button--primary');
    expect(wrapper.get('button').attributes('type')).toBe('button');

    await wrapper.get('button').trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders status badges with semantic tones', () => {
    const wrapper = mount(StatusBadge, {
      props: {
        tone: 'active',
      },
      slots: {
        default: 'Ativa',
      },
    });

    expect(wrapper.text()).toBe('Ativa');
    expect(wrapper.classes()).toContain('status-badge--active');
  });

  it('renders a state panel with alert role and action event', async () => {
    const wrapper = mount(StatePanel, {
      attrs: {
        role: 'alert',
      },
      props: {
        actionLabel: 'Tentar novamente',
        description: 'IndexedDB indisponivel.',
        eyebrow: 'Leitura local',
        title: 'Nao foi possivel carregar as assinaturas',
        tone: 'error',
      },
    });

    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.text()).toContain('Leitura local');
    expect(wrapper.text()).toContain('IndexedDB indisponivel.');

    await wrapper.get('.state-panel__action').trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('renders summary metrics as definition list groups', () => {
    const wrapper = mount(SummaryMetric, {
      props: {
        detail: 'Custo normalizado',
        label: 'Mensal',
        value: '--',
      },
    });

    expect(wrapper.get('dt').text()).toBe('Mensal');
    expect(wrapper.get('dd').text()).toBe('--');
    expect(wrapper.text()).toContain('Custo normalizado');
  });

  it('renders a confirmation dialog and emits confirm and cancel events', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        cancelLabel: 'Cancelar',
        confirmLabel: 'Arquivar',
        message: 'Deseja arquivar Spotify Premium?',
        open: true,
        title: 'Arquivar assinatura',
        tone: 'archive',
      },
    });

    expect(wrapper.text()).toContain('Arquivar assinatura');
    expect(wrapper.text()).toContain('Deseja arquivar Spotify Premium?');

    await wrapper.get('[data-test="submit-confirm-dialog"]').trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);

    await wrapper.get('[data-test="cancel-confirm-dialog"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('renders an undo toast banner and handles action and dismiss', async () => {
    const wrapper = mount(UndoToast, {
      props: {
        actionLabel: 'Desfazer',
        message: 'Assinatura arquivada',
        visible: true,
      },
    });

    expect(wrapper.text()).toContain('Assinatura arquivada');
    expect(wrapper.text()).toContain('Desfazer');

    await wrapper.get('[data-test="undo-toast-action"]').trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);

    await wrapper.get('[data-test="undo-toast-close"]').trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('renders the AppLogo component with inline adaptive SVG elements', () => {
    const wrapper = mount(AppLogo);

    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('aria-label')).toBe('Subscription Lifecycle Supervisor Logo');
  });

  it('renders FilterTabs with accessible roles, counts and handles selection', async () => {
    const tabs = [
      { id: 'all', label: 'Todas', count: 5 },
      { id: 'active', label: 'Ativas', count: 3 },
      { id: 'trial', label: 'Trials', count: 2 },
    ];
    const wrapper = mount(FilterTabs, {
      props: {
        modelValue: 'all',
        tabs,
      },
    });

    expect(wrapper.get('[role="tablist"]').exists()).toBe(true);
    const tabButtons = wrapper.findAll('[role="tab"]');
    expect(tabButtons).toHaveLength(3);
    expect(tabButtons[0].classes()).toContain('is-active');
    expect(tabButtons[0].attributes('aria-selected')).toBe('true');
    expect(tabButtons[1].attributes('aria-selected')).toBe('false');

    await tabButtons[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['active']]);
  });

  it('renders SearchInput, emits input and clear events', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'Netflix',
      },
    });

    const input = wrapper.get('[data-test="search-input"]');
    expect(input.element.value).toBe('Netflix');

    const clearButton = wrapper.get('[data-test="clear-search-button"]');
    expect(clearButton.exists()).toBe(true);

    await clearButton.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('clear')).toHaveLength(1);

    await input.setValue('Spotify');
    expect(wrapper.emitted('update:modelValue')).toContainEqual(['Spotify']);
  });

  it('renders CategoryChips and emits selection', async () => {
    const categories = [
      { id: 'all', label: 'Todas', count: 4 },
      { id: 'streaming', label: 'Streaming', count: 2 },
      { id: 'music', label: 'Musica', count: 2 },
    ];
    const wrapper = mount(CategoryChips, {
      props: {
        categories,
        modelValue: 'all',
      },
    });

    const chips = wrapper.findAll('.category-chip');
    expect(chips).toHaveLength(3);
    expect(chips[0].classes()).toContain('is-active');
    expect(chips[0].attributes('aria-pressed')).toBe('true');

    await chips[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['streaming']]);
  });
});
