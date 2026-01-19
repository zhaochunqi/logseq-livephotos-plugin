import "@logseq/libs";
import * as LivePhotosKit from "livephotoskit";
import { logseq as PL } from "../package.json";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

// Helper to ensure LivePhotosKit is available on parent window
const ensureLivePhotosKit = () => {
  // Make LivePhotosKit available on parent window if not already there
  if (!(parent.window as any).LivePhotosKit) {
    (parent.window as any).LivePhotosKit = LivePhotosKit;
  }
};

function main() {
  console.info(`#${pluginId}: MAIN`);



  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    const [type, photoSrc, videoSrc] = payload.arguments;
    if (type !== ":live-photo" || !photoSrc || !videoSrc) return;

    // Ensure LivePhotosKit is available on parent window
    ensureLivePhotosKit();

    // We don't use provideUI here to avoid complexity. We render directly into the slot.
    // The slot is an element in the main Logseq DOM.
    const slotEl = parent.document.getElementById(slot);
    if (!slotEl) return;

    // Clear slot
    slotEl.innerHTML = "";
    slotEl.style.width = "100%";
    slotEl.style.height = "auto";
    slotEl.style.minHeight = "300px"; // Provide some default height
    slotEl.style.display = "block";

    // Create a container for the player
    const container = parent.document.createElement("div");
    container.style.width = "100%";
    container.style.height = "500px";
    container.style.position = "relative";
    slotEl.appendChild(container);

    // Initialize player using the PARENT window's LivePhotosKit instance
    const LPK = (parent.window as any).LivePhotosKit;

    if (LPK && LPK.Player) {
      try {
        const player = LPK.Player(container);
        player.photoSrc = photoSrc;
        player.videoSrc = videoSrc;
        player.showsNativeControls = true;
      } catch (err) {
        console.error("LivePhotosKit Player init error:", err);
        slotEl.innerHTML = `<div style="color:red">Error initializing Live Photo: ${err}</div>`;
      }
    } else {
      console.error("LivePhotosKit not found on parent window");
      slotEl.innerHTML = `<div style="color:red">LivePhotosKit library not loaded.</div>`;
    }
  });
}

logseq.ready(main).catch(console.error);
