import { describe, it, expect, beforeEach } from 'vitest';
import { Track } from '@spotify/web-api-ts-sdk';
import { JSONExportTarget, InMemoryExportTarget } from '../data/Exporters';
import { ExportController } from '../data/ExportController';

// Mock track data for testing
const createMockTrack = (id: string, name: string): Track => ({
  id,
  name,
  artists: [],
  album: {} as any,
  duration_ms: 180000,
  explicit: false,
  external_urls: { spotify: '' },
  href: '',
  is_local: false,
  popularity: 75,
  preview_url: null,
  track_number: 1,
  disc_number: 1,
  type: 'track',
  uri: `spotify:track:${id}`,
  is_playable: true,
  external_ids: { upc: '', isrc: '', ean: '' },
  available_markets: ['US'],
  episode: false,
  track: true
});

const mockTracks: Track[] = [
  createMockTrack('track1', 'Test Track 1'),
  createMockTrack('track2', 'Test Track 2'),
  createMockTrack('track3', 'Test Track 3'),
  createMockTrack('track4', 'Test Track 4'),
  createMockTrack('track5', 'Test Track 5'),
];

describe('ExportController with TestExportTarget', () => {
  let testTarget: TestExportTarget;
  let controller: ExportController;

  beforeEach(() => {
    testTarget = new TestExportTarget();
    controller = new ExportController(testTarget);
  });

  describe('Basic functionality', () => {
    it('should append tracks successfully', async () => {
      await controller.append(mockTracks.slice(0, 3));
      
      const trackIds = await testTarget.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track1', 'track2', 'track3']);
      expect(testTarget.getTracksAddedCount()).toBe(3);
    });

    it('should replace tracks successfully', async () => {
      // Add initial tracks
      await controller.append(mockTracks.slice(0, 2));
      expect(testTarget.getTracksAddedCount()).toBe(2);

      // Replace with new tracks
      await controller.replace(mockTracks.slice(2, 4));
      
      const trackIds = await testTarget.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track3', 'track4']);
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle failure after partial tracks added', async () => {
      // Configure to fail after adding 2 tracks (only once)
      testTarget.setFailurePoints([2], 'Test failure after 2 tracks');

      // Try to add 4 tracks - should succeed with recovery
      await controller.append(mockTracks.slice(0, 4));

      // Should have all 4 tracks despite the failure
      const trackIds = await testTarget.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track1', 'track2', 'track3', 'track4']);
      expect(testTarget.getTracksAddedCount()).toBe(4);
    });

    it('should handle failure with batching', async () => {
      // Configure to fail after adding 3 tracks (only once)
      testTarget.setFailurePoints([3], 'Test failure after 3 tracks');

      // Try to add 5 tracks with batch size 2
      await controller.append(mockTracks, 2);

      // Should have all 5 tracks despite the failure
      const trackIds = await testTarget.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track1', 'track2', 'track3', 'track4', 'track5']);
      expect(testTarget.getTracksAddedCount()).toBe(5);
    });

    it('should handle replace operation with failure', async () => {
      // Add initial tracks
      await controller.append(mockTracks.slice(0, 2));
      
      // Configure to fail after adding 1 more track (so at total count of 3)
      testTarget.setFailurePoints([3], 'Test failure during replace');

      // Replace should succeed with recovery
      await controller.replace(mockTracks.slice(2, 5));

      const trackIds = await testTarget.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track3', 'track4', 'track5']);
    });
  });

  describe('canReplace functionality', () => {
    it('should support replace operations', () => {
      expect(controller.canReplace).toBe(true);
    });
  });
});

describe('JSONExportTarget', () => {
  let jsonTarget: JSONExportTarget;
  let controller: ExportController;

  beforeEach(() => {
    jsonTarget = new JSONExportTarget();
    controller = new ExportController(jsonTarget);
  });

  it('should export tracks as JSON', async () => {
    await controller.append(mockTracks.slice(0, 2));
    
    const jsonData = jsonTarget.getData();
    const parsed = JSON.parse(jsonData);
    
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('track1');
    expect(parsed[0].name).toBe('Test Track 1');
    expect(parsed[1].id).toBe('track2');
    expect(parsed[1].name).toBe('Test Track 2');
  });
});

class TestExportTarget extends InMemoryExportTarget {
  private tracksAddedCount = 0;
  private failurePoints: number[] = [];
  private failureMessage: string = 'Simulated failure';

  /**
   * Configure the target to fail after adding specific numbers of tracks
   * @param trackCounts Array of track counts where failures should occur (consumed on use)
   * @param message Error message to throw
   */
  setFailurePoints(trackCounts: number[], message: string = 'Simulated failure'): void {
    this.failurePoints = [...trackCounts]; // Copy array to avoid external mutation
    this.failureMessage = message;
  }

  /**
   * Configure the target to fail after adding a specific number of tracks (legacy method)
   * @param trackCount Number of tracks to add before failing (null to disable failure)
   * @param message Error message to throw
   */
  setFailurePoint(trackCount: number | null, message: string = 'Simulated failure'): void {
    this.failurePoints = trackCount !== null ? [trackCount] : [];
    this.failureMessage = message;
  }

  async addTracks(tracks: Track[]): Promise<void> {
    for (const track of tracks) {
      // Check if we should fail before adding this track
      if (this.failurePoints.length > 0 && this.tracksAddedCount >= this.failurePoints[0]) {
        // Consume the failure point so it won't fail again at the same count
        this.failurePoints.shift();
        throw new Error(this.failureMessage);
      }
      
      this.tracks.push(track);
      this.tracksAddedCount++;
    }
  }

  /**
   * Reset the target to initial state
   */
  reset(): void {
    this.tracks = [];
    this.tracksAddedCount = 0;
    this.failurePoints = [];
    this.failureMessage = 'Simulated failure';
  }

  /**
   * Get the number of tracks that have been added
   */
  getTracksAddedCount(): number {
    return this.tracksAddedCount;
  }

  getData(): Track[] {
    return [...this.tracks];
  }
}