import type { PluginSettings } from "../types";

export interface SettingsModel {
  regexPattern: string;
  enableAutoConvert: boolean;
  enableSound: boolean;
}

export const createSettingsModel = (settings: PluginSettings): SettingsModel => ({
  regexPattern: settings.regexPattern,
  enableAutoConvert: settings.enableAutoConvert,
  enableSound: settings.enableSound
});

export const validateSettings = (settings: Partial<PluginSettings>): string[] => {
  const errors: string[] = [];
  
  if (settings.regexPattern) {
    try {
      new RegExp(settings.regexPattern);
    } catch (error) {
      errors.push('Invalid regex pattern');
    }
  }
  
  return errors;
};