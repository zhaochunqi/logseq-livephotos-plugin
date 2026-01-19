import type { BlockTree, MediaPair, PluginSettings } from "../types";

export class BlockAnalyzer {
  private settings: PluginSettings;

  constructor(settings: PluginSettings) {
    this.settings = settings;
  }

  async getCurrentPageBlocks(): Promise<BlockTree[]> {
    const currentPage = await logseq.Editor.getCurrentPage();
    console.log('[LivePhotos] Current page:', currentPage);
    
    if (!currentPage || !currentPage.name) {
      console.log('[LivePhotos] No current page or page name');
      return [];
    }

    const blocksTree = await logseq.Editor.getPageBlocksTree(currentPage.name as any);
    console.log('[LivePhotos] Raw blocks tree:', blocksTree);
    
    const flattened = this.flattenBlockTree(blocksTree || []);
    console.log('[LivePhotos] Flattened blocks:', flattened);
    return flattened;
  }

  private flattenBlockTree(blocks: any[], level = 0, parent?: BlockTree): BlockTree[] {
    const result: BlockTree[] = [];
    
    for (const block of blocks) {
      const currentBlock: BlockTree = {
        uuid: block.uuid,
        content: block.content || "",
        level,
        parent,
        children: undefined // Will be set later if needed
      };
      
      result.push(currentBlock);
      
      if (block.children && block.children.length > 0) {
        const children = this.flattenBlockTree(block.children, level + 1, currentBlock);
        result.push(...children);
        currentBlock.children = children;
      }
    }
    
    return result;
  }

  extractMediaUrl(content: string): { url: string; type: 'image' | 'video' | null } {
    const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
    const match = markdownImageRegex.exec(content);
    
    console.log('[LivePhotos] Extracting media from content:', content);
    console.log('[LivePhotos] Regex match:', match);
    
    if (!match) return { url: '', type: null };
    
    const url = match[1];
    console.log('[LivePhotos] Extracted URL:', url);
    
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      console.log('[LivePhotos] Detected image type');
      return { url, type: 'image' };
    } else if (url.match(/\.(mov|mp4|avi|webm)$/i)) {
      console.log('[LivePhotos] Detected video type');
      return { url, type: 'video' };
    }
    
    console.log('[LivePhotos] No media type matched');
    return { url: '', type: null };
  }

  findMediaPairs(blocks: BlockTree[]): MediaPair[] {
    console.log('[LivePhotos] Finding media pairs from blocks:', blocks.length);
    const pairs: MediaPair[] = [];
    
    // Group blocks by level and parent
    const groupedBlocks = this.groupBlocksByLevel(blocks);
    console.log('[LivePhotos] Grouped blocks by level:', groupedBlocks);
    
    for (const [levelKey, levelBlocks] of Object.entries(groupedBlocks)) {
      console.log('[LivePhotos] Processing level:', levelKey, 'with', levelBlocks.length, 'blocks');
      const consecutiveMediaBlocks = this.findConsecutiveMediaBlocks(levelBlocks);
      console.log('[LivePhotos] Found consecutive media groups:', consecutiveMediaBlocks.length);
      
      for (const group of consecutiveMediaBlocks) {
        console.log('[LivePhotos] Processing group:', group);
        const groupPairs = this.findValidPairs(group);
        console.log('[LivePhotos] Found pairs in group:', groupPairs.length);
        pairs.push(...groupPairs);
      }
    }
    
    console.log('[LivePhotos] Total pairs found:', pairs.length);
    return pairs;
  }

  private groupBlocksByLevel(blocks: BlockTree[]): Record<string, BlockTree[]> {
    const grouped: Record<string, BlockTree[]> = {};
    
    for (const block of blocks) {
      const key = `${block.level}-${block.parent?.uuid || 'root'}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(block);
    }
    
    return grouped;
  }

  private findConsecutiveMediaBlocks(blocks: BlockTree[]): BlockTree[][] {
    const groups: BlockTree[][] = [];
    let currentGroup: BlockTree[] = [];
    
    for (const block of blocks) {
      const media = this.extractMediaUrl(block.content);
      if (media.type) {
        currentGroup.push(block);
      } else {
        if (currentGroup.length >= 2) {
          groups.push([...currentGroup]);
        }
        currentGroup = [];
      }
    }
    
    if (currentGroup.length >= 2) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  private findValidPairs(blocks: BlockTree[]): MediaPair[] {
    console.log('[LivePhotos] Finding all valid pairs from', blocks.length, 'blocks');
    const pairs: MediaPair[] = [];
    
    // Look for image-video or video-image pairs
    for (let i = 0; i < blocks.length - 1; i++) {
      const block1 = blocks[i];
      const block2 = blocks[i + 1];
      
      const media1 = this.extractMediaUrl(block1.content);
      const media2 = this.extractMediaUrl(block2.content);
      
      console.log(`[LivePhotos] Checking pair ${i}:`, media1.type, media2.type);
      
      if (media1.type && media2.type && media1.type !== media2.type) {
        const imageBlock = media1.type === 'image' ? block1 : block2;
        const videoBlock = media1.type === 'video' ? block1 : block2;
        const imageUrl = media1.type === 'image' ? media1.url : media2.url;
        const videoUrl = media1.type === 'video' ? media1.url : media2.url;
        
        console.log('[LivePhotos] Potential pair found, checking match...');
        
        // Simple filename-based matching as fallback
        if (this.isSimpleMatch(imageUrl, videoUrl)) {
          console.log('[LivePhotos] Simple match found!');
          const matchScore = 1.0; // Perfect score for simple match
          pairs.push({
            imageBlock,
            videoBlock,
            imageUrl,
            videoUrl,
            matchScore
          });
        } else {
          const matchScore = this.calculateMatchScore(imageUrl, videoUrl);
          
          if (this.isValidMatch(imageUrl, videoUrl, matchScore)) {
            pairs.push({
              imageBlock,
              videoBlock,
              imageUrl,
              videoUrl,
              matchScore
            });
          }
        }
      }
    }
    
    console.log('[LivePhotos] Found', pairs.length, 'valid pairs');
    return pairs;
  }

  private isSimpleMatch(imageUrl: string, videoUrl: string): boolean {
    const imageFileName = this.extractFileName(imageUrl);
    const videoFileName = this.extractFileName(videoUrl);
    
    console.log('[LivePhotos] Testing simple match:', imageFileName, videoFileName);
    
    // Remove extensions
    const imageBase = imageFileName.replace(/\.[^.]*$/, '');
    const videoBase = videoFileName.replace(/\.[^.]*$/, '');
    
    console.log('[LivePhotos] Base names:', imageBase, videoBase);
    
    // Check if they have same prefix before the last 6 characters
    if (imageBase.length >= 6 && videoBase.length >= 6) {
      const imagePrefix = imageBase.slice(0, -6);
      const videoPrefix = videoBase.slice(0, -6);
      
      console.log('[LivePhotos] Prefixes:', imagePrefix, videoPrefix);
      
      if (imagePrefix === videoPrefix) {
        // Check that the last 6 characters are different
        const imageSuffix = imageBase.slice(-6);
        const videoSuffix = videoBase.slice(-6);
        
        console.log('[LivePhotos] Suffixes:', imageSuffix, videoSuffix);
        
        if (imageSuffix !== videoSuffix) {
          console.log('[LivePhotos] Simple pattern match confirmed!');
          return true;
        }
      }
    }
    
    return false;
  }

  private calculateMatchScore(imageUrl: string, videoUrl: string): number {
    try {
      console.log('[LivePhotos] Calculating match score for:', imageUrl, videoUrl);
      console.log('[LivePhotos] Using regex pattern:', this.settings.regexPattern);
      
      // Extract filename from URL
      const imageFileName = this.extractFileName(imageUrl);
      const videoFileName = this.extractFileName(videoUrl);
      
      console.log('[LivePhotos] Extracted filenames:', imageFileName, videoFileName);
      
      const regex = new RegExp(this.settings.regexPattern);
      
      const imageMatch = imageFileName.match(regex);
      const videoMatch = videoFileName.match(regex);
      
      console.log('[LivePhotos] Image regex match:', imageMatch);
      console.log('[LivePhotos] Video regex match:', videoMatch);
      
      if (!imageMatch || !videoMatch) {
        console.log('[LivePhotos] No regex match, trying simple pattern matching');
        
        // Fallback to simple pattern matching
        const simplePattern = /^(.*?)-([A-Za-z0-9]{5,6})\.(jpg|jpeg|png|gif|mov|mp4)$/;
        const imageSimpleMatch = imageFileName.match(simplePattern);
        const videoSimpleMatch = videoFileName.match(simplePattern);
        
        console.log('[LivePhotos] Image simple match:', imageSimpleMatch);
        console.log('[LivePhotos] Video simple match:', videoSimpleMatch);
        
        if (!imageSimpleMatch || !videoSimpleMatch) {
          console.log('[LivePhotos] No pattern match at all, score 0');
          return 0;
        }
        
        const imageBase = imageSimpleMatch[1];
        const videoBase = videoSimpleMatch[1];
        const imageRandom = imageSimpleMatch[2];
        const videoRandom = videoSimpleMatch[2];
        
        console.log('[LivePhotos] Simple match - Image base:', imageBase, 'random:', imageRandom);
        console.log('[LivePhotos] Simple match - Video base:', videoBase, 'random:', videoRandom);
        
        let score = 0;
        if (imageBase === videoBase) {
          score = 1.0; // Perfect match
          console.log('[LivePhotos] Perfect base name match, score 1.0');
        } else {
          const similarity = this.calculateStringSimilarity(imageBase, videoBase);
          score = similarity * 0.8;
          console.log('[LivePhotos] Base name similarity:', similarity, '*', 0.8, '=', score);
        }
        
        console.log('[LivePhotos] Final score (simple):', score);
        return score;
      }
      
      // Extract base name and random string from original regex
      const imageBase = imageMatch[1];
      const imageRandom = imageMatch[2];
      const videoBase = videoMatch[1];
      const videoRandom = videoMatch[2];
      
      console.log('[LivePhotos] Image base:', imageBase, 'random:', imageRandom);
      console.log('[LivePhotos] Video base:', videoBase, 'random:', videoRandom);
      
      // Calculate similarity score
      let score = 0;
      
      // Base name similarity (higher weight)
      if (imageBase === videoBase) {
        score += 0.8;
        console.log('[LivePhotos] Base names match exactly, +0.8');
      } else {
        // Partial match for base names
        const similarity = this.calculateStringSimilarity(imageBase, videoBase);
        score += similarity * 0.6;
        console.log('[LivePhotos] Base name similarity:', similarity, '*', 0.6, '=', similarity * 0.6);
      }
      
      // Random string should be different (this is expected)
      if (imageRandom !== videoRandom) {
        score += 0.2;
        console.log('[LivePhotos] Random strings different, +0.2');
      }
      
      console.log('[LivePhotos] Final score:', score);
      return score;
    } catch (error) {
      console.warn('[LivePhotos] Invalid regex pattern:', error);
      return 0;
    }
  }

  private extractFileName(url: string): string {
    return url.split('/').pop() || url;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private isValidMatch(imageUrl: string, videoUrl: string, score: number): boolean {
    return score >= 0.6; // Minimum 60% similarity
  }

  generateRendererTemplate(pair: MediaPair): string {
    return `{{renderer :live-photo, ${pair.imageUrl}, ${pair.videoUrl}}}`;
  }
}