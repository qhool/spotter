import { describe, it, expect, vi } from 'vitest';
import { Track } from '@spotify/web-api-ts-sdk';
import { TrackContainer } from '../data/TrackContainer';
import { MockSpotifySdk } from './helpers/mockSpotifySdk';

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

    const container = new MockTrackContainer(new MockSpotifySdk(), tracks);
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

    const container = new MockTrackContainer(new MockSpotifySdk(), tracks);

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

    const container = new MockTrackContainer(new MockSpotifySdk(), tracks);
    const result = await container.getTracks(-1, 0);

    expect(result.items.map(t => t.id)).toEqual(['trackA', 'trackB']);
    expect(result.total).toBe(2);
    expect(result.next).toBe(null);
  });
});
