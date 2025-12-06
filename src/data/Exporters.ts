import { Track } from '@spotify/web-api-ts-sdk';
import { ExportTarget, RemovableExportTarget } from './ExportController';

/**
 * Base class for export targets that store tracks in memory
 */
export abstract class InMemoryExportTarget implements RemovableExportTarget {
  protected tracks: Track[] = [];

  async addTracks(tracks: Track[]): Promise<void> {
    this.tracks.push(...tracks);
  }

  async getCurrentTrackIDs(): Promise<string[]> {
    return this.tracks.map(track => track.id).filter(Boolean) as string[];
  }

  async removeTracks(start: number, end: number | undefined): Promise<void> {
    if (end === undefined) {
      // Remove from start to end of array
      this.tracks.splice(start);
    } else {
      // Remove from start to end (exclusive)
      this.tracks.splice(start, end - start);
    }
  }

  getMaxAddBatchSize(): number {
    return 1000; // Large batch size for in-memory operations
  }

  /**
   * Abstract method to get the exported data
   * @returns The tracks in the desired export format
   */
  abstract getData(): any;
}

/**
 * Export target that provides tracks as JSON
 */
export class JSONExportTarget extends InMemoryExportTarget {
  getData(): string {
    return JSON.stringify(this.tracks, null, 2);
  }
}
