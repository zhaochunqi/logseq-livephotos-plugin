import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLivePhotoContainer, updateBadgeForPlaying } from '../src/components/LivePhoto';
import { attachVideoEvents } from '../src/utils/video';

describe('LivePhoto Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createLivePhotoContainer', () => {
    it('creates a container with image, video, badge and mute button', async () => {
      (globalThis as any).logseq.App.getCurrentGraph = vi.fn().mockResolvedValue({
        path: '/test/graph',
      });

      const container = await createLivePhotoContainer('photo.jpg', 'video.mov', false);

      expect(container).toBeTruthy();
      expect(container.tagName).toBe('DIV');

      const img = container.querySelector('img');
      const video = container.querySelector('video');
      const badge = container.querySelector('[data-live-badge]');
      const muteButton = container.querySelector('[data-live-mute]');

      expect(img).toBeTruthy();
      expect(video).toBeTruthy();
      expect(badge).toBeTruthy();
      expect(muteButton).toBeTruthy();
    });

    it('sets video as muted when enableSound is false', async () => {
      (globalThis as any).logseq.App.getCurrentGraph = vi.fn().mockResolvedValue({
        path: '/test/graph',
      });

      const container = await createLivePhotoContainer('photo.jpg', 'video.mov', false);
      const video = container.querySelector('video') as HTMLVideoElement;

      expect(video.muted).toBe(true);
    });

    it('sets video as unmuted when enableSound is true', async () => {
      (globalThis as any).logseq.App.getCurrentGraph = vi.fn().mockResolvedValue({
        path: '/test/graph',
      });

      const container = await createLivePhotoContainer('photo.jpg', 'video.mov', true);
      const video = container.querySelector('video') as HTMLVideoElement;

      expect(video.muted).toBe(false);
    });

    it('sets video attributes correctly', async () => {
      (globalThis as any).logseq.App.getCurrentGraph = vi.fn().mockResolvedValue({
        path: '/test/graph',
      });

      const container = await createLivePhotoContainer('photo.jpg', 'video.mov', false);
      const video = container.querySelector('video') as HTMLVideoElement;

      expect(video.playsInline).toBe(true);
      expect(video.loop).toBe(true);
    });

    it('normalizes asset URLs when using assets protocol', async () => {
      (globalThis as any).logseq.App.getCurrentGraph = vi.fn().mockResolvedValue({
        path: '/my/graph',
      });

      const container = await createLivePhotoContainer(
        '../assets/photo.jpg',
        '../assets/video.mov',
        false
      );

      const img = container.querySelector('img') as HTMLImageElement;
      const video = container.querySelector('video') as HTMLVideoElement;

      expect(img.src).toContain('assets:///');
      expect(video.src).toContain('assets:///');
    });

    it('does not normalize non-asset URLs', async () => {
      (globalThis as any).logseq.App.getCurrentGraph = vi.fn().mockResolvedValue({
        path: '/my/graph',
      });

      const container = await createLivePhotoContainer(
        'https://example.com/photo.jpg',
        'https://example.com/video.mov',
        false
      );

      const img = container.querySelector('img') as HTMLImageElement;
      const video = container.querySelector('video') as HTMLVideoElement;

      expect(img.src).toBe('https://example.com/photo.jpg');
      expect(video.src).toBe('https://example.com/video.mov');
    });

    it('toggles video.muted when mute button is clicked', async () => {
      (globalThis as any).logseq.App.getCurrentGraph = vi.fn().mockResolvedValue({
        path: '/test/graph',
      });

      const container = await createLivePhotoContainer('photo.jpg', 'video.mov', false);
      const video = container.querySelector('video') as HTMLVideoElement;
      const muteButton = container.querySelector('[data-live-mute]') as HTMLElement;

      expect(video.muted).toBe(true);

      muteButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(video.muted).toBe(false);

      muteButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(video.muted).toBe(true);
    });
  });

  describe('updateBadgeForPlaying', () => {
    it('updates badge when playing', () => {
      const badge = document.createElement('div');
      badge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2.5" fill="none"/>
          <circle cx="12" cy="12" r="5" fill="black"/>
        </svg>
        <span>LIVE</span>
      `;

      updateBadgeForPlaying(badge, true);

      expect(badge.style.transform).toBe('scale(1.1)');
      expect(badge.style.animation).toContain('badgePulse');
    });

    it('resets badge when not playing', () => {
      const badge = document.createElement('div');
      badge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2.5" fill="none"/>
          <circle cx="12" cy="12" r="5" fill="black"/>
        </svg>
        <span>LIVE</span>
      `;

      updateBadgeForPlaying(badge, false);

      expect(badge.style.transform).toBe('scale(1)');
      expect(badge.style.animation).toBe('');
    });
  });

  describe('attachVideoEvents', () => {
    it('attaches event listeners to container', () => {
      const container = document.createElement('div');
      const video = document.createElement('video');
      const badge = document.createElement('div');
      badge.setAttribute('data-live-badge', 'true');
      container.appendChild(video);
      container.appendChild(badge);

      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');
      const updateBadgeFn = vi.fn();
      attachVideoEvents(container, video, updateBadgeFn);

      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    });

    it('calls updateBadgeFn on mouseenter', async () => {
      vi.useFakeTimers();

      const container = document.createElement('div');
      const video = document.createElement('video');
      const badge = document.createElement('div');
      badge.setAttribute('data-live-badge', 'true');
      container.appendChild(video);
      container.appendChild(badge);

      const updateBadgeFn = vi.fn();
      attachVideoEvents(container, video, updateBadgeFn);

      video.play = vi.fn().mockResolvedValue(undefined);

      container.dispatchEvent(new MouseEvent('mouseenter'));

      await vi.advanceTimersByTimeAsync(300);

      expect(updateBadgeFn).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('calls updateBadgeFn on mouseleave', () => {
      const container = document.createElement('div');
      const video = document.createElement('video');
      const badge = document.createElement('div');
      badge.setAttribute('data-live-badge', 'true');
      container.appendChild(video);
      container.appendChild(badge);

      const updateBadgeFn = vi.fn();
      attachVideoEvents(container, video, updateBadgeFn);

      container.dispatchEvent(new MouseEvent('mouseleave'));

      expect(updateBadgeFn).toHaveBeenCalledWith(badge, false);
    });
  });
});
