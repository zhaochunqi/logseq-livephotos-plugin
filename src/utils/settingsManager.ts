import { DEFAULT_SETTINGS } from "../constants";
import type { PluginSettings } from "../types";

export class SettingsManager {
  private settings: PluginSettings;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  async load(): Promise<PluginSettings> {
    try {
      console.log('[LivePhotos] Loading settings...');
      console.log('[LivePhotos] Logseq settings:', logseq.settings);
      
      // Use Logseq settings API
      if (logseq.settings) {
        const loadedSettings = logseq.settings as any;
        this.settings = { 
          ...DEFAULT_SETTINGS, 
          regexPattern: loadedSettings.regexPattern || DEFAULT_SETTINGS.regexPattern,
          enableAutoConvert: loadedSettings.enableAutoConvert !== undefined ? loadedSettings.enableAutoConvert : DEFAULT_SETTINGS.enableAutoConvert
        };
        console.log('[LivePhotos] Loaded settings:', this.settings);
      } else {
        console.log('[LivePhotos] No logseq settings found, using defaults');
      }
    } catch (error) {
      console.warn('[LivePhotos] Failed to load settings, using defaults:', error);
    }
    return this.settings;
  }

  async save(settings: Partial<PluginSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    try {
      // Use Logseq settings API
      logseq.updateSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  getSettings(): PluginSettings {
    return { ...this.settings };
  }

  updateSettings(settings: Partial<PluginSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  async showSettingsUI(): Promise<void> {
    // Use Logseq built-in settings UI
    logseq.showSettingsUI();
  }

  async resetToDefaults(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.save(DEFAULT_SETTINGS);
    logseq.UI.showMsg('Settings reset to defaults', 'success');
  }

  // Prompt for regex pattern update
  async promptRegexUpdate(): Promise<void> {
    const regexPattern = await logseq.UI.showMsg(
      'Enter regex pattern for file matching:',
      'info'
    );
    
    if (regexPattern) {
      try {
        // Validate regex
        new RegExp(regexPattern);
        await this.save({ regexPattern });
        logseq.UI.showMsg('Regex pattern saved successfully!', 'success');
      } catch (error) {
        logseq.UI.showMsg('Invalid regex pattern!', 'error');
      }
    }
  }
}