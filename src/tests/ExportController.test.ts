import { describe, it, expect, beforeEach } from 'vitest';
import { Track } from '@spotify/web-api-ts-sdk';
import { JSONExportTarget, InMemoryExportTarget, PlaylistExportTarget } from '../data/Exporters';
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

// Test both target types with the same test suite
[
  {
    name: 'TestExportTarget',
    createTarget: () => new TestExportTarget(),
    setFailurePoints: (target: any, points: number[], message: string) => target.setFailurePoints(points, message),
    getTracksAddedCount: (target: any) => target.getTracksAddedCount()
  },
  {
    name: 'PlaylistExportTarget',
    createTarget: () => {
      const mockSdk = new MockSpotifySDK();
      const target = new PlaylistExportTarget(mockSdk as any, 'test-playlist');
      (target as any).mockSdk = mockSdk; // Store reference for failure control
      return target;
    },
    setFailurePoints: (target: any, points: number[], message: string) => target.mockSdk.setFailurePoints(points, message),
    getTracksAddedCount: (target: any) => target.mockSdk.getTracksAddedCount()
  }
].forEach(({ name, createTarget, setFailurePoints, getTracksAddedCount }) => {

describe(`ExportController with ${name}`, () => {
  let target: any;
  let controller: ExportController;

  beforeEach(() => {
    target = createTarget();
    if (target.mockSdk) {
      target.mockSdk.reset();
    } else if (target.reset) {
      target.reset();
    }
    controller = new ExportController(target);
  });

  describe('Basic functionality', () => {
    it('should append tracks successfully', async () => {
      await controller.append(mockTracks.slice(0, 3));
      
      const trackIds = await target.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track1', 'track2', 'track3']);
      expect(getTracksAddedCount(target)).toBe(3);
    });

    it('should replace tracks successfully', async () => {
      // Add initial tracks
      await controller.append(mockTracks.slice(0, 2));
      expect(getTracksAddedCount(target)).toBe(2);

      // Replace with new tracks
      await controller.replace(mockTracks.slice(2, 4));
      
      const trackIds = await target.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track3', 'track4']);
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle failure after partial tracks added', async () => {
      // Configure to fail after adding 2 tracks (only once)
      setFailurePoints(target, [2], 'Test failure after 2 tracks');

      // Try to add 4 tracks - should succeed with recovery
      await controller.append(mockTracks.slice(0, 4));

      // Should have all 4 tracks despite the failure
      const trackIds = await target.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track1', 'track2', 'track3', 'track4']);
      expect(getTracksAddedCount(target)).toBe(4);
    });

    it('should handle failure with batching', async () => {
      // Configure to fail after adding 3 tracks (only once)
      setFailurePoints(target, [3], 'Test failure after 3 tracks');

      // Try to add 5 tracks with batch size 2
      await controller.append(mockTracks, 2);

      // Should have all 5 tracks despite the failure
      const trackIds = await target.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track1', 'track2', 'track3', 'track4', 'track5']);
      expect(getTracksAddedCount(target)).toBe(5);
    });

    it('should handle replace operation with failure', async () => {
      // Add initial tracks
      await controller.append(mockTracks.slice(0, 2));
      
      // Configure to fail after adding 1 more track (so at total count of 3)
      setFailurePoints(target, [3], 'Test failure during replace');

      // Replace should succeed with recovery
      await controller.replace(mockTracks.slice(2, 5));

      const trackIds = await target.getCurrentTrackIDs();
      expect(trackIds).toEqual(['track3', 'track4', 'track5']);
    });
  });

  describe('canReplace functionality', () => {
    it('should support replace operations', () => {
      expect(controller.canReplace).toBe(true);
    });
  });
});

}); // End of forEach loop

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

// Mock Spotify SDK for testing PlaylistExportTarget
class MockSpotifySDK {
  private playlistTracks: Track[] = [];
  private failurePoints: number[] = [];
  private tracksAddedCount = 0;
  private failureMessage = 'Simulated API failure';

  playlists = {
    getPlaylistItems: async (_playlistId: string) => {
      return {
        items: this.playlistTracks.map(track => ({ track })),
        total: this.playlistTracks.length
      };
    },

    addItemsToPlaylist: async (_playlistId: string, trackUris: string[]) => {
      // Check for failure before adding
      if (this.failurePoints.length > 0 && this.tracksAddedCount >= this.failurePoints[0]) {
        this.failurePoints.shift();
        throw new Error(this.failureMessage);
      }

      // Add tracks to mock playlist
      const newTracks = trackUris.map(uri => {
        const trackId = uri.replace('spotify:track:', '');
        return createMockTrack(trackId, `Track ${trackId}`);
      });

      this.playlistTracks.push(...newTracks);
      this.tracksAddedCount += newTracks.length;
    },

    removeItemsFromPlaylist: async (_playlistId: string, options: { tracks: Array<{ uri: string; positions: number[] }> }) => {
      // Remove tracks by position (in reverse order to maintain indices)
      const positionsToRemove = options.tracks.flatMap(track => track.positions).sort((a, b) => b - a);
      for (const position of positionsToRemove) {
        if (position >= 0 && position < this.playlistTracks.length) {
          this.playlistTracks.splice(position, 1);
        }
      }
    }
  };

  setFailurePoints(trackCounts: number[], message: string = 'Simulated API failure'): void {
    this.failurePoints = [...trackCounts];
    this.failureMessage = message;
  }

  reset(): void {
    this.playlistTracks = [];
    this.failurePoints = [];
    this.tracksAddedCount = 0;
    this.failureMessage = 'Simulated API failure';
  }

  getTracksAddedCount(): number {
    return this.tracksAddedCount;
  }

  getCurrentTrackIDs(): string[] {
    return this.playlistTracks.map(track => track.id);
  }
}