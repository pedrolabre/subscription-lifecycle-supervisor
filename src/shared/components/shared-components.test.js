import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import BaseButton from './BaseButton.vue';
import StatePanel from './StatePanel.vue';
import StatusBadge from './StatusBadge.vue';
import SummaryMetric from './SummaryMetric.vue';

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
});
