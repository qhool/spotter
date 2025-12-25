import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Track, PlayHistory } from '@spotify/web-api-ts-sdk';
import { TrackContainer, RemixContainer, RecentTracksContainer, PlaylistContainer, AlbumContainer, LikedSongsContainer } from '../../data/TrackContainer';
import { MockSpotifySdk } from '../helpers/mockSpotifySdk';
import * as TrackUtilities from '../../data/TrackUtilities';

// Mock TrackContainer for testing local track resolution
class MockTrackContainer extends TrackContainer<Track> {
  id = 'mock-container';
  name = 'Mock Container';
  description = 'Mock container for testing';
  coverImage = { url: 'http://example.com/image.jpg' };
  type = 'playlist' as const;
  
  private mockTracks: Track[];
  
  constructor(sdk: any, tracks: Track[]) {
    super(sdk);
    this.mockTracks = tracks;
  }
  
  protected _standardizeTrack(rawTrack: Track): Track {
    return rawTrack;
  }
  
  protected async _getTracks(limit: number = 50, offset: number = 0): Promise<any> {
    const start = offset;
    const end = Math.min(start + limit, this.mockTracks.length);
    const items = this.mockTracks.slice(start, end);
    
    return {
      items,
      total: this.mockTracks.length,
      next: end < this.mockTracks.length ? end : null
    };
  }
}

describe('TrackContainer Local Track Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockTrack = (id: string, name: string, isLocal: boolean, uri?: string): Track => ({
    id,
    name,
    artists: [{ name: 'Test Artist' } as any],
    album: { name: 'Test Album' } as any,
    duration_ms: 180000,
    is_local: isLocal,
    uri: uri || (isLocal ? `spotify:local:Test+Artist:Test+Album:${name.replace(/\s/g, '+')}:180` : `spotify:track:${id}`),
    popularity: isLocal ? 0 : 50,
    explicit: false,
    external_urls: { spotify: '' },
    href: '',
    preview_url: null,
    track_number: 1,
    disc_number: 1,
    type: 'track',
    is_playable: true,
    external_ids: { upc: '', isrc: '', ean: '' },
    available_markets: [],
    episode: false,
    track: true
  });

  it('should resolve local tracks when getting tracks', async () => {
    const localTrack = createMockTrack('local1', 'Local Song', true, 'spotify:local:Test+Artist:Test+Album:Local+Song:180');
    const regularTrack = createMockTrack('regular1', 'Regular Song', false);
    const resolvedTrack = createMockTrack('resolved1', 'Local Song', false); // The resolved version
    
    // Mock SDK with search that returns the resolved track
    const mockSdk = new MockSpotifySdk();
    mockSdk.search.mockResolvedValue({
      tracks: {
        items: [resolvedTrack]
      }
    });
    
    const container = new MockTrackContainer(mockSdk, [localTrack, regularTrack]);
    const result = await container.getTracks(10, 0);
    
    expect(result.items).toHaveLength(2);
    // First track should be resolved (not the local track anymore)
    expect(result.items[0].id).toBe('resolved1');
    expect(result.items[0].is_local).toBe(false);
    // Second track should remain unchanged
    expect(result.items[1].id).toBe('regular1');
    
    // Verify search was called for the local track
    expect(mockSdk.search).toHaveBeenCalledWith(
      expect.stringContaining('track:"Local Song"'),
      ['track'],
      'US',
      20
    );
  });

  it('should handle local tracks that cannot be resolved', async () => {
    const localTrack = createMockTrack('local1', 'Unknown Song', true, 'spotify:local:Unknown+Artist:Unknown+Album:Unknown+Song:180');
    
    // Mock SDK with search that returns no results
    const mockSdk = new MockSpotifySdk(() =>
      Promise.resolve({
        tracks: {
          items: []
        }
      })
    );
    
    const container = new MockTrackContainer(mockSdk, [localTrack]);
    const result = await container.getTracks(10, 0);
    
    expect(result.items).toHaveLength(1);
    // Should still return the local track when resolution fails
    expect(result.items[0].id).toBe('local1');
    expect(result.items[0].is_local).toBe(true);
  });

  it('should cache resolved tracks and not resolve them again', async () => {
    const localTrack = createMockTrack('local1', 'Local Song', true, 'spotify:local:Test+Artist:Test+Album:Local+Song:180');
    const resolvedTrack = createMockTrack('resolved1', 'Local Song', false);
    
    console.log("Starting test for caching resolved tracks");
    const mockSdk = new MockSpotifySdk();
    mockSdk.search.mockResolvedValue({
      tracks: {
        items: [resolvedTrack]
      }
    });

    expect(mockSdk.search).toHaveBeenCalledTimes(0);
    
    const container = new MockTrackContainer(mockSdk, [localTrack]);
    
    // First call should trigger resolution
    const result1 = await container.getTracks(10, 0);
    expect(result1.items[0].id).toBe('resolved1');
    expect(mockSdk.search).toHaveBeenCalledTimes(1);
    
    // Second call should use cached result
    const result2 = await container.getTracks(10, 0);
    expect(result2.items[0].id).toBe('resolved1');
    expect(mockSdk.search).toHaveBeenCalledTimes(1); // Should not be called again
  });

  it('falls back to raw track when local resolution rejects or returns null', async () => {
    const localTrack = createMockTrack('local1', 'Local Song', true, 'spotify:local:Test+Artist:Test+Album:Local+Song:180');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const resolveSpy = vi.spyOn(TrackUtilities, 'resolveLocalTrack')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(null);

    const container = new MockTrackContainer(new MockSpotifySdk() as any, [localTrack]);

    const first = await container.getTracks(1, 0);
    expect(first.items[0].id).toBe('local1');
    expect(warnSpy).toHaveBeenCalled();

    const second = await container.getTracks(1, 0);
    expect(second.items[0].id).toBe('local1');
    expect(resolveSpy).toHaveBeenCalledTimes(1);
  });

  it('should work with getAllTracks', async () => {
    const localTrack1 = createMockTrack('local1', 'Local Song 1', true, 'spotify:local:Test+Artist:Test+Album:Local+Song+1:180');
    const localTrack2 = createMockTrack('local2', 'Local Song 2', true, 'spotify:local:Test+Artist:Test+Album:Local+Song+2:180');
    const resolvedTrack1 = createMockTrack('resolved1', 'Local Song 1', false);
    const resolvedTrack2 = createMockTrack('resolved2', 'Local Song 2', false);
    
    const mockSdk = new MockSpotifySdk();
    mockSdk.search
      .mockResolvedValueOnce({
        tracks: { items: [resolvedTrack1] }
      })
      .mockResolvedValueOnce({
        tracks: { items: [resolvedTrack2] }
      });
    
    const container = new MockTrackContainer(mockSdk, [localTrack1, localTrack2]);
    const result = await container.getAllTracks();
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('resolved1');
    expect(result[1].id).toBe('resolved2');
    expect(mockSdk.search).toHaveBeenCalledTimes(2);
  });

  it('paginates getTracks correctly when offset is non-zero', async () => {
    const trackA = createMockTrack('trackA', 'Track A', false);
    const trackB = createMockTrack('trackB', 'Track B', false);
    const trackC = createMockTrack('trackC', 'Track C', false);

    const mockSdk = new MockSpotifySdk();
    const container = new MockTrackContainer(mockSdk, [trackA, trackB, trackC]);

    const result = await container.getTracks(1, 1);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('trackB');
    expect(result.total).toBe(3);
    expect(result.next).toBe(2);
  });

  it('returns tail slice when offset is near the end', async () => {
    const tracks = [
      createMockTrack('trackA', 'Track A', false),
      createMockTrack('trackB', 'Track B', false),
      createMockTrack('trackC', 'Track C', false)
    ];

    const container = new MockTrackContainer(new MockSpotifySdk() as any, tracks);
    const result = await container.getTracks(5, 2);

    expect(result.items.map(t => t.id)).toEqual(['trackC']);
    expect(result.total).toBe(3);
    expect(result.next).toBe(null);
  });

  it('paginates across multiple calls while preserving cache and totals', async () => {
    const tracks = [
      createMockTrack('trackA', 'Track A', false),
      createMockTrack('trackB', 'Track B', false),
      createMockTrack('trackC', 'Track C', false),
      createMockTrack('trackD', 'Track D', false)
    ];

    const container = new MockTrackContainer(new MockSpotifySdk() as any, tracks);

    const firstPage = await container.getTracks(2, 0);
    expect(firstPage.items.map(t => t.id)).toEqual(['trackA', 'trackB']);
    expect(firstPage.total).toBe(4);
    expect(firstPage.next).toBe(2);

    const secondPage = await container.getTracks(2, 2);
    expect(secondPage.items.map(t => t.id)).toEqual(['trackC', 'trackD']);
    expect(secondPage.total).toBe(4);
    expect(secondPage.next).toBe(null);
  });

  it('handles limit -1 via getTracks', async () => {
    const tracks = [
      createMockTrack('trackA', 'Track A', false),
      createMockTrack('trackB', 'Track B', false)
    ];

    const container = new MockTrackContainer(new MockSpotifySdk() as any, tracks);
    const result = await container.getTracks(-1, 0);

    expect(result.items.map(t => t.id)).toEqual(['trackA', 'trackB']);
    expect(result.total).toBe(2);
    expect(result.next).toBe(null);
  });

  it('returns empty slice when offset exceeds fetched tracks', async () => {
    const tracks = [createMockTrack('trackA', 'Track A', false)];
    const container = new MockTrackContainer(new MockSpotifySdk() as any, tracks);

    const result = await container.getTracks(2, 5);
    expect(result.items).toEqual([]);
    expect(result.next).toBeNull();
    expect(result.total).toBe(1);
  });
});

describe('TrackContainer pagination and caching internals', () => {
  it('stops filling cache when next is null and supports limit -1', async () => {
    const tracks = [
      { id: 't1', type: 'track', is_local: false } as Track,
      { id: 't2', type: 'track', is_local: false } as Track
    ];
    const getTracksSpy = vi.fn()
      .mockResolvedValueOnce({ items: [tracks[0]], total: 2, next: 1 })
      .mockResolvedValueOnce({ items: [tracks[1]], total: 2, next: null });

    class StubContainer extends TrackContainer<Track> {
      id = 'stub';
      name = 'stub';
      type: 'playlist' = 'playlist';
      description = '';
      coverImage = { url: '' };
      protected _standardizeTrack(raw: Track) { return raw; }
      protected async _getTracks(limit?: number, offset?: number) {
        return getTracksSpy(limit, offset);
      }
    }

    const container = new StubContainer(new MockSpotifySdk() as any);
    const all = await container.getAllTracks();
    expect(all.map(t => t.id)).toEqual(['t1', 't2']);
    expect(getTracksSpy).toHaveBeenCalledTimes(2);
  });
});

describe('PlaylistContainer', () => {
  const basePlaylist = {
    id: 'plist',
    name: 'My Playlist',
    description: 'desc',
    images: [{ url: 'img' }]
  } as any;

  it('standardizes only track items and rejects episodes', () => {
    const sdk = new MockSpotifySdk() as any;
    const container = new PlaylistContainer(sdk, basePlaylist);
    const trackItem = { track: { id: 't1', type: 'track', is_local: false } } as any;
    expect((container as any)._standardizeTrack(trackItem)).toEqual(trackItem.track);
    const episodeItem = { track: { id: 'e1', type: 'episode' } } as any;
    expect(() => (container as any)._standardizeTrack(episodeItem)).toThrow(/Unsupported track type/);
  });

  it('clamps limits, paginates with next offset, and respects offset', async () => {
    const sdk = new MockSpotifySdk() as any;
    sdk.setExistingTracks([
      { id: 't1', type: 'track', is_local: false } as Track,
      { id: 't2', type: 'track', is_local: false } as Track,
      { id: 't3', type: 'track', is_local: false } as Track
    ]);

    const container = new PlaylistContainer(sdk as any, basePlaylist);

    const first = await (container as any)._getTracks(999, 0);
    expect(first.items.map((i: any) => i.track.id)).toEqual(['t1', 't2', 't3']);
    expect(first.next).toBeNull();
    expect((sdk.playlists.getPlaylistItems as any)).toHaveBeenCalledWith('plist', 'US', undefined, 50, 0);

    const second = await (container as any)._getTracks(0, 2);
    expect(second.items.map((i: any) => i.track.id)).toEqual(['t3']);
    expect(second.next).toBeNull();
    expect((sdk.playlists.getPlaylistItems as any)).toHaveBeenCalledWith('plist', 'US', undefined, 1, 2);
  });
});

describe('AlbumContainer', () => {
  const album = {
    id: 'alb1',
    name: 'Album Name',
    artists: [{ name: 'Artist' }],
    release_date: '2020-01-01',
    images: [{ url: 'img' }]
  } as any;

  const simplifiedTrack = (id: string) =>
    ({
      id,
      name: `T-${id}`,
      type: 'track',
      artists: [{ name: 'Artist' }],
      duration_ms: 1000,
      explicit: false,
      external_urls: { spotify: '' },
      href: '',
      is_playable: true,
      preview_url: null,
      track_number: 1,
      disc_number: 1,
      available_markets: []
    }) as any;

  it('standardizes simplified track with album info and defaults', () => {
    const sdk = new MockSpotifySdk() as any;
    const container = new AlbumContainer(sdk as any, album);
    const standardized = (container as any)._standardizeTrack(simplifiedTrack('t1'));
    expect(standardized.album).toEqual(album);
    expect(standardized.type).toBe('track');
    expect(standardized.external_ids).toEqual({});
    expect(standardized.popularity).toBe(0);
  });

  it('clamps limits and paginates album tracks', async () => {
    const sdk = new MockSpotifySdk() as any;
    sdk.setAlbumTracks('alb1', [simplifiedTrack('t1'), simplifiedTrack('t2')]);
    const container = new AlbumContainer(sdk as any, album);

    const first = await (container as any)._getTracks(999, 0);
    expect(first.items.map((t: any) => t.id)).toEqual(['t1', 't2']);
    expect(first.next).toBeNull();
    expect((sdk.albums.tracks as any)).toHaveBeenCalledWith('alb1', 'US', 50, 0);

    const second = await (container as any)._getTracks(0, 1);
    expect(second.items.map((t: any) => t.id)).toEqual(['t2']);
    expect(second.next).toBeNull();
    expect((sdk.albums.tracks as any)).toHaveBeenCalledWith('alb1', 'US', 1, 1);
  });
});

describe('LikedSongsContainer', () => {
  const saved = (id: string) =>
    ({
      added_at: '2023-01-01T00:00:00Z',
      track: { id, type: 'track', is_local: false, uri: `spotify:track:${id}` } as Track
    });

  it('standardizes saved tracks directly', () => {
    const container = new LikedSongsContainer(new MockSpotifySdk() as any);
    const track = { id: 't1', type: 'track', is_local: false } as Track;
    expect((container as any)._standardizeTrack({ track } as any)).toBe(track);
  });

  it('clamps limits and paginates saved tracks', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setLikedTracks([saved('t1') as any, saved('t2') as any, saved('t3') as any]);

    const container = new LikedSongsContainer(sdk as any);
    const first = await (container as any)._getTracks(999, 0);
    expect(first.items.map((i: any) => i.track.id)).toEqual(['t1', 't2', 't3']);
    expect(first.next).toBeNull();
    expect((sdk.currentUser.tracks.savedTracks as any)).toHaveBeenCalledWith(50, 0);

    const second = await (container as any)._getTracks(0, 1);
    expect(second.items.map((i: any) => i.track.id)).toEqual(['t2']);
    expect(second.next).toBe(2);
    expect((sdk.currentUser.tracks.savedTracks as any)).toHaveBeenCalledWith(1, 1);
  });
});

describe('RemixContainer', () => {
  const baseTrack = (id: string): Track =>
    ({ id, type: 'track', is_local: false, uri: `spotify:track:${id}` } as Track);

  class SimpleContainer extends TrackContainer<Track> {
    id = 'simple';
    name = 'simple';
    type: 'playlist' = 'playlist';
    description = '';
    coverImage = { url: '' };
    constructor(private provided: Track[]) { super(new MockSpotifySdk() as any); }
    protected _standardizeTrack(raw: Track) { return raw; }
    protected async _getTracks(): Promise<any> { throw new Error('unused'); }
    async getAllTracks() { return this.provided; }
  }

  it('paginates remixed tracks without re-running remix function', async () => {
    const inputs = new SimpleContainer([baseTrack('a'), baseTrack('b')]);
    const remixFn = vi.fn().mockReturnValue([baseTrack('a'), baseTrack('b'), baseTrack('c')]);
    const remix = new RemixContainer(new MockSpotifySdk() as any, [[inputs, {}]], remixFn);

    const first = await remix.getTracks(2, 0);
    expect(first.items.map(t => t.id)).toEqual(['a', 'b']);
    expect(first.next).toBe(2);

    const second = await remix.getTracks(2, 2);
    expect(second.items.map(t => t.id)).toEqual(['c']);
    expect(remixFn).toHaveBeenCalledTimes(1);
  });

  it('handles concurrent load and honors clearRemixCache', async () => {
    let resolve: ((value: Track[]) => void) | undefined;
    const slowContainer = new SimpleContainer([baseTrack('x')]);
    vi.spyOn(slowContainer, 'getAllTracks').mockImplementation(
      () => new Promise(res => { resolve = res; })
    );

    const remixFn = vi.fn().mockReturnValue([baseTrack('x')]);
    const remix = new RemixContainer(new MockSpotifySdk() as any, [[slowContainer, {}]], remixFn);

    const p1 = remix.getAllTracks(); // kicks off load
    const p2 = remix.getAllTracks(); // should wait on first
    resolve!([baseTrack('x')]);
    await Promise.all([p1, p2]);
    expect(remixFn).toHaveBeenCalledTimes(1);

    vi.spyOn(slowContainer, 'getAllTracks').mockResolvedValue([baseTrack('y')]);
    remix.clearRemixCache();
    await remix.getAllTracks();
    expect(remixFn).toHaveBeenCalledTimes(2);
  });

  it('standardizes remixed track identity and _getTracks throws', async () => {
    const remix = new RemixContainer(new MockSpotifySdk() as any, [], (inputs: any) => inputs as any);
    expect((remix as any)._standardizeTrack(baseTrack('z'))).toEqual(baseTrack('z'));
    await expect((remix as any)._getTracks()).rejects.toThrow(/not implemented/);
  });
});

describe('RecentTracksContainer', () => {
  const mkHistory = (id: string, played_at = '2023-01-01T00:00:00Z'): PlayHistory =>
    ({
      track: { id, type: 'track', is_local: false } as Track,
      played_at,
      context: { uri: 'ctx' } as any
    });

  const mockSdk = () => ({
    player: {
      getRecentlyPlayedTracks: vi.fn()
    }
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('boots from localStorage and handles malformed cache safely', () => {
    localStorage.setItem('spotter-recent-tracks-cache', JSON.stringify({
      tracks: [mkHistory('a')],
      updatedAt: '2023-02-01T00:00:00Z'
    }));
    // Malformed entry should be ignored without throwing
    localStorage.setItem('spotter-recent-tracks-cache', 'not-json');

    expect(() => new RecentTracksContainer(mockSdk() as any)).not.toThrow();
  });

  it('merges fetched tracks and returns local cursor when match found', () => {
    const container = new RecentTracksContainer(mockSdk() as any, 5);
    (container as any)._storedTracks = [mkHistory('a', '2023-01-01T00:00:00Z'), mkHistory('b', '2023-01-02T00:00:00Z')];

    const { items, nextCursor } = (container as any)._mergeFetchedTracks([
      mkHistory('c', '2023-01-03T00:00:00Z'),
      mkHistory('b', '2023-01-02T00:00:00Z')
    ]);
    expect(items.map((t: PlayHistory) => t.track.id)).toEqual(['c']);
    expect(nextCursor).toBe('local:2');
    expect((container as any)._storedTracks.length).toBe(3);
  });

  it('uses stored slice when given local cursor', async () => {
    const sdk = mockSdk();
    const container = new RecentTracksContainer(sdk as any, 5);
    (container as any)._storedTracks = [mkHistory('a'), mkHistory('b'), mkHistory('c')];
    const slice = await (container as any)._getTracks(2, 'local:1');
    expect(slice.items.map((t: PlayHistory) => t.track.id)).toEqual(['b', 'c']);
    expect(slice.next).toBeNull();
  });

  it('trims stored tracks to max and returns local cursor when fetched empty', () => {
    const sdk = mockSdk();
    const container = new RecentTracksContainer(sdk as any, 2);
    (container as any)._storedTracks = [mkHistory('a'), mkHistory('b'), mkHistory('c')];
    (container as any)._trimStoredTracks();
    expect((container as any)._storedTracks.length).toBe(2);

    const { items, nextCursor } = (container as any)._mergeFetchedTracks([]);
    expect(items).toEqual([]);
    expect(nextCursor).toBe('local:0');
  });
});
