import { describe, it, expect } from 'vitest';
import { validateSettings, createSettingsModel } from '../src/models/settings';
import type { PluginSettings } from '../src/types';
import { DEFAULT_SETTINGS } from '../src/constants';

describe('Settings Model', () => {
  describe('validateSettings', () => {
    it('returns no errors for valid settings', () => {
      const errors = validateSettings(DEFAULT_SETTINGS);
      expect(errors).toEqual([]);
    });

    it('returns no errors for empty settings', () => {
      const errors = validateSettings({});
      expect(errors).toEqual([]);
    });

    it('returns error for invalid regex pattern', () => {
      const errors = validateSettings({ regexPattern: '[invalid' });
      expect(errors).toContain('Invalid regex pattern');
    });

    it('returns error for regex with unclosed group', () => {
      const errors = validateSettings({ regexPattern: '(unclosed' });
      expect(errors).toContain('Invalid regex pattern');
    });

    it('accepts valid complex regex', () => {
      const errors = validateSettings({
        regexPattern: '^(.*?)-([A-Za-z0-9]{5,6})\\.(jpg|jpeg|png|gif|mov|mp4)$',
      });
      expect(errors).toEqual([]);
    });

    it('ignores boolean settings in validation', () => {
      const errors = validateSettings({
        enableAutoConvert: true,
        enableSound: false,
      });
      expect(errors).toEqual([]);
    });
  });

  describe('createSettingsModel', () => {
    it('creates settings model from PluginSettings', () => {
      const pluginSettings: PluginSettings = {
        regexPattern: 'test-pattern',
        enableAutoConvert: true,
        enableSound: false,
      };

      const model = createSettingsModel(pluginSettings);

      expect(model).toEqual({
        regexPattern: 'test-pattern',
        enableAutoConvert: true,
        enableSound: false,
      });
    });

    it('copies all fields from PluginSettings', () => {
      const pluginSettings = { ...DEFAULT_SETTINGS };
      const model = createSettingsModel(pluginSettings);

      expect(model.regexPattern).toBe(pluginSettings.regexPattern);
      expect(model.enableAutoConvert).toBe(pluginSettings.enableAutoConvert);
      expect(model.enableSound).toBe(pluginSettings.enableSound);
    });
  });
});
