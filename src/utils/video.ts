export const attachVideoEvents = (
  container: HTMLElement, 
  video: HTMLVideoElement,
  updateBadgeFn?: (badge: HTMLElement, isPlaying: boolean) => void
) => {
  let isHovering = false;
  let playPromise: Promise<void> | undefined;

  // Find the badge element
  const badge = container.querySelector('[data-live-badge]') as HTMLElement;

  const updateBadgeForPlaying = (isPlaying: boolean): void => {
    if (!badge || !updateBadgeFn) return;
    updateBadgeFn(badge, isPlaying);
  };

  const handlePlay = async () => {
    isHovering = true;
    try {
      playPromise = video.play();
      await playPromise;
      if (isHovering) {
        video.style.opacity = "1";
        updateBadgeForPlaying(true);
      } else {
        // User left before play started/finished
        video.pause();
        video.currentTime = 0;
        video.style.opacity = "0";
        updateBadgeForPlaying(false);
      }
    } catch (e) {
      console.warn("Video play interrupted or failed", e);
      if (!isHovering) {
        video.style.opacity = "0";
        updateBadgeForPlaying(false);
      }
    }
  };

  const handleStop = () => {
    isHovering = false;
    video.style.opacity = "0";
    updateBadgeForPlaying(false);

    // Slight delay to allow for smooth transition before pausing
    setTimeout(() => {
      if (!isHovering) {
        video.pause();
        video.currentTime = 0;
      }
    }, 250);
  };

  container.addEventListener("mouseenter", handlePlay);
  container.addEventListener("mouseleave", handleStop);
  container.addEventListener("touchstart", handlePlay, { passive: true });
  container.addEventListener("touchend", handleStop);
  container.addEventListener("touchcancel", handleStop);
};
