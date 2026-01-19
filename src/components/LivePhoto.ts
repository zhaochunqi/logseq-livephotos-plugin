import { createElement } from "../utils/dom";
import { attachVideoEvents } from "../utils/video";

const styles = {
  container: {
    position: "relative" as const,
    width: "100%",
    cursor: "pointer" as const,
    overflow: "hidden" as const,
    borderRadius: "8px",
  },
  image: {
    width: "100%",
    height: "auto",
    display: "block",
    objectFit: "cover" as const,
  },
  video: {
    position: "absolute" as const,
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    opacity: "0",
    transition: "opacity 0.2s ease-in-out",
    pointerEvents: "none" as const,
  },
  badge: {
    position: "absolute" as const,
    top: "8px",
    left: "8px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 6px",
    borderRadius: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(4px)",
    zIndex: "10",
    pointerEvents: "none" as const,
  },
  badgeText: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "black",
    lineHeight: "1",
    letterSpacing: "0.5px",
  },
} as const;

const createBadgeIcon = (): string => {
  return `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2"/>
      <circle cx="12" cy="12" r="5" fill="black"/>
      <circle cx="12" cy="12" r="2" fill="white" style="opacity: 0.5"/>
    </svg>
  `;
};

const createBadge = (): HTMLElement => {
  const badge = createElement("div", styles.badge);
  badge.innerHTML = createBadgeIcon();

  const badgeText = createElement("span", styles.badgeText);
  badgeText.textContent = "LIVE";
  badge.appendChild(badgeText);

  return badge;
};

export const createLivePhotoContainer = (photoSrc: string, videoSrc: string): HTMLElement => {
  const container = createElement("div", styles.container);

  const img = createElement("img", styles.image);
  img.src = photoSrc;

  const video = createElement("video", styles.video);
  video.src = videoSrc;
  video.muted = true;
  video.playsInline = true;
  video.loop = true;

  const badge = createBadge();

  container.appendChild(img);
  container.appendChild(video);
  container.appendChild(badge);

  attachVideoEvents(container, video);

  return container;
};
