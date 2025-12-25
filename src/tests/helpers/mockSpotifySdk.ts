import { PlayHistory, Track, SavedTrack } from '@spotify/web-api-ts-sdk';
import { vi } from 'vitest';

type SearchHandler = (
  query: string,
  types: string[],
  market?: string,
  limit?: number,
  offset?: number
) => any;

/**
 * Unified mock Spotify SDK with spy-able search and playlist helpers.
 */
export class MockSpotifySdk {
  private playlistTracks: Track[] = [];
  private failurePoints: number[] = [];
  private tracksAddedCount = 0;
  private failureMessage = 'Simulated API failure';
  private nextPlaylistId = 1;
  private recentTracks: PlayHistory[] = [];
  private recentLimit: number;
  private albumTracks: Record<string, Track[]> = {};
  private likedTracks: SavedTrack[] = [];
  private queueItems: Track[] = [];
  private availableDevices: { id: string; name: string }[] = [];

  constructor(searchHandler?: SearchHandler, options?: { recentLimit?: number }) {
    this.search = vi.fn(
      searchHandler ??
        (() =>
          Promise.resolve({
            tracks: { items: [] }
          }))
    );
    this.recentLimit = options?.recentLimit ?? 100;
  }

  // Search API stub (spy-able)
  search: ReturnType<typeof vi.fn>;

  currentUser = {
    profile: async () => ({ id: 'test-user-id' }),
    tracks: {
      savedTracks: vi.fn(async (limit: number = 50, offset: number = 0) => {
        const clampedLimit = Math.min(Math.max(limit, 1), 50);
        const items = this.likedTracks.slice(offset, offset + clampedLimit);
        return {
          items,
          total: this.likedTracks.length
        };
      })
    }
  };

  playlists = {
    createPlaylist: async (_userId: string, options: { name: string; description?: string; public?: boolean }) => {
      const playlistId = `playlist-${this.nextPlaylistId++}`;
      return {
        id: playlistId,
        name: options.name,
        description: options.description || '',
        public: options.public || false
      };
    },

    getPlaylistItems: vi.fn(async (_playlistId: string, _market?: string, _fields?: any, limit: number = 50, offset: number = 0) => {
      const clampedLimit = Math.min(Math.max(limit, 1), 50);
      const items = this.playlistTracks.slice(offset, offset + clampedLimit).map(track => ({ track }));
      return {
        items,
        total: this.playlistTracks.length
      };
    }),

    addItemsToPlaylist: async (_playlistId: string, trackUris: string[]) => {
      // Check for failure before adding
      if (this.failurePoints.length > 0 && this.tracksAddedCount >= this.failurePoints[0]) {
        this.failurePoints.shift();
        throw new Error(this.failureMessage);
      }

      // Add tracks to mock playlist
      const newTracks = trackUris.map(uri => {
        const trackId = uri.replace('spotify:track:', '');
        return {
          id: trackId,
          name: `Track ${trackId}`,
          uri,
          type: 'track' as const
        } as Track;
      });

      this.playlistTracks.push(...newTracks);
      this.tracksAddedCount += newTracks.length;
    },

    updatePlaylistItems: async (_playlistId: string, options: { range_start: number; range_length: number; uris: string[]; insert_before?: number }) => {
      // If uris is empty and insert_before is omitted, this is a removal operation
      if (options.uris.length === 0 && options.insert_before === undefined) {
        // Remove tracks from range_start to range_start + range_length
        this.playlistTracks.splice(options.range_start, options.range_length);
      } else {
        // This would be an insert/replace operation (not implemented for our tests)
        throw new Error('Mock updatePlaylistItems only supports removal operations');
      }
    }
  };

  albums = {
    tracks: vi.fn(async (albumId: string, _market: string = 'US', limit: number = 50, offset: number = 0) => {
      const tracks = this.albumTracks[albumId] ?? [];
      const clampedLimit = Math.min(Math.max(limit, 1), 50);
      return {
        items: tracks.slice(offset, offset + clampedLimit),
        total: tracks.length
      };
    })
  };

  player = {
    getAvailableDevices: async () => ({
      devices: this.availableDevices.map(d => ({ id: d.id, name: d.name }))
    }),
    getRecentlyPlayedTracks: async (limit: number = 50, _range?: { type: 'before'; timestamp: string }) => {
      const safeLimit = Math.min(Math.max(limit, 1), this.recentLimit);
      const items = this.recentTracks.slice(0, safeLimit);
      const before = items.length < this.recentTracks.length ? items[items.length - 1]?.played_at ?? null : null;
      return {
        items,
        next: null,
        cursors: {
          before
        }
      };
    },
    addItemToPlaybackQueue: vi.fn(async (uri: string, _deviceId?: string) => {
      const id = uri.replace('spotify:track:', '');
      this.queueItems.push({ id, type: 'track', uri, is_local: false } as Track);
    }),
    getUsersQueue: vi.fn(async () => ({
      currently_playing: this.queueItems[0] ?? null,
      queue: this.queueItems.slice(1)
    }))
  };

  addRecentTrack(track: Track, playedAt: Date = new Date()): void {
    const entry: PlayHistory = {
      track,
      played_at: playedAt.toISOString(),
      context: {} as any
    };
    this.recentTracks.unshift(entry);
    if (this.recentTracks.length > this.recentLimit) {
      this.recentTracks.length = this.recentLimit;
    }
  }

  setAlbumTracks(albumId: string, tracks: Track[]): void {
    this.albumTracks[albumId] = tracks;
  }

  setLikedTracks(tracks: SavedTrack[]): void {
    this.likedTracks = [...tracks];
  }

  setQueue(items: Track[]): void {
    this.queueItems = [...items];
  }

  setAvailableDevices(devices: { id: string; name: string }[]): void {
    this.availableDevices = [...devices];
  }

  setFailurePoints(trackCounts: number[], message: string = 'Simulated API failure'): void {
    this.failurePoints = [...trackCounts];
    this.failureMessage = message;
  }

  reset(): void {
    this.playlistTracks = [];
    this.failurePoints = [];
    this.tracksAddedCount = 0;
    this.failureMessage = 'Simulated API failure';
    this.likedTracks = [];
    this.queueItems = [];
    this.availableDevices = [];
    if (this.search.mockReset) {
      this.search.mockReset();
    }
  }

  getTracksAddedCount(): number {
    return this.tracksAddedCount;
  }

  getCurrentTrackIDs(): string[] {
    return this.playlistTracks.map(track => track.id);
  }

  // Test helper methods
  addExistingTrack(track: Track): void {
    this.playlistTracks.push(track);
    this.tracksAddedCount++;
  }

  setExistingTracks(tracks: Track[]): void {
    this.playlistTracks = [...tracks];
    this.tracksAddedCount = tracks.length;
  }
}
