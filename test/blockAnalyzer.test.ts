import { describe, it, expect, beforeEach } from 'vitest';
import { BlockAnalyzer } from '../src/utils/blockAnalyzer';
import type { PluginSettings, BlockTree } from '../src/types';
import { DEFAULT_SETTINGS } from '../src/constants';

describe('BlockAnalyzer', () => {
  let analyzer: BlockAnalyzer;
  let settings: PluginSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS };
    analyzer = new BlockAnalyzer(settings);
  });

  describe('extractMediaUrl', () => {
    it('extracts image URL from markdown image syntax', () => {
      const content = '![alt text](image.jpg)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'image.jpg', type: 'image' });
    });

    it('extracts PNG image URL', () => {
      const content = '![](photo.png)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'photo.png', type: 'image' });
    });

    it('extracts GIF image URL', () => {
      const content = '![](animation.gif)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'animation.gif', type: 'image' });
    });

    it('extracts JPEG image URL', () => {
      const content = '![](photo.jpeg)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'photo.jpeg', type: 'image' });
    });

    it('extracts video URL from markdown image syntax', () => {
      const content = '![](video.mp4)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'video.mp4', type: 'video' });
    });

    it('extracts MOV video URL', () => {
      const content = '![](clip.mov)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'clip.mov', type: 'video' });
    });

    it('extracts AVI video URL', () => {
      const content = '![](video.avi)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'video.avi', type: 'video' });
    });

    it('extracts WebM video URL', () => {
      const content = '![](video.webm)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'video.webm', type: 'video' });
    });

    it('returns null type for non-media content', () => {
      const content = 'Just some text';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: '', type: null });
    });

    it('returns null type for unsupported image format', () => {
      const content = '![](image.bmp)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: '', type: null });
    });

    it('extracts URL with path', () => {
      const content = '![](../assets/folder/image.jpg)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: '../assets/folder/image.jpg', type: 'image' });
    });

    it('handles case-insensitive extensions', () => {
      const content = '![](image.JPG)';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: 'image.JPG', type: 'image' });
    });

    it('returns empty URL for markdown image with no URL', () => {
      const content = '![]()';
      const result = analyzer.extractMediaUrl(content);
      expect(result).toEqual({ url: '', type: null });
    });
  });

  describe('isSimpleMatch', () => {
    it('matches files with same prefix and different 6-char suffixes', () => {
      const imageUrl = 'photo-ABC123.jpg';
      const videoUrl = 'photo-DEF456.mov';
      const result = (analyzer as any).isSimpleMatch(imageUrl, videoUrl);
      expect(result).toBe(true);
    });

    it('matches files with same prefix and different 5-char suffixes', () => {
      const imageUrl = 'photo-ABC12.jpg';
      const videoUrl = 'photo-DEF34.mov';
      const result = (analyzer as any).isSimpleMatch(imageUrl, videoUrl);
      expect(result).toBe(true);
    });

    it('does not match files with different prefixes', () => {
      const imageUrl = 'photo1-ABC123.jpg';
      const videoUrl = 'photo2-DEF456.mov';
      const result = (analyzer as any).isSimpleMatch(imageUrl, videoUrl);
      expect(result).toBe(false);
    });

    it('does not match files with same suffix', () => {
      const imageUrl = 'photo-ABC123.jpg';
      const videoUrl = 'photo-ABC123.mov';
      const result = (analyzer as any).isSimpleMatch(imageUrl, videoUrl);
      expect(result).toBe(false);
    });

    it('does not match files with short names', () => {
      const imageUrl = 'a.jpg';
      const videoUrl = 'b.mov';
      const result = (analyzer as any).isSimpleMatch(imageUrl, videoUrl);
      expect(result).toBe(false);
    });
  });

  describe('calculateMatchScore', () => {
    it('returns 1.0 for perfect base name match with different random strings', () => {
      const imageUrl = 'photo-ABC123.jpg';
      const videoUrl = 'photo-DEF456.mov';
      const score = (analyzer as any).calculateMatchScore(imageUrl, videoUrl);
      expect(score).toBe(1.0);
    });

    it('returns 0 for completely different filenames', () => {
      const imageUrl = 'completely-different-ABC123.jpg';
      const videoUrl = 'totally-unrelated-DEF456.mov';
      const score = (analyzer as any).calculateMatchScore(imageUrl, videoUrl);
      expect(score).toBeLessThan(0.6);
    });

    it('returns 0 for invalid regex pattern', () => {
      const invalidAnalyzer = new BlockAnalyzer({
        ...settings,
        regexPattern: '[invalid',
      });
      const score = (invalidAnalyzer as any).calculateMatchScore('test.jpg', 'test.mov');
      expect(score).toBe(0);
    });

    it('falls back to simple pattern matching when custom regex does not match', () => {
      const imageUrl = 'photo-ABC123.jpg';
      const videoUrl = 'photo-DEF456.mov';
      const score = (analyzer as any).calculateMatchScore(imageUrl, videoUrl);
      expect(score).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('isValidMatch', () => {
    it('returns true for score >= 0.6', () => {
      expect((analyzer as any).isValidMatch('a.jpg', 'b.mov', 0.6)).toBe(true);
      expect((analyzer as any).isValidMatch('a.jpg', 'b.mov', 0.8)).toBe(true);
      expect((analyzer as any).isValidMatch('a.jpg', 'b.mov', 1.0)).toBe(true);
    });

    it('returns false for score < 0.6', () => {
      expect((analyzer as any).isValidMatch('a.jpg', 'b.mov', 0.5)).toBe(false);
      expect((analyzer as any).isValidMatch('a.jpg', 'b.mov', 0.0)).toBe(false);
    });
  });

  describe('findMediaPairs', () => {
    it('finds matching image and video blocks at same level', () => {
      const blocks: BlockTree[] = [
        { uuid: '1', content: '![](photo-ABC123.jpg)', level: 0 },
        { uuid: '2', content: '![](photo-DEF456.mov)', level: 0 },
      ];

      const pairs = analyzer.findMediaPairs(blocks);
      expect(pairs.length).toBe(1);
      expect(pairs[0].imageUrl).toBe('photo-ABC123.jpg');
      expect(pairs[0].videoUrl).toBe('photo-DEF456.mov');
    });

    it('does not match blocks at different levels', () => {
      const blocks: BlockTree[] = [
        { uuid: '1', content: '![](photo-ABC123.jpg)', level: 0 },
        { uuid: '2', content: '![](photo-DEF456.mov)', level: 1 },
      ];

      const pairs = analyzer.findMediaPairs(blocks);
      expect(pairs.length).toBe(0);
    });

    it('does not match two images', () => {
      const blocks: BlockTree[] = [
        { uuid: '1', content: '![](photo1.jpg)', level: 0 },
        { uuid: '2', content: '![](photo2.jpg)', level: 0 },
      ];

      const pairs = analyzer.findMediaPairs(blocks);
      expect(pairs.length).toBe(0);
    });

    it('does not match two videos', () => {
      const blocks: BlockTree[] = [
        { uuid: '1', content: '![](video1.mov)', level: 0 },
        { uuid: '2', content: '![](video2.mp4)', level: 0 },
      ];

      const pairs = analyzer.findMediaPairs(blocks);
      expect(pairs.length).toBe(0);
    });

    it('does not match non-consecutive media blocks', () => {
      const blocks: BlockTree[] = [
        { uuid: '1', content: '![](photo-ABC123.jpg)', level: 0 },
        { uuid: '2', content: 'Some text between', level: 0 },
        { uuid: '3', content: '![](photo-DEF456.mov)', level: 0 },
      ];

      const pairs = analyzer.findMediaPairs(blocks);
      expect(pairs.length).toBe(0);
    });

    it('finds multiple pairs in consecutive blocks', () => {
      const blocks: BlockTree[] = [
        { uuid: '1', content: '![](photo1-ABC123.jpg)', level: 0 },
        { uuid: '2', content: '![](photo1-DEF456.mov)', level: 0 },
        { uuid: '3', content: '![](photo2-GHI789.jpg)', level: 0 },
        { uuid: '4', content: '![](photo2-JKL012.mov)', level: 0 },
      ];

      const pairs = analyzer.findMediaPairs(blocks);
      expect(pairs.length).toBeGreaterThanOrEqual(1);
    });

    it('handles empty blocks array', () => {
      const pairs = analyzer.findMediaPairs([]);
      expect(pairs.length).toBe(0);
    });

    it('handles single block', () => {
      const blocks: BlockTree[] = [
        { uuid: '1', content: '![](photo.jpg)', level: 0 },
      ];

      const pairs = analyzer.findMediaPairs(blocks);
      expect(pairs.length).toBe(0);
    });
  });

  describe('generateRendererTemplate', () => {
    it('generates correct renderer template', () => {
      const pair = {
        imageBlock: { uuid: '1', content: '', level: 0 },
        videoBlock: { uuid: '2', content: '', level: 0 },
        imageUrl: 'photo.jpg',
        videoUrl: 'video.mov',
        matchScore: 1.0,
      };

      const template = analyzer.generateRendererTemplate(pair);
      expect(template).toBe('{{renderer :live-photo, photo.jpg, video.mov}}');
    });

    it('handles URLs with paths', () => {
      const pair = {
        imageBlock: { uuid: '1', content: '', level: 0 },
        videoBlock: { uuid: '2', content: '', level: 0 },
        imageUrl: '../assets/folder/photo.jpg',
        videoUrl: '../assets/folder/video.mov',
        matchScore: 1.0,
      };

      const template = analyzer.generateRendererTemplate(pair);
      expect(template).toBe('{{renderer :live-photo, ../assets/folder/photo.jpg, ../assets/folder/video.mov}}');
    });
  });

  describe('calculateStringSimilarity', () => {
    it('returns 1.0 for identical strings', () => {
      const similarity = (analyzer as any).calculateStringSimilarity('hello', 'hello');
      expect(similarity).toBe(1.0);
    });

    it('returns 0.0 for completely different strings', () => {
      const similarity = (analyzer as any).calculateStringSimilarity('abc', 'xyz');
      expect(similarity).toBe(0.0);
    });

    it('returns high similarity for similar strings', () => {
      const similarity = (analyzer as any).calculateStringSimilarity('photo', 'photos');
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('returns 1.0 for empty strings', () => {
      const similarity = (analyzer as any).calculateStringSimilarity('', '');
      expect(similarity).toBe(1.0);
    });

    it('returns 0.0 when one string is empty and other is not', () => {
      const similarity = (analyzer as any).calculateStringSimilarity('', 'hello');
      expect(similarity).toBe(0.0);
    });
  });

  describe('extractFileName', () => {
    it('extracts filename from URL', () => {
      const url = 'https://example.com/path/to/image.jpg';
      const fileName = (analyzer as any).extractFileName(url);
      expect(fileName).toBe('image.jpg');
    });

    it('returns the URL if no path separator', () => {
      const url = 'image.jpg';
      const fileName = (analyzer as any).extractFileName(url);
      expect(fileName).toBe('image.jpg');
    });

    it('handles relative paths', () => {
      const url = '../assets/image.jpg';
      const fileName = (analyzer as any).extractFileName(url);
      expect(fileName).toBe('image.jpg');
    });
  });
});
