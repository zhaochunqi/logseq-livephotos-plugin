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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(6px)",
    zIndex: "2",
    pointerEvents: "none" as const,
    transition: "transform 0.2s ease",
  },
  badgePlaying: {
    animation: "badgePulse 0.3s ease-out" as string,
  },
  badgeIcon: {
    transition: "transform 0.3s ease",
  },
  badgeIconPlaying: {
    animation: "rotate 2s linear infinite",
  },
  badgeText: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "black",
    lineHeight: "1",
    letterSpacing: "0.5px",
  },
  muteButton: {
    position: "absolute" as const,
    bottom: "8px",
    right: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    padding: "6px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(6px)",
    cursor: "pointer" as const,
    zIndex: "2",
    transition: "transform 0.1s ease",
  },
} as const;

const createBadgeIcon = (isPlaying: boolean = false): string => {
  return `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2.5" fill="none"/>
      <circle cx="12" cy="12" r="5" fill="black"/>
      <circle cx="12" cy="12" r="2" fill="white" style="opacity: 0.8"/>
    </svg>
  `;
};

const createBadge = (): HTMLElement => {
  const badge = createElement("div", styles.badge);
  badge.setAttribute('data-live-badge', 'true');
  badge.innerHTML = createBadgeIcon();

  const badgeText = createElement("span", styles.badgeText);
  badgeText.textContent = "LIVE";
  badge.appendChild(badgeText);

  return badge;
};

export const updateBadgeForPlaying = (badge: HTMLElement, isPlaying: boolean): void => {
  // Update badge icon
  const icon = badge.querySelector('svg') as SVGElement;
  if (icon) {
    const outerCircle = icon.querySelector('circle:first-child') as SVGCircleElement;
    const innerCircle = icon.querySelector('circle:last-child') as SVGCircleElement;
    
    if (outerCircle) {
      if (isPlaying) {
        // Make the dashed circle more visible with longer dashes
        outerCircle.setAttribute('stroke-dasharray', '8 4');
        outerCircle.setAttribute('stroke-width', '2.5');
        outerCircle.style.stroke = '#333333'; // Dark gray for better visibility but less aggressive
        outerCircle.style.transformOrigin = 'center';
        outerCircle.style.animation = 'rotate 3s linear infinite';
      } else {
        outerCircle.setAttribute('stroke-dasharray', 'none');
        outerCircle.setAttribute('stroke-width', '2');
        outerCircle.style.stroke = '';
        outerCircle.style.animation = '';
      }
    }
    
    if (innerCircle) {
      if (isPlaying) {
        // Make the inner circle more visible
        innerCircle.style.fill = '#333333'; // Dark gray to match outer circle
        innerCircle.innerHTML = '<animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite"/>';
        innerCircle.innerHTML += '<animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite"/>';
      } else {
        innerCircle.style.fill = 'white';
        innerCircle.style.opacity = '0.5';
        innerCircle.innerHTML = '';
      }
    }
  }

  // Animate badge container
  if (isPlaying) {
    badge.style.transform = 'scale(1.1)';
    badge.style.animation = 'badgePulse 0.3s ease-out';
  } else {
    badge.style.transform = 'scale(1)';
    badge.style.animation = '';
  }
};

const getMuteIcon = (isMuted: boolean): string => {
  if (isMuted) {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    `;
  }
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  `;
};

const createMuteButton = (initialMuted: boolean): HTMLElement => {
  const button = createElement("div", styles.muteButton);
  button.innerHTML = getMuteIcon(initialMuted);
  return button;
};

export const createLivePhotoContainer = (
  photoSrc: string, 
  videoSrc: string, 
  enableSound: boolean = false
): HTMLElement => {
  const container = createElement("div", styles.container);

  const img = createElement("img", styles.image);
  img.src = photoSrc;

  const video = createElement("video", styles.video);
  video.src = videoSrc;
  video.muted = !enableSound;
  video.playsInline = true;
  video.loop = true;

  const badge = createBadge();
  const isInitiallyMuted = !enableSound;
  const muteButton = createMuteButton(isInitiallyMuted);

  muteButton.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    video.muted = !video.muted;
    muteButton.innerHTML = getMuteIcon(video.muted);
  });

  container.appendChild(img);
  container.appendChild(video);
  container.appendChild(badge);
  container.appendChild(muteButton);

  // Pass the updateBadgeForPlaying function to video events
  attachVideoEvents(container, video, updateBadgeForPlaying);

  return container;
};
