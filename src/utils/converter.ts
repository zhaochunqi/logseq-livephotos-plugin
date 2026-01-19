import { BlockAnalyzer } from "./blockAnalyzer";
import { SettingsManager } from "./settingsManager";
import type { MediaPair } from "../types";

export class LivePhotoConverter {
  private blockAnalyzer: BlockAnalyzer;
  private settingsManager: SettingsManager;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.blockAnalyzer = new BlockAnalyzer(settingsManager.getSettings());
  }

  async convertCurrentPage(): Promise<{ success: number; failed: number; total: number }> {
    try {
      const blocks = await this.blockAnalyzer.getCurrentPageBlocks();
      const pairs = this.blockAnalyzer.findMediaPairs(blocks);
      
      let success = 0;
      let failed = 0;
      
      for (const pair of pairs) {
        try {
          await this.convertPair(pair);
          success++;
        } catch (error) {
          console.error('Failed to convert pair:', error);
          failed++;
        }
      }
      
      return {
        success,
        failed,
        total: pairs.length
      };
    } catch (error) {
      console.error('Failed to convert current page:', error);
      return { success: 0, failed: 0, total: 0 };
    }
  }

  async convertPair(pair: MediaPair): Promise<void> {
    const rendererTemplate = this.blockAnalyzer.generateRendererTemplate(pair);
    
    // Replace the image block content with the renderer template
    await logseq.Editor.updateBlock(pair.imageBlock.uuid, rendererTemplate);
    
    // Remove the video block
    await logseq.Editor.removeBlock(pair.videoBlock.uuid);
  }

  async previewConversions(): Promise<MediaPair[]> {
    try {
      console.log('[LivePhotos] Starting preview conversions...');
      const blocks = await this.blockAnalyzer.getCurrentPageBlocks();
      console.log('[LivePhotos] Got blocks for preview:', blocks.length);
      const pairs = this.blockAnalyzer.findMediaPairs(blocks);
      console.log('[LivePhotos] Preview found pairs:', pairs.length);
      return pairs;
    } catch (error) {
      console.error('[LivePhotos] Failed to preview conversions:', error);
      return [];
    }
  }

  async showPreviewDialog(): Promise<void> {
    console.log('[LivePhotos] Starting preview dialog...');
    const pairs = await this.previewConversions();
    
    console.log('[LivePhotos] Preview dialog found pairs:', pairs.length);
    
    if (pairs.length === 0) {
      logseq.UI.showMsg('No convertible media pairs found on current page.', 'info');
      return;
    }
    
    // Create preview text
    const previewText = pairs.map((pair, index) => 
      `Pair ${index + 1} (${(pair.matchScore * 100).toFixed(1)}%):\n` +
      `  Image: ${this.getFileName(pair.imageUrl)}\n` +
      `  Video: ${this.getFileName(pair.videoUrl)}\n`
    ).join('\n');
    
    console.log('[LivePhotos] Preview text:', previewText);
    
    const shouldConvert = await this.confirmConversion(pairs.length, previewText);
    
    if (shouldConvert) {
      const result = await this.convertCurrentPage();
      logseq.UI.showMsg(
        `Conversion complete: ${result.success} successful, ${result.failed} failed`,
        result.failed > 0 ? 'warning' : 'success'
      );
    }
  }

  private async confirmConversion(pairCount: number, previewText: string): Promise<boolean> {
    // For now, we'll use a simple approach and always return true
    // In a real implementation, you'd use a proper confirmation dialog
    logseq.UI.showMsg(
      `Found ${pairCount} Media Pair${pairCount > 1 ? 's' : ''} to Convert:\n\n${previewText}\nConverting...`,
      'info'
    );
    return true;
  }

  private generatePreviewContent(pairs: MediaPair[]): string {
    return pairs.map((pair, index) => `
      <div style="
        border: 1px solid #ddd; 
        border-radius: 4px; 
        padding: 12px; 
        margin-bottom: 12px; 
        background: #f9f9f9;
      ">
        <h4 style="margin: 0 0 8px 0; color: #333;">Pair ${index + 1} (Score: ${(pair.matchScore * 100).toFixed(1)}%)</h4>
        <div style="font-size: 12px; color: #666;">
          <div><strong>Image:</strong> ${this.getFileName(pair.imageUrl)}</div>
          <div><strong>Video:</strong> ${this.getFileName(pair.videoUrl)}</div>
        </div>
        <div style="margin-top: 8px; padding: 8px; background: white; border-radius: 3px; font-family: monospace; font-size: 11px;">
          {{renderer :live-photo, ${pair.imageUrl}, ${pair.videoUrl}}}
        </div>
      </div>
    `).join('');
  }

  private getFileName(url: string): string {
    return url.split('/').pop() || url;
  }

  async convertSelectedBlocks(selectedBlockUuids: string[]): Promise<{ success: number; failed: number }> {
    const blocks = await Promise.all(
      selectedBlockUuids.map(uuid => logseq.Editor.getBlock(uuid))
    );
    
    const validBlocks = blocks.filter(block => block !== null);
    
    // Convert to BlockTree format for analysis
    const blockTrees = validBlocks.map(block => ({
      uuid: block!.uuid,
      content: block!.content || '',
      level: 0,
      parent: undefined
    }));
    
    const pairs = this.blockAnalyzer.findMediaPairs(blockTrees);
    
    let success = 0;
    let failed = 0;
    
    for (const pair of pairs) {
      try {
        await this.convertPair(pair);
        success++;
      } catch (error) {
        console.error('Failed to convert selected pair:', error);
        failed++;
      }
    }
    
    return { success, failed };
  }

  updateSettings(): void {
    this.blockAnalyzer = new BlockAnalyzer(this.settingsManager.getSettings());
  }
}