import "@logseq/libs";
import { logseq as PL } from "../package.json";

import type { MacroPayload } from "./types";
import { PARENT_DOC, LIVE_PHOTO_TYPE, DEFAULT_SETTINGS } from "./constants";
import { applyStyles } from "./utils/dom";
import { createLivePhotoContainer } from "./components/LivePhoto";
import { SettingsManager } from "./utils/settingsManager";
import { LivePhotoConverter } from "./utils/converter";

const pluginId = PL.id;

const styles = {
  slot: {
    width: "100%",
    height: "auto",
    display: "block",
  },
} as const;

const isLivePhotoMacro = (type?: string, photoSrc?: string, videoSrc?: string): boolean => {
  return type === LIVE_PHOTO_TYPE && !!photoSrc && !!videoSrc;
};

// Global instances
let settingsManager: SettingsManager;
let converter: LivePhotoConverter;

const handleMacroRenderer = ({ slot, payload }: MacroPayload) => {
  const [type, photoSrc, videoSrc] = payload.arguments;

  if (!isLivePhotoMacro(type, photoSrc, videoSrc)) return;

  const slotEl = PARENT_DOC.getElementById(slot);
  if (!slotEl) return;

  slotEl.innerHTML = "";
  applyStyles(slotEl, styles.slot);

  const container = createLivePhotoContainer(photoSrc, videoSrc);
  slotEl.appendChild(container);
};

async function main() {
  console.info(`#${pluginId}: MAIN`);

  // Setup settings schema
  logseq.useSettingsSchema([
    {
      key: 'regexPattern',
      type: 'string',
      default: DEFAULT_SETTINGS.regexPattern,
      title: 'Regex Pattern',
      description: 'Regex pattern for matching image/video files. Use group 1 for base name, group 2 for random string.'
    },
    {
      key: 'enableAutoConvert',
      type: 'boolean',
      default: DEFAULT_SETTINGS.enableAutoConvert,
      title: 'Auto Convert',
      description: 'Enable automatic conversion when pasting media files'
    }
  ]);

  // Initialize settings and converter
  settingsManager = new SettingsManager();
  await settingsManager.load();
  converter = new LivePhotoConverter(settingsManager);

  logseq.App.onMacroRendererSlotted(handleMacroRenderer);
  
  // Register model for UI interactions
  logseq.provideModel({
    async handleConvertPage() {
      await converter.showPreviewDialog();
    },
    async handleQuickConvert() {
      const result = await converter.convertCurrentPage();
      if (result.total > 0) {
        logseq.UI.showMsg(
          `Quick conversion: ${result.success} successful, ${result.failed} failed`,
          result.failed > 0 ? 'warning' : 'success'
        );
      } else {
        logseq.UI.showMsg('No convertible media pairs found.', 'info');
      }
    },
    async handleSettings() {
      logseq.showSettingsUI();
    }
  });

  // Register slash commands
  logseq.Editor.registerSlashCommand("[Live Photos] insert macro", async () => {
    const currentBlock = await logseq.Editor.getCurrentBlock();
    if (currentBlock) {
      const template = `{{renderer :live-photo, photo_url, video_url}}`;
      await logseq.Editor.updateBlock(currentBlock.uuid, template);
    }
  });

  logseq.Editor.registerSlashCommand("[Live Photos] convert page", async () => {
    await converter.showPreviewDialog();
  });

  logseq.Editor.registerSlashCommand("[Live Photos] settings", async () => {
    logseq.showSettingsUI();
  });

  // Settings command
  logseq.App.registerCommandPalette({
    key: "live-photos-settings",
    label: "Live Photos: Settings"
  }, async () => {
    logseq.showSettingsUI();
  });

  // Convert current page command
  logseq.App.registerCommandPalette({
    key: "live-photos-convert-page",
    label: "Live Photos: Convert Current Page"
  }, async () => {
    await converter.showPreviewDialog();
  });

  // Quick convert command (no preview)
  logseq.App.registerCommandPalette({
    key: "live-photos-quick-convert",
    label: "Live Photos: Quick Convert Current Page"
  }, async () => {
    const result = await converter.convertCurrentPage();
    if (result.total > 0) {
      logseq.UI.showMsg(
        `Quick conversion: ${result.success} successful, ${result.failed} failed`,
        result.failed > 0 ? 'warning' : 'success'
      );
    } else {
      logseq.UI.showMsg('No convertible media pairs found.', 'info');
    }
  });

  // Register UI items in toolbar
  logseq.App.registerUIItem("toolbar", {
    key: "live-photos-convert",
    template: `
      <span class="live-photos-convert">
        <a title="Convert Live Photos" class="button" data-on-click="handleConvertPage">
          <i class="ti ti-photo"></i>
        </a>
      </span>
    `,
  });

  logseq.App.registerUIItem("toolbar", {
    key: "live-photos-quick-convert", 
    template: `
      <span class="live-photos-quick-convert">
        <a title="Quick Convert" class="button" data-on-click="handleQuickConvert">
          <i class="ti ti-bolt"></i>
        </a>
      </span>
    `,
  });

  logseq.App.registerUIItem("toolbar", {
    key: "live-photos-settings",
    template: `
      <span class="live-photos-settings">
        <a title="Live Photos Settings" class="button" data-on-click="handleSettings">
          <i class="ti ti-settings"></i>
        </a>
      </span>
    `,
  });
}

logseq.ready(main).catch(console.error);
