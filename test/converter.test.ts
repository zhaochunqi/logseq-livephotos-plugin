import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LivePhotoConverter } from '../src/utils/converter';
import { SettingsManager } from '../src/utils/settingsManager';
import type { MediaPair, BlockTree } from '../src/types';

describe('LivePhotoConverter', () => {
  let settingsManager: SettingsManager;
  let converter: LivePhotoConverter;

  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).logseq.settings = {};
    settingsManager = new SettingsManager();
    converter = new LivePhotoConverter(settingsManager);
  });

  describe('generateRendererTemplate via convertPair', () => {
    it('calls logseq.Editor.updateBlock with correct template', async () => {
      const mockUpdateBlock = vi.fn().mockResolvedValue(undefined);
      const mockRemoveBlock = vi.fn().mockResolvedValue(undefined);

      (globalThis as any).logseq.Editor.updateBlock = mockUpdateBlock;
      (globalThis as any).logseq.Editor.removeBlock = mockRemoveBlock;

      const pair: MediaPair = {
        imageBlock: { uuid: 'img-uuid', content: '', level: 0 },
        videoBlock: { uuid: 'vid-uuid', content: '', level: 0 },
        imageUrl: 'photo.jpg',
        videoUrl: 'video.mov',
        matchScore: 1.0,
      };

      await converter.convertPair(pair);

      expect(mockUpdateBlock).toHaveBeenCalledWith(
        'img-uuid',
        '{{renderer :live-photo, photo.jpg, video.mov}}'
      );
      expect(mockRemoveBlock).toHaveBeenCalledWith('vid-uuid');
    });

    it('propagates errors when updateBlock fails', async () => {
      const mockUpdateBlock = vi.fn().mockRejectedValue(new Error('update failed'));

      (globalThis as any).logseq.Editor.updateBlock = mockUpdateBlock;

      const pair: MediaPair = {
        imageBlock: { uuid: 'img-uuid', content: '', level: 0 },
        videoBlock: { uuid: 'vid-uuid', content: '', level: 0 },
        imageUrl: 'photo.jpg',
        videoUrl: 'video.mov',
        matchScore: 1.0,
      };

      await expect(converter.convertPair(pair)).rejects.toThrow('update failed');
    });

    it('propagates errors when removeBlock fails', async () => {
      const mockUpdateBlock = vi.fn().mockResolvedValue(undefined);
      const mockRemoveBlock = vi.fn().mockRejectedValue(new Error('remove failed'));

      (globalThis as any).logseq.Editor.updateBlock = mockUpdateBlock;
      (globalThis as any).logseq.Editor.removeBlock = mockRemoveBlock;

      const pair: MediaPair = {
        imageBlock: { uuid: 'img-uuid', content: '', level: 0 },
        videoBlock: { uuid: 'vid-uuid', content: '', level: 0 },
        imageUrl: 'photo.jpg',
        videoUrl: 'video.mov',
        matchScore: 1.0,
      };

      await expect(converter.convertPair(pair)).rejects.toThrow('remove failed');
    });
  });

  describe('convertCurrentPage', () => {
    it('returns zero counts when no blocks exist', async () => {
      (globalThis as any).logseq.Editor.getCurrentPage = vi.fn().mockResolvedValue(null);

      const result = await converter.convertCurrentPage();

      expect(result).toEqual({ success: 0, failed: 0, total: 0 });
    });

    it('converts found pairs successfully', async () => {
      const mockUpdateBlock = vi.fn().mockResolvedValue(undefined);
      const mockRemoveBlock = vi.fn().mockResolvedValue(undefined);

      (globalThis as any).logseq.Editor.getCurrentPage = vi.fn().mockResolvedValue({ name: 'test-page' });
      (globalThis as any).logseq.Editor.getPageBlocksTree = vi.fn().mockResolvedValue([
        {
          uuid: '1',
          content: '![](photo-ABC123.jpg)',
          children: [],
        },
        {
          uuid: '2',
          content: '![](photo-DEF456.mov)',
          children: [],
        },
      ]);
      (globalThis as any).logseq.Editor.updateBlock = mockUpdateBlock;
      (globalThis as any).logseq.Editor.removeBlock = mockRemoveBlock;

      const result = await converter.convertCurrentPage();

      expect(result.total).toBe(1);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('handles conversion failures gracefully', async () => {
      const mockUpdateBlock = vi.fn().mockRejectedValue(new Error('update failed'));

      (globalThis as any).logseq.Editor.getCurrentPage = vi.fn().mockResolvedValue({ name: 'test-page' });
      (globalThis as any).logseq.Editor.getPageBlocksTree = vi.fn().mockResolvedValue([
        {
          uuid: '1',
          content: '![](photo-ABC123.jpg)',
          children: [],
        },
        {
          uuid: '2',
          content: '![](photo-DEF456.mov)',
          children: [],
        },
      ]);
      (globalThis as any).logseq.Editor.updateBlock = mockUpdateBlock;

      const result = await converter.convertCurrentPage();

      expect(result.total).toBe(1);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('previewConversions', () => {
    it('returns empty array when no page exists', async () => {
      (globalThis as any).logseq.Editor.getCurrentPage = vi.fn().mockResolvedValue(null);

      const pairs = await converter.previewConversions();

      expect(pairs).toEqual([]);
    });

    it('returns pairs when convertible media exists', async () => {
      (globalThis as any).logseq.Editor.getCurrentPage = vi.fn().mockResolvedValue({ name: 'test-page' });
      (globalThis as any).logseq.Editor.getPageBlocksTree = vi.fn().mockResolvedValue([
        {
          uuid: '1',
          content: '![](photo-ABC123.jpg)',
          children: [],
        },
        {
          uuid: '2',
          content: '![](photo-DEF456.mov)',
          children: [],
        },
      ]);

      const pairs = await converter.previewConversions();

      expect(pairs.length).toBe(1);
      expect(pairs[0].imageUrl).toBe('photo-ABC123.jpg');
      expect(pairs[0].videoUrl).toBe('photo-DEF456.mov');
    });
  });

  describe('updateSettings', () => {
    it('recreates block analyzer with new settings', async () => {
      settingsManager.updateSettings({
        regexPattern: 'new-pattern',
      });

      converter.updateSettings();

      // Verify the new regex is actually being used by checking if it affects pair matching
      (globalThis as any).logseq.Editor.getCurrentPage = vi.fn().mockResolvedValue({ name: 'test-page' });
      (globalThis as any).logseq.Editor.getPageBlocksTree = vi.fn().mockResolvedValue([
        {
          uuid: '1',
          content: '![](photo-ABC123.jpg)',
          children: [],
        },
        {
          uuid: '2',
          content: '![](photo-DEF456.mov)',
          children: [],
        },
      ]);

      const pairs = await converter.previewConversions();

      expect(pairs.length).toBe(1);
      expect(pairs[0].matchScore).toBe(1.0);
    });
  });
});
