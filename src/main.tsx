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

    // Create Badge element
    const badge = parent.document.createElement("div");
    badge.style.position = "absolute";
    badge.style.top = "8px";
    badge.style.left = "8px";
    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.gap = "4px";
    badge.style.padding = "4px 6px";
    badge.style.borderRadius = "4px";
    badge.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    badge.style.backdropFilter = "blur(4px)";
    badge.style.zIndex = "10";
    badge.style.pointerEvents = "none"; // Let clicks pass through

    // Live Photo Icon (Concentric circles)
    const iconSvg = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2"/>
        <circle cx="12" cy="12" r="5" fill="black"/>
        <circle cx="12" cy="12" r="2" fill="white" style="opacity: 0.5"/> 
      </svg>
    `;
    badge.innerHTML = iconSvg;

    // "LIVE" text
    const badgeText = parent.document.createElement("span");
    badgeText.innerText = "LIVE";
    badgeText.style.fontSize = "10px";
    badgeText.style.fontWeight = "bold";
    badgeText.style.color = "black";
    badgeText.style.lineHeight = "1";
    badgeText.style.letterSpacing = "0.5px";

    badge.appendChild(badgeText);

    // Append to container (Badge needs to be on top of video)
    container.appendChild(img);
    container.appendChild(video);
    container.appendChild(badge);
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
