import "@logseq/libs";
import { logseq as PL } from "../package.json";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

function main() {
  console.info(`#${pluginId}: MAIN`);

  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    const [type, photoSrc, videoSrc] = payload.arguments;
    if (type !== ":live-photo" || !photoSrc || !videoSrc) return;

    // The slot is an element in the main Logseq DOM.
    const slotEl = parent.document.getElementById(slot);
    if (!slotEl) return;

    // Clear slot and set basic styles
    slotEl.innerHTML = "";
    slotEl.style.width = "100%";
    slotEl.style.height = "auto";
    slotEl.style.display = "block";

    // Create a container
    const container = parent.document.createElement("div");
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.cursor = "pointer";
    container.style.overflow = "hidden";
    container.style.borderRadius = "8px";

    // Create Image element (Poster)
    // Position relative so it dictates the container height
    const img = parent.document.createElement("img");
    img.src = photoSrc;
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.display = "block"; // Always visible as the base layer
    img.style.objectFit = "cover";

    // Create Video element
    const video = parent.document.createElement("video");
    video.src = videoSrc;
    video.style.position = "absolute";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.opacity = "0"; // Start hidden
    video.style.transition = "opacity 0.2s ease-in-out"; // Smooth fade
    video.style.pointerEvents = "none"; // Ensure mouse events go to container
    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    // Append to container
    container.appendChild(img);
    container.appendChild(video);
    slotEl.appendChild(container);

    // Event Listeners for Live Photo effect
    const playVideo = async () => {
      try {
        await video.play();
        video.style.opacity = "1";
      } catch (e) {
        console.error("Video play failed", e);
        // If play fails, keep transparency
        video.style.opacity = "0";
      }
    };

    const stopVideo = () => {
      video.style.opacity = "0";
      // Delay pause slightly to allow fade out
      setTimeout(() => {
        if (getComputedStyle(video).opacity === "0") {
          video.pause();
          video.currentTime = 0;
        }
      }, 250);
    };

    // User interaction
    container.addEventListener("mouseenter", playVideo);
    container.addEventListener("mouseleave", stopVideo);

    // Also support touch for mobile/tablets
    container.addEventListener("touchstart", (e) => {
      playVideo();
    });
    container.addEventListener("touchend", stopVideo);
    container.addEventListener("touchcancel", stopVideo);
  });
}

logseq.ready(main).catch(console.error);
