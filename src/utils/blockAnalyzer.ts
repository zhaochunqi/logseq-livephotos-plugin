import type { BlockTree, MediaPair, PluginSettings } from "../types";

export class BlockAnalyzer {
  private settings: PluginSettings;

  constructor(settings: PluginSettings) {
    this.settings = settings;
  }

  async getCurrentPageBlocks(): Promise<BlockTree[]> {
    const currentPage = await logseq.Editor.getCurrentPage();
    
    if (!currentPage || !currentPage.name) {
      return [];
    }

    const blocksTree = await logseq.Editor.getPageBlocksTree(currentPage.name as any);
    
    const flattened = this.flattenBlockTree(blocksTree || []);
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
    
    if (!match) return { url: '', type: null };
    
    const url = match[1];
    
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return { url, type: 'image' };
    } else if (url.match(/\.(mov|mp4|avi|webm)$/i)) {
      return { url, type: 'video' };
    }
    
    return { url: '', type: null };
  }

  findMediaPairs(blocks: BlockTree[]): MediaPair[] {
    const pairs: MediaPair[] = [];
    
    const groupedBlocks = this.groupBlocksByLevel(blocks);
    
    for (const [levelKey, levelBlocks] of Object.entries(groupedBlocks)) {
      const consecutiveMediaBlocks = this.findConsecutiveMediaBlocks(levelBlocks);
      
      for (const group of consecutiveMediaBlocks) {
        const groupPairs = this.findValidPairs(group);
        pairs.push(...groupPairs);
      }
    }
    
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
    const pairs: MediaPair[] = [];
    
    for (let i = 0; i < blocks.length - 1; i++) {
      const block1 = blocks[i];
      const block2 = blocks[i + 1];
      
      const media1 = this.extractMediaUrl(block1.content);
      const media2 = this.extractMediaUrl(block2.content);
      
      if (media1.type && media2.type && media1.type !== media2.type) {
        const imageBlock = media1.type === 'image' ? block1 : block2;
        const videoBlock = media1.type === 'video' ? block1 : block2;
        const imageUrl = media1.type === 'image' ? media1.url : media2.url;
        const videoUrl = media1.type === 'video' ? media1.url : media2.url;
        
        if (this.isSimpleMatch(imageUrl, videoUrl)) {
          const matchScore = 1.0;
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
    
    return pairs;
  }

  private isSimpleMatch(imageUrl: string, videoUrl: string): boolean {
    const imageFileName = this.extractFileName(imageUrl);
    const videoFileName = this.extractFileName(videoUrl);
    
    const imageBase = imageFileName.replace(/\.[^.]*$/, '');
    const videoBase = videoFileName.replace(/\.[^.]*$/, '');
    
    if (imageBase.length >= 6 && videoBase.length >= 6) {
      const imagePrefix = imageBase.slice(0, -6);
      const videoPrefix = videoBase.slice(0, -6);
      
      if (imagePrefix === videoPrefix) {
        const imageSuffix = imageBase.slice(-6);
        const videoSuffix = videoBase.slice(-6);
        
        if (imageSuffix !== videoSuffix) {
          return true;
        }
      }
    }
    
    return false;
  }

  private calculateMatchScore(imageUrl: string, videoUrl: string): number {
    try {
      const imageFileName = this.extractFileName(imageUrl);
      const videoFileName = this.extractFileName(videoUrl);
      
      const regex = new RegExp(this.settings.regexPattern);
      
      const imageMatch = imageFileName.match(regex);
      const videoMatch = videoFileName.match(regex);
      
      if (!imageMatch || !videoMatch) {
        const simplePattern = /^(.*?)-([A-Za-z0-9]{5,6})\.(jpg|jpeg|png|gif|mov|mp4)$/;
        const imageSimpleMatch = imageFileName.match(simplePattern);
        const videoSimpleMatch = videoFileName.match(simplePattern);
        
        if (!imageSimpleMatch || !videoSimpleMatch) {
          return 0;
        }
        
        const imageBase = imageSimpleMatch[1];
        const videoBase = videoSimpleMatch[1];
        const imageRandom = imageSimpleMatch[2];
        const videoRandom = videoSimpleMatch[2];
        
        let score = 0;
        if (imageBase === videoBase) {
          score = 1.0;
        } else {
          const similarity = this.calculateStringSimilarity(imageBase, videoBase);
          score = similarity * 0.8;
        }
        
        return score;
      }
      
      const imageBase = imageMatch[1];
      const imageRandom = imageMatch[2];
      const videoBase = videoMatch[1];
      const videoRandom = videoMatch[2];
      
      let score = 0;
      
      if (imageBase === videoBase) {
        score += 0.8;
      } else {
        const similarity = this.calculateStringSimilarity(imageBase, videoBase);
        score += similarity * 0.6;
      }
      
      if (imageRandom !== videoRandom) {
        score += 0.2;
      }
      
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