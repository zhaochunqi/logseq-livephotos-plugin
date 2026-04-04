import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from '../src/utils/settingsManager';
import { DEFAULT_SETTINGS } from '../src/constants';
import type { PluginSettings } from '../src/types';

describe('SettingsManager', () => {
  let manager: SettingsManager;

  beforeEach(() => {
    // Reset mock logseq settings before each test
    (globalThis as any).logseq.settings = {};
    manager = new SettingsManager();
  });

  describe('constructor', () => {
    it('initializes with default settings', () => {
      const settings = manager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('load', () => {
    it('loads settings from logseq.settings', async () => {
      (globalThis as any).logseq.settings = {
        regexPattern: 'custom-pattern',
        enableAutoConvert: true,
        enableSound: true,
      };

      const newManager = new SettingsManager();
      await newManager.load();

      const settings = newManager.getSettings();
      expect(settings.regexPattern).toBe('custom-pattern');
      expect(settings.enableAutoConvert).toBe(true);
      expect(settings.enableSound).toBe(true);
    });

    it('uses defaults when logseq.settings is empty', async () => {
      (globalThis as any).logseq.settings = {};

      const newManager = new SettingsManager();
      await newManager.load();

      const settings = newManager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('uses defaults when logseq.settings is undefined', async () => {
      (globalThis as any).logseq.settings = undefined;

      const newManager = new SettingsManager();
      await newManager.load();

      const settings = newManager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('merges partial settings with defaults', async () => {
      (globalThis as any).logseq.settings = {
        enableAutoConvert: true,
      };

      const newManager = new SettingsManager();
      await newManager.load();

      const settings = newManager.getSettings();
      expect(settings.enableAutoConvert).toBe(true);
      expect(settings.regexPattern).toBe(DEFAULT_SETTINGS.regexPattern);
      expect(settings.enableSound).toBe(DEFAULT_SETTINGS.enableSound);
    });
  });

  describe('save', () => {
    it('updates settings and calls logseq.updateSettings', async () => {
      const mockUpdateSettings = vi.fn();
      (globalThis as any).logseq.updateSettings = mockUpdateSettings;

      await manager.save({ enableAutoConvert: true });

      const settings = manager.getSettings();
      expect(settings.enableAutoConvert).toBe(true);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ enableAutoConvert: true });
    });

    it('notifies listeners on save', async () => {
      const listener = vi.fn();
      manager.addSettingsListener(listener);

      const newSettings: Partial<PluginSettings> = { enableSound: true };
      await manager.save(newSettings);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ enableSound: true })
      );
    });
  });

  describe('getSettings', () => {
    it('returns a copy of settings', () => {
      const settings1 = manager.getSettings();
      const settings2 = manager.getSettings();

      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2);
    });
  });

  describe('updateSettings', () => {
    it('updates settings with partial values', () => {
      manager.updateSettings({ enableAutoConvert: true });

      const settings = manager.getSettings();
      expect(settings.enableAutoConvert).toBe(true);
      expect(settings.regexPattern).toBe(DEFAULT_SETTINGS.regexPattern);
    });

    it('notifies listeners', () => {
      const listener = vi.fn();
      manager.addSettingsListener(listener);

      manager.updateSettings({ enableSound: true });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ enableSound: true })
      );
    });

    it('notifies all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      manager.addSettingsListener(listener1);
      manager.addSettingsListener(listener2);

      manager.updateSettings({ enableAutoConvert: true });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('addSettingsListener', () => {
    it('adds a listener that gets called on update', () => {
      const listener = vi.fn();
      manager.addSettingsListener(listener);

      manager.updateSettings({ enableSound: true });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('removeSettingsListener', () => {
    it('removes a listener', () => {
      const listener = vi.fn();
      manager.addSettingsListener(listener);

      manager.removeSettingsListener(listener);
      manager.updateSettings({ enableSound: true });

      expect(listener).not.toHaveBeenCalled();
    });

    it('does nothing when removing non-existent listener', () => {
      const listener = vi.fn();
      const otherListener = vi.fn();

      manager.addSettingsListener(otherListener);

      expect(() => {
        manager.removeSettingsListener(listener);
      }).not.toThrow();

      manager.updateSettings({ enableSound: true });
      expect(otherListener).toHaveBeenCalled();
    });
  });
});
