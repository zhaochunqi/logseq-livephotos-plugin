export const playVideo = async (video: HTMLVideoElement) => {
  try {
    await video.play();
    video.style.opacity = "1";
  } catch (e) {
    console.error("Video play failed", e);
    video.style.opacity = "0";
  }
};

export const stopVideo = (video: HTMLVideoElement) => {
  video.style.opacity = "0";
  setTimeout(() => {
    if (getComputedStyle(video).opacity === "0") {
      video.pause();
      video.currentTime = 0;
    }
  }, 250);
};

export const attachVideoEvents = (container: HTMLElement, video: HTMLVideoElement) => {
  container.addEventListener("mouseenter", () => playVideo(video));
  container.addEventListener("mouseleave", () => stopVideo(video));
  container.addEventListener("touchstart", () => playVideo(video));
  container.addEventListener("touchend", () => stopVideo(video));
  container.addEventListener("touchcancel", () => stopVideo(video));
};
