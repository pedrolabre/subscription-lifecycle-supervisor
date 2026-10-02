import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BackupDialog from './BackupDialog.vue';
import { useSubscriptionsStore } from '../../stores/subscriptions/index.js';

describe('BackupDialog component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders nothing when open is false', () => {
    const wrapper = mount(BackupDialog, {
      props: { open: false },
    });

    expect(wrapper.find('[data-test="backup-dialog-backdrop"]').exists()).toBe(false);
  });

  it('renders accessible dialog structure when open is true', () => {
    const wrapper = mount(BackupDialog, {
      props: { open: true },
    });

    const backdrop = wrapper.find('[data-test="backup-dialog-backdrop"]');
    expect(backdrop.exists()).toBe(true);

    const dialog = wrapper.find('#backup-dialog');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('role')).toBe('dialog');
    expect(dialog.attributes('aria-modal')).toBe('true');
    expect(dialog.attributes('aria-labelledby')).toBe('backup-dialog-title');

    expect(wrapper.find('[data-test="export-json-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="export-csv-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="backup-dropzone"]').exists()).toBe(true);
  });

  it('emits close event when close button or backdrop is clicked', async () => {
    const wrapper = mount(BackupDialog, {
      props: { open: true },
    });

    await wrapper.find('[data-test="close-backup-dialog"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);

    await wrapper.find('[data-test="backup-dialog-backdrop"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  it('emits close event on Escape keydown', async () => {
    const wrapper = mount(BackupDialog, {
      props: { open: false },
      attachTo: document.body,
    });

    await wrapper.setProps({ open: true });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('close')).toHaveLength(1);

    wrapper.unmount();
  });

  it('triggers store export when export buttons are clicked', async () => {
    const store = useSubscriptionsStore();
    const exportBackupSpy = vi.spyOn(store, 'exportBackup').mockReturnValue({
      app: 'subscription-lifecycle-supervisor',
      schemaVersion: '1.0.0',
      subscriptions: [],
    });
    const exportCsvSpy = vi.spyOn(store, 'exportCsv').mockReturnValue('\uFEFFid,name');

    // Mock createObjectURL & revokeObjectURL & anchor click
    const origCreateObjectURL = globalThis.URL.createObjectURL;
    const origRevokeObjectURL = globalThis.URL.revokeObjectURL;
    const origAnchorClick = HTMLAnchorElement.prototype.click;
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
    globalThis.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();

    const wrapper = mount(BackupDialog, {
      props: { open: true },
    });

    await wrapper.find('[data-test="export-json-button"]').trigger('click');
    expect(exportBackupSpy).toHaveBeenCalled();

    await wrapper.find('[data-test="export-csv-button"]').trigger('click');
    expect(exportCsvSpy).toHaveBeenCalled();

    globalThis.URL.createObjectURL = origCreateObjectURL;
    globalThis.URL.revokeObjectURL = origRevokeObjectURL;
    HTMLAnchorElement.prototype.click = origAnchorClick;
  });

  it('handles valid file content and executes restoration with merge strategy', async () => {
    const store = useSubscriptionsStore();
    const importSpy = vi.spyOn(store, 'importBackup').mockResolvedValue({
      count: 1,
      strategy: 'merge',
    });

    const wrapper = mount(BackupDialog, {
      props: { open: true },
    });

    const validJson = JSON.stringify({
      app: 'subscription-lifecycle-supervisor',
      schemaVersion: '1.0.0',
      subscriptions: [
        {
          id: 'sub-test',
          serviceName: 'Test Service',
          status: 'active',
          type: 'paid',
          billingCycle: 'monthly',
          price: 25.0,
          startDate: '2026-08-01',
          renewalDate: '2026-09-01',
        },
      ],
    });

    // Simulate file input change
    const file = new File([validJson], 'backup.json', { type: 'application/json' });
    const input = wrapper.find('[data-test="backup-file-input"]');

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: true,
    });

    await input.trigger('change');
    // Wait for FileReader
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.find('[data-test="backup-preview"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="strategy-merge"]').exists()).toBe(true);

    // Confirm restore
    await wrapper.find('[data-test="confirm-restore-button"]').trigger('click');
    expect(importSpy).toHaveBeenCalledWith(expect.any(Object), 'merge');
  });

  it('displays validation errors when invalid JSON file is selected', async () => {
    const wrapper = mount(BackupDialog, {
      props: { open: true },
    });

    const invalidJson = JSON.stringify({
      app: 'wrong-app',
      schemaVersion: '1.0.0',
      subscriptions: [],
    });

    const file = new File([invalidJson], 'invalid.json', { type: 'application/json' });
    const input = wrapper.find('[data-test="backup-file-input"]');

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: true,
    });

    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.find('[data-test="backup-validation-errors"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="backup-preview"]').exists()).toBe(false);

    // Click cancel/clear invalid file
    await wrapper.find('[data-test="clear-invalid-file"]').trigger('click');
    expect(wrapper.find('[data-test="backup-validation-errors"]').exists()).toBe(false);
  });
});
