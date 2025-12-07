import { Track } from '@spotify/web-api-ts-sdk';

/**
 * Progress handler function type
 */
export type ProgressHandler = (description: string, completed: number, numberProcessed: number) => void;

export interface ExportTarget {
  /**
   * Initialize the export target (e.g., create playlist, set up file)
   */
  initialize(): Promise<void>;

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

  /**
   * Get description of the overall export purpose
   * @returns Description like "Exporting to new playlist 'My Playlist'"
   */
  getOverallDescription(): string;

  /**
   * Get description of the initialization step
   * @returns Description like "Creating playlist"
   */
  getInitializationDescription(): string;
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
  private onProgress?: ProgressHandler;

  constructor(target: ExportTarget, maxRetries: number = 3, onProgress?: ProgressHandler) {
    this.target = target;
    this.maxRetries = maxRetries;
    this.onProgress = onProgress;
  }

  private async addTracksWithRecovery(
    tracks: Track[], 
    batchSize: number = 50, 
    retryCount: number = 0,
    totalOperations: number,
    currentOperation: number,
    overallDescription: string
  ): Promise<void> {
    // Get starting track IDs
    let currentTrackIds = await this.target.getCurrentTrackIDs();
    
    // Process tracks in batches
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const batchTrackIds = batch.map(t => t.id).filter(Boolean) as string[];
      
      // Calculate progress for this batch operation
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(tracks.length / batchSize);
      const operationProgress = currentOperation / totalOperations;
      const batchProgress = (batchNumber - 1) / totalBatches * (1 / totalOperations);
      const overallProgress = operationProgress + batchProgress;
      
      const description = `${overallDescription}: Adding tracks batch ${batchNumber}/${totalBatches}`;
      this.onProgress?.(description, overallProgress, currentTrackIds.length + (batchNumber - 1) * batchSize);
      
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
          await this.addTracksWithRecovery(
            remainingAllTracks, 
            batchSize, 
            retryCount + 1,
            totalOperations,
            currentOperation,
            overallDescription
          );
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
    const overallDescription = this.target.getOverallDescription();
    
    // Calculate total operations: initialize + add tracks
    const totalOperations = 2;
    
    // Step 1: Initialize
    this.onProgress?.(`${overallDescription}: ${this.target.getInitializationDescription()}`, 0, 0);
    await this.target.initialize();
    
    // Step 2: Add tracks
    await this.addTracksWithRecovery(tracks, effectiveBatchSize, 0, totalOperations, 1, overallDescription);
    
    // Complete
    this.onProgress?.(`${overallDescription}: Complete`, 1, tracks.length);
  }

  async replace(tracks: Track[], batchSize?: number): Promise<void> {
    if (!this.canReplace) {
      throw new Error('Target does not support replace operation (removeTracks method not available)');
    }
    
    const effectiveBatchSize = batchSize ?? this.target.getMaxAddBatchSize();
    const overallDescription = this.target.getOverallDescription();
    
    // Calculate total operations: initialize + read current tracks + clear + add tracks
    const totalOperations = 4;
    
    // Step 1: Initialize
    this.onProgress?.(`${overallDescription}: ${this.target.getInitializationDescription()}`, 0, 0);
    await this.target.initialize();
    
    // Step 2: Read current tracks for progress counting
    this.onProgress?.(`${overallDescription}: Reading current tracks`, 0.25, 0);
    const currentTrackIds = await this.target.getCurrentTrackIDs();
    
    // Step 3: Clear existing tracks
    if (currentTrackIds.length > 0) {
      this.onProgress?.(`${overallDescription}: Clearing existing tracks`, 0.5, 0);
      await (this.target as any).removeTracks(0, undefined);
    }
    
    // Step 4: Add new tracks
    await this.addTracksWithRecovery(tracks, effectiveBatchSize, 0, totalOperations, 3, overallDescription);
    
    // Complete
    this.onProgress?.(`${overallDescription}: Complete`, 1, tracks.length);
  }
}

