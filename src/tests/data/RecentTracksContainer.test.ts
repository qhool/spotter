import { describe, it, expect, beforeEach } from 'vitest';
import { RecentTracksContainer } from '../../data/TrackContainer';
import { MockSpotifySdk } from '../helpers/mockSpotifySdk';

const createTrack = (id: string) => ({
  id,
  name: id,
  artists: [{ name: 'Artist' } as any],
  album: { name: 'Album' } as any,
  duration_ms: 1000,
  explicit: false,
  external_urls: { spotify: '' },
  href: '',
  is_local: false,
  popularity: 0,
  preview_url: null,
  track_number: 1,
  disc_number: 1,
  type: 'track' as const,
  uri: `spotify:track:${id}`,
  is_playable: true,
  external_ids: { upc: '', isrc: '', ean: '' },
  available_markets: [],
  episode: false,
  track: true
});

describe('RecentTracksContainer', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('returns newest tracks first and respects max items', async () => {
    const sdk = new MockSpotifySdk(undefined, { recentLimit: 3 });
    sdk.addRecentTrack(createTrack('t1'), new Date('2023-01-01T00:00:00Z'));
    sdk.addRecentTrack(createTrack('t2'), new Date('2023-01-02T00:00:00Z'));
    sdk.addRecentTrack(createTrack('t3'), new Date('2023-01-03T00:00:00Z'));
    sdk.addRecentTrack(createTrack('t4'), new Date('2023-01-04T00:00:00Z')); // newest

    const container = new RecentTracksContainer(sdk as any, 3);
    const tracks = await container.getAllRawTracks();

    expect(tracks.map((t: any) => t.track.id)).toEqual(['t4', 't3', 't2']);
    expect(container.getLastUpdated()).not.toBeNull();
  });

  it('paginates via before cursor', async () => {
    const sdk = new MockSpotifySdk(undefined, { recentLimit: 5 });
    sdk.addRecentTrack(createTrack('t1'), new Date('2023-01-01T00:00:00Z'));
    sdk.addRecentTrack(createTrack('t2'), new Date('2023-01-02T00:00:00Z'));
    sdk.addRecentTrack(createTrack('t3'), new Date('2023-01-03T00:00:00Z'));

    const container = new RecentTracksContainer(sdk as any, 5);

    const firstPage = await container.getRawTracks(2, 0);
    expect(firstPage.items.map((t: any) => t.track.id)).toEqual(['t3', 't2']);
    expect(firstPage.next).toBe(2);

    const secondPage = await container.getRawTracks(2, firstPage.next as number);
    expect(secondPage.items.map((t: any) => t.track.id)).toEqual(['t1']);
    expect(secondPage.next).toBeNull();
  });
});
