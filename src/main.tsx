import "@logseq/libs";
import { logseq as PL } from "../package.json";

import type { MacroPayload } from "./types";
import { PARENT_DOC, LIVE_PHOTO_TYPE } from "./constants";
import { applyStyles } from "./utils/dom";
import { createLivePhotoContainer } from "./components/LivePhoto";

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

function main() {
  console.info(`#${pluginId}: MAIN`);

  logseq.App.onMacroRendererSlotted(handleMacroRenderer);
  
  // Register slash command for live photos
  logseq.Editor.registerSlashCommand("[Live Photos] insert micro", async () => {
    const currentBlock = await logseq.Editor.getCurrentBlock();
    if (currentBlock) {
      const template = `{{renderer :live-photo, photo_url, video_url}}`;
      await logseq.Editor.updateBlock(currentBlock.uuid, template);
    }
  });
}

logseq.ready(main).catch(console.error);
