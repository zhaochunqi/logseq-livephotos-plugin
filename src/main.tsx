import "@logseq/libs";
import { logseq as PL } from "../package.json";

import type { MacroPayload } from "./types";
import { PARENT_DOC, LIVE_PHOTO_TYPE, DEFAULT_SETTINGS } from "./constants";
import { applyStyles } from "./utils/dom";
import { createLivePhotoContainer } from "./components/LivePhoto";
import { SettingsManager } from "./utils/settingsManager";
import { LivePhotoConverter } from "./utils/converter";

const pluginId = PL.id;

// Add global styles for Live Photo animations
const globalStyles = `
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes badgePulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1.1); }
  }
  
  /* Add subtle drop shadow for better visibility */
  [data-live-badge] {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }
  
  [data-live-badge] svg {
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
`;

// Inject global styles
const styleElement = document.createElement('style');
styleElement.textContent = globalStyles;
document.head.appendChild(styleElement);

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
const livePhotoInstances = new Map<string, { photoSrc: string; videoSrc: string; container: HTMLElement }>();

const handleMacroRenderer = ({ slot, payload }: MacroPayload) => {
  const [type, photoSrc, videoSrc] = payload.arguments;

  if (!isLivePhotoMacro(type, photoSrc, videoSrc)) return;

  const slotEl = PARENT_DOC.getElementById(slot);
  if (!slotEl) return;

  slotEl.innerHTML = "";
  applyStyles(slotEl, styles.slot);

  const settings = settingsManager.getSettings();
  const container = createLivePhotoContainer(photoSrc, videoSrc, settings.enableSound);
  slotEl.appendChild(container);
  
  // Store instance for later updates
  livePhotoInstances.set(slot, { photoSrc, videoSrc, container });
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
    },
    {
      key: 'enableSound',
      type: 'boolean',
      default: DEFAULT_SETTINGS.enableSound,
      title: 'Enable Sound',
      description: 'Enable sound by default for live photos. When unchecked, videos are muted by default.'
    }
  ]);

  // Initialize settings and converter
  settingsManager = new SettingsManager();
  await settingsManager.load();
  converter = new LivePhotoConverter(settingsManager);

  // Add settings change listener to update existing Live Photos
  settingsManager.addSettingsListener((newSettings) => {
    // Update all existing Live Photo instances
    livePhotoInstances.forEach(({ photoSrc, videoSrc, container }, slot) => {
      const slotEl = PARENT_DOC.getElementById(slot);
      if (slotEl && slotEl.contains(container)) {
        // Create new container with updated settings
        const newContainer = createLivePhotoContainer(photoSrc, videoSrc, newSettings.enableSound);
        slotEl.innerHTML = "";
        applyStyles(slotEl, styles.slot);
        slotEl.appendChild(newContainer);
        
        // Update stored instance
        livePhotoInstances.set(slot, { photoSrc, videoSrc, container: newContainer });
      }
    });
  });

  logseq.App.onMacroRendererSlotted(handleMacroRenderer);

  // Listen for settings changes from Logseq UI
  logseq.onSettingsChanged((newSettings) => {
    settingsManager.updateSettings(newSettings);
  });
  
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
            <text x="12" y="11" font-size="3" font-weight="bold" text-anchor="middle" fill="currentColor">LIVE</text>
            <circle cx="20" cy="8" r="1.5" fill="currentColor">
              <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </a>
      </span>
    `,
  });
}

logseq.ready(main).catch(console.error);
