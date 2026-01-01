import { PlayHistory, Track, SavedTrack } from '@spotify/web-api-ts-sdk';
import { vi } from 'vitest';

type SearchHandler = (
  query: string,
  types: string[],
  market?: string,
  limit?: number,
  offset?: number
) => any;

type SearchSelection = {
  playlists?: number | string[] | null;
  albums?: number | string[] | null;
  tracks?: number | string[] | null;
};

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
  private userPlaylists: any[] = [];
  private savedAlbums: any[] = [];
  private searchPlaylists: any[] = [];
  private searchAlbums: any[] = [];
  private searchTracks: any[] = [];
  private searchSelector?: (query: string, types: string[], market?: string, limit?: number, offset?: number) => SearchSelection;
  private searchPostFilter?: (result: any) => any;
  private failMap: Map<string, string> = new Map();

  constructor(searchHandler?: SearchHandler, options?: { recentLimit?: number }) {
    this.seedDefaults();
    this.search = vi.fn(searchHandler ? async (...args: any[]) => searchHandler(...args) : this.defaultSearch);
    this.recentLimit = options?.recentLimit ?? 100;
  }

  // Search API stub (spy-able)
  search: ReturnType<typeof vi.fn>;

  currentUser = {
    profile: async () => ({ id: 'test-user-id' }),
    tracks: {
      savedTracks: vi.fn(async (limit: number = 50, offset: number = 0) => {
        if (this.failMap.has('currentUser.tracks')) {
          throw new Error(this.failMap.get('currentUser.tracks') as string);
        }
        const clampedLimit = Math.min(Math.max(limit, 1), 50);
        const items = this.likedTracks.slice(offset, offset + clampedLimit);
        return {
          items,
          total: this.likedTracks.length
        };
      })
    },
    playlists: {
      playlists: vi.fn(async (limit: number = 50, offset: number = 0) => {
        if (this.failMap.has('currentUser.playlists')) {
          throw new Error(this.failMap.get('currentUser.playlists') as string);
        }
        const clampedLimit = Math.min(Math.max(limit, 1), 50);
        const next = offset + clampedLimit < this.userPlaylists.length ? offset + clampedLimit : null;
        return {
          items: this.userPlaylists.slice(offset, offset + clampedLimit),
          total: this.userPlaylists.length,
          limit: clampedLimit,
          offset,
          next
        };
      })
    },
    albums: {
      savedAlbums: vi.fn(async (limit: number = 50, offset: number = 0) => {
        if (this.failMap.has('currentUser.albums')) {
          throw new Error(this.failMap.get('currentUser.albums') as string);
        }
        const clampedLimit = Math.min(Math.max(limit, 1), 50);
        const next = offset + clampedLimit < this.savedAlbums.length ? offset + clampedLimit : null;
        return {
          items: this.savedAlbums.slice(offset, offset + clampedLimit),
          total: this.savedAlbums.length,
          limit: clampedLimit,
          offset,
          next
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
      if (this.failMap.has('playlists.getPlaylistItems')) {
        throw new Error(this.failMap.get('playlists.getPlaylistItems') as string);
      }
      const clampedLimit = Math.min(Math.max(limit, 1), 50);
      const items = this.playlistTracks.slice(offset, offset + clampedLimit).map(track => ({ track }));
      return {
        items,
        total: this.playlistTracks.length
      };
    }),

    addItemsToPlaylist: async (_playlistId: string, trackUris: string[]) => {
      // Check for failure before adding
      if (this.failMap.has('playlists.addItemsToPlaylist')) {
        throw new Error(this.failMap.get('playlists.addItemsToPlaylist') as string);
      }
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
      if (this.failMap.has('player.getRecentlyPlayedTracks')) {
        throw new Error(this.failMap.get('player.getRecentlyPlayedTracks') as string);
      }
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
    this.failMap.clear();
    this.searchSelector = undefined;
    this.searchPostFilter = undefined;
    this.seedDefaults();
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

  setUserPlaylists(playlists: any[]): void {
    this.userPlaylists = [...playlists];
  }

  setSavedAlbums(albums: any[]): void {
    this.savedAlbums = [...albums];
  }

  setSearchPlaylists(items: any[]): void {
    this.searchPlaylists = [...items];
  }

  setSearchAlbums(items: any[]): void {
    this.searchAlbums = [...items];
  }

  setSearchTracks(items: any[]): void {
    this.searchTracks = [...items];
  }

  setSearchSelector(selector: (query: string, types: string[], market?: string, limit?: number, offset?: number) => SearchSelection): void {
    this.searchSelector = selector;
    this.search = vi.fn(this.defaultSearch);
  }

  setSearchPostFilter(filter: (result: any) => any): void {
    this.searchPostFilter = filter;
  }

  failOn(operation: string, message: string = 'Forced mock failure'): void {
    this.failMap.set(operation, message);
  }

  clearFailures(): void {
    this.failMap.clear();
  }

  getUserPlaylistsSnapshot(): any[] {
    return [...this.userPlaylists];
  }

  getSavedAlbumsSnapshot(): any[] {
    return [...this.savedAlbums];
  }

  getSearchPlaylistsSnapshot(): any[] {
    return [...this.searchPlaylists];
  }

  getSearchAlbumsSnapshot(): any[] {
    return [...this.searchAlbums];
  }

  getSearchTracksSnapshot(): any[] {
    return [...this.searchTracks];
  }

  private seedDefaults(): void {
    this.userPlaylists = Array.from({ length: 12 }, (_, i) => ({
      id: `pl-${i + 1}`,
      name: `Playlist ${i + 1}`,
      description: `Desc ${i + 1}`,
      images: [],
      owner: { display_name: 'user' },
      tracks: { total: 15 + i },
      type: 'playlist'
    }));
    this.savedAlbums = Array.from({ length: 8 }, (_, i) => ({
      added_at: new Date().toISOString(),
      album: {
        id: `album-${i + 1}`,
        name: `Album ${i + 1}`,
        release_date: '2020-01-01',
        images: [],
        artists: [{ name: 'Artist' }],
        type: 'album'
      }
    }));
    this.searchPlaylists = Array.from({ length: 25 }, (_, i) => ({
      id: `spl-${i + 1}`,
      name: `Search Playlist ${i + 1}`,
      description: '',
      images: [],
      owner: { display_name: 'searcher' },
      tracks: { total: 20 + i },
      type: 'playlist'
    }));
    this.searchAlbums = Array.from({ length: 18 }, (_, i) => ({
      id: `sal-${i + 1}`,
      name: `Album search ${i + 1}`,
      release_date: '2020-01-01',
      images: [],
      artists: [{ name: 'Artist' }],
      type: 'album'
    }));
    this.searchTracks = Array.from({ length: 30 }, (_, i) => ({
      id: `st-${i + 1}`,
      name: `Search Track ${i + 1}`,
      artists: [{ name: 'Artist' }],
      album: { name: 'Album' },
      type: 'track'
    }));
  }

  private defaultSearch = async (
    _query: string,
    types: string[],
    _market: string = 'US',
    limit: number = 20,
    offset: number = 0
  ) => {
    if (this.failMap.has('search')) {
      throw new Error(this.failMap.get('search') as string);
    }
    const selection = this.searchSelector?.(_query, types, _market, limit, offset);
    const clampedLimit = Math.min(Math.max(limit, 1), 50);
    const slice = (items: any[]) => ({
      items: items.slice(offset, offset + clampedLimit),
      total: items.length,
      limit: clampedLimit,
      offset,
      next: offset + clampedLimit < items.length ? offset + clampedLimit : null
    });

    const pick = (items: any[], sel?: number | string[] | null) => {
      if (sel == null) {
        return slice(items);
      }
      if (typeof sel === 'number') {
        return slice(items.slice(0, sel));
      }
      const mapped = sel
        .map(id => items.find(it => it.id === id))
        .filter(Boolean);
      return slice(mapped as any[]);
    };

    const result: any = {};
    if (types.includes('playlist')) {
      result.playlists = pick(this.searchPlaylists, selection?.playlists ?? null);
    }
    if (types.includes('album')) {
      result.albums = pick(this.searchAlbums, selection?.albums ?? null);
    }
    if (types.includes('track')) {
      result.tracks = pick(this.searchTracks, selection?.tracks ?? null);
    }
    return this.searchPostFilter ? this.searchPostFilter(result) : result;
  };
}
