export const attachVideoEvents = (container: HTMLElement, video: HTMLVideoElement) => {
  let isHovering = false;
  let playPromise: Promise<void> | undefined;

  const handlePlay = async () => {
    isHovering = true;
    try {
      playPromise = video.play();
      await playPromise;
      if (isHovering) {
        video.style.opacity = "1";
      } else {
        // User left before play started/finished
        video.pause();
        video.currentTime = 0;
        video.style.opacity = "0";
      }
    } catch (e) {
      console.warn("Video play interrupted or failed", e);
      if (!isHovering) {
        video.style.opacity = "0";
      }
    }
  };

  const handleStop = () => {
    isHovering = false;
    video.style.opacity = "0";

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
