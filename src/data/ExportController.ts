import { Track } from '@spotify/web-api-ts-sdk';

export interface ExportTarget {
  /**
   * Add tracks to the target
   * @param tracks Array of tracks to add
   * @returns Promise resolving to successfully added tracks
   */
  addTracks(tracks: Track[]): Promise<void>;

  /**
   * Get all current tracks in the target
   * @returns Promise resolving to current tracks
   */
  getCurrentTrackIDs(): Promise<string[]>;

  /**
   * @returns maximum batch size for adding tracks
   */
  getMaxAddBatchSize(): number;
}

export interface RemovableExportTarget extends ExportTarget {
  /**
   * Remove tracks from the target
   * @param tracks Array of tracks to remove
   * @returns Promise resolving to successfully removed tracks
   */
  removeTracks(start: number, end: number | undefined): Promise<void>;
}

/**
 * Controller for exporting tracks to various targets with error handling
 */
export class ExportController {
  private target: ExportTarget;
  private maxRetries: number;

  constructor(target: ExportTarget, maxRetries: number = 3) {
    this.target = target;
    this.maxRetries = maxRetries;
  }

  private async addTracksWithRecovery(tracks: Track[], batchSize: number = 50, retryCount: number = 0): Promise<void> {
    // Get starting track IDs
    let currentTrackIds = await this.target.getCurrentTrackIDs();
    
    // Process tracks in batches
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const batchTrackIds = batch.map(t => t.id).filter(Boolean) as string[];
      
      try {
        // Add batch and update current list
        await this.target.addTracks(batch);
        currentTrackIds = [...currentTrackIds, ...batchTrackIds];
      } catch (error) {
        console.log(`AddTracks failed (retry ${retryCount}/${this.maxRetries}), checking target state for recovery...`);
        
        // Check if we've exceeded retry limit
        if (retryCount >= this.maxRetries) {
          console.error(`Max retries (${this.maxRetries}) exceeded. Giving up on remaining tracks.`);
          throw new Error(`Export failed after ${this.maxRetries} retry attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Get actual current state after failure
        const actualTrackIds = await this.target.getCurrentTrackIDs();
        
        // Calculate how many tracks from current batch were successfully added
        const tracksAddedFromBatch = Math.max(0, actualTrackIds.length - currentTrackIds.length);
        
        // Update our tracking to reflect actual state
        currentTrackIds = actualTrackIds;
        
        // Continue with remaining tracks from this batch plus all remaining batches
        const remainingBatchTracks = batch.slice(tracksAddedFromBatch);
        const remainingAllTracks = [...remainingBatchTracks, ...tracks.slice(i + batchSize)];
        
        if (remainingAllTracks.length > 0) {
          // Add exponential backoff delay before retrying
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 second delay
          if (retryCount > 0) {
            console.log(`Waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
          // Recursively process remaining tracks with incremented retry count
          await this.addTracksWithRecovery(remainingAllTracks, batchSize, retryCount + 1);
          return; // Exit since recursion handles the rest
        }
      }
    }
  }

  get canReplace(): boolean {
    return typeof (this.target as any).removeTracks === 'function';
  }

  async append(tracks: Track[], batchSize?: number): Promise<void> {
    const effectiveBatchSize = batchSize ?? this.target.getMaxAddBatchSize();
    await this.addTracksWithRecovery(tracks, effectiveBatchSize);
  }

  async replace(tracks: Track[], batchSize?: number): Promise<void> {
    if (!this.canReplace) {
      throw new Error('Target does not support replace operation (removeTracks method not available)');
    }
    
    // Clear existing tracks first by removing all
    const currentTrackIds = await this.target.getCurrentTrackIDs();
    if (currentTrackIds.length > 0) {
      await (this.target as any).removeTracks(0, undefined);
    }
    
    // Add new tracks
    const effectiveBatchSize = batchSize ?? this.target.getMaxAddBatchSize();
    await this.addTracksWithRecovery(tracks, effectiveBatchSize);
  }
}

